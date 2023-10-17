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
import java.time.temporal.ChronoUnit;

import org.json.JSONObject;

/**
 * A message enqueued with a {@link Client}
 */
final class Message {
    /**
     * The message
     */
    private final JSONObject message;
    /**
     * The timestamp when the message was enqueued
     */
    private final Instant timestamp;
    /**
     * The sequence number within the {@link #timestamp}
     */
    private final long sequence;
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
     * @param timestamp The timestamp when the message was enqueued
     * @param sequence The sequence number within the timestamp
     * @param strongTimeout The timestamp when the strong reference will be dropped
     * @param softTimeout The timestamp when the soft reference will be dropped
     */
    Message(JSONObject message, Instant timestamp, long sequence, Instant strongTimeout, Instant softTimeout) {
        this.message = message;
        this.timestamp = timestamp.truncatedTo(ChronoUnit.MILLIS);
        this.sequence = sequence;
        this.strongTimeout = strongTimeout.truncatedTo(ChronoUnit.MILLIS);
        this.softTimeout = softTimeout.truncatedTo(ChronoUnit.MILLIS);
    }

    /**
     * The message
     *
     * @return The message
     */
    JSONObject message() {
        return this.message;
    }

    /**
     * The timestamp when the message was enqueued
     *
     * @return The timestamp
     */
    Instant timestamp() {
        return this.timestamp;
    }

    /**
     * The sequence number within the {@link #timestamp()}
     *
     * @return The sequence number
     */
    long sequence() {
        return this.sequence;
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

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((this.timestamp == null) ? 0 : this.timestamp.hashCode());
        result = prime * result + (int) (this.sequence ^ (this.sequence >>> 32));
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (this.getClass() != obj.getClass())
            return false;
        Message other = (Message) obj;
        if (this.timestamp == null) {
            if (other.timestamp != null)
                return false;
        } else if (!this.timestamp.equals(other.timestamp))
            return false;
        if (this.sequence != other.sequence)
            return false;
        return true;
    }
}
