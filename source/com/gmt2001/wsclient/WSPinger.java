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
package com.gmt2001.wsclient;

import com.gmt2001.ExecutorService;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.PingWebSocketFrame;
import io.netty.handler.codec.http.websocketx.PongWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketCloseStatus;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import tv.phantombot.CaselessProperties;

/**
 * Pings the remote endpoint using an RFC6455 PING frame periodically; closes the socket if a PONG is not received after a defined number of PING
 * attempts
 *
 * @author gmt2001
 */
public class WSPinger implements WsClientFrameHandler {

    /**
     * An incrementing counter used as a unique payload
     */
    private long payload = 1L;
    /**
     * The current number of failures
     */
    private int failureCount;
    /**
     * The last time a PONG was received
     */
    private Instant lastPong;
    /**
     * The {@link Future} for the timer
     */
    private Future timerFuture = null;
    /**
     * The {@link Future} representing the failure timer
     */
    private Future failureFuture = null;
    /**
     * The interval for the ping timer
     */
    private final Duration interval;
    /**
     * The timeout during which a PONG must be received before the PING fails
     */
    private final Duration timeout;
    /**
     * The number of timeouts before the connection is considered failing and is closed
     */
    private final int failureLimit;
    /**
     * Mutex
     */
    private final Object lock = new Object();
    /**
     * The {@link WSClient} that this pinger is connected to
     */
    private WSClient client = null;
    /**
     * Remote address for debug messages
     */
    private String remote = "";

    /**
     * Constructor
     *
     * @param interval A {@link Duration} indicating the interval at which to send PING frames
     * @param timeout A {@link Duration} indicating the timeout during which a PONG must be received before the PING fails
     * @param failureLimit The number of timeouts before the connection is considered failing and is closed
     * @throws IllegalArgumentException interval or timeout was less than 5 seconds; failureLimit was less than 1
     */
    public WSPinger(Duration interval, Duration timeout, int failureLimit) {
        if (interval.isZero() || interval.isNegative() || interval.toSeconds() < 5) {
            throw new IllegalArgumentException("interval must be at least 5 seconds");
        }

        if (timeout.isZero() || timeout.isNegative() || timeout.toSeconds() < 5) {
            throw new IllegalArgumentException("timeout must be at least 5 seconds");
        }

        if (failureLimit < 1) {
            throw new IllegalArgumentException("failureLimit must be at least 1");
        }

        this.interval = interval;
        this.timeout = timeout;
        this.failureLimit = failureLimit;
    }

    /**
     * Passed received {@link PongWebSocketFrame} to {@link #receivedPong()}
     *
     * @param ctx
     * @param frame
     */
    @Override
    public void handleFrame(ChannelHandlerContext ctx, WebSocketFrame frame) {
        if (frame instanceof PongWebSocketFrame) {
            this.receivedPong();
        }
    }

    /**
     * Initializes failureCount and lastPong, then starts the ping timer
     *
     * @param ctx
     */
    @Override
    public void handshakeComplete(ChannelHandlerContext ctx) {
        this.onClose();
        synchronized (lock) {
            this.failureCount = 0;
            this.lastPong = Instant.now();
            this.timerFuture = ExecutorService.scheduleAtFixedRate(this::sendPing, this.interval.toMillis(), this.interval.toMillis(), TimeUnit.MILLISECONDS);
            /**
             * @botproperty wspingerdebug - If `true`, prints debug messages for active WSPinger instances. Default `false`
             */
            if (CaselessProperties.instance().getPropertyAsBoolean("wspingerdebug", false)) {
                this.remote = ctx.channel().remoteAddress().toString();
                com.gmt2001.Console.debug.println("Pinger Started: Remote[" + this.remote + "]");
            }
        }
    }

