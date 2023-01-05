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
 /*
 * Copyright 2015 The Netty Project
 *
 * The Netty Project licenses this file to you under the Apache License,
 * version 2.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
package com.gmt2001.dns;

import io.netty.resolver.AddressResolver;
import io.netty.resolver.InetNameResolver;
import io.netty.resolver.NameResolver;
import io.netty.util.concurrent.EventExecutor;
import io.netty.util.concurrent.Future;
import io.netty.util.concurrent.FutureListener;
import io.netty.util.concurrent.Promise;
import io.netty.util.internal.ObjectUtil;
import static io.netty.util.internal.ObjectUtil.checkNotNull;
import java.net.InetAddress;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeoutException;
import java.util.logging.Level;
import java.util.logging.Logger;
import reactor.core.publisher.Mono;
import tv.phantombot.CaselessProperties;

/**
 * A composite {@link AddressResolver} that resolves a host name against a sequence of {@link AddressResolver}s.
 *
 * In case of a failure, only the last one will be reported.
 *
 * Has a 2 second timeout before greedily starting the next available resolver. Starts at the first resolver to return success from the last query
 * within 120 minutes.
 *
 * @author The Netty Team
 * @author gmt2001
 */
public final class CompositeInetNameResolver extends InetNameResolver {

    private static final Duration TIMEOUT = Duration.ofSeconds(2);
    private static final Duration TIMEOUT_RESET = Duration.ofMinutes(120);
    private final InetNameResolver[] resolvers;
    private static final Logger logger = Logger.getLogger(CompositeInetNameResolver.class.getName());
    private int lastSuccessfulResolver = 0;
    private Instant lastTimeout = Instant.MIN;

    /**
     * @param executor the {@link EventExecutor} which is used to notify the listeners of the {@link Future} returned by {@link #resolve(String)}
     * @param resolvers the {@link NameResolver}s to be tried sequentially
     */
    public CompositeInetNameResolver(EventExecutor executor, InetNameResolver... resolvers) {
        super(executor);
        checkNotNull(resolvers, "resolvers");
        for (int i = 0; i < resolvers.length; i++) {
            ObjectUtil.checkNotNull(resolvers[i], "resolvers[" + i + ']');
        }
        if (resolvers.length < 2) {
            throw new IllegalArgumentException("resolvers: " + Arrays.asList(resolvers)
                    + " (expected: at least 2 resolvers)");
        }
        this.resolvers = resolvers.clone();
    }

    @Override
    protected void doResolve(String inetHost, Promise<InetAddress> promise) throws Exception {
        /**
         * @botproperty dnsdebug - If `true`, prints debugging info about DNS resolution to the debug log. Default `false`
         * @botpropertycatsort dnsdebug 800 900 Debug
         */
        if (CaselessProperties.instance().getPropertyAsBoolean("dnsdebug", false)) {
            com.gmt2001.Console.debug.println("DNS Query: " + inetHost);
        }
        this.doResolveRec(inetHost, promise, -1, -1, null);
    }

