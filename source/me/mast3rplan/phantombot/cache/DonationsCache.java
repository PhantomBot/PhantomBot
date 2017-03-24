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

import com.illusionaryone.TwitchAlertsAPIv1;
import com.google.common.collect.Maps;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.twitchalerts.donate.TwitchAlertsDonateEvent;
import me.mast3rplan.phantombot.event.twitchalerts.donate.TwitchAlertsDonationEvent;
import me.mast3rplan.phantombot.event.twitchalerts.donate.TwitchAlertsDonationInitializedEvent;
import org.json.JSONArray;
import org.json.JSONObject;

public class DonationsCache implements Runnable {

    private static final Map<String, DonationsCache> instances = Maps.newHashMap();
    public static DonationsCache instance(String channel) {
        DonationsCache instance = instances.get(channel);
        if (instance == null) {
            instance = new DonationsCache(channel);
            instances.put(channel, instance);
            return instance;
        }
        return instance;
    }

    private Map<String, String> cache = Maps.newHashMap();
    private final String channel;
    private final Thread updateThread;
    private boolean firstUpdate = true;
    private Date timeoutExpire = new Date();
    private Date lastFail = new Date();
    private int numfail = 0;
    private int id = 0;
    private boolean killed = false;

    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private DonationsCache(String channel) {
        if (channel.startsWith("#")) {
            channel = channel.substring(1);
        }

        this.channel = channel;
        this.updateThread = new Thread(this, "me.mast3rplan.phantombot.cache.DonationsCache");

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        updateThread.start();
    }

    public boolean exists(String donationID) {
        return cache.containsKey(donationID);
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
            Thread.sleep(20 * 1000);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.debug.println("DonationsCache.run: Failed to execute initial sleep [InterruptedException]: " + ex.getMessage());
        }

        while (!killed) {
            try {
                try {
                    if (new Date().after(timeoutExpire)) {
                        this.updateCache();
                    }
                } catch (Exception ex) {
                    checkLastFail();
                    com.gmt2001.Console.debug.println("DonationsCache.run: Failed to update donations: " + ex.getMessage());
                }
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("DonationsCache.run: Failed to update donations: " + ex.getMessage());
            }

            try {
                Thread.sleep(30 * 1000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("DonationsCache.run: Failed to execute sleep [InterruptedException]: " + ex.getMessage());
            }
        }
    }

    private void updateCache() throws Exception {
        Map<String, String> newCache = Maps.newHashMap();
        JSONObject jsonResult;
        JSONArray donations = null;

        com.gmt2001.Console.debug.println("DonationsCache::updateCache");

        jsonResult = TwitchAlertsAPIv1.instance().GetDonations();

        if (jsonResult.getBoolean("_success")) {
            if (jsonResult.getInt("_http") == 200) {
                donations = jsonResult.getJSONArray("data");
                for (int i = 0; i < donations.length(); i++) {
                    newCache.put(donations.getJSONObject(i).get("donation_id").toString(), donations.getJSONObject(i).get("donation_id").toString());
                }
            } else {
                try {
                    throw new Exception("[HTTPErrorExecption] HTTP " + " " + jsonResult.getInt("_http") + ". req=" +
                                        jsonResult.getString("_type") + " " + jsonResult.getString("_url") + "   " +
                                        (jsonResult.has("message") && !jsonResult.isNull("message") ? "message=" +
                                         jsonResult.getString("message") : "content=" + jsonResult.getString("_content")));
                } catch (Exception ex) {
                    /* Kill this cache if the streamlabs token is bad and disable the module. */
                    if (ex.getMessage().contains("message=Unauthorized")) {
                        com.gmt2001.Console.err.println("DonationsCache.updateCache: Bad API key disabling the StreamLabs module.");
                        PhantomBot.instance().getDataStore().SetString("modules", "", "./handlers/donationHandler.js", "false");
                    } else {
                        com.gmt2001.Console.err.println("Donations.updateCache: Failed to update donations: " + ex.getMessage());
                    }
                    this.kill();
                }
            }
        } else {
            try {
                throw new Exception("[" + jsonResult.getString("_exception") + "] " + jsonResult.getString("_exceptionMessage"));
            } catch (Exception ex) {
                if (ex.getMessage().startsWith("[SocketTimeoutException]") || ex.getMessage().startsWith("[IOException]")) {
                    checkLastFail();
                    com.gmt2001.Console.warn.println("DonationsCache.run: Failed to update donations: " + ex.getMessage());
                }
            }
        }

        if (firstUpdate && !killed) {
            firstUpdate = false;
            EventBus.instance().post(new TwitchAlertsDonationInitializedEvent(PhantomBot.getChannel(this.channel)));
        }

        if (donations != null && !killed) {
            for (int i = 0; i < donations.length(); i++) {
                if (cache == null || !cache.containsKey(donations.getJSONObject(i).get("donation_id").toString())) {
                    EventBus.instance().post(new TwitchAlertsDonationEvent(donations.getJSONObject(i).toString(), PhantomBot.getChannel(this.channel)));
                }
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
        for (Entry<String, DonationsCache> instance : instances.entrySet()) {
            instance.getValue().kill();
        }
    }
}
