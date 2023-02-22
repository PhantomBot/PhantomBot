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
package com.gmt2001.twitch.eventsub;

import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

/**
 * EventSub Subscription Data
 *
 * @author gmt2001
 */
public final class EventSubSubscription {

    private final String id;
    private final SubscriptionStatus status;
    private final String type;
    private final String version;
    private final int cost;
    private final Map<String, String> condition;
    private final ZonedDateTime created_at;
    private final EventSubTransport transport;

    /**
     * The status of an EventSub subscription
     */
    public enum SubscriptionStatus {
        /**
         * Designates that the subscription is in an operable state and is valid.
         */
        ENABLED,
        /**
         * Webhook is pending verification of the callback specified in the subscription creation request.
         */
        WEBHOOK_CALLBACK_VERIFICATION_PENDING,
        /**
         * Webhook failed verification of the callback specified in the subscription creation request.
         */
        WEBHOOK_CALLBACK_VERIFICATION_FAILED,
        /**
         * Notification delivery failure rate was too high.
         */
        NOTIFICATION_FAILURES_EXCEEDED,
        /**
         * Authorization for user(s) in the condition was revoked.
         */
        AUTHORIZATION_REVOKED,
        /**
         * A user in the condition of the subscription was removed.
         */
        USER_REMOVED,
        /**
         * The specific version of the subscription type was removed.
         */
        VERSION_REMOVED,
        /**
         * The subscription was removed via API request, probably by a script on the bot.
         */
        API_REMOVED,
        /**
         * Subscription proposal that has not been submitted to the EventSub endpoint for creation yet.
         */
        NOT_CREATED_YET
    }

    EventSubSubscription(String id, String status, String type, String version, int cost, Map<String, String> condition, String created_at, EventSubTransport transport) {
        this.id = id;
        this.status = SubscriptionStatus.valueOf(status.toUpperCase());
        this.type = type;
        this.version = version;
        this.cost = cost;
        this.condition = new HashMap<>(condition);
        this.created_at = EventSub.parseDate(created_at);
        this.transport = transport;
    }

    EventSubSubscription(String id, SubscriptionStatus status, String type, String version, int cost, Map<String, String> condition, String created_at, EventSubTransport transport) {
        this.id = id;
        this.status = status;
        this.type = type;
        this.version = version;
        this.cost = cost;
        this.condition = new HashMap<>(condition);
        this.created_at = EventSub.parseDate(created_at);
        this.transport = transport;
    }

    EventSubSubscription(String id, String status, String type, String version, int cost, Map<String, String> condition, ZonedDateTime created_at, EventSubTransport transport) {
        this.id = id;
        this.status = SubscriptionStatus.valueOf(status.toUpperCase());
        this.type = type;
        this.version = version;
        this.cost = cost;
        this.condition = new HashMap<>(condition);
        this.created_at = created_at;
        this.transport = transport;
    }

    EventSubSubscription(String id, SubscriptionStatus status, String type, String version, int cost, Map<String, String> condition, ZonedDateTime created_at, EventSubTransport transport) {
        this.id = id;
        this.status = status;
        this.type = type;
        this.version = version;
        this.cost = cost;
        this.condition = new HashMap<>(condition);
        this.created_at = created_at;
        this.transport = transport;
    }

    EventSubSubscription(String type, String version, Map<String, String> condition, EventSubTransport transport) {
        this.id = "";
        this.status = SubscriptionStatus.NOT_CREATED_YET;
        this.type = type;
        this.version = version;
        this.cost = -1;
        this.condition = new HashMap<>(condition);
        this.created_at = ZonedDateTime.now();
        this.transport = transport;
    }

    /**
     * Creates a new subscription from a JSONObject
     *
     * @param subscriptionJson The JSON object to process
     * @return
     */
    static EventSubSubscription fromJSON(JSONObject subscriptionJson) {
        Map<String, String> condition = new HashMap<>();

        subscriptionJson.getJSONObject("condition").keySet().forEach(key -> condition.put(key, subscriptionJson.getJSONObject("condition").getString(key)));

        return new EventSubSubscription(
                subscriptionJson.getString("id"), subscriptionJson.getString("status"), subscriptionJson.getString("type"),
                subscriptionJson.getString("version"), subscriptionJson.getInt("cost"), condition, subscriptionJson.getString("created_at"),
                EventSubTransport.fromJSON(subscriptionJson.getJSONObject("transport"))
        );
    }

    /**
     * Clones the subscription with a new status
     *
     * @param newStatus The new status to apply to the clone
     * @return
     */
    EventSubSubscription clone(SubscriptionStatus newStatus) {
        return new EventSubSubscription(this.id(), newStatus, this.type(), this.version(), this.cost(), this.condition(),
                this.createdAt(), this.transport());
    }

    /**
     * Indicates if the subscription is enabled and valid.
     *
     * @return
     */
    public boolean isEnabled() {
        return this.status == SubscriptionStatus.ENABLED;
    }

    /**
     * Indicates if the subscription has been revoked for any reason.
     *
     * @return
     */
    public boolean isRevoked() {
        return this.status == SubscriptionStatus.API_REMOVED || this.status == SubscriptionStatus.AUTHORIZATION_REVOKED
                || this.status == SubscriptionStatus.NOTIFICATION_FAILURES_EXCEEDED || this.status == SubscriptionStatus.USER_REMOVED
                || this.status == SubscriptionStatus.WEBHOOK_CALLBACK_VERIFICATION_FAILED || this.status == SubscriptionStatus.VERSION_REMOVED;
    }

    /**
     * Indicates if the subscription is pending.
     *
     * @return
     */
    public boolean isPending() {
        return this.status == SubscriptionStatus.NOT_CREATED_YET || this.status == SubscriptionStatus.WEBHOOK_CALLBACK_VERIFICATION_PENDING;
    }

    /**
     * The subscription's unique id.
     *
     * @return
     */
    public String id() {
        return this.id;
    }

    /**
     * The status of the subscription.
     *
     * @return
     */
    public SubscriptionStatus status() {
        return this.status;
    }

    /**
     * The subscription's type.
     *
     * @return
     */
    public String type() {
        return this.type;
    }

    /**
     * The version of the subscription.
     *
     * @return
     */
    public String version() {
        return this.version;
    }

    /**
     * How much the subscription counts against your limit. See https://dev.twitch.tv/docs/eventsub#subscription-limits for more information.
     *
     * @return
     */
    public int cost() {
        return this.cost;
    }

    /**
     * Subscription-specific parameters.
     *
     * @return
     */
    public Map<String, String> condition() {
        return new HashMap<>(this.condition);
    }

    /**
     * The time the subscription was created.
     *
     * @return
     */
    public ZonedDateTime createdAt() {
        return this.created_at;
    }

    /**
     * Transport-specific parameters.
     *
     * @return
     */
    public EventSubTransport transport() {
        return this.transport;
    }
}
