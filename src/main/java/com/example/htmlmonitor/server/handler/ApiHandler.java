package com.example.htmlmonitor.server.handler;

import com.example.htmlmonitor.model.FileNode;
import com.example.htmlmonitor.monitor.FileIndex;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * /api/files 接口处理器。
 *
 * 设计意图：
 * 将 FileIndex 中的目录树快照序列化为 JSON 返回给前端，前端据此渲染目录结构。
 * JSON 采用手工拼接而非第三方库，保持零依赖；所有输出统一 UTF-8 编码，
 * 与前端 fetch 解析保持一致。目录树结构与本地目录一一对应。
 */
public class ApiHandler implements HttpHandler {

    /** 返回 JSON 的 Content-Type */
    private static final String CONTENT_TYPE = "application/json; charset=utf-8";

    private final FileIndex index;

    public ApiHandler(FileIndex index) {
        this.index = index;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            // 仅支持 GET，其余方法返回 405
            exchange.sendResponseHeaders(405, -1);
            return;
        }

        FileNode root = index.getRootNode();
        String json = root == null ? "null" : toJson(root);
        byte[] body = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", CONTENT_TYPE);
        // 禁用缓存，保证前端每次请求都能拿到最新快照
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.sendResponseHeaders(200, body.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(body);
        }
    }

    /**
     * 将 FileNode 递归序列化为 JSON 字符串。
     *
     * @param node 目录树节点
     * @return 对应的 JSON 片段
     */
    private String toJson(FileNode node) {
        StringBuilder sb = new StringBuilder();
        sb.append('{');
        sb.append("\"name\":\"").append(escape(node.getName())).append("\",");
        sb.append("\"path\":\"").append(escape(node.getRelativePath())).append("\",");
        sb.append("\"directory\":").append(node.isDirectory());
        if (!node.isDirectory()) {
            // 文件节点额外携带大小与修改时间，供前端展示
            sb.append(",\"size\":").append(node.getSize());
            sb.append(",\"lastModified\":").append(node.getLastModified());
        }
        List<FileNode> children = node.getChildren();
        sb.append(",\"children\":[");
        for (int i = 0; i < children.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(toJson(children.get(i)));
        }
        sb.append("]}");
        return sb.toString();
    }

    /**
     * 转义字符串中的 JSON 特殊字符，防止非法字符破坏 JSON 结构。
     *
     * @param s 原始字符串
     * @return 转义后的字符串
     */
    private String escape(String s) {
        if (s == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(s.length());
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"':
                    sb.append("\\\"");
                    break;
                case '\\':
                    sb.append("\\\\");
                    break;
                case '\n':
                    sb.append("\\n");
                    break;
                case '\r':
                    sb.append("\\r");
                    break;
                case '\t':
                    sb.append("\\t");
                    break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }
}
