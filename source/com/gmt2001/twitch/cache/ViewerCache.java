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
package com.gmt2001.twitch.cache;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.TimeUnit;

import org.json.JSONArray;
import org.json.JSONObject;

import com.gmt2001.ExecutorService;

import reactor.core.publisher.Mono;
import tv.phantombot.CaselessProperties;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.Listener;
import tv.phantombot.twitch.api.Helix;
import tv.phantombot.twitch.api.TwitchValidate;

/**
 * Maintains a list of viewers, Twitch viewer permissions, and username lookups
 *
 * @author gmt2001
 */
public final class ViewerCache implements Listener {
    private static final ViewerCache INSTANCE = new ViewerCache();
    private boolean registered = false;
    private final ConcurrentMap<String, Viewer> viewers = new ConcurrentHashMap<>();
    private Viewer bot;
    private Viewer broadcaster;

    /**
     * Singleton method
     *
     * @return The singleton instance of ViewerCache
     */
    public static ViewerCache instance() {
        if (!INSTANCE.registered) {
            INSTANCE.register();
        }

        return INSTANCE;
    }

    /**
     * Constructor
     */
    private ViewerCache() {
        ExecutorService.scheduleAtFixedRate(this::doGC, 15, 15, TimeUnit.MINUTES);
        this.lookupAsync(null, List.of(TwitchValidate.instance().getChatLogin().toLowerCase(),
            CaselessProperties.instance().getProperty("channel").toLowerCase())).doOnSuccess(viewers -> {
            for (Viewer viewer: viewers) {
                this.add(viewer);

                if (viewer.bot()) {
                    this.bot = viewer;
                }

                if (viewer.broadcaster()) {
                    this.broadcaster = viewer;
                }
            }
        }).doOnError(ex -> {
            com.gmt2001.Console.err.printStackTrace(ex, "Exception parsing ctor getUsersAsync");
        }).subscribe();
    }

    /**
     * EventBus registration
     */
    private synchronized void register() {
        if (!this.registered) {
            EventBus.instance().register(this);
            this.registered = true;
        }
    }

