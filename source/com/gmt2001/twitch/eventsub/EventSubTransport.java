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

import java.time.ZonedDateTime;

import org.json.JSONObject;

/**
 * EventSub Transport Data
 *
 * @author gmt2001
 */
public final class EventSubTransport {

    private final String method;
    private final String callback;
    private final String secret;
    private final String session_id;
    private final ZonedDateTime connected_at;

    private EventSubTransport(String method, String callback, String secret, String session_id, String connected_at) {
        this.method = method;
        this.callback = callback;
        this.secret = secret;
        this.session_id = session_id;
        if (connected_at != null) {
            this.connected_at = EventSub.parseDate(connected_at);
        } else {
            this.connected_at = null;
        }
    }

    static EventSubTransport webhook(String callback, String secret) {
        return new EventSubTransport("webhook", callback, secret, null, null);
    }

    static EventSubTransport websocket(String session_id) {
        return new EventSubTransport("websocket", null, null, session_id, null);
    }

    /**
     * Creates a new transport from a JSONObject
     *
     * @param transportJson The JSOn object to process
     * @return
     */
    static EventSubTransport fromJSON(JSONObject transportJson) {
        return new EventSubTransport(transportJson.optString("method", null),
        transportJson.optString("callback", null), null, transportJson.optString("session_id", null),
        transportJson.optString("connected_at", null));
    }

    /**
     * The transport method. Supported values: webhook, websocket.
     *
     * @return
     */
    public String method() {
        return this.method;
    }

    public boolean hasCallback() {
        return this.callback != null && !this.callback.isBlank();
    }

    /**
     * The callback URL where the notification should be sent.
     *
     * @return
     */
    public String callback() {
        return this.callback;
    }

    public boolean hasSecret() {
        return this.secret != null && !this.secret.isBlank();
    }

    /**
     * Returns the secret used in this transport
     *
     * @return
     */
    String secret() {
        return this.secret;
    }

    public boolean hasSessionId() {
        return this.session_id != null && !this.session_id.isBlank();
    }

    String sessionId() {
        return this.session_id;
    }

    ZonedDateTime connectedAt() {
        return this.connected_at;
    }
}