    private void doResolveRec(final String inetHost,
            final Promise<InetAddress> promise,
            final int resolverIndexIn,
            int resolverFirstIndexIn,
            Throwable lastFailure) throws Exception {
        final int resolverIndex = this.getNextResolver(resolverIndexIn, resolverFirstIndexIn);
        final int resolverFirstIndex;
        if (resolverIndexIn == -1) {
            resolverFirstIndex = resolverIndex;
        } else {
            resolverFirstIndex = resolverFirstIndexIn;
        }
        if (resolverIndex == -2) {
            if (CaselessProperties.instance().getPropertyAsBoolean("dnsdebug", false)) {
                com.gmt2001.Console.debug.println("DNS Failed: " + inetHost);
            }
            logger.log(Level.FINE, "DNS Query Failed [{0}]: {1}", new Object[]{inetHost, lastFailure.toString()});
            this.failure(promise, lastFailure);
        } else {
            InetNameResolver resolver = this.resolvers[resolverIndex];
            if (CaselessProperties.instance().getPropertyAsBoolean("dnsdebug", false)) {
                com.gmt2001.Console.debug.println("DNS Resolver " + resolverIndex + ": " + inetHost);
            }
            logger.log(Level.FINE, "DNS Query [{0}]: {1}", new Object[]{inetHost, resolver.getClass().getName()});
            Future<InetAddress> f = resolver.resolve(inetHost).addListener((FutureListener<InetAddress>) (Future<InetAddress> future) -> {
                if (future.isSuccess()) {
                    if (CaselessProperties.instance().getPropertyAsBoolean("dnsdebug", false)) {
                        com.gmt2001.Console.debug.println("DNS Success: " + inetHost);
                    }
                    this.success(promise, future.getNow(), resolverIndex);
                } else {
                    if (CaselessProperties.instance().getPropertyAsBoolean("dnsdebug", false)) {
                        com.gmt2001.Console.debug.println("DNS Exception: " + inetHost);
                        com.gmt2001.Console.debug.printStackTrace(future.cause());
                    }
                    this.doResolveRec(inetHost, promise, resolverIndex + 1, resolverFirstIndex, future.cause());
                }
            });
            Mono.delay(TIMEOUT).doOnNext(l -> {
                if (!promise.isDone() && !f.isDone() && this.getNextResolver(resolverIndex + 1, resolverFirstIndex) != -2) {
                    try {
                        if (CaselessProperties.instance().getPropertyAsBoolean("dnsdebug", false)) {
                            com.gmt2001.Console.debug.println("DNS Timeout: " + inetHost);
                        }
                        this.doResolveRec(inetHost, promise, resolverIndex + 1, resolverFirstIndex, new TimeoutException("All resolvers exceeded the timeout of " + TIMEOUT.toString()));
                    } catch (Exception ex) {
                        if (CaselessProperties.instance().getPropertyAsBoolean("dnsdebug", false)) {
                            com.gmt2001.Console.debug.println("DNS Mono Exception: " + inetHost);
                            com.gmt2001.Console.debug.printStackTrace(ex);
                        }
                        logger.log(Level.FINE, "DNS Query Threw [{0}]: {1}", new Object[]{inetHost, ex.toString()});
                    }
                }
            }).subscribe();
        }
    }

    private synchronized void success(final Promise<InetAddress> promise, final InetAddress address, int idx) {
        if (!promise.isDone()) {
            promise.setSuccess(address);
            this.setSuccessfulResolver(idx);
        }
    }

    private synchronized void failure(final Promise<InetAddress> promise, final Throwable cause) {
        if (!promise.isDone()) {
            promise.setFailure(cause);
        }
    }

    @Override
    protected void doResolveAll(String inetHost, Promise<List<InetAddress>> promise) throws Exception {
        if (CaselessProperties.instance().getPropertyAsBoolean("dnsdebug", false)) {
            com.gmt2001.Console.debug.println("DNS All Query: " + inetHost);
        }
        this.doResolveAllRec(inetHost, promise, -1, -1, null);
    }

