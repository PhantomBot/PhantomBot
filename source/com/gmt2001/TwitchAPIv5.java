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
package com.gmt2001;

import com.gmt2001.datastore.DataStore;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.URIUtil;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;
import reactor.core.publisher.Mono;
import tv.phantombot.PhantomBot;
import tv.phantombot.cache.UsernameCache;
import tv.phantombot.twitch.api.Helix;

/**
 * Stubs to {@link Helix} for backwards compatibility
 *
 * @author gmt2001
 * @author illusionaryone
 */
@Deprecated
public class TwitchAPIv5 {

    private static final TwitchAPIv5 instance = new TwitchAPIv5();
    private static final Pattern DURATIONREGEX = Pattern.compile("((?<week>[0-9]+)w)?((?<day>[0-9]+)d)?((?<hour>[0-9]+)h)?((?<minute>[0-9]+)m)?((?<second>[0-9]+)s)", Pattern.CASE_INSENSITIVE);

    public static TwitchAPIv5 instance() {
        return instance;
    }

    private TwitchAPIv5() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
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

    public void SetClientID(String clientid) {
    }

    public void SetOAuth(String oauth) {
    }

    public boolean HasOAuth() {
        return true;
    }

    private void setupResult(JSONObject result, JSONObject data, String arrayName) {
        if (data == null) {
            result.put("_success", false);
            result.put("_type", "");
            result.put("_post", "");
            result.put("_url", "");
            result.put("_http", 0);
            result.put("_exception", "NullPointerException");
            result.put("_exceptionMessage", "Data was null");
        } else {
            result.put("_success", data.optBoolean("_success", false));
            result.put("_type", data.optString("_type", ""));
            result.put("_post", data.optString("_post", ""));
            result.put("_url", data.optString("_url", ""));
            result.put("_http", data.optInt("_http", 0));
            result.put("_exception", data.optString("_exception", ""));
            result.put("_exceptionMessage", data.optString("_exceptionMessage", ""));
        }

        if (arrayName != null && !arrayName.isBlank()) {
            result.put(arrayName, new JSONArray());
        }
    }

    /**
     * Gets a channel object
     *
     * @param channel
     * @return
     */
    public JSONObject GetChannel(String channel) throws JSONException {
        return this.GetChannel2(channel, null);
    }

    public JSONObject GetChannel2(String channel, String[] updates) throws JSONException {
        List<String> user_id = new ArrayList<>();
        user_id.add(this.getIDFromChannel(channel));
        Mono<JSONObject> channelDataMono = Helix.instance().getChannelInformationAsync(this.getIDFromChannel(channel));
        Mono<JSONObject> userDataMono = Helix.instance().getUsersAsync(user_id, null);
        Mono<JSONObject> followMono = Helix.instance().getUsersFollowsAsync(null, this.getIDFromChannel(channel), 1, null);

        Mono.when(Arrays.asList(channelDataMono, userDataMono, followMono)).materialize().block();

        JSONObject channelData = channelDataMono.block();
        JSONObject userData = userDataMono.block();
        JSONObject followData = followMono.block();

        JSONObject result = new JSONObject();

        this.setupResult(result, userData, null);
        if (channelData == null || userData == null || followData == null || channelData.has("error") || userData.has("error")
                || followData.has("error") || channelData.isNull("data") || userData.isNull("data")
                || channelData.getJSONArray("data").length() == 0 || userData.getJSONArray("data").length() == 0) {
            result.put("_success", false);
            return result;
        }

        channelData = channelData.getJSONArray("data").getJSONObject(0);
        userData = userData.getJSONArray("data").getJSONObject(0);

        result.put("_id", Long.parseLong(channelData.optString("broadcaster_id")));
        result.put("broadcaster_language", channelData.optString("broadcaster_language"));
        result.put("created_at", userData.optString("created_at"));
        result.put("display_name", channelData.optString("broadcaster_name"));
        result.put("followers", followData.optInt("total", 0));
        result.put("game", updates != null && updates.length > 1 && updates[1] != null && !updates[1].isBlank() ? updates[1] : channelData.optString("game_name"));
        result.put("language", channelData.optString("broadcaster_language"));
        result.put("logo", userData.optString("profile_image_url"));
        result.put("mature", false);
        result.put("name", channelData.optString("broadcaster_login"));
        result.put("partner", userData.optString("broadcaster_type").equals("partner"));
        result.put("profile_banner", "");
        result.put("profile_banner_background_color", "");
        result.put("status", updates != null && updates.length > 0 && updates[0] != null && !updates[0].isBlank() ? updates[0] : channelData.optString("title"));
        result.put("updated_at", "");
        result.put("url", "https://www.twitch.tv/" + channelData.optString("broadcaster_login"));
        result.put("video_banner", "");
        result.put("views", userData.optLong("view_count"));

        return result;
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
        return UpdateChannel(channel, status, game, -1);
    }

    public JSONObject UpdateChannel(String channel, String oauth, String status, String game) throws JSONException {
        if (oauth != null && !oauth.isBlank()) {
            com.gmt2001.Console.warn.println("The oauth parameter in is no longer supported, all requests will now use the apioauth from botlogin.txt");
        }

        return UpdateChannel(channel, status, game, -1);
    }

