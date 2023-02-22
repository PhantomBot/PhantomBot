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

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONArray;

import com.gmt2001.twitch.eventsub.EventSub;
import com.gmt2001.twitch.eventsub.EventSubInternalNotificationEvent;
import com.gmt2001.twitch.eventsub.EventSubSubscription;
import com.gmt2001.twitch.eventsub.EventSubSubscriptionType;

import tv.phantombot.event.EventBus;
import tv.phantombot.event.eventsub.channel.prediction.EventSubPredictionProgressEvent;

/**
 * Users participated in a Prediction on a specified channel.
 *
 * @author gmt2001
 */
public final class PredictionProgress extends EventSubSubscriptionType {

    public static final String TYPE = "channel.prediction.progress";
    public static final String VERSION = "1";
    private String broadcaster_user_id;
    private String broadcaster_user_login;
    private String broadcaster_user_name;
    private String id;
    private String title;
    private ZonedDateTime started_at;
    private ZonedDateTime locks_at;
    private List<PredictionOutcome> outcomes = new ArrayList<>();

    /**
     * Only used by EventSub for handler registration
     */
    public PredictionProgress() {
        super();
        this.subscribe();
    }

    /**
     * Used by {@link onEventSubInternalNotificationEvent} to construct an object from an incoming notification
     *
     * @param e The event
     */
    public PredictionProgress(EventSubInternalNotificationEvent e) {
        super(e.subscription(), e.messageId(), e.messageTimestamp());
        this.broadcaster_user_id = e.event().getString("broadcaster_user_id");
        this.broadcaster_user_login = e.event().getString("broadcaster_user_login");
        this.broadcaster_user_name = e.event().getString("broadcaster_user_name");
        this.id = e.event().getString("id");
        this.title = e.event().getString("title");
        this.started_at = EventSub.parseDate(e.event().getString("started_at"));
        this.locks_at = EventSub.parseDate(e.event().getString("locks_at"));

        JSONArray outcomes = e.event().getJSONArray("outcomes");
        for (int i = 0; i < outcomes.length(); i++) {
            this.outcomes.add(new PredictionOutcome(outcomes.getJSONObject(i)));
        }
    }

    /**
     * Constructor
     *
     * @param broadcaster_user_id The user id of the broadcaster
     */
    public PredictionProgress(String broadcaster_user_id) {
        super();
        this.broadcaster_user_id = broadcaster_user_id;
    }

    @Override
    protected EventSubSubscription proposeSubscription() {
        Map<String, String> condition = new HashMap<>();
        condition.put("broadcaster_user_id", this.broadcaster_user_id);
        return this.proposeSubscriptionInternal(PredictionBegin.TYPE, PredictionBegin.VERSION, condition);
    }

    @Override
    protected void validateParameters() throws IllegalArgumentException {
        if (this.broadcaster_user_id == null || this.broadcaster_user_id.isBlank() || !this.broadcaster_user_id.matches("[0-9]+")
                || this.broadcaster_user_id.startsWith("-") || this.broadcaster_user_id.startsWith("0")) {
            throw new IllegalArgumentException("broadcaster_user_id must be a valid id");
        }
    }

    @Override
    protected void onEventSubInternalNotificationEvent(EventSubInternalNotificationEvent e) {
        try {
            if (e.subscription().type().equals(PredictionBegin.TYPE)) {
                EventSub.debug(PredictionBegin.TYPE);
                EventBus.instance().postAsync(new EventSubPredictionProgressEvent(new PredictionProgress(e)));
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    protected boolean isMatch(EventSubSubscription subscription) {
        return subscription.type().equals(PredictionBegin.TYPE)
                && subscription.condition().get("broadcaster_user_id").equals(this.broadcaster_user_id);
    }

    /**
     * The broadcaster's user ID.
     *
     * @return
     */
    public String broadcasterUserId() {
        return this.broadcaster_user_id;
    }

    /**
     * The broadcaster's user login.
     *
     * @return
     */
    public String broadcasterUserLogin() {
        return this.broadcaster_user_login;
    }

    /**
     * The broadcaster's user display name.
     *
     * @return
     */
    public String broadcasterUserName() {
        return this.broadcaster_user_name;
    }

    /**
     * Channel Points Prediction ID.
     *
     * @return
     */
    public String id() {
        return this.id;
    }

    /**
     * Title for the Channel Points Prediction.
     *
     * @return
     */
    public String title() {
        return this.title;
    }

    /**
     * The time the Channel Points Prediction started.
     *
     * @return
     */
    public ZonedDateTime startedAt() {
        return this.started_at;
    }

    /**
     * The time the Channel Points Prediction will automatically lock.
     *
     * @return
     */
    public ZonedDateTime locksAt() {
        return this.locks_at;
    }

    /**
     * A list of potential outcomes for the Channel Points Prediction.
     *
     * @return
     */
    public List<PredictionOutcome> outcomes() {
        return Collections.unmodifiableList(this.outcomes);
    }
}
