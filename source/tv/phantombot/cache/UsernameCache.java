/*
 * Copyright (C) 2016-2018 phantombot.tv
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

import com.gmt2001.TwitchAPIv5;
import com.gmt2001.datastore.DataStore;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import org.json.JSONException;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.twitch.user.TwitchUserNameChangedEvent;

public class UsernameCache {

    private static final UsernameCache instance = new UsernameCache();

    public static UsernameCache instance() {
        return instance;
    }

    private static final int intervalLookupMS = 1000;
    private final ConcurrentMap<String, UserData> cache = new ConcurrentHashMap<>();
    private final ScheduledThreadPoolExecutor tpExec = new ScheduledThreadPoolExecutor(1);
    private Queue<String> lookupQueue = new ConcurrentLinkedQueue<>();
    private Date timeoutExpire = new Date();
    private Date lastFail = new Date();
    private int numfail = 0;

    private UsernameCache() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        
        tpExec.scheduleAtFixedRate(() -> {
            String next = lookupQueue.poll();
            
            if (next != null) {
                lookupUserData(next);
            }
        }, intervalLookupMS, intervalLookupMS, TimeUnit.MILLISECONDS);
    }

    private void lookupUserData(String username) {
        try {
            JSONObject user = TwitchAPIv5.instance().GetUser(username);

            if (user.getBoolean("_success")) {
                if (user.getInt("_http") == 200) {
                    if (user.getJSONArray("users").length() > 0) {
                        String displayName = user.getJSONArray("users").getJSONObject(0).getString("display_name").replaceAll("\\\\s", " ");
                        String userID = user.getJSONArray("users").getJSONObject(0).getString("_id");
                        addUser(username, displayName, userID);
                    }
                } else {
                    com.gmt2001.Console.debug.println("UsernameCache.updateCache: Failed to get username [" + username + "] http error [" + user.getInt("_http") + "]");
                }
            } else {
                if (user.getString("_exception").equalsIgnoreCase("SocketTimeoutException") || user.getString("_exception").equalsIgnoreCase("IOException")) {
                    Calendar c = Calendar.getInstance();

                    if (lastFail.after(new Date())) {
                        numfail++;
                    } else {
                        numfail = 1;
                    }

                    c.add(Calendar.MINUTE, 1);

                    lastFail = c.getTime();

                    if (numfail >= 5) {
                        timeoutExpire = c.getTime();
                    }
                }
            }
        } catch (JSONException e) {
            com.gmt2001.Console.err.printStackTrace(e);
        }
    }
    
    private void checkUserNameChanged(String userName, String userID) {
        DataStore ds = PhantomBot.instance().getDataStore();
        String existingName = ds.GetString("userids", "", userID);
        
        if (existingName != null) {
            if (!existingName.equalsIgnoreCase(userName)) {
                EventBus.instance().post(new TwitchUserNameChangedEvent(userID, existingName, userName));
                
                ds.SetString("userids", "", userID, userName);
            }
        } else {
            ds.SetString("userids", "", userID, userName);
        }
    }

    public String resolve(String username) {
        return resolve(username, new HashMap<>());
    }

    public String resolve(String username, Map<String, String> tags) {
        String lusername = username.toLowerCase();

        if (hasUser(lusername)) {
            return cache.get(lusername).getUserName();
        } else {
            if (username.equalsIgnoreCase("jtv") || username.equalsIgnoreCase("twitchnotify")) {
                return username;
            }

            if (tags.containsKey("display-name") && tags.get("display-name").equalsIgnoreCase(lusername) && tags.containsKey("user-id")) {
                addUser(lusername, tags.get("display-name"), tags.get("user-id"));
                return tags.get("display-name");
            }

            /* While the user-id should always be present, this is just a stop-gap measure. */
            if (tags.containsKey("display-name") && tags.get("display-name").equalsIgnoreCase(lusername)) {
                return tags.get("display-name");
            }

            if (new Date().before(timeoutExpire)) {
                return username;
            }

            lookupUserData(lusername);
            if (hasUser(lusername)) {
                return cache.get(lusername).getUserName();
            } else {
                return lusername;
            }
        }
    }

    public void addUser(String userName) {
        addUser(userName, "", "");
    }

    public void addUser(String userName, Map<String, String> tags) {
        if (tags.containsKey("display-name") && tags.get("display-name").equalsIgnoreCase(userName) && tags.containsKey("user-id")) {
            addUser(userName, tags.get("display-name"), tags.get("user-id"));
        } else {
            addUser(userName);
        }
    }

    public void addUser(String userName, String displayName, int userID) {
        addUser(userName, displayName, "" + userID);
    }

    public void addUser(String userName, String displayName, String userID) {
        if (!hasUser(userName)) {
            if (displayName.length() > 0 && userID.length() > 0 && !userID.equals("0")) {
                cache.put(userName, new UserData(displayName.replaceAll("\\\\s", " "), userID));
                checkUserNameChanged(userName, userID);
            } else {
                lookupQueue.add(userName);
            }
        }
    }

    public boolean hasUser(String userName) {
        return cache.containsKey(userName);
    }

    public String get(String userName) {
        return (hasUser(userName) ? cache.get(userName).getUserName() : userName);
    }

    public String getID(String userName) {
        String lusername = userName.toLowerCase();
        if (hasUser(lusername)) {
            return cache.get(lusername).getUserID();
        } else {
            addUser(userName);
        }
        return "0";
    }

    public void removeUser(String userName) {
        userName = userName.toLowerCase();

        if (hasUser(userName)) {
            cache.remove(userName);
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
        private int userID;

        public UserData(String userName, int userID) {
            this.userName = userName;
            this.userID = userID;
        }
        public UserData(String userName, String userID) {
            this.userName = userName;
            this.userID = Integer.parseUnsignedInt(userID);
        }

        public void putUserName(String userName) {
            this.userName = userName;
        }
        public void putUserID(int userID) {
            this.userID = userID;
        }
        public void putUserID(String userID) {
            this.userID = Integer.parseUnsignedInt(userID);
        }

        public String getUserName() {
            return userName;
        }
        public String getUserID() {
            return Integer.toUnsignedString(userID);
        }
    }
}
