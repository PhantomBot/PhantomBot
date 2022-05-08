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

import io.netty.handler.codec.http.QueryStringEncoder;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * An HTTP URL Builder
 *
 * @author gmt2001
 */
public final class HttpUrl {

    private String scheme = "http";
    private String userInfo = null;
    private String host = "";
    private int port = 0;
    private String path = null;
    private final Map<String, String> query = new HashMap<>();
    private String builtUri = null;
    private String querySep = "&";
    private static final String ALLOWED_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~:/?#[]@!$&'()*+,;=";

    /**
     * Constructor
     */
    private HttpUrl() {
    }

    /**
     * Automatically encodes the path and query of a URI
     *
     * @param uri A URI to encode
     * @return The encoded URI
     */
    public static String autoEncode(String uri) {
        StringBuilder encoded = new StringBuilder();

        int start = uri.indexOf("//");
        boolean shouldEncode = false;
        if (start > -1) {
            shouldEncode = true;
            start += 2;
        } else {
            start = 0;
        }

        if (uri.substring(start).contains("/")) {
            shouldEncode = true;
            start = uri.indexOf('/', start);
        } else if (uri.substring(start).contains("?")) {
            shouldEncode = true;
            start = uri.indexOf('?', start);
        }

        if (shouldEncode) {
            if (start > 0) {
                encoded.append(uri.substring(0, start));
                uri = uri.substring(start);
            }

            uri.chars().forEach(chr -> {
                String schr = Character.toString(chr);
                if (ALLOWED_CHARS.contains(schr)) {
                    encoded.append(schr);
                } else {
                    encoded.append(URLEncoder.encode(schr, StandardCharsets.UTF_8));
                }
            });
        }

        return encoded.toString();
    }

    /**
     * Starts a new HttpUrl from a string URI
     *
     * @param uri A URI to parse
     * @return
     * @throws URISyntaxException If the given string violates RFC 2396
     */
    public static HttpUrl fromUri(String uri) throws URISyntaxException {
        return fromUri(new URI(autoEncode(uri)));
    }

    /**
     * Starts a new HttpUrl from a string URI
     *
     * @param baseUri A base URI to parse
     * @param endPoint An endpoint to combine with the base URI
     * @return
     * @throws URISyntaxException If the given string violates RFC 2396
     */
    public static HttpUrl fromUri(String baseUri, String endPoint) throws URISyntaxException {
        return fromUri(new URI(autoEncode(baseUri) + (!baseUri.endsWith("/") && !endPoint.startsWith("/") && !endPoint.startsWith("?") ? "/" : "")
                + autoEncode(endPoint)));
    }

    /**
     * Starts a new HttpUrl from a URI
     *
     * @param uri A URI object
     * @return
     * @throws URISyntaxException If the given string violates RFC 2396
     */
    public static HttpUrl fromUri(URI uri) throws URISyntaxException {
        return fromUri(uri, "&");
    }

    /**
     * Starts a new HttpUrl from a URI, with a specified query parameter separator
     *
     * @param uri A URI object
     * @param querySep The query parameter separator
     * @return
     * @throws URISyntaxException If the given string violates RFC 2396
     */
    public static HttpUrl fromUri(URI uri, String querySep) throws URISyntaxException {
        uri = uri.parseServerAuthority();
        HttpUrl u = new HttpUrl();
        u.scheme = uri.getScheme();
        u.userInfo = uri.getUserInfo();
        u.host = uri.getHost();
        u.port = uri.getPort();
        u.path = uri.getPath();
        u.querySep = querySep;

        if (uri.getQuery() != null) {
            for (String s : uri.getQuery().split(querySep)) {
                String[] param = s.split("=", 2);
                if (param.length == 2) {
                    u.query.put(param[0], param[1]);
                } else {
                    u.query.put(param[0], null);
                }
            }
        }

        return u;
    }

    /**
     * Starts a new HttpUrl with the URI scheme
     *
     * @param scheme A URI scheme (http, https, etc)
     * @return
     */
    public static HttpUrl fromScheme(String scheme) {
        HttpUrl u = new HttpUrl();
        u.scheme = scheme;
        return u;
    }

    /**
     * Starts a new HttpUrl with the host
     *
     * @param host The host (IP address, domain, etc)
     * @return
     */
    public static HttpUrl fromHost(String host) {
        HttpUrl u = new HttpUrl();
        u.host = host;
        return u;
    }

