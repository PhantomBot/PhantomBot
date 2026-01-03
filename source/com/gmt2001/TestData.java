/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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

import java.util.List;

import org.json.JSONObject;

import com.gmt2001.twitch.cache.ViewerCache;

/**
 * Provides testing data
 *
 * @author gmt2001
 */
public final class TestData {
    private TestData(){}

    /**
     * A list of redeemable IDs from {@link #RedeemableIds()} and {@link #AddedRedeemableId()}
     *
     * @return the list
     */
    public static List<String> AllRedeemableIds() {
        List<String> ids = RedeemableIds();
        ids.add(AddedRedeemableId());
        return ids;
    }

    /**
     * A list of redeemable objects from {@link #Redeemables()} and {@link #AddedRedeemable()}
     *
     * @return the list
     */
    public static List<JSONObject> AllRedeemables() {
        List<JSONObject> objs = Redeemables();
        objs.add(AddedRedeemable());
        return objs;
    }

    /**
     * A list of redeemable IDs
     *
     * @return the list
     */
    public static List<String> RedeemableIds() {
        return List.of("92af127c-7326-4483-a52b-b0da0be61c01", "92af127c-7326-4483-a52b-b0da0be69204");
    }

    /**
     * A list of redeemable objects
     *
     * @return the list
     */
    public static List<JSONObject> Redeemables() {
        return List.of(new JSONObject("{\r\n" + //
                "      \"broadcaster_name\": \"CoolDude\",\r\n" + //
                "      \"broadcaster_login\": \"cooldude\",\r\n" + //
                "      \"broadcaster_id\": \"\" + ViewerCache.instance().broadcaster().id() + \"\",\r\n" + //
                "      \"id\": \"92af127c-7326-4483-a52b-b0da0be61c01\",\r\n" + //
                "      \"image\": null,\r\n" + //
                "      \"background_color\": \"#00E5CB\",\r\n" + //
                "      \"is_enabled\": true,\r\n" + //
                "      \"cost\": 50000,\r\n" + //
                "      \"title\": \"game analysis\",\r\n" + //
                "      \"prompt\": \"\",\r\n" + //
                "      \"is_user_input_required\": false,\r\n" + //
                "      \"max_per_stream_setting\": {\r\n" + //
                "        \"is_enabled\": false,\r\n" + //
                "        \"max_per_stream\": 0\r\n" + //
                "      },\r\n" + //
                "      \"max_per_user_per_stream_setting\": {\r\n" + //
                "        \"is_enabled\": true,\r\n" + //
                "        \"max_per_user_per_stream\": 5\r\n" + //
                "      },\r\n" + //
                "      \"global_cooldown_setting\": {\r\n" + //
                "        \"is_enabled\": false,\r\n" + //
                "        \"global_cooldown_seconds\": 0\r\n" + //
                "      },\r\n" + //
                "      \"is_paused\": false,\r\n" + //
                "      \"is_in_stock\": true,\r\n" + //
                "      \"default_image\": {\r\n" + //
                "        \"url_1x\": \"https://static-cdn.jtvnw.net/custom-reward-images/default-1.png\",\r\n" + //
                "        \"url_2x\": \"https://static-cdn.jtvnw.net/custom-reward-images/default-2.png\",\r\n" + //
                "        \"url_4x\": \"https://static-cdn.jtvnw.net/custom-reward-images/default-4.png\"\r\n" + //
                "      },\r\n" + //
                "      \"should_redemptions_skip_request_queue\": false,\r\n" + //
                "      \"redemptions_redeemed_current_stream\": null,\r\n" + //
                "      \"cooldown_expires_at\": null\r\n" + //
                "    }"),
                new JSONObject("{\r\n" + //
                        "      \"broadcaster_name\": \"CoolDude\",\r\n" + //
                        "      \"broadcaster_login\": \"cooldude\",\r\n" + //
                        "      \"broadcaster_id\": \"\" + ViewerCache.instance().broadcaster().id() + \"\",\r\n" + //
                        "      \"id\": \"92af127c-7326-4483-a52b-b0da0be69204\",\r\n" + //
                        "      \"image\": null,\r\n" + //
                        "      \"background_color\": \"#0000CB\",\r\n" + //
                        "      \"is_enabled\": true,\r\n" + //
                        "      \"cost\": 1000,\r\n" + //
                        "      \"title\": \"something cool\",\r\n" + //
                        "      \"prompt\": \"it's happening!\",\r\n" + //
                        "      \"is_user_input_required\": false,\r\n" + //
                        "      \"max_per_stream_setting\": {\r\n" + //
                        "        \"is_enabled\": true,\r\n" + //
                        "        \"max_per_stream\": 2\r\n" + //
                        "      },\r\n" + //
                        "      \"max_per_user_per_stream_setting\": {\r\n" + //
                        "        \"is_enabled\": false,\r\n" + //
                        "        \"max_per_user_per_stream\": 0\r\n" + //
                        "      },\r\n" + //
                        "      \"global_cooldown_setting\": {\r\n" + //
                        "        \"is_enabled\": true,\r\n" + //
                        "        \"global_cooldown_seconds\": 30\r\n" + //
                        "      },\r\n" + //
                        "      \"is_paused\": false,\r\n" + //
                        "      \"is_in_stock\": true,\r\n" + //
                        "      \"default_image\": {\r\n" + //
                        "        \"url_1x\": \"https://static-cdn.jtvnw.net/custom-reward-images/default-1.png\",\r\n" + //
                        "        \"url_2x\": \"https://static-cdn.jtvnw.net/custom-reward-images/default-2.png\",\r\n" + //
                        "        \"url_4x\": \"https://static-cdn.jtvnw.net/custom-reward-images/default-4.png\"\r\n" + //
                        "      },\r\n" + //
                        "      \"should_redemptions_skip_request_queue\": true,\r\n" + //
                        "      \"redemptions_redeemed_current_stream\": null,\r\n" + //
                        "      \"cooldown_expires_at\": null\r\n" + //
                        "    }"));
    }

