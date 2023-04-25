/* astyle --style=java --indent=spaces=4 --mode=java */

 /*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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

import com.gmt2001.ExecutorService;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.URIUtil;
import com.gmt2001.twitch.cache.ViewerCache;

import net.engio.mbassy.listener.Handler;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SignalType;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.Listener;
import tv.phantombot.event.jvm.PropertiesReloadedEvent;
import tv.phantombot.event.twitch.TwitchBroadcasterTypeEvent;
import tv.phantombot.event.twitch.clip.TwitchClipEvent;
import tv.phantombot.event.twitch.gamechange.TwitchGameChangeEvent;
import tv.phantombot.event.twitch.offline.TwitchOfflineEvent;
import tv.phantombot.event.twitch.online.TwitchOnlineEvent;
import tv.phantombot.event.twitch.titlechange.TwitchTitleChangeEvent;
import tv.phantombot.twitch.api.Helix;

/**
 * TwitchCache Class
 *
 * This class keeps track of certain Twitch information such as if the channel is online or not and sends events to the JS side to indicate when the
 * channel has gone off or online.
 */
public final class TwitchCache implements Listener {

    private static final TwitchCache INSTANCE = new TwitchCache();

    /* Cached data */
    private boolean isOnline = false;
    private boolean eventSubMode = false;
    private String streamCreatedAt = "";
    private String gameTitle = "Some Game";
    private String streamTitle = "Some Title";
    private String previewLink = "https://www.twitch.tv/p/assets/uploads/glitch_solo_750x422.png";
    private String logoLink = "https://www.twitch.tv/p/assets/uploads/glitch_solo_750x422.png";
    private ZonedDateTime streamUptime = null;
    private int viewerCount = 0;
    private int subscriberCount = 0;
    private int subscriberPoints = 0;
    private Instant offlineDelay = null;
    private Instant offlineTimeout = Instant.MIN;
    private ZonedDateTime latestClip = null;
    private ZonedDateTime latestLogo = ZonedDateTime.ofInstant(Instant.EPOCH, ZoneId.systemDefault());
    private Instant nextLogoCheck = Instant.EPOCH;
    private boolean isAffiliate = false;
    private boolean isPartner = false;
    private ScheduledFuture<?> streamUpdate;
    private ScheduledFuture<?> clipUpdate;

    public static TwitchCache instance() {
        return INSTANCE;
    }

    /**
     * Constructor for TwitchCache object.
     *
     * @param channel Name of the Twitch Channel for which this object is created.
     */
    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private TwitchCache() {
        ExecutorService.schedule(this::startup, 1, TimeUnit.SECONDS);
    }

    /**
     * Performs startup if properties are reloaded and previous startup has failed
     *
     * @param event
     */
    @Handler
    public void onPropertiesReloadedEvent(PropertiesReloadedEvent event) {
        if (this.streamUpdate == null || this.clipUpdate == null) {
            this.kill();
            ExecutorService.schedule(this::startup, 1, TimeUnit.SECONDS);
        }
    }

