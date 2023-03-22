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

import com.gmt2001.twitch.cache.ViewerCache;

/**
 * @deprecated Please use {@link ViewerCache} instead
 */
@Deprecated(since = "3.8.0.0", forRemoval = true)
public class ViewerListCache {

    private static ViewerListCache instance = null;

    /**
     * Method to get this instance.
     *
     * @param channelName
     * @return
     */
    public static synchronized ViewerListCache instance(String channelName) {
        if (instance == null) {
            instance = new ViewerListCache();
        }

        return instance;
    }

    /**
     * Class constructor.
     */
    private ViewerListCache() {}

    /**
     * Method to check if a user is in the cache.
     *
     * @param username
     * @return
     */
    public boolean hasUser(String username) {
        return ViewerCache.instance().chatters().stream().filter(v -> v.login().equalsIgnoreCase(username)).findFirst().isPresent();
    }

    public void addUser(String username) {}
}
