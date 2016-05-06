/* astyle --style=java --indent=spaces=4 --mode=java */

/*
 * Copyright (C) 2015 www.phantombot.net
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
import com.illusionaryone.FrankerZAPIv1;
import com.illusionaryone.BTTVAPIv2;
import com.google.common.collect.Maps;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.emotes.EmotesGetEvent;
import org.json.JSONArray;
import org.json.JSONObject;

public class EmotesCache implements Runnable {

    private static final int LOOP_SLEEP_EMOTES_DISABLED = 60;
    private static final int LOOP_SLEEP_EMOTES_ENABLED = 60 * 20;
    private static final Map<String, EmotesCache> instances = Maps.newHashMap();
    public static EmotesCache instance(String channel) {
        EmotesCache instance = instances.get(channel);
        if (instance == null) {
            instance = new EmotesCache(channel);
            instances.put(channel, instance);
            return instance;
        }
        return instance;
    }

    private Map<String, String> cache = Maps.newHashMap();
    private final String channel;
    private final Thread updateThread;
    private Date timeoutExpire = new Date();
    private Date lastFail = new Date();
    private int numfail = 0;
    private int id = 0;
    private boolean killed = false;
    private int loopSleep = 0;

    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private EmotesCache(String channel) {
        if (channel.startsWith("#")) {
            channel = channel.substring(1);
        }

        this.channel = channel;
        this.updateThread = new Thread(this);

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        updateThread.start();
    }

    public boolean exists(String emote) {
        return cache.containsKey(emote);
    }

    public int count() {
        return cache.size();
    }

    private void checkLastFail() {
        Calendar cal = Calendar.getInstance();
        numfail = (lastFail.after(new Date()) ? numfail + 1 : 1);

        cal.add(Calendar.MINUTE, 1);
        lastFail = cal.getTime();

        if (numfail > 5) {
            timeoutExpire = cal.getTime();
        }
    }

    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
        this.cache = null;
        loopSleep = 600;

        try {
            Thread.sleep(30 * 1000);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.debug.println("EmotesCache.run: Failed to execute initial sleep: [InterruptedException] " + ex.getMessage());
        }

        while (!killed) {
            try {
                try {
                    if (new Date().after(timeoutExpire)) {
                        this.updateCache();
                    }
                } catch (Exception ex) {
                    checkLastFail();
                    com.gmt2001.Console.debug.println("EmotesCache.run: Failed to update emotes: " + ex.getMessage());
                }
            } catch (Exception ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }

            try {
                Thread.sleep(loopSleep * 1000); 
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("EmotesCache.run: Failed to execute initial sleep: [InterruptedException] " + ex.getMessage());
            }
        }
    }

    private boolean checkJSONExceptions(JSONObject jsonResult, boolean ignore404, String emoteType) {

        if (jsonResult.getBoolean("_success")) {
            if (jsonResult.getInt("_http") == 200) {
              return true;
            } else if (jsonResult.getInt("_http") != 404 || (jsonResult.getInt("_http") == 404 && !ignore404)) { 
                try {
                    throw new Exception("[HTTPErrorExecption] HTTP " + " " + jsonResult.getInt("_http") + ". req=" +
                                        jsonResult.getString("_type") + " " + jsonResult.getString("_url") + "   " +
                                        (jsonResult.has("message") && !jsonResult.isNull("message") ? "message=" +
                                         jsonResult.getString("message") : "content=" + jsonResult.getString("_content")) +
                                        "Emotes Type=" + emoteType);
                } catch (Exception ex) {
                    com.gmt2001.Console.debug.println("EmotesCache.updateCache: Failed to update emotes (" + emoteType + "): " + ex.getMessage());
                }
            }
        } else {
            try {
                throw new Exception("[" + jsonResult.getString("_exception") + "] " + jsonResult.getString("_exceptionMessage") + "Emotes Type=" + emoteType);
            } catch (Exception ex) {
                if (ex.getMessage().startsWith("[SocketTimeoutException]") || ex.getMessage().startsWith("[IOException]")) {
                    checkLastFail();
                    com.gmt2001.Console.debug.println("EmotesCache.updateCache: Failed to update emotes (" + emoteType + "): " + ex.getMessage());
                }
            }
        }
        return false;
    }

    private void updateCache() throws Exception {
        Map<String, String> newCache = Maps.newHashMap();
        JSONObject jsonResult = null;
        JSONArray jsonArray = null;
        String emoteString = "";
        String emote = "";
        String twitchEmoteString = "";
        String localBTTVEmoteString = "";
        String globalBTTVEmoteString = "";
        String localFrankerZEmoteString = "";
        String globalFrankerZEmoteString = "";
        String emotesModEnabled = "";
        boolean emoteDifferencesFound = false;
        boolean firstEmote = true;

        emotesModEnabled = PhantomBot.instance().getDataStore().GetString("chatModerator", "", "emotesToggle");

        if (emotesModEnabled == null) {
            loopSleep = LOOP_SLEEP_EMOTES_DISABLED;
            return;
        }
        if (!emotesModEnabled.equals("true")) {
            loopSleep = LOOP_SLEEP_EMOTES_DISABLED;
            return;
        }

        // We will pull emotes, set the sleep to every 10 minutes.
        loopSleep = LOOP_SLEEP_EMOTES_ENABLED;

        jsonResult = TwitchAPIv3.instance().GetEmotes();
        if (checkJSONExceptions(jsonResult, false, "Twitch")) {
            jsonArray = jsonResult.getJSONArray("emoticons");
            for (int i = 0; i < jsonArray.length(); i++) {
                emote = jsonArray.getJSONObject(i).getString("regex");
                newCache.put(emote, emote);
            }
        }

        jsonResult = BTTVAPIv2.instance().GetGlobalEmotes();
        if (checkJSONExceptions(jsonResult, true, "Global BTTV")) {
            jsonArray = jsonResult.getJSONArray("emotes");
            for (int i = 0; i < jsonArray.length(); i++) {
                emote = jsonArray.getJSONObject(i).getString("code").replace("(", "\\(")
                                                                    .replace(")", "\\)")
                                                                    .replace("\'", "\\\'")
                                                                    .replace("[", "\\[")
                                                                    .replace("]", "\\]");
                newCache.put(emote, emote);
            }
        }

        jsonResult = BTTVAPIv2.instance().GetLocalEmotes(this.channel);
        if (checkJSONExceptions(jsonResult, true, "Local BTTV")) {
            jsonArray = jsonResult.getJSONArray("emotes");
            for (int i = 0; i < jsonArray.length(); i++) {
                emote = jsonArray.getJSONObject(i).getString("code").replace("(", "\\(")
                                                                    .replace(")", "\\)")
                                                                    .replace("\'", "\\\'")
                                                                    .replace("[", "\\[")
                                                                    .replace("]", "\\]");
                newCache.put(emote, emote);
            }
        }

        jsonResult = FrankerZAPIv1.instance().GetGlobalEmotes();
        if (checkJSONExceptions(jsonResult, true, "Global FrankerZ")) {
            JSONArray defaultSets = jsonResult.getJSONArray("default_sets");
            for (int i = 0; i < defaultSets.length(); i++) {
                String currentSet = String.valueOf(defaultSets.getInt(i));
                jsonArray = jsonResult.getJSONObject("sets").getJSONObject(currentSet).getJSONArray("emoticons");
                for (int j = 0; j < jsonArray.length(); j++) {
                    emote = jsonArray.getJSONObject(j).getString("name").replace("(", "\\(")
                                                                        .replace(")", "\\)")
                                                                        .replace("\'", "\\\'")
                                                                        .replace("[", "\\[")
                                                                        .replace("]", "\\]");
                    newCache.put(emote, emote);
                }
            }
        }

        jsonResult = FrankerZAPIv1.instance().GetLocalEmotes(this.channel);
        if (checkJSONExceptions(jsonResult, true, "Local FrankerZ")) {
            String currentSet = String.valueOf(jsonResult.getJSONObject("room").getInt("set"));
            jsonArray = jsonResult.getJSONObject("sets").getJSONObject(currentSet).getJSONArray("emoticons");
            for (int i = 0; i < jsonArray.length(); i++) {
                emote = jsonArray.getJSONObject(i).getString("name").replace("(", "\\(")
                                                                    .replace(")", "\\)")
                                                                    .replace("\'", "\\\'")
                                                                    .replace("[", "\\[")
                                                                    .replace("]", "\\]");
                newCache.put(emote, emote);
            }
        }

        if (this.cache != null) {
            if (newCache.size() == this.cache.size()) {
                com.gmt2001.Console.debug.println("Emotes count has not changed, no data pushed to bus.");
                return;
            }
        }

        if (newCache.size() > 0) {
            for (String key : newCache.keySet()) {
                emoteString += (firstEmote ? "" : ",") + key;
                firstEmote = false;
                if (this.cache != null && !emoteDifferencesFound) {
                    if (newCache.size() != this.cache.size()) {
                        emoteDifferencesFound = true;
                    }
                    if (!this.cache.containsKey(key)) {
                        emoteDifferencesFound = true;
                    }
                }
            }
            if (this.cache == null || emoteDifferencesFound) {
                com.gmt2001.Console.debug.println("Pushing " + newCache.size() + " emotes onto the event bus.");
                EventBus.instance().post(new EmotesGetEvent(emoteString, PhantomBot.instance().getChannel("#" + this.channel)));
            } else {
                com.gmt2001.Console.debug.println("Emotes match cache, no data pushed to bus.");
            }
        }
        this.cache = newCache;
    }

    public void setCache(Map<String, String> cache) {
        this.cache = cache;
    }

    public Map<String, String> getCache() {
        return cache;
    }

    public void kill() {
        killed = true;
    }

    public static void killall() {
        for (Entry<String, EmotesCache> instance : instances.entrySet()) {
            instance.getValue().kill();
        }
    }
}
