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
import java.util.Map;
import java.util.concurrent.Flow;

import reactor.core.publisher.Mono;

/**
 * Abstract base class for EventSub Subscription Types
 *
 * @author gmt2001
 */
public abstract class EventSubSubscriptionType implements Flow.Subscriber<EventSubInternalEvent>  {

    protected EventSubSubscription subscription;
    protected String messageId;
    protected ZonedDateTime messageTimestamp;
    protected Flow.Subscription flowsubscription = null;

    protected EventSubSubscriptionType() {
    }

    protected EventSubSubscriptionType(EventSubSubscription subscription, String messageId, ZonedDateTime messageTimestamp) {
        this.subscription = subscription;
        this.messageId = messageId;
        this.messageTimestamp = messageTimestamp;
    }

    protected final void subscribe() {
        EventSub.instance().subscribe(this);
    }

    @Override
    public final void onSubscribe(Flow.Subscription subscription) {
        this.flowsubscription = subscription;
        this.flowsubscription.request(1);
    }

    @Override
    public final void onNext(EventSubInternalEvent item) {
        this.onEventSubInternalEvent(item);

        if (item instanceof EventSubInternalNotificationEvent) {
            this.onEventSubInternalNotificationEvent((EventSubInternalNotificationEvent)item);
        }

        if (item instanceof EventSubInternalRevocationEvent) {
            this.onEventSubInternalRevocationEvent((EventSubInternalRevocationEvent)item);
        }

        if (item instanceof EventSubInternalVerificationEvent) {
            this.onEventSubInternalVerificationEvent((EventSubInternalVerificationEvent)item);
        }

        this.flowsubscription.request(1);
    }

    @Override
    public final void onError(Throwable throwable) {
        com.gmt2001.Console.err.printStackTrace(throwable);
    }

    @Override
    public final void onComplete() {
        this.flowsubscription = null;
    }

    protected void onEventSubInternalEvent(EventSubInternalEvent e) {
    }

    protected void onEventSubInternalNotificationEvent(EventSubInternalNotificationEvent e) {
    }

    protected void onEventSubInternalRevocationEvent(EventSubInternalRevocationEvent e) {
    }

    protected void onEventSubInternalVerificationEvent(EventSubInternalVerificationEvent e) {
    }

    /**
     * Creates a new EventSub subscription, using the parameters provided via other methods or the constructor.
     * If a matching subscription already exists, returns that instead
     *
     * @return
     */
    public Mono<EventSubSubscription> create() {
        return this.create(false);
    }

    /**
     * Creates a new EventSub subscription, using the parameters provided via other methods or the constructor.
     * If a matching subscription already exists, returns that instead
     *
     * @param force If {@code true}, attempt to create the subscription even if one already exists
     *
     * @return
     */
    public Mono<EventSubSubscription> create(boolean force) {
        this.validateParameters();
        if (!force && this.isAlreadySubscribed()) {
            return Mono.just(this.getExistingSubscription());
        }
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
     * @param version The subscription type version
     * @param condition The conditions which will trigger notifications for this subscription
     * @return
     */
    protected EventSubSubscription proposeSubscriptionInternal(String type, String version, Map<String, String> condition) {
        return new EventSubSubscription("", EventSubSubscription.SubscriptionStatus.NOT_CREATED_YET, type, version, -1, condition, ZonedDateTime.now(), this.proposeTransport());
    }

    /**
     * Creates a transport for a proposed subscription
     *
     * @return
     */
    protected EventSubTransport proposeTransport() {
        /**
         * @botproperty eventsubcallbackurl - The URL which will receive EventSub notifications
         */
        return EventSubTransport.websocket(EventSub.instance().sessionId());
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
        return EventSub.instance().subscriptions().values().stream().anyMatch(possibleSubscription -> {
            return this.isMatch(possibleSubscription)
                    && (possibleSubscription.status() == EventSubSubscription.SubscriptionStatus.ENABLED
                    || possibleSubscription.status() == EventSubSubscription.SubscriptionStatus.WEBHOOK_CALLBACK_VERIFICATION_PENDING);
        });
    }

    /**
     * Returns the existing subscription, if one already exists in either the ENABLED or WEBHOOK_CALLBACK_VERIFICATION_PENDING states
     *
     * @return
     */
    public EventSubSubscription getExistingSubscription() {
        return EventSub.instance().subscriptions().values().stream().filter(possibleSubscription -> {
            return this.isMatch(possibleSubscription)
                    && (possibleSubscription.status() == EventSubSubscription.SubscriptionStatus.ENABLED
                    || possibleSubscription.status() == EventSubSubscription.SubscriptionStatus.WEBHOOK_CALLBACK_VERIFICATION_PENDING);
        }).findFirst().orElse(null);
    }

    /**
     * Returns the subscription id if a subscription already exists in either the ENABLED or WEBHOOK_CALLBACK_VERIFICATION_PENDING states, otherwise
     * null
     *
     * @return
     */
    public String findMatchingSubscriptionId() {
        return EventSub.instance().subscriptions().values().stream().filter(possibleSubscription -> {
            return this.isMatch(possibleSubscription)
                    && (possibleSubscription.status() == EventSubSubscription.SubscriptionStatus.ENABLED
                    || possibleSubscription.status() == EventSubSubscription.SubscriptionStatus.WEBHOOK_CALLBACK_VERIFICATION_PENDING);
        }).findFirst().map(EventSubSubscription::id).orElse(null);
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
    public EventSubSubscription subscription() {
        return this.subscription;
    }

    /**
     * Gets the message id, if the object was created as part of a notification
     *
     * @return
     */
    public String messageId() {
        return this.messageId;
    }

    /**
     * Gets the message timestamp, if the object was created as part of a notification
     *
     * @return
     */
    public ZonedDateTime messageTimestamp() {
        return this.messageTimestamp;
    }
}
