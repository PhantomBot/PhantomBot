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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Automod terms data in an EventSub payload.
 * 
 * @author gmt2001
 */
public class AutomodTermsData {
    private String action;
    private String list;
    private List<String> terms;
    private boolean from_automod;

    /**
     * Constructor
     * 
     * @param o The JSON data for the object
     */
    public AutomodTermsData(JSONObject o) {
        this.action = o.getString("action");
        this.list = o.getString("list");
        this.from_automod = o.getBoolean("from_automod");

        this.terms = new ArrayList<>();

        if (o.has("terms") && !o.isNull("terms")) {
            JSONArray a = o.getJSONArray("terms");

            for (int i = 0; i < a.length(); i++) {
                this.terms.add(a.getString(i));
            }
        }
    }

    /**
     * Whether terms are being added or removed.
     * 
     * @return
     */
    public String action() {
        return this.action;
    }

    /**
     * Whether the blocked or permitted list is being changed.
     * 
     * @return
     */
    public String list() {
        return this.list;
    }

    /**
     * The terms being added or removed.
     * 
     * @return
     */
    public List<String> terms() {
        return Collections.unmodifiableList(this.terms);
    }

    /**
     * Whether the terms are being added due to an automod approve/deny action.
     * 
     * @return
     */
    public boolean fromAutomod() {
        return this.from_automod;
    }
}
