package com.example.htmlmonitor.server.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * 静态资源处理器：从 classpath 加载前端页面并返回。
 *
 * 设计意图：
 * 前端页面打包进 jar 的 classpath 中（resources/static/index.html），
 * 部署时无需额外拷贝静态文件，一个 jar 即可完整运行；
 * 页面内容在构造时一次性读入内存，避免每次请求重复读取。
 */
public class StaticHandler implements HttpHandler {

    /** 前端页面在 classpath 中的位置 */
    private static final String INDEX_PATH = "static/index.html";

    /** 内存中缓存的前端页面内容 */
    private final byte[] indexBytes;

    public StaticHandler() throws IOException {
        this.indexBytes = loadIndex();
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        if ("/".equals(path) || "/index.html".equals(path)) {
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
            exchange.sendResponseHeaders(200, indexBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(indexBytes);
            }
        } else {
            // 其他路径交给 404，避免误命中其它上下文
            exchange.sendResponseHeaders(404, -1);
        }
    }

    /**
     * 从 classpath 读取前端页面内容。
     *
     * @return 页面字节内容
     * @throws IOException 资源缺失或读取失败时抛出
     */
    private byte[] loadIndex() throws IOException {
        try (InputStream in = StaticHandler.class.getClassLoader().getResourceAsStream(INDEX_PATH)) {
            if (in == null) {
                throw new IOException("未找到前端页面资源: " + INDEX_PATH);
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            int n;
            while ((n = in.read(buf)) != -1) {
                out.write(buf, 0, n);
            }
            return out.toByteArray();
        }
    }
}
