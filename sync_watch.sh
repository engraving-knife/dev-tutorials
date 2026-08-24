#!/bin/bash

# ==============================================================================
# 文件夹监控同步脚本 (macOS)
# 功能：监控本地文件夹变更，通过 rsync + SSH 实时同步到远程云服务器
# 依赖：fswatch, rsync (macOS自带rsync版本较旧，建议brew install rsync)
# ==============================================================================

set -o pipefail

# ========================== 版本 & 基础配置 ==========================
SCRIPT_VERSION="1.0.0"
SCRIPT_NAME="$(basename "$0")"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ========================== 默认配置（可被配置文件覆盖） ==========================
# 本地待监控文件夹（绝对路径）
LOCAL_DIR=""

# 远程服务器 SSH 登录信息
REMOTE_USER=""          # 例如：root
REMOTE_HOST=""          # 例如：192.168.1.100 或 example.com
REMOTE_PORT="22"        # SSH 端口，默认22
REMOTE_DIR=""           # 远程目标文件夹（绝对路径），例如：/data/app

# SSH 私钥路径（留空则使用默认）
SSH_KEY=""

# 排除规则（rsync --exclude 格式，多个用空格分隔）
EXCLUDE_PATTERNS=(
    ".DS_Store"
    ".git/"
    "node_modules/"
    "__pycache__/"
    "*.tmp"
    "*.swp"
    ".idea/"
    ".vscode/"
)

# 同步选项
SYNC_DELETE="false"     # 是否删除远程存在但本地已删除的文件（谨慎开启）
SYNC_COMPRESS="true"    # 是否启用传输压缩
SYNC_VERBOSE="false"    # 是否输出rsync详细日志

# 监控与去抖配置
DEBOUNCE_SECONDS="2"    # 去抖时间：变更发生后等待N秒再同步（期间的变更合并）
MAX_WAIT_SECONDS="10"   # 最大等待时间：即使持续有变更也强制同步的间隔
FSEVENTS_LATENCY="0.5"  # fswatch 底层 FSEvents 延迟（秒）

# 启动行为
FULL_SYNC_ON_START="true"   # 启动时先做一次全量同步

# 日志配置
LOG_FILE=""             # 日志文件路径，留空输出到stdout
LOG_LEVEL="INFO"        # DEBUG / INFO / WARN / ERROR

# 网络重试
RETRY_COUNT="3"         # 同步失败重试次数
RETRY_INTERVAL="5"      # 重试间隔（秒）

# ========================== 全局状态变量 ==========================
PID_DIR=""
PID_FILE=""
SYNC_PID_FILE=""
LOG_FD=1                # 默认stdout
DEBOUNCE_TIMER_PID=""
LAST_CHANGE_TIME=0
RUNNING=true
SYNC_IN_PROGRESS=false

# ========================== 日志函数 ==========================
_log() {
    local level="$1"; shift
    local timestamp
    timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
    local level_upper="$(printf '%s' "$level" | tr '[:lower:]' '[:upper:]')"

    # 日志级别过滤
    local level_value=0
    case "$level_upper" in
        DEBUG) level_value=1 ;;
        INFO)  level_value=2 ;;
        WARN)  level_value=3 ;;
        ERROR) level_value=4 ;;
    esac
    local min_value=2
    case "$(printf '%s' "$LOG_LEVEL" | tr '[:lower:]' '[:upper:]')" in
        DEBUG) min_value=1 ;;
        INFO)  min_value=2 ;;
        WARN)  min_value=3 ;;
        ERROR) min_value=4 ;;
    esac
    if [ "$level_value" -lt "$min_value" ]; then
        return
    fi

    local message="[$timestamp] [$level_upper] $*"
    if [ -n "$LOG_FILE" ]; then
        echo "$message" >&$LOG_FD
    else
        case "$level_upper" in
            ERROR) echo -e "\033[31m$message\033[0m" >&2 ;;
            WARN)  echo -e "\033[33m$message\033[0m" >&2 ;;
            INFO)  echo -e "\033[32m$message\033[0m" ;;
            DEBUG) echo -e "\033[36m$message\033[0m" ;;
            *)     echo "$message" ;;
        esac
    fi
}

log_debug() { _log DEBUG "$@"; }
log_info()  { _log INFO  "$@"; }
log_warn()  { _log WARN  "$@"; }
log_error() { _log ERROR "$@"; }

