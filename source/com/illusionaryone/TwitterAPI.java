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
package com.illusionaryone;

import io.github.redouane59.twitter.TwitterClient;
import io.github.redouane59.twitter.dto.endpoints.AdditionalParameters;
import io.github.redouane59.twitter.dto.endpoints.AdditionalParameters.AdditionalParametersBuilder;
import io.github.redouane59.twitter.dto.tweet.MediaCategory;
import io.github.redouane59.twitter.dto.tweet.Tweet;
import io.github.redouane59.twitter.dto.tweet.TweetList;
import io.github.redouane59.twitter.dto.tweet.TweetParameters;
import io.github.redouane59.twitter.dto.tweet.TweetParameters.Media;
import io.github.redouane59.twitter.dto.tweet.TweetType;
import io.github.redouane59.twitter.dto.tweet.TweetV2.TweetData;
import io.github.redouane59.twitter.dto.tweet.UploadMediaResponse;
import io.github.redouane59.twitter.dto.user.UserList;
import io.github.redouane59.twitter.dto.user.UserV2;
import io.github.redouane59.twitter.signature.TwitterCredentials;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import tv.phantombot.CaselessProperties;

/**
 * @author illusionaryone
 */
public class TwitterAPI {

    private static TwitterAPI instance;
    private String username;
    private String oauthAccessToken;
    private String oauthAccessSecret;
    private String consumerKey;
    private String consumerSecret;
    private String userId;
    private boolean hasAccessToken = false;
    private TwitterClient twitter;

    /**
     * Instance method for Twitter API.
     *
     * @return
     */
    public static synchronized TwitterAPI instance() {
        if (instance == null) {
            instance = new TwitterAPI();
        }

        return instance;
    }

    /**
     * Constructor for Twitter API. Instantiates the Twitter object with the keys for PhantomBot.
     */
    private TwitterAPI() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    /**
     * Stores the username that is used for generating URLs automatically.
     *
     * @param username Twitter username
     */
    public void setUsername(String username) {
        this.username = username;
    }

    /**
     * Stores the access token used for authenticating the user to Twitter.
     *
     * @param accessToken Twitter provided OAuth access token.
     */
    public void setAccessToken(String accessToken) {
        this.oauthAccessToken = accessToken;
    }

    /**
     * Stores the secret token used for authenticating the user to Twitter.
     *
     * @param secretToken Twitter provided OAuth secret token.
     */
    public void setSecretToken(String secretToken) {
        this.oauthAccessSecret = secretToken;
    }

    /**
     * Stores the secret token used for authenticating the user to Twitter.
     *
     * @param consumerKey Twitter provided OAuth secret token.
     */
    public void setConsumerKey(String consumerKey) {
        this.consumerKey = consumerKey;
    }

    /**
     * Stores the secret token used for authenticating the user to Twitter.
     *
     * @param consumerSecret Twitter provided OAuth secret token.
     */
    public void setConsumerSecret(String consumerSecret) {
        this.consumerSecret = consumerSecret;
    }

    /**
     * Retrieves the currently active Twitter client instance. Creates a new client if it doesn't exist
     *
     * @return
     */
    public TwitterClient getClient() {
        return this.getClient(false);
    }

    /**
     * Retrieves the currently active Twitter client instance. Creates a new client if it doesn't exist
     *
     * @param forceCreate If true, will force creation of a new client, even if one already exists
     * @return
     */
    public synchronized TwitterClient getClient(boolean forceCreate) {
        if (this.twitter != null && !forceCreate) {
            return this.twitter;
        }

        if (this.consumerKey == null || this.consumerKey.isBlank()) {
            throw new IllegalStateException("missing consumer key");
        }

        if (this.consumerSecret == null || this.consumerSecret.isBlank()) {
            throw new IllegalStateException("missing consumer secret");
        }

        if (this.oauthAccessToken == null || this.oauthAccessToken.isBlank()) {
            throw new IllegalStateException("missing oauth access token");
        }

        if (this.oauthAccessSecret == null || this.oauthAccessSecret.isBlank()) {
            throw new IllegalStateException("missing oauth access secret");
        }

        this.twitter = new TwitterClient(TwitterCredentials.builder().accessToken(this.oauthAccessToken).accessTokenSecret(this.oauthAccessSecret)
                .apiKey(this.consumerKey).apiSecretKey(this.consumerSecret).build());

        return this.twitter;
    }

