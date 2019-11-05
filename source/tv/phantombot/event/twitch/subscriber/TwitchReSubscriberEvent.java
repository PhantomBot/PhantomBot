/*
 * Copyright (C) 2016-2019 phantombot.tv
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

public class TwitchReSubscriberEvent extends TwitchEvent {
    private final String resubscriber;
    private final String months;
    private final String plan;

    /**
     * Class constructor.
     *
     * @param {String} resubscriber
     * @param {String} months
     */
    public TwitchReSubscriberEvent(String resubscriber, String months) {
        this.resubscriber = resubscriber;
        this.months = months;
        this.plan = null;
    }

    /**
     * Class constructor.
     *
     * @param {String} resubscriber
     * @param {String} months
     * @param {String} plan
     */
    public TwitchReSubscriberEvent(String resubscriber, String months, String plan) {
        this.resubscriber = resubscriber;
        this.months = months;
        this.plan = plan;
    }

    /**
     * Method that returns the resubscriber.
     *
     * @return {String} resubscriber
     */
    public String getReSubscriber() {
        return this.resubscriber;
    }

    /**
     * Method that returns the resub months.
     *
     * @return {String} months
     */
    public String getMonths() {
        return this.months;
    }

    /**
     * Method that returns the subcription plan. (1000, 2000, 3000 and Prime)
     *
     * @return {String} plan
     */
    public String getPlan() {
        return this.plan;
    }
}
