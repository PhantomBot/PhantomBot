/**
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

import com.github.scribejava.core.model.OAuth2AccessToken;
import com.github.scribejava.core.pkce.PKCE;
import com.github.scribejava.core.pkce.PKCEService;
import com.twitter.clientlib.ApiCallback;
import com.twitter.clientlib.ApiClientCallback;
import com.twitter.clientlib.ApiException;
import com.twitter.clientlib.TwitterCredentialsOAuth2;
import com.twitter.clientlib.api.TwitterApi;
import com.twitter.clientlib.auth.TwitterOAuth20Service;
import com.twitter.clientlib.model.Get2UsersMeResponse;
import com.twitter.clientlib.model.User;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import tv.phantombot.CaselessProperties;
import tv.phantombot.CaselessProperties.Transaction;
import tv.phantombot.PhantomBot;

/**
 * Handles Twitter API
 *
 * @author gmt2001
 */
public class TwitterAPI implements ApiClientCallback {

    /**
     * Singleton
     */
    private static final TwitterAPI INSTANCE = new TwitterAPI();
    /**
     * @botproperty twitteruser - The username for Twitter
     */
    /**
     * @botproperty twitter_client_id - The client id for Twitter API
     */
    /**
     * @botproperty twitter_client_secret - The client secret for Twitter API
     */
    /**
     * Credentials holder
     */
    private final TwitterCredentialsOAuth2 credentials = new TwitterCredentialsOAuth2(
            CaselessProperties.instance().getProperty("twitter_client_id", (String) null),
            CaselessProperties.instance().getProperty("twitter_client_secret", (String) null),
            CaselessProperties.instance().getProperty("twitter_access_token", (String) null),
            CaselessProperties.instance().getProperty("twitter_refresh_token", (String) null),
            true
    );
    /**
     * Underlying API client
     */
    private TwitterApi twitterApi = null;
    /**
     * User info for authenticated user
     */
    private User self = null;

    /**
     * Returns a singleton of TwitterAPI
     *
     * @return
     */
    public static TwitterAPI instance() {
        return INSTANCE;
    }

    /**
     * Private constructor for singleton
     */
    private TwitterAPI() {
    }

    /**
     * Initializes the API and attempts to lookup self to verify the access token
     *
     * @throws ApiException
     */
    public void authenticate() throws ApiException {
        if (this.credentials.isOAuth2AccessToken()) {
            this.twitterApi = new TwitterApi(this.credentials);
            this.twitterApi.addCallback(this);
            this.findSelf();
        }
    }

    /**
     * Finds the currently authenticated user and stores the object
     *
     * @throws ApiException
     */
    public void findSelf() throws ApiException {
        this.twitterApi.users().findMyUser().executeAsync(new APICallback<>() {
            @Override
            public void onSuccess(Get2UsersMeResponse t, int code, Map<String, List<String>> headers) {
                User u = t.getData();
                if (u != null) {
                    self = u;
                }
            }
        });
    }

    /**
     * Returns the {@link User} object of the currently authenticated user; {@code null} if not authenticated
     *
     * @return
     */
    public User self() {
        return this.self;
    }

    /**
     * Returns the username of the currently authenticated user; Empty string if not authenticated
     *
     * @return
     */
    public String username() {
        if (this.self != null) {
            return this.self.getUsername();
        }

        return "";
    }

    /**
     * Returns the URL of the currently authenticated user's Twitter page; Empty string if not authenticated
     *
     * @return
     */
    public String url() {
        if (this.self != null) {
            return this.self.getUrl();
        }

        return "";
    }

    /**
     * Saves the access token and refresh token
     *
     * @param oaat
     */
    @Override
    public void onAfterRefreshToken(OAuth2AccessToken oaat) {
        Transaction t = CaselessProperties.instance().startTransaction();
        t.setProperty("twitter_access_token", oaat.getAccessToken());
        this.credentials.setTwitterOauth2AccessToken(oaat.getAccessToken());
        t.setProperty("twitter_refresh_token", oaat.getRefreshToken());
        this.credentials.setTwitterOauth2RefreshToken(oaat.getRefreshToken());
        t.commit();
    }

