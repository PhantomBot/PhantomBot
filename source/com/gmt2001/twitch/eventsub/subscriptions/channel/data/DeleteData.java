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
 * Message delete data in an EventSub payload.
 * 
 * @author gmt2001
 */
public class DeleteData extends UserData {
    private String message_id;
    private String message_body;

    /**
     * Constructor
     * 
     * @param o The JSON data for the object
     */
    public DeleteData(JSONObject o) {
        super(o);
        this.message_id = o.getString("message_id");
        this.message_body = o.getString("message_body");
    }

    /**
     * ID of the deleted message.
     * 
     * @return
     */
    public String messageId() {
        return this.message_id;
    }

    /**
     * The raw text of the message being deleted.
     * 
     * @return
     */
    public String messageBody() {
        return this.message_body;
    }
}
