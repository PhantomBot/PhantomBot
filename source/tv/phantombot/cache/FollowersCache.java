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

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import org.json.JSONArray;

import com.gmt2001.ExecutorService;
import com.gmt2001.datastore.DataStore;

import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.twitch.follower.TwitchFollowEvent;
import tv.phantombot.event.twitch.follower.TwitchFollowsInitializedEvent;
import tv.phantombot.twitch.api.Helix;

public final class FollowersCache {

    private static final FollowersCache INSTANCE = new FollowersCache();
    private boolean firstUpdate = true;
    private ScheduledFuture<?> update;

    public static FollowersCache instance() {
        return INSTANCE;
    }

    private FollowersCache() {
        this.update = ExecutorService.scheduleAtFixedRate(() -> {
            Thread.currentThread().setName("FollowersCache::updateCache");
            com.gmt2001.Console.debug.println("FollowersCache::updateCache");
            try {
                this.updateCache();
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }, 0, 30, TimeUnit.SECONDS);
    }

    private void updateCache() {
        Helix.instance().getChannelFollowersAsync(null, 100, null).doOnSuccess(jso -> {
            if (!jso.has("status")) {
                JSONArray jsa = jso.getJSONArray("data");
                for (int i = 0; i < jsa.length(); i++) {
                    this.addFollow(jsa.getJSONObject(i).optString("user_login"), jsa.getJSONObject(i).optString("followed_at"));
                }

                if (firstUpdate) {
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

    public void kill() {
        this.update.cancel(true);
    }
}
