/*
 * Copyright (C) 2016-2020 phantom.bot
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

import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.Reader;

import java.net.SocketTimeoutException;
import java.net.MalformedURLException;
import java.net.URL;

import java.nio.charset.Charset;

import javax.net.ssl.HttpsURLConnection;

import org.json.JSONException;
import org.json.JSONObject;

/*
 * @author ScaniaTV
 */
public class StreamElementsAPIv2 {

    private static StreamElementsAPIv2 instance;
    private static final String url = "https://api.streamelements.com/kappa/v2";
    private static final int iHTTPTimeout = 2 * 1000;
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
    private static void fillJSONObject(JSONObject jsonObject, boolean success, String type, String url, int responseCode, String exception, String exceptionMessage, String jsonContent) throws JSONException {
        jsonObject.put("_success", success);
        jsonObject.put("_type", type);
        jsonObject.put("_url", url);
        jsonObject.put("_http", responseCode);
        jsonObject.put("_exception", exception);
        jsonObject.put("_exceptionMessage", exceptionMessage);
        jsonObject.put("_content", jsonContent);
    }

    /*
     * Reads data from an API. In this case its tipeeestream.
     */
    @SuppressWarnings("UseSpecificCatch")
    private static JSONObject readJsonFromUrl(String urlAddress) throws JSONException {
        JSONObject jsonResult = new JSONObject("{}");
        InputStream inputStream = null;
        URL urlRaw;
        HttpsURLConnection urlConn;
        String jsonText = "";

        try {
            urlRaw = new URL(urlAddress);
            urlConn = (HttpsURLConnection) urlRaw.openConnection();
            urlConn.setDoInput(true);
            urlConn.setRequestMethod("GET");
            urlConn.addRequestProperty("Content-Type", "application/json");
            urlConn.addRequestProperty("Authorization", "Bearer " + jwtToken);
            urlConn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.52 Safari/537.36 PhantomBotJ/2015");
            urlConn.connect();

            if (urlConn.getResponseCode() == 200) {
                inputStream = urlConn.getInputStream();
            } else {
                inputStream = urlConn.getErrorStream();
            }

            BufferedReader rd = new BufferedReader(new InputStreamReader(inputStream, Charset.forName("UTF-8")));
            jsonText = readAll(rd);
            jsonResult = new JSONObject(jsonText);
            fillJSONObject(jsonResult, true, "GET", urlAddress, urlConn.getResponseCode(), "", "", jsonText);
        } catch (JSONException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "JSONException", ex.getMessage(), jsonText);
            com.gmt2001.Console.debug.println("StreamElementsAPIv2::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (NullPointerException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "NullPointerException", ex.getMessage(), "");
            com.gmt2001.Console.debug.println("StreamElementsAPIv2::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (MalformedURLException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "MalformedURLException", ex.getMessage(), "");
            com.gmt2001.Console.debug.println("StreamElementsAPIv2::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (SocketTimeoutException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "SocketTimeoutException", ex.getMessage(), "");
            com.gmt2001.Console.debug.println("StreamElementsAPIv2::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (IOException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "IOException", ex.getMessage(), "");
            com.gmt2001.Console.debug.println("StreamElementsAPIv2::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (Exception ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "Exception", ex.getMessage(), "");
            com.gmt2001.Console.debug.println("StreamElementsAPIv2::readJsonFromUrl::Exception: " + ex.getMessage());
        } finally {
            if (inputStream != null) {
                try {
                    inputStream.close();
                } catch (IOException ex) {
                    fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "IOException", ex.getMessage(), "");
                    com.gmt2001.Console.debug.println("StreamElementsAPIv2::readJsonFromUrl::Exception: " + ex.getMessage());
                }
            }
        }

        return jsonResult;
    }

    /*
     * Sets the jwt token to access the api
     *
     * @param {String}  jwtToken  jwt key that the user added in the bot login.
     */
    public void SetJWT(String token) {
        jwtToken = token;
    }

    /*
     * Sets the streamelements user account id
     *
     * @param {String}  id
     */
    public void SetID(String id) {
        this.id = id;
    }

    /*
     * Sets the api pull limit.
     *
     * @param {Int}  pullLimit  Amount of donations to pull, default is 5.
     */
    public void SetLimit(int pullLimit) {
        this.pullLimit = pullLimit;
    }

    /*
     * Pulls the 5 last donations from the API.
     *
     * @return {JSONObject}  The last 5 donations from the api.
     */
    public JSONObject GetDonations() throws JSONException {
        return readJsonFromUrl(url + "/tips/" + this.id + "?limit=" + this.pullLimit);
    }
}
