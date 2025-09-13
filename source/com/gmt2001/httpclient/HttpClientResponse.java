/*
 * Copyright (C) 2016-2025 phantombot.github.io/PhantomBot
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
import java.net.URI;
import java.nio.charset.StandardCharsets;

import org.json.JSONException;
import org.json.JSONObject;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;

/**
 * The request parameters and response data from a {@link HttpClient} request
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
    private final URI url;
    private final URI resourceUrl;

    /**
     * Constructor
     *
     * @param exception any exception that may have been raised
     * @param requestBody the request body for POST/PUT/PATCH
     * @param responseBody the response body
     * @param url the URL requested
     * @param response the response metadata object
     */
    @SuppressWarnings("UseSpecificCatch")
    protected HttpClientResponse(Exception exception, String requestBody, byte[] responseBody, URI url,
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
        this.resourceUrl = URI.create(response.resourceUrl());

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

        this.debug();
    }

    /**
     * Constructor
     *
     * @param exception any exception that may have been raised
     * @param isSuccess whether the request is considered a complete success
     * @param method the HTTP method used for the request
     * @param requestBody the request body for POST/PUT/PATCH
     * @param responseBody the response body
     * @param requestHeaders the headers sent with the request
     * @param responseHeaders the headers returned in the response
     * @param responseCode the response status code
     * @param url the URL requested
     */
    @SuppressWarnings("UseSpecificCatch")
    protected HttpClientResponse(Exception exception, boolean isSuccess, HttpMethod method, String requestBody, byte[] responseBody,
            HttpHeaders requestHeaders, HttpHeaders responseHeaders, HttpResponseStatus responseCode, URI url) {
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
        this.resourceUrl = null;

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

        this.debug();
    }

    private void debug() {
        /**
         * @botproperty httpclientdebug - If `true`, information about each HTTP request sent by HttpClient is sent to the debug log. Default `false`
         * @botpropertycatsort httpclientdebug 800 900 Debug
         */
        if (PhantomBot.getEnableDebugging() && CaselessProperties.instance().getPropertyAsBoolean("httpclientdebug", false)) {
            JSONObject jso = new JSONObject();
            jso.put("isSuccess", this.isSuccess);
            jso.put("method", this.method);
            jso.put("url", this.url.toString());
            jso.put("resourceUrl", this.resourceUrl == null ? "null" : this.resourceUrl.toString());
            jso.put("requestHeaders", this.requestHeaders);
            jso.put("responseCode", this.responseCode.toString());
            jso.put("responseHeaders", this.responseHeaders);
            jso.put("responseBody", new String(this.responseBody, StandardCharsets.UTF_8));
            String exs = com.gmt2001.Console.debug.getStackTrace(this.exception);
            String[] ex;
            if (exs != null) {
                ex = exs.replace("\t", "    ").split("\r\n");
            } else {
                ex = null;
            }
            jso.put("exception", ex);
            jso.put("json", this.json);
            String jxs = com.gmt2001.Console.debug.getStackTrace(this.jsonException);
            String[] jx;
            if (jxs != null) {
                jx = jxs.replace("\t", "    ").split("\r\n");
            } else {
                jx = null;
            }
            jso.put("jsonException", jx);
            com.gmt2001.Console.debug.println(jso.toString(4));
        }
    }

    /**
     * Returns any exception that may have been thrown during the request
     *
     * @return the {@link Exception} if one was thrown; {@code null} if there was none
     */
    public Exception exception() {
        return this.exception;
    }

    /**
     * Indicates if there was an exception not related to JSON decoding
     *
     * @return {@code true} if there is an exception, which can be retrieved using {@link #exception()}
     */
    public boolean hasException() {
        return this.exception != null;
    }

    /**
     * Indicates if the request is an overall success (no exceptions and status code < 400)
     *
     * @return {@code true} if {@link #hasException()} is {@code false} and {@link #responseCode()} is < 400
     */
    public boolean isSuccess() {
        return this.isSuccess;
    }

    /**
     * Returns the response body as a JSONObject, if it was a valid stringified JSON object
     *
     * @return the {@link JSONObject} returned by the response, if the response was JSON
     */
    public JSONObject json() {
        return this.json;
    }

    /**
     * Returns the response body as a {@link JSONObject}, if it was a valid stringified JSON object
     * <p>
     * If the response body looked like JSON but failed decoding, throws a {@link JSONException}
     * <p>
     * If a {@link JSONException} was not caught but another exception was, it is thrown
     * <p>
     * If the response was a success but the body did not start with {@code &#123;}, throws {@link NotJSONException}
     *
     * @return the {@link JSONObject} if a valid JSON object was decoded from the response body
     * @throws JSONException if the response body appears to be JSON, but failed to be decoded into a {@link JSONObject}
     * @throws java.lang.Exception if any other exception ocurred during the request, it is thrown
     * @throws NotJSONException if the response was a success but the body did not contain valid JSON
     */
    public JSONObject jsonOrThrow() throws Exception {
        if (this.hasJsonException()) {
            throw this.jsonException;
        } else if (this.hasException()) {
            throw this.exception;
        } else if (this.hasJson()) {
            return this.json;
        } else {
            throw new NotJSONException();
        }
    }

    /**
     * Indicates if the response was JSON, no {@link JSONException} was thrown during parsing, and no other exceptions were thrown during the request
     *
     * @return {@code true} if a valid {@link JSONObject} can be successfully retrieved from {@link #json()} or {@link #jsonOrThrow()}
     */
    public boolean hasJson() {
        return this.json != null && !this.hasJsonException() && !this.hasException();
    }

    /**
     * Indicates if the response was not JSON or failed JSON parsing
     * <p>
     * {@code true} could indicate any state that would make {@link #hasJson()} return {@code false}, such as the response not being JSON,
     * throwing a {@link JSONException} during parsing, or another exception being thrown during the request
     *
     * @return the negated value of {@link #hasJson()}
     */
    public boolean isNotJson() {
        return !this.hasJson();
    }

    /**
     * Returns the exception raised if JSON parsing of the response body failed
     * <p>
     * This is normally a {@link JSONException}, but could rarely be some other exception
     *
     * @return the exception
     */
    public Exception jsonException() {
        return this.jsonException;
    }

    /**
     * Indicates if an exception was thrown during JSON parsing
     *
     * @return {@code true} if an exception is available from {@link #jsonException()}
     */
    public boolean hasJsonException() {
        return this.jsonException != null;
    }

    /**
     * Returns the HTTP request method
     *
     * @return the request method
     */
    public HttpMethod method() {
        return this.method;
    }

    /**
     * Returns the request body, if the method was POST/PUT/PATCH
     *
     * @return the request body; {@code null} if there was no body
     */
    public String requestBody() {
        return this.requestBody;
    }

    /**
     * Returns the response body as a string
     *
     * @return the response body as a UTF-8 encoded string
     */
    public String responseBody() {
        return new String(this.responseBody, StandardCharsets.UTF_8);
    }

    /**
     * Returns the response body
     *
     * @return the raw bytes of the response body
     */
    public byte[] rawResponseBody() {
        return this.responseBody.clone();
    }

    /**
     * Returns the request headers
     *
     * @return the request headers
     */
    public HttpHeaders requestHeaders() {
        return this.requestHeaders;
    }

    /**
     * Returns the response headers
     *
     * @return the reponse headers
     */
    public HttpHeaders responseHeaders() {
        return this.responseHeaders;
    }

    /**
     * Returns the HTTP response status code
     *
     * @return the status code
     */
    public HttpResponseStatus responseCode() {
        return this.responseCode;
    }

    /**
     * Returns the URL requested
     *
     * @return the {@link URI} requested
     */
    public URI url() {
        return this.url;
    }

    /**
     * Returns the actual URL that was returned, after following any redirects
     *
     * @return the real {@link URI} that was returned after redirects were followed
     */
    public URI resourceUrl() {
        return this.resourceUrl;
    }
}
