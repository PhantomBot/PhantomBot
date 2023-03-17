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
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.Future;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import org.json.JSONArray;
import org.json.JSONObject;

import com.gmt2001.ExecutorService;
import com.gmt2001.datastore.DataStore;
import com.gmt2001.twitch.eventsub.EventSub;

import reactor.core.publisher.Mono;
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
                    if (full && datastore.exists("followed", loginName) && datastore.exists("followedDate", loginName)) {
                        foundFollow = true;
                    }
                    this.addFollow(loginName, followedAt);
                }

                if (full && jso.has("pagination") && !jso.isNull("pagination")) {
                    String cursor = jso.getJSONObject("pagination").optString("cursor");

                    if (!killed){
                        if (cursor != null && !cursor.isBlank() &&
                            (!foundFollow || !datastore.GetBoolean("settings", "", "FollowersCache.fullUpdateCache"))) {
                            if (iteration > 0 && iteration % 100 == 0) {
                                this.fullUpdateTimeout = ExecutorService.schedule(() -> {
                                    this.updateCache(full, cursor, iteration + 1);
                                }, 5, TimeUnit.SECONDS);
                            } else {
                                this.updateCache(full, cursor, iteration + 1);
                            }
                        } else {
                            datastore.SetBoolean("settings", "", "FollowersCache.fullUpdateCache", true);
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
        this.addFollow(loginName, followedAt.format(DateTimeFormatter.ISO_INSTANT));
    }

    /**
     * Adds a follow to the cache, and sends notifications if necessary
     * @param loginName The login name of the follower
     * @param followedAt The ISO8601 timestamp when the follow ocurred
     */
    public void addFollow(String loginName, String followedAt) {
        DataStore datastore = PhantomBot.instance().getDataStore();
        loginName = loginName.toLowerCase();
        if (!datastore.exists("followed", loginName)) {
            EventBus.instance().postAsync(new TwitchFollowEvent(loginName, followedAt));
            datastore.set("followed", loginName, "true");
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
        JSONObject jso = Helix.instance().getChannelFollowers(UsernameCache.instance().getID(loginName), 1, null);
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
