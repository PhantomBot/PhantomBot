/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.gmt2001.httpwsserver.longpoll;

import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

import org.json.JSONObject;

import com.gmt2001.httpwsserver.HttpRequestHandler;
import com.gmt2001.httpwsserver.WsFrameHandler;
import com.gmt2001.httpwsserver.auth.HttpAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.WsAuthenticationHandler;

import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.websocketx.PongWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import tv.phantombot.panel.PanelUser.PanelUser;

public abstract class WsWithLongPollHandler implements HttpRequestHandler, WsFrameHandler {
    /**
     * The entropy of a session ID, in bits
     */
    public static final int SESSION_ID_ENTROPY = 64;
    /**
     * The cache of {@link Client}
     */
    protected final ClientCache clientCache;
    /**
     * The authentication handler
     */
    private final WsWithLongPollAuthenticationHandler authHandler;
    /**
     * Random generator for session IDs
     */
    private final SecureRandom secureRandom;

    /**
     * Constructor
     *
     * @param authenticatedCallback Optional callback to run when a client
     *                              successfully authenticates via an authentication
     *                              frame
     * @param ctxTimeout            The timeout until a WS client is sent a PING
     *                              frame or an HTTP client is sent an empty
     *                              response
     * @param strongTimeout         The duration after which the strong reference to
     *                              an outbound message will be dropped
     * @param softTimeout           The duration after which the soft reference to
     *                              an outbound message, and the entire message,
     *                              will be dropped
     */
    protected WsWithLongPollHandler(Runnable authenticatedCallback, Duration ctxTimeout, Duration strongTimeout,
            Duration softTimeout) {
        this.clientCache = new ClientCache(ctxTimeout, strongTimeout, softTimeout);
        this.authHandler = new WsWithLongPollAuthenticationHandler(authenticatedCallback, this::clientSessionId);

        SecureRandom secureRandom;
        try {
            secureRandom = SecureRandom.getInstanceStrong();
        } catch (NoSuchAlgorithmException ex) {
            com.gmt2001.Console.err.logStackTrace(ex);
            secureRandom = new SecureRandom();
        }

        this.secureRandom = secureRandom;
    }

    /**
     * Returns the session ID for the client
     *
     * @param ctx  The context
     * @param isWs {@code true} if WS; {@code false} if HTTP
     * @return The session ID; {@code null} if the {@link PanelUser} is {@code null}
     */
    protected final String clientSessionId(ChannelHandlerContext ctx, boolean isWs) {
        Optional<Client> client = this.clientCache.addOrUpdateClient(ctx, isWs, Instant.MIN, 0L,
                this::sessionIdSupplier);

        if (client.isPresent()) {
            return client.get().sessionId();
        }

        return null;
    }

    /**
     * Provides a unique session ID
     *
     * @return A session ID
     */
    protected final String sessionIdSupplier() {
        byte[] b = new byte[SESSION_ID_ENTROPY];
        String sessionId;

        do {
            this.secureRandom.nextBytes(b);
            sessionId = Base64.getUrlEncoder().encodeToString(b);
        } while (this.clientCache.sessionIdExists(sessionId));

        return sessionId;
    }

    @Override
    public void handleRequest(ChannelHandlerContext ctx, FullHttpRequest req) {
    }

    @Override
    public void handleFrame(ChannelHandlerContext ctx, WebSocketFrame frame) {
        if (frame instanceof PongWebSocketFrame) {
            this.clientCache.pong(ctx);
        }
    }

    public abstract void handleMessage(ChannelHandlerContext ctx, JSONObject jso);

    @Override
    public HttpAuthenticationHandler getHttpAuthHandler() {
        return this.authHandler;
    }

    @Override
    public WsAuthenticationHandler getWsAuthHandler() {
        return this.authHandler;
    }
}
