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

import com.gmt2001.HttpRequest;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.URIUtil;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import reactor.core.publisher.Mono;
import tv.phantombot.PhantomBot;

/**
 * Communicates with YouTube via the version 3 API
 */
public class YouTubeAPIv3 {

    private static YouTubeAPIv3 instance;
    private String apikey = "";

    private enum request_type {

        GET, POST, PUT, DELETE
    };

    public static synchronized YouTubeAPIv3 instance() {
        if (instance == null) {
            instance = new YouTubeAPIv3();
        }

        return instance;
    }

    private YouTubeAPIv3() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    @SuppressWarnings({
        "null", "SleepWhileInLoop", "UseSpecificCatch"
    })
    private JSONObject GetData(String urlAddress) throws JSONException {
        JSONObject jsonResult = new JSONObject("{}");

        try {
            HttpClientResponse resp = HttpClient.get(URIUtil.create(urlAddress));
            boolean success = false;
            if (resp.hasJson()) {
                String jsonText = resp.responseBody();
                jsonResult = new JSONObject(jsonText);

                success = true;
                /* If the JSON was properly parsed then we may have received back a proper error JSON payload from YouTube. */
                if (jsonResult.has("error")) {
                    if (jsonResult.getJSONObject("error").has("errors")) {
                        JSONArray jaerror = jsonResult.getJSONObject("error").getJSONArray("errors");
                        if (jaerror.getJSONObject(0).has("reason") && jaerror.getJSONObject(0).has("domain")) {
                            com.gmt2001.Console.err.println("YouTubeAPIv3 Error: [Domain] " + jaerror.getJSONObject(0).getString("domain")
                                    + " [Reason] " + jaerror.getJSONObject(0).getString("reason"));
                        }
                    }
                }
            } else {
                jsonResult = new JSONObject();
                jsonResult.put("code", resp.responseCode().code());
                jsonResult.put("status", resp.responseCode().reasonPhrase());
                jsonResult.put("error", resp.responseBody() == null ? "" : resp.responseBody());
            }
            HttpRequest.generateJSONObject(jsonResult, success, "GET", "", urlAddress, resp.responseCode().code(), null, null);
        } catch (Exception ex) {
            HttpRequest.generateJSONObject(jsonResult, false, "GET", "", urlAddress, 0, ex.getClass().getName(), ex.getMessage());
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        com.gmt2001.Console.debug.logln(jsonResult.toString().replaceAll(apikey, "xxx"));
        return (jsonResult);
    }

    public void SetAPIKey(String apikey) {
        this.apikey = apikey;
    }

    public String[] SearchForVideo(String q) throws JSONException {
        com.gmt2001.Console.debug.println("Query = [" + q + "]");

        if (q.contains("v=") | q.contains("?v=")) {
            q = q.substring(q.indexOf("v=") + 2, q.indexOf("v=") + 13);
        }
        Pattern pattern = Pattern.compile(".*(?:youtu.be\\/|v\\/|u\\/\\w\\/|embed\\/|watch\\?v=)([^#\\&\\?^\\s]*).*");
        Matcher matcher = pattern.matcher(q);

        if (matcher.matches()) {
            q = matcher.group(1);
        }

        JSONObject j = GetData("https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=" + URLEncoder.encode(q, Charset.forName("UTF-8")) + "&format=json");
        if (j.getBoolean("_success") && !j.toString().contains("Bad Request") && !j.toString().contains("Not Found")) {
            if (j.toString().contains("Unauthorized")) {
                com.gmt2001.Console.debug.println("URL Check Returned Unauthorized (Video Marked Private)");

                return new String[]{q, "Video Marked Private", ""};
            }

            if (j.getInt("_http") == 200) {
                try {
                    com.gmt2001.Console.debug.println("URL Check Success");

                    String a = j.getString("title");
                    return new String[]{q, a, ""};
                } catch (JSONException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);

                    return new String[]{"", "", ""};
                }
            }
        } else {
            q = URLEncoder.encode(q, Charset.forName("UTF-8"));

            JSONObject j2 = GetData("https://www.googleapis.com/youtube/v3/search?q=" + q + "&key=" + apikey + "&type=video&part=snippet&maxResults=1");
            if (j2.getBoolean("_success")) {
                updateQuota(100L);
                if (j2.getInt("_http") == 200) {
                    JSONObject pageInfo = j2.getJSONObject("pageInfo");
                    if (pageInfo.getInt("totalResults") == 0) {
                        com.gmt2001.Console.debug.println("Search API Called: No Results");

                        return new String[]{q, "No Search Results Found", ""};
                    }

                    JSONArray a = j2.getJSONArray("items");
                    if (a.length() > 0) {
                        JSONObject it = a.getJSONObject(0);

                        JSONObject id = it.getJSONObject("id");
                        JSONObject sn = it.getJSONObject("snippet");

                        com.gmt2001.Console.debug.println("Search API Success");

                        return new String[]{id.getString("videoId"), sn.getString("title"), sn.getString("channelTitle")};
                    } else {
                        com.gmt2001.Console.debug.println("Search API Fail: Length == 0");

                        return new String[]{"", "", ""};
                    }
                } else {
                    com.gmt2001.Console.debug.println("Search API Fail: HTTP Code " + j2.getInt("_http"));

                    return new String[]{"", "", ""};
                }
            } else {
                com.gmt2001.Console.debug.println("Search API Fail: Returned Failure");

                return new String[]{"", "", ""};
            }
        }

        com.gmt2001.Console.debug.println("URL Check Fatal Error");

        return new String[]{"", "", ""};
    }

