package com.example.htmlmonitor.server.handler;

import com.example.htmlmonitor.config.ServerConfig;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * /html/* 接口处理器：返回监控目录下文件的原始内容。
 *
 * 设计意图：
 * 1. 将本地 HTML 文件“原样”输出到前端，保证页面字节与本地文件完全一致，
 *    即需求中的“点击前端目录可展示原 HTML”；
 * 2. 除 HTML 外也允许读取监控目录内的 css/js/图片等资源，使页面引用的相对
 *    路径资源能够正常加载，完整还原本地页面的视觉效果；
 * 3. 做严格的路径越界防护：任何请求路径都会被 normalize 后校验是否仍位于
 *    监控根目录内，杜绝通过 ../ 访问监控目录之外文件的路径穿越攻击。
 */
public class HtmlContentHandler implements HttpHandler {

    /** 正则：匹配 HTML 头中声明的字符集，如 charset=utf-8 或 charset=GBK */
    private static final Pattern CHARSET_PATTERN =
            Pattern.compile("charset\\s*=\\s*[\"']?([a-zA-Z0-9_\\-]+)", Pattern.CASE_INSENSITIVE);

    /** 探测字符集时读取的头部字节数 */
    private static final int CHARSET_SCAN_BYTES = 1024;

    /** 监控根目录（绝对路径、已 normalize） */
    private final Path monitorRoot;

    /** 认证开关：关闭认证时不再写入 Cookie */
    private final boolean authEnabled;

    /** 机器认证令牌，写入 Cookie 供页内请求自动携带 */
    private final String authToken;

    /** Cookie 携带令牌的键名：与 TokenAuthenticator 解析的 Cookie 保持一致 */
    private static final String TOKEN_COOKIE = "htmlmonitor_token";

    public HtmlContentHandler(Path monitorRoot, ServerConfig config) {
        this.monitorRoot = monitorRoot.toAbsolutePath().normalize();
        this.authEnabled = config.isAuthEnabled();
        this.authToken = config.getAuthToken();
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        // 去掉 /html 前缀，得到监控目录内的相对路径，如 a.html 或 sub/b.html
        String rel = path.length() > "/html".length() ? path.substring("/html".length()) : "";
        if (rel.startsWith("/")) {
            rel = rel.substring(1);
        }
        if (rel.isEmpty()) {
            send(exchange, 400, "Bad Request: 缺少文件路径");
            return;
        }

        Path file = resolveSafe(rel);
        if (file == null) {
            // 路径越界：拒绝访问监控目录之外的文件
            send(exchange, 403, "Forbidden: 路径越界");
            return;
        }
        if (!Files.isRegularFile(file)) {
            send(exchange, 404, "Not Found: " + rel);
            return;
        }

        byte[] content = Files.readAllBytes(file);
        String fileName = file.getFileName().toString();
        String contentType = resolveContentType(fileName, content);
        // 认证开启时，给 HTML 文档写入令牌 Cookie：页面内引用的 css/js/字体/图片等
        // 子资源以及站内链接属于独立的浏览器请求，无法继承地址栏里的 ?token=，
        // 通过本机 Cookie 自动携带令牌，才能避免这些内部请求被 401 拦截
        String lowerName = fileName.toLowerCase(Locale.ROOT);
        if (authEnabled && (lowerName.endsWith(".html") || lowerName.endsWith(".htm"))) {
            exchange.getResponseHeaders().set("Set-Cookie",
                    TOKEN_COOKIE + "=" + authToken + "; Path=/; SameSite=Lax; HttpOnly");
        }
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(200, content.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(content);
        }
    }

    /**
     * 将相对路径解析为监控目录内的绝对路径，并做越界校验。
     *
     * @param rel 请求的相对路径
     * @return 校验通过的绝对路径；若解析后越出监控根目录则返回 null
     */
    private Path resolveSafe(String rel) {
        Path target = monitorRoot.resolve(rel).normalize();
        return target.startsWith(monitorRoot) ? target : null;
    }

    /**
     * 根据扩展名与内容推断 Content-Type；HTML 文件额外探测其声明的字符集。
     */
    private String resolveContentType(String fileName, byte[] content) {
        String lower = fileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".html") || lower.endsWith(".htm")) {
            return "text/html; charset=" + detectCharset(content);
        }
        if (lower.endsWith(".css")) {
            return "text/css; charset=utf-8";
        }
        if (lower.endsWith(".js")) {
            return "application/javascript; charset=utf-8";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".gif")) {
            return "image/gif";
        }
        if (lower.endsWith(".svg")) {
            return "image/svg+xml";
        }
        if (lower.endsWith(".json")) {
            return "application/json; charset=utf-8";
        }
        return "application/octet-stream";
    }

    /**
     * 从 HTML 文件头部字节中探测声明的字符集，未声明时回退 UTF-8。
     * 以 ISO-8859-1 解码头部字节以保留原始字节形态，便于正则匹配 ASCII 字符集名。
     */
    private String detectCharset(byte[] content) {
        int len = Math.min(content.length, CHARSET_SCAN_BYTES);
        String head = new String(content, 0, len, StandardCharsets.ISO_8859_1);
        Matcher matcher = CHARSET_PATTERN.matcher(head);
        return matcher.find() ? matcher.group(1) : "UTF-8";
    }

    /**
     * 发送带状态码与文本内容的响应。
     */
    private void send(HttpExchange exchange, int code, String message) throws IOException {
        byte[] body = message.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(code, body.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(body);
        }
    }
}
