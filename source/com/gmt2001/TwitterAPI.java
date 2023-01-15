/**
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
import com.twitter.clientlib.api.TweetsApi.APIusersIdMentionsRequest;
import com.twitter.clientlib.api.TweetsApi.APIusersIdTimelineRequest;
import com.twitter.clientlib.api.TweetsApi.APIusersIdTweetsRequest;
import com.twitter.clientlib.api.TwitterApi;
import com.twitter.clientlib.api.UsersApi.APItweetsIdRetweetingUsersRequest;
import com.twitter.clientlib.auth.TwitterOAuth20Service;
import com.twitter.clientlib.model.Get2TweetsIdRetweetedByResponse;
import com.twitter.clientlib.model.Get2UsersByUsernameUsernameResponse;
import com.twitter.clientlib.model.Get2UsersIdMentionsResponse;
import com.twitter.clientlib.model.Get2UsersIdResponse;
import com.twitter.clientlib.model.Get2UsersIdTimelinesReverseChronologicalResponse;
import com.twitter.clientlib.model.Get2UsersIdTweetsResponse;
import com.twitter.clientlib.model.Get2UsersMeResponse;
import com.twitter.clientlib.model.Problem;
import com.twitter.clientlib.model.Tweet;
import com.twitter.clientlib.model.TweetCreateRequest;
import com.twitter.clientlib.model.TweetCreateResponse;
import com.twitter.clientlib.model.TweetCreateResponseData;
import com.twitter.clientlib.model.User;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import net.engio.mbassy.listener.Handler;
import tv.phantombot.CaselessProperties;
import tv.phantombot.CaselessProperties.Transaction;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.Listener;
import tv.phantombot.event.jvm.PropertiesReloadedEvent;

/**
 * Handles Twitter API
 *
 * @author gmt2001
 */
public class TwitterAPI implements ApiClientCallback, Listener {

    /**
     * Singleton
     */
    private static final TwitterAPI INSTANCE = new TwitterAPI();
    /**
     * @botproperty twitter_client_id - The client id for Twitter API
     * @botpropertycatsort twitter_client_id 10 290 Twitter
     */
    /**
     * @botproperty twitter_client_secret - The client secret for Twitter API
     * @botpropertycatsort twitter_client_secret 20 290 Twitter
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
    @SuppressWarnings("LeakingThisInConstructor")
    private TwitterAPI() {
        EventBus.instance().register(this);
    }

    @Handler
    public void onPropertiesReloaded(PropertiesReloadedEvent event) {
        this.updateClientIdSecret();
    }

    /**
     * Re-pulls the Client ID and Secret from {@link CaselessProperties}
     */
    public void updateClientIdSecret() {
        this.credentials.setTwitterOauth2ClientId(CaselessProperties.instance().getProperty("twitter_client_id", (String) null));
        this.credentials.setTwitterOAuth2ClientSecret(CaselessProperties.instance().getProperty("twitter_client_secret", (String) null));
    }

