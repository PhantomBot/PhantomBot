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
package tv.phantombot.event.twitch.host;

import tv.phantombot.event.twitch.TwitchEvent;

public abstract class TwitchHostEvent extends TwitchEvent {
    private final String hoster;
    private final int users;

    /**
     * Abstract constructor.
     *
     * @param hoster
     */
    protected TwitchHostEvent(String hoster) {
        this.hoster = hoster;
        this.users = 0;
    }

    /**
     * Abstract constructor.
     *
     * @param hoster
     * @param    users
     */
    protected TwitchHostEvent(String hoster, int users) {
        this.hoster = hoster;
        this.users = users;
    }

    /**
     * Method that gets the hosters name.
     *
     * @return hoster
     */
    public String getHoster() {
        return this.hoster;
    }

    /**
     * Method that gets the amount of users the user hosted for.
     *
     * @return users
     */
    public int getUsers() {
        return this.users;
    }
}
