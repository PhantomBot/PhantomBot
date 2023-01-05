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
package com.gmt2001.twitch.tmi;

import com.gmt2001.wspinger.PingPongSupplierPredicate;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import tv.phantombot.CaselessProperties;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.irc.IrcPongEvent;

/**
 * Supplier and Predicate for TMI PING/PONG commands
 *
 * @author gmt2001
 */
public class TMIPingPongSupplierPredicate implements PingPongSupplierPredicate {

    @Override
    public WebSocketFrame get() {
        if (CaselessProperties.instance().getPropertyAsBoolean("ircdebug", false)) {
            com.gmt2001.Console.debug.println("<PING");
        }
        return new TextWebSocketFrame("PING");
    }

    @Override
    public boolean test(WebSocketFrame t) {
        if (t instanceof TextWebSocketFrame) {
            boolean result = ((TextWebSocketFrame) t).text().lines().anyMatch(message -> message.startsWith("PONG"));

            if (result) {
                EventBus.instance().postAsync(new IrcPongEvent(null));
            }

            return result;
        }

        return false;
    }
}
