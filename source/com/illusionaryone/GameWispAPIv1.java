/* astyle --style=java --indent=spaces=4 */

/*
 * Copyright (C) 2017 phantombot.tv
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

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.Reader;
import java.net.MalformedURLException;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.nio.charset.Charset;
import javax.net.ssl.HttpsURLConnection;

import me.mast3rplan.phantombot.PhantomBot;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;

/*
 * Communicates with the GameWisp v1 API server.
 *
 * @author illusionaryone
 */
public class GameWispAPIv1 {

    private static final GameWispAPIv1 instance = new GameWispAPIv1();
    private static final String sAPIURL = "https://api.gamewisp.com";
    private static final int iHTTPTimeout = 2 * 1000;
    private static final String devKey = "d391637bb332e0b67d60388e2cac31dd93ad5bf";
    private static final String devSec = "7e50eab14d7dc66e0018ac97aef4e52e564e991";
    private static final String devURI = "https://phantombot.tv/gamewisp/genauth.php";

    private static String sAccessToken = "";
    private static String sRefreshToken = "";
    private static Boolean noAccessWarning = false;

    public static GameWispAPIv1 instance() {
        return instance;
    }

    private GameWispAPIv1() {
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
                                       String exceptionMessage, String jsonContent) {
        jsonObject.put("_success", success);
        jsonObject.put("_type", type);
        jsonObject.put("_url", url);
        jsonObject.put("_http", responseCode);
        jsonObject.put("_exception", exception);
        jsonObject.put("_exceptionMessage", exceptionMessage);
        jsonObject.put("_content", jsonContent);
    }

    private static JSONObject readJsonFromGETUrl(String urlAddress) {
        return readJsonFromUrl("GET", urlAddress);
    }

    private static JSONObject readJsonFromPOSTUrl(String urlAddress) {
        return readJsonFromUrl("POST", urlAddress);
    }

