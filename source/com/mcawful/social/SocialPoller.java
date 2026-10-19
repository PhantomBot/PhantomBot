/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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
package com.mcawful.social;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import com.gmt2001.datastore.DataStore;
import com.gmt2001.util.concurrent.ExecutorService;

import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.social.SocialActivityEvent;
import tv.phantombot.event.social.SocialRepostersEvent;

/**
 * Polls every {@link SocialPlatform} for new activity and fires the social events
 * <p>
 * A poll type is polled when chat, Discord or repost rewards want it. Uses these keys in the platform's table:
 * <ul>
 * <li>{@code poll_<type>}: announce new items of the type in chat ({@code true}/{@code false})</li>
 * <li>{@code polldelay_<type>}: seconds between polls, never less than {@link SocialPollType#minDelaySeconds()}</li>
 * <li>{@code reward_toggle}: also poll the types that feed repost rewards</li>
 * <li>{@code lastpoll_<type>}: when the type was last polled, in epoch seconds</li>
 * <li>{@code watermark_<type>}: where the next poll starts</li>
 * <li>{@code watermarkaccount_<type>}: the account the watermark belongs to</li>
 * <li>{@code last_<type>}: the newest announced item, as JSON</li>
 * </ul>
 * and these in {@code discordSettings}, for platform {@code bluesky} and poll type {@code mentions}:
 * <ul>
 * <li>{@code blueskyToggle}: Discord announcements are on</li>
 * <li>{@code blueskyAnnounceMentions}: announce new items of the type in Discord</li>
 * </ul>
 * The first poll of a type only records a watermark, so turning a poll on never announces old activity. The same happens
 * when the linked account has changed, and when the type has not been polled for {@link #STALE_POLLS} delays (at least
 * {@link #STALE_SECONDS}), so activity from while it was off is not announced or rewarded.
 *
 * @author mcawful
 */
public final class SocialPoller {

    /**
     * The most items of one type announced per poll
     */
    private static final int MAX_ANNOUNCE_PER_POLL = 3;
    private static final Duration ERROR_LOG_INTERVAL = Duration.ofMinutes(10);
    private static final int STALE_POLLS = 10;
    private static final long STALE_SECONDS = 3600;
    private static SocialPoller instance;
    private final ScheduledFuture<?> future;
    private final Map<String, Instant> lastErrorLog = new ConcurrentHashMap<>();

    /**
     * Returns the instance, starting the poller on first use
     *
     * @return the instance
     */
    public static synchronized SocialPoller instance() {
        if (instance == null) {
            instance = new SocialPoller();
        }

        return instance;
    }

    private SocialPoller() {
        this.future = ExecutorService.scheduleAtFixedRate(this::run, 20, 15, TimeUnit.SECONDS);
    }

    private void run() {
        if (PhantomBot.isInExitState()) {
            return;
        }

        for (SocialPlatform platform : SocialPlatformRegistry.instance().getPlatforms()) {
            if (!platform.isConfigured()) {
                continue;
            }

            for (SocialPollType type : platform.getPollTypes()) {
                try {
                    this.poll(platform, type);
                } catch (Exception ex) {
                    this.logError(platform, type, ex);
                }
            }
        }
    }

    private boolean isModuleEnabled(String script) {
        return PhantomBot.instance().getDataStore().GetBoolean("modules", "", script);
    }

    private void poll(SocialPlatform platform, SocialPollType type) throws Exception {
        DataStore datastore = PhantomBot.instance().getDataStore();
        String table = platform.getId();
        String discordKey = platform.getId() + "Announce" + type.id().substring(0, 1).toUpperCase() + type.id().substring(1);
        boolean chat = this.isModuleEnabled(platform.getModuleScript()) && datastore.GetBoolean(table, "", "poll_" + type.id());
        boolean discord = this.isModuleEnabled(platform.getDiscordModuleScript()) && datastore.GetBoolean("discordSettings", "", platform.getId() + "Toggle")
                && datastore.GetBoolean("discordSettings", "", discordKey);
        boolean announce = chat || discord;
        boolean reward = type.feedsRewards() && this.isModuleEnabled(platform.getModuleScript()) && datastore.GetBoolean(table, "", "reward_toggle");

        if (!announce && !reward) {
            return;
        }

        long now = Instant.now().getEpochSecond();
        long delay = Math.max(type.minDelaySeconds(), datastore.GetLong(table, "", "polldelay_" + type.id(), type.defaultDelaySeconds()));

        long lastPoll = datastore.GetLong(table, "", "lastpoll_" + type.id(), 0L);

        if (now - lastPoll < delay) {
            return;
        }

        datastore.SetLong(table, "", "lastpoll_" + type.id(), now);

        String watermark = datastore.GetString(table, "", "watermark_" + type.id());
        SocialFetchResult result = platform.fetch(type, watermark);
        List<SocialItem> items = result.items();
        // Read after the fetch, which signs in, so it is the handle of the session
        String account = platform.getAccountName().toLowerCase();
        boolean primeOnly = watermark == null || now - lastPoll > Math.max(STALE_SECONDS, delay * STALE_POLLS)
                || !account.equals(datastore.GetString(table, "", "watermarkaccount_" + type.id(), ""));

        if (!primeOnly && !items.isEmpty()) {
            if (announce) {
                int count = Math.min(items.size(), MAX_ANNOUNCE_PER_POLL);

                if (items.size() > count) {
                    com.gmt2001.Console.debug.println("Skipping " + (items.size() - count) + " " + type.id() + " from " + platform.getId());
                }

                // Posted one at a time on this thread, so chat gets them oldest first
                for (int i = count - 1; i >= 0; i--) {
                    EventBus.instance().post(new SocialActivityEvent(platform.getId(), type.id(), items.get(i)));
                }

                datastore.SetString(table, "", "last_" + type.id(), items.get(0).toJSON());
            }

            if (reward) {
                Map<String, String> reposters = new LinkedHashMap<>();
                items.forEach(item -> reposters.putIfAbsent(item.authorId(), item.authorName()));
                EventBus.instance().postAsync(new SocialRepostersEvent(platform.getId(),
                        reposters.keySet().toArray(String[]::new), reposters.values().toArray(String[]::new)));
            }
        }

        if (result.watermark() != null) {
            datastore.SetString(table, "", "watermark_" + type.id(), result.watermark());
            datastore.SetString(table, "", "watermarkaccount_" + type.id(), account);
        }
    }

    /**
     * Logs a failed poll, at most once every {@link #ERROR_LOG_INTERVAL} per platform and type; more often to the debug log
     */
    private void logError(SocialPlatform platform, SocialPollType type, Exception ex) {
        String key = platform.getId() + "." + type.id();
        Instant last = this.lastErrorLog.get(key);
        String message = "Failed to poll " + platform.getDisplayName() + " " + type.id() + ": " + ex.getMessage();

        if (last == null || last.plus(ERROR_LOG_INTERVAL).isBefore(Instant.now())) {
            this.lastErrorLog.put(key, Instant.now());
            com.gmt2001.Console.err.println(message);
        } else {
            com.gmt2001.Console.debug.println(message);
        }
    }

    /**
     * Stops polling
     */
    public void kill() {
        if (this.future != null) {
            this.future.cancel(false);
        }
    }
}
