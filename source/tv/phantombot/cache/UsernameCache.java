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

import com.gmt2001.ExecutorService;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
import org.json.JSONObject;
import reactor.core.publisher.Mono;
import tv.phantombot.CaselessProperties;
import tv.phantombot.twitch.api.Helix;
import tv.phantombot.twitch.api.TwitchValidate;

public class UsernameCache {

    private static final UsernameCache INSTANCE = new UsernameCache();

    public static UsernameCache instance() {
        return INSTANCE;
    }

    private final Map<String, UserData> cache = new ConcurrentHashMap<>();

    private UsernameCache() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.lookupUserDataAsync(List.of(TwitchValidate.instance().getChatLogin(),
                CaselessProperties.instance().getProperty("channel").toLowerCase())).subscribe();
        ExecutorService.scheduleAtFixedRate(() -> {
            Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
            Thread.currentThread().setName("UsernameCache::GC");
            final Instant expiresBefore = Instant.now().minus(1, ChronoUnit.HOURS);
            final String bot = TwitchValidate.instance().getChatLogin();
            final String broadcaster = CaselessProperties.instance().getProperty("channel").toLowerCase();
            this.cache.forEach((k, v) -> {
                if (v.lastSeen().isBefore(expiresBefore) && !k.equals(bot) && !k.equals(broadcaster)) {
                    this.cache.remove(k);
                }
            });
        }, 0, 1, TimeUnit.HOURS);
    }

    private void lookupUserData(String username) {
        try {
            this.lookupUserDataAsync(username).block();
        } catch (Exception e) {
        }
    }

    private Mono lookupUserDataAsync(String username) {
        return this.lookupUserDataAsync(List.of(username));
    }

    private Mono lookupUserDataAsync(List<String> usernames) {
        return Mono.create(emitter -> {
            Helix.instance().getUsersAsync(null, usernames).doOnSuccess(jso -> {
                if (jso != null && !jso.has("error") && jso.has("data") && !jso.isNull("data")) {
                    final JSONArray data = jso.getJSONArray("data");

                    if (data.length() > 0) {
                        for (int i = 0; i < data.length(); i++) {
                            JSONObject user = data.getJSONObject(i);
                            this.cache.put(user.getString("login"), new UserData(user.getString("display_name").replaceAll("\\\\s", " "), user.getString("id")));
                        }
                    }
                }
                emitter.success();
            }).doOnError(ex -> {
                com.gmt2001.Console.err.printStackTrace(ex, "[lookupUserDataAsync] Exception parsing getUsersAsync");
                emitter.error(ex);
            }).subscribe();
        });
    }

    public String resolveBot() {
        return resolve(TwitchValidate.instance().getChatLogin());
    }

    public String resolveCaster() {
        return resolve(CaselessProperties.instance().getProperty("channel").toLowerCase());
    }

    public String resolve(String username) {
        return resolve(username, new HashMap<>());
    }

    public String resolve(String username, Map<String, String> tags) {
        String lusername = username.toLowerCase();

        if (this.hasUser(lusername)) {
            this.cache.get(lusername).seen();
            return this.cache.get(lusername).getUserName();
        } else {
            if (username.equalsIgnoreCase("jtv") || username.equalsIgnoreCase("twitchnotify")) {
                return username;
            }

            if (tags.containsKey("display-name") && tags.get("display-name").equalsIgnoreCase(lusername) && tags.containsKey("user-id")) {
                this.cache.put(lusername, new UserData(tags.get("display-name"), tags.get("user-id")));
                return tags.get("display-name");
            }

            /* While the user-id should always be present, this is just a stop-gap measure. */
            if (tags.containsKey("display-name") && tags.get("display-name").equalsIgnoreCase(lusername)) {
                return tags.get("display-name");
            }

            this.lookupUserData(lusername);
            if (this.hasUser(lusername)) {
                return this.cache.get(lusername).getUserName();
            } else {
                return lusername;
            }
        }
    }

    public boolean exists(String userName) {
        // Check the cache first, if the user doesn't exist call the API and check the cache again.
        if (this.hasUser(userName)) {
            return true;
        } else {
            this.lookupUserData(userName);

            return this.hasUser(userName);
        }
    }

    public void addUser(String userName, String displayName, String userID) {
        if (!this.hasUser(userName) && displayName.length() > 0 && userID.length() > 0) {
            this.cache.put(userName, new UserData(displayName.replaceAll("\\\\s", " "), userID));
        }
    }

    public boolean hasUser(String userName) {
        return this.cache.containsKey(userName);
    }

    public String get(String userName) {
        return (this.hasUser(userName) ? this.cache.get(userName).getUserName() : userName);
    }

    public String getIDBot() {
        return this.getID(TwitchValidate.instance().getChatLogin());
    }

    public String getIDCaster() {
        return this.getID(CaselessProperties.instance().getProperty("channel").toLowerCase());
    }

    public String getID(String userName) {
        String lusername = userName.toLowerCase();
        if (this.hasUser(lusername)) {
            this.cache.get(lusername).seen();
            return this.cache.get(lusername).getUserID();
        } else {
            this.lookupUserData(lusername);
            if (this.hasUser(lusername)) {
                return this.cache.get(lusername).getUserID();
            }
        }
        return "0";
    }

    public void removeUser(String userName) {
        userName = userName.toLowerCase();

        if (this.hasUser(userName)) {
            this.cache.remove(userName);
        }
    }

    /*
     * Internal object for tracking user data.
     * Note that while Twitch represents the userID as a String, it is an integer value.  We
     * define this as an int here to conserve memory usage.  The maximum value of an unsigned
     * int within Java is 4,294,967,295 which should serve as a large enough data type.
     */
    private class UserData {

        private String userName;
        private String userID;
        private Instant lastSeen = Instant.now();

        public UserData(String userName, String userID) {
            this.userName = userName;
            this.userID = userID;
        }

        public void putUserName(String userName) {
            this.userName = userName;
        }

        public void putUserID(String userID) {
            this.userID = userID;
        }

        public String getUserName() {
            return this.userName;
        }

        public String getUserID() {
            return this.userID;
        }

        public void seen() {
            this.lastSeen = Instant.now();
        }

        public Instant lastSeen() {
            return this.lastSeen;
        }
    }
}
