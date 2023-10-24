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
package tv.phantombot.cache;


import com.gmt2001.twitch.cache.ViewerCache;
import org.apache.commons.lang3.Validate;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.emotes.EmotesGetEvent;
import tv.phantombot.twitch.emotes.BttvApiV3;
import tv.phantombot.twitch.emotes.EmoteApiRequestFailedException;
import tv.phantombot.twitch.emotes.EmoteEntry;
import tv.phantombot.twitch.emotes.EmoteProvider;
import tv.phantombot.twitch.emotes.FrankerFacezApiV1;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

public class EmotesCache implements Runnable {

    private static final long LOOP_SLEEP_EMOTES = 60L * 60L * 1000L;
    private static final Map<String, EmotesCache> instances = new ConcurrentHashMap<>();

    public static EmotesCache instance(String channel) {
        EmotesCache instance = instances.get(channel);
        if (instance == null) {
            instance = new EmotesCache(channel);
            instances.put(channel, instance);
            return instance;
        }
        return instance;
    }

    private final List<EmoteProvider> emoteProviders;
    private final String channel;
    private final Thread updateThread;
    private Instant timeoutExpire = Instant.now();
    private Instant lastFail = Instant.now();
    private int numfail = 0;
    private boolean killed = false;

    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private EmotesCache(String channel) {
        if (channel.startsWith("#")) {
            channel = channel.substring(1);
        }

        this.emoteProviders = List.of(
                BttvApiV3.instance(),
                FrankerFacezApiV1.instance()
        );

        this.channel = channel;
        this.updateThread = new Thread(this, "tv.phantombot.cache.EmotesCache");

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        updateThread.start();
    }

    private void checkLastFail() {
        this.numfail = (lastFail.isAfter(Instant.now()) ? this.numfail + 1 : 1);

        lastFail = Instant.now().plus(1, ChronoUnit.MINUTES);

        if (numfail > 5) {
            timeoutExpire = Instant.now().plus(1, ChronoUnit.MINUTES);
        }
    }

    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
        while (!killed) {
            try {
                if (Instant.now().isAfter(timeoutExpire)) {
                    this.updateCache();
                }
            } catch (Exception ex) {
                checkLastFail();
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            try {
                Thread.sleep(LOOP_SLEEP_EMOTES);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("EmotesCache.run: Failed to execute initial sleep: [InterruptedException] " + ex.getMessage());
            }
        }
    }


    private void updateCache() {
        // We know, the broadcaster identity is potentially needed by the emoteProviders, so we do a check here
        // once, so it's not necessary to implement more logic as needed in the providers
        if (ViewerCache.instance().broadcaster() == null) {
            com.gmt2001.Console.warn.println("Broadcaster is not in Viewer Cache. Skipping emote cache update");
            return;
        }
        List<EmotesSet> providerEmotes = this.emoteProviders.stream()
                .map(this::getProviderEmotes)
                .collect(Collectors.toList());

        com.gmt2001.Console.debug.println("Pushing EmotesGetEvent to EventBus");
        EventBus.instance().postAsync(new EmotesGetEvent(providerEmotes));
    }

    protected EmotesSet getProviderEmotes(EmoteProvider provider){
        List<EmoteEntry> localEmotes = null;
        List<EmoteEntry> sharedEmotes = null;
        List<EmoteEntry> globalEmotes = null;

        com.gmt2001.Console.debug.println("Getting local emotes of " + provider.getProviderName());
        try {
            localEmotes = provider.getLocalEmotes();
        } catch (EmoteApiRequestFailedException e) {
            com.gmt2001.Console.err.println("Failed to get local emotes of " + provider.getProviderName() + ":" + e);
        }

        com.gmt2001.Console.debug.println("Getting shared emotes of " + provider.getProviderName());
        try {
            sharedEmotes = provider.getSharedEmotes();
        } catch (EmoteApiRequestFailedException e) {
            com.gmt2001.Console.err.println("Failed to get shared emotes of " + provider.getProviderName() + ":" + e);
        }

        com.gmt2001.Console.debug.println("Getting global emotes of " + provider.getProviderName());
        try {
            globalEmotes = provider.getGlobalEmotes();
        } catch (EmoteApiRequestFailedException e) {
            com.gmt2001.Console.err.println("Failed to get global emotes of " + provider.getProviderName() + ":" + e);
        }
        return new EmotesSet(provider.getProviderName(), localEmotes, sharedEmotes, globalEmotes);
    }

    public void kill() {
        killed = true;
    }

    public static void killall() {
        instances.entrySet().forEach((instance) -> {
            instance.getValue().kill();
        });
    }

    /**
     * Contains emotes for the different categories local, shared and global from an
     * emote provider. Collections can be null if not supplied or supported by the provider
     */
    public static class EmotesSet {
        public final String provider;
        private final List<EmoteEntry> localEmotes;
        private final List<EmoteEntry> sharedEmotes;
        private final List<EmoteEntry> globalEmotes;

        public EmotesSet(String provider, List<EmoteEntry> localEmotes, List<EmoteEntry> sharedEmotes, List<EmoteEntry> globalEmotes) {
            Validate.notEmpty(provider, "provider can't be null");
            this.provider = provider;
            this.localEmotes = localEmotes;
            this.sharedEmotes = sharedEmotes;
            this.globalEmotes = globalEmotes;
        }

        public String getProvider() {
            return this.provider;
        }

        public List<EmoteEntry> getLocalEmotes() {
            return this.localEmotes;
        }

        public List<EmoteEntry> getSharedEmotes() {
            return this.sharedEmotes;
        }

        public List<EmoteEntry> getGlobalEmotes() {
            return this.globalEmotes;
        }

        public String toString() {
            return "EmotesCache.EmotesSet(provider=" + this.getProvider() + ", localEmotes=" + this.getLocalEmotes() + ", sharedEmotes=" + this.getSharedEmotes() + ", globalEmotes=" + this.getGlobalEmotes() + ")";
        }
    }
}
