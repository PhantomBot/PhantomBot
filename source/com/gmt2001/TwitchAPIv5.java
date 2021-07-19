/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;
import reactor.core.publisher.Mono;
import tv.phantombot.PhantomBot;
import tv.phantombot.cache.UsernameCache;
import tv.phantombot.twitch.api.Helix;

/**
 * Stubs to @see Helix for backwards compatibility
 *
 * @author gmt2001
 * @author illusionaryone
 */
public class TwitchAPIv5 {

    private static final TwitchAPIv5 instance = new TwitchAPIv5();

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

    /**
     * Gets a channel object
     *
     * @param channel
     * @return
     */
    public JSONObject GetChannel(String channel) throws JSONException {
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

        if (channelData == null || userData == null || followData == null) {
            return result;
        }

        channelData = channelData.getJSONArray("data").getJSONObject(0);
        userData = userData.getJSONArray("data").getJSONObject(0);

        result.put("_id", Long.parseLong(channelData.getString("broadcaster_id")));
        result.put("broadcaster_language", channelData.getString("broadcaster_language"));
        result.put("created_at", userData.getString("created_at"));
        result.put("display_name", channelData.getString("broadcaster_name"));
        result.put("followers", followData.getInt("total"));
        result.put("game", channelData.getString("game_name"));
        result.put("language", channelData.getString("broadcaster_language"));
        result.put("logo", userData.getString("profile_image_url"));
        result.put("mature", false);
        result.put("name", channelData.getString("broadcaster_login"));
        result.put("partner", userData.getString("broadcaster_type").equals("partner"));
        result.put("profile_banner", "");
        result.put("profile_banner_background_color", "");
        result.put("status", channelData.getString("title"));
        result.put("updated_at", "");
        result.put("url", "https://www.twitch.tv/" + channelData.getString("broadcaster_login"));
        result.put("video_banner", "");
        result.put("views", channelData.getLong("view_count"));

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
        return UpdateChannel(channel, status, game, -1);
    }

