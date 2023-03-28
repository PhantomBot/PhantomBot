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

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.gmt2001.ExecutorService;

import net.engio.mbassy.listener.Handler;
import reactor.core.publisher.Mono;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.Listener;
import tv.phantombot.event.irc.channel.IrcChannelUsersUpdateEvent;
import tv.phantombot.event.irc.message.IrcModerationEvent;
import tv.phantombot.event.jvm.PropertiesReloadedEvent;
import tv.phantombot.event.twitch.TwitchUserLoginChangedEvent;
import tv.phantombot.twitch.api.Helix;
import tv.phantombot.twitch.api.TwitchValidate;

/**
 * Maintains a list of viewers, Twitch viewer permissions, and username lookups
 *
 * @author gmt2001
 */
public final class ViewerCache implements Listener {
    private static final ViewerCache INSTANCE = new ViewerCache();
    private static final Duration ACTIVE_TIMEOUT = Duration.ofMinutes(5);
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
        ExecutorService.scheduleAtFixedRate(this::getChatters, 0, 2, TimeUnit.MINUTES);
        this.updateBroadcasterBot().subscribe();
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
     * Performs a lookup of the broadcaster and bot accounts
     *
     * @return A {@link Mono} that can be subscribed to
     */
    private Mono<List<Viewer>> updateBroadcasterBot() {
        return this.lookupAsync(null, List.of(TwitchValidate.instance().getChatLogin().toLowerCase(),
            CaselessProperties.instance().getProperty("channel").toLowerCase())).doOnSuccess(viewers -> {
            for (Viewer viewer: viewers) {
                this.add(viewer.attributes());

                if (viewer.bot()) {
                    this.bot = viewer;
                }

                if (viewer.broadcaster()) {
                    this.broadcaster = viewer;
                }
            }
        }).doOnError(ex -> {
            com.gmt2001.Console.err.printStackTrace(ex, "Exception parsing broadcaster/bot getUsersAsync");
        });
    }

    /**
     * Updates the user mapping database and sends an event if it is a login name change
     * <br /><br />
     * The data is stored in two tables: {@code idToLogin} is keyed by user id and valued by user login.
     * {@code loginToId} is keyed by user login and valued by user id
     *
     * @param id The user id
     * @param login The user login
     */
    private void updateDatabase(String id, String login) {
        String existing = PhantomBot.instance().getDataStore().GetString("idToLogin", "", id);

        if (existing == null || !existing.equals(login)) {

            PhantomBot.instance().getDataStore().SetString("idToLogin", "", id, login);
            if (existing != null && !existing.isBlank()) {
                PhantomBot.instance().getDataStore().RemoveKey("loginToId", "", existing);
            }

            PhantomBot.instance().getDataStore().SetString("loginToId", "", login, id);

            if (existing != null && !existing.isBlank()) {
                EventBus.instance().postAsync(new TwitchUserLoginChangedEvent(id, existing, login));
            }
        }
    }

    /**
     * Garbage Collects viewers that have not been seen in a while
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
     * Updates the list of chatters from the API
     */
    private void getChatters() {
        Mono.<List<JSONObject>>create(emitter -> {
            final List<JSONObject> newChatters = new ArrayList<>();
            String cursor = null;
            do {
                try {
                    final JSONObject jso = Helix.instance().getChattersAsync(1000, cursor).block();
                    if (jso != null) {
                        if (!jso.has("error")) {
                            if (jso.has("data") && !jso.isNull("data")) {
                                final JSONArray data = jso.getJSONArray("data");

                                if (data.length() > 0) {
                                    for (int i = 0; i < data.length(); i++) {
                                        newChatters.add(data.getJSONObject(i));
                                    }
                                }
                            }

                            if (jso.has("pagination") && !jso.isNull("pagination")) {
                                final JSONObject pagination = jso.getJSONObject("pagination");
                                if (pagination.has("cursor") && !pagination.isNull("cursor")) {
                                    cursor = pagination.getString("cursor");
                                } else {
                                    cursor = null;
                                }
                            } else {
                                cursor = null;
                            }
                        } else {
                            cursor = null;
                            emitter.error(new RuntimeException(jso.toString()));
                        }
                    }
                } catch (JSONException ex) {
                    cursor = null;
                    emitter.error(ex);
                }
            } while(cursor != null && !cursor.isBlank());
            emitter.success(newChatters);
        }).doOnSuccess(newChattersList -> {
            final Instant after = Instant.now().minus(ACTIVE_TIMEOUT);
            final List<String> found = new ArrayList<>();
            this.viewers.entrySet().stream().filter(kv -> kv.getValue().inChat()).forEach(kv -> {
                if (newChattersList.stream().filter(jso -> jso.getString("user_id").equals(kv.getValue().id())).findAny().isPresent()) {
                    kv.getValue().seen();
                    found.add(kv.getValue().id());
                } else if (kv.getValue().lastActive().isBefore(after)) {
                    kv.getValue().inChat(false);
                }
            });
            newChattersList.stream().forEach(jso -> {
                String id = jso.getString("user_id");
                if (!found.contains(id)) {
                    if (this.exists(id)) {
                        this.get(id).inChat(true).seen();
                    } else {
                        this.add(new Viewer(id).login(jso.optString("user_login"))
                            .name(jso.optString("user_name")).inChat(true));
                    }
                }
            });

            EventBus.instance().postAsync(new IrcChannelUsersUpdateEvent(this.viewers.entrySet().stream().filter(kv -> kv.getValue().inChat()).map(kv -> kv.getValue().login()).collect(Collectors.toList())));
        }).doOnError(ex -> {
            com.gmt2001.Console.err.printStackTrace(ex, "Exception parsing getChattersAsync");
        }).subscribe();
    }

