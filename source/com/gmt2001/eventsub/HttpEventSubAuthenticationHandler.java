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
package com.gmt2001.eventsub;

import com.gmt2001.HMAC;
import com.gmt2001.httpwsserver.auth.HttpAuthenticationHandler;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpRequest;
import static io.netty.handler.codec.http.HttpHeaderNames.CONNECTION;
import static io.netty.handler.codec.http.HttpHeaderValues.CLOSE;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpUtil;
import static io.netty.handler.codec.http.HttpVersion.HTTP_1_1;
import io.netty.util.CharsetUtil;
import java.nio.charset.Charset;
import java.time.ZoneOffset;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;
import tv.phantombot.PhantomBot;

/**
 * Authenticates incoming EventSub notifications
 *
 * @author gmt2001
 */
class HttpEventSubAuthenticationHandler implements HttpAuthenticationHandler {

    @Override
    public boolean checkAuthorization(ChannelHandlerContext ctx, FullHttpRequest req) {
        String id = req.headers().get("Twitch-Eventsub-Message-Id");
        String timestamp = req.headers().get("Twitch-Eventsub-Message-Timestamp");
        String body = req.content().toString(Charset.defaultCharset());
        String signature = req.headers().get("Twitch-Eventsub-Message-Signature").replaceAll("sha256=", "");

        boolean authenticated = HMAC.compareHmacSha256(EventSub.getSecret(), id + timestamp + body, signature);

        Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
        c.add(Calendar.MINUTE, -10);
        Date ts = EventSub.parseDate(timestamp);
        if (ts.before(c.getTime()) || EventSub.instance().isDuplicate(id, ts)) {
            authenticated = false;
        }

        if (!authenticated) {
            DefaultFullHttpResponse res = new DefaultFullHttpResponse(HTTP_1_1, HttpResponseStatus.FORBIDDEN, Unpooled.buffer());
            ByteBuf buf = Unpooled.copiedBuffer(res.status().toString(), CharsetUtil.UTF_8);
            res.content().writeBytes(buf);
            buf.release();
            HttpUtil.setContentLength(res, res.content().readableBytes());

            if (PhantomBot.getEnableDebugging()) {
                com.gmt2001.Console.debug.println("403");
                com.gmt2001.Console.debug.println("Expected: >" + signature + "<");
                com.gmt2001.Console.debug.println("Got: >" + HMAC.calcHmacSha256(EventSub.getSecret(), id + timestamp + body) + "<");
            }

            res.headers().set(CONNECTION, CLOSE);
            ctx.writeAndFlush(res).addListener(ChannelFutureListener.CLOSE);
        }

        return authenticated;
    }

    @Override
    public void invalidateAuthorization(ChannelHandlerContext ctx, FullHttpRequest req) {
        throw new UnsupportedOperationException("Not supported by this authentication handler.");
    }
}