    public JSONObject UpdateChannel(String channel, String oauth, String status, String game, int delay) throws JSONException {
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
        if (!game.isEmpty()) {
            JSONObject g = SearchGame(game);

            if (g.getBoolean("_success")) {
                if (g.getInt("_http") == 200) {
                    JSONArray a = g.getJSONArray("games");

                    if (a.length() > 0) {
                        boolean found = false;

                        for (int i = 0; i < a.length() && !found; i++) {
                            JSONObject o = a.getJSONObject(i);

                            gn = o.getString("id");

                            if (gn.equalsIgnoreCase(game)) {
                                found = true;
                            }
                        }

                        if (!found) {
                            JSONObject o = a.getJSONObject(0);

                            gn = o.getString("id");
                        }
                    }
                }
            }
        }

        return Helix.instance().updateChannelInformation(this.getIDFromChannel(channel), gn, null, status, delay);
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

        if (gameData == null) {
            return result;
        }

        JSONArray games = new JSONArray();

        for (int i = 0; i < gameData.getJSONArray("data").length(); i++) {
            JSONObject data = gameData.getJSONArray("data").getJSONObject(i);
            String logo = data.getString("box_art_url");

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
            gameo.put("_id", Long.parseLong(data.getString("id")));
            gameo.put("box", boxart);
            gameo.put("giantbomb_id", 0);
            gameo.put("logo", logos);
            gameo.put("name", data.getString("name"));

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

        JSONObject followData = Helix.instance().getUsersFollowsAsync(null, this.getIDFromChannel(channel), limit, null).block();

        if (followData == null) {
            return new JSONObject();
        }

        return this.translateFollowData(followData);
    }

    private JSONObject translateFollowData(JSONObject followData) {
        JSONObject result = new JSONObject();
        JSONArray follows = new JSONArray();

        result.put("_total", followData.getInt("total"));
        result.put("_cursor", followData.getJSONObject("pagination").getString("cursor"));

        for (int i = 0; i < followData.getJSONArray("data").length(); i++) {
            JSONObject data = followData.getJSONArray("data").getJSONObject(i);
            JSONObject follow = new JSONObject();
            follow.put("created_at", data.getString("followed_at"));
            follow.put("notifications", false);

            JSONObject user = new JSONObject();
            user.put("display_name", data.getString("from_name"));
            user.put("_id", data.getString("from_id"));
            user.put("name", data.getString("from_login"));
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

        JSONObject subscriptionData = Helix.instance().getBroadcasterSubscriptionsAsync(this.getIDFromChannel(channel), null, limit, null).block();
        JSONObject result = new JSONObject();
        JSONArray subscriptions = new JSONArray();
        Date now = new Date();

        if (subscriptionData == null) {
            return result;
        }

        result.put("_total", subscriptionData.getInt("total"));

        for (int i = 0; i < subscriptionData.getJSONArray("data").length(); i++) {
            JSONObject data = subscriptionData.getJSONArray("data").getJSONObject(i);
            JSONObject subscription = new JSONObject();
            subscription.put("_id", "");
            subscription.put("created_at", now);
            subscription.put("sub_plan", data.get("tier"));
            subscription.put("sub_plan_name", data.get("plan_name"));

            JSONObject user = new JSONObject();
            user.put("display_name", data.getString("user_name"));
            user.put("_id", data.getString("user_id"));
            user.put("name", data.getString("user_login"));
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
        return GetChannelSubscriptions(channel, limit, offset, ascending);
    }

    /**
     * Gets a stream object
     *
     * @param channel
     * @return
     */
    public JSONObject GetStream(String channel) throws JSONException {
        JSONObject streamData = this.GetStreams(channel);
        return streamData.getJSONArray("streams").length() == 1 ? streamData.getJSONArray("streams").getJSONObject(0) : new JSONObject();
    }

    /**
     * Gets a streams object array. Each channel id should be seperated with a comma.
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

        if (streamData == null || userData == null) {
            return result;
        }

        for (int i = 0; i < streamData.getJSONArray("data").length(); i++) {
            JSONObject data = streamData.getJSONArray("data").getJSONObject(i);
            JSONObject udata = null;

            for (int b = 0; b < userData.getJSONArray("data").length(); b++) {
                if (userData.getJSONArray("data").getJSONObject(i).getString("id").equals(data.getString("user_id"))) {
                    udata = userData.getJSONArray("data").getJSONObject(i);
                    break;
                }
            }

            if (udata == null) {
                continue;
            }

            JSONObject stream = new JSONObject();
            stream.put("_id", Long.parseLong(data.getString("id")));
            stream.put("average_fps", 0);
            stream.put("created_at", data.getString("started_at"));
            stream.put("delay", 0);
            stream.put("game", data.getString("game_name"));
            stream.put("is_playlist", false);
            stream.put("video_height", 0);
            stream.put("viewers", data.getInt("viewer_count"));

            JSONObject channel = new JSONObject();
            channel.put("_id", Long.parseLong(udata.getString("id")));
            channel.put("broadcaster_language", data.getString("language"));
            channel.put("created_at", udata.getString("created_at"));
            channel.put("display_name", udata.getString("display_name"));
            channel.put("followers", 0);
            channel.put("game", data.getString("game_name"));
            channel.put("language", data.getString("language"));
            channel.put("logo", udata.getString("profile_image_url"));
            channel.put("mature", data.getBoolean("is_mature"));
            channel.put("name", udata.getString("login"));
            channel.put("partner", udata.getString("broadcaster_type").equals("partner"));
            channel.put("profile_banner", "");
            channel.put("profile_banner_background_color", "");
            channel.put("status", data.getString("title"));
            channel.put("updated_at", "");
            channel.put("url", "https://www.twitch.tv/" + udata.getString("login"));
            channel.put("video_banner", udata.getString("offline_image_url"));
            channel.put("views", udata.getInt("view_count"));

            JSONObject preview = new JSONObject();
            String img = data.getString("thumbnail_url");
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

        if (userData == null) {
            return new JSONObject();
        }

        return this.translateUserData(userData);
    }

    private JSONObject translateUserData(JSONObject userData) {
        JSONObject result = new JSONObject();
        userData = userData.getJSONArray("data").getJSONObject(0);

        result.put("_id", Long.parseLong(userData.getString("id")));
        result.put("bio", userData.getString("description"));
        result.put("created_at", userData.getString("created_at"));
        result.put("display_name", userData.getString("display_name"));
        result.put("logo", userData.getString("profile_image_url"));
        result.put("name", userData.getString("login"));
        result.put("type", userData.getString("type"));
        result.put("updated_at", "");

        return result;
    }

    /**
     * Gets a user object by ID
     *
     * @param user
     * @return
     */
    public JSONObject GetUserByID(String userID) throws JSONException {
        List<String> user_id = new ArrayList<>();
        user_id.add(userID);
        JSONObject userData = Helix.instance().getUsersAsync(user_id, null).block();

        if (userData == null) {
            return new JSONObject();
        }

        return this.translateUserData(userData);
    }

    /**
     * Runs a commercial. Will fail if channel is not partnered, a commercial has been run in the last 8 minutes, or stream is offline
     *
     * @param channel
     * @param length (30, 60, 90, 120, 150, 180)
     * @return jsonObj.getInt("_http") == 422 if length is invalid or the channel is currently ineligible to run a commercial due to restrictions
     * listed in the method description
     */
    public JSONObject RunCommercial(String channel, int length) throws JSONException {
        JSONObject commercialData = Helix.instance().startCommercialAsync(this.getIDFromChannel(channel), length).block();

        if (commercialData == null) {
            return new JSONObject();
        }

        if (!commercialData.getString("message").isBlank()) {
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
    public JSONObject GetChatUsers(String channel) throws JSONException {
        return new JSONObject(HttpRequest.getData(HttpRequest.RequestType.GET, "https://tmi.twitch.tv/group/user/" + channel + "/chatters", null, null).content);
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

        if (followData == null) {
            return new JSONObject();
        }

        return followData.getInt("total") == 1 ? this.translateFollowData(followData).getJSONArray("follows").getJSONObject(0) : new JSONObject();
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

        if (globalEmoteData == null) {
            return result;
        }

        JSONArray arr = globalEmoteData.getJSONArray("data");

        if (channelEmoteData != null && channelEmoteData.getInt("_http") == 200) {
            channelEmoteData.getJSONArray("data").forEach(obj -> {
                arr.put(obj);
            });
        }

        JSONArray emoticons = new JSONArray();

        for (int i = 0; i < arr.length(); i++) {
            JSONObject data = arr.getJSONObject(i);
            JSONObject emoticon = new JSONObject();
            emoticon.put("id", Long.parseLong(data.getString("id")));
            emoticon.put("regex", data.getString("name"));

            JSONObject images = new JSONObject();
            if (data.has("emote_set_id")) {
                images.put("emoticon_set", Long.parseLong(data.getString("emote_set_id")));
            } else {
                images.put("emoticon_set", 0);
            }

            images.put("height", 28);
            images.put("width", 25);
            images.put("url", data.getJSONObject("images").getString("url_1x"));

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

        if (cheerData == null) {
            return result;
        }

        JSONArray actions = new JSONArray();

        for (int i = 0; i < cheerData.getJSONArray("data").length(); i++) {
            JSONObject data = cheerData.getJSONArray("data").getJSONObject(i);
            JSONObject action = new JSONObject();
            action.put("prefix", data.getString("prefix"));
            action.put("tiers", data.getJSONArray("tiers"));

            JSONArray backgrounds = new JSONArray();
            data.getJSONArray("tiers").getJSONObject(0).getJSONObject("images").keySet().forEach(s -> {
                backgrounds.put(s);
            });

            JSONArray states = new JSONArray();
            data.getJSONArray("tiers").getJSONObject(0).getJSONObject("images").getJSONObject(backgrounds.getString(0)).keySet().forEach(s -> {
                states.put(s);
            });

            JSONArray scales = new JSONArray();
            data.getJSONArray("tiers").getJSONObject(0).getJSONObject("images").getJSONObject(backgrounds.getString(0))
                    .getJSONObject(states.getString(0)).keySet().forEach(s -> {
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
     * @param channel The channel requesting data for
     * @param type The type of data: current, highlights, archives
     * @return String List of Twitch VOD URLs (as a JSON String) or empty String in failure.
     */
    public String GetChannelVODs(String channel, String type) throws JSONException {
        JSONStringer jsonOutput = new JSONStringer();
        JSONObject jsonInput;
        JSONArray jsonArray;

        if (type.equals("current")) {
            jsonInput = this.translateGetChannelVODs(Helix.instance().getVideos(null, this.getIDFromChannel(channel), null, 1, null, null, null, null, "time", "archive"));
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
            jsonInput = this.translateGetChannelVODs(Helix.instance().getVideos(null, this.getIDFromChannel(channel), null, 5, null, null, null, null, "time", "highlight"));
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
            jsonInput = this.translateGetChannelVODs(Helix.instance().getVideos(null, this.getIDFromChannel(channel), null, 5, null, null, null, null, "time", "archive"));
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

    private JSONObject translateGetChannelVODs(JSONObject vodData) {
        return vodData;
    }

    /**
     * Returns when a Twitch account was created.
     *
     * @param channel
     * @return String date-time representation (2015-05-09T00:08:04Z)
     */
    public String getChannelCreatedDate(String channel) throws JSONException {
        JSONObject jsonInput = this.GetUser(channel);
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
        return this.translateGetChannelTeams(Helix.instance().getChannelTeams(this.getIDFromChannel(channelName)));
    }

    private JSONObject translateGetChannelTeams(JSONObject teamsData) {
        return teamsData;
    }

    /**
     * Method that gets a Twitch team.
     *
     * @param teamName
     * @return
     */
    public JSONObject getTeam(String teamName) throws JSONException {
        return this.translateGetTeam(Helix.instance().getTeams(teamName, null));
    }

    private JSONObject translateGetTeam(JSONObject teamData) {
        return teamData;
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
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        String start = sdf.format(c.getTime());
        c.add(Calendar.DAY_OF_MONTH, 1);
        String end = sdf.format(c.getTime());
        return this.translateGetClipsToday(Helix.instance().getClips(null, this.getIDFromChannel(channel), null, 100, null, null, start, end));
    }

    private JSONObject translateGetClipsToday(JSONObject clipsData) {
        return clipsData;
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
            if (dataStore.exists("time", followsArray.getJSONObject(idx).getString("from_name"))) {
                insertCtr++;
                dataStore.set("followed_fixtable", followsArray.getJSONObject(idx).getString("from_name"), "true");
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

            if (!jsonInput.has("pagination") || !jsonInput.getJSONObject("pagination").has("cursor") || jsonInput.getJSONObject("pagination").getString("cursor").isBlank()) {
                break;
            }

            after = jsonInput.getJSONObject("pagination").getString("cursor");

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
    public void FixFollowedTable(String channel, DataStore dataStore, Boolean force) throws JSONException {

        /* Determine number of followers to determine if this should not execute unless forced. */
        JSONObject jsonInput = Helix.instance().getUsersFollows(null, this.getIDFromChannel(channel), 1, null);
        if (!jsonInput.has("total")) {
            com.gmt2001.Console.err.println("Failed to pull follower count for FixFollowedTable");
            return;
        }
        int followerCount = jsonInput.getInt("total");
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
        throw new UnsupportedOperationException();
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
