/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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

import java.util.Date;
import reactor.core.publisher.Mono;

/**
 * Abstract base class for EventSub Subscription Types
 *
 * @author gmt2001
 */
public abstract class EventSubSubscriptionType {

    protected EventSubSubscription subscription;
    protected String messageId;
    protected Date messageTimestamp;

    protected EventSubSubscriptionType() {
    }

    protected EventSubSubscriptionType(EventSubSubscription subscription, String messageId, Date messageTimestamp) {
        this.subscription = subscription;
        this.messageId = messageId;
        this.messageTimestamp = messageTimestamp;
    }

    protected Mono<EventSubSubscription> create() {
        return EventSub.instance().createSubscription(proposeSubscription());
    }

    protected abstract EventSubSubscription proposeSubscription();

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
    public Date getMessageTimestamp() {
        return this.messageTimestamp;
    }
}