    /**
     * Updates the broadcaster and bot in the cache if they have changed
     *
     * @param event The event to process
     */
    @Handler
    public void onPropertiesReloadedEvent(PropertiesReloadedEvent event) {
        ExecutorService.schedule(this::updateBroadcasterBot, 5, TimeUnit.SECONDS);
    }

    /**
     * Updates the cache when a TMI message is recieved
     *
     * @param event The event to process
     */
    @Handler
    public void onIrcModerationEvent(IrcModerationEvent event) {
        String id = event.getTags().getOrDefault("user-id", null);

        if (id != null && !id.isBlank()) {
            Viewer viewer;
            if (this.exists(id)) {
                viewer = this.get(id).inChat(true).seen().active();
            } else {
                viewer = new Viewer(id).login(event.getSender())
                    .name(event.getTags().getOrDefault("display-name", "").replaceAll("\\\\s", " "))
                    .inChat(true).active();
                this.add(viewer);
            }

            viewer.admin(event.getTags().getOrDefault("user-type", "").equals("admin"))
                .staff(event.getTags().getOrDefault("user-type", "").equals("staff"))
                .vip(!event.getTags().getOrDefault("vip", "0").equals("0"))
                .turbo(!event.getTags().getOrDefault("turbo", "0").equals("0"))
                .moderator(!event.getTags().getOrDefault("mod", "0").equals("0"))
                .subscriber(!event.getTags().getOrDefault("subscriber", "0").equals("0"))
                .attributes();
        }
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
            }

            return viewers;
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

            if (!cacheViewer.login().equals(viewer.login())) {
                cacheViewer.login(viewer.login());

                this.updateDatabase(cacheViewer.id(), cacheViewer.login());
            }

            return false;
        }

        this.updateDatabase(viewer.id(), viewer.login());

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
     * Returns the {@link Viewer} object for the specified user login
     *
     * @param login The user login to lookup
     * @return An {@link Optional} containing the {@link Viewer} object for the user; an empty Optional if not in the cache
     */
    private Optional<Viewer> getByLoginInternal(String login) {
        return this.viewers.entrySet().stream().filter(kv -> kv.getValue().login().equals(login)).map(kv -> kv.getValue()).findFirst();
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
     * Indicates if the specified user login is already in the cache
     *
     * @param login The user login to lookup
     * @return {@code true} if this user login is already in the cache
     */
    public boolean loginExists(String login) {
        return this.getByLoginInternal(login).isPresent();
    }

    /**
     * Removes the specified user from the cache
     *
     * @param id The user id to remove
     */
    public void remove(String id) {
        this.viewers.remove(id);
    }

    /**
     * Removes the specified user from the cache by login name
     *
     * @param login The user login to remove
     */
    public void removeByLogin(String login) {
        Optional<Viewer> viewer = this.getByLoginInternal(login);

        if (viewer.isPresent()) {
            this.remove(viewer.get().id());
        }
    }

    /**
     * Returns the {@link Viewer} object representing the bot account
     *
     * @return The {@link Viewer} object representing the bot account
     */
    public Viewer bot() {
        if (this.bot == null) {
            this.updateBroadcasterBot().block(Duration.ofSeconds(10));
        }

        return this.bot;
    }

    /**
     * Returns the {@link Viewer} object representing the broadcaster account
     *
     * @return The {@link Viewer} object representing the broadcaster account
     */
    public Viewer broadcaster() {
        if (this.broadcaster == null) {
            this.updateBroadcasterBot().block(Duration.ofSeconds(10));
        }

        return this.broadcaster;
    }

    /**
     * Returns a list of {@link Viewer} objects representing users recently seen in chat
     *
     * @return A {@link List} of {@link Viewer} objects
     */
    public List<Viewer> chatters() {
        return this.viewers.entrySet().stream().filter(kv -> kv.getValue().inChat()).map(kv -> kv.getValue()).collect(Collectors.toList());
    }

    /**
     * Returns a list of {@link Viewer} objects representing users recently seen in chat, who have sent a message in the past 5 minutes
     *
     * @return A {@link List} of {@link Viewer} objects
     */
    public List<Viewer> activeChatters() {
        Instant after = Instant.now().minus(ACTIVE_TIMEOUT);
        return this.viewers.entrySet().stream().filter(kv -> kv.getValue().inChat() && kv.getValue().lastActive().isAfter(after)).map(kv -> kv.getValue()).collect(Collectors.toList());
    }

    /**
     * Looks up the specified user id in the mapping database and returns the associated user login
     *
     * @param id The user id to lookup
     * @return The associated user login; {@code null} if the specified user id is not in the database
     */
    public String lookupLoginById(String id) {
        if (PhantomBot.instance().getDataStore().HasKey("idToLogin", "", id)) {
            return PhantomBot.instance().getDataStore().GetString("idToLogin", "", id);
        }

        return null;
    }

    /**
     * Looks up the specified user login in the mapping database and returns the associated user id
     *
     * @param login The user login to lookup
     * @return The associated user id; {@code null} if the specified user login is not in the database
     */
    public String lookupIdBylogin(String login) {
        if (PhantomBot.instance().getDataStore().HasKey("loginToId", "", login)) {
            return PhantomBot.instance().getDataStore().GetString("loginToId", "", login);
        }

        return null;
    }
}
