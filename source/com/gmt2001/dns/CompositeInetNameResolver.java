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
import java.util.Arrays;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * A composite {@link AddressResolver} that resolves a host name against a sequence of {@link AddressResolver}s.
 *
 * In case of a failure, only the last one will be reported.
 */
public final class CompositeInetNameResolver extends InetNameResolver {

    private final InetNameResolver[] resolvers;
    private static final Logger logger = Logger.getLogger(CompositeInetNameResolver.class.getName());

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
        doResolveRec(inetHost, promise, 0, null);
    }

    private void doResolveRec(final String inetHost,
            final Promise<InetAddress> promise,
            final int resolverIndex,
            Throwable lastFailure) throws Exception {
        if (resolverIndex >= resolvers.length) {
            logger.log(Level.FINE, "DNS Query Failed [{0}]: {1}", new Object[]{inetHost, lastFailure.toString()});
            promise.setFailure(lastFailure);
        } else {
            InetNameResolver resolver = resolvers[resolverIndex];
            logger.log(Level.FINE, "DNS Query [{0}]: {1}", new Object[]{inetHost, resolver.getClass().getName()});
            resolver.resolve(inetHost).addListener((FutureListener<InetAddress>) (Future<InetAddress> future) -> {
                if (future.isSuccess()) {
                    promise.setSuccess(future.getNow());
                } else {
                    doResolveRec(inetHost, promise, resolverIndex + 1, future.cause());
                }
            });
        }
    }

    @Override
    protected void doResolveAll(String inetHost, Promise<List<InetAddress>> promise) throws Exception {
        doResolveAllRec(inetHost, promise, 0, null);
    }

    private void doResolveAllRec(final String inetHost,
            final Promise<List<InetAddress>> promise,
            final int resolverIndex,
            Throwable lastFailure) throws Exception {
        if (resolverIndex >= resolvers.length) {
            logger.log(Level.FINE, "DNS Query Failed [{0}]: {1}", new Object[]{inetHost, lastFailure.toString()});
            promise.setFailure(lastFailure);
        } else {
            InetNameResolver resolver = resolvers[resolverIndex];
            logger.log(Level.FINE, "DNS Query [{0}]: {1}", new Object[]{inetHost, resolver.getClass().getName()});
            resolver.resolveAll(inetHost).addListener((FutureListener<List<InetAddress>>) (Future<List<InetAddress>> future) -> {
                if (future.isSuccess()) {
                    promise.setSuccess(future.getNow());
                } else {
                    doResolveAllRec(inetHost, promise, resolverIndex + 1, future.cause());
                }
            });
        }
    }
}
