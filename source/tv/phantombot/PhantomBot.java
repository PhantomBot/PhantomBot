/*
 * Copyright (C) 2016-2018 phantombot.tv
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

package tv.phantombot;

import net.engio.mbassy.listener.Handler;

import com.gmt2001.Logger;
import com.gmt2001.datastore.DataStore;
import com.gmt2001.datastore.IniStore;
import com.gmt2001.datastore.MySQLStore;
import com.gmt2001.datastore.SqliteStore;
import com.gmt2001.datastore.H2Store;
import com.gmt2001.TwitchAPIv5;
import com.gmt2001.YouTubeAPIv3;
import com.gmt2001.datastore.DataStoreConverter;

import com.illusionaryone.GameWispAPIv1;
import com.illusionaryone.GitHubAPIv3;
import com.illusionaryone.GoogleURLShortenerAPIv1;
import com.illusionaryone.NoticeTimer;
import com.illusionaryone.SingularityAPI;
import com.illusionaryone.TwitchAlertsAPIv1;
import com.illusionaryone.TwitterAPI;
import com.illusionaryone.DataRenderServiceAPIv1;

import com.scaniatv.CustomAPI;
import com.scaniatv.TipeeeStreamAPIv1;
import com.scaniatv.StreamElementsAPIv2;
import com.scaniatv.BotImporter;
import com.scaniatv.GenerateLogs;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintStream;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.charset.Charset;
import java.nio.file.StandardOpenOption;

import java.net.BindException;
import java.net.ServerSocket;

import java.security.SecureRandom;

import java.text.SimpleDateFormat;

import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.ArrayList;
import java.util.Map.Entry;
import java.util.Properties;
import java.util.TimeZone;
import java.util.TreeSet;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import tv.phantombot.cache.DonationsCache;
import tv.phantombot.cache.EmotesCache;
import tv.phantombot.cache.FollowersCache;
import tv.phantombot.cache.TipeeeStreamCache;
import tv.phantombot.cache.StreamElementsCache;
import tv.phantombot.cache.TwitchCache;
import tv.phantombot.cache.TwitterCache;
import tv.phantombot.cache.UsernameCache;
import tv.phantombot.cache.ViewerListCache;
import tv.phantombot.console.ConsoleInputListener;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.Listener;
import tv.phantombot.event.twitch.bits.TwitchBitsEvent;
import tv.phantombot.event.command.CommandEvent;
import tv.phantombot.event.console.ConsoleInputEvent;
import tv.phantombot.event.gamewisp.GameWispAnniversaryEvent;
import tv.phantombot.event.gamewisp.GameWispSubscribeEvent;
import tv.phantombot.event.irc.channel.IrcChannelJoinEvent;
import tv.phantombot.event.irc.channel.IrcChannelUserModeEvent;
import tv.phantombot.event.irc.complete.IrcJoinCompleteEvent;
import tv.phantombot.event.irc.message.IrcChannelMessageEvent;
import tv.phantombot.event.irc.message.IrcPrivateMessageEvent;
import tv.phantombot.event.twitch.subscriber.*;
import tv.phantombot.event.twitch.follower.TwitchFollowEvent;
import tv.phantombot.event.twitch.host.TwitchHostedEvent;
import tv.phantombot.event.twitch.offline.TwitchOfflineEvent;
import tv.phantombot.event.twitch.online.TwitchOnlineEvent;
import tv.phantombot.event.twitter.TwitterRetweetEvent;
import tv.phantombot.event.twitch.clip.TwitchClipEvent;
import tv.phantombot.httpserver.HTTPServer;
import tv.phantombot.httpserver.HTTPSServer;
import tv.phantombot.panel.PanelSocketSecureServer;
import tv.phantombot.panel.PanelSocketServer;
import tv.phantombot.panel.NewPanelSocketServer;
import tv.phantombot.script.Script;
import tv.phantombot.script.ScriptApi;
import tv.phantombot.script.ScriptEventManager;
import tv.phantombot.script.ScriptManager;
import tv.phantombot.script.ScriptFileWatcher;
import tv.phantombot.twitchwsirc.chat.Session;
import tv.phantombot.twitchwsirc.pubsub.TwitchPubSub;
import tv.phantombot.twitchwsirc.host.TwitchWSHostIRC;
import tv.phantombot.ytplayer.YTWebSocketServer;
import tv.phantombot.ytplayer.YTWebSocketSecureServer;
import tv.phantombot.discord.DiscordAPI;

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
    private Boolean testPanelServer;
    private int basePort;
    private String bindIP;
    private int ytSocketPort;
    private int panelSocketPort;

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

    /* TipeeeStream Information */
    private String tipeeeStreamOAuth = "";
    private int tipeeeStreamLimit = 5;

    /* StreamElements Information */
    private String streamElementsJWT = "";
    private String streamElementsID = "";
    private int streamElementsLimit = 5;

    /* GameWisp Information */
    private String gameWispOAuth;
    private String gameWispRefresh;

    /* Notice Timer and Handling */
    private NoticeTimer noticeTimer;

    /* Discord Configuration */
    private String discordToken = "";

    /* PhantomBot Commands API Configuration */
    private String dataRenderServiceAPIToken = "";
    private String dataRenderServiceAPIURL = "";

    /* Caches */
    private FollowersCache followersCache;
    private DonationsCache twitchAlertsCache;
    private EmotesCache emotesCache;
    private TwitterCache twitterCache;
    private TwitchCache twitchCache;
    private UsernameCache usernameCache;
    private TipeeeStreamCache tipeeeStreamCache;
    private ViewerListCache viewerListCache;
    private StreamElementsCache streamElementCache;
    public static String twitchCacheReady = "false";

    /* Socket Servers */
    private YTWebSocketServer youtubeSocketServer;
    private YTWebSocketSecureServer youtubeSocketSecureServer;
    private PanelSocketServer panelSocketServer;
    private NewPanelSocketServer newPanelSocketServer;
    private PanelSocketSecureServer panelSocketSecureServer;
    private HTTPServer httpServer;
    private HTTPSServer httpsServer;
    private int socketServerTasksSize;

    /* PhantomBot Information */
    private static PhantomBot instance;
    public static Boolean reloadScripts = false;
    public static Boolean enableDebugging = false;
    public static Boolean enableDebuggingLogOnly = false;
    public static Boolean enableRhinoDebugger = false;
    public static String timeZone = "GMT";
    public static Boolean useMessageQueue = true;
    public static Boolean twitch_tcp_nodelay = true;
    public static Boolean betap = false;
    public static Boolean isInExitState = false;
    public Boolean isExiting = false;
    private Boolean interactive;
    private Boolean resetLogin = false;

    /* Other Information */
    private static Boolean newSetup = false;
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
        return "Developers: PhantomIndex, Kojitsari, ScaniaTV, Zackery (Zelakto) & IllusionaryOne";
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
     * Checks port availability.
     *
     * @param {int} port
     */
    public void checkPortAvailabity(int port) {
        ServerSocket serverSocket = null;
        try {
            serverSocket = bindIP.isEmpty() ? new ServerSocket(port) : new ServerSocket(port, 1, java.net.InetAddress.getByName(bindIP));
            serverSocket.setReuseAddress(true);
        } catch (IOException e) {
            com.gmt2001.Console.err.println("Port is already in use: " + port);
            com.gmt2001.Console.err.println("Ensure that another copy of PhantomBot is not running.");
            com.gmt2001.Console.err.println("If another copy is not running, try to change baseport in ./config/botlogin.txt");
            com.gmt2001.Console.err.println("PhantomBot will now exit.");
            System.exit(0);
        } finally {
            if (serverSocket != null) {
                try {
                    serverSocket.close();
                } catch (IOException e) {
                    com.gmt2001.Console.err.println("Unable to close port for testing: " + port);
                    com.gmt2001.Console.err.println("PhantomBot will now exit.");
                    System.exit(0);
                }
            }
        }
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
        this.bindIP = this.pbProperties.getProperty("bindIP", "");
        this.ytSocketPort = Integer.parseInt(this.pbProperties.getProperty("ytsocketport", String.valueOf((this.basePort + 3))));
        this.panelSocketPort = Integer.parseInt(this.pbProperties.getProperty("panelsocketport", String.valueOf((this.basePort + 4))));
        this.webOAuth = this.pbProperties.getProperty("webauth");
        this.webOAuthThro = this.pbProperties.getProperty("webauthro");
        this.webEnabled = this.pbProperties.getProperty("webenable", "true").equalsIgnoreCase("true");
        this.musicEnabled = this.pbProperties.getProperty("musicenable", "true").equalsIgnoreCase("true");
        this.useHttps = this.pbProperties.getProperty("usehttps", "false").equalsIgnoreCase("true");
        this.socketServerTasksSize = Integer.parseInt(this.pbProperties.getProperty("wstasksize", "200"));
        this.testPanelServer = this.pbProperties.getProperty("testpanelserver", "false").equalsIgnoreCase("true");

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

        /* Set the TipeeeStream variables */
        this.tipeeeStreamOAuth = this.pbProperties.getProperty("tipeeestreamkey", "");
        this.tipeeeStreamLimit = Integer.parseInt(this.pbProperties.getProperty("tipeeestreamlimit", "5"));

        /* Set the StreamElements variables */
        this.streamElementsJWT = this.pbProperties.getProperty("streamelementsjwt", "");
        this.streamElementsID = this.pbProperties.getProperty("streamelementsid", "");
        this.streamElementsLimit = Integer.parseInt(this.pbProperties.getProperty("streamelementslimit", "5"));

        /* Set the PhantomBot Commands API variables */
        this.dataRenderServiceAPIToken = this.pbProperties.getProperty("datarenderservicetoken", "");
        this.dataRenderServiceAPIURL = this.pbProperties.getProperty("datarenderserviceurl", "https://drs.phantombot.tv");

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

        /* Set the tcp delay toggle. Having this set to true uses a bit more bandwidth but sends messages to Twitch faster. */
        PhantomBot.twitch_tcp_nodelay = this.pbProperties.getProperty("twitch_tcp_nodelay", "true").equalsIgnoreCase("true");

        /* Setting for scania */
        PhantomBot.betap = this.pbProperties.getProperty("betap", "false").equalsIgnoreCase("true");

        /*
         * Set the message limit for session.java to use, note that Twitch rate limits at 100 messages in 30 seconds
         * for moderators.  For non-moderators, the maximum is 20 messages in 30 seconds. While it is not recommended
         * to go above anything higher than 19 in case the bot is ever de-modded, the option is available but is
         * capped at 100.0.
         */
        PhantomBot.messageLimit = Math.floor(Double.parseDouble(this.pbProperties.getProperty("msglimit30", "19.0")));
        if (PhantomBot.messageLimit > 99.0) {
            PhantomBot.messageLimit = 99.0;
        } else if (PhantomBot.messageLimit < 19.0) {
            PhantomBot.messageLimit = 19.0;
        }

        // *Not currently being used.*
        // If this is false the bot won't limit the bot to 1 message every 1.5 second. It will still limit to 19/30 though.
        PhantomBot.useMessageQueue = this.pbProperties.getProperty("usemessagequeue", "true").equals("true");

        /* Set the whisper limit for session.java to use. -- Currently Not Used -- */
        PhantomBot.whisperLimit = Double.parseDouble(this.pbProperties.getProperty("whisperlimit60", "60.0"));

        /* Set the client id for the twitch api to use */
        this.clientId = this.pbProperties.getProperty("clientid", "7wpchwtqz7pvivc3qbdn1kajz42tdmb");

        /* Set any SQLite backup options. */
        this.backupSQLiteAuto = this.pbProperties.getProperty("backupsqliteauto", "true").equalsIgnoreCase("true");
        this.backupSQLiteHourFrequency = Integer.parseInt(this.pbProperties.getProperty("backupsqlitehourfrequency", "24"));
        this.backupSQLiteKeepDays = Integer.parseInt(this.pbProperties.getProperty("backupsqlitekeepdays", "5"));

        /* Load up a new SecureRandom for the scripts to use */
        random = new SecureRandom();

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
                print("Could not create a connection with MySQL Server. PhantomBot now shutting down...");
                System.exit(0);
            }
            /* Convert to MySql */
            if (IniStore.instance().GetFileList().length > 0 && MySQLStore.instance().GetFileList().length == 0) {
                DataStoreConverter.convertDataStore(MySQLStore.instance(), IniStore.instance());
            } else if (SqliteStore.instance().GetFileList().length > 0  && MySQLStore.instance().GetFileList().length == 0) {
                DataStoreConverter.convertDataStore(MySQLStore.instance(), SqliteStore.instance());
            }
        } else if (dataStoreType.equalsIgnoreCase("h2store")) {
            dataStore = H2Store.instance();

            if (dataStore.CreateConnection("", "", "") == null) {
                print("Could not create a connection with H2 Database. PhantomBot now shutting down...");
                System.exit(0);
            }

            if (SqliteStore.instance().GetFileList().length > 0 && H2Store.instance().GetFileList().length == 0) {
                DataStoreConverter.convertDataStore(H2Store.instance(), SqliteStore.instance());
            }
        } else {
            dataStoreType = "sqlite3store";
            dataStore = SqliteStore.instance();

            /* Convert the inistore to sqlite if the inistore exists and the db is empty */
            if (IniStore.instance().GetFileList().length > 0 && SqliteStore.instance().GetFileList().length == 0) {
                DataStoreConverter.convertDataStore(SqliteStore.instance(), IniStore.instance());
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
        TwitchAPIv5.instance().SetClientID(this.clientId);

        /* Set the oauth key in the Twitch api. */
        if (!this.apiOAuth.isEmpty()) {
            TwitchAPIv5.instance().SetOAuth(this.apiOAuth);
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

        /* Set the TipeeeStream oauth key. */
        if (!tipeeeStreamOAuth.isEmpty()) {
            TipeeeStreamAPIv1.instance().SetOauth(tipeeeStreamOAuth);
            TipeeeStreamAPIv1.instance().SetLimit(tipeeeStreamLimit);
        }

        /* Set the StreamElements JWT token. */
        if (!streamElementsJWT.isEmpty() && !streamElementsID.isEmpty()) {
            StreamElementsAPIv2.instance().SetJWT(streamElementsJWT);
            StreamElementsAPIv2.instance().SetID(streamElementsID);
            StreamElementsAPIv2.instance().SetLimit(streamElementsLimit);
        }

        /* Set the PhantomBot Commands authentication key. */
        if (!dataRenderServiceAPIToken.isEmpty()) {
            DataRenderServiceAPIv1.instance().setAPIURL(dataRenderServiceAPIURL);
            DataRenderServiceAPIv1.instance().setAPIKey(dataRenderServiceAPIToken);
        }

        /* Start things and start loading the scripts. */
        this.init();

        /* Start a session instance and then connect to WS-IRC @ Twitch. */
        this.session = Session.instance(this.channelName, this.botName, this.oauth).connect();

        /* Start a host checking instance. */
        if (apiOAuth.length() > 0 && checkModuleEnabled("./handlers/hostHandler.js")) {
            this.wsHostIRC = TwitchWSHostIRC.instance(this.channelName, this.apiOAuth, EventBus.instance());
        }

        /* Check if the OS is Linux. */
        if (SystemUtils.IS_OS_LINUX && !interactive) {
            try {
                java.lang.management.RuntimeMXBean runtime = java.lang.management.ManagementFactory.getRuntimeMXBean();
                int pid = Integer.parseInt(runtime.getName().split("@")[0]);

                File file = new File("PhantomBot." + this.botName + ".pid");

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
        return RepoVersion.getNightlyBuild();
    }

    /*
     * Tells you if the build is a pre-release.
     *
     * @return {boolean}
     */
    public Boolean isPrerelease() {
        return RepoVersion.getPrereleaseBuild();
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
    public String getChannelName() {
        return this.channelName;
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
     * Give's you the session for that channel.
     *
     * @return {session}
     */
    public Session getSession() {
        return this.session;
    }

    /*
     * Method that returns the message limit
     *
     * @return {double} messageLimit
     */
    public static double getMessageLimit() {
        return messageLimit;
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
     * Method that returns the basic bot info.
     *
     * @return {String}
     */
    public String getBotInformation() {
        return "\r\nJava Version: " + System.getProperty("java.runtime.version") + "\r\nOS Version: " + System.getProperty("os.name") + " "
               + System.getProperty("os.version") + " (" + System.getProperty("os.arch") + ")\r\nPanel Version: " + RepoVersion.getPanelVersion() + "\r\n" + getBotInfo() + "\r\n\r\n";
    }

    /*
     * Loads everything up.
     */
    private void init() {
        /* Is the web toggle enabled? */
        if (webEnabled) {
            try {
                checkPortAvailabity(basePort);
                checkPortAvailabity(panelSocketPort);

                /* Is the music toggled on? */
                if (musicEnabled) {
                    checkPortAvailabity(ytSocketPort);
                    if (useHttps) {
                        /* Set the music player server */
                        youtubeSocketSecureServer = new YTWebSocketSecureServer(bindIP, ytSocketPort, youtubeOAuth, youtubeOAuthThro, httpsFileName, httpsPassword, socketServerTasksSize);
                        /* Start this youtube socket server */
                        youtubeSocketSecureServer.start();
                        print("YouTubeSocketSecureServer accepting connections on port: " + ytSocketPort + " (SSL)");
                    } else {
                        /* Set the music player server */
                        youtubeSocketServer = new YTWebSocketServer(bindIP, ytSocketPort, youtubeOAuth, youtubeOAuthThro);
                        /* Start this youtube socket server */
                        youtubeSocketServer.start();
                        print("YouTubeSocketServer accepting connections on port: " + ytSocketPort);
                    }
                }

                if (useHttps) {
                    if (testPanelServer) {
                        newPanelSocketServer = new NewPanelSocketServer(panelSocketPort, webOAuth, webOAuthThro, httpsFileName, httpsPassword);
                        newPanelSocketServer.start();
                        print("TEST PanelSocketSecureServer accepting connections on port: " + panelSocketPort + " (SSL)");
                    } else {
                        /* Set up the panel socket server */
                        panelSocketSecureServer = new PanelSocketSecureServer(bindIP, panelSocketPort, webOAuth, webOAuthThro, httpsFileName, httpsPassword, socketServerTasksSize);
                        /* Start the panel socket server */
                        panelSocketSecureServer.start();
                        print("PanelSocketSecureServer accepting connections on port: " + panelSocketPort + " (SSL)");
                    }

                    /* Set up a new https server */
                    httpsServer = new HTTPSServer(bindIP, (basePort), oauth, webOAuth, panelUsername, panelPassword, httpsFileName, httpsPassword);
                    print("HTTPS server accepting connection on port: " + basePort + " (SSL)");
                } else {
                    if (testPanelServer) {
                        newPanelSocketServer = new NewPanelSocketServer(panelSocketPort, webOAuth, webOAuthThro);
                        newPanelSocketServer.start();
                        print("TEST PanelSocketServer accepting connections on port: " + panelSocketPort);
                    } else {
                        /* Set up the panel socket server */
                        panelSocketServer = new PanelSocketServer(bindIP, panelSocketPort, webOAuth, webOAuthThro);
                        /* Set up the NEW panel socket server */
                        /* Start the panel socket server */
                        panelSocketServer.start();
                        print("PanelSocketServer accepting connections on port: " + panelSocketPort);
                    }

                    /* Set up a new http server */
                    httpServer = new HTTPServer(bindIP, (basePort), oauth, webOAuth, panelUsername, panelPassword);
                    print("HTTP server accepting connection on port: " + basePort);
                }
            } catch (Exception ex) {
                print("Exception occurred in one of the socket based services, PhantomBot will now exit.");
                System.exit(0);
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
            data += "// Configuration for YTPlayer\r\n";
            data += "// Automatically Generated by PhantomBot at Startup\r\n";
            data += "// Do NOT Modify! Overwritten when PhantomBot is restarted!\r\n";
            data += "var playerPort = " + ytSocketPort + ";\r\n";
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

        /* Create configuration for YTPlayer Playlist v2.0 for the WS port. */
        data = "";
        try {
            data += "//Configuration for YTPlayer\r\n";
            data += "//Automatically Generated by PhantomBot at Startup\r\n";
            data += "//Do NOT Modify! Overwritten when PhantomBot is restarted!\r\n";
            data += "var playerPort = " + ytSocketPort + ";\r\n";
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
            data += "// Configuration for Control Panel\r\n";
            data += "// Automatically Generated by PhantomBot at Startup\r\n";
            data += "// Do NOT Modify! Overwritten when PhantomBot is restarted!\r\n";
            data += "var panelSettings = {\r\n";
            data += "    panelPort   : " + panelSocketPort + ",\r\n";
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

            byte[] bytes = data.getBytes(StandardCharsets.UTF_8);

            /* Write the data to that file */
            Files.write(Paths.get("./web/panel/js/panelConfig.js"), bytes, StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);

            // If betap write the file in that folder too.
            if (PhantomBot.betap) {
            	Files.write(Paths.get("./web/beta-panel/js/utils/panelConfig.js"), bytes, StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        /* Create configuration for Read-Only Access to WS port. */
        data = "";
        try {
            data += "// Configuration for Control Panel\r\n";
            data += "// Automatically Generated by PhantomBot at Startup\r\n";
            data += "// Do NOT Modify! Overwritten when PhantomBot is restarted!\r\n";
            data += "var panelSettings = {\r\n";
            data += "    panelPort   : " + panelSocketPort + ",\r\n";
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
        Script.global.defineProperty("twitch", TwitchAPIv5.instance(), 0);
        Script.global.defineProperty("botName", botName.toLowerCase(), 0);
        Script.global.defineProperty("channelName", channelName.toLowerCase(), 0);
        Script.global.defineProperty("ownerName", ownerName.toLowerCase(), 0);
        Script.global.defineProperty("ytplayer", (useHttps ? youtubeSocketSecureServer : youtubeSocketServer), 0);
        if (testPanelServer) {
            Script.global.defineProperty("panelsocketserver", newPanelSocketServer, 0);
        } else {
            Script.global.defineProperty("panelsocketserver", (useHttps ? panelSocketSecureServer : panelSocketServer), 0);
        }
        Script.global.defineProperty("random", random, 0);
        Script.global.defineProperty("youtube", YouTubeAPIv3.instance(), 0);
        Script.global.defineProperty("shortenURL", GoogleURLShortenerAPIv1.instance(), 0);
        Script.global.defineProperty("gamewisp", GameWispAPIv1.instance(), 0);
        Script.global.defineProperty("twitter", TwitterAPI.instance(), 0);
        Script.global.defineProperty("twitchCacheReady", PhantomBot.twitchCacheReady, 0);
        Script.global.defineProperty("isNightly", isNightly(), 0);
        Script.global.defineProperty("isPrerelease", isPrerelease(), 0);
        Script.global.defineProperty("version", botVersion(), 0);
        Script.global.defineProperty("changed", newSetup, 0);
        Script.global.defineProperty("discordAPI", DiscordAPI.instance(), 0);
        Script.global.defineProperty("hasDiscordToken", hasDiscordToken(), 0);
        Script.global.defineProperty("customAPI", CustomAPI.instance(), 0);
        Script.global.defineProperty("dataRenderServiceAPI", DataRenderServiceAPIv1.instance(), 0);

        /* open a new thread for when the bot is exiting */
        Thread thread = new Thread(() -> {
            onExit();
        }, "tv.phantombot.PhantomBot::onExit");

        /* Get the un time for that new thread we just created */
        Runtime.getRuntime().addShutdownHook(thread);

        /* And finally try to load init, that will then load the scripts */
        try {
            ScriptManager.loadScript(new File("./scripts/init.js"));
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        // Moved this to debug only. People are already asking questions.
        if (PhantomBot.enableDebugging) {
            /* Check for bot verification. */
            print("Bot Verification Status: " + (TwitchAPIv5.instance().getBotVerified(this.botName) ? "" : " NOT ") + "Verified.");
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
        PhantomBot.isInExitState = true;

        print("Stopping all events and message dispatching...");
        ScriptFileWatcher.instance().kill();
        ScriptEventManager.instance().kill();

        /* Gonna need a way to pass this to all channels */
        if (PhantomBot.instance().getSession() != null) {
            PhantomBot.instance().getSession().close();
        }

        /* Shutdown all caches */
        if (followersCache != null) {
            print("Terminating the Twitch channel follower cache...");
            FollowersCache.killall();
        }

        if (twitchAlertsCache != null) {
            print("Terminating the Streamlabs cache...");
            DonationsCache.killall();
        }

        if (tipeeeStreamCache != null) {
            print("Terminating the TipeeeStream cache...");
            TipeeeStreamCache.killall();
        }

        if (streamElementCache != null) {
            print("Terminating the StreamElementsCache cache...");
            StreamElementsCache.killall();
        }

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
            if (!useHttps) {
                httpServer.close();
            } else {
                httpsServer.close();
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
        print("Closing the database...");
        dataStore.CloseConnection();

        print(this.botName + " is exiting.");
    }

    /*
     * Connected to Twitch.
     *
     */
    @Handler
    public void ircJoinComplete(IrcJoinCompleteEvent event) {
        /* Check if the bot already joined once. */
        if (joined) {
            return;
        }

        joined = true;

        com.gmt2001.Console.debug.println("ircJoinComplete::" + this.channelName);

        /* Start a pubsub instance here. */
        if (this.oauth.length() > 0 && checkDataStore("chatModerator", "moderationLogs")) {
            this.pubSubEdge = TwitchPubSub.instance(this.channelName, TwitchAPIv5.instance().getChannelId(this.channelName), TwitchAPIv5.instance().getChannelId(this.botName), this.oauth);
        }

        /* Load the caches for each channels */
        this.twitchCache = TwitchCache.instance(this.channelName);
        this.emotesCache = EmotesCache.instance(this.channelName);
        this.followersCache = FollowersCache.instance(this.channelName);
        this.viewerListCache = ViewerListCache.instance(this.channelName);

        /* Start the donations cache if the keys are not null and the module is enabled */
        if (this.twitchAlertsKey != null && !this.twitchAlertsKey.isEmpty() && checkModuleEnabled("./handlers/donationHandler.js")) {
            this.twitchAlertsCache = DonationsCache.instance(this.channelName);
        }

        /* Start the TipeeeStream cache if the keys are not null and the module is enabled. */
        if (this.tipeeeStreamOAuth != null && !this.tipeeeStreamOAuth.isEmpty() && checkModuleEnabled("./handlers/tipeeeStreamHandler.js")) {
            this.tipeeeStreamCache = TipeeeStreamCache.instance(this.channelName);
        }

        /* Start the StreamElements cache if the keys are not null and the module is enabled. */
        if (this.streamElementsJWT != null && !this.streamElementsJWT.isEmpty() && checkModuleEnabled("./handlers/streamElementsHandler.js")) {
            this.streamElementCache = StreamElementsCache.instance(this.channelName);
        }

        /* Start the twitter cache if the keys are not null and the module is enabled */
        if (this.twitterAuthenticated && checkModuleEnabled("./handlers/twitterHandler.js")) {
            this.twitterCache = TwitterCache.instance(this.channelName);
        }

        /* Start the notice timer and notice handler. */
        if (pbProperties.getProperty("testnotices", "false").equals("true")) {
            this.noticeTimer = NoticeTimer.instance(this.channelName, this.session);
        }

        /* Export these to the $. api for the sripts to use */
        Script.global.defineProperty("twitchcache", this.twitchCache, 0);
        Script.global.defineProperty("emotes", this.emotesCache, 0);
        Script.global.defineProperty("session", this.session, 0);
        Script.global.defineProperty("usernameCache", this.viewerListCache, 0);
    }

    /*
     * Get private messages from Twitch.
     *
     */
    @Handler
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
                        EventBus.instance().postAsync(new IrcChannelUserModeEvent(this.session, this.session.getBotName(), "O", true));
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
    @Handler
    public void ircUserMode(IrcChannelUserModeEvent event) {
        /* Check to see if Twitch sent a mode event for the bot name */
        if (event.getUser().equalsIgnoreCase(this.botName) && event.getMode().equalsIgnoreCase("o")) {
            if (!event.getAdd()) {
                event.getSession().getModerationStatus();
            }
            /* Allow the bot to sends message to this session */
            event.getSession().setAllowSendMessages(event.getAdd());
        }
    }

    /*
     * messages from Twitch chat
     *
     */
    @Handler
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
    @Handler
    public void consoleInput(ConsoleInputEvent event) {
        String message = event.getMessage();
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

        if (message.equalsIgnoreCase("exportpoints")) {
            print("[CONSOLE] Executing exportpoints, this can take a bit of time.");

            String[] headers = new String[] {"Username", "Seconds", "Points"};
            String[] keys = dataStore.GetKeyList("points", "");
            List<String[]> values = new ArrayList<String[]>();

            for (int i = 0; i < keys.length; i++) {
                String[] str = new String[3];
                str[0] = keys[i];
                str[1] = (dataStore.exists("time", keys[i]) ? dataStore.get("time", keys[i]) : "0");
                str[2] = dataStore.get("points", keys[i]);

                values.add(str);
            }

            toCSV(headers, values, "points_export.csv");
            print("[CONSOLE] Points have been exported to points_export.csv");
        }

        if (message.equalsIgnoreCase("createcmdlist")) {
            print("[CONSOLE] Executing createcmdlist, this can take a bit of time.");

            String[] headers = new String[] {"Command", "Permission", "Module"};
            String[] keys = dataStore.GetKeyList("permcom", "");
            List<String[]> values = new ArrayList<String[]>();

            for (int i = 0; i < keys.length; i++) {
                String[] str = new String[3];
                str[0] = ("!" + keys[i]);
                str[1] = dataStore.get("groups", dataStore.get("permcom", keys[i]));
                str[2] = Script.callMethod("getCommandScript", (keys[i].contains(" ") ? keys[i].substring(0, keys[i].indexOf(" ")) : keys[i]));

                // If the module is disabled, return.
                if (str[2].contains("Undefined")) {
                    continue;
                }
                values.add(str);
            }

            toCSV(headers, values, "command_list.csv");
            print("[CONSOLE] Command list has been created under command_list.csv");
        }

        if (message.equalsIgnoreCase("createcustomcmdlist")) {
            print("[CONSOLE] Executing createcustomcmdlist, this can take a bit of time.");

            String[] headers = new String[] {"Command", "Permission"};
            String[] keys = dataStore.GetKeyList("command", "");
            List<String[]> values = new ArrayList<String[]>();

            for (int i = 0; i < keys.length; i++) {
                String[] str = new String[2];
                str[0] = ("!" + keys[i]);
                str[1] = dataStore.get("groups", dataStore.get("permcom", keys[i]));

                values.add(str);
            }

            toCSV(headers, values, "custom_command_list.csv");
            print("[CONSOLE] Command list has been created under custom_command_list.csv");
        }

        if (message.equalsIgnoreCase("retweettest")) {
            if (argument == null) {
                com.gmt2001.Console.out.println(">> retweettest requires a Twitter ID (or Twitter IDs)");
                return;
            }
            com.gmt2001.Console.out.println(">> Sending retweet test event");
            EventBus.instance().postAsync(new TwitterRetweetEvent(argument));
            return;
        }

        if (message.equalsIgnoreCase("botinfo")) {
            com.gmt2001.Console.out.print(getBotInformation());
            return;
        }

        if (message.equalsIgnoreCase("revloconvert")) {
            print("[CONSOLE] Executing revloconvert");
            if (arguments.length() > 0) {
                BotImporter.ImportRevlo(arguments);
            } else {
                print("You must specify the file name you want to convert.");
            }
            return;
        }

        if (message.equalsIgnoreCase("ankhconvert")) {
            print("[CONSOLE] Executing ankhconvert");
            if (arguments.length() > 0) {
                BotImporter.ImportAnkh(arguments);
            } else {
                print("You must specify the file name you want to convert.");
            }
            return;
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
            TwitchAPIv5.instance().FixFollowedTable(channelName, dataStore, false);
            return;
        }

        /* Update the followed (followers) table - forced. */
        if (message.equalsIgnoreCase("fixfollowedtable-force")) {
            print("[CONSOLE] Executing fixfollowedtable-force");
            TwitchAPIv5.instance().FixFollowedTable(channelName, dataStore, true);
            return;
        }

        if (message.equalsIgnoreCase("jointest")) {
            print("[CONSOLE] Executing jointest");
            for (int i = 0 ; i < 30; i++) {
                EventBus.instance().postAsync(new IrcChannelJoinEvent(this.session, generateRandomString(8)));
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
            EventBus.instance().postAsync(new TwitchFollowEvent(user));
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
                EventBus.instance().postAsync(new TwitchFollowEvent(randomUser + "_" + i));
            }
            return;
        }

        /* Test a subscriber event */
        if (message.equalsIgnoreCase("subscribertest")) {
            String randomUser = generateRandomString(10);
            print("[CONSOLE] Executing subscribertest (User: " + randomUser + ")");
            EventBus.instance().postAsync(new TwitchSubscriberEvent(randomUser, "1000"));
            return;
        }

        /* Test a prime subscriber event */
        if (message.equalsIgnoreCase("primesubscribertest")) {
            String randomUser = generateRandomString(10);
            print("[CONSOLE] Executing primesubscribertest (User: " + randomUser + ")");
            EventBus.instance().postAsync(new TwitchPrimeSubscriberEvent(randomUser));
            return;
        }

        /* Test a resubscriber event */
        if (message.equalsIgnoreCase("resubscribertest")) {
            String randomUser = generateRandomString(10);
            print("[CONSOLE] Executing resubscribertest (User: " + randomUser + ")");
            EventBus.instance().postAsync(new TwitchReSubscriberEvent(randomUser, "10", "1000"));
            return;
        }

        /* Test a gift sub event */
        if (message.equalsIgnoreCase("giftsubtest")) {
            String randomUser = generateRandomString(10);
            print("[CONSOLE] Executing giftsubtest (User: " + randomUser + ")");
            EventBus.instance().postAsync(new TwitchSubscriptionGiftEvent(this.channelName, randomUser, "10", "1000"));
            return;
        }

        /* Test the online event */
        if (message.equalsIgnoreCase("onlinetest")) {
            print("[CONSOLE] Executing onlinetest");
            EventBus.instance().postAsync(new TwitchOnlineEvent());
            return;
        }

        /* Test the offline event */
        if (message.equalsIgnoreCase("offlinetest")) {
            print("[CONSOLE] Executing offlinetest");
            EventBus.instance().postAsync(new TwitchOfflineEvent());
            return;
        }

        /* Test the clips event */
        if (message.equalsIgnoreCase("cliptest")) {
            String randomUser = "";
            if (argument == null) {
                randomUser = generateRandomString(10);
            } else {
                randomUser = argument[0];
            }
            print("[CONSOLE] Executing cliptest " + randomUser);
            EventBus.instance().postAsync(new TwitchClipEvent("https://clips.twitch.tv/ThisIsNotARealClipAtAll", randomUser, "Some title",
                new org.json.JSONObject("{\"medium\": \"https://clips-media-assets.twitch.tv/vod-107049351-offset-26-preview-480x272.jpg\", " +
                    "\"small\": \"https://clips-media-assets.twitch.tv/vod-107049351-offset-26-preview-260x147.jpg\", " +
                    "\"tiny\": \"https://clips-media-assets.twitch.tv/vod-107049351-offset-26-preview-86x45.jpg\"}")));
            return;
        }

        /* Test the host event */
        if (message.equalsIgnoreCase("hosttest")) {
            String randomUser = "";
            if (argument == null) {
                randomUser = generateRandomString(10);
            } else {
                randomUser = argument[0];
            }
            print("[CONSOLE] Executing hosttest " + randomUser);
            EventBus.instance().postAsync(new TwitchHostedEvent(randomUser));
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
            String sendMessage = "This is a message from Twitch.";
            if (argument != null) {
                sendMessage = String.join(" ", argument);
            }
            print("[CONSOLE] Executing bitstest");
            EventBus.instance().postAsync(new TwitchBitsEvent(this.botName, "100", sendMessage));
            return;
        }

        if (message.equalsIgnoreCase("discordreconnect")) {
        	print("[CONSOLE] Executing discordreconnect");
        	DiscordAPI.instance().reconnect();
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

        /* Writes the latest logs to a file. */
        if (message.equalsIgnoreCase("dumplogs")) {
            print("[CONSOLE] Executing dumplogs");
            GenerateLogs.writeLogs();
        }

        /* Prints the latest logs in the console. */
        if (message.equalsIgnoreCase("printlogs")) {
            print("[CONSOLE] Executing printlogs");
            GenerateLogs.printLogs();
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
                try (FileOutputStream outputStream = new FileOutputStream("./config/botlogin.txt")) {
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
        handleCommand(botName, event.getMessage());
        // Need to support channel here. command (channel) argument[1]

        /* Handle dev commands */
        if (event.getMessage().startsWith("!debug !dev")) {
            devDebugCommands(event.getMessage(), "no_id", botName, true);
        }
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
        EventBus.instance().postAsync(new CommandEvent(username, command, arguments));
    }

    /* Handle commands */
    public void handleCommandSync(String username, String command) {
        String arguments = "";

        /* Does the command have arguments? */
        if (command.contains(" ")) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }
        EventBus.instance().post(new CommandEvent(username, command, arguments));
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

            Logger.instance().log(Logger.LogType.Debug, "User: " + sender + " Issued Command: " + command + ". Id: " + id);
            Logger.instance().log(Logger.LogType.Debug, "");
        }
    }

    /* Load up main */
    public static void main(String[] args) throws IOException {
        // Move user files.
        moveUserConfig();

        /* List of properties that must exist. */
        String requiredProperties[] = new String[] { "oauth", "channel", "owner", "user" };
        String requiredPropertiesErrorMessage = "";

        if (Float.valueOf(System.getProperty("java.specification.version")) < (float) 1.8 || Float.valueOf(System.getProperty("java.specification.version")) >= (float) 1.9) {
            System.out.println("Detected Java " + System.getProperty("java.version") + ". " + "PhantomBot requires Java 8. Java 9 and above will NOT work.");
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

        /* If prompted, now that the version has been reported, exit. */
        if (args.length > 0) {
            if (args[0].equals("--version") || args[0].equals("-v")) {
                com.gmt2001.Console.out.println("PhantomBot Version: " + RepoVersion.getPhantomBotVersion() + " (" + RepoVersion.getRepoVersion() + ")");
                System.exit(1);
            }
        }

        /* Load up the bot info from the bot login file */
        try {
            if (new File("./config/botlogin.txt").exists()) {
                FileInputStream inputStream = new FileInputStream("./config/botlogin.txt");
                startProperties.load(inputStream);
                inputStream.close();
            } else {
                /* Fill in the Properties object with some default values. Note that some values are left
                 * unset to be caught in the upcoming logic to enforce settings.
                 */
                startProperties.setProperty("baseport", "25000");
                startProperties.setProperty("usehttps", "false");
                startProperties.setProperty("webenable", "true");
                startProperties.setProperty("msglimit30", "19.0");
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
            com.gmt2001.Console.debug.println("New webauth key has been generated for ./config/botlogin.txt");
            changed = true;
        }
        /* Check to see if there's a webOAuthRO set */
        if (startProperties.getProperty("webauthro") == null) {
            startProperties.setProperty("webauthro", generateWebAuth());
            com.gmt2001.Console.debug.println("New webauth read-only key has been generated for ./config/botlogin.txt");
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
            com.gmt2001.Console.debug.println("New YouTube websocket key has been generated for ./config/botlogin.txt");
            changed = true;
        }
        /* Check to see if there's a youtubeOAuthThro set */
        if (startProperties.getProperty("ytauthro") == null) {
            startProperties.setProperty("ytauthro", generateWebAuth());
            com.gmt2001.Console.debug.println("New YouTube read-only websocket key has been generated for ./config/botlogin.txt");
            changed = true;
        }

        /* Make a new botlogin with the botName, oauth or channel is not found */
        if (startProperties.getProperty("user") == null || startProperties.getProperty("oauth") == null || startProperties.getProperty("channel") == null) {
            try {

                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("Welcome to the PhantomBot setup process!\r\n");
                com.gmt2001.Console.out.print("If you have any issues please report them on our forum, Tweet at us, or join our Discord!\r\n");
                com.gmt2001.Console.out.print("Forum: https://community.phantombot.tv/\r\n");
                com.gmt2001.Console.out.print("Documentation: https://docs.phantombot.tv/\r\n");
                com.gmt2001.Console.out.print("Twitter: https://twitter.com/PhantomBot/\r\n");
                com.gmt2001.Console.out.print("Discord: https://discord.gg/rkPqDuK/\r\n");
                com.gmt2001.Console.out.print("Support PhantomBot on Patreon: https://phantombot.tv/support/\r\n");
                com.gmt2001.Console.out.print("\r\n");                

                final String os = System.getProperty("os.name").toLowerCase();

                // Detect Windows, MacOS, Linux or any other operating system.
                if (os.startsWith("win")) {
                	com.gmt2001.Console.out.print("PhantomBot has detected that your device is running Windows.\r\n");
                	com.gmt2001.Console.out.print("Here's the setup guide for Windows: https://community.phantombot.tv/t/windows-setup-guide/");
                } else if (os.startsWith("mac")) {
                	com.gmt2001.Console.out.print("PhantomBot has detected that your device is running macOS.\r\n");
                	com.gmt2001.Console.out.print("Here's the setup guide for macOS: https://community.phantombot.tv/t/macos-setup-guide/");
                } else {
                	com.gmt2001.Console.out.print("PhantomBot has detected that your device is running Linux.\r\n");
                	com.gmt2001.Console.out.print("Here's the setup guide for Ubuntu: https://community.phantombot.tv/t/ubuntu-16-04-lts-setup-guide/\r\n");
                	com.gmt2001.Console.out.print("Here's the setup guide for CentOS: https://community.phantombot.tv/t/centos-7-setup-guide/");
                }

                com.gmt2001.Console.out.print("\r\n\r\n\r\n");

                // Bot name.
                do {
                    com.gmt2001.Console.out.print("1. Please enter the bot's Twitch username: ");

                    startProperties.setProperty("user", System.console().readLine().trim().toLowerCase());
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
                com.gmt2001.Console.out.print("PhantomBot will launch in 10 seconds.\r\n");
                com.gmt2001.Console.out.print("If you're hosting the bot locally you can access the control panel here: http://localhost:25000/panel \r\n");
                com.gmt2001.Console.out.print("If you're running the bot on a server, make sure to open the following ports: \r\n");
                com.gmt2001.Console.out.print("25000, 25003, and 25004. You have to change 'localhost' to your server ip to access the panel. \r\n");

                try {
                    Thread.sleep(10000);
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
                try (FileOutputStream outputStream = new FileOutputStream("./config/botlogin.txt")) {
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
            try (FileOutputStream outputStream = new FileOutputStream("./config/botlogin.txt")) {
                outputProperties.putAll(pbProperties);
                outputProperties.store(outputStream, "PhantomBot Configuration File");
            }
            print("GameWisp Token has been refreshed.");
        } catch (IOException ex) {
            com.gmt2001.Console.err.println("!!!! CRITICAL !!!! Failed to update GameWisp Refresh Tokens into ./config/botlogin.txt! Must manually add!");
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
            Thread.currentThread().setName("tv.phantombot.PhantomBot::doRefreshGameWispToken");

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
            Thread.currentThread().setName("tv.phantombot.PhantomBot::doCheckPhantomBotUpdate");

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

    /**
     * Backup the database, keeping so many days.
     */
    private void doBackupSQLiteDB() {

        if (!dataStoreType.equals("sqlite3store")) {
            return;
        }

        ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
        service.scheduleAtFixedRate(() -> {
            Thread.currentThread().setName("tv.phantombot.PhantomBot::doBackupSQLiteDB");

            SimpleDateFormat datefmt = new SimpleDateFormat("ddMMyyyy.hhmmss");
            datefmt.setTimeZone(TimeZone.getTimeZone(timeZone));
            String timestamp = datefmt.format(new Date());

            dataStore.backupSQLite3("phantombot.auto.backup." + timestamp + ".db");

            try {
                Iterator dirIterator = FileUtils.iterateFiles(new File("./dbbackup"), new WildcardFileFilter("phantombot.auto.*"), null);
                while (dirIterator.hasNext()) {
                    File backupFile = (File) dirIterator.next();
                    if (FileUtils.isFileOlder(backupFile, (System.currentTimeMillis() - (long) (backupSQLiteKeepDays * 864e5)))) {
                        FileUtils.deleteQuietly(backupFile);
                    }
                }
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("Failed to clean up database backup directory: " + ex.getMessage());
            }
        }, 0, backupSQLiteHourFrequency, TimeUnit.HOURS);
    }

    /*
     * Method that moves the db and botlogin into a new folder (config)
     */
    private static void moveUserConfig() {
        // Check if the config folder exists.
        if (!new File("./config/").isDirectory()) {
            new File("./config/").mkdir();
        }

        // Move the db and login file. If one of these doesn't exist it means this is a new bot.
        if (!new File("phantombot.db").exists() || !new File("botlogin.txt").exists()) {
            return;
        }

        com.gmt2001.Console.out.println("Moving the phantombot.db and botlogin.txt files into ./config");

        try {
            Files.move(Paths.get("botlogin.txt"), Paths.get("./config/botlogin.txt"));
            Files.move(Paths.get("phantombot.db"), Paths.get("./config/phantombot.db"));

            try {
                new File("phantombot.db").delete();
                new File("botlogin.txt").delete();
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("Failed to delete files [phantombot.db] [botlogin.txt] [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to move files [phantombot.db] [botlogin.txt] [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
        }

        // Move audio hooks and alerts. These two files should always exists.
        if (!new File("./web/panel/js/ion-sound/sounds").exists() || !new File("./web/alerts/data").exists()) {
            return;
        }

        com.gmt2001.Console.out.println("Moving alerts and audio hooks into ./config");

        try {
            Files.move(Paths.get("./web/panel/js/ion-sound/sounds"), Paths.get("./config/audio-hooks"));
            Files.move(Paths.get("./web/alerts/data"), Paths.get("./config/gif-alerts"));

            try {
                FileUtils.deleteDirectory(new File("./web/panel/js/ion-sound/sounds"));
                FileUtils.deleteDirectory(new File("./web/alerts/data"));
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("Failed to delete old audio hooks and alerts [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to move audio hooks and alerts [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
        }
    }

    /*
     * Method to export a Java list to a csv file.
     *
     * @param {String[]} headers
     * @param {List}     values
     * @param {String}   fileName
     */
    private void toCSV(String[] headers, List<String[]> values, String fileName) {
        StringBuilder builder = new StringBuilder();
        FileOutputStream stream = null;

        // Append the headers.
        builder.append(String.join(",", headers) + "\n");

        // Append all values.
        for (String[] value : values) {
            builder.append(String.join(",", value) + "\n");
        }

        // Write the data to a file.
        try {
            // Create a new stream.
            stream = new FileOutputStream(new File(fileName));

            // Write the content.
            stream.write(builder.toString().getBytes(Charset.forName("UTF-8")));
            stream.flush();
        } catch (IOException ex) {
            com.gmt2001.Console.err.println("Failed writing data to file [IOException]: " + ex.getMessage());
        } catch (SecurityException ex) {
            com.gmt2001.Console.err.println("Failed writing data to file [SecurityException]: " + ex.getMessage());
        } finally {
            if (stream != null) {
                try {
                    stream.close();
                } catch (IOException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            }
        }
    }
}
