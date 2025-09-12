/*
 * Copyright (C) 2016-2025 phantombot.github.io/PhantomBot
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

import io.netty.channel.Channel;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.ServerChannel;
import io.netty.channel.epoll.Epoll;
import io.netty.channel.epoll.EpollEventLoopGroup;
import io.netty.channel.epoll.EpollServerSocketChannel;
import io.netty.channel.epoll.EpollSocketChannel;
import io.netty.channel.kqueue.KQueue;
import io.netty.channel.kqueue.KQueueEventLoopGroup;
import io.netty.channel.kqueue.KQueueServerSocketChannel;
import io.netty.channel.kqueue.KQueueSocketChannel;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;

/**
 * Detects if an operating system specific {@link EventLoopGroup} is available
 *
 * @author gmt2001
 */
public final class EventLoopDetector {

    private EventLoopDetector() {
    }

    // https://github.com/reactor/reactor-netty/blob/main/reactor-netty-core/src/main/java/reactor/netty/resources/DefaultLoopEpoll.java
    /**
     * Indicates if {@link Epoll}, the Linux {@link EventLoopGroup}, is available
     */
    public static final boolean ISEPOLLAVAILABLE;

    static {
        boolean epollCheck = false;

        try {
            Class.forName("io.netty.channel.epoll.Epoll");
            epollCheck = Epoll.isAvailable();
        } catch (ClassNotFoundException cnfe) {
            // noop
        }

        ISEPOLLAVAILABLE = epollCheck;
    }

    // https://github.com/reactor/reactor-netty/blob/main/reactor-netty-core/src/main/java/reactor/netty/resources/DefaultLoopKQueue.java
    /**
     * Indicates if {@link KQueue}, the macOS {@link EventLoopGroup}, is available
     */
    public static final boolean ISKQUEUEAVAILABLE;

    static {
        boolean kqueueCheck = false;

        try {
            Class.forName("io.netty.channel.kqueue.KQueue");
            kqueueCheck = KQueue.isAvailable();
        } catch (ClassNotFoundException cnfe) {
            // noop
        }

        ISKQUEUEAVAILABLE = kqueueCheck;
    }

    /**
     * If an operating system specific {@link EventLoopGroup} is available, returns a new instance of it
     * <p>
     * Otherwise, returns an instance of {@link NioEventLoopGroup}
     *
     * @return the {@link EventLoopGroup}
     */
    public static EventLoopGroup createEventLoopGroup() {
        if (ISEPOLLAVAILABLE) {
            return new EpollEventLoopGroup();
        } else if (ISKQUEUEAVAILABLE) {
            return new KQueueEventLoopGroup();
        }

        return new NioEventLoopGroup();
    }

    /**
     * Returns the class which should be used for {@link ServerChannel}, associated with the {@link EventLoopGroup}
     *
     * @return the server channel class
     */
    public static Class<? extends ServerChannel> getServerChannelClass() {
        if (ISEPOLLAVAILABLE) {
            return EpollServerSocketChannel.class;
        } else if (ISKQUEUEAVAILABLE) {
            return KQueueServerSocketChannel.class;
        }

        return NioServerSocketChannel.class;
    }

    /**
     * Returns the class which should be used for {@link Channel}, associated with the {@link EventLoopGroup}
     *
     * @return the channel class
     */
    public static Class<? extends Channel> getChannelClass() {
        if (ISEPOLLAVAILABLE) {
            return EpollSocketChannel.class;
        } else if (ISKQUEUEAVAILABLE) {
            return KQueueSocketChannel.class;
        }

        return NioSocketChannel.class;
    }
}