# ========================== 工具函数 ==========================
usage() {
    cat <<EOF
用法: $SCRIPT_NAME [选项]

文件夹监控同步脚本 - 实时监控本地文件夹并同步到远程服务器

选项:
  -c, --config <file>     指定配置文件路径 (默认: 同目录下 sync_watch.conf)
  -s, --start             以前台方式启动（默认行为）
  -d, --daemon            以后台守护进程方式启动
  -k, --stop              停止正在运行的守护进程
  -r, --restart           重启守护进程
  -t, --status            查看运行状态
      --sync-now          触发一次立即同步（不启动监控）
      --install-service   安装为 launchd 开机自启服务
      --uninstall-service 卸载 launchd 自启服务
  -h, --help              显示帮助信息
  -V, --version           显示版本信息

示例:
  $SCRIPT_NAME                               # 前台启动，使用默认配置文件
  $SCRIPT_NAME -c /path/to/my.conf -d        # 后台启动，使用自定义配置
  $SCRIPT_NAME --sync-now                    # 立即执行一次全量同步
  $SCRIPT_NAME --install-service             # 安装开机自启
EOF
}

version() {
    echo "$SCRIPT_NAME v$SCRIPT_VERSION"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        return 1
    fi
    return 0
}

# 初始化依赖检查
# 参数 $1: 检查级别 - "sync"（仅需 rsync+ssh）或 "monitor"（全部依赖，含 fswatch）
check_dependencies() {
    local level="${1:-monitor}"
    local missing=()
    if [ "$level" = "monitor" ]; then
        if ! check_command fswatch; then
            missing+=("fswatch (安装: brew install fswatch)")
        fi
    fi
    if ! check_command rsync; then
        missing+=("rsync (安装: brew install rsync)")
    fi
    if ! check_command ssh; then
        missing+=("ssh (macOS 自带，如缺失请安装 OpenSSH)")
    fi
    if [ ${#missing[@]} -gt 0 ]; then
        log_error "缺少以下依赖工具："
        for tool in "${missing[@]}"; do
            log_error "  - $tool"
        done
        exit 1
    fi
    log_debug "依赖检查通过 (级别: $level)"
}

# 加载配置文件
load_config() {
    local config_file="$1"

    if [ -z "$config_file" ]; then
        config_file="${SCRIPT_DIR}/sync_watch.conf"
    fi

    if [ ! -f "$config_file" ]; then
        log_warn "未找到配置文件: $config_file，使用命令行参数或默认值"
        return 0
    fi

    log_info "加载配置文件: $config_file"

    # 用安全方式加载配置（不直接source，避免恶意代码）
    while IFS= read -r line || [ -n "$line" ]; do
        # 去掉前后空白
        line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
        # 跳过空行和注释
        [[ -z "$line" || "$line" == \#* ]] && continue

        local key="${line%%=*}"
        local value="${line#*=}"
        # 去掉key两端空白
        key="$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
        # 去掉value两端空白和引号
        value="$(echo "$value" | sed 's/^[[:space:]]*["'\'']\{0,1\}//;s/["'\'']\{0,1\}[[:space:]]*$//')"

        case "$key" in
            LOCAL_DIR)         LOCAL_DIR="$value" ;;
            REMOTE_USER)       REMOTE_USER="$value" ;;
            REMOTE_HOST)       REMOTE_HOST="$value" ;;
            REMOTE_PORT)       REMOTE_PORT="$value" ;;
            REMOTE_DIR)        REMOTE_DIR="$value" ;;
            SSH_KEY)           SSH_KEY="$value" ;;
            SYNC_DELETE)       SYNC_DELETE="$value" ;;
            SYNC_COMPRESS)     SYNC_COMPRESS="$value" ;;
            SYNC_VERBOSE)      SYNC_VERBOSE="$value" ;;
            DEBOUNCE_SECONDS)  DEBOUNCE_SECONDS="$value" ;;
            MAX_WAIT_SECONDS)  MAX_WAIT_SECONDS="$value" ;;
            FSEVENTS_LATENCY)  FSEVENTS_LATENCY="$value" ;;
            FULL_SYNC_ON_START)FULL_SYNC_ON_START="$value" ;;
            LOG_FILE)          LOG_FILE="$value" ;;
            LOG_LEVEL)         LOG_LEVEL="$value" ;;
            RETRY_COUNT)       RETRY_COUNT="$value" ;;
            RETRY_INTERVAL)    RETRY_INTERVAL="$value" ;;
            PID_DIR)           PID_DIR="$value" ;;
            EXCLUDE_PATTERNS)
                # 处理数组形式：支持空格分隔或逗号分隔
                value="$(echo "$value" | tr ',' ' ')"
                EXCLUDE_PATTERNS=($value)
                ;;
            *)
                log_warn "忽略未知配置项: $key"
                ;;
        esac
    done < "$config_file"
}