    /**
     * Updates the host
     *
     * @param host The new host (IP address, domain, etc)
     * @return
     */
    public HttpUrl withHost(String host) {
        this.host = host;
        this.builtUri = null;
        return this;
    }

    /**
     * Updates the authentication user info (This method of authentication is not recommended due to security)
     *
     * @param userInfo The user info string
     * @return
     */
    public HttpUrl withUserInfo(String userInfo) {
        this.userInfo = userInfo;
        this.builtUri = null;
        return this;
    }

    /**
     * Updates the authentication user info by concatenating a username and password (This method of authentication is not recommended due to
     * security)
     *
     * @param username The username
     * @param password The password
     * @return
     */
    public HttpUrl withUserInfo(String username, String password) {
        this.userInfo = username + ":" + password;
        this.builtUri = null;
        return this;
    }

    /**
     * Updates the port (not needed if using the standard port for the chosen scheme)
     *
     * @param port The new port number
     * @return
     */
    public HttpUrl withPort(int port) {
        this.port = port;
        this.builtUri = null;
        return this;
    }

    /**
     * Updates the request path
     *
     * @param path The request path, with leading slash
     * @return
     */
    public HttpUrl withPath(String path) {
        this.path = autoEncode(path);
        this.builtUri = null;
        return this;
    }

    /**
     * Updates the query params
     *
     * @param query A map of key/value pairs of query params
     * @return
     */
    public HttpUrl withQuery(Map<String, String> query) {
        query.forEach(this.query::put);
        this.builtUri = null;
        return this;
    }

    /**
     * Updates the query params and query parameter separator
     *
     * @param query A map of key/value pairs of query params
     * @param querySep The query parameter separator
     * @return
     */
    public HttpUrl withQuery(Map<String, String> query, String querySep) {
        query.forEach(this.query::put);
        this.querySep = querySep;
        this.builtUri = null;
        return this;
    }

    /**
     * Adds a query parameter
     *
     * @param key The query parameter key
     * @param value The optional query parameter value (it is recommended to define one)
     * @return
     */
    public HttpUrl addQuery(String key, String value) {
        this.query.put(key, value);
        this.builtUri = null;
        return this;
    }

    /**
     * Updates the query parameter separator
     *
     * @param querySep The new query parameter separator
     * @return
     */
    public HttpUrl withQuerySeperator(String querySep) {
        this.querySep = querySep;
        this.builtUri = null;
        return this;
    }

    /**
     * Returns the current scheme
     *
     * @return
     */
    public String getScheme() {
        return this.scheme;
    }

    /**
     * Returns the current user info string, or null if not specified
     *
     * @return
     */
    public String getUserInfo() {
        return this.userInfo;
    }

    /**
     * Returns the current host
     *
     * @return
     */
    public String getHost() {
        return this.host;
    }

    /**
     * Returns the current port, or 0 if not specified
     *
     * @return
     */
    public int getPort() {
        return this.port;
    }

    /**
     * Returns the current path, or null if not specified
     *
     * @return
     */
    public String getPath() {
        return this.path;
    }

    /**
     * Returns the current query map
     *
     * @return
     */
    public Map<String, String> getQuery() {
        return Collections.unmodifiableMap(this.query);
    }

    /**
     * Returns the current query separator
     *
     * @return
     */
    public String getQuerySeparator() {
        return this.querySep;
    }

    /**
     * Builds the URL string
     *
     * @return
     */
    public String build() {
        if (this.builtUri == null) {
            StringBuilder sb = new StringBuilder();
            sb.append(this.scheme).append("://");

            if (this.userInfo != null && !this.userInfo.isBlank()) {
                sb.append(this.userInfo).append('@');
            }

            sb.append(this.host);

            if (this.port > 0 && this.port <= 65535) {
                sb.append(':').append(this.port);
            }

            QueryStringEncoder qse;
            if (this.path != null && !this.path.isBlank()) {
                qse = new QueryStringEncoder(this.path);
            } else {
                qse = new QueryStringEncoder("/");
            }

            if (!this.query.isEmpty()) {
                this.query.forEach((k, v) -> {
                    if (k != null) {
                        if (v != null) {
                            qse.addParam(k, v);
                        } else {
                            qse.addParam(k, k);
                        }
                    }
                });
            }

            sb.append(qse.toString());

            this.builtUri = sb.toString();
        }

        return this.builtUri;
    }
}
