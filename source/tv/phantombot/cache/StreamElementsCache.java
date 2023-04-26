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

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import org.json.JSONArray;
import org.json.JSONObject;

import com.gmt2001.ExecutorService;
import com.scaniatv.StreamElementsAPIv2;

import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.streamelements.donate.StreamElementsDonationEvent;
import tv.phantombot.event.streamelements.donate.StreamElementsDonationInitializedEvent;

public class StreamElementsCache {

    private static StreamElementsCache instance;
    private Map<String, JSONObject> cache = new ConcurrentHashMap<>();
    private ScheduledFuture<?> updateFuture = null;
    private boolean firstUpdate = true;

    public static StreamElementsCache instance() {
        if (instance == null) {
            instance = new StreamElementsCache();
        }

        return instance;
    }

    private StreamElementsCache() {
        this.updateFuture = ExecutorService.scheduleAtFixedRate(this::run, 20, 30, TimeUnit.SECONDS);
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

    private void run() {
        try {
            if (StreamElementsAPIv2.hasJWT()) {
                this.updateCache();
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
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
                    com.gmt2001.Console.err.println("StreamElementsCache.updateCache: Bad JWT token.");
                }
            }
        }

        if (firstUpdate) {
            firstUpdate = false;
            EventBus.instance().postAsync(new StreamElementsDonationInitializedEvent());
        }

        if (donations != null) {
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
     * @param cache
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
        if (this.updateFuture != null) {
            this.updateFuture.cancel(true);
        }
    }
}
