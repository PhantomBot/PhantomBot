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

import java.net.URISyntaxException;

import org.json.JSONException;
import org.json.JSONObject;

import com.gmt2001.HttpRequest;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.URIUtil;

import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpHeaderValues;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;

/*
 * Communicates with the StreamLabs API
 *
 * @author illusionaryone
 */
public class StreamLabsAPI {

    private static StreamLabsAPI instance;
    private static final String APIURL = "https://streamlabs.com/api/v2.0";
    private String sCurrencyCode = "";

    public static synchronized StreamLabsAPI instance() {
        if (instance == null) {
            instance = new StreamLabsAPI();
        }

        return instance;
    }

    private StreamLabsAPI() {
        if (PhantomBot.instance().getDataStore().HasKey("donations", "", "currencycode")) {
            this.SetCurrencyCode(PhantomBot.instance().getDataStore().GetString("donations", "", "currencycode"));
        }
    }

    private JSONObject readJsonFromUrl(String urlAddress) throws JSONException, URISyntaxException {
        return readJsonFromUrl(urlAddress, null, HttpMethod.GET);
    }

    private JSONObject readJsonFromUrl(String urlAddress, String postString) throws JSONException, URISyntaxException {
        return readJsonFromUrl(urlAddress, postString, HttpMethod.POST);
    }

    private JSONObject readJsonFromUrl(String endpoint, String body, HttpMethod method) throws JSONException, URISyntaxException {
        JSONObject jsonResult = new JSONObject("{}");
        HttpHeaders headers = HttpClient.createHeaders(method, true);

        headers.set(HttpHeaderNames.AUTHORIZATION, "Bearer " + getAccessToken());

        if (method == HttpMethod.POST) {
            headers.set(HttpHeaderNames.CONTENT_TYPE, HttpHeaderValues.APPLICATION_X_WWW_FORM_URLENCODED);
        }

        HttpClientResponse response = HttpClient.request(method, URIUtil.create(APIURL + endpoint), headers, body);

        if (response.hasJson()) {
            jsonResult = response.json();
            HttpRequest.generateJSONObject(jsonResult, true, method.name(), "", endpoint, response.responseCode().code(), null, null);
        } else {
            jsonResult.put("error", response.responseBody());
            HttpRequest.generateJSONObject(jsonResult, true, method.name(), "", endpoint, response.responseCode().code(), null, null);
        }

        return jsonResult;
    }

    /**
     * @botproperty streamlabskey - The access token for retrieving donations from StreamLabs
     * @botpropertycatsort streamlabskey 20 260 StreamLabs
     */
    private static String getAccessToken() {
        return CaselessProperties.instance().getProperty("streamlabskey", CaselessProperties.instance().getProperty("twitchalertskey", ""));
    }

    public static boolean hasAccessToken() {
        return !getAccessToken().isBlank();
    }

    /**
     * @botproperty streamlabslimit - The maximum number of donations to pull from StreamLabs when updating. Default `5`
     * @botpropertycatsort streamlabslimit 30 260 StreamLabs
     */
    public static int getDonationPullLimit() {
        return CaselessProperties.instance().getPropertyAsInt("streamlabslimit", CaselessProperties.instance().getPropertyAsInt("twitchalertslimit", 5));
    }

    /*
     * Sets a new currency code to convert all records to.
     *
     * @param sCurrencyCode
     */
    public void SetCurrencyCode(String sCurrencyCode) {
        this.sCurrencyCode = sCurrencyCode;
    }

    /*
     * Pulls donation information.
     *
     * @return donationsObject
     */
    public JSONObject GetDonations(int lastId) throws JSONException, URISyntaxException {
        return this.readJsonFromUrl("/donations?limit=" + getDonationPullLimit()
                + "&currency=" + this.sCurrencyCode + (lastId > 0 ? "&after=" + lastId : ""));
    }

    /*
     * Get an individuals points.
     *
     * @param userName    User to lookup
     * @param channelName Channel name to lookup
     *
     * @return pointsObject
     */
    public JSONObject GetPointsAPI(String userName, String channelName) throws JSONException, URISyntaxException {
        return this.readJsonFromUrl("/points?username=" + userName + "&channel=" + channelName);
    }

    /*
     * Set points for an individual.
     *
     * @param userName User to modify
     * @param points   Points to set to.
     *
     * @return pointsObject
     */
    public JSONObject SetPointsAPI(String userName, int points) throws JSONException, URISyntaxException {
        return this.readJsonFromUrl("/points/user_point_edit", "username=" + userName + "&points=" + points);
    }

    /*
     * Add points to all in chat.
     *
     * @param channelName Channel name
     * @param points      Points to add.
     *
     * @return pointsToAddObject
     */
    public JSONObject AddToAllPointsAPI(String channelName, int points) throws JSONException, URISyntaxException {
        return this.readJsonFromUrl("/points/add_to_all", "channel=" + channelName + "&value=" + points);
    }

    /*
     * Get an individuals points.
     *
     * @param userName    User to lookup
     * @param channelName Channel name to lookup
     *
     * @return points (-1 on error)
     */
    public int GetPoints(String userName, String channelName) throws JSONException, URISyntaxException {
        JSONObject jsonObject = GetPointsAPI(userName, channelName);

        if (jsonObject.has("points")) {
            return jsonObject.getInt("points");
        }
        return -1;
    }

    /*
     * Set points for an individual.
     *
     * @param userName User to modify
     * @param points   Points to set to.
     *
     * @return newPoints
     */
    public int SetPoints(String userName, int points) throws JSONException, URISyntaxException {
        JSONObject jsonObject = SetPointsAPI(userName, points);

        if (jsonObject.has("points")) {
            return jsonObject.getInt("points");
        }
        return -1;
    }

    /*
     * Add points to all in chat.
     *
     * @param channelName Channel name
     * @param points      Points to add.
     *
     * @return boolean
     */
    public boolean AddToAllPoints(String channelName, int points) throws JSONException, URISyntaxException {
        JSONObject jsonObject = AddToAllPointsAPI(channelName, points);

        if (jsonObject.has("message")) {
            if (jsonObject.getString("message").equalsIgnoreCase("success")) {
                return true;
            }
        }
        return false;
    }
}
