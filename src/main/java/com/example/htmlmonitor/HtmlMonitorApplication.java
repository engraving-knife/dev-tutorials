package com.example.htmlmonitor;

import com.example.htmlmonitor.config.ServerConfig;
import com.example.htmlmonitor.monitor.DirectoryWatcher;
import com.example.htmlmonitor.monitor.FileIndex;
import com.example.htmlmonitor.server.HttpServerManager;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * HTML 目录实时监控服务 - 程序入口。
 *
 * 设计意图：
 * 1. 组装并启动服务的四个核心组件，执行顺序固定：
 *    加载配置 -> 准备监控目录 -> 构建初始索引 -> 启动目录监听 -> 启动 HTTP 服务；
 * 2. 任何组件启动失败都会打印日志并以非零码退出，便于在云服务器上
 *    结合 systemd / docker 等工具做进程守护与自动重启；
 * 3. 目录监听线程为守护线程，主线程被 HTTP 服务阻塞保持存活。
 */
public class HtmlMonitorApplication {

    private static final Logger LOGGER = Logger.getLogger(HtmlMonitorApplication.class.getName());

    /**
     * 程序主入口。
     *
     * @param args 命令行参数（当前未使用，配置统一从 application.properties 读取）
     */
    public static void main(String[] args) {
        try {
            // 1. 加载配置
            ServerConfig config = ServerConfig.load();

            // 2. 确保监控目录存在，避免首次启动时 WatchService 注册失败
            Path monitorDir = config.getMonitorDir();
            Files.createDirectories(monitorDir);

            // 3. 初始化文件索引并做首次全量构建，服务一启动前端即可看到完整目录
            FileIndex index = new FileIndex(monitorDir);
            index.rebuild();

            // 4. 启动实时目录监听：本地文件变化会实时同步到前端目录
            DirectoryWatcher watcher = new DirectoryWatcher(monitorDir, index);
            watcher.start();

            // 5. 启动 HTTP 服务，主线程在此阻塞直至进程被终止
            HttpServerManager server = new HttpServerManager(config, index);
            server.start();

            LOGGER.info("访问地址: http://<服务器IP>:" + config.getPort());
            LOGGER.info("监控目录: " + monitorDir.toAbsolutePath());
            LOGGER.info("按 Ctrl+C 停止服务");
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "服务启动失败", e);
            System.exit(1);
        }
    }
}
