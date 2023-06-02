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
package com.gmt2001.httpwsserver.auth;

import com.gmt2001.httpwsserver.WebSocketFrameHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketCloseStatus;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import io.netty.util.AttributeKey;
import tv.phantombot.PhantomBot;
import tv.phantombot.panel.PanelUser.PanelUser;
import tv.phantombot.panel.PanelUser.PanelUserHandler;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;

/**
 * Provides a {@link WsAuthenticationHandler} that implements A Write/ReadOnly token-based authentication where all clients share the same tokens
 *
 * @author gmt2001
 */
public class WsSharedRWTokenAuthenticationHandler implements WsAuthenticationHandler {

    /**
     * The authorization token that grants read-only access
     */
    private final String readOnlyToken;
    /**
     * The authorization token that grants read-write access
     */
    private final String readWriteToken;
    /**
     * The maximum allowed auth failure responses before the connection is shut down
     */
    private final int maxAttempts;
    /**
     * An optional callback when a new connection authenticates successfully
     */
    private final Runnable authenticatedCallback;
    /**
     * Whether this instance is allow to authenticate headers against {@link PanelUser}
     */
    private final boolean allowPaneluser;
    /**
     * Represents the {@code ATTR_IS_READ_ONLY} attribute
     */
    public static final AttributeKey<Boolean> ATTR_IS_READ_ONLY = AttributeKey.valueOf("isReadOnly");
    /**
     * Represents the {@code ATTR_AUTH_ATTEMPTS} attribute
     */
    private static final AttributeKey<Integer> ATTR_AUTH_ATTEMPTS = AttributeKey.valueOf("authAttempts");
    /**
     * Represents the {@code ATTR_AUTH_USER} attribute
     */
    public static final AttributeKey<PanelUser> ATTR_AUTH_USER = AttributeKey.valueOf("authUser");

    /**
     * Constructor
     *
     * @param readOnlyToken The authorization token that grants read-only access
     * @param readWriteToken The authorization token that grants read-write access
     * @param maxAttempts The maximum allowed auth failure responses before the connection is shut down
     */
    public WsSharedRWTokenAuthenticationHandler(String readOnlyToken, String readWriteToken, int maxAttempts) {
        this(readOnlyToken, readWriteToken, maxAttempts, null, false);
    }

    /**
     * Constructor
     *
     * @param readOnlyToken The authorization token that grants read-only access
     * @param readWriteToken The authorization token that grants read-write access
     * @param maxAttempts The maximum allowed auth failure responses before the connection is shut down
     * @param allowPaneluser Whether to allow authenticating via HTTP Headers to a {@link PanelUser}
     */
    public WsSharedRWTokenAuthenticationHandler(String readOnlyToken, String readWriteToken, int maxAttempts, boolean allowPaneluser) {
        this(readOnlyToken, readWriteToken, maxAttempts, null, allowPaneluser);
    }

    /**
     * Constructor
     *
     * @param readOnlyToken The authorization token that grants read-only access
     * @param readWriteToken The authorization token that grants read-write access
     * @param maxAttempts The maximum allowed auth failure responses before the connection is shut down
     * @param authenticatedCallback A callback to run when a connection authenticates successfully
     */
    public WsSharedRWTokenAuthenticationHandler(String readOnlyToken, String readWriteToken, int maxAttempts, Runnable authenticatedCallback) {
        this(readOnlyToken, readWriteToken, maxAttempts, authenticatedCallback, false);
    }

    /**
     * Constructor
     *
     * @param readOnlyToken The authorization token that grants read-only access
     * @param readWriteToken The authorization token that grants read-write access
     * @param maxAttempts The maximum allowed auth failure responses before the connection is shut down
     * @param authenticatedCallback A callback to run when a connection authenticates successfully
     * @param allowPaneluser Whether to allow authenticating via HTTP Headers to a {@link PanelUser}
     */
    public WsSharedRWTokenAuthenticationHandler(String readOnlyToken, String readWriteToken, int maxAttempts, Runnable authenticatedCallback, boolean allowPaneluser) {
        this.readOnlyToken = readOnlyToken;
        this.readWriteToken = readWriteToken;
        this.maxAttempts = maxAttempts;
        this.authenticatedCallback = authenticatedCallback;
        this.allowPaneluser = allowPaneluser;
    }

