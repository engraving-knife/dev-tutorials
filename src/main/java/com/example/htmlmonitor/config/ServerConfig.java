package com.example.htmlmonitor.config;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * 服务配置类。
 *
 * 设计意图：
 * 将所有可调参数（监听地址、端口、监控目录）收敛到一处集中管理，
 * 配置来源为 classpath 根目录下的 application.properties 文件，
 * 修改配置后重新打包或在启动目录放置同名文件即可生效，方便在不同
 * 云服务器环境下按需调整，无需改动代码。
 */
public class ServerConfig {

    private static final Logger LOGGER = Logger.getLogger(ServerConfig.class.getName());

    /** 服务监听地址，默认监听所有网卡以支持云服务器外部访问 */
    private String host = "0.0.0.0";

    /** 服务端口 */
    private int port = 16666;

    /** 需要实时监控的本地目录 */
    private Path monitorDir = Paths.get("html-files");

    /** 访问控制开关：为 true 时只有携带有效令牌的机器才能访问服务 */
    private boolean authEnabled = true;

    /** 机器认证令牌：所有授权机器共享的单一密钥，通过 X-Auth-Token 请求头或 token 查询参数提交 */
    private String authToken = "xiaohang";

    /**
     * 从 classpath 中的 application.properties 加载配置。
     * 支持以 -D 系统属性覆盖文件配置（如 -Dserver.port=9090），
     * 便于云服务器上按部署环境临时调整参数而无需重新打包。
     *
     * @return 填充完成的配置对象；配置文件缺失或损坏时回退到默认值
     */
    public static ServerConfig load() {
        ServerConfig cfg = new ServerConfig();
        Properties props = new Properties();
        try (InputStream in = ServerConfig.class.getClassLoader().getResourceAsStream("application.properties")) {
            if (in != null) {
                props.load(in);
            }
        } catch (IOException e) {
            LOGGER.log(Level.WARNING, "读取 application.properties 失败，使用默认配置", e);
        }

        // 优先级：系统属性 > 配置文件 > 内置默认值
        cfg.host = System.getProperty("server.host", props.getProperty("server.host", cfg.host)).trim();
        cfg.port = parseInt(System.getProperty("server.port", props.getProperty("server.port", String.valueOf(cfg.port))), cfg.port);
        String dir = System.getProperty("monitor.dir", props.getProperty("monitor.dir", "")).trim();
        if (!dir.isEmpty()) {
            cfg.monitorDir = Paths.get(dir);
        }

        // 访问控制配置：认证开关与共享令牌，优先级同为 系统属性 > 配置文件 > 默认值
        cfg.authEnabled = Boolean.parseBoolean(
                System.getProperty("auth.enabled", props.getProperty("auth.enabled", String.valueOf(cfg.authEnabled))).trim());
        cfg.authToken = System.getProperty("auth.token", props.getProperty("auth.token", cfg.authToken)).trim();
        return cfg;
    }

    /**
     * 安全解析整数，解析失败时回退到默认值，避免配置错误导致启动崩溃。
     */
    private static int parseInt(String value, int defaultValue) {
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public String getHost() {
        return host;
    }

    public int getPort() {
        return port;
    }

    public Path getMonitorDir() {
        return monitorDir;
    }

    public boolean isAuthEnabled() {
        return authEnabled;
    }

    public String getAuthToken() {
        return authToken;
    }
}