    private void doResolveAllRec(final String inetHost,
            final Promise<List<InetAddress>> promise,
            final int resolverIndexIn,
            final int resolverFirstIndexIn,
            Throwable lastFailure) throws Exception {
        final int resolverIndex = this.getNextResolver(resolverIndexIn, resolverFirstIndexIn);
        final int resolverFirstIndex;
        if (resolverIndexIn == -1) {
            resolverFirstIndex = resolverIndex;
        } else {
            resolverFirstIndex = resolverFirstIndexIn;
        }
        if (resolverIndex == -2) {
            if (CaselessProperties.instance().getPropertyAsBoolean("dnsdebug", false)) {
                com.gmt2001.Console.debug.println("DNS All Failed: " + inetHost);
            }
            logger.log(Level.FINE, "DNS Query Failed [{0}]: {1}", new Object[]{inetHost, lastFailure.toString()});
            this.failureAll(promise, lastFailure);
        } else {
            InetNameResolver resolver = this.resolvers[resolverIndex];
            if (CaselessProperties.instance().getPropertyAsBoolean("dnsdebug", false)) {
                com.gmt2001.Console.debug.println("DNS All Resolver " + resolverIndex + ": " + inetHost);
            }
            logger.log(Level.FINE, "DNS Query [{0}]: {1}", new Object[]{inetHost, resolver.getClass().getName()});
            Future<List<InetAddress>> f = resolver.resolveAll(inetHost).addListener((FutureListener<List<InetAddress>>) (Future<List<InetAddress>> future) -> {
                if (future.isSuccess()) {
                    if (CaselessProperties.instance().getPropertyAsBoolean("dnsdebug", false)) {
                        com.gmt2001.Console.debug.println("DNS All Success: " + inetHost);
                    }
                    this.successAll(promise, future.getNow(), resolverIndex);
                } else {
                    if (CaselessProperties.instance().getPropertyAsBoolean("dnsdebug", false)) {
                        com.gmt2001.Console.debug.println("DNS All Exception: " + inetHost);
                        com.gmt2001.Console.debug.printStackTrace(future.cause());
                    }
                    this.doResolveAllRec(inetHost, promise, resolverIndex + 1, resolverFirstIndex, future.cause());
                }
            });
            Mono.delay(TIMEOUT).doOnNext(l -> {
                if (!promise.isDone() && !f.isDone() && this.getNextResolver(resolverIndex + 1, resolverFirstIndex) != -2) {
                    try {
                        if (CaselessProperties.instance().getPropertyAsBoolean("dnsdebug", false)) {
                            com.gmt2001.Console.debug.println("DNS All Timeout: " + inetHost);
                        }
                        this.doResolveAllRec(inetHost, promise, resolverIndex + 1, resolverFirstIndex, new TimeoutException("All resolvers exceeded the timeout of " + TIMEOUT.toString()));
                    } catch (Exception ex) {
                        if (CaselessProperties.instance().getPropertyAsBoolean("dnsdebug", false)) {
                            com.gmt2001.Console.debug.println("DNS All Mono Exception: " + inetHost);
                            com.gmt2001.Console.debug.printStackTrace(ex);
                        }
                        logger.log(Level.FINE, "DNS Query Threw [{0}]: {1}", new Object[]{inetHost, ex.toString()});
                    }
                }
            }).subscribe();
        }
    }

    private synchronized void successAll(final Promise<List<InetAddress>> promise, final List<InetAddress> addresses, int idx) {
        if (!promise.isDone()) {
            promise.setSuccess(addresses);
            this.setSuccessfulResolver(idx);
        }
    }

    private synchronized void failureAll(final Promise<List<InetAddress>> promise, final Throwable cause) {
        if (!promise.isDone()) {
            promise.setFailure(cause);
        }
    }

    private synchronized int getNextResolver(int idx, int firstIdx) {
        if (idx == -1) {
            if (this.lastSuccessfulResolver != 0 && this.lastTimeout.isBefore(Instant.now())) {
                this.lastSuccessfulResolver = 0;
                this.lastTimeout = Instant.MIN;
            }

            return this.lastSuccessfulResolver;
        }

        if (idx >= this.resolvers.length) {
            idx = 0;
        }

        if (idx == firstIdx) {
            return -2;
        }

        return idx;
    }

    private synchronized void setSuccessfulResolver(int idx) {
        this.lastSuccessfulResolver = idx;

        if (!this.lastTimeout.equals(Instant.MIN)) {
            if (idx == 0) {
                this.lastTimeout = Instant.MIN;
            }
        } else if (idx != 0) {
            this.lastTimeout = Instant.now().plus(TIMEOUT_RESET);
        }
    }
}
