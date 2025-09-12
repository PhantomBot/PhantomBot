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
 * Unban request data in an EventSub payload.
 * 
 * @author gmt2001
 */
public class UnbanRequestData extends UserData {
    private boolean is_approved;
    private String moderator_message;

    /**
     * Constructor
     * 
     * @param o The JSON data for the object
     */
    public UnbanRequestData(JSONObject o) {
        super(o);
        this.is_approved = o.getBoolean("is_approved");
        this.moderator_message = o.optString("moderator_message");
    }

    /**
     * Whether the unban request is approved.
     * 
     * @return
     */
    public boolean isApproved() {
        return this.is_approved;
    }

    /**
     * Reason given by the moderator.
     * 
     * @return
     */
    public String moderatorMessage() {
        return this.moderator_message;
    }
}
