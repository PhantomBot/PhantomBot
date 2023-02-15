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
package com.gmt2001.twitch.eventsub;

import io.netty.handler.codec.http.FullHttpRequest;
import java.nio.charset.Charset;
import java.time.ZonedDateTime;
import org.json.JSONObject;
import tv.phantombot.event.Event;

/**
 * Internal event allowing event implementation classes to subscribe to incoming EventSub notifications
 *
 * @author gmt2001
 */
public abstract class EventSubInternalEvent extends Event {

    private final String challenge;
    private final JSONObject event;
    private final String messageId;
    private final ZonedDateTime messageTimestamp;
    private final EventSubSubscription subscription;

    EventSubInternalEvent(FullHttpRequest req) {
        super();
        JSONObject data = new JSONObject(req.content().toString(Charset.forName("UTF-8")));
        this.challenge = data.optString("challenge");
        this.event = data.optJSONObject("event");
        this.messageId = req.headers().get("Twitch-Eventsub-Message-Id");
        this.messageTimestamp = EventSub.parseDate(req.headers().get("Twitch-Eventsub-Message-Timestamp"));
        this.subscription = EventSubSubscription.fromJSON(data.getJSONObject("subscription"));
    }

    EventSubInternalEvent(JSONObject metadata, JSONObject payload) {
        super();
        this.challenge = null;
        this.event = payload.optJSONObject("event");
        this.messageId = metadata.getString("message_id");
        this.messageTimestamp = EventSub.parseDate(metadata.getString("message_timestamp"));
        this.subscription = EventSubSubscription.fromJSON(payload.getJSONObject("subscription"));
    }

    /**
     * Gets the authentication challenge
     *
     * @return
     */
    String challenge() {
        return this.challenge;
    }

    /**
     * Gets the event data object, describing the data for the notification
     *
     * @return
     */
    public JSONObject event() {
        return this.event;
    }

    /**
     * Gets the message id for this event
     *
     * @return
     */
    public String messageId() {
        return this.messageId;
    }

    /**
     * Gets the timestamp of the message
     *
     * @return
     */
    public ZonedDateTime messageTimestamp() {
        return this.messageTimestamp;
    }

    /**
     * Gets the subscription data defining the subscription that triggered the event
     *
     * @return
     */
    public EventSubSubscription subscription() {
        return this.subscription;
    }
}