    public JSONObject UpdateChannel(String channel, String oauth, String status, String game, int delay) throws JSONException {
        if (oauth != null && !oauth.isBlank()) {
            com.gmt2001.Console.warn.println("The oauth parameter in is no longer supported, all requests will now use the apioauth from botlogin.txt");
        }

        return UpdateChannel(channel, status, game, delay);
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
        String gn = null;
        String gnn = null;
        if (!game.isEmpty()) {
            JSONObject g = SearchGame(game);

            if (g.optBoolean("_success")) {
                if (g.optInt("_http") == 200) {
                    JSONArray a = g.getJSONArray("games");

                    if (a.length() > 0) {
                        boolean found = false;

                        for (int i = 0; i < a.length() && !found; i++) {
                            JSONObject o = a.getJSONObject(i);

                            gn = "" + o.optLong("_id");
                            gnn = o.optString("name");

                            if (o.optString("name").equalsIgnoreCase(game)) {
                                found = true;
                            }
                        }

                        if (!found) {
                            JSONObject o = a.getJSONObject(0);

                            gn = "" + o.optLong("_id");
                            gnn = o.optString("name");
                        }
                    }
                }
            }
        }

        JSONObject result = Helix.instance().updateChannelInformation(this.getIDFromChannel(channel), gn, null, status, delay);

        if (result.has("_http") && result.optInt("_http") == 204) {
            return this.GetChannel2(channel, new String[]{status, gnn});
        } else {
            return result;
        }
    }

    /*
     * Updates the channel communities.
     */
    public JSONObject UpdateCommunities(String channel, String[] communities) throws JSONException {
        throw new UnsupportedOperationException("removed by Twitch");
    }

    /*
     * Searches for a game.
     */
    public JSONObject SearchGame(String game) throws JSONException {
        JSONObject gameData = Helix.instance().searchCategoriesAsync(game, 20, null).block();
        JSONObject result = new JSONObject();

        this.setupResult(result, gameData, "games");
        if (gameData == null || gameData.has("error") || gameData.isNull("data")) {
            result.put("_success", false);
            return result;
        }

        JSONArray games = new JSONArray();

        for (int i = 0; i < gameData.getJSONArray("data").length(); i++) {
            JSONObject data = gameData.getJSONArray("data").getJSONObject(i);
            String logo = data.optString("box_art_url");

            JSONObject boxart = new JSONObject();
            boxart.put("template", logo);
            boxart.put("large", logo.replaceAll("\\{width\\}", "272").replaceAll("\\{height\\}", "380"));
            boxart.put("medium", logo.replaceAll("\\{width\\}", "136").replaceAll("\\{height\\}", "190"));
            boxart.put("small", logo.replaceAll("\\{width\\}", "52").replaceAll("\\{height\\}", "72"));

            JSONObject logos = new JSONObject();
            logos.put("template", logo);
            logos.put("large", logo.replaceAll("\\{width\\}", "240").replaceAll("\\{height\\}", "144"));
            logos.put("medium", logo.replaceAll("\\{width\\}", "120").replaceAll("\\{height\\}", "72"));
            logos.put("small", logo.replaceAll("\\{width\\}", "60").replaceAll("\\{height\\}", "36"));

            JSONObject gameo = new JSONObject();
            gameo.put("_id", Long.parseLong(data.optString("id")));
            gameo.put("box", boxart);
            gameo.put("giantbomb_id", 0);
            gameo.put("logo", logos);
            gameo.put("name", data.optString("name"));

            games.put(gameo);
        }

        result.put("games", games);
        return result;
    }

    /*
     * Gets a communities id.
     */
    public JSONObject GetCommunityID(String name) throws JSONException {
        throw new UnsupportedOperationException("removed by Twitch");
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
        if (offset > 0) {
            com.gmt2001.Console.warn.println("The offset parameter in is no longer supported, please update to use pagination from Helix");
        }

        if (ascending) {
            com.gmt2001.Console.warn.println("Sorting in ascending order is no longer supported");
        }

        return this.GetChannelFollows(channel, limit, null);
    }

    /**
     * Gets an object listing the users following a channel
     *
     * @param channel
     * @param limit between 1 and 100
     * @param from
     * @return
     */
    public JSONObject GetChannelFollows(String channel, int limit, String from) throws JSONException {
        JSONObject followData = Helix.instance().getUsersFollowsAsync(null, this.getIDFromChannel(channel), limit, from).block();

        if (followData == null || followData.has("error") || followData.isNull("data")) {
            JSONObject result = new JSONObject();
            this.setupResult(result, followData, "follows");
            result.put("_success", false);
            return result;
        }

        return this.translateFollowData(followData);
    }

    private JSONObject translateFollowData(JSONObject followData) {
        JSONObject result = new JSONObject();
        this.setupResult(result, followData, "follows");
        JSONArray follows = new JSONArray();

        result.put("_total", followData.optInt("total"));
        result.put("_cursor", followData.getJSONObject("pagination").optString("cursor", ""));

        for (int i = 0; i < followData.getJSONArray("data").length(); i++) {
            JSONObject data = followData.getJSONArray("data").getJSONObject(i);
            JSONObject follow = new JSONObject();
            follow.put("created_at", data.optString("followed_at"));
            follow.put("notifications", false);

            JSONObject user = new JSONObject();
            user.put("display_name", data.optString("from_name"));
            user.put("_id", data.optString("from_id"));
            user.put("name", data.optString("from_login"));
            user.put("type", "user");
            user.put("bio", "");
            user.put("created_at", "");
            user.put("updated_at", "");
            user.put("logo", "");

            follow.put("user", user);
            follows.put(follow);
        }

        result.put("follows", follows);
        return result;
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
        if (offset > 0) {
            com.gmt2001.Console.warn.println("The offset parameter in is no longer supported, please update to use pagination from Helix");
        }

        if (ascending) {
            com.gmt2001.Console.warn.println("Sorting in ascending order is no longer supported");
        }

        return this.GetChannelSubscriptions(channel, limit, null);
    }

