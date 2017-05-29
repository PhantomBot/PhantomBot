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

package me.mast3rplan.phantombot;

import com.gmt2001.datastore.DataStore;
import com.gmt2001.datastore.IniStore;
import com.gmt2001.Logger;
import com.gmt2001.datastore.MySQLStore;
import com.gmt2001.datastore.SqliteStore;
import com.gmt2001.TwitchAPIv3;
import com.gmt2001.YouTubeAPIv3;
import com.google.common.eventbus.Subscribe;
import com.illusionaryone.DiscordAPI;
import com.illusionaryone.GameWispAPIv1;
import com.illusionaryone.GitHubAPIv3;
import com.illusionaryone.GoogleURLShortenerAPIv1;
import com.illusionaryone.NoticeTimer;
import com.illusionaryone.SingularityAPI;
import com.illusionaryone.StreamTipAPI;
import com.illusionaryone.TwitchAlertsAPIv1;
import com.illusionaryone.TwitterAPI;
import com.scaniatv.AnkhConverter;
import com.scaniatv.CustomAPI;
import com.scaniatv.TipeeeStreamAPIv1;
import com.scaniatv.RevloConverter;

import de.simeonf.EventWebSocketServer;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintStream;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

import java.security.SecureRandom;

import java.text.SimpleDateFormat;

import java.util.Collections;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map.Entry;
import java.util.Properties;
import java.util.TimeZone;
import java.util.TreeSet;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import me.mast3rplan.phantombot.cache.DonationsCache;
import me.mast3rplan.phantombot.cache.EmotesCache;
import me.mast3rplan.phantombot.cache.FollowersCache;
import me.mast3rplan.phantombot.cache.StreamTipCache;
import me.mast3rplan.phantombot.cache.TipeeeStreamCache;
import me.mast3rplan.phantombot.cache.TwitchCache;
import me.mast3rplan.phantombot.cache.TwitterCache;
import me.mast3rplan.phantombot.cache.UsernameCache;
import me.mast3rplan.phantombot.console.ConsoleInputListener;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.Listener;
import me.mast3rplan.phantombot.event.bits.BitsEvent;
import me.mast3rplan.phantombot.event.command.CommandEvent;
import me.mast3rplan.phantombot.event.console.ConsoleInputEvent;
import me.mast3rplan.phantombot.event.devcommand.DeveloperCommandEvent;
import me.mast3rplan.phantombot.event.gamewisp.GameWispAnniversaryEvent;
import me.mast3rplan.phantombot.event.gamewisp.GameWispSubscribeEvent;
import me.mast3rplan.phantombot.event.irc.channel.IrcChannelJoinEvent;
import me.mast3rplan.phantombot.event.irc.channel.IrcChannelUserModeEvent;
import me.mast3rplan.phantombot.event.irc.complete.IrcJoinCompleteEvent;
import me.mast3rplan.phantombot.event.irc.message.IrcChannelMessageEvent;
import me.mast3rplan.phantombot.event.irc.message.IrcPrivateMessageEvent;
import me.mast3rplan.phantombot.event.subscribers.NewPrimeSubscriberEvent;
import me.mast3rplan.phantombot.event.subscribers.NewReSubscriberEvent;
import me.mast3rplan.phantombot.event.subscribers.NewSubscriberEvent;
import me.mast3rplan.phantombot.event.twitch.follower.TwitchFollowEvent;
import me.mast3rplan.phantombot.event.twitch.host.TwitchHostedEvent;
import me.mast3rplan.phantombot.event.twitch.offline.TwitchOfflineEvent;
import me.mast3rplan.phantombot.event.twitch.online.TwitchOnlineEvent;
import me.mast3rplan.phantombot.httpserver.HTTPServer;
import me.mast3rplan.phantombot.httpserver.NEWHTTPSServer;
import me.mast3rplan.phantombot.httpserver.NEWHTTPServer;
import me.mast3rplan.phantombot.panel.PanelSocketSecureServer;
import me.mast3rplan.phantombot.panel.PanelSocketServer;
import me.mast3rplan.phantombot.script.Script;
import me.mast3rplan.phantombot.script.ScriptApi;
import me.mast3rplan.phantombot.script.ScriptEventManager;
import me.mast3rplan.phantombot.script.ScriptManager;
import me.mast3rplan.phantombot.twitchwsirc.Channel;
import me.mast3rplan.phantombot.twitchwsirc.Session;
import me.mast3rplan.phantombot.twitchwsirc.TwitchPubSub;
import me.mast3rplan.phantombot.twitchwsirc.TwitchWSHostIRC;
import me.mast3rplan.phantombot.ytplayer.YTWebSocketServer;
import me.mast3rplan.phantombot.ytplayer.YTWebSocketSecureServer;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.filefilter.WildcardFileFilter;
import org.apache.commons.lang3.SystemUtils;

public final class PhantomBot implements Listener {
    /* Bot Information */
    private String botName;
    private String channelName;
    private String ownerName;
    private String oauth;
    private String apiOAuth;
    private String clientId;
    private static Double messageLimit;
    private static Double whisperLimit;

    /* Web Information */
    private String panelUsername;
    private String panelPassword;
    private String webOAuth;
    private String webOAuthThro;
    private String youtubeOAuth;
    private String youtubeOAuthThro;
    private String youtubeKey;
    private Boolean webEnabled;
    private Boolean musicEnabled;
    private Boolean useHttps;
    private int basePort;

    /* SSL information */
    private String httpsPassword = "password";
    private String httpsFileName = "cert.jks";

    /* DataStore Information */
    private DataStore dataStore;
    private String dataStoreType;
    private String dataStoreConfig;

    /* MySQL Information */
    private String mySqlConn;
    private String mySqlHost;
    private String mySqlPort;
    private String mySqlName;
    private String mySqlUser;
    private String mySqlPass;

    /* Twitter Information */
    private String twitterUsername;
    private String twitterAccessToken;
    private String twitterSecretToken;
    private String twitterConsumerSecret;
    private String twitterConsumerToken;
    private Boolean twitterAuthenticated;

    /* TwitchAlerts Information */
    private String twitchAlertsKey = "";
    private int twitchAlertsLimit = 0;

    /* StreamTip Information */
    private String streamTipOAuth = "";
    private String streamTipClientId = "";
    private int streamTipLimit = 0;

    /* TipeeeStream Information */
    private String tipeeeStreamOAuth = "";
    private int tipeeeStreamLimit = 5;

    /* GameWisp Information */
    private String gameWispOAuth;
    private String gameWispRefresh;

    /* Notice Timer and Handling */
    private NoticeTimer noticeTimer;

    /* Discord Configuration */
    private String discordToken = "";

    /* Caches */
    private FollowersCache followersCache;
    private DonationsCache twitchAlertsCache;
    private StreamTipCache streamTipCache;
    private EmotesCache emotesCache;
    private TwitterCache twitterCache;
    private TwitchCache twitchCache;
    private UsernameCache usernameCache;
    private TipeeeStreamCache tipeeeStreamCache;
    public static String twitchCacheReady = "false";

    /* Socket Servers */
    private YTWebSocketServer youtubeSocketServer;
    private YTWebSocketSecureServer youtubeSocketSecureServer;
    private EventWebSocketServer eventWebSocketServer;
    private PanelSocketServer panelSocketServer;
    private PanelSocketSecureServer panelSocketSecureServer;
    private HTTPServer httpServer;
    private NEWHTTPServer newHttpServer;
    private NEWHTTPSServer newHttpsServer;

    /* PhantomBot Information */
    private static PhantomBot instance;
    public static Boolean reloadScripts = false;
    public static Boolean enableDebugging = false;
    public static Boolean enableDebuggingLogOnly = false;
    public static Boolean enableRhinoDebugger = false;
    public static String timeZone = "GMT";
    public static Boolean useMessageQueue = true;
    public Boolean isExiting = false;
    private Boolean interactive;
    private Boolean resetLogin = false;
    
    /* Other Information */
    private static HashMap<String, Channel> channels;
    private static HashMap<String, Session> sessions;
    private static HashMap<String, String> apiOAuths;
    private static Boolean newSetup = false;
    private Channel channel;
    private Session session;
    private String chanName;
    private Boolean timer = false;
    private SecureRandom random;
    private Boolean devCommands = true;
    private Boolean joined = false;
    private TwitchWSHostIRC wsHostIRC;
    private TwitchPubSub pubSubEdge;
    private Properties pbProperties;
    private Boolean legacyServers = false;
    private Boolean backupSQLiteAuto = false;
    private int backupSQLiteHourFrequency = 0;
    private int backupSQLiteKeepDays = 0;

    /*
     * PhantomBot Instance.
     *
     * @return  PhantomBot  The current instance of PhantomBot
     */
    public static PhantomBot instance() {
        return instance;
    }

    /*
     * Current Repo Of PhantomBot.
     *
     * @return  String  The current GitHub repository version of PhantomBot.
     */
    public String repoVersion() {
        return RepoVersion.getRepoVersion();
    }

    /*
     * Current Version Of PhantomBot.
     *
     * @return  String  Display version of PhantomBot.
     */
    public String botVersion() {
        if (isNightly()) {
            return "PhantomBot Version: " + RepoVersion.getPhantomBotVersion() + " - Nightly Build";
        }
        return "PhantomBot Version: " + RepoVersion.getPhantomBotVersion();
    }

    /*
     * Used by the panel on the informations tab.
     *
     * @return  String  PhantomBot information for the Panel.
     */
    public String getBotInfo() {
        return botVersion() + " (Revision: " + repoVersion() + ")";
    }

    /*
     * Current Build Revision
     *
     * @return  String  The build revision of PhantomBot.
     */
    public String botRevision() {
        return "Build Revision: " + repoVersion();
    }

    /*
     * Only used on bot boot up for now.
     *
     * @return {string} bot creator
     */
    public String getBotCreator() {
        return "Creator: mast3rplan";
    }

    /*
     * Only used on bot boot up for now.
     *
     * @return {string} bot developers
     */
    public String botDevelopers() {
        return "Developers: PhantomIndex, Kojitsari, ScaniaTV, Zelakto & IllusionaryOne";
    }

    /*
     * Only used on bot boot up for now.
     *
     * @return {string} bot website
     */
    public String getWebSite() {
        return "https://phantombot.tv/";
    }

    /*
     * Prints a message in the bot console.
     *
     * @param {Object} message
     */
    private void print(String message) {
        com.gmt2001.Console.out.println(message);
    }

