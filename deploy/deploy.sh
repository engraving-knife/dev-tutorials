#!/usr/bin/env bash
#
# html-monitor 云服务器一键部署 / 运维脚本（部署目录: deploy/）
#
# 设计意图：
# 1. 将全部部署相关文件收敛到独立目录 deploy/ 下，与项目源码隔离，避免污染仓库根目录：
#    - deploy.sh       本运维脚本
#    - deploy.conf     端口与认证令牌的持久化配置
#    - dist/           fat jar 部署产物
#    - logs/           运行日志
#    - html-monitor.pid 进程 PID 文件（运行时生成）
# 2. 在云服务器上完成"装环境 -> 打 fat jar -> 后台运行"全流程，一次命令即可上线；
# 3. 后台运行使用 nohup 将 stdout/stderr 重定向到日志文件，并将进程 PID 写入
#    pid 文件，配合 start/stop/restart/status 子命令做进程生命周期管理；
# 4. 认证令牌自动生成并持久化到 deploy.conf：首次启动若未配置 token，脚本会
#    生成一个随机令牌并保存，后续重启沿用同一令牌，保证多台机器配置一致；
# 5. 服务以 0.0.0.0:16666 对外监听，令牌、端口、监控目录通过 -D 系统属性注入，
#    无需修改打包好的 jar 即可按部署环境调整。
#
# 用法（在项目根目录执行）：
#   deploy/deploy.sh start      # 构建并后台启动服务
#   deploy/deploy.sh stop       # 停止服务
#   deploy/deploy.sh restart    # 重启服务
#   deploy/deploy.sh status     # 查看运行状态
#
# 环境变量（可选，也可直接编辑 deploy/deploy.conf）：
#   PORT    服务端口，默认 16666
#   TOKEN   机器认证令牌，留空则自动生成
#   JDK_MODE  auto|skip，auto 时缺 java/mvn 会自动尝试安装，默认 auto

# 脚本自身所在目录 = deploy 部署目录；其上两级为项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# ---------- 常量（全部落在 deploy 目录） ----------
CONF_FILE="$SCRIPT_DIR/deploy.conf"      # 持久化配置（端口、令牌）
DIST_DIR="$SCRIPT_DIR/dist"              # 部署产物目录
JAR_FILE="$DIST_DIR/html-monitor.jar"    # 最终可执行 fat jar
PID_FILE="$SCRIPT_DIR/html-monitor.pid"  # 进程 PID 文件
LOG_DIR="$SCRIPT_DIR/logs"               # 运行日志目录
STDOUT_LOG="$LOG_DIR/stdout.log"         # 启动日志（nohup 输出）
APP_DIR="$PROJECT_ROOT/html-files"       # 监控目录（绝对路径，避免相对路径歧义）

# ---------- 默认配置 ----------
PORT="${PORT:-16666}"
TOKEN="${TOKEN:-}"
JDK_MODE="${JDK_MODE:-auto}"

# 合并 deploy.conf（存在则读取，覆盖上面的默认值）
if [ -f "$CONF_FILE" ]; then
  # shellcheck disable=SC1090
  . "$CONF_FILE"
fi

# 若未曾配置令牌则生成随机令牌，并写入 deploy.conf 持久化
if [ -z "$TOKEN" ]; then
  TOKEN=$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')
  sed -i "/^TOKEN=/d" "$CONF_FILE" 2>/dev/null || true
  {
    echo "# html-monitor 运行配置，由 deploy.sh 维护"
    echo "# 如需自定义端口或令牌，直接编辑本文件后执行 restart 生效。"
    echo "PORT=$PORT"
    echo "TOKEN=$TOKEN"
  } > "$CONF_FILE"
  echo "  >> 已生成新认证令牌: $TOKEN"
fi
PORT="${PORT:-16666}"

# ---------- 辅助函数 ----------
log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die()  { log "错误: $*"; exit 1; }

