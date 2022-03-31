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

import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.HttpUrl;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import java.net.URISyntaxException;
import java.util.HashMap;
import org.apache.commons.codec.binary.Base64;

/**
 *
 * @author gmt2001
 */
@Deprecated
public final class HttpRequest {

    public static enum RequestType {

        GET, POST, PATCH, PUT, DELETE
    }

    private HttpRequest() {
    }

    @Deprecated
    public static HttpResponse getData(RequestType type, String url, String post, HashMap<String, String> headers) {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        HttpResponse r = new HttpResponse();
        r.url = url;
        r.headers = headers;
        r.type = type;
        r.post = post;

        try {
            HttpUrl uri = HttpUrl.fromUri(url);
            HttpHeaders h = HttpClient.createHeaders();
            headers.forEach(h::add);

            if (uri.getUserInfo() != null && !uri.getUserInfo().isBlank()) {
                String basicAuth = "Basic " + new String(new Base64().encode(uri.getUserInfo().getBytes()));
                h.add("Authorization", basicAuth);
            }

            HttpClientResponse hcr = HttpClient.request(HttpMethod.valueOf(type.name()), uri, h, post);

            if (hcr.responseCode().code() < 400) {
                r.content = hcr.responseBody();
                r.httpCode = hcr.responseCode().code();
                r.success = true;
            } else {
                r.content = hcr.responseBody();
                r.httpCode = hcr.responseCode().code();
                r.success = false;
            }
        } catch (URISyntaxException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            r.success = false;
            r.exception = ex.getClass().getSimpleName() + ": " + ex.getMessage();
            r.httpCode = 0;
        }

        return r;
    }
}
