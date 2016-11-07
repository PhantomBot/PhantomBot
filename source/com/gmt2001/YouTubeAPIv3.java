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
package com.gmt2001;

import java.io.IOException;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.net.MalformedURLException;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.util.Date;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import javax.net.ssl.HttpsURLConnection;
import me.mast3rplan.phantombot.PhantomBot;
import org.apache.commons.io.IOUtils;
import org.joda.time.Period;
import org.joda.time.format.ISOPeriodFormat;
import org.joda.time.format.PeriodFormatter;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Communicates with YouTube via the version 3 API
 *
 * @author gmt2001
 */
public class YouTubeAPIv3 {

    private static final YouTubeAPIv3 instance = new YouTubeAPIv3();
    private String apikey = "AIzaSyCzHxG53pxE0hWrWBIMMGm75PRHBQ8ZP8c";

    private enum request_type {

        GET, POST, PUT, DELETE
    };

    public static YouTubeAPIv3 instance() {
        return instance;
    }

    private YouTubeAPIv3() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    private JSONObject GetData(request_type type, String url) {
        return GetData(type, url, "");
    }

    @SuppressWarnings( {
        "null", "SleepWhileInLoop", "UseSpecificCatch"
    })
    private JSONObject GetData(request_type type, String url, String post) {
        Date start = new Date();
        Date preconnect = start;
        Date postconnect = start;
        Date prejson = start;
        Date postjson = start;
        JSONObject j = new JSONObject("{}");
        BufferedInputStream i = null;
        String rawcontent = "";
        int available = 0;
        int responsecode = 0;
        long cl = 0;

        try {
            if (url.contains("?") && !url.contains("oembed?")) {
                url += "&utcnow=" + System.currentTimeMillis();
            } else {
                if (!url.contains("oembed?")) {
                    url += "?utcnow=" + System.currentTimeMillis();
                }
            }

            URL u = new URL(url);
            HttpsURLConnection c = (HttpsURLConnection) u.openConnection();

            c.setRequestMethod(type.name());

            c.setUseCaches(false);
            c.setDefaultUseCaches(false);
            c.setConnectTimeout(5000);
            c.setReadTimeout(5000);
            c.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.52 Safari/537.36 PhantomBotJ/2015");
            c.setRequestProperty("Content-Type", "application/json-rpc");
            c.setRequestProperty("Content-length", "0");

            if (!post.isEmpty()) {
                c.setDoOutput(true);
            }

            preconnect = new Date();
            c.connect();
            postconnect = new Date();

            if (!post.isEmpty()) {
                try (BufferedOutputStream o = new BufferedOutputStream(c.getOutputStream())) {
                    IOUtils.write(post, o);
                }
            }

            String content;
            cl = c.getContentLengthLong();
            responsecode = c.getResponseCode();

            if (c.getResponseCode() == 200) {
                i = new BufferedInputStream(c.getInputStream());
            } else {
                i = new BufferedInputStream(c.getErrorStream());
            }

            /*
             * if (i != null) { available = i.available();
             *
             * while (available == 0 && (new Date().getTime() -
             * postconnect.getTime()) < 450) { Thread.sleep(500); available =
             * i.available(); }
             *
             * if (available == 0) { i = new
             * BufferedInputStream(c.getErrorStream());
             *
             * if (i != null) { available = i.available(); } } }
             *
             * if (available == 0) { content = "{}"; } else { content =
             * IOUtils.toString(i, c.getContentEncoding()); }
             */
            content = IOUtils.toString(i, c.getContentEncoding());
            rawcontent = content;
            prejson = new Date();
            j = new JSONObject(content);
            j.put("_success", true);
            j.put("_type", type.name());
            j.put("_url", url);
            j.put("_post", post);
            j.put("_http", c.getResponseCode());
            j.put("_available", available);
            j.put("_exception", "");
            j.put("_exceptionMessage", "");
            j.put("_content", content);
            postjson = new Date();
        } catch (JSONException ex) {
            if (ex.getMessage().contains("A JSONObject text must begin with")) {
                j = new JSONObject("{}");
                j.put("_success", true);
                j.put("_type", type.name());
                j.put("_url", url);
                j.put("_post", post);
                j.put("_http", 0);
                j.put("_available", available);
                j.put("_exception", "MalformedJSONData (HTTP " + responsecode + ")");
                j.put("_exceptionMessage", "");
                j.put("_content", rawcontent);
            } else {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        } catch (NullPointerException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        } catch (MalformedURLException ex) {
            j.put("_success", false);
            j.put("_type", type.name());
            j.put("_url", url);
            j.put("_post", post);
            j.put("_http", 0);
            j.put("_available", available);
            j.put("_exception", "MalformedURLException");
            j.put("_exceptionMessage", ex.getMessage());
            j.put("_content", "");

            if (PhantomBot.enableDebugging) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } else {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        } catch (SocketTimeoutException ex) {
            j.put("_success", false);
            j.put("_type", type.name());
            j.put("_url", url);
            j.put("_post", post);
            j.put("_http", 0);
            j.put("_available", available);
            j.put("_exception", "SocketTimeoutException");
            j.put("_exceptionMessage", ex.getMessage());
            j.put("_content", "");

            if (PhantomBot.enableDebugging) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } else {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        } catch (IOException ex) {
            j.put("_success", false);
            j.put("_type", type.name());
            j.put("_url", url);
            j.put("_post", post);
            j.put("_http", 0);
            j.put("_available", available);
            j.put("_exception", "IOException");
            j.put("_exceptionMessage", ex.getMessage());
            j.put("_content", "");

            if (PhantomBot.enableDebugging) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } else {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        } catch (Exception ex) {
            j.put("_success", false);
            j.put("_type", type.name());
            j.put("_url", url);
            j.put("_post", post);
            j.put("_http", 0);
            j.put("_available", available);
            j.put("_exception", "Exception [" + ex.getClass().getName() + "]");
            j.put("_exceptionMessage", ex.getMessage());
            j.put("_content", "");

            if (PhantomBot.enableDebugging) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } else {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }

        if (i != null) {
            try {
                i.close();
            } catch (IOException ex) {
                j.put("_success", false);
                j.put("_type", type.name());
                j.put("_url", url);
                j.put("_post", post);
                j.put("_http", 0);
                j.put("_available", available);
                j.put("_exception", "IOException");
                j.put("_exceptionMessage", ex.getMessage());
                j.put("_content", "");

                if (PhantomBot.enableDebugging) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } else {
                    com.gmt2001.Console.err.logStackTrace(ex);
                }
            }
        }

        com.gmt2001.Console.debug.println("YouTubeAPIv3.GetData Timers " + (preconnect.getTime() - start.getTime()) + " "
                                            + (postconnect.getTime() - start.getTime()) + " " + (prejson.getTime() - start.getTime()) + " "
                                            + (postjson.getTime() - start.getTime()) + " " + start.toString() + " " + postjson.toString());
        com.gmt2001.Console.debug.println("YouTubeAPIv3.GetData Exception " + j.getString("_exception") + " " + j.getString("_exceptionMessage"));
        com.gmt2001.Console.debug.println("YouTubeAPIv3.GetData HTTP/Available " + j.getInt("_http") + "(" + responsecode + ")/" + j.getInt("_available") + "(" + cl + ")");
        com.gmt2001.Console.debug.println("YouTubeAPIv3.GetData RawContent[0,100] " + j.getString("_content").substring(0, Math.min(100, j.getString("_content").length())));

        return j;
    }

