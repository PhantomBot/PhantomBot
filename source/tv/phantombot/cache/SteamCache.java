/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import org.json.JSONArray;
import org.json.JSONObject;

import com.gmt2001.util.concurrent.ExecutorService;

import tv.phantombot.PhantomBot;

public class SteamCache {

    private static final long INTERVAL_MINUTES = 30;
    private static final Map<String, SteamCache> instances = new HashMap<>();
    private final ScheduledFuture<?> update;

    /**
     * Class constructor.
     */
    private SteamCache() {
       this.update = ExecutorService.scheduleAtFixedRate(() -> {
            this.run();
        }, 0, INTERVAL_MINUTES, TimeUnit.MINUTES);
    }

    /**
     * Method that returns this instance.
     *
     * @param channelName
     * @return
     */
    public static SteamCache instance(String channelName) {
        SteamCache instance = instances.get(channelName);

        if (instance == null) {
            instance = new SteamCache();
            instances.put(channelName, instance);
        }

        return instance;
    }

    /**
     * Run method that runs on a new thread and sleeps every 30 minutes.
     */
    private void run() {
        try {
            // Update.
            updateCache();
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("SteamCache.run::Failed to update cache "
                    + "[" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
        }
    }

    /**
     * Method that updates the cache.
     */
    private void updateCache() throws Exception {
        long lastUpdate = PhantomBot.instance().getDataStore().GetLong("steam_cache", "", "last_update_time");

        // Only update the cache once every 24 hours.
        if ((lastUpdate + (24 * 60 * 60 * 1000)) > System.currentTimeMillis()) {
            return;
        }

        // Names of the games.
        ArrayList<String> gameNames = new ArrayList<String>();
        // IDs of the games.
        ArrayList<String> gameIDs = new ArrayList<String>();

        com.gmt2001.Console.debug.println("SteamCache::updateCache");

        // Get all games.
        JSONObject gamesObject = new JSONObject("{}"); // SteamAPI.getGameList()

        // Make sure we had a successfull call.
        if (gamesObject.getBoolean("_success") && gamesObject.getInt("_http") == 200) {
            JSONArray gamesArray = gamesObject.getJSONArray("apps");

            for (int i = 0; i < gamesArray.length(); i++) {
                JSONObject gameObject = gamesArray.getJSONObject(i);

                // Add the game name.
                gameNames.add(gameObject.getString("name"));
                // Add the game ID.
                gameIDs.add(String.valueOf(gameObject.getInt("appid")));
            }

            // Set the game name with their ID in the database.
            PhantomBot.instance().getDataStore().SetBatchString("steam_cache", "",
                    gameNames.toArray(new String[gameNames.size()]), gameIDs.toArray(new String[gameIDs.size()]));
            // Update the last query time
            PhantomBot.instance().getDataStore().SetLong("steam_cache", "", "last_update_time", System.currentTimeMillis());
        }
    }

    /**
     * Method that returns the game ID, or null if it doesn't exist.
     *
     * @param gameName
     * @return
     */
    public String getGameID(String gameName) {
        return PhantomBot.instance().getDataStore().get("steam_cache", gameName);
    }

    /**
     * Method that kills the run thread.
     */
    public void kill() {
        this.update.cancel(false);
    }
}
