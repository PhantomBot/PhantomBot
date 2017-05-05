/*
 * Copyright (C) 2017 phantombot.tv
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
package me.mast3rplan.phantombot.cache;

import com.gmt2001.TwitchAPIv3;

import java.util.Calendar;
import java.util.HashMap;
import java.util.Date;
import java.util.Map;

import me.mast3rplan.phantombot.event.twitch.follower.TwitchFollowsInitializedEvent;
import me.mast3rplan.phantombot.event.twitch.follower.TwitchFollowEvent;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.PhantomBot;

import org.json.JSONObject;
import org.json.JSONArray;

public class FollowersCache implements Runnable {

    private static final Map<String, FollowersCache> instances = new HashMap<>();
    private final Thread updateThread;
    private final String channelName;
    private Map<String, String> cache = new HashMap<>();
    private Date timeoutExpire = new Date();
    private Date lastFail = new Date();
    private Boolean firstUpdate = true;
    private Boolean hasFail = false;
    private Boolean killed = false;
    private int numfail = 0;
    
    /*
     * @function instance
     *
     * @param  {String} channelName
     * @return {Object}
     */
    public static FollowersCache instance(String channelName) {
        FollowersCache instance = instances.get(channelName);

        if (instance == null) {
            instance = new FollowersCache(channelName);
            instances.put(channelName, instance);
        }
        return instance;
    }

    /*
     * @function FollowersCache
     *
     * @param {String} channelName
     */
    private FollowersCache(String channelName) {
        this.updateThread = new Thread(this, "me.mast3rplan.phantombot.cache.FollowersCache");
        this.channelName = channelName;

        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        this.updateThread.start();
    }

    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
        try {
            Thread.sleep(20 * 1000);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.err.println("FollowersCache.run: Failed to initial sleep [InterruptedException]: " + ex.getMessage());
        }

        while (!killed) {
            try {
                try {
                    if (new Date().after(timeoutExpire)) {
                        updateCache();
                    }
                } catch (Exception ex) {
                    checkLastFail();
                    com.gmt2001.Console.debug.println("FollowersCache.run: Failed to update followers: " + ex.getMessage());
                }
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("FollowersCache.run: Failed to update followers [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            }

            try {
                Thread.sleep(30 * 1000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.println("FollowersCache.run: Failed to sleep [InterruptedException]: " + ex.getMessage());
            }
        }
    }

    /*
     * @function updateCache
     */
    private void updateCache() throws Exception {
        com.gmt2001.Console.debug.println("FollowersCache::updateCache");

        JSONObject jsonObject = TwitchAPIv3.instance().GetChannelFollows(this.channelName, 100, 0, false);
        Map<String, String> newCache = new HashMap<>();

        if (jsonObject.getBoolean("_success")) {
            if (jsonObject.getInt("_http") == 200) {
                JSONArray jsonArray = jsonObject.getJSONArray("follows");
                
                for (int i = 0; i < jsonArray.length(); i++) {
                    String follower = jsonArray.getJSONObject(i).getJSONObject("user").getString("name");

                    if (!cache.containsKey(follower)) {
                        EventBus.instance().post(new TwitchFollowEvent(follower, PhantomBot.getChannel(this.channelName)));
                    }
                    newCache.put(follower, follower);
                }
            } else {
                throw new Exception("[HTTPErrorException] HTTP " + jsonObject.getInt("_http") + " " + jsonObject.getString("error") + ". req="
                    + jsonObject.getString("_type") + " " + jsonObject.getString("_url") + " " + jsonObject.getString("_post") + "  "
                    + (jsonObject.has("message") && !jsonObject.isNull("message") ? "message=" + jsonObject.getString("message") : "content=" + jsonObject.getString("_content")));
            }
        } else {
            throw new Exception("[" + jsonObject.getString("_exception") + "] " + jsonObject.getString("_exceptionMessage"));
        }

        if (!killed && firstUpdate) {
            firstUpdate = false;
            EventBus.instance().post(new TwitchFollowsInitializedEvent(PhantomBot.getChannel(this.channelName)));
        }
        setCache(newCache);
    }

    /*
     * @function checkLastFail
     */
    private void checkLastFail() {
        Calendar cal = Calendar.getInstance();
        numfail = (lastFail.after(new Date()) ? numfail + 1 : 1);

        cal.add(Calendar.MINUTE, 1);
        lastFail = cal.getTime();

        if (numfail > 5) {
            timeoutExpire = cal.getTime();
        }
    }

    /*
     * @function setCache
     *
     * @param {Map} cache
     */
    public void setCache(Map<String, String> cache) {
        this.cache = cache;
    }

    /*
     * @function getCache
     *
     * @return {Map}
     */
    public Map<String, String> getCache() {
        return this.cache;
    }

    /*
     * @function kill
     */
    public void kill() {
        this.killed = true;
    }

    /*
     * @function killall
     */
    public static void killall() {
        for (FollowersCache instance : instances.values()) {
            instance.kill();
        }
    }
}
