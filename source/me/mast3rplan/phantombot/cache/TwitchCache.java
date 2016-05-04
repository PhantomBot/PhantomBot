/* astyle --style=java --indent=spaces=4 --mode=java */

/*
 * Copyright (C) 2016 www.phantombot.net
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

/*
 * @author illusionaryone
 */

package me.mast3rplan.phantombot.cache;

import com.google.common.collect.Maps;

import java.lang.Math;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.List;
import java.util.TimeZone;

import org.json.JSONObject;

import com.gmt2001.TwitchAPIv3;

import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.jerklib.Channel;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.twitch.online.TwitchOnlineEvent;
import me.mast3rplan.phantombot.event.twitch.offline.TwitchOfflineEvent;

/*
 * TwitchCache Class
 *
 * This class keeps track of certain Twitch information such as if the channel is online or not
 * and sends events to the JS side to indicate when the channel has gone off or online.
 */
public class TwitchCache implements Runnable {

    private static final Map<String, TwitchCache> instances = Maps.newHashMap();
    private final String channel;
    private final Thread updateThread;
    private boolean killed = false;

    /* Cached data */
    private Boolean isOnline = false;
    private long streamUptimeSeconds = 0L;
    private String gameTitle = "Some Game";

    /*
     * Creates an instance for a channel.
     *
     * @param   channel      Name of the Twitch Channel for which this instance is created.
     * @return  TwitchCache  The new TwitchCache instance object.
     */
    public static TwitchCache instance(String channel) {
        TwitchCache instance = instances.get(channel);
        if (instance == null) {
            instance = new TwitchCache(channel);
            instances.put(channel, instance);
            return instance;
        }
        return instance;
    }

    /*
     * Constructor for TwitchCache object.
     *
     * @param  channel  Name of the Twitch Channel for which this object is created.
     */
    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private TwitchCache(String channel) {
        if (channel.startsWith("#")) {
            channel = channel.substring(1);
        }

        this.channel = channel;
        this.updateThread = new Thread(this);

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        updateThread.start();
    }

    /*
     * Thread run instance.  This is the main loop for the thread that is created to manage
     * retrieving data from the Twitch API.  This loop runs every 15 seconds, querying data
     * from Twitch.
     */
    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {

        /* Wait 15 seconds before starting to poll Twitch.  This time is to ensure that
         * all threads are up and running for handling this data.
         */
        try {
            Thread.sleep(15 * 1000);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.err.println("TwitchCache::run: " + ex.getMessage());
        }

        while (!killed) {
            try {
                try {
                    this.updateCache();
                } catch (Exception ex) {
                    com.gmt2001.Console.err.println("TwitchCache::run: " + ex.getMessage());
                }
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("TwitchCache::run: " + ex.getMessage());
            }

            try {
                Thread.sleep(15 * 1000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.println("TwitchCache::run: " + ex.getMessage());
            }
        }
    }

    /*
     * Polls the Twitch API and updates the database cache with information.  This method also
     * sends events when appropriate.
     */
    private void updateCache() throws Exception {
        Boolean isOnline = false;
        String  gameTitle = "Some Game";
        Date    streamCreatedDate = new Date();
        Date    currentDate = new Date();
        long    streamUptimeSeconds = 0L;

        /* Retrieve Stream Information */
        try {
            JSONObject streamObj = TwitchAPIv3.instance().GetStream(this.channel);

            if (streamObj.getBoolean("_success")) {

                /* Determine if the stream is online or not */
                isOnline = !streamObj.isNull("stream");

                com.gmt2001.Console.debug.println("TwitchCache::updateCache: isOnline(" + isOnline + ")");
                if (!this.isOnline && isOnline) {
                    com.gmt2001.Console.debug.println("TwitchCache::updateCache: Sending TwitchOnlineEvent()");
                    this.isOnline = true;
                    EventBus.instance().post(new TwitchOnlineEvent(getChannel()));
                } else if (this.isOnline && !isOnline) {
                    com.gmt2001.Console.debug.println("TwitchCache::updateCache: Sending TwitchOfflineEvent()");
                    this.isOnline = false;
                    EventBus.instance().post(new TwitchOfflineEvent(getChannel()));
                }

                if (isOnline) {
                    /* Calculate the stream uptime in seconds. */
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
                    dateFormat.setTimeZone(TimeZone.getTimeZone("GMT"));
                    try {
                        streamCreatedDate = dateFormat.parse(streamObj.getJSONObject("stream").getString("created_at"));
                        streamUptimeSeconds = (long) (Math.floor(currentDate.getTime() - streamCreatedDate.getTime()) / 1000);
                        this.streamUptimeSeconds = streamUptimeSeconds;
                    } catch (Exception ex) {
                        com.gmt2001.Console.err.println("TwitchCache::updateCache: Bad date from Twitch, cannot convert for stream uptime (" +
                                                         streamObj.getJSONObject("stream").getString("created_at") + ")");
                    }

                    /* Determine the game being streamed. */
                    gameTitle = streamObj.getJSONObject("stream").getString("game");
                    this.gameTitle = gameTitle;
                } else {
                    streamUptimeSeconds = 0L;
                    this.streamUptimeSeconds = streamUptimeSeconds;
                }
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("TwitchCache::updateCache: " + ex.getMessage());
        }
    }

    /*
     * Gets the PhantomBot channel object.
     *
     * @return  Channel  Channel object.
     */
    private Channel getChannel() {
        return PhantomBot.instance().getChannel("#" + this.channel);
    }

    /*
     * Returns if the channel is online or not.
     */
    public Boolean isStreamOnline() {
        return this.isOnline;
    }

    /*
     * Returns a String representation of true/false to indicate if the stream is online or not.
     */
    public String isStreamOnlineString() {
        if (this.isOnline) {
            return new String("true");
        }
        return new String("false");
    }

    /*
     * Returns the uptime of the channel in seconds.
     */
    public long getStreamUptimeSeconds() {
        com.gmt2001.Console.debug.println("getStreamUptimeSeconds::CORE::" + this.streamUptimeSeconds);
        return this.streamUptimeSeconds;
    }

    /*
     * Returns the name of the game being played in the channel.
     */
    public String getGameTitle() {
        return this.gameTitle;
    }

    /*
     * Destroys the current instance of the TwitchCache object.
     */
    public void kill() {
        killed = true;
    }

    /*
     * Destroys all instances of the TwitchCache object.
     */
    public static void killall() {
        for (Entry<String, TwitchCache> instance : instances.entrySet()) {
            instance.getValue().kill();
        }
    }
}