    /**
     * Indicates if the API is likely authenticated. Not guaranteed
     *
     * @return
     */
    public boolean authenticated() {
        return this.credentials.isOAuth2AccessToken() && this.self != null;
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
     * the resulting code should be passed to {@link #completeAuthorize(com.gmt2001.TwitterAPI.AuthorizationParameters, java.lang.String)}
     *
     * @return
     */
    public AuthorizationParameters startAuthorize() {
        return this.startAuthorize("http://localhost:25000");
    }

    /**
     * Starts an authorization attempt. The URL in the {@link AuthorizationParameters} should be used by the user to authorize the application, then
     * the resulting code should be passed to {@link #completeAuthorize(com.gmt2001.TwitterAPI.AuthorizationParameters, java.lang.String)}
     *
     * @param callbackUri The callback URI
     *
     * @return
     */
    public AuthorizationParameters startAuthorize(String callbackUri) {
        final TwitterOAuth20Service service = new TwitterOAuth20Service(this.credentials.getTwitterOauth2ClientId(),
                this.credentials.getTwitterOAuth2ClientSecret(), callbackUri,
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
     * Posts a Tweet on Twitter. This will post to the user timeline and is the same as posting any other status update on Twitter. If there is an
     * error posting, an exception is logged.
     *
     * @param message The string that will be posted on Twitter.
     * @return true on success
     */
    public boolean updateStatus(String message) {
        if (this.authenticated()) {
            TweetCreateRequest req = new TweetCreateRequest();
            req.setText(message);

            try {
                TweetCreateResponse res = this.twitterApi.tweets().createTweet(req).execute();
                TweetCreateResponseData data = res.getData();
                if (data != null) {
                    if (!data.getId().isBlank()) {
                        return true;
                    }
                } else {
                    List<Problem> errors = res.getErrors();
                    if (errors != null && !errors.isEmpty()) {
                        com.gmt2001.Console.warn.println("Failed to Tweet");
                        errors.forEach(p -> com.gmt2001.Console.warn.println(p));
                    }
                }
            } catch (ApiException ex) {
                com.gmt2001.Console.err.println("Failed to Tweet: " + ex.getMessage());
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        return false;
    }

    /**
     * Reads the user timeline on Twitter. This includes posts only made by the authenticated user. Retweets are excluded
     *
     * @param sinceId The tweet ID for pagination. The tweet with the specified ID will be the first result. Use null for the latest tweets
     * @return List of Status objects on success, null on failure.
     */
    public List<Tweet> getUserTimeline(String sinceId) {
        return this.getUserTimeline(sinceId, null);
    }

    /**
     * Reads the user timeline on Twitter. This includes posts only made by the authenticated user. Retweets are excluded
     *
     * @param sinceId The tweet ID for pagination. The tweet with the specified ID will be the first result. Use null for the latest tweets
     * @param startTime If specified, limits the earliest time of returned tweets
     * @return List of Status objects on success, null on failure.
     */
    public List<Tweet> getUserTimeline(String sinceId, OffsetDateTime startTime) {
        if (this.authenticated()) {
            return this.getUserTimeline(this.self.getId(), sinceId, false, startTime);
        }

        return null;
    }

    /**
     * Reads the user timeline on Twitter. This includes posts only made by the specified user.
     *
     * @param userId The user ID to retrieve tweets for
     * @param sinceId The tweet ID for pagination. The tweet with the specified ID will be the first result. Use null for the latest tweets
     * @param retweets If true, include retweets. If false, retweets will be filtered, which may reduce the number of results
     * @return List of Status objects on success, null on failure.
     */
    public List<Tweet> getUserTimeline(String userId, String sinceId, boolean retweets) {
        if (this.authenticated()) {
            return this.getUserTimeline(userId, sinceId, retweets, null);
        }

        return null;
    }

    /**
     * Reads the user timeline on Twitter. This includes posts only made by the specified user.
     *
     * @param userId The user ID to retrieve tweets for
     * @param sinceId The tweet ID for pagination. The tweet with the specified ID will be the first result. Use null for the latest tweets
     * @param retweets If true, include retweets. If false, retweets will be filtered, which may reduce the number of results
     * @param startTime If specified, limits the earliest time of returned tweets
     * @return List of Status objects on success, null on failure.
     */
    public List<Tweet> getUserTimeline(String userId, String sinceId, boolean retweets, OffsetDateTime startTime) {
        if (this.authenticated()) {
            /**
             * @botproperty twitterusertimelinelimit - The maximum number of tweets to retrieve per follower, when grabbing retweets. Default `15`
             * @botpropertycatsort twitterusertimelinelimit 220 290 Twitter
             */
            APIusersIdTweetsRequest req = this.twitterApi.tweets().usersIdTweets(userId).maxResults(CaselessProperties.instance().getPropertyAsInt("twitterusertimelinelimit", 15));

            if (sinceId != null && !sinceId.isBlank()) {
                req.sinceId(sinceId);
            }

            if (!retweets) {
                req.exclude(Collections.singleton("retweets"));
            }

            if (startTime != null) {
                req.startTime(startTime.withNano(0));
            }

            try {
                Get2UsersIdTweetsResponse res = req.execute();
                List<Tweet> data = res.getData();
                if (data != null) {
                    return data;
                } else {
                    List<Problem> errors = res.getErrors();
                    if (errors != null && !errors.isEmpty()) {
                        com.gmt2001.Console.warn.println("Failed to Get Tweets for " + userId);
                        errors.forEach(p -> com.gmt2001.Console.warn.println(p));
                    }
                }
            } catch (ApiException ex) {
                com.gmt2001.Console.err.println("Failed to Get Tweets for " + userId + ": " + ex.getMessage());
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        return null;
    }

    /**
     * Finds the Twitter User ID for the given username
     *
     * @param userName The username to find
     * @return The user ID on success, null on failure
     */
    public String getUserIdFromUsername(String userName) {
        if (this.authenticated()) {
            try {
                Get2UsersByUsernameUsernameResponse res = this.twitterApi.users().findUserByUsername(userName).execute();
                User data = res.getData();
                if (data != null) {
                    if (!data.getId().isBlank()) {
                        return data.getId();
                    }
                } else {
                    List<Problem> errors = res.getErrors();
                    if (errors != null && !errors.isEmpty()) {
                        com.gmt2001.Console.warn.println("Failed to Lookup User");
                        errors.forEach(p -> com.gmt2001.Console.warn.println(p));
                    }
                }
            } catch (ApiException ex) {
                com.gmt2001.Console.err.println("Failed to Lookup User: " + ex.getMessage());
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        return null;
    }

    /**
     * Reads the timeline of another user.Note that if the authenticated user does not have access to the timeline, nothing is returned but the API
     * lookup is still charged.
     *
     * @param username The username to lookup
     * @return Most recent status of the user requested. null on failure
     */
    public String getOtherUserTimeline(String username) {
        List<Tweet> result = this.getUserTimeline(this.getUserIdFromUsername(username), null, true);

        if (result != null && !result.isEmpty()) {
            return result.get(0).getText();
        }

        return null;
    }

    /**
     * Reads the home timeline on Twitter. This includes posts made by the user, retweets, and posts made by friends. This is essentially the screen
     * that is seen when logging into Twitter. This is limited to the last 24 hours
     *
     * @param sinceId The tweet ID for pagination. The tweet with the specified ID will be the first result. Use null for the latest tweets
     * @return List of Status objects on success, null on failure.
     */
    public List<Tweet> getHomeTimeline(String sinceId) {
        if (this.authenticated()) {
            APIusersIdTimelineRequest req = this.twitterApi.tweets().usersIdTimeline(this.self.getId());

            /**
             * @botproperty twittertimelinelimit - The maximum number of tweets to retrieve with a latest tweets request. Default `15`
             * @botpropertycatsort twittertimelinelimit 200 290 Twitter
             */
            /**
             * @botproperty twittertimelineextendedlimit - The maximum number of tweets to retrieve with a sinceId. Default `30`
             * @botpropertycatsort twittertimelineextendedlimit 210 290 Twitter
             */
            req.maxResults(sinceId != null && sinceId.isBlank()
                    ? CaselessProperties.instance().getPropertyAsInt("twittertimelinelimit", 15)
                    : CaselessProperties.instance().getPropertyAsInt("twittertimelineextendedlimit", 30))
                    .startTime(OffsetDateTime.now().minusDays(1).withNano(0));

            if (sinceId != null && !sinceId.isBlank()) {
                req.sinceId(sinceId);
            }

            try {
                Get2UsersIdTimelinesReverseChronologicalResponse res = req.execute();
                List<Tweet> data = res.getData();
                if (data != null) {
                    return data;
                } else {
                    List<Problem> errors = res.getErrors();
                    if (errors != null && !errors.isEmpty()) {
                        com.gmt2001.Console.warn.println("Failed to Get Home Timeline");
                        errors.forEach(p -> com.gmt2001.Console.warn.println(p));
                    }
                }
            } catch (ApiException ex) {
                com.gmt2001.Console.err.println("Failed to Get Home Timeline: " + ex.getMessage());
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        return null;
    }

    /**
     * Reads retweets on Twitter. This includes posts made by the user that have been retweeted by others. This is limited to the last 24 hours
     *
     * @param sinceId The tweet ID for pagination. The tweet with the specified ID will be the first result. Use null for the latest tweets
     * @return List of Status objects on success, null on failure.
     */
    public List<TweetToUser> getRetweetsOfMe(String sinceId) {
        if (this.authenticated()) {
            List<Tweet> tweets = this.getUserTimeline(sinceId, OffsetDateTime.now().minusDays(1).withNano(0));

            if (tweets != null && !tweets.isEmpty()) {
                List<TweetToUser> ret = new ArrayList<>();
                for (Tweet tweet : tweets) {
                    List<User> rts = this.getRetweets(tweet.getId());

                    if (rts != null && !rts.isEmpty()) {
                        for (User user : rts) {
                            ret.add(new TweetToUser(tweet, user));
                        }
                    }
                }

                return ret;
            }
        }

        return null;
    }

    /**
     * Looks for mentions (@username) on Twitter.
     *
     * @param sinceId The tweet ID for pagination. The tweet with the specified ID will be the first result. Use null for the latest tweets
     * @return List of Status objects on success, null on failure.
     */
    public List<Tweet> getMentions(String sinceId) {
        if (this.authenticated()) {
            APIusersIdMentionsRequest req = this.twitterApi.tweets().usersIdMentions(this.self.getId()).tweetFields(Collections.singleton("author_id")).maxResults(CaselessProperties.instance().getPropertyAsInt("twitterusertimelinelimit", 15));

            if (sinceId != null && !sinceId.isBlank()) {
                req.sinceId(sinceId);
            }

            try {
                Get2UsersIdMentionsResponse res = req.execute();
                List<Tweet> data = res.getData();
                if (data != null) {
                    return data;
                } else {
                    List<Problem> errors = res.getErrors();
                    if (errors != null && !errors.isEmpty()) {
                        com.gmt2001.Console.warn.println("Failed to Get Mentions");
                        errors.forEach(p -> com.gmt2001.Console.warn.println(p));
                    }
                }
            } catch (ApiException ex) {
                com.gmt2001.Console.err.println("Failed to Get Mentions: " + ex.getMessage());
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        return null;
    }

    /**
     * Grabs Users who retweeted a specific Tweet from Twitter. This is limited to the last 24 hours
     *
     * @param statusId The tweet ID to check for retweets
     * @return List of Users objects on success, null on failure.
     */
    public List<User> getRetweets(String statusId) {
        if (this.authenticated()) {
            APItweetsIdRetweetingUsersRequest req = this.twitterApi.users().tweetsIdRetweetingUsers(statusId);

            try {
                Get2TweetsIdRetweetedByResponse res = req.execute();
                List<User> data = res.getData();
                if (data != null) {
                    return data;
                } else {
                    List<Problem> errors = res.getErrors();
                    if (errors != null && !errors.isEmpty()) {
                        com.gmt2001.Console.warn.println("Failed to Get Retweets for " + statusId);
                        errors.forEach(p -> com.gmt2001.Console.warn.println(p));
                    }
                }
            } catch (ApiException ex) {
                com.gmt2001.Console.err.println("Failed to Get Retweets for " + statusId + ": " + ex.getMessage());
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        return null;
    }

    /**
     * Gets the User represented by the given user id
     *
     * @param id The user id to lookup
     * @return The user object on success. null on failure
     */
    public User getUser(String id) {
        if (this.authenticated()) {
            try {
                Get2UsersIdResponse res = this.twitterApi.users().findUserById(id).execute();

                User data = res.getData();
                if (data != null) {
                    return data;
                } else {
                    List<Problem> errors = res.getErrors();
                    if (errors != null && !errors.isEmpty()) {
                        com.gmt2001.Console.warn.println("Failed to Get User " + id);
                        errors.forEach(p -> com.gmt2001.Console.warn.println(p));
                    }
                }
            } catch (ApiException ex) {
                com.gmt2001.Console.err.println("Failed to Get User " + id + ": " + ex.getMessage());
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        return null;
    }

    /**
     * Given a status for the authenticated user, creates the URL for that status.
     *
     * @param id Twitter status ID.
     * @return String URL in the format of https://twitter.com/USERNAME/status/ID
     */
    public String getTwitterURLFromId(String id) {
        if (this.self != null) {
            return "https://twitter.com/" + this.self.getUsername() + "/status/" + id;
        }

        return "";
    }

    /**
     * Provides a mapping of a {@link Tweet} to a {@link User} as defined by the returning method
     */
    public class TweetToUser {

        private final Tweet tweet;
        private final User user;

        private TweetToUser(Tweet tweet, User user) {
            this.tweet = tweet;
            this.user = user;
        }

        public Tweet tweet() {
            return this.tweet;
        }

        public User user() {
            return this.user;
        }
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
        public String authorizationUrl() {
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
