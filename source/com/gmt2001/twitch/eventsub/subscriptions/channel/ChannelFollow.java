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
package com.gmt2001.twitch.eventsub.subscriptions.channel;

import java.time.ZonedDateTime;
import java.util.Collections;

import com.gmt2001.twitch.eventsub.EventSub;
import com.gmt2001.twitch.eventsub.EventSubInternalNotificationEvent;
import com.gmt2001.twitch.eventsub.EventSubSubscription;
import com.gmt2001.twitch.eventsub.EventSubSubscriptionType;

import tv.phantombot.event.EventBus;
import tv.phantombot.event.eventsub.channel.EventSubChannelFollowEvent;

/**
 * A specified channel receives a follow.
 *
 * @author gmt2001
 */
public final class ChannelFollow extends EventSubSubscriptionType {

    public static final String TYPE = "channel.follow";
    public static final String VERSION = "2";
    private String broadcaster_user_id;
    private String broadcaster_user_login;
    private String broadcaster_user_name;
    private String user_id;
    private String user_login;
    private String user_name;
    private String sFollowed_at;
    private ZonedDateTime followed_at;

    /**
     * Only used by EventSub for handler registration
     */
    public ChannelFollow() {
        super();
        this.subscribe();
    }

    /**
     * Used by {@link onEventSubInternalNotificationEvent} to construct an object from an incoming notification
     *
     * @param e The event
     */
    public ChannelFollow(EventSubInternalNotificationEvent e) {
        super(e.subscription(), e.messageId(), e.messageTimestamp());
        this.broadcaster_user_id = e.event().getString("broadcaster_user_id");
        this.broadcaster_user_login = e.event().getString("broadcaster_user_login");
        this.broadcaster_user_name = e.event().getString("broadcaster_user_name");
        this.user_id = e.event().getString("user_id");
        this.user_login = e.event().getString("user_login");
        this.user_name = e.event().getString("user_name");
        this.sFollowed_at = e.event().getString("followed_at");
        this.followed_at = EventSub.parseDate(this.sFollowed_at);
    }

    /**
     * Constructor
     *
     * @param broadcaster_user_id The user id of the broadcaster
     */
    public ChannelFollow(String broadcaster_user_id) {
        super();
        this.broadcaster_user_id = broadcaster_user_id;
    }

    @Override
    protected EventSubSubscription proposeSubscription() {
        return this.proposeSubscriptionInternal(ChannelFollow.TYPE, ChannelFollow.VERSION,
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
            if (e.subscription().type().equals(ChannelFollow.TYPE)) {
                EventSub.debug(ChannelFollow.TYPE);
                EventBus.instance().postAsync(new EventSubChannelFollowEvent(new ChannelFollow(e)));
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    protected boolean isMatch(EventSubSubscription subscription) {
        return subscription.type().equals(ChannelFollow.TYPE)
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
     * The new follower's user ID.
     *
     * @return
     */
    public String userId() {
        return this.user_id;
    }

    /**
     * The new follower's user login.
     *
     * @return
     */
    public String userLogin() {
        return this.user_login;
    }

    /**
     * The new follower's user display name.
     *
     * @return
     */
    public String userName() {
        return this.user_name;
    }

    /**
     * The timestamp of when the follow occurred as a string.
     *
     * @return
     */
    public String followedAtString() {
        return this.sFollowed_at;
    }

    /**
     * The timestamp of when the follow occurred.
     *
     * @return
     */
    public ZonedDateTime followedAt() {
        return this.followed_at;
    }
}