    /*
     * Constructor for PhantomBot object.
     *
     * @param  Properties  Properties object which configures the PhantomBot instance.
     */
    public PhantomBot(Properties pbProperties) {

        /* Set the exeption handler */
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        /* Start loading the bot information */
        print("");
        print(botVersion());
        print(botRevision());
        print(getBotCreator());
        print(botDevelopers());
        print(getWebSite());
        print("");

        /* System interactive */
        interactive = (System.getProperty("interactive") != null);

        /* Assign properties passed in to local instance. */
        this.pbProperties = pbProperties;

        /* Set the default bot variables */
        this.botName = this.pbProperties.getProperty("user").toLowerCase();
        this.channelName = this.pbProperties.getProperty("channel").toLowerCase();
        this.ownerName = this.pbProperties.getProperty("owner").toLowerCase();
        this.apiOAuth = this.pbProperties.getProperty("apioauth", "");
        this.oauth = this.pbProperties.getProperty("oauth");
        
        /* Set the web variables */
        this.youtubeOAuth = this.pbProperties.getProperty("ytauth");
        this.youtubeOAuthThro = this.pbProperties.getProperty("ytauthro");
        this.youtubeKey = this.pbProperties.getProperty("youtubekey", "");
        this.basePort = Integer.parseInt(this.pbProperties.getProperty("baseport", "25000"));
        this.webOAuth = this.pbProperties.getProperty("webauth");
        this.webOAuthThro = this.pbProperties.getProperty("webauthro");
        this.webEnabled = this.pbProperties.getProperty("webenable", "true").equalsIgnoreCase("true");
        this.musicEnabled = this.pbProperties.getProperty("musicenable", "true").equalsIgnoreCase("true");
        this.useHttps = this.pbProperties.getProperty("usehttps", "false").equalsIgnoreCase("true");

        /* Set the datastore variables */
        this.dataStoreType = this.pbProperties.getProperty("datastore", "");
        this.dataStoreConfig = this.pbProperties.getProperty("datastoreconfig", "");

        /* Set the Twitter variables */
        this.twitterUsername = this.pbProperties.getProperty("twitterUser", "");
        this.twitterConsumerToken = this.pbProperties.getProperty("twitter_consumer_key", "");
        this.twitterConsumerSecret = this.pbProperties.getProperty("twitter_consumer_secret", "");
        this.twitterAccessToken = this.pbProperties.getProperty("twitter_access_token", "");
        this.twitterSecretToken = this.pbProperties.getProperty("twitter_secret_token", "");
        this.twitterAuthenticated = false;

        /* Set the Discord variables */
        this.discordToken = this.pbProperties.getProperty("discord_token", "");

        /* Set the GameWisp variables */
        this.gameWispOAuth = this.pbProperties.getProperty("gamewispauth", "");
        this.gameWispRefresh = this.pbProperties.getProperty("gamewisprefresh", "");

        /* Set the TwitchAlerts variables */
        this.twitchAlertsKey = this.pbProperties.getProperty("twitchalertskey", "");
        this.twitchAlertsLimit = Integer.parseInt(this.pbProperties.getProperty("twitchalertslimit", "5"));

        /* Set the StreamTip variables */
        this.streamTipOAuth = this.pbProperties.getProperty("streamtipkey", "");
        this.streamTipClientId = this.pbProperties.getProperty("streamtipid", "");
        this.streamTipLimit = Integer.parseInt(this.pbProperties.getProperty("streamtiplimit", "5"));

        /* Set the TipeeeStream variables */
        this.tipeeeStreamOAuth = this.pbProperties.getProperty("tipeeestreamkey", "");
        this.tipeeeStreamLimit = Integer.parseInt(this.pbProperties.getProperty("tipeeestreamlimit", "5"));

        /* Set the MySql variables */
        this.mySqlName = this.pbProperties.getProperty("mysqlname", "");
        this.mySqlUser = this.pbProperties.getProperty("mysqluser", "");
        this.mySqlPass = this.pbProperties.getProperty("mysqlpass", "");
        this.mySqlHost = this.pbProperties.getProperty("mysqlhost", "");
        this.mySqlPort = this.pbProperties.getProperty("mysqlport", "");

        /* twitch cache */
        PhantomBot.twitchCacheReady = "false";

        /* Set the SSL info */
        this.httpsFileName = this.pbProperties.getProperty("httpsFileName", "");
        this.httpsPassword = this.pbProperties.getProperty("httpsPassword", "");

        /* Verify SSL file if useHttps is enabled. */
        if (this.useHttps) {
            if (this.httpsFileName.equals("")) {
                com.gmt2001.Console.err.println("HTTPS is enabled but the Java Keystore (httpsFileName) is not defined.");
                com.gmt2001.Console.err.println("Terminating PhantomBot");
                System.exit(1);
            }
 
            if (!new File (httpsFileName).exists()) {
                com.gmt2001.Console.err.println("HTTPS is enabled but the Java Keystore (httpsFileName) is not present: " + httpsFileName);
                com.gmt2001.Console.err.println("Terminating PhantomBot");
                System.exit(1);
            }
        }

        /* Set the timeZone */
        PhantomBot.timeZone = this.pbProperties.getProperty("logtimezone", "GMT");

        /* Set the panel username login for the panel to use */
        this.panelUsername = this.pbProperties.getProperty("paneluser", "panel");

        /* Set the panel password login for the panel to use */
        this.panelPassword = this.pbProperties.getProperty("panelpassword", "panel");

        /* Enable/disable devCommands */
        this.devCommands = this.pbProperties.getProperty("devcommands", "false").equalsIgnoreCase("true");

        /* Toggle for the old servers. */
        this.legacyServers = this.pbProperties.getProperty("legacyservers", "false").equalsIgnoreCase("true");

        /*
         * Set the message limit for session.java to use, note that Twitch rate limits at 100 messages in 30 seconds
         * for moderators.  For non-moderators, the maximum is 20 messages in 30 seconds. While it is not recommended
         * to go above anything higher than 19 in case the bot is ever de-modded, the option is available but is
         * capped at 80.0. 
         */
        PhantomBot.messageLimit = Double.parseDouble(this.pbProperties.getProperty("msglimit30", "19.0"));
        if (PhantomBot.messageLimit > 80.0) {
            PhantomBot.messageLimit = 80.0;
        } else if (PhantomBot.messageLimit < 19.0) {
            PhantomBot.messageLimit = 19.0;
        }

        // If this is false the bot won't limit the bot to 1 message every 1.5 second. It will still limit to 19/30 though.
        PhantomBot.useMessageQueue = this.pbProperties.getProperty("usemessagequeue", "true").equals("true");

        /* Set the whisper limit for session.java to use. -- Currently Not Used -- */
        PhantomBot.whisperLimit = Double.parseDouble(this.pbProperties.getProperty("whisperlimit60", "60.0"));

        /* Set the client id for the twitch api to use */
        this.clientId = this.pbProperties.getProperty("clientid", "7wpchwtqz7pvivc3qbdn1kajz42tdmb");

        /* Set any SQLite backup options. */
        this.backupSQLiteAuto = this.pbProperties.getProperty("backupsqliteauto", "false").equalsIgnoreCase("true");
        this.backupSQLiteHourFrequency = Integer.parseInt(this.pbProperties.getProperty("backupsqlitehourfreqency", "24"));
        this.backupSQLiteKeepDays = Integer.parseInt(this.pbProperties.getProperty("backupsqlitekeepdays", "5"));

        /* Load up a new SecureRandom for the scripts to use */
        random = new SecureRandom();

        /* Create a map for multiple channels. */
        channels = new HashMap<>();

        /* Create a map for multiple sessions. */
        sessions = new HashMap<>();

        /* Create a map for multiple oauth tokens. */
        apiOAuths = new HashMap<>();

        /* Load the datastore */
        if (dataStoreType.equalsIgnoreCase("inistore")) {
            dataStore = IniStore.instance();
        } else if (dataStoreType.equalsIgnoreCase("mysqlstore")) {
            dataStore = MySQLStore.instance();
            if (this.mySqlPort.isEmpty()) {
                this.mySqlConn = "jdbc:mysql://" + this.mySqlHost + "/" + this.mySqlName + "?useSSL=false";
            } else {
                this.mySqlConn = "jdbc:mysql://" + this.mySqlHost + ":" + this.mySqlPort + "/" + this.mySqlName + "?useSSL=false";
            }
            /* Check to see if we can create a connection */
            if (dataStore.CreateConnection(this.mySqlConn, this.mySqlUser, this.mySqlPass) == null) {
                print("Could not create a connection with MySql. PhantomBot now shutting down...");
                System.exit(0);
            }
            /* Convert to MySql */
            if (IniStore.instance().GetFileList().length > 0) {
                ini2MySql(true);
            } else if (SqliteStore.instance().GetFileList().length > 0) {
                sqlite2MySql();
            }
        } else {
            dataStoreType = "sqlite3store";
            dataStore = SqliteStore.instance();

            /* Convert the inistore to sqlite if the inistore exists and the db is empty */
            if (IniStore.instance().GetFileList().length > 0 && SqliteStore.instance().GetFileList().length == 0) {
                ini2Sqlite(true);
            }

            /* Handle index operations. */
            com.gmt2001.Console.debug.println("Checking database indexes, please wait...");
            if (SqliteStore.instance().getUseIndexes()) {
                dataStore.CreateIndexes();
            } else {
                dataStore.DropIndexes();
            }
        }

        /* Set the client Id in the Twitch api. */
        TwitchAPIv3.instance().SetClientID(this.clientId);

        /* Set the oauth key in the Twitch api. */
        if (!this.apiOAuth.isEmpty()) {
            TwitchAPIv3.instance().SetOAuth(this.apiOAuth);
        }

        /* Set the TwitchAlerts OAuth key and limiter. */
        if (!twitchAlertsKey.isEmpty()) {
            TwitchAlertsAPIv1.instance().SetAccessToken(twitchAlertsKey);
            TwitchAlertsAPIv1.instance().SetDonationPullLimit(twitchAlertsLimit);
        }

        /* Set the YouTube API Key if provided. */
        if (!this.youtubeKey.isEmpty()) {
            YouTubeAPIv3.instance().SetAPIKey(this.youtubeKey);
        }

        /* Set the StreamTip OAuth key, Client ID and limiter. */
        if (!streamTipOAuth.isEmpty() && !streamTipClientId.isEmpty()) {
            StreamTipAPI.instance().SetAccessToken(streamTipOAuth);
            StreamTipAPI.instance().SetDonationPullLimit(streamTipLimit);
            StreamTipAPI.instance().SetClientId(streamTipClientId);
        }

        /* Set the TipeeeStream oauth key. */
        if (!tipeeeStreamOAuth.isEmpty()) {
            TipeeeStreamAPIv1.instance().SetOauth(tipeeeStreamOAuth);
            TipeeeStreamAPIv1.instance().SetLimit(tipeeeStreamLimit);
        }

        /* Start things and start loading the scripts. */
        this.init();

        /* Start a channel instance to create a session, and then connect to WS-IRC @ Twitch. */
        this.channel = Channel.instance(this.channelName, this.botName, this.oauth, EventBus.instance());

        /* Start a host checking instance. */
        if (apiOAuth.length() > 0 && checkModuleEnabled("./handlers/hostHandler.js")) {
            this.wsHostIRC = TwitchWSHostIRC.instance(this.channelName, this.apiOAuth, EventBus.instance());
        }

        /* Check if the OS is Linux. */
        if (SystemUtils.IS_OS_LINUX && !interactive) {
            try {
                java.lang.management.RuntimeMXBean runtime = java.lang.management.ManagementFactory.getRuntimeMXBean();
                int pid = Integer.parseInt(runtime.getName().split("@")[0]);

                File file = new File("PhantomBot." + this.botName.toLowerCase() + ".pid");

                try (FileOutputStream fs = new FileOutputStream(file, false)) {
                    PrintStream ps = new PrintStream(fs);
                    ps.print(pid);
                }
                file.deleteOnExit();
            } catch (SecurityException | IllegalArgumentException | IOException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    /*
     * Tells you if the build is a nightly.
     *
     * @return {boolean}
     */
    public Boolean isNightly() {
        return RepoVersion.getNightlyBuild().equals("nightly_build");
    }

    /*
     * Enables or disables the debug mode.
     *
     * @param {boolean} debug
     */
    public static void setDebugging(Boolean debug) {
        PhantomBot.enableDebugging = debug;
    }

    /*
     * Enables or disables log only debug mode.
     *
     * @param {boolean} debug
     */
    public static void setDebuggingLogOnly(Boolean debug) {
        PhantomBot.enableDebugging = debug;
        PhantomBot.enableDebuggingLogOnly = debug;
    } 

    /*
     * Tells you the bot name.
     *
     * @return {string} bot name
     */
    public String getBotName() {
        return this.botName;
    }

    /*
     * Gives you the current data store
     *
     * @return {datastore} dataStore
     */
    public DataStore getDataStore() {
        return this.dataStore;
    }

    /*
     * Tells you if the bot is exiting
     *
     * @return {boolean} exit
     */
    public Boolean isExiting() {
        return this.isExiting;
    }

    /*
     * Give's you the channel for that channelName.
     *
     * @return {channel}
     */
    public Channel getChannel() {
        return channels.get(this.channelName);
    }

    /*
     * Tells you if the discord token has been set.
     *
     * @return {boolean}
     */
    public Boolean hasDiscordToken() {
        return this.discordToken.isEmpty();
    }

    /*
     * Give's you the channel for that channelName.
     *
     * @param {string} channelName
     * @return {channel}
     */
    public static Channel getChannel(String channelName) {
        return channels.get(channelName);
    }

    /*
     * Give's you the session for that channel.
     *
     * @return {session}
     */
    public Session getSession() {
        return sessions.get(this.channelName);
    }

    /*
     * Give's you the session for that channel.
     *
     * @param {string} channelName
     * @return {session}
     */
    public static Session getSession(String channelName) {
        return sessions.get(channelName);
    }

    /*
     * Give's you the api oauth for that channel.
     *
     * @param {string} channelName
     * @return {string}
     */
    public static String getOAuth(String channelName) {
        return apiOAuths.get(channelName);
    }

    /*
     * Give's you the message limit.
     *
     * @return {long} message limit
     */
    public static long getMessageInterval() {
        return (long) ((30.0 / messageLimit) * 1000);
    }

    /*
     * Give's you the whisper limit. *Currently not used*
     *
     * @return {long} whisper limit
     */
    public static long getWhisperInterval() {
        return (long) ((60.0 / whisperLimit) * 1000);
    }

    /*
     * Adds a channel to the channels array for multiple channels.
     *
     * @param {string} channelName
     * @param {channel} channel
     */
    public static void addChannel(String channelName, Channel channel) {
        if (!channels.containsKey(channelName)) {
            channels.put(channelName, channel);
        }
    }

    /*
     * Adds a session to the sessions array for multiple channels.
     *
     * @param {string} channelName
     * @param {session} session
     */
    public static void addSession(String channelName, Session session) {
        if (!sessions.containsKey(channelName)) {
            sessions.put(channelName, session);
        }
    }

    /*
     * Adds a oauth to the apioauths array for multiple channels.
     *
     * @param {string} channelName
     * @param {string} oAuth
     */
    public static void addOAuth(String channelName, String oAuth) {
        if (!apiOAuths.containsKey(channelName)) {
            apiOAuths.put(channelName, oAuth);
        }
    }

    /*
     * Returns if Twitch WS-IRC Host Detection is connected.
     */
    public boolean wsHostIRCConnected() {
        return (this.wsHostIRC != null && this.wsHostIRC.isConnected());
    }

    /*
     * Helper method to see if a module is enabled.
     *
     * @param  String  Module name to check for
     * @return boolean If the module is enabled or not
     */
    public boolean checkModuleEnabled(String module) {
        try {
            return dataStore.GetString("modules", "", module).equals("true");
        } catch (NullPointerException ex) {
            return false;
        }
    }

    /*
     * Checks if a value is true in the datastore.
     *
     * @param String  Db table to check.
     * @param String  Db key to check in that table.
     */
    public boolean checkDataStore(String table, String key) {
        try {
            return (dataStore.HasKey(table, "", key) && dataStore.GetString(table, "", key).equals("true"));
        } catch (NullPointerException ex) {
            return false;
        }
    }

    /*
     * Loads everything up.
     */
    private void init() {
        /* Is the web toggle enabled? */
        if (webEnabled) {
            if (legacyServers) {
                /* open a normal non ssl server */
                httpServer = new HTTPServer(basePort, oauth);
                /* Start this http server  */
                httpServer.start();
            }

            /* Is the music toggled on? */
            if (musicEnabled) {
                if (useHttps) {
                    /* Set the music player server */
                    youtubeSocketSecureServer = new YTWebSocketSecureServer((basePort + 3), youtubeOAuth, youtubeOAuthThro, httpsFileName, httpsPassword);
                    /* Start this youtube socket server */
                    youtubeSocketSecureServer.start();
                    print("YouTubeSocketSecureServer accepting connections on port: " + (basePort + 3) + " (SSL)");
                } else {
                    /* Set the music player server */
                    youtubeSocketServer = new YTWebSocketServer((basePort + 3), youtubeOAuth, youtubeOAuthThro);
                    /* Start this youtube socket server */
                    youtubeSocketServer.start();
                    print("YouTubeSocketServer accepting connections on port: " + (basePort + 3));
                }
            }

            /* Checks if the user wants the legacy servers, this is off by default. */
            if (legacyServers) {
                /* Create a event server to get all the events. */
                eventWebSocketServer = new EventWebSocketServer((basePort + 2));
                /* Start this event server */
                 eventWebSocketServer.start();
                print("EventSocketServer accepting connections on port: " + (basePort + 2));
                /* make the event bus register this event server */
                EventBus.instance().register(eventWebSocketServer);
            }

            if (useHttps) {
                /* Set up the panel socket server */
                panelSocketSecureServer = new PanelSocketSecureServer((basePort + 4), webOAuth, webOAuthThro, httpsFileName, httpsPassword);
                /* Start the panel socket server */
                panelSocketSecureServer.start();
                print("PanelSocketSecureServer accepting connections on port: " + (basePort + 4) + " (SSL)");

                /* Set up a new https server */
                newHttpsServer = new NEWHTTPSServer((basePort + 5), oauth, webOAuth, panelUsername, panelPassword, httpsFileName, httpsPassword);
                print("New HTTPS server accepting connection on port: " + (basePort + 5) + " (SSL)");
            } else {
                /* Set up the panel socket server */
                panelSocketServer = new PanelSocketServer((basePort + 4), webOAuth, webOAuthThro);
                /* Start the panel socket server */
                panelSocketServer.start();
                print("PanelSocketServer accepting connections on port: " + (basePort + 4));

                /* Set up a new http server */
                newHttpServer = new NEWHTTPServer((basePort + 5), oauth, webOAuth, panelUsername, panelPassword);
                print("New HTTP server accepting connection on port: " + (basePort + 5));
            }
        }

        /* Enable GameWisp if the oAuth is set */
        if (!gameWispOAuth.isEmpty() && checkModuleEnabled("./handlers/gameWispHandler.js")) {
            /* Set the oAuths */
            GameWispAPIv1.instance().SetAccessToken(gameWispOAuth);
            GameWispAPIv1.instance().SetRefreshToken(gameWispRefresh);
            SingularityAPI.instance().setAccessToken(gameWispOAuth);
            SingularityAPI.instance().StartService();
            /* get a fresh token */
            doRefreshGameWispToken();
        }

        /* Connect to Discord if the data is present. */
        if (!discordToken.isEmpty()) {
            DiscordAPI.instance().connect(discordToken);
        }

        /* Set Streamlabs currency code, if possible */
        if (dataStore.HasKey("donations", "", "currencycode")) {
            TwitchAlertsAPIv1.instance().SetCurrencyCode(dataStore.GetString("donations", "", "currencycode"));
        }

        /* Check to see if all the Twitter info needed is there */
        if (!twitterUsername.isEmpty() && !twitterAccessToken.isEmpty() && !twitterConsumerToken.isEmpty() && !twitterConsumerSecret.isEmpty() && !twitterSecretToken.isEmpty()) {
            /* Set the Twitter tokens */
            TwitterAPI.instance().setUsername(twitterUsername);
            TwitterAPI.instance().setAccessToken(twitterAccessToken);
            TwitterAPI.instance().setSecretToken(twitterSecretToken);
            TwitterAPI.instance().setConsumerKey(twitterConsumerToken);
            TwitterAPI.instance().setConsumerSecret(twitterConsumerSecret);
            /* Check to see if the tokens worked */
            this.twitterAuthenticated = TwitterAPI.instance().authenticate();
        }

        /* print a extra line in the console. */
        print("");

        /* Create configuration for YTPlayer v2.0 for the WS port. */
        String data = "";
        String http = (useHttps ? "https://" : "http://");

        try {
            data += "//Configuration for YTPlayer\r\n";
            data += "//Automatically Generated by PhantomBot at Startup\r\n";
            data += "//Do NOT Modify! Overwritten when PhantomBot is restarted!\r\n";
            data += "var playerPort = " + (basePort + 3) + ";\r\n";
            data += "var channelName = \"" + channelName + "\";\r\n";
            data += "var auth=\"" + youtubeOAuth + "\";\r\n";
            data += "var http=\"" + http + "\";\r\n";
            data += "function getPlayerPort() { return playerPort; }\r\n";
            data += "function getChannelName() { return channelName; }\r\n";
            data += "function getAuth() { return auth; }\r\n";
            data += "function getProtocol() { return http; }\r\n";

            /* Create a new file if it does not exist */
            if (!new File ("./web/ytplayer/").exists()) new File ("./web/ytplayer/").mkdirs();
            if (!new File ("./web/ytplayer/js").exists()) new File ("./web/ytplayer/js").mkdirs();

            /* Write the data to that file */
            Files.write(Paths.get("./web/ytplayer/js/playerConfig.js"), data.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        /* Create configuration for YTPlayer v2.0 for the WS port. */
        data = "";
        try {
            data += "//Configuration for YTPlayer\r\n";
            data += "//Automatically Generated by PhantomBot at Startup\r\n";
            data += "//Do NOT Modify! Overwritten when PhantomBot is restarted!\r\n";
            data += "var playerPort = " + (basePort + 3) + ";\r\n";
            data += "var channelName = \"" + channelName + "\";\r\n";
            data += "var auth=\"" + youtubeOAuthThro + "\";\r\n";
            data += "var http=\"" + http + "\";\r\n";
            data += "function getPlayerPort() { return playerPort; }\r\n";
            data += "function getChannelName() { return channelName; }\r\n";
            data += "function getAuth() { return auth; }\r\n";
            data += "function getProtocol() { return http; }\r\n";

            /* Create a new file if it does not exist */
            if (!new File ("./web/playlist/").exists()) new File ("./web/playlist/").mkdirs();
            if (!new File ("./web/playlist/js").exists()) new File ("./web/playlist/js").mkdirs();

            /* Write the data to that file */
            Files.write(Paths.get("./web/playlist/js/playerConfig.js"), data.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        /* Create configuration for WebPanel for the WS port. */
        data = "";
        try {
            data += "//Configuration for Control Panel\r\n";
            data += "//Automatically Generated by PhantomBot at Startup\r\n";
            data += "//Do NOT Modify! Overwritten when PhantomBot is restarted!\r\n";
            data += "var panelSettings = {\r\n";
            data += "    panelPort   : " + (basePort + 4) + ",\r\n";
            data += "    channelName : \"" + channelName + "\",\r\n";
            data += "    auth        : \"" + webOAuth + "\",\r\n";
            data += "    http        : \"" + http + "\"\r\n";
            data += "};\r\n\r\n";
            data += "function getPanelPort() { return panelSettings.panelPort; }\r\n";
            data += "function getChannelName() { return panelSettings.channelName; }\r\n";
            data += "function getAuth() { return panelSettings.auth; }\r\n";
            data += "function getProtocol() { return panelSettings.http; }\r\n";

            /* Create a new file if it does not exist */
            if (!new File ("./web/panel/").exists()) new File ("./web/panel/").mkdirs();
            if (!new File ("./web/panel/js").exists()) new File ("./web/panel/js").mkdirs();

            /* Write the data to that file */
            Files.write(Paths.get("./web/panel/js/panelConfig.js"), data.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        /* Create configuration for Read-Only Access to WS port. */
        data = "";
        try {
            data += "//Configuration for Control Panel\r\n";
            data += "//Automatically Generated by PhantomBot at Startup\r\n";
            data += "//Do NOT Modify! Overwritten when PhantomBot is restarted!\r\n";
            data += "var panelSettings = {\r\n";
            data += "    panelPort   : " + (basePort + 4) + ",\r\n";
            data += "    channelName : \"" + channelName + "\",\r\n";
            data += "    auth        : \"" + webOAuthThro + "\",\r\n";
            data += "    http        : \"" + http + "\"\r\n";
            data += "};\r\n\r\n";
            data += "function getPanelPort() { return panelSettings.panelPort; }\r\n";
            data += "function getChannelName() { return panelSettings.channelName; }\r\n";
            data += "function getAuth() { return panelSettings.auth; }\r\n";
            data += "function getProtocol() { return panelSettings.http; }\r\n";

            /* Create a new file if it does not exist */
            if (!new File ("./web/common/").exists()) new File ("./web/common/").mkdirs();
            if (!new File ("./web/common/js").exists()) new File ("./web/common/js").mkdirs();

            /* Write the data to that file */
            Files.write(Paths.get("./web/common/js/wsConfig.js"), data.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        /* check if the console is interactive */
        if (interactive) {
            ConsoleInputListener consoleIL = new ConsoleInputListener();
            /* Start the Console Input Listener */
            consoleIL.start();
        }

        /* Register PhantomBot (this) with the event bus. */
        EventBus.instance().register(this);
        /* Register the script manager with the event bus. */
        EventBus.instance().register(ScriptEventManager.instance());

        /* Load the datastore config */
        dataStore.LoadConfig(dataStoreConfig);

        /* Export all these to the $. api in the scripts. */
        Script.global.defineProperty("inidb", dataStore, 0);
        Script.global.defineProperty("username", UsernameCache.instance(), 0);
        Script.global.defineProperty("twitch", TwitchAPIv3.instance(), 0);
        Script.global.defineProperty("botName", botName, 0);
        Script.global.defineProperty("channelName", channelName, 0);
        Script.global.defineProperty("ownerName", ownerName, 0);
        Script.global.defineProperty("ytplayer", (useHttps ? youtubeSocketSecureServer : youtubeSocketServer), 0);
        Script.global.defineProperty("panelsocketserver", (useHttps ? panelSocketSecureServer : panelSocketServer), 0);
        Script.global.defineProperty("random", random, 0);
        Script.global.defineProperty("youtube", YouTubeAPIv3.instance(), 0);
        Script.global.defineProperty("shortenURL", GoogleURLShortenerAPIv1.instance(), 0);
        Script.global.defineProperty("gamewisp", GameWispAPIv1.instance(), 0);
        Script.global.defineProperty("twitter", TwitterAPI.instance(), 0);
        Script.global.defineProperty("twitchCacheReady", PhantomBot.twitchCacheReady, 0);
        Script.global.defineProperty("isNightly", isNightly(), 0);
        Script.global.defineProperty("version", botVersion(), 0);
        Script.global.defineProperty("changed", newSetup, 0);
        Script.global.defineProperty("discordAPI", DiscordAPI.instance(), 0);
        Script.global.defineProperty("hasDiscordToken", hasDiscordToken(), 0);
        Script.global.defineProperty("customAPI", CustomAPI.instance(), 0);

        /* open a new thread for when the bot is exiting */
        Thread thread = new Thread(() -> {
            onExit();
        }, "me.mast3rplan.phantombot.PhantomBot::onExit");

        /* Get the un time for that new thread we just created */
        Runtime.getRuntime().addShutdownHook(thread);

        /* And finally try to load init, that will then load the scripts */
        try {
            ScriptManager.loadScript(new File("./scripts/init.js"));
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        /* Check for a update with PhantomBot */
        doCheckPhantomBotUpdate();

        /* Perform SQLite datbase backups. */
        if (this.backupSQLiteAuto) {
            doBackupSQLiteDB();
        }
    }

    /*
     * Used for exiting the bot
     *
     */
    @SuppressWarnings("SleepWhileInLoop")
    public void onExit() {
        print(this.botName + " is shutting down...");
        isExiting = true;

        print("Stopping all events and message dispatching...");

        /* Gonna need a way to pass this to all channels */
        if (PhantomBot.getSession(this.channelName) != null) {
            PhantomBot.getSession(this.channelName).setAllowSendMessages(false);
        }

        /* Shutdown all caches */
        print("Terminating the Twitch channel follower cache...");
        FollowersCache.killall();
        print("Terminating the Streamlabs cache...");
        DonationsCache.killall();
        print("Terminating the StreamTip cache...");
        StreamTipCache.killall();

        print("Terminating pending timers...");
        ScriptApi.instance().kill();

        print("Terminating all script modules...");
        HashMap<String, Script> scripts = ScriptManager.getScripts();
        for (Entry<String, Script> script : scripts.entrySet()) {
            script.getValue().kill();
        }

        print("Saving all data...");
        dataStore.SaveAll(true);

        /* Check to see if web is enabled */
        if (webEnabled) {
            print("Shutting down all web socket servers...");
            if (legacyServers) {
                httpServer.dispose();
                eventWebSocketServer.dispose();
            }
            if (!useHttps) {
                newHttpServer.close();
            } else {
                newHttpsServer.close();
            }
            youtubeSocketServer.dispose();
        }

        try {
            for (int i = 5; i > 0; i--) {
                com.gmt2001.Console.out.print("\rWaiting for everthing else to shutdown... " + i + " ");
                Thread.sleep(1000);
            }
        } catch (InterruptedException ex) {
            com.gmt2001.Console.out.print("\r\n");
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        com.gmt2001.Console.out.print("\r\n");
        print(this.botName + " is exiting.");
    }

    /*
     * Connected to Twitch.
     *
     */
    @Subscribe
    public void ircJoinComplete(IrcJoinCompleteEvent event) {
        /* Check if the bot already joined once. */
        if (joined) {
            return;
        }

        joined = true;

        this.chanName = event.getChannel().getName();
        this.session = event.getSession();

        com.gmt2001.Console.debug.println("ircJoinComplete::" + this.chanName);

        /* Start a pubsub instance here. */
        if (this.oauth.length() > 0 && checkDataStore("chatModerator", "moderationLogs")) {
            this.pubSubEdge = TwitchPubSub.instance(this.channelName, TwitchAPIv3.instance().getChannelId(this.channelName), TwitchAPIv3.instance().getChannelId(this.botName), this.oauth);
        }

        /* Add the channel/session in the array for later use */
        PhantomBot.addChannel(this.chanName, event.getChannel());
        PhantomBot.addSession(this.chanName, this.session);

        /* Say .mods in the channel to check if the bot is a moderator */
        this.session.saySilent(".mods");
        /* Start the message timers for this session */
        this.session.startTimers();

        /* Load the caches for each channels */
        this.twitchCache = TwitchCache.instance(this.chanName);
        this.emotesCache = EmotesCache.instance(this.chanName);
        this.followersCache = FollowersCache.instance(this.chanName);
        
        /* Start the donations cache if the keys are not null and the module is enabled */
        if (this.twitchAlertsKey != null && !this.twitchAlertsKey.isEmpty() && checkModuleEnabled("./handlers/donationHandler.js")) {
            this.twitchAlertsCache = DonationsCache.instance(this.chanName);
        }

        /* Start the streamtip cache if the keys are not null and the module is enabled */
        if (this.streamTipOAuth != null && !this.streamTipOAuth.isEmpty() && checkModuleEnabled("./handlers/streamTipHandler.js")) {
            this.streamTipCache = StreamTipCache.instance(this.chanName);
        }

        /* Start the TipeeeStream cache if the keys are not null and the module is enabled. */
        if (this.tipeeeStreamOAuth != null && !this.tipeeeStreamOAuth.isEmpty() && checkModuleEnabled("./handlers/tipeeeStreamHandler.js")) {
            this.tipeeeStreamCache = TipeeeStreamCache.instance(this.chanName);
        }

        /* Start the twitter cache if the keys are not null and the module is enabled */
        if (this.twitterAuthenticated && checkModuleEnabled("./handlers/twitterHandler.js")) {
            this.twitterCache = TwitterCache.instance(this.chanName);
        }

        /* Start the notice timer and notice handler. */
        if (pbProperties.getProperty("testnotices", "false").equals("true")) {
            this.noticeTimer = NoticeTimer.instance(this.channelName, this.session);
        }

        /* Export these to the $. api for the sripts to use */
        Script.global.defineProperty("twitchcache", this.twitchCache, 0);
        Script.global.defineProperty("emotes", this.emotesCache, 0);
        Script.global.defineProperty("session", this.session, 0);
    }

    /*
     * Get private messages from Twitch.
     *
     */
    @Subscribe
    public void ircPrivateMessage(IrcPrivateMessageEvent event) {
        String sender = event.getSender();
        String message = event.getMessage();

        /* Check to see if the sender is jtv */
        if (sender.equalsIgnoreCase("jtv")) {
            /* Splice the mod list so we can get all the mods */
            if (message.startsWith("The moderators of this room are: ")) {
                String[] moderators = message.substring(33).split(", ");

                /* Check to see if the bot is a moderator */
                for (String moderator : moderators) {
                    if (moderator.equalsIgnoreCase(this.botName)) {
                        EventBus.instance().postAsync(new IrcChannelUserModeEvent(this.session, this.channel, this.session.getNick(), "O", true));
                        /* Allow the bot to sends message to this session */
                        event.getSession().setAllowSendMessages(true);
                    }
                }
            }
        }
    }

    /*
     * user modes from twitch
     *
     */
    @Subscribe
    public void ircUserMode(IrcChannelUserModeEvent event) {
        /* Check to see if Twitch sent a mode event for the bot name */
        if (event.getUser().equalsIgnoreCase(this.botName) && event.getMode().equalsIgnoreCase("o")) {
            if (!event.getAdd()) {
                event.getSession().saySilent(".mods");
            }
            /* Allow the bot to sends message to this session */
            event.getSession().setAllowSendMessages(event.getAdd());
        }
    }

    /*
     * messages from Twitch chat
     *
     */
    @Subscribe
    public void ircChannelMessage(IrcChannelMessageEvent event) {
        if (event.getMessage().startsWith("!debug !dev")) {
            devDebugCommands(event.getMessage(), event.getTags().get("user-id"), event.getSender(), false);
        }

        if (this.pubSubEdge != null) {
            this.pubSubEdge.ircChannelMessageEvent(event);
        }
    }

    /*
     * Check to see if someone is typing in the console.
     *
     */
    @Subscribe
    public void consoleInput(ConsoleInputEvent event) {
        String message = event.getMsg();
        Boolean changed = false;
        Boolean reset = false;
        String arguments = "";
        String[] argument = null;

        /* Check to see if the message is null or has nothing in it */
        if (message == null || message.isEmpty()) {
            return;
        }

        /* Check for arguments */
        if (message.contains(" ")) {
            String messageString = message;
            message = messageString.substring(0, messageString.indexOf(" "));
            arguments = messageString.substring(messageString.indexOf(" ") + 1);
            argument = arguments.split(" ");
        }

        if (message.equalsIgnoreCase("faketwitchmsg")) {
            if (argument != null) {
                com.gmt2001.Console.out.println(">> Faking Twitch IRC [" + arguments + "]");
                this.session.fakeTwitchMessage(arguments + "_"); // Need a junk character to strip off //
            }
            return;
        }

        if (message.equalsIgnoreCase("revloconvert")) {
            print("[CONSOLE] Executing revloconvert");
            if (arguments.length() > 0) {
                new RevloConverter(arguments);
            }
        }

        if (message.equalsIgnoreCase("ankhtophantombot")) {
            print("");
            print("Not all of AnkhBot's data will be compatible with PhantomBot.");
            print("This process will take a long time.");
            print("Are you sure you want to convert AnkhBot's data to PhantomBot? [y/n]");
            print("");
            String check = System.console().readLine().trim();
            if (check.equals("y")) {
                AnkhConverter.instance();
            } else {
                print("No changes were made.");
                return;
            }
        }

        if (message.equalsIgnoreCase("backupdb")) {
            print("[CONSOLE] Executing backupdb");
            SimpleDateFormat datefmt = new SimpleDateFormat("ddMMyyyy.hhmmss");
            datefmt.setTimeZone(TimeZone.getTimeZone(timeZone));
            String timestamp = datefmt.format(new Date());

            dataStore.backupSQLite3("phantombot.manual.backup." + timestamp + ".db");
            return;
        }

        /* Update the followed (followers) table. */
        if (message.equalsIgnoreCase("fixfollowedtable")) {
            print("[CONSOLE] Executing fixfollowedtable");
            TwitchAPIv3.instance().FixFollowedTable(channelName, dataStore, false);
            return;
        }

        /* Update the followed (followers) table - forced. */
        if (message.equalsIgnoreCase("fixfollowedtable-force")) {
            print("[CONSOLE] Executing fixfollowedtable-force");
            TwitchAPIv3.instance().FixFollowedTable(channelName, dataStore, true);
            return;
        }

        if (message.equalsIgnoreCase("jointest")) {
            print("[CONSOLE] Executing jointest");
            for (int i = 0 ; i < 30; i++) {
                EventBus.instance().postAsync(new IrcChannelJoinEvent(this.session, this.channel, generateRandomString(8)));
            }
        }

        /* tests a follow event */
        if (message.equalsIgnoreCase("followertest")) {
            String user;
            if (argument != null) {
                user = argument[0];
            } else {
                user = generateRandomString(10);
            }

            print("[CONSOLE] Executing followertest (User: " + user + ")");
            EventBus.instance().postAsync(new TwitchFollowEvent(user, PhantomBot.getChannel(this.channelName)));
            return;
        }

        /* tests multiple follows */
        if (message.equalsIgnoreCase("followerstest")) {
            String randomUser = generateRandomString(10);
            int followCount = 5;

            if (argument != null) {
                followCount = Integer.parseInt(argument[0]);
            }

            print("[CONSOLE] Executing followerstest (Count: " + followCount + ", User: " + randomUser + ")");
            for (int i = 0; i < followCount; i++) {
                EventBus.instance().postAsync(new TwitchFollowEvent(randomUser + "_" + i, PhantomBot.getChannel(this.channelName)));
            }
            return;
        }

        /* Test a subscriber event */
        if (message.equalsIgnoreCase("subscribertest")) {
            String randomUser = generateRandomString(10);
            print("[CONSOLE] Executing subscribertest (User: " + randomUser + ")");
            EventBus.instance().postAsync(new NewSubscriberEvent(PhantomBot.getSession(this.channelName), PhantomBot.getChannel(this.channelName), randomUser));
            return;
        }

        /* Test a prime subscriber event */
        if (message.equalsIgnoreCase("primesubscribertest")) {
            String randomUser = generateRandomString(10);
            print("[CONSOLE] Executing primesubscribertest (User: " + randomUser + ")");
            EventBus.instance().postAsync(new NewPrimeSubscriberEvent(PhantomBot.getSession(this.channelName), PhantomBot.getChannel(this.channelName), randomUser));
            return;
        }

        /* Test a resubscriber event */
        if (message.equalsIgnoreCase("resubscribertest")) {
            String randomUser = generateRandomString(10);
            print("[CONSOLE] Executing resubscribertest (User: " + randomUser + ")");
            EventBus.instance().postAsync(new NewReSubscriberEvent(PhantomBot.getSession(this.channelName), PhantomBot.getChannel(this.channelName), randomUser, "10"));
            return;
        }

        /* Test the online event */
        if (message.equalsIgnoreCase("onlinetest")) {
            print("[CONSOLE] Executing onlinetest");
            EventBus.instance().postAsync(new TwitchOnlineEvent(PhantomBot.getChannel(this.channelName)));
            return;
        }

        /* Test the offline event */
        if (message.equalsIgnoreCase("offlinetest")) {
            print("[CONSOLE] Executing offlinetest");
            EventBus.instance().postAsync(new TwitchOfflineEvent(PhantomBot.getChannel(this.channelName)));
            return;
        }

        /* Test the host event */
        if (message.equalsIgnoreCase("hosttest")) {
            print("[CONSOLE] Executing hosttest");
            EventBus.instance().postAsync(new TwitchHostedEvent(this.botName, PhantomBot.getChannel(this.channelName)));
            return;
        }

        /* test the gamewisp subscriber event */
        if (message.equalsIgnoreCase("gamewispsubscribertest")) {
            print("[CONSOLE] Executing gamewispsubscribertest");
            EventBus.instance().postAsync(new GameWispSubscribeEvent(this.botName, 1));
            return;
        }

        /* test the gamewisp resubscriber event */
        if (message.equalsIgnoreCase("gamewispresubscribertest")) {
            print("[CONSOLE] Executing gamewispresubscribertest");
            EventBus.instance().postAsync(new GameWispAnniversaryEvent(this.botName, 2));
            return;
        }

        /* test the bits event */
        if (message.equalsIgnoreCase("bitstest")) {
            print("[CONSOLE] Executing bitstest");
            EventBus.instance().postAsync(new BitsEvent(PhantomBot.getSession(this.channelName), PhantomBot.getChannel(this.channelName), this.botName, "100"));
            return;
        }

        /* enables debug mode */
        if (message.equalsIgnoreCase("debugon")) {
            print("[CONSOLE] Executing debugon: Enable Debug Mode");
            PhantomBot.setDebugging(true);
            return;
        }

        /* disables debug mode - note that setDebuggingLogOnly() completely disables all debugging */
        if (message.equalsIgnoreCase("debugoff")) {
            print("[CONSOLE] Executing debugoff: Disable Debug Mode");
            PhantomBot.setDebuggingLogOnly(false);
            return;
        }

        /* enables debug mode - log only */
        if (message.equalsIgnoreCase("debuglog")) {
            print("[CONSOLE] Executing debuglog: Enable Debug Mode - Log Only");
            PhantomBot.setDebuggingLogOnly(true);
            return;
        }

        /* Reset the bot login */
        if (message.equalsIgnoreCase("reset")) {
            print("Are you sure you want to reset the bot login? [y/n]");
            String check = System.console().readLine().trim();
            if (check.equals("y")) {
                reset = true;
                changed = true;
            } else {
                print("No changes were made.");
                return;
            }
        }

        /* Change the apiOAuth token */
        if (message.equalsIgnoreCase("apioauth")) {
            System.out.print("Please enter you're oauth token that you generated from https://phantombot.tv/oauth while logged as the caster: ");
            apiOAuth = System.console().readLine().trim();
            pbProperties.setProperty("apioauth", apiOAuth);
            changed = true;
        }

        /* Setup for MySql */
        if (message.equalsIgnoreCase("mysqlsetup")) {
            try {
                print("");
                print("PhantomBot MySQL setup.");
                print("");

                com.gmt2001.Console.out.print("Please enter your MySQL host name: ");
                mySqlHost = System.console().readLine().trim();
                pbProperties.setProperty("mysqlhost", mySqlHost);

                com.gmt2001.Console.out.print("Please enter your MySQL port: ");
                mySqlPort = System.console().readLine().trim();
                pbProperties.setProperty("mysqlport", mySqlPort);

                com.gmt2001.Console.out.print("Please enter your MySQL db name: ");
                mySqlName = System.console().readLine().trim();
                pbProperties.setProperty("mysqlname", mySqlName);

                com.gmt2001.Console.out.print("Please enter a username for MySQL: ");
                mySqlUser = System.console().readLine().trim();
                pbProperties.setProperty("mysqluser", mySqlUser);

                com.gmt2001.Console.out.print("Please enter a password for MySQL: ");
                mySqlPass = System.console().readLine().trim();
                pbProperties.setProperty("mysqlpass", mySqlPass);

                dataStoreType = "MySQLStore";
                pbProperties.setProperty("datastore", dataStoreType);

                print("PhantomBot MySQL setup done, PhantomBot will exit.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /* Setup for GameWisp */
        if (message.equalsIgnoreCase("gamewispsetup")) {
            try {
                print("");
                print("PhantomBot GameWisp setup.");
                print("");

                com.gmt2001.Console.out.print("Please enter your GameWisp OAuth key: ");
                gameWispOAuth = System.console().readLine().trim();
                pbProperties.setProperty("gamewispauth", gameWispOAuth);

                com.gmt2001.Console.out.print("Please enter your GameWisp refresh key: ");
                gameWispRefresh = System.console().readLine().trim();
                pbProperties.setProperty("gamewisprefresh", gameWispRefresh);

                print("PhantomBot GameWisp setup done, PhantomBot will exit.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /* Setup for StreamLabs (TwitchAlerts) */
        if (message.equalsIgnoreCase("streamlabssetup")) {
            try {
                print("");
                print("PhantomBot StreamLabs setup.");
                print("");

                com.gmt2001.Console.out.print("Please enter your StreamLabs OAuth key: ");
                twitchAlertsKey = System.console().readLine().trim();
                pbProperties.setProperty("twitchalertskey", twitchAlertsKey);

                print("PhantomBot StreamLabs setup done, PhantomBot will exit.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /* Setup for StreamTip */
        if (message.equalsIgnoreCase("streamtipsetup")) {
            try {
                print("");
                print("PhantomBot StreamTip setup.");
                print("");

                com.gmt2001.Console.out.print("Please enter your StreamTip Api OAuth: ");
                streamTipOAuth = System.console().readLine().trim();
                pbProperties.setProperty("streamtipkey", streamTipOAuth);

                com.gmt2001.Console.out.print("Please enter your StreamTip Client Id: ");
                streamTipClientId = System.console().readLine().trim();
                pbProperties.setProperty("streamtipid", streamTipClientId);

                print("PhantomBot StreamTip setup done, PhantomBot will exit.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /* Setup for TipeeeStream */
        if (message.equalsIgnoreCase("tipeeestreamsetup")) {
            try {
                print("");
                print("PhantomBot TipeeeStream setup.");
                print("");

                com.gmt2001.Console.out.print("Please enter your TipeeeStream Api OAuth: ");
                tipeeeStreamOAuth = System.console().readLine().trim();
                pbProperties.setProperty("tipeeestreamkey", tipeeeStreamOAuth);

                print("PhantomBot TipeeeStream setup done, PhantomBot will exit.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /* Setup the web panel login info */
        if (message.equalsIgnoreCase("panelsetup")) {
            try {
                print("");
                print("PhantomBot Web Panel setup.");
                print("Note: Do not use any ascii characters in your username of password.");
                print("");

                com.gmt2001.Console.out.print("Please enter a username of your choice: ");
                panelUsername = System.console().readLine().trim();
                pbProperties.setProperty("paneluser", panelUsername);

                com.gmt2001.Console.out.print("Please enter a password of your choice: ");
                panelPassword = System.console().readLine().trim();
                pbProperties.setProperty("panelpassword", panelPassword);

                print("PhantomBot Web Panel setup done, PhantomBot will exit.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /* Setup for Twitter */
        if (message.equalsIgnoreCase("twittersetup")) {
            try {
                print("");
                print("PhantomBot Twitter setup.");
                print("");

                com.gmt2001.Console.out.print("Please enter your Twitter username: ");
                twitterUsername = System.console().readLine().trim();
                pbProperties.setProperty("twitterUser", twitterUsername);

                com.gmt2001.Console.out.print("Please enter your consumer key: ");
                twitterConsumerToken = System.console().readLine().trim();
                pbProperties.setProperty("twitter_consumer_key", twitterConsumerToken);

                com.gmt2001.Console.out.print("Please enter your consumer secret: ");
                twitterConsumerSecret = System.console().readLine().trim();
                pbProperties.setProperty("twitter_consumer_secret", twitterConsumerSecret);

                com.gmt2001.Console.out.print("Please enter your access token: ");
                twitterAccessToken = System.console().readLine().trim();
                pbProperties.setProperty("twitter_access_token", twitterAccessToken);

                com.gmt2001.Console.out.print("Please enter your access token secret: ");
                twitterSecretToken = System.console().readLine().trim();
                pbProperties.setProperty("twitter_secret_token", twitterSecretToken);

                /* Delete the old Twitter file if it exists */
                try {
                    File f = new File("./twitter.txt");
                    f.delete();
                } catch (NullPointerException ex) {
                    com.gmt2001.Console.debug.println(ex);
                }

                print("PhantomBot Twitter setup done, PhantomBot will exit.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /* Check to see if any settings have been changed */
        if (changed && !reset) {
            Properties outputProperties = new Properties() {
                @Override
                public synchronized Enumeration<Object> keys() {
                    return Collections.enumeration(new TreeSet<>(super.keySet()));
                }
            };

            try {
                try (FileOutputStream outputStream = new FileOutputStream("botlogin.txt")) {
                    outputProperties.putAll(pbProperties);
                    outputProperties.store(outputStream, "PhantomBot Configuration File");
                }

                dataStore.SaveAll(true);

                print("");
                print("Changes have been saved, now exiting PhantomBot.");
                print("");
                System.exit(0);
            } catch (IOException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
            return;
        }

        /* Save everything */
        if (message.equalsIgnoreCase("save")) {
            print("[CONSOLE] Executing save");
            dataStore.SaveAll(true);
            return;
        }

        /* Exit phantombot */
        if (message.equalsIgnoreCase("exit")) {
            print("[CONSOLE] Executing exit");
            System.exit(0);
            return;
        }

        /* handle any other commands */
        handleCommand(botName, event.getMsg(), PhantomBot.getChannel(this.channelName));
        // Need to support channel here. command (channel) argument[1]

        /* Handle dev commands */
        if (event.getMsg().startsWith("!debug !dev")) {
            devDebugCommands(event.getMsg(), "no_id", botName, true);
        }
    }

    /* Handle commands */
    public void handleCommand(String username, String command, Channel channel) {
        String arguments = "";

        /* Does the command have arguments? */
        if (command.contains(" ")) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }
        ScriptEventManager.instance().runDirect(new CommandEvent(username, command, arguments, null, channel));
    }

    /* Handle commands */
    public void handleCommand(String username, String command) {
        String arguments = "";

        /* Does the command have arguments? */
        if (command.contains(" ")) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }
        ScriptEventManager.instance().runDirect(new CommandEvent(username, command, arguments));
    }

    /* Handles dev debug commands. */
    public void devDebugCommands(String command, String id, String sender, boolean isConsole) {
        if (!command.equalsIgnoreCase("!debug !dev") && (id.equals("32896646") || id.equals("88951632") || id.equals("9063944") || id.equals("74012707") || id.equals("77632323") || sender.equalsIgnoreCase(ownerName) || sender.equalsIgnoreCase(botName))) {
            String arguments = "";
            String[] args = null;
            command = command.substring(12);

            if (!command.contains("!") || (!devCommands && !isConsole)) {
                return;
            }

            command = command.substring(1);

            if (command.contains(" ")) {
                String commandString = command;
                command = commandString.substring(0, commandString.indexOf(" "));
                arguments = commandString.substring(commandString.indexOf(" ") + 1);
                args = arguments.split(" ");
            }

            if (command.equals("consoleevent")) {
                EventBus.instance().postAsync(new ConsoleInputEvent(arguments));
                Logger.instance().log(Logger.LogType.Debug, "User: " + sender + ". ConsoleEvent: " + arguments + ". Id: " + id);
                Logger.instance().log(Logger.LogType.Debug, "");
                return;
            }

            if (command.equals("exit")) {
                Logger.instance().log(Logger.LogType.Debug, "User: " + sender + ". ShutDown: " + botName + ". Id: " + id);
                Logger.instance().log(Logger.LogType.Debug, "");
                System.exit(0);
                return;
            }

            if (command.equals("version")) {
                PhantomBot.instance().getSession().say("@" + sender + ", Info: " + getBotInfo() + ". OS: " + System.getProperty("os.name"));
                return;
            }

            if (command.equals("dbbackup")) {
                SimpleDateFormat datefmt = new SimpleDateFormat("ddMMyyyy.hhmmss");
                datefmt.setTimeZone(TimeZone.getTimeZone(timeZone));
                String timestamp = datefmt.format(new Date());
    
                dataStore.backupSQLite3("phantombot.manual.backup." + timestamp + ".db");
                return;
            }

            if (command.equals("dbtabledel")) {
                try {
                    PhantomBot.instance().getDataStore().RemoveFile(args[0]);
                    Logger.instance().log(Logger.LogType.Debug, "User: " + sender + ". Removed DB Table: " + args[0] + ". Id: " + id);
                    Logger.instance().log(Logger.LogType.Debug, "");
                } catch (Exception ex) {
                    com.gmt2001.Console.err.println("Could not edit the db: " + ex.getMessage());
                }
                return;
            }

            if (command.equals("dbedit")) {
                try {
                    PhantomBot.instance().getDataStore().set(args[0], args[1], arguments.substring(arguments.indexOf(args[1]) + args[1].length() + 1));
                    Logger.instance().log(Logger.LogType.Debug, "User: " + sender + ". Edited DB Table: " + args[0] + " With: " + arguments.substring(arguments.indexOf(args[1]) + args[1].length() + 1) + ". Id: " + id);
                    Logger.instance().log(Logger.LogType.Debug, "");
                } catch (Exception ex) {
                    com.gmt2001.Console.err.println("Could not edit the db: " + ex.getMessage());
                }
                return;
            }

            if (command.equals("dbdel")) {
                try {
                    PhantomBot.instance().getDataStore().del(args[0], args[1]);
                    Logger.instance().log(Logger.LogType.Debug, "User: " + sender + ". Edited DB Table: " + args[0] + " Del: " + args[1] + ". Id: " + id);
                    Logger.instance().log(Logger.LogType.Debug, "");
                } catch (Exception ex) {
                    com.gmt2001.Console.err.println("Could not edit the db: " + ex.getMessage());
                }
                return;
            }

            ScriptEventManager.instance().runDirect(new DeveloperCommandEvent(sender, command, arguments, id));
            Logger.instance().log(Logger.LogType.Debug, "User: " + sender + " Issued Command: " + command + ". Id: " + id);
            Logger.instance().log(Logger.LogType.Debug, "");
        }
    }

    /* convert SqliteStore to MySql */
    private void sqlite2MySql() {
        print("Performing SQLite to MySQL Conversion...");
        MySQLStore mysql = MySQLStore.instance();
        SqliteStore sqlite = SqliteStore.instance();

        File backupFile = new File("phantombot.db.backup");
        if (backupFile.exists()) {
            print("A phantombot.db.backup file already exists. Please rename or remove this file first.");
            print("Exiting PhantomBot");
            System.exit(0);
        }

        print("Wiping Existing MySQL Tables...");
        String[] deltables = mysql.GetFileList();
        for (String table : deltables) {
            mysql.RemoveFile(table);
        }

        print("Converting SQLite to MySQL...");
        String[] tables = sqlite.GetFileList();
        for (String table : tables) {
            print("Converting Table: " + table);
            String[] sections = sqlite.GetCategoryList(table);
            for (String section : sections) {
                String[] keys = sqlite.GetKeyList(table, section);
                for (String key : keys) {
                    String value = sqlite.GetString(table, section, key);
                    mysql.SetString(table, section, key, value);
                }
            }
        }
        sqlite.CloseConnection();
        print("Finished Converting Tables.");
        print("Moving phantombot.db to phantombot.db.backup");

        try {
            FileUtils.moveFile(new java.io.File("phantombot.db"), new java.io.File("phantombot.db.backup"));
        } catch (IOException ex) {
            com.gmt2001.Console.err.println("Failed to move phantombot.db to phantombot.db.backup: " + ex.getMessage());
        }
        print("SQLite to MySQL Conversion is Complete");
    }

    /* Convert iniStore to MySql */
    private void ini2MySql(Boolean delete) {
        print("Performing INI to MySQL Conversion...");
        IniStore ini = IniStore.instance();
        MySQLStore mysql = MySQLStore.instance();

        print("Wiping Existing MySQL Tables...");
        String[] deltables = mysql.GetFileList();
        for (String table : deltables) {
            mysql.RemoveFile(table);
        }

        print("Converting IniStore to MySQL...");
        String[] files = ini.GetFileList();
        int i = 0;
        String str;
        int maxlen = 0;
        int num;
        for (String file : files) {
            str = " " + i + " / " + files.length;
            num = maxlen - str.length();
            for (int n = 0; n < num; n++) {
                str += " ";
            }
            maxlen = Math.max(maxlen, str.length());
            print("\rConverting File: " + file);
            mysql.AddFile(file);

            String[] sections = ini.GetCategoryList(file);
            int b = 0;
            for (String section : sections) {
                str = " " + i + " / " + files.length
                      + " [" + b + " / " + sections.length + "]";
                num = maxlen - str.length();
                for (int n = 0; n < num; n++) {
                    str += " ";
                }
                maxlen = Math.max(maxlen, str.length());

                String[] keys = ini.GetKeyList(file, section);
                int k = 0;
                for (String key : keys) {
                    str = " " + i + " / " + files.length
                          + " [" + b + " / " + sections.length + "] <" + k + " / " + keys.length + ">";
                    num = maxlen - str.length();
                    for (int n = 0; n < num; n++) {
                        str += " ";
                    }
                    maxlen = Math.max(maxlen, str.length());

                    String value = ini.GetString(file, section, key);
                    mysql.SetString(file, section, key, value);
                    k++;
                }
                b++;
            }
            i++;
        }

        str = "";
        for (i = 0; i < maxlen - 4; i++) {
            str += " ";
        }
        com.gmt2001.Console.out.print("\rConversion from IniStore to MySQL is Complete" + str);

        if (delete) {
            print("Deleting IniStore folder...");
            for (String file : files) {
                ini.RemoveFile(file);
            }

            File f = new File("./inistore");
            if (f.delete()) {
                print("Process is Done");
            }
        }
    }

    /* Convert iniStore to SqliteStore */
    private void ini2Sqlite(boolean delete) {
        print("Performing INI 2 SQLite Upgrade");
        IniStore ini = IniStore.instance();
        SqliteStore sqlite = SqliteStore.instance();
        print("done");

        print("Wiping Existing SQLiteStore...");
        String[] deltables = sqlite.GetFileList();
        for (String table : deltables) {
            sqlite.RemoveFile(table);
        }
        print("done");

        print("Copying IniStore to SQLiteStore...");
        String[] files = ini.GetFileList();
        int i = 0;
        String str;
        int maxlen = 0;
        int num;
        for (String file : files) {
            str = " " + i + " / " + files.length;
            num = maxlen - str.length();
            for (int n = 0; n < num; n++) {
                str += " ";
            }
            maxlen = Math.max(maxlen, str.length());
            com.gmt2001.Console.out.print("\r Copying IniStore to SQLiteStore..." + str);
            sqlite.AddFile(file);

            String[] sections = ini.GetCategoryList(file);
            int b = 0;
            for (String section : sections) {
                str = " " + i + " / " + files.length
                      + " [" + b + " / " + sections.length + "]";
                num = maxlen - str.length();
                for (int n = 0; n < num; n++) {
                    str += " ";
                }
                maxlen = Math.max(maxlen, str.length());
                com.gmt2001.Console.out.print("\rCopying IniStore to SQLiteStore..." + str);

                String[] keys = ini.GetKeyList(file, section);
                int k = 0;
                for (String key : keys) {
                    str = " " + i + " / " + files.length
                          + " [" + b + " / " + sections.length + "] <" + k + " / " + keys.length + ">";
                    num = maxlen - str.length();
                    for (int n = 0; n < num; n++) {
                        str += " ";
                    }
                    maxlen = Math.max(maxlen, str.length());
                    com.gmt2001.Console.out.print("\rCopying IniStore to SQLiteStore..." + str);

                    String value = ini.GetString(file, section, key);
                    sqlite.SetString(file, section, key, value);

                    k++;
                }
                b++;
            }
            i++;
        }

        str = "";
        for (i = 0; i < maxlen - 4; i++) {
            str += " ";
        }
        com.gmt2001.Console.out.print("\rCopying IniStore to SQLiteStore is Completed" + str);

        if (delete) {
            print("Deleting IniStore folder...");
            for (String file : files) {
                ini.RemoveFile(file);
            }

            /* Delete the old inistore folder */
            File f = new File("./inistore");
            if (f.delete()) {
                print("Process is Done");
            }
        }
    }

    /* Load up main */
    public static void main(String[] args) throws IOException {
        /* List of properties that must exist. */
        String requiredProperties[] = new String[] { "oauth", "channel", "owner", "user" };
        String requiredPropertiesErrorMessage = "";

        if (Float.valueOf(System.getProperty("java.specification.version")) < (float) 1.8 || Float.valueOf(System.getProperty("java.specification.version")) >= (float) 1.9) {
            System.out.println("Detected Java " + System.getProperty("java.version") + ". " + "PhantomBot requires Java 8. Java 9 will not work.");
            System.exit(1);
        }

        /* Properties configuration */
        Properties startProperties = new Properties();

        /* Indicates that the botlogin.txt file should be overwritten/created. */
        Boolean changed = false;

        /* Print the user dir */
        com.gmt2001.Console.out.println("The working directory is: " + System.getProperty("user.dir"));

        com.gmt2001.Console.out.println("Detected Java " + System.getProperty("java.version") + " running on " +
                                        System.getProperty("os.name") + " " + System.getProperty("os.version") +
                                        " (" + System.getProperty("os.arch") + ")");

        /* Load up the bot info from the bot login file */
        try {
            if (new File("botlogin.txt").exists()) {
                FileInputStream inputStream = new FileInputStream("botlogin.txt");
                startProperties.load(inputStream);
                inputStream.close();
            } else {
                /* Fill in the Properties object with some default values. Note that some values are left
                 * unset to be caught in the upcoming logic to enforce settings.
                 */
                startProperties.setProperty("baseport", "25000");
                startProperties.setProperty("usehttps", "false");
                startProperties.setProperty("webenable", "true");
                startProperties.setProperty("msglimit30", "18.75");
                startProperties.setProperty("musicenable", "true");
                startProperties.setProperty("whisperlimit60", "60.0");
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        /* Load up the bot info from the environment */
        for (Entry<String, String> v : System.getenv().entrySet()) {
            String Prefix = "PHANTOMBOT_";
            String Key = v.getKey().toUpperCase();
            String Value = v.getValue();
            if (Key.startsWith(Prefix) && Prefix.length() < Key.length()) {
                Key = Key.substring(Prefix.length()).toLowerCase();
                startProperties.setProperty(Key, Value);
            }
        }
        /* Check to enable debug mode */
        if (startProperties.getProperty("debugon", "false").equals("true")) {
            com.gmt2001.Console.out.println("Debug Mode Enabled");
            PhantomBot.enableDebugging = true;
        }
        /* Check to enable debug to File */
        if (startProperties.getProperty("debuglog", "false").equals("true")) {
            com.gmt2001.Console.out.println("Debug Log Only Mode Enabled");
            PhantomBot.enableDebugging = true;
            PhantomBot.enableDebuggingLogOnly = true;
        }
        /* Check to enable Script Reloading */
        if (startProperties.getProperty("reloadscripts", "false").equals("true")) {
            com.gmt2001.Console.out.println("Enabling Script Reloading");
            PhantomBot.reloadScripts = true;
        }
        /* Check to enable Rhino Debugger */
        if (startProperties.getProperty("rhinodebugger", "false").equals("true")) {
            com.gmt2001.Console.out.println("Rhino Debugger will be launched if system supports it.");
            PhantomBot.enableRhinoDebugger = true;
        }
        /* Check to see if there's a webOauth set */
        if (startProperties.getProperty("webauth") == null) {
            startProperties.setProperty("webauth", generateWebAuth());
            com.gmt2001.Console.debug.println("New webauth key has been generated for botlogin.txt");
            changed = true;
        }
        /* Check to see if there's a webOAuthRO set */
        if (startProperties.getProperty("webauthro") == null) {
            startProperties.setProperty("webauthro", generateWebAuth());
            com.gmt2001.Console.debug.println("New webauth read-only key has been generated for botlogin.txt");
            changed = true;
        }
        /* Check to see if there's a panelUsername set */
        if (startProperties.getProperty("paneluser") == null) {
            com.gmt2001.Console.debug.println("No Panel Username, using default value of 'panel' for Control Panel and YouTube Player");
            startProperties.setProperty("paneluser", "panel");
            changed = true;
        }
        /* Check to see if there's a panelPassword set */
        if (startProperties.getProperty("panelpassword") == null) {
            com.gmt2001.Console.debug.println("No Panel Password, using default value of 'panel' for Control Panel and YouTube Player");
            startProperties.setProperty("panelpassword", "panel");
            changed = true;
        }
        /* Check to see if there's a youtubeOAuth set */
        if (startProperties.getProperty("ytauth") == null) {
            startProperties.setProperty("ytauth", generateWebAuth());
            com.gmt2001.Console.debug.println("New YouTube websocket key has been generated for botlogin.txt");
            changed = true;
        }
        /* Check to see if there's a youtubeOAuthThro set */
        if (startProperties.getProperty("ytauthro") == null) {
            startProperties.setProperty("ytauthro", generateWebAuth());
            com.gmt2001.Console.debug.println("New YouTube read-only websocket key has been generated for botlogin.txt");
            changed = true;
        }

        /* Make a new botlogin with the botName, oauth or channel is not found */
        if (startProperties.getProperty("user") == null || startProperties.getProperty("oauth") == null || startProperties.getProperty("channel") == null) {
            try {

                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("Welcome to the PhantomBot setup process!\r\n");
                com.gmt2001.Console.out.print("If you have any issues please report them on our forum or Tweet at us!\r\n");
                com.gmt2001.Console.out.print("Forum: https://community.phantombot.tv/\r\n");
                com.gmt2001.Console.out.print("Twitter: https://twitter.com/phantombotapp/\r\n");
                com.gmt2001.Console.out.print("PhantomBot Knowledgebase: https://docs.phantombot.tv/\r\n");
                com.gmt2001.Console.out.print("PhantomBot WebPanel: https://docs.phantombot.tv/kb/panel/\r\n");
                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("\r\n");

                // Bot name.
                do {
                    com.gmt2001.Console.out.print("1. Please enter the bot's Twitch username: ");

                    startProperties.setProperty("user", System.console().readLine().trim());
                } while (startProperties.getProperty("user", "").length() <= 0);

                // Twitch oauth.
                do {
                    com.gmt2001.Console.out.print("\r\n");
                    com.gmt2001.Console.out.print("2. You will now need a OAuth token for the bot to be able to chat.\r\n");
                    com.gmt2001.Console.out.print("Please note, this OAuth token needs to be generated while you're logged in into the bot's Twitch account.\r\n");
                    com.gmt2001.Console.out.print("If you're not logged in as the bot, please go to https://twitch.tv/ and login as the bot.\r\n");
                    com.gmt2001.Console.out.print("Get the bot's OAuth token here: https://twitchapps.com/tmi/\r\n");
                    com.gmt2001.Console.out.print("Please enter the bot's OAuth token: ");
                    
                    startProperties.setProperty("oauth", System.console().readLine().trim());
                } while (startProperties.getProperty("oauth", "").length() <= 0);
                
                // api oauth.
                do {
                    com.gmt2001.Console.out.print("\r\n");
                    com.gmt2001.Console.out.print("3. You will now need your channel OAuth token for the bot to be able to change your title and game.\r\n");
                    com.gmt2001.Console.out.print("Please note, this OAuth token needs to be generated while you're logged in into your caster account.\r\n");
                    com.gmt2001.Console.out.print("If you're not logged in as the caster, please go to https://twitch.tv/ and login as the caster.\r\n");
                    com.gmt2001.Console.out.print("Get the your OAuth token here: https://phantombot.tv/oauth/\r\n");
                    com.gmt2001.Console.out.print("Please enter your OAuth token: ");
                    
                    startProperties.setProperty("apioauth", System.console().readLine().trim());
                } while (startProperties.getProperty("apioauth", "").length() <= 0);

                // Channel name.
                do {
                    com.gmt2001.Console.out.print("\r\n");
                    com.gmt2001.Console.out.print("4. Please enter the name of the Twitch channel the bot should join: ");

                    startProperties.setProperty("channel", System.console().readLine().trim());
                } while (startProperties.getProperty("channel", "").length() <= 0);

                // Panel username.
                do {
                    com.gmt2001.Console.out.print("\r\n");
                    com.gmt2001.Console.out.print("5. Please enter a custom username for the web panel: ");

                    startProperties.setProperty("paneluser", System.console().readLine().trim());
                } while (startProperties.getProperty("paneluser", "").length() <= 0);

                // Panel password.
                do {
                    com.gmt2001.Console.out.print("\r\n");
                    com.gmt2001.Console.out.print("6. Please enter a custom password for the web panel: ");

                    startProperties.setProperty("panelpassword", System.console().readLine().trim());
                } while (startProperties.getProperty("panelpassword", "").length() <= 0);

                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("PhantomBot will launch in 5 seconds.\r\n");
                com.gmt2001.Console.out.print("If you're hosting the bot locally you can access the panel here: http://localhost:25005/panel \r\n");
                com.gmt2001.Console.out.print("If you're running the bot on a server, make sure to open the following ports: \r\n");
                com.gmt2001.Console.out.print("25003, 25004, and 25005. You can change 'localhost' to your server ip to access the panel. \r\n");

                try {
                    Thread.sleep(5000);
                } catch (InterruptedException ex) {
                    com.gmt2001.Console.debug.println("Failed to sleep in setup: " + ex.getMessage());
                }

                changed = true;
                newSetup = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
                com.gmt2001.Console.out.println("[ERROR] Failed to setup PhantomBot. Now exiting...");
                System.exit(0);
            }
        }

        /* Make sure the oauth has been set correctly */
        if (startProperties.getProperty("oauth") != null) {
            if (!startProperties.getProperty("oauth").startsWith("oauth") && !startProperties.getProperty("oauth").isEmpty()) {
                startProperties.setProperty("oauth", "oauth:" + startProperties.getProperty("oauth"));
                changed = true;
            }
        }

        /* Make sure the apiOAuth has been set correctly */
        if (startProperties.getProperty("apioauth") != null) {
            if (!startProperties.getProperty("apioauth").startsWith("oauth") && !startProperties.getProperty("apioauth").isEmpty()) {
                startProperties.setProperty("apioauth", "oauth:" + startProperties.getProperty("apioauth"));
                changed = true;
            }
        }

        /* Make sure the channelName does not have a # */
        if (startProperties.getProperty("channel").startsWith("#")) {
            startProperties.setProperty("channel", startProperties.getProperty("channel").substring(1));
            changed = true;
        } else if (startProperties.getProperty("channel").contains(".tv")) {
            startProperties.setProperty("channel", startProperties.getProperty("channel").substring(startProperties.getProperty("channel").indexOf(".tv/") + 4).replaceAll("/", ""));
            changed = true;
        }

        /* Check for the owner after the channel check is done. */
        if (startProperties.getProperty("owner") == null) {
            if (startProperties.getProperty("channel") != null) {
                if (!startProperties.getProperty("channel").isEmpty()) {
                    startProperties.setProperty("owner", startProperties.getProperty("channel"));
                    changed = true;
                }
            }
        }

        /* Iterate the properties and delete entries for anything that does not have a 
         * value.
         */
        for (String propertyKey : startProperties.stringPropertyNames()) {
            if (startProperties.getProperty(propertyKey).isEmpty()) {
                changed = true;
                startProperties.remove(propertyKey);
            }
        }

        /* 
         * Check for required settings.
         */
        for (String requiredProperty : requiredProperties) {
            if (startProperties.getProperty(requiredProperty) == null) {
                requiredPropertiesErrorMessage += requiredProperty + " ";
            }
        }
        
        if (!requiredPropertiesErrorMessage.isEmpty()) {
            com.gmt2001.Console.err.println();
            com.gmt2001.Console.err.println("Missing Required Properties: " + requiredPropertiesErrorMessage);
            com.gmt2001.Console.err.println("Exiting PhantomBot");
            System.exit(0);
        }

        /* Check to see if anything changed */
        if (changed) {
            Properties outputProperties = new Properties() {
                @Override
                public synchronized Enumeration<Object> keys() {
                    return Collections.enumeration(new TreeSet<>(super.keySet()));
                }
            };

            try {
                try (FileOutputStream outputStream = new FileOutputStream("botlogin.txt")) {
                    outputProperties.putAll(startProperties);
                    outputProperties.store(outputStream, "PhantomBot Configuration File");
                }
            } catch (IOException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /* Start PhantomBot */
        PhantomBot.instance = new PhantomBot(startProperties);
    }

    public void updateGameWispTokens(String[] newTokens) {
        Properties outputProperties = new Properties() {
            @Override
            public synchronized Enumeration<Object> keys() {
                return Collections.enumeration(new TreeSet<>(super.keySet()));
            }
        };

        gameWispOAuth = newTokens[0];
        gameWispRefresh = newTokens[1];
        
        pbProperties.setProperty("gamewispauth", newTokens[0]);
        pbProperties.setProperty("gamewisprefresh", newTokens[1]);

        try {
            try (FileOutputStream outputStream = new FileOutputStream("botlogin.txt")) {
                outputProperties.putAll(pbProperties);
                outputProperties.store(outputStream, "PhantomBot Configuration File");
            }
            print("GameWisp Token has been refreshed.");
        } catch (IOException ex) {
            com.gmt2001.Console.err.println("!!!! CRITICAL !!!! Failed to update GameWisp Refresh Tokens into botlogin.txt! Must manually add!");
            com.gmt2001.Console.err.println("!!!! CRITICAL !!!! gamewispauth = " + newTokens[0] + " gamewisprefresh = " + newTokens[1]);
        }

        SingularityAPI.instance().setAccessToken(gameWispOAuth);
    }

    /* gen a oauth */
    private static String generateWebAuth() {
        return generateRandomString(30);
    }

    /* gen a random string */
    private static String generateRandomString(int length) {
        String randomAllowed = "01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        char[] randomChars = randomAllowed.toCharArray();
        char[] randomBuffer;

        randomBuffer = new char[length];
        SecureRandom random = new SecureRandom();
        for (int i = 0; i < randomBuffer.length; i++) {
            randomBuffer[i] = randomChars[random.nextInt(randomChars.length)];
        }
        return new String(randomBuffer);
    }

    /*
     * doRefreshGameWispToken
     *
     */
    public void doRefreshGameWispToken() {

        long curTime = System.currentTimeMillis() / 1000L;

        if (!dataStore.exists("settings", "gameWispRefreshTime")) {
            dataStore.set("settings", "gameWispRefreshTime", String.valueOf(curTime));
        }

        ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
        service.scheduleAtFixedRate(() -> {
            Thread.currentThread().setName("me.mast3rplan.phantombot.PhantomBot::doRefreshGameWispToken");

            long curTime1 = System.currentTimeMillis() / 1000L;
            String lastRunStr = dataStore.GetString("settings", "", "gameWispRefreshTime");
            long lastRun = Long.parseLong(lastRunStr);
            if ((curTime1 - lastRun) > (10 * 24 * 60 * 60)) {
                // 10 days, token expires every 35.
                dataStore.set("settings", "gameWispRefreshTime", String.valueOf(curTime1));
                updateGameWispTokens(GameWispAPIv1.instance().refreshToken());
            }
        }, 0, 1, TimeUnit.DAYS);
    }

    /*
     * doCheckPhantomBotUpdate
     */
    private void doCheckPhantomBotUpdate() {
        ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
        service.scheduleAtFixedRate(() -> {
            Thread.currentThread().setName("me.mast3rplan.phantombot.PhantomBot::doCheckPhantomBotUpdate");

            String[] newVersionInfo = GitHubAPIv3.instance().CheckNewRelease();
            if (newVersionInfo != null) {
                try {
                    Thread.sleep(6000);
                    print("");
                    print("New PhantomBot Release Detected: " + newVersionInfo[0]);
                    print("Release Changelog: https://github.com/PhantomBot/PhantomBot/releases/" + newVersionInfo[0]);
                    print("Download Link: " + newVersionInfo[1]);
                    print("A reminder will be provided in 24 hours!");
                    print("");
                } catch (InterruptedException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
                
                if (webEnabled) {
                    dataStore.set("settings", "newrelease_info", newVersionInfo[0] + "|" + newVersionInfo[1]);
                }
            } else {
                dataStore.del("settings", "newrelease_info");
            }
        }, 0, 24, TimeUnit.HOURS);
    }

    /* Set the twitch cache */
    public void setTwitchCacheReady(String twitchCacheReady) {
        PhantomBot.twitchCacheReady = twitchCacheReady;
        Script.global.defineProperty("twitchCacheReady", PhantomBot.twitchCacheReady, 0);
    }

    /* Load the game list */
    public void loadGameList(DataStore dataStore) {
        try {
            if (new File("./conf/game_list.txt").exists()) {
                long lastModified = new File("./conf/game_list.txt").lastModified();
                long dbLastModified = dataStore.GetLong("settings", "", "gameListModified");
                if (lastModified > dbLastModified) {
                    print("Processing New Game List File");

                    print("Loading into database...");
                    String data = FileUtils.readFileToString(new File("./conf/game_list.txt"));
                    String[] lines = data.replaceAll("\\r", "").split("\\n");
                    dataStore.setbatch("gamelist", lines, lines);

                    print("Creating cache file for Control Panel...");

                    if (!new File ("./web/panel/js").exists()) new File ("./web/panel/js").mkdirs();

                    String string = "// PhantomBot Control Panel Game List\r\n// Generated by PhantomBot Core\r\n\r\n$.gamesList = [";
                    Files.write(Paths.get("./web/panel/js/games.js"), string.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);

                    for (String line : lines) {
                        string = "'" + line.replace("'", "") + "', \r\n";
                        Files.write(Paths.get("./web/panel/js/games.js"), string.getBytes(StandardCharsets.UTF_8), StandardOpenOption.APPEND);
                        string = "";
                    }

                    string += "];";
                    Files.write(Paths.get("./web/panel/js/games.js"), string.getBytes(StandardCharsets.UTF_8), StandardOpenOption.APPEND);
                    print("Completed Processing.");

                    dataStore.SetLong("settings", "", "gameListModified", lastModified);
                }
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    /**
     * Backup the database, keeping so many days.
     */
    private void doBackupSQLiteDB() {

        if (!dataStoreType.equals("sqlite3store")) {
            return;
        }

        ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
        service.scheduleAtFixedRate(() -> {
            Thread.currentThread().setName("me.mast3rplan.phantombot.PhantomBot::doBackupSQLiteDB");

            SimpleDateFormat datefmt = new SimpleDateFormat("ddMMyyyy.hhmmss");
            datefmt.setTimeZone(TimeZone.getTimeZone(timeZone));
            String timestamp = datefmt.format(new Date());

            dataStore.backupSQLite3("phantombot.auto.backup." + timestamp + ".db");

            try {
                Iterator dirIterator = FileUtils.iterateFiles(new File("./dbbackup"), new WildcardFileFilter("phantombot.auto.*"), null);
                while (dirIterator.hasNext()) {
                    File backupFile = (File) dirIterator.next();
                    if (FileUtils.isFileOlder(backupFile, System.currentTimeMillis() - (86400000 * backupSQLiteKeepDays))) {
                        FileUtils.deleteQuietly(backupFile);
                    }
                }
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("Failed to clean up database backup directory: " + ex.getMessage());
            }
        }, 0, backupSQLiteHourFrequency, TimeUnit.HOURS);
    }
}