    public int[] GetVideoLength(String id) throws JSONException {
        return this.GetVideoLength(id, false);
    }

    public int[] GetVideoLength(String id, boolean isRetry) throws JSONException {
        com.gmt2001.Console.debug.println("Query = [" + id + "]");

        JSONObject j = GetData("https://www.googleapis.com/youtube/v3/videos?id=" + id + "&key=" + apikey + "&part=contentDetails");
        if (j.getBoolean("_success")) {
            if (j.getInt("_http") == 200) {
                updateQuota(3L);
                JSONArray a = j.getJSONArray("items");
                if (a.length() > 0) {
                    JSONObject i = a.getJSONObject(0);

                    JSONObject cd = i.getJSONObject("contentDetails");

                    com.gmt2001.Console.debug.println(cd.getString("duration"));
                    Duration d = Duration.parse(cd.getString("duration"));

                    if (cd.getString("duration").equalsIgnoreCase("PT0S")) {
                        com.gmt2001.Console.debug.println("Videos API: Live Stream Detected");
                        return new int[]{0, 123, 456, 7899};
                    }

                    com.gmt2001.Console.debug.println("Videos API Success " + (int) d.toSeconds() + "TS " + (int) d.toHours() + "D " + d.toMinutesPart() + "M " + d.toSecondsPart() + "S");

                    return new int[]{(int) d.toSeconds(), (int) d.toHours(), d.toMinutesPart(), d.toSecondsPart()};
                } else {
                    com.gmt2001.Console.debug.println("Videos API Fail: Length == 0");
                    return new int[]{0, 0, 0, 0};
                }
            } else if (j.getInt("_http") == 403 && !isRetry) {
                com.gmt2001.Console.out.println("Detected 403, trying again in 5 seconds...");
                Mono.delay(Duration.ofSeconds(5)).block();
                return this.GetVideoLength(id, true);
            } else {
                com.gmt2001.Console.debug.println("Videos API Fail: HTTP Code " + j.getInt("_http"));
                return new int[]{0, 0, 0, 0};
            }
        }
        com.gmt2001.Console.debug.println("Videos API Fatal Error");

        return new int[]{0, 0, 0, 0};
    }

    public int[] GetVideoInfo(String id) throws JSONException {
        return this.GetVideoInfo(id, false);
    }

