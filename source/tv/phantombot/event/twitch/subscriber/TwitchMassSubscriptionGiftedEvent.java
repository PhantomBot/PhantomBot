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
package tv.phantombot.event.twitch.subscriber;

import tv.phantombot.event.twitch.TwitchEvent;

public class TwitchMassSubscriptionGiftedEvent extends TwitchEvent {
    private final String username;
    private final String amount;
    private final String plan;

    /**
     * Class constructor.
     *
     * @param username
     * @param recipient
     * @param months
     * @param plan
     */
    public TwitchMassSubscriptionGiftedEvent(String username, String amount, String plan) {
        this.username = username;
        this.amount = amount;
        this.plan = plan;
    }

    /**
     * Method that returns the gifted the subscriptions.
     *
     * @return username
     */
    public String getUsername() {
        return this.username;
    }

    /**
     * Method that returns amount of subs gifted
     *
     * @return recipient
     */
    public String getAmount() {
        return this.amount;
    }

    /**
     * Method that returns the subcription plan. (1000, 2000, 3000 and Prime)
     *
     * @return plan
     */
    public String getPlan() {
        return this.plan;
    }
}
