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
import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.httpwsserver.auth.HttpAuthenticationHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpResponseStatus;
import java.nio.charset.Charset;
import java.time.ZonedDateTime;
import tv.phantombot.PhantomBot;

/**
 * Authenticates incoming EventSub notifications
 *
 * @author gmt2001
 */
final class HttpEventSubAuthenticationHandler implements HttpAuthenticationHandler {

    @Override
    public boolean checkAuthorization(ChannelHandlerContext ctx, FullHttpRequest req) {
        String id = req.headers().get("Twitch-Eventsub-Message-Id");
        String timestamp = req.headers().get("Twitch-Eventsub-Message-Timestamp");
        String body = req.content().toString(Charset.defaultCharset());
        String signature = req.headers().get("Twitch-Eventsub-Message-Signature").replaceAll("sha256=", "");

        boolean authenticated = HMAC.compareHmacSha256(EventSub.getSecret(), id + timestamp + body, signature);

        ZonedDateTime ts = EventSub.parseDate(timestamp);
        if (ts.isBefore(ZonedDateTime.now().minusMinutes(10)) || EventSub.instance().isDuplicate(id, ts)) {
            authenticated = false;
        }

        if (!authenticated) {
            FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.FORBIDDEN);

            if (PhantomBot.getEnableDebugging()) {
                com.gmt2001.Console.debug.println("403");
                com.gmt2001.Console.debug.println("Expected: >" + signature + "<");
                com.gmt2001.Console.debug.println("Got: >" + HMAC.calcHmacSha256(EventSub.getSecret(), id + timestamp + body) + "<");
            }

            HttpServerPageHandler.sendHttpResponse(ctx, req, res);
        }

        return authenticated;
    }

    @Override
    public void invalidateAuthorization(ChannelHandlerContext ctx, FullHttpRequest req) {
        throw new UnsupportedOperationException("Not supported by this authentication handler.");
    }
}
