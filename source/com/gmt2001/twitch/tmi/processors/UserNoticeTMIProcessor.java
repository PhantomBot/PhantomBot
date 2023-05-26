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
package com.gmt2001.twitch.tmi.processors;

import com.gmt2001.twitch.tmi.TMIMessage;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.irc.message.IrcChannelMessageEvent;
import tv.phantombot.event.irc.message.IrcPrivateMessageEvent;
import tv.phantombot.event.twitch.raid.TwitchRaidEvent;
import tv.phantombot.event.twitch.subscriber.TwitchAnonymousSubscriptionGiftEvent;
import tv.phantombot.event.twitch.subscriber.TwitchMassAnonymousSubscriptionGiftedEvent;
import tv.phantombot.event.twitch.subscriber.TwitchMassSubscriptionGiftedEvent;
import tv.phantombot.event.twitch.subscriber.TwitchPrimeSubscriberEvent;
import tv.phantombot.event.twitch.subscriber.TwitchReSubscriberEvent;
import tv.phantombot.event.twitch.subscriber.TwitchSubscriberEvent;
import tv.phantombot.event.twitch.subscriber.TwitchSubscriptionGiftEvent;

/**
 * Handles the USERNOTICE TMI Command
 *
 * @author gmt2001
 */
public final class UserNoticeTMIProcessor extends AbstractTMIProcessor {

    private static final String ANONYMOUS_GIFTER_TWITCH_USER = "ananonymousgifter";
    private final ConcurrentMap<String, Integer> bulkSubscriberGifters = new ConcurrentHashMap<>();

    public UserNoticeTMIProcessor() {
        super("USERNOTICE");
    }

    @Override
    protected void onMessage(TMIMessage item) {
        if (item.tags().containsKey("msg-id")) {
            if (item.tags().get("msg-id").equalsIgnoreCase("resub")) {
                EventBus.instance().postAsync(new TwitchReSubscriberEvent(item.tags().get("login"), item.tags().get("msg-param-cumulative-months"), item.tags().get("msg-param-sub-plan"), item.parameters()));
            } else if (item.tags().get("msg-id").equalsIgnoreCase("sub")) {
                if (item.tags().get("msg-param-sub-plan").equalsIgnoreCase("Prime")) {
                    EventBus.instance().postAsync(new TwitchPrimeSubscriberEvent(item.tags().get("login"), item.tags().get("msg-param-cumulative-months")));
                }
                EventBus.instance().postAsync(new TwitchSubscriberEvent(item.tags().get("login"), item.tags().get("msg-param-sub-plan"), item.tags().get("msg-param-cumulative-months"), item.parameters()));
            } else if (item.tags().get("msg-id").equalsIgnoreCase("subgift")) {
                this.onNextGift(item.tags());
            } else if (item.tags().get("msg-id").equalsIgnoreCase("anonsubgift")) {
                this.onNextGift(item.tags());
            } else if (item.tags().get("msg-id").equalsIgnoreCase("submysterygift")) {
                this.onMassGift(item.tags());
            } else if (item.tags().get("msg-id").equalsIgnoreCase("anonsubmysterygift")) {
                this.onMassGift(item.tags());
            } else if (item.tags().get("msg-id").equalsIgnoreCase("raid")) {
                EventBus.instance().postAsync(new TwitchRaidEvent(item.tags().get("login"), item.tags().get("msg-param-viewerCount")));
            } else if (item.tags().get("msg-id").equalsIgnoreCase("announcement")) {
                com.gmt2001.Console.out.println("[ANNOUNCEMENT (" + item.tags().get("msg-param-color") + ")] " + item.tags().get("display-name") + ": " + item.parameters());
                EventBus.instance().postAsync(new IrcChannelMessageEvent(this.session(), item.tags().get("login"), item.parameters(), item.tags()));
            }
        }
        EventBus.instance().postAsync(new IrcPrivateMessageEvent(this.session(), "jtv", item.parameters(), item.tags()));
    }

    private void onMassGift(Map<String, String> tags){
        this.bulkSubscriberGifters.compute(tags.get("login"), (key, value) -> {
            int r = Integer.parseInt(tags.get("msg-param-mass-gift-count"));
            if (value != null && value > 0) {
                r += value;
            }
            return r;
        });

        // Send event for this.
        if (tags.get("login").equalsIgnoreCase(ANONYMOUS_GIFTER_TWITCH_USER)) {
            EventBus.instance().postAsync(new TwitchMassAnonymousSubscriptionGiftedEvent(tags.get("msg-param-mass-gift-count"), tags.get("msg-param-sub-plan")));
        } else {
            EventBus.instance().postAsync(new TwitchMassSubscriptionGiftedEvent(tags.get("login"), tags.get("msg-param-mass-gift-count"), tags.get("msg-param-sub-plan")));
        }
    }

    private void onNextGift(Map<String, String> tags) {
        try {
            Integer newValue = this.bulkSubscriberGifters.computeIfPresent(tags.get("login"), (key, value) -> {
                return --value >= 0 ? value : null;
            });
            this.bulkSubscriberGifters.remove(tags.get("login"), 0);
            boolean fromBulk = newValue != null;
            if (tags.get("login").equalsIgnoreCase(ANONYMOUS_GIFTER_TWITCH_USER)) {
                EventBus.instance().postAsync(new TwitchAnonymousSubscriptionGiftEvent(tags.get("msg-param-recipient-user-name"), tags.get("msg-param-months"), tags.get("msg-param-sub-plan"), tags.get("msg-param-gift-months"), fromBulk));
            } else {
                EventBus.instance().postAsync(new TwitchSubscriptionGiftEvent(tags.get("login"), tags.get("msg-param-recipient-user-name"), tags.get("msg-param-months"), tags.get("msg-param-sub-plan"), tags.get("msg-param-gift-months"), fromBulk));
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }
}
