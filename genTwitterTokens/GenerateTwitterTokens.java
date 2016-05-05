/* astyle --style=java --indent=spaces=4 */

/*
 * Copyright (C) 2016 www.phantombot.net
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

package generatetwittertokens;

import twitter4j.Twitter;
import twitter4j.TwitterException;
import twitter4j.TwitterFactory;
import twitter4j.auth.AccessToken;
import twitter4j.auth.RequestToken;
import twitter4j.conf.Configuration;
import twitter4j.conf.ConfigurationFactory;
import twitter4j.conf.ConfigurationBuilder;

import java.awt.*;
import java.io.*;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Properties;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.nio.charset.StandardCharsets;

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

public class GenerateTwitterTokens {

    private final static String consumerKey = "tNuyxOX6kCnLdBhYBmyBqG6zr";
    private final static String consumerSecret = "0lQIKeaRWKG9CQkfr2a2pwrqQBxl0IK0FqDwgfmIZdVybHnXeX";

    public static void main(String[] args) {
        String username = "";

        ConfigurationBuilder configurationBuilder = new ConfigurationBuilder();
        configurationBuilder.setOAuthConsumerKey(consumerKey);
        configurationBuilder.setOAuthConsumerSecret(consumerSecret);

        try {
            Twitter twitter = new TwitterFactory(configurationBuilder.build()).getInstance();
            RequestToken requestToken = twitter.getOAuthRequestToken();
            AccessToken accessToken = null;

            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
            while (accessToken == null) {
                System.out.println("PhantomBot Twitter API Connection Tool\r\n\r\n" + 
                                   "This tool will request access to read and write to your Twitter account.\r\n" +
                                   "You will be presented with a URL to open in your local browser to approve\r\n" +
                                   "access, however, this application will attempt to launch a browser for\r\n" +
                                   "you automatically.\r\n\r\n" +
                                   "You will be presented with a PIN that you must provide back to this\r\n" +
                                   "application. After that is completed, Twitter will generate OAuth keys\r\n" +
                                   "which will be stored in the PhantomBot directory as twitter.txt.\r\n\r\n" +
                                   "Do keep this file safe! The keys are the same as a password to your Twitter\r\n" +
                                   "account!\r\n\r\n" +
                                   "You may regenerate the OAuth keys at any time if needed.\r\n");
                 
                System.out.println("Open the following URL in your browser if a browser does not automatically\r\n" +
                                   "launch within a few seconds:");
                System.out.println("    " + requestToken.getAuthorizationURL() + "\r\n");

                /*
                 * Attempt to launch a local browser.  Ignore exceptions, except if the URL is bad.
                 */
                try {
                    Desktop.getDesktop().browse(new URI(requestToken.getAuthorizationURL()));
                } catch (UnsupportedOperationException ignore) {
                } catch (IOException ignore) {
                } catch (URISyntaxException e) {
                    throw new AssertionError(e);
                }

                /*
                 * Request the username from the user.
                 */
                username = "";
                while (username.length() < 1) {
                    System.out.print("Provide your Twitter username: ");
                    try {
                        username = bufferedReader.readLine();
                    } catch (IOException ex) {
                        username = "";
                        System.out.println("Failed to read input. Please try again.");
                    }
                }

                /*
                 * Request the PIN from the user.
                 */
                String pin = "";
                while (pin.length() < 1) {
                    System.out.print("Enter the PIN provided by Twitter: ");
                    try {
                        pin = bufferedReader.readLine();
                        accessToken = twitter.getOAuthAccessToken(requestToken, pin);
                    } catch (TwitterException ex) {
                        if (ex.getStatusCode() == 401) {
                            pin = "";
                            System.out.println("Twitter failed to provide access tokens.  Please try again.");
                        } else {
                            System.out.println("Twitter returned an error:\r\n" + ex.getMessage());
                            System.exit(1);
                        }
                    } catch (IOException ex) {
                        pin = "";
                        System.out.println("Failed to read input. Please try again.");
                    }
                }

            }

            System.out.println("Twitter has provided PhantomBot with OAuth Access Tokens.");

            String twitterData = "";
            try {
                twitterData = "# Twitter Configuration File\r\n" +
                              "# Generated by PhantomBot GenerateTwitterTokens\r\n" +
                              "# If new tokens are required, run the application again.\r\n" +
                              "#\r\n" + 
                              "# PROTECT THIS FILE AS IF IT HAD YOUR TWITTER PASSWORD IN IT!\r\n" +
                              "twitter_username=" + username + "\r\n" +
                              "twitter_access_token=" + accessToken.getToken() + "\r\n" +
                              "twitter_secret_token=" + accessToken.getTokenSecret() + "\r\n";
                Files.write(Paths.get("./twitter.txt"), twitterData.getBytes(StandardCharsets.UTF_8),
                            StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
                System.out.println("Data has been successfully stored in twitter.txt.");
            } catch (IOException ex) {
                System.out.println("Unable to create twitter.txt.\r\nPlease create with the following content:\r\n" + twitterData);
                System.exit(1);
            }
        } catch (TwitterException ex) {
            System.out.println("Twitter returned an error:\r\n" + ex.getMessage());
            System.exit(1);
        }
    }
}
