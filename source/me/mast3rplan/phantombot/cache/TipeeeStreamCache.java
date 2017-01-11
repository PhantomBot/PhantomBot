/*
 * Copyright (C) 2016 phantombot.tv
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

import com.scaniatv.TipeeeStreamAPIv1;
import com.google.common.collect.Maps;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.tipeeestream.donate.TipeeeStreamDonationEvent;
import me.mast3rplan.phantombot.event.tipeeestream.donate.TipeeeStreamDonationInitializedEvent;
import org.json.JSONArray;
import org.json.JSONObject;

public class TipeeeStreamCache implements Runnable {

	private static final Map<String, TipeeeStreamCache> instances = Maps.newHashMap();
	private final Thread updateThread;
	private final String channel;
	private Map<String, String> cache = Maps.newHashMap();
	private Date timeoutExpire = new Date();
    private Date lastFail = new Date();
    private Boolean firstUpdate = true;
    private Boolean killed = false;
	private int numfail = 0;

	/*
	 * Used to call and start this instance.
	 *
	 * @param {String}  channel  Channel to run the cache for.
	 */
	public static TipeeeStreamCache instance(String channel) {
		TipeeeStreamCache instance = instances.get(channel);

		if (instance == null) {
			instance = new TipeeeStreamCache(channel);
			instances.put(channel, instance);
		}
		return instance;
	}

	/*
	 * Starts this class on a new thread.
	 *
	 * @param {String}  channel  Channel to run the cache for.
	 */
	private TipeeeStreamCache(String channel) {
		this.channel = channel;
		this.updateThread = new Thread(this);

		Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        this.updateThread.start();
	}

	/*
	 * Checks if the donation has been cached.
	 *
	 * @return {Boolean}
	 */
	public Boolean exists(String donationID) {
        return cache.containsKey(donationID);
    }

    /*
     * Returns the current cache count (size/length),
     *
     * @return {Integer}
     */
    public int count() {
        return cache.size();
    }

    /*
     * Checks the amount of time we failed when calling the api to avoid abusing it.
     */ 
    private void checkLastFail() {
        Calendar cal = Calendar.getInstance();
        numfail = (lastFail.after(new Date()) ? numfail + 1 : 1);

        cal.add(Calendar.MINUTE, 1);
        lastFail = cal.getTime();

        if (numfail > 5) {
            timeoutExpire = cal.getTime();
        }
    }

    /*
     * Starts the cache loop.
     */
    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
    	try {
    		Thread.sleep(30 * 1000);
    	} catch (InterruptedException ex) {
    		com.gmt2001.Console.debug.println("TipeeeStreamCache.run: Failed to execute initial sleep: [InterruptedException] " + ex.getMessage());
    	}

    	while (!killed) {
    		try {
    			try {
    				if (new Date().after(timeoutExpire)) {
    					this.updateCache();
    				}
    			} catch (Exception ex) {
    				checkLastFail();
    				com.gmt2001.Console.debug.println("TipeeeStreamCache.run: Failed to update donations: " + ex.getMessage());
    			}
    		} catch (Exception ex) {
    			com.gmt2001.Console.err.logStackTrace(ex);
    		}

    		try {
                Thread.sleep(30 * 1000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("TipeeeStreamCache.run: Failed to sleep: [InterruptedException] " + ex.getMessage());
            }
    	}
    }

    /*
     * Updates the cache by calling the TipeeeStream API.
     */
    private void updateCache() throws Exception {
        Map<String, String> newCache = Maps.newHashMap();
        JSONObject jsonResult;
        JSONObject object;
        JSONArray donations = null;

        jsonResult = TipeeeStreamAPIv1.instance().GetDonations();
        if (jsonResult.getBoolean("_success")) {
            if (jsonResult.getInt("_http") == 200) {
            	if (jsonResult.has("datas")) {
            		object = jsonResult.getJSONObject("datas");
            		if (object.has("items")) {
            			donations = object.getJSONArray("items");
            			for (int i = 0; i < donations.length(); i++) {
                            newCache.put(donations.getJSONObject(i).getString("id"), donations.getJSONObject(i).getString("id"));
                        }
            		}
            	}
            } else {
            	try { 
            	    throw new Exception("[HTTPErrorExecption] HTTP " + " " + jsonResult.getInt("_http") + ". req=" +
                        jsonResult.getString("_type") + " " + jsonResult.getString("_url") + "   " +
                        (jsonResult.has("message") && !jsonResult.isNull("message") ? "message=" +
                        jsonResult.getString("message") : "content=" + jsonResult.getString("_content")));
            	} catch (Exception ex) {
            		com.gmt2001.Console.err.println("TipeeeStreamCache.updateCache: Failed to update donations: " + ex.getMessage());

            		if (ex.getMessage().contains("authentification")) {
                        com.gmt2001.Console.warn.println("TipeeeStreamCache.updateCache: Bad OAuth token disabling the TipeeeStream module.");
                        PhantomBot.instance().getDataStore().SetString("modules", "", "./handlers/tipeeestreamHandler.js", "false");
                        this.kill();
                    }
            	}
            }
        } else {
        	try {
                throw new Exception("[" + jsonResult.getString("_exception") + "] " + jsonResult.getString("_exceptionMessage"));
            } catch (Exception ex) {
                if (ex.getMessage().startsWith("[SocketTimeoutException]") || ex.getMessage().startsWith("[IOException]")) {
                    checkLastFail();
                    com.gmt2001.Console.warn.println("TipeeeStreamCache.run: Failed to update donations: " + ex.getMessage());
                }
            }
        }

        if (firstUpdate && !killed) {
            firstUpdate = false;
            EventBus.instance().post(new TipeeeStreamDonationInitializedEvent(PhantomBot.getChannel("#" + this.channel)));
        }

        if (donations != null && !killed) {
            for (int i = 0; i < donations.length(); i++) {
                if (cache == null || !cache.containsKey(donations.getJSONObject(i).getString("id"))) {
                    EventBus.instance().post(new TipeeeStreamDonationEvent(donations.getJSONObject(i).toString(), PhantomBot.getChannel(this.channel)));
                }
            }
        }
        this.cache = newCache;
    }

    /*
     * Sets the current cache.
     *
     * @param {Map}  Cache
     */
    public void setCache(Map<String, String> cache) {
        this.cache = cache;
    }

    /*
     * Returns the current cache.
     *
     * @return {Map} Current cache.
     */
    public Map<String, String> getCache() {
        return cache;
    }

    /*
     * Kills the current cache.
     */
    public void kill() {
        killed = true;
    }

    /*
     * Kills all the caches.
     */
    public static void killall() {
        for (Entry<String, TipeeeStreamCache> instance : instances.entrySet()) {
            instance.getValue().kill();
        }
    }
}
