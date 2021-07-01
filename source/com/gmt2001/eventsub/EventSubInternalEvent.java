/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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

import io.netty.handler.codec.http.FullHttpRequest;
import java.nio.charset.Charset;
import java.util.Date;
import org.json.JSONObject;
import tv.phantombot.event.Event;

/**
 * Internal event allowing event implementation classes to subscribe to incoming EventSub notifications
 *
 * @author gmt2001
 */
abstract class EventSubInternalEvent extends Event {

    final String challenge;
    final JSONObject event;
    final String messageId;
    final Date messageTimestamp;
    final EventSubSubscription subscription;

    EventSubInternalEvent(FullHttpRequest req) {
        JSONObject data = new JSONObject(req.content().toString(Charset.forName("UTF-8")));
        this.challenge = data.optString("challenge");
        this.event = data.optJSONObject("event");
        this.messageId = req.headers().get("Twitch-Eventsub-Message-Id");
        this.messageTimestamp = EventSub.parseDate(req.headers().get("Twitch-Eventsub-Message-Timestamp"));
        this.subscription = EventSub.JSONToEventSubSubscription(data.getJSONObject("subscription"));
    }
}
