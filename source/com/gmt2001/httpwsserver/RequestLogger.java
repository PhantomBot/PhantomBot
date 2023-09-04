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
package com.gmt2001.httpwsserver;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.gmt2001.PathValidator;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.util.AttributeKey;
import io.netty.util.IllegalReferenceCountException;
import tv.phantombot.PhantomBot;

/**
 * Provides a method to log a request stream
 *
 * @author gmt2001
 */
public final class RequestLogger extends ChannelInboundHandlerAdapter {
    private static final AttributeKey<ByteBuf> ATTR_BB = AttributeKey.valueOf("BB");
    private static final DateTimeFormatter dtfmt = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss_n");

    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        if (msg instanceof ByteBuf b) {
            ctx.channel().attr(ATTR_BB).set(b.retainedDuplicate());
        }

        super.channelRead(ctx, msg);
    }

    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        ByteBuf b = ctx.channel().attr(ATTR_BB).get();

        while (b != null && b.refCnt() > 0) {
            try {
                if (b.release()) {
                    break;
                }
            } catch (IllegalReferenceCountException ex) {
                break;
            }
        }

        ctx.channel().attr(ATTR_BB).set(null);

        super.channelReadComplete(ctx);
    }

    /**
     * Logs the request stream of the provided context and prints the file path to the console
     * <p>
     * Requests are logged to the <i>./logs/request/</i> folder in a file with the timestamp of the request
     * <p>
     * This method attempts to redact the {@code Host}, {@code Cookie}, {@code Authorization}, {@code Referrer},
     * and any {@code Proxy} or {@code X-Proxy} headers for privacy
     *
     * @param ctx the context to log
     */
    public static void log(ChannelHandlerContext ctx) {
        try {
            ByteBuf b = ctx.channel().attr(ATTR_BB).get();
            if (b != null && b.isReadable()) {
                Path p = PathValidator.getRealPath(Paths.get("./logs/request", LocalDateTime.now(PhantomBot.getTimeZoneId()).format(dtfmt) + ".txt"));
                Files.createDirectories(p.getParent());

                StringBuilder data = new StringBuilder(b.readCharSequence(b.readableBytes(), StandardCharsets.UTF_8));
                int idx;
                int idx2;
                idx = data.indexOf("Host:");
                if (idx >= 0) {
                    idx2 = data.indexOf(Character.toString('\n'), idx);
                    data.replace(idx, idx2 - 1, "Host: <redacted>");
                }
                idx = data.indexOf("Cookie:");
                if (idx >= 0) {
                    idx2 = data.indexOf(Character.toString('\n'), idx);
                    data.replace(idx, idx2 - 1, "Cookie: <redacted>");
                }
                idx = data.indexOf("Referer:");
                if (idx >= 0) {
                    idx2 = data.indexOf(Character.toString('\n'), idx);
                    data.replace(idx, idx2 - 1, "Referer: <redacted>");
                }
                idx = data.indexOf("Prox");
                if (idx >= 0) {
                    idx2 = data.indexOf(Character.toString('\n'), idx);
                    data.replace(idx, idx2 - 1, "Proxy: <redacted>");
                }
                idx = data.indexOf("X-Prox");
                if (idx >= 0) {
                    idx2 = data.indexOf(Character.toString('\n'), idx);
                    data.replace(idx, idx2 - 1, "X-Proxy: <redacted>");
                }
                idx = data.indexOf("Authorization:");
                if (idx >= 0) {
                    idx2 = data.indexOf(Character.toString('\n'), idx);
                    data.replace(idx, idx2 - 1, "Authorization: <redacted>");
                }

                Files.writeString(p, data, StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
                com.gmt2001.Console.out.println("Logged request to " + p.toString());
            }
        } catch (Exception e) {
            com.gmt2001.Console.debug.printStackTrace(e);
        }
    }
}
