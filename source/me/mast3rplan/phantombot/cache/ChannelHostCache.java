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

import com.gmt2001.TwitchAPIv3;
import com.illusionaryone.TwitchTMIv1;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.twitch.host.TwitchHostedEvent;
import me.mast3rplan.phantombot.event.twitch.host.TwitchHostsInitializedEvent;
import me.mast3rplan.phantombot.event.twitch.host.TwitchUnhostedEvent;
import org.json.JSONArray;
import org.json.JSONObject;

/*
 * 11/16/16 - IllusionaryOne
 *
 * This class should be deprecated and removed in a couple of releases, allowing folks time to 
 * update their Oauth accordingly to use the WS-IRC method to retrieve hosts. By leaving this
 * in place for now, it doesn't force users to immediately obtain a new Oauth key for 
 * PhantomBot.
 */

public class ChannelHostCache implements Runnable {

    private static final Map<String, ChannelHostCache> instances = Maps.newHashMap();

    public static ChannelHostCache instance(String channel) {
        ChannelHostCache instance = instances.get(channel);

        if (instance == null) {
            instance = new ChannelHostCache(channel);

            instances.put(channel, instance);
            return instance;
        }

        return instance;
    }

    private Map<String, JSONObject> cache;
    private final String channel;
    private final Thread updateThread;
    private boolean firstUpdate = true;
    private Date timeoutExpire = new Date();
    private Date lastFail = new Date();
    private int numfail = 0;
    private int id = 0;
    private boolean killed = false;

    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private ChannelHostCache(String channel) {
        if (channel.startsWith("#")) {
            channel = channel.substring(1);
        }

        this.channel = channel;
        this.updateThread = new Thread(this);

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        updateThread.start();
    }

    public boolean is(String username) {
        return cache.containsKey(username);
    }

    public JSONObject get(String username) {
        return cache.get(username);
    }

    public int count() {
        return cache.size();
    }

    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {

        try {
            Thread.sleep(30 * 1000);
        } catch (InterruptedException e) {
            com.gmt2001.Console.debug.println("ChannelHostCache.run: Failed to initial sleep: [InterruptedException] " + e.getMessage());
        }

        while (!killed) {
            try {
                try {
                    if (new Date().after(timeoutExpire)) {
                        if (PhantomBot.instance().wsHostIRCConnected()) {
                            this.kill();
                        } else {
                            this.updateCache();
                        }
                    }
                } catch (Exception e) {
                    if (e.getMessage().startsWith("[SocketTimeoutException]") || e.getMessage().startsWith("[IOException]")) {
                        Calendar c = Calendar.getInstance();

                        if (lastFail.after(new Date())) {
                            numfail++;
                        } else {
                            numfail = 1;
                        }

                        c.add(Calendar.MINUTE, 1);

                        lastFail = c.getTime();

                        if (numfail >= 5) {
                            timeoutExpire = c.getTime();
                        }
                    }

                    com.gmt2001.Console.debug.println("ChannelHostCache.run: Failed to update hosts: " + e.getMessage());
                }
            } catch (Exception e) {
                com.gmt2001.Console.err.printStackTrace(e);
            }

            try {
                Thread.sleep(30 * 1000);
            } catch (InterruptedException e) {
                com.gmt2001.Console.debug.println("ChannelHostCache.run: Failed to sleep: [InterruptedException] " + e.getMessage());
            }
        }
    }

    private void updateCache() throws Exception {
        Map<String, JSONObject> newCache = Maps.newHashMap();

        JSONObject j;

        if (id == 0) {
            j = TwitchAPIv3.instance().GetChannel(channel);

            if (j.getBoolean("_success")) {
                if (j.getInt("_http") == 200) {
                    id = j.getInt("_id");
                    com.gmt2001.Console.debug.println("ChannelHostCache: Got ID: " + id);
                } else {
                    com.gmt2001.Console.debug.println("ChannelHostCache: ID check HTTP failure: " + j.getInt("_id"));
                }
            } else {
                com.gmt2001.Console.debug.println("ChannelHostCache: ID check fail");
            }
        }

        if (id == 0) {
            return;
        }

        j = TwitchTMIv1.instance().GetHostUsers(id);

        if (j.getBoolean("_success")) {
            if (j.getInt("_http") == 200) {
                JSONArray hosts = j.getJSONArray("hosts");
                com.gmt2001.Console.debug.println("ChannelHostCache: Success with TMI");

                for (int i = 0; i < hosts.length(); i++) {
                    newCache.put(hosts.getJSONObject(i).getString("host_login"), hosts.getJSONObject(i));
                    com.gmt2001.Console.debug.println("ChannelHostCache: Added: " + hosts.getJSONObject(i).getString("host_login"));
                }
            } else {
                try {
                    throw new Exception("[HTTPErrorException] HTTP " + j.getInt("_http") + " " + j.getString("error") + ". req="
                                        + j.getString("_type") + " " + j.getString("_url") + " " + j.getString("_post") + "   "
                                        + (j.has("message") && !j.isNull("message") ? "message=" + j.getString("message") : "content=" + j.getString("_content")));
                } catch (Exception e) {
                    com.gmt2001.Console.debug.println("ChannelHostCache.updateCache: Failed to update hosts: " + e.getMessage());
                }
            }
        } else {
            try {
                throw new Exception("[" + j.getString("_exception") + "] " + j.getString("_exceptionMessage"));
            } catch (Exception e) {
                if (e.getMessage().startsWith("[SocketTimeoutException]") || e.getMessage().startsWith("[IOException]")) {
                    Calendar c = Calendar.getInstance();

                    if (lastFail.after(new Date())) {
                        numfail++;
                    } else {
                        numfail = 1;
                    }

                    c.add(Calendar.MINUTE, 1);

                    lastFail = c.getTime();

                    if (numfail >= 5) {
                        timeoutExpire = c.getTime();
                    }
                }

                com.gmt2001.Console.debug.println("ChannelHostCache.updateCache: Failed to update hosts: " + e.getMessage());
            }
        }

        List<String> hosted = Lists.newArrayList();
        List<String> unhosted = Lists.newArrayList();

        for (String key : newCache.keySet()) {
            if (cache == null || !cache.containsKey(key)) {
                hosted.add(key);
            }
        }

        if (cache != null) {
            for (String key : cache.keySet()) {
                if (!newCache.containsKey(key)) {
                    unhosted.add(key);
                }
            }
        }

        this.cache = newCache;

        for (String hoster : hosted) {
            EventBus.instance().post(new TwitchHostedEvent(hoster, PhantomBot.getChannel(this.channel)));
        }

        for (String unhoster : unhosted) {
            EventBus.instance().post(new TwitchUnhostedEvent(unhoster, PhantomBot.getChannel(this.channel)));
        }

        if (firstUpdate) {
            firstUpdate = false;
            EventBus.instance().post(new TwitchHostsInitializedEvent(PhantomBot.getChannel(this.channel)));
        }
    }

    public void setCache(Map<String, JSONObject> cache) {
        this.cache = cache;
    }

    public Map<String, JSONObject> getCache() {
        return cache;
    }

    public void kill() {
        killed = true;
    }

    public static void killall() {
        for (Entry<String, ChannelHostCache> instance : instances.entrySet()) {
            instance.getValue().kill();
        }
    }
}
