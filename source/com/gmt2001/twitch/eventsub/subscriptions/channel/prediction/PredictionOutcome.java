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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Describes a potential outcome for a Prediction.
 *
 * @author gmt2001
 */
public final class PredictionOutcome {
    private final String id;
    private final String title;
    private final Color color;
    private final int users;
    private final int channel_points;
    private final List<TopPredictor> top_predictors = new ArrayList<>();

    /**
     * The color for the outcome.
     */
    public enum Color {
        /**
         * Pink
         */
        PINK,
        /**
         * Blue
         */
        BLUE
    }

    /**
     * Constructor
     *
     * @param data Input data from the event
     */
    public PredictionOutcome(JSONObject data) {
        this.id = data.getString("id");
        this.title = data.getString("title");
        this.color = Color.valueOf(data.optString("color", "pink").toUpperCase(Locale.ROOT));
        this.users = data.optInt("users");
        this.channel_points = data.optInt("channel_points");

        if (data.has("top_predictors")) {
            JSONArray predictors = data.getJSONArray("top_predictors");
            for (int i = 0; i < predictors.length(); i++) {
                this.top_predictors.add(new TopPredictor(predictors.getJSONObject(i)));
            }
        }
    }

    /**
     * The outcome ID.
     *
     * @return
     */
    public String id() {
        return this.id;
    }

    /**
     * The outcome title.
     *
     * @return
     */
    public String title() {
        return this.title;
    }

    /**
     * The color for the outcome.
     *
     * @return
     */
    public Color color() {
        return this.color;
    }

    /**
     * The number of users who used Channel Points on this outcome.
     *
     * @return
     */
    public int users() {
        return this.users;
    }

    /**
     * The total number of Channel Points used on this outcome.
     *
     * @return
     */
    public int channelPoints() {
        return this.channel_points;
    }

    /**
     * A list of up to 10 users who used the most Channel Points on this outcome.
     *
     * @return
     */
    public List<TopPredictor> topPredictors() {
        return Collections.unmodifiableList(this.top_predictors);
    }
}