    /**
     * Gets an object listing the users subscribing to a channel
     *
     * @param channel
     * @param limit between 1 and 100
     * @param from
     * @return
     */
    public JSONObject GetChannelSubscriptions(String channel, int limit, String from) throws JSONException {
        JSONObject subscriptionData = Helix.instance().getBroadcasterSubscriptionsAsync(this.getIDFromChannel(channel), null, limit, from).block();
        JSONObject result = new JSONObject();
        JSONArray subscriptions = new JSONArray();
        Instant now = Instant.now();

        this.setupResult(result, subscriptionData, "subscriptions");
        if (subscriptionData == null || subscriptionData.has("error") || subscriptionData.isNull("data")) {
            result.put("_success", false);
            return result;
        }

        result.put("_total", subscriptionData.optInt("total"));

        for (int i = 0; i < subscriptionData.getJSONArray("data").length(); i++) {
            JSONObject data = subscriptionData.getJSONArray("data").getJSONObject(i);
            JSONObject subscription = new JSONObject();
            subscription.put("_id", "");
            subscription.put("created_at", now);
            subscription.put("sub_plan", data.opt("tier"));
            subscription.put("sub_plan_name", data.opt("plan_name"));

            JSONObject user = new JSONObject();
            user.put("display_name", data.optString("user_name"));
            user.put("_id", data.optString("user_id"));
            user.put("name", data.optString("user_login"));
            user.put("type", "user");
            user.put("bio", "");
            user.put("created_at", "");
            user.put("updated_at", "");
            user.put("logo", "");

            subscription.put("user", user);
            subscriptions.put(subscription);
        }

        result.put("subscriptions", subscriptions);
        return result;
    }

    public JSONObject GetChannelSubscriptions(String channel, int limit, int offset, boolean ascending, String oauth) throws JSONException {
        if (oauth != null && !oauth.isBlank()) {
            com.gmt2001.Console.warn.println("The oauth parameter in is no longer supported, all requests will now use the apioauth from botlogin.txt");
        }

        return this.GetChannelSubscriptions(channel, limit, offset, ascending);
    }

    /**
     * Gets a stream object
     *
     * @param channel
     * @return
     */
    public JSONObject GetStream(String channel) throws JSONException {
        JSONObject streamData = this.GetStreams(this.getIDFromChannel(channel));

        JSONObject result = new JSONObject();
        this.setupResult(result, streamData, null);
        if (streamData == null || streamData.has("error") || !streamData.has("streams")) {
            result.put("_success", false);
            return result;
        }

        if (streamData.getJSONArray("streams").length() == 0) {
            result.put("stream", (String) null);
        } else {
            result.put("stream", streamData.getJSONArray("streams").getJSONObject(0));
        }

        return result;
    }

    /**
     * Gets a streams object array. Each channel id should be separated with a comma.
     *
     * @param channels
     * @return
     */
    public JSONObject GetStreams(String channels) throws JSONException {
        List<String> user_id = new ArrayList<>();
        user_id.addAll(Arrays.asList(channels.split(",")));
        Mono<JSONObject> streamDataMono = Helix.instance().getStreamsAsync(user_id.size(), null, null, user_id, null, null, null);
        Mono<JSONObject> userDataMono = Helix.instance().getUsersAsync(user_id, null);

        Mono.when(Arrays.asList(streamDataMono, userDataMono)).materialize().block();

        JSONObject streamData = streamDataMono.block();
        JSONObject userData = userDataMono.block();

        JSONObject result = new JSONObject();
        JSONArray streams = new JSONArray();

        this.setupResult(result, userData, "streams");
        if (streamData == null || userData == null || streamData.has("error") || userData.has("error")
                || streamData.isNull("data") || userData.isNull("data")) {
            result.put("_success", false);
            return result;
        }

        for (int i = 0; i < streamData.getJSONArray("data").length(); i++) {
            JSONObject data = streamData.getJSONArray("data").getJSONObject(i);
            JSONObject udata = null;

            for (int b = 0; b < userData.getJSONArray("data").length(); b++) {
                if (userData.getJSONArray("data").getJSONObject(b).optString("id").equals(data.optString("user_id"))) {
                    udata = userData.getJSONArray("data").getJSONObject(b);
                    break;
                }
            }

            if (udata == null) {
                continue;
            }

            JSONObject stream = new JSONObject();
            stream.put("_id", Long.parseLong(data.optString("id")));
            stream.put("average_fps", 0);
            stream.put("created_at", data.optString("started_at"));
            stream.put("delay", 0);
            stream.put("game", data.optString("game_name"));
            stream.put("is_playlist", false);
            stream.put("video_height", 0);
            stream.put("viewers", data.optInt("viewer_count"));

            JSONObject channel = new JSONObject();
            channel.put("_id", Long.parseLong(udata.optString("id")));
            channel.put("broadcaster_language", data.optString("language"));
            channel.put("created_at", udata.optString("created_at"));
            channel.put("display_name", udata.optString("display_name"));
            channel.put("followers", 0);
            channel.put("game", data.optString("game_name"));
            channel.put("language", data.optString("language"));
            channel.put("logo", udata.optString("profile_image_url"));
            channel.put("mature", data.optBoolean("is_mature"));
            channel.put("name", udata.optString("login"));
            channel.put("partner", udata.optString("broadcaster_type").equals("partner"));
            channel.put("profile_banner", "");
            channel.put("profile_banner_background_color", "");
            channel.put("status", data.optString("title"));
            channel.put("updated_at", "");
            channel.put("url", "https://www.twitch.tv/" + udata.optString("login"));
            channel.put("video_banner", udata.optString("offline_image_url"));
            channel.put("views", udata.optInt("view_count"));

            JSONObject preview = new JSONObject();
            String img = data.optString("thumbnail_url", "");
            preview.put("template", img);
            preview.put("large", img.replaceAll("\\{width\\}", "640").replaceAll("\\{height\\}", "360"));
            preview.put("medium", img.replaceAll("\\{width\\}", "320").replaceAll("\\{height\\}", "180"));
            preview.put("small", img.replaceAll("\\{width\\}", "80").replaceAll("\\{height\\}", "45"));

            stream.put("channel", channel);
            stream.put("preview", preview);
            streams.put(stream);
        }

        result.put("streams", streams);
        return result;
    }

