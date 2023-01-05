/* astyle --style=java --indent=spaces=4 */

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
package com.illusionaryone;

import com.gmt2001.HttpRequest;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.URIUtil;
import org.json.JSONException;
import org.json.JSONObject;

/*
 * Communicates with the FrankerFaceZ v1 API server.  Supports the
 * /room and /set/global API methods which gather emote information.
 *
 * @author illusionaryone
 */
public class FrankerZAPIv1 {

    private static FrankerZAPIv1 instance;
    private static final String APIURL = "https://api.frankerfacez.com/v1";

    public static synchronized FrankerZAPIv1 instance() {
        if (instance == null) {
            instance = new FrankerZAPIv1();
        }

        return instance;
    }

    private FrankerZAPIv1() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    @SuppressWarnings("UseSpecificCatch")
    private static JSONObject readJsonFromUrl(String urlAddress) throws JSONException {
        JSONObject jsonResult = new JSONObject("{}");

        try {
            HttpClientResponse resp = HttpClient.get(URIUtil.create(urlAddress));
            String jsonText = resp.responseBody();
            if (jsonText.startsWith("{")) {
                jsonResult = new JSONObject(jsonText);
            }
            HttpRequest.generateJSONObject(jsonResult, true, "GET", "", urlAddress, resp.responseCode().code(), null, null);
        } catch (Exception ex) {
            HttpRequest.generateJSONObject(jsonResult, true, "GET", "", urlAddress, 0, ex.getClass().getName(), ex.getMessage());
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return jsonResult;
    }

    /*
     * Pulls emote information for the local channel.
     *
     * @param channel
     * @return
     */
    public JSONObject GetLocalEmotes(String channel) throws JSONException {
        return readJsonFromUrl(APIURL + "/room/" + channel);
    }

    /*
     * Pulls global emote information.
     *
     * @return
     */
    public JSONObject GetGlobalEmotes() throws JSONException {
        return readJsonFromUrl(APIURL + "/set/global");
    }
}
