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

import com.scaniatv.StreamElementsAPIv2;
import java.util.Calendar;
import java.util.Date;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;
import org.json.JSONArray;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.streamelements.donate.StreamElementsDonationEvent;
import tv.phantombot.event.streamelements.donate.StreamElementsDonationInitializedEvent;

public class StreamElementsCache implements Runnable {

    private static final Map<String, StreamElementsCache> instances = new ConcurrentHashMap<>();
    private final Thread updateThread;
    private Map<String, JSONObject> cache = new ConcurrentHashMap<>();
    private Date timeoutExpire = new Date();
    private Date lastFail = new Date();
    private boolean firstUpdate = true;
    private boolean killed = false;
    private int numfail = 0;

    /**
     * Used to call and start this instance.
     *
     * @param channel Channel to run the cache for.
     */
    public static StreamElementsCache instance(String channel) {
        StreamElementsCache instance = instances.get(channel);

        if (instance == null) {
            instance = new StreamElementsCache();
            instances.put(channel, instance);
        }
        return instance;
    }

    /**
     * Starts this class on a new thread.
     *
     * @param channel Channel to run the cache for.
     */
    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private StreamElementsCache() {
        this.updateThread = new Thread(this, "tv.phantombot.cache.StreamElementsCache");

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        this.updateThread.start();
    }

    /**
     * Checks if the donation has been cached.
     *
     * @return
     */
    public boolean exists(String donationID) {
        return cache.containsKey(donationID);
    }

    /**
     * Returns the current cache count (size/length),
     *
     * @return
     */
    public int count() {
        return cache.size();
    }

    /**
     * Checks the amount of time we failed when calling the api to avoid abusing it.
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

    /**
     * Starts the cache loop.
     */
    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
        try {
            Thread.sleep(20 * 1000);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.debug.println("StreamElementsCache.run: Failed to execute initial sleep [InterruptedException]: " + ex.getMessage());
        }

        while (!killed) {
            try {
                if (new Date().after(timeoutExpire)) {
                    this.updateCache();
                }
            } catch (Exception ex) {
                checkLastFail();
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            try {
                Thread.sleep(30 * 1000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("StreamElementsCache.run: Failed to sleep [InterruptedException]: " + ex.getMessage());
            }
        }
    }

    /**
     * Updates the cache by calling the TipeeeStream API.
     */
    private void updateCache() throws Exception {
        Map<String, JSONObject> newCache = new ConcurrentHashMap<>();
        JSONObject jsonResult;
        JSONObject object;
        JSONArray donations = null;

        com.gmt2001.Console.debug.println("StreamElementsCache::updateCache");

        jsonResult = StreamElementsAPIv2.instance().GetDonations();

        if (jsonResult.getBoolean("_success")) {
            if (jsonResult.getInt("_http") == 200) {
                if (jsonResult.has("docs")) {
                    donations = jsonResult.getJSONArray("docs");
                    for (int i = 0; i < donations.length(); i++) {
                        object = donations.getJSONObject(i);
                        newCache.put(object.getString("_id"), object);
                    }
                }
            } else {
                if (jsonResult.has("error") && jsonResult.getString("error").equalsIgnoreCase("Unauthorized")) {
                    com.gmt2001.Console.err.println("StreamElementsCache.updateCache: Bad JWT token disabling the StreamElements module.");
                    PhantomBot.instance().getDataStore().SetString("modules", "", "./handlers/streamElementsHandler.js", "false");
                    killed = true;
                }
            }
        }

        if (firstUpdate && !killed) {
            firstUpdate = false;
            EventBus.instance().postAsync(new StreamElementsDonationInitializedEvent());
        }

        if (donations != null && !killed) {
            for (int i = 0; i < donations.length(); i++) {
                if ((cache == null || !cache.containsKey(donations.getJSONObject(i).getString("_id")))
                        && !PhantomBot.instance().getDataStore().exists("donations", donations.getJSONObject(i).getString("_id"))) {
                    EventBus.instance().postAsync(new StreamElementsDonationEvent(donations.getJSONObject(i).toString()));
                }
            }
        }

        this.cache = newCache;
    }

    /**
     * Sets the current cache.
     *
     * @param Cache
     */
    public void setCache(Map<String, JSONObject> cache) {
        this.cache = cache;
    }

    /**
     * Returns the current cache.
     *
     * @return Current cache.
     */
    public Map<String, JSONObject> getCache() {
        return cache;
    }

    /**
     * Kills the current cache.
     */
    public void kill() {
        killed = true;
    }

    /**
     * Kills all the caches.
     */
    public static void killall() {
        for (Entry<String, StreamElementsCache> instance : instances.entrySet()) {
            instance.getValue().kill();
        }
    }
}
