/*
 * Copyright (C) 2016 phantombot.tv
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

import com.gmt2001.DataStore;
import com.gmt2001.IniStore;
import com.gmt2001.SqliteStore;
import com.gmt2001.TempStore;
import com.gmt2001.MySQLStore;
import com.gmt2001.TwitchAPIv3;
import com.gmt2001.YouTubeAPIv3;
import com.gmt2001.Logger;
import com.google.common.eventbus.Subscribe;
import de.simeonf.EventWebSocketSecureServer;
import de.simeonf.EventWebSocketServer;
import de.simeonf.MusicWebSocketSecureServer;
import com.illusionaryone.TwitchAlertsAPIv1;
import com.illusionaryone.StreamTipAPI;
import com.illusionaryone.SingularityAPI;
import com.illusionaryone.GameWispAPIv1;
import com.illusionaryone.TwitterAPI;
import com.illusionaryone.GitHubAPIv3;
import com.illusionaryone.GoogleURLShortenerAPIv1;
import com.illusionaryone.NoticeTimer;
import com.illusionaryone.DiscordAPI;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.FileNotFoundException;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map.Entry;
import java.util.TreeMap;
import java.util.TreeSet;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

import java.security.SecureRandom;
import java.math.BigInteger;

import me.mast3rplan.phantombot.cache.ChannelHostCache;
import me.mast3rplan.phantombot.cache.ChannelUsersCache;
import me.mast3rplan.phantombot.cache.FollowersCache;
import me.mast3rplan.phantombot.cache.SubscribersCache;
import me.mast3rplan.phantombot.cache.UsernameCache;
import me.mast3rplan.phantombot.cache.DonationsCache;
import me.mast3rplan.phantombot.cache.StreamTipCache;
import me.mast3rplan.phantombot.cache.EmotesCache;
import me.mast3rplan.phantombot.cache.TwitterCache;
import me.mast3rplan.phantombot.cache.TwitchCache;
import me.mast3rplan.phantombot.console.ConsoleInputListener;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.Listener;
import me.mast3rplan.phantombot.event.command.CommandEvent;
import me.mast3rplan.phantombot.event.devcommand.DeveloperCommandEvent;
import me.mast3rplan.phantombot.event.console.ConsoleInputEvent;
import me.mast3rplan.phantombot.event.irc.channel.IrcChannelUserModeEvent;
import me.mast3rplan.phantombot.event.irc.complete.IrcConnectCompleteEvent;
import me.mast3rplan.phantombot.event.irc.complete.IrcJoinCompleteEvent;
import me.mast3rplan.phantombot.event.irc.message.IrcChannelMessageEvent;
import me.mast3rplan.phantombot.event.irc.message.IrcPrivateMessageEvent;
import me.mast3rplan.phantombot.event.twitch.host.TwitchHostedEvent;
import me.mast3rplan.phantombot.event.twitch.online.TwitchOnlineEvent;
import me.mast3rplan.phantombot.event.twitch.offline.TwitchOfflineEvent;
import me.mast3rplan.phantombot.event.twitch.follower.TwitchFollowEvent;
import me.mast3rplan.phantombot.event.streamtip.donate.StreamTipDonationEvent;
import me.mast3rplan.phantombot.event.gamewisp.GameWispChangeEvent;
import me.mast3rplan.phantombot.event.gamewisp.GameWispBenefitsEvent;
import me.mast3rplan.phantombot.event.gamewisp.GameWispSubscribeEvent;
import me.mast3rplan.phantombot.event.gamewisp.GameWispAnniversaryEvent;
import me.mast3rplan.phantombot.event.subscribers.NewReSubscriberEvent;
import me.mast3rplan.phantombot.event.subscribers.NewSubscriberEvent;
import me.mast3rplan.phantombot.event.bits.BitsEvent;
import me.mast3rplan.phantombot.httpserver.HTTPServer;
import me.mast3rplan.phantombot.httpserver.NEWHTTPServer;
import me.mast3rplan.phantombot.httpserver.NEWHTTPSServer;
import me.mast3rplan.phantombot.musicplayer.MusicWebSocketServer;
import me.mast3rplan.phantombot.ytplayer.YTWebSocketServer;
import me.mast3rplan.phantombot.script.Script;
import me.mast3rplan.phantombot.script.ScriptApi;
import me.mast3rplan.phantombot.script.ScriptEventManager;
import me.mast3rplan.phantombot.script.ScriptManager;
import me.mast3rplan.phantombot.panel.PanelSocketServer;
import me.mast3rplan.phantombot.panel.PanelSocketSecureServer;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FileExistsException;
import org.apache.commons.lang3.SystemUtils;

import me.mast3rplan.phantombot.twitchwsirc.TwitchWSIRC;
import me.mast3rplan.phantombot.twitchwsirc.TwitchWSHostIRC;
import me.mast3rplan.phantombot.twitchwsirc.Channel;
import me.mast3rplan.phantombot.twitchwsirc.Session;
import java.net.URI;

public class PhantomBot implements Listener {
	/** Bot Information */
	private String botName;
	private String channelName;
	private String ownerName;
	private String oauth;
	private String apiOAuth;
	private String clientId;
	private static Double messageLimit;
	private static Double whisperLimit;

	/** Web Information */
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

	/** SSL information */
	private String httpsPassword = "password";
	private String httpsFileName = "cert.jks";

	/** DataStore Information */
	private DataStore dataStore;
	private String dataStoreType;
	private String dataStoreConfig;

	/** MySQL Information */
	private String mySqlConn;
	private String mySqlHost;
	private String mySqlPort;
	private String mySqlName;
	private String mySqlUser;
	private String mySqlPass;

	/** Twitter Information */
	private String twitterUsername;
	private String twitterAccessToken;
	private String twitterSecretToken;
	private String twitterConsumerSecret;
	private String twitterConsumerToken;
	private Boolean twitterAuthenticated;

	/** TwitchAlerts Information */
	private String twitchAlertsKey = "";
	private int twitchAlertsLimit = 0;

	/** StreamTip Information */
	private String streamTipOAuth = "";
	private String streamTipClientId = "";
	private int streamTipLimit = 0;

	/** GameWisp Information */
	private String gameWispOAuth;
	private String gameWispRefresh;

	/** Notice Timer and Handling */
	private NoticeTimer noticeTimer;

    /** Discord Configuration */
    private String discordToken = "";

	/** Caches */
	private FollowersCache followersCache;
	private ChannelHostCache hostCache = null;
	private SubscribersCache subscribersCache;
	private ChannelUsersCache channelUsersCache;
	private DonationsCache twitchAlertsCache;
	private StreamTipCache streamTipCache;
	private EmotesCache emotesCache;
	private TwitterCache twitterCache;
	private TwitchCache twitchCache;
	private UsernameCache usernameCache;
	public static String twitchCacheReady = "false";

	/** Socket Servers */
	private YTWebSocketServer youtubeSocketServer;
	private EventWebSocketServer eventWebSocketServer;
	private PanelSocketServer panelSocketServer;
	private PanelSocketSecureServer panelSocketSecureServer;
	private HTTPServer httpServer;
	private NEWHTTPServer newHttpServer;
	private NEWHTTPSServer newHttpsServer;

	/** PhantomBot Information */
	private static PhantomBot instance;
	public static Boolean reloadScripts = false;
	public static Boolean enableDebugging = false;
    public static Boolean enableRhinoDebugger = false;
	public Boolean isExiting = false;
	private Boolean interactive;
	private Boolean resetLogin = false;
	public static String timeZone = "GMT";

	/** Other Information */
	private Channel channel;
	private Session session;
	private String chanName;
	private Boolean timer = false;
	private String keyStorePath = "";
	private String keyStorePassword = "";
	private String keyPassword = "";
	private SecureRandom random;
	private static HashMap<String, Channel> channels;
	private static HashMap<String, Session> sessions;
	private static HashMap<String, String> apiOAuths;
	public static Boolean wsIRCAlternateBurst = false;
	private static Boolean newSetup = false;
	private Boolean devCommands = true;
	private Boolean joined = false;
        private TwitchWSHostIRC wsHostIRC;

    /** 
     * PhantomBot Instance.
     *
     * @return current instance of phantombot
     */
	public static PhantomBot instance() {
		return instance;
	}

	/** 
	 * Current Repo Of PhantomBot.
	 *
	 * @return {string} repo version 
	 */
	public String repoVersion() {
		return RepoVersion.getRepoVersion();
	}

	/** 
	 * Current Version Of PhantomBot.
	 *
	 * @return {string} bot version 
	 */
	public String botVersion() {
		if (isNightly()) {
			return "PhantomBot Version: " + RepoVersion.getPhantomBotVersion() + " - Nightly Build";
		}
		return "PhantomBot Version: " + RepoVersion.getPhantomBotVersion();
	}

	/**
	 * Used by the panel on the informations tab.
	 *
	 * @return {string} bot information
	 */
	public String getBotInfo() {
		return botVersion() + " (Revision: " + repoVersion() + ")";
	}

	/**
	 * Used at boot up
	 *
	 * @return {string} build revision 
	 */
	public String botRevision() {
		return "Build Revision: " + repoVersion();
	}

	/**
	 * Only used on bot boot up for now.
	 *
	 * @return {string} bot creator
	 */
	public String getBotCreator() {
		return "Creator: mast3rplan";
	}

	/**
	 * Only used on bot boot up for now.
	 *
	 * @return {string} bot developers
	 */
	public String botDevelopers() {
		return "Developers: PhantomIndex, Kojitsari, ScaniaTV, Zelakto & IllusionaryOne";
	}

	/**
	 * Only used on bot boot up for now.
	 *
	 * @return {string} bot website
	 */
	public String getWebSite() {
		return "https://phantombot.tv/";
	}

	/**
	 * Prints a message in the bot console.
	 *
	 * @param {Object} message
	 */
	private void print(String message) {
		com.gmt2001.Console.out.println(message);
	}


	/** PhantomBot instance */
	public PhantomBot(String botName, String oauth, String apiOAuth, String clientId, String channelName, String ownerName, int basePort, Double messageLimit, Double whisperLimit, String dataStoreType, 
		String dataStoreConfig, String youtubeOAuth, Boolean webEnabled, Boolean musicEnabled, Boolean useHttps, String keyStorePath, String keyStorePassword, String keyPassword, String twitchAlertsKey, 
		int twitchAlertsLimit, String streamTipOAuth, String streamTipClientId, int streamTipLimit, String gameWispOAuth, String gameWispRefresh, String panelUsername, String panelPassword, String timeZone, String twitterUsername,
		String twitterConsumerToken, String twitterConsumerSecret, String twitterSecretToken, String twitterAccessToken, String mySqlHost, String mySqlPort, String mySqlConn, String mySqlPass, String mySqlUser,
		String mySqlName, String webOAuth, String webOAuthThro, String youtubeOAuthThro, String youtubeKey, String twitchCacheReady, String httpsPassword, String httpsFileName, Boolean devCommands, String discordToken) {

        /** Set the exeption handler */
		Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        /** Start loading the bot information */
		print("");
		print(botVersion());
		print(botRevision());
		print(getBotCreator());
		print(botDevelopers());
		print(getWebSite());
		print("");

		/** System interactive */
		interactive = (System.getProperty("interactive") != null);

		/** Set the default bot variables */
		this.botName = botName.toLowerCase();
		this.channelName = channelName.toLowerCase();
		this.ownerName = ownerName.toLowerCase();
		this.oauth = oauth;
		this.apiOAuth = apiOAuth;

		/** Set the web variables */
		this.youtubeOAuth = youtubeOAuth;
		this.youtubeOAuthThro = youtubeOAuthThro;
		this.youtubeKey = youtubeKey;
		this.basePort = basePort;
		this.webOAuth = webOAuth;
		this.webOAuthThro = webOAuthThro;
		this.webEnabled = webEnabled;
		this.musicEnabled = musicEnabled;
		this.useHttps = useHttps;

		/** Set the datastore variables */
		this.dataStoreType = dataStoreType;
		this.dataStoreConfig = dataStoreConfig;

		/** Set the Twitter variables */
		this.twitterUsername = twitterUsername;
		this.twitterConsumerSecret = twitterConsumerSecret;
		this.twitterConsumerToken = twitterConsumerToken;
		this.twitterAccessToken = twitterAccessToken;
		this.twitterSecretToken = twitterSecretToken;
		this.twitterAuthenticated = false;

        /** Set the Discord variables */
        this.discordToken = discordToken;

		/** Set the GameWisp variables */
		this.gameWispOAuth = gameWispOAuth;
		this.gameWispRefresh = gameWispRefresh;

		/** Set the TwitchAlerts variables */
		this.twitchAlertsKey = twitchAlertsKey;
		this.twitchAlertsLimit = twitchAlertsLimit;

		/** Set the StreamTip variables */
		this.streamTipOAuth = streamTipOAuth;
		this.streamTipClientId = streamTipClientId;
		this.streamTipLimit = streamTipLimit;

		/** Set the MySql variables */
		this.mySqlName = mySqlName;
		this.mySqlUser = mySqlUser;
		this.mySqlPass = mySqlPass;
		this.mySqlConn = mySqlConn;
		this.mySqlHost = mySqlHost;
		this.mySqlPort = mySqlPort;

		/** twitch cache */
		PhantomBot.twitchCacheReady = "false";

		/** Set the SSL info */
		this.httpsFileName = httpsFileName;
		this.httpsPassword = httpsPassword;

		/** Set the timeZone */
		if (!timeZone.isEmpty()) {
			PhantomBot.timeZone = timeZone;
		} else {
			PhantomBot.timeZone = "GMT";
		}

		/** Set the panel username login for the panel to use */
		if (!panelUsername.isEmpty()) {
			this.panelUsername = panelUsername;
		} else {
			this.panelUsername = "panel";
		}

		/** Set the panel password login for the panel to use */
		if (!panelPassword.isEmpty()) {
			this.panelPassword = panelPassword;
		} else {
			this.panelPassword = "panel";
		}

		if (devCommands != true) {
			this.devCommands = devCommands;
		} else {
			this.devCommands = devCommands;
		}

		/** Set the message limit for session.java to use */
		if (messageLimit != 0) {
			PhantomBot.messageLimit = messageLimit;
		} else {
			PhantomBot.messageLimit = 18.75;
		}

		/** Set the whisper limit for session.java to use. *Currently not used.* */
		if (whisperLimit != 0) {
			PhantomBot.whisperLimit = 60.0;
		} else {
			PhantomBot.whisperLimit = 60.0;
		}

		/** Set the client id for the twitch api to use */
		if (!clientId.isEmpty()) {
			this.clientId = clientId;
		} else {
			this.clientId = "7wpchwtqz7pvivc3qbdn1kajz42tdmb";
		}

		/** Load up a new SecureRandom for the scripts to use */
		random = new SecureRandom();

		/** Create a map for multiple channels. */
		channels = new HashMap<>();

		/** Create a map for multiple sessions. */
		sessions = new HashMap<>();

		/** Create a map for multiple oauth tokens. */
		apiOAuths = new HashMap<>();

		/** Load the datastore */
		if (dataStoreType.equalsIgnoreCase("inistore")) {
			dataStore = IniStore.instance();
		} else if (dataStoreType.equalsIgnoreCase("mysqlstore")) {
			dataStore = MySQLStore.instance();
			if (this.mySqlPort.isEmpty()) {
				this.mySqlConn = "jdbc:mysql://" + this.mySqlHost + "/" + this.mySqlName + "?useSSL=false";
			} else {
				this.mySqlConn = "jdbc:mysql://" + this.mySqlHost + ":" + this.mySqlPort + "/" + this.mySqlName + "?useSSL=false";
			}
			/** Check to see if we can create a connection */
			if (dataStore.CreateConnection(this.mySqlConn, this.mySqlUser, this.mySqlPass) == null) {
				print("Could not create a connection with MySql. PhantomBot now shutting down...");
                System.exit(0);
            }
            /** Convert to MySql */
            if (IniStore.instance().GetFileList().length > 0) {
                ini2MySql(true);
            } else if (SqliteStore.instance().GetFileList().length > 0) {
                sqlite2MySql();
            }
		} else {
			dataStore = SqliteStore.instance();
			/** Create indexes. */
			if (!dataStore.exists("settings", "tables_indexed")) {
				print("Creating SQLite3 Indexes. This might take time...");
				dataStore.CreateIndexes();
				dataStore.set("settings", "tables_indexed", "true");
				print("Completed Creating SQLite3 Indexes!");
			}
			/** Convert the initstore to sqlite if the inistore exists and the db is empty */
		    if (IniStore.instance().GetFileList().length > 0 && SqliteStore.instance().GetFileList().length == 0) {
		    	ini2Sqlite(true);
		    }
		}

		/** Set the client Id in the Twitch api. */
		TwitchAPIv3.instance().SetClientID(this.clientId);
		/** Set the oauth key in the Twitch api. */
		TwitchAPIv3.instance().SetOAuth(this.apiOAuth);

		/** Set the TwitchAlerts OAuth key and limiter. */
		if (!twitchAlertsKey.isEmpty()) {
			TwitchAlertsAPIv1.instance().SetAccessToken(twitchAlertsKey);
			TwitchAlertsAPIv1.instance().SetDonationPullLimit(twitchAlertsLimit);
		}

		/** Set the StreamTip OAuth key, Client ID and limiter. */
		if (!streamTipOAuth.isEmpty() && !streamTipClientId.isEmpty()) {
			StreamTipAPI.instance().SetAccessToken(streamTipOAuth);
			StreamTipAPI.instance().SetDonationPullLimit(streamTipLimit);
			StreamTipAPI.instance().SetClientId(streamTipClientId);
		}


		/** Start things and start loading the scripts. */
		this.init();

		/** Start a channel instance to create a session, and then connect to WS-IRC @ Twitch. */
		this.channel = Channel.instance(this.channelName, this.botName, this.oauth, EventBus.instance());

                /** Start a host checking instance. */
                if (this.apiOAuth.length() > 0 && checkModuleEnabled("./handlers/hostHandler.js")) {
                    this.wsHostIRC = TwitchWSHostIRC.instance(this.channelName, this.apiOAuth, EventBus.instance());
                }

		/** Check if the OS is Linux. */
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

	/**
	 * Tells you if the build is a nightly.
	 *
	 * @return {boolean}
	 */
	public Boolean isNightly() {
        return RepoVersion.getNightlyBuild().equals("nightly_build");
	}

	/**
	 * Enables or disables the debug mode.
	 *
	 * @param {boolean} debug
	 */
	public static void setDebugging(Boolean debug) {
		PhantomBot.enableDebugging = debug;
	}

	/**
	 * Tells you the bot name.
	 *
	 * @return {string} bot name
	 */
	public String getBotName() {
		return this.botName;
	}

	/**
	 * Gives you the current data store
	 *
	 * @return {datastore} dataStore
	 */
	public DataStore getDataStore() {
		return this.dataStore;
	}

	/**
	 * Tells you if the bot is exiting
	 *
	 * @return {boolean} exit
	 */
	public Boolean isExiting() {
		return this.isExiting;
	}

	/**
	 * Give's you the channel for that channelName.
	 *
	 * @return {channel}
	 */
	public Channel getChannel() {
		return channels.get(this.channelName);
	}

	/**
	 * Give's you the channel for that channelName.
	 *
	 * @param {string} channelName
	 * @return {channel}
	 */
	public static Channel getChannel(String channelName) {
		return channels.get(channelName);
	}

	/**
	 * Give's you the session for that channel.
	 *
	 * @return {session}
	 */
	public Session getSession() {
		return sessions.get(this.channelName);
	}

	/**
	 * Give's you the session for that channel.
	 *
	 * @param {string} channelName
	 * @return {session}
	 */
	public static Session getSession(String channelName) {
		return sessions.get(channelName);
	}

	/**
	 * Give's you the api oauth for that channel.
	 *
	 * @param {string} channelName
	 * @return {string}
	 */
	public static String getOAuth(String channelName) {
		return apiOAuths.get(channelName);
	}

	/**
	 * Give's you the message limit.
	 *
	 * @return {long} message limit
	 */
	public static long getMessageInterval() {
        return (long) ((30.0 / messageLimit) * 1000);
    }

    /**
	 * Give's you the whisper limit. *Currently not used*
	 *
	 * @return {long} whisper limit
	 */
    public static long getWhisperInterval() {
        return (long) ((60.0 / whisperLimit) * 1000);
    }

    /**
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

    /**
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

    /**
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

    /**
     * Returns if Twitch WS-IRC Host Detection is connected.
     */
    public boolean wsHostIRCConnected() {
        return this.wsHostIRC.isConnected();
    }

    /**
     * Helper method to see if a module is enabled.
     */
    public boolean checkModuleEnabled(String module) {
        try {
            if (dataStore.GetString("modules", "", module).equals("true")) {
                return true;
            } else {
                return false;
            }
        } catch (NullPointerException ex) {
            return false;
        }
    }

    /**
	 * Loads everything up.
	 *
	 */
    private void init() {
    	/** Is the web toggle enabled? */
    	if (webEnabled) {
    		/** open a normal non ssl server */
    		httpServer = new HTTPServer(basePort, oauth);

    		/** Start this http server  */
    		httpServer.start();

    		/** Is the music toggled on? */
    		if (musicEnabled) {
    			/** Set the music player server */
    			youtubeSocketServer = new YTWebSocketServer((basePort + 3), youtubeOAuth, youtubeOAuthThro);
    			/** Start this youtube socket server */
    			youtubeSocketServer.start();
    			print("YouTubeSocketServer accepting connections on port: " + (basePort + 3));
    		}

    		/** Create a event server to get all the events. */
    		eventWebSocketServer = new EventWebSocketServer((basePort + 2));
    		/** Start this event server */
    		eventWebSocketServer.start();
    		print("EventSocketServer accepting connections on port: " + (basePort + 2));
    		/** make the event bus register this event server */
    		EventBus.instance().register(eventWebSocketServer);


    	    if (useHttps) {
    	        /** Set up the panel socket server */
    	        panelSocketSecureServer = new PanelSocketSecureServer((basePort + 4), webOAuth, webOAuthThro, httpsFileName, httpsPassword);
    	        /** Start the panel socket server */
    	        panelSocketSecureServer.start();
    	        print("PanelSocketSecureServer accepting connections on port: " + (basePort + 4) + " (SSL)");

    	    	/** Set up a new https server */
    	    	newHttpsServer = new NEWHTTPSServer((basePort + 5), oauth, webOAuth, panelUsername, panelPassword, httpsFileName, httpsPassword);
    	    	print("New HTTPS server accepting connection on port: " + (basePort + 5) + " (SSL)");
    	    } else {
    	        /** Set up the panel socket server */
    	        panelSocketServer = new PanelSocketServer((basePort + 4), webOAuth, webOAuthThro);
    	        /** Start the panel socket server */
    	        panelSocketServer.start();
    	        print("PanelSocketServer accepting connections on port: " + (basePort + 4));

    	    	/** Set up a new http server */
    	        newHttpServer = new NEWHTTPServer((basePort + 5), oauth, webOAuth, panelUsername, panelPassword);
    	        print("New HTTP server accepting connection on port: " + (basePort + 5));
    	    }
    	}

    	/** Enable gamewhisp if the oAuth is set */
        if (!gameWispOAuth.isEmpty() && checkModuleEnabled("./handlers/gameWispHandler.js")) {
    		/** Set the oAuths */
    		GameWispAPIv1.instance().SetAccessToken(gameWispOAuth);
                GameWispAPIv1.instance().SetRefreshToken(gameWispRefresh);
                SingularityAPI.instance().setAccessToken(gameWispOAuth);
                SingularityAPI.instance().StartService();
                /** get a fresh token */
                doRefreshGameWispToken();
        }

    	/** Check to see if all the Twitter info needed is there */
    	if (!twitterUsername.isEmpty() && !twitterAccessToken.isEmpty() && !twitterConsumerToken.isEmpty() && !twitterConsumerSecret.isEmpty() && !twitterSecretToken.isEmpty()) {
    		/** Set the Twitter tokens */
    		TwitterAPI.instance().setUsername(twitterUsername);
            TwitterAPI.instance().setAccessToken(twitterAccessToken);
            TwitterAPI.instance().setSecretToken(twitterSecretToken);
            TwitterAPI.instance().setConsumerKey(twitterConsumerToken);
            TwitterAPI.instance().setConsumerSecret(twitterConsumerSecret);
            /** Check to see if the tokens worked */
            this.twitterAuthenticated = TwitterAPI.instance().authenticate();
    	}

        /** Connect to Discord if the data is present. */
        if (!discordToken.isEmpty()) {
            DiscordAPI.instance().connect(discordToken);
        }

    	/** print a extra line in the console. */
    	print("");

    	/** Create configuration for YTPlayer v2.0 for the WS port. */
    	String data = "";
    	String http = "http://";

    	if (useHttps) {
    		com.gmt2001.Console.debug.println("Settings https in the panel config files.");
    		http = "https://";
    	}

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

    		/** Create a new file if it does not exist */
    		if (!new File ("./web/ytplayer/").exists()) new File ("./web/ytplayer/").mkdirs();
    		if (!new File ("./web/ytplayer/js").exists()) new File ("./web/ytplayer/js").mkdirs();

    		/** Write the data to that file */
    		Files.write(Paths.get("./web/ytplayer/js/playerConfig.js"), data.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
    	} catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        /** Create configuration for YTPlayer v2.0 for the WS port. */
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

    		/** Create a new file if it does not exist */
    		if (!new File ("./web/playlist/").exists()) new File ("./web/playlist/").mkdirs();
    		if (!new File ("./web/playlist/js").exists()) new File ("./web/playlist/js").mkdirs();

    		/** Write the data to that file */
    		Files.write(Paths.get("./web/playlist/js/playerConfig.js"), data.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
    	} catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        /** Create configuration for WebPanel for the WS port. */
        data = "";
        try {
        	data += "//Configuration for YTPlayer\r\n";
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

            /** Create a new file if it does not exist */
    		if (!new File ("./web/panel/").exists()) new File ("./web/panel/").mkdirs();
    		if (!new File ("./web/panel/js").exists()) new File ("./web/panel/js").mkdirs();

    		/** Write the data to that file */
    		Files.write(Paths.get("./web/panel/js/panelConfig.js"), data.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        /** Create configuration for Read-Only Access to WS port. */
        data = "";
        try {
        	data += "//Configuration for YTPlayer\r\n";
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

        	/** Create a new file if it does not exist */
    		if (!new File ("./web/common/").exists()) new File ("./web/common/").mkdirs();
    		if (!new File ("./web/common/js").exists()) new File ("./web/common/js").mkdirs();

    		/** Write the data to that file */
    		Files.write(Paths.get("./web/common/js/wsConfig.js"), data.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        data = "";

        /** check if the console is interactive */
        if (interactive) {
        	ConsoleInputListener consoleIL = new ConsoleInputListener();
        	/** Start the Console Input Listener */
        	consoleIL.start();
        }

        /** Register PhantomBot (this) with the event bus. */
        EventBus.instance().register(this);
        /** Register the script manager with the event bus. */
        EventBus.instance().register(ScriptEventManager.instance());

        /** Load the datastore config */
        dataStore.LoadConfig(dataStoreConfig);

        /** Export all these to the $. api in the scripts. */
        Script.global.defineProperty("inidb", dataStore, 0);
        Script.global.defineProperty("username", UsernameCache.instance(), 0);
        Script.global.defineProperty("twitch", TwitchAPIv3.instance(), 0);
        Script.global.defineProperty("botName", botName, 0);
        Script.global.defineProperty("channelName", channelName, 0);
        Script.global.defineProperty("channels", channels, 0);
        Script.global.defineProperty("ownerName", ownerName, 0);
        Script.global.defineProperty("ytplayer", youtubeSocketServer, 0);
        if (useHttps) {
            Script.global.defineProperty("panelsocketserver", panelSocketSecureServer, 0);
        } else {
            Script.global.defineProperty("panelsocketserver", panelSocketServer, 0);
        }
        Script.global.defineProperty("random", random, 0);
        Script.global.defineProperty("youtube", YouTubeAPIv3.instance(), 0);
        Script.global.defineProperty("shortenURL", GoogleURLShortenerAPIv1.instance(), 0);
        Script.global.defineProperty("gamewisp", GameWispAPIv1.instance(), 0);
        Script.global.defineProperty("twitter", TwitterAPI.instance(), 0);
        Script.global.defineProperty("twitchCacheReady", PhantomBot.twitchCacheReady, 0);
        Script.global.defineProperty("isNightly", isNightly(), 0);
        Script.global.defineProperty("version", botVersion(), 0);
        Script.global.defineProperty("changed", Boolean.valueOf(newSetup), 0);
        Script.global.defineProperty("discord", DiscordAPI.instance(), 0);

        /** open a new thread for when the bot is exiting */
        Thread thread = new Thread(new Runnable() {
        	@Override
        	public void run() {
        		onExit();
        	}
        });

        /** Get the un time for that new thread we just created */
        Runtime.getRuntime().addShutdownHook(thread);

        /** And finally try to load init, that will then load the scripts */
        try {
            ScriptManager.loadScript(new File("./scripts/init.js"));
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        /** Check for a update with PhantomBot */
        doCheckPhantomBotUpdate();
    }

    /**
     * Used for exiting the bot
     *
     */
    @SuppressWarnings("SleepWhileInLoop")
    public void onExit() {
    	print(this.botName + " is now shutting down...");
    	isExiting = true;

    	print("Stopping all events and message dispatching...");
    	/** Gonna need a way to pass this to all channels */
    	PhantomBot.getSession(this.channelName).setAllowSendMessages(false);

    	/** Shutdown all caches */
    	print("Terminating the Twitch channel host cache...");
    	ChannelHostCache.killall();
    	print("Terminating the Twitch channel user cache...");
    	ChannelUsersCache.killall();
    	print("Terminating the Twitch channel follower cache...");
    	FollowersCache.killall();
    	print("Terminating the Twitch channel subscriber cache...");
    	SubscribersCache.killall();
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

        /** Check to see if web is enabled */
    	if (webEnabled) {
    		print("Shutting down all web socket servers...");
    		httpServer.dispose();
    		if (!useHttps) {
    			newHttpServer.close();
    		} else {
    			newHttpsServer.close();
    		}
    		eventWebSocketServer.dispose();
    		youtubeSocketServer.dispose();
    	}

        try {
            for (int i = 10; i > 0; i--) {
                com.gmt2001.Console.out.print("\rWaiting for everthing else to shutdown... " + i + " ");
                Thread.sleep(1000);
            }
        } catch (InterruptedException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        print(this.botName + " now exiting.");
    }

    /**
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

    	//print("ircJoinComplete::" + this.chanName);

    	/** Add the channel/session in the array for later use */
    	PhantomBot.addChannel(this.chanName, event.getChannel());
    	PhantomBot.addSession(this.chanName, this.session);

    	/** Say .mods in the channel to check if the bot is a moderator */
    	this.session.saySilent(".mods");
    	/** Start the message timers for this session */
    	this.session.startTimers();

    	/** Load the caches for each channels */
    	this.emotesCache = EmotesCache.instance(this.chanName);
        this.followersCache = FollowersCache.instance(this.chanName);
        this.hostCache = ChannelHostCache.instance(this.chanName);
        this.subscribersCache = SubscribersCache.instance(this.chanName);
        this.twitchCache = TwitchCache.instance(this.chanName);// This does not create a new instance for multiple channels. Not sure why.
        this.channelUsersCache = ChannelUsersCache.instance(this.chanName);

        /** Start the donations cache if the keys are not null and the module is enabled */
        if (this.twitchAlertsKey != null && !this.twitchAlertsKey.isEmpty() && PhantomBot.instance().getDataStore().GetString("modules", "", "./handlers/donationHandler.js").equals("true")) {
        	this.twitchAlertsCache = DonationsCache.instance(this.chanName);
        }

        /** Start the streamtip cache if the keys are not null and the module is enabled */
        if (this.streamTipOAuth != null && !this.streamTipOAuth.isEmpty() && PhantomBot.instance().getDataStore().GetString("modules", "", "./handlers/streamTipHandler.js").equals("true")) {
        	this.streamTipCache = StreamTipCache.instance(this.chanName);
        }

        /** Start the twitter cache if the keys are not null and the module is enabled */
        if (this.twitterAuthenticated && PhantomBot.instance().getDataStore().GetString("modules", "", "./handlers/twitterHandler.js").equals("true")) {
        	this.twitterCache = TwitterCache.instance(this.chanName);
        }

	    /* Start the notice timer and notice handler. */
	    noticeTimer = NoticeTimer.instance(this.channelName, this.session);

        /** Export these to the $. api for the sripts to use */
        Script.global.defineProperty("twitchcache", this.twitchCache, 0);
        Script.global.defineProperty("followers", this.followersCache, 0);
        Script.global.defineProperty("hosts", this.hostCache, 0);
        Script.global.defineProperty("subscribers", this.subscribersCache, 0);
        Script.global.defineProperty("channelUsers", this.channelUsersCache, 0);
        Script.global.defineProperty("donations", this.twitchAlertsCache, 0);
        Script.global.defineProperty("streamtip", this.streamTipCache, 0);
        Script.global.defineProperty("emotes", this.emotesCache, 0);
    }

    /**
     * Get private messages from Twitch. 
     *
     */
    @Subscribe
    public void ircPrivateMessage(IrcPrivateMessageEvent event) {
    	String sender = event.getSender();
    	String message = event.getMessage();

    	/** Check to see if the sender is jtv */
    	if (sender.equalsIgnoreCase("jtv")) {
    		/** Splice the mod list so we can get all the mods */
    		if (message.startsWith("The moderators of this room are: ")) {
    			String[] moderators = message.substring(33).split(", ");

    			/** Check to see if the bot is a moderator */
    			for (String moderator : moderators) {
    				if (moderator.equalsIgnoreCase(this.botName)) {
    					/** Allow the bot to sends message to this session */
    					event.getSession().setAllowSendMessages(true);
    				}
    			}
    		}
    	}
    }

    /**
     * user modes from twitch
     *
     */
    @Subscribe
    public void ircUserMode(IrcChannelUserModeEvent event) {
    	/** Check to see if Twitch sent a mode event for the bot name */
    	if (event.getUser().equalsIgnoreCase(this.botName) && event.getMode().equalsIgnoreCase("o")) {
    		/** Did we get mod? if not try .mods again */
    		if (!event.getAdd()) {
    			event.getSession().saySilent(".mods");
    		}
    		/** Allow the bot to sends message to this session */
    		event.getSession().setAllowSendMessages(event.getAdd());
    	}
    }

    /**
     * messages from Twitch chat
     *
     */
    @Subscribe
    public void ircChannelMessage(IrcChannelMessageEvent event) {
    	if (event.getMessage().startsWith("!debug !dev")) {
    		devDebugCommands(event.getMessage(), event.getTags().get("user-id"), event.getSender());
    	}
    }

    /**
     * Check to see if someone is typing in the console. 
     *
     */
    @Subscribe
    public void consoleInput(ConsoleInputEvent event) {
    	String message = event.getMsg();
    	Boolean changed = false;
    	Boolean reset = false;
    	String arguments;
    	String[] argument = null;

    	/** Check to see if the message is null or has nothing in it */
    	if (message == null || message.isEmpty()) {
    		return;
    	}

    	/** Check for arguments */
    	if (message.contains(" ")) {
    		String messageString = message;
    		message = messageString.substring(0, messageString.indexOf(" "));
    		arguments = messageString.substring(messageString.indexOf(" ") + 1);
    		argument = arguments.split(" ");
    	}

    	/** Chat in a channel */
    	/*if (message.equalsIgnoreCase("chat") || message.equalsIgnoreCase("echo")) {
    		PhantomBot.getSession(channelName).say(message.replace("chat", "").replace("echo", ""), PhantomBot.getChannel(channelName));
    		// Need to be able to chat in a channel with multiple channels 
    		return;
    	}*/

        /** Update the followed (followers) table. */
        if (message.equalsIgnoreCase("fixfollowedtable")) {
        	TwitchAPIv3.instance().FixFollowedTable(channelName, dataStore, false);
        	return;
	    }

        /** Update the followed (followers) table - forced. */
        if (message.equalsIgnoreCase("fixfollowedtable-force")) {
        	TwitchAPIv3.instance().FixFollowedTable(channelName, dataStore, true);
        	return;
	    }

    	/** tests a follow event */
    	if (message.equalsIgnoreCase("followertest")) {
    		String randomUser = generateRandomString(10);
    		print("[CONSOLE] Executing followertest (User: " + randomUser + ")");
    		EventBus.instance().postAsync(new TwitchFollowEvent(randomUser, PhantomBot.getChannel(this.channelName)));
    		//Need to add a custom channel here for multi channel support. followertest (channel). argument[1]
    		return;
    	}

    	/** tests multiple follows */
    	if (message.equalsIgnoreCase("followerstest")) {
    		String randomUser = generateRandomString(10);
    		int followCount = 5;

    		if (argument != null) {
    			followCount = Integer.parseInt(argument[0]);
    		}

    		print("[CONSOLE] Executing followerstest (Count: " + followCount + ", User: " + randomUser + ")");
    		for (int i = 0; i < followCount; i++) {
    			EventBus.instance().postAsync(new TwitchFollowEvent(randomUser + "_" + i, PhantomBot.getChannel(this.channelName)));
    			//Need to add a custom channel here for multi channel support. followerstest (channel). argument[1]
    		}
    		return;
    	}

    	/** Test a subscriber event */
    	if (message.equalsIgnoreCase("subscribertest")) {
    		String randomUser = generateRandomString(10);
    		print("[CONSOLE] Executing subscribertest (User: " + randomUser + ")");
    		EventBus.instance().postAsync(new NewSubscriberEvent(PhantomBot.getSession(this.channelName), PhantomBot.getChannel(this.channelName), randomUser));
    		//Need to add a custom channel here for multi channel support. subscribertest (channel). argument[1]
    		return;
    	}

    	/** Test a resubscriber event */
    	if (message.equalsIgnoreCase("resubscribertest")) {
    		String randomUser = generateRandomString(10);
    		print("[CONSOLE] Executing resubscribertest (User: " + randomUser + ")");
    		EventBus.instance().postAsync(new NewReSubscriberEvent(PhantomBot.getSession(this.channelName), PhantomBot.getChannel(this.channelName), randomUser, "10"));
    		//Need to add a custom channel here for multi channel support. resubscribertest (channel). argument[1]
    		return;
    	}

    	/** Test the online event */
    	if (message.equalsIgnoreCase("onlinetest")) {
            print("[CONSOLE] Executing onlinetest");
            EventBus.instance().postAsync(new TwitchOnlineEvent(PhantomBot.getChannel(this.channelName)));
            //Need to add a custom channel here for multi channel support. onlinetest (channel). argument[1]
            return;
        }

        /** Test the offline event */
        if (message.equalsIgnoreCase("offlinetest")) {
            print("[CONSOLE] Executing offlinetest");
            EventBus.instance().postAsync(new TwitchOfflineEvent(PhantomBot.getChannel(this.channelName)));
            //Need to add a custom channel here for multi channel support. offlinetest (channel). argument[1]
            return;
        }

        /** Test the host event */
        if (message.equalsIgnoreCase("hosttest")) {
            print("[CONSOLE] Executing hosttest");
            EventBus.instance().postAsync(new TwitchHostedEvent(this.botName, PhantomBot.getChannel(this.channelName)));
            //Need to add a custom channel here for multi channel support. hosttest (channel). argument[1]
            return;
        }

        /** test the gamewisp subscriber event */
        if (message.equalsIgnoreCase("gamewispsubscribertest")) {
            print("[CONSOLE] Executing gamewispsubscribertest");
            EventBus.instance().postAsync(new GameWispSubscribeEvent(this.botName, 1));
            //Need to add a custom channel here for multi channel support. gamewispsubscribertest (channel). argument[1]
            return;
        }

        /** test the gamewisp resubscriber event */
        if (message.equalsIgnoreCase("gamewispresubscribertest")) {
            print("[CONSOLE] Executing gamewispresubscribertest");
            EventBus.instance().post(new GameWispAnniversaryEvent(this.botName, 2));
            //Need to add a custom channel here for multi channel support. gamewispresubscribertest (channel). argument[1]
            return;
        }

        /** test the bits event */
        if (message.equalsIgnoreCase("bitstest")) {
            print("[CONSOLE] Executing bitstest");
            EventBus.instance().post(new BitsEvent(PhantomBot.getSession(this.channelName), PhantomBot.getChannel(this.channelName), this.botName, "100"));
            //Need to add a custom channel here for multi channel support. bitstest (channel). argument[1]
            return;
        }

        /** enables debug mode */
        if (message.equalsIgnoreCase("debugon")) {
            print("[CONSOLE] Executing debugon: Enable Debug Mode");
            PhantomBot.setDebugging(true);
            return;
        }

        /** disables debug mode */
        if (message.equalsIgnoreCase("debugoff")) {
            print("[CONSOLE] Executing debugoff: Disable Debug Mode");
            PhantomBot.setDebugging(false);
            return;
        }

        /** Reset the bot login */
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

        /** Change the apiOAuth token */
        if (message.equalsIgnoreCase("apioauth")) {
        	System.out.print("Please enter you're oauth token that you generated from https://phantombot.tv/oauth while logged as the caster: ");
        	String newToken = System.console().readLine().trim();
        	apiOAuth = newToken;
        	changed = true;
        }

        /** Setup for MySql */
        if (message.equalsIgnoreCase("mysqlsetup")) {
            try {
                print("");
                print("PhantomBot MySQL setup.");
                print("");

                com.gmt2001.Console.out.print("Please enter your MySQL host name: ");
                String newHost = System.console().readLine().trim();
                mySqlHost = newHost;

                com.gmt2001.Console.out.print("Please enter your MySQL port: ");
                String newPost = System.console().readLine().trim();
                mySqlPort = newPost;

                com.gmt2001.Console.out.print("Please enter your MySQL db name: ");
                String newName = System.console().readLine().trim();
                mySqlName = newName;

                com.gmt2001.Console.out.print("Please enter a username for MySQL: ");
                String newUser = System.console().readLine().trim();
                mySqlUser = newUser;

                com.gmt2001.Console.out.print("Please enter a password for MySQL: ");
                String newPass = System.console().readLine().trim();
                mySqlPass = newPass;

                dataStoreType = "MySQLStore";

                print("PhantomBot MySQL setup done.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /** Setup for GameWisp */
        if (message.equalsIgnoreCase("gamewispsetup")) {
            try {
                print("");
                print("PhantomBot GameWisp setup.");
                print("");

                com.gmt2001.Console.out.print("Please enter your GameWisp OAuth key: ");
                String newToken = System.console().readLine().trim();
                gameWispOAuth = newToken;

                com.gmt2001.Console.out.print("Please enter your GameWisp refresh key: ");
                String newToken2 = System.console().readLine().trim();
                gameWispRefresh = newToken2;

                print("PhantomBot GameWisp setup done.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /** Setup for StreamLabs (TwitchAlerts) */
        if (message.equalsIgnoreCase("streamlabssetup")) {
            try {
                print("");
                print("PhantomBot StreamLabs setup.");
                print("");

                com.gmt2001.Console.out.print("Please enter your StreamLabs OAuth key: ");
                String newToken = System.console().readLine().trim();
                twitchAlertsKey = newToken;

                print("PhantomBot StreamLabs setup done.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /** Setup for StreamTip */
        if (message.equalsIgnoreCase("streamtipsetup")) {
            try {
                print("");
                print("PhantomBot StreamTip setup.");
                print("");

                com.gmt2001.Console.out.print("Please enter your StreamTip Api OAuth: ");
                String newToken = System.console().readLine().trim();
                streamTipOAuth = newToken;

                com.gmt2001.Console.out.print("Please enter your StreamTip Client Id: ");
                String newId = System.console().readLine().trim();
                streamTipClientId = newId;

                print("PhantomBot StreamTip setup done.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /** Setup the web panel login info */
        if (message.equalsIgnoreCase("panelsetup")) {
            try {
                print("");
                print("PhantomBot Web Panel setup.");
                print("Note: Do not use any ascii characters in your username of password.");
                print("");

                com.gmt2001.Console.out.print("Please enter a username of your choice: ");
                String newUser = System.console().readLine().trim();
                panelUsername = newUser;

                com.gmt2001.Console.out.print("Please enter a password of your choice: ");
                String newPass = System.console().readLine().trim();
                panelPassword = newPass;

                print("PhantomBot Web Panel setup done.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /** Setup for Twitter */
        if (message.equalsIgnoreCase("twittersetup")) {
            try {
                print("");
                print("PhantomBot Twitter setup.");
                print("");

                com.gmt2001.Console.out.print("Please enter your Twitter username: ");
                String newUser = System.console().readLine().trim();
                twitterUsername = newUser;

                com.gmt2001.Console.out.print("Please enter your consumer key: ");
                String newConsumerKey = System.console().readLine().trim();
                twitterConsumerToken = newConsumerKey;

                com.gmt2001.Console.out.print("Please enter your consumer secret: ");
                String newConsumerSecret = System.console().readLine().trim();
                twitterConsumerSecret = newConsumerSecret;

                com.gmt2001.Console.out.print("Please enter your access token: ");
                String newAccess = System.console().readLine().trim();
                twitterAccessToken = newAccess;

                com.gmt2001.Console.out.print("Please enter your access token secret: ");
                String newSecretAccess = System.console().readLine().trim();
                twitterSecretToken = newSecretAccess;

                /** Delete the old Twitter file if it exists */
                try {
                    File f = new File("./twitter.txt"); 
                    f.delete();
                } catch (NullPointerException ex) {
                    com.gmt2001.Console.debug.println(ex);
                }

                print("PhantomBot Twitter setup done.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /** Check to see if any settings have been changed */
        if (changed) {
        	String data = "";
        	try {
        		if (!reset) {
        			data += "user=" + botName + "\r\n";
                    data += "oauth=" + oauth + "\r\n";
                    data += "apioauth=" + apiOAuth + "\r\n";
                    data += "paneluser=" + panelUsername + "\r\n";
                    data += "panelpassword=" + panelPassword + "\r\n";
                    data += "channel=" + channelName + "\r\n";
                    data += "webauth=" + webOAuth + "\r\n";
                    data += "webauthro=" + webOAuthThro + "\r\n";
                    data += "clientid=" + clientId + "\r\n";
                    data += "owner=" + ownerName + "\r\n";
                    data += "baseport=" + basePort + "\r\n";
                    data += "msglimit30=" + messageLimit + "\r\n";
                    data += "whisperlimit60=" + whisperLimit + "\r\n";
                    data += "datastore=" + dataStoreType + "\r\n";
                    data += "youtubekey=" + youtubeKey + "\r\n";
                    data += "webenable=" + webEnabled + "\r\n";
                    data += "musicenable=" + musicEnabled + "\r\n";
                    data += "ytauth=" + youtubeOAuth + "\r\n";
                    data += "ytauthro=" + youtubeOAuthThro + "\r\n";
                    data += "usehttps=" + useHttps + "\r\n";
                    data += "httpsPassword=" + httpsPassword + "\r\n";
                    data += "httpsFileName=" + httpsFileName + "\r\n";
                    data += "keystorepath=" + keyStorePath + "\r\n";
                    data += "keystorepassword=" + keyStorePassword + "\r\n";
                    data += "keypassword=" + keyPassword + "\r\n";
                    data += "twitchalertskey=" + twitchAlertsKey + "\r\n";
                    data += "twitchalertslimit=" + twitchAlertsLimit + "\r\n";
                    data += "streamtipkey=" + streamTipOAuth + "\r\n";
                    data += "streamtiplimit=" + streamTipLimit + "\r\n";
                    data += "streamtipid=" + streamTipClientId + "\r\n";
                    data += "gamewispauth=" + gameWispOAuth + "\r\n";
                    data += "gamewisprefresh=" + gameWispRefresh + "\r\n";
                    data += "mysqlhost=" + mySqlHost + "\r\n";
                    data += "mysqlport=" + mySqlPort + "\r\n";
                    data += "mysqlname=" + mySqlName + "\r\n";
                    data += "mysqluser=" + mySqlUser + "\r\n";
                    data += "mysqlpass=" + mySqlPass + "\r\n";
                    data += "twitterUser=" + twitterUsername + "\r\n";
                    data += "twitter_consumer_key=" + twitterConsumerToken + "\r\n";
                    data += "twitter_consumer_secret=" + twitterConsumerSecret + "\r\n";
                    data += "twitter_access_token=" + twitterAccessToken + "\r\n";
                    data += "twitter_secret_token=" + twitterSecretToken + "\r\n";
                    data += "logtimezone=" + timeZone + "\r\n";
                    data += "devcommands=" + devCommands + "\r\n";
                    data += "discord_token=" + discordToken + "\r\n";
        		}

        		/** Write the new info to the bot login */
        		Files.write(Paths.get("./botlogin.txt"), data.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
        		/** save all the data */
                dataStore.SaveAll(true);
                print("");
                print("Changes have been saved.");
                print("Now exiting...");
                print("");
                reset = false;
                /** Exit the bot */
                System.exit(0);
        	} catch (IOException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
            return;
        }

        /** Save everything */
        if (message.equalsIgnoreCase("save")) {
        	print("[CONSOLE] Executing save");
        	dataStore.SaveAll(true);
        	return;
        }

        /** Exit phantombot */
        if (message.equalsIgnoreCase("exit")) {
        	print("[CONSOLE] Executing exit");
        	System.exit(0);
        	return;
        }

        /** handle any other commands */
        handleCommand(botName, event.getMsg(), PhantomBot.getChannel(this.channelName));
        // Need to support channel here. command (channel) argument[1]

        /* Handle dev commands */
        if (event.getMsg().startsWith("!debug !dev")) {
        	devDebugCommands(event.getMsg(), "no_id", botName);
        }
    }

    /** Handle commands */
    public void handleCommand(String username, String command, Channel channel) {
    	String arguments = "";

        /** Does the command have arguments? */
        if (command.contains(" ")) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }
        ScriptEventManager.instance().runDirect(new CommandEvent(username, command, arguments, null, channel));
    }

    /** Handle commands */
    public void handleCommand(String username, String command) {
    	String arguments = "";

        /** Does the command have arguments? */
        if (command.contains(" ")) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }
        ScriptEventManager.instance().runDirect(new CommandEvent(username, command, arguments));
    }

    /** Handles dev debug commands. */
    public void devDebugCommands(String command, String id, String sender) {
    	if (!command.equalsIgnoreCase("!debug !dev") && (id.equals("32896646") || id.equals("88951632") || id.equals("9063944") || id.equals("74012707") || id.equals("77632323") || sender.equalsIgnoreCase(ownerName) || sender.equalsIgnoreCase(botName))) {
    		String arguments = "";
    		String[] args = null;
    		command = command.substring(12);

    		if (!command.contains("!") || !devCommands) {
    			return;
    		}

    		command = command.substring(1);

    		if (command.contains(" ")) {
                String commandString = command;
                command = commandString.substring(0, commandString.indexOf(" "));
                arguments = commandString.substring(commandString.indexOf(" ") + 1);
                args = arguments.split(" ");
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

    /** convert SqliteStore to MySql */
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

    /** Convert iniStore to MySql */
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

    /** Convert iniStore to SqliteStore */
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

    /** Load up main */
    public static void main(String[] args) throws IOException {
    	/** Bot Information */
	    String botName = "";
	    String channelName = "";
	    String ownerName = "";
	    String oauth = "";
	    String apiOAuth = "";
	    String clientId = "";
	    Double messageLimit = 18.75;
	    Double whisperLimit = 60.0;
    
	    /** Web Information */
	    String panelUsername = "";
	    String panelPassword = "";
	    String webOAuth = "";
	    String webOAuthThro = "";
	    String youtubeOAuth = "";
	    String youtubeOAuthThro = "";
	    String youtubeKey = "";
	    Boolean webEnabled = true;
	    Boolean musicEnabled = true;
	    Boolean useHttps = false;
	    String httpsPassword = "password";
	    String httpsFileName = "cert.jks";
	    int basePort = 25000;
    
	    /** DataStore Information */
	    String dataStoreType = "";
	    String dataStoreConfig = "";
    
	    /** MySQL Information */
	    String mySqlConn = "";
	    String mySqlHost = "";
	    String mySqlPort = "";
	    String mySqlName = "";
	    String mySqlUser = "";
	    String mySqlPass = "";
    
	    /** Twitter Information */
	    String twitterUsername = "";
	    String twitterAccessToken = "";
	    String twitterSecretToken = "";
	    String twitterConsumerSecret = "";
	    String twitterConsumerToken = "";
    
	    /** TwitchAlerts Information */
	    String twitchAlertsKey = "";
	    int twitchAlertsLimit = 5;
    
	    /** StreamTip Information */
	    String streamTipOAuth = "";
	    String streamTipClientId = "";
	    int streamTipLimit = 5;
    
	    /** GameWisp Information */
	    String gameWispOAuth = "";
	    String gameWispRefresh = "";

        /** Discord Information */
        String discordToken = "";

	    /** Other information */
	    Boolean reloadScripts = false;
        String timeZone = "";
        Boolean changed = false;
        String keyStorePath = "";
	    String keyStorePassword = "";
	    String keyPassword = "";
	    Boolean devCommands = true;

        if (args.length > 0) {
            for (String arg : args) {
                if (arg.equalsIgnoreCase("help") || arg.equalsIgnoreCase("--help") || arg.equalsIgnoreCase("-h") || arg.equalsIgnoreCase("-?")) {
                    System.out.println("\r\nUsage: java -Dfile.encoding=UTF-8 -jar PhantomBot.jar [options]\r\n\r\n"
                    + "Options:\r\n"
                    + "    [printlogin]\r\n"
                    + "    [user=<bot username>]\r\n"
                    + "    [oauth=<bot irc oauth>]\r\n"
                    + "    [apioauth=<editor oauth>]\r\n"
                    + "    [clientid=<oauth clientid>]\r\n"
                    + "    [channel=<channel to join>]\r\n"
                    + "    [owner=<bot owner username>]\r\n"
                    + "    [baseport=<bot webserver port>]\r\n"
                    + "    [msglimit30=<message limit per 30 seconds>]\r\n"
                    + "    [whisperlimit60=<whisper limit per 60 seconds>]\r\n"
                    + "    [youtubekey=<youtube api key>]\r\n"
                    + "    [webenable=<true | false>]\r\n"
                    + "    [musicenable=<true | false>]\r\n"
                    + "    [twitchalertskey=<twitch alerts key>]\r\n"
                    + "    [twitchalertslimit=<limit>]\r\n"
                    + "    [streamtipkey=<stream tip key>]\r\n"
                    + "    [streamtiplimit=<limit>]\r\n"
                    + "    [gamewispauth=<gamewisp oauth>]\r\n"
                    + "    [gamewisprefresh=<gamewisp refresh key>]\r\n"
                    + "    [paneluser=<username>]\r\n"
                    + "    [panelpassword=<password>]\r\n"
                    + "    [mysqlhost=<MySQL server hostname>]\r\n"
                    + "    [mysqlport=<MySQL server port>]\r\n"
                    + "    [mysqlname=<MySQL database name>]\r\n"
                    + "    [mysqluser=<MySQL username>]\r\n"
                    + "    [mysqlpass=<MySQL password>]\r\n"
                    + "    [datastore=<IniStore|TempStore|SqliteStore|MySQLStore>] \r\n"
                    + "    [datastoreconfig=<IniStore Folder Name|SqliteStore config file>]\r\n\r\n"
                    + "DataStore Types:\r\n"
                    + "    IniStore: .ini files stored in inifiles directory\r\n"
                    + "    TempStore: Memory store, lost on shutdown\r\n"
                    + "    MySQLStore: MySQL Database\r\n"
                    + "    SqliteStore: Default. SQLite3 database\r\n\r\n"
               
                    + "Ports:\r\n"
                    + "    EventWebSocketServer <baseport> + 2\r\n"
                    + "    YouTubeSocketServer  <baseport> + 3\r\n"
                    + "    PanelWebSocketServer <baseport> + 4\r\n"
                    + "    NEW HTTP Server      <baseport> + 5");
                    return;
                }
            }
        }

        /** Print the user dir */
        com.gmt2001.Console.out.println("The working directory is: " + System.getProperty("user.dir"));

        /** Load up the bot info from the bot login file */
        try {
            if (new File("./botlogin.txt").exists()) {
                String data = FileUtils.readFileToString(new File("./botlogin.txt"));
                String[] lines = data.replaceAll("\\r", "").split("\\n");

                for (String line : lines) {
                    if (line.startsWith("logtimezone=") && line.length() >= 15) {
                        timeZone = line.substring(12);
                    }
                    if (line.startsWith("discord_token=") && line.length() >= 15) {
                        discordToken = line.substring(14);
                    }
                    if (line.startsWith("devcommands=") && line.length() >= 13) {
                    	devCommands = Boolean.valueOf(line.substring(12));
                    }
                    if (line.startsWith("reloadscripts")) {
                        com.gmt2001.Console.out.println("Enabling Script Reloading");
                        PhantomBot.reloadScripts = true;
                    }
                    if (line.startsWith("wsircburstalt")) {
                        com.gmt2001.Console.out.println("Using Alternate Burst Method for WS-IRC");
                        PhantomBot.wsIRCAlternateBurst = true;
                    }
                    if (line.startsWith("debugon")) {
                        com.gmt2001.Console.out.println("Debug Mode Enabled via botlogin.txt");
                        PhantomBot.enableDebugging = true;
                    }
                    if (line.startsWith("rhinodebugger")) {
                        com.gmt2001.Console.out.println("Rhino Debugger will be launched if system supports it.");
                        PhantomBot.enableRhinoDebugger = true;
                    }
                    if (line.startsWith("user=") && line.length() > 8) {
                        botName = line.substring(5);
                    }
                    if (line.startsWith("webauth=") && line.length() > 11) {
                        webOAuth = line.substring(8);
                    }
                    if (line.startsWith("webauthro=") && line.length() > 13) {
                        webOAuthThro = line.substring(10);
                    }
                    if (line.startsWith("paneluser=") && line.length() > 12) {
                        panelUsername = line.substring(10);
                    }
                    if (line.startsWith("panelpassword=") && line.length() > 16) {
                        panelPassword = line.substring(14);
                    }
                    if (line.startsWith("mysqlhost=") && line.length() > 11) {
                        mySqlHost = line.substring(10);
                    }
                    if (line.startsWith("mysqlport=") && line.length() > 11) {
                        mySqlPort = line.substring(10);
                    }
                    if (line.startsWith("mysqlname=") && line.length() > 11) {
                        mySqlName = line.substring(10);
                    }
                    if (line.startsWith("mysqluser=") && line.length() > 11) {
                        mySqlUser = line.substring(10);
                    }
                    if (line.startsWith("mysqlpass=") && line.length() > 11) {
                        mySqlPass = line.substring(10);
                    }
                    if (line.startsWith("ytauth=") && line.length() > 8) {
                        youtubeOAuth = line.substring(7);
                    }
                    if (line.startsWith("ytauthro=") && line.length() > 10) {
                        youtubeOAuthThro = line.substring(9);
                    }
                    if (line.startsWith("gamewispauth=") && line.length() > 14) {
                        gameWispOAuth = line.substring(13);
                    }
                    if (line.startsWith("gamewisprefresh=") && line.length() > 17) {
                        gameWispRefresh = line.substring(16);
                    }
                    if (line.startsWith("oauth=") && line.length() > 9) {
                        oauth = line.substring(6);
                    }
                    if (line.startsWith("apioauth=") && line.length() > 12) {
                        apiOAuth = line.substring(9);
                    }
                    if (line.startsWith("clientid=") && line.length() > 12) {
                        clientId = line.substring(9);
                    }
                    if (line.startsWith("channel=") && line.length() > 11) {
                        channelName = line.substring(8);
                    }
                    if (line.startsWith("owner=") && line.length() > 9) {
                        ownerName = line.substring(6);
                    }
                    if (line.startsWith("baseport=") && line.length() > 10) {
                        basePort = Integer.parseInt(line.substring(9));
                    }
                    if (line.startsWith("msglimit30=") && line.length() > 12) {
                        messageLimit = Double.parseDouble(line.substring(11));
                    }
                    if (line.startsWith("whisperlimit60=") && line.length() > 16) {
                        whisperLimit = Double.parseDouble(line.substring(15));
                    }
                    if (line.startsWith("datastore=") && line.length() > 11) {
                        dataStoreType = line.substring(10);
                    }
                    if (line.startsWith("youtubekey=") && line.length() > 12) {
                        youtubeKey = line.substring(11);
                    }
                    if (line.startsWith("webenable=") && line.length() > 11) {
                        webEnabled = Boolean.valueOf(line.substring(10));
                    }
                    if (line.startsWith("musicenable=") && line.length() > 13) {
                        musicEnabled = Boolean.valueOf(line.substring(12));
                    }
                    if (line.startsWith("usehttps=") && line.length() > 10) {
                        useHttps = Boolean.valueOf(line.substring(9));
                    }
                    if (line.startsWith("httpsPassword=") && line.length() > 15) {
                        httpsPassword = line.substring(14);
                    }
                    if (line.startsWith("httpsFileName=") && line.length() > 15) {
                        httpsFileName = line.substring(14);
                    }
                    if (line.startsWith("keystorepath=") && line.length() > 14) {
                        keyStorePath = line.substring(13);
                    }
                    if (line.startsWith("keystorepassword=") && line.length() > 18) {
                        keyStorePassword = line.substring(17);
                    }
                    if (line.startsWith("keypassword=") && line.length() > 13) {
                        keyPassword = line.substring(12);
                    }
                    if (line.startsWith("twitchalertskey=") && line.length() > 17) {
                        twitchAlertsKey = line.substring(16);
                    }
                    if (line.startsWith("twitchalertslimit=") && line.length() > 18) {
                        try {
                            twitchAlertsLimit = Integer.parseInt(line.substring(18));
                        } catch (NumberFormatException nfe) {
                            twitchAlertsLimit = 5;
                        }
                    }
                    if (line.startsWith("streamtipkey=") && line.length() > 14) {
                        streamTipOAuth = line.substring(13);
                    }
                    if (line.startsWith("streamtipid=") && line.length() > 13) {
                        streamTipClientId = line.substring(12);
                    }
                    if (line.startsWith("streamtiplimit=") && line.length() > 16) {
                        try {
                            streamTipLimit = Integer.parseInt(line.substring(15));
                        } catch (NumberFormatException nfe) {
                            streamTipLimit = 5;
                        }
                    }
                    if (line.startsWith("twitterUser=") && line.length() > 13) {
                        twitterUsername = line.substring(12);
                    }
                    if (line.startsWith("twitter_access_token=") && line.length() > 22) {
                        twitterAccessToken = line.substring(21);
                    }
                    if (line.startsWith("twitter_secret_token=") && line.length() > 22) {
                        twitterSecretToken = line.substring(21);
                    }
                    if (line.startsWith("twitter_consumer_secret=") && line.length() > 25) {
                        twitterConsumerSecret = line.substring(24);
                    }
                    if (line.startsWith("twitter_consumer_key=") && line.length() > 22) {
                        twitterConsumerToken = line.substring(21);
                    }
                }
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        /** Check to see if there's a webOauth set */
        if (webOAuth.isEmpty()) {
            webOAuth = generateWebAuth();
            com.gmt2001.Console.debug.println("New webauth key has been generated for botlogin.txt");
            changed = true;
        }
        /** Check to see if there's a webOAuthThro set */
        if (webOAuthThro.isEmpty()) {
            webOAuthThro = generateWebAuth();
            com.gmt2001.Console.debug.println("New webauth read-only key has been generated for botlogin.txt");
            changed = true;
        }
        /** Check to see if there's a panelUsername set */
        if (panelUsername.isEmpty()) {
            com.gmt2001.Console.debug.println("No Panel Username, using default value of 'panel' for Control Panel and YouTube Player");
            panelUsername = "panel";
            changed = true;
        }
        /** Check to see if there's a panelPassword set */
        if (panelPassword.isEmpty()) {
            com.gmt2001.Console.debug.println("No Panel Password, using default value of 'panel' for Control Panel and YouTube Player");
            panelPassword = "panel";
            changed = true;
        }
        /** Check to see if there's a youtubeOAuth set */
        if (youtubeOAuth.isEmpty()) {
            youtubeOAuth = generateWebAuth();
            com.gmt2001.Console.debug.println("New YouTube websocket key has been generated for botlogin.txt");
            changed = true;
        }
        /** Check to see if there's a youtubeOAuthThro set */
        if (youtubeOAuthThro.isEmpty()) {
            youtubeOAuthThro = generateWebAuth();
            com.gmt2001.Console.debug.println("New YouTube read-only websocket key has been generated for botlogin.txt");
            changed = true;
        }

        /** Make a new botlogin with the botName, oauth or channel is not found */
        if (botName.isEmpty() || oauth.isEmpty() || channelName.isEmpty()) {
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

                com.gmt2001.Console.out.print("1. Please enter the bot's Twitch username: ");
                botName = System.console().readLine().trim();

                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("2. You will now need a OAuth token for the bot to be able to chat.\r\n");
                com.gmt2001.Console.out.print("Please note, this OAuth token needs to be generated while you're logged in into the bot's Twitch account.\r\n");
                com.gmt2001.Console.out.print("If you're not logged in as the bot, please go to https://twitch.tv/ and login as the bot.\r\n");
                com.gmt2001.Console.out.print("Get the bot's OAuth token here: https://twitchapps.com/tmi/\r\n");
                com.gmt2001.Console.out.print("Please enter the bot's OAuth token: ");
                //com.gmt2001.Console.out.print("Please enter the bot's OAuth token generated from https://twitchapps.com/tmi while logged in as the bot: ");
                oauth = System.console().readLine().trim();

                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("3. You will now need your channel OAuth token for the bot to be able to change your title and game.\r\n");
                com.gmt2001.Console.out.print("Please note, this OAuth token needs to be generated while you're logged in into your caster account.\r\n");
                com.gmt2001.Console.out.print("If you're not logged in as the caster, please go to https://twitch.tv/ and login as the caster.\r\n");
                com.gmt2001.Console.out.print("Get the your OAuth token here: https://phantombot.tv/oauth/\r\n");
                com.gmt2001.Console.out.print("Please enter your OAuth token: ");
                //com.gmt2001.Console.out.print("Please enter your OAuth token generated from https://phantombot.tv/oauth while logged in as the caster: ");
                apiOAuth = System.console().readLine().trim();

                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("4. Please enter the name of the Twitch channel the bot should join: ");
                channelName = System.console().readLine().trim();

                /*if (channelName.contains(".tv")) {
                	com.gmt2001.Console.out.print("Please enter the name of the Twitch channel, not the link: ");
                	channelName = System.console().readLine().trim();
                }*/

                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("5. Please enter a custom username for the web panel: ");
                panelUsername = System.console().readLine().trim();

                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("6. Please enter a custom password for the web panel: ");
                panelPassword = System.console().readLine().trim();

                changed = true;
                newSetup = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
                com.gmt2001.Console.out.println("[ERROR] Faild to setup PhantomBot. Now exiting...");
                System.exit(0);
            }
        }

        /** Check for a owner */
        if (ownerName.isEmpty()) {
            ownerName = channelName;
            changed = true;
        }

        /** Make sure the oauth has been set correctly */
        if (!oauth.startsWith("oauth:") && !oauth.isEmpty()) {
            oauth = "oauth:" + oauth;
            changed = true;
        }

        /** Make sure the apiOAuth has been set correctly */
        if (!apiOAuth.startsWith("oauth:") && !apiOAuth.isEmpty()) {
            apiOAuth = "oauth:" + apiOAuth;
            changed = true;
        }

        /** Make sure the channelName does not have a # */
        if (channelName.startsWith("#")) {
            channelName = channelName.substring(1);
            changed = true;
        }

        if (args.length > 0) {
            for (String arg : args) {
            	arg = arg.toLowerCase();

            	if (arg.startsWith("user=") && arg.length() > 8) {
                    if (!botName.equals(arg.substring(5))) {
                        botName = arg.substring(5);
                        changed = true;
                    }
                }
                if (arg.startsWith("oauth=") && arg.length() > 9) {
                    if (!oauth.equals(arg.substring(6))) {
                        oauth = arg.substring(6);
                        changed = true;
                    }
                }
                if (arg.startsWith("apioauth=") && arg.length() > 12) {
                    if (!apiOAuth.equals(arg.substring(9))) {
                        apiOAuth = arg.substring(9);
                        changed = true;
                    }
                }
                if (arg.startsWith("paneluser=") && arg.length() > 12) {
                    if (!panelUsername.equals(arg.substring(10))) {
                        panelUsername = arg.substring(10);
                        changed = true;
                    }
                }
                if (arg.startsWith("panelpassword=") && arg.length() > 16) {
                    if (!panelPassword.equals(arg.substring(14))) {
                        panelPassword = arg.substring(14);
                        changed = true;
                    }
                }
                if (arg.startsWith("mysqlhost=") && arg.length() > 11) {
                    if (!mySqlHost.equals(arg.substring(10))) {
                        mySqlHost = arg.substring(10);
                        changed = true;
                    }
                }
                if (arg.startsWith("mysqlport=") && arg.length() > 11) {
                    if (!mySqlPort.equals(arg.substring(10))) {
                        mySqlPort = arg.substring(10);
                        changed = true;
                    }
                }
                if (arg.startsWith("mysqlname=") && arg.length() > 11) {
                    if (!mySqlName.equals(arg.substring(10))) {
                        mySqlName = arg.substring(10);
                        changed = true;
                    }
                }
                if (arg.startsWith("mysqluser=") && arg.length() > 11) {
                    if (!mySqlUser.equals(arg.substring(14))) {
                        mySqlUser = arg.substring(10);
                        changed = true;
                    }
                }
                if (arg.startsWith("mysqlpass=") && arg.length() > 11) {
                    if (!mySqlPass.equals(arg.substring(10))) {
                        mySqlPass = arg.substring(10);
                        changed = true;
                    }
                }
                if (arg.startsWith("gamewispauth=") && arg.length() > 14) {
                    if (!gameWispOAuth.equals(arg.substring(13))) {
                        gameWispOAuth = arg.substring(13);
                        changed = true;
                    }
                }
                if (arg.startsWith("gamewisprefresh=") && arg.length() > 17) {
                    if (!gameWispRefresh.equals(arg.substring(16))) {
                        gameWispRefresh = arg.substring(16);
                        changed = true;
                    }
                }
                if (arg.startsWith("clientid=") && arg.length() > 12) {
                    if (!clientId.equals(arg.substring(9))) {
                        clientId = arg.substring(9);
                        changed = true;
                    }
                }
                if (arg.startsWith("channel=") && arg.length() > 11) {
                    if (!channelName.equals(arg.substring(8))) {
                        channelName = arg.substring(8);
                        changed = true;
                    }
                }
                if (arg.startsWith("owner=") && arg.length() > 9) {
                    if (!ownerName.equals(arg.substring(6))) {
                        ownerName = arg.substring(6);
                        changed = true;
                    }
                }
                if (arg.startsWith("baseport=") && arg.length() > 10) {
                    if (basePort != Integer.parseInt(arg.substring(9))) {
                        basePort = Integer.parseInt(arg.substring(9));
                        changed = true;
                    }
                }
                if (arg.startsWith("msglimit30=") && arg.length() > 12) {
                    if (messageLimit != Double.parseDouble(arg.substring(11))) {
                        messageLimit = Double.parseDouble(arg.substring(11));
                        changed = true;
                    }
                }
                if (arg.startsWith("whisperlimit60=") && arg.length() > 16) {
                    if (whisperLimit != Double.parseDouble(arg.substring(15))) {
                        whisperLimit = Double.parseDouble(arg.substring(15));
                        changed = true;
                    }
                }
                if (arg.startsWith("datastore=") && arg.length() > 11) {
                    if (!dataStoreType.equals(arg.substring(10))) {
                        dataStoreType = arg.substring(10);
                        changed = true;
                    }
                }
                if (arg.startsWith("datastoreconfig=") && arg.length() > 17) {
                    dataStoreConfig = arg.substring(16);
                }
                if (arg.startsWith("devcommands=") && arg.length() > 13) {
                    devCommands = Boolean.valueOf(arg.substring(12));
                }
                if (arg.startsWith("youtubekey=") && arg.length() > 12) {
                    if (!youtubeKey.equals(arg.substring(11))) {
                        youtubeKey = arg.substring(11);
                        changed = true;
                    }
                }
                if (arg.startsWith("webenable=") && arg.length() > 11) {
                    if (webEnabled != Boolean.valueOf(arg.substring(10))) {
                        webEnabled = Boolean.valueOf(arg.substring(10));
                        changed = true;
                    }
                }
                if (arg.startsWith("musicenable=") && arg.length() > 13) {
                    if (musicEnabled != Boolean.valueOf(arg.substring(12))) {
                        musicEnabled = Boolean.valueOf(arg.substring(12));
                        changed = true;
                    }
                }
                if (arg.startsWith("usehttps=") && arg.length() > 10) {
                    if (useHttps != Boolean.valueOf(arg.substring(9))) {
                        useHttps = Boolean.valueOf(arg.substring(9));
                        changed = true;
                    }
                }
                if (arg.startsWith("httpsPassword=") && arg.length() > 15) {
                    if (httpsPassword != arg.substring(14)) {
                        httpsPassword = arg.substring(14);
                        changed = true;
                    }
                }
                if (arg.startsWith("httpsFileName=") && arg.length() > 15) {
                    if (httpsFileName != arg.substring(14)) {
                        httpsFileName = arg.substring(14);
                        changed = true;
                    }
                }
                if (arg.startsWith("keystorepath=") && arg.length() > 14) {
                    if (!keyStorePath.equals(arg.substring(13))) {
                        keyStorePath = arg.substring(13);
                        changed = true;
                    }
                }
                if (arg.startsWith("keystorepassword=") && arg.length() > 18) {
                    if (!keyStorePassword.equals(arg.substring(17))) {
                        keyStorePassword = arg.substring(17);
                        changed = true;
                    }
                }
                if (arg.startsWith("keypassword=") && arg.length() > 13) {
                    if (!keyPassword.equals(arg.substring(12))) {
                        keyPassword = arg.substring(12);
                        changed = true;
                    }
                }
                if (arg.startsWith("twitchalertskey=") && arg.length() > 17) {
                    if (!twitchAlertsKey.equals(arg.substring(16))) {
                        twitchAlertsKey = arg.substring(16);
                        changed = true;
                    }
                }
                if (arg.startsWith("twitchalertslimit=") && arg.length() > 19) {
                    if (twitchAlertsLimit != Integer.parseInt(arg.substring(18))) {
                        try {
                            twitchAlertsLimit = Integer.parseInt(arg.substring(18));
                            changed = true;
                        } catch (NumberFormatException nfe) {
                            twitchAlertsLimit = 5;
                        }
                    }
                }
                if (arg.startsWith("streamtipkey=") && arg.length() > 14) {
                    if (!streamTipOAuth.equals(arg.substring(13))) {
                        streamTipOAuth = arg.substring(13);
                        changed = true;
                    }
                }
                if (arg.startsWith("streamtipid=") && arg.length() > 13) {
                    if (!streamTipClientId.equals(arg.substring(12))) {
                        streamTipClientId = arg.substring(12);
                        changed = true;
                    }
                }
                if (arg.startsWith("streamtiplimit=") && arg.length() > 16) {
                    if (streamTipLimit != Integer.parseInt(arg.substring(15))) {
                        try {
                            streamTipLimit = Integer.parseInt(arg.substring(15));
                            changed = true;
                        } catch (NumberFormatException nfe) {
                            streamTipLimit = 5;
                        }
                    }
                }
                if (arg.startsWith("twitterUser=") && arg.length() > 13) {
                    if (!twitterUsername.equals(arg.substring(12))) {
                        twitterUsername = arg.substring(12);
                        changed = true;
                    }
                }
                if (arg.startsWith("twitter_secret_token=") && arg.length() > 22) {
                    if (!twitterSecretToken.equals(arg.substring(21))) {
                        twitterSecretToken = arg.substring(21);
                        changed = true;
                    }
                }
                if (arg.startsWith("twitter_access_token=") && arg.length() > 22) {
                    if (!twitterAccessToken.equals(arg.substring(21))) {
                        twitterAccessToken = arg.substring(21);
                        changed = true;
                    }
                }
                if (arg.startsWith("twitter_consumer_secret=") && arg.length() > 25) {
                    if (!twitterConsumerSecret.equals(arg.substring(24))) {
                        twitterConsumerSecret = arg.substring(24);
                        changed = true;
                    }
                }
                if (arg.startsWith("twitter_consumer_key=") && arg.length() > 22) {
                    if (!twitterConsumerToken.equals(arg.substring(21))) {
                        twitterConsumerToken = arg.substring(21);
                        changed = true;
                    }
                }
            }
        }

        /** Check to see if anything changed */
        if (changed) {
        	String data = "";
        	if (reloadScripts) {
        		data += "reloadscripts\r\n";
        	}
            if (enableRhinoDebugger) {
                data += "rhinodebugger\r\n";
            }
                   
        	data += "user=" + botName + "\r\n";
            data += "oauth=" + oauth + "\r\n";
            data += "apioauth=" + apiOAuth + "\r\n";
            data += "paneluser=" + panelUsername + "\r\n";
            data += "panelpassword=" + panelPassword + "\r\n";
            data += "channel=" + channelName + "\r\n";
            data += "webauth=" + webOAuth + "\r\n";
            data += "webauthro=" + webOAuthThro + "\r\n";
            data += "clientid=" + clientId + "\r\n";
            data += "owner=" + ownerName + "\r\n";
            data += "baseport=" + basePort + "\r\n";
            data += "msglimit30=" + messageLimit + "\r\n";
            data += "whisperlimit60=" + whisperLimit + "\r\n";
            data += "datastore=" + dataStoreType + "\r\n";
            data += "youtubekey=" + youtubeKey + "\r\n";
            data += "webenable=" + webEnabled + "\r\n";
            data += "musicenable=" + musicEnabled + "\r\n";
            data += "ytauth=" + youtubeOAuth + "\r\n";
            data += "ytauthro=" + youtubeOAuthThro + "\r\n";
            data += "usehttps=" + useHttps + "\r\n";
            data += "httpsPassword=" + httpsPassword + "\r\n";
            data += "httpsFileName=" + httpsFileName + "\r\n";
            data += "keystorepath=" + keyStorePath + "\r\n";
            data += "keystorepassword=" + keyStorePassword + "\r\n";
            data += "keypassword=" + keyPassword + "\r\n";
            data += "twitchalertskey=" + twitchAlertsKey + "\r\n";
            data += "twitchalertslimit=" + twitchAlertsLimit + "\r\n";
            data += "streamtipkey=" + streamTipOAuth + "\r\n";
            data += "streamtiplimit=" + streamTipLimit + "\r\n";
            data += "streamtipid=" + streamTipClientId + "\r\n";
            data += "gamewispauth=" + gameWispOAuth + "\r\n";
            data += "gamewisprefresh=" + gameWispRefresh + "\r\n";
            data += "mysqlhost=" + mySqlHost + "\r\n";
            data += "mysqlport=" + mySqlPort + "\r\n";
            data += "mysqlname=" + mySqlName + "\r\n";
            data += "mysqluser=" + mySqlUser + "\r\n";
            data += "mysqlpass=" + mySqlPass + "\r\n";
            data += "twitterUser=" + twitterUsername + "\r\n";
            data += "twitter_consumer_key=" + twitterConsumerToken + "\r\n";
            data += "twitter_consumer_secret=" + twitterConsumerSecret + "\r\n";
            data += "twitter_access_token=" + twitterAccessToken + "\r\n";
            data += "twitter_secret_token=" + twitterSecretToken + "\r\n";
            data += "logtimezone=" + timeZone + "\r\n";
            data += "devcommands=" + devCommands + "\r\n";
            data += "discord_token=" + discordToken + "\r\n";

            Files.write(Paths.get("./botlogin.txt"), data.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
        }

        /** Start PhantomBot */
        PhantomBot.instance = new PhantomBot(botName, oauth, apiOAuth, clientId, channelName, ownerName, basePort, messageLimit, whisperLimit, dataStoreType, 
		dataStoreConfig, youtubeOAuth, webEnabled, musicEnabled, useHttps, keyStorePath, keyStorePassword, keyPassword, twitchAlertsKey, 
		twitchAlertsLimit, streamTipOAuth, streamTipClientId, streamTipLimit, gameWispOAuth, gameWispRefresh, panelUsername, panelPassword, timeZone, twitterUsername,
		twitterConsumerToken, twitterConsumerSecret, twitterSecretToken, twitterAccessToken, mySqlHost, mySqlPort, mySqlConn, mySqlPass, mySqlUser,
		mySqlName, webOAuth, webOAuthThro, youtubeOAuthThro, youtubeKey, twitchCacheReady, httpsPassword, httpsFileName, devCommands, discordToken);
    }

	public void updateGameWispTokens(String[] newTokens) {
        String data = "";
        if (reloadScripts) {
        	data += "reloadscripts\r\n";
        }
        if (enableRhinoDebugger) {
            data += "rhinodebugger\r\n";
        }
        data += "user=" + botName + "\r\n";
        data += "oauth=" + oauth + "\r\n";
        data += "apioauth=" + apiOAuth + "\r\n";
        data += "paneluser=" + panelUsername + "\r\n";
        data += "panelpassword=" + panelPassword + "\r\n";
        data += "channel=" + channelName + "\r\n";
        data += "webauth=" + webOAuth + "\r\n";
        data += "webauthro=" + webOAuthThro + "\r\n";
        data += "clientid=" + clientId + "\r\n";
        data += "owner=" + ownerName + "\r\n";
        data += "baseport=" + basePort + "\r\n";
        data += "msglimit30=" + messageLimit + "\r\n";
        data += "whisperlimit60=" + whisperLimit + "\r\n";
        data += "datastore=" + dataStoreType + "\r\n";
        data += "youtubekey=" + youtubeKey + "\r\n";
        data += "webenable=" + webEnabled + "\r\n";
        data += "musicenable=" + musicEnabled + "\r\n";
        data += "ytauth=" + youtubeOAuth + "\r\n";
        data += "ytauthro=" + youtubeOAuthThro + "\r\n";
        data += "usehttps=" + useHttps + "\r\n";
        data += "httpsPassword=" + httpsPassword + "\r\n";
        data += "httpsFileName=" + httpsFileName + "\r\n";
        data += "keystorepath=" + keyStorePath + "\r\n";
        data += "keystorepassword=" + keyStorePassword + "\r\n";
        data += "keypassword=" + keyPassword + "\r\n";
        data += "twitchalertskey=" + twitchAlertsKey + "\r\n";
        data += "twitchalertslimit=" + twitchAlertsLimit + "\r\n";
        data += "streamtipkey=" + streamTipOAuth + "\r\n";
        data += "streamtiplimit=" + streamTipLimit + "\r\n";
        data += "streamtipid=" + streamTipClientId + "\r\n";
        data += "gamewispauth=" + newTokens[0] + "\r\n";
        data += "gamewisprefresh=" + newTokens[1] + "\r\n";
        data += "mysqlhost=" + mySqlHost + "\r\n";
        data += "mysqlport=" + mySqlPort + "\r\n";
        data += "mysqlname=" + mySqlName + "\r\n";
        data += "mysqluser=" + mySqlUser + "\r\n";
        data += "mysqlpass=" + mySqlPass + "\r\n";
        data += "twitterUser=" + twitterUsername + "\r\n";
        data += "twitter_consumer_key=" + twitterConsumerToken + "\r\n";
        data += "twitter_consumer_secret=" + twitterConsumerSecret + "\r\n";
        data += "twitter_access_token=" + twitterAccessToken + "\r\n";
        data += "twitter_secret_token=" + twitterSecretToken + "\r\n";
        data += "logtimezone=" + timeZone + "\r\n";
        data += "devcommands=" + devCommands + "\r\n";
        data += "discord_token=" + discordToken + "\r\n";

        try {
            Files.write(Paths.get("./botlogin.txt"), data.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
            print("GameWisp Token has been refreshed.");
        } catch (IOException ex) {
            com.gmt2001.Console.err.println("!!!! CRITICAL !!!! Failed to update GameWisp Refresh Tokens into botlogin.txt! Must manually add!");
            com.gmt2001.Console.err.println("!!!! CRITICAL !!!! gamewispauth = " + newTokens[0] + " gamewisprefresh = " + newTokens[1]);
        }
    
        SingularityAPI.instance().setAccessToken(gameWispOAuth);
    }

    /** gen a oauth */
    private static String generateWebAuth() {
        String randomAllowed = "01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        char[] randomChars = randomAllowed.toCharArray();
        char[] randomBuffer;

        randomBuffer = new char[30];
        SecureRandom random = new SecureRandom();
        for (int i = 0; i < randomBuffer.length; i++) {
           randomBuffer[i] = randomChars[random.nextInt(randomChars.length)];
        }
        return new String(randomBuffer);
    }

    /** gen a random string */
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

        long curTime = System.currentTimeMillis() / 1000l;

        if (!dataStore.exists("settings", "gameWispRefreshTime")) {
            dataStore.set("settings", "gameWispRefreshTime", String.valueOf(curTime));
        }

        ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
        service.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                long curTime = System.currentTimeMillis() / 1000l;
                String lastRunStr = dataStore.GetString("settings", "", "gameWispRefreshTime");

                long lastRun = Long.parseLong(lastRunStr);
                if ((curTime - lastRun) > (10 * 24 * 60 * 60)) { // 10 days, token expires every 35.
                    dataStore.set("settings", "gameWispRefreshTime", String.valueOf(curTime));
                    updateGameWispTokens(GameWispAPIv1.instance().refreshToken());
                }
            }
        }, 0, 1, TimeUnit.DAYS);
    }

    /*
     * doCheckPhantomBotUpdate
     */
    private void doCheckPhantomBotUpdate() {
        ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
        service.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
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
            }
        }, 0, 24, TimeUnit.HOURS);
    }

    /** Set the twitch cache */
    public void setTwitchCacheReady(String twitchCacheReady) {
        PhantomBot.twitchCacheReady = twitchCacheReady;
        Script.global.defineProperty("twitchCacheReady", PhantomBot.twitchCacheReady, 0);
    }

    /** Load the game list */
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

                    if (!new File ("./web/panel/js/games.js").exists()) {
                        new File ("./web/panel/js").mkdirs();
                    }

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
}
