/*
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
package tv.phantombot;

import com.gmt2001.ExponentialBackoff;
import com.gmt2001.GamesListUpdater;
import com.gmt2001.PathValidator;
import com.gmt2001.RestartRunner;
import com.gmt2001.RollbarProvider;
import com.gmt2001.TwitchAPIv5;
import com.gmt2001.TwitchAuthorizationCodeFlow;
import com.gmt2001.TwitchClientCredentialsFlow;
import com.gmt2001.YouTubeAPIv3;
import com.gmt2001.datastore.DataStore;
import com.gmt2001.datastore.DataStoreConverter;
import com.gmt2001.datastore.H2Store;
import com.gmt2001.datastore.MySQLStore;
import com.gmt2001.datastore.SqliteStore;
import com.gmt2001.eventsub.EventSub;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpUrl;
import com.gmt2001.httpwsserver.HTTPWSServer;
import com.illusionaryone.GitHubAPIv3;
import com.illusionaryone.TwitchAlertsAPIv1;
import com.illusionaryone.TwitterAPI;
import com.scaniatv.CustomAPI;
import com.scaniatv.StreamElementsAPIv2;
import com.scaniatv.TipeeeStreamAPIv1;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.ServerSocket;
import java.net.URISyntaxException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import net.engio.mbassy.listener.Handler;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.filefilter.WildcardFileFilter;
import org.apache.commons.lang3.SystemUtils;
import org.json.JSONException;
import reactor.util.Loggers;
import tv.phantombot.CaselessProperties.Transaction;
import tv.phantombot.cache.DonationsCache;
import tv.phantombot.cache.EmotesCache;
import tv.phantombot.cache.FollowersCache;
import tv.phantombot.cache.StreamElementsCache;
import tv.phantombot.cache.TipeeeStreamCache;
import tv.phantombot.cache.TwitchCache;
import tv.phantombot.cache.TwitchTeamsCache;
import tv.phantombot.cache.UsernameCache;
import tv.phantombot.cache.ViewerListCache;
import tv.phantombot.console.ConsoleEventHandler;
import tv.phantombot.console.ConsoleInputListener;
import tv.phantombot.discord.DiscordAPI;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.Listener;
import tv.phantombot.event.command.CommandEvent;
import tv.phantombot.event.irc.channel.IrcChannelUserModeEvent;
import tv.phantombot.event.irc.complete.IrcJoinCompleteEvent;
import tv.phantombot.event.irc.message.IrcChannelMessageEvent;
import tv.phantombot.event.irc.message.IrcPrivateMessageEvent;
import tv.phantombot.event.jvm.PropertiesReloadedEvent;
import tv.phantombot.event.jvm.ShutdownEvent;
import tv.phantombot.httpserver.HTTPAuthenticatedHandler;
import tv.phantombot.httpserver.HTTPNoAuthHandler;
import tv.phantombot.httpserver.HTTPOAuthHandler;
import tv.phantombot.httpserver.HTTPPanelAndYTHandler;
import tv.phantombot.panel.WsAlertsPollsHandler;
import tv.phantombot.panel.WsPanelHandler;
import tv.phantombot.panel.WsPanelRemoteLoginHandler;
import tv.phantombot.script.Script;
import tv.phantombot.script.ScriptEventManager;
import tv.phantombot.script.ScriptFileWatcher;
import tv.phantombot.script.ScriptManager;
import tv.phantombot.scripts.core.Moderation;
import tv.phantombot.twitch.api.Helix;
import tv.phantombot.twitch.api.TwitchValidate;
import tv.phantombot.twitch.irc.TwitchSession;
import tv.phantombot.twitch.irc.host.TwitchWSHostIRC;
import tv.phantombot.twitch.pubsub.TwitchPubSub;
import tv.phantombot.ytplayer.WsYTHandler;

public final class PhantomBot implements Listener {

    /* Bot Information */
    private TwitchAuthorizationCodeFlow authflow;
    private TwitchClientCredentialsFlow appflow;

    /* DataStore Information */
    private DataStore dataStore;

    /* Caches */
    private FollowersCache followersCache;
    private EmotesCache emotesCache;
    private TwitchCache twitchCache;
    private TwitchTeamsCache twitchTeamCache;
    private TipeeeStreamCache tipeeeStreamCache;
    private ViewerListCache viewerListCache;
    private StreamElementsCache streamElementCache;
    public static String twitchCacheReady = "false";

    /* Sockets */
    private WsAlertsPollsHandler alertsPollsHandler;
    private WsPanelHandler panelHandler;
    private WsYTHandler ytHandler;
    private HTTPOAuthHandler oauthHandler;
    private HTTPAuthenticatedHandler httpAuthenticatedHandler;

    /* PhantomBot Information */
    private static PhantomBot instance;
    private static boolean reloadScripts = false;
    private static boolean silentScriptsLoad = false;
    private static boolean enableDebugging = false;
    private static boolean enableDebuggingLogOnly = false;
    private static boolean enableRhinoDebugger = false;
    private static boolean enableRhinoES6 = false;
    private static boolean isInExitState = false;
    private boolean isExiting = false;

    /* Other Information */
    private TwitchSession session;
    private SecureRandom random;
    private boolean joined = false;
    private TwitchWSHostIRC wsHostIRC;
    private TwitchPubSub pubSubEdge;

    // Error codes
    // [...] by convention, a nonzero status code indicates abnormal termination. (see System.exit() JavaDoc)
    private static final int EXIT_STATUS_OK = 0;
    private static final int EXIT_STATUS_ERROR = 1;

    private ExponentialBackoff initChatBackoff = new ExponentialBackoff(5000L, 900000L);

    /**
     * PhantomBot Instance.
     *
     * @return PhantomBot The current instance of PhantomBot
     */
    public static PhantomBot instance() {
        return instance;
    }

    /**
     * Current Repo Of PhantomBot.
     *
     * @return String The current GitHub repository version of PhantomBot.
     */
    public String repoVersion() {
        return RepoVersion.getRepoVersion();
    }

    /**
     * Current Version Of PhantomBot.
     *
     * @return String Display version of PhantomBot.
     */
    public String botVersion() {
        return "PhantomBot Version: " + RepoVersion.getPhantomBotVersion() + " (" + RepoVersion.getBuildType() + (RepoVersion.isDocker() ? ", Docker" : "") + ")";
    }

    /**
     * Used by the panel on the informations tab.
     *
     * @return String PhantomBot information for the Panel.
     */
    public String getBotInfo() {
        return botVersion() + " (Revision: " + this.repoVersion() + ")";
    }

    /**
     * Current Build Revision
     *
     * @return String The build revision of PhantomBot.
     */
    public String botRevision() {
        return "Build Revision: " + this.repoVersion();
    }

    /**
     * Only used on bot boot up for now.
     *
     * @return bot creator
     */
    public String getBotCreator() {
        return "Creator: mast3rplan";
    }

    /**
     * Only used on bot boot up for now.
     *
     * @return bot developers
     */
    public String botDevelopers() {
        return "Developers: gmt2001, Kojitsari, ScaniaTV, & IllusionaryOne";
    }

    /**
     * Only used on bot boot up for now.
     *
     * @return bot website
     */
    public String getWebSite() {
        return "https://phantombot.github.io/PhantomBot/";
    }

    /**
     * Prints a message in the bot console.
     *
     * @param message
     */
    private void print(String message) {
        com.gmt2001.Console.out.println(message);
    }

    /**
     * Checks port availability.
     *
     * @param port
     */
    public void checkPortAvailabity(int port) {
        ServerSocket serverSocket = null;
        try {
            serverSocket = CaselessProperties.instance().getProperty("bindIP", "").isEmpty() ? new ServerSocket(port) : new ServerSocket(port, 1, java.net.InetAddress.getByName(CaselessProperties.instance().getProperty("bindIP", "")));
            serverSocket.setReuseAddress(true);
        } catch (IOException e) {
            com.gmt2001.Console.err.println("Port is already in use: " + port);
            com.gmt2001.Console.err.println("Ensure that another copy of PhantomBot is not running.");
            com.gmt2001.Console.err.println("If another copy is not running, try to change baseport in ./config/botlogin.txt");
            com.gmt2001.Console.err.println("PhantomBot will now exit.");
            PhantomBot.exitError();
        } finally {
            if (serverSocket != null) {
                try {
                    serverSocket.close();
                } catch (IOException e) {
                    com.gmt2001.Console.err.println("Unable to close port for testing: " + port);
                    com.gmt2001.Console.err.println("PhantomBot will now exit.");
                    PhantomBot.exitError();
                }
            }
        }
    }

    /**
     * Check to see if YouTube Key is configured.
     *
     * @return
     */
    public boolean isYouTubeKeyEmpty() {
        return CaselessProperties.instance().getProperty("youtubekey", "").isEmpty();
    }

    /**
     * Constructor for PhantomBot object.
     *
     */
    public PhantomBot() {
        if (CaselessProperties.instance().getPropertyAsBoolean("reactordebug", false)) {
            Loggers.useVerboseConsoleLoggers();
        }

        /* Set the default bot variables */
        PhantomBot.enableDebugging = CaselessProperties.instance().getPropertyAsBoolean("debugon", false);

        if (CaselessProperties.instance().getPropertyAsBoolean("userollbar", true)) {
            RollbarProvider.instance().enable();
        }

        /* Set the exeption handler */
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        /* Start loading the bot information */
        this.print("");
        this.print(this.botVersion());
        this.print(this.botRevision());
        this.print(this.getBotCreator());
        this.print(this.botDevelopers());
        this.print(this.getWebSite());
        this.print("");

        this.authflow = new TwitchAuthorizationCodeFlow(CaselessProperties.instance().getProperty("clientid"), CaselessProperties.instance().getProperty("clientsecret"));
        this.appflow = new TwitchClientCredentialsFlow(CaselessProperties.instance().getProperty("clientid"), CaselessProperties.instance().getProperty("clientsecret"));
        boolean authflowrefreshed = this.authflow.checkAndRefreshTokens();
        boolean appflowrefreshed = this.appflow.checkExpirationAndGetNewToken();
        if (authflowrefreshed || appflowrefreshed) {
            ConfigurationManager.getConfiguration();
        }

        /* twitch cache */
        PhantomBot.twitchCacheReady = "false";

        /* Load up a new SecureRandom for the scripts to use */
        this.random = new SecureRandom();

        /* Load the datastore */
        if (CaselessProperties.instance().getProperty("datastore", "sqlite3store").equalsIgnoreCase("mysqlstore")) {
            String mySqlConn;
            if (CaselessProperties.instance().getProperty("mysqlport", "").isEmpty()) {
                mySqlConn = "jdbc:mysql://" + CaselessProperties.instance().getProperty("mysqlhost", "") + "/" + CaselessProperties.instance().getProperty("mysqlname", "") + "?useSSL=false&user=" + CaselessProperties.instance().getProperty("mysqluser", "") + "&password=" + CaselessProperties.instance().getProperty("mysqlpass", "");
            } else {
                mySqlConn = "jdbc:mysql://" + CaselessProperties.instance().getProperty("mysqlhost", "") + ":" + CaselessProperties.instance().getProperty("mysqlport", "") + "/" + CaselessProperties.instance().getProperty("mysqlname", "") + "?useSSL=false&user=" + CaselessProperties.instance().getProperty("mysqluser", "") + "&password=" + CaselessProperties.instance().getProperty("mysqlpass", "");
            }

            this.dataStore = MySQLStore.instance(mySqlConn);

            /* Check to see if we can create a connection */
            if (!this.dataStore.CanConnect(mySqlConn, CaselessProperties.instance().getProperty("mysqluser", ""), CaselessProperties.instance().getProperty("mysqlpass", ""))) {
                this.print("Could not create a connection with MySQL Server. PhantomBot now shutting down...");
                PhantomBot.exitError();
            }
            /* Convert to MySql */
            if (SqliteStore.hasDatabase(CaselessProperties.instance().getProperty("datastoreconfig", "")) && SqliteStore.instance().GetFileList().length > 0 && MySQLStore.instance().GetFileList().length == 0) {
                DataStoreConverter.convertDataStore(MySQLStore.instance(), SqliteStore.instance());
            }
        } else if (CaselessProperties.instance().getProperty("datastore", "sqlite3store").equalsIgnoreCase("h2store")
                || (CaselessProperties.instance().getProperty("datastore", "sqlite3store").isBlank() && System.getProperty("os.name").toLowerCase().endsWith("bsd"))) {
            this.dataStore = H2Store.instance(CaselessProperties.instance().getProperty("datastoreconfig", ""));

            if (!this.dataStore.CanConnect()) {
                this.print("Could not create a connection with H2 Database. PhantomBot now shutting down...");
                PhantomBot.exitError();
            }

            if (SqliteStore.hasDatabase(CaselessProperties.instance().getProperty("datastoreconfig", "")) && SqliteStore.instance().GetFileList().length > 0 && H2Store.instance().GetFileList().length == 0) {
                DataStoreConverter.convertDataStore(H2Store.instance(), SqliteStore.instance());
            }
        } else {
            this.dataStore = SqliteStore.instance(CaselessProperties.instance().getProperty("datastoreconfig", ""));

            /* Handle index operations. */
            com.gmt2001.Console.debug.println("Checking database indexes, please wait...");
            this.dataStore.CreateIndexes();
        }

        /* Set the oauth key in the Twitch api and perform a validation. */
        this.validateOAuth();

        /* Start things and start loading the scripts. */
        this.init();

        /* Check if the OS is Linux. */
        if (SystemUtils.IS_OS_LINUX && System.getProperty("interactive") == null) {
            try {
                java.lang.management.RuntimeMXBean runtime = java.lang.management.ManagementFactory.getRuntimeMXBean();
                int pid = Integer.parseInt(runtime.getName().split("@")[0]);

                Files.write(Paths.get(GetExecutionPath(), "PhantomBot." + this.getBotName() + ".pid"), Integer.toString(pid).getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE,
                        StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
            } catch (IOException | NumberFormatException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        this.initChat();
    }

    public void validateOAuth() {
        if (!CaselessProperties.instance().getProperty("apioauth", "").isEmpty()) {
            Helix.instance().setOAuth(CaselessProperties.instance().getProperty("apioauth", ""));
            TwitchValidate.instance().validateAPI(CaselessProperties.instance().getProperty("apioauth", ""), "API (apioauth)");
        }

        if (!CaselessProperties.instance().getProperty("oauth", "").isEmpty()) {
            /* Validate the chat OAUTH token. */
            TwitchValidate.instance().validateChat(CaselessProperties.instance().getProperty("oauth"), "CHAT (oauth)");

            TwitchValidate.instance().checkOAuthInconsistencies(this.getBotName());
        }
    }

    private void initChat() {
        this.validateOAuth();
        if (!TwitchValidate.instance().isChatValid()) {
            com.gmt2001.Console.warn.println();
            com.gmt2001.Console.warn.println("OAuth was invalid, not starting TMI (Chat)");
            com.gmt2001.Console.warn.println("Please go the the bots built-in oauth page and setup a new Bot (Chat) token");
            com.gmt2001.Console.warn.println("The default URL is http://localhost:25000/oauth/");
            com.gmt2001.Console.warn.println();
            if (!this.initChatBackoff.GetIsBackingOff()) {
                com.gmt2001.Console.warn.println("Will check again in " + (this.initChatBackoff.GetNextInterval() / 1000) + " seconds");
                com.gmt2001.Console.warn.println();
                this.initChatBackoff.BackoffAsync(() -> {
                    this.initChat();
                });
            }
        } else if (this.session == null) {
            this.initAPIsWebConfigs();
            this.initScripts();
            /* Start a session instance and then connect to WS-IRC @ Twitch. */
            this.session = new TwitchSession(this.getChannelName(), this.getBotName(), CaselessProperties.instance().getProperty("oauth")).connect();
            this.session.doSubscribe();

            /* Start a host checking instance. */
            if (!CaselessProperties.instance().getProperty("apioauth", "").isBlank()) {
                this.wsHostIRC = new TwitchWSHostIRC(this.getChannelName(), CaselessProperties.instance().getProperty("apioauth", ""));
            }
        }
    }

    /**
     * Tells you if the build is a nightly.
     *
     * @return
     */
    public boolean isNightly() {
        return RepoVersion.isNightlyBuild();
    }

    /**
     * Tells you if the build is a pre-release.
     *
     * @return
     */
    public boolean isPrerelease() {
        return RepoVersion.isPrereleaseBuild();
    }

    public TwitchAuthorizationCodeFlow getAuthFlow() {
        return this.authflow;
    }

    public TwitchClientCredentialsFlow getAppFlow() {
        return this.appflow;
    }

    public void reconnect() {
        if (this.session != null) {
            this.session.reconnect();
        }
        if (this.wsHostIRC != null) {
            this.wsHostIRC.reconnect();
        }
        if (this.pubSubEdge != null) {
            this.pubSubEdge.reconnect();
        }
    }

    public void reloadProperties() {
        Helix.instance().setOAuth(CaselessProperties.instance().getProperty("apioauth", ""));
        if (this.session != null) {
            this.session.setOAuth(CaselessProperties.instance().getProperty("oauth"));
        }
        if (this.wsHostIRC != null) {
            this.wsHostIRC.setOAuth(CaselessProperties.instance().getProperty("apioauth", ""));
        }
        if (this.pubSubEdge != null) {
            this.pubSubEdge.setOAuth(CaselessProperties.instance().getProperty("apioauth", ""));
        }

        this.httpAuthenticatedHandler.updateAuth(CaselessProperties.instance().getProperty("webauth"), this.getPanelOAuth().replace("oauth:", ""));

        EventBus.instance().postAsync(new PropertiesReloadedEvent());
    }

    public static String GetExecutionPath() {
        try {
            return Paths.get(PhantomBot.class.getProtectionDomain().getCodeSource().getLocation().toURI()).getParent().toAbsolutePath().toRealPath().toString();
        } catch (IOException | URISyntaxException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return ".";
    }

    /**
     * Enables or disables the debug mode.
     *
     * @param debug
     */
    public static void setDebugging(boolean debug) {
        if (debug) {
            com.gmt2001.Console.out.println("Debug Mode Enabled");
        }

        PhantomBot.enableDebugging = debug;
    }

    /**
     * Enables or disables log only debug mode.
     *
     * @param debug
     */
    public static void setDebuggingLogOnly(boolean debug) {
        if (debug) {
            com.gmt2001.Console.out.println("Debug Log Only Mode Enabled");
        }

        PhantomBot.enableDebugging = debug;
        PhantomBot.enableDebuggingLogOnly = debug;
    }

    /**
     * Tells you the bot name.
     *
     * @return bot name
     */
    public String getBotName() {
        return CaselessProperties.instance().getProperty("user").toLowerCase();
    }

    public HTTPOAuthHandler getHTTPOAuthHandler() {
        return this.oauthHandler;
    }

    /**
     * Gives you the current data store
     *
     * @return this.dataStore
     */
    public DataStore getDataStore() {
        return this.dataStore;
    }

    /**
     * Tells you if the bot is exiting
     *
     * @return exit
     */
    public boolean isExiting() {
        return this.isExiting;
    }

    /**
     * Gives you the channel for that channelName.
     *
     * @return
     */
    public String getChannelName() {
        return CaselessProperties.instance().getProperty("channel").toLowerCase();
    }

    /**
     * Tells you if the discord token has been set.
     *
     * @return
     */
    public boolean hasDiscordToken() {
        return CaselessProperties.instance().getProperty("discord_token", "").isEmpty();
    }

    /**
     * Gives you the session for that channel.
     *
     * @return
     */
    public TwitchSession getSession() {
        return this.session;
    }

    /**
     * Method that returns the message limit
     *
     * @return messageLimit
     */
    public static double getMessageLimit() {
        /*
         * Set the message limit for session.java to use, note that Twitch rate limits at 100 messages in 30 seconds
         * for moderators.  For non-moderators, the maximum is 20 messages in 30 seconds. While it is not recommended
         * to go above anything higher than 19 in case the bot is ever de-modded, the option is available but is
         * capped at 100.0.
         */
        double messageLimit = Math.floor(CaselessProperties.instance().getPropertyAsDouble("msglimit30", 19.0));
        if (messageLimit > 99.0) {
            messageLimit = 99.0;
        } else if (messageLimit < 19.0) {
            messageLimit = 19.0;
        }

        return messageLimit;
    }

    /**
     * Gives you the message limit.
     *
     * @return message limit
     */
    public static long getMessageInterval() {
        return (long) ((30.0 / PhantomBot.getMessageLimit()) * 1000);
    }

    /**
     * Helper method to see if a module is enabled.
     *
     * @param module Module name to check for
     * @return boolean If the module is enabled or not
     */
    public boolean checkModuleEnabled(String module) {
        try {
            return this.dataStore.GetString("modules", "", module).equals("true");
        } catch (NullPointerException ex) {
            return false;
        }
    }

    public String getDataStoreType() {
        return CaselessProperties.instance().getProperty("datastore", "sqlite3store");
    }

    /**
     * Checks if a value is true in the datastore.
     *
     * @param table Db table to check.
     * @param key Db key to check in that table.
     * @return
     */
    public boolean checkDataStore(String table, String key) {
        try {
            return (this.dataStore.HasKey(table, "", key) && this.dataStore.GetString(table, "", key).equals("true"));
        } catch (NullPointerException ex) {
            return false;
        }
    }

    /**
     * Method that returns the basic bot info.
     *
     * @return
     */
    public String getBotInformation() {
        return "\r\nJava Version: " + System.getProperty("java.runtime.version") + "\r\nOS Version: " + System.getProperty("os.name") + " "
                + System.getProperty("os.version") + " (" + System.getProperty("os.arch") + ")\r\nPanel Version: " + RepoVersion.getPanelVersion() + "\r\n" + this.getBotInfo() + "\r\n\r\n";
    }

    /**
     * Method that gets the PhantomBot properties.
     *
     * @return
     */
    public CaselessProperties getProperties() {
        return CaselessProperties.instance();
    }

    private String getPanelPassword() {
        String pass = CaselessProperties.instance().getProperty("panelpassword", (String) null);
        if (pass == null) {
            pass = PhantomBot.generateRandomString(12);
            Transaction t = CaselessProperties.instance().startTransaction();
            t.setProperty("panelpassword", pass);
            t.commit();
            com.gmt2001.Console.out.println("");
            com.gmt2001.Console.out.println("Did not find a panel password...");
            com.gmt2001.Console.out.println("The panel username has been set to: " + CaselessProperties.instance().getProperty("paneluser", "panel"));
            com.gmt2001.Console.out.println("The panel password has been set to: " + pass);
            com.gmt2001.Console.out.println("You can change this in botlogin.txt, or by using the console command: panelsetup");
            com.gmt2001.Console.out.println("");
        }

        return pass;
    }

    private String getPanelOAuth() {
        String pass = CaselessProperties.instance().getProperty("oauth", (String) null);
        if (pass == null) {
            pass = PhantomBot.generateRandomString(12);
        }

        return pass;
    }

    private void initWeb() {
        /* Is the web toggle enabled? */
        if (CaselessProperties.instance().getPropertyAsBoolean("webenable", true)) {
            checkPortAvailabity(CaselessProperties.instance().getPropertyAsInt("baseport", 25000));
            HTTPWSServer.instance(CaselessProperties.instance().getProperty("bindIP", ""), CaselessProperties.instance().getPropertyAsInt("baseport", 25000),
                    CaselessProperties.instance().getPropertyAsBoolean("usehttps", true), CaselessProperties.instance().getProperty("httpsFileName", ""),
                    CaselessProperties.instance().getProperty("httpsPassword", ""), this.getBotName());
            new HTTPNoAuthHandler().register();
            this.httpAuthenticatedHandler = new HTTPAuthenticatedHandler(CaselessProperties.instance().getProperty("webauth"), this.getPanelOAuth().replace("oauth:", ""));
            this.httpAuthenticatedHandler.register();
            new HTTPPanelAndYTHandler(CaselessProperties.instance().getProperty("paneluser", "panel"), this.getPanelPassword()).register();
            this.oauthHandler = (HTTPOAuthHandler) new HTTPOAuthHandler(CaselessProperties.instance().getProperty("paneluser", "panel"), this.getPanelPassword()).register();
            if (CaselessProperties.instance().getPropertyAsBoolean("useeventsub", false)) {
                EventSub.instance().register();
            }
            this.panelHandler = (WsPanelHandler) new WsPanelHandler(CaselessProperties.instance().getProperty("webauthro"), CaselessProperties.instance().getProperty("webauth")).register();
            new WsPanelRemoteLoginHandler(CaselessProperties.instance().getProperty("paneluser", "panel"), this.getPanelPassword(),
                    CaselessProperties.instance().getProperty("webauthro"), CaselessProperties.instance().getProperty("webauth")).register();
            RestartRunner.instance().register();
        }
    }

    private void initConsoleEventBus() {
        /* check if the console is interactive */
        if (System.getProperty("interactive") != null) {
            ConsoleInputListener consoleIL = new ConsoleInputListener();
            /* Start the Console Input Listener */
            consoleIL.start();
        }

        /* Register PhantomBot (this) with the event bus. */
        EventBus.instance().register(this);
        /* Register the script manager with the event bus. */
        EventBus.instance().register(ScriptEventManager.instance());
        /* Register the console event handler */
        EventBus.instance().register(ConsoleEventHandler.instance());
    }

    private void initAPIsWebConfigs() {
        if (!TwitchValidate.instance().isChatValid()) {
            return;
        }

        this.alertsPollsHandler = (WsAlertsPollsHandler) new WsAlertsPollsHandler(CaselessProperties.instance().getProperty("webauthro"),
                CaselessProperties.instance().getProperty("webauth")).register();

        if (CaselessProperties.instance().getPropertyAsBoolean("useeventsub", false)) {
            TwitchValidate.instance().validateApp(CaselessProperties.instance().getProperty("apptoken"), "APP (EventSub)");
        }

        /* Is the music toggled on? */
        if (CaselessProperties.instance().getPropertyAsBoolean("musicenable", true)) {
            this.ytHandler = (WsYTHandler) new WsYTHandler(CaselessProperties.instance().getProperty("ytauthro"), CaselessProperties.instance().getProperty("ytauth")).register();
        }
        /* Connect to Discord if the data is present. */
        if (!CaselessProperties.instance().getProperty("discord_token", "").isEmpty()) {
            DiscordAPI.instance().connect(CaselessProperties.instance().getProperty("discord_token", ""));
        }

        /* Set Streamlabs currency code, if possible */
        if (this.dataStore.HasKey("donations", "", "currencycode")) {
            TwitchAlertsAPIv1.instance().SetCurrencyCode(this.dataStore.GetString("donations", "", "currencycode"));
        }

        /* Set the TwitchAlerts OAuth key and limiter. */
        if (!CaselessProperties.instance().getProperty("twitchalertskey", "").isEmpty()) {
            TwitchAlertsAPIv1.instance().SetAccessToken(CaselessProperties.instance().getProperty("twitchalertskey", ""));
            TwitchAlertsAPIv1.instance().SetDonationPullLimit(CaselessProperties.instance().getPropertyAsInt("twitchalertslimit", 5));
        }

        /* Set the YouTube API Key if provided. */
        if (!CaselessProperties.instance().getProperty("youtubekey", "").isEmpty()) {
            YouTubeAPIv3.instance().SetAPIKey(CaselessProperties.instance().getProperty("youtubekey", ""));
        }

        /* Set the TipeeeStream oauth key. */
        if (!CaselessProperties.instance().getProperty("tipeeestreamkey", "").isEmpty()) {
            TipeeeStreamAPIv1.instance().SetOauth(CaselessProperties.instance().getProperty("tipeeestreamkey", ""));
            TipeeeStreamAPIv1.instance().SetLimit(CaselessProperties.instance().getPropertyAsInt("tipeeestreamlimit", 5));
        }

        /* Set the StreamElements JWT token. */
        if (!CaselessProperties.instance().getProperty("streamelementsjwt", "").isEmpty() && !CaselessProperties.instance().getProperty("streamelementsid", "").isEmpty()) {
            StreamElementsAPIv2.instance().SetJWT(CaselessProperties.instance().getProperty("streamelementsjwt", ""));
            StreamElementsAPIv2.instance().SetID(CaselessProperties.instance().getProperty("streamelementsid", ""));
            StreamElementsAPIv2.instance().SetLimit(CaselessProperties.instance().getPropertyAsInt("streamelementslimit", 5));
        }

        /* Check to see if all the Twitter info needed is there */
        if (!CaselessProperties.instance().getProperty("twitterUser", "").isEmpty() && !CaselessProperties.instance().getProperty("twitter_access_token", "").isEmpty()
                && !CaselessProperties.instance().getProperty("twitter_consumer_key", "").isEmpty()
                && !CaselessProperties.instance().getProperty("twitter_consumer_secret", "").isEmpty()
                && !CaselessProperties.instance().getProperty("twitter_secret_token", "").isEmpty()) {
            try {
                /* Set the Twitter tokens */
                TwitterAPI.instance().setUsername(CaselessProperties.instance().getProperty("twitterUser", ""));
                TwitterAPI.instance().setAccessToken(CaselessProperties.instance().getProperty("twitter_access_token", ""));
                TwitterAPI.instance().setSecretToken(CaselessProperties.instance().getProperty("twitter_secret_token", ""));
                TwitterAPI.instance().setConsumerKey(CaselessProperties.instance().getProperty("twitter_consumer_key", ""));
                TwitterAPI.instance().setConsumerSecret(CaselessProperties.instance().getProperty("twitter_consumer_secret", ""));
                /* Check to see if the tokens worked */
                TwitterAPI.instance().authenticate();
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("TwitterAPI authentication failed fatally");
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /* print a extra line in the console. */
        this.print("");

        /* Create configuration for YTPlayer v2.0 for the WS port. */
        String data = "";
        String http = (CaselessProperties.instance().getPropertyAsBoolean("usehttps", true) ? "https://" : "http://");

        try {
            data += "// Configuration for YTPlayer\r\n";
            data += "// Automatically Generated by PhantomBot at Startup\r\n";
            data += "// Do NOT Modify! Overwritten when PhantomBot is restarted!\r\n";
            data += "var playerPort = " + CaselessProperties.instance().getPropertyAsInt("baseport", 25000) + ";\r\n";
            data += "var channelName = \"" + this.getChannelName() + "\";\r\n";
            data += "var auth=\"" + CaselessProperties.instance().getProperty("ytauth") + "\";\r\n";
            data += "var http=\"" + http + "\";\r\n";
            data += "function getPlayerPort() { return playerPort; }\r\n";
            data += "function getChannelName() { return channelName; }\r\n";
            data += "function getAuth() { return auth; }\r\n";
            data += "function getProtocol() { return http; }\r\n";

            /* Create a new file if it does not exist */
            Files.createDirectories(PathValidator.getRealPath(Paths.get("./web/ytplayer/js/")));

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
            data += "var playerPort = " + CaselessProperties.instance().getPropertyAsInt("baseport", 25000) + ";\r\n";
            data += "var channelName = \"" + this.getChannelName() + "\";\r\n";
            data += "var auth=\"" + CaselessProperties.instance().getProperty("ytauthro") + "\";\r\n";
            data += "var http=\"" + http + "\";\r\n";
            data += "function getPlayerPort() { return playerPort; }\r\n";
            data += "function getChannelName() { return channelName; }\r\n";
            data += "function getAuth() { return auth; }\r\n";
            data += "function getProtocol() { return http; }\r\n";

            /* Create a new file if it does not exist */
            Files.createDirectories(PathValidator.getRealPath(Paths.get("./web/playlist/js/")));

            /* Write the data to that file */
            Files.write(Paths.get("./web/playlist/js/playerConfig.js"), data.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
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
            data += "    panelPort   : " + CaselessProperties.instance().getPropertyAsInt("baseport", 25000) + ",\r\n";
            data += "    channelName : \"" + this.getChannelName() + "\",\r\n";
            data += "    auth        : \"" + CaselessProperties.instance().getProperty("webauthro") + "\",\r\n";
            data += "    http        : \"" + http + "\"\r\n";
            data += "};\r\n\r\n";
            data += "function getPanelPort() { return panelSettings.panelPort; }\r\n";
            data += "function getChannelName() { return panelSettings.channelName; }\r\n";
            data += "function getAuth() { return panelSettings.auth; }\r\n";
            data += "function getProtocol() { return panelSettings.http; }\r\n";

            /* Create a new file if it does not exist */
            Files.createDirectories(PathValidator.getRealPath(Paths.get("./web/common/js/")));

            /* Write the data to that file */
            Files.write(Paths.get("./web/common/js/wsConfig.js"), data.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    private void initScripts() {
        if (!TwitchValidate.instance().isChatValid()) {
            return;
        }
        /* Export all these to the $. api in the scripts. */
        Script.global.defineProperty("inidb", this.dataStore, 0);
        Script.global.defineProperty("username", UsernameCache.instance(), 0);
        Script.global.defineProperty("twitch", TwitchAPIv5.instance(), 0);
        Script.global.defineProperty("botName", this.getBotName(), 0);
        Script.global.defineProperty("channelName", this.getChannelName(), 0);
        Script.global.defineProperty("ownerName", CaselessProperties.instance().getProperty("owner").toLowerCase(), 0);
        Script.global.defineProperty("ytplayer", this.ytHandler, 0);
        Script.global.defineProperty("panelsocketserver", this.panelHandler, 0);
        Script.global.defineProperty("alertspollssocket", this.alertsPollsHandler, 0);
        Script.global.defineProperty("random", this.random, 0);
        Script.global.defineProperty("youtube", YouTubeAPIv3.instance(), 0);
        Script.global.defineProperty("twitter", TwitterAPI.instance(), 0);
        Script.global.defineProperty("twitchCacheReady", PhantomBot.twitchCacheReady, 0);
        Script.global.defineProperty("isNightly", this.isNightly(), 0);
        Script.global.defineProperty("isPrerelease", this.isPrerelease(), 0);
        Script.global.defineProperty("version", this.botVersion(), 0);
        Script.global.defineProperty("changed", CaselessProperties.instance().getPropertyAsBoolean("newSetup", false), 0);
        Script.global.defineProperty("discordAPI", DiscordAPI.instance(), 0);
        Script.global.defineProperty("hasDiscordToken", hasDiscordToken(), 0);
        Script.global.defineProperty("customAPI", CustomAPI.instance(), 0);
        Script.global.defineProperty("streamLabsAPI", TwitchAlertsAPIv1.instance(), 0);
        Script.global.defineProperty("moderation", Moderation.instance(), 0);

        /* And finally try to load init, that will then load the scripts */
        try {
            ScriptManager.loadScript(new File("./scripts/init.js"), "init.js");
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    private void init() {
        /* open a new thread for when the bot is exiting */
        Thread thread = new Thread(() -> {
            this.onExit();
        }, "tv.phantombot.PhantomBot::onExit");

        /* Get the un time for that new thread we just created */
        Runtime.getRuntime().addShutdownHook(thread);

        /* Check for a update with PhantomBot */
        this.doCheckPhantomBotUpdate();

        /* Perform SQLite datbase backups. */
        if (CaselessProperties.instance().getPropertyAsBoolean("backupdbauto", CaselessProperties.instance().getPropertyAsBoolean("backupsqliteauto", true))) {
            this.doBackupDB();
        }

        this.initConsoleEventBus();
        this.initWeb();
    }

    /**
     * Used for exiting the bot
     *
     */
    @SuppressWarnings("SleepWhileInLoop")
    public void onExit() {
        this.print(this.getBotName() + " is shutting down...");

        this.print("Sending the shutdown event to scripts...");
        EventBus.instance().post(new ShutdownEvent());

        this.isExiting = true;
        PhantomBot.isInExitState = true;

        this.print("Stopping all events and message dispatching...");
        ScriptFileWatcher.instance().kill();
        ScriptEventManager.instance().kill();

        /* Gonna need a way to pass this to all channels */
        if (this.getSession() != null) {
            this.getSession().close();
        }

        if (this.wsHostIRC != null) {
            this.wsHostIRC.shutdown();
        }

        if (this.pubSubEdge != null) {
            this.pubSubEdge.shutdown();
        }

        /* Shutdown all caches */
        if (this.followersCache != null) {
            this.print("Terminating the Twitch channel follower cache...");
            FollowersCache.killall();
        }

        this.print("Terminating the Streamlabs cache...");
        DonationsCache.instance().kill();

        if (this.tipeeeStreamCache != null) {
            this.print("Terminating the TipeeeStream cache...");
            TipeeeStreamCache.killall();
        }

        if (this.streamElementCache != null) {
            this.print("Terminating the StreamElementsCache cache...");
            StreamElementsCache.killall();
        }

        this.print("Terminating all script modules...");
        Map<String, Script> scripts = ScriptManager.getScripts();
        scripts.entrySet().forEach((script) -> {
            script.getValue().kill();
        });

        this.print("Saving all data...");
        this.dataStore.SaveAll(true);

        /* Check to see if web is enabled */
        if (CaselessProperties.instance().getPropertyAsBoolean("webenable", true)) {
            this.print("Shutting down all web socket/http servers...");
            HTTPWSServer.instance().close();
        }

        try {
            for (int i = 5; i > 0; i--) {
                com.gmt2001.Console.out.print("\rWaiting for everything else to shutdown... " + i + " ");
                Thread.sleep(1000);
            }
        } catch (InterruptedException ex) {
            com.gmt2001.Console.out.print("\r\n");
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        com.gmt2001.Console.out.print("\r\n");
        this.print("Closing the database...");
        this.dataStore.dispose();

        CaselessProperties.instance().store(false);

        try {
            RollbarProvider.instance().close();
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        if (SystemUtils.IS_OS_LINUX && System.getProperty("interactive") == null) {
            try {
                Files.deleteIfExists(Paths.get(GetExecutionPath(), "PhantomBot." + this.getBotName() + ".pid"));
            } catch (IOException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        this.print(this.getBotName() + " is exiting.");
    }

    /**
     * Connected to Twitch.
     *
     * @param event
     */
    @Handler
    public void ircJoinComplete(IrcJoinCompleteEvent event) {
        /* Check if the bot already joined once. */
        this.session.getModerationStatus();

        if (this.joined) {
            com.gmt2001.Console.debug.println("ircJoinComplete::joined::" + this.getChannelName());
            return;
        }

        this.joined = true;

        com.gmt2001.Console.debug.println("ircJoinComplete::" + this.getChannelName());

        com.gmt2001.Console.debug.println("TwitchValidate.hasAPIScope(channel:moderate)=" + (TwitchValidate.instance().hasAPIScope("channel:moderate") ? "t" : "f"));
        com.gmt2001.Console.debug.println("TwitchValidate.hasAPIScope(channel:read:redemption)=" + (TwitchValidate.instance().hasAPIScope("channel:read:redemptions") ? "t" : "f"));
        com.gmt2001.Console.debug.println("StartPubSub=" + (CaselessProperties.instance().getProperty("apioauth", "").length() > 0 && (TwitchValidate.instance().hasAPIScope("channel:moderate") || TwitchValidate.instance().hasAPIScope("channel:read:redemptions")) ? "t" : "f"));
        /* Start a pubsub instance here. */
        if (CaselessProperties.instance().getProperty("apioauth", "").length() > 0 && (TwitchValidate.instance().hasAPIScope("channel:moderate") || TwitchValidate.instance().hasAPIScope("channel:read:redemptions"))) {
            this.pubSubEdge = new TwitchPubSub(TwitchAPIv5.instance().getChannelId(this.getChannelName()), TwitchAPIv5.instance().getChannelId(this.getBotName()), CaselessProperties.instance().getProperty("apioauth", ""));
        }

        /* Load the caches for each channels */
        this.twitchCache = TwitchCache.instance(this.getChannelName());
        this.twitchTeamCache = TwitchTeamsCache.instance(this.getChannelName());
        this.emotesCache = EmotesCache.instance(this.getChannelName());
        this.followersCache = FollowersCache.instance(this.getChannelName());
        this.viewerListCache = ViewerListCache.instance(this.getChannelName());

        /* Start the donations cache if the keys are not null and the module is enabled */
        if (CaselessProperties.instance().getProperty("twitchalertskey", "") != null && !CaselessProperties.instance().getProperty("twitchalertskey", "").isEmpty() && checkModuleEnabled("./handlers/donationHandler.js")) {
            DonationsCache.instance().start();
        }

        /* Start the TipeeeStream cache if the keys are not null and the module is enabled. */
        if (CaselessProperties.instance().getProperty("tipeeestreamkey", "") != null && !CaselessProperties.instance().getProperty("tipeeestreamkey", "").isEmpty() && checkModuleEnabled("./handlers/tipeeeStreamHandler.js")) {
            this.tipeeeStreamCache = TipeeeStreamCache.instance(this.getChannelName());
        }

        /* Start the StreamElements cache if the keys are not null and the module is enabled. */
        if (CaselessProperties.instance().getProperty("streamelementsjwt", "") != null && !CaselessProperties.instance().getProperty("streamelementsjwt", "").isEmpty() && checkModuleEnabled("./handlers/streamElementsHandler.js")) {
            this.streamElementCache = StreamElementsCache.instance(this.getChannelName());
        }

        /* Export these to the $. api for the sripts to use */
        Script.global.defineProperty("twitchcache", this.twitchCache, 0);
        Script.global.defineProperty("twitchteamscache", this.twitchTeamCache, 0);
        Script.global.defineProperty("emotes", this.emotesCache, 0);
        Script.global.defineProperty("usernameCache", this.viewerListCache, 0);
    }

    /**
     * Get private messages from Twitch.
     *
     * @param event
     */
    @Handler
    public void ircPrivateMessage(IrcPrivateMessageEvent event) {
        String sender = event.getSender();
        String message = event.getMessage();

        /* Check to see if the sender is jtv */
        if (sender.equalsIgnoreCase("jtv")) {
            /* Splice the mod list so we can get all the mods */
            String searchStr = "The moderators of this channel are: ";
            if (message.startsWith(searchStr)) {
                String[] moderators = message.substring(searchStr.length()).split(", ");

                /* Check to see if the bot is a moderator */
                for (String moderator : moderators) {
                    if (moderator.equalsIgnoreCase(this.getBotName())) {
                        EventBus.instance().postAsync(new IrcChannelUserModeEvent(this.session, this.session.getBotName(), "O", true));
                        /* Allow the bot to sends message to this session */
                        event.getSession().setAllowSendMessages(true);
                        com.gmt2001.Console.debug.println("Allowing messages to be sent due to .mods response +O");
                    }
                }
            }
        }
    }

    /**
     * user modes from twitch
     *
     * @param event
     */
    @Handler
    public void ircUserMode(IrcChannelUserModeEvent event) {
        /* Check to see if Twitch sent a mode event for the bot name */
        if (event.getUser().equalsIgnoreCase(this.getBotName()) && event.getMode().equalsIgnoreCase("o")) {
            if (!event.getAdd()) {
                event.getSession().getModerationStatus();
            }
            /* Allow the bot to sends message to this session */
            event.getSession().setAllowSendMessages(event.getAdd());
        }
    }

    /**
     * messages from Twitch chat
     *
     * @param event
     */
    @Handler
    public void ircChannelMessage(IrcChannelMessageEvent event) {
        if (this.pubSubEdge != null) {
            this.pubSubEdge.ircChannelMessageEvent(event);
        }
    }

    /**
     * Handle commands
     *
     * @param username
     * @param command
     */
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

    /**
     * Handle commands
     *
     * @param username
     * @param command
     */
    public void handleCommandSync(String username, String command) {
        String arguments = "";

        /* Does the command have arguments? */
        if (command.contains(" ")) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }
        EventBus.instance().postAsync(new CommandEvent(username, command, arguments));
    }

    /**
     * Load up main
     *
     * @param args
     * @throws java.io.IOException
     */
    public static void main(String[] args) throws IOException {
        System.setProperty("io.netty.noUnsafe", "true");

        if (Float.valueOf(System.getProperty("java.specification.version")) < (float) 11) {
            System.out.println("Detected Java " + System.getProperty("java.version") + ". " + "PhantomBot requires Java 11 or later.");
            PhantomBot.exitError();
        }

        /* Print the user dir */
        com.gmt2001.Console.out.println("The working directory is: " + GetExecutionPath());

        com.gmt2001.Console.out.println("Detected Java " + System.getProperty("java.version") + " running on "
                + System.getProperty("os.name") + " " + System.getProperty("os.version")
                + " (" + System.getProperty("os.arch") + ")");

        CaselessCommandLineArguments.instance().load(args);

        /* If prompted, now that the version has been reported, exit. */
        if (CaselessCommandLineArguments.instance().getPropertyAsBoolean("--version", false)
                || CaselessCommandLineArguments.instance().getPropertyAsBoolean("-v", false)) {
            com.gmt2001.Console.out.println("PhantomBot Version: " + RepoVersion.getPhantomBotVersion() + " (" + RepoVersion.getRepoVersion() + ")");
            PhantomBot.exitOK();
        }

        CaselessProperties startProperties = ConfigurationManager.getConfiguration();

        setStaticFields(startProperties);

        /* Start PhantomBot */
        PhantomBot.instance = new PhantomBot();
    }

    private static void setStaticFields(CaselessProperties startProperties) {
        /* Check to enable debug mode */
        PhantomBot.setDebugging(ConfigurationManager.getBoolean(startProperties, ConfigurationManager.PROP_DEBUGON, false));
        /* Check to enable debug to File */
        PhantomBot.setDebuggingLogOnly(ConfigurationManager.getBoolean(startProperties, ConfigurationManager.PROP_DEBUGLOG, false));
        /* Check to enable Script Reloading */
        PhantomBot.setReloadScripts(ConfigurationManager.getBoolean(startProperties, ConfigurationManager.PROP_RELOADSCRIPTS, false));
        /* Check to silence the loading of scripts at startup. */
        PhantomBot.setSilentScriptsLoad(ConfigurationManager.getBoolean(startProperties, ConfigurationManager.PROP_SILENTSCRIPTSLOAD, false));
        /* Check to enable Rhino Debugger */
        PhantomBot.setEnableRhinoDebugger(ConfigurationManager.getBoolean(startProperties, ConfigurationManager.PROP_RHINODEBUGGER, false));

        PhantomBot.setEnableRhinoES6(startProperties.getPropertyAsBoolean("rhino_es6", false));
    }

    private static void setEnableRhinoDebugger(boolean enableRhinoDebugger) {
        if (enableRhinoDebugger) {
            com.gmt2001.Console.out.println("Rhino Debugger will be launched if system supports it.");
        }
        PhantomBot.enableRhinoDebugger = enableRhinoDebugger;
    }

    private static void setEnableRhinoES6(boolean enableRhinoES6) {
        if (enableRhinoES6) {
            com.gmt2001.Console.out.println("Rhino ECMAScript6 support enabled.");
        }
        PhantomBot.enableRhinoES6 = enableRhinoES6;
    }

    private static void setReloadScripts(boolean reloadScripts) {
        if (reloadScripts) {
            com.gmt2001.Console.out.println("Enabling Script Reloading");
        }
        PhantomBot.reloadScripts = reloadScripts;

    }

    private static void setSilentScriptsLoad(boolean silentScriptsLoad) {
        if (silentScriptsLoad) {
            com.gmt2001.Console.out.println("Enabling Silent Script Load");
        }
        PhantomBot.silentScriptsLoad = silentScriptsLoad;

    }

    /**
     * gen a random string
     *
     * @param length
     * @return
     */
    public static String generateRandomString(int length) {
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

    public static String getOsSuffix() {
        String os = "";
        String osname = System.getProperty("os.name").toLowerCase();

        if (osname.contains("win")) {
            os = "-win";
        } else if (osname.contains("mac")) {
            os = "-mac";
        } else if (osname.contains("bsd")) {
            os = "-arm-bsd-other";
        } else if (osname.contains("nix") || osname.contains("nux") || osname.contains("aix")) {
            if (System.getProperty("os.arch").toLowerCase().contains("arm")) {
                os = "-arm-bsd-other";
            } else {
                os = "-lin";
            }
        }

        return os;
    }

    /**
     * doCheckPhantomBotUpdate
     */
    private void doCheckPhantomBotUpdate() {
        ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
        service.scheduleAtFixedRate(() -> {
            if (!RepoVersion.getBuildType().startsWith("edge") && !RepoVersion.getBuildType().startsWith("custom")) {
                try {
                    Thread.currentThread().setName("tv.phantombot.PhantomBot::doCheckPhantomBotUpdate");

                    if (RepoVersion.isNightlyBuild()) {
                        String latestNightly = HttpClient.get(HttpUrl.fromUri("https://raw.githubusercontent.com/PhantomBot/nightly-build/master/last_repo_version")).responseBody().trim();
                        if (latestNightly.equalsIgnoreCase(RepoVersion.getRepoVersion().trim())) {
                            this.dataStore.del("settings", "newrelease_info");
                        } else {
                            try {
                                Thread.sleep(6000);
                                this.print("");
                                this.print("New PhantomBot Nightly Build Detected: " + latestNightly);
                                this.print("Download Link: https://github.com/PhantomBot/nightly-build/raw/master/PhantomBot-nightly" + PhantomBot.getOsSuffix() + ".zip");
                                this.print("A reminder will be provided in 24 hours!");
                                this.print("");
                            } catch (InterruptedException ex) {
                                com.gmt2001.Console.err.printStackTrace(ex);
                            }

                            if (CaselessProperties.instance().getPropertyAsBoolean("webenable", true)) {
                                this.dataStore.set("settings", "newrelease_info", "nightly-" + latestNightly + "|https://github.com/PhantomBot/nightly-build/raw/master/PhantomBot-nightly" + PhantomBot.getOsSuffix() + ".zip");
                            }
                        }
                    } else {
                        String[] newVersionInfo = GitHubAPIv3.CheckNewRelease();
                        if (newVersionInfo != null) {
                            try {
                                Thread.sleep(6000);
                                this.print("");
                                this.print("New PhantomBot Release Detected: " + newVersionInfo[0]);
                                this.print("Release Changelog: https://github.com/PhantomBot/PhantomBot/releases/" + newVersionInfo[0]);
                                this.print("Download Link: " + newVersionInfo[1]);
                                this.print("A reminder will be provided in 24 hours!");
                                this.print("");
                            } catch (InterruptedException ex) {
                                com.gmt2001.Console.err.printStackTrace(ex);
                            }

                            if (CaselessProperties.instance().getPropertyAsBoolean("webenable", true)) {
                                this.dataStore.set("settings", "newrelease_info", newVersionInfo[0] + "|" + newVersionInfo[1]);
                            }
                        } else {
                            this.dataStore.del("settings", "newrelease_info");
                        }
                    }
                } catch (URISyntaxException | JSONException ex) {
                    com.gmt2001.Console.err.logStackTrace(ex);
                }
            }

            try {
                Thread.sleep(30000);
                GamesListUpdater.update();
            } catch (InterruptedException | JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }, 0, 24, TimeUnit.HOURS);
    }

    /**
     * Set the twitch cache
     *
     * @param twitchCacheReady
     */
    public void setTwitchCacheReady(String twitchCacheReady) {
        PhantomBot.twitchCacheReady = twitchCacheReady;
        Script.global.defineProperty("twitchCacheReady", PhantomBot.twitchCacheReady, 0);
    }

    /**
     * Backup the database, keeping so many days.
     */
    private void doBackupDB() {
        if (!this.dataStore.canBackup()) {
            return;
        }

        ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
        service.scheduleAtFixedRate(() -> {
            Thread.currentThread().setName("tv.phantombot.PhantomBot::doBackupDB");

            SimpleDateFormat datefmt = new SimpleDateFormat("ddMMyyyy.hhmmss");
            datefmt.setTimeZone(TimeZone.getTimeZone(CaselessProperties.instance().getProperty("logtimezone", "GMT")));
            String timestamp = datefmt.format(new Date());

            this.dataStore.backupDB("phantombot.auto.backup." + timestamp + ".db");

            try {
                Iterator<File> dirIterator = FileUtils.iterateFiles(new File("./dbbackup"), new WildcardFileFilter("phantombot.auto.*"), null);
                while (dirIterator.hasNext()) {
                    File backupFile = dirIterator.next();
                    if (FileUtils.isFileOlder(backupFile, (System.currentTimeMillis() - (long) (CaselessProperties.instance().getPropertyAsInt("backupdbkeepdays", CaselessProperties.instance().getPropertyAsInt("backupsqlitekeepdays", 5)) * 864e5)))) {
                        FileUtils.deleteQuietly(backupFile);
                    }
                }
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("Failed to clean up database backup directory: " + ex.getMessage());
            }
        }, 0, CaselessProperties.instance().getPropertyAsInt("backupdbhourfrequency", CaselessProperties.instance().getPropertyAsInt("backupsqlitehourfrequency", 24)), TimeUnit.HOURS);
    }

    /**
     * Method to export a Java list to a csv file.
     *
     * @param headers
     * @param values
     * @param fileName
     */
    public void toCSV(String[] headers, List<String[]> values, String fileName) {
        StringBuilder builder = new StringBuilder();
        FileOutputStream stream = null;

        // Append the headers.
        builder.append(String.join(",", headers)).append("\n");

        // Append all values.
        values.forEach((value) -> {
            builder.append(String.join(",", value)).append("\n");
        });

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

    /**
     * End PhantomBot with an error state
     */
    public static void exitError() {
        System.exit(EXIT_STATUS_ERROR);
    }

    /**
     * End PhantomBot with an OK state
     */
    public static void exitOK() {
        System.exit(EXIT_STATUS_OK);
    }

    public static boolean getReloadScripts() {
        return reloadScripts;
    }

    public static boolean getSilentScriptsLoad() {
        return silentScriptsLoad;
    }

    public static boolean getEnableDebugging() {
        return enableDebugging;
    }

    public static boolean getEnableDebuggingLogOnly() {
        return enableDebuggingLogOnly;
    }

    public static boolean getEnableRhinoDebugger() {
        return enableRhinoDebugger;
    }

    public static boolean getEnableRhinoES6() {
        return enableRhinoES6;
    }

    public static String getTimeZone() {
        return CaselessProperties.instance().getProperty("logtimezone", "GMT");
    }

    public static boolean isInExitState() {
        return isInExitState;
    }

    public void setPubSub(TwitchPubSub pubSub) {
        this.pubSubEdge = pubSub;
    }

    public void setHostIRC(TwitchWSHostIRC hostIrc) {
        this.wsHostIRC = hostIrc;
    }

    public void setSession(TwitchSession session) {
        this.session = session;
    }
}
