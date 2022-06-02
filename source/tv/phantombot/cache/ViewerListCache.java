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
package tv.phantombot.cache;

import com.gmt2001.TwitchAPIv5;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.irc.channel.IrcChannelUsersUpdateEvent;

public class ViewerListCache implements Runnable {

    private static ViewerListCache instance = null;
    private final String channelName;
    private final Thread thread;
    private List<String> cache = new ArrayList<>();
    private boolean isKilled = false;

    /**
     * Method to get this instance.
     *
     * @param channelName
     * @return
     */
    public static synchronized ViewerListCache instance(String channelName) {
        if (instance == null) {
            instance = new ViewerListCache(channelName);
        }

        return instance;
    }

    /**
     * Class constructor.
     *
     * @param channelName
     */
    private ViewerListCache(String channelName) {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        this.channelName = channelName;

        this.thread = new Thread(this, "tv.phantombot.cache.ViewerListCache");
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.thread.start();
    }

    /**
     * Method that updates the cache every 10 minutes.
     */
    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
        while (!isKilled) {
            try {
                this.updateCache();
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            try {
                Thread.sleep(600 * 1000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.println("ViewerListCache::run: Failed to execute sleep [InterruptedException]: " + ex.getMessage());
            }
        }
    }

    /**
     * Method that updates the cache.
     */
    private void updateCache() throws Exception {
        String[] types = new String[]{"moderators", "staff", "admins", "vips", "viewers"};
        List<String> cache = new ArrayList<>();
        List<String> joins = new ArrayList<>();
        List<String> parts = new ArrayList<>();

        com.gmt2001.Console.debug.println("ViewerListCache::updateCache");
        try {
            JSONObject object = TwitchAPIv5.instance().GetChatUsers(channelName);
            JSONObject chatters;

            if (object.getBoolean("_success") && object.getInt("_http") == 200) {
                if (object.getInt("chatter_count") == 0) {
                    this.cache = cache;
                    return;
                }

                // Add the new chatters to a new cache.
                chatters = object.getJSONObject("chatters");
                for (String type : types) {
                    JSONArray array = chatters.getJSONArray(type);
                    for (int i = 0; i < array.length(); i++) {
                        cache.add(array.getString(i));
                    }
                }

                // Check for new users that joined.
                for (int i = 0; i < cache.size(); i++) {
                    if (!this.cache.contains(cache.get(i))) {
                        joins.add(cache.get(i));
                    }
                }

                // Check for old users that left.
                for (int i = 0; i < this.cache.size(); i++) {
                    if (!cache.contains(this.cache.get(i))) {
                        parts.add(this.cache.get(i));
                    }
                }

                EventBus.instance().postAsync(new IrcChannelUsersUpdateEvent(joins.toArray(new String[joins.size()]), parts.toArray(new String[parts.size()])));
                // Set the new cache.
                this.cache = cache;
                // Delete the temp caches.
                cache = null;
                parts = null;
                joins = null;
                // Run the GC to clear memory,
                System.gc();
            } else {
                com.gmt2001.Console.debug.println("Failed to update viewers cache: " + object);
            }
        } catch (JSONException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    /**
     * Method to check if a user is in the cache.
     *
     * @param username
     * @return
     */
    public boolean hasUser(String username) {
        return (!this.cache.isEmpty() ? this.cache.contains(username) : true);
    }

    /**
     * Method to add users to the cache.
     *
     * @param username
     */
    public void addUser(String username) {
        this.cache.add(username);
    }

    /**
     * Method to kill this cache.
     */
    public void kill() {
        this.isKilled = true;
    }
}
