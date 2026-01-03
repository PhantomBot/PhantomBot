/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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

import org.json.JSONObject;

/**
 * Ban data in an EventSub payload.
 * 
 * @author gmt2001
 */
public class BanData extends UserData {
    private String reason;

    /**
     * Constructor
     * 
     * @param o The JSON data for the object
     */
    public BanData(JSONObject o) {
        super(o);
        this.reason = o.optString("reason");
    }

    /**
     * Reason given for the ban.
     * 
     * @return
     */
    public String reason() {
        return this.reason;
    }
}
