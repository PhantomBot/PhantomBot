/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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
package com.mcawful.social.bluesky;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONObject;

import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.URIUtil;
import com.gmt2001.ratelimiters.ExponentialBackoff;

import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;

/**
 * Sends XRPC requests to Bluesky and keeps the session
 * <p>
 * The bot signs in with the handle and app password from the bot properties. The session tokens are kept in memory only. An
 * expired session is refreshed once, and if that fails the bot signs in again. Sign-ins that fail for a reason other than wrong
 * credentials are spaced out, since Bluesky allows only a few per day. Wrong credentials are not tried again until the
 * properties change.
 *
 * @author mcawful
 */
final class BlueskyXrpc {

    /**
     * The service used to sign in when {@code bluesky_service} is not set
     */
    static final String DEFAULT_SERVICE = "https://bsky.social";
    private static final Duration DEFAULT_RATE_LIMIT_WAIT = Duration.ofMinutes(1);
    private static final Set<String> NOT_LINKED_ERRORS = Set.of("NotLinked", "AuthenticationRequired", "AuthFactorTokenRequired");
    private final ExponentialBackoff signInBackoff = new ExponentialBackoff(Duration.ofMinutes(1), Duration.ofMinutes(30));
    // Read without the lock by hasSession() and getHandle(), so showing the account never waits for a request
    private volatile String credentials = "";
    private String failedCredentials = null;
    private String backoffCredentials = null;
    private Instant rateLimitedUntil = Instant.EPOCH;
    private volatile String accessJwt = null;
    private String refreshJwt = null;
    private String did = null;
    private volatile String handle = null;
    private String pdsUrl = null;
    private String serviceUrl = null;

    /**
     * A failed XRPC request
     */
    static final class XrpcException extends Exception {

        private static final long serialVersionUID = 1L;
        private final int status;
        private final String error;

        XrpcException(int status, String error, String message) {
            super(message == null || message.isBlank() ? error : message);
            this.status = status;
            this.error = error;
        }

        /**
         * Returns the HTTP status
         *
         * @return the status; {@code 0} if there was no response
         */
        int getStatus() {
            return this.status;
        }

        /**
         * Indicates if the request failed because no account is linked or the credentials were refused
         *
         * @return {@code true} if linking again is needed
         */
        boolean isNotLinked() {
            return NOT_LINKED_ERRORS.contains(this.error);
        }
    }

    /**
     * @botproperty bluesky_handle - The handle (or email) of the Bluesky account the bot posts as, such as `name.bsky.social`
     * @botpropertycatsort bluesky_handle 10 240 Bluesky
     * @botproperty bluesky_apppassword - An app password for the Bluesky account, made in Settings > Privacy and security > App passwords. Not the account password
     * @botpropertycatsort bluesky_apppassword 20 240 Bluesky
     * @botproperty bluesky_service - The address of the Bluesky service to sign in to. Only needed for an account on another PDS. Default `https://bsky.social`
     * @botpropertycatsort bluesky_service 30 240 Bluesky
     */
    static String getHandleProperty() {
        return normalizeHandle(CaselessProperties.instance().getProperty("bluesky_handle", ""));
    }

    static String getPasswordProperty() {
        return CaselessProperties.instance().getProperty("bluesky_apppassword", "").trim();
    }

    static String getServiceProperty() {
        return normalizeService(CaselessProperties.instance().getProperty("bluesky_service", ""));
    }

    /**
     * Removes spaces and a leading {@code @} from a handle
     *
     * @param handle the handle as typed
     * @return the handle
     */
    static String normalizeHandle(String handle) {
        String result = handle == null ? "" : handle.trim();

        return result.startsWith("@") ? result.substring(1) : result;
    }

