/* astyle --style=java --indent=spaces=4 */

 /*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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
import java.math.BigInteger;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/*
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

    /*
     * Instance method for Twitter API.
     */
    public static synchronized TwitterAPI instance() {
        if (instance == null) {
            instance = new TwitterAPI();
        }

        return instance;
    }

    /*
     * Constructor for Twitter API.  Instantiates the Twitter object with the keys for PhantomBot.
     */
    private TwitterAPI() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    /*
     * Stores the username that is used for generating URLs automatically.
     *
     * @param  username  Twitter username
     */
    public void setUsername(String username) {
        this.username = username;
    }

    /*
     * Stores the access token used for authenticating the user to Twitter.
     *
     * @param  accessToken  Twitter provided OAuth access token.
     */
    public void setAccessToken(String accessToken) {
        this.oauthAccessToken = accessToken;
    }

    /*
     * Stores the secret token used for authenticating the user to Twitter.
     *
     * @param  secretToken  Twitter provided OAuth secret token.
     */
    public void setSecretToken(String secretToken) {
        this.oauthAccessSecret = secretToken;
    }

    /*
     * Stores the secret token used for authenticating the user to Twitter.
     *
     * @param  setConsumerKey  Twitter provided OAuth secret token.
     */
    public void setConsumerKey(String consumerKey) {
        this.consumerKey = consumerKey;
    }

    /*
     * Stores the secret token used for authenticating the user to Twitter.
     *
     * @param  setConsumerSecret  Twitter provided OAuth secret token.
     */
    public void setConsumerSecret(String consumerSecret) {
        this.consumerSecret = consumerSecret;
    }

    public TwitterClient getClient() {
        return this.getClient(false);
    }

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

    /*
     * Authenticates with Twitter using the OAuth method.  Twitter may throw an exception which is
     * captured and reported to the error logs.  If an error does occur, accessToken is set to null
     * so that other methods know not to try to interact with Twitter.
     *
     * @return  boolean  Returns true if authentication was successful else false.
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

    /*
     * Posts a Tweet on Twitter.  This will post to the user timeline and is the same as posting any
     * other status update on Twitter.  If there is an error posting, an exception is logged.
     *
     * @param   statusString  The string that will be posted on Twitter.
     * @return  String        'true' on success and 'false' on failure
     */
    public String updateStatus(String statusString) {
        if (!this.hasAccessToken) {
            return "false";
        }

        try {
            Tweet t = this.getClient().postTweet(statusString.replaceAll("@", "").replaceAll("#", ""));
            if (t != null && !t.getId().isBlank()) {
                com.gmt2001.Console.debug.println("Success");
                return "true";
            } else {
                com.gmt2001.Console.debug.println("Fail");
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return "false";
    }

    /*
     * Posts a Tweet on Twitter and includes a media file.
     *
     * @param   statusString  The string that will be posted on Twitter.
     * @param   filename      The filename to read as media and post to Twitter.
     * @return  String        'true' on success and 'false' on failure
     */
    public String updateStatus(String statusString, String filename, String mediaType) {
        if (!this.hasAccessToken) {
            return "false";
        }

        try {
            UploadMediaResponse umr = this.getClient().uploadMedia(Paths.get(filename).toFile(), MediaCategory.valueOf(mediaType));
            if (umr != null && umr.getMediaId().length() > 0) {
                List<String> mediaIds = new ArrayList<>();
                mediaIds.add(umr.getMediaId());
                TweetParameters tp = TweetParameters.builder().text(statusString.replaceAll("@", "").replaceAll("#", "")).media(Media.builder().mediaIds(mediaIds).build()).build();
                Tweet t = this.getClient().postTweet(tp);
                if (t != null && !t.getId().isBlank()) {
                    com.gmt2001.Console.debug.println("Success");
                    return "true";
                } else {
                    com.gmt2001.Console.debug.println("Fail");
                }
            } else {
                com.gmt2001.Console.debug.println("Media Fail");
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return "false";
    }

    /*
     * Reads the user timeline on Twitter.  This includes posts only made by the authenticated user.
     *
     * @return  List<status>  List of Status objects on success, null on failure.
     */
    public List<TweetData> getUserTimeline(String sinceId) {
        if (!this.hasAccessToken) {
            com.gmt2001.Console.debug.println("Access Token is NULL");
            return null;
        }

        try {
            com.gmt2001.Console.debug.println("Polling Data");
            AdditionalParametersBuilder ap = AdditionalParameters.builder().maxResults(15);
            if (sinceId != null && sinceId.isBlank()) {
                ap.sinceId(sinceId);
            }
            TweetList statuses = this.getClient().getUserTimeline(this.userId, ap.build());
            if (statuses.getData().isEmpty()) {
                return null;
            }
            return statuses.getData().stream().filter(t -> t.getTweetType() != TweetType.RETWEETED).collect(Collectors.toList());
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return null;
    }

    /*
     * Reads the timeline of another user.  Note that if the authenticated user does not have access
     * to the timeline, nothing is returned but the API lookup is still charged.
     *
     * @return  String  Most recent status of the user requested.
     */
    public String getOtherUserTimeline(String username) {
        if (!this.hasAccessToken) {
            com.gmt2001.Console.debug.println("Access Token is NULL");
            return null;
        }

        try {
            com.gmt2001.Console.debug.println("Polling Data");
            UserV2 user = this.getClient().getUserFromUserName(username);

            if (user != null && !user.getId().isBlank()) {
                TweetList statuses = this.getClient().getUserTimeline(user.getId());
                if (statuses.getData().isEmpty()) {
                    return null;
                }
                return statuses.getData().get(0).getText();
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return null;
    }

    /*
     * Reads the home timeline on Twitter.  This includes posts made by the user, retweets, and
     * posts made by friends.  This is essentially the screen that is seen when logging into
     * Twitter.
     *
     * @return  List<Status>  List of Status objects on success, null on failure.
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

                AdditionalParameters ap = AdditionalParameters.builder().maxResults(sinceId != null && sinceId.isBlank() ? 15 : 30)
                        .startTime(LocalDateTime.now().minusDays(1)).build();
                TweetList statuses = this.getClient().getUserTimeline(this.userId, ap);
                alltweets.addAll(statuses.getData());

                BigInteger sinceIdBI = sinceId != null && !sinceId.isBlank() ? new BigInteger(sinceId) : null;
                following.getData().forEach(u -> {
                    if (!u.getId().isBlank()) {
                        List<TweetData> statusesF = this.getClient().getUserTimeline(u.getId(), ap).getData();
                        if (sinceId != null && !sinceId.isBlank() && sinceIdBI != null) {
                            statusesF = statusesF.stream().filter(t -> new BigInteger(t.getId()).compareTo(sinceIdBI) > 0).collect(Collectors.toList());
                        }
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

    /*
     * Reads retweets on Twitter.  This includes posts made by the user that have been retweeted by others.
     *
     * @param   long          The last ID that was pulled from Twitter for retweets.
     * @return  List<Status>  List of Status objects on success, null on failure.
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

                AdditionalParameters ap = AdditionalParameters.builder().maxResults(sinceId != null && sinceId.isBlank() ? 15 : 30)
                        .startTime(LocalDateTime.now().minusDays(1)).build();

                BigInteger sinceIdBI = sinceId != null && !sinceId.isBlank() ? new BigInteger(sinceId) : null;
                following.getData().forEach(u -> {
                    if (!u.getId().isBlank()) {
                        TweetList statusesF = this.getClient().getUserTimeline(u.getId(), ap);
                        List<TweetData> statusesFF = statusesF.getData().stream().filter(t -> t.getTweetType() == TweetType.RETWEETED).collect(Collectors.toList());
                        if (sinceId != null && !sinceId.isBlank() && sinceIdBI != null) {
                            statusesFF = statusesFF.stream().filter(t -> new BigInteger(t.getId()).compareTo(sinceIdBI) > 0).collect(Collectors.toList());
                        }
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

    /*
     * Grabs retweet information from a specific Tweet from Twitter.
     *
     * @param  long          The ID of a Tweet to retrieve data for.
     * @return List<status>  List of Status objects on success, null on failure.
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

                AdditionalParameters ap = AdditionalParameters.builder().maxResults(15)
                        .startTime(LocalDateTime.now().minusDays(1)).build();

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

                return alltweets.stream().filter(t -> t.getReferencedTweets().stream().filter(rt -> rt.getType() == TweetType.RETWEETED).findFirst().get().getId().equals(statusId)).collect(Collectors.toList());
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return null;
    }

    /*
     * Looks for mentions (@username) on Twitter.
     *
     * @param  long           The last ID was was pulled from Twitter for mentions.
     * @return  List<Status>  List of Status objects on success, null on failure.
     */
    public List<TweetData> getMentions(String sinceId) {
        if (!this.hasAccessToken) {
            com.gmt2001.Console.debug.println("Access Token is NULL");
            return null;
        }

        if (!this.hasAccessToken) {
            com.gmt2001.Console.debug.println("Access Token is NULL");
            return null;
        }

        try {
            com.gmt2001.Console.debug.println("Polling Data");
            AdditionalParametersBuilder ap = AdditionalParameters.builder().maxResults(15);
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

    /*
     * Given a status, creates the URL for that status.
     *
     * @param   long    Twitter status ID.
     * @return  String  URL in the format of https://twitter.com/<username>/status/<id>
     */
    public String getTwitterURLFromId(String id) {
        return "https://twitter.com/" + this.username + "/status/" + id;
    }

    /*
     * Returns the configured Twitter username.
     *
     * @return  String  Twitter username.
     */
    public String getUsername() {
        return this.username;
    }
}
