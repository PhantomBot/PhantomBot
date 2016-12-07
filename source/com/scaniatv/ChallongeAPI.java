/*
 * Copyright (C) 2016 phantombot.tv
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

import com.gmt2001.UncaughtExceptionHandler;

import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.io.Writer;

import java.net.MalformedURLException;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import javax.net.ssl.HttpsURLConnection;

import java.nio.charset.Charset;

import org.apache.commons.io.IOUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * @author ScaniaTV
 */
public class ChallongeAPI {
    private static ChallongeAPI challongeAPI = null;
    private final String url = "https://api.challonge.com/v1/";
    private String tournamentId = null;
    private String oAuth;

    /**
     * @function instance
     *
     * @param {string} oauth
     * @param {string} tournamentId
     */
    public static ChallongeAPI instance(String oAuth) {
        if (challongeAPI == null) {
            challongeAPI = new ChallongeAPI(oAuth);
        }
        return challongeAPI;
    }

    /**
     * @function instance
     *
     */
    public static ChallongeAPI instance() {
        return challongeAPI;
    }

    /**
     * @function ChallongAPI
     *
     * @param {string} oauth
     * @param {string} tournamentId
     */
    private ChallongeAPI(String oAuth) {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        this.oAuth = oAuth;
    }

    /**
     * @function readAll
     *
     * @param {Reader} rd
     */
    private static String readAll(Reader rd) throws IOException {
        StringBuilder sb = new StringBuilder();
        int cp;

        while ((cp = rd.read()) != -1) {
            sb.append((char) cp);
        }
        return sb.toString();
    }

    /**
     * @function fillJSONObject
     *
     * @param {JSONObject} jsonObject
     * @param {boolean} success
     * @param {string} type
     * @param {string} url
     * @param {int} responseCode
     * @param {string} exception
     * @param {string} exceptionMessage
     * @param {string} jsonContent
     */
    private static void fillJSONObject(JSONObject jsonObject, boolean success, String type, String url, int responseCode, String exception, String exceptionMessage, String jsonContent) {
        jsonObject.put("_success", success);
        jsonObject.put("_type", type);
        jsonObject.put("_url", url);
        jsonObject.put("_http", responseCode);
        jsonObject.put("_exception", exception);
        jsonObject.put("_exceptionMessage", exceptionMessage);
        jsonObject.put("_content", jsonContent);
    }

    /**
     * @function readJsonFromUrl
     *
     * @param {String} urlAddress
     */
    @SuppressWarnings("UseSpecificCatch")
    private static JSONObject readJsonFromUrl(String urlAddress, boolean isArray) {
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
            urlConn.addRequestProperty("Accept", "application/vnd.github.v3+json");
            urlConn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 " +
                                       "(KHTML, like Gecko) Chrome/44.0.2403.52 Safari/537.36 PhantomBotJ/2015");
            urlConn.connect();

            if (urlConn.getResponseCode() == 200) {
                inputStream = urlConn.getInputStream();
            } else {
                inputStream = urlConn.getErrorStream();
            }

            BufferedReader rd = new BufferedReader(new InputStreamReader(inputStream, Charset.forName("UTF-8")));
            jsonText = readAll(rd);
            if (isArray) {
                jsonResult = new JSONObject("{ \"array\": " + jsonText + " }");
            } else {
                jsonResult = new JSONObject(jsonText);
            }
            fillJSONObject(jsonResult, true, "GET", urlAddress, urlConn.getResponseCode(), "", "", jsonText);
        } catch (JSONException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "JSONException", ex.getMessage(), jsonText);
            com.gmt2001.Console.err.println("ChallongeAPI::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (NullPointerException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "NullPointerException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("ChallongeAPI::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (MalformedURLException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "MalformedURLException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("ChallongeAPI::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (SocketTimeoutException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "SocketTimeoutException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("ChallongeAPI::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (IOException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "IOException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("ChallongeAPI::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (Exception ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "Exception", ex.getMessage(), "");
            com.gmt2001.Console.err.println("ChallongeAPI::readJsonFromUrl::Exception: " + ex.getMessage());
        } finally {
            if (inputStream != null)
                try {
                    inputStream.close();
                } catch (IOException ex) {
                    fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "IOException", ex.getMessage(), "");
                    com.gmt2001.Console.err.println("ChallongeAPI::readJsonFromUrl::Exception: " + ex.getMessage());
                }
        }

        return(jsonResult);
    }

    /**
     * @function SetOAuth
     *
     * @param {string} oAuth
     */
    public void SetOAuth(String oAuth) {
        this.oAuth = oAuth;
    }

    /**
     * @function SetTournamentId
     *
     * @param {string} tournamentId
     */
    public void setTournamentId(String tournamentId) {
        this.tournamentId = tournamentId;
    }

    /**
     * @function getTournaments
     *
     * @return {JSONObject}
     */
    public JSONObject getTournaments() {
        return readJsonFromUrl(this.url + "tournaments.json?api_key=" + this.oAuth, true);
    }

    /**
     * @function getParticipants
     *
     * @return {JSONObject}
     */
    public JSONObject getParticipants() {
        return readJsonFromUrl(this.url + "tournaments/" + this.tournamentId + "/participants.json?api_key=" + this.oAuth, true);
    }

    /**
     * @function getParticipants
     *
     * @param {String} tournamentId
     * @return {JSONObject}
     */
    public JSONObject getParticipants(String tournamentId) {
        return readJsonFromUrl(this.url + "tournaments/" + tournamentId + "/participants.json?api_key=" + this.oAuth, true);
    }

    /**
     * @function getMatches
     *
     * @return {JSONObject}
     */
    public JSONObject getMatches() {
        return readJsonFromUrl(this.url + "tournaments/" + this.tournamentId + "/matches.json?api_key=" + this.oAuth, true);
    }

    /**
     * @function getMatches
     *
     * @param {String} tournamentId
     * @return {JSONObject}
     */
    public JSONObject getMatches(String tournamentId) {
        return readJsonFromUrl(this.url + "tournaments/" + tournamentId + "/matches.json?api_key=" + this.oAuth, true);
    }

    /**
     * @function getTournamentId
     *
     * @return {string}
     */
    public String getTournamentId() {
        return this.tournamentId;
    }
}
