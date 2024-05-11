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
package com.gmt2001.twitch.eventsub.subscriptions.channel.data;

import java.time.ZonedDateTime;

import org.json.JSONObject;

import com.gmt2001.twitch.eventsub.EventSub;

/**
 * Timeout data in an EventSub payload.
 * 
 * @author gmt2001
 */
public class TimeoutData extends BanData {
    private String sExpires_at;
    private ZonedDateTime expires_at;

    /**
     * Constructor
     * 
     * @param o The JSON data for the object
     */
    public TimeoutData(JSONObject o) {
        super(o);
        this.sExpires_at = o.getString("expires_at");
        this.expires_at = EventSub.parseDate(sExpires_at);
    }

    /**
     * The timestamp when the timeout ends as a string.
     * 
     * @return
     */
    public String expiresAtString() {
        return this.sExpires_at;
    }

    /**
     * The timestamp when the timeout ends.
     * 
     * @return
     */
    public ZonedDateTime expiresAt() {
        return this.expires_at;
    }
}
