/* astyle --style=java --indent=spaces=4 */

/*
 * Copyright (C) 2017 phantombot.tv
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

import java.io.File;
import java.util.List;

import twitter4j.Paging;
import twitter4j.Status;
import twitter4j.StatusUpdate;
import twitter4j.Twitter;
import twitter4j.TwitterException;
import twitter4j.TwitterFactory;
import twitter4j.auth.AccessToken;
import twitter4j.conf.ConfigurationBuilder;

/*
 * API services provided by:
 * Twitter4J (http://twitter4j.org/)
 * 
 * Copyright 2007 Yusuke Yamamoto
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * Distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

/*
 * @author illusionaryone
 */

public class TwitterAPI {

    private static final TwitterAPI instance = new TwitterAPI();
    private String username;
    private String oauthAccessToken;
    private String oauthAccessSecret;
    private String consumerKey;
    private String consumerSecret;
    private AccessToken accessToken = null;
    private Twitter twitter = null;

    /*
     * Instance method for Twitter API.
     */
    public static TwitterAPI instance() {
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

    /*
     * Authenticates with Twitter using the OAuth method.  Twitter may throw an exception which is
     * captured and reported to the error logs.  If an error does occur, accessToken is set to null
     * so that other methods know not to try to interact with Twitter.
     *
     * @return  Boolean  Returns true if authentication was successful else false.
     */
    public Boolean authenticate() {
        com.gmt2001.Console.debug.println("TwitterAPI::authenticate()");
        try {
            ConfigurationBuilder configurationBuilder = new ConfigurationBuilder();
            configurationBuilder.setOAuthConsumerKey(consumerKey);
            configurationBuilder.setOAuthConsumerSecret(consumerSecret);
            configurationBuilder.setOAuthAccessToken(oauthAccessToken);
            configurationBuilder.setOAuthAccessTokenSecret(oauthAccessSecret);

            TwitterFactory twitterFactory = new TwitterFactory(configurationBuilder.build());
            twitter = twitterFactory.getInstance();

            accessToken = twitter.getOAuthAccessToken();
            com.gmt2001.Console.out.println("Authenticated with Twitter API");
            return true;
        }
        catch (TwitterException ex) {
            com.gmt2001.Console.err.println("TwitterAPI::authenticate: Failed: " + ex.getMessage());
            accessToken = null;
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
        if (accessToken == null) {
            return "false";
        }

        try {
            Status status = twitter.updateStatus(statusString.replaceAll("@", "").replaceAll("#", ""));
            com.gmt2001.Console.debug.println("TwitterAPI::updateStatus: Success");
            return "true";
        } catch (TwitterException ex) {
            com.gmt2001.Console.err.println("TwitterAPI::updateStatus: Failed: " + ex.getMessage());
            return "false";
        }
    }

    /*
     * Posts a Tweet on Twitter and includes a media file.
     *
     * @param   statusString  The string that will be posted on Twitter.
     * @param   filename      The filename to read as media and post to Twitter.
     * @return  String        'true' on success and 'false' on failure
     */
    public String updateStatus(String statusString, String filename) {
        if (accessToken == null) {
            return "false";
        }

        try {
            StatusUpdate statusUpdate = new StatusUpdate(statusString.replaceAll("@", "").replaceAll("#", ""));
            statusUpdate.setMedia(new File(filename));
            Status status = twitter.updateStatus(statusUpdate);
            com.gmt2001.Console.debug.println("TwitterAPI::updateStatus: Success");
            return "true";
        } catch (TwitterException ex) {
            com.gmt2001.Console.err.println("TwitterAPI::updateStatus: Failed: " + ex.getMessage());
            return "false";
        }
    }

    /*
     * Reads the user timeline on Twitter.  This includes posts only made by the authenticated user.
     *
     * @return  List<status>  List of Status objects on success, null on failure.
     */
    public List<Status> getUserTimeline(long sinceId) {
        if (accessToken == null) {
            com.gmt2001.Console.debug.println("TwitterAPI::getUserTimeline: Access Token is NULL");
            return null;
        }

        try {
            com.gmt2001.Console.debug.println("TwitterAPI::getUserTimeline: Polling Data");
            if (sinceId != 0L) {
                Paging paging = new Paging(sinceId);
                List<Status> statuses = twitter.getUserTimeline(paging);
                if (statuses.isEmpty()) {
                    return null;
                }
                return statuses;
            } else {
                List<Status> statuses = twitter.getUserTimeline();
                if (statuses.isEmpty()) {
                    return null;
                }
                return statuses;
            }
        } catch (TwitterException ex) {
            com.gmt2001.Console.err.println("TwitterAPI::getUserTimeline: Failed: " + ex.getMessage());
            return null;
        }
    }

    /*
     * Reads the timeline of another user.  Note that if the authenticated user does not have access
     * to the timeline, nothing is returned but the API lookup is still charged.
     *
     * @return  String  Most recent status of the user requested.
     */
    public String getUserTimeline(String username) {
        if (accessToken == null) {
            com.gmt2001.Console.debug.println("TwitterAPI::getUserTimeline: Access Token is NULL");
            return null;
        }

        try {
            com.gmt2001.Console.debug.println("TwitterAPI::getUserTimeline: Polling Data");
            List<Status> statuses = twitter.getUserTimeline(username);
            if (statuses.isEmpty()) {
                return null;
            }
            return statuses.get(0).getText();
        } catch (TwitterException ex) {
            com.gmt2001.Console.err.println("TwitterAPI::getUserTimeline: Failed: " + ex.getMessage());
            return null;
        }
   } 

    /*
     * Reads the home timeline on Twitter.  This includes posts made by the user, retweets, and
     * posts made by friends.  This is essentially the screen that is seen when logging into 
     * Twitter.
     *
     * @return  List<Status>  List of Status objects on success, null on failure.
     */
    public List<Status> getHomeTimeline(long sinceId) {
        if (accessToken == null) {
            com.gmt2001.Console.debug.println("TwitterAPI::getHomeTimeline: Access Token is NULL");
            return null;
        }

        try {
            com.gmt2001.Console.debug.println("TwitterAPI::getHomeTimeline: Polling Data");
            if (sinceId != 0L) {
                Paging paging = new Paging(sinceId);
                List<Status> statuses = twitter.getHomeTimeline(paging);
                if (statuses.isEmpty()) {
                    return null;
                }
                return statuses;
            } else {
                List<Status> statuses = twitter.getHomeTimeline();
                if (statuses.isEmpty()) {
                    return null;
                }
                return statuses;
            }
        } catch (TwitterException ex) {
            com.gmt2001.Console.err.println("TwitterAPI::getHomeTimeline: Failed: " + ex.getMessage());
            return null;
        }
    }

    /*
     * Reads retweets on Twitter.  This includes posts made by the user that have been retweeted by others.
     *
     * @param   long          The last ID that was pulled from Twitter for retweets.
     * @return  List<Status>  List of Status objects on success, null on failure.
     */
    public List<Status> getRetweetsOfMe(long sinceId) {
        if (accessToken == null) {
            com.gmt2001.Console.debug.println("TwitterAPI::getRetweetsOfMe: Access Token is NULL");
            return null;
        }

        try {
            com.gmt2001.Console.debug.println("TwitterAPI::getRetweetsOfMe: Polling Data");
            if (sinceId != 0L) {
                Paging paging = new Paging(sinceId);
                List<Status> statuses = twitter.getRetweetsOfMe(paging);
                if (statuses.isEmpty()) {
                    return null;
                }
                return statuses;
            } else {
                List<Status> statuses = twitter.getRetweetsOfMe();
                if (statuses.isEmpty()) {
                    return null;
                }
                return statuses;
            }
        } catch (TwitterException ex) {
            com.gmt2001.Console.err.println("TwitterAPI::getRetweetsOfMe: Failed: " + ex.getMessage());
            return null;
        }
    }

    /*
     * Looks for mentions (@username) on Twitter.  
     *
     * @param  long           The last ID was was pulled from Twitter for mentions.
     * @return  List<Status>  List of Status objects on success, null on failure.
     */
    public List<Status> getMentions(long sinceId) {
        if (accessToken == null) {
            com.gmt2001.Console.debug.println("TwitterAPI::getMentions: Access Token is NULL");
            return null;
        }

        try {
            com.gmt2001.Console.debug.println("TwitterAPI::getMentions: Polling Data");
            if (sinceId != 0L) {
                Paging paging = new Paging(sinceId);
                List<Status> statuses = twitter.getMentionsTimeline(paging);
                if (statuses.isEmpty()) {
                    return null;
                }
                return statuses;
            } else {
                List<Status> statuses = twitter.getMentionsTimeline();
                if (statuses.isEmpty()) {
                    return null;
                }
                return statuses;
            }
        } catch (TwitterException ex) {
            com.gmt2001.Console.err.println("TwitterAPI::getMentions: Failed: " + ex.getMessage());
            return null;
        }
    }

    /*
     * Given a status, creates the URL for that status.
     *
     * @param   long    Twitter status ID.
     * @return  String  URL in the format of https://twitter.com/<username>/status/<id>
     */
    public String getTwitterURLFromId(long id) {
        return new String("https://twitter.com/" + username + "/status/" + Long.toString(id));
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
