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
        try {
            Thread.sleep(30 * 1000);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.out.println("EmotesCache.run>> Failed to execute initial sleep: [InterruptedException] " + ex.getMessage());
            com.gmt2001.Console.err.logStackTrace(ex);
        }

        while (!killed) {
            try {
                try {
                    if (new Date().after(timeoutExpire)) {
                        this.updateCache();
                    }
                } catch (Exception ex) {
                    checkLastFail();
                    com.gmt2001.Console.out.println("EmotesCache.run>> Failed to update emotes: " + ex.getMessage());
                    com.gmt2001.Console.err.logStackTrace(ex);
                }
            } catch (Exception ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }

            try {
                Thread.sleep(300 * 1000); 
            } catch (InterruptedException ex) {
                com.gmt2001.Console.out.println("EmotesCache.run>> Failed to execute initial sleep: [InterruptedException] " + ex.getMessage());
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }
    }

    private boolean checkJSONExceptions(JSONObject jsonResult, boolean ignore404) {

        if (jsonResult.getBoolean("_success")) {
            if (jsonResult.getInt("_http") == 200) {
              return true;
            } else if (jsonResult.getInt("_http") != 404 || (jsonResult.getInt("_http") == 404 && !ignore404)) { 
                try {
                    throw new Exception("[HTTPErrorExecption] HTTP " + " " + jsonResult.getInt("_http") + ". req=" +
                                        jsonResult.getString("_type") + " " + jsonResult.getString("_url") + "   " +
                                        (jsonResult.has("message") && !jsonResult.isNull("message") ? "message=" +
                                         jsonResult.getString("message") : "content=" + jsonResult.getString("_content")));
                } catch (Exception ex) {
                    com.gmt2001.Console.out.println("EmotesCache.updateCache>> Failed to update emotes: " + ex.getMessage());
                    com.gmt2001.Console.err.logStackTrace(ex);
                }
            }
        } else {
            try {
                throw new Exception("[" + jsonResult.getString("_exception") + "] " + jsonResult.getString("_exceptionMessage"));
            } catch (Exception ex) {
                if (ex.getMessage().startsWith("[SocketTimeoutException]") || ex.getMessage().startsWith("[IOException]")) {
                    checkLastFail();
                    com.gmt2001.Console.out.println("EmotesCache.updateCache>> Failed to update emotes: " + ex.getMessage());
                    com.gmt2001.Console.err.logStackTrace(ex);
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
        String twitchEmoteString = "";
        String localBTTVEmoteString = "";
        String globalBTTVEmoteString = "";
        String localFrankerZEmoteString = "";
        String globalFrankerZEmoteString = "";
        int totalEmotes = 0;
        boolean emoteDifferencesFound = false;

        com.gmt2001.Console.out.println("Pulling Twitch Emotes");
        jsonResult = TwitchAPIv3.instance().GetEmotes();
        if (checkJSONExceptions(jsonResult, false)) {
            jsonArray = jsonResult.getJSONArray("emoticons");
            for (int i = 0; i < jsonArray.length(); i++) {
                twitchEmoteString += " " + jsonArray.getJSONObject(i).getString("regex");
                newCache.put(jsonArray.getJSONObject(i).getString("regex"), jsonArray.getJSONObject(i).getString("regex"));
            }
            if (jsonArray.length() > 0) {
                twitchEmoteString = twitchEmoteString.trim();
                twitchEmoteString = twitchEmoteString.replace(" ", ",");
                emoteString = twitchEmoteString;
            }
            totalEmotes += jsonArray.length();
        }

        com.gmt2001.Console.out.println("Pulling Global BTTV Emotes");
        jsonResult = BTTVAPIv2.instance().GetGlobalEmotes();
        if (checkJSONExceptions(jsonResult, true)) {
            jsonArray = jsonResult.getJSONArray("emotes");
            for (int i = 0; i < jsonArray.length(); i++) {
                globalBTTVEmoteString += " " + jsonArray.getJSONObject(i).getString("code");
                newCache.put(jsonArray.getJSONObject(i).getString("code"), jsonArray.getJSONObject(i).getString("code"));
            }
            if (jsonArray.length() > 0) {
                globalBTTVEmoteString = globalBTTVEmoteString.trim();
                globalBTTVEmoteString = globalBTTVEmoteString.replace("(", "\\(")
                                                             .replace(")", "\\)")
                                                             .replace("\'", "\\\'")
                                                             .replace("[", "\\[")
                                                             .replace("]", "\\]")
                                                             .replace(" ", ",");
                emoteString = emoteString + (emoteString == "" ? "" : ",") + globalBTTVEmoteString;
            }
            totalEmotes += jsonArray.length();
        }

        com.gmt2001.Console.out.println("Pulling Local BTTV Emotes");
        jsonResult = BTTVAPIv2.instance().GetLocalEmotes(this.channel);
        if (checkJSONExceptions(jsonResult, true)) {
            jsonArray = jsonResult.getJSONArray("emotes");
            for (int i = 0; i < jsonArray.length(); i++) {
                localBTTVEmoteString += " " + jsonArray.getJSONObject(i).getString("code");
                newCache.put(jsonArray.getJSONObject(i).getString("code"), jsonArray.getJSONObject(i).getString("code"));
            }
            if (jsonArray.length() > 0) {
                localBTTVEmoteString = localBTTVEmoteString.trim();
                localBTTVEmoteString = localBTTVEmoteString.replace("(", "\\(")
                                                           .replace(")", "\\)")
                                                           .replace("\'", "\\\'")
                                                           .replace("[", "\\[")
                                                           .replace("]", "\\]")
                                                           .replace(" ", ",");
                emoteString = emoteString + (emoteString == "" ? "" : ",") + localBTTVEmoteString;
            }
            totalEmotes += jsonArray.length();
        }

        com.gmt2001.Console.out.println("Pulling Global FrankerZ Emotes");
        jsonResult = FrankerZAPIv1.instance().GetGlobalEmotes();
        if (checkJSONExceptions(jsonResult, true)) {
            JSONArray defaultSets = jsonResult.getJSONArray("default_sets");
            for (int i = 0; i < defaultSets.length(); i++) {
                String currentSet = String.valueOf(defaultSets.getInt(i));
                jsonArray = jsonResult.getJSONObject("sets").getJSONObject(currentSet).getJSONArray("emoticons");
                for (int j = 0; j < jsonArray.length(); j++) {
                    globalFrankerZEmoteString += " " + jsonArray.getJSONObject(j).getString("name");
                    newCache.put(jsonArray.getJSONObject(j).getString("name"), jsonArray.getJSONObject(j).getString("name"));
                }
                if (jsonArray.length() > 0) {
                    globalFrankerZEmoteString = globalFrankerZEmoteString.trim();
                    globalFrankerZEmoteString = globalFrankerZEmoteString.replace("(", "\\(")
                                                                         .replace(")", "\\)")
                                                                         .replace("\'", "\\\'")
                                                                         .replace("[", "\\[")
                                                                         .replace("]", "\\]")
                                                                         .replace(" ", ",");
                    emoteString = emoteString + (emoteString == "" ? "" : ",") + globalFrankerZEmoteString;
                }
                totalEmotes += jsonArray.length();
            }
        }

        com.gmt2001.Console.out.println("Pulling Local FrankerZ Emotes");
        jsonResult = FrankerZAPIv1.instance().GetLocalEmotes(this.channel);
        if (checkJSONExceptions(jsonResult, true)) {
            String currentSet = String.valueOf(jsonResult.getJSONObject("sets").getInt("set"));
            jsonArray = jsonResult.getJSONObject("sets").getJSONObject(currentSet).getJSONArray("emoticons");
            for (int i = 0; i < jsonArray.length(); i++) {
                localFrankerZEmoteString += " " + jsonArray.getJSONObject(i).getString("name");
                newCache.put(jsonArray.getJSONObject(i).getString("name"), jsonArray.getJSONObject(i).getString("name"));
            }
            if (jsonArray.length() > 0) {
                localFrankerZEmoteString = localFrankerZEmoteString.trim();
                localFrankerZEmoteString = localFrankerZEmoteString.replace("(", "\\(")
                                                                   .replace(")", "\\)")
                                                                   .replace("\'", "\\\'")
                                                                   .replace("[", "\\[")
                                                                   .replace("]", "\\]")
                                                                   .replace(" ", ",");
                emoteString = emoteString + (emoteString == "" ? "" : ",") + localFrankerZEmoteString;
            }
            totalEmotes += jsonArray.length();
        }

        com.gmt2001.Console.out.println("Pulled a Total of " + totalEmotes + " Emotes");
        if (emoteString != "") {
            emoteString = emoteString.trim();
            //newCache.put(emoteString, "unused");
            //if (this.cache == null || !this.cache.containsKey(emoteString)) {
            for (String key : newCache.keySet()) {
              if (!exists(key)) {
                emoteDifferencesFound = true;
                break;
              }
            }
            if (this.cache == null || emoteDifferencesFound) {
                EventBus.instance().post(new EmotesGetEvent(emoteString, PhantomBot.instance().getChannel("#" + this.channel)));
            } else {
                com.gmt2001.Console.out.println("Emotes match Cache, not Sending to emoteHandler to Update");
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
