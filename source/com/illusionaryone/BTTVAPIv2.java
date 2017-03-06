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
import java.nio.charset.Charset;
import javax.net.ssl.HttpsURLConnection;
import org.apache.commons.io.IOUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/*
 * Communicates with the BetterTTV v2 API server.  Currently only
 * supports the GET donations method.
 *
 * @author illusionaryone
 */
public class BTTVAPIv2 {

    private static final BTTVAPIv2 instance = new BTTVAPIv2();
    private static final String sAPIURL = "https://api.betterttv.net/2";
    private static final int iHTTPTimeout = 2 * 1000;

    public static BTTVAPIv2 instance() {
        return instance;
    }

    private BTTVAPIv2() {
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
    private static JSONObject readJsonFromUrl(String urlAddress) {
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
            jsonResult = new JSONObject(jsonText);
            fillJSONObject(jsonResult, true, "GET", urlAddress, urlConn.getResponseCode(), "", "", jsonText);
        } catch (JSONException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "JSONException", ex.getMessage(), jsonText);
            com.gmt2001.Console.err.println("BTTVAPIv2::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (NullPointerException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "NullPointerException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("BTTVAPIv2::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (MalformedURLException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "MalformedURLException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("BTTVAPIv2::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (SocketTimeoutException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "SocketTimeoutException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("BTTVAPIv2::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (IOException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "IOException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("BTTVAPIv2::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (Exception ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "Exception", ex.getMessage(), "");
            com.gmt2001.Console.err.println("BTTVAPIv2::readJsonFromUrl::Exception: " + ex.getMessage());
        } finally {
            if (inputStream != null)
                try {
                    inputStream.close();
                } catch (IOException ex) {
                    fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "IOException", ex.getMessage(), "");
                    com.gmt2001.Console.err.println("BTTVAPIv2::readJsonFromUrl::Exception: " + ex.getMessage());
                }
        }

        return(jsonResult);
    }

    /*
     * Pulls emote information for the local channel.
     *
     * @param channel
     * @return
     */
    public JSONObject GetLocalEmotes(String channel) {
        return readJsonFromUrl(sAPIURL + "/channels/" + channel);
    }

    /*
     * Pulls global emote information.
     *
     * @return
     */
    public JSONObject GetGlobalEmotes() {
        return readJsonFromUrl(sAPIURL + "/emotes");
    }


}