    /**
     * Starts an authorization attempt. The URL in the {@link AuthorizationParameters} should be used by the user to authorize the application, then
     * the resulting code should be passed to {@link #completeAuthorize(com.gmt2001.TwitterAPI.AuthorizationParameters, java.lang.String)|
     *
     * @return
     */
    public AuthorizationParameters startAuthorize() {
        final TwitterOAuth20Service service = new TwitterOAuth20Service(this.credentials.getTwitterOauth2ClientId(),
                this.credentials.getTwitterOAuth2ClientSecret(), "http://localhost:25000",
                "offline.access tweet.read tweet.write users.read follows.read");
        final PKCE pkce = PKCEService.defaultInstance().generatePKCE();
        final String state = PhantomBot.generateRandomString(32);

        final String authorizationUrl = service.getAuthorizationUrl(pkce, state);

        return new AuthorizationParameters(service, pkce, authorizationUrl);
    }

    /**
     * Attempts to complete an authorization, generate an access token and refresh token, and initialize the API
     *
     * @param parameters The {@link AuthorizationParameters} returned by {@link #startAuthorize()}
     * @param code The code returned by Twitter after approving the authorization
     * @throws IOException
     * @throws ExecutionException
     * @throws InterruptedException
     * @throws ApiException
     */
    public void completeAuthorize(AuthorizationParameters parameters, String code) throws IOException, ExecutionException, InterruptedException, ApiException {
        OAuth2AccessToken accessToken = parameters.service().getAccessToken(parameters.pkce(), code);

        this.onAfterRefreshToken(accessToken);
        this.authenticate();
    }

    /**
     * Contains parameters for an authorization attempt
     */
    public class AuthorizationParameters {

        private final TwitterOAuth20Service service;
        private final PKCE pkce;
        private final String authorizationUrl;

        private AuthorizationParameters(TwitterOAuth20Service service, PKCE pkce, String authorizationUrl) {
            this.service = service;
            this.pkce = pkce;
            this.authorizationUrl = authorizationUrl;
        }

        /**
         * The OAuth service that handles communication with Twitter
         *
         * @return
         */
        private TwitterOAuth20Service service() {
            return this.service;
        }

        /**
         * The PKCE parameters for the authorization attempt
         *
         * @return
         */
        private PKCE pkce() {
            return this.pkce;
        }

        /**
         * The URL the user should visit to authorize the application
         *
         * @return
         */
        public String authroizationUrl() {
            return this.authorizationUrl;
        }
    }

    /**
     * Default implementation of {@link ApiCallback<T>}
     *
     * @param <T> The data type of the first parameter in {@link #onSuccess(java.lang.Object, int, java.util.Map)}
     */
    private abstract class APICallback<T> implements ApiCallback<T> {

        /**
         * Logs the {@link ApiException} stack trace
         *
         * @param ae The exception
         * @param code The response code
         * @param headers The response headers
         */
        @Override
        public void onFailure(ApiException ae, int code, Map<String, List<String>> headers) {
            com.gmt2001.Console.err.printStackTrace(ae);
        }

        /**
         * Success callback
         *
         * @param t The data object
         * @param code The response code
         * @param headers The response headers
         */
        @Override
        public abstract void onSuccess(T t, int code, Map<String, List<String>> headers);

        /**
         * Upload progress update callback
         *
         * @param bytesWritten Number of bytes written so far
         * @param contentLength Total number of bytes to be written
         * @param completed {@code true} if {@code bytesWritten == contentLength}
         */
        @Override
        public void onUploadProgress(long bytesWritten, long contentLength, boolean completed) {
        }

        /**
         * Download progress update callback
         *
         * @param bytesRead Number of bytes read so far
         * @param contentLength Total number of bytes to be read
         * @param completed {@code true} if {@code bytesRead == contentLength}
         */
        @Override
        public void onDownloadProgress(long bytesRead, long contentLength, boolean completed) {
        }
    }
}
