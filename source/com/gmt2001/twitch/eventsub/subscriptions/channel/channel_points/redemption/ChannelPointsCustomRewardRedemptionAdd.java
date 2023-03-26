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
package com.gmt2001.twitch.eventsub.subscriptions.channel.channel_points.redemption;

import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.Map;

import com.gmt2001.twitch.eventsub.EventSub;
import com.gmt2001.twitch.eventsub.EventSubInternalNotificationEvent;
import com.gmt2001.twitch.eventsub.EventSubSubscription;
import com.gmt2001.twitch.eventsub.EventSubSubscriptionType;

import tv.phantombot.event.EventBus;
import tv.phantombot.event.eventsub.channel.channel_points.redemption.EventSubChannelPointsCustomRewardRedemptionAddEvent;

/**
 * A viewer has redeemed a custom channel points reward on the specified channel
 *
 * @author gmt2001
 */
public final class ChannelPointsCustomRewardRedemptionAdd extends EventSubSubscriptionType {

    public static final String TYPE = "channel.channel_points_custom_reward_redemption.add";
    public static final String VERSION = "1";
    private String broadcaster_user_id;
    private String broadcaster_user_login;
    private String broadcaster_user_name;
    private String user_id;
    private String user_login;
    private String user_name;
    private String id;
    private String user_input;
    private String sStatus;
    private RedemptionStatus status;
    private ChannelPointsReward reward;
    private String sRedeemed_at;
    private ZonedDateTime redeemed_at;

    /**
     * The status of the redemption
     */
    public enum RedemptionStatus {
        /**
         * Unknown status
         */
        Unknown,
        /**
         * Unfulfilled
         */
        Unfulfilled,
        /**
         * Fulfilled
         */
        Fulfilled,
        /**
         * Canceled and refunded
         */
        Canceled
    }

    /**
     * Only used by EventSub for handler registration
     */
    public ChannelPointsCustomRewardRedemptionAdd() {
        super();
        this.subscribe();
    }

    /**
     * Used by {@link onEventSubInternalNotificationEvent} to construct an object from an incoming notification
     *
     * @param e The event
     */
    public ChannelPointsCustomRewardRedemptionAdd(EventSubInternalNotificationEvent e) {
        super(e.subscription(), e.messageId(), e.messageTimestamp());
        this.broadcaster_user_id = e.event().getString("broadcaster_user_id");
        this.broadcaster_user_login = e.event().getString("broadcaster_user_login");
        this.broadcaster_user_name = e.event().getString("broadcaster_user_name");
        this.user_id = e.event().getString("user_id");
        this.user_login = e.event().getString("user_login");
        this.user_name = e.event().getString("user_name");
        this.id = e.event().getString("id");
        this.user_input = e.event().optString("user_input");
        this.sStatus = e.event().getString("status");
        this.status = RedemptionStatus.valueOf(this.sStatus.substring(0, 1).toUpperCase() + this.sStatus.substring(1));
        this.reward = new ChannelPointsReward(e.event().getJSONObject("reward"));
        this.sRedeemed_at = e.event().getString("redeemed_at");
        this.redeemed_at = EventSub.parseDate(this.sRedeemed_at);
    }

    /**
     * Constructor. Subscribes to all rewards for the broadcaster
     *
     * @param broadcaster_user_id The user id of the broadcaster
     */
    public ChannelPointsCustomRewardRedemptionAdd(String broadcaster_user_id) {
        super();
        this.broadcaster_user_id = broadcaster_user_id;
    }

    /**
     * Constructor. Subscribes only to the specified reward for the broadcaster
     *
     * @param broadcaster_user_id The user id of the broadcaster
     * @param reward_id The id of the reward
     */
    public ChannelPointsCustomRewardRedemptionAdd(String broadcaster_user_id, String reward_id) {
        super();
        this.broadcaster_user_id = broadcaster_user_id;
        this.reward = new ChannelPointsReward(reward_id);
    }

    @Override
    protected EventSubSubscription proposeSubscription() {
        if (this.reward != null) {
            return this.proposeSubscriptionInternal(ChannelPointsCustomRewardRedemptionAdd.TYPE, ChannelPointsCustomRewardRedemptionAdd.VERSION,
                Map.of("broadcaster_user_id", this.broadcaster_user_id, "reward_id", this.reward.id()));
        }

        return this.proposeSubscriptionInternal(ChannelPointsCustomRewardRedemptionAdd.TYPE, ChannelPointsCustomRewardRedemptionAdd.VERSION,
            Collections.singletonMap("broadcaster_user_id", this.broadcaster_user_id));
    }

    @Override
    protected void validateParameters() throws IllegalArgumentException {
        if (this.broadcaster_user_id == null || this.broadcaster_user_id.isBlank() || !this.broadcaster_user_id.matches("[0-9]+")
                || this.broadcaster_user_id.startsWith("-") || this.broadcaster_user_id.startsWith("0")) {
            throw new IllegalArgumentException("broadcaster_user_id must be a valid id");
        }

        if (this.reward != null && (this.reward.id() == null || this.reward.id().isBlank()
                || !this.reward.id().matches("[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}"))) {
            throw new IllegalArgumentException("reward_id must be a valid id");
        }
    }

    @Override
    protected void onEventSubInternalNotificationEvent(EventSubInternalNotificationEvent e) {
        try {
            if (e.subscription().type().equals(ChannelPointsCustomRewardRedemptionAdd.TYPE)) {
                EventSub.debug(ChannelPointsCustomRewardRedemptionAdd.TYPE);
                EventBus.instance().postAsync(new EventSubChannelPointsCustomRewardRedemptionAddEvent(new ChannelPointsCustomRewardRedemptionAdd(e)));
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    protected boolean isMatch(EventSubSubscription subscription) {
        return subscription.type().equals(ChannelPointsCustomRewardRedemptionAdd.TYPE)
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
     * User ID of the user that redeemed the reward.
     *
     * @return
     */
    public String userId() {
        return this.user_id;
    }

    /**
     * Login of the user that redeemed the reward.
     *
     * @return
     */
    public String userLogin() {
        return this.user_login;
    }

    /**
     * Display name of the user that redeemed the reward.
     *
     * @return
     */
    public String userName() {
        return this.user_name;
    }

    /**
     * The redemption identifier.
     *
     * @return
     */
    public String id() {
        return this.id;
    }

    /**
     * The user input provided. Empty string if not provided.
     *
     * @return
     */
    public String userInput() {
        return this.user_input;
    }

    /**
     * The status of the redemption as a string.
     *
     * @return
     */
    public String statusString() {
        return this.sStatus;
    }

    /**
     * The status of the redemption.
     *
     * @return
     */
    public RedemptionStatus status() {
        return this.status;
    }

    /**
     * Basic information about the reward that was redeemed, at the time it was redeemed.
     *
     * @return
     */
    public ChannelPointsReward reward() {
        return this.reward;
    }

    /**
     * RFC3339 timestamp of when the reward was redeemed as a string.
     *
     * @return
     */
    public String redeemedAtString() {
        return this.sRedeemed_at;
    }

    /**
     * Timestamp of when the reward was redeemed.
     *
     * @return
     */
    public ZonedDateTime redeemedAt() {
        return this.redeemed_at;
    }
}