    /**
     * Returns a service address with a scheme and without a trailing {@code /}; the default service if it is empty
     *
     * @param service the address as typed
     * @return the address
     */
    static String normalizeService(String service) {
        String result = service == null ? "" : service.trim();

        if (result.isEmpty()) {
            return DEFAULT_SERVICE;
        }

        if (!result.matches("(?i)^https?://.*")) {
            result = "https://" + result;
        }

        return result.replaceAll("/+$", "");
    }

    /**
     * Indicates if a session is open
     *
     * @return {@code true} if signed in
     */
    boolean hasSession() {
        return this.accessJwt != null && this.credentials.equals(currentCredentials());
    }

    /**
     * Returns the handle of the session
     *
     * @return the handle; {@code null} if not signed in
     */
    String getHandle() {
        return this.handle;
    }

    /**
     * Signs in if needed and returns the account id
     *
     * @return the DID of the signed-in account
     * @throws XrpcException if signing in failed
     */
    synchronized String ensureSignedIn() throws XrpcException {
        this.checkRateLimit();
        this.ensureSession();

        return this.did;
    }

    /**
     * Sends a query (GET) as the signed-in account
     *
     * @param nsid the method, such as {@code app.bsky.notification.listNotifications}
     * @param query the query string without the {@code ?}; empty for none
     * @return the response
     * @throws XrpcException if the request failed
     */
    synchronized JSONObject query(String nsid, String query) throws XrpcException {
        return this.call(HttpMethod.GET, nsid, query, null, null);
    }

    /**
     * Sends a procedure (POST with JSON) as the signed-in account
     *
     * @param nsid the method, such as {@code com.atproto.repo.createRecord}
     * @param body the request body
     * @return the response
     * @throws XrpcException if the request failed
     */
    synchronized JSONObject procedure(String nsid, JSONObject body) throws XrpcException {
        return this.call(HttpMethod.POST, nsid, "", body, null);
    }

    /**
     * Uploads a file as the signed-in account
     *
     * @param data the file
     * @param contentType the media type of the file
     * @return the response, holding the {@code blob}
     * @throws XrpcException if the request failed
     */
    synchronized JSONObject upload(byte[] data, String contentType) throws XrpcException {
        return this.call(HttpMethod.POST, "com.atproto.repo.uploadBlob", "", data, contentType);
    }

    /**
     * Signs in with the given credentials and keeps the session if it works
     * <p>
     * Used to check credentials before they are saved, so it ignores earlier refusals and the sign-in delay
     *
     * @param newHandle the handle or email
     * @param password the app password
     * @param service the service address
     * @throws XrpcException if signing in failed
     */
    synchronized void signIn(String newHandle, String password, String service) throws XrpcException {
        this.checkRateLimit();
        JSONObject session = this.createSession(newHandle, password, service);
        this.clearSession();
        this.credentials = credentialsOf(newHandle, password, service);
        this.failedCredentials = null;
        this.signInBackoff.Reset();
        this.adoptSession(session, service);
    }

    /**
     * Ends the session
     */
    synchronized void signOut() {
        this.clearSession();
        this.credentials = "";
        this.failedCredentials = null;
        this.signInBackoff.Reset();
    }

    private JSONObject call(HttpMethod method, String nsid, String query, Object body, String contentType) throws XrpcException {
        this.checkRateLimit();
        this.ensureSession();

        HttpClientResponse response = this.send(method, nsid, query, body, contentType);

        if (isExpired(response)) {
            this.refreshSession();
            response = this.send(method, nsid, query, body, contentType);
        }

        return this.readResponse(response);
    }

    private HttpClientResponse send(HttpMethod method, String nsid, String query, Object body, String contentType) {
        URI uri = URIUtil.create(this.pdsUrl + "/xrpc/" + nsid + (query.isEmpty() ? "" : "?" + query));
        HttpHeaders headers = HttpClient.createHeaders(method, true);
        headers.set(HttpHeaderNames.AUTHORIZATION, "Bearer " + this.accessJwt);

        if (body instanceof byte[] data) {
            headers.set(HttpHeaderNames.CONTENT_TYPE, contentType);
            return HttpClient.postBytes(uri, headers, data);
        } else if (body instanceof JSONObject json) {
            return HttpClient.post(uri, headers, json);
        }

        return HttpClient.get(uri, headers);
    }

