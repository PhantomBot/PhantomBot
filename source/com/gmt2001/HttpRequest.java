/*
 * Copyright (C) 2016-2020 phantombot.github.io/PhantomBot
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

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.io.IOUtils;

/**
 *
 * @author gmt2001
 */
public class HttpRequest {

    private static final int TIMEOUT = 5 * 1000;

    public static enum RequestType {

        GET, POST, PUT, DELETE
    }

    private HttpRequest() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    public static HttpResponse getData(RequestType type, String url, String post, HashMap<String, String> headers) {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        HttpResponse r = new HttpResponse();

        r.type = type;
        r.url = url;
        r.post = post;
        r.headers = headers;

        try {
            URL u = new URL(url);

            HttpURLConnection h = (HttpURLConnection) u.openConnection();

            if (u.getUserInfo() != null) {
                String basicAuth = "Basic " + new String(new Base64().encode(u.getUserInfo().getBytes()));
                h.setRequestProperty("Authorization", basicAuth);
            }

            headers.entrySet().stream().forEach((e) -> {
                h.addRequestProperty(e.getKey(), e.getValue());
            });

            h.setRequestMethod(type.name());
            h.setUseCaches(false);
            h.setDefaultUseCaches(false);
            h.setConnectTimeout(TIMEOUT);
            h.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.52 Safari/537.36 PhantomBotJ/2020");
            if (type == RequestType.POST || type == RequestType.PUT) {
                h.setDoOutput(true);
                h.setRequestProperty("Content-Length", "" + post.getBytes().length);
            }

            h.connect();

            if (type == RequestType.POST || type == RequestType.PUT) {
                try (BufferedOutputStream stream = new BufferedOutputStream(h.getOutputStream())) {
                    stream.write(post.getBytes());
                    stream.flush();
                }
            }

            if (h.getResponseCode() < 400) {
                r.content = IOUtils.toString(new BufferedInputStream(h.getInputStream()), h.getContentEncoding());
                r.httpCode = h.getResponseCode();
                r.success = true;
            } else {
                r.content = IOUtils.toString(new BufferedInputStream(h.getErrorStream()), h.getContentEncoding());
                r.httpCode = h.getResponseCode();
                r.success = false;
            }
        } catch (IOException ex) {
            r.success = false;
            r.httpCode = 0;
            r.exception = ex.getMessage();

            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return r;
    }
}
