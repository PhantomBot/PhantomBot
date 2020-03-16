/*
 * Copyright (C) 2016-2019 phantombot.tv
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
import org.json.JSONStringer;

/**
 * Provides a {@link WsAuthenticationHandler} that allows all requests
 *
 * @author gmt2001
 */
public class WsNoAuthenticationHandler implements WsAuthenticationHandler {

    /**
     * An instance of {@link WsNoAuthenticationHandler}
     */
    private static WsNoAuthenticationHandler INSTANCE;

    /**
     * Represents the {@code attrSentAuthReply} attribute
     */
    private static final AttributeKey<Boolean> ATTR_SENT_AUTH_REPLY = AttributeKey.valueOf("sentAuthReply");

    /**
     * Gets a handler instance
     *
     * @return An instance of {@link WsNoAuthenticationHandler}
     */
    public static synchronized WsNoAuthenticationHandler instance() {
        if (INSTANCE == null) {
            INSTANCE = new WsNoAuthenticationHandler();
        }

        return INSTANCE;
    }

    /**
     * Always returns {@code true}, since this handler is for No Authentication
     *
     * Sends a read-only authentication successful frame on the first received frame from the client, defined as
     * {@code {"authresult": string:"true", "authtype": string:"read"}}
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param req The {@link WebSocketFrame} of the request
     * @return {@code true}
     */
    @Override
    public boolean checkAuthorization(ChannelHandlerContext ctx, WebSocketFrame req) {
        ctx.channel().attr(ATTR_SENT_AUTH_REPLY).setIfAbsent(Boolean.FALSE);
        ctx.channel().attr(ATTR_AUTHENTICATED).setIfAbsent(Boolean.TRUE);

        if (!ctx.channel().attr(ATTR_SENT_AUTH_REPLY).get()) {
            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object().key("authresult").value("true").key("authtype").value("read").endObject();

            ctx.channel().writeAndFlush(new TextWebSocketFrame(jsonObject.toString()));

            ctx.channel().attr(ATTR_SENT_AUTH_REPLY).set(Boolean.TRUE);
        }

        return true;
    }

    @Override
    public void invalidateAuthorization(ChannelHandlerContext ctx, WebSocketFrame frame) {
        throw new UnsupportedOperationException("Not supported by this authentication handler.");
    }
}
