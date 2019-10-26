/*
 * Copyright (C) 2016-2018 phantombot.tv
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

import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
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
     * Represents the {@code authenticated} attribute
     */
    private final AttributeKey<Boolean> authenticated = AttributeKey.valueOf("authenticated");
    /**
     * Represents the {@code isReadOnly} attribute
     */
    private final AttributeKey<Boolean> isReadOnly = AttributeKey.valueOf("isReadOnly");
    /**
     * Represents the {@code authAttempts} attribute
     */
    private final AttributeKey<Integer> authAttempts = AttributeKey.valueOf("authAttempts");;

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
     * @return {@code true} if authenticated, {@code false} otherwise. When returning {@code false}, this method will also reply with the appropriate
     * frames to continue the authentication sequence, or and {@code Unauthorized} frame if authentication has been fully attempted and failed
     */
    @Override
    public boolean checkAuthorization(ChannelHandlerContext ctx, WebSocketFrame frame) {
        ctx.channel().attr(authenticated).setIfAbsent(Boolean.FALSE);
        ctx.channel().attr(isReadOnly).setIfAbsent(Boolean.TRUE);
        ctx.channel().attr(authAttempts).setIfAbsent(0);

        if (ctx.channel().attr(authenticated).get()) {
            return true;
        }
        
        ctx.channel().attr(authAttempts).set(ctx.channel().attr(authAttempts).get() + 1);
        
        if (frame instanceof TextWebSocketFrame) {
            TextWebSocketFrame tframe = (TextWebSocketFrame) frame;

            try {
                JSONObject jso = new JSONObject(tframe.text());

                if (jso.has("authenticate")) {
                    if (jso.getString("authenticated").equals(readWriteToken)) {
                        ctx.channel().attr(authenticated).set(Boolean.TRUE);
                        ctx.channel().attr(isReadOnly).set(Boolean.FALSE);
                    } else if (jso.getString("authenticated").equals(readOnlyToken)) {
                        ctx.channel().attr(authenticated).set(Boolean.TRUE);
                        ctx.channel().attr(isReadOnly).set(Boolean.TRUE);
                    }
                }
            } catch (JSONException ex) {
                com.gmt2001.Console.debug.printStackTrace(ex);
            }
        }

        JSONStringer jsonObject = new JSONStringer();
        String hasAuth = ctx.channel().attr(authenticated).get() ? "true" : "false";
        String authType = ctx.channel().attr(authenticated).get() ? (ctx.channel().attr(isReadOnly).get() ? "read" : "read/write") : "none";
        jsonObject.object().key("authresult").value(hasAuth).key("authtype").value(authType).endObject();

        ctx.channel().writeAndFlush(new TextWebSocketFrame(jsonObject.toString()));
        
        if (!ctx.channel().attr(authenticated).get() && ctx.channel().attr(authAttempts).get() >= maxAttempts) {
            ctx.close();
        }
        
        return ctx.channel().attr(authenticated).get();
    }

    /**
     * Checks if the given {@link ChannelHandlerContext} has a read-only authorization
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @return {@code true} if authenticated as read-only, {@code false} otherwise
     */
    public boolean isReadOnly(ChannelHandlerContext ctx) {
        ctx.channel().attr(isReadOnly).setIfAbsent(Boolean.TRUE);
        return ctx.channel().attr(isReadOnly).get();
    }

}
