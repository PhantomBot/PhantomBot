
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
package com.illusionaryone;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.MalformedURLException;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.nio.charset.Charset;
import java.util.regex.Pattern;
import javax.net.ssl.HttpsURLConnection;

import tv.phantombot.RepoVersion;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/*
 * Communicates with GitHub API v3
 *
 * @author illusionaryone
 */
public class GitHubAPIv3 {

    private static GitHubAPIv3 instance;
    private static final String sAPIURL = "https://api.github.com/repos/PhantomBotDE/PhantomBotDE";
    private static final int iHTTPTimeout = 2 * 1000;

    public static synchronized GitHubAPIv3 instance() {
        if (instance == null) {
            instance = new GitHubAPIv3();
        }

        return instance;
    }

    private GitHubAPIv3() {
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
    private static JSONObject readJsonFromUrl(String urlAddress, boolean isArray) throws JSONException {
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
            com.gmt2001.Console.err.println("GitHubv3API::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (NullPointerException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "NullPointerException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("GitHubv3API::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (MalformedURLException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "MalformedURLException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("GitHubv3API::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (SocketTimeoutException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "SocketTimeoutException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("GitHubv3API::readJsonFromUrl::Exception: " + ex.getMessage());
        } catch (IOException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "IOException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("GitHubv3API::readJsonFromUrl::Exception: " + ex.getMessage());
            com.gmt2001.Console.err.printStackTrace(ex);
        } catch (Exception ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "Exception", ex.getMessage(), "");
            com.gmt2001.Console.err.println("GitHubv3API::readJsonFromUrl::Exception: " + ex.getMessage());
        } finally {
            if (inputStream != null)
                try {
                    inputStream.close();
                } catch (IOException ex) {
                    fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "IOException", ex.getMessage(), "");
                    com.gmt2001.Console.err.println("GitHubv3API::readJsonFromUrl::Exception: " + ex.getMessage());
                }
        }

        return(jsonResult);
    }

    /*
     * Pulls release information from GitHub.
     *
     * @return  JSONObject  JSONObject from GitHub
     */
    public JSONObject GetReleases() throws JSONException {
        return readJsonFromUrl(sAPIURL + "/releases", true);
    }

    /*
     * Pulls release information from GitHub and checks to see if there is a new release.
     *
     * @return  String  null if no new version detected else the version and URL to download the release
     */
    public String[] CheckNewRelease() throws JSONException {
        JSONObject jsonObject = GetReleases();
        JSONArray jsonArray = jsonObject.getJSONArray("array");
        if (!jsonArray.getJSONObject(0).has("tag_name")) {
            return null;
        }
        String tagName = jsonArray.getJSONObject(0).getString("tag_name");
        if (tagName.equals("v" + RepoVersion.getPhantomBotVersion().split("-")[0])) {
            return null;
        }

        if (!jsonArray.getJSONObject(0).has("assets")) {
            return null;
        }

        String os = "";
        String osname = System.getProperty("os.name").toLowerCase();

        if (osname.contains("win")) {
            os = "-win";
        } else if (osname.contains("mac")) {
            os = "-mac";
        } else if (osname.contains("nix") || osname.contains("nux") || osname.contains("aix")) {
            if (System.getProperty("os.arch").toLowerCase().contains("arm")) {
                os = "-arm";
            } else {
                os = "-lin";
            }
        }

        JSONArray assetsArray = jsonArray.getJSONObject(0).getJSONArray("assets");
        Pattern p = Pattern.compile(".*PhantomBot-[0-9]+\\.[0-9]+\\.[0-9]+" + os + "\\.zip", Pattern.CASE_INSENSITIVE);
        int i;
        boolean found = false;
        for (i = 0; i < assetsArray.length(); i++) {
            if (assetsArray.getJSONObject(i).has("browser_download_url") && p.matcher(assetsArray.getJSONObject(i).getString("browser_download_url")).matches()) {
                found = true;
                break;
            }
        }

        if (!found) {
            p = Pattern.compile(".*PhantomBot-[0-9]+\\.[0-9]+\\.[0-9]+\\.zip", Pattern.CASE_INSENSITIVE);
            for (i = 0; i < assetsArray.length(); i++) {
                if (assetsArray.getJSONObject(i).has("browser_download_url") && p.matcher(assetsArray.getJSONObject(i).getString("browser_download_url")).matches()) {
                    break;
                }
        }
        }

        return new String[] { tagName, assetsArray.getJSONObject(i).getString("browser_download_url") };
    }

}
