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
package com.gmt2001.wspinger;

import io.netty.buffer.Unpooled;
import io.netty.handler.codec.http.websocketx.PingWebSocketFrame;
import io.netty.handler.codec.http.websocketx.PongWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;

/**
 * Supplier and Predicate for RFC6455 PING/PONG frames
 *
 * @author gmt2001
 */
public class RFC6455PingPong implements PingPongSupplierPredicate {

    /**
     * An incrementing counter used as a unique payload
     */
    private long payload = 0L;

    @Override
    public WebSocketFrame get() {
        this.payload++;

        if (this.payload > Long.MAX_VALUE - 5) {
            this.payload = 1L;
        }

        return new PingWebSocketFrame(Unpooled.copiedBuffer(Long.toString(this.payload).getBytes()));
    }

    @Override
    public boolean test(WebSocketFrame t) {
        return t instanceof PongWebSocketFrame;
    }
}