    public void SetAPIKey(String apikey) {
        this.apikey = apikey;
    }

    public String[] SearchForVideo(String q) {
        if (PhantomBot.enableDebugging) {
            com.gmt2001.Console.debug.println("YouTubeAPIv3.SearchForVideo Start q=" + q);
        }

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
                com.gmt2001.Console.debug.println("YouTubeAPIv3.SearchForVideo End Private");

                return new String[] {
                           q, "Video Marked Private", ""
                       };
            }

            if (j.getInt("_http") == 200) {
                try {
                    com.gmt2001.Console.debug.println("YouTubeAPIv3.SearchForVideo End Success");

                    String a = j.getString("title");
                    return new String[] {
                               q, a, ""
                           };
                } catch (Exception e) {
                    com.gmt2001.Console.debug.println("YouTubeAPIv3.SearchForVideo Exception");

                    return new String[] {
                               "", "", ""
                           };
                }
            }
        } else {
            q = q.replaceAll("[^a-zA-Z0-9 ]", "");
            q = q.replace(" ", "%20");

            JSONObject j2 = GetData(request_type.GET, "https://www.googleapis.com/youtube/v3/search?q=" + q + "&key=" + apikey + "&type=video&part=snippet&maxResults=1");
            if (j2.getBoolean("_success")) {
                if (j2.getInt("_http") == 200) {
                    JSONObject pageInfo = j2.getJSONObject("pageInfo");
                    if (pageInfo.getInt("totalResults") == 0) {
                        com.gmt2001.Console.debug.println("YouTubeAPIv3.SearchForVideo End No Results");

                        return new String[] {
                                   q, "No Search Results Found", ""
                               };
                    }

                    JSONArray a = j2.getJSONArray("items");
                    if (a.length() > 0) {
                        JSONObject it = a.getJSONObject(0);

                        JSONObject id = it.getJSONObject("id");
                        JSONObject sn = it.getJSONObject("snippet");

                        com.gmt2001.Console.debug.println("YouTubeAPIv3.SearchForVideo End Success2");

                        return new String[] {
                                   id.getString("videoId"), sn.getString("title"), sn.getString("channelTitle")
                               };
                    } else {
                        com.gmt2001.Console.debug.println("YouTubeAPIv3.SearchForVideo End Fail");

                        return new String[] {
                                   "", "", ""
                               };
                    }
                } else {
                    com.gmt2001.Console.debug.println("YouTubeAPIv3.SearchForVideo End Fail2");

                    return new String[] {
                               "", "", ""
                           };
                }
            } else {
                com.gmt2001.Console.debug.println("YouTubeAPIv3.SearchForVideo End Fail3");

                return new String[] {
                           "", "", ""
                       };
            }
        }

        if (PhantomBot.enableDebugging) {
            com.gmt2001.Console.debug.println("YouTubeAPIv3.SearchForVideo End Fail4");
        }

        return new String[] {
                   "", "", ""
               };
    }

    public int[] GetVideoLength(String id) {
        com.gmt2001.Console.debug.println("YouTubeAPIv3.GetVideoLength Start id=" + id);

        JSONObject j = GetData(request_type.GET, "https://www.googleapis.com/youtube/v3/videos?id=" + id + "&key=" + apikey + "&part=contentDetails");
        if (j.getBoolean("_success")) {
            if (j.getInt("_http") == 200) {
                JSONArray a = j.getJSONArray("items");
                if (a.length() > 0) {
                    JSONObject i = a.getJSONObject(0);

                    JSONObject cd = i.getJSONObject("contentDetails");

                    PeriodFormatter formatter = ISOPeriodFormat.standard();

                    Period d = formatter.parsePeriod(cd.getString("duration"));

                    if (cd.getString("duration").equalsIgnoreCase("PT0S")) {
                        com.gmt2001.Console.debug.println("YouTubeAPIv3.GetVideoLength Fail (Live Stream)");
                        return new int[] {
                               123, 456, 7899
                           };
                    }

                    //String d = cd.getString("duration").substring(2);
                    int h, m, s;

                    String hours = d.toStandardHours().toString().substring(2);
                    h = Integer.parseInt(hours.substring(0, hours.indexOf("H")));

                    String minutes = d.toStandardMinutes().toString().substring(2);
                    m = Integer.parseInt(minutes.substring(0, minutes.indexOf("M")));

                    String seconds = d.toStandardSeconds().toString().substring(2);
                    s = Integer.parseInt(seconds.substring(0, seconds.indexOf("S")));

                    /*
                     * if (d.contains("H")) { h =
                     * Integer.parseInt(d.substring(0, d.indexOf("H")));
                     *
                     * d = d.substring(0, d.indexOf("H")); }
                     *
                     * if (d.contains("M")) { m =
                     * Integer.parseInt(d.substring(0, d.indexOf("M")));
                     *
                     * d = d.substring(0, d.indexOf("M")); }
                     *
                     * s = Integer.parseInt(d.substring(0, d.indexOf("S")));
                     */
                    com.gmt2001.Console.debug.println("YouTubeAPIv3.GetVideoLength Success");

                    return new int[] {
                               h, m, s
                           };
                } else {
                    com.gmt2001.Console.debug.println("YouTubeAPIv3.GetVideoLength Fail");

                    return new int[] {
                               0, 0, 0
                           };
                }
            } else {
                com.gmt2001.Console.debug.println("YouTubeAPIv3.GetVideoLength Fail2");

                return new int[] {
                           0, 0, 0
                       };
            }
        }
        com.gmt2001.Console.debug.println("YouTubeAPIv3.GetVideoLength Fail3");

        return new int[] {
                   0, 0, 0
               };
    }
}
