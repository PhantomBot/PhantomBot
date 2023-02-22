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

import java.util.HashMap;
import java.util.Map;

import com.gmt2001.twitch.eventsub.EventSub;
import com.gmt2001.twitch.eventsub.EventSubInternalNotificationEvent;
import com.gmt2001.twitch.eventsub.EventSubSubscription;
import com.gmt2001.twitch.eventsub.EventSubSubscriptionType;

import tv.phantombot.event.EventBus;
import tv.phantombot.event.eventsub.channel.EventSubChannelUpdateEvent;

/**
 * A broadcaster updates their channel properties e.g., category, title, mature flag, broadcast, or language.
 *
 * @author gmt2001
 */
public final class ChannelUpdate extends EventSubSubscriptionType {

    public static final String TYPE = "channel.update";
    public static final String VERSION = "1";
    private String broadcaster_user_id;
    private String broadcaster_user_login;
    private String broadcaster_user_name;
    private String title;
    private String language;
    private String category_id;
    private String category_name;
    private boolean is_mature;

    /**
     * Only used by EventSub for handler registration
     */
    public ChannelUpdate() {
        super();
        this.subscribe();
    }

    /**
     * Used by {@link onEventSubInternalNotificationEvent} to construct an object from an incoming notification
     *
     * @param e The event
     */
    public ChannelUpdate(EventSubInternalNotificationEvent e) {
        super(e.subscription(), e.messageId(), e.messageTimestamp());
        this.broadcaster_user_id = e.event().getString("broadcaster_user_id");
        this.broadcaster_user_login = e.event().getString("broadcaster_user_login");
        this.broadcaster_user_name = e.event().getString("broadcaster_user_name");
        this.title = e.event().getString("title");
        this.language = e.event().getString("language");
        this.category_id = e.event().getString("category_id");
        this.category_name = e.event().getString("category_name");
        this.is_mature = e.event().getBoolean("is_mature");
    }

    /**
     * Constructor
     *
     * @param broadcaster_user_id The user id of the broadcaster
     */
    public ChannelUpdate(String broadcaster_user_id) {
        super();
        this.broadcaster_user_id = broadcaster_user_id;
    }

    @Override
    protected EventSubSubscription proposeSubscription() {
        Map<String, String> condition = new HashMap<>();
        condition.put("broadcaster_user_id", this.broadcaster_user_id);
        return this.proposeSubscriptionInternal(ChannelUpdate.TYPE, ChannelUpdate.VERSION, condition);
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
            if (e.subscription().type().equals(ChannelUpdate.TYPE)) {
                EventSub.debug(ChannelUpdate.TYPE);
                EventBus.instance().postAsync(new EventSubChannelUpdateEvent(new ChannelUpdate(e)));
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    protected boolean isMatch(EventSubSubscription subscription) {
        return subscription.type().equals(ChannelUpdate.TYPE)
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
     * The channel's stream title.
     *
     * @return
     */
    public String title() {
        return this.title;
    }

    /**
     * The channel's broadcast language.
     *
     * @return
     */
    public String language() {
        return this.language;
    }

    /**
     * The channel's category ID.
     *
     * @return
     */
    public String categoryId() {
        return this.category_id;
    }

    /**
     * The category name.
     *
     * @return
     */
    public String categoryName() {
        return this.category_name;
    }

    /**
     * A boolean identifying whether the channel is flagged as mature.
     *
     * @return
     */
    public boolean isMature() {
        return this.is_mature;
    }
}
