/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
package com.scaniatv;

import com.gmt2001.HttpRequest;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.HttpUrl;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import java.net.URISyntaxException;
import org.json.JSONObject;

/*
 * @author ScaniaTV
 */
public class StreamElementsAPIv2 {

    private static StreamElementsAPIv2 instance;
    private static final String URL = "https://api.streamelements.com/kappa/v2";
    private static String jwtToken = "";
    private String id = "";
    private int pullLimit = 5;

    /*
     * Returns the current instance.
     */
    public static synchronized StreamElementsAPIv2 instance() {
        if (instance == null) {
            instance = new StreamElementsAPIv2();
        }

        return instance;
    }

    /*
     * Builds the instance for this class.
     */
    private StreamElementsAPIv2() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    /*
     * Reads data from an API. In this case its tipeeestream.
     */
    @SuppressWarnings("UseSpecificCatch")
    private static JSONObject readJsonFromUrl(String endpoint) throws URISyntaxException {
        JSONObject jsonResult = new JSONObject("{}");
        HttpHeaders headers = HttpClient.createHeaders(HttpMethod.GET, true);
        headers.add(HttpHeaderNames.AUTHORIZATION, "Bearer " + jwtToken);
        HttpClientResponse response = HttpClient.get(HttpUrl.fromUri(URL, endpoint), headers);

        if (response.hasJson()) {
            jsonResult = response.json();
            HttpRequest.generateJSONObject(jsonResult, true, "GET", "", endpoint, response.responseCode().code(), null, null);
        } else {
            jsonResult.put("error", response.responseBody());
            HttpRequest.generateJSONObject(jsonResult, true, "GET", "", endpoint, response.responseCode().code(), null, null);
        }

        return jsonResult;
    }

    /*
     * Sets the jwt token to access the api
     *
     * @param  jwtToken  jwt key that the user added in the bot login.
     */
    public void SetJWT(String token) {
        jwtToken = token;
    }

    /*
     * Sets the streamelements user account id
     *
     * @param  id
     */
    public void SetID(String id) {
        this.id = id;
    }

    /*
     * Sets the api pull limit.
     *
     * @param  pullLimit  Amount of donations to pull, default is 5.
     */
    public void SetLimit(int pullLimit) {
        this.pullLimit = pullLimit;
    }

    /*
     * Pulls the 5 last donations from the API.
     *
     * @return  The last 5 donations from the api.
     */
    public JSONObject GetDonations() throws URISyntaxException {
        return readJsonFromUrl("/tips/" + this.id + "?limit=" + this.pullLimit);
    }
}
