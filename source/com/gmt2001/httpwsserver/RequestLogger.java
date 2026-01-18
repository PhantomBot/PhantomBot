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
package com.gmt2001.httpwsserver;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.net.InetSocketAddress;
import java.util.Map;
import java.util.Set;

import com.gmt2001.PathValidator;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpHeaders;

import tv.phantombot.PhantomBot;
/**
 * Provides a method to log a request stream
 *
 * @author Sartharon
 */
public final class RequestLogger extends ChannelInboundHandlerAdapter {

    // Redact these headers (case-insensitive)
    private static final Set<String> REDACT_HEADERS = Set.of(
            "authorization", "referer", "x-proxy", "proxy", "cookie", "host"
    );

    private static final DateTimeFormatter FILE_TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm");
    private static final DateTimeFormatter REQUEST_TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH:mm:ss.n");

    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        try {
            if (msg instanceof FullHttpRequest) {
                logHttpRequest(ctx, (FullHttpRequest) msg);
            }
        } catch (Exception e) {
            com.gmt2001.Console.err.logStackTrace(e, "HTTP request logging failed: ");
        } finally {
            ctx.fireChannelRead(msg);
        }
    }

    private void logHttpRequest(ChannelHandlerContext ctx, FullHttpRequest req) {
        StringBuilder sb = new StringBuilder(1024);

        LocalDateTime now = LocalDateTime.now(PhantomBot.getTimeZoneId());
        String remote = String.valueOf(ctx.channel().remoteAddress());
        if (ctx.channel().remoteAddress() instanceof InetSocketAddress) {
            InetSocketAddress isa = (InetSocketAddress) ctx.channel().remoteAddress();
            remote = isa.getAddress().getHostAddress() + ":" + isa.getPort();
        }

        sb.append("=== HTTP REQUEST === ")
          .append(now.format(REQUEST_TIMESTAMP_FORMATTER))
          .append(" === HTTP REQUEST ===\n")
          .append("Remote: ").append(remote).append('\n')
          .append("Protocol: ").append(req.protocolVersion()).append('\n')
          .append("Method: ").append(req.method()).append('\n')
          .append("URI: ").append(req.uri()).append('\n');

        // Headers (redacted)
        sb.append("Headers:\n");
        HttpHeaders headers = req.headers();
        for (Map.Entry<String, String> h : headers) {
            String name = h.getKey();
            String value = REDACT_HEADERS.contains(name.toLowerCase()) ? "<REDACTED>" : h.getValue();
            sb.append("  ").append(name).append(": ").append(value).append('\n');
        }

        try {
            Path p = PathValidator.getRealPath(Paths.get("./logs/request", now.format(FILE_TIMESTAMP_FORMATTER) + ".txt"));
            Files.createDirectories(p.getParent());        
            Files.writeString(p, sb.append("\n"), StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.APPEND);
        } catch (Exception e) {
            com.gmt2001.Console.debug.printStackTrace(e);
        }
    }
}