    /**
     * Cancels future execution of the timers when the socket closes
     */
    @Override
    public void onClose() {
        synchronized (lock) {
            if (this.timerFuture != null && !this.timerFuture.isCancelled() && !this.timerFuture.isDone()) {
                this.timerFuture.cancel(true);
            }

            if (this.failureFuture != null && !this.failureFuture.isCancelled() && !this.failureFuture.isDone()) {
                this.failureFuture.cancel(true);
            }

            if (CaselessProperties.instance().getPropertyAsBoolean("wspingerdebug", false)) {
                com.gmt2001.Console.debug.println("Pinger Stopped: Remote[" + this.remote + "]");
            }
        }
    }

    /**
     * Stores the {@link WSClient} that this pinger is linked to
     *
     * @param client
     */
    void setClient(WSClient client) {
        this.client = client;
    }

    /**
     * Cancels the failure timer, then logs the current time in lastPong and resets the failureCount
     */
    private void receivedPong() {
        synchronized (lock) {
            if (this.failureFuture != null && !this.failureFuture.isCancelled() && !this.failureFuture.isDone()) {
                this.failureFuture.cancel(true);
            }

            this.lastPong = Instant.now();
            this.failureCount = 0;

            if (CaselessProperties.instance().getPropertyAsBoolean("wspingerdebug", false)) {
                com.gmt2001.Console.debug.println("Received RFC6455 PONG: Remote[" + this.remote + "]");
            }
        }
    }

    /**
     * When the failure timer fires, increases the failureCount if lastPong is more than {@code timeout - 1} ms ago; if failureCount is then greater
     * than or equal to failureLimit, closes the socket with a {@link WebSocketCloseStatus.POLICY_VIOLATION}; No-op if the timerFuture is null, done,
     * or canceled
     */
    private void checkPongFailure() {
        synchronized (lock) {
            if (this.timerFuture != null && !this.timerFuture.isCancelled() && !this.timerFuture.isDone()) {
                if (Instant.now().minus(this.timeout).plusMillis(1).isAfter(this.lastPong)) {
                    this.failureCount++;

                    if (CaselessProperties.instance().getPropertyAsBoolean("wspingerdebug", false)) {
                        com.gmt2001.Console.debug.println("Failed to receive RFC6455 PONG: Remote[" + this.remote + "] failureCount[" + this.failureCount + "]");
                    }
                }

                if (this.failureCount >= this.failureLimit) {
                    this.client.close(WebSocketCloseStatus.POLICY_VIOLATION, "PING failure limit exceeded");

                    if (CaselessProperties.instance().getPropertyAsBoolean("wspingerdebug", false)) {
                        com.gmt2001.Console.debug.println("Failure limit reached: Remote[" + this.remote + "] failureLimit[" + this.failureLimit + "]");
                    }
                }
            }
        }
    }

    /**
     * Sends an RFC6455 PING frame with the value of payload, then starts the failure timer, increases the payload for the next frame, and ensures
     * payload won't overflow {@link Long.MAX_VALUE}. No-op if client is {@code null}, {@link WSClient.connected()} is {@code false}, or the
     * timerFuture is null, done, or canceled
     */
    private void sendPing() {
        synchronized (lock) {
            if (this.client != null && this.client.connected() && this.timerFuture != null && !this.timerFuture.isCancelled() && !this.timerFuture.isDone()) {
                this.client.send(new PingWebSocketFrame(Unpooled.copiedBuffer(Long.toString(this.payload).getBytes())));
                this.failureFuture = ExecutorService.schedule(this::checkPongFailure, this.timeout.toMillis(), TimeUnit.MILLISECONDS);

                if (CaselessProperties.instance().getPropertyAsBoolean("wspingerdebug", false)) {
                    com.gmt2001.Console.debug.println("Sent a RFC6455 PING: Remote[" + this.remote + "] Payload[" + this.payload + "]");
                }

                this.payload++;
                if (this.payload > Long.MAX_VALUE - 5) {
                    this.payload = 1L;
                }
            }
        }
    }
}
