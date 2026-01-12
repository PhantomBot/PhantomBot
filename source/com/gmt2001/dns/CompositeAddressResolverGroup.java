/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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
package com.gmt2001.dns;

import java.net.InetSocketAddress;

import io.netty.channel.EventLoop;
import io.netty.channel.epoll.EpollDatagramChannel;
import io.netty.channel.epoll.EpollSocketChannel;
import io.netty.channel.kqueue.KQueueDatagramChannel;
import io.netty.channel.kqueue.KQueueSocketChannel;
import io.netty.channel.socket.nio.NioDatagramChannel;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.resolver.AddressResolver;
import io.netty.resolver.AddressResolverGroup;
import io.netty.resolver.DefaultNameResolver;
import io.netty.resolver.dns.DnsNameResolver;
import io.netty.resolver.dns.DnsNameResolverBuilder;
import io.netty.resolver.dns.DnsServerAddressStreamProviders;
import io.netty.util.concurrent.EventExecutor;
import io.netty.util.internal.StringUtil;
import io.netty.channel.socket.DatagramChannel;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.ChannelFactory;

/**
 * An {@link AddressResolverGroup} that uses a {@link CompositeInetNameResolver} to service DNS queries
 * <p>
 * The current resolver set used (in preference order) is
 * <ol>
 * <li>{@link DnsNameResolver}, which provides a UDP name resolver implemented within netty</li>
 * <li>{@link DefaultNameResolver}, which uses the operating system's built-in name resolver</li>
 * </ol>
 *
 * @author gmt2001
 */
public final class CompositeAddressResolverGroup extends AddressResolverGroup<InetSocketAddress> {

    /**
     * Instance
     */
    public static final CompositeAddressResolverGroup INSTANCE = new CompositeAddressResolverGroup();
    private final DnsNameResolverBuilder dnsResolverBuilder;

    private CompositeAddressResolverGroup() {
        DnsNameResolverBuilder idnsResolverBuilder = new DnsNameResolverBuilder().nameServerProvider(DnsServerAddressStreamProviders.platformDefault());

        this.dnsResolverBuilder = idnsResolverBuilder;
    }

    @Override
    @SuppressWarnings({"resource"})
    protected AddressResolver<InetSocketAddress> newResolver(EventExecutor executor) throws Exception {
        if (!(executor instanceof EventLoop)) {
            throw new IllegalStateException(
                "unsupported executor type: " + StringUtil.simpleClassName(executor)
                + " (expected: " + StringUtil.simpleClassName(EventLoop.class) + ")"
            );
        }

        DnsNameResolverBuilder builder = this.dnsResolverBuilder.copy();

        // Helper to create ChannelFactory instances for given channel classes
        ChannelFactory<DatagramChannel> nioDatagramFactory = new ChannelFactory<DatagramChannel>() {
            @Override public DatagramChannel newChannel() { return new NioDatagramChannel(); }
        };
        ChannelFactory<SocketChannel> nioSocketFactory = new ChannelFactory<SocketChannel>() {
            @Override public SocketChannel newChannel() { return new NioSocketChannel(); }
        };

        // Try to use native factories only if native transport classes are present and executor looks native
        boolean useEpoll = false;
        boolean useKQueue = false;
        try {
            Class.forName("io.netty.channel.epoll.Epoll");
            useEpoll = true;
        } catch (ClassNotFoundException ignored) {}
        try {
            Class.forName("io.netty.channel.kqueue.KQueue");
            useKQueue = true;
        } catch (ClassNotFoundException ignored) {}

        String execClass = executor.getClass().getName().toLowerCase();

        try {
            if (execClass.contains("nio")) {
                // NIO executor -> use NIO factories
                builder = builder.datagramChannelFactory(nioDatagramFactory).socketChannelFactory(nioSocketFactory);
            } else if (useEpoll && execClass.contains("epoll")) {
                // Epoll available and executor looks epoll -> use epoll factories
                ChannelFactory<DatagramChannel> epollDatagramFactory = new ChannelFactory<DatagramChannel>() {
                    @Override public DatagramChannel newChannel() { return new EpollDatagramChannel(); }
                };
                ChannelFactory<SocketChannel> epollSocketFactory = new ChannelFactory<SocketChannel>() {
                    @Override public SocketChannel newChannel() { return new EpollSocketChannel(); }
                };
                builder = builder.datagramChannelFactory(epollDatagramFactory).socketChannelFactory(epollSocketFactory);
            } else if (useKQueue && execClass.contains("kqueue")) {
                // KQueue available and executor looks kqueue -> use kqueue factories
                ChannelFactory<DatagramChannel> kqueueDatagramFactory = new ChannelFactory<DatagramChannel>() {
                    @Override public DatagramChannel newChannel() { return new KQueueDatagramChannel(); }
                };
                ChannelFactory<SocketChannel> kqueueSocketFactory = new ChannelFactory<SocketChannel>() {
                    @Override public SocketChannel newChannel() { return new KQueueSocketChannel(); }
                };
                builder = builder.datagramChannelFactory(kqueueDatagramFactory).socketChannelFactory(kqueueSocketFactory);
            } else {
                // Default to NIO factories
                builder = builder.datagramChannelFactory(nioDatagramFactory).socketChannelFactory(nioSocketFactory);
            }

            // Build the DNS resolver (this may still throw if something else is wrong)
            DnsNameResolver dnsResolver = builder.eventLoop((EventLoop) executor).build();

            // Composite resolver: prefer DNS resolver, fallback to DefaultNameResolver
            return new CompositeInetNameResolver(executor, dnsResolver, new DefaultNameResolver(executor)).asAddressResolver();

        } catch (Throwable t) {
            // Log and fallback to OS resolver only
            com.gmt2001.Console.err.println("DnsNameResolver build failed: " + t.getClass().getName() + ": " + t.getMessage());
            com.gmt2001.Console.err.printStackTrace(t);

            // Fallback: use DefaultNameResolver only
            return new CompositeInetNameResolver(executor, null, new DefaultNameResolver(executor)).asAddressResolver();
        }
    }
}
