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
package com.gmt2001.wspinger;

import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import java.util.function.Predicate;
import java.util.function.Supplier;

/**
 * An interface representing a single class that implements both a PING supplier and a PONG predicate.
 *
 * The supplier should return a {@link WebSocketFrame} that sends a PING as defined by the protocol of the connected remote.
 *
 * The predicate should return {@code true} if the supplied {@link WebSocketFrame} is a valid PONG response from the connected remote
 *
 * @author gmt2001
 */
public interface PingPongSupplierPredicate extends Supplier<WebSocketFrame>, Predicate<WebSocketFrame> {
}
