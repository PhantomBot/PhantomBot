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
import org.json.JSONException;
import org.json.JSONObject;

/**
 *
 * @author gmt2001
 */
@Deprecated
public final class HttpRequest {

    @Deprecated
    public static enum RequestType {

        GET, POST, PATCH, PUT, DELETE
    }

    private HttpRequest() {
    }

    @Deprecated
    public static HttpResponse getData(RequestType type, String url, String post, HashMap<String, String> headers) {
        return getData(type, url, post, headers, false);
    }

    @Deprecated
    public static HttpResponse getData(RequestType type, String url, String post, HashMap<String, String> headers, boolean isJson) {
        try {
            return getData(type, HttpUrl.fromUri(url), post, headers, isJson);
        } catch (URISyntaxException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            HttpResponse r = new HttpResponse();
            r.url = url;
            r.headers = headers;
            r.type = type;
            r.post = post;
            r.success = false;
            r.exception = ex.getClass().getSimpleName() + ": " + ex.getMessage();
            r.rawException = ex;
            r.httpCode = 0;
            return r;
        }
    }

    @Deprecated
    public static HttpResponse getData(RequestType type, HttpUrl uri, String post, HashMap<String, String> headers) {
        return getData(type, uri, post, headers, false);
    }

    @Deprecated
    @SuppressWarnings("UseSpecificCatch")
    public static HttpResponse getData(RequestType type, HttpUrl uri, String post, HashMap<String, String> headers, boolean isJson) {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        HttpResponse r = new HttpResponse();
        r.url = uri.build();
        r.headers = headers;
        r.type = type;
        r.post = post;

        try {
            HttpHeaders h = HttpClient.createHeaders(HttpMethod.valueOf(type.name()), isJson);
            if (headers != null) {
                headers.forEach(h::add);
            }

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
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            r.success = false;
            r.exception = ex.getClass().getSimpleName() + ": " + ex.getMessage();
            r.rawException = ex;
            r.httpCode = 0;
        }

        return r;
    }

    /**
     * Method that adds extra information to our returned object.
     *
     * @param obj
     * @param isSuccess
     * @param requestType
     * @param data
     * @param url
     * @param responseCode
     * @param exception
     * @param exceptionMessage
     */
    @Deprecated
    public static void generateJSONObject(JSONObject obj, boolean isSuccess,
            String requestType, String data, String url, int responseCode,
            String exception, String exceptionMessage) throws JSONException {

        obj.put("_success", isSuccess);
        obj.put("_type", requestType);
        obj.put("_post", data);
        obj.put("_url", url);
        obj.put("_http", responseCode);
        obj.put("_exception", exception);
        obj.put("_exceptionMessage", exceptionMessage);
    }
}
