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
package tv.phantombot.twitch.pubsub;

import org.json.JSONObject;

/**
 * An incoming message from PubSub
 *
 * @author gmt2001
 */
public final class PubSubMessage {

    /**
     * The type of message
     */
    public enum PubSubMessageType {
        /**
         * The connection has been opened and is ready to subscribe to topics
         */
        OPEN,
        /**
         * The result of an attempt to subscribe to a topic
         */
        SUBSCRIBERESULT,
        /**
         * An event message from a topic
         */
        MESSAGE,
        /**
         * The connection is closing
         */
        CLOSE
    }

    private final PubSubMessageType messageType;
    private final JSONObject body;
    private final String topic;

    PubSubMessage(PubSubMessageType messageType, String topic, JSONObject body) {
        this.messageType = messageType;
        this.topic = topic;
        this.body = body;
    }

    PubSubMessage(PubSubMessageType messageType, JSONObject body) {
        this(messageType, null, body);
    }

    PubSubMessage(PubSubMessageType messageType) {
        this(messageType, new JSONObject());
    }

    /**
     * @return The message type
     */
    public PubSubMessageType messageType() {
        return this.messageType;
    }

    /**
     * @return The topic of this message, if it is a PubSubMessageType.MESSAGE
     */
    public String topic() {
        return this.topic;
    }

    /**
     * @return The body of the message. For PubSubMessageType.MESSAGE this is the sub-object encoded in data.message of the primary message
     */
    public JSONObject body() {
        return this.body;
    }
}
