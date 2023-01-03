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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;

public class SteamCache implements Runnable {

    private static final Map<String, SteamCache> instances = new HashMap<>();
    private final Thread runThread;

    /**
     * Class constructor.
     */
    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private SteamCache() {
        // Create a new thread for the cache.
        this.runThread = new Thread(this, "tv.phantombot.cache.SteamCache");
        // Set our Exception handler.
        this.runThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        // Start the thread.
        this.runThread.start();
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
    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
        while (!runThread.isInterrupted()) {
            try {
                // Update.
                updateCache();
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("SteamCache.run::Failed to update cache "
                        + "[" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            }
            // Sleep for 30 minutes.
            try {
                Thread.sleep(30 * 60 * 1000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("SteamCache.run::Failed to sleep [InterruptedException]: "
                        + ex.getMessage());
            }
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
        runThread.interrupt();
    }
}