    private void ensureSession() throws XrpcException {
        String current = currentCredentials();

        if (!current.equals(this.credentials)) {
            this.clearSession();
            this.credentials = current;
            this.signInBackoff.Reset();
        }

        if (this.accessJwt != null) {
            return;
        }

        String propertyHandle = getHandleProperty();
        String password = getPasswordProperty();

        if (propertyHandle.isEmpty() || password.isEmpty()) {
            throw new XrpcException(0, "NotLinked", "No Bluesky account is linked");
        }

        if (current.equals(this.failedCredentials)) {
            throw new XrpcException(401, "AuthenticationRequired", "Bluesky refused the handle or app password; link the account again");
        }

        if (this.signInBackoff.GetIsBackingOff() && current.equals(this.backoffCredentials)) {
            throw new XrpcException(0, "SignInDelayed", "Waiting before signing in to Bluesky again");
        }

        try {
            this.adoptSession(this.createSession(propertyHandle, password, getServiceProperty()), getServiceProperty());
            this.signInBackoff.Reset();
        } catch (XrpcException ex) {
            // A 400 or 401 from createSession means the handle or password was refused; trying again will not help
            if (ex.getStatus() == 400 || ex.getStatus() == 401) {
                this.failedCredentials = current;
                writeStatus("failed", ex.getMessage());
            } else {
                this.backoffCredentials = current;
                this.signInBackoff.BackoffOnceAsync(() -> {
                });
                writeStatus("error", ex.getMessage());
            }

            throw ex;
        }
    }

    private JSONObject createSession(String newHandle, String password, String service) throws XrpcException {
        JSONObject body = new JSONObject().put("identifier", normalizeHandle(newHandle)).put("password", password.trim());
        HttpClientResponse response = HttpClient.post(URIUtil.create(normalizeService(service) + "/xrpc/com.atproto.server.createSession"),
                HttpClient.createHeaders(HttpMethod.POST, true), body);

        return this.readResponse(response);
    }

    private void refreshSession() throws XrpcException {
        HttpHeaders headers = HttpClient.createHeaders(HttpMethod.POST, true);
        headers.set(HttpHeaderNames.AUTHORIZATION, "Bearer " + this.refreshJwt);
        headers.remove(HttpHeaderNames.CONTENT_TYPE);
        HttpClientResponse response = HttpClient.request(HttpMethod.POST,
                URIUtil.create(this.serviceUrl + "/xrpc/com.atproto.server.refreshSession"), headers, null);

        try {
            JSONObject session = this.readResponse(response);
            this.accessJwt = session.getString("accessJwt");
            this.refreshJwt = session.getString("refreshJwt");
        } catch (XrpcException ex) {
            com.gmt2001.Console.debug.println("Bluesky session refresh failed: " + ex.getMessage());
            this.clearSession();
            this.ensureSession();
        }
    }

    /**
     * Keeps the tokens of a new session and finds the account's PDS in its DID document
     * <p>
     * Requests go to the PDS, while the session is refreshed at the service it was created on, as the official client does
     */
    private void adoptSession(JSONObject session, String service) {
        this.accessJwt = session.getString("accessJwt");
        this.refreshJwt = session.getString("refreshJwt");
        this.did = session.getString("did");
        this.handle = session.optString("handle", getHandleProperty());
        this.serviceUrl = normalizeService(service);
        this.pdsUrl = this.serviceUrl;

        JSONObject didDoc = session.optJSONObject("didDoc");
        JSONArray services = didDoc == null ? null : didDoc.optJSONArray("service");

        if (services != null) {
            for (int i = 0; i < services.length(); i++) {
                JSONObject entry = services.optJSONObject(i);

                if (entry != null && entry.optString("id").endsWith("#atproto_pds") && !entry.optString("serviceEndpoint").isBlank()) {
                    this.pdsUrl = normalizeService(entry.getString("serviceEndpoint"));
                    break;
                }
            }
        }

        writeStatus("ok", "");
        writeAccount(this.handle, this.serviceUrl.equals(DEFAULT_SERVICE) ? "" : this.serviceUrl);
    }

