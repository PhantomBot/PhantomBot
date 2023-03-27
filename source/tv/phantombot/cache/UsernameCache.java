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
package tv.phantombot.cache;

import java.util.HashMap;
import java.util.Map;

import com.gmt2001.twitch.cache.Viewer;
import com.gmt2001.twitch.cache.ViewerCache;

/**
 * @deprecated Please use {@link ViewerCache} instead. In scripts, use {@code $.viewer} instead of {@code $.username}
 */
@Deprecated(since = "3.8.0.0", forRemoval = true)
public class UsernameCache {

    private static final UsernameCache INSTANCE = new UsernameCache();

    public static UsernameCache instance() {
        return INSTANCE;
    }

    private UsernameCache() {}

    public String resolveBot() {
        return ViewerCache.instance().bot().name();
    }

    public String resolveCaster() {
        return ViewerCache.instance().broadcaster().name();
    }

    public String resolve(String username) {
        return resolve(username, new HashMap<>());
    }

    public String resolve(String username, Map<String, String> tags) {
        String lusername = username.toLowerCase();

        if (this.hasUser(lusername)) {
            return ViewerCache.instance().getByLogin(lusername).name();
        } else {
            if (username.equalsIgnoreCase("jtv") || username.equalsIgnoreCase("twitchnotify")) {
                return username;
            }

            if (tags.containsKey("display-name") && tags.get("display-name").equalsIgnoreCase(lusername) && tags.containsKey("user-id")) {
                return tags.get("display-name");
            }

            /* While the user-id should always be present, this is just a stop-gap measure. */
            if (tags.containsKey("display-name") && tags.get("display-name").equalsIgnoreCase(lusername)) {
                return tags.get("display-name");
            }

            ViewerCache.instance().getByLogin(lusername);
            if (this.hasUser(lusername)) {
                return ViewerCache.instance().getByLogin(lusername).name();
            } else {
                return lusername;
            }
        }
    }

    public boolean exists(String userName) {
        // Check the cache first, if the user doesn't exist call the API and check the cache again.
        if (this.hasUser(userName)) {
            return true;
        } else {
            ViewerCache.instance().getByLogin(userName);

            return this.hasUser(userName);
        }
    }

    public void addUser(String userName, String displayName, String userID) {}

    public boolean hasUser(String userName) {
        return ViewerCache.instance().loginExists(userName);
    }

    public String get(String userName) {
        return (this.hasUser(userName) ? this.resolve(userName) : userName);
    }

    public String getIDBot() {
        return ViewerCache.instance().bot().id();
    }

    public String getIDCaster() {
        return ViewerCache.instance().broadcaster().id();
    }

    public String getID(String userName) {
        Viewer viewer = ViewerCache.instance().getByLogin(userName);
        return viewer != null ? viewer.id() : "0";
    }

    public void removeUser(String userName) {}
}
