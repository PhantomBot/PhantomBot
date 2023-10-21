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

import org.json.JSONObject;

import com.gmt2001.httpwsserver.HttpRequestHandler;
import com.gmt2001.httpwsserver.WsFrameHandler;

import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.websocketx.PongWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;

public abstract class WsWithLongPollHandler implements HttpRequestHandler, WsFrameHandler {
    /**
     * The cache of {@link Client}
     */
    protected final ClientCache clientCache;

    @Override
    public void handleRequest(ChannelHandlerContext ctx, FullHttpRequest req) {
    }

    @Override
    public void handleFrame(ChannelHandlerContext ctx, WebSocketFrame frame) {
        if (frame instanceof PongWebSocketFrame) {
            this.clientCache.pong(ctx);
        }
    }

    public abstract void handleMessage(JSONObject jso);
}
