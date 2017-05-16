/*
 * Copyright (C) 2017 phantombot.tv
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
package me.mast3rplan.phantombot.cache;

import com.gmt2001.TwitchAPIv3;
import com.google.common.collect.Maps;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import me.mast3rplan.phantombot.PhantomBot;
import org.json.JSONObject;

public class UsernameCache {

    private static final UsernameCache instance = new UsernameCache();

    public static UsernameCache instance() {
        return instance;
    }

    private final Map<String, String> cache = Maps.newHashMap();
    private Date timeoutExpire = new Date();
    private Date lastFail = new Date();
    private int numfail = 0;

    private UsernameCache() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    public String resolve(String username) {
        return resolve(username, new HashMap<String, String>());
    }

    public String resolve(String username, Map<String, String> tags) {
        String lusername = username.toLowerCase();

        if (cache.containsKey(lusername)) {
            return cache.get(lusername);
        } else {
            if (tags.containsKey("display-name") && tags.get("display-name").equalsIgnoreCase(lusername)) {
                cache.put(lusername, tags.get("display-name"));
                return tags.get("display-name");
            }

            if (username.equalsIgnoreCase("jtv") || username.equalsIgnoreCase("twitchnotify") || new Date().before(timeoutExpire)) {
                return username;
            }

            try {
                JSONObject user = TwitchAPIv3.instance().GetUser(lusername);

                if (user.getBoolean("_success")) {
                    if (user.getInt("_http") == 200) {
                        String displayName = user.getString("display_name").replaceAll("\\\\s", " ");
                        cache.put(lusername, displayName);

                        return displayName;
                    } else {
                        if (user.getInt("_http") == 404 && user.has("message") && !user.isNull("message")) {
                            if (user.getString("message").endsWith("does not exist")) {
                                com.gmt2001.Console.debug.println("UsernameCache.updateCache: " + user.getString("message"));
                                return username;
                            }
                        }
                        try {
                            throw new Exception("[HTTPErrorException] HTTP " + user.getInt("_http") + " " + user.getString("error") + ". req="
                                                + user.getString("_type") + " " + user.getString("_url") + " " + user.getString("_post") + "   "
                                                + (user.has("message") && !user.isNull("message") ? "message=" + user.getString("message") : "content=" + user.getString("_content")));
                        } catch (Exception e) {
                              com.gmt2001.Console.debug.println("UsernameCache.updateCache: Failed to get username: " + e.getMessage());
                              return username;
                        }
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

                    return username;
                }
            } catch (Exception e) {
                com.gmt2001.Console.err.printStackTrace(e);
                return username;
            }
        }
    }

    public void addUser(String userName, String displayName) {
        if (displayName.length() > 0) {
            if (!cache.containsKey(userName)) {
                cache.put(userName, displayName.replaceAll("\\\\s", " "));
            }
        }
    }

    public void removeUser(String userName) {
        userName = userName.toLowerCase();

        if (cache.containsKey(userName)) {
            cache.remove(userName);
        }
    }
}