    /**
     * Gets the communities object array.
     *
     * @param channel
     * @return
     */
    public JSONObject GetCommunities(String channel) throws JSONException {
        throw new UnsupportedOperationException("removed by Twitch");
    }

    /**
     * Gets a user object by user name
     *
     * @param user
     * @return
     */
    public JSONObject GetUser(String user) throws JSONException {
        List<String> user_login = new ArrayList<>();
        user_login.add(user);
        JSONObject userData = Helix.instance().getUsersAsync(null, user_login).block();

        if (userData == null || userData.has("error") || userData.isNull("data") || userData.getJSONArray("data").length() == 0) {
            JSONObject result = new JSONObject();
            this.setupResult(result, userData, "users");
            result.put("_success", false);
            return result;
        }

        return this.translateUserData(userData);
    }

    private JSONObject translateUserData(JSONObject userData) {
        JSONObject result = new JSONObject();
        JSONArray users = new JSONArray();
        this.setupResult(result, userData, "users");

        if (userData == null || userData.has("error") || userData.isNull("data")) {
            result.put("_success", false);
            return result;
        }

        for (int i = 0; i < userData.getJSONArray("data").length(); i++) {
            JSONObject data = userData.getJSONArray("data").getJSONObject(i);
            JSONObject user = new JSONObject();

            user.put("_id", data.optString("id"));
            user.put("bio", data.optString("description"));
            user.put("created_at", data.optString("created_at"));
            user.put("display_name", data.optString("display_name"));
            user.put("logo", data.optString("profile_image_url"));
            user.put("name", data.optString("login"));
            user.put("type", data.optString("type"));
            user.put("updated_at", "");

            users.put(user);
        }

        result.put("_total", users.length());
        result.put("users", users);
        return result;
    }

    /**
     * Gets a user object by ID
     *
     * @param userID
     * @return
     */
    public JSONObject GetUserByID(String userID) throws JSONException {
        List<String> user_id = new ArrayList<>();
        user_id.add(userID);
        JSONObject userData = Helix.instance().getUsersAsync(user_id, null).block();

        JSONObject result = new JSONObject();
        this.setupResult(result, userData, null);
        if (userData == null || userData.has("error") || userData.isNull("data") || userData.getJSONArray("data").length() == 0) {
            result.put("_success", false);
            return result;
        }

        JSONObject r2 = this.translateUserData(userData);

        if (r2.has("users") && r2.getJSONArray("users").length() > 0) {
            result = r2.getJSONArray("users").getJSONObject(0);
            this.setupResult(result, userData, null);
        }

        return result;
    }

    /**
     * Runs a commercial. Will fail if channel is not partnered, a commercial has been run in the last 8 minutes, or stream is offline
     *
     * @param channel
     * @param length (30, 60, 90, 120, 150, 180)
     * @return jsonObj.optInt("_http") == 422 if length is invalid or the channel is currently ineligible to run a commercial due to restrictions
     * listed in the method description
     */
    public JSONObject RunCommercial(String channel, int length) throws JSONException {
        JSONObject commercialData = Helix.instance().startCommercialAsync(this.getIDFromChannel(channel), length).block();

        if (commercialData == null) {
            commercialData = new JSONObject();
            commercialData.put("_http", 422);
            commercialData.put("_success", false);
            this.setupResult(commercialData, commercialData, null);
        }

        if (commercialData.has("error") || (commercialData.has("message") && !commercialData.optString("message").isBlank())) {
            commercialData.put("_http", 422);
        }

        return commercialData;
    }

