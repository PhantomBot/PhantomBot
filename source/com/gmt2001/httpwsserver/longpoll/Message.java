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
package com.gmt2001.httpwsserver.longpoll;

import java.time.Instant;

/**
 * A message enqueued with a {@link Client}
 */
final class Message {
    /**
     * The message
     */
    private final String message;
    /**
     * The timestamp when the strong reference will be dropped
     */
    private final Instant strongTimeout;
    /**
     * The timestamp when the soft reference will be dropped
     */
    private final Instant softTimeout;

    /**
     * Constructor
     *
     * @param message The message
     * @param strongTimeout The timestamp when the strong reference will be dropped
     * @param softTimeout The timestamp when the soft reference will be dropped
     */
    Message(String message, Instant strongTimeout, Instant softTimeout) {
        this.message = message;
        this.strongTimeout = strongTimeout;
        this.softTimeout = softTimeout;
    }

    /**
     * The message
     *
     * @return The message
     */
    String message() {
        return this.message;
    }

    /**
     * The timestamp when the strong reference will be dropped
     *
     * @return The timestamp
     */
    Instant strongTimeout() {
        return this.strongTimeout;
    }

    /**
     * The timestamp when the soft reference will be dropped
     *
     * @return The timestamp
     */
    Instant softTimeout() {
        return this.softTimeout;
    }
}
