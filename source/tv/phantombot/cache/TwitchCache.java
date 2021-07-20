/* astyle --style=java --indent=spaces=4 --mode=java */

 /*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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
package tv.phantombot.cache;

import com.gmt2001.TwitchAPIv5;
import com.illusionaryone.ImgDownload;
import java.io.File;
import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.ConcurrentHashMap;
import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.twitch.clip.TwitchClipEvent;
import tv.phantombot.event.twitch.gamechange.TwitchGameChangeEvent;
import tv.phantombot.event.twitch.offline.TwitchOfflineEvent;
import tv.phantombot.event.twitch.online.TwitchOnlineEvent;
import tv.phantombot.event.twitch.titlechange.TwitchTitleChangeEvent;

/**
 * TwitchCache Class
 *
 * This class keeps track of certain Twitch information such as if the channel is online or not and sends events to the JS side to indicate when the
 * channel has gone off or online.
 */
public class TwitchCache implements Runnable {

    private static final Map<String, TwitchCache> instances = new ConcurrentHashMap<>();
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
    private String previewLink = "https://www.twitch.tv/p/assets/uploads/glitch_solo_750x422.png";
    private String logoLink = "https://www.twitch.tv/p/assets/uploads/glitch_solo_750x422.png";
    private long streamUptimeSeconds = 0L;
    private int viewerCount = 0;
    private int views = 0;
    private String displayName;

    /**
     * Creates an instance for a channel.
     *
     * @param channel Name of the Twitch Channel for which this instance is created.
     * @return TwitchCache The new TwitchCache instance object.
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

    /**
     * Constructor for TwitchCache object.
     *
     * @param channel Name of the Twitch Channel for which this object is created.
     */
    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private TwitchCache(String channel) {
        if (channel.startsWith("#")) {
            channel = channel.substring(1);
        }

        this.channel = channel;
        this.displayName = channel;
        this.updateThread = new Thread(this, "tv.phantombot.cache.TwitchCache");

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        updateThread.start();
    }

