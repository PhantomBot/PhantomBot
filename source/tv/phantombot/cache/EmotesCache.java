/* astyle --style=java --indent=spaces=4 --mode=java */

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
package tv.phantombot.cache;

import com.gmt2001.BTTVAPIv3;
import com.illusionaryone.FrankerZAPIv1;
import java.util.Calendar;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.json.JSONException;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.emotes.EmotesGetEvent;

public class EmotesCache implements Runnable {

    private static final long LOOP_SLEEP_EMOTES_DISABLED = 60L;
    private static final long LOOP_SLEEP_EMOTES_ENABLED = 60L * 60L;
    private static final Map<String, EmotesCache> instances = new ConcurrentHashMap<>();

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
    private boolean killed = false;
    private long loopSleep = 0;

    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private EmotesCache(String channel) {
        if (channel.startsWith("#")) {
            channel = channel.substring(1);
        }

        this.channel = channel;
        this.updateThread = new Thread(this, "tv.phantombot.cache.EmotesCache");

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
        loopSleep = 600L;

        while (!killed) {
            try {
                if (new Date().after(timeoutExpire)) {
                    this.updateCache();
                }
            } catch (Exception ex) {
                checkLastFail();
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            try {
                Thread.sleep(loopSleep * 1000L);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("EmotesCache.run: Failed to execute initial sleep: [InterruptedException] " + ex.getMessage());
            }
        }
    }

    private boolean checkJSONExceptions(JSONObject jsonResult, boolean ignore404, String emoteType) throws JSONException {

        if (jsonResult.getBoolean("_success")) {
            if (jsonResult.getInt("_http") == 200) {
                return true;
            } else if (jsonResult.getInt("_http") == 404 && ignore404) {
                return true;
            }
        }
        return false;
    }

    private void updateCache() throws Exception {
        JSONObject bttvJsonResult;
        JSONObject bttvLocalJsonResult;
        JSONObject ffzJsonResult;
        JSONObject ffzLocalJsonResult;
        String emotesModEnabled;

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

        bttvJsonResult = BTTVAPIv3.instance().GetGlobalEmotes();
        if (!checkJSONExceptions(bttvJsonResult, true, "Global BTTV")) {
            com.gmt2001.Console.err.println("Failed to get BTTV Emotes");
            return;
        }

        bttvLocalJsonResult = BTTVAPIv3.instance().GetLocalEmotes(UsernameCache.instance().getID(this.channel));
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
        EventBus.instance().postAsync(new EmotesGetEvent(null, bttvJsonResult, bttvLocalJsonResult, ffzJsonResult, ffzLocalJsonResult));
    }

    public void kill() {
        killed = true;
    }

    public static void killall() {
        instances.entrySet().forEach((instance) -> {
            instance.getValue().kill();
        });
    }
}
