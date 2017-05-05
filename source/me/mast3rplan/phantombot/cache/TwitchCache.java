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
import me.mast3rplan.phantombot.twitchwsirc.Channel;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.twitch.online.TwitchOnlineEvent;
import me.mast3rplan.phantombot.event.twitch.offline.TwitchOfflineEvent;
import me.mast3rplan.phantombot.event.twitch.gamechange.TwitchGameChangeEvent;

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
    private Boolean forcedGameTitleUpdate = false;
    private Boolean forcedStreamTitleUpdate = false;
    private String streamCreatedAt = "";
    private String gameTitle = "Some Game";
    private String streamTitle = "Some Title";
    private String previewLink = "";
    private long streamUptimeSeconds = 0L;
    private int viewerCount = 0;
    private int views = 0;

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
        this.updateThread = new Thread(this, "me.mast3rplan.phantombot.cache.TwitchCache");

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        updateThread.start();
    }

    /*
     * Thread run instance.  This is the main loop for the thread that is created to manage
     * retrieving data from the Twitch API.  This loop runs every 30 seconds, querying data
     * from Twitch.
     */
    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {

        /* Check the DB for a previous Game and Stream Title */
        String gameTitle = getDBString("game");
        String streamTitle = getDBString("title");

        if (gameTitle != null) {
            this.gameTitle = gameTitle;
        }
        if (streamTitle != null) {
            this.streamTitle = streamTitle;
        }

        while (!killed) {
            try {
                try {
                    this.updateCache();
                } catch (Exception ex) {
                    com.gmt2001.Console.debug.println("TwitchCache::run: " + ex.getMessage());
                }
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("TwitchCache::run: " + ex.getMessage());
            }

            try {
                Thread.sleep(30 * 1000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.println("TwitchCache::run: Failed to execute sleep [InterruptedException]: " + ex.getMessage());
            }
        }
    }

    /*
     * Polls the Twitch API and updates the database cache with information.  This method also
     * sends events when appropriate.
     */
    private void updateCache() throws Exception {
        Boolean success = true;
        Boolean isOnline = false;
        Boolean sentTwitchOnlineEvent = false;
        String  gameTitle = "";
        String  streamTitle = "";
        String  previewLink = "";
        Date    streamCreatedDate = new Date();
        Date    currentDate = new Date();
        long    streamUptimeSeconds = 0L;

        com.gmt2001.Console.debug.println("TwitchCache::updateCache");

        /* Retrieve Stream Information */
        try {
            JSONObject streamObj = TwitchAPIv3.instance().GetStream(this.channel);

            if (streamObj.getBoolean("_success") && streamObj.getInt("_http") == 200) {

                /* Determine if the stream is online or not */
                isOnline = !streamObj.isNull("stream");

                if (!this.isOnline && isOnline) {
                    this.isOnline = true;
                    EventBus.instance().postAsync(new TwitchOnlineEvent(getChannel()));
                    sentTwitchOnlineEvent = true;
                } else if (this.isOnline && !isOnline) {
                    this.isOnline = false;
                    EventBus.instance().postAsync(new TwitchOfflineEvent(getChannel()));
                }

                if (isOnline) {
                    /* Calculate the stream uptime in seconds. */
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
                    dateFormat.setTimeZone(TimeZone.getTimeZone("GMT"));
                    try {
                        streamCreatedDate = dateFormat.parse(streamObj.getJSONObject("stream").getString("created_at"));
                        streamUptimeSeconds = (long) (Math.floor(currentDate.getTime() - streamCreatedDate.getTime()) / 1000);
                        this.streamUptimeSeconds = streamUptimeSeconds;
                        this.streamCreatedAt = streamObj.getJSONObject("stream").getString("created_at");
                    } catch (Exception ex) {
                        success = false;
                        com.gmt2001.Console.err.println("TwitchCache::updateCache: Bad date from Twitch, cannot convert for stream uptime (" + streamObj.getJSONObject("stream").getString("created_at") + ")");
                    }

                    /* Determine the preview link. */
                    previewLink = streamObj.getJSONObject("stream").getJSONObject("preview").getString("medium");
                    this.previewLink = previewLink;

                    /* Get the viewer count. */
                    viewerCount = streamObj.getJSONObject("stream").getInt("viewers");
                    this.viewerCount = viewerCount;


                } else {
                    streamUptimeSeconds = 0L;
                    this.streamUptimeSeconds = streamUptimeSeconds;
                    this.previewLink = "";
                    this.streamCreatedAt = "";
                    this.viewerCount = 0;
                }

            } else {
                success = false;
                if (streamObj.has("message")) {
                    com.gmt2001.Console.err.println("TwitchCache::updateCache: " + streamObj.getString("message"));
                } else {
                    com.gmt2001.Console.debug.println("TwitchCache::updateCache: Failed to update.");
                }
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("TwitchCache::updateCache: " + ex.getMessage());
            success = false;
        }

        // Wait a bit here.
        try {
            Thread.sleep(500);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.debug.println(ex);
        }

        try {
            JSONObject streamObj = TwitchAPIv3.instance().GetChannel(this.channel);

            if (streamObj.getBoolean("_success") && streamObj.getInt("_http") == 200) {

                /* Get the game being streamed. */
                if (streamObj.has("game")) {
                    if (!streamObj.isNull("game")) {
                        gameTitle = streamObj.getString("game");
                        if (!forcedGameTitleUpdate && !this.gameTitle.equals(gameTitle)) {
                            setDBString("game", gameTitle);
                            /* Send an event if we did not just send a TwitchOnlineEvent. */
                            if (!sentTwitchOnlineEvent) {
                                this.gameTitle = gameTitle;
                                EventBus.instance().postAsync(new TwitchGameChangeEvent(gameTitle, getChannel()));
                            }
                            this.gameTitle = gameTitle;
                        }
    
                        if (forcedGameTitleUpdate && this.gameTitle.equals(gameTitle)) {
                            forcedGameTitleUpdate = false;
                        }
                    }
                } else {
                    success = false;
                }

                if (streamObj.has("views")) {
                    /* Get the view count. */
                    views = streamObj.getInt("views");
                    this.views = views;
                }

                /* Get the title. */
                if (streamObj.has("status")) {
                    if (!streamObj.isNull("status")) {
                        streamTitle = streamObj.getString("status");

                        if (!forcedStreamTitleUpdate && !this.streamTitle.equals(streamTitle)) {
                            setDBString("title", streamTitle);
                            this.streamTitle = streamTitle;
                        }

                        if (forcedStreamTitleUpdate && this.streamTitle.equals(streamTitle)) {
                            forcedStreamTitleUpdate = false;
                        }
                    }
                } else {
                    success = false;
                }
            } else {
                success = false;
                if (streamObj.has("message")) {
                    com.gmt2001.Console.err.println("TwitchCache::updateCache: " + streamObj.getString("message"));
                } else {
                    com.gmt2001.Console.debug.println("TwitchCache::updateCache: Failed to update.");
                }
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("TwitchCache::updateCache: " + ex.getMessage());
            success = false;
        }

        if (PhantomBot.twitchCacheReady.equals("false") && success) {
            com.gmt2001.Console.debug.println("TwitchCache::setTwitchCacheReady(true)");
            PhantomBot.instance().setTwitchCacheReady("true");
        }
    }

    /*
     * Gets the PhantomBot channel object.
     *
     * @return  Channel  Channel object.
     */
    private Channel getChannel() {
        return PhantomBot.getChannel(this.channel);
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
        return this.streamUptimeSeconds;
    }

    /*
     * Returns the stream created_at date from Twitch.
     */
    public String getStreamCreatedAt() {
        return this.streamCreatedAt;
    }

    /*
     * Returns the name of the game being played in the channel.
     */
    public String getGameTitle() {
        return this.gameTitle;
    }

    /*
     * Sets the game title.  Useful for when !game is used.
     */
     public void setGameTitle(String gameTitle) {   
         forcedGameTitleUpdate = true;
         this.gameTitle = gameTitle;
         EventBus.instance().postAsync(new TwitchGameChangeEvent(gameTitle, getChannel()));
     }

    /*
     * Returns the title (status) of the stream.
     */
    public String getStreamStatus() {
        return this.streamTitle;
    }

    /*
     * Sets the title (status) of the stream.  Useful for when !title is used.
     */
    public void setStreamStatus(String streamTitle) {
        forcedStreamTitleUpdate = true;
        this.streamTitle = streamTitle;
    }

    /*
     * Returns the preview link.
     */
    public String getPreviewLink() {
        return this.previewLink;
    }

    /* 
     * Returns the viewer count.
     */
    public int getViewerCount() {
        return this.viewerCount;
    }

    /* 
     * Returns the views count.
     */
    public int getViews() {
        return this.views;
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

    /*
     * Gets a string from the database. Simply a wrapper around the PhantomBot instance.
     * 
     * @param   String  The database key to search for in the streamInfo table.
     * @return  String  Returns the found value or null.
     */
    private String getDBString(String dbKey) {
        return PhantomBot.instance().getDataStore().GetString("streamInfo", "", dbKey);
    }

    /*
     * Sets a string into the database.  Simply a wrapper around the PhantomBot instance.
     * 
     * @param   String  The database key to use for inserting the value into the streamInfo table.
     * @param   String  The value to insert.
     * @return  String  Returns the found value or null.
     */
    private void setDBString(String dbKey, String dbValue) {
        PhantomBot.instance().getDataStore().SetString("streamInfo", "", dbKey, dbValue);
    }
}