    @SuppressWarnings("UseSpecificCatch")
    private static JSONObject readJsonFromUrl(String methodType, String urlAddress) {
        JSONObject jsonResult = new JSONObject("{}");
        InputStream inputStream = null;
        OutputStream outputStream = null;
        URL urlRaw;
        HttpsURLConnection urlConn;
        String jsonText = "";

        if (sAccessToken.length() == 0) {
            if (!noAccessWarning) {
                com.gmt2001.Console.err.println("GameWispAPIv1: Attempting to use GameWisp API without key. Disabling the GameWisp module.");
                PhantomBot.instance().getDataStore().set("modules", "./handlers/gameWispHandler.js", "false");
                noAccessWarning = true;
            }
            JSONStringer jsonObject = new JSONStringer();
            return(new JSONObject(jsonObject.object().key("result").object().key("status").value(-1).endObject().endObject().toString()));
        }

        try {
            urlRaw = new URL(urlAddress);
            urlConn = (HttpsURLConnection) urlRaw.openConnection();
            urlConn.setDoInput(true);
            urlConn.setRequestMethod(methodType);
            urlConn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 " +
                                       "(KHTML, like Gecko) Chrome/44.0.2403.52 Safari/537.36 PhantomBotJ/2015");

            if (methodType.equals("POST")) {
                urlConn.setDoOutput(true);
                urlConn.addRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            } else {
                urlConn.addRequestProperty("Content-Type", "application/json");
            }

            urlConn.connect();

            if (urlConn.getResponseCode() == 200) {
                inputStream = urlConn.getInputStream();
            } else {
                inputStream = urlConn.getErrorStream();
            }

            BufferedReader rd = new BufferedReader(new InputStreamReader(inputStream, Charset.forName("UTF-8")));
            jsonText = readAll(rd);
            jsonResult = new JSONObject(jsonText);
            fillJSONObject(jsonResult, true, methodType, urlAddress, urlConn.getResponseCode(), "", "", jsonText);
        } catch (JSONException ex) {
            fillJSONObject(jsonResult, false, methodType, urlAddress, 0, "JSONException", ex.getMessage(), jsonText);
            com.gmt2001.Console.err.println("GameWispAPIv1::Bad JSON (" + urlAddress + "): " + jsonText.substring(0, 100) + "...");
        } catch (NullPointerException ex) {
            fillJSONObject(jsonResult, false, methodType, urlAddress, 0, "NullPointerException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("GameWispAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (MalformedURLException ex) {
            fillJSONObject(jsonResult, false, methodType, urlAddress, 0, "MalformedURLException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("GameWispAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (SocketTimeoutException ex) {
            fillJSONObject(jsonResult, false, methodType, urlAddress, 0, "SocketTimeoutException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("GameWispAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (IOException ex) {
            fillJSONObject(jsonResult, false, methodType, urlAddress, 0, "IOException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("GameWispAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (Exception ex) {
            fillJSONObject(jsonResult, false, methodType, urlAddress, 0, "Exception", ex.getMessage(), "");
            com.gmt2001.Console.err.println("GameWispAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } finally {
            if (inputStream != null)
                try {
                    inputStream.close();
                } catch (IOException ex) {
                    fillJSONObject(jsonResult, false, methodType, urlAddress, 0, "IOException", ex.getMessage(), "");
                    com.gmt2001.Console.err.println("GameWispAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
                }
        }

        return(jsonResult);
    }

    /*
     * Sets the Access Token to authenticate with API.
     *
     * @param sAccessToken
     */
    public void SetAccessToken(String sAccessToken) {
        GameWispAPIv1.sAccessToken = sAccessToken;
    }

    /*
     * Sets the Refresh Token to get a new Access Token later with the API.
     *
     * @param sRefreshToken
     */
    public void SetRefreshToken(String sRefreshToken) {
        GameWispAPIv1.sRefreshToken = sRefreshToken;
    }

    /*
     * Pulls specific subscriber information.
     * @param String
     * @return JSONObject
     */
    public JSONObject getUserSubInfoJSON(String username) {
        return readJsonFromGETUrl(sAPIURL + "/pub/v1/channel/subscriber-for-channel?access_token=" + GameWispAPIv1.sAccessToken + "&type=twitch&user_name=" + username + "&include=anniversaries,user,tier");
    }

    /*
     * Returns a String in JSON format of the getUserSubInfo data.
     * @param String
     * @return String {JSONObject}
     */
    public String getUserSubInfoString(String username) {
        JSONObject jsonObject = getUserSubInfoJSON(username);
        return jsonObject.toString(); 
    }

    /*
     * Refreshes the token.
     * @param String
     */
    public String[] refreshToken() {
        JSONObject jsonObject = readJsonFromPOSTUrl(sAPIURL + "/pub/v1/oauth/token" +
                                                             "?grant_type=refresh_token" +
                                                             "&client_id=" + devKey +
                                                             "&client_secret=" + devSec +
                                                             "&redirect_uri=" + devURI +
                                                             "&refresh_token=" + sRefreshToken);
        if (jsonObject.has("access_token") && jsonObject.has("refresh_token")) {
            String newAccessToken = jsonObject.getString("access_token");
            String newRefreshToken = jsonObject.getString("refresh_token");
            String[] returnString = { newAccessToken, newRefreshToken };
            com.gmt2001.Console.out.println("GameWispAPI: Refreshed GameWisp Token");

            sAccessToken = newAccessToken;
            sRefreshToken = newRefreshToken;
            return returnString;
        } else {
            com.gmt2001.Console.err.println("GameWispAPI: Error Refreshing Tokens! Keeping Current Tokens!");
            com.gmt2001.Console.err.println("GameWispAPI: JSON: " + jsonObject.toString().substring(0, 100));
            String[] returnString = { sAccessToken, sRefreshToken };
            return returnString;
        }
    }
}
