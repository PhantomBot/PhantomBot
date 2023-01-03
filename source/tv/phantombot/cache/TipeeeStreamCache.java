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

import com.scaniatv.TipeeeStreamAPIv1;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;
import org.json.JSONArray;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.tipeeestream.donate.TipeeeStreamDonationEvent;
import tv.phantombot.event.tipeeestream.donate.TipeeeStreamDonationInitializedEvent;

public class TipeeeStreamCache implements Runnable {

    private static final Map<String, TipeeeStreamCache> instances = new ConcurrentHashMap<>();
    private final Thread updateThread;
    private Map<String, String> cache = new ConcurrentHashMap<>();
    private Instant timeoutExpire = Instant.now();
    private Instant lastFail = Instant.now();
    private boolean firstUpdate = true;
    private boolean killed = false;
    private int numfail = 0;

    /**
     * Used to call and start this instance.
     *
     * @param channel Channel to run the cache for.
     * @return
     */
    public static TipeeeStreamCache instance(String channel) {
        TipeeeStreamCache instance = instances.get(channel);

        if (instance == null) {
            instance = new TipeeeStreamCache();
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
    private TipeeeStreamCache() {
        this.updateThread = new Thread(this, "tv.phantombot.cache.TipeeeStreamCache");

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        this.updateThread.start();
    }

    /**
     * Checks if the donation has been cached.
     *
     * @param donationID
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
        numfail = (lastFail.isAfter(Instant.now()) ? numfail + 1 : 1);

        lastFail = Instant.now().plus(1, ChronoUnit.MINUTES);

        if (numfail > 5) {
            timeoutExpire = Instant.now().plus(1, ChronoUnit.MINUTES);
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
            com.gmt2001.Console.debug.println("TipeeeStreamCache.run: Failed to execute initial sleep [InterruptedException]: " + ex.getMessage());
        }

        while (!killed) {
            try {
                if (Instant.now().isAfter(timeoutExpire)) {
                    this.updateCache();
                }
            } catch (Exception ex) {
                checkLastFail();
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            try {
                Thread.sleep(30 * 1000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("TipeeeStreamCache.run: Failed to sleep [InterruptedException]: " + ex.getMessage());
            }
        }
    }

    /**
     * Updates the cache by calling the TipeeeStream API.
     */
    private void updateCache() throws Exception {
        Map<String, String> newCache = new ConcurrentHashMap<>();
        JSONObject jsonResult;
        JSONObject object;
        JSONArray donations = null;

        com.gmt2001.Console.debug.println("TipeeeStreamCache::updateCache");

        jsonResult = TipeeeStreamAPIv1.instance().GetDonations();

        if (jsonResult.getBoolean("_success")) {
            if (jsonResult.getInt("_http") == 200) {
                if (jsonResult.has("datas")) {
                    object = jsonResult.getJSONObject("datas");
                    if (object.has("items")) {
                        donations = object.getJSONArray("items");
                        for (int i = 0; i < donations.length(); i++) {
                            newCache.put(donations.getJSONObject(i).get("id").toString(), donations.getJSONObject(i).get("id").toString());
                        }
                    }
                }
            } else {
                if (jsonResult.optString("message", "").contains("authentification")) {
                    com.gmt2001.Console.err.println("TipeeeStreamCache.updateCache: Bad API key disabling the TipeeeStream module.");
                    PhantomBot.instance().getDataStore().SetString("modules", "", "./handlers/tipeeestreamHandler.js", "false");
                    this.kill();
                }
            }
        }

        if (firstUpdate && !killed) {
            firstUpdate = false;
            EventBus.instance().postAsync(new TipeeeStreamDonationInitializedEvent());
        }

        if (donations != null && !killed) {
            for (int i = 0; i < donations.length(); i++) {
                if ((cache == null || !cache.containsKey(donations.getJSONObject(i).get("id").toString()))
                        && !PhantomBot.instance().getDataStore().exists("donations", donations.getJSONObject(i).get("id").toString())) {
                    EventBus.instance().postAsync(new TipeeeStreamDonationEvent(donations.getJSONObject(i).toString()));
                }
            }
        }
        this.cache = newCache;
    }

    /**
     * Sets the current cache.
     *
     * @param cache
     */
    public void setCache(Map<String, String> cache) {
        this.cache = cache;
    }

    /**
     * Returns the current cache.
     *
     * @return Current cache.
     */
    public Map<String, String> getCache() {
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
        for (Entry<String, TipeeeStreamCache> instance : instances.entrySet()) {
            instance.getValue().kill();
        }
    }
}
