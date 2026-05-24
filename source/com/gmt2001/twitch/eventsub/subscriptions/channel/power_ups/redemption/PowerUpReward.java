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
package com.gmt2001.twitch.eventsub.subscriptions.channel.power_ups.redemption;

import org.json.JSONObject;

/**
 * Basic information about the reward that was redeemed, at the time it was redeemed.
 *
 * @author gmt2001
 */
public final class PowerUpReward {
    private final String id;
    private final String title;
    private final int bits;
    private final String prompt;

    /**
     * Constructor
     *
     * @param data Input data from the event
     */
    public PowerUpReward(JSONObject data) {
        this.id = data.getString("id");
        this.title = data.getString("title");
        this.bits = data.getInt("bits");
        this.prompt = data.optString("prompt");
    }

    /**
     * Constructor
     *
     * @param id The reward id
     */
    public PowerUpReward(String id) {
        this.id = id;
        this.title = null;
        this.bits = -1;
        this.prompt = null;
    }

    /**
     * The reward identifier.
     *
     * @return
     */
    public String id() {
        return this.id;
    }

    /**
     * The reward name.
     *
     * @return
     */
    public String title() {
        return this.title;
    }

    /**
     * The reward cost in bits.
     *
     * @return
     */
    public int bits() {
        return this.bits;
    }

    /**
     * The reward description.
     *
     * @return
     */
    public String prompt() {
        return this.prompt;
    }
}
