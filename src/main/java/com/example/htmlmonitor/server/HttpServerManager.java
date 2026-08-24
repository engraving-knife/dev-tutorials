package com.example.htmlmonitor.server;

import com.example.htmlmonitor.config.ServerConfig;
import com.example.htmlmonitor.monitor.FileIndex;
import com.example.htmlmonitor.server.auth.TokenAuthenticator;
import com.example.htmlmonitor.server.handler.ApiHandler;
import com.example.htmlmonitor.server.handler.HtmlContentHandler;
import com.example.htmlmonitor.server.handler.StaticHandler;

import com.sun.net.httpserver.Authenticator;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Logger;

/**
 * 轻量 HTTP 服务管理器。
 *
 * 设计意图：
 * 1. 使用 JDK 内置的 com.sun.net.httpserver.HttpServer，零第三方依赖即可对外
 *    提供服务，打出的 fat jar 可直接部署到云服务器运行；
 * 2. 集中注册三个路由上下文，职责分离：
 *    - /          -> 前端展示页面
 *    - /api/files -> 目录树 JSON 数据接口
 *    - /html/*    -> 原样返回监控目录下文件的原始内容
 * 3. 使用线程池处理并发请求，避免串行阻塞。
 */
public class HttpServerManager {

    private static final Logger LOGGER = Logger.getLogger(HttpServerManager.class.getName());

    private final ServerConfig config;
    private final FileIndex index;
    private HttpServer server;
    private ExecutorService executor;

    public HttpServerManager(ServerConfig config, FileIndex index) {
        this.config = config;
        this.index = index;
    }

    /**
     * 启动 HTTP 服务并注册各路由处理器。
     *
     * @throws IOException 端口被占用或绑定失败时抛出
     */
    public void start() throws IOException {
        InetSocketAddress address = new InetSocketAddress(config.getHost(), config.getPort());
        server = HttpServer.create(address, 0);

        // 机器级访问控制：共享令牌认证器统一挂载，对全部路由生效，业务 handler 无需感知认证逻辑
        Authenticator auth = new TokenAuthenticator(config);

        // 目录树数据接口：前端据此渲染目录结构
        server.createContext("/api/files", new ApiHandler(index)).setAuthenticator(auth);
        // 原 HTML 内容接口：点击前端目录中的文件后，从这里加载本地 HTML 原样展示
        server.createContext("/html", new HtmlContentHandler(config.getMonitorDir(), config)).setAuthenticator(auth);
        // 前端页面
        server.createContext("/", new StaticHandler()).setAuthenticator(auth);

        // 缓存线程池处理并发请求；服务停止时一并回收
        executor = Executors.newCachedThreadPool();
        server.setExecutor(executor);
        server.start();
        LOGGER.info("HTTP 服务已启动: http://" + config.getHost() + ":" + config.getPort());
    }

    /**
     * 停止 HTTP 服务并回收线程池。
     */
    public void stop() {
        if (server != null) {
            server.stop(0);
        }
        if (executor != null) {
            executor.shutdownNow();
        }
    }
}
