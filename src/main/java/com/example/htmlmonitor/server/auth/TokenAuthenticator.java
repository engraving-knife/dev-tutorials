package com.example.htmlmonitor.server.auth;

import com.example.htmlmonitor.config.ServerConfig;

import com.sun.net.httpserver.Authenticator;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpPrincipal;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.logging.Logger;

/**
 * 共享令牌认证器（机器级访问控制）。
 *
 * 设计意图：
 * 1. 基于 JDK 内置 com.sun.net.httpserver.Authenticator 实现，通过 HttpContext /
 *    HttpServer 的 setAuthenticator 统一挂载到所有路由上，实现对 16666 端口
 *    全量请求的拦截，业务 handler 零改动、与被保护的逻辑完全解耦；
 * 2. 令牌来源支持两种方式，分别面向"浏览器"与"纯 API 机器"：
 *    - X-Auth-Token 请求头：适合脚本/服务之间的机器认证；
 *    - token 查询参数：适合浏览器通过带令牌的 URL 直接访问并加载前端页面；
 * 3. 令牌比较采用常量时间算法，避免因长度/短路比较引入的时序侧信道；
 * 4. 认证关闭（auth.enabled=false）时直接放行，用于需要临时开放访问的部署场景。
 */
public class TokenAuthenticator extends Authenticator {

    private static final Logger LOGGER = Logger.getLogger(TokenAuthenticator.class.getName());

    /** 请求头携带令牌的键名 */
    private static final String TOKEN_HEADER = "X-Auth-Token";

    /** 查询参数携带令牌的键名 */
    private static final String TOKEN_PARAM = "token";

    /** 认证主体会话中的用户名，仅用于构造 Success 结果，不参与鉴权判断 */
    private static final String PRINCIPAL_USER = "authorized-machine";

    /** 认证领域名，仅用于标识，不参与鉴权判断 */
    private static final String REALM = "htmlmonitor";

    /** 配置的机器认证令牌 */
    private final String expectedToken;

    /** 认证开关 */
    private final boolean enabled;

    public TokenAuthenticator(ServerConfig config) {
        this.expectedToken = config.getAuthToken();
        this.enabled = config.isAuthEnabled();
    }

    @Override
    public Result authenticate(HttpExchange exchange) {
        // 关闭认证时直接放行，便于临时开放访问
        if (!enabled) {
            return new Success(new HttpPrincipal(PRINCIPAL_USER, REALM));
        }

        String provided = resolveToken(exchange);
        if (provided != null && constantTimeEquals(expectedToken, provided)) {
            return new Success(new HttpPrincipal(PRINCIPAL_USER, REALM));
        }

        // 令牌缺失或不匹配：返回 401，由 HttpServer 框架统一向客户端发送响应
        return new Failure(401);
    }

    /**
     * 解析客户端提交的令牌：优先取请求头 X-Auth-Token，其次取查询参数 token。
     *
     * @param exchange 当前 HTTP 交换上下文
     * @return 客户端提交的令牌，缺失时返回 null
     */
    private String resolveToken(HttpExchange exchange) {
        String header = exchange.getRequestHeaders().getFirst(TOKEN_HEADER);
        if (header != null && !header.isEmpty()) {
            return header.trim();
        }
        String query = exchange.getRequestURI().getRawQuery();
        if (query == null || query.isEmpty()) {
            return null;
        }
        for (String pair : query.split("&")) {
            int idx = pair.indexOf('=');
            if (idx <= 0) {
                continue;
            }
            String key = pair.substring(0, idx);
            if (TOKEN_PARAM.equals(key)) {
                return URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
            }
        }
        return null;
    }

    /**
     * 常量时间字符串比较，用于避免时序侧信道攻击。
     *
     * @param a 期望令牌
     * @param b 客户端提交令牌
     * @return 两者完全相等时返回 true
     */
    private boolean constantTimeEquals(String a, String b) {
        byte[] ba = a.getBytes(StandardCharsets.UTF_8);
        byte[] bb = b.getBytes(StandardCharsets.UTF_8);
        if (ba.length != bb.length) {
            return false;
        }
        int diff = 0;
        for (int i = 0; i < ba.length; i++) {
            diff |= ba[i] ^ bb[i];
        }
        return diff == 0;
    }
}