    /**
     * An additional redeemable ID not included in {@link #RedeemableIds()}
     *
     * @return the ID
     */
    public static String AddedRedeemableId() {
        return "92af127c-7326-4483-a52b-b0da0be61664";
    }

    /**
     * An additional redeemable object not included in {@link #Redeemables()}
     *
     * @return the object
     */
    public static JSONObject AddedRedeemable() {
        return new JSONObject("{\r\n" + //
                "      \"broadcaster_name\": \"CoolDude\",\r\n" + //
                "      \"broadcaster_login\": \"cooldude\",\r\n" + //
                "      \"broadcaster_id\": \"" + ViewerCache.instance().broadcaster().id() + "\",\r\n" + //
                "      \"id\": \"92af127c-7326-4483-a52b-b0da0be61664\",\r\n" + //
                "      \"image\": null,\r\n" + //
                "      \"background_color\": \"#FFFFFF\",\r\n" + //
                "      \"is_enabled\": true,\r\n" + //
                "      \"cost\": 3900,\r\n" + //
                "      \"title\": \"stuff\",\r\n" + //
                "      \"prompt\": \"whoo?\",\r\n" + //
                "      \"is_user_input_required\": true,\r\n" + //
                "      \"max_per_stream_setting\": {\r\n" + //
                "        \"is_enabled\": false,\r\n" + //
                "        \"max_per_stream\": 0\r\n" + //
                "      },\r\n" + //
                "      \"max_per_user_per_stream_setting\": {\r\n" + //
                "        \"is_enabled\": false,\r\n" + //
                "        \"max_per_user_per_stream\": 0\r\n" + //
                "      },\r\n" + //
                "      \"global_cooldown_setting\": {\r\n" + //
                "        \"is_enabled\": true,\r\n" + //
                "        \"global_cooldown_seconds\": 30\r\n" + //
                "      },\r\n" + //
                "      \"is_paused\": true,\r\n" + //
                "      \"is_in_stock\": true,\r\n" + //
                "      \"default_image\": {\r\n" + //
                "        \"url_1x\": \"https://static-cdn.jtvnw.net/custom-reward-images/default-1.png\",\r\n" + //
                "        \"url_2x\": \"https://static-cdn.jtvnw.net/custom-reward-images/default-2.png\",\r\n" + //
                "        \"url_4x\": \"https://static-cdn.jtvnw.net/custom-reward-images/default-4.png\"\r\n" + //
                "      },\r\n" + //
                "      \"should_redemptions_skip_request_queue\": false,\r\n" + //
                "      \"redemptions_redeemed_current_stream\": null,\r\n" + //
                "      \"cooldown_expires_at\": null\r\n" + //
                "    }");
    }
}
