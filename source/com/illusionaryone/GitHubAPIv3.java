
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
import java.net.URISyntaxException;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;
import tv.phantombot.RepoVersion;

/*
 * Communicates with GitHub API v3
 *
 * @author illusionaryone
 */
public final class GitHubAPIv3 {

    private static final String BASE_URL = "https://api.github.com/repos/PhantomBot/PhantomBot";

    private GitHubAPIv3() {
    }

    private static JSONObject readJsonFromUrl(String endPoint, boolean isArray) throws JSONException {
        JSONObject jsonResult = new JSONObject();

        try {
            HttpClientResponse response = HttpClient.get(HttpUrl.fromUri(BASE_URL, endPoint));
            if (isArray) {
                jsonResult.put("array", new JSONArray(response.responseBody()));
            } else {
                jsonResult = response.json();
            }
            HttpRequest.generateJSONObject(jsonResult, true, "GET", "", endPoint, response.responseCode().code(), "", "");
        } catch (URISyntaxException | JSONException ex) {
            HttpRequest.generateJSONObject(jsonResult, false, "GET", "", endPoint, 0, ex.getClass().getSimpleName(), ex.getMessage());
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return jsonResult;
    }

    /*
     * Pulls release information from GitHub.
     *
     * @return  JSONObject  JSONObject from GitHub
     */
    public static JSONObject GetReleases() throws JSONException {
        return readJsonFromUrl("/releases", true);
    }

    /*
     * Pulls release information from GitHub.
     *
     * @return  JSONObject  JSONObject from GitHub
     */
    public static JSONObject GetLatestRelease() throws JSONException {
        return readJsonFromUrl("/releases/latest", false);
    }

    /*
     * Pulls release information from GitHub and checks to see if there is a new release.
     *
     * @return  String  null if no new version detected else the version and URL to download the release
     */
    public static String[] CheckNewRelease() throws JSONException {
        JSONObject jsonObject = GetLatestRelease();
        if (!jsonObject.has("tag_name")) {
            return null;
        }
        String tagName = jsonObject.getString("tag_name");
        if (tagName.equals("v" + RepoVersion.getPhantomBotVersion().split("-")[0])) {
            return null;
        }

        if (!jsonObject.has("assets")) {
            return null;
        }

        String os = PhantomBot.getOsSuffix();

        JSONArray assetsArray = jsonObject.getJSONArray("assets");
        Pattern p = Pattern.compile(".*PhantomBot-([0-9]+\\.?)+" + os + "\\.zip", Pattern.CASE_INSENSITIVE);
        int i;
        boolean found = false;
        for (i = 0; i < assetsArray.length(); i++) {
            if (assetsArray.getJSONObject(i).has("browser_download_url") && p.matcher(assetsArray.getJSONObject(i).getString("browser_download_url")).matches()) {
                found = true;
                break;
            }
        }

        if (!found) {
            p = Pattern.compile(".*PhantomBot-([0-9]+\\.?)+\\.zip", Pattern.CASE_INSENSITIVE);
            for (i = 0; i < assetsArray.length(); i++) {
                if (assetsArray.getJSONObject(i).has("browser_download_url") && p.matcher(assetsArray.getJSONObject(i).getString("browser_download_url")).matches()) {
                    break;
                }
            }
        }

        return new String[]{tagName, assetsArray.getJSONObject(i).getString("browser_download_url")};
    }
}
