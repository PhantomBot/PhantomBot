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
package com.gmt2001.eventsub.subscriptions;

import com.gmt2001.eventsub.EventSubInternalVerificationEvent;
import com.gmt2001.eventsub.EventSubSubscription;
import com.gmt2001.eventsub.EventSubSubscriptionType;
import net.engio.mbassy.listener.Handler;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.eventsub.EventSubWebhookValidatedEvent;

/**
 * Handles notification that a webhook has been validated and is now active.
 *
 * @author gmt2001
 */
public class WebhookValidated extends EventSubSubscriptionType {

    protected WebhookValidated() {
    }

    @Override
    protected EventSubSubscription proposeSubscription() {
        throw new UnsupportedOperationException("Not a valid subscription type.");
    }

    @Override
    protected void validateParameters() throws IllegalArgumentException {
        throw new UnsupportedOperationException("Not a valid subscription type.");
    }

    @Override
    public boolean isAlreadySubscribed() {
        throw new UnsupportedOperationException("Not a valid subscription type.");
    }

    @Override
    public String findMatchingSubscriptionId() {
        throw new UnsupportedOperationException("Not a valid subscription type.");
    }

    @Handler
    public void onEventSubInternalVerificationEvent(EventSubInternalVerificationEvent e) {
        EventBus.instance().postAsync(new EventSubWebhookValidatedEvent(e.getSubscription()));
    }

}
