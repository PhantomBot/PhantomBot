
/*
 * Copyright (C) 2016-2019 phantombot.tv
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
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.net.MalformedURLException;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.nio.charset.Charset;
import javax.net.ssl.HttpsURLConnection;
import java.net.HttpURLConnection;

import org.json.JSONException;
import org.json.JSONObject;

/*
 * Communicates with PhantomBot Commands API v1
 *
 * @author illusionaryone
 */
public class DataRenderServiceAPIv1 {

    private static final DataRenderServiceAPIv1 instance = new DataRenderServiceAPIv1();
    private static final int iHTTPTimeout = 2 * 1000;
    private static String sAPIKey = "";
    private static String sAPIURL = "";

    public static DataRenderServiceAPIv1 instance() {
        return instance;
    }

    private DataRenderServiceAPIv1() {
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

    @SuppressWarnings("UseSpecificCatch")
    private static JSONObject readJsonFromUrl(String urlAddress, String jsonString) {
        JSONObject jsonResult = new JSONObject("{}");
        InputStream inputStream = null;
        URL urlRaw;
        HttpsURLConnection httpsUrlConn;
        HttpURLConnection httpUrlConn;
        String jsonRequest = "";
        String jsonText = "";

        try {
            byte[] postRequest = jsonString.getBytes("UTF-8");

            urlRaw = new URL(urlAddress);

            if (sAPIURL.startsWith("https://")) {
                httpsUrlConn = (HttpsURLConnection) urlRaw.openConnection();
                httpsUrlConn.setDoInput(true);
                httpsUrlConn.setDoOutput(true);
                httpsUrlConn.setRequestMethod("POST");
                httpsUrlConn.addRequestProperty("Authentication", sAPIKey);
                httpsUrlConn.addRequestProperty("Content-Type", "application/json");
                httpsUrlConn.addRequestProperty("Content-Length", String.valueOf(postRequest.length));
                httpsUrlConn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 " +
                                                "(KHTML, like Gecko) Chrome/44.0.2403.52 Safari/537.36 PhantomBotJ/2015");
                httpsUrlConn.connect();
                httpsUrlConn.getOutputStream().write(postRequest);

                if (httpsUrlConn.getResponseCode() == 200) {
                    inputStream = httpsUrlConn.getInputStream();
                } else {
                    inputStream = httpsUrlConn.getErrorStream();
                }

                BufferedReader rd = new BufferedReader(new InputStreamReader(inputStream, Charset.forName("UTF-8")));
                jsonText = readAll(rd);
                jsonResult = new JSONObject(jsonText);
                fillJSONObject(jsonResult, true, "GET", urlAddress, httpsUrlConn.getResponseCode(), "", "", jsonText);
            } else {
                httpUrlConn = (HttpURLConnection) urlRaw.openConnection();
                httpUrlConn.setDoInput(true);
                httpUrlConn.setDoOutput(true);
                httpUrlConn.setRequestMethod("POST");
                httpUrlConn.addRequestProperty("Authentication", sAPIKey);
                httpUrlConn.addRequestProperty("Content-Type", "application/json");
                httpUrlConn.addRequestProperty("Content-Length", String.valueOf(postRequest.length));
                httpUrlConn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 " +
                                               "(KHTML, like Gecko) Chrome/44.0.2403.52 Safari/537.36 PhantomBotJ/2015");
                httpUrlConn.connect();
                httpUrlConn.getOutputStream().write(postRequest);

                if (httpUrlConn.getResponseCode() == 200) {
                    inputStream = httpUrlConn.getInputStream();
                } else {
                    inputStream = httpUrlConn.getErrorStream();
                }

                BufferedReader rd = new BufferedReader(new InputStreamReader(inputStream, Charset.forName("UTF-8")));
                jsonText = readAll(rd);
                jsonResult = new JSONObject(jsonText);
                fillJSONObject(jsonResult, true, "GET", urlAddress, httpUrlConn.getResponseCode(), "", "", jsonText);
            }
        } catch (JSONException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "JSONException", ex.getMessage(), jsonText);
            com.gmt2001.Console.err.println("DataRenderServiceAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (UnsupportedEncodingException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "UnsupportedEncodingException", ex.getMessage(), jsonText);
            com.gmt2001.Console.err.println("DataRenderServiceAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (NullPointerException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "NullPointerException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("DataRenderServiceAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (MalformedURLException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "MalformedURLException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("DataRenderServiceAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (SocketTimeoutException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "SocketTimeoutException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("DataRenderServiceAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (IOException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "IOException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("DataRenderServiceAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (Exception ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "Exception", ex.getMessage(), "");
            com.gmt2001.Console.err.println("DataRenderServiceAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
        } finally {
            if (inputStream != null)
                try {
                    inputStream.close();
                } catch (IOException ex) {
                    fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "IOException", ex.getMessage(), "");
                    com.gmt2001.Console.err.println("DataRenderServiceAPIv1::readJsonFromUrl::Exception: " + ex.getMessage());
                }
        }

        return(jsonResult);
    }

    /*
     * Sets the API key.
     *
     * @param  String  API Key
     */
    public void setAPIKey(String sAPIKey) {
        this.sAPIKey = sAPIKey;
    }

    /*
     * Sets the URL for accessing the API.
     *
     * @param  String  URL
     */
    public void setAPIURL(String sAPIURL) {
        this.sAPIURL = sAPIURL;
    }

    /*
     * Returns if there is an API key set or not.
     *
     * @return  boolean  API key has been provided.
     */
    public boolean hasAPIKey() {
        return !sAPIKey.isEmpty();
    }

    /*
     * Sends data to the API.
     *
     * @param   String  Input JSON string to send to the API service.
     * @param   String  The channel name to authenticate as.
     * @param   String  The type of data to send.
     * @return  String  Status string.
     */
    public String postData(String jsonString, String channelName, String type) {
        if (sAPIKey.length() == 0) {
            return "no_auth_key";
        }
        JSONObject jsonObject = readJsonFromUrl(sAPIURL + "/upload/" + type + "/" + channelName, jsonString);
        if (jsonObject.has("status")) {
            return jsonObject.getString("status");
        } else {
            return "launch_fail";
        }
    }

    /*
     * Deletes account and related data from the API.
     *
     * @param   String  The channel name to authenticate as.
     * @return  String  Status string.
     */
    public String deleteAllData(String channelName) {
        if (sAPIKey.length() == 0) {
            return "no_auth_key";
        }
        JSONObject jsonObject = readJsonFromUrl(sAPIURL + "/delete/" + channelName, "{}");
        if (jsonObject.has("status")) {
            return jsonObject.getString("status");
        } else {
            return "launch_fail";
        }
    }
}
