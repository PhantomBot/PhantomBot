/*
 * Copyright (C) 2016-2025 phantombot.github.io/PhantomBot
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
 * Follower mode data in an EventSub payload.
 * 
 * @author gmt2001
 */
public class FollowerModeData {
    private int follow_duration_minutes;

    /**
     * Constructor
     * 
     * @param o The JSON data for the object
     */
    public FollowerModeData(JSONObject o) {
        this.follow_duration_minutes = o.getInt("follow_duration_minutes");
    }

    /**
     * The number of minutes a user must be following the boradcaster for before they are allowed to chat.
     * 
     * @return
     */
    public int followDurationMinutes() {
        return this.follow_duration_minutes;
    }
}