# 验证配置有效性
validate_config() {
    local errors=()
    if [ -z "$LOCAL_DIR" ]; then
        errors+=("LOCAL_DIR 未配置（本地待监控文件夹路径）")
    elif [ ! -d "$LOCAL_DIR" ]; then
        errors+=("LOCAL_DIR 不存在: $LOCAL_DIR")
    fi

    if [ -z "$REMOTE_HOST" ]; then
        errors+=("REMOTE_HOST 未配置（远程服务器地址）")
    fi
    if [ -z "$REMOTE_DIR" ]; then
        errors+=("REMOTE_DIR 未配置（远程目标文件夹路径）")
    fi

    # 转换为绝对路径
    if [ -n "$LOCAL_DIR" ] && [ -d "$LOCAL_DIR" ]; then
        LOCAL_DIR="$(cd "$LOCAL_DIR" && pwd)"
        # 确保以 / 结尾，便于 rsync 同步内容而非目录本身
        [[ "$LOCAL_DIR" != */ ]] && LOCAL_DIR="${LOCAL_DIR}/"
    fi

    # 确保远程目录格式
    if [ -n "$REMOTE_DIR" ]; then
        [[ "$REMOTE_DIR" != */ ]] && REMOTE_DIR="${REMOTE_DIR}/"
    fi

    if [ ${#errors[@]} -gt 0 ]; then
        log_error "配置错误："
        for e in "${errors[@]}"; do
            log_error "  - $e"
        done
        log_error "请通过配置文件或修改脚本顶部默认值进行配置。"
        exit 1
    fi

    log_info "配置验证通过"
    log_info "  本地目录: $LOCAL_DIR"
    log_info "  远程目标: ${REMOTE_USER:+$REMOTE_USER@}${REMOTE_HOST}:${REMOTE_DIR} (端口: $REMOTE_PORT)"
}

# 初始化日志文件
init_log_file() {
    if [ -n "$LOG_FILE" ]; then
        local log_dir
        log_dir="$(dirname "$LOG_FILE")"
        if [ ! -d "$log_dir" ]; then
            mkdir -p "$log_dir" 2>/dev/null || {
                echo "无法创建日志目录: $log_dir" >&2
                LOG_FILE=""
                return
            }
        fi
        # 打开日志文件FD
        exec {LOG_FD}>>"$LOG_FILE" 2>/dev/null || {
            echo "无法写入日志文件: $LOG_FILE" >&2
            LOG_FILE=""
            LOG_FD=1
            return
        }
        log_info "日志已写入: $LOG_FILE"
    fi
}

# 初始化 PID 目录
init_pid_dir() {
    # 默认 PID 目录
    if [ -z "$PID_DIR" ]; then
        PID_DIR="${SCRIPT_DIR}/.sync_watch_pids"
    fi
    mkdir -p "$PID_DIR" 2>/dev/null || {
        log_error "无法创建 PID 目录: $PID_DIR"
        exit 1
    }
    PID_FILE="${PID_DIR}/monitor.pid"
    SYNC_PID_FILE="${PID_DIR}/sync.pid"
    log_debug "PID 目录: $PID_DIR"
}

# 检查是否已有实例在运行
check_running() {
    if [ -f "$PID_FILE" ]; then
        local old_pid
        old_pid="$(cat "$PID_FILE" 2>/dev/null)"
        if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
            return 0  # 正在运行
        fi
        # PID 文件无效，清理
        rm -f "$PID_FILE"
    fi
    return 1
}

# 写入当前 PID
write_pid() {
    echo $$ > "$PID_FILE"
}

# 清理 PID 文件
cleanup_pid() {
    rm -f "$PID_FILE"
    # 杀掉去抖计时器
    if [ -n "$DEBOUNCE_TIMER_PID" ] && kill -0 "$DEBOUNCE_TIMER_PID" 2>/dev/null; then
        kill "$DEBOUNCE_TIMER_PID" 2>/dev/null
    fi
}

# ========================== 同步核心逻辑 ==========================

# 构建 rsync 命令参数
build_rsync_args() {
    local args=()

    # 基础参数：归档模式 + 保留权限/时间 + 部分传输（断点续传）
    args+=("-a" "--partial")

    # 输出模式
    if [ "$SYNC_VERBOSE" = "true" ]; then
        args+=("-v" "--progress")
    else
        args+=("--itemize-changes")
    fi

    # 压缩
    if [ "$SYNC_COMPRESS" = "true" ]; then
        args+=("-z")
    fi

    # 删除远程多余文件（需谨慎）
    if [ "$SYNC_DELETE" = "true" ]; then
        args+=("--delete" "--delete-excluded")
    fi

    # SSH 选项
    local ssh_opts="-p $REMOTE_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -o ServerAliveInterval=30"
    if [ -n "$SSH_KEY" ] && [ -f "$SSH_KEY" ]; then
        ssh_opts="$ssh_opts -i $SSH_KEY"
    fi
    args+=("-e" "ssh $ssh_opts")

    # 排除规则
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        [ -n "$pattern" ] && args+=("--exclude=$pattern")
    done

    # 源与目标
    args+=("$LOCAL_DIR")
    if [ -n "$REMOTE_USER" ]; then
        args+=("${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}")
    else
        args+=("${REMOTE_HOST}:${REMOTE_DIR}")
    fi

    echo "${args[@]}"
}

# 执行同步（带重试）
do_sync() {
    local trigger_reason="${1:-manual}"

    # 防止并发同步
    if [ "$SYNC_IN_PROGRESS" = "true" ]; then
        log_info "已有同步任务在执行，跳过本次触发 ($trigger_reason)"
        return 0
    fi
    SYNC_IN_PROGRESS=true

    # 记录同步 PID 便于识别
    echo $$ > "$SYNC_PID_FILE"

    local rsync_args
    rsync_args="$(build_rsync_args)"

    log_info "========== 开始同步 [触发: $trigger_reason] =========="
    log_debug "rsync 参数: rsync $rsync_args"

    local attempt=0
    local success=false

    while [ $attempt -lt "$RETRY_COUNT" ]; do
        attempt=$((attempt + 1))

        # 执行 rsync
        local sync_output
        local sync_exit=0
        sync_output="$(eval rsync $rsync_args 2>&1)"
        sync_exit=$?

        if [ $sync_exit -eq 0 ]; then
            success=true
            if [ "$SYNC_VERBOSE" = "true" ] || [ "$LOG_LEVEL" = "DEBUG" ]; then
                log_debug "rsync 输出:\n$sync_output"
            else
                # 只统计变更条目数
                local changed_count
                changed_count="$(echo "$sync_output" | grep -cv '^\s*$' || true)"
                if [ "$changed_count" -gt 0 ]; then
                    log_info "变更统计: $changed_count 条"
                    # 非调试模式下，输出最后几行关键变更
                    if [ "$changed_count" -le 20 ]; then
                        echo "$sync_output" | while IFS= read -r ln; do
                            [ -n "$ln" ] && log_debug "  $ln"
                        done
                    else
                        log_info "  (变更条目较多，启用 --verbose 或 LOG_LEVEL=DEBUG 查看详情)"
                    fi
                else
                    log_info "无文件变更"
                fi
            fi
            log_info "========== 同步成功 (第 $attempt 次尝试) =========="
            break
        else
            log_warn "第 $attempt 次同步失败 (退出码: $sync_exit):"
            echo "$sync_output" | tail -n 20 | while IFS= read -r ln; do
                log_warn "  $ln"
            done
            if [ $attempt -lt "$RETRY_COUNT" ]; then
                log_info "等待 $RETRY_INTERVAL 秒后重试..."
                sleep "$RETRY_INTERVAL"
            fi
        fi
    done

    if [ "$success" = "false" ]; then
        log_error "========== 同步失败 (已重试 $RETRY_COUNT 次) =========="
    fi

    SYNC_IN_PROGRESS=false
    rm -f "$SYNC_PID_FILE"
    return $([ "$success" = "true" ] && echo 0 || echo 1)
}

# ========================== 监控 & 去抖逻辑 ==========================

# 去抖计时器：到时间后强制同步
run_debounce_timer() {
    local wait_seconds="$1"
    sleep "$wait_seconds"
    # 写标记文件通知父进程
    echo "timeout" > "${PID_DIR}/.debounce_trigger"
}

# 触发调度：记录变更时间，启动去抖计时器
schedule_sync() {
    local event_path="$1"
    local now
    now="$(date +%s)"
    LAST_CHANGE_TIME="$now"

    # 如果已经有计时器在跑，先杀掉
    if [ -n "$DEBOUNCE_TIMER_PID" ] && kill -0 "$DEBOUNCE_TIMER_PID" 2>/dev/null; then
        kill "$DEBOUNCE_TIMER_PID" 2>/dev/null
        wait "$DEBOUNCE_TIMER_PID" 2>/dev/null
    fi

    log_debug "检测到变更: $event_path，等待 ${DEBOUNCE_SECONDS}s 去抖..."

    # 清理旧触发标记
    rm -f "${PID_DIR}/.debounce_trigger"

    # 启动去抖计时器（后台）
    run_debounce_timer "$DEBOUNCE_SECONDS" &
    DEBOUNCE_TIMER_PID=$!
}

# 主监控循环
run_monitor() {
    log_info "启动文件监控... (按 Ctrl+C 停止)"

    # 构建 fswatch 参数
    local fswatch_args=(
        "--recursive"
        "--latency=${FSEVENTS_LATENCY}"
        "--event-flags"
        "--format=%f\t%p"
    )

    # 排除规则（转换为 fswatch 格式）
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        [ -n "$pattern" ] && fswatch_args+=("--exclude=${pattern}")
    done

    fswatch_args+=("$LOCAL_DIR")

    log_debug "fswatch 参数: ${fswatch_args[*]}"

    # 启动 fswatch，逐行读取事件
    local last_forced_sync=0
    local events_since_sync=0

    fswatch "${fswatch_args[@]}" 2>/dev/null | while IFS=$'\t' read -r flags path; do
        [ -z "$path" ] && continue

        # 记录变更
        events_since_sync=$((events_since_sync + 1))
        schedule_sync "$path ($flags)"

        # 检查去抖计时器是否触发
        if [ -f "${PID_DIR}/.debounce_trigger" ]; then
            rm -f "${PID_DIR}/.debounce_trigger"
            do_sync "debounce"
            events_since_sync=0
            last_forced_sync="$(date +%s)"
        fi

        # 强制同步保护：即使持续有变更，达到 MAX_WAIT_SECONDS 也同步一次
        local now_sec
        now_sec="$(date +%s)"
        if [ $events_since_sync -gt 0 ] && [ $((now_sec - last_forced_sync)) -ge "$MAX_WAIT_SECONDS" ]; then
            # 杀掉计时器立即同步
            if [ -n "$DEBOUNCE_TIMER_PID" ] && kill -0 "$DEBOUNCE_TIMER_PID" 2>/dev/null; then
                kill "$DEBOUNCE_TIMER_PID" 2>/dev/null
                wait "$DEBOUNCE_TIMER_PID" 2>/dev/null
            fi
            rm -f "${PID_DIR}/.debounce_trigger"
            do_sync "max-wait"
            events_since_sync=0
            last_forced_sync="$now_sec"
        fi
    done
}

# ========================== 守护进程控制 ==========================

# 启动守护进程
start_daemon() {
    if check_running; then
        local old_pid
        old_pid="$(cat "$PID_FILE")"
        log_warn "监控已在运行中 (PID: $old_pid)，先停止后再启动可使用 --restart"
        exit 0
    fi

    log_info "以后台守护进程方式启动..."

    # 确保日志文件已初始化（daemon模式强制写入日志文件）
    if [ -z "$LOG_FILE" ]; then
        LOG_FILE="${SCRIPT_DIR}/sync_watch.log"
        init_log_file
    fi

    # 重定向输出并后台运行
    nohup "$0" --config "$CONFIG_FILE_INTERNAL" --start --no-header \
        >>"$LOG_FILE" 2>&1 &
    local daemon_pid=$!

    # 等待一小会确认进程存活
    sleep 1
    if kill -0 "$daemon_pid" 2>/dev/null; then
        log_info "守护进程启动成功 (PID: $daemon_pid)"
        log_info "日志文件: $LOG_FILE"
    else
        log_error "守护进程启动失败，请查看日志: $LOG_FILE"
        exit 1
    fi
}

# 停止守护进程
stop_daemon() {
    if ! check_running; then
        log_info "未检测到运行中的监控进程"
        return 0
    fi
    local pid
    pid="$(cat "$PID_FILE")"
    log_info "正在停止监控进程 (PID: $pid)..."

    # 优雅停止
    kill -TERM "$pid" 2>/dev/null

    # 等待最多 10 秒
    local waited=0
    while kill -0 "$pid" 2>/dev/null && [ $waited -lt 10 ]; do
        sleep 1
        waited=$((waited + 1))
    done

    # 还活着就强杀
    if kill -0 "$pid" 2>/dev/null; then
        log_warn "进程未在 10 秒内退出，强制终止..."
        kill -KILL "$pid" 2>/dev/null
        sleep 1
    fi

    cleanup_pid
    log_info "已停止"
}

# 查看状态
show_status() {
    if check_running; then
        local pid
        pid="$(cat "$PID_FILE")"
        echo "运行状态: 运行中 (PID: $pid)"
        if [ -f "$SYNC_PID_FILE" ]; then
            local spid
            spid="$(cat "$SYNC_PID_FILE")"
            echo "同步任务: 进行中 (PID: $spid)"
        else
            echo "同步任务: 空闲"
        fi
        if [ -n "$LOG_FILE" ] && [ -f "$LOG_FILE" ]; then
            echo "日志文件: $LOG_FILE"
            echo "最近日志:"
            tail -n 5 "$LOG_FILE" 2>/dev/null | sed 's/^/  /'
        fi
    else
        echo "运行状态: 未运行"
    fi
}

# ========================== launchd 服务管理 ==========================

get_launchd_label() {
    local safe_user
    safe_user="$(whoami | tr -c 'a-zA-Z0-9' '_')"
    echo "com.${safe_user}.syncwatch"
}

get_launchd_plist_path() {
    local label
    label="$(get_launchd_label)"
    echo "$HOME/Library/LaunchAgents/${label}.plist"
}

install_service() {
    local plist_path
    plist_path="$(get_launchd_plist_path)"
    local label
    label="$(get_launchd_label)"

    # 先卸载旧的
    launchctl unload "$plist_path" 2>/dev/null

    # 确保脚本有执行权限
    chmod +x "$0"

    # 强制使用绝对路径的配置文件
    local abs_config
    if [ -n "$CONFIG_FILE_INTERNAL" ]; then
        abs_config="$(cd "$(dirname "$CONFIG_FILE_INTERNAL")" && pwd)/$(basename "$CONFIG_FILE_INTERNAL")"
    else
        abs_config="${SCRIPT_DIR}/sync_watch.conf"
    fi

    # 生成 plist
    cat > "$plist_path" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${label}</string>

    <key>ProgramArguments</key>
    <array>
        <string>${SCRIPT_DIR}/${SCRIPT_NAME}</string>
        <string>--config</string>
        <string>${abs_config}</string>
        <string>--start</string>
        <string>--no-header</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
        <key>Crashed</key>
        <true/>
    </dict>

    <key>WorkingDirectory</key>
    <string>${SCRIPT_DIR}</string>

    <key>StandardOutPath</key>
    <string>${SCRIPT_DIR}/sync_watch_launchd.log</string>
    <key>StandardErrorPath</key>
    <string>${SCRIPT_DIR}/sync_watch_launchd.err</string>

    <key>ProcessType</key>
    <string>Background</string>

    <key>ThrottleInterval</key>
    <integer>10</integer>
</dict>
</plist>
PLIST_EOF

    chmod 644 "$plist_path"

    # 加载
    if launchctl load "$plist_path" 2>&1; then
        log_info "launchd 服务安装成功:"
        log_info "  Label: $label"
        log_info "  Plist: $plist_path"
        log_info "  启动方式: 登录后自动启动，崩溃后自动重启"
        log_info ""
        log_info "常用命令:"
        log_info "  查看状态: launchctl list | grep $label"
        log_info "  立即启动: launchctl start $label"
        log_info "  停止:     launchctl stop  $label"
        log_info "  手动卸载: $SCRIPT_NAME --uninstall-service"
    else
        log_error "launchd 服务加载失败"
        exit 1
    fi
}

uninstall_service() {
    local plist_path
    plist_path="$(get_launchd_plist_path)"
    local label
    label="$(get_launchd_label)"

    if [ ! -f "$plist_path" ]; then
        log_info "未检测到已安装的 launchd 服务"
        return 0
    fi

    if launchctl unload "$plist_path" 2>&1; then
        log_info "已卸载 launchd 服务: $label"
    else
        log_warn "launchctl unload 返回错误，尝试强制删除 plist..."
    fi
    rm -f "$plist_path"
    log_info "已删除 plist 文件: $plist_path"
}

# ========================== 信号处理 ==========================
trap_handler() {
    local sig="$1"
    log_info "收到信号 $sig，正在退出..."
    RUNNING=false
    # 杀掉去抖计时器子进程
    if [ -n "$DEBOUNCE_TIMER_PID" ] && kill -0 "$DEBOUNCE_TIMER_PID" 2>/dev/null; then
        kill "$DEBOUNCE_TIMER_PID" 2>/dev/null
    fi
    cleanup_pid
    exit 0
}

# ========================== 主入口 ==========================
main() {
    local mode="start"
    local config_file=""
    local no_header=false
    CONFIG_FILE_INTERNAL=""

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -c|--config)
                config_file="$2"; shift 2 ;;
            -s|--start)
                mode="start"; shift ;;
            -d|--daemon)
                mode="daemon"; shift ;;
            -k|--stop)
                mode="stop"; shift ;;
            -r|--restart)
                mode="restart"; shift ;;
            -t|--status)
                mode="status"; shift ;;
            --sync-now)
                mode="sync-now"; shift ;;
            --install-service)
                mode="install"; shift ;;
            --uninstall-service)
                mode="uninstall"; shift ;;
            --no-header)
                no_header=true; shift ;;
            -h|--help)
                usage; exit 0 ;;
            -V|--version)
                version; exit 0 ;;
            *)
                echo "未知参数: $1" >&2
                usage; exit 1 ;;
        esac
    done

    # 保存配置文件路径（内部使用）
    CONFIG_FILE_INTERNAL="$config_file"

    # 加载配置（所有模式都需要基本配置）
    load_config "$config_file"

    # 初始化 PID 目录（所有模式都需要）
    init_pid_dir

    # 初始化日志
    init_log_file

    # 仅停止/状态/卸载模式不需要完整验证
    case "$mode" in
        stop|status|uninstall)
            # 这些模式只需要 PID 信息
            ;;
        sync-now)
            # 一次性同步模式：只需要 rsync 和 ssh
            check_dependencies "sync"
            validate_config
            ;;
        *)
            check_dependencies "monitor"
            validate_config
            ;;
    esac

    if [ "$no_header" = "false" ]; then
        echo "============================================"
        echo "  文件夹监控同步脚本 v$SCRIPT_VERSION"
        echo "============================================"
    fi

    case "$mode" in
        start)
            # 前台运行模式
            if check_running; then
                local old_pid
                old_pid="$(cat "$PID_FILE")"
                log_error "已有监控进程在运行 (PID: $old_pid)，请先停止或使用 --daemon --restart"
                exit 1
            fi

            # 安装信号处理
            trap 'trap_handler SIGINT' INT
            trap 'trap_handler SIGTERM' TERM
            trap 'trap_handler SIGQUIT' QUIT
            trap 'cleanup_pid' EXIT

            write_pid

            # 启动时全量同步
            if [ "$FULL_SYNC_ON_START" = "true" ]; then
                do_sync "startup-full-sync"
            fi

            # 启动监控
            run_monitor
            ;;

        daemon)
            start_daemon
            ;;

        stop)
            stop_daemon
            ;;

        restart)
            stop_daemon
            sleep 1
            start_daemon
            ;;

        status)
            show_status
            ;;

        sync-now)
            do_sync "manual-once"
            ;;

        install)
            install_service
            ;;

        uninstall)
            uninstall_service
            ;;
    esac
}

main "$@"
