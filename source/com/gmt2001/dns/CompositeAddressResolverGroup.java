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
package com.gmt2001.dns;

import io.netty.channel.EventLoop;
import io.netty.channel.epoll.EpollDatagramChannel;
import io.netty.channel.epoll.EpollSocketChannel;
import io.netty.channel.kqueue.KQueueDatagramChannel;
import io.netty.channel.kqueue.KQueueSocketChannel;
import io.netty.channel.nio.NioEventLoop;
import io.netty.channel.socket.nio.NioDatagramChannel;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.resolver.AddressResolver;
import io.netty.resolver.AddressResolverGroup;
import io.netty.resolver.DefaultNameResolver;
import io.netty.resolver.dns.DnsNameResolverBuilder;
import io.netty.resolver.dns.DnsServerAddressStreamProviders;
import io.netty.util.concurrent.EventExecutor;
import io.netty.util.internal.StringUtil;
import java.net.InetSocketAddress;

/**
 * An {@link AddressResolverGroup} that uses a {@link CompositeInetNameResolver} to service DNS queries
 *
 * @author gmt2001
 */
public final class CompositeAddressResolverGroup extends AddressResolverGroup<InetSocketAddress> {

    public static final CompositeAddressResolverGroup INSTANCE = new CompositeAddressResolverGroup();
    private final DnsNameResolverBuilder dnsResolverBuilder;

    private CompositeAddressResolverGroup() {
        DnsNameResolverBuilder idnsResolverBuilder = new DnsNameResolverBuilder().nameServerProvider(DnsServerAddressStreamProviders.platformDefault());

        this.dnsResolverBuilder = idnsResolverBuilder;
    }

    @Override
    protected AddressResolver<InetSocketAddress> newResolver(EventExecutor executor) throws Exception {
        if (!(executor instanceof EventLoop)) {
            throw new IllegalStateException(
                    "unsupported executor type: " + StringUtil.simpleClassName(executor)
                    + " (expected: " + StringUtil.simpleClassName(EventLoop.class));
        }

        DnsNameResolverBuilder odnsResolverBuilder = this.dnsResolverBuilder.copy();

        if (executor instanceof NioEventLoop) {
            odnsResolverBuilder = odnsResolverBuilder.channelType(NioDatagramChannel.class).socketChannelType(NioSocketChannel.class);
        } else if (EventLoopDetector.ISEPOLLAVAILABLE) {
            odnsResolverBuilder = odnsResolverBuilder.channelType(EpollDatagramChannel.class).socketChannelType(EpollSocketChannel.class);
        } else if (EventLoopDetector.ISKQUEUEAVAILABLE) {
            odnsResolverBuilder = odnsResolverBuilder.channelType(KQueueDatagramChannel.class).socketChannelType(KQueueSocketChannel.class);
        }

        return new CompositeInetNameResolver(executor, odnsResolverBuilder.eventLoop((EventLoop) executor).build(), new DefaultNameResolver(executor)).asAddressResolver();
    }
}
