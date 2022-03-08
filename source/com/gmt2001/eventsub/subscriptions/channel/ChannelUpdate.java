/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
package com.gmt2001.eventsub.subscriptions.channel;

import com.gmt2001.eventsub.EventSub;
import com.gmt2001.eventsub.EventSubInternalNotificationEvent;
import com.gmt2001.eventsub.EventSubSubscription;
import com.gmt2001.eventsub.EventSubSubscriptionType;
import java.util.HashMap;
import java.util.Map;
import net.engio.mbassy.listener.Handler;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.eventsub.channel.EventSubChannelUpdateEvent;

/**
 * A broadcaster updates their channel properties e.g., category, title, mature flag, broadcast, or language.
 *
 * @author gmt2001
 */
public class ChannelUpdate extends EventSubSubscriptionType {

    public static final String TYPE = "channel.update";
    protected String broadcaster_user_id;
    private String broadcaster_user_login;
    private String broadcaster_user_name;
    private String title;
    private String language;
    private String category_id;
    private String category_name;
    private boolean is_mature;

    protected ChannelUpdate() {
    }

    protected ChannelUpdate(EventSubInternalNotificationEvent e) {
        super(e.getSubscription(), e.getMessageId(), e.getMessageTimestamp());
        this.broadcaster_user_id = e.getEvent().getString("broadcaster_user_id");
        this.broadcaster_user_login = e.getEvent().getString("broadcaster_user_login");
        this.broadcaster_user_name = e.getEvent().getString("broadcaster_user_name");
        this.title = e.getEvent().getString("title");
        this.language = e.getEvent().getString("language");
        this.category_id = e.getEvent().getString("category_id");
        this.category_name = e.getEvent().getString("category_name");
        this.is_mature = e.getEvent().getBoolean("is_mature");
    }

    public ChannelUpdate(String broadcaster_user_id) {
        this.broadcaster_user_id = broadcaster_user_id;
    }

    @Override
    protected EventSubSubscription proposeSubscription() {
        Map<String, String> condition = new HashMap<>();
        condition.put("broadcaster_user_id", this.broadcaster_user_id);
        return this.proposeSubscriptionInternal(ChannelUpdate.TYPE, condition);
    }

    @Override
    protected void validateParameters() throws IllegalArgumentException {
        if (this.broadcaster_user_id == null || this.broadcaster_user_id.isBlank() || !this.broadcaster_user_id.matches("[0-9]+")
                || this.broadcaster_user_id.startsWith("-") || this.broadcaster_user_id.startsWith("0")) {
            throw new IllegalArgumentException("broadcaster_user_id must be a valid id");
        }
    }

    @Handler
    public void onEventSubInternalNotificationEvent(EventSubInternalNotificationEvent e) {
        if (e.getSubscription().getType().equals(ChannelUpdate.TYPE)) {
            EventBus.instance().postAsync(new EventSubChannelUpdateEvent(new ChannelUpdate(e)));
        }
    }

    @Override
    public boolean isAlreadySubscribed() {
        return EventSub.instance().getSubscriptions().stream().anyMatch(possibleSubscription -> {
            return possibleSubscription.getType().equals(ChannelUpdate.TYPE)
                    && possibleSubscription.getCondition().get("broadcaster_user_id").equals(this.broadcaster_user_id)
                    && (possibleSubscription.getStatus() == EventSubSubscription.SubscriptionStatus.ENABLED
                    || possibleSubscription.getStatus() == EventSubSubscription.SubscriptionStatus.WEBHOOK_CALLBACK_VERIFICATION_PENDING);
        });
    }

    @Override
    public String findMatchingSubscriptionId() {
        return EventSub.instance().getSubscriptions().stream().filter(possibleSubscription -> {
            return possibleSubscription.getType().equals(ChannelUpdate.TYPE)
                    && possibleSubscription.getCondition().get("broadcaster_user_id").equals(this.broadcaster_user_id)
                    && (possibleSubscription.getStatus() == EventSubSubscription.SubscriptionStatus.ENABLED
                    || possibleSubscription.getStatus() == EventSubSubscription.SubscriptionStatus.WEBHOOK_CALLBACK_VERIFICATION_PENDING);
        }).findFirst().map(EventSubSubscription::getId).orElse(null);
    }

    /**
     * The broadcaster's user ID.
     *
     * @return
     */
    public String getBroadcasterUserId() {
        return this.broadcaster_user_id;
    }

    /**
     * The broadcaster's user login.
     *
     * @return
     */
    public String getBroadcasterUserLogin() {
        return this.broadcaster_user_login;
    }

    /**
     * The broadcaster's user display name.
     *
     * @return
     */
    public String getBroadcasterUserName() {
        return this.broadcaster_user_name;
    }

    /**
     * The channel's stream title.
     *
     * @return
     */
    public String getTitle() {
        return this.title;
    }

    /**
     * The channel's broadcast language.
     *
     * @return
     */
    public String getLanguage() {
        return this.language;
    }

    /**
     * The channel's category ID.
     *
     * @return
     */
    public String getCategoryId() {
        return this.category_id;
    }

    /**
     * The category name.
     *
     * @return
     */
    public String getCategoryName() {
        return this.category_name;
    }

    /**
     * A boolean identifying whether the channel is flagged as mature.
     *
     * @return
     */
    public boolean getIsMature() {
        return this.is_mature;
    }
}