    /**
     * Garbage Collects viewers that ahve not been seen in a while
     */
    private void doGC() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        Thread.currentThread().setName("ViewerCache::GC");
        final Instant expiresBefore = Instant.now().minus(15, ChronoUnit.MINUTES);
        this.viewers.forEach((k, v) -> {
            if (v.lastSeen().isBefore(expiresBefore) && !v.bot() && !v.broadcaster()) {
                this.viewers.remove(k);
            }
        });
    }

    /**
     * Performs a Twitch API lookup of the users
     *
     * @param id Some user ids to lookup
     * @param login Some user logins name to lookup
     * @return A {@link Viewer} object; {@code null} if not found
     */
    private Mono<List<Viewer>> lookupAsync(List<String> id, List<String> login) {
        return Helix.instance().getUsersAsync(id, login)
            .map(jso -> {
                List<Viewer> viewers = new ArrayList<>();
                if (jso != null && !jso.has("error") && jso.has("data") && !jso.isNull("data")) {
                    final JSONArray data = jso.getJSONArray("data");

                    if (data.length() > 0) {
                    for (int i = 0; i < data.length(); i++) {
                        JSONObject user = data.getJSONObject(i);

                        Viewer viewer = new Viewer(user.getString("id")).login(user.getString("login"))
                            .name(user.isNull("display_name") ? null : user.optString("display_name").replaceAll("\\\\s", " "))
                            .admin(user.getString("type").equals("admin")).staff(user.getString("type").equals("staff"))
                            .bot(user.getString("login").equals(TwitchValidate.instance().getChatLogin().toLowerCase()))
                            .broadcaster(user.getString("login").equals(CaselessProperties.instance().getProperty("channel").toLowerCase()));

                        viewers.add(viewer);
                    }
                }

                return viewers;
            }

            return null;
        }).doOnError(ex -> {
            com.gmt2001.Console.err.printStackTrace(ex, "Exception parsing getUsersAsync");
        });
    }

    /**
     * Performs a Twitch API lookup of the user
     * <br /><br />
     * Can only use one of id or login
     *
     * @param id A user id to lookup
     * @param login A user login name to lookup
     * @return A {@link Viewer} object; {@code null} if not found
     */
    private Viewer lookup(String id, String login) {
        List<Viewer> viewers = this.lookupAsync(id == null ? null : List.of(id), login == null ? null : List.of(login)).block();

        if (viewers.isEmpty()) {
            return null;
        }

        return viewers.get(0);
    }

    /**
     * Performs an asynchronous operation to lookup the users on Twitch API and add them to the cache
     *
     * @param id A list of user ids to lookup
     */
    public void lookupAsync(List<String> id) {
        this.lookupAsync(id, null).doOnSuccess(viewers -> {
            for (Viewer viewer: viewers) {
                this.add(viewer);
            }
        }).doOnError(ex -> {
            com.gmt2001.Console.err.printStackTrace(ex, "Exception parsing lookupAsync");
        }).subscribe();
    }

    /**
     * Performs an asynchronous operation to lookup the users on Twitch API and add them to the cache
     *
     * @param login A list of user logins to lookup
     */
    public void lookupLoginAsync(List<String> login) {
        this.lookupAsync(null, login).doOnSuccess(viewers -> {
            for (Viewer viewer: viewers) {
                this.add(viewer);
            }
        }).doOnError(ex -> {
            com.gmt2001.Console.err.printStackTrace(ex, "Exception parsing lookupLoginAsync");
        }).subscribe();
    }

    /**
     * Adds a viewer to the cache
     * <br /><br />
     * If a viewer with the same user id exists, then the new object is discarded and the {@link Viewer#seen()} method is called instead
     *
     * @param viewer The viewer object to add
     * @return {@code true} if the new object was added; {@code false} if the viewer already exists
     * @exception NullPointerException if the new object was {@code null}
     */
    public boolean add(Viewer viewer) {
        if (viewer == null) {
            throw new NullPointerException();
        }

        Viewer cacheViewer = this.viewers.putIfAbsent(viewer.id(), viewer);

        if (cacheViewer != null) {
            cacheViewer.seen();
            return false;
        }

        return true;
    }

    /**
     * Returns the {@link Viewer} object for the specified user id
     * <br /><br />
     * If the object does not yet exist, a lookup is performed on Twitch API
     *
     * @param id The user id to lookup
     * @return The {@link Viewer} object for the user; {@code null} if not found
     */
    public Viewer get(String id) {
        return this.viewers.computeIfAbsent(id, k -> {
            return this.lookup(id, null);
        });
    }

    /**
     * Returns the {@link Viewer} object for the specified user display name
     *
     * @param name The user display name to lookup
     * @return An {@link Optional} containing the {@link Viewer} object for the user; an empty Optional if not in the cache
     */
    private Optional<Viewer> getByNameInternal(String name) {
        return this.viewers.entrySet().stream().filter(kv -> kv.getValue().name().equalsIgnoreCase(name)).map(kv -> kv.getValue()).findFirst();
    }

    /**
     * Returns the {@link Viewer} object for the specified user login
     *
     * @param login The user login to lookup
     * @return An {@link Optional} containing the {@link Viewer} object for the user; an empty Optional if not in the cache
     */
    private Optional<Viewer> getByLoginInternal(String login) {
        return this.viewers.entrySet().stream().filter(kv -> kv.getValue().login().equals(login)).map(kv -> kv.getValue()).findFirst();
    }

    /**
     * Returns the {@link Viewer} object for the specified user display name
     * <br /><br />
     * If the object does not yet exist, a lookup is NOT performed
     *
     * @param name The user display name to lookup
     * @return The {@link Viewer} object for the user; {@code null} if not found in the cache
     */
    public Viewer getByName(String name) {
        Optional<Viewer> viewer = this.getByNameInternal(name);

        return viewer.isPresent() ? viewer.get() : null;
    }

    /**
     * Returns the {@link Viewer} object for the specified user login
     * <br /><br />
     * If the object does not yet exist, a lookup is performed on Twitch API
     *
     * @param login The user login to lookup
     * @return The {@link Viewer} object for the user; {@code null} if not found
     */
    public Viewer getByLogin(String login) {
        Optional<Viewer> viewer = this.getByLoginInternal(login);

        if (!viewer.isPresent()) {
            viewer = Optional.ofNullable(this.lookup(null, login));

            if (viewer.isPresent()) {
                this.add(viewer.get());
            }
        }

        return viewer.isPresent() ? viewer.get() : null;
    }

    /**
     * Indicates if the specified user id is already in the cache
     *
     * @param id The user id to lookup
     * @return {@code true} if this user id is already in the cache
     */
    public boolean exists(String id) {
        return this.viewers.containsKey(id);
    }

    /**
     * Indicates if the specified user display name is already in the cache
     *
     * @param name The user display name to lookup
     * @return {@code true} if this user display name is already in the cache
     */
    public boolean nameExists(String name) {
        return this.getByNameInternal(name).isPresent();
    }

    /**
     * Indicates if the specified user login is already in the cache
     *
     * @param login The user login to lookup
     * @return {@code true} if this user login is already in the cache
     */
    public boolean loginExists(String login) {
        return this.getByLoginInternal(login).isPresent();
    }

    /**
     * Returns the {@link Viewer} object representing the bot account
     *
     * @return The {@link Viewer} object representing the bot account
     */
    public Viewer bot() {
        return this.bot;
    }

    /**
     * Returns the {@link Viewer} object representing the broadcaster account
     *
     * @return The {@link Viewer} object representing the broadcaster account
     */
    public Viewer broadcaster() {
        return this.broadcaster;
    }

    /**
     * Contains information about a specific viewer
     *
     * @author gmt2001
     */
    public final class Viewer {
        private final String id;
        private String login = "";
        private String name = "";
        private Instant lastSeen = Instant.now();
        private SubscriptionTier subscriptionTier = SubscriptionTier.NotSubscribed;
        private boolean admin = false;
        private boolean botAdmin = false;
        private boolean bot = false;
        private boolean broadcaster = false;
        private boolean inChat = false;
        private boolean moderator = false;
        private boolean staff = false;
        private boolean turbo = false;
        private boolean vip = false;

        /**
         * A subscription tier
         *
         * @author gmt2001
         */
        public enum SubscriptionTier {
            /**
             * Not Subscribed
             */
            NotSubscribed(0, "", "Not Subscribed"),
            /**
             * Tier 1
             */
            Tier1(1000, "1000", "Tier 1"),
            /**
             * Tier 2
             */
            Tier2(2000, "2000", "Tier 2"),
            /**
             * Tier 3
             */
            Tier3(3000, "3000", "Tier 3"),
            /**
             * Prime
             */
            Prime(1001, "prime", "Prime");

            private final int level;
            private final String tierId;
            private final String tier;

            /**
             * Constructor
             *
             * @param level The numeric subscription tier level
             * @param tierId The Twitch id for this tier
             * @param tier The user-friendly name of the subscription tier
             */
            SubscriptionTier(int level, String tierId, String tier) {
                this.level = level;
                this.tierId = tierId;
                this.tier = tier;
            }

            /**
             * The numeric subscription tier level
             *
             * @return The tier level
             */
            public int level() {
                return this.level;
            }

            /**
             * The Twitch id of the subscription tier
             *
             * @return The Twitch id of the subscription tier
             */
            public String tierId() {
                return this.tierId;
            }

            /**
             * The user-friendly name of the subscription tier
             *
             * @return The tier name
             */
            public String tier() {
                return this.tier;
            }

            /**
             * Determines if two instances of SubscriptionTier are equivilent
             *
             * @param other The other instance to test against
             * @return {@code true} if both instances have the same value for {@link #level()}
             */
            public boolean equals(SubscriptionTier other) {
                return this.level() == other.level();
            }

            /**
             * Returns a SubscriptionTier, given a tier id
             *
             * @param tierId The tier id
             * @return The matching subscription tier, if found; {@link #NotSubscribed} otherwise
             */
            public static SubscriptionTier of(String tierId) {
                for (SubscriptionTier tier : SubscriptionTier.values()) {
                    if (tier.tierId.equalsIgnoreCase(tierId)) {
                        return tier;
                    }
                }

                return SubscriptionTier.NotSubscribed;
            }
        }

        /**
         * Constructor
         *
         * @param id The Twitch user id
         */
        Viewer(String id) {
            this.id = id;
        }

        /**
         * The Twitch user id
         *
         * @return The Twitch user id
         */
        public String id() {
            return this.id;
        }

        /**
         * Updates the Twitch user login name
         *
         * @param login The Twitch user login name
         * @return {@code this}
         */
        public synchronized Viewer login(String login) {
            if (login != null && !login.isBlank()) {
                this.login = login;
            }

            return this;
        }

        /**
         * The Twitch user login name
         *
         * @return The Twitch user login name; Empty string {@code ""} if the login name has not been looked up yet
         */
        public String login() {
            return this.login;
        }

        /**
         * Updates the Twitch user display name
         *
         * @param name The Twitch user display name
         * @return {@code this}
         */
        public synchronized Viewer name(String name) {
            if (name != null && !name.isBlank()) {
                this.name = name;
            }

            return this;
        }

        /**
         * The Twitch user display name
         *
         * @return The Twitch user display name; Empty string {@code ""} if the display name has not been looked up yet
         */
        public String name() {
            return this.name;
        }

        /**
         * Updates the last time this user was seen
         * <br /><br />
         * This is used for garbage collection
         *
         * @return {@code this}
         */
        public synchronized Viewer seen() {
            this.lastSeen = Instant.now();

            return this;
        }

        /**
         * The last time this user was seen
         * <br /><br />
         * This is used for garbage collection
         *
         * @return The last time this user was seen
         */
        public Instant lastSeen() {
            return this.lastSeen;
        }

        /**
         * Updates the Twitch admin status of the viewer
         *
         * @param admin {@code true} if the user is a Twitch admin
         * @return {@code this}
         */
        public synchronized Viewer admin(boolean admin) {
            this.admin = admin;

            return this;
        }

        /**
         * Indicates if this user is a Twitch admin
         *
         * @return {@code true} if the user is a Twitch admin
         */
        public boolean admin() {
            return this.admin;
        }

        /**
         * Updates the Bot admin status of the viewer
         *
         * @param botAdmin {@code true} if the user is a Bot admin
         * @return {@code this}
         */
        public synchronized Viewer botAdmin(boolean botAdmin) {
            this.botAdmin = botAdmin;

            return this;
        }

        /**
         * Indicates if this user is a Bot admin
         *
         * @return {@code true} if the user is a Bot admin
         */
        public boolean botAdmin() {
            return this.botAdmin;
        }

        /**
         * Updates if this viewer is the bot
         *
         * @param bot {@code true} if the user is the bot
         * @return {@code this}
         */
        public synchronized Viewer bot(boolean bot) {
            this.bot = bot;

            return this;
        }

        /**
         * Indicates if this user is the bot
         *
         * @return {@code true} if the user is the bot
         */
        public boolean bot() {
            return this.bot;
        }

        /**
         * Updates the broadcaster status of the viewer
         *
         * @param broadcaster {@code true} if the user is the broadcaster
         * @return {@code this}
         */
        public synchronized Viewer broadcaster(boolean broadcaster) {
            this.broadcaster = broadcaster;

            return this;
        }

        /**
         * Indicates if this user is the broadcaster
         *
         * @return {@code true} if the user is the broadcaster
         */
        public boolean broadcaster() {
            return this.broadcaster;
        }

        /**
         * Updates if this viewer is in chat
         *
         * @param inChat {@code true} if the user is in chat
         * @return {@code this}
         */
        public synchronized Viewer inChat(boolean inChat) {
            this.inChat = inChat;

            return this;
        }

        /**
         * Indicates if this user is in chat
         *
         * @return {@code true} if the user is in chat
         */
        public boolean inChat() {
            return this.inChat;
        }

        /**
         * Updates the moderator status of the viewer
         *
         * @param moderator {@code true} if the user is a moderator
         * @return {@code this}
         */
        public synchronized Viewer moderator(boolean moderator) {
            this.moderator = moderator;

            return this;
        }

        /**
         * Indicates if this user is a moderator
         *
         * @return {@code true} if the user is a moderator
         */
        public boolean moderator() {
            return this.moderator;
        }

        /**
         * Updates the Twitch staff status of the viewer
         *
         * @param staff {@code true} if the user is a Twitch staff member
         * @return {@code this}
         */
        public synchronized Viewer staff(boolean staff) {
            this.staff = staff;

            return this;
        }

        /**
         * Indicates if this user is a Twitch staff member
         *
         * @return {@code true} if the user is a Twitch staff member
         */
        public boolean staff() {
            return this.staff;
        }

        /**
         * Updates the subscription tier of the viewer
         *
         * @param subscriptionTier The subscription tier of the viewer
         * @return {@code this}
         */
        public Viewer subscriber(String subscriptionTier) {
            return this.subscriber(SubscriptionTier.of(subscriptionTier));
        }

        /**
         * Updates the subscription tier of the viewer
         *
         * @param subscriptionTier The subscription tier of the viewer
         * @return {@code this}
         */
        public synchronized Viewer subscriber(SubscriptionTier subscriptionTier) {
            this.subscriptionTier = subscriptionTier;

            return this;
        }

        /**
         * The subscription tier of the viewer
         *
         * @return The subscription tier of the viewer
         */
        public SubscriptionTier subscriptionTier() {
            return this.subscriptionTier;
        }

        /**
         * Indicates if this user is a subscriber
         *
         * @return {@code true} if the user is a subscriber
         */
        public boolean subscriber() {
            return this.subscriptionTier != SubscriptionTier.NotSubscribed;
        }

        /**
         * Updates the Twitch turbo status of the viewer
         *
         * @param turbo {@code true} if the user is a Twitch turbo member
         * @return {@code this}
         */
        public synchronized Viewer turbo(boolean turbo) {
            this.turbo = turbo;

            return this;
        }

        /**
         * Indicates if this user is a Twitch turbo member
         *
         * @return {@code true} if the user is a Twitch turbo member
         */
        public boolean turbo() {
            return this.turbo;
        }

        /**
         * Updates the Twitch VIP status of the viewer
         *
         * @param vip {@code true} if the user is a VIP
         * @return {@code this}
         */
        public synchronized Viewer vip(boolean vip) {
            this.vip = vip;

            return this;
        }

        /**
         * Indicates if this user is a VIP
         *
         * @return {@code true} if the user is a VIP
         */
        public boolean vip() {
            return this.vip;
        }
    }
}
