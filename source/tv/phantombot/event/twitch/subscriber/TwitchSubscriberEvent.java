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

import tv.phantombot.event.twitch.TwitchEvent;

public class TwitchSubscriberEvent extends TwitchEvent {

    private final String subscriber;
    private final String plan;
    private final String months;
    private final String message;

    /**
     * Class constructor.
     *
     * @param subscriber
     * @param plan
     * @param months
     * @param message
     */
    public TwitchSubscriberEvent(String subscriber, String plan, String months, String message) {
        this.subscriber = subscriber;
        this.plan = plan;
        this.months = months;
        this.message = message;
    }

    /**
     * Method that returns the subscriber's name.
     *
     * @return subscriber
     */
    public String getSubscriber() {
        return this.subscriber;
    }

    public String getUsername() {
        return this.getSubscriber();
    }

    /**
     * Method that returns the subscription plan. (1000, 2000, 3000 and Prime)
     *
     * @return plan
     */
    public String getPlan() {
        return this.plan;
    }

    /**
     * Method that returns the cumulative months.
     *
     * @return months
     */
    public String getMonths() {
        return this.months;
    }

    public String getMessage() {
        return this.message;
    }
}
