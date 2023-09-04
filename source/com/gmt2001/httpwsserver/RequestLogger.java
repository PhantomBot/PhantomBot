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
import java.util.List;

import com.gmt2001.PathValidator;
import com.illusionaryone.Logger;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.ByteToMessageDecoder;
import io.netty.util.AttributeKey;
import io.netty.util.IllegalReferenceCountException;

/**
 * Provides a method to log a request stream
 *
 * @author gmt2001
 */
public final class RequestLogger extends ByteToMessageDecoder {
    private static final AttributeKey<ByteBuf> ATTR_BB = AttributeKey.valueOf("BB");

    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        ctx.channel().attr(ATTR_BB).set(in.retainedDuplicate());
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
     * If an exception is thrown, this method fails silently
     *
     * @param ctx the context to log
     */
    public static void log(ChannelHandlerContext ctx) {
        try {
            ByteBuf b = ctx.channel().attr(ATTR_BB).get();
            if (b != null && b.isReadable()) {
                Path p = PathValidator.getRealPath(Paths.get("./logs/request", Logger.instance().logFileDTTimestamp() + ".txt"));
                Files.writeString(p, b.readCharSequence(b.readableBytes(), StandardCharsets.UTF_8), StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
                com.gmt2001.Console.out.println("Logged request to " + p.toString());
            }
        } catch (Exception e) {
        }
    }
}
