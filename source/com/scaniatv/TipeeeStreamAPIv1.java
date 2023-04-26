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

 /*
 * @author ScaniaTV
 */
package com.scaniatv;

import java.net.URISyntaxException;

import org.json.JSONException;
import org.json.JSONObject;

import com.gmt2001.HttpRequest;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.URIUtil;

import tv.phantombot.CaselessProperties;

public class TipeeeStreamAPIv1 {

    private static TipeeeStreamAPIv1 instance;
    private static final String URL = "https://api.tipeeestream.com/v1.0/events.json";

    /*
     * Returns the current instance.
     */
    public static synchronized TipeeeStreamAPIv1 instance() {
        if (instance == null) {
            instance = new TipeeeStreamAPIv1();
        }

        return instance;
    }

    /*
     * Builds the instance for this class.
     */
    private TipeeeStreamAPIv1() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    /*
     * Reads data from an API. In this case its tipeeestream.
     */
    private static JSONObject readJsonFromUrl(String endpoint) throws JSONException, URISyntaxException {
        JSONObject jsonResult = new JSONObject("{}");
        HttpClientResponse response = HttpClient.get(URIUtil.create(endpoint));

        if (response.hasJson()) {
            jsonResult = response.json();
            HttpRequest.generateJSONObject(jsonResult, true, "GET", "", endpoint, response.responseCode().code(), null, null);
        } else {
            jsonResult.put("error", response.responseBody());
            HttpRequest.generateJSONObject(jsonResult, true, "GET", "", endpoint, response.responseCode().code(), null, null);
        }

        return jsonResult;
    }

    /**
     * @botproperty tipeeestreamkey - The access token for retrieving donations from TipeeeStream
     * @botpropertycatsort tipeeestreamkey 20 220 TipeeeStream
     */
    private static String getOauth() {
        return CaselessProperties.instance().getProperty("tipeeestreamkey", "");
    }

    public static boolean hasOauth() {
        return !getOauth().isBlank();
    }

    /**
     * @botproperty tipeeestreamlimit - The maximum number of donations to pull from TipeeeStream when updating. Default `5`
     * @botpropertycatsort tipeeestreamlimit 30 220 TipeeeStream
     */
    private int getLimit() {
        return CaselessProperties.instance().getPropertyAsInt("tipeeestreamlimit", 5);
    }

    /*
     * Pulls the 5 last donations from the API.
     *
     * @return  The last 5 donations from the api.
     */
    public JSONObject GetDonations() throws JSONException, URISyntaxException {
        return readJsonFromUrl(URL + "?apiKey=" + getOauth() + "&type[]=donation&limit=" + getLimit());
    }
}
