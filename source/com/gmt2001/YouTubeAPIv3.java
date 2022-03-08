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
package com.gmt2001;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.MalformedURLException;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.net.ssl.HttpsURLConnection;
import org.joda.time.Period;
import org.joda.time.format.ISOPeriodFormat;
import org.joda.time.format.PeriodFormatter;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;

/**
 * Communicates with YouTube via the version 3 API
 *
 * @author gmt2001
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

    @SuppressWarnings( {
        "null", "SleepWhileInLoop", "UseSpecificCatch"
    })
    private JSONObject GetData(request_type type, String urlAddress) throws JSONException {
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

            /* If the JSON was properly parsed then we may have received back a proper error JSON payload from YouTube. */
            if (jsonResult.has("error")) {
                if (jsonResult.getJSONObject("error").has("errors")) {
                    JSONArray jaerror = jsonResult.getJSONObject("error").getJSONArray("errors");
                    if (jaerror.getJSONObject(0).has("reason") && jaerror.getJSONObject(0).has("domain")) {
                        com.gmt2001.Console.err.println("YouTubeAPIv3 Error: [Domain] " + jaerror.getJSONObject(0).getString("domain") + 
                                                        " [Reason] " + jaerror.getJSONObject(0).getString("reason"));
                    }
                }
            }
        } catch (JSONException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "JSONException", ex.getMessage(), jsonText);
            if (!urlAddress.startsWith("https://www.youtube.com/oembed")) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } catch (NullPointerException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "NullPointerException", ex.getMessage(), "");
            com.gmt2001.Console.err.printStackTrace(ex);
        } catch (MalformedURLException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "MalformedURLException", ex.getMessage(), "");
            com.gmt2001.Console.err.printStackTrace(ex);
        } catch (SocketTimeoutException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "SocketTimeoutException", ex.getMessage(), "");
            com.gmt2001.Console.err.printStackTrace(ex);
        } catch (IOException ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "IOException", ex.getMessage(), "");
            com.gmt2001.Console.err.printStackTrace(ex);
        } catch (Exception ex) {
            fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "Exception", ex.getMessage(), "");
            com.gmt2001.Console.err.printStackTrace(ex);
        } finally {
            if (inputStream != null)
                try {
                    inputStream.close();
                } catch (IOException ex) {
                    fillJSONObject(jsonResult, false, "GET", urlAddress, 0, "IOException", ex.getMessage(), "");
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
        }
        com.gmt2001.Console.debug.logln(jsonResult.toString().replaceAll(apikey, "xxx"));
        return(jsonResult);
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

        JSONObject j = GetData(request_type.GET, "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=" + q + "&format=json");
        if (j.getBoolean("_success") && !j.toString().contains("Bad Request") && !j.toString().contains("Not Found")) {
            if (j.toString().contains("Unauthorized")) {
                com.gmt2001.Console.debug.println("URL Check Returned Unauthorized (Video Marked Private)");

                return new String[] { q, "Video Marked Private", "" };
            }

            if (j.getInt("_http") == 200) {
                try {
                    com.gmt2001.Console.debug.println("URL Check Success");

                    String a = j.getString("title");
                    return new String[] { q, a, "" };
                } catch (JSONException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);

                    return new String[] { "", "", "" };
                }
            }
        } else {
            q = URLEncoder.encode(q, Charset.forName("UTF-8"));

            JSONObject j2 = GetData(request_type.GET, "https://www.googleapis.com/youtube/v3/search?q=" + q + "&key=" + apikey + "&type=video&part=snippet&maxResults=1");
            if (j2.getBoolean("_success")) {
                updateQuota(100L);
                if (j2.getInt("_http") == 200) {
                    JSONObject pageInfo = j2.getJSONObject("pageInfo");
                    if (pageInfo.getInt("totalResults") == 0) {
                        com.gmt2001.Console.debug.println("Search API Called: No Results");

                        return new String[] { q, "No Search Results Found", "" };
                    }

                    JSONArray a = j2.getJSONArray("items");
                    if (a.length() > 0) {
                        JSONObject it = a.getJSONObject(0);

                        JSONObject id = it.getJSONObject("id");
                        JSONObject sn = it.getJSONObject("snippet");

                        com.gmt2001.Console.debug.println("Search API Success");

                        return new String[] { id.getString("videoId"), sn.getString("title"), sn.getString("channelTitle") };
                    } else {
                        com.gmt2001.Console.debug.println("Search API Fail: Length == 0");

                        return new String[] { "", "", "" };
                    }
                } else {
                    com.gmt2001.Console.debug.println("Search API Fail: HTTP Code " + j2.getInt("_http"));

                    return new String[] { "", "", "" };
                }
            } else {
                com.gmt2001.Console.debug.println("Search API Fail: Returned Failure");

                return new String[] { "", "", "" };
            }
        }

        com.gmt2001.Console.debug.println("URL Check Fatal Error");

        return new String[] { "", "", "" };
    }

    public int[] GetVideoLength(String id) throws JSONException {
        com.gmt2001.Console.debug.println("Query = [" + id + "]");

        JSONObject j = GetData(request_type.GET, "https://www.googleapis.com/youtube/v3/videos?id=" + id + "&key=" + apikey + "&part=contentDetails");
        if (j.getBoolean("_success")) {
            if (j.getInt("_http") == 200) {
                updateQuota(3L);
                JSONArray a = j.getJSONArray("items");
                if (a.length() > 0) {
                    JSONObject i = a.getJSONObject(0);

                    JSONObject cd = i.getJSONObject("contentDetails");

                    PeriodFormatter formatter = ISOPeriodFormat.standard();

                    Period d = formatter.parsePeriod(cd.getString("duration"));

                    if (cd.getString("duration").equalsIgnoreCase("PT0S")) {
                        com.gmt2001.Console.debug.println("Videos API: Live Stream Detected");
                        return new int[] { 123, 456, 7899 };
                    }

                    int h, m, s;

                    String hours = d.toStandardHours().toString().substring(2);
                    h = Integer.parseInt(hours.substring(0, hours.indexOf("H")));

                    String minutes = d.toStandardMinutes().toString().substring(2);
                    m = Integer.parseInt(minutes.substring(0, minutes.indexOf("M")));

                    String seconds = d.toStandardSeconds().toString().substring(2);
                    s = Integer.parseInt(seconds.substring(0, seconds.indexOf("S")));

                    com.gmt2001.Console.debug.println("Videos API Success");

                    return new int[] { h, m, s };
                } else {
                    com.gmt2001.Console.debug.println("Videos API Fail: Length == 0");
                    return new int[] { 0, 0, 0 };
                }
            } else {
                com.gmt2001.Console.debug.println("Videos API Fail: HTTP Code " + j.getInt("_http"));
                return new int[] { 0, 0, 0 };
            }
        }
        com.gmt2001.Console.debug.println("Videos API Fatal Error");

        return new int[] { 0, 0, 0 };
    }

    public int[] GetVideoInfo(String id) throws JSONException {
        int licenseRetval = 0;
        int embedRetval = 0;

        JSONObject jsonObject = GetData(request_type.GET, "https://www.googleapis.com/youtube/v3/videos?id=" + id + "&key=" + apikey + "&part=status");

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
            } else {
                com.gmt2001.Console.debug.println("Videos API Fail: HTTP Code " + jsonObject.getInt("_http"));
            }
        } else {
            com.gmt2001.Console.debug.println("Videos API Fatal Error");
        }
        
        return new int[] { licenseRetval, embedRetval };
    }

    private void updateQuota(long quota) {
        long storedQuota = getDBLong("quotaPoints", 0L);
        String storedDate = getDBString("quotaDate", "01-01-2000");

        SimpleDateFormat datefmt = new SimpleDateFormat("dd-MM-yyyy");
        datefmt.setTimeZone(TimeZone.getTimeZone("America/Los_Angeles"));
        String currentDate = datefmt.format(new Date());

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
