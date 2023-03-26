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
package tv.phantombot.event.twitch;

import com.gmt2001.twitch.cache.ViewerCache;

/**
 * A user that is tracked by {@link ViewerCache} has changed their login name
 */
public class TwitchUserLoginChangedEvent extends TwitchEvent {
    private final String id;
    private final String oldLogin;
    private final String newLogin;

    /**
     * Constructor
     *
     * @param id The user id
     * @param oldLogin The old user login
     * @param newLogin The new user login
     */
    public TwitchUserLoginChangedEvent(String id, String oldLogin, String newLogin) {
        super();
        this.id = id;
        this.oldLogin = oldLogin;
        this.newLogin = newLogin;
    }

    /**
     * The user id
     *
     * @return The user id
     */
    public String id() {
        return this.id;
    }

    /**
     * The old user login
     *
     * @return The old user login
     */
    public String oldLogin() {
        return this.oldLogin;
    }

    /**
     * The new user login
     *
     * @return The new user login
     */
    public String newLogin() {
        return this.newLogin;
    }
}
