/* astyle --style=java --indent=spaces=4 --mode=java */

/*
 * Copyright (C) 2017 phantombot.tv
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
    private static final int LOOP_SLEEP_EMOTES_ENABLED = 60 * 60;
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
        this.updateThread = new Thread(this, "me.mast3rplan.phantombot.cache.EmotesCache");

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        updateThread.start();
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
        loopSleep = 600;

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
            } else if (jsonResult.getInt("_http") == 404 && ignore404) {
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
        JSONObject twitchJsonResult = null;
        JSONObject bttvJsonResult = null;
        JSONObject bttvLocalJsonResult = null;
        JSONObject ffzJsonResult = null;
        JSONObject ffzLocalJsonResult = null;
        String emotesModEnabled = "";

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

        com.gmt2001.Console.debug.println("Polling Emotes from BTTV and FFZ");

        /**
         * @info Don't need this anymore since we use the IRCv3 tags for Twitch emotes.
         * twitchJsonResult = TwitchAPIv3.instance().GetEmotes();
         * if (!checkJSONExceptions(twitchJsonResult, false, "Twitch")) {
         *    com.gmt2001.Console.err.println("Failed to get Twitch Emotes");
         *    return;
         * }
         */

        bttvJsonResult = BTTVAPIv2.instance().GetGlobalEmotes();
        if (!checkJSONExceptions(bttvJsonResult, true, "Global BTTV")) {
            com.gmt2001.Console.err.println("Failed to get BTTV Emotes");
            return;
        }

        bttvLocalJsonResult = BTTVAPIv2.instance().GetLocalEmotes(this.channel);
        if (!checkJSONExceptions(bttvLocalJsonResult, true, "Local BTTV")) {
            com.gmt2001.Console.err.println("Failed to get BTTV Local Emotes");
            return;
        }

        ffzJsonResult = FrankerZAPIv1.instance().GetGlobalEmotes();
        if (!checkJSONExceptions(ffzJsonResult, true, "Global FrankerZ")) {
            com.gmt2001.Console.err.println("Failed to get FFZ Emotes");
            return;
        }

        ffzLocalJsonResult = FrankerZAPIv1.instance().GetLocalEmotes(this.channel);
        if (!checkJSONExceptions(ffzLocalJsonResult, true, "Local FrankerZ")) {
            com.gmt2001.Console.err.println("Failed to get FFZ Local Emotes");
            return;
        }

        com.gmt2001.Console.debug.println("Pushing Emote JSON Objects to EventBus");
        EventBus.instance().post(new EmotesGetEvent(twitchJsonResult, bttvJsonResult, bttvLocalJsonResult, ffzJsonResult, ffzLocalJsonResult, PhantomBot.getChannel(this.channel)));
        System.gc();

        /* Set these to null to save memory */
        twitchJsonResult = null;
        bttvJsonResult = null;
        bttvLocalJsonResult = null;
        ffzJsonResult = null;
        ffzLocalJsonResult = null;
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
