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

public class TwitchReSubscriberEvent extends TwitchEvent {
    private final String resubscriber;
    private final String months;
    private final String plan;
    private final String message;

    /**
     * Class constructor.
     *
     * @param resubscriber
     * @param months
     * @param plan
     */
    public TwitchReSubscriberEvent(String resubscriber, String months, String plan, String message) {
        this.resubscriber = resubscriber;
        this.months = months;
        this.plan = plan;
        this.message = message;
    }

    /**
     * Method that returns the resubscriber.
     *
     * @return resubscriber
     */
    public String getReSubscriber() {
        return this.resubscriber;
    }

    /**
     * Method that returns the resub months.
     *
     * @return months
     */
    public String getMonths() {
        return this.months;
    }

    /**
     * Method that returns the subcription plan. (1000, 2000, 3000 and Prime)
     *
     * @return plan
     */
    public String getPlan() {
        return this.plan;
    }
    
    public String getMessage() {
        return this.message;
    }
}
