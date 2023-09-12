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
package tv.phantombot.cache;

import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Future;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import org.json.JSONArray;
import org.json.JSONObject;

import com.gmt2001.datastore.DataStore;
import com.gmt2001.twitch.cache.ViewerCache;
import com.gmt2001.twitch.eventsub.EventSub;
import com.gmt2001.util.concurrent.ExecutorService;

import reactor.core.publisher.Mono;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.twitch.follower.TwitchFollowEvent;
import tv.phantombot.event.twitch.follower.TwitchFollowsInitializedEvent;
import tv.phantombot.twitch.api.Helix;

/**
 * Periodically checks the API for new followers
 *
 * @author gmt2001
 */
public final class FollowersCache {

    private static final FollowersCache INSTANCE = new FollowersCache();
    private boolean firstUpdate = true;
    private ScheduledFuture<?> update;
    private Future<?> fullUpdate;
    private ScheduledFuture<?> fullUpdateTimeout = null;
    private int total = 0;
    private boolean killed = false;
    private Map<String, Instant> recent = new ConcurrentHashMap<>();
    private static final long RECENT_TIME_M = 15;

    public static FollowersCache instance() {
        return INSTANCE;
    }

    private FollowersCache() {
        this.update = ExecutorService.scheduleAtFixedRate(() -> {
            Thread.currentThread().setName("FollowersCache::updateCache");
            com.gmt2001.Console.debug.println("FollowersCache::updateCache");
            try {
                this.updateCache(false, null, 0);
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
            Instant now = Instant.now();
            recent.entrySet().forEach(kv -> {
                if (kv.getValue().isBefore(now)) {
                    recent.remove(kv.getKey());
                }
            });
        }, 30, 30, TimeUnit.SECONDS);
        this.fullUpdate = ExecutorService.submit(() -> {
            Thread.currentThread().setName("FollowersCache::fullUpdateCache");
            com.gmt2001.Console.debug.println("FollowersCache::fullUpdateCache");
            try {
                this.updateCache(true, null, 0);
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        });
    }

    /**
     * @botproperty pullallfollowers - If `true`, pull all followers into the cache on startup; otherwise, only the first 50k. Default `false`
     * @botpropertycatsort pullallfollowers 300 20 Twitch
     */
    private void updateCache(boolean full, String after, int iteration) {
        if (after != null && Helix.instance().remainingRateLimit() < (Helix.instance().maxRateLimit() / 2)) {
            Mono.delay(Duration.ofSeconds(5)).doFinally((sig) -> this.updateCache(full, after, iteration)).subscribe();
            return;
        }

        Helix.instance().getChannelFollowersAsync(null, 100, after).doOnSuccess(jso -> {
            if (!jso.has("status")) {
                this.total = jso.optInt("total");
                JSONArray jsa = jso.getJSONArray("data");
                boolean foundFollow = false;
                DataStore datastore = PhantomBot.instance().getDataStore();
                for (int i = 0; i < jsa.length(); i++) {
                    String loginName = jsa.getJSONObject(i).optString("user_login");
                    String followedAt = jsa.getJSONObject(i).optString("followed_at");
                    if (full && datastore.exists("followed", loginName)
                        && datastore.exists("followedDate", loginName)
                        && datastore.get("followedDate", loginName).equals(followedAt)) {
                        foundFollow = true;
                    }
                    this.addFollow(loginName, followedAt, full);
                }

                if (full && jso.has("pagination") && !jso.isNull("pagination")) {
                    String cursor = jso.getJSONObject("pagination").optString("cursor");

                    int target = CaselessProperties.instance().getPropertyAsBoolean("pullallfollowers", false) ? 2 : 1;

                    if (!killed){
                        if (cursor != null && !cursor.isBlank() && (target > 1 || iteration < 500) &&
                            (!foundFollow || datastore.GetInteger("settings", "", "FollowersCache.fullUpdateCache") < target)) {
                            if (iteration == 500) {
                                datastore.SetInteger("settings", "", "FollowersCache.fullUpdateCache", 1);
                            }
                            if (iteration > 0 && iteration % 100 == 0) {
                                this.fullUpdateTimeout = ExecutorService.schedule(() -> {
                                    this.updateCache(full, cursor, iteration + 1);
                                }, 5, TimeUnit.SECONDS);
                            } else {
                                this.updateCache(full, cursor, iteration + 1);
                            }
                        } else {
                            datastore.SetInteger("settings", "", "FollowersCache.fullUpdateCache", target);
                        }
                    }
                }

                if (!full && firstUpdate) {
                    firstUpdate = false;
                    EventBus.instance().postAsync(new TwitchFollowsInitializedEvent());
                }
            }
        }).subscribe();
    }

    /**
     * Adds a follow to the cache, and sends notifications if necessary
     * @param loginName The login name of the follower
     * @param followedAt The ISO8601 timestamp when the follow ocurred
     */
    public void addFollow(String loginName, ZonedDateTime followedAt) {
        this.addFollow(loginName, followedAt, false);
    }

    /**
     * Adds a follow to the cache, and sends notifications if necessary
     * @param loginName The login name of the follower
     * @param followedAt The ISO8601 timestamp when the follow ocurred
     * @param silent If {@code true}, don't announce the follow
     */
    public void addFollow(String loginName, ZonedDateTime followedAt, boolean silent) {
        this.addFollow(loginName, followedAt.format(DateTimeFormatter.ISO_INSTANT), silent);
    }

    /**
     * Adds a follow to the cache, and sends notifications if necessary
     * @param loginName The login name of the follower
     * @param followedAt The ISO8601 timestamp when the follow ocurred
     */
    public void addFollow(String loginName, String followedAt) {
        this.addFollow(loginName, followedAt, false);
    }

    /**
     * Adds a follow to the cache, and sends notifications if necessary
     * @param loginName The login name of the follower
     * @param followedAt The ISO8601 timestamp when the follow ocurred
     * @param silent If {@code true}, don't announce the follow
     */
    public void addFollow(String loginName, String followedAt, boolean silent) {
        DataStore datastore = PhantomBot.instance().getDataStore();
        loginName = loginName.toLowerCase();
        if (!datastore.exists("followed", loginName)) {
            datastore.set("followed", loginName, "true");
            if (!silent && !this.recent.containsKey(loginName)) {
                this.recent.put(loginName, Instant.now().plus(RECENT_TIME_M, ChronoUnit.MINUTES));
                EventBus.instance().postAsync(new TwitchFollowEvent(loginName, followedAt));
            }
        }
        if (!datastore.exists("followedDate", loginName)) {
            datastore.set("followedDate", loginName, followedAt);
        }
    }

    /**
     * Returns the total number of followers, according to Twitch API
     *
     * @return
     */
    public int total() {
        return this.total;
    }

    /**
     * Indicates if the specified user currently follows the channel
     *
     * @param loginName The login name of the user
     * @return
     */
    public boolean follows(String loginName) {
        JSONObject jso = Helix.instance().getChannelFollowers(ViewerCache.instance().getByLogin(loginName).id(), 1, null);
        if (!jso.has("status")) {
            JSONArray jsa = jso.getJSONArray("data");
            if (jsa.length() > 0) {
                this.addFollow(jsa.getJSONObject(0).optString("user_login"), jsa.getJSONObject(0).optString("followed_at"));
                return true;
            }
        }

        return false;
    }

    /**
     * Indicates if the specified user has followed at some point in the past, within the limits of the bots records
     *
     * @param loginName The login name of the user
     * @return
     */
    public boolean followed(String loginName) {
        return PhantomBot.instance().getDataStore().exists("followed", loginName);
    }

    /**
     * Indicates the earliest timestamp when the bot is aware of the specified user following as a string
     *
     * @param loginName The login name of the user
     * @return
     */
    public String followedDateString(String loginName) {
        return PhantomBot.instance().getDataStore().get("followedDate", loginName);
    }

    /**
     * Indicates the earliest timestamp when the bot is aware of the specified user following
     *
     * @param loginName The login name of the user
     * @return
     */
    public ZonedDateTime followedDate(String loginName) {
        return EventSub.parseDate(this.followedDateString(loginName));
    }

    public void kill() {
        this.killed = true;
        this.update.cancel(false);
        this.fullUpdate.cancel(false);
        if (this.fullUpdateTimeout != null) {
            this.fullUpdateTimeout.cancel(false);
        }
    }
}
