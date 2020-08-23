/*
 * Copyright (C) 2016-2020 phantom.bot
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

package tv.phantombot.console;

import net.engio.mbassy.listener.Handler;

import com.gmt2001.TwitchAPIv5;
import com.gmt2001.datastore.DataStore;

import com.scaniatv.BotImporter;
import com.scaniatv.GenerateLogs;

import java.io.FileOutputStream;
import java.io.IOException;

import java.text.SimpleDateFormat;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.Enumeration;
import java.util.List;
import java.util.Properties;
import java.util.TimeZone;
import java.util.TreeSet;
import org.json.JSONException;

import tv.phantombot.PhantomBot;

import tv.phantombot.discord.DiscordAPI;

import tv.phantombot.event.EventBus;
import tv.phantombot.event.Listener;
import tv.phantombot.event.console.ConsoleInputEvent;
import tv.phantombot.event.irc.channel.IrcChannelJoinEvent;
import tv.phantombot.event.pubsub.channelpoints.PubSubChannelPointsEvent;
import tv.phantombot.event.twitch.bits.TwitchBitsEvent;
import tv.phantombot.event.twitch.clip.TwitchClipEvent;
import tv.phantombot.event.twitch.follower.TwitchFollowEvent;
import tv.phantombot.event.twitch.host.TwitchHostedEvent;
import tv.phantombot.event.twitch.offline.TwitchOfflineEvent;
import tv.phantombot.event.twitch.online.TwitchOnlineEvent;
import tv.phantombot.event.twitch.raid.TwitchRaidEvent;
import tv.phantombot.event.twitch.subscriber.TwitchPrimeSubscriberEvent;
import tv.phantombot.event.twitch.subscriber.TwitchReSubscriberEvent;
import tv.phantombot.event.twitch.subscriber.TwitchSubscriberEvent;
import tv.phantombot.event.twitch.subscriber.TwitchSubscriptionGiftEvent;
import tv.phantombot.event.twitch.subscriber.TwitchMassAnonymousSubscriptionGiftedEvent;
import tv.phantombot.event.twitch.subscriber.TwitchAnonymousSubscriptionGiftEvent;

import tv.phantombot.event.twitter.TwitterRetweetEvent;

import tv.phantombot.script.Script;


public class ConsoleEventHandler implements Listener {
    private static final ConsoleEventHandler instance = new ConsoleEventHandler();

    /**
     * Method that returns this instance.
     *
     * @return
     */
    public static ConsoleEventHandler instance() {
        return instance;
    }

    /**
     * Class constructor.
     */
    private ConsoleEventHandler() {

    }

    /**
     * Method that is triggered when the console event fires.
     *
     * @param event
     */
    @Handler
    public void onConsoleInput(ConsoleInputEvent event) throws JSONException {
        // The message said in the console.
        String message = event.getMessage();
        // If settings were changed.
        boolean changed = false;
        // Arguments of the message string.
        String arguments = "";
        // Split arguments of the message string.
        String[] argument = null;
        // Set the datastore.
        DataStore dataStore = PhantomBot.instance().getDataStore();

        // If the message is null, or empty ignore everything below.
        if (message == null || message.isEmpty()) {
            return;
        }

        message = message.replaceAll("!", "").trim();

        // Check for arguments in the message string.
        if (message.contains(" ")) {
            String messageString = message;
            message = messageString.substring(0, messageString.indexOf(" "));
            arguments = messageString.substring(messageString.indexOf(" ") + 1);
            argument = arguments.split(" ");
        }

        /**
         * @consolecommand raidtest - Tests the raid event.
         */
        if (message.equalsIgnoreCase("raidtest")) {
            String raidName = PhantomBot.generateRandomString(8);
            com.gmt2001.Console.out.println("Testing Raid Event (Username = " + raidName + ", Viewers = 10)");
            EventBus.instance().postAsync(new TwitchRaidEvent(raidName, "10"));
            return;
        }

        /**
         * @consolecommand checkytquota - This command checks the quota points used by YouTube.
         */
        if (message.equalsIgnoreCase("checkytquota")) {
            String ytQuotaDate = dataStore.GetString("youtubePlayer", "", "quotaDate");
            String ytQuotaPoints = dataStore.GetString("youtubePlayer", "", "quotaPoints");

            if (ytQuotaDate == null || ytQuotaPoints == null) {
                com.gmt2001.Console.out.println("No YouTube Quota Data Found.");
            } else {
                com.gmt2001.Console.out.println("YouTube Quota Date (US/Pacific): " + ytQuotaDate + " Points Used: " + ytQuotaPoints);
            }
            return;
        }

        /**
         * @consolecommand exportpoints - This command exports points and time to a CSV file.
         */
        if (message.equalsIgnoreCase("exportpoints")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe exportpoints aus.");

            // Top headers of the CSV file.
            String[] headers = new String[] {"Username", "Seconds", "Points"};
            // All points keys.
            String[] keys = dataStore.GetKeyList("points", "");
            // Array to store our values.
            List<String[]> values = new ArrayList<>();

            // Loop that gets all points and time.
            for (String key : keys) {
                String[] str = new String[3];
                str[0] = key;
                str[1] = (dataStore.exists("time", key) ? dataStore.get("time", key) : "0");
                str[2] = dataStore.get("points", key);
                values.add(str);
            }

            // Export to CSV.
            PhantomBot.instance().toCSV(headers, values, "points_export.csv");
            com.gmt2001.Console.out.println("[CONSOLE] Punkte wurden nach points_export.csv exportiert.");
            return;
        }

        /**
         * @consolecommand createcmdlist - Creates a list of all commands with their permissions.
         */
        if (message.equalsIgnoreCase("createcmdlist")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe createcmdlist aus.");

            // Headers of the CSV file.
            String[] headers = new String[] {"Command", "Permission", "Module"};
            // All commands.
            String[] keys = dataStore.GetKeyList("permcom", "");
            // Array to store commands.
            List<String[]> values = new ArrayList<>();

            for (String key : keys) {
                String[] str = new String[3];
                str[0] = ("!" + key);
                str[1] = dataStore.get("groups", dataStore.get("permcom", key));
                str[2] = Script.callMethod("getCommandScript", key.contains(" ") ? key.substring(0, key.indexOf(" ")) : key);
                // If the module is disabled, return.
                if (str[2].contains("Undefined")) {
                    continue;
                }
                values.add(str);
            }

            // Export to CSV
            PhantomBot.instance().toCSV(headers, values, "command_list.csv");
            com.gmt2001.Console.out.println("[CONSOLE] Die Befehlsliste wurde unter command_list.csv erstellt.");
            return;
        }

        /**
         * @consolecommand retweettest [Twitter ID] - Sends a fake test Retweet event.
         */
        if (message.equalsIgnoreCase("retweettest")) {
            if (argument == null) {
                com.gmt2001.Console.out.println(">> retweettest erfordert eine Twitter-ID (oder Twitter-IDs).");
                return;
            }
            com.gmt2001.Console.out.println(">> Sende retweet Test Event");
            EventBus.instance().postAsync(new TwitterRetweetEvent(argument));
            return;
        }

        /**
         * @consolecommand botinfo - Prints the bot information in the console.
         */
        if (message.equalsIgnoreCase("botinfo")) {
            com.gmt2001.Console.out.println(PhantomBot.instance().getBotInformation());
            return;
        }

        /**
         * @consolecommand revloconvert [CSV file] - Command that imports points from RevloBot.
         */
        if (message.equalsIgnoreCase("revloconvert")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe revloconvert aus");
            if (argument == null) {
                com.gmt2001.Console.out.println("Du musst die Datei angeben, die du importieren möchtest.");
                return;
            }

            BotImporter.ImportRevlo(arguments);
            return;
        }

        /**
         * @consolecommand ankhconvert [CSV file] - Command that imports points from AnkhBot.
         */
        if (message.equalsIgnoreCase("ankhconvert")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe ankhconvert aus.");
            if (argument == null) {
                com.gmt2001.Console.out.println("Du musst die Datei angeben, die du importieren möchtest.");
                return;
            }

            BotImporter.ImportAnkh(arguments);
            return;
        }

        /**
         * @consolecommand backupdb - Creates a backup of the current database.
         */
        if (message.equalsIgnoreCase("backupdb")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe backupdb aus");
            SimpleDateFormat datefmt = new SimpleDateFormat("ddMMyyyy.hhmmss");
            datefmt.setTimeZone(TimeZone.getTimeZone(PhantomBot.getTimeZone()));
            String timestamp = datefmt.format(new Date());

            dataStore.backupDB("phantombot.manual.backup." + timestamp + ".db");
            return;
        }

        /**
         * @consolecommand fixfollowedtable - Grabs the last 10,000 followers from the Twitch API.
         */
        if (message.equalsIgnoreCase("fixfollowedtable")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe fixfollowedtable aus");
            TwitchAPIv5.instance().FixFollowedTable(PhantomBot.instance().getChannelName(), dataStore, false);
            return;
        }

        /**
         * @consolecommand fixfollowedtable-force - Grabs all followers from the Twitch API.
         */
        if (message.equalsIgnoreCase("fixfollowedtable-force")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe fixfollowedtable-force aus");
            TwitchAPIv5.instance().FixFollowedTable(PhantomBot.instance().getChannelName(), dataStore, true);
            return;
        }

        /**
         * @consolecommand jointest - Sends 30 fake join events or one specific user for testing.
         */
        if (message.equalsIgnoreCase("jointest")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe jointest aus");

            if (argument != null) {
                EventBus.instance().postAsync(new IrcChannelJoinEvent(PhantomBot.instance().getSession(), argument[0]));
            } else {
                for (int i = 0 ; i < 30; i++) {
                    EventBus.instance().postAsync(new IrcChannelJoinEvent(PhantomBot.instance().getSession(), PhantomBot.generateRandomString(8)));
                }
            }
        }

        if (message.equalsIgnoreCase("channelpointstest")) {
            EventBus.instance().postAsync(new PubSubChannelPointsEvent(
                    "id1", "rewardid2", "12345",
                    "thebestuser", "TheBestUser", "Uber Reward",
                    50, "Who you gonna call?", "Ghostbusters!", "UNFULLFILLED"
            ));
            return;
        }

        /**
         * @consolecommand followertest [username] - Sends a fake follower event.
         */
        if (message.equalsIgnoreCase("followertest")) {
            String user = (argument == null ? PhantomBot.generateRandomString(10) : argument[0]);

            com.gmt2001.Console.out.println("[CONSOLE] Führe followertest (User: " + user + ") aus");

            EventBus.instance().postAsync(new TwitchFollowEvent(user));
            return;
        }

        /**
         * @consolecommand followerstest [amount] - Sends a fake follower events.
         */
        if (message.equalsIgnoreCase("followerstest")) {
            String randomUser = PhantomBot.generateRandomString(10);
            int followCount = (argument == null ? 5 : Integer.parseInt(argument[0]));

            com.gmt2001.Console.out.println("[CONSOLE] Führe followerstest (Count: " + followCount + ", User: " + randomUser + ") aus");

            for (int i = 0; i < followCount; i++) {
                EventBus.instance().postAsync(new TwitchFollowEvent(randomUser + "_" + i));
            }
            return;
        }

        /**
         * @consolecommand subscribertest - Sends a fake subscriber events.
         */
        if (message.equalsIgnoreCase("subscribertest")) {
            String randomUser = PhantomBot.generateRandomString(10);

            com.gmt2001.Console.out.println("[CONSOLE] Führe subscribertest (User: " + randomUser + ") aus");

            EventBus.instance().postAsync(new TwitchSubscriberEvent(randomUser, "1000", ((int) (Math.random() * 100.0)) + "", "No message"));
            return;
        }

        /**
         * @consolecommand primesubscribertest - Sends a fake Prime subscriber events.
         */
        if (message.equalsIgnoreCase("primesubscribertest")) {
            String randomUser = PhantomBot.generateRandomString(10);

            com.gmt2001.Console.out.println("[CONSOLE] Executing primesubscribertest (User: " + randomUser + ")");

            EventBus.instance().postAsync(new TwitchPrimeSubscriberEvent(randomUser));
            return;
        }

        /**
         * @consolecommand resubscribertest - Sends a fake re-subscriber events.
         */
        if (message.equalsIgnoreCase("resubscribertest")) {
            String randomUser = PhantomBot.generateRandomString(10);

            com.gmt2001.Console.out.println("[CONSOLE] Führe resubscribertest (User: " + randomUser + ") aus");

            EventBus.instance().postAsync(new TwitchReSubscriberEvent(randomUser, "10", "1000", "No message"));
            return;
        }

        /**
         * @consolecommand giftsubtest - Sends a fake gift subscriber events.
         */
        if (message.equalsIgnoreCase("giftsubtest")) {
            String randomUser = PhantomBot.generateRandomString(10);

            com.gmt2001.Console.out.println("[CONSOLE] Führe giftsubtest (User: " + randomUser + ") aus");

            EventBus.instance().postAsync(new TwitchSubscriptionGiftEvent(PhantomBot.instance().getChannelName(), randomUser, "10", "1000"));
            return;
        }

        /**
         * @consolecommand massanongiftsubtest - Test a mass anonymous gift subscription.
         */
        if (message.equalsIgnoreCase("massanonsubgifttest")) {
            String userName = PhantomBot.generateRandomString(8);
            com.gmt2001.Console.out.println("Testing Mass Anonymous Gift Sub (Username = " + userName + ")");
            EventBus.instance().postAsync(new TwitchMassAnonymousSubscriptionGiftedEvent("10", "1000"));
            return;
        }

        /**
         * @consolecommand anonsubgifttest - Test an anonymous gift subscription
         */
        if (message.equalsIgnoreCase("anonsubgifttest")) {
            String userName = PhantomBot.generateRandomString(8);
            com.gmt2001.Console.out.println("Testing Anonymous Gift Sub (Username = " + userName + ")");
            EventBus.instance().postAsync(new TwitchAnonymousSubscriptionGiftEvent(userName, "1", "1000"));
            return;
        }

        /**
         * @consolecommand onlinetest - Sends a fake online event.
         */
        if (message.equalsIgnoreCase("onlinetest")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe onlinetest aus");

            EventBus.instance().postAsync(new TwitchOnlineEvent());
            return;
        }

        /**
         * @consolecommand offlinetest - Sends a fake offline event.
         */
        if (message.equalsIgnoreCase("offlinetest")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe offlinetest aus");

            EventBus.instance().postAsync(new TwitchOfflineEvent());
            return;
        }

        /**
         * @consolecommand cliptest - Sends a fake clip event.
         */
        if (message.equalsIgnoreCase("cliptest")) {
            String randomUser = (argument == null ? PhantomBot.generateRandomString(10) : argument[0]);

            com.gmt2001.Console.out.println("[CONSOLE] Führe cliptest " + randomUser + " aus");

            EventBus.instance().postAsync(new TwitchClipEvent("https://clips.twitch.tv/ThisIsNotARealClipAtAll", randomUser, "Some title",
                    new org.json.JSONObject("{\"medium\": \"https://clips-media-assets.twitch.tv/vod-107049351-offset-26-preview-480x272.jpg\", "
                            + "\"small\": \"https://clips-media-assets.twitch.tv/vod-107049351-offset-26-preview-260x147.jpg\", "
                            + "\"tiny\": \"https://clips-media-assets.twitch.tv/vod-107049351-offset-26-preview-86x45.jpg\"}")));
            return;
        }

        /**
         * @consolecommand hosttest - Sends a fake host event.
         */
        if (message.equalsIgnoreCase("hosttest")) {
            String randomUser = (argument == null ? PhantomBot.generateRandomString(10) : argument[0]);

            com.gmt2001.Console.out.println("[CONSOLE] Führe hosttest " + randomUser + " aus");

            EventBus.instance().postAsync(new TwitchHostedEvent(randomUser));
            return;
        }

        /**
         * @consolecommand bitstest - Sends a fake bits event.
         */
        if (message.equalsIgnoreCase("bitstest")) {
            String sendMessage = (argument == null ? "" : arguments);

            com.gmt2001.Console.out.println("[CONSOLE] Führe bitstest aus");

            EventBus.instance().postAsync(new TwitchBitsEvent(PhantomBot.instance().getBotName(), "100", sendMessage));
            return;
        }

        /**
         * @consolecommand discordreconnect - Reconnects to Discord.
         */
        if (message.equalsIgnoreCase("discordreconnect")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe discordreconnect aus");

            DiscordAPI.instance().reconnect();
            return;
        }

        /**
         * @consolecommand debugon - Enables debug mode.
         */
        if (message.equalsIgnoreCase("debugon")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe debugon aus: Debug-Modus aktiviert");

            PhantomBot.setDebugging(true);
            return;
        }

        /**
         * @consolecommand debugoff - Disables debug mode.
         */
        if (message.equalsIgnoreCase("debugoff")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe debugoff aus: Debug-Modus deaktiviert");

            PhantomBot.setDebuggingLogOnly(false);
            return;
        }

        /**
         * @consolecommand dumplogs - Writes the latest logs to a file.
         */
        if (message.equalsIgnoreCase("dumplogs")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe dumplogs aus");

            GenerateLogs.writeLogs();
            return;
        }

        /**
         * @consolecommand dumplogs - Prints the latest logs to the console.
         */
        if (message.equalsIgnoreCase("printlogs")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe printlogs aus");

            GenerateLogs.printLogs();
            return;
        }

        /**
         * @consolecommand debuglog - Prints all debug lines to a file.
         */
        if (message.equalsIgnoreCase("debuglog")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe debuglog aus: Debug-Modus aktiviert - nur Protokollierung");

            PhantomBot.setDebuggingLogOnly(true);
            return;
        }

        /**
         * @consolecommand save - Forces the database to save.
         */
        if (message.equalsIgnoreCase("save")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe save aus");

            dataStore.SaveAll(true);
            return;
        }

        /**
         * @consolecommand exit - Shuts down the bot.
         */
        if (message.equalsIgnoreCase("exit")) {
            com.gmt2001.Console.out.println("[CONSOLE] Führe exit aus");

            PhantomBot.exitOK();
            return;
        }

        /**
         * @consolecommand apioauth - Updates the API oauth.
         */
        if (message.equalsIgnoreCase("apioauth")) {
            System.out.print("Bitte gib deinen oAuth-Token ein, den du auf https://phantombot.github.io/PhantomBot/oauth/ generiert hast, während du als Caster angemeldet bist: ");

            String apiOAuth = System.console().readLine().trim();

            PhantomBot.instance().getProperties().setProperty("apioauth", apiOAuth);
            changed = true;
        }

        /**
         * @consolecommand mysqlsetup - Sets up MySQL.
         */
        if (message.equalsIgnoreCase("mysqlsetup")) {
            try {
                System.out.println("");
                System.out.println("PhantomBot MySQL-Setup.");
                System.out.println("");

                System.out.print("Bitte gebe den MySQL-Hostnamen ein: ");
                String mySqlHost = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("mysqlhost", mySqlHost);

                System.out.print("Bitte gebe den MySQL-Port ein: ");
                String mySqlPort = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("mysqlport", mySqlPort);

                System.out.print("Bitte gebe den MySQL-Datenbanknamen ein: ");
                String mySqlName = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("mysqlname", mySqlName);

                System.out.print("Bitte gebe den Username für MySQL ein: ");
                String mySqlUser = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("mysqluser", mySqlUser);

                System.out.print("Bitte gebe das Passwort für MySQL ein: ");
                String mySqlPass = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("mysqlpass", mySqlPass);

                String dataStoreType = "MySQLStore";
                PhantomBot.instance().getProperties().setProperty("datastore", dataStoreType);

                com.gmt2001.Console.out.println("PhantomBot MySQL-Setup abgeschlossen, PhantomBot wird beendet.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /**
         * @consolecommand streamlabssetup - Sets up StreamLabs.
         */
        if (message.equalsIgnoreCase("streamlabssetup")) {
            try {
                System.out.println("");
                System.out.println("PhantomBot StreamLabs-Setup.");
                System.out.println("");

                System.out.print("Bitte gebe deinen StreamLabs OAuth-Key ein: ");
                String twitchAlertsKey = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("twitchalertskey", twitchAlertsKey);

                System.out.println("PhantomBot StreamLabs-Setup abgeschlossen, PhantomBot wird beendet.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /**
         * @consolecommand tipeeestreamsetup - Sets up TipeeeStream.
         */
        if (message.equalsIgnoreCase("tipeeestreamsetup")) {
            try {
                System.out.println("");
                System.out.println("PhantomBot TipeeeStream-Setup.");
                System.out.println("");

                System.out.print("Bitte gebe deinen TipeeeStream API OAuth-Key ein: ");
                String tipeeeStreamOAuth = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("tipeeestreamkey", tipeeeStreamOAuth);

                System.out.println("PhantomBot TipeeeStream-Setup abgeschlossen, PhantomBot wird beendet.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /**
         * @consolecommand panelsetup - Sets up the panel.
         */
        if (message.equalsIgnoreCase("panelsetup")) {
            try {
                System.out.println("");
                System.out.println("PhantomBot Web-Panel-Setup.");
                System.out.println("Hinweis: Verwenden Sie keine ASCII-Zeichen in Ihrem Username oder Passwort.");
                System.out.println("");

                System.out.print("Bitte gebe einen Username deiner Wahl ein: ");
                String panelUsername = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("paneluser", panelUsername);

                System.out.print("Bitte gebe ein Passwort deiner Wahl ein: ");
                String panelPassword = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("panelpassword", panelPassword);

                System.out.println("PhantomBot Web-Panel-Setup abgeschlossen, PhantomBot wird beendet.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /**
         * @consolecommand twittersetup - Sets up Twitter.
         */
        if (message.equalsIgnoreCase("twittersetup")) {
            try {
                System.out.println("");
                System.out.println("PhantomBot Twitter-Setup.");
                System.out.println("");

                System.out.print("Bitte gebe deinen Twitter Username ein: ");
                String twitterUsername = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("twitterUser", twitterUsername);

                System.out.print("Bitte gebe deinen Consumer Key ein: ");
                String twitterConsumerToken = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("twitter_consumer_key", twitterConsumerToken);

                System.out.print("Bitte gebe dein Consumer Secret ein: ");
                String twitterConsumerSecret = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("twitter_consumer_secret", twitterConsumerSecret);

                System.out.print("Bitte gebe den Access token ein: ");
                String twitterAccessToken = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("twitter_access_token", twitterAccessToken);

                System.out.print("Bitte gebe den Access token secret ein: ");
                String twitterSecretToken = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("twitter_secret_token", twitterSecretToken);

                com.gmt2001.Console.out.println("PhantomBot MySQL-Setup abgeschlossen, PhantomBot wird beendet.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /**
         * @consolecommand ytsetup - Sets up YouTube API Key
         */
        if (message.equalsIgnoreCase("ytsetup")) {
            try {
                System.out.println("");
                System.out.println("PhantomBot YouTube API Key Setup");
                System.out.println("");
                System.out.println("Please enter the YouTube API key that you have acquired: ");
                String youtubeKey = System.console().readLine().trim();
                PhantomBot.instance().getProperties().setProperty("youtubekey", youtubeKey);
                System.out.println("PhantomBot YouTube API key setup done, PhantomBot will exit.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        // Check to see if any settings have been changed.
        if (changed) {
            Properties outputProperties = new Properties() {
                @Override
                public synchronized Enumeration<Object> keys() {
                    return Collections.enumeration(new TreeSet<>(super.keySet()));
                }
            };

            try {
                try (FileOutputStream outputStream = new FileOutputStream("./config/botlogin.txt")) {
                    outputProperties.putAll(PhantomBot.instance().getProperties());
                    outputProperties.store(outputStream, "PhantomBot Configuration File");
                }

                dataStore.SaveAll(true);

                com.gmt2001.Console.out.println("");
                com.gmt2001.Console.out.println("Änderungen wurden gespeichert, PhantomBot wird nun beendet.");
                com.gmt2001.Console.out.println("");
                PhantomBot.exitOK();
            } catch (IOException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
            return;
        }

        // Handle any other commands.
        PhantomBot.instance().handleCommand(PhantomBot.instance().getBotName(), event.getMessage());
    }
}
