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
package com.gmt2001.util;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.URIUtil;

import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;

/**
 * Updates the game list used for auto-complete when changing the game from the panel
 * <p>
 * The list is stored at {@code web/panel/js/utils/gamesList.txt}
 *
 * @author gmt2001
 * @deprecated To be replaced
 */
@Deprecated(since = "3.10.0.0", forRemoval = true)
public final class GamesListUpdater {

    private static final int UPDATE_INTERVAL_DAYS = 7;
    private static final String BASE_URL = "https://raw.githubusercontent.com/PhantomBot/games-list/master/";

    private GamesListUpdater() {
    }

    /**
     * Handles debug messages based on the class-specific debug flag
     *
     * @param message The message to print
     */
    private static void debug(String message) {
        /**
         * @botproperty gameslistupdaterdebug - If `true` and `debugon` is also enabled, enables debug output for GamesListUpdater. Default `false`
         * @botpropertycatsort gameslistupdaterdebug 200 900 Debug
         */
        if (CaselessProperties.instance().getPropertyAsBoolean("gameslistupdaterdebug", false)) {
            com.gmt2001.Console.debug.println(message);
        }
    }

    /**
     * Updates the games list using smart update mode
     */
    public static void update() {
        update(false);
    }

    /**
     * Updates the games list
     * <p>
     * If {@code force} is {@code false}, a smart update is performed. A smart update only occurs if it has been 7 days since the
     * last update, and will attempt to perform a patch update if available. If the local index is too old, a full update is performed
     * instead, where the entire games index is downloaded. A full update can take some time
     *
     * @param force {@code true} to force a full update of the index ane enable additional console output; {@code false} to
     * perform a smart update
     */
    public static void update(boolean force) {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        if (!Files.exists(Paths.get("./web/panel/js/utils/gamesList.txt"))) {
            force = true;
        }

        if (force) {
            com.gmt2001.Console.out.println("Starting GamesListUpdater");
        } else {
            debug("Starting GamesListUpdater");
        }

        if (!PhantomBot.instance().getDataStore().HasKey("settings", "", "gamesList-version")) {
            debug("Version not set, initializing to 0");
            PhantomBot.instance().getDataStore().SetInteger("settings", "", "gamesList-version", 0);
        }

        if (!PhantomBot.instance().getDataStore().HasKey("settings", "", "gamesList-lastCheck")) {
            debug("Last Check not set, initializaing to Unix Epoch");
            PhantomBot.instance().getDataStore().SetLong("settings", "", "gamesList-lastCheck", 0);
        }

        LocalDateTime lastCheck = LocalDateTime.ofEpochSecond(PhantomBot.instance().getDataStore().GetLong("settings", "", "gamesList-lastCheck"), 0, ZoneOffset.UTC);

        debug("Last Update: " + lastCheck.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        if (!force && lastCheck.plusDays(UPDATE_INTERVAL_DAYS).isAfter(LocalDateTime.now())) {
            debug("Skipping update, interval has not expired...");
            return;
        }

        PhantomBot.instance().getDataStore().SetLong("settings", "", "gamesList-lastCheck", LocalDateTime.now().toEpochSecond(ZoneOffset.UTC));

        HttpClientResponse response = HttpClient.get(URIUtil.create(BASE_URL + "index.json"));

        if (!response.isSuccess() || !response.hasJson()) {
            if (force) {
                com.gmt2001.Console.out.println("Failed to retrive the main index, update failed...");
            }
            debug("Skipping update, request failed...");
            debug(response.toString());
            return;
        }

        JSONObject jso = response.json();
        int myVersion = PhantomBot.instance().getDataStore().GetInteger("settings", "", "gamesList-version");

        if (force) {
            myVersion = 0;
        }

        if (myVersion >= jso.getInt("version")) {
            debug("Skipping update, currently up-to-date...");
            return;
        }

        List<String> data = new ArrayList<>();
        try {
            if (myVersion > 0) {
                debug("Loading current gamesList.txt...");
                List<String> odata = Files.readAllLines(Paths.get("./web/panel/js/utils/gamesList.txt"));
                data.addAll(odata);
                debug("Loaded " + data.size() + " entries");
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        }

        if (force) {
            com.gmt2001.Console.out.println("Executing updates to reach version " + jso.getInt("version") + "...");
        } else {
            debug("Executing updates to reach version " + jso.getInt("version") + "...");
        }

        boolean fullUpdate = force;
        while (myVersion < jso.getInt("version")) {
            int nextVersion = myVersion + 1;
            debug("Current version is " + myVersion + ", updating to version " + nextVersion + "...");

            JSONArray indexesToUpdate;
            if (!force && jso.getJSONObject("index_changes").has("" + nextVersion)) {
                debug("Found changelist for version " + nextVersion);
                indexesToUpdate = jso.getJSONObject("index_changes").getJSONArray("" + nextVersion);
            } else {
                debug("No changelist for version " + nextVersion + ", executing full update...");
                indexesToUpdate = jso.getJSONArray("indexes");
                fullUpdate = true;
                data.clear();
            }

            debug("Processing indexes...");
            for (int i = 0; i < indexesToUpdate.length(); i++) {
                if (force) {
                    com.gmt2001.Console.out.println("Updating from index " + indexesToUpdate.getInt(i) + "...");
                }
                UpdateFromIndex(data, indexesToUpdate.getInt(i), force);
            }

            if (force) {
                com.gmt2001.Console.out.println("Updating from manual index...");
            }
            UpdateFromIndex(data, -1, force);

            if (jso.getJSONObject("deletes").has("" + nextVersion)) {
                debug("Found deletes for version " + nextVersion + ", processing...");
                DoDeletes(data, jso.getJSONObject("deletes").getJSONArray("" + nextVersion));
            }

            if (fullUpdate) {
                debug("Full update completed, skipping to version " + jso.getInt("version") + "...");
                myVersion = jso.getInt("version");
            } else {
                myVersion = nextVersion;
            }

            data.sort(null);

            try {
                if (force) {
                    com.gmt2001.Console.out.println("Writing gamesList.txt version " + myVersion + "...");
                } else {
                    debug("Writing gamesList.txt version " + myVersion + "...");
                }
                Files.write(Paths.get("./web/panel/js/utils/gamesList.txt"), data);
                debug("Saved " + data.size() + " entries");
            } catch (IOException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
                return;
            }

            PhantomBot.instance().getDataStore().SetInteger("settings", "", "gamesList-version", myVersion);
        }

        if (force) {
            com.gmt2001.Console.out.println("Games list update complete, now at version " + myVersion);
        } else {
            debug("Games list update complete, now at version " + myVersion);
        }
    }

    /**
     * Performs an update from the specified remote index, adding or renaming games
     *
     * @param data The local index to be updated
     * @param index The index id to update from
     * @param force Indicates if force mode was used for this update, enabling additional output
     */
    private static void UpdateFromIndex(List<String> data, int index, boolean force) {
        HttpClientResponse response;
        response = HttpClient.get(URIUtil.create(BASE_URL + "data/games" + index + ".json"));

        if (!response.isSuccess()) {
            if (force) {
                com.gmt2001.Console.out.println("Failed to retrive index " + index + ", skipping...");
            }
            debug("Skipping index " + index + ", request failed...");
            debug(response.toString());
            return;
        }

        JSONArray jsa = new JSONArray(response.responseBody());

        for (int i = 0; i < jsa.length(); i++) {
            debug("Processing game \"" + jsa.getJSONObject(i).getString("name") + "\"...");
            if (jsa.getJSONObject(i).has("old_names")) {
                JSONArray old_names = jsa.getJSONObject(i).getJSONArray("old_names");

                for (int k = 0; k < old_names.length(); k++) {
                    if (data.contains(old_names.getString(k))) {
                        debug("Found an old name \"" + old_names.getString(k) + "\", removing...");
                        data.remove(old_names.getString(k));
                    }
                }
            }

            if (!data.contains(jsa.getJSONObject(i).getString("name"))) {
                data.add(jsa.getJSONObject(i).getString("name"));
            }
        }
    }

    /**
     * Performs an update from the remote delete list
     *
     * @param data The local index to be updated
     * @param deletes An array of game titles that have been deleted
     */
    private static void DoDeletes(List<String> data, JSONArray deletes) {
        for (int i = 0; i < deletes.length(); i++) {
            if (data.contains(deletes.getString(i))) {
                debug("Deleting game \"" + deletes.getString(i) + "\"...");
                data.remove(deletes.getString(i));
            }
        }
    }
}
