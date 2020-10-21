/*
 * Copyright (C) 2016-2020 phantombot.github.io/PhantomBot
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
package com.gmt2001;

import com.gmt2001.datastore.DataStore;
import java.io.BufferedOutputStream;
import tv.phantombot.cache.UsernameCache;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.net.URLEncoder;
import javax.net.ssl.HttpsURLConnection;
import org.apache.commons.io.IOUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONStringer;
import java.util.List;
import java.util.ArrayList;
import java.util.zip.GZIPInputStream;
import org.json.JSONException;

/**
 * Communicates with Twitch Kraken server using the version 5 API
 *
 * @author gmt2001
 * @author illusionaryone
 */
public class TwitchAPIv5 {

    private static final TwitchAPIv5 instance = new TwitchAPIv5();
    private static final String base_url = "https://api.twitch.tv/kraken";
    private static final String header_accept = "application/vnd.twitchtv.v5+json";
    private static final int timeout = 2 * 1000;
    private String clientid = "";
    private String oauth = "";
    private String cheerEmotes = "";

    private enum request_type {

        GET, POST, PUT, DELETE
    };

    public static TwitchAPIv5 instance() {
        return instance;
    }

    private TwitchAPIv5() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    private JSONObject GetData(request_type type, String url, boolean isJson) throws JSONException {
        return GetData(type, url, "", isJson);
    }

    private JSONObject GetData(request_type type, String url, String post, boolean isJson) throws JSONException {
        return GetData(type, url, post, "", isJson);
    }

    private static void fillJSONObject(JSONObject jsonObject, boolean success, String type, String post,
                                       String url, int responseCode, String exception,
                                       String exceptionMessage, String jsonContent) throws JSONException {
        jsonObject.put("_success", success);
        jsonObject.put("_type", type);
        jsonObject.put("_post", post);
        jsonObject.put("_url", url);
        jsonObject.put("_http", responseCode);
        jsonObject.put("_exception", exception);
        jsonObject.put("_exceptionMessage", exceptionMessage);
        jsonObject.put("_content", jsonContent);
    }

