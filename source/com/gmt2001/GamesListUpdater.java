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
package com.gmt2001;

import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.HttpUrl;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;

/*
 * @author gmt2001
 */
public final class GamesListUpdater {

    private static final int UPDATE_INTERVAL_DAYS = 7;
    private static final String BASE_URL = "https://raw.githubusercontent.com/PhantomBot/games-list/master/";

    private GamesListUpdater() {
    }

    public static void update() {
        update(false);
    }

    public static void update(boolean force) {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        if (force) {
            com.gmt2001.Console.out.println("Starting GamesListUpdater");
        } else {
            com.gmt2001.Console.debug.println("Starting GamesListUpdater");
        }

        if (!PhantomBot.instance().getDataStore().HasKey("settings", "", "gamesList-version")) {
            com.gmt2001.Console.debug.println("Version not set, initializing to 0");
            PhantomBot.instance().getDataStore().SetInteger("settings", "", "gamesList-version", 0);
        }

        if (!PhantomBot.instance().getDataStore().HasKey("settings", "", "gamesList-lastCheck")) {
            com.gmt2001.Console.debug.println("Last Check not set, initializaing to Unix Epoch");
            PhantomBot.instance().getDataStore().SetLong("settings", "", "gamesList-lastCheck", 0);
        }

        Calendar cal = Calendar.getInstance();
        cal.setTime(new Date(PhantomBot.instance().getDataStore().GetLong("settings", "", "gamesList-lastCheck")));
        cal.add(Calendar.DATE, UPDATE_INTERVAL_DAYS);

        com.gmt2001.Console.debug.println("Last Update: " + cal.toString());

        if (!force && cal.getTime().after(new Date())) {
            com.gmt2001.Console.debug.println("Skipping update, interval has not expired...");
            return;
        }

        PhantomBot.instance().getDataStore().SetLong("settings", "", "gamesList-lastCheck", new Date().getTime());

        HttpClientResponse response;
        try {
            response = HttpClient.get(HttpUrl.fromUri(BASE_URL, "index.json"));
        } catch (URISyntaxException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        }

        if (!response.isSuccess() || !response.hasJson()) {
            if (force) {
                com.gmt2001.Console.out.println("Failed to retrive the main index, update failed...");
            }
            com.gmt2001.Console.debug.println("Skipping update, request failed...");
            com.gmt2001.Console.debug.println(response.toString());
            return;
        }

        JSONObject jso = response.json();
        int myVersion = PhantomBot.instance().getDataStore().GetInteger("settings", "", "gamesList-version");

        if (force || !Files.exists(Paths.get("./web/panel/js/utils/gamesList.txt"))) {
            myVersion = 0;
        }

        if (myVersion >= jso.getInt("version")) {
            com.gmt2001.Console.debug.println("Skipping update, currently up-to-date...");
            return;
        }

        List<String> data = new ArrayList<>();
        try {
            if (myVersion > 0) {
                com.gmt2001.Console.debug.println("Loading current gamesList.txt...");
                List<String> odata = Files.readAllLines(Paths.get("./web/panel/js/utils/gamesList.txt"));
                data.addAll(odata);
                com.gmt2001.Console.debug.println("Loaded " + data.size() + " entries");
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        }

        if (force) {
            com.gmt2001.Console.out.println("Executing updates to reach version " + jso.getInt("version") + "...");
        } else {
            com.gmt2001.Console.debug.println("Executing updates to reach version " + jso.getInt("version") + "...");
        }

        boolean fullUpdate = force;
        while (myVersion < jso.getInt("version")) {
            int nextVersion = myVersion + 1;
            com.gmt2001.Console.debug.println("Current version is " + myVersion + ", updating to version " + nextVersion + "...");

            JSONArray indexesToUpdate;
            if (!force && jso.getJSONObject("index_changes").has("" + nextVersion)) {
                com.gmt2001.Console.debug.println("Found changelist for version " + nextVersion);
                indexesToUpdate = jso.getJSONObject("index_changes").getJSONArray("" + nextVersion);
            } else {
                com.gmt2001.Console.debug.println("No changelist for version " + nextVersion + ", executing full update...");
                indexesToUpdate = jso.getJSONArray("indexes");
                fullUpdate = true;
                data.clear();
            }

            com.gmt2001.Console.debug.println("Processing indexes...");
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
                com.gmt2001.Console.debug.println("Found deletes for version " + nextVersion + ", processing...");
                DoDeletes(data, jso.getJSONObject("deletes").getJSONArray("" + nextVersion));
            }

            if (fullUpdate) {
                com.gmt2001.Console.debug.println("Full update completed, skipping to version " + jso.getInt("version") + "...");
                myVersion = jso.getInt("version");
            } else {
                myVersion = nextVersion;
            }

            try {
                if (force) {
                    com.gmt2001.Console.out.println("Writing gamesList.txt version " + myVersion + "...");
                } else {
                    com.gmt2001.Console.debug.println("Writing gamesList.txt version " + myVersion + "...");
                }
                Files.write(Paths.get("./web/panel/js/utils/gamesList.txt"), data);
                com.gmt2001.Console.debug.println("Saved " + data.size() + " entries");
            } catch (IOException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
                return;
            }

            PhantomBot.instance().getDataStore().SetInteger("settings", "", "gamesList-version", myVersion);
        }

        if (force) {
            com.gmt2001.Console.out.println("Games list update complete, now at version " + myVersion);
        } else {
            com.gmt2001.Console.debug.println("Games list update complete, now at version " + myVersion);
        }
    }

    private static void UpdateFromIndex(List<String> data, int index, boolean force) {
        HttpClientResponse response;
        try {
            response = HttpClient.get(HttpUrl.fromUri(BASE_URL, "data/games" + index + ".json"));
        } catch (URISyntaxException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        }

        if (!response.isSuccess()) {
            if (force) {
                com.gmt2001.Console.out.println("Failed to retrive index " + index + ", skipping...");
            }
            com.gmt2001.Console.debug.println("Skipping index " + index + ", request failed...");
            com.gmt2001.Console.debug.println(response.toString());
            return;
        }

        JSONArray jsa = new JSONArray(response.responseBody());

        for (int i = 0; i < jsa.length(); i++) {
            com.gmt2001.Console.debug.println("Processing game \"" + jsa.getJSONObject(i).getString("name") + "\"...");
            if (jsa.getJSONObject(i).has("old_names")) {
                JSONArray old_names = jsa.getJSONObject(i).getJSONArray("old_names");

                for (int k = 0; k < old_names.length(); k++) {
                    if (data.contains(old_names.getString(k))) {
                        com.gmt2001.Console.debug.println("Found an old name \"" + old_names.getString(k) + "\", removing...");
                        data.remove(old_names.getString(k));
                    }
                }
            }

            if (!data.contains(jsa.getJSONObject(i).getString("name"))) {
                data.add(jsa.getJSONObject(i).getString("name"));
            }
        }
    }

    private static void DoDeletes(List<String> data, JSONArray deletes) {
        for (int i = 0; i < deletes.length(); i++) {
            if (data.contains(deletes.getString(i))) {
                com.gmt2001.Console.debug.println("Deleting game \"" + deletes.getString(i) + "\"...");
                data.remove(deletes.getString(i));
            }
        }
    }
}
