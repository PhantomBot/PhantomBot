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

import java.time.Duration;
import java.util.function.Predicate;
import java.util.function.Supplier;

import com.gmt2001.wsclient.WSClient;
import com.gmt2001.wsclient.WsClientFrameHandler;

import io.netty.handler.codec.http.websocketx.WebSocketCloseStatus;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;

/**
 * Pings the remote endpoint of a {@link WSClient} periodically; closes the socket if a PONG is not received after a
 * defined number of PING attempts
 *
 * @author gmt2001
 */
public final class WSClientPinger extends WSPinger implements WsClientFrameHandler {

    /**
     * The {@link WSClient} that this pinger is connected to
     */
    private WSClient client = null;

    /**
     * Constructor that uses RFC6455 PING/PONG frames
     *
     * @param interval A {@link Duration} indicating the interval at which to send PING frames
     * @param timeout A {@link Duration} indicating the timeout during which a PONG must be received before the PING fails
     * @param failureLimit The number of timeouts before the connection is considered failing and is closed
     * @throws IllegalArgumentException interval or timeout was less than 5 seconds; failureLimit was less than 1
     */
    public WSClientPinger(Duration interval, Duration timeout, int failureLimit) {
        super(interval, timeout, failureLimit);
    }

    /**
     * Constructor
     *
     * @param interval A {@link Duration} indicating the interval at which to send PING frames
     * @param timeout A {@link Duration} indicating the timeout during which a PONG must be received before the PING fails
     * @param failureLimit The number of timeouts before the connection is considered failing and is closed
     * @param pingFrameFactory A factory method that emits a {@link WebSocketFrame} that can be sent as a PING
     * @param pongParser A method that determines if a given frame is a valid PONG
     * @throws IllegalArgumentException interval or timeout was less than 5 seconds; failureLimit was less than 1; Any value was null
     */
    public WSClientPinger(Duration interval, Duration timeout, int failureLimit,
            Supplier<WebSocketFrame> pingFrameFactory, Predicate<WebSocketFrame> pongParser) {
        super(interval, timeout, failureLimit, pingFrameFactory, pongParser);
    }

    /**
     * Constructor
     *
     * @param interval A {@link Duration} indicating the interval at which to send PING frames
     * @param timeout A {@link Duration} indicating the timeout during which a PONG must be received before the PING fails
     * @param failureLimit The number of timeouts before the connection is considered failing and is closed
     * @param supplierPredicate An object implementing both the PING supplier and the PONG predicate. Defaults to {@link RFC6455PingPong} if
     * {@code null}
     * @throws IllegalArgumentException interval or timeout was less than 5 seconds; failureLimit was less than 1; Any value was null
     */
    public WSClientPinger(Duration interval, Duration timeout, int failureLimit,
            PingPongSupplierPredicate supplierPredicate) {
        super(interval, timeout, failureLimit, supplierPredicate);
    }

    @Override
    public boolean connected() {
        return this.client != null && this.client.connected();
    }

    /**
     * Stores the {@link WSClient} that this pinger is linked to
     *
     * @param client
     */
    public void setClient(WSClient client) {
        synchronized (this.lock) {
            this.client = client;
        }
    }

    @Override
    protected void send(WebSocketFrame frame) {
        this.client.send(frame);
    }

    @Override
    protected void close(WebSocketCloseStatus status, String reason) {
        this.client.close(status, reason);
    }
}
