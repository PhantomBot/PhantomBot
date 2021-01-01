/* astyle --style=java --indent=spaces=4 */

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
package com.illusionaryone;

import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.MalformedURLException;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.nio.charset.Charset;
import javax.net.ssl.HttpsURLConnection;
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
    private static final String sAPIURL = "https://www.streamlabs.com/api/v1.0";
    private static final int iHTTPTimeout = 2 * 1000;
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

    /*
     * Reads data from a stream.
     */
    private static String readAll(Reader rd) throws IOException {
        StringBuilder sb = new StringBuilder();
        int cp;
        while ((cp = rd.read()) != -1) {
            sb.append((char) cp);
        }
        return sb.toString();
    }

    /*
     * Populates additional information into a JSON object to be digested
     * as needed.
     */
    private static void fillJSONObject(JSONObject jsonObject, boolean success, String type,
                                       String url, int responseCode, String exception,
                                       String exceptionMessage, String jsonContent) throws JSONException {
        jsonObject.put("_success", success);
        jsonObject.put("_type", type);
        jsonObject.put("_url", url);
        jsonObject.put("_http", responseCode);
        jsonObject.put("_exception", exception);
        jsonObject.put("_exceptionMessage", exceptionMessage);
        jsonObject.put("_content", jsonContent);
    }

    @SuppressWarnings("UseSpecificCatch")
    private static JSONObject readJsonFromUrl(String urlAddress) throws JSONException {
        return readJsonFromUrl(urlAddress, "");
    }

    @SuppressWarnings("UseSpecificCatch")
    private static JSONObject readJsonFromUrl(String urlAddress, String postString) throws JSONException {
        JSONObject jsonResult = new JSONObject("{}");
        InputStream inputStream = null;
        URL urlRaw;
        HttpsURLConnection urlConn;
        String jsonText = "";
        boolean doPost = (postString.length() > 0);

        try {
            urlRaw = new URL(urlAddress);
            urlConn = (HttpsURLConnection) urlRaw.openConnection();
            urlConn.setDoInput(true);
            urlConn.setRequestMethod(doPost ? "POST" : "GET");
            urlConn.addRequestProperty("Content-Type", doPost ? "application/x-www-form-urlencoded" : "application/json");
            urlConn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 " +
                                       "(KHTML, like Gecko) Chrome/44.0.2403.52 Safari/537.36 PhantomBotJ/2015");
            if (doPost) {
                urlConn.setDoOutput(true);
            }

            urlConn.connect();

            if (doPost) {
                try (BufferedOutputStream stream = new BufferedOutputStream(urlConn.getOutputStream())) {
                    stream.write(postString.getBytes());
                    stream.flush();
                }
            }

            if (urlConn.getResponseCode() == 200) {
                inputStream = urlConn.getInputStream();
            } else {
                inputStream = urlConn.getErrorStream();
            }

            BufferedReader rd = new BufferedReader(new InputStreamReader(inputStream, Charset.forName("UTF-8")));
            jsonText = readAll(rd);
            jsonResult = new JSONObject(jsonText);
            fillJSONObject(jsonResult, true, doPost ? "POST" : "GET", urlAddress, urlConn.getResponseCode(), "", "", jsonText);
        } catch (JSONException ex) {
            fillJSONObject(jsonResult, false, doPost ? "POST" : "GET", urlAddress, 0, "JSONException", ex.getMessage(), jsonText);
            com.gmt2001.Console.debug.println("TwitchAlertsAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (NullPointerException ex) {
            fillJSONObject(jsonResult, false, doPost ? "POST" : "GET", urlAddress, 0, "NullPointerException", ex.getMessage(), "");
            com.gmt2001.Console.debug.println("TwitchAlertsAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (MalformedURLException ex) {
            fillJSONObject(jsonResult, false, doPost ? "POST" : "GET", urlAddress, 0, "MalformedURLException", ex.getMessage(), "");
            com.gmt2001.Console.debug.println("TwitchAlertsAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (SocketTimeoutException ex) {
            fillJSONObject(jsonResult, false, doPost ? "POST" : "GET", urlAddress, 0, "SocketTimeoutException", ex.getMessage(), "");
            com.gmt2001.Console.debug.println("TwitchAlertsAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (IOException ex) {
            fillJSONObject(jsonResult, false, doPost ? "POST" : "GET", urlAddress, 0, "IOException", ex.getMessage(), "");
            com.gmt2001.Console.debug.println("TwitchAlertsAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (Exception ex) {
            fillJSONObject(jsonResult, false, doPost ? "POST" : "GET", urlAddress, 0, "Exception", ex.getMessage(), "");
            com.gmt2001.Console.debug.println("TwitchAlertsAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } finally {
            if (inputStream != null)
                try {
                    inputStream.close();
                } catch (IOException ex) {
                    fillJSONObject(jsonResult, false, doPost ? "POST" : "GET", urlAddress, 0, "IOException", ex.getMessage(), "");
                    com.gmt2001.Console.debug.println("TwitchAlertsAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
                }
        }

        return(jsonResult);
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
    public JSONObject GetDonations() throws JSONException {
        return readJsonFromUrl(sAPIURL + "/donations?access_token=" + this.sAccessToken + "&limit=" + this.iDonationPullLimit + "&currency=" + this.sCurrencyCode);
    }

    /*
     * Get an individuals points.
     *
     * @param userName    User to lookup
     * @param channelName Channel name to lookup
     *
     * @return pointsObject
     */
    public JSONObject GetPointsAPI(String userName, String channelName) throws JSONException {
        return readJsonFromUrl(sAPIURL + "/points?access_token=" + this.sAccessToken + "&username=" + userName + "&channel=" + channelName);
    }

    /*
     * Set points for an individual.
     *
     * @param userName User to modify
     * @param points   Points to set to.
     *
     * @return pointsObject
     */
    public JSONObject SetPointsAPI(String userName, int points) throws JSONException {
        return readJsonFromUrl(sAPIURL + "/points/user_point_edit", "access_token=" + this.sAccessToken + "&username=" + userName + "&points=" + points);
    }

    /*
     * Add points to all in chat.
     *
     * @param channelName Channel name
     * @param points      Points to add.
     *
     * @return pointsToAddObject
     */
    public JSONObject AddToAllPointsAPI(String channelName, int points) throws JSONException {
        return readJsonFromUrl(sAPIURL + "/points/add_to_all", "access_token=" + this.sAccessToken + "&channel=" + channelName + "&value=" + points);
    }

    /*
     * Get an individuals points.
     *
     * @param userName    User to lookup
     * @param channelName Channel name to lookup
     *
     * @return points (-1 on error)
     */
    public int GetPoints(String userName, String channelName) throws JSONException {
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
    public int SetPoints(String userName, int points) throws JSONException {
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
    public boolean AddToAllPoints(String channelName, int points) throws JSONException {
        JSONObject jsonObject = AddToAllPointsAPI(channelName, points);

        if (jsonObject.has("message")) {
            if (jsonObject.getString("message").equalsIgnoreCase("success")) {
                return true;
            }
        }
        return false;
    }
}
