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
package com.gmt2001.twitch.eventsub.subscriptions.channel.chat.data;

import org.json.JSONObject;

/**
 * A mention in a {@link MessageFragment}.
 * 
 * @author gmt2001
 */
public final class MessageMention {
    private String user_id;
    private String user_login;
    private String user_name;

    /**
     * Constructor
     * 
     * @param o The JSON data for the object
     */
    protected MessageMention(JSONObject o) {
        this.user_id = o.getString("user_id");
        this.user_login = o.getString("user_login");
        this.user_name = o.getString("user_name");
    }

    /**
     * The mentioned user's user ID.
     * 
     * @return
     */
    public String userId() {
        return this.user_id;
    }

    /**
     * The mentioned user's user login.
     * 
     * @return
     */
    public String userLogin() {
        return this.user_login;
    }

    /**
     * The mentioned user's user display name.
     * 
     * @return
     */
    public String userName() {
        return this.user_name;
    }
}
