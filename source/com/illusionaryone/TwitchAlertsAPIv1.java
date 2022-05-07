/* astyle --style=java --indent=spaces=4 */

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
package com.illusionaryone;

import com.gmt2001.HttpRequest;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.HttpUrl;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpHeaderValues;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import java.net.URISyntaxException;
import org.json.JSONException;
import org.json.JSONObject;

/*
 * Communicates with the Twitch Alerts v1 API server. (StreamLabs)  Currently only
 * supports the GET donations method.
 *
 * @author illusionaryone
 */
public class TwitchAlertsAPIv1 {

    private static TwitchAlertsAPIv1 instance;
    private static final String APIURL = "https://www.streamlabs.com/api/v1.0";
    private String sAccessToken = "";
    private int iDonationPullLimit = 5;
    private String sCurrencyCode = "";

    public static TwitchAlertsAPIv1 instance() {
        if (instance == null) {
            instance = new TwitchAlertsAPIv1();
        }

        return instance;
    }

    private TwitchAlertsAPIv1() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    @SuppressWarnings("UseSpecificCatch")
    private static JSONObject readJsonFromUrl(String urlAddress) throws JSONException, URISyntaxException {
        return readJsonFromUrl(urlAddress, null, HttpMethod.GET);
    }

    private static JSONObject readJsonFromUrl(String urlAddress, String postString) throws JSONException, URISyntaxException {
        return readJsonFromUrl(urlAddress, postString, HttpMethod.POST);
    }

    @SuppressWarnings("UseSpecificCatch")
    private static JSONObject readJsonFromUrl(String endpoint, String body, HttpMethod method) throws JSONException, URISyntaxException {
        JSONObject jsonResult = new JSONObject("{}");
        HttpHeaders headers = HttpClient.createHeaders(method, true);

        if (method == HttpMethod.POST) {
            headers.set(HttpHeaderNames.CONTENT_TYPE, HttpHeaderValues.APPLICATION_X_WWW_FORM_URLENCODED);
        }

        HttpClientResponse response = HttpClient.request(method, HttpUrl.fromUri(APIURL, endpoint), headers, body);

        if (response.hasJson()) {
            jsonResult = response.json();
            HttpRequest.generateJSONObject(jsonResult, true, method.name(), "", endpoint, response.responseCode().code(), null, null);
        } else {
            jsonResult.put("error", response.responseBody());
            HttpRequest.generateJSONObject(jsonResult, true, method.name(), "", endpoint, response.responseCode().code(), null, null);
        }

        return jsonResult;
    }

    /*
     * Sets the Access Token to authenticate with TwitchAlerts API.
     *
     * @param sAccessToken
     */
    public void SetAccessToken(String sAccessToken) {
        this.sAccessToken = sAccessToken;
    }

    /*
     * Sets a new limit to how many donation records to return.
     *
     * @param iDonationPullLimit
     */
    public void SetDonationPullLimit(int iDonationPullLimit) {
        this.iDonationPullLimit = iDonationPullLimit;
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
        return readJsonFromUrl("/donations?access_token=" + this.sAccessToken + "&limit=" + this.iDonationPullLimit
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
        return readJsonFromUrl("/points?access_token=" + this.sAccessToken + "&username=" + userName + "&channel=" + channelName);
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
        return readJsonFromUrl("/points/user_point_edit", "access_token=" + this.sAccessToken + "&username=" + userName + "&points=" + points);
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
        return readJsonFromUrl("/points/add_to_all", "access_token=" + this.sAccessToken + "&channel=" + channelName + "&value=" + points);
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
