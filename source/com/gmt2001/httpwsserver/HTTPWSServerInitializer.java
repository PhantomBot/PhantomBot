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
package com.gmt2001.httpwsserver;

import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import io.netty.handler.codec.http.websocketx.extensions.compression.WebSocketServerCompressionHandler;
import io.netty.handler.ssl.OptionalSslHandler;
import io.netty.handler.ssl.SslContext;

/**
 * Initializes {@link SocketChannel} objects for a {@link HTTPWSServer}
 *
 * @author gmt2001
 */
class HTTPWSServerInitializer extends ChannelInitializer<SocketChannel> {

    /**
     * The SSL context to use
     */
    private final SslContext sslCtx;

    /**
     * Constructor
     *
     * @param sslCtx Either {@code null} or a prepared {@link SslContext}
     */
    public HTTPWSServerInitializer(SslContext sslCtx) {
        super();
        this.sslCtx = sslCtx;
    }

    /**
     * Initializes the {@link SocketChannel}
     *
     * @param ch The {@link SocketChannel} to initialize
     * @throws Exception Passes any thrown exceptions up the stack
     */
    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        ChannelPipeline pipeline = ch.pipeline();

        if (sslCtx != null) {
            pipeline.addLast(new HttpOptionalSslHandler(sslCtx));
        }

        pipeline.addLast(new HttpServerCodec());
        pipeline.addLast(new HttpObjectAggregator(65536));
        pipeline.addLast(new WebSocketServerCompressionHandler());
        pipeline.addLast(new WebSocketServerProtocolHandler("/ws", null, true, 65536, false, true));
        pipeline.addLast("pagehandler", new HttpServerPageHandler());
        pipeline.addLast("wshandler", new WebSocketFrameHandler());
    }
}