    @SuppressWarnings("UseSpecificCatch")
    private JSONObject GetData(request_type type, String url, String post, String oauth, boolean isJson) throws JSONException {
        JSONObject j = new JSONObject("{}");
        InputStream i = null;
        String content = "";

        try {
            URL u = new URL(url);
            HttpsURLConnection c = (HttpsURLConnection) u.openConnection();
            c.addRequestProperty("Accept", header_accept);
            c.addRequestProperty("Content-Type", isJson ? "application/json" : "application/x-www-form-urlencoded");

            if (!clientid.isEmpty()) {
                c.addRequestProperty("Client-ID", clientid);
            }

            if (!oauth.isEmpty()) {
                c.addRequestProperty("Authorization", "OAuth " + oauth);
            } else {
                if (!this.oauth.isEmpty()) {
                    c.addRequestProperty("Authorization", "OAuth " + oauth);
                }
            }

            c.setRequestMethod(type.name());
            c.setConnectTimeout(timeout);
            c.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.52 Safari/537.36 PhantomBotJ/2015");

            if (!post.isEmpty()) {
                c.setDoOutput(true);
            }

            c.connect();

            if (!post.isEmpty()) {
                try (BufferedOutputStream stream = new BufferedOutputStream(c.getOutputStream())) {
                    stream.write(post.getBytes());
                    stream.flush();
                }
            }

            if (c.getResponseCode() == 200) {
                i = c.getInputStream();
            } else {
                i = c.getErrorStream();
            }

            if (c.getResponseCode() == 204 || i == null) {
                content = "{}";
            } else {
                // default to UTF-8, it'll probably be the best bet if there's
                // no charset specified.
                String charset = "utf-8";
                String ct = c.getContentType();
                if (ct != null) {
                    String[] cts = ct.split(" *; *");
                    for (int idx = 1; idx < cts.length; ++idx) {
                        String[] val = cts[idx].split("=", 2);
                        if (val[0] == "charset" && val.length > 1) {
                            charset = val[1];
                        }
                    }
                }

                if ("gzip".equals(c.getContentEncoding())) {
                    i = new GZIPInputStream(i);
                }

                content = IOUtils.toString(i, charset);
            }

            j = new JSONObject(content);
            fillJSONObject(j, true, type.name(), post, url, c.getResponseCode(), "", "", content);
        } catch (Exception ex) {
            Throwable rootCause = ex;
            while (rootCause.getCause() != null && rootCause.getCause() != rootCause) {
                rootCause = rootCause.getCause();
            }

            fillJSONObject(j, false, type.name(), post, url, 0, ex.getClass().getSimpleName(), ex.getMessage(), content);
            com.gmt2001.Console.debug.println("Failed to get data [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
        } finally {
            if (i != null) {
                try {
                    i.close();
                } catch (IOException ex) {
                    fillJSONObject(j, false, type.name(), post, url, 0, "IOException", ex.getMessage(), content);
                    com.gmt2001.Console.err.println("IOException: " + ex.getMessage());
                }
            }
        }

        return j;
    }

    /**
     * Sets the Twitch API Client-ID header
     *
     * @param clientid
     */
    public void SetClientID(String clientid) {
        this.clientid = clientid;
    }

    /**
     * Sets the Twitch API OAuth header
     *
     * @param oauth
     */
    public void SetOAuth(String oauth) {
        this.oauth = oauth.replace("oauth:", "");
    }

    public boolean HasOAuth() {
        return !this.oauth.isEmpty();
    }

    /**
     * Determines the ID of a username, if this fails it returns "0".
     *
     * @param channel
     * @return
     */
    private String getIDFromChannel(String channel) {
        return UsernameCache.instance().getID(channel);
    }


    /**
     * Gets a channel object
     *
     * @param channel
     * @return
     */
    public JSONObject GetChannel(String channel) throws JSONException {
        return GetData(request_type.GET, base_url + "/channels/" + getIDFromChannel(channel), false);
    }

    /**
     * Updates the status and game of a channel
     *
     * @param channel
     * @param status
     * @param game
     * @param delay -1 to not update
     * @return
     */
    public JSONObject UpdateChannel(String channel, String status, String game, int delay) throws JSONException {
        return UpdateChannel(channel, this.oauth, status, game, delay);
    }

    /**
     * Updates the status and game of a channel
     *
     * @param channel
     * @param oauth
     * @param status
     * @param game
     * @return
     */
    public JSONObject UpdateChannel(String channel, String oauth, String status, String game) throws JSONException {
        return UpdateChannel(channel, oauth, status, game, -1);
    }

    /**
     * Updates the status and game of a channel
     *
     * @param channel
     * @param status
     * @param game
     * @return
     */
    public JSONObject UpdateChannel(String channel, String status, String game) throws JSONException {
        return UpdateChannel(channel, this.oauth, status, game, -1);
    }

    /**
     * Updates the status and game of a channel
     *
     * @param channel
     * @param oauth
     * @param status
     * @param game
     * @param delay -1 to not update
     * @return
     */
    public JSONObject UpdateChannel(String channel, String oauth, String status, String game, int delay) throws JSONException {
        JSONObject j = new JSONObject("{}");
        JSONObject c = new JSONObject("{}");

        if (!status.isEmpty()) {
            c.put("status", status);
        }

        if (!game.isEmpty()) {
            JSONObject g = SearchGame(game);
            String gn = game;

            if (g.getBoolean("_success")) {
                if (g.getInt("_http") == 200) {
                    JSONArray a = g.getJSONArray("games");

                    if (a.length() > 0) {
                        boolean found = false;

                        for (int i = 0; i < a.length() && !found; i++) {
                            JSONObject o = a.getJSONObject(i);

                            gn = o.getString("name");

                            if (gn.equalsIgnoreCase(game)) {
                                found = true;
                            }
                        }

                        if (!found) {
                            JSONObject o = a.getJSONObject(0);

                            gn = o.getString("name");
                        }
                    }
                }
            }

            c.put("game", gn);
        }

        if (delay >= 0) {
            c.put("delay", delay);
        }

        j.put("channel", c);

        return GetData(request_type.PUT, base_url + "/channels/" + getIDFromChannel(channel), j.toString(), oauth, true);
    }

    /*
     * Updates the channel communities.
     */
    public JSONObject UpdateCommunities(String channel, String[] communities) throws JSONException {
        JSONObject j = new JSONObject("{}");
        List<String> c = new ArrayList<String>();

        if (communities.length < 1) {
            j.put("community_ids", c.toArray(new String[c.size()]));
            return GetData(request_type.PUT, base_url + "/channels/" + getIDFromChannel(channel) + "/communities", j.toString(), oauth, true);
        }

        for (String community : communities) {
            JSONObject o = GetCommunityID(community);
            if (o.getBoolean("_success") && o.getInt("_http") == 200) {
                c.add(o.getString("_id"));
            }
        }

        j.put("community_ids", c.toArray(new String[c.size()]));

        return GetData(request_type.PUT, base_url + "/channels/" + getIDFromChannel(channel) + "/communities", j.toString(), oauth, true);
    }

    /*
     * Searches for a game.
     */
    public JSONObject SearchGame(String game) throws JSONException {
        try {
            String url = base_url + "/search/games?q=" + URLEncoder.encode(game, "UTF-8") + "&type=suggest";
            return GetData(request_type.GET, url, false);
        } catch (UnsupportedEncodingException ex) {
            JSONObject j = new JSONObject("{}");
            fillJSONObject(j, false, "", "", base_url + "/search/games", 0, ex.getClass().getName(), ex.getMessage(), "");
            com.gmt2001.Console.err.println(ex.getClass().getName() + ": " + ex.getMessage());
            return j;
        }
    }

    /*
     * Gets a communities id.
     */
    public JSONObject GetCommunityID(String name) throws JSONException {
        return GetData(request_type.GET, base_url + "/communities?name=" + name, false);
    }

    /**
     * Gets an object listing the users following a channel
     *
     * @param channel
     * @param limit between 1 and 100
     * @param offset
     * @param ascending
     * @return
     */
    public JSONObject GetChannelFollows(String channel, int limit, int offset, boolean ascending) throws JSONException {
        limit = Math.max(0, Math.min(limit, 100));
        offset = Math.max(0, offset);
        String dir = ascending ? "asc" : "desc";
        return GetData(request_type.GET, base_url + "/channels/" + getIDFromChannel(channel) + "/follows?limit=" + limit + "&offset=" + offset + "&direction=" + dir, false);
    }

    /**
     * Gets an object listing the users subscribing to a channel
     *
     * @param channel
     * @param limit between 1 and 100
     * @param offset
     * @param ascending
     * @return
     */
    public JSONObject GetChannelSubscriptions(String channel, int limit, int offset, boolean ascending) throws JSONException {
        return GetChannelSubscriptions(channel, limit, offset, ascending, this.oauth);
    }

    /**
     * Gets an object listing the users subscribing to a channel
     *
     * @param channel
     * @param limit between 1 and 100
     * @param offset
     * @param ascending
     * @param oauth
     * @return
     */
    public JSONObject GetChannelSubscriptions(String channel, int limit, int offset, boolean ascending, String oauth) throws JSONException {
        limit = Math.max(0, Math.min(limit, 100));
        offset = Math.max(0, offset);
        String dir = ascending ? "asc" : "desc";
        return GetData(request_type.GET, base_url + "/channels/" + getIDFromChannel(channel) + "/subscriptions?limit=" + limit + "&offset=" + offset + "&direction=" + dir, "", oauth, false);
    }

    /**
     * Gets a stream object
     *
     * @param channel
     * @return
     */
    public JSONObject GetStream(String channel) throws JSONException {
        return GetData(request_type.GET, base_url + "/streams/" + getIDFromChannel(channel), false);
    }

    /**
     * Gets a streams object array. Each channel id should be seperated with a comma.
     *
     * @param channels
     * @return
     */
    public JSONObject GetStreams(String channels) throws JSONException {
        return GetData(request_type.GET, base_url + "/streams?channel=" + channels, false);
    }

    /**
     * Gets the communities object array.
     *
     * @param channel
     * @return
     */
    public JSONObject GetCommunities(String channel) throws JSONException {
        return GetData(request_type.GET, base_url + "/channels/" + getIDFromChannel(channel) + "/communities", false);
    }

    /**
     * Gets a user object by user name
     *
     * @param user
     * @return
     */
    public JSONObject GetUser(String user) throws JSONException {
        return GetData(request_type.GET, base_url + "/users?login=" + user, false);
    }

    /**
     * Gets a user object by ID
     *
     * @param user
     * @return
     */
    public JSONObject GetUserByID(String userID) throws JSONException {
        return GetData(request_type.GET, base_url + "/users/" + userID, false);
    }

    /**
     * Runs a commercial. Will fail if channel is not partnered, a commercial has been run in the last 8 minutes, or stream is offline
     *
     * @param channel
     * @param length (30, 60, 90, 120, 150, 180)
     * @return jsonObj.getInt("_http") == 422 if length is invalid or the channel is currently ineligible to run a commercial due to restrictions listed in the method description
     */
    public JSONObject RunCommercial(String channel, int length) throws JSONException {
        return RunCommercial(channel, length, this.oauth);
    }

    /**
     * Runs a commercial. Will fail if channel is not partnered, a commercial has been run in the last 8 minutes, or stream is offline
     *
     * @param channel
     * @param length (30, 60, 90, 120, 150, 180)
     * @param oauth
     * @return jsonObj.getInt("_http") == 422 if length is invalid or the channel is currently ineligible to run a commercial due to restrictions listed in the method description
     */
    public JSONObject RunCommercial(String channel, int length, String oauth) throws JSONException {
        JSONObject j = new JSONObject("{}");
        j.put("length", length);
        return GetData(request_type.POST, base_url + "/channels/" + getIDFromChannel(channel) + "/commercial", j.toString(), oauth, true);
    }

    /**
     * Gets a list of users in the channel
     *
     * @param channel
     * @return
     */
    public JSONObject GetChatUsers(String channel) throws JSONException {
        return GetData(request_type.GET, "https://tmi.twitch.tv/group/user/" + channel + "/chatters", false);
    }

    /**
     * Checks if a user is following a channel
     *
     * @param user
     * @param channel
     * @return
     */
    public JSONObject GetUserFollowsChannel(String user, String channel) throws JSONException {
        return GetData(request_type.GET, base_url + "/users/" + getIDFromChannel(user) + "/follows/channels/" + getIDFromChannel(channel), false);
    }

    /**
     * Gets the full list of emotes from Twitch
     *
     * @return
     */
    public JSONObject GetEmotes() throws JSONException {
        return GetData(request_type.GET, base_url + "/chat/emoticons", false);
    }

    /**
     * Gets the list of cheer emotes from Twitch
     *
     * @return
     */
    public JSONObject GetCheerEmotes() throws JSONException {
        return GetData(request_type.GET, base_url + "/bits/actions", false);
    }

    /**
     * Builds a RegExp String to match cheer emotes from Twitch
     *
     * @return
     */
    public String GetCheerEmotesRegex() throws JSONException {
        String[] emoteList;
        JSONObject jsonInput;
        JSONArray jsonArray;

        if (cheerEmotes == "") {
            jsonInput = GetCheerEmotes();
            if (jsonInput.has("actions")) {
                jsonArray = jsonInput.getJSONArray("actions");
                emoteList = new String[jsonArray.length()];
                for (int idx = 0; idx < jsonArray.length(); idx++) {
                    emoteList[idx] = "\\b" + jsonArray.getJSONObject(idx).getString("prefix") + "\\d+\\b";
                }
                cheerEmotes = String.join("|", emoteList);
            }
        }
        return cheerEmotes;
    }

    /**
     * Gets the list of VODs from Twitch
     *
     * @param   channel  The channel requesting data for
     * @param   type  The type of data: current, highlights, archives
     * @return  String  List of Twitch VOD URLs (as a JSON String) or empty String in failure.
     */
    public String GetChannelVODs(String channel, String type) throws JSONException {
        JSONStringer jsonOutput = new JSONStringer();
        JSONObject   jsonInput;
        JSONArray    jsonArray;

        if (type.equals("current")) {
            jsonInput = GetData(request_type.GET, base_url + "/channels/" + getIDFromChannel(channel) + "/videos?broadcast_type=archive&limit=1", false);
            if (jsonInput.has("videos")) {
                jsonArray = jsonInput.getJSONArray("videos");
                if (jsonArray.length() > 0) {
                    if (jsonArray.getJSONObject(0).has("status")) {
                        if (jsonArray.getJSONObject(0).getString("status").equals("recording")) {
                            jsonOutput.object().key("videos").array().object();
                            jsonOutput.key("url").value(jsonArray.getJSONObject(0).getString("url"));
                            jsonOutput.key("recorded_at").value(jsonArray.getJSONObject(0).getString("recorded_at"));
                            jsonOutput.key("length").value(jsonArray.getJSONObject(0).getInt("length"));
                            jsonOutput.endObject().endArray().endObject();
                        }
                        com.gmt2001.Console.debug.println("TwitchAPIv5::GetChannelVODs: " + jsonOutput.toString());
                        if (jsonOutput.toString() == null) {
                            return "";
                        }
                        return jsonOutput.toString();
                    }
                }
            }
        }

        if (type.equals("highlights")) {
            jsonInput = GetData(request_type.GET, base_url + "/channels/" + getIDFromChannel(channel) + "/videos?broadcast_type=highlight&limit=5", false);
            if (jsonInput.has("videos")) {
                jsonArray = jsonInput.getJSONArray("videos");
                if (jsonArray.length() > 0) {
                    jsonOutput.object().key("videos").array();
                    for (int idx = 0; idx < jsonArray.length(); idx++) {
                        jsonOutput.object();
                        jsonOutput.key("url").value(jsonArray.getJSONObject(idx).getString("url"));
                        jsonOutput.key("recorded_at").value(jsonArray.getJSONObject(idx).getString("recorded_at"));
                        jsonOutput.key("length").value(jsonArray.getJSONObject(idx).getInt("length"));
                        jsonOutput.endObject();
                    }
                    jsonOutput.endArray().endObject();
                    com.gmt2001.Console.debug.println("TwitchAPIv5::GetChannelVODs: " + jsonOutput.toString());
                    if (jsonOutput.toString() == null) {
                        return "";
                    }
                    return jsonOutput.toString();
                }
            }
        }

        if (type.equals("archives")) {
            jsonInput = GetData(request_type.GET, base_url + "/channels/" + getIDFromChannel(channel) + "/videos?broadcast_type=archive,upload&limit=5", false);
            if (jsonInput.has("videos")) {
                jsonArray = jsonInput.getJSONArray("videos");
                if (jsonArray.length() > 0) {
                    jsonOutput.object().key("videos").array();
                    for (int idx = 0; idx < jsonArray.length(); idx++) {
                        jsonOutput.object();
                        jsonOutput.key("url").value(jsonArray.getJSONObject(idx).getString("url"));
                        jsonOutput.key("recorded_at").value(jsonArray.getJSONObject(idx).getString("recorded_at"));
                        jsonOutput.key("length").value(jsonArray.getJSONObject(idx).getInt("length"));
                        jsonOutput.endObject();
                    }
                    jsonOutput.endArray().endObject();
                    com.gmt2001.Console.debug.println("TwitchAPIv5::GetChannelVODs: " + jsonOutput.toString());
                    if (jsonOutput.toString() == null) {
                        return "";
                    }
                    return jsonOutput.toString();
                }
            }
        }

        /* Just return an empty string. */
        return "";
    }

    /**
     * Returns when a Twitch account was created.
     *
     * @param   channel
     * @return  String   date-time representation (2015-05-09T00:08:04Z)
     */
    public String getChannelCreatedDate(String channel) throws JSONException {
        JSONObject jsonInput = GetData(request_type.GET, base_url + "/channels/" + getIDFromChannel(channel), false);
        if (jsonInput.has("created_at")) {
            return jsonInput.getString("created_at");
        }
        return "ERROR";
    }
    
    /**
     * Method that gets the teams that the channel is in.
     * 
     * @param channelName
     * @return 
     */
    public JSONObject getChannelTeams(String channelName) throws JSONException {
        return GetData(request_type.GET, base_url + "/channels/" + getIDFromChannel(channelName) + "/teams", false);
    }
    
    /**
     * Method that gets a Twitch team.
     * 
     * @param teamName
     * @return 
     */
    public JSONObject getTeam(String teamName) throws JSONException {
        return GetData(request_type.GET, base_url + "/teams/" + teamName, false);
    }

    /**
      * Checks to see if the bot account is verified by Twitch.
      *
      * @param  channel
      * @return boolean  true if verified
      */
    public boolean getBotVerified(String channel) throws JSONException {
        JSONObject jsonInput = GetData(request_type.GET, base_url + "/users/" + getIDFromChannel(channel) + "/chat", false);
        if (jsonInput.has("is_verified_bot")) {
            return jsonInput.getBoolean("is_verified_bot");
        }
        return false;
    }

    /**
     * Get the clips from today for a channel.
     *
     * @param channel
     * @return JSONObject  clips object.
     */
    public JSONObject getClipsToday(String channel) throws JSONException {
        /* Yes, the v5 endpoint for this does use the Channel Name and not the ID. */
        return GetData(request_type.GET, base_url + "/clips/top?channel=" + channel + "&limit=100&period=day", false);
    }

    /**
     * Populates the followed table from a JSONArray. The database auto commit is disabled
     * as otherwise the large number of writes in a row can cause some delay.  We only
     * update the followed table if the user has an entry in the time table. This way we
     * do not potentially enter thousands, or tens of thousands, or even more, entries into
     * the followed table for folks that do not visit the stream.
     *
     * @param   JSONArray   JSON array object containing the followers data
     * @param   DataStore   Copy of database object for writing
     * @return  int         How many objects were inserted into the database
     */
    private int PopulateFollowedTable(JSONArray followsArray, DataStore dataStore) throws JSONException {
        int insertCtr = 0;
        for (int idx = 0; idx < followsArray.length(); idx++) {
            if (followsArray.getJSONObject(idx).has("user")) {
                if (followsArray.getJSONObject(idx).getJSONObject("user").has("name")) {
                    if (dataStore.exists("time", followsArray.getJSONObject(idx).getJSONObject("user").getString("name"))) {
                        insertCtr++;
                        dataStore.set("followed_fixtable", followsArray.getJSONObject(idx).getJSONObject("user").getString("name"), "true");
                    }
                }
            }
        }
        return insertCtr;
    }

    /**
     * Updates the followed table with a complete list of followers. This should only ever
     * be executed once, when the database does not have complete list of followers.
     *
     * @param   String      Name of the channel to lookup data for
     * @param   DataStore   Copy of database object for reading data from
     * @param   int         Total number of followers reported from Twitch API
     */
    @SuppressWarnings("SleepWhileInLoop")
    private void FixFollowedTableWorker(String channel, DataStore dataStore, int followerCount) throws JSONException {
        int insertCtr = 0;
        JSONObject jsonInput;
        String baseLink = base_url + "/channels/" + getIDFromChannel(channel) + "/follows";
        String nextLink = baseLink + "?limit=100";

        com.gmt2001.Console.out.println("FixFollowedTable: Retrieving followers that exist in the time table, this may take some time.");

        /* Perform the lookups. The initial lookup will return the next API endpoint
         * as a _cursor object. Use this to build the next query. We do this to prepare
         * for Twitch API v5 which will require this.
         */
        do {
            jsonInput = GetData(request_type.GET, nextLink, false);
            if (!jsonInput.has("follows")) {
                return;
            }
            insertCtr += PopulateFollowedTable(jsonInput.getJSONArray("follows"), dataStore);

            if (!jsonInput.has("_cursor")) {
                break;
            }
            nextLink = baseLink + "?limit=100&cursor=" + jsonInput.getString("_cursor");

            /* Be kind to Twitch during this process. */
            try {
                Thread.sleep(1000);
            } catch (InterruptedException ex) {
                /* Since it might be possible that we have hundreds, even thousands of calls,
                 * we do not dump even a debug statement here.
                 */
            }
        } while (jsonInput.getJSONArray("follows").length() > 0) ;

        dataStore.RenameFile("followed_fixtable", "followed");
        com.gmt2001.Console.out.println("FixFollowedTable: Pulled followers into the followed table, loaded " + insertCtr + "/" + followerCount + " records.");
    }

    /**
     * Wrapper to perform the followed table updated.  In order to ensure that PhantomBot
     * does not get stuck trying to perform this work, a thread is spawned to perform the
     * work.
     *
     * @param   channel      Name of the channel to lookup data for
     * @param   dataStore   Copy of database object
     * @param   force     Force the run even if the number of followers is too high
     */
    public void FixFollowedTable(String channel, DataStore dataStore, Boolean force) throws JSONException {

        /* Determine number of followers to determine if this should not execute unless forced. */
        JSONObject jsonInput = GetData(request_type.GET, base_url + "/channels/" + getIDFromChannel(channel) + "/follows?limit=1", false);
        if (!jsonInput.has("_total")) {
            com.gmt2001.Console.err.println("Failed to pull follower count for FixFollowedTable");
            return;
        }
        int followerCount = jsonInput.getInt("_total");
        if (followerCount > 10000 && !force) {
            com.gmt2001.Console.out.println("Follower count is above 10,000 (" + followerCount + "). Not executing. You may force this.");
            return;
        }

        try {
            FixFollowedTableRunnable fixFollowedTableRunnable = new FixFollowedTableRunnable(channel, dataStore, followerCount);
            new Thread(fixFollowedTableRunnable, "com.gmt2001.TwitchAPIv5::fixFollowedTable").start();
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to start thread for updating followed table.");
        }
    }

    /**
     * Class for Thread for running the FixFollowedTableWorker job in the background.
     */
    private class FixFollowedTableRunnable implements Runnable {
        private final DataStore dataStore;
        private final String channel;
        private final int followerCount;

        public FixFollowedTableRunnable(String channel, DataStore dataStore, int followerCount) {
            this.channel = channel;
            this.dataStore = dataStore;
            this.followerCount = followerCount;
        }

        @Override
        public void run() {
            try {
                FixFollowedTableWorker(channel, dataStore, followerCount);
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }
    }

    /**
     * Tests the Twitch API to ensure that authentication is good.
     * @return
     */
    public boolean TestAPI() throws JSONException {
        JSONObject jsonObject = GetData(request_type.GET, base_url, false);
        if (jsonObject.has("identified")) {
            return jsonObject.getBoolean("identified");
        }
        return false;
    }

    /**
     * Returns a username when given an Oauth.
     *
     * @param   userOauth      Oauth to check with.
     * @return  String      The name of the user or null to indicate that there was an error.
     */
    public String GetUserFromOauth(String userOauth) throws JSONException {
        JSONObject jsonInput = GetData(request_type.GET, base_url, "", userOauth, false);
        if (jsonInput.has("token")) {
            if (jsonInput.getJSONObject("token").has("user_name")) {
                com.gmt2001.Console.out.println("username = " + jsonInput.getJSONObject("token").getString("user_name"));
                return jsonInput.getJSONObject("token").getString("user_name");
            }
        }
        return null;
    }

    /**
     * Returns the channel Id
     *
     * @param   channel      channel name
     * @return  int      the channel id.
     */
    public int getChannelId(String channel) {
        return Integer.parseUnsignedInt(UsernameCache.instance().getID(channel));
    }
}
