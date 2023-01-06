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

import com.gmt2001.TwitchAPIv5;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 *
 * @author ScaniaTV
 */
public class TwitchTeamsCache implements Runnable {

    private static TwitchTeamsCache INSTANCE;
    private static final Map<String, Team> teams = new HashMap<>();
    private final Thread updateThread;
    private final String channelName;

    /**
     * Method that starts this cache, and returns it.
     *
     * @param channelName
     * @return
     */
    public static synchronized TwitchTeamsCache instance(String channelName) {
        if (INSTANCE == null) {
            INSTANCE = new TwitchTeamsCache(channelName);
        }

        return INSTANCE;
    }

    /**
     * Class constructor.
     *
     * @param channelName
     */
    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private TwitchTeamsCache(String channelName) {
        this.channelName = channelName;

        this.updateThread = new Thread(this, "tv.phantombot.cache.TwitchTeamsCache");
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.start();
    }

    /**
     * Method that updates the Twitch teams.
     */
    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
        while (true) {
            try {
                updateCache();
            } catch (JSONException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
            try {
                Thread.sleep(60 * 1000);
            } catch (InterruptedException ex) {
                // Ignore this.
                // ex.printStackTrace();
            }
        }
    }

    /**
     * Method that updates the cache.
     */
    private void updateCache() throws JSONException {
        JSONObject teamsObj = TwitchAPIv5.instance().getChannelTeams(channelName);

        if (teamsObj.getBoolean("_success") && teamsObj.getInt("_http") == 200) {
            JSONArray teamsArr = teamsObj.getJSONArray("teams");
            for (int i = 0; i < teamsArr.length(); i++) {
                JSONObject team = TwitchAPIv5.instance().getTeam(teamsArr.getJSONObject(i).getString("name"));

                if (team.getBoolean("_success") && team.getInt("_http") == 200) {
                    teams.put(team.getString("name"), new Team(team));
                }
            }
        }
    }

    /**
     * Method that gets a team from the cache.
     *
     * @param teamName
     * @return
     */
    public Team getTeam(String teamName) {
        return teams.get(teamName);
    }

    /**
     * Private class that holds the teams information.
     */
    public class Team {

        private final JSONObject obj;

        /**
         * Class constructor.
         *
         * @param obj
         */
        public Team(JSONObject obj) {
            this.obj = obj;
        }

        /**
         * Method that returns the display name of the team.
         *
         * @return
         */
        public String getName() throws JSONException {
            return (obj.getString("display_name"));
        }

        /**
         * Method that gets the date the team was created on.
         *
         * @return
         */
        public String getCreatedAt() throws JSONException {
            return (obj.getString("created_at"));
        }

        /**
         * Method that gets the team information.
         *
         * @return
         */
        public String getInfo() throws JSONException {
            return (obj.getString("info"));
        }

        /**
         * Method that returns the team url.
         *
         * @return
         */
        public String getUrl() throws JSONException {
            return ("https://twitch.tv/team/" + obj.getString("name"));
        }

        /**
         * Method that gets the amount of users in the team.
         *
         * @return
         */
        public int getTotalMembers() throws JSONException {
            return (obj.getJSONArray("users").length());
        }

        /**
         * Method that returns a random member from the team.
         *
         * @return
         */
        public String getRandomMember() throws JSONException {
            int random = new Random().nextInt(this.getTotalMembers());

            return obj.getJSONArray("users").getJSONObject(random).getString("name");
        }

        /**
         * Method that returns a team member.
         *
         * @param username
         * @return
         */
        public JSONObject getTeamMember(String username) throws JSONException {
            JSONArray users = obj.getJSONArray("users");
            JSONObject user = null;

            for (int i = 0; i < users.length(); i++) {
                if (users.getJSONObject(i).getString("name").equalsIgnoreCase(username)) {
                    user = users.getJSONObject(i);
                    break;
                }
            }

            return user;
        }

        /**
         * Method that checks if a user is apart of a team.
         *
         * @param username
         * @return
         */
        public boolean hasUser(String username) throws JSONException {
            JSONArray users = obj.getJSONArray("users");
            boolean foundUser = false;

            for (int i = 0; i < users.length(); i++) {
                if (users.getJSONObject(i).getString("name").equalsIgnoreCase(username)) {
                    foundUser = true;
                    break;
                }
            }

            return foundUser;
        }

        /**
         * Method that returns the raw object.
         *
         * @return
         */
        public JSONObject getObject() {
            return obj;
        }
    }
}