    /**
     * Authenticates with Twitter using the OAuth method. Twitter may throw an exception which is captured and reported to the error logs. If an error
     * does occur, accessToken is set to null so that other methods know not to try to interact with Twitter.
     *
     * @return Returns true if authentication was successful else false.
     */
    public boolean authenticate() {
        com.gmt2001.Console.debug.println("Attempting to Authenticate");
        try {
            this.userId = this.getClient(true).getUserIdFromAccessToken();
            this.hasAccessToken = !this.userId.isBlank();
            if (this.hasAccessToken) {
                com.gmt2001.Console.out.println("Authenticated with Twitter API");
            } else {
                com.gmt2001.Console.out.println("Failed to authenticate with Twitter API");
            }
            return this.hasAccessToken;
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            this.hasAccessToken = false;
            return false;
        }
    }

    /**
     * Posts a Tweet on Twitter. This will post to the user timeline and is the same as posting any other status update on Twitter. If there is an
     * error posting, an exception is logged.
     *
     * @param statusString The string that will be posted on Twitter.
     * @return true on success
     */
    public boolean updateStatus(String statusString) {
        if (!this.hasAccessToken) {
            return false;
        }

        if (!CaselessProperties.instance().getPropertyAsBoolean("twitterallowmentions", false)) {
            statusString = statusString.replaceAll("@", "").replaceAll("#", "");
        }

        try {
            Tweet t = this.getClient().postTweet(statusString);
            if (t != null && !t.getId().isBlank()) {
                com.gmt2001.Console.debug.println("Success");
                return true;
            } else {
                com.gmt2001.Console.debug.println("Fail");
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return false;
    }

    /**
     * Posts a Tweet on Twitter and includes a media file.
     *
     * @param statusString The string that will be posted on Twitter.
     * @param filename The filename to read as media and post to Twitter.
     * @param mediaType The media type of the file. Can be TWEET_GIF, TWEET_IMAGE, TWEET_VIDEO, or AMPLIFY_VIDEO
     * @return true on success
     */
    public boolean updateStatus(String statusString, String filename, String mediaType) {
        if (!this.hasAccessToken) {
            return false;
        }

        if (!CaselessProperties.instance().getPropertyAsBoolean("twitterallowmentions", false)) {
            statusString = statusString.replaceAll("@", "").replaceAll("#", "");
        }

        try {
            UploadMediaResponse umr = this.getClient().uploadMedia(Paths.get(filename).toFile(), MediaCategory.valueOf(mediaType));
            if (umr != null && umr.getMediaId().length() > 0) {
                List<String> mediaIds = new ArrayList<>();
                mediaIds.add(umr.getMediaId());
                TweetParameters tp = TweetParameters.builder().text(statusString).media(Media.builder().mediaIds(mediaIds).build()).build();
                Tweet t = this.getClient().postTweet(tp);
                if (t != null && !t.getId().isBlank()) {
                    com.gmt2001.Console.debug.println("Success");
                    return true;
                } else {
                    com.gmt2001.Console.debug.println("Fail");
                }
            } else {
                com.gmt2001.Console.debug.println("Media Fail");
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return false;
    }

    /**
     * Reads the user timeline on Twitter. This includes posts only made by the authenticated user. Retweets are excluded
     *
     * @param sinceId The tweet ID for pagination. The tweet with the specified ID will be the first result. Use null for the latest tweets
     * @return List of Status objects on success, null on failure.
     */
    public List<TweetData> getUserTimeline(String sinceId) {
        return this.getUserTimeline(this.userId, sinceId, false);
    }

    /**
     * Reads the user timeline on Twitter.This includes posts only made by the specified user.
     *
     * @param userId The user ID to retrieve tweets for
     * @param sinceId The tweet ID for pagination. The tweet with the specified ID will be the first result. Use null for the latest tweets
     * @param retweets If true, include retweets. If false, retweets will be filtered, which may reduce the number of results
     * @return List of Status objects on success, null on failure.
     */
    public List<TweetData> getUserTimeline(String userId, String sinceId, boolean retweets) {
        if (!this.hasAccessToken) {
            com.gmt2001.Console.debug.println("Access Token is NULL");
            return null;
        }

        if (userId == null || userId.isBlank()) {
            com.gmt2001.Console.debug.println("User ID is NULL");
            return null;
        }

        try {
            com.gmt2001.Console.debug.println("Polling Data");
            AdditionalParametersBuilder ap = AdditionalParameters.builder()
                    .maxResults(CaselessProperties.instance().getPropertyAsInt("twitterusertimelinelimit", 15));

            if (sinceId != null && sinceId.isBlank()) {
                ap.sinceId(sinceId);
            }

            TweetList statuses = this.getClient().getUserTimeline(userId, ap.build());
            if (statuses.getData().isEmpty()) {
                return null;
            }

            List<TweetData> result = statuses.getData();

            if (!retweets) {
                result = result.stream().filter(t -> t.getTweetType() != TweetType.RETWEETED).collect(Collectors.toList());
            }

            return result;
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
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
        UserV2 user = this.getClient().getUserFromUserName(username);

        if (user != null) {
            return user.getId();
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
        List<TweetData> result = this.getUserTimeline(this.getUserIdFromUsername(username), null, true);

        if (result != null) {
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
    public List<TweetData> getHomeTimeline(String sinceId) {
        if (!this.hasAccessToken) {
            com.gmt2001.Console.debug.println("Access Token is NULL");
            return null;
        }

        try {
            com.gmt2001.Console.debug.println("Polling Data");
            UserList following = this.getClient().getFollowing(this.userId);

            if (following != null && !following.getData().isEmpty()) {
                List<TweetData> alltweets = new ArrayList<>();

                AdditionalParametersBuilder apb = AdditionalParameters.builder()
                        .maxResults(sinceId != null && sinceId.isBlank()
                                ? CaselessProperties.instance().getPropertyAsInt("twittertimelinelimit", 15)
                                : CaselessProperties.instance().getPropertyAsInt("twittertimelineextendedlimit", 30))
                        .startTime(LocalDateTime.now().minusDays(1));

                if (sinceId != null && sinceId.isBlank()) {
                    apb.sinceId(sinceId);
                }

                AdditionalParameters ap = apb.build();

                TweetList statuses = this.getClient().getUserTimeline(this.userId, ap);
                alltweets.addAll(statuses.getData());

                following.getData().forEach(u -> {
                    if (!u.getId().isBlank()) {
                        List<TweetData> statusesF = this.getClient().getUserTimeline(u.getId(), ap).getData();
                        alltweets.addAll(statusesF);
                    }
                });

                alltweets.sort((TweetData a, TweetData b) -> {
                    return -a.getCreatedAt().compareTo(b.getCreatedAt());
                });

                return alltweets;
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return null;
    }

    /**
     * Reads retweets on Twitter. This includes posts made by the user that have been retweeted by others. This is limited to the last 24 hours
     *
     * @param sinceId The tweet ID for pagination. The tweet with the specified ID will be the first result. Use null for the latest tweets
     * @return List of Status objects on success, null on failure.
     */
    public List<TweetData> getRetweetsOfMe(String sinceId) {
        if (!this.hasAccessToken) {
            com.gmt2001.Console.debug.println("Access Token is NULL");
            return null;
        }

        try {
            com.gmt2001.Console.debug.println("Polling Data");
            UserList following = this.getClient().getFollowing(this.userId);

            if (following != null && !following.getData().isEmpty()) {
                List<TweetData> alltweets = new ArrayList<>();

                AdditionalParametersBuilder apb = AdditionalParameters.builder()
                        .maxResults(sinceId != null && sinceId.isBlank()
                                ? CaselessProperties.instance().getPropertyAsInt("twittertimelinelimit", 15)
                                : CaselessProperties.instance().getPropertyAsInt("twittertimelineextendedlimit", 30))
                        .startTime(LocalDateTime.now().minusDays(1));

                if (sinceId != null && sinceId.isBlank()) {
                    apb.sinceId(sinceId);
                }

                AdditionalParameters ap = apb.build();

                following.getData().forEach(u -> {
                    if (!u.getId().isBlank()) {
                        TweetList statusesF = this.getClient().getUserTimeline(u.getId(), ap);
                        List<TweetData> statusesFF = statusesF.getData().stream().filter(t -> t.getTweetType() == TweetType.RETWEETED).collect(Collectors.toList());
                        if (!statusesFF.isEmpty()) {
                            alltweets.addAll(statusesFF);
                        }
                    }
                });

                alltweets.sort((TweetData a, TweetData b) -> {
                    return -a.getCreatedAt().compareTo(b.getCreatedAt());
                });

                List<String> tweetids = alltweets.stream().map(t -> t.getReferencedTweets().stream().filter(rt -> rt.getType() == TweetType.RETWEETED).findFirst().get().getId()).collect(Collectors.toList());

                TweetList statuses = this.getClient().getTweets(tweetids);

                List<String> allretweets = new ArrayList<>();

                if (statuses != null && !statuses.getData().isEmpty()) {
                    allretweets.addAll(statuses.getData().stream().filter(t -> t.getAuthorId().equals(this.userId)).map(t -> t.getId()).collect(Collectors.toList()));
                }

                return alltweets.stream().filter(t -> allretweets.contains(t.getReferencedTweets().stream().filter(rt -> rt.getType() == TweetType.RETWEETED).findFirst().get().getId())).collect(Collectors.toList());
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return null;
    }

    /**
     * Grabs retweet information from a specific Tweet from Twitter. This is limited to the last 24 hours
     *
     * @param statusId The tweet ID to check for retweets
     * @return List of Status objects on success, null on failure.
     */
    public List<TweetData> getRetweets(String statusId) {
        if (!this.hasAccessToken) {
            com.gmt2001.Console.debug.println("Access Token is NULL");
            return null;
        }

        try {
            com.gmt2001.Console.debug.println("Polling Data");
            UserList following = this.getClient().getFollowing(this.userId);

            if (following != null && !following.getData().isEmpty()) {
                List<TweetData> alltweets = new ArrayList<>();

                AdditionalParametersBuilder ap = AdditionalParameters.builder()
                        .maxResults(CaselessProperties.instance().getPropertyAsInt("twitterusertimelinelimit", 15))
                        .startTime(LocalDateTime.now().minusDays(1));

                following.getData().forEach(u -> {
                    if (!u.getId().isBlank()) {
                        TweetList statusesF = this.getClient().getUserTimeline(u.getId(), ap.build());
                        List<TweetData> statusesFF = statusesF.getData().stream().filter(t -> t.getTweetType() == TweetType.RETWEETED).collect(Collectors.toList());
                        if (!statusesFF.isEmpty()) {
                            alltweets.addAll(statusesFF);
                        }
                    }
                });

                alltweets.sort((TweetData a, TweetData b) -> {
                    return -a.getCreatedAt().compareTo(b.getCreatedAt());
                });

                return alltweets.stream().filter(t -> t.getReferencedTweets().stream().filter(rt -> rt.getType() == TweetType.RETWEETED).findFirst().get().getId().equals(statusId)).collect(Collectors.toList());
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return null;
    }

    /**
     * Looks for mentions (@username) on Twitter.
     *
     * @param sinceId The tweet ID for pagination. The tweet with the specified ID will be the first result. Use null for the latest tweets
     * @return List of Status objects on success, null on failure.
     */
    public List<TweetData> getMentions(String sinceId) {
        if (!this.hasAccessToken) {
            com.gmt2001.Console.debug.println("Access Token is NULL");
            return null;
        }

        try {
            com.gmt2001.Console.debug.println("Polling Data");
            AdditionalParametersBuilder ap = AdditionalParameters.builder()
                    .maxResults(CaselessProperties.instance().getPropertyAsInt("twitterusertimelinelimit", 15));

            if (sinceId != null && sinceId.isBlank()) {
                ap.sinceId(sinceId);
            }

            TweetList statuses = this.getClient().getUserMentions(this.userId, ap.build());

            if (statuses.getData().isEmpty()) {
                return null;
            }
            return statuses.getData().stream().filter(t -> t.getTweetType() != TweetType.RETWEETED).collect(Collectors.toList());
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
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
        return "https://twitter.com/" + this.username + "/status/" + id;
    }

    /**
     * Returns the configured Twitter username.
     *
     * @return String Twitter username.
     */
    public String getUsername() {
        return this.username;
    }
}