    private void startup() {
        if (PhantomBot.instance() != null && PhantomBot.instance().getDataStore() != null) {
            String gameTitlen = getDBString("game");
            String streamTitlen = getDBString("title");

            if (gameTitlen != null) {
                this.gameTitle = gameTitlen;
            }
            if (streamTitlen != null) {
                this.streamTitle = streamTitlen;
            }
            this.syncStreamStatus(true);
            this.streamUpdate = ExecutorService.scheduleAtFixedRate(() -> {
                Thread.currentThread().setName("TwitchCache::updateCache");
                com.gmt2001.Console.debug.println("TwitchCache::updateCache");
                try {
                    this.updateCache();
                } catch (Exception ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            }, 0, 30, TimeUnit.SECONDS);
            this.clipUpdate = ExecutorService.scheduleAtFixedRate(() -> {
                Thread.currentThread().setName("TwitchCache::updateClips");
                com.gmt2001.Console.debug.println("TwitchCache::updateClips");
                try {
                    this.updateClips();
                } catch (Exception ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            }, 0, 1, TimeUnit.MINUTES);
        } else {
            ExecutorService.schedule(this::startup, 1, TimeUnit.SECONDS);
        }
    }

    /**
     * Polls the Clips endpoint, trying to find the most recent clip. Note that because Twitch reports by the viewcount, and has a limit of 100 clips,
     * it is possible to miss the most recent clip until it has views.
     *
     * We do not throw an exception because this is not a critical function unlike the gathering of data via the updateCache() method.
     */
    private void updateClips() {
        if (this.latestClip == null) {
            String lastDateStr = getDBString("last_clips_tracking_date");
            if (lastDateStr != null && !lastDateStr.isBlank()) {
                this.latestClip = ZonedDateTime.parse(lastDateStr, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            } else {
                this.latestClip = ZonedDateTime.ofInstant(Instant.EPOCH, ZoneId.systemDefault());
            }
        }

        ZonedDateTime start = this.latestClip;
        Duration timeSinceLast = Duration.between(start, ZonedDateTime.now());
        if (!timeSinceLast.abs().minusDays(1).isNegative()) {
            start = ZonedDateTime.ofInstant(Instant.now().minus(1, ChronoUnit.DAYS), ZoneId.systemDefault());
        }

        start = start.withSecond(0);

        Helix.instance().getClipsAsync(null, ViewerCache.instance().broadcaster().id(), null, 100, null, null, start, start.plusDays(1))
                .doOnSuccess(jso -> {
                    if (jso != null && !jso.has("error") && jso.has("data") && !jso.isNull("data")) {
                        ZonedDateTime newLatestClip = this.latestClip;
                        String newLatestClipURL = null;
                        final JSONArray data = jso.getJSONArray("data");

                        if (data.length() > 0) {
                            for (int i = 0; i < data.length(); i++) {
                                JSONObject clip = data.getJSONObject(i);

                                try {
                                    if (i == 0) {
                                        this.setDBString("most_viewed_clip_url", clip.getString("url"));
                                    }

                                    ZonedDateTime clipDate = ZonedDateTime.parse(clip.getString("created_at"), DateTimeFormatter.ISO_OFFSET_DATE_TIME);

                                    if (clipDate.isAfter(this.latestClip)) {
                                        if (clipDate.isAfter(newLatestClip)) {
                                            newLatestClip = clipDate;
                                            newLatestClipURL = clip.getString("url");
                                        }

                                        JSONObject thumbnails = new JSONObject();
                                        thumbnails.put("medium", clip.getString("thumbnail_url"));
                                        thumbnails.put("small", clip.getString("thumbnail_url"));
                                        thumbnails.put("tiny", clip.getString("thumbnail_url"));

                                        EventBus.instance().postAsync(new TwitchClipEvent(clip.getString("url"), clip.getString("creator_name"),
                                                clip.getString("title"), thumbnails));
                                    }
                                } catch (NullPointerException | JSONException | DateTimeParseException ex) {
                                }
                            }

                            if (newLatestClipURL != null) {
                                this.latestClip = newLatestClip;
                                setDBString("last_clips_tracking_date", newLatestClip.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
                                setDBString("last_clip_url", newLatestClipURL);
                            }
                        }
                    }
                }).doOnError(ex -> com.gmt2001.Console.err.printStackTrace(ex)).subscribe();
    }

    /**
     * Polls the Twitch API and updates the database cache with information. This method also sends events when appropriate.
     */
    /**
     * @botproperty offlinedelay - The delay, in seconds, before the `channel` is confirmed to be offline. Default `30`
     * @botpropertycatsort offlinedelay 200 20 Twitch
     */
    /**
     * @botproperty offlinetimeout - The timeout, in seconds, after `channel` goes offline before it can be online. Default `300`
     * @botpropertycatsort offlinetimeout 210 20 Twitch
     */
    private void updateCache() {
        Helix.instance().getStreamsAsync(1, null, null, List.of(ViewerCache.instance().broadcaster().id()), null, null, null)
            .doOnSuccess(jso -> {
                if (jso != null && !jso.has("error") && jso.has("data") && !jso.isNull("data")) {
                    boolean isOnlinen = jso.getJSONArray("data").length() > 0;
                    boolean sentTwitchOnlineEvent = false;

                    if (!eventSubMode && !this.isOnline && isOnlinen) {
                        if (Instant.now().isAfter(this.offlineTimeout)) {
                            this.offlineDelay = null;
                            sentTwitchOnlineEvent = true;
                        }
                    } else if (!eventSubMode && this.isOnline && !isOnlinen) {
                        if (this.offlineDelay == null) {
                            this.offlineDelay = Instant.now().plusSeconds(CaselessProperties.instance().getPropertyAsInt("offlinedelay", 30));
                        } else if (Instant.now().isAfter(this.offlineDelay)) {
                            this.offlineDelay = null;
                            this.goOffline(true);
                        }
                    }

                    if (this.isOnline && isOnlinen) {
                        JSONObject data = jso.getJSONArray("data").getJSONObject(0);
                        /* Calculate the stream uptime in seconds. */
                        this.streamUptime = ZonedDateTime.parse(data.getString("started_at"), DateTimeFormatter.ISO_OFFSET_DATE_TIME);
                        this.streamCreatedAt = data.getString("started_at");

                        /* Determine the preview link. */
                        this.previewLink = data.getString("thumbnail_url").replace("{width}", "1920").replace("{height}", "1080");

                        /* Get the viewer count. */
                        this.viewerCount = data.getInt("viewer_count");

                        String gameTitlen = data.getString("game_name");

                        if (!eventSubMode) {
                            this.setGameTitle(gameTitlen, !sentTwitchOnlineEvent);
                        }

                        String streamTitlen = data.getString("title");

                        if (!eventSubMode) {
                            this.setStreamStatus(streamTitlen, !sentTwitchOnlineEvent);
                        }

                        if (!eventSubMode && sentTwitchOnlineEvent) {
                            this.goOnline(true);
                        }
                    } else if (!eventSubMode && !this.isOnline && !isOnlinen) {
                        this.streamUptime = null;
                        this.previewLink = "https://www.twitch.tv/p/assets/uploads/glitch_solo_750x422.png";
                        this.streamCreatedAt = "";
                        this.viewerCount = 0;
                    }
                }

                if (!PhantomBot.twitchCacheReady) {
                    com.gmt2001.Console.debug.println("TwitchCache::setTwitchCacheReady(true)");
                    PhantomBot.instance().setTwitchCacheReady(true);
                }
            }).doOnError(ex -> com.gmt2001.Console.err.printStackTrace(ex)).subscribe();

        Helix.instance().getUsersAsync(List.of(ViewerCache.instance().broadcaster().id()), null)
            .doOnSuccess(jso -> {
                if (jso != null && !jso.has("error") && jso.has("data") && !jso.isNull("data")) {
                    if (jso.getJSONArray("data").length() > 0) {
                        JSONObject data = jso.getJSONArray("data").getJSONObject(0);

                        String oldLogoLink = this.logoLink;
                        this.logoLink = data.getString("profile_image_url");
                        this.setAffiliatePartner(data.getString("broadcaster_type").equals("affiliate"), data.getString("broadcaster_type").equals("partner"));

                        if (Instant.now().isAfter(this.nextLogoCheck)) {
                            this.nextLogoCheck = Instant.now().plus(1, ChronoUnit.HOURS);
                            HttpClientResponse headResponse = HttpClient.head(URIUtil.create(data.getString("profile_image_url")));

                            if (headResponse.isSuccess()) {
                                ZonedDateTime lastModified = ZonedDateTime.parse(headResponse.responseHeaders().get("last-modified"), DateTimeFormatter.RFC_1123_DATE_TIME);

                                if (lastModified.isAfter(this.latestLogo) || !oldLogoLink.equals(data.getString("profile_image_url"))) {
                                    HttpClientResponse logoResponse = HttpClient.get(URIUtil.create(data.getString("profile_image_url")));

                                    if (logoResponse.isSuccess()) {
                                        Path logoPath = Paths.get("./web/panel/img/logo.jpeg");

                                        try {
                                            Files.createDirectories(logoPath.getParent());

                                            Files.write(logoPath, logoResponse.rawResponseBody(), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);

                                            this.latestLogo = lastModified;
                                        } catch (IOException ex) {
                                            com.gmt2001.Console.err.printStackTrace(ex);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }).doOnError(ex -> com.gmt2001.Console.err.printStackTrace(ex)).subscribe();

        if (this.isAffiliateOrPartner()) {
            Helix.instance().getBroadcasterSubscriptionsAsync(ViewerCache.instance().broadcaster().id(), null, 1, null)
                .doOnSuccess(jso -> {
                    if (jso != null && !jso.has("error")) {
                        this.subscriberCount = jso.optInt("total");
                        this.subscriberPoints = jso.optInt("points");
                    }
                }).doOnError(ex -> com.gmt2001.Console.err.printStackTrace(ex)).subscribe();
        }
    }

    /**
     * Sets the current Affiliate and Partner states, and sends ane vent if they changed
     *
     * @param isAffiliate {@code true} If the broadcaster is an Affiliate (not partner)
     * @param isPartner {@code true} If the broadcaster is a Partner (not affiliate)
     */
    public void setAffiliatePartner(boolean isAffiliate, boolean isPartner) {
        boolean changed = this.isAffiliate != isAffiliate || this.isPartner != isPartner;

        if (changed) {
            EventBus.instance().postAsync(new TwitchBroadcasterTypeEvent(this.isAffiliate, this.isPartner, isAffiliate, isPartner));
        }

        this.isAffiliate = isAffiliate;
        this.isPartner = isPartner;
    }

    /**
     * Indicates if this channel is an affiliate
     *
     * @return
     */
    public boolean isAffiliate() {
        return this.isAffiliate;
    }

    /**
     * Indicates if this channel is a partner
     *
     * @return
     */
    public boolean isPartner() {
        return this.isPartner;
    }

    /**
     * Indicates if this channel is either an affiliate or a partner
     *
     * @return
     */
    public boolean isAffiliateOrPartner() {
        return this.isAffiliate() || this.isPartner();
    }

    /**
     * Returns if the channel is online or not.
     *
     * @return
     */
    public boolean isStreamOnline() {
        return this.isOnline;
    }

    /**
     * Returns a String representation of true/false to indicate if the stream is online or not.
     *
     * @return
     */
    public String isStreamOnlineString() {
        return this.isStreamOnline() ? "true" : "false";
    }

    /**
     * Returns the uptime of the channel in seconds.
     *
     * @return
     */
    public long getStreamUptimeSeconds() {
        if (this.streamUptime == null) {
            return 0L;
        }

        return Duration.between(this.streamUptime, ZonedDateTime.now()).getSeconds();
    }

    /**
     * Returns the stream created_at date from Twitch.
     *
     * @return
     */
    public String getStreamCreatedAt() {
        return this.streamCreatedAt;
    }

    /**
     * Returns the name of the game being played in the channel.
     *
     * @return
     */
    public String getGameTitle() {
        return this.gameTitle;
    }

    /**
     * Sets the game title
     *
     * @param gameTitle The new game name
     */
    public void setGameTitle(String gameTitle) {
        this.setGameTitle(gameTitle, true);
    }

    /**
     * Sets the game title
     *
     * @param gameTitle The new game name
     * @param sendEvent {@code true} to send a {@link TwitchGameChangeEvent}
     */
    public void setGameTitle(String gameTitle, boolean sendEvent) {
        boolean changed = !this.gameTitle.equals(gameTitle);
        setDBString("game", gameTitle);
        this.gameTitle = gameTitle;
        if (changed && sendEvent) {
            EventBus.instance().postAsync(new TwitchGameChangeEvent(gameTitle));
        }
    }

    /**
     * Returns the title (status) of the stream
     *
     * @return
     */
    public String getStreamStatus() {
        return this.streamTitle;
    }

    /**
     * Sets the title (status) of the stream
     *
     * @param streamTitle The new title
     */
    public void setStreamStatus(String streamTitle) {
        this.setStreamStatus(streamTitle, true);
    }

    /**
     * Sets the title (status) of the stream
     *
     * @param streamTitle The new title
     * @param sendEvent {@code true} to send a {@link TwitchTitleChangeEvent}
     */
    public void setStreamStatus(String streamTitle, boolean sendEvent) {
        boolean changed = !this.streamTitle.equals(streamTitle);
        setDBString("title", streamTitle);
        this.streamTitle = streamTitle;
        if (changed && sendEvent) {
            EventBus.instance().postAsync(new TwitchTitleChangeEvent(streamTitle));
        }
    }

    /**
     * Returns the display name of the streamer.
     *
     * @return
     */
    public String getDisplayName() {
        try {
            return ViewerCache.instance().broadcaster().name();
        } catch (Exception ex) {
            return PhantomBot.instance().getChannelName();
        }
    }

    /**
     * Returns the preview link.
     *
     * @return
     */
    public String getPreviewLink() {
        return this.previewLink;
    }

    /**
     * Returns the logo link.
     *
     * @return
     */
    public String getLogoLink() {
        return this.logoLink;
    }

    /**
     * Returns the viewer count.
     *
     * @return
     * @deprecated Please use {@link #viewers()} instead
     */
    @Deprecated(since = "3.8.0.0", forRemoval = true)
    public int getViewerCount() {
        return this.viewerCount;
    }

    /**
     * The current number of followers of the broadcaster.
     * <br/><br/>
     * This number may be slightly off from the actual live numbers due to the nature of Twitch API caching
     *
     * @return The number of followers of the broadcaster
     */
    public int followers() {
        return FollowersCache.instance().total();
    }

    /**
     * The current number of subscribers of the broadcaster.
     * <br/><br/>
     * This number may be slightly off from the actual live numbers due to the nature of Twitch API caching
     *
     * @return The number of subscribers of the broadcaster
     */
    public int subscribers() {
        return this.subscriberCount;
    }

    /**
     * The current number of subscriber points of the broadcaster.
     * <br/><br/>
     * This number may be slightly off from the actual live numbers due to the nature of Twitch API caching
     *
     * @return The number of subscriber points of the broadcaster
     */
    public int subscriberPoints() {
        return this.subscriberPoints;
    }

    /**
     * The current number of viewers of the live stream.
     * <br/><br/>
     * This number may be slightly off from the actual live numbers due to the nature of Twitch API caching
     *
     * @return The number of viewers in the stream; {@code 0} if not live
     */
    public int viewers() {
        return this.viewerCount;
    }

    /**
     * Returns the views count. Twitch does not report this anymore
     *
     * @return {@code -1} as Twitch does not report this anymore
     * @deprecated Twitch does not report this anymore, this method is temporarily available to prevent script errors and will be removed soon
     */
    @Deprecated(since = "3.8.0.0", forRemoval = true)
    public int getViews() {
        return -1;
    }

    /**
     * Sets the current state of EventSub mode. When EventSub mode is enabled, stream title, game, and online state are not synced by TwitchAPI
     *
     * @param enabled {@code true} to enable EventSub mode
     */
    public synchronized void eventSubMode(boolean enabled) {
        this.eventSubMode = enabled;
    }

    /**
     * Returns the current state of EventSub mode. When EventSub mode is enabled, stream title, game, and online state are not synced by TwitchAPI
     *
     * @return {@code true} if EventSub mode is enabled
     */
    public boolean eventSubMode() {
        return this.eventSubMode;
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

    /**
     * Sets online state
     *
     * @param shouldSendEvent {@code true} to send a {@link TwitchOnlineEvent}
     */
    public void goOnline(boolean shouldSendEvent) {
        this.goOnline(shouldSendEvent, true);
    }

    /**
     * Sets online state
     *
     * @param shouldSendEvent {@code true} to send a {@link TwitchOnlineEvent}
     */
    public void goOnline(boolean shouldSendEvent, boolean useOfflineTimeout) {
        if (!this.isOnline && (!useOfflineTimeout || Instant.now().isAfter(this.offlineTimeout))) {
            this.isOnline = true;
            this.streamUptime = ZonedDateTime.now();

            if (shouldSendEvent) {
                EventBus.instance().postAsync(new TwitchOnlineEvent());
            }
        }
    }

    /**
     * Sets offline state
     *
     * @param shouldSendEvent {@code true} to send a {@link TwitchOfflineEvent}
     */
    public void goOffline(boolean shouldSendEvent) {
        if (this.isOnline) {
            this.isOnline = false;
            this.viewerCount = 0;
            this.streamUptime = null;
            this.offlineTimeout = Instant.now().plusSeconds(CaselessProperties.instance().getPropertyAsInt("offlinetimeout", 300));

            if (shouldSendEvent) {
                EventBus.instance().postAsync(new TwitchOfflineEvent());
            }
        }
    }

    /**
     * Syncs the stream status using both Get Streams and Get Channel Information, then calls {@link #goOnline(boolean)} with the parameter set to {@code true}
     */
    public void syncOnline() {
        Mono.delay(Duration.ofSeconds(10)).doFinally((SignalType s) -> {
            this.syncStreamStatus(false, (hasStream) -> {
                if (!hasStream) {
                    this.syncStreamInfoFromChannel(false, (hasChannel) -> {
                        this.goOnline(true, false);
                    });
                } else {
                    this.goOnline(true);
                }
            });
        }).subscribe();
    }

    /**
     * Updates the stream status from the API
     */
    public void syncStreamStatus() {
        this.syncStreamStatus(false);
    }

    /**
     * Updates the stream status from the Get Streams endpoint
     *
     * @param shouldSendEvent {@code true} to send {@link TwitchOnlineEvent} or {@link TwitchOfflineEvent}, if appropriate
     */
    public void syncStreamStatus(boolean shouldSendEvent) {
        this.syncStreamStatus(shouldSendEvent, null);
    }

    /**
     * Updates the stream title/game/online status from the Get Streams endpoint
     *
     * @param shouldSendEvent {@code true} to send events, if appropriate
     * @param callback A callback to execute on success. The parameter is {@code true} if the stream information was successfully retrieved
     */
    public void syncStreamStatus(boolean shouldSendEvent, Consumer<Boolean> callback) {
        Helix.instance().getStreamsAsync(1, null, null, List.of(ViewerCache.instance().broadcaster().id()), null, null, null).doOnSuccess(streams -> {
            boolean hasData = false;
            if (streams != null && streams.has("data")) {
                if (streams.getJSONArray("data").length() > 0) {
                    hasData = true;
                    JSONObject stream = streams.getJSONArray("data").getJSONObject(0);
                    boolean sendingOnline = false;

                    if (shouldSendEvent) {
                        if (!this.isOnline) {
                            sendingOnline = true;
                        }
                    }

                    this.setStreamStatus(stream.optString("title", ""), shouldSendEvent && !sendingOnline);
                    this.setGameTitle(stream.optString("game_name", ""), shouldSendEvent && !sendingOnline);
                    this.updateViewerCount(stream.optInt("viewer_count", 0));
                    this.streamCreatedAt = stream.optString("started_at", "");
                    this.previewLink = stream.optString("thumbnail_url", "").replace("{width}", "1920").replace("{height}", "1080");

                    if (sendingOnline) {
                        this.goOnline(true);
                        this.offlineDelay = null;
                    }
                } else {
                    if (shouldSendEvent) {
                        if (this.isOnline) {
                            this.goOffline(true);
                            this.offlineDelay = null;
                        }
                    }
                }
            }

            if (callback != null) {
                callback.accept(hasData);
            }
        }).subscribe();
    }

    /**
     * Syncs teh current stream title/game via the Get Channel Information endpoint
     *
     * @param shouldSendEvent {@code true} to send {@link TwitchTitleChangeEvent} and/or {@link TwitchGameChangeEvent}, if appropriate
     * @param callback A callback to execute on success. The parameter is {@code true} if the channel information was successfully retrieved
     */
    public void syncStreamInfoFromChannel(boolean shouldSendEvent, Consumer<Boolean> callback) {
        Helix.instance().getChannelInformationAsync(ViewerCache.instance().broadcaster().id()).doOnSuccess(channels -> {
            boolean hasData = false;
            if (channels != null && channels.has("data")) {
                if (channels.getJSONArray("data").length() > 0) {
                    hasData = true;
                    JSONObject channel = channels.getJSONArray("data").getJSONObject(0);

                    this.setStreamStatus(channel.optString("title", ""), shouldSendEvent);
                    this.setGameTitle(channel.optString("game_name", ""), shouldSendEvent);
                }
            }

            if (callback != null) {
                callback.accept(hasData);
            }
        }).subscribe();
    }

    /**
     * Updates the viewer count
     *
     * @param viewers The new viewer count
     */
    public void updateViewerCount(int viewers) {
        this.viewerCount = viewers;
    }

    /**
     * Updates the current game from the API
     */
    public void updateGame() {
        this.updateGame(false);
    }

    /**
     * Updates the current game
     *
     * @param sendEvent {@code true} to send {@link TwitchGameChangeEvent}, if appropriate
     */
    public void updateGame(boolean sendEvent) {
        Helix.instance().getChannelInformationAsync(ViewerCache.instance().broadcaster().id()).doOnSuccess(jso -> {
            if (jso != null && !jso.has("error") && jso.has("data") && !jso.isNull("data")) {
                JSONArray data = jso.getJSONArray("data");

                if (data.length() > 0) {
                    this.setGameTitle(data.getJSONObject(0).optString("game_name"), sendEvent);
                }
            }
        }).doOnError(ex -> com.gmt2001.Console.err.printStackTrace(ex)).subscribe();
    }

    public void kill() {
        if (this.streamUpdate != null) {
            this.streamUpdate.cancel(true);
        }
        if (this.clipUpdate != null) {
            this.clipUpdate.cancel(true);
        }
    }
}