# 自动安装 JDK 与 Maven（仅在 JDK_MODE=auto 且确实缺失时触发，尽力而为）
ensure_env() {
  if command -v java >/dev/null 2>&1; then
    log "Java 已安装: $(java -version 2>&1 | head -n1)"
  elif [ "$JDK_MODE" = "auto" ]; then
    log "未检测到 Java，尝试自动安装..."
    if command -v apt-get >/dev/null 2>&1; then
      apt-get update -y >/dev/null 2>&1 && apt-get install -y default-jdk maven >/dev/null 2>&1
    elif command -v yum >/dev/null 2>&1; then
      yum install -y java-11-openjdk-devel maven >/dev/null 2>&1
    elif command -v dnf >/dev/null 2>&1; then
      dnf install -y java-11-openjdk-devel maven >/dev/null 2>&1
    fi
  else
    die "未检测到 Java，请先安装 JDK 11+ (或设置 JDK_MODE=auto)"
  fi
  command -v java >/dev/null 2>&1 || die "Java 安装后仍不可用，请手动安装 JDK 11+"

  if ! command -v mvn >/dev/null 2>&1; then
    if [ "$JDK_MODE" = "auto" ]; then
      log "未检测到 Maven，尝试自动安装..."
      command -v apt-get >/dev/null 2>&1 && apt-get install -y maven >/dev/null 2>&1
      command -v yum >/dev/null 2>&1 && yum install -y maven >/dev/null 2>&1
    fi
  fi
  command -v mvn >/dev/null 2>&1 || die "Maven 不可用，请先安装 Maven"
}

# 打包获取可执行 fat jar：优先复用已有产物，否则重新构建
build_jar() {
  if [ -f "$JAR_FILE" ]; then
    log "复用已构建产物: $JAR_FILE"
    return
  fi
  log "开始 mvn package 构建 fat jar（首次构建需下载依赖，请耐心等待）..."
  mvn -q -DskipTests package || die "构建失败"
  mkdir -p "$DIST_DIR"
  cp -f "$PROJECT_ROOT/target/html-monitor.jar" "$JAR_FILE"
  log "构建完成: $JAR_FILE"
}

# 后台启动服务（nohup 脱离终端运行，PID 落盘）
start_service() {
  ensure_env
  build_jar
  mkdir -p "$LOG_DIR" "$APP_DIR"

  if is_running; then
    log "服务已在运行 (PID $(get_pid))，无需重复启动。"
    return
  fi

  local JVM_PROPS=(
    "-Dserver.host=0.0.0.0"
    "-Dserver.port=$PORT"
    "-Dmonitor.dir=$APP_DIR"
    "-Dauth.token=$TOKEN"
    "-Dauth.enabled=true"
  )

  log "启动服务: 端口 $PORT，监控目录 $APP_DIR，令牌 $(echo "$TOKEN" | cut -c1-6)***"

  nohup java "${JVM_PROPS[@]}" -jar "$JAR_FILE" >> "$STDOUT_LOG" 2>&1 &
  echo $! > "$PID_FILE"
  disown

  # 等待端口就绪并做健康检查
  for _ in $(seq 1 20); do
    [ "$(get_pid)" ] && kill -0 "$(get_pid)" 2>/dev/null || break
    if curl -sf "http://127.0.0.1:$PORT/api/files?token=$TOKEN" >/dev/null 2>&1; then
      log "服务启动成功并已通过健康检查。"
      print_access
      return 0
    fi
    sleep 1
  done
  log "警告: 未能在规定时间内完成健康检查，请查看日志: $STDOUT_LOG"
}

stop_service() {
  if ! is_running; then
    log "服务未在运行。"
    rm -f "$PID_FILE"
    return
  fi
  local pid
  pid="$(get_pid)"
  log "停止服务 (PID $pid)..."
  kill "$pid" 2>/dev/null
  # 等待进程退出
  for _ in $(seq 1 15); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 1
  done
  kill -9 "$pid" 2>/dev/null  # 兜底强制结束
  rm -f "$PID_FILE"
  log "服务已停止。"
}

get_pid() { [ -f "$PID_FILE" ] && cat "$PID_FILE"; echo; }
is_running() {
  local pid
  pid="$(get_pid)"
  [ -n "$pid" ] && [ "$pid" -gt 0 ] 2>/dev/null && kill -0 "$pid" 2>/dev/null
}

status_service() {
  if is_running; then
    local pid
    pid="$(get_pid)"
    log "服务运行中 (PID $pid)，端口 $PORT，日志: $STDOUT_LOG"
    print_access
  else
    log "服务未运行。"
  fi
}

print_access() {
  echo "  --------------------------------------------------"
  echo "  访问地址: http://<服务器IP>:$PORT/?token=$TOKEN"
  echo "  API 机器: 请求头携带 X-Auth-Token: $TOKEN"
  echo "  --------------------------------------------------"
}

# ---------- 命令分发 ----------
case "${1:-start}" in
  start)    start_service ;;
  stop)     stop_service ;;
  restart)  stop_service; start_service ;;
  status)   status_service ;;
  *)        echo "用法: deploy/deploy.sh {start|stop|restart|status}"; exit 1 ;;
esac