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
package com.gmt2001.eventsub;

import java.time.ZonedDateTime;
import java.util.Map;
import reactor.core.publisher.Mono;
import tv.phantombot.CaselessProperties;
import tv.phantombot.event.Listener;

/**
 * Abstract base class for EventSub Subscription Types
 *
 * @author gmt2001
 */
public abstract class EventSubSubscriptionType implements Listener {

    protected EventSubSubscription subscription;
    protected String messageId;
    protected ZonedDateTime messageTimestamp;

    protected EventSubSubscriptionType() {
    }

    protected EventSubSubscriptionType(EventSubSubscription subscription, String messageId, ZonedDateTime messageTimestamp) {
        this.subscription = subscription;
        this.messageId = messageId;
        this.messageTimestamp = messageTimestamp;
    }

    /**
     * Creates a new EventSub subscription, using the parameters provided via other methods or the constructor
     *
     * @return
     */
    public Mono<EventSubSubscription> create() {
        this.validateParameters();
        return EventSub.instance().createSubscription(this.proposeSubscription());
    }

    /**
     * Deletes the EventSub subscription matching the parameters in this object, if it can be found in the subscription list
     *
     * @return
     */
    public Mono<Void> delete() {
        this.validateParameters();
        return EventSub.instance().deleteSubscription(this.findMatchingSubscriptionId());
    }

    /**
     * Compiles the parameters of this object into an {@link EventSubSubscription} that can be created
     *
     * @return
     */
    protected abstract EventSubSubscription proposeSubscription();

    /**
     * Actually creates the proposed {@link EventSubSubscription}
     *
     * @param type The subscription type to create
     * @param condition The conditions which will trigger notifications for this subscription
     * @return
     */
    protected EventSubSubscription proposeSubscriptionInternal(String type, Map<String, String> condition) {
        return new EventSubSubscription("", EventSubSubscription.SubscriptionStatus.NOT_CREATED_YET, type, "1", -1, condition, ZonedDateTime.now(), this.proposeTransport());
    }

    /**
     * Creates a transport for a proposed subscription
     *
     * @return
     */
    protected EventSubTransport proposeTransport() {
        return new EventSubTransport("webhook", CaselessProperties.instance().getProperty("eventsubcallbackurl"), EventSub.getSecret());
    }

    /**
     * Validates that the provided parameters are acceptable for use in {@link proposeSubscription}
     *
     * @throws IllegalArgumentException One of the parameters is not acceptable
     */
    protected abstract void validateParameters() throws IllegalArgumentException;

    /**
     * Returns true if a subscription already exists in either the ENABLED or WEBHOOK_CALLBACK_VERIFICATION_PENDING states
     *
     * @return
     */
    public boolean isAlreadySubscribed() {
        return EventSub.instance().getSubscriptions().values().stream().anyMatch(possibleSubscription -> {
            return this.isMatch(possibleSubscription)
                    && (possibleSubscription.getStatus() == EventSubSubscription.SubscriptionStatus.ENABLED
                    || possibleSubscription.getStatus() == EventSubSubscription.SubscriptionStatus.WEBHOOK_CALLBACK_VERIFICATION_PENDING);
        });
    }

    /**
     * Returns the subscription id if a subscription already exists in either the ENABLED or WEBHOOK_CALLBACK_VERIFICATION_PENDING states, otherwise
     * null
     *
     * @return
     */
    public String findMatchingSubscriptionId() {
        return EventSub.instance().getSubscriptions().values().stream().filter(possibleSubscription -> {
            return this.isMatch(possibleSubscription)
                    && (possibleSubscription.getStatus() == EventSubSubscription.SubscriptionStatus.ENABLED
                    || possibleSubscription.getStatus() == EventSubSubscription.SubscriptionStatus.WEBHOOK_CALLBACK_VERIFICATION_PENDING);
        }).findFirst().map(EventSubSubscription::getId).orElse(null);
    }

    /**
     * Returns true if the provided subscription is an instance of the current subscription type and matches the current subscription conditions
     *
     * @param subscription
     * @return
     */
    protected abstract boolean isMatch(EventSubSubscription subscription);

    /**
     * Gets the subscription information, if the object was created as part of a notification
     *
     * @return
     */
    public EventSubSubscription getSubscription() {
        return this.subscription;
    }

    /**
     * Gets the message id, if the object was created as part of a notification
     *
     * @return
     */
    public String getMessageId() {
        return this.messageId;
    }

    /**
     * Gets the message timestamp, if the object was created as part of a notification
     *
     * @return
     */
    public ZonedDateTime getMessageTimestamp() {
        return this.messageTimestamp;
    }
}
