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
import com.scaniatv.TipeeeStreamAPIv1;

import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.tipeeestream.donate.TipeeeStreamDonationEvent;
import tv.phantombot.event.tipeeestream.donate.TipeeeStreamDonationInitializedEvent;

public class TipeeeStreamCache implements Runnable {

    private static TipeeeStreamCache instance = null;
    private Map<String, String> cache = new ConcurrentHashMap<>();
    private ScheduledFuture<?> updateFuture = null;
    private boolean firstUpdate = true;

    public static synchronized TipeeeStreamCache instance() {
        if (instance == null) {
            instance = new TipeeeStreamCache();
        }

        return instance;
    }

    private TipeeeStreamCache() {
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

    public void run() {
        try {
            if (TipeeeStreamAPIv1.hasOauth()) {
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

        if (firstUpdate) {
            firstUpdate = false;
            EventBus.instance().postAsync(new TipeeeStreamDonationInitializedEvent());
        }

        if (donations != null) {
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
        if (this.updateFuture != null) {
            this.updateFuture.cancel(true);
        }
    }
}
