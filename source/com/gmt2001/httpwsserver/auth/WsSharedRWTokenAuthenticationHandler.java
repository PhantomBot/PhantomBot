/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketCloseStatus;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import io.netty.util.AttributeKey;
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
     * Represents the {@code ATTR_IS_READ_ONLY} attribute
     */
    public static final AttributeKey<Boolean> ATTR_IS_READ_ONLY = AttributeKey.valueOf("isReadOnly");
    /**
     * Represents the {@code attrAuthAttempts} attribute
     */
    private static final AttributeKey<Integer> ATTR_AUTH_ATTEMPTS = AttributeKey.valueOf("authAttempts");

    /**
     * Constructor
     *
     * @param readOnlyToken The authorization token that grants read-only access
     * @param readWriteToken The authorization token that grants read-write access
     * @param maxAttempts The maximum allowed auth failure responses before the connection is shut down
     */
    public WsSharedRWTokenAuthenticationHandler(String readOnlyToken, String readWriteToken, int maxAttempts) {
        this.readOnlyToken = readOnlyToken;
        this.readWriteToken = readWriteToken;
        this.maxAttempts = maxAttempts;
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
     * @return, this method will also reply with the appropriate
     * frames to continue the authentication sequence, or an {@code Unauthorized} frame if authentication has been fully attempted and failed
     */
    @Override
    public boolean checkAuthorization(ChannelHandlerContext ctx, WebSocketFrame frame) {
        ctx.channel().attr(ATTR_AUTHENTICATED).setIfAbsent(Boolean.FALSE);
        ctx.channel().attr(ATTR_IS_READ_ONLY).setIfAbsent(Boolean.TRUE);
        ctx.channel().attr(ATTR_AUTH_ATTEMPTS).setIfAbsent(0);

        if (ctx.channel().attr(ATTR_AUTHENTICATED).get()) {
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

                    if (astr.equals(readWriteToken)) {
                        ctx.channel().attr(ATTR_AUTHENTICATED).set(Boolean.TRUE);
                        ctx.channel().attr(ATTR_IS_READ_ONLY).set(Boolean.FALSE);
                    } else if (astr.equals(readOnlyToken)) {
                        ctx.channel().attr(ATTR_AUTHENTICATED).set(Boolean.TRUE);
                        ctx.channel().attr(ATTR_IS_READ_ONLY).set(Boolean.TRUE);
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
        ctx.channel().writeAndFlush(new TextWebSocketFrame(jsonObject.toString()));

        if (!ctx.channel().attr(ATTR_AUTHENTICATED).get()) {
            com.gmt2001.Console.debug.println("wsauthfail");
            com.gmt2001.Console.debug.println("Expected (rw): >" + readWriteToken + "<");
            com.gmt2001.Console.debug.println("Expected (r): >" + readOnlyToken + "<");
            com.gmt2001.Console.debug.println("Got: >" + astr + "<");
            if (ctx.channel().attr(ATTR_AUTH_ATTEMPTS).get() >= maxAttempts) {
                WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareCloseWebSocketFrame(WebSocketCloseStatus.POLICY_VIOLATION));
                ctx.close();
            }
        }

        return ctx.channel().attr(ATTR_AUTHENTICATED).get();
    }

    @Override
    public void invalidateAuthorization(ChannelHandlerContext ctx, WebSocketFrame frame) {
        ctx.channel().attr(ATTR_AUTHENTICATED).set(Boolean.FALSE);
        ctx.channel().attr(ATTR_IS_READ_ONLY).set(Boolean.TRUE);
    }
}
