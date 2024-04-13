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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * An emote in a {@link MessageFragment}.
 * 
 * @author gmt2001
 */
public final class MessageEmote {
    private String id;
    private String emote_set_id;
    private String owner_id;
    private List<String> format;

    /**
     * Constructor
     * 
     * @param o The JSON data for the object
     */
    protected MessageEmote(JSONObject o) {
        this.id = o.getString("id");
        this.emote_set_id = o.getString("emote_set_id");
        this.owner_id = o.optString("owner_id", null);

        if (!o.has("format") || o.isNull("format")) {
            format = null;
        } else {
            format = new ArrayList<>();
            JSONArray a = o.getJSONArray("format");
            for (int i = 0; i < a.length(); i++) {
                format.add(a.getString(i));
            }
        }
    }

    /**
     * The emote ID.
     * 
     * @return
     */
    public String id() {
        return this.id;
    }

    /**
     * The ID of the emote set containing this emote.
     * 
     * @return
     */
    public String emoteSetId() {
        return this.emote_set_id;
    }

    /**
     * The user ID of the broadcaster who owns this emote.
     * 
     * @return {@c null} if not available
     */
    public String ownerId() {
        return this.owner_id;
    }

    /**
     * The available formats for the emote, such as animated or static.
     * 
     * @return {@c null} if not available
     */
    public List<String> format() {
        return Collections.unmodifiableList(this.format);
    }
}