    public int[] GetVideoInfo(String id, boolean isRetry) throws JSONException {
        int licenseRetval = 0;
        int embedRetval = 0;

        JSONObject jsonObject = GetData("https://www.googleapis.com/youtube/v3/videos?id=" + id + "&key=" + apikey + "&part=status");

        if (jsonObject.getBoolean("_success")) {
            if (jsonObject.getInt("_http") == 200) {
                updateQuota(3L);
                JSONArray items = jsonObject.getJSONArray("items");
                if (items.length() > 0) {
                    JSONObject item = items.getJSONObject(0);
                    JSONObject status = item.getJSONObject("status");

                    String license = status.getString("license");
                    boolean embeddable = status.getBoolean("embeddable");

                    licenseRetval = license.equals("creativeCommon") ? 1 : 0;
                    embedRetval = embeddable == true ? 1 : 0;

                    com.gmt2001.Console.debug.println("Videos API Success");
                } else {
                    com.gmt2001.Console.debug.println("Videos API Fail: Length == 0");
                }
            } else if (jsonObject.getInt("_http") == 403 && !isRetry) {
                com.gmt2001.Console.out.println("Detected 403, trying again in 5 seconds...");
                Mono.delay(Duration.ofSeconds(5)).block();
                return this.GetVideoInfo(id, true);
            } else {
                com.gmt2001.Console.debug.println("Videos API Fail: HTTP Code " + jsonObject.getInt("_http"));
            }
        } else {
            com.gmt2001.Console.debug.println("Videos API Fatal Error");
        }

        return new int[]{licenseRetval, embedRetval};
    }

    private void updateQuota(long quota) {
        long storedQuota = getDBLong("quotaPoints", 0L);
        String storedDate = getDBString("quotaDate", "01-01-2000");

        String currentDate = LocalDate.now(ZoneId.of("America/Los_Angeles")).format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));

        if (!currentDate.equals(storedDate)) {
            com.gmt2001.Console.debug.println("Date Change Detected: " + storedDate + " -> " + currentDate);
            com.gmt2001.Console.debug.println("Resetting Quota. New Quota: " + quota);
            updateDBString("quotaDate", currentDate);
            updateDBLong("quotaPoints", quota);
        } else {
            com.gmt2001.Console.debug.println("Updating Quota. New Quota: " + (quota + storedQuota));
            updateDBLong("quotaPoints", quota + storedQuota);
        }
    }

    /*
     * Checks the database for data and returns a long.
     *
     * @param   String   Database key to inspect.
     * @return  long     defaultVal if no value in database else value from database.
     */
    private long getDBLong(String dbKey, long defaultVal) {
        String dbData = PhantomBot.instance().getDataStore().GetString("youtubePlayer", "", dbKey);
        if (dbData == null) {
            return defaultVal;
        }
        return Long.parseLong(dbData);
    }

    /*
     * Checks the database for data and returns a String.
     *
     * @param   String   Database key to inspect.
     * @return  String   defaultVal is no value in database else value from database.
     */
    private String getDBString(String dbKey, String defaultVal) {
        String dbData = PhantomBot.instance().getDataStore().GetString("youtubePlayer", "", dbKey);
        if (dbData == null) {
            return defaultVal;
        }
        return dbData;
    }

    /*
     * Places a long into the database.
     *
     * @param  String  Database key to insert into.
     * @param  long    Value to update into the database.
     */
    private void updateDBLong(String dbKey, long dbValue) {
        PhantomBot.instance().getDataStore().SetString("youtubePlayer", "", dbKey, Long.toString(dbValue));
    }

    /*
     * Places a string into the database.
     *
     * @param  String  Database key to insert into.
     * @param  String  Value to update into the database.
     */
    private void updateDBString(String dbKey, String dbValue) {
        PhantomBot.instance().getDataStore().SetString("youtubePlayer", "", dbKey, dbValue);
    }

}
