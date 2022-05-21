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
package com.gmt2001.httpclient;

import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpResponseStatus;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

/**
 * The request parameters and response data from a HttpClient request
 *
 * @author gmt2001
 */
public final class HttpClientResponse {

    private final Exception exception;
    private final boolean isSuccess;
    private final JSONObject json;
    private final Exception jsonException;
    private final HttpMethod method;
    private final String requestBody;
    private final byte[] responseBody;
    private final HttpHeaders requestHeaders;
    private final HttpHeaders responseHeaders;
    private final HttpResponseStatus responseCode;
    private final HttpUrl url;

    /**
     * Constructor
     *
     * @param exception Any exception that may have been raised
     * @param requestBody The request body for POST/PUT/PATCH
     * @param responseBody The response body
     * @param url The URL requested
     * @param response The response metadata object
     */
    @SuppressWarnings("UseSpecificCatch")
    protected HttpClientResponse(Exception exception, String requestBody, byte[] responseBody, HttpUrl url,
            reactor.netty.http.client.HttpClientResponse response) {
        this.exception = exception;
        this.isSuccess = response.status().code() > 0 && response.status().code() < 400;
        this.method = response.method();
        this.requestBody = requestBody;
        this.responseBody = responseBody.clone();
        this.requestHeaders = response.requestHeaders().copy();
        this.responseHeaders = response.responseHeaders().copy();
        this.responseCode = response.status();
        this.url = url;

        JSONObject jsonT = null;
        Exception jsonExceptionT = null;

        if (this.responseBody.length > 0 && this.responseBody[0] == '{') {
            try {
                jsonT = new JSONObject(new String(this.responseBody, StandardCharsets.UTF_8));
            } catch (Exception ex) {
                jsonExceptionT = ex;
            }
        }

        this.json = jsonT;
        this.jsonException = jsonExceptionT;
    }

    /**
     * Constructor
     *
     * @param exception Any exception that may have been raised
     * @param isSuccess Whether the request is considered a complete success
     * @param method The HTTP method used for the request
     * @param requestBody The request body for POST/PUT/PATCH
     * @param responseBody The response body
     * @param requestHeaders The headers sent with the request
     * @param responseHeaders The headers returned in the response
     * @param responseCode The response status code
     * @param url The URL requested
     */
    @SuppressWarnings("UseSpecificCatch")
    protected HttpClientResponse(Exception exception, boolean isSuccess, HttpMethod method, String requestBody, byte[] responseBody,
            HttpHeaders requestHeaders, HttpHeaders responseHeaders, HttpResponseStatus responseCode, HttpUrl url) {
        this.exception = exception;
        this.isSuccess = isSuccess;
        this.method = method;
        this.requestBody = requestBody;
        this.responseBody = responseBody.clone();
        if (requestHeaders != null) {
            this.requestHeaders = requestHeaders.copy();
        } else {
            this.requestHeaders = HttpClient.createHeaders();
        }
        if (responseHeaders != null) {
            this.responseHeaders = responseHeaders.copy();
        } else {
            this.responseHeaders = HttpClient.createHeaders();
        }
        if (responseCode != null) {
            this.responseCode = responseCode;
        } else {
            this.responseCode = HttpResponseStatus.valueOf(0, "Unknown");
        }
        this.url = url;

        JSONObject jsonT = null;
        Exception jsonExceptionT = null;

        if (this.responseBody.length > 0 && this.responseBody[0] == '{') {
            try {
                jsonT = new JSONObject(new String(this.responseBody, StandardCharsets.UTF_8));
            } catch (Exception ex) {
                jsonExceptionT = ex;
            }
        }

        this.json = jsonT;
        this.jsonException = jsonExceptionT;
    }

    /**
     * Returns any exception that may have been thrown during the request
     *
     * @return
     */
    public Exception exception() {
        return this.exception;
    }

    /**
     * Returns true if there was an exception not related to JSON decoding
     *
     * @return
     */
    public boolean hasException() {
        return this.exception != null;
    }

    /**
     * Returns true if the request is an overall success (no exceptions and status code < 400)
     *
     * @return
     */
    public boolean isSuccess() {
        return this.isSuccess;
    }

    /**
     * Returns the response body as a JSONObject, if it was a valid stringified JSON object
     *
     * @return
     */
    public JSONObject json() {
        return this.json;
    }

    /**
     * Returns the response body as a JSONObject, if it was a valid stringified JSON object; if the response body looked like JSON but failed
     * validation, throws the JSONException (or, rarely, a non-JSONException); if an exception was caught during the request, it is thrown; otherwise,
     * if the response body did not start with '{', throws NotJSONException
     *
     * @return
     * @throws java.lang.Exception
     */
    public JSONObject jsonOrThrow() throws Exception {
        if (this.hasJson()) {
            return this.json;
        } else if (this.hasJsonException()) {
            throw this.jsonException;
        } else if (this.hasException()) {
            throw this.exception;
        } else {
            throw new NotJSONException();
        }
    }

    /**
     * Returns true if the response was JSON, no JSONExceptions were thrown during parsing, and no exceptions were thrown during the request
     *
     * @return
     */
    public boolean hasJson() {
        return this.json != null && !this.hasJsonException() && !this.hasException();
    }

    /**
     * Returns true if the response was not JSON or failed JSON parsing
     *
     * @return
     */
    public boolean isNotJson() {
        return !this.hasJson();
    }

    /**
     * Returns the exception raised if JSON parsing of the response body failed
     *
     * @return
     */
    public Exception jsonException() {
        return this.jsonException;
    }

    /**
     * Returns true if a JSONException was thrown during JSON parsing
     *
     * @return
     */
    public boolean hasJsonException() {
        return this.jsonException != null;
    }

    /**
     * Returns the HTTP request method
     *
     * @return
     */
    public HttpMethod method() {
        return this.method;
    }

    /**
     * Returns the request body, if the method was POST/PUT/PATCH
     *
     * @return
     */
    public String requestBody() {
        return this.requestBody;
    }

    /**
     * Returns the response body as a string
     *
     * @return
     */
    public String responseBody() {
        return new String(this.responseBody, StandardCharsets.UTF_8);
    }

    /**
     * Returns the response body
     *
     * @return
     */
    public byte[] rawResponseBody() {
        return this.responseBody.clone();
    }

    /**
     * Returns the request headers
     *
     * @return
     */
    public HttpHeaders requestHeaders() {
        return this.requestHeaders;
    }

    /**
     * Returns the response headers
     *
     * @return
     */
    public HttpHeaders responseHeaders() {
        return this.responseHeaders;
    }

    /**
     * Returns the HTTP response status code
     *
     * @return
     */
    public HttpResponseStatus responseCode() {
        return this.responseCode;
    }

    /**
     * Returns the URL requested
     *
     * @return
     */
    public HttpUrl url() {
        return this.url;
    }
}
