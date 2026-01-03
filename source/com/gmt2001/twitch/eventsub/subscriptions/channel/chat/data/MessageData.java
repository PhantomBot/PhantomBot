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
package com.gmt2001.twitch.eventsub.subscriptions.channel.chat.data;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Chat Message data in an EventSub payload.
 * 
 * @author gmt2001
 */
public final class MessageData {
    private String text;
    private List<MessageFragment> fragments;

    /**
     * Constructor
     * 
     * @param o The JSON data for the object
     */
    public MessageData(JSONObject o) {
        this.text = o.getString("text");

        fragments = new ArrayList<>();
        JSONArray a = o.getJSONArray("fragments");
        for (int i = 0; i < a.length(); i++) {
            fragments.add(new MessageFragment(a.getJSONObject(i)));
        }
    }

    /**
     * The entire raw text of the message, before fragmenting.
     * 
     * @return
     */
    public String text() {
        return this.text;
    }

    /**
     * The fragments that make up this message.
     * 
     * @return
     */
    public List<MessageFragment> fragments() {
        return Collections.unmodifiableList(this.fragments);
    }
}
