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
package tv.phantombot.event.twitch.subscriber;

/**
 *
 * @author Branden
 */
public class TwitchAnonymousSubscriptionGiftEvent extends TwitchSubscriptionGiftEvent {

    /**
     * The class constructor.
     *
     * @param recipient
     * @param plan
     */
    public TwitchAnonymousSubscriptionGiftEvent(String recipient, String plan) {
        super("anonymous", recipient, null, plan, null);
    }

    /**
     * The class constructor.
     *
     * @param recipient
     * @param months
     * @param plan
     */
    public TwitchAnonymousSubscriptionGiftEvent(String recipient, String months, String plan) {
        super("anonymous", recipient, months, plan, null);
    }

    /**
     * The class constructor.
     *
     * @param recipient
     * @param months
     * @param plan
     * @param giftedMonths
     */
    public TwitchAnonymousSubscriptionGiftEvent(String recipient, String months, String plan, String giftedMonths) {
        super("anonymous", recipient, months, plan, giftedMonths);
    }
}
