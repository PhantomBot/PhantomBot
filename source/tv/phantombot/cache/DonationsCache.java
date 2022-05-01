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

import com.illusionaryone.TwitchAlertsAPIv1;
import java.util.Calendar;
import java.util.Date;
import org.json.JSONArray;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.streamlabs.donate.StreamLabsDonationEvent;
import tv.phantombot.event.streamlabs.donate.StreamLabsDonationInitializedEvent;

public class DonationsCache implements Runnable {

    private static final DonationsCache INSTANCE = new DonationsCache();

    public static DonationsCache instance() {
        return INSTANCE;
    }

    private final Thread updateThread;
    private boolean firstUpdate = true;
    private Date timeoutExpire = new Date();
    private Date lastFail = new Date();
    private int numfail = 0;
    private boolean killed = false;

    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private DonationsCache() {
        this.updateThread = new Thread(this, "tv.phantombot.cache.DonationsCache");

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    private void checkLastFail() {
        Calendar cal = Calendar.getInstance();
        this.numfail = (this.lastFail.after(new Date()) ? this.numfail + 1 : 1);

        cal.add(Calendar.MINUTE, 1);
        this.lastFail = cal.getTime();

        if (this.numfail > 5) {
            this.timeoutExpire = cal.getTime();
        }
    }

    public void start() {
        this.updateThread.start();
    }

    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
        try {
            Thread.sleep(20 * 1000);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.debug.println("DonationsCache.run: Failed to execute initial sleep [InterruptedException]: " + ex.getMessage());
        }

        while (!this.killed) {
            try {
                if (new Date().after(this.timeoutExpire)) {
                    this.updateCache();
                }
            } catch (Exception ex) {
                checkLastFail();
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            try {
                Thread.sleep(30 * 1000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("DonationsCache.run: Failed to execute sleep [InterruptedException]: " + ex.getMessage());
            }
        }
    }

    private void updateCache() throws Exception {
        JSONObject jsonResult;
        JSONArray donations = null;
        int lastId = PhantomBot.instance().getDataStore().GetInteger("settings", "", "DonationsCache_lastId");

        com.gmt2001.Console.debug.println("DonationsCache::updateCache");

        jsonResult = TwitchAlertsAPIv1.instance().GetDonations(lastId);

        if (jsonResult.getBoolean("_success")) {
            if (jsonResult.getInt("_http") == 200) {
                donations = jsonResult.getJSONArray("data");
            } else if (jsonResult.optString("message", "").contains("Unauthorized")) {
                com.gmt2001.Console.err.println("DonationsCache.updateCache: Bad API key disabling the StreamLabs module.");
                PhantomBot.instance().getDataStore().SetString("modules", "", "./handlers/donationHandler.js", "false");
                this.kill();
            }
        }

        if (donations != null && !this.killed) {
            for (int i = 0; i < donations.length(); i++) {
                int donationId = Integer.parseInt(donations.getJSONObject(i).get("donation_id").toString());
                if (donationId > lastId) {
                    lastId = donationId;
                    if (!PhantomBot.instance().getDataStore().exists("donations", donations.getJSONObject(i).get("donation_id").toString())) {
                        EventBus.instance().postAsync(new StreamLabsDonationEvent(donations.getJSONObject(i)));
                    }
                }
            }
        }

        if (this.firstUpdate && !this.killed) {
            this.firstUpdate = false;
            EventBus.instance().postAsync(new StreamLabsDonationInitializedEvent());
        }

        PhantomBot.instance().getDataStore().SetInteger("settings", "", "DonationsCache_lastId", lastId);
    }

    public void kill() {
        this.killed = true;
    }
}
