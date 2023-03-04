/*
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
package tv.phantombot;

import com.gmt2001.ExecutorService;
import com.gmt2001.GamesListUpdater;
import com.gmt2001.PathValidator;
import com.gmt2001.Reflect;
import com.gmt2001.RestartRunner;
import com.gmt2001.RollbarProvider;
import com.gmt2001.TwitchAPIv5;
import com.gmt2001.datastore.DataStore;
import com.gmt2001.datastore.DataStoreConverter;
import com.gmt2001.datastore.H2Store;
import com.gmt2001.datastore.MySQLStore;
import com.gmt2001.datastore.SqliteStore;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.URIUtil;
import com.gmt2001.httpwsserver.HTTPWSServer;
import com.gmt2001.ratelimiters.ExponentialBackoff;
import com.gmt2001.twitch.TwitchAuthorizationCodeFlow;
import com.gmt2001.twitch.eventsub.EventSub;
import com.gmt2001.twitch.tmi.TwitchMessageInterface;
import com.illusionaryone.GitHubAPIv3;
import com.illusionaryone.TwitchAlertsAPIv1;
import com.illusionaryone.YouTubeAPIv3;
import com.scaniatv.CustomAPI;
import com.scaniatv.StreamElementsAPIv2;
import com.scaniatv.TipeeeStreamAPIv1;
import io.netty.util.internal.logging.InternalLoggerFactory;
import io.netty.util.internal.logging.JdkLoggerFactory;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
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
import tv.phantombot.event.irc.complete.IrcJoinCompleteEvent;
import tv.phantombot.event.irc.message.IrcChannelMessageEvent;
import tv.phantombot.event.jvm.PropertiesLoadedEvent;
import tv.phantombot.event.jvm.PropertiesReloadedEvent;
import tv.phantombot.event.jvm.ShutdownEvent;
import tv.phantombot.httpserver.HTTPAuthenticatedHandler;
import tv.phantombot.httpserver.HTTPNoAuthHandler;
import tv.phantombot.httpserver.HTTPOAuthHandler;
import tv.phantombot.httpserver.HTTPPanelAndYTHandler;
import tv.phantombot.httpserver.HttpSetupHandler;
import tv.phantombot.panel.WsAlertsPollsHandler;
import tv.phantombot.panel.WsPanelHandler;
import tv.phantombot.panel.WsPanelRemoteLoginHandler;
import tv.phantombot.script.Script;
import tv.phantombot.script.ScriptEventManager;
import tv.phantombot.script.ScriptFileWatcher;
import tv.phantombot.script.ScriptManager;
import tv.phantombot.twitch.api.Helix;
import tv.phantombot.twitch.api.TwitchValidate;
import tv.phantombot.twitch.irc.TwitchSession;
import tv.phantombot.twitch.pubsub.TwitchPubSub;
import tv.phantombot.ytplayer.WsYTHandler;

public final class PhantomBot implements Listener {

    /* Bot Information */
    private TwitchAuthorizationCodeFlow authflow;

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
    public static boolean twitchCacheReady = false;

    /* Sockets */
    private WsAlertsPollsHandler alertsPollsHandler;
    private WsPanelHandler panelHandler;
    private WsYTHandler ytHandler;
    private HTTPOAuthHandler oauthHandler;
    private HTTPAuthenticatedHandler httpAuthenticatedHandler;
    private HTTPPanelAndYTHandler httpPanelHandler;
    private HttpSetupHandler httpSetupHandler;

    /* PhantomBot Information */
    private static PhantomBot instance;
    private static boolean reloadScripts = false;
    private static boolean silentScriptsLoad = false;
    private static boolean enableDebugging = false;
    private static boolean enableDebuggingLogOnly = false;
    private static boolean enableRhinoDebugger = false;
    private static boolean isInExitState = false;
    private boolean isExiting = false;

    /* Other Information */
    private TwitchSession session;
    private SecureRandom random;
    private boolean joined = false;
    private TwitchMessageInterface tmi;
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
        return "https://phantombot.dev/";
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
     * Check to see if YouTube Key is configured.
     *
     * @return
     */
    public boolean isYouTubeKeyEmpty() {
        return CaselessProperties.instance().getProperty("youtubekey", "").isEmpty();
    }

    public static void setLevel(java.util.logging.Level targetLevel) {
        java.util.logging.Logger root = java.util.logging.Logger.getLogger("");
        root.setLevel(targetLevel);
        for (java.util.logging.Handler handler : root.getHandlers()) {
            handler.setLevel(targetLevel);
        }
        System.out.println("level set: " + targetLevel.getName());
    }

    /**
     * Constructor for PhantomBot object.
     *
     */
    public PhantomBot() {
        /**
         * @botproperty reactordebug - If `true`, internal debugging for Reactor HTTP and WS processing is sent to the console. Default `false`
         * @botpropertycatsort reactordebug 300 900 Debug
         * @botpropertyrestart reactordebug
         */
        if (CaselessProperties.instance().getPropertyAsBoolean("reactordebug", false)) {
            Loggers.useVerboseConsoleLoggers();
        }

        /**
         * @botproperty internaldebug - If `true`, internal debugging from JDK and other libraries are sent to the console. Default `false`
         * @botpropertycatsort internaldebug 500 900 Debug
         * @botpropertyrestart internaldebug
         */
        if (CaselessProperties.instance().getPropertyAsBoolean("internaldebug", false)) {
            setLevel(java.util.logging.Level.ALL);
            InternalLoggerFactory.setDefaultFactory(JdkLoggerFactory.INSTANCE);
        }

        /* Set the default bot variables */
        PhantomBot.enableDebugging = CaselessProperties.instance().getPropertyAsBoolean("debugon", false);

        /**
         * @botproperty userollbar - If `true`, Exceptions thrown during operation may be sent to Rollbar exception tracking. Default `true`
         * @botpropertycatsort userollbar 10 10 Admin
         * @botpropertyrestart userollbar
         */
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
        boolean authflowrefreshed = this.authflow.checkAndRefreshTokens();
        if (authflowrefreshed) {
            ConfigurationManager.getConfiguration();
        }

        /* twitch cache */
        PhantomBot.twitchCacheReady = false;

        /* Load up a new SecureRandom for the scripts to use */
        this.random = new SecureRandom();

        if (CaselessProperties.instance().getProperty("datastore", "NONESTORE").equals("NONESTORE")
            && SqliteStore.hasDatabase(CaselessProperties.instance().getProperty("datastoreconfig", ""))
            && SqliteStore.isAvailable(CaselessProperties.instance().getProperty("datastoreconfig", ""))
            && SqliteStore.instance().GetFileList().length > 0) {
            Transaction t = CaselessProperties.instance().startTransaction(CaselessProperties.Transaction.PRIORITY_MAX);
            t.setProperty("datastore", "sqlite3store");
            t.commit();
        }

        /* Load the datastore */
        /**
         * @botproperty datastore - The type of DB to use. Valid values: `sqlite3store`, `mysqlstore`, `h2store`. Default `h2store`
         * @botpropertycatsort datastore 10 30 Datastore
         * @botpropertyrestart datastore
         */
        /**
         * @botproperty datastoreconfig - If set, H2Store: Overrides the DB file name; SQLiteStore: Links to a file containing config overrides
         * @botpropertycatsort datastoreconfig 900 30 Datastore
         * @botpropertyrestart datastoreconfig
         */
        if (CaselessProperties.instance().getProperty("datastore", "h2store").equalsIgnoreCase("mysqlstore")) {
            /**
             * @botproperty mysqlport - The port to use for MySQL connections. Default `3306`
             * @botpropertycatsort mysqlport 210 30 Datastore
             * @botpropertyrestart mysqlport
             */
            /**
             * @botproperty mysqlhost - The IP, domain name, or hostname of the MySQL server
             * @botpropertycatsort mysqlhost 200 30 Datastore
             * @botpropertyrestart mysqlhost
             */
            /**
             * @botproperty mysqlname - The schema where the tables for the bot will be created/located on the MySQL server
             * @botpropertycatsort mysqlname 220 30 Datastore
             * @botpropertyrestart mysqlname
             */
            /**
             * @botproperty mysqluser - The username to login as to the MySQL server
             * @botpropertycatsort mysqluser 230 30 Datastore
             * @botpropertyrestart mysqluser
             */
            /**
             * @botproperty mysqlpass - The password for `mysqluser`
             * @botpropertycatsort mysqlpass 240 30 Datastore
             * @botpropertyrestart mysqlpass
             */
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
            if (SqliteStore.hasDatabase(CaselessProperties.instance().getProperty("datastoreconfig", ""))
                && SqliteStore.isAvailable(CaselessProperties.instance().getProperty("datastoreconfig", ""))
                && SqliteStore.instance().GetFileList().length > 0 && MySQLStore.instance().GetFileList().length == 0) {
                DataStoreConverter.convertDataStore(MySQLStore.instance(), SqliteStore.instance());
            }
        } else if (CaselessProperties.instance().getProperty("datastore", "h2store").equalsIgnoreCase("h2store")
            || !SqliteStore.isAvailable(CaselessProperties.instance().getProperty("datastoreconfig", ""))) {
            this.dataStore = H2Store.instance(CaselessProperties.instance().getProperty("datastoreconfig", ""));

            if (!this.dataStore.CanConnect()) {
                this.print("Could not create a connection with H2 Database. PhantomBot now shutting down...");
                PhantomBot.exitError();
            }

            if (SqliteStore.hasDatabase(CaselessProperties.instance().getProperty("datastoreconfig", ""))
                && SqliteStore.isAvailable(CaselessProperties.instance().getProperty("datastoreconfig", ""))
                && SqliteStore.instance().GetFileList().length > 0 && H2Store.instance().GetFileList().length == 0) {
                DataStoreConverter.convertDataStore(H2Store.instance(), SqliteStore.instance());
            }
        } else if (CaselessProperties.instance().getProperty("datastore", "h2store").equalsIgnoreCase("sqlite3store")
            || CaselessProperties.instance().getProperty("datastore", "h2store").isBlank()) {
            this.dataStore = SqliteStore.instance(CaselessProperties.instance().getProperty("datastoreconfig", ""));

            /* Handle index operations. */
            com.gmt2001.Console.debug.println("Checking database indexes, please wait...");
            this.dataStore.CreateIndexes();
        } else {
            com.gmt2001.Console.err.println("Invalid datastore selected. PhantomBot now shutting down...");
            PhantomBot.exitError();
        }

        /* Set the oauth key in the Twitch api and perform a validation. */
        this.validateOAuth();

        /* Check if the OS is Linux. */
        if (SystemUtils.IS_OS_LINUX && System.getProperty("interactive") == null) {
            try {
                int pid = Reflect.pid();

                Files.write(Paths.get(Reflect.GetExecutionPath(), "PhantomBot." + this.getBotName() + ".pid"), Integer.toString(pid).getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE,
                        StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
            } catch (IOException | NumberFormatException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /* Start things and start loading the scripts. */
        ExecutorService.schedule(this::init, 250, TimeUnit.MILLISECONDS);
    }

    public void validateOAuth() {
        if (!CaselessProperties.instance().getProperty("apioauth", "").isEmpty()) {
            Helix.instance().setOAuth(CaselessProperties.instance().getProperty("apioauth", ""));
            TwitchValidate.instance().validateAPI(CaselessProperties.instance().getProperty("apioauth", ""), "API (apioauth)");
        }

        if (!CaselessProperties.instance().getProperty("oauth", "").isEmpty()) {
            /* Validate the chat OAUTH token. */
            TwitchValidate.instance().validateChat(CaselessProperties.instance().getProperty("oauth"), "CHAT (oauth)");

            TwitchValidate.instance().checkOAuthInconsistencies(this.getChannelName());
        }
    }

    private void initChat() {
        this.validateOAuth();
        if (CaselessProperties.instance().getProperty("channel", "").isBlank()) {
            if (ConfigurationManager.newSetup()) {
                if (!ConfigurationManager.setupStarted()) {
                    com.gmt2001.Console.warn.println();
                    com.gmt2001.Console.warn.println("Detected new installation, starting setup process...");
                    com.gmt2001.Console.warn.println();
                    ConfigurationManager.doSetup();
                } else {
                    com.gmt2001.Console.warn.println();
                    com.gmt2001.Console.warn.println("Setup not completed yet");
                }
            } else {
                com.gmt2001.Console.warn.println();
                com.gmt2001.Console.warn.println("Channel to join is not set");
                com.gmt2001.Console.warn.println("Please go the the bots built-in setup page and setup the Admin section");
                com.gmt2001.Console.warn.println("The default URL is http://localhost:" + CaselessProperties.instance().getPropertyAsInt("baseport", 25000) + "/setup/");
                com.gmt2001.Console.warn.println();
            }
            if (!this.initChatBackoff.GetIsBackingOff()) {
                com.gmt2001.Console.warn.println("Will check again in " + (this.initChatBackoff.GetNextInterval() / 1000) + " seconds");
                com.gmt2001.Console.warn.println();
                this.initChatBackoff.BackoffAsync(() -> {
                    this.initChat();
                });
            }
        } else if (!TwitchValidate.instance().isChatValid()) {
            com.gmt2001.Console.warn.println();
            com.gmt2001.Console.warn.println("OAuth was invalid, not starting TMI (Chat)");
            com.gmt2001.Console.warn.println("Please go the the bots built-in oauth page and setup a new Bot (Chat) token");
            com.gmt2001.Console.warn.println("The default URL is http://localhost:" + CaselessProperties.instance().getPropertyAsInt("baseport", 25000) + "/oauth/");
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
            this.session = new TwitchSession(this.getChannelName(), this.getBotName());
            this.session.doSubscribe();

            this.tmi = new TwitchMessageInterface();
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

    public void reconnect() {
        if (this.session != null) {
            this.session.reconnect();
        }
        if (this.tmi != null) {
            this.tmi.reconnect();
        }
        if (this.pubSubEdge != null) {
            this.pubSubEdge.reconnect();
        }
    }

    public void reloadProperties() {
        this.checkPanelLogin();

        Helix.instance().setOAuth(CaselessProperties.instance().getProperty("apioauth", ""));

        if (this.pubSubEdge != null) {
            this.pubSubEdge.setOAuth(CaselessProperties.instance().getProperty("apioauth", ""));
        }

        if (this.httpAuthenticatedHandler != null) {
            this.httpAuthenticatedHandler.updateAuth(CaselessProperties.instance().getProperty("webauth"), this.getPanelOAuth().replace("oauth:", ""));
        }

        if (this.oauthHandler != null) {
            this.oauthHandler.updateAuth();
        }

        if (this.httpPanelHandler != null) {
            this.httpPanelHandler.updateAuth();
        }

        if (this.httpSetupHandler != null) {
            this.httpSetupHandler.updateAuth();
        }

        EventBus.instance().postAsync(new PropertiesReloadedEvent());
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
        return TwitchValidate.instance().getChatLogin();
    }

    public HTTPOAuthHandler getHTTPOAuthHandler() {
        return this.oauthHandler;
    }

    public HttpSetupHandler getHTTPSetupHandler() {
        return this.httpSetupHandler;
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
        /**
         * @botproperty channel - The Twitch channel the bot will operate in
         * @botpropertycatsort channel 30 10 Admin
         * @botpropertyrestart channel
         */
        return CaselessProperties.instance().getProperty("channel", "").toLowerCase();
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
     * @return The {@link TwitchMessageInterface} for the IRC connection
     */
    public TwitchMessageInterface getTMI() {
        return this.tmi;
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
                + System.getProperty("os.version") + " (" + System.getProperty("os.arch") + ")\r\n" + this.getBotInfo() + "\r\n\r\n";
    }

    /**
     * Method that gets the PhantomBot properties.
     *
     * @return
     * @deprecated
     */
    @Deprecated
    public CaselessProperties getProperties() {
        return CaselessProperties.instance();
    }

    private void checkPanelLogin() {
        /**
         * @botproperty paneluser - The username to login to the panel. Default `panel`
         * @botpropertycatsort paneluser 20 40 Panel Login
         */
        /**
         * @botproperty panelpassword - The password to login to the panel. Default is a randomly generated password
         * @botpropertycatsort panelpassword 30 40 Panel Login
         */
        if (CaselessProperties.instance().getProperty("paneluser", "").contains(":")) {
            Transaction t = CaselessProperties.instance().startTransaction();
            t.setProperty("paneluser", CaselessProperties.instance().getProperty("paneluser", "").replace(":", ""));
            t.commit();
            com.gmt2001.Console.warn.println("");
            com.gmt2001.Console.warn.println("Found a colon in panel username...");
            com.gmt2001.Console.warn.println("The panel username has been changed to: " + CaselessProperties.instance().getProperty("paneluser", "panel"));
            com.gmt2001.Console.warn.println("");
        }
        if (CaselessProperties.instance().getProperty("panelpassword", "").isBlank()) {
            String pass = PhantomBot.generateRandomString(12);
            Transaction t = CaselessProperties.instance().startTransaction();
            t.setProperty("panelpassword", pass);
            t.commit();
            com.gmt2001.Console.out.println("");
            com.gmt2001.Console.out.println("Did not find a panel password...");
            com.gmt2001.Console.out.println("The panel username has been set to: " + CaselessProperties.instance().getProperty("paneluser", "panel"));
            com.gmt2001.Console.out.println("The panel password has been set to: " + pass);
            com.gmt2001.Console.out.println("You can change this on the setup page of the bots webserver");
            com.gmt2001.Console.out.println("The default URL is http://localhost:" + CaselessProperties.instance().getPropertyAsInt("baseport", 25000) + "/setup/");
            com.gmt2001.Console.out.println("");
        }
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
        /**
         * @botproperty webenable - If `true`, the bots webserver is started. Default `true`
         * @botpropertycatsort webenable 300 700 HTTP/WS
         * @botpropertyrestart webenable
         */
        if (CaselessProperties.instance().getPropertyAsBoolean("webenable", true)) {
            this.checkPanelLogin();
            HTTPWSServer.instance();
            new HTTPNoAuthHandler().register();
            this.httpSetupHandler = new HttpSetupHandler();
            this.httpSetupHandler.register();
            this.httpAuthenticatedHandler = new HTTPAuthenticatedHandler(CaselessProperties.instance().getProperty("webauth"), this.getPanelOAuth().replace("oauth:", ""));
            this.httpAuthenticatedHandler.register();
            this.httpPanelHandler = new HTTPPanelAndYTHandler();
            this.httpPanelHandler.register();
            this.oauthHandler = new HTTPOAuthHandler();
            this.oauthHandler.register();
            this.panelHandler = (WsPanelHandler) new WsPanelHandler(CaselessProperties.instance().getProperty("webauthro"), CaselessProperties.instance().getProperty("webauth")).register();
            new WsPanelRemoteLoginHandler().register();
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

        /* Is the music toggled on? */
        /**
         * @botproperty musicenable - If `true`, enables the websocket handler for the Song Request/YouTube player. Default `true`
         * @botpropertycatsort musicenable 500 50 Misc
         * @botpropertyrestart musicenable
         */
        if (CaselessProperties.instance().getPropertyAsBoolean("musicenable", true)) {
            this.ytHandler = (WsYTHandler) new WsYTHandler(CaselessProperties.instance().getProperty("ytauthro"), CaselessProperties.instance().getProperty("ytauth")).register();
        }
        /* Connect to Discord if the data is present. */
        /**
         * @botproperty discord_token - The Bot token from the Discord Developer portal
         * @botpropertycatsort discord_token 10 200 Discord
         * @botpropertyrestart discord_token
         */
        if (!CaselessProperties.instance().getProperty("discord_token", "").isEmpty()) {
            DiscordAPI.instance().connect(CaselessProperties.instance().getProperty("discord_token", ""));
        }

        /* Set Streamlabs currency code, if possible */
        if (this.dataStore.HasKey("donations", "", "currencycode")) {
            TwitchAlertsAPIv1.instance().SetCurrencyCode(this.dataStore.GetString("donations", "", "currencycode"));
        }

        /* Set the TwitchAlerts OAuth key and limiter. */
        /**
         * @botproperty twitchalertskey - The access token for retrieving donations from StreamLabs
         * @botpropertycatsort twitchalertskey 20 260 StreamLabs
         * @botpropertyrestart twitchalertskey
         */
        /**
         * @botproperty twitchalertslimit - The maximum number of donations to pull from StreamLabs when updating. Default `5`
         * @botpropertycatsort twitchalertslimit 30 260 StreamLabs
         * @botpropertyrestart twitchalertslimit
         */
        if (!CaselessProperties.instance().getProperty("twitchalertskey", "").isEmpty()) {
            TwitchAlertsAPIv1.instance().SetAccessToken(CaselessProperties.instance().getProperty("twitchalertskey", ""));
            TwitchAlertsAPIv1.instance().SetDonationPullLimit(CaselessProperties.instance().getPropertyAsInt("twitchalertslimit", 5));
        }

        /* Set the YouTube API Key if provided. */
        /**
         * @botproperty youtubekey - The access token for YouTube APIv3
         * @botpropertycatsort youtubekey 10 230 YouTube
         * @botpropertyrestart youtubekey
         */
        if (!CaselessProperties.instance().getProperty("youtubekey", "").isEmpty()) {
            YouTubeAPIv3.instance().SetAPIKey(CaselessProperties.instance().getProperty("youtubekey", ""));
        }

        /* Set the TipeeeStream oauth key. */
        /**
         * @botproperty tipeeestreamkey - The access token for retrieving donations from TipeeeStream
         * @botpropertycatsort tipeeestreamkey 20 220 TipeeeStream
         * @botpropertyrestart tipeeestreamkey
         */
        /**
         * @botproperty tipeeestreamlimit - The maximum number of donations to pull from TipeeeStream when updating. Default `5`
         * @botpropertycatsort tipeeestreamlimit 30 220 TipeeeStream
         */
        if (!CaselessProperties.instance().getProperty("tipeeestreamkey", "").isEmpty()) {
            TipeeeStreamAPIv1.instance().SetOauth(CaselessProperties.instance().getProperty("tipeeestreamkey", ""));
            TipeeeStreamAPIv1.instance().SetLimit(CaselessProperties.instance().getPropertyAsInt("tipeeestreamlimit", 5));
        }

        /* Set the StreamElements JWT token. */
        /**
         * @botproperty streamelementsjwt - The JWT token for retrieving donations from StreamElements
         * @botpropertycatsort streamelementsjwt 20 210 StreamElements
         * @botpropertyrestart streamelementsjwt
         */
        /**
         * @botproperty streamelementsid - The user id for retrieving donations from StreamElements
         * @botpropertycatsort streamelementsid 10 210 StreamElements
         * @botpropertyrestart streamelementsid
         */
        /**
         * @botproperty streamelementslimit - The maximum number of donations to pull from StreamElements when updating. Default `5`
         * @botpropertycatsort streamelementslimit 30 210 StreamElements
         * @botpropertyrestart streamelementslimit
         */
        if (!CaselessProperties.instance().getProperty("streamelementsjwt", "").isEmpty() && !CaselessProperties.instance().getProperty("streamelementsid", "").isEmpty()) {
            StreamElementsAPIv2.instance().SetJWT(CaselessProperties.instance().getProperty("streamelementsjwt", ""));
            StreamElementsAPIv2.instance().SetID(CaselessProperties.instance().getProperty("streamelementsid", ""));
            StreamElementsAPIv2.instance().SetLimit(CaselessProperties.instance().getPropertyAsInt("streamelementslimit", 5));
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
        /**
         * @botproperty owner - The name of the bot owner, who has administrator privileges to the bot
         * @botpropertycatsort owner 40 10 Admin
         * @botpropertyrestart owner
         */
        Script.global.defineProperty("inidb", this.dataStore, 0);
        Script.global.defineProperty("username", UsernameCache.instance(), 0);
        Script.global.defineProperty("twitch", TwitchAPIv5.instance(), 0);
        Script.global.defineProperty("helix", Helix.instance(), 0);
        Script.global.defineProperty("botName", this.getBotName(), 0);
        Script.global.defineProperty("channelName", this.getChannelName(), 0);
        Script.global.defineProperty("ownerName", CaselessProperties.instance().getProperty("owner").toLowerCase(), 0);
        Script.global.defineProperty("ytplayer", this.ytHandler, 0);
        Script.global.defineProperty("panelsocketserver", this.panelHandler, 0);
        Script.global.defineProperty("alertspollssocket", this.alertsPollsHandler, 0);
        Script.global.defineProperty("random", this.random, 0);
        Script.global.defineProperty("youtube", YouTubeAPIv3.instance(), 0);
        Script.global.defineProperty("twitchCacheReady", PhantomBot.twitchCacheReady, 0);
        Script.global.defineProperty("isNightly", this.isNightly(), 0);
        Script.global.defineProperty("isPrerelease", this.isPrerelease(), 0);
        Script.global.defineProperty("version", this.botVersion(), 0);
        Script.global.defineProperty("changed", CaselessProperties.instance().getPropertyAsBoolean("newSetup", false), 0);
        Script.global.defineProperty("discordAPI", DiscordAPI.instance(), 0);
        Script.global.defineProperty("hasDiscordToken", hasDiscordToken(), 0);
        Script.global.defineProperty("customAPI", CustomAPI.instance(), 0);
        Script.global.defineProperty("streamLabsAPI", TwitchAlertsAPIv1.instance(), 0);

        /* And finally try to load init, that will then load the scripts */
        try {
            ScriptManager.loadScript(new File("./scripts/init.js"), "init.js");
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        EventSub.instance();
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
        /**
         * @botproperty backupdbauto - If `true`, the database is backed up to the ./backups folder every so often. Default `true`
         * @botpropertycatsort backupdbauto 400 30 Datastore
         *
         */
        if (CaselessProperties.instance().getPropertyAsBoolean("backupdbauto", CaselessProperties.instance().getPropertyAsBoolean("backupsqliteauto", true))) {
            this.doBackupDB();
        }

        this.initConsoleEventBus();
        this.initWeb();
        this.initChat();
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
        ExecutorService.shutdown();

        /* Gonna need a way to pass this to all channels */
        if (this.getSession() != null) {
            this.getSession().close();
        }

        if (this.tmi != null) {
            this.tmi.shutdown();
        }

        if (this.pubSubEdge != null) {
            this.pubSubEdge.shutdown();
        }

        EventSub.instance().shutdown();

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
                Files.deleteIfExists(Paths.get(Reflect.GetExecutionPath(), "PhantomBot." + this.getBotName() + ".pid"));
            } catch (IOException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        this.print(this.getBotName() + " is exiting.");
    }

    @Handler
    public void command(CommandEvent event) {
        if (event.getCommand().equals("pbinternalping")) {
            this.tmi.sendPing();
        }
    }

    /**
     * Connected to Twitch.
     *
     * @param event
     */
    @Handler
    public void ircJoinComplete(IrcJoinCompleteEvent event) {
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
        this.twitchCache = TwitchCache.instance();
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
        EventBus.instance().post(new CommandEvent(username, command, arguments));
    }

    /**
     * Load up main
     *
     * @param args
     * @throws java.io.IOException
     */
    public static void main(String[] args) throws IOException {
        System.setProperty("io.netty.noUnsafe", "true");

        if (Float.parseFloat(System.getProperty("java.specification.version")) < (float) 11) {
            System.out.println("Detected Java " + System.getProperty("java.version") + ". " + "PhantomBot requires Java 11 or later.");
            PhantomBot.exitError();
        }

        /* Print the user dir */
        com.gmt2001.Console.out.println("The working directory is: " + Reflect.GetExecutionPath());

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

        EventBus.instance().postAsync(new PropertiesLoadedEvent());

        /* Start PhantomBot */
        PhantomBot.instance = new PhantomBot();
    }

    private static void setStaticFields(CaselessProperties startProperties) {
        /* Check to enable debug mode */
        /**
         * @botproperty debugon - If `true`, enables debug output. Default `false`
         * @botpropertytype debugon Boolean
         * @botpropertycatsort debugon 10 900 Debug
         */
        PhantomBot.setDebugging(ConfigurationManager.getBoolean(startProperties, ConfigurationManager.PROP_DEBUGON, false));
        /* Check to enable debug to File */
        /**
         * @botproperty debuglog - If `true`, debug output is sent to log only, not the console. Default `false`
         * @botpropertytype debuglog Boolean
         * @botpropertycatsort debuglog 20 900 Debug
         */
        PhantomBot.setDebuggingLogOnly(ConfigurationManager.getBoolean(startProperties, ConfigurationManager.PROP_DEBUGLOG, false));
        /* Check to enable Script Reloading */
        /**
         * @botproperty reloadscripts - If `true`, scripts which are changed while the bot is running will be reloaded. Default `false`
         * @botpropertytype reloadscripts Boolean
         * @botpropertycatsort reloadscripts 150 50 Misc
         * @botpropertyrestart reloadscripts
         */
        PhantomBot.setReloadScripts(ConfigurationManager.getBoolean(startProperties, ConfigurationManager.PROP_RELOADSCRIPTS, false));
        /* Check to silence the loading of scripts at startup. */
        /**
         * @botproperty silentscriptsload - If `true`, the script loading messages during startup are suppressed. Default `false`
         * @botpropertytype silentscriptsload Boolean
         * @botpropertycatsort silentscriptsload 200 50 Misc
         * @botpropertyrestart silentscriptsload
         */
        PhantomBot.setSilentScriptsLoad(ConfigurationManager.getBoolean(startProperties, ConfigurationManager.PROP_SILENTSCRIPTSLOAD, false));
        /* Check to enable Rhino Debugger */
        /**
         * @botproperty rhinodebugger - If `true`, enables the Rhino debugger console. Default `false`
         * @botpropertytype rhinodebugger Boolean
         * @botpropertycatsort rhinodebugger 1000 900 Debug
         * @botpropertyrestart rhinodebugger
         */
        PhantomBot.setEnableRhinoDebugger(ConfigurationManager.getBoolean(startProperties, ConfigurationManager.PROP_RHINODEBUGGER, false));
    }

    private static void setEnableRhinoDebugger(boolean enableRhinoDebugger) {
        if (enableRhinoDebugger) {
            com.gmt2001.Console.out.println("Rhino Debugger will be launched if system supports it.");
        }
        PhantomBot.enableRhinoDebugger = enableRhinoDebugger;
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
        return generateRandomString(length, false);
    }

    public static String generateRandomString(int length, boolean allowSpecial) {
        String randomAllowed = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        if (allowSpecial) {
            randomAllowed += "-._~";
        }

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
        ExecutorService.scheduleAtFixedRate(() -> {
            if (!RepoVersion.isEdgeBuild() && !RepoVersion.isCustomBuild()) {
                try {
                    Thread.currentThread().setName("tv.phantombot.PhantomBot::doCheckPhantomBotUpdate");

                    if (RepoVersion.isNightlyBuild()) {
                        String latestNightly = HttpClient.get(URIUtil.create("https://raw.githubusercontent.com/PhantomBot/nightly-build/master/last_repo_version")).responseBody().trim();
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
                } catch (JSONException ex) {
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
    public void setTwitchCacheReady(boolean twitchCacheReady) {
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

        ExecutorService.scheduleAtFixedRate(() -> {
            Thread.currentThread().setName("tv.phantombot.PhantomBot::doBackupDB");

            String timestamp = LocalDateTime.now(getTimeZoneId()).format(DateTimeFormatter.ofPattern("ddMMyyyy.hhmmss"));

            this.dataStore.backupDB("phantombot.auto.backup." + timestamp + ".db");

            try {
                Iterator<File> dirIterator = FileUtils.iterateFiles(new File("./dbbackup"), new WildcardFileFilter("phantombot.auto.*"), null);
                while (dirIterator.hasNext()) {
                    File backupFile = dirIterator.next();
                    /**
                     * @botproperty backupdbkeepdays - The number of days before a DB backup is deleted. Default `5`
                     * @botpropertycatsort backupdbkeepdays 410 30 Datastore
                     */
                    if (FileUtils.isFileOlder(backupFile, (System.currentTimeMillis() - (long) (CaselessProperties.instance().getPropertyAsInt("backupdbkeepdays", CaselessProperties.instance().getPropertyAsInt("backupsqlitekeepdays", 5)) * 864e5)))) {
                        FileUtils.deleteQuietly(backupFile);
                    }
                }
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("Failed to clean up database backup directory: " + ex.getMessage());
            }
            /**
             * @botproperty backupdbhourfrequency - The number of hours between DB backups, if enabled. Default `24`
             * @botpropertycatsort backupdbhourfrequency 420 30 Datastore
             * @botpropertyrestart backupdbhourfrequency
             */
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

    public static String getTimeZone() {
        /**
         * @botproperty logtimezone - The timezone for timestamps in the log. Must be a valid IANA Time Zone Database name. Default `GMT`
         * @botpropertycatsort logtimezone 60 50 Misc
         */
        String tz = CaselessProperties.instance().getProperty("logtimezone", "GMT");

        if (tz == null || tz.isBlank()) {
            return "GMT";
        }

        return tz;
    }

    public static ZoneId getTimeZoneId() {
        ZoneId zoneId = ZoneId.of(getTimeZone());

        if (zoneId == null) {
            return ZoneId.systemDefault();
        }

        return zoneId;
    }

    public static boolean isInExitState() {
        return isInExitState;
    }

    public TwitchPubSub getPubSub() {
        return this.pubSubEdge;
    }

    public void setPubSub(TwitchPubSub pubSub) {
        this.pubSubEdge = pubSub;
    }

    public void setSession(TwitchSession session) {
        this.session = session;
    }
}
