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
package com.gmt2001.twitch.eventsub.subscriptions.channel.ad_break;

import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.Collections;
import com.gmt2001.twitch.eventsub.EventSub;
import com.gmt2001.twitch.eventsub.EventSubInternalNotificationEvent;
import com.gmt2001.twitch.eventsub.EventSubSubscription;
import com.gmt2001.twitch.eventsub.EventSubSubscriptionType;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.eventsub.channel.ad_break.EventSubAdBreakBeginEvent;

/**
 * An AdBreakBegin event on a specified channel.
 *
 * @author gmt2001
 */
public final class AdBreakBegin extends EventSubSubscriptionType {

    public static final String TYPE = "channel.ad_break.begin";
    public static final String VERSION = "1";
    private String broadcaster_user_id;
    private String broadcaster_user_login;
    private String broadcaster_user_name;
    private String requester_user_id;
    private String requester_user_login;
    private String requester_user_name;
    private int duration_seconds;
    private boolean is_automatic;
    private String sStarted_at;
    private Duration duration;
    private ZonedDateTime started_at;

    /**
     * Only used by EventSub for handler registration
     */
    public AdBreakBegin() {
        super();
        this.subscribe();
    }

    /**
     * Used by {@link onEventSubInternalNotificationEvent} to construct an object from an incoming notification
     *
     * @param e The event
     */
    public AdBreakBegin(EventSubInternalNotificationEvent e) {
        super(e.subscription(), e.messageId(), e.messageTimestamp());
        this.broadcaster_user_id = e.event().getString("broadcaster_user_id");
        this.broadcaster_user_login = e.event().getString("broadcaster_user_login");
        this.broadcaster_user_name = e.event().getString("broadcaster_user_name");
        this.requester_user_id = e.event().getString("requester_user_id");
        this.requester_user_login = e.event().getString("requester_user_login");
        this.requester_user_name = e.event().getString("requester_user_name");
        this.duration_seconds = e.event().getInt("duration");
        this.is_automatic = e.event().getBoolean("is_automatic");
        this.sStarted_at = e.event().getString("started_at");
        this.duration = Duration.ofSeconds(this.duration_seconds);
        this.started_at = EventSub.parseDate(this.sStarted_at);
    }

    /**
     * Constructor
     *
     * @param broadcaster_user_id The user id of the broadcaster
     */
    public AdBreakBegin(String broadcaster_user_id) {
        super();
        this.broadcaster_user_id = broadcaster_user_id;
    }

    @Override
    protected EventSubSubscription proposeSubscription() {
        return this.proposeSubscriptionInternal(AdBreakBegin.TYPE, AdBreakBegin.VERSION,
            Collections.singletonMap("broadcaster_user_id", this.broadcaster_user_id));
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
            if (e.subscription().type().equals(AdBreakBegin.TYPE)) {
                EventSub.debug(AdBreakBegin.TYPE);
                EventBus.instance().postAsync(new EventSubAdBreakBeginEvent(new AdBreakBegin(e)));
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    protected boolean isMatch(EventSubSubscription subscription) {
        return subscription.type().equals(AdBreakBegin.TYPE)
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
     * The requester's user ID.
     *
     * @return
     */
    public String requesterUserId() {
        return this.requester_user_id;
    }

    /**
     * The requester's user login.
     *
     * @return
     */
    public String requesterUserLogin() {
        return this.requester_user_login;
    }

    /**
     * The requester's user display name.
     *
     * @return
     */
    public String requesterUserName() {
        return this.requester_user_name;
    }



    /**
     * The time the ad break started as a string.
     *
     * @return
     */
    public String startedAtString() {
        return this.sStarted_at;
    }

    /**
     * The time the ad break started.
     *
     * @return
     */
    public ZonedDateTime startedAt() {
        return this.started_at;
    }

    /**
     * The duration of the ad break in seconds.
     *
     * @return
     */
    public int durationSeconds() {
        return this.duration_seconds;
    }

    /**
     * The duration of the ad break.
     *
     * @return
     */
    public Duration duration() {
        return this.duration;
    }

    /**
     * Whether the ad break was automatically triggered by Twitch or manually triggered by the broadcaster or a moderator.
     *
     * @return
     */
    public boolean isAutomatic() {
        return this.is_automatic;
    }
}
