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
package tv.phantombot.event.twitch.follower;

import tv.phantombot.event.twitch.TwitchEvent;

public abstract class TwitchFollowerEvent extends TwitchEvent {

    private final String follower;
    private final String date;

    /**
     * Abstract constructor
     *
     * @param follower
     * @param date
     */
    protected TwitchFollowerEvent(String follower, String date) {
        this.follower = follower;
        this.date = date;
    }

    /**
     * Method that returns the follower's username.
     *
     * @param follower
     */
    public String getFollower() {
        return this.follower;
    }

    /**
     * Method that returns the follower's follow date.
     *
     * @param date
     */
    public String getFollowDate() {
        return this.date;
    }
}
