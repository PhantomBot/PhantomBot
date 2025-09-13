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
package com.gmt2001.twitch.eventsub.subscriptions.channel.chat.data;

import org.json.JSONObject;

/**
 * A cheermote in a {@link MessageFragment}.
 * 
 * @author gmt2001
 */
public final class MessageCheermote {
    private String prefix;
    private int bits;
    private int tier;

    /**
     * Constructor
     * 
     * @param o The JSON data for the object
     */
    protected MessageCheermote(JSONObject o) {
        this.prefix = o.getString("prefix");
        this.bits = o.getInt("bits");
        this.tier = o.getInt("tier");
    }

    /**
     * The prefix for using this cheermote.
     * 
     * @return
     */
    public String prefix() {
        return this.prefix;
    }

    /**
     * The amount of bits cheered in this cheermote fragment.
     * 
     * @return
     */
    public int bits() {
        return this.bits;
    }

    /**
     * The tier level of the displayed cheermote.
     * 
     * @return
     */
    public int tier() {
        return this.tier;
    }
}
