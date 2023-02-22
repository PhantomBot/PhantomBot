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
package com.gmt2001.twitch.eventsub.subscriptions;

import com.gmt2001.twitch.eventsub.EventSub;
import com.gmt2001.twitch.eventsub.EventSubInternalRevocationEvent;
import com.gmt2001.twitch.eventsub.EventSubSubscription;
import com.gmt2001.twitch.eventsub.EventSubSubscriptionType;

import tv.phantombot.event.EventBus;
import tv.phantombot.event.eventsub.EventSubRevocationEvent;

/**
 * Handles notification that a webhook has been revoked.
 *
 * @author gmt2001
 */
public final class Revocation extends EventSubSubscriptionType {

    /**
     * Only used by EventSub for handler registration
     */
    public Revocation() {
        super();
        this.subscribe();
    }

    @Override
    public EventSubSubscription proposeSubscription() {
        throw new UnsupportedOperationException("Not a valid subscription type.");
    }

    @Override
    public void validateParameters() throws IllegalArgumentException {
        throw new UnsupportedOperationException("Not a valid subscription type.");
    }

    @Override
    protected boolean isMatch(EventSubSubscription subscription) {
        throw new UnsupportedOperationException("Not a valid subscription type.");
    }

    @Override
    protected void onEventSubInternalRevocationEvent(EventSubInternalRevocationEvent e) {
        EventSub.debug("revocation");
        EventBus.instance().postAsync(new EventSubRevocationEvent(e.subscription()));
    }
}
