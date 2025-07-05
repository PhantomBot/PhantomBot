/*
 * Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
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
package com.gmt2001.twitch.eventsub.subscriptions;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.json.JSONObject;
import org.json.JSONStringer;

import com.gmt2001.twitch.eventsub.EventSub;
import com.gmt2001.twitch.eventsub.EventSubInternalNotificationEvent;
import com.gmt2001.twitch.eventsub.EventSubSubscription;
import com.gmt2001.twitch.eventsub.EventSubSubscriptionType;

import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.eventsub.EventSubTestEvent;

/**
 * Test type for development.
 *
 * @author gmt2001
 */
public final class Test extends EventSubSubscriptionType {

    private Map<String, String> condition;
    private String type;
    private String version;
    private JSONObject payload;

    /**
     * Only used by EventSub for handler registration
     */
    public Test() {
        super();
        this.subscribe();
    }
    
    /**
     * Constructor
     *
     * @param type The subscription type
     * @param version The subscription version
     * @param condition The subscription condition
     */
    public Test(String type, String version, Map<String, String> condition) {
        this.condition = condition;
        this.type = type;
        this.version = version;
    }
    
    /**
     * Constructor
     *
     * @param type The subscription type
     * @param version The subscription version
     * @param condition The subscription condition as key-value pairs
     */
    public Test(String type, String version, String[][] condition) {
        this.condition = new HashMap<>();
        this.type = type;
        this.version = version;

        for (int i = 0; i < condition.length; i++) {
            if (condition[i].length > 1) {
                this.condition.put(condition[i][0], condition[i][1]);
            }
        }
    }
    
    /**
     * Used by {@link onEventSubInternalNotificationEvent} to construct an object from an incoming notification
     *
     * @param e The event
     */
    public Test(EventSubInternalNotificationEvent e) {
        super(e.subscription(), e.messageId(), e.messageTimestamp());
        this.payload = e.event();
    }

    @Override
    protected void validateParameters() throws IllegalArgumentException {
    }

    @Override
    protected EventSubSubscription proposeSubscription() {
        return this.proposeSubscriptionInternal(type, version, condition);
    }

    @Override
    protected void onEventSubInternalNotificationEvent(EventSubInternalNotificationEvent e) {
        try {
            if (e.subscription().type().equals(this.type)) {
                EventSub.debug(e.subscription().type());
                EventBus.instance().postAsync(new EventSubTestEvent(new Test(e)));
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    protected boolean isMatch(EventSubSubscription subscription) {
        boolean match = subscription.type().equals(this.type);

        for (Map.Entry<String, String> kv: this.condition.entrySet()) {
            if (match) {
                match = subscription.condition().containsKey(kv.getKey()) && subscription.condition().get(kv.getKey()).equals(kv.getValue());
            }
        }

        return match;
    }

    /**
     * The event payload
     * 
     * @return
     */
    public JSONObject payload() {
        return this.payload;
    }

    /**
     * Allows sending a test payload to the EventSub handler
     * 
     * @param type Subscription Type
     * @param version Subscription Version
     * @param payload EventSub payload
     */
    public static void sendTestEvent(String type, String version, String payload) {
        JSONStringer meta = new JSONStringer();
        meta.object()
            .key("metadata").object()
                .key("message_id").value(UUID.randomUUID().toString())
                .key("message_type").value("notification")
                .key("message_timestamp").value(ZonedDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
                .key("subscription_type").value(type)
                .key("subscription_version").value(version)
            .endObject()
            .key("payload").value(new JSONObject(payload))
        .endObject();
        EventSub.instance().handleFrame(null, new TextWebSocketFrame(meta.toString()));
    }
}
