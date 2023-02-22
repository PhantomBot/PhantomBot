/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
package com.gmt2001.twitch.eventsub.subscriptions.channel.prediction;

import org.json.JSONObject;

/**
 * Describes a user who participated in a Channel Points Prediction.
 *
 * @author gmt2001
 */
public final class TopPredictor {
    private final String user_id;
    private final String user_login;
    private final String user_name;
    private final int channel_points_won;
    private final int channel_points_used;

    /**
     * Constructor
     *
     * @param data Input data from the event
     */
    public TopPredictor(JSONObject data) {
        this.user_id = data.getString("user_id");
        this.user_login = data.getString("user_login");
        this.user_name = data.getString("user_name");
        this.channel_points_won = data.optInt("channel_points_won", -1);
        this.channel_points_used = data.optInt("channel_points_used", -1);
    }

    /**
     * The ID of the user.
     *
     * @return
     */
    public String userId() {
        return this.user_id;
    }

    /**
     * The login of the user.
     *
     * @return
     */
    public String userLogin() {
        return this.user_login;
    }

    /**
     * The display name of the user.
     *
     * @return
     */
    public String userName() {
        return this.user_name;
    }

    /**
     * The number of Channel Points won.
     *
     * This value is always {@code -1} in the event payload for Prediction progress and Prediction lock.
     * This value is {@code 0} if the outcome did not win or if the Prediction was canceled and Channel Points were refunded.
     *
     * @return
     */
    public int channelPointsWon() {
        return this.channel_points_won;
    }

    /**
     * The number of Channel Points used to participate in the Prediction.
     *
     * @return
     */
    public int channelPointsUsed() {
        return this.channel_points_used;
    }
}