    private void clearSession() {
        this.accessJwt = null;
        this.refreshJwt = null;
        this.did = null;
        this.handle = null;
        this.pdsUrl = null;
        this.serviceUrl = null;
    }

    private void checkRateLimit() throws XrpcException {
        if (Instant.now().isBefore(this.rateLimitedUntil)) {
            throw new XrpcException(429, "RateLimitExceeded", "Bluesky rate limit reached; waiting until " + this.rateLimitedUntil);
        }
    }

    private JSONObject readResponse(HttpClientResponse response) throws XrpcException {
        if (response.isSuccess()) {
            if (response.rawResponseBody().length == 0) {
                return new JSONObject();
            } else if (response.hasJson()) {
                return response.json();
            }

            throw new XrpcException(response.responseCode().code(), "InvalidResponse", "Bluesky sent a response that is not JSON");
        }

        if (response.responseCode() == null) {
            String message = response.hasException() ? response.exception().getClass().getSimpleName() : "";
            throw new XrpcException(0, "NetworkError", "Bluesky could not be reached " + message);
        }

        int status = response.responseCode().code();

        if (status == 429) {
            Instant until = Instant.now().plus(DEFAULT_RATE_LIMIT_WAIT);

            try {
                until = Instant.ofEpochSecond(Long.parseLong(response.responseHeaders().get("ratelimit-reset", "")));
            } catch (NumberFormatException ex) {
                com.gmt2001.Console.debug.println("Bluesky rate limit without a reset time");
            }

            this.rateLimitedUntil = until;
        }

        JSONObject json = response.hasJson() ? response.json() : new JSONObject();
        throw new XrpcException(status, json.optString("error", "HTTP" + status), json.optString("message", ""));
    }

    private static boolean isExpired(HttpClientResponse response) {
        if (response.responseCode() == null || (response.responseCode().code() != 400 && response.responseCode().code() != 401)
                || !response.hasJson()) {
            return false;
        }

        String error = response.json().optString("error", "");

        return error.equals("ExpiredToken") || error.equals("InvalidToken");
    }

    private static String currentCredentials() {
        return credentialsOf(getHandleProperty(), getPasswordProperty(), getServiceProperty());
    }

    private static String credentialsOf(String newHandle, String password, String service) {
        return normalizeHandle(newHandle).toLowerCase() + "\n" + password.trim() + "\n" + normalizeService(service);
    }

    /**
     * Records the sign-in state in the {@code bluesky} table for the panel
     *
     * @param status {@code ok}, {@code failed} (credentials refused) or {@code error} (anything else)
     * @param message the reason; empty for none
     */
    static void writeStatus(String status, String message) {
        if (PhantomBot.instance() != null && PhantomBot.instance().getDataStore() != null) {
            PhantomBot.instance().getDataStore().SetString("bluesky", "", "auth_status", status);
            PhantomBot.instance().getDataStore().SetString("bluesky", "", "auth_error", message);
        }
    }

    /**
     * Records the signed-in account in the {@code bluesky} table, so the panel's link dialog can show it
     *
     * @param account the handle; empty for none
     * @param service the service address; empty for the default service
     */
    static void writeAccount(String account, String service) {
        if (PhantomBot.instance() != null && PhantomBot.instance().getDataStore() != null) {
            PhantomBot.instance().getDataStore().SetString("bluesky", "", "account", account);
            PhantomBot.instance().getDataStore().SetString("bluesky", "", "service", service);
        }
    }
}
