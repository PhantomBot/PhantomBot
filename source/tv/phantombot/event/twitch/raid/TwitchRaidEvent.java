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
package tv.phantombot.event.twitch.raid;

import tv.phantombot.event.twitch.TwitchEvent;

public class TwitchRaidEvent extends TwitchEvent {
    private final String username;
    private final String viewers;

    /**
     * Class constructor.
     *
     * @param username
     * @param viewers
     */
    public TwitchRaidEvent(String username, String viewers) {
        this.username = username;
        this.viewers = viewers;
    }

    /**
     * Method that returns the username who hosted.
     *
     * @return username
     */
    public String getUsername() {
        return this.username;
    }

    /**
     * Method that returns the amount of users who raided.
     *
     * @return viewers
     */
    public String getViewers() {
        return this.viewers;
    }
}
