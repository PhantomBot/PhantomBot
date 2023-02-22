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
package com.gmt2001.twitch.eventsub.subscriptions.stream;

import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import com.gmt2001.twitch.eventsub.EventSub;
import com.gmt2001.twitch.eventsub.EventSubInternalNotificationEvent;
import com.gmt2001.twitch.eventsub.EventSubSubscription;
import com.gmt2001.twitch.eventsub.EventSubSubscriptionType;

import tv.phantombot.event.EventBus;
import tv.phantombot.event.eventsub.stream.EventSubStreamOnlineEvent;

/**
 * The specified broadcaster starts a stream.
 *
 * @author gmt2001
 */
public final class StreamOnline extends EventSubSubscriptionType {

    public static final String TYPE = "stream.online";
    public static final String VERSION = "1";
    private String broadcaster_user_id;
    private String broadcaster_user_login;
    private String broadcaster_user_name;
    private String id;
    private Type type;
    private ZonedDateTime started_at;

    /**
     * Stream types
     */
    public enum Type {
        /**
         * A live stream
         */
        LIVE,
        /**
         * Playlist
         */
        PLAYLIST,
        /**
         * Watching a movie or TV show together on Prime Video
         */
        WATCH_PARTY,
        /**
         * A premiere of a new video
         */
        PREMIERE,
        /**
         * Rerun of a vod of a previous live stream
         */
        RERUN
    }

    /**
     * Only used by EventSub for handler registration
     */
    public StreamOnline() {
        super();
        this.subscribe();
    }

    /**
     * Used by {@link onEventSubInternalNotificationEvent} to construct an object from an incoming notification
     *
     * @param e The event
     */
    public StreamOnline(EventSubInternalNotificationEvent e) {
        super(e.subscription(), e.messageId(), e.messageTimestamp());
        this.broadcaster_user_id = e.event().getString("broadcaster_user_id");
        this.broadcaster_user_login = e.event().getString("broadcaster_user_login");
        this.broadcaster_user_name = e.event().getString("broadcaster_user_name");
        this.id = e.event().getString("id");
        this.type = Type.valueOf(e.event().getString("type").toUpperCase(Locale.ROOT));
        this.started_at = EventSub.parseDate(e.event().getString("started_at"));
    }

    /**
     * Constructor
     *
     * @param broadcaster_user_id The user id of the broadcaster
     */
    public StreamOnline(String broadcaster_user_id) {
        super();
        this.broadcaster_user_id = broadcaster_user_id;
    }

    @Override
    protected EventSubSubscription proposeSubscription() {
        Map<String, String> condition = new HashMap<>();
        condition.put("broadcaster_user_id", this.broadcaster_user_id);
        return this.proposeSubscriptionInternal(StreamOnline.TYPE, StreamOnline.VERSION, condition);
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
            if (e.subscription().type().equals(StreamOnline.TYPE)) {
                EventSub.debug(StreamOnline.TYPE);
                EventBus.instance().postAsync(new EventSubStreamOnlineEvent(new StreamOnline(e)));
            }

        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    protected boolean isMatch(EventSubSubscription subscription) {
        return subscription.type().equals(StreamOnline.TYPE)
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
     * The id of the stream.
     *
     * @return
     */
    public String id() {
        return this.id;
    }

    /**
     * The stream type.
     *
     * @return
     */
    public Type type() {
        return this.type;
    }

    /**
     * The timestamp at which the stream went online at.
     *
     * @return
     */
    public ZonedDateTime startedAt() {
        return this.started_at;
    }
}