    /**
     * Checks if the given {@link WebSocketFrame} has the correct token and closes the connection after {@link maxAttempts} failed attempts
     *
     * Saves the authorization results in the channel attributes and recalls them to keep the session authorized in subsequent frames
     *
     * If this is an authentication frame, or another frame when authentication already failed, sends a JSON-encoded frame defined as
     * {@code {"authresult": string:"true" or "false", "authtype": string:"none" or "read" or "read/write"}}
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param frame The {@link WebSocketFrame} to check
     * @return, this method will also reply with the appropriate frames to continue the authentication sequence, or an {@code Unauthorized} frame if
     * authentication has been fully attempted and failed
     */
    @Override
    public boolean checkAuthorization(ChannelHandlerContext ctx, WebSocketFrame frame) {
        ctx.channel().attr(ATTR_AUTHENTICATED).setIfAbsent(Boolean.FALSE);
        ctx.channel().attr(ATTR_IS_READ_ONLY).setIfAbsent(Boolean.TRUE);
        ctx.channel().attr(ATTR_SENT_AUTH_REPLY).setIfAbsent(Boolean.FALSE);
        ctx.channel().attr(ATTR_AUTH_ATTEMPTS).setIfAbsent(0);
        ctx.channel().attr(ATTR_AUTH_USER).setIfAbsent(null);

        if (ctx.channel().attr(ATTR_AUTHENTICATED).get() && ctx.channel().attr(ATTR_SENT_AUTH_REPLY).get()) {
            if (ctx.channel().attr(ATTR_AUTH_USER).get() != null && !ctx.channel().attr(ATTR_AUTH_USER).get().isEnabled()) {
                this.invalidateAuthorization(ctx, frame);
                return false;
            }
            return true;
        }

        ctx.channel().attr(ATTR_AUTH_ATTEMPTS).set(ctx.channel().attr(ATTR_AUTH_ATTEMPTS).get() + 1);

        String astr = "";

        if (frame instanceof TextWebSocketFrame) {
            TextWebSocketFrame tframe = (TextWebSocketFrame) frame;

            try {
                JSONObject jso = new JSONObject(tframe.text());

                if (jso.has("authenticate") || jso.has("readauth")) {
                    if (jso.has("authenticate")) {
                        astr = jso.getString("authenticate");
                    }

                    if (jso.has("readauth")) {
                        astr = jso.getString("readauth");
                    }

                    if (ctx.channel().attr(ATTR_AUTH_USER).get() != null) {
                        ctx.channel().attr(ATTR_AUTHENTICATED).set(Boolean.TRUE);
                        ctx.channel().attr(ATTR_SENT_AUTH_REPLY).set(Boolean.TRUE);
                        ctx.channel().attr(ATTR_IS_READ_ONLY).set(Boolean.FALSE);
                    } else if (astr.equals(readWriteToken)) {
                        ctx.channel().attr(ATTR_AUTHENTICATED).set(Boolean.TRUE);
                        ctx.channel().attr(ATTR_IS_READ_ONLY).set(Boolean.FALSE);
                        ctx.channel().attr(ATTR_SENT_AUTH_REPLY).set(Boolean.TRUE);
                    } else if (astr.equals(readOnlyToken)) {
                        ctx.channel().attr(ATTR_AUTHENTICATED).set(Boolean.TRUE);
                        ctx.channel().attr(ATTR_IS_READ_ONLY).set(Boolean.TRUE);
                        ctx.channel().attr(ATTR_SENT_AUTH_REPLY).set(Boolean.TRUE);
                    } else {
                        PanelUser user = PanelUserHandler.checkAuthTokenAndGetUser(astr);
                        if (user != null) {
                            ctx.channel().attr(ATTR_AUTHENTICATED).set(Boolean.TRUE);
                            ctx.channel().attr(ATTR_AUTH_USER).set(user);
                            ctx.channel().attr(ATTR_SENT_AUTH_REPLY).set(Boolean.TRUE);
                            ctx.channel().attr(ATTR_IS_READ_ONLY).set(Boolean.FALSE);
                        }
                    }
                }
            } catch (JSONException ex) {
                com.gmt2001.Console.debug.printStackTrace(ex);
            }
        }

        JSONStringer jsonObject = new JSONStringer();
        String hasAuth = ctx.channel().attr(ATTR_AUTHENTICATED).get() ? "true" : "false";
        String authType = ctx.channel().attr(ATTR_AUTHENTICATED).get() ? (ctx.channel().attr(ATTR_IS_READ_ONLY).get() ? "read" : "read/write") : "none";
        jsonObject.object().key("authresult").value(hasAuth).key("authtype").value(authType).endObject();

        com.gmt2001.Console.debug.println("AuthResult [" + ctx.channel().remoteAddress().toString() + "] " + jsonObject.toString());
        WebSocketFrameHandler.sendWsFrame(ctx, frame, new TextWebSocketFrame(jsonObject.toString()));

        if (!ctx.channel().attr(ATTR_AUTHENTICATED).get()) {
            com.gmt2001.Console.debug.println("wsauthfail");
            com.gmt2001.Console.debug.println("Expected (rw): >" + readWriteToken + "<");
            com.gmt2001.Console.debug.println("Expected (r): >" + readOnlyToken + "<");
            com.gmt2001.Console.debug.println("Got: >" + astr + "<");
            if (ctx.channel().attr(ATTR_AUTH_ATTEMPTS).get() >= maxAttempts) {
                WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareCloseWebSocketFrame(WebSocketCloseStatus.POLICY_VIOLATION));
                ctx.close();
            }
        } else if (this.authenticatedCallback != null) {
            this.authenticatedCallback.run();
        }

        return ctx.channel().attr(ATTR_AUTHENTICATED).get();
    }

    @Override
    public void invalidateAuthorization(ChannelHandlerContext ctx, WebSocketFrame frame) {
        ctx.channel().attr(ATTR_AUTHENTICATED).set(Boolean.FALSE);
        ctx.channel().attr(ATTR_IS_READ_ONLY).set(Boolean.TRUE);
        ctx.channel().attr(ATTR_AUTH_USER).set(null);
    }

    /**
     * Checks if the given {@link HttpHeaders} contains a valid login for a panel user, if enabled
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param headers The {@link HttpHeaders} to check
     * @return {@code true} if authorized
     */
    @Override
    public boolean checkAuthorizationHeaders(ChannelHandlerContext ctx, HttpHeaders headers) {
        if (this.allowPaneluser && PhantomBot.instance().getHTTPPanelAndYTHandler().getAuthHandler().isAuthorized(ctx, headers)) {
            PanelUser user = PanelUserHandler.checkLoginAndGetUserB64(HttpBasicAuthenticationHandler.getAuthorizationString(headers), null);
            if (user != null) {
                ctx.channel().attr(ATTR_AUTHENTICATED).set(Boolean.TRUE);
                ctx.channel().attr(ATTR_AUTH_USER).set(user);
            }
        }

        return false;
    }
}