    /**
     * Gets a list of users in the channel
     *
     * @param channel
     * @return
     */
    @SuppressWarnings("UseSpecificCatch")
    public JSONObject GetChatUsers(String channel) {
        JSONObject jsonResult = new JSONObject("{}");
        String endpoint = "https://tmi.twitch.tv/group/user/" + channel + "/chatters";

        try {
            HttpClientResponse response = HttpClient.get(URIUtil.create(endpoint));

            if (response.hasJson()) {
                jsonResult = response.json();
                HttpRequest.generateJSONObject(jsonResult, true, "GET", "", endpoint, response.responseCode().code(), null, null);
            } else {
                jsonResult.put("error", response.responseBody());
                HttpRequest.generateJSONObject(jsonResult, true, "GET", "", endpoint, response.responseCode().code(), null, null);
            }
        } catch (Exception ex) {
            HttpRequest.generateJSONObject(jsonResult, false, "GET", "", endpoint, 0, ex.getClass().getName(), ex.getMessage());
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return jsonResult;
    }

    /**
     * Checks if a user is following a channel
     *
     * @param user
     * @param channel
     * @return
     */
    public JSONObject GetUserFollowsChannel(String user, String channel) throws JSONException {
        JSONObject followData = Helix.instance().getUsersFollowsAsync(this.getIDFromChannel(user), this.getIDFromChannel(channel), 1, null).block();

        JSONObject result = new JSONObject();
        this.setupResult(result, followData, null);

        if (followData != null && !followData.has("error") && followData.has("total") && followData.optInt("total") == 1) {
            result = this.translateFollowData(followData).getJSONArray("follows").getJSONObject(0);
            this.setupResult(result, followData, null);
        } else {
            result.put("_http", 404);
            result.put("error", "Not Found");
            result.put("message", user + " is not following " + channel);
            result.put("status", 404);
        }

        return result;
    }

    /**
     * Gets the full list of emotes from Twitch
     *
     * @return
     */
    public JSONObject GetEmotes() throws JSONException {
        JSONObject globalEmoteData = Helix.instance().getGlobalEmotesAsync().block();
        JSONObject channelEmoteData = Helix.instance().getChannelEmotesAsync(this.getIDFromChannel(PhantomBot.instance().getChannelName())).block();
        JSONObject result = new JSONObject();

        this.setupResult(result, globalEmoteData, "emoticons");
        if (globalEmoteData == null || globalEmoteData.has("error") || globalEmoteData.isNull("data")) {
            result.put("_success", false);
            return result;
        }

        JSONArray arr = globalEmoteData.getJSONArray("data");

        if (channelEmoteData != null && !channelEmoteData.has("error") && channelEmoteData.optInt("_http") == 200) {
            channelEmoteData.getJSONArray("data").forEach(obj -> {
                arr.put(obj);
            });
        }

        JSONArray emoticons = new JSONArray();

        for (int i = 0; i < arr.length(); i++) {
            JSONObject data = arr.getJSONObject(i);
            JSONObject emoticon = new JSONObject();
            emoticon.put("id", Long.parseLong(data.optString("id")));
            emoticon.put("regex", data.optString("name"));

            JSONObject images = new JSONObject();
            if (data.has("emote_set_id")) {
                images.put("emoticon_set", Long.parseLong(data.optString("emote_set_id")));
            } else {
                images.put("emoticon_set", 0);
            }

            images.put("height", 28);
            images.put("width", 25);
            images.put("url", data.getJSONObject("images").optString("url_1x"));

            emoticon.put("images", images);
            emoticons.put(emoticon);
        }

        result.put("emoticons", emoticons);
        return result;
    }

    /**
     * Gets the list of cheer emotes from Twitch
     *
     * @return
     */
    public JSONObject GetCheerEmotes() throws JSONException {
        JSONObject cheerData = Helix.instance().getCheermotesAsync(null).block();
        JSONObject result = new JSONObject();

        this.setupResult(result, cheerData, "actions");
        if (cheerData == null || cheerData.has("error") || cheerData.isNull("data")) {
            result.put("_success", false);
            return result;
        }

        JSONArray actions = new JSONArray();

        for (int i = 0; i < cheerData.getJSONArray("data").length(); i++) {
            JSONObject data = cheerData.getJSONArray("data").getJSONObject(i);
            JSONObject action = new JSONObject();
            action.put("prefix", data.optString("prefix"));
            action.put("tiers", data.getJSONArray("tiers"));

            JSONArray backgrounds = new JSONArray();
            data.getJSONArray("tiers").getJSONObject(0).getJSONObject("images").keySet().forEach(s -> {
                backgrounds.put(s);
            });

            JSONArray states = new JSONArray();
            data.getJSONArray("tiers").getJSONObject(0).getJSONObject("images").getJSONObject(backgrounds.optString(0)).keySet().forEach(s -> {
                states.put(s);
            });

            JSONArray scales = new JSONArray();
            data.getJSONArray("tiers").getJSONObject(0).getJSONObject("images").getJSONObject(backgrounds.optString(0))
                    .getJSONObject(states.optString(0)).keySet().forEach(s -> {
                scales.put(s);
            });

            action.put("backgrounds", backgrounds);
            action.put("states", states);
            action.put("scales", scales);
            actions.put(action);
        }

        result.put("actions", actions);
        return result;
    }

    private String cheerEmotes = "";

    /**
     * Builds a RegExp String to match cheer emotes from Twitch
     *
     * @return
     */
    public String GetCheerEmotesRegex() throws JSONException {
        String[] emoteList;
        JSONObject jsonInput;
        JSONArray jsonArray;

        if (cheerEmotes.isBlank()) {
            jsonInput = GetCheerEmotes();
            if (jsonInput.has("actions")) {
                jsonArray = jsonInput.getJSONArray("actions");
                emoteList = new String[jsonArray.length()];
                for (int idx = 0; idx < jsonArray.length(); idx++) {
                    emoteList[idx] = "\\b" + jsonArray.getJSONObject(idx).optString("prefix") + "\\d+\\b";
                }
                cheerEmotes = String.join("|", emoteList);
            }
        }
        return cheerEmotes;
    }

    /**
     * Gets the list of VODs from Twitch
     *
     * @param channel The channel requesting data for
     * @param type The type of data: current, highlights, archives
     * @return String List of Twitch VOD URLs (as a JSON String) or empty String in failure.
     */
    public String GetChannelVODs(String channel, String type) throws JSONException {
        JSONStringer jsonOutput = new JSONStringer();
        JSONObject jsonInput;
        JSONArray jsonArray;

        if (type.equals("current")) {
            jsonInput = this.translateChannelVODs(Helix.instance().getVideos(null, this.getIDFromChannel(channel), null, 1, null, null, null, null, "time", "archive"));
            if (jsonInput.has("videos")) {
                jsonArray = jsonInput.getJSONArray("videos");
                if (jsonArray.length() > 0) {
                    jsonOutput.object().key("videos").array().object();
                    jsonOutput.key("url").value(jsonArray.getJSONObject(0).optString("url"));
                    jsonOutput.key("published_at").value(jsonArray.getJSONObject(0).optString("published_at"));
                    jsonOutput.key("length").value(jsonArray.getJSONObject(0).optInt("length"));
                    jsonOutput.endObject().endArray().endObject();
                    com.gmt2001.Console.debug.println("TwitchAPIv5::GetChannelVODs: " + jsonOutput.toString());
                    if (jsonOutput.toString() == null) {
                        return "";
                    }
                    return jsonOutput.toString();
                }
            }
        }

        if (type.equals("highlights")) {
            jsonInput = this.translateChannelVODs(Helix.instance().getVideos(null, this.getIDFromChannel(channel), null, 5, null, null, null, null, "time", "highlight"));
            if (jsonInput.has("videos")) {
                jsonArray = jsonInput.getJSONArray("videos");
                if (jsonArray.length() > 0) {
                    jsonOutput.object().key("videos").array();
                    for (int idx = 0; idx < jsonArray.length(); idx++) {
                        jsonOutput.object();
                        jsonOutput.key("url").value(jsonArray.getJSONObject(idx).optString("url"));
                        jsonOutput.key("published_at").value(jsonArray.getJSONObject(idx).optString("published_at"));
                        jsonOutput.key("length").value(jsonArray.getJSONObject(idx).optInt("length"));
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
            jsonInput = this.translateChannelVODs(Helix.instance().getVideos(null, this.getIDFromChannel(channel), null, 5, null, null, null, null, "time", "archive"));
            if (jsonInput.has("videos")) {
                jsonArray = jsonInput.getJSONArray("videos");
                if (jsonArray.length() > 0) {
                    jsonOutput.object().key("videos").array();
                    for (int idx = 0; idx < jsonArray.length(); idx++) {
                        jsonOutput.object();
                        jsonOutput.key("url").value(jsonArray.getJSONObject(idx).optString("url"));
                        jsonOutput.key("published_at").value(jsonArray.getJSONObject(idx).optString("published_at"));
                        jsonOutput.key("length").value(jsonArray.getJSONObject(idx).optInt("length"));
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

    private int durationToLength(String duration) {
        int length = 0;
        Matcher m = DURATIONREGEX.matcher(duration);
        String s;

        try {
            while (m.find()) {
                s = m.group("week");
                if (s != null && !s.isBlank()) {
                    length += Integer.parseInt(s) * 604800;
                }

                s = m.group("day");
                if (s != null && !s.isBlank()) {
                    length += Integer.parseInt(s) * 86400;
                }

                s = m.group("hour");
                if (s != null && !s.isBlank()) {
                    length += Integer.parseInt(s) * 3600;
                }

                s = m.group("minute");
                if (s != null && !s.isBlank()) {
                    length += Integer.parseInt(s) * 60;
                }

                s = m.group("second");
                if (s != null && !s.isBlank()) {
                    length += Integer.parseInt(s);
                }
            }
        } catch (NumberFormatException e) {
        }

        return length;
    }

    private JSONObject translateChannelVODs(JSONObject vodData) {
        JSONObject result = new JSONObject();
        JSONArray videos = new JSONArray();

        this.setupResult(result, vodData, "videos");
        if (vodData == null || vodData.has("error") || vodData.isNull("data")) {
            result.put("_success", false);
            return result;
        }

        for (int i = 0; i < vodData.getJSONArray("data").length(); i++) {
            JSONObject data = vodData.getJSONArray("data").getJSONObject(i);
            JSONObject video = new JSONObject();

            video.put("_id", "v" + data.optString("id"));
            video.put("broadcast_id", data.optString("stream_id", null));
            video.put("broadcast_type", data.optString("type"));
            video.put("created_at", data.optString("created_at"));
            video.put("description", data.optString("description"));
            video.put("description_html", data.optString("description") + "<br>");
            video.put("game", "");
            video.put("language", data.optString("language"));
            video.put("length", this.durationToLength(data.optString("duration")));
            video.put("published_at", data.optString("published_at"));
            video.put("status", "recorded");
            video.put("tag_list", "");
            video.put("title", data.optString("title"));
            video.put("url", data.optString("url"));
            video.put("viewable", data.optString("viewable"));
            video.put("viewable_at", "");
            video.put("views", data.optInt("view_count"));

            JSONObject channel = new JSONObject();
            channel.put("_id", data.optString("user_id"));
            channel.put("display_name", data.optString("user_name"));
            channel.put("name", data.optString("user_login"));

            JSONObject fps = new JSONObject();
            fps.put("chunked", 60.0);
            fps.put("high", 30.0);
            fps.put("low", 30.0);
            fps.put("medium", 30.0);
            fps.put("mobile", 30.0);

            JSONObject preview = new JSONObject();
            String img = data.optString("thumbnail_url", "");
            preview.put("template", img);
            preview.put("large", img.replaceAll("\\{width\\}", "640").replaceAll("\\{height\\}", "360"));
            preview.put("medium", img.replaceAll("\\{width\\}", "320").replaceAll("\\{height\\}", "180"));
            preview.put("small", img.replaceAll("\\{width\\}", "80").replaceAll("\\{height\\}", "45"));

            JSONObject resolutions = new JSONObject();
            resolutions.put("chunked", "1920x1080");
            resolutions.put("high", "1280x720");
            resolutions.put("low", "640x360");
            resolutions.put("medium", "852x480");
            resolutions.put("mobile", "400x226");

            video.put("channel", channel);
            video.put("fps", fps);
            video.put("preview", preview);
            video.put("resolutions", resolutions);
            video.put("thumbnails", new JSONObject());
            videos.put(video);
        }

        result.put("_total", videos.length());
        result.put("videos", videos);
        return result;
    }

    /**
     * Returns when a Twitch account was created.
     *
     * @param channel
     * @return String date-time representation (2015-05-09T00:08:04Z)
     */
    public String getChannelCreatedDate(String channel) throws JSONException {
        List<String> user_login = new ArrayList<>();
        user_login.add(channel);
        JSONObject userData = Helix.instance().getUsersAsync(null, user_login).block();

        if (userData == null || !userData.optBoolean("_success") || userData.has("error") || userData.isNull("data")
                || userData.getJSONArray("data").length() == 0) {
            return "ERROR";
        }

        return userData.getJSONArray("data").getJSONObject(0).optString("created_at");
    }

    /**
     * Method that gets the teams that the channel is in.
     *
     * @param channelName
     * @return
     */
    public JSONObject getChannelTeams(String channelName) throws JSONException {
        JSONObject result = new JSONObject();
        JSONObject teamsData = Helix.instance().getChannelTeamsAsync(this.getIDFromChannel(channelName)).block();

        this.setupResult(result, teamsData, "teams");
        if (teamsData == null || teamsData.has("error") || teamsData.isNull("data")) {
            result.put("_success", false);
            return result;
        }

        JSONArray teams = new JSONArray();

        for (int i = 0; i < teamsData.getJSONArray("data").length(); i++) {
            JSONObject data = teamsData.getJSONArray("data").getJSONObject(i);
            JSONObject team = new JSONObject();

            team.put("_id", Long.parseLong(data.optString("id")));
            team.put("background", data.optString("background_image_url"));
            team.put("banner", data.optString("banner"));
            team.put("created_at", data.optString("created_at"));
            team.put("display_name", data.optString("team_display_name"));
            team.put("info", data.optString("info"));
            team.put("logo", data.optString("thumbnail_url"));
            team.put("name", data.optString("team_name"));
            team.put("updated_at", data.optString("updated_at"));

            teams.put(team);
        }

        result.put("teams", teams);
        return result;
    }

    /**
     * Method that gets a Twitch team.
     *
     * @param teamName
     * @return
     */
    public JSONObject getTeam(String teamName) throws JSONException {
        JSONObject result = new JSONObject();
        JSONObject teamsData = Helix.instance().getTeamsAsync(teamName, null).block();

        this.setupResult(result, teamsData, "users");
        if (teamsData == null || teamsData.has("error") || teamsData.isNull("data") || teamsData.getJSONArray("data").length() == 0) {
            result.put("_success", false);
            return result;
        }

        teamsData = teamsData.getJSONArray("data").getJSONObject(0);

        result.put("_id", Long.parseLong(teamsData.optString("id")));
        result.put("background", teamsData.optString("background_image_url"));
        result.put("banner", teamsData.optString("banner"));
        result.put("created_at", teamsData.optString("created_at"));
        result.put("display_name", teamsData.optString("team_display_name"));
        result.put("info", teamsData.optString("info"));
        result.put("logo", teamsData.optString("thumbnail_url"));
        result.put("name", teamsData.optString("team_name"));
        result.put("updated_at", teamsData.optString("updated_at"));

        JSONArray users = new JSONArray();

        for (int i = 0; i < teamsData.getJSONArray("users").length(); i++) {
            JSONObject userData = teamsData.getJSONArray("users").getJSONObject(i);
            JSONObject user = new JSONObject();

            user.put("_id", Long.parseLong(userData.optString("user_id")));
            user.put("broadcaster_language", "");
            user.put("created_at", "");
            user.put("display_name", userData.optString("user_name"));
            user.put("followers", 0);
            user.put("game", "");
            user.put("language", "");
            user.put("logo", "");
            user.put("mature", false);
            user.put("name", userData.optString("user_login"));
            user.put("partner", false);
            user.put("profile_banner", "");
            user.put("profile_banner_background_color", "");
            user.put("status", "");
            user.put("updated_at", "");
            user.put("url", "https://www.twitch.tv/" + userData.optString("user_login"));
            user.put("video_banner", "");
            user.put("views", 0);

            users.put(user);
        }

        result.put("users", users);
        return result;
    }

    /**
     * Checks to see if the bot account is verified by Twitch.
     *
     * @param channel
     * @return boolean true if verified
     */
    public boolean getBotVerified(String channel) throws JSONException {
        throw new UnsupportedOperationException("removed by Twitch");
    }

    /**
     * Get the clips from today for a channel.
     *
     * @param channel
     * @return JSONObject clips object.
     */
    public JSONObject getClipsToday(String channel) throws JSONException {
        ZonedDateTime started_at = ZonedDateTime.now().withHour(0).withMinute(0).withSecond(0);
        ZonedDateTime ended_at = started_at.plusDays(1);

        JSONObject result = new JSONObject();
        JSONObject clipsData = Helix.instance().getClipsAsync(null, this.getIDFromChannel(channel), null, 100, null, null, started_at, ended_at).block();

        this.setupResult(result, clipsData, "clips");
        if (clipsData == null || clipsData.has("error") || clipsData.isNull("data")) {
            result.put("_success", false);
            return result;
        }

        JSONArray clips = new JSONArray();

        for (int i = 0; i < clipsData.getJSONArray("data").length(); i++) {
            JSONObject data = clipsData.getJSONArray("data").getJSONObject(i);
            JSONObject clip = new JSONObject();

            clip.put("slug", data.optString("id"));
            clip.put("tracking_id", "");
            clip.put("url", data.optString("url"));
            clip.put("embed_url", data.optString("embed_url"));
            clip.put("embed_html", "<iframe src='" + data.optString("embed_url") + "' width='640' height='360' frameborder='0' scrolling='no' allowfullscreen='true'></iframe>");
            clip.put("game", "game_id:" + data.optString("game_id"));
            clip.put("language", data.optString("language"));
            clip.put("title", data.optString("title"));
            clip.put("views", data.optInt("view_count"));
            clip.put("duration", data.optFloat("duration"));
            clip.put("created_at", data.optString("created_at"));

            JSONObject broadcaster = new JSONObject();
            broadcaster.put("id", data.optString("broadcaster_id"));
            broadcaster.put("name", data.optString("broadcaster_name"));
            broadcaster.put("display_name", data.optString("broadcaster_name"));
            broadcaster.put("channel_url", "https://www.twitch.tv/" + data.optString("broadcaster_name"));
            broadcaster.put("logo", "");

            JSONObject curator = new JSONObject();
            curator.put("id", data.optString("creator_id"));
            curator.put("name", data.optString("creator_name"));
            curator.put("display_name", data.optString("creator_name"));
            curator.put("channel_url", "https://www.twitch.tv/" + data.optString("creator_name"));
            curator.put("logo", "");

            JSONObject vod = new JSONObject();
            vod.put("id", data.optString("video_id"));
            vod.put("url", "https://www.twitch.tv/videos/" + data.optString("video_id"));

            JSONObject thumbnails = new JSONObject();
            thumbnails.put("medium", data.optString("thumbnail_url"));
            thumbnails.put("small", data.optString("thumbnail_url"));
            thumbnails.put("tiny", data.optString("thumbnail_url"));

            clip.put("broadcaster", broadcaster);
            clip.put("curator", curator);
            clip.put("vod", vod);
            clip.put("thumbnails", thumbnails);
            clips.put(clip);
        }

        result.put("clips", clips);
        return result;
    }

    /**
     * Populates the followed table from a JSONArray. The database auto commit is disabled as otherwise the large number of writes in a row can cause
     * some delay. We only update the followed table if the user has an entry in the time table. This way we do not potentially enter thousands, or
     * tens of thousands, or even more, entries into the followed table for folks that do not visit the stream.
     *
     * @param JSONArray JSON array object containing the followers data
     * @param DataStore Copy of database object for writing
     * @return int How many objects were inserted into the database
     */
    private int PopulateFollowedTable(JSONArray followsArray, DataStore dataStore) throws JSONException {
        int insertCtr = 0;
        for (int idx = 0; idx < followsArray.length(); idx++) {
            if (dataStore.exists("time", followsArray.getJSONObject(idx).optString("from_name"))) {
                insertCtr++;
                dataStore.set("followed_fixtable", followsArray.getJSONObject(idx).optString("from_name"), "true");
            }
        }
        return insertCtr;
    }

    /**
     * Updates the followed table with a complete list of followers. This should only ever be executed once, when the database does not have complete
     * list of followers.
     *
     * @param String ID of the channel to lookup data for
     * @param DataStore Copy of database object for reading data from
     * @param int Total number of followers reported from Twitch API
     */
    @SuppressWarnings("SleepWhileInLoop")
    private void FixFollowedTableWorker(String channelId, DataStore dataStore, int followerCount) throws JSONException {
        int insertCtr = 0;
        JSONObject jsonInput;
        String after = null;

        com.gmt2001.Console.out.println("FixFollowedTable: Retrieving followers that exist in the time table, this may take some time.");

        /* Perform the lookups. The initial lookup will return the next API endpoint
         * as a _cursor object. Use this to build the next query. We do this to prepare
         * for Twitch API v5 which will require this.
         */
        do {
            jsonInput = Helix.instance().getUsersFollows(null, channelId, 100, after);
            if (!jsonInput.has("data")) {
                return;
            }

            insertCtr += PopulateFollowedTable(jsonInput.getJSONArray("data"), dataStore);

            if (!jsonInput.has("pagination") || !jsonInput.getJSONObject("pagination").has("cursor") || jsonInput.getJSONObject("pagination").optString("cursor").isBlank()) {
                break;
            }

            after = jsonInput.getJSONObject("pagination").optString("cursor");

            /* Be kind to Twitch during this process. */
            try {
                Thread.sleep(1000);
            } catch (InterruptedException ex) {
                /* Since it might be possible that we have hundreds, even thousands of calls,
                 * we do not dump even a debug statement here.
                 */
            }
        } while (!jsonInput.getJSONArray("data").isEmpty());

        dataStore.RenameFile("followed_fixtable", "followed");
        com.gmt2001.Console.out.println("FixFollowedTable: Pulled followers into the followed table, loaded " + insertCtr + "/" + followerCount + " records.");
    }

    /**
     * Wrapper to perform the followed table updated. In order to ensure that PhantomBot does not get stuck trying to perform this work, a thread is
     * spawned to perform the work.
     *
     * @param channel Name of the channel to lookup data for
     * @param dataStore Copy of database object
     * @param force Force the run even if the number of followers is too high
     */
    public void FixFollowedTable(String channel, DataStore dataStore, boolean force) throws JSONException {

        /* Determine number of followers to determine if this should not execute unless forced. */
        JSONObject jsonInput = Helix.instance().getUsersFollows(null, this.getIDFromChannel(channel), 1, null);
        if (!jsonInput.has("total")) {
            com.gmt2001.Console.err.println("Failed to pull follower count for FixFollowedTable");
            return;
        }
        int followerCount = jsonInput.optInt("total");
        if (followerCount > 10000 && !force) {
            com.gmt2001.Console.out.println("Follower count is above 10,000 (" + followerCount + "). Not executing. You may force this.");
            return;
        }

        try {
            FixFollowedTableRunnable fixFollowedTableRunnable = new FixFollowedTableRunnable(this.getIDFromChannel(channel), dataStore, followerCount);
            new Thread(fixFollowedTableRunnable, "com.gmt2001.TwitchAPIv5::fixFollowedTable").start();
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to start thread for updating followed table.");
        }
    }

    /**
     * Tests the Twitch API to ensure that authentication is good.
     *
     * @return
     */
    public boolean TestAPI() throws JSONException {
        return true;
    }

    /**
     * Returns a username when given an Oauth.
     *
     * @param userOauth Oauth to check with.
     * @return String The name of the user or null to indicate that there was an error.
     */
    public String GetUserFromOauth(String userOauth) throws JSONException {
        throw new UnsupportedOperationException("The oauth parameter in is no longer supported");
    }

    /**
     * Returns the channel Id
     *
     * @param channel channel name
     * @return int the channel id.
     */
    public int getChannelId(String channel) {
        return Integer.parseUnsignedInt(this.getIDFromChannel(channel));
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
}