    /**
     * Thread run instance. This is the main loop for the thread that is created to manage retrieving data from the Twitch API. This loop runs every
     * 30 seconds, querying data from Twitch.
     */
    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
        // If this cache starts before the database, we need to wait.
        while (PhantomBot.instance() == null || PhantomBot.instance().getDataStore() == null) {
            com.gmt2001.Console.debug.println("TwitchCache::run::failed:database:null");
            try {
                Thread.sleep(1000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /* Update the clips every other loop. */
        boolean doUpdateClips = false;

        /* Check the DB for a previous Game and Stream Title */
        String gameTitlen = getDBString("game");
        String streamTitlen = getDBString("title");

        if (gameTitlen != null) {
            this.gameTitle = gameTitlen;
        }
        if (streamTitlen != null) {
            this.streamTitle = streamTitlen;
        }

        while (!killed) {
            try {
                this.updateCache();
            } catch (Exception ex) {
                com.gmt2001.Console.debug.println("TwitchCache::run: " + ex.getMessage());
                com.gmt2001.Console.debug.printStackTrace(ex);
            }

            if (doUpdateClips) {
                doUpdateClips = false;
                try {
                    updateClips();
                } catch (JSONException ex) {
                    com.gmt2001.Console.err.logStackTrace(ex);
                }
            } else {
                doUpdateClips = true;
            }

            try {
                Thread.sleep(30 * 1000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.println("TwitchCache::run: Failed to execute sleep [InterruptedException]: " + ex.getMessage());
            }
        }
    }

    /**
     * Polls the Clips endppint, trying to find the most recent clip. Note that because Twitch reports by the viewcount, and has a limit of 100 clips,
     * it is possible to miss the most recent clip until it has views.
     *
     * We do not throw an exception because this is not a critical function unlike the gathering of data via the updateCache() method.
     */
    private void updateClips() throws JSONException {
        String doCheckClips = PhantomBot.instance().getDataStore().GetString("clipsSettings", "", "toggle");
        String discordDoClipsCheck = PhantomBot.instance().getDataStore().GetString("discordSettings", "", "clipsToggle");
        if ((doCheckClips == null || doCheckClips.equals("false")) && (discordDoClipsCheck == null || discordDoClipsCheck.equals("false"))) {
            return;
        }

        JSONObject clipsObj = TwitchAPIv5.instance().getClipsToday(this.channel);

        String clipURL = "";
        String creator = "";
        String title = "";
        JSONObject thumbnailObj = new JSONObject();
        int largestTrackingId = 0;

        if (clipsObj.has("clips")) {
            JSONArray clipsData = clipsObj.getJSONArray("clips");
            if (clipsData.length() > 0) {
                setDBString("most_viewed_clip_url", "https://clips.twitch.tv/" + clipsData.getJSONObject(0).getString("slug"));
                String lastTrackingIdStr = getDBString("last_clips_tracking_id");
                int lastTrackingId = (lastTrackingIdStr == null ? 0 : Integer.parseInt(lastTrackingIdStr));
                largestTrackingId = lastTrackingId;
                for (int i = 0; i < clipsData.length(); i++) {
                    JSONObject clipData = clipsData.getJSONObject(i);
                    int trackingId = Integer.parseInt(clipData.getString("tracking_id"));
                    if (trackingId > largestTrackingId) {
                        largestTrackingId = trackingId;
                        clipURL = "https://clips.twitch.tv/" + clipData.getString("slug");
                        creator = clipData.getJSONObject("curator").getString("display_name");
                        thumbnailObj = clipData.getJSONObject("thumbnails");
                        title = clipData.getString("title");
                    }
                }
            }
        }

        if (clipURL.length() > 0) {
            setDBString("last_clips_tracking_id", String.valueOf(largestTrackingId));
            setDBString("last_clip_url", clipURL);
            EventBus.instance().postAsync(new TwitchClipEvent(clipURL, creator, title, thumbnailObj));
        }
    }

    /**
     * Polls the Twitch API and updates the database cache with information. This method also sends events when appropriate.
     */
    private void updateCache() throws Exception {
        Boolean success = true;
        Boolean isOnlinen;
        Boolean sentTwitchOnlineEvent = false;
        String gameTitlen;
        String streamTitlen;
        String previewLinkn;
        String logoLinkn;
        Date streamCreatedDate;
        Date currentDate = new Date();
        long streamUptimeSecondsn;

        com.gmt2001.Console.debug.println("TwitchCache::updateCache");

        /* Retrieve Stream Information */
        try {
            JSONObject streamObj = TwitchAPIv5.instance().GetStream(this.channel);

            if (streamObj.getBoolean("_success") && streamObj.getInt("_http") == 200) {

                /* Determine if the stream is online or not */
                isOnlinen = !streamObj.isNull("stream");

                if (!this.isOnline && isOnlinen) {
                    this.isOnline = true;
                    EventBus.instance().postAsync(new TwitchOnlineEvent());
                    sentTwitchOnlineEvent = true;
                } else if (this.isOnline && !isOnlinen) {
                    this.isOnline = false;
                    EventBus.instance().postAsync(new TwitchOfflineEvent());
                }

                if (isOnlinen) {
                    /* Calculate the stream uptime in seconds. */
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
                    dateFormat.setTimeZone(TimeZone.getTimeZone("GMT"));
                    try {
                        streamCreatedDate = dateFormat.parse(streamObj.getJSONObject("stream").getString("created_at"));
                        streamUptimeSecondsn = (long) (Math.floor(currentDate.getTime() - streamCreatedDate.getTime()) / 1000);
                        this.streamUptimeSeconds = streamUptimeSecondsn;
                        this.streamCreatedAt = streamObj.getJSONObject("stream").getString("created_at");
                    } catch (ParseException | JSONException ex) {
                        success = false;
                        com.gmt2001.Console.err.println("TwitchCache::updateCache: Bad date from Twitch, cannot convert for stream uptime (" + streamObj.getJSONObject("stream").getString("created_at") + ")");
                        com.gmt2001.Console.debug.printStackTrace(ex);
                    }

                    /* Determine the preview link. */
                    previewLinkn = streamObj.getJSONObject("stream").getJSONObject("preview").getString("template").replace("{width}", "1920").replace("{height}", "1080");
                    this.previewLink = previewLinkn;

                    /* Get the viewer count. */
                    this.viewerCount = streamObj.getJSONObject("stream").getInt("viewers");
                } else {
                    streamUptimeSecondsn = 0L;
                    this.streamUptimeSeconds = streamUptimeSecondsn;
                    this.previewLink = "https://www.twitch.tv/p/assets/uploads/glitch_solo_750x422.png";
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
        } catch (JSONException ex) {
            com.gmt2001.Console.err.println("TwitchCache::updateCache: " + ex.getMessage());
            com.gmt2001.Console.debug.printStackTrace(ex);
            success = false;
        }

        // Wait a bit here.
        try {
            Thread.sleep(1000);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.debug.println(ex);
        }

        try {
            JSONObject streamObj = TwitchAPIv5.instance().GetChannel(this.channel);

            if (streamObj.getBoolean("_success") && streamObj.getInt("_http") == 200) {

                /* Get the game being streamed. */
                if (streamObj.has("game")) {
                    if (!streamObj.isNull("game")) {
                        gameTitlen = streamObj.getString("game");
                        if (!forcedGameTitleUpdate && !this.gameTitle.equals(gameTitlen)) {
                            setDBString("game", gameTitlen);
                            /* Send an event if we did not just send a TwitchOnlineEvent. */
                            if (!sentTwitchOnlineEvent) {
                                this.gameTitle = gameTitlen;
                                EventBus.instance().postAsync(new TwitchGameChangeEvent(gameTitlen));
                            }
                            this.gameTitle = gameTitlen;
                        }

                        if (forcedGameTitleUpdate && this.gameTitle.equals(gameTitlen)) {
                            forcedGameTitleUpdate = false;
                        }
                    }
                } else {
                    success = false;
                }

                if (streamObj.has("views")) {
                    /* Get the view count. */
                    this.views = streamObj.getInt("views");
                }


                /* Get the logo */
                if (streamObj.has("logo") && !streamObj.isNull("logo")) {
                    logoLinkn = streamObj.getString("logo");
                    this.logoLink = logoLinkn;
                    if (new File("./web/panel").isDirectory()) {
                        ImgDownload.downloadHTTPTo(logoLinkn, "./web/panel/img/logo.jpeg");
                    }
                }

                // Get the display name.
                if (streamObj.has("display_name") && !streamObj.isNull("display_name")) {
                    this.displayName = streamObj.getString("display_name");
                    if (new File("./web/panel").isDirectory()) {
                        File file = new File("./web/panel/js/utils/panelConfig.js");
                        if (file.exists()) {
                            // Read the file.
                            String fileContent = FileUtils.readFileToString(file, "utf-8");
                            // Replace the name.
                            fileContent = fileContent.replace("@DISPLAY_NAME@", streamObj.getString("display_name"));
                            // Write the new stuff.
                            FileUtils.writeStringToFile(file, fileContent, "utf-8");
                        }
                    }
                }

                /* Get the title. */
                if (streamObj.has("status")) {
                    if (!streamObj.isNull("status")) {
                        streamTitlen = streamObj.getString("status");

                        if (!forcedStreamTitleUpdate && !this.streamTitle.equals(streamTitlen)) {
                            setDBString("title", streamTitlen);
                            this.streamTitle = streamTitlen;
                            /* Send an event if we did not just send a TwitchOnlineEvent. */
                            if (!sentTwitchOnlineEvent) {
                                this.streamTitle = streamTitlen;
                                EventBus.instance().postAsync(new TwitchTitleChangeEvent(streamTitlen));
                            }
                            this.streamTitle = streamTitlen;
                        }
                        if (forcedStreamTitleUpdate && this.streamTitle.equals(streamTitlen)) {
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
        } catch (IOException | JSONException ex) {
            com.gmt2001.Console.err.println("TwitchCache::updateCache: " + ex.getMessage());
            com.gmt2001.Console.debug.printStackTrace(ex);
            success = false;
        }

        // Wait a bit here.
        try {
            Thread.sleep(1000);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.debug.println(ex);
        }

        if (PhantomBot.twitchCacheReady.equals("false") && success) {
            com.gmt2001.Console.debug.println("TwitchCache::setTwitchCacheReady(true)");
            PhantomBot.instance().setTwitchCacheReady("true");
        }
    }

    /**
     * Returns if the channel is online or not.
     */
    public Boolean isStreamOnline() {
        return this.isOnline;
    }

    /**
     * Returns a String representation of true/false to indicate if the stream is online or not.
     */
    public String isStreamOnlineString() {
        if (this.isOnline) {
            return "true";
        }
        return "false";
    }

    /**
     * Returns the uptime of the channel in seconds.
     */
    public long getStreamUptimeSeconds() {
        return this.streamUptimeSeconds;
    }

    /**
     * Returns the stream created_at date from Twitch.
     */
    public String getStreamCreatedAt() {
        return this.streamCreatedAt;
    }

    /**
     * Returns the name of the game being played in the channel.
     */
    public String getGameTitle() {
        return this.gameTitle;
    }

    /**
     * Sets the game title. Useful for when !game is used.
     */
    public void setGameTitle(String gameTitle) {
        forcedGameTitleUpdate = true;
        this.gameTitle = gameTitle;
        EventBus.instance().postAsync(new TwitchGameChangeEvent(gameTitle));
    }

    /**
     * Returns the title (status) of the stream.
     */
    public String getStreamStatus() {
        return this.streamTitle;
    }

    /**
     * Sets the title (status) of the stream. Useful for when !title is used.
     */
    public void setStreamStatus(String streamTitle) {
        forcedStreamTitleUpdate = true;
        this.streamTitle = streamTitle;
        EventBus.instance().postAsync(new TwitchTitleChangeEvent(streamTitle));
    }

    /**
     * Returns the display name of the streamer.
     */
    public String getDisplayName() {
        return this.displayName;
    }

    /**
     * Returns the preview link.
     */
    public String getPreviewLink() {
        return this.previewLink;
    }

    /**
     * Returns the logo link.
     */
    public String getLogoLink() {
        return this.logoLink;
    }

    /**
     * Returns the viewer count.
     */
    public int getViewerCount() {
        return this.viewerCount;
    }

    /**
     * Returns the views count.
     */
    public int getViews() {
        return this.views;
    }

    /**
     * Destroys the current instance of the TwitchCache object.
     */
    public void kill() {
        killed = true;
    }

    /**
     * Destroys all instances of the TwitchCache object.
     */
    public static void killall() {
        instances.entrySet().forEach(instance -> {
            instance.getValue().kill();
        });
    }

    /**
     * Gets a string from the database. Simply a wrapper around the PhantomBot instance.
     *
     * @param String The database key to search for in the streamInfo table.
     * @return String Returns the found value or null.
     */
    private String getDBString(String dbKey) {
        return PhantomBot.instance().getDataStore().GetString("streamInfo", "", dbKey);
    }

    /**
     * Sets a string into the database. Simply a wrapper around the PhantomBot instance.
     *
     * @param String The database key to use for inserting the value into the streamInfo table.
     * @param String The value to insert.
     * @return String Returns the found value or null.
     */
    private void setDBString(String dbKey, String dbValue) {
        PhantomBot.instance().getDataStore().SetString("streamInfo", "", dbKey, dbValue);
    }
}
