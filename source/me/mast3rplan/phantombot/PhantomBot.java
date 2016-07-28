/*
 * Copyright (C) 2015 www.phantombot.net
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

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
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
import me.mast3rplan.phantombot.musicplayer.MusicWebSocketServer;
import me.mast3rplan.phantombot.ytplayer.YTWebSocketServer;
import me.mast3rplan.phantombot.script.Script;
import me.mast3rplan.phantombot.script.ScriptApi;
import me.mast3rplan.phantombot.script.ScriptEventManager;
import me.mast3rplan.phantombot.script.ScriptManager;
import me.mast3rplan.phantombot.panel.PanelSocketServer;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.SystemUtils;

import me.mast3rplan.phantombot.twitchwsirc.TwitchWSIRC;
import me.mast3rplan.phantombot.twitchwsirc.Channel;
import me.mast3rplan.phantombot.twitchwsirc.Session;
import java.net.URI;

public class PhantomBot implements Listener {
    private String mysql_db_conn;
    private String mysql_db_host;
    private String mysql_db_port;
    private String mysql_db_name;
    private String mysql_db_user;
    private String mysql_db_pass;
    private String twitchalertskey = null;
    private int twitchalertslimit;
    private String streamtipkey = null;
    private int streamtiplimit;
    private String streamtipid;
    private static boolean newSetup = false;
    public final String username;
    private String panelpassword;
    private String paneluser;
    private final String webauth;
    private final String webauthro;
    private final String ytauth;
    private final String ytauthro;
    private String gamewispauth;
    private String gamewisprefresh;
    private final String oauth;
    private String twitterUser;
    private String twitter_access_token;
    private String twitter_secret_token;
    private String twitter_consumer_secret;
    private String twitter_consumer_key;
    private String apioauth;
    private String clientid;
    private final String channelName;
    private final String ownerName;
    private final String hostname;
    private int port;
    private int baseport;
    private double msglimit30;
    private double whisperlimit60;
    private String datastore;
    private String datastoreconfig;
    private String youtubekey;
    private boolean webenable;
    private boolean musicenable;
    private boolean usehttps;
    private boolean twitterAuthenticated;
    private String keystorepath;
    private String keystorepassword;
    private String keypassword;
    private String channelStatus;
    private DataStore dataStoreObj;
    private SecureRandom rng;
    private TreeMap<String, Integer> pollResults;
    private TreeSet<String> voters;
    private Session session;
    private Channel channel;
    private final HashMap<String, Channel> channels;
    private FollowersCache followersCache;
    private ChannelHostCache hostCache;
    private SubscribersCache subscribersCache;
    private ChannelUsersCache channelUsersCache;
    private DonationsCache donationsCache;
    private StreamTipCache streamTipCache;
    private EmotesCache emotesCache;
    private TwitterCache twitterCache;
    private TwitchCache twitchCache;
    private YTWebSocketServer  ytsocketserver;
    private HTTPServer httpserver;
    private NEWHTTPServer NEWhttpserver;
    private NEWHTTPSServer NEWhttpsServer;
    private EventWebSocketServer eventsocketserver;
    private PanelSocketServer panelsocketserver;
    private static final boolean debugD = false;
    public static boolean enableDebugging = false;
    public static boolean interactive;
    public static boolean webenabled = false;
    public static boolean musicenabled = false;
    public static boolean reloadScripts = false;
    public static boolean resetLoging = false;
    public static String twitchCacheReady = "false";
    private boolean exiting = false;
    private static PhantomBot instance;
    public static String log_timezone = "GMT";
    private UsernameCache usernameCache;
    private ScriptEventManager scriptEventManager;

    public static PhantomBot instance() {
        return instance;
    }

    public String botVersion() {
        return "PhantomBot Version " + RepoVersion.getPhantomBotVersion();
    }

    public String getBotInfo() {
        return botVersion() + " (Revision: " + RepoVersion.getRepoVersion() + ")";
    }

    public PhantomBot(String username, String oauth, String apioauth, String clientid, String channel,
                      String owner, int baseport, String hostname, int port,
                      double msglimit30, double whisperlimit60, String datastore, String datastoreconfig, String youtubekey,
                      boolean webenable, boolean musicenable, boolean usehttps, String keystorepath,
                      String keystorepassword, String keypassword, String twitchalertskey, 
                      int twitchalertslimit, String webauth, String webauthro, String ytauth, String ytauthro,
                      String gamewispauth, String gamewisprefresh, String paneluser, String panelpassword,
                      String twitterUser, String twitter_access_token, String twitter_secret_token, String twitter_consumer_key, String twitter_consumer_secret, String log_timezone,
                      String mysql_db_host, String mysql_db_port, String mysql_db_name, String mysql_db_user, String mysql_db_pass, String streamtipkey, String streamtipid, int streamtiplimit) {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println(botVersion());
        if (isNightlyBuild()) {
            com.gmt2001.Console.out.println("Build revision " + RepoVersion.getRepoVersion() + "-NIGHTLY");
        } else {
            com.gmt2001.Console.out.println("Build revision " + RepoVersion.getRepoVersion());
        }
        com.gmt2001.Console.out.println("Creator: mast3rplan");
        com.gmt2001.Console.out.println("Developers: PhantomIndex, Kojitsari, scaniaTV, Zelakto, & IllusionaryOne");
        com.gmt2001.Console.out.println("https://phantombot.net/");
        com.gmt2001.Console.out.println();

        interactive = System.getProperty("interactive") != null;

        this.twitchCacheReady = "false";
        this.username = username;
        this.oauth = oauth;
        this.apioauth = apioauth;
        this.webauth = webauth;
        this.webauthro = webauthro;
        this.ytauth = ytauth;
        this.ytauthro = ytauthro;
        this.gamewispauth = gamewispauth;
        this.gamewisprefresh = gamewisprefresh;
        this.channelName = channel;
        this.ownerName = owner;
        this.baseport = baseport;
        this.datastore = datastore;
        this.datastoreconfig = datastoreconfig;
        this.youtubekey = youtubekey;

        this.twitterUser = twitterUser;
        this.twitter_access_token = twitter_access_token;
        this.twitter_secret_token = twitter_secret_token;
        this.twitter_consumer_key = twitter_consumer_key;
        this.twitter_consumer_secret = twitter_consumer_secret;

        this.mysql_db_host = mysql_db_host;
        this.mysql_db_port = mysql_db_port;
        this.mysql_db_name = mysql_db_name;
        this.mysql_db_user = mysql_db_user;
        this.mysql_db_pass = mysql_db_pass;
        
        if (log_timezone.isEmpty()) {
            this.log_timezone = "GMT";
        } else {
            this.log_timezone = log_timezone;
        }

        if (!youtubekey.isEmpty()) {
            YouTubeAPIv3.instance().SetAPIKey(youtubekey);
        }

        if (paneluser.isEmpty()) {
            this.paneluser = "panel";
        } else {
            this.paneluser = paneluser;
        }

        if (panelpassword.isEmpty()) {
            this.panelpassword = "panel";
        } else {
            this.panelpassword = panelpassword;
        }

        this.webenable = webenable;
        this.musicenable = musicenable;
        this.usehttps = usehttps;
        this.keystorepath = keystorepath;
        this.keystorepassword = keystorepassword;
        this.keypassword = keypassword;

        this.twitchalertskey = twitchalertskey;
        this.twitchalertslimit = twitchalertslimit;

        this.streamtipid = streamtipid;
        this.streamtipkey = streamtipkey;
        this.streamtiplimit = streamtiplimit;

        if (clientid.length() == 0) {
            this.clientid = "rp2uhin43rvpr70nzwnh07417x2gck0";
        } else {
            this.clientid = clientid;
        }

        rng = new SecureRandom();
        pollResults = new TreeMap<>();
        voters = new TreeSet<>();

        if (hostname.isEmpty()) {
            this.hostname = "wss://irc-ws.chat.twitch.tv";
            this.port = -1;
        } else {
            this.hostname = hostname;
            this.port = port;
        }

        if (msglimit30 > 0) {
            this.msglimit30 = msglimit30;
        } else {
            this.msglimit30 = 18.75;
        }

        if (whisperlimit60 > 0) {
            this.whisperlimit60 = whisperlimit60;
        } else {
            this.whisperlimit60 = 90;
        }

        if (datastore.equalsIgnoreCase("TempStore")) {
            dataStoreObj = TempStore.instance();
        } else if (datastore.equalsIgnoreCase("IniStore")) {
            dataStoreObj = IniStore.instance();
        } else if (datastore.equalsIgnoreCase("MySQLStore")) {
            dataStoreObj = MySQLStore.instance();
            if (this.mysql_db_port.length() > 0) {
                this.mysql_db_conn = "jdbc:mysql://" + this.mysql_db_host + ":" + this.mysql_db_port + "/" + this.mysql_db_name + "?useSSL=false";
            } else {
                this.mysql_db_conn = "jdbc:mysql://" + this.mysql_db_host + "/" + this.mysql_db_name + "?useSSL=false";
            }
            if (dataStoreObj.CreateConnection(this.mysql_db_conn, this.mysql_db_user, this.mysql_db_pass) == null) {
                System.exit(0);
            }
        } else {
            dataStoreObj = SqliteStore.instance();
            if (!dataStoreObj.exists("settings", "tables_indexed")) {
                com.gmt2001.Console.out.println("Creating SQLite3 Indexes, Please Wait...");
                dataStoreObj.CreateIndexes();
                com.gmt2001.Console.out.println("Completed Creating SQLite3 Indexes");
                dataStoreObj.set("settings", "tables_indexed", "true");
            }
        }

        if (datastore.isEmpty() && IniStore.instance().GetFileList().length > 0 && SqliteStore.instance().GetFileList().length == 0) {
            ini2sqlite(true);
        }

        if (datastore.equalsIgnoreCase("MySQLStore")) {
            if (IniStore.instance().GetFileList().length > 0) {
                ini2mysql(true);
            }
            if (SqliteStore.instance().GetFileList().length > 0) {
                sqlite2mysql();
            }
        }

        this.init();

        if (SystemUtils.IS_OS_LINUX && !interactive) {
            try {
                java.lang.management.RuntimeMXBean runtime = java.lang.management.ManagementFactory.getRuntimeMXBean();
                /*
                 * java.lang.reflect.Field jvm =
                 * runtime.getClass().getDeclaredField("jvm");
                 * jvm.setAccessible(true); sun.management.VMManagement mgmt =
                 * (sun.management.VMManagement) jvm.get(runtime);
                 * java.lang.reflect.Method pid_method =
                 * mgmt.getClass().getDeclaredMethod("getProcessId");
                 * pid_method.setAccessible(true);
                 *
                 * int pid = (Integer) pid_method.invoke(mgmt);
                 */
                int pid = Integer.parseInt(runtime.getName().split("@")[0]);

                //int pid = Integer.parseInt( ( new File("/proc/self")).getCanonicalFile().getName() );
                //File f = new File("/var/run/PhantomBot." + this.username.toLowerCase() + ".pid");
                File f = new File("PhantomBot." + this.username.toLowerCase() + ".pid");

                try (FileOutputStream fs = new FileOutputStream(f, false)) {
                    PrintStream ps = new PrintStream(fs);

                    ps.print(pid);
                }

                f.deleteOnExit();
            } catch (/*
                     * NoSuchFieldException | IllegalAccessException |
                     * NoSuchMethodException |
                     * java.lang.reflect.InvocationTargetException |
                     */SecurityException | IllegalArgumentException | IOException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
        
        this.channel = Channel.instance(this.channelName, this.username, oauth, EventBus.instance());

        channels = new HashMap<>();

        TwitchAPIv3.instance().SetClientID(this.clientid);
        TwitchAPIv3.instance().SetOAuth(apioauth);

        TwitchAlertsAPIv1.instance().SetAccessToken(twitchalertskey);
        TwitchAlertsAPIv1.instance().SetDonationPullLimit(twitchalertslimit);

        StreamTipAPI.instance().SetAccessToken(streamtipkey);
        StreamTipAPI.instance().SetDonationPullLimit(streamtiplimit);
        StreamTipAPI.instance().SetClientId(streamtipid);

        usernameCache = UsernameCache.instance();
    }

    public boolean isNightlyBuild() {
        if (RepoVersion.getNightlyBuild().equals("nightly_build")) {
            return true;
        } else {
            return false;
        }
    }

    public String isNightlyBuildString() {
        if (RepoVersion.getNightlyBuild().equals("nightly_build")) {
            return "true";
        } else {
            return "false";
        }
    }

    public static void setDebugging(boolean debug) {
        PhantomBot.enableDebugging = debug;
    }

    public String getBotName() {
        return this.username;
    }
 
    public UsernameCache getUsernameCache() {
        return usernameCache;
    }

    public DataStore getDataStore() {
        return dataStoreObj;
    }
 
    public ScriptEventManager getScriptEventManagerInstance() {
        return scriptEventManager;
   }

    public Session getSession() {
        return this.session;
    }

    public boolean isExiting() {
        return exiting;
    }

    public Channel getChannel() {
        return channel;
    }

    public long getMessageInterval() {
        return (long) ((30.0 / this.msglimit30) * 1000);
    }

    public long getWhisperInterval() {
        return (long) ((60.0 / this.whisperlimit60) * 1000);
    }

    public Channel getChannel(String channelName) {
        return channels.get(channelName);
    }

    public HashMap<String, Channel> getChannels() {
        return channels;
    }

    public final void init() {
        if (webenable) {
            if (usehttps) {
                httpserver = new HTTPServer(baseport, oauth);
                if (musicenable) {
                    ytsocketserver = new YTWebSocketServer(baseport + 3, ytauth, ytauthro);
                }
                eventsocketserver = new EventWebSocketSecureServer(baseport + 2, keystorepath, keystorepassword, keypassword);
            } else {
                httpserver = new HTTPServer(baseport, oauth);
                if (musicenable) {
                    ytsocketserver = new YTWebSocketServer(baseport + 3, ytauth, ytauthro);
                }
                eventsocketserver = new EventWebSocketServer(baseport + 2);
            }
            webenabled = true;
            httpserver.start();

            if (musicenable) {
                ytsocketserver.start();
                com.gmt2001.Console.out.println("YouTubeSocketServer accepting connections on port " + (baseport + 3));
            }

            eventsocketserver.start();
            int eventport = baseport + 2;
            com.gmt2001.Console.out.println("EventSocketServer accepting connections on port " + eventport);
            EventBus.instance().register(eventsocketserver);

            panelsocketserver = new PanelSocketServer(baseport + 4, webauth, webauthro);
            panelsocketserver.start();
            com.gmt2001.Console.out.println("PanelSocketServer accepting connections on port " + (baseport + 4));

            NEWhttpserver = new NEWHTTPServer(baseport + 5, oauth, webauth, paneluser, panelpassword);
            com.gmt2001.Console.out.println("NEW HTTP Server accepting connections on port " + (baseport + 5));

            // NEWhttpsServer = new NEWHTTPSServer(baseport + 6, oauth, webauth, paneluser, panelpassword);
            // com.gmt2001.Console.out.println("NEW HTTPS Server accepting connections on port " + (baseport + 6));

            if (gamewispauth.length() > 0) {
                GameWispAPIv1.instance().SetAccessToken(gamewispauth);
                GameWispAPIv1.instance().SetRefreshToken(gamewisprefresh);
                SingularityAPI.instance().setAccessToken(gamewispauth);
                SingularityAPI.instance().StartService();
                doRefreshGameWispToken();
            }

            // Connect to Twitter API
            if (twitterUser.length() > 0 &&
                twitter_access_token.length() > 0 && twitter_secret_token.length() > 0 && twitter_consumer_key.length() > 0 && twitter_consumer_secret.length() > 0)
            {
                TwitterAPI.instance().setUsername(twitterUser);
                TwitterAPI.instance().setAccessToken(twitter_access_token);
                TwitterAPI.instance().setSecretToken(twitter_secret_token);
                TwitterAPI.instance().setConsumerKey(twitter_consumer_key);
                TwitterAPI.instance().setConsumerSecret(twitter_consumer_secret);
                this.twitterAuthenticated = TwitterAPI.instance().authenticate();
            }
        }

        // Print an extra new line after announcing HTTP and Socket servers
        com.gmt2001.Console.out.println();

        // Create configuration for YTPlayer v2.0 for the WS port.
        //
        try {
            String playerPortData = "// Configuration for YTPlayer\r\n" +
                                    "// Automatically Generated by PhantomBot Core at Startup\r\n" +
                                    "// Do NOT Modify! Overwritten when PhantomBot is restarted!\r\n" +
                                    "var playerPort = " + (baseport + 3) + ";\r\n" +
                                    "var channelName = \"" + channelName + "\";\r\n" +
                                    "var auth=\"" + ytauth + "\";\r\n" +
                                    "function getPlayerPort() { return playerPort; }\r\n" +
                                    "function getChannelName() { return channelName; }\r\n" +
                                    "function getAuth() { return auth; }\r\n";

            if (!new File ("./web/ytplayer/").exists()) {
                new File ("./web/ytplayer/").mkdirs();
            }
            if (!new File ("./web/ytplayer/js").exists()) {
                new File ("./web/ytplayer/js").mkdirs();
            }

            Files.write(Paths.get("./web/ytplayer/js/playerConfig.js"), playerPortData.getBytes(StandardCharsets.UTF_8),
                        StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        try {
            String playerPortData = "// Configuration for YTPlayer\r\n" +
                                    "// Automatically Generated by PhantomBot Core at Startup\r\n" +
                                    "// Do NOT Modify! Overwritten when PhantomBot is restarted!\r\n" +
                                    "var playerPort = " + (baseport + 3) + ";\r\n" +
                                    "var channelName = \"" + channelName + "\";\r\n" +
                                    "var auth=\"" + ytauthro + "\";\r\n" +
                                    "function getPlayerPort() { return playerPort; }\r\n" +
                                    "function getChannelName() { return channelName; }\r\n" +
                                    "function getAuth() { return auth; }\r\n";

            if (!new File ("./web/playlist/").exists()) {
                new File ("./web/playlist/").mkdirs();
            }
            if (!new File ("./web/playlist/js").exists()) {
                new File ("./web/playlist/js").mkdirs();
            }

            Files.write(Paths.get("./web/playlist/js/playerConfig.js"), playerPortData.getBytes(StandardCharsets.UTF_8),
                        StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);

        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }


        // Create configuration for WebPanel for the WS port.
        try {
            String panelPortData = "// Configuration for WebPanel\r\n" +
                                   "// Automatically Generated by PhantomBot Core at Startup\r\n" +
                                   "// Do NOT Modify! Overwritten when PhantomBot is restarted!\r\n" +
                                   "var panelSettings = {\r\n" +
                                   "    panelPort   : " + (baseport + 4) + ",\r\n" +
                                   "    channelName : \"" + channelName + "\",\r\n" +
                                   "    auth        : \"" + webauth + "\"\r\n" +
                                   "};\r\n\r\n" +
       
                                   "function getPanelPort() { return panelSettings.panelPort; }\r\n" +
                                   "function getChannelName() { return panelSettings.channelName; }\r\n" +
                                   "function getAuth() { return panelSettings.auth; }\r\n";

            if (!new File ("./web/panel/").exists()) {
                new File ("./web/panel/").mkdirs();
            }
            if (!new File ("./web/panel/js").exists()) {
                new File ("./web/panel/js").mkdirs();
            }

            Files.write(Paths.get("./web/panel/js/panelConfig.js"), panelPortData.getBytes(StandardCharsets.UTF_8),
                        StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        // Create configuration for Read-Only Access to WS port.
        try {
            String wsROPortData = "// Configuration for WebPanel\r\n" +
                                  "// Automatically Generated by PhantomBot Core at Startup\r\n" +
                                  "// Do NOT Modify! Overwritten when PhantomBot is restarted!\r\n" +
                                  "var panelSettings = {\r\n" +
                                  "    panelPort   : " + (baseport + 4) + ",\r\n" +
                                  "    channelName : \"" + channelName + "\",\r\n" +
                                  "    auth        : \"" + webauthro + "\"\r\n" +
                                  "};\r\n\r\n" +

                                  "function getPanelPort() { return panelSettings.panelPort; }\r\n" +
                                  "function getChannelName() { return panelSettings.channelName; }\r\n" +
                                  "function getAuth() { return panelSettings.auth; }\r\n";

            if (!new File ("./web/common/").exists()) {
                new File ("./web/common/").mkdirs();
            }
            if (!new File ("./web/common/js").exists()) {
                new File ("./web/common/js").mkdirs();
            }

            Files.write(Paths.get("./web/common/js/wsConfig.js"), wsROPortData.getBytes(StandardCharsets.UTF_8),
                        StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        
        // Load the games list configuration.
        // Disabled for now, going to provide a direct file, but leave this here for when we decide to go
        // this route and have an automatic update and somesuch.
        // loadGameList(dataStoreObj);
        
        if (interactive) {
            ConsoleInputListener cil = new ConsoleInputListener();
            cil.start();
        }

        EventBus.instance().register(this);
        EventBus.instance().register(ScriptEventManager.instance());
        scriptEventManager = ScriptEventManager.instance();

        dataStoreObj.LoadConfig(datastoreconfig);

        Script.global.defineProperty("inidb", dataStoreObj, 0);
        Script.global.defineProperty("tempdb", TempStore.instance(), 0);
        Script.global.defineProperty("username", UsernameCache.instance(), 0);
        Script.global.defineProperty("twitch", TwitchAPIv3.instance(), 0);
        Script.global.defineProperty("botName", username, 0);
        Script.global.defineProperty("channelName", channelName, 0);
        Script.global.defineProperty("channels", channels, 0);
        Script.global.defineProperty("ownerName", ownerName, 0);
        Script.global.defineProperty("channelStatus", channelStatus, 0);
        Script.global.defineProperty("ytplayer", ytsocketserver, 0);
        Script.global.defineProperty("panelsocketserver", panelsocketserver, 0);
        Script.global.defineProperty("random", rng, 0);
        Script.global.defineProperty("youtube", YouTubeAPIv3.instance(), 0);
        Script.global.defineProperty("pollResults", pollResults, 0);
        Script.global.defineProperty("pollVoters", voters, 0);
        //Script.global.defineProperty("connmgr", connectionManager, 0);
        Script.global.defineProperty("hostname", hostname, 0);
        Script.global.defineProperty("gamewisp", GameWispAPIv1.instance(), 0);
        Script.global.defineProperty("twitter", TwitterAPI.instance(), 0);
        Script.global.defineProperty("twitchCacheReady", this.twitchCacheReady, 0);
        Script.global.defineProperty("isNightly", isNightlyBuildString(), 0);
        Script.global.defineProperty("version", botVersion(), 0);
        Script.global.defineProperty("changed", newSetup, 0);

        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                onExit();
            }
        });

        Runtime.getRuntime().addShutdownHook(t);

        try {
            ScriptManager.loadScript(new File("./scripts/init.js"));
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        doCheckPhantomBotUpdate();
    }

    @SuppressWarnings("SleepWhileInLoop")
    public void onExit() {
        com.gmt2001.Console.out.println("[SHUTDOWN] Bot shutting down...");

        com.gmt2001.Console.out.println("[SHUTDOWN] Stopping event & message dispatching...");
        exiting = true;

        if (webenabled) {
            com.gmt2001.Console.out.println("[SHUTDOWN] Terminating web server...");
            httpserver.dispose();
            NEWhttpserver.close();
            eventsocketserver.dispose();
        }

        if (musicenabled) {
            com.gmt2001.Console.out.println("[SHUTDOWN] Terminating music server...");
            ytsocketserver.dispose();
        }

        com.gmt2001.Console.out.print("[SHUTDOWN] Waiting for running scripts to finish...");
        try {
            for (int i = 10; i > 0; i--) {
                com.gmt2001.Console.out.print("\r[SHUTDOWN] Waiting for running scripts to finish..." + i + " ");
                Thread.sleep(1000);
            }
        } catch (InterruptedException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        com.gmt2001.Console.out.println("\r[SHUTDOWN] Waiting for running scripts to finish...  ");

        com.gmt2001.Console.out.println("[SHUTDOWN] Terminating TwitchAPI caches...");
        ChannelHostCache.killall();
        ChannelUsersCache.killall();
        FollowersCache.killall();
        SubscribersCache.killall();

        com.gmt2001.Console.out.println("[SHUTDOWN] Terminating caches...");
        DonationsCache.killall();
        StreamTipCache.killall();

        com.gmt2001.Console.out.println("[SHUTDOWN] Terminating pending timers...");
        ScriptApi.instance().kill();

        com.gmt2001.Console.out.println("[SHUTDOWN] Terminating scripts...");
        HashMap<String, Script> scripts = ScriptManager.getScripts();

        for (Entry<String, Script> script : scripts.entrySet()) {
            script.getValue().kill();
        }

        com.gmt2001.Console.out.println("[SHUTDOWN] Saving data...");
        dataStoreObj.SaveAll(true);

        com.gmt2001.Console.out.println("[SHUTDOWN] Disconnecting from Twitch IRC...");

        com.gmt2001.Console.out.println("[SHUTDOWN] Waiting for JVM to exit...");
    }

    @Subscribe
    public void onIRCJoinComplete(IrcJoinCompleteEvent event) {
        this.session = event.getSession();

        event.getSession().say(".mods");

        this.emotesCache = EmotesCache.instance(this.channelName);
        this.followersCache = FollowersCache.instance(this.channelName);
        this.hostCache = ChannelHostCache.instance(this.channelName);
        this.subscribersCache = SubscribersCache.instance(this.channelName);
        this.twitchCache = TwitchCache.instance(this.channelName);
        this.channelUsersCache = ChannelUsersCache.instance(this.channelName);

        if (this.twitchalertskey != null && this.twitchalertskey.length() > 1) {
            this.donationsCache = DonationsCache.instance(this.channelName);
        }

        if (this.streamtipkey != null && this.streamtipkey.length() > 1) {
            this.streamTipCache = StreamTipCache.instance(this.channelName);
        }

        if (this.twitterUser.length() > 0 && this.twitter_access_token.length() > 0 && this.twitter_secret_token.length() > 0 && this.twitter_consumer_key.length() > 0 && this.twitter_consumer_secret.length() > 0) {
            if (this.twitterAuthenticated) {
                this.twitterCache = TwitterCache.instance(this.channelName);
            } else {
                com.gmt2001.Console.out.println("Disabling Twitter Features. Correct Authentication Issues and Restart.");
            }
        }

        /* Make newly created instances available to JS. */
        Script.global.defineProperty("twitchcache", this.twitchCache, 0);
        Script.global.defineProperty("followers", this.followersCache, 0);
        Script.global.defineProperty("hosts", this.hostCache, 0);
        Script.global.defineProperty("subscribers", this.subscribersCache, 0);
        Script.global.defineProperty("channelUsers", this.channelUsersCache, 0);
        Script.global.defineProperty("donations", this.donationsCache, 0);
        Script.global.defineProperty("streamtip", this.streamTipCache, 0);
        Script.global.defineProperty("emotes", this.emotesCache, 0);
    }

    @Subscribe
    public void onIRCPrivateMessage(IrcPrivateMessageEvent event) {
        if (event.getSender().equalsIgnoreCase("jtv")) {
            String message = event.getMessage().toLowerCase();
            
            com.gmt2001.Console.debug.println("Message From jtv: " + event.getSender() + ": " + event.getMessage());

            if (message.startsWith("the moderators of this room are: ")) {
                String[] spl = message.substring(33).split(", ");

                for (String spl1 : spl) {
                    if (spl1.equalsIgnoreCase(this.username)) {
                        channel.setAllowSendMessages(true);
                    }
                }
            }
        }
        if (!event.getSender().equalsIgnoreCase("jtv") && !event.getSender().equalsIgnoreCase("twitchnotify")) {
            com.gmt2001.Console.out.println("Whisper: " + usernameCache.resolve(event.getSender().toLowerCase(), event.getTags()) + ": " + event.getMessage());
        }
    }

    @Subscribe
    public void onIRCChannelUserMode(IrcChannelUserModeEvent event) {
        if (event.getUser().equalsIgnoreCase(username) && event.getMode().equalsIgnoreCase("o")
                && this.channel != null && event.getChannel().getName().equalsIgnoreCase(channel.getName())) {
            if (!event.getAdd()) {
                event.getSession().say(".mods");
            }

            channel.setAllowSendMessages(event.getAdd());
        }
    }

    @Subscribe
    public void onConsoleMessage(ConsoleInputEvent msg) {
        boolean changed = false;
        String  message = msg.getMsg();
        int     followCount = 0;

        if (message == null) {
            return;
        }

        if (message.equals("testfollow")) {
            String randomUser = generateRandomString(10);
            com.gmt2001.Console.out.println("[CONSOLE] Executing testfollow (User: " + randomUser + ")");
            EventBus.instance().post(new TwitchFollowEvent(randomUser, PhantomBot.instance().getChannel("#" + this.channel)));
        }

        if (message.startsWith("testfollows")) {
            String[] messageSplit = message.split(" ", 2);
            if (messageSplit.length != 2) {
                followCount = 1;
            } else {
                followCount = Integer.parseInt(messageSplit[1]);
            }
            String randomUser = generateRandomString(10);
            com.gmt2001.Console.out.println("[CONSOLE] Executing testfollows (Count: " + followCount + ", User: " + randomUser + ")");
            for (int i = 0; i < followCount; i++) {
                EventBus.instance().post(new TwitchFollowEvent(randomUser + "_" + i, PhantomBot.instance().getChannel("#" + this.channel)));
            }
        }

        if (message.equals("testonline")) {
            com.gmt2001.Console.out.println("[CONSOLE] Executing testonline");
            EventBus.instance().post(new TwitchOnlineEvent(PhantomBot.instance().getChannel("#" + this.channel)));
            return;
        }

        if (message.equals("testoffline")) {
            com.gmt2001.Console.out.println("[CONSOLE] Executing testoffline");
            EventBus.instance().post(new TwitchOfflineEvent(PhantomBot.instance().getChannel("#" + this.channel)));
            return;
        }

        if (message.equals("testhost")) {
            com.gmt2001.Console.out.println("[CONSOLE] Executing testhost");
            EventBus.instance().post(new TwitchHostedEvent(this.username, PhantomBot.instance().getChannel("#" + this.channel)));
            return;
        }

        if (message.equals("testgwsub")) {
            com.gmt2001.Console.out.println("[CONSOLE] Executing testgwsub");
            EventBus.instance().post(new GameWispSubscribeEvent(this.username, 1));
            return;
        }

        if (message.equals("testgwresub")) {
            com.gmt2001.Console.out.println("[CONSOLE] Executing testgwresub");
            EventBus.instance().post(new GameWispAnniversaryEvent(this.username, 2));
            return;
        }
      
        if (message.equals("testsub")) {
            com.gmt2001.Console.out.println("[CONSOLE] Executing testsub");
            //EventBus.instance().post(new NewSubscriberEvent(session, PhantomBot.instance().getChannel("#" + this.channel), this.username));
            return;
        }

        if (message.equals("testresub")) {
            com.gmt2001.Console.out.println("[CONSOLE] Executing testresub");
           // EventBus.instance().post(new NewReSubscriberEvent(session, PhantomBot.instance().getChannel("#" + this.channel), this.username, "5"));
            return;
        }

        if (message.equals("debugon")) {
            com.gmt2001.Console.out.println("[CONSOLE] Executing debugon: Enable Debug Mode");
            PhantomBot.setDebugging(true);
            return;
        }

        if (message.equals("debugoff")) {
            com.gmt2001.Console.out.println("[CONSOLE] Executing debugoff: Disable Debug Mode");
            PhantomBot.setDebugging(false);
            return;
        }

        if (message.startsWith("inidb.get")) {
            com.gmt2001.Console.out.println("[CONSOLE] Executing inidb.get");
            String spl[] = message.split(" ", 4);

            com.gmt2001.Console.out.println(dataStoreObj.GetString(spl[1], spl[2], spl[3]));
            return;
        }

        if (message.startsWith("inidb.set")) {
            com.gmt2001.Console.out.println("[CONSOLE] Executing inidb.set");
            String spl[] = message.split(" ", 5);

            dataStoreObj.SetString(spl[1], spl[2], spl[3], spl[4]);
            com.gmt2001.Console.out.println(dataStoreObj.GetString(spl[1], spl[2], spl[3]));
            return;
        }

        if (message.equals("reset")) {
            com.gmt2001.Console.out.println("Type 'yes' to confirm that you want to reset your bot login information. Type 'no' if you do not want to processed.");
            String check = System.console().readLine().trim();
            if (check.equals("yes") || check.equals("y")) {
                resetLoging = true;
                changed = true;
            } else {
                com.gmt2001.Console.out.println("No changes where made.");
            }
        }

        if (message.equals("apioauth")) {
            com.gmt2001.Console.out.print("Please enter you're oauth token that you generated from https://phantomnot.net/oauth while logged as the caster: ");
            String newoauth = System.console().readLine().trim();
            TwitchAPIv3.instance().SetOAuth(newoauth);
            apioauth = newoauth;
            changed = true;
        }

        if (message.equals("clientid")) {
            com.gmt2001.Console.out.print("Please enter the bot api clientid string: ");
            String newclientid = System.console().readLine().trim();

            TwitchAPIv3.instance().SetClientID(newclientid);
            clientid = newclientid;

            changed = true;
        }

        if (message.equals("baseport")) {
            com.gmt2001.Console.out.print("Please enter a new base port: ");
            String newbaseport = System.console().readLine().trim();

            baseport = Integer.parseInt(newbaseport);

            changed = true;
        }

        if (message.equals("youtubekey")) {
            com.gmt2001.Console.out.print("Please enter a new YouTube API key: ");
            String newyoutubekey = System.console().readLine().trim();

            YouTubeAPIv3.instance().SetAPIKey(newyoutubekey);
            youtubekey = newyoutubekey;

            changed = true;
        }

        if (message.equals("paneluser")) {
            com.gmt2001.Console.out.print("Please enter a new panel username: ");
            String newpaneluser = System.console().readLine().trim();
            paneluser = newpaneluser;
            changed = true;
        }

        if (message.equals("panelpassword")) {
            com.gmt2001.Console.out.print("Please enter a new panel password: ");
            String newpanelpassword = System.console().readLine().trim();
            panelpassword = newpanelpassword;
            changed = true;
        }

        if (message.equals("webenable")) {
            com.gmt2001.Console.out.print("Please note that the music server will also be disabled if the web server is disabled. The bot will require a restart for this to take effect. Type true or false to enable/disable web server: ");
            String newwebenable = System.console().readLine().trim();
            changed = true;

            webenable = newwebenable.equalsIgnoreCase("1") || newwebenable.equalsIgnoreCase("true");
        }

        if (message.equals("musicenable")) {
            if (!webenable) {
                com.gmt2001.Console.out.println("Web server must be enabled first. ");
            } else {
                com.gmt2001.Console.out.print("The bot will require a restart for this to take effect. Please type true or false to enable/disable music server: ");
                String newmusicenable = System.console().readLine().trim();
                changed = true;

                musicenable = newmusicenable.equalsIgnoreCase("1") || newmusicenable.equalsIgnoreCase("true");
            }
        }

        if (message.equals("twitchalertskey")) {
            com.gmt2001.Console.out.print("Please enter your twitch alerts key generated from https://phantombot.net/twitchalerts/ while logged in as the caster: ");
            String newtwitchalertskey = System.console().readLine().trim();

            TwitchAlertsAPIv1.instance().SetAccessToken(newtwitchalertskey);
            twitchalertskey = newtwitchalertskey;

            changed = true;
        }

        if (message.equals("twitchalertslimit")) {
            com.gmt2001.Console.out.print("Please enter Twitch Alerts pull limit: ");
            int newtwitchalertslimit;
            try {
                newtwitchalertslimit = Integer.parseInt(System.console().readLine().trim());
            } catch (NumberFormatException nfe) {
                com.gmt2001.Console.out.println("Bad integer, defaulting to 5.");
                newtwitchalertslimit = 5;
            }
            TwitchAlertsAPIv1.instance().SetDonationPullLimit(newtwitchalertslimit);

            changed = true;
        }

        if (message.equals("streamtipkey")) {
            com.gmt2001.Console.out.print("Please enter your stream tip key:");
            String newstreamtipkey = System.console().readLine().trim();

            StreamTipAPI.instance().SetAccessToken(newstreamtipkey);
            streamtipkey = newstreamtipkey;

            changed = true;
        }

        if (message.equals("streamtipid")) {
            com.gmt2001.Console.out.print("Please enter your stream tip client id key:");
            String newstreamtipid = System.console().readLine().trim();

            StreamTipAPI.instance().SetClientId(newstreamtipid);
            streamtipid = newstreamtipid;

            changed = true;
        }

        if (message.equals("streamtiplimit")) {
            com.gmt2001.Console.out.print("Please enter Twitch Alerts pull limit: ");
            int newstreamtiplimit;
            try {
                newstreamtiplimit = Integer.parseInt(System.console().readLine().trim());
            } catch (NumberFormatException nfe) {
                com.gmt2001.Console.out.println("Bad integer, defaulting to 5.");
                newstreamtiplimit = 5;
            }
            StreamTipAPI.instance().SetDonationPullLimit(newstreamtiplimit);

            changed = true;
        }

        if (message.equals("mysqlsetup")) {
            try {
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.out.println("PhantomBot MySQL setup.");
                com.gmt2001.Console.out.println();

                com.gmt2001.Console.out.print("Please enter your MySQL host name: ");
                String newHost = System.console().readLine().trim();
                mysql_db_host = newHost;

                com.gmt2001.Console.out.print("Please enter your MySQL port: ");
                String newPost = System.console().readLine().trim();
                mysql_db_port = newPost;

                com.gmt2001.Console.out.print("Please enter your MySQL db name: ");
                String newName = System.console().readLine().trim();
                mysql_db_name = newName;

                com.gmt2001.Console.out.print("Please enter a username for MySQL: ");
                String newUser = System.console().readLine().trim();
                mysql_db_user = newUser;

                com.gmt2001.Console.out.print("Please enter a password for MySQL: ");
                String newPass = System.console().readLine().trim();
                mysql_db_pass = newPass;

                datastore = "MySQLStore";

                com.gmt2001.Console.out.println("PhantomBot MySQL setup done.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        if (message.equals("gamewispsetup")) {
            try {
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.out.println("PhantomBot GameWisp setup.");
                com.gmt2001.Console.out.println();

                com.gmt2001.Console.out.print("Please enter your GameWisp OAuth key: ");
                String newToken = System.console().readLine().trim();
                gamewispauth = newToken;

                com.gmt2001.Console.out.print("Please enter your GameWisp refresh key: ");
                String newToken2 = System.console().readLine().trim();
                gamewisprefresh = newToken2;

                com.gmt2001.Console.out.println("PhantomBot GameWisp setup done.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        if (message.equals("twitchalertssetup")) {
            try {
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.out.println("PhantomBot TwitchAlerts setup.");
                com.gmt2001.Console.out.println();

                com.gmt2001.Console.out.print("Please enter your TwitchAlerts OAuth key: ");
                String newToken = System.console().readLine().trim();
                twitchalertskey = newToken;

                com.gmt2001.Console.out.println("PhantomBot TwitchAlerts setup done.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        if (message.equals("streamtipsetup")) {
            try {
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.out.println("PhantomBot StreamTip setup.");
                com.gmt2001.Console.out.println();

                com.gmt2001.Console.out.print("Please enter your StreamTip Api OAuth: ");
                String newToken = System.console().readLine().trim();
                streamtipkey = newToken;

                com.gmt2001.Console.out.print("Please enter your StreamTip Client Id: ");
                String newId = System.console().readLine().trim();
                streamtipid = newId;

                com.gmt2001.Console.out.println("PhantomBot StreamTip setup done.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        if (message.equals("twittersetup")) {
            try {
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.out.println("PhantomBot Twitter setup.");
                com.gmt2001.Console.out.println();

                com.gmt2001.Console.out.print("Please enter your Twitter username: ");
                String newUser = System.console().readLine().trim();
                twitterUser = newUser;

                com.gmt2001.Console.out.print("Please enter your consumer key: ");
                String newConsumerKey = System.console().readLine().trim();
                twitter_consumer_key = newConsumerKey;

                com.gmt2001.Console.out.print("Please enter your consumer secret: ");
                String newConsumerSecret = System.console().readLine().trim();
                twitter_consumer_secret = newConsumerSecret;

                com.gmt2001.Console.out.print("Please enter your access token: ");
                String newAccess = System.console().readLine().trim();
                twitter_access_token = newAccess;

                com.gmt2001.Console.out.print("Please enter your access token secret: ");
                String newSecretAccess = System.console().readLine().trim();
                twitter_secret_token = newSecretAccess;

                try {
                    File f = new File("./twitter.txt"); 
                    f.delete();
                } catch (NullPointerException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }

                com.gmt2001.Console.out.println("PhantomBot Twitter setup done.");
                changed = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        if (changed) {
            try {
                String data = "";
                if (!resetLoging) {
                    data += "user=" + username + "\r\n";
                    data += "oauth=" + oauth + "\r\n";
                    data += "apioauth=" + apioauth + "\r\n";
                    data += "paneluser=" + paneluser + "\r\n";
                    data += "panelpassword=" + panelpassword + "\r\n";
                    data += "channel=" + channelName.replace("#", "") + "\r\n";
                    data += "webauth=" + webauth + "\r\n";
                    data += "webauthro=" + webauthro + "\r\n";
                    data += "clientid=" + clientid + "\r\n";
                    data += "owner=" + ownerName + "\r\n";
                    data += "baseport=" + baseport + "\r\n";
                    data += "hostname=" + hostname + "\r\n";
                    data += "port=" + port + "\r\n";
                    data += "msglimit30=" + msglimit30 + "\r\n";
                    data += "whisperlimit60=" + whisperlimit60 + "\r\n";
                    data += "datastore=" + datastore + "\r\n";
                    data += "youtubekey=" + youtubekey + "\r\n";
                    data += "webenable=" + webenable + "\r\n";
                    data += "musicenable=" + musicenable + "\r\n";
                    data += "ytauth=" + ytauth + "\r\n";
                    data += "ytauthro=" + ytauthro + "\r\n";
                    data += "usehttps=" + usehttps + "\r\n";
                    data += "keystorepath=" + keystorepath + "\r\n";
                    data += "keystorepassword=" + keystorepassword + "\r\n";
                    data += "keypassword=" + keypassword + "\r\n";
                    data += "twitchalertskey=" + twitchalertskey + "\r\n";
                    data += "twitchalertslimit=" + twitchalertslimit + "\r\n";
                    data += "streamtipkey=" + streamtipkey + "\r\n";
                    data += "streamtiplimit=" + streamtiplimit + "\r\n";
                    data += "streamtipid=" + streamtipid + "\r\n";
                    data += "gamewispauth=" + gamewispauth + "\r\n";
                    data += "gamewisprefresh=" + gamewisprefresh + "\r\n";
                    data += "mysqlhost=" + mysql_db_host + "\r\n";
                    data += "mysqlport=" + mysql_db_port + "\r\n";
                    data += "mysqlname=" + mysql_db_name + "\r\n";
                    data += "mysqluser=" + mysql_db_user + "\r\n";
                    data += "mysqlpass=" + mysql_db_pass + "\r\n";
                    data += "twitterUser=" + twitterUser + "\r\n";
                    data += "twitter_consumer_key=" + twitter_consumer_key + "\r\n";
                    data += "twitter_consumer_secret=" + twitter_consumer_secret + "\r\n";
                    data += "twitter_access_token=" + twitter_access_token + "\r\n";
                    data += "twitter_secret_token=" + twitter_secret_token + "\r\n";
                    
                    if (!log_timezone.isEmpty()) {
                        data += "logtimezone=" + log_timezone + "\r\n";
                    }
                }

                Files.write(Paths.get("./botlogin.txt"), data.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
                dataStoreObj.SaveChangedNow();
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.out.println("Changes have been saved.");
                com.gmt2001.Console.out.println("Now exiting...");
                com.gmt2001.Console.out.println();
                resetLoging = false;
                System.exit(0);
            } catch (IOException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
            return;
        }

        if (message.equals("save")) {
            com.gmt2001.Console.out.println("[CONSOLE] Executing save");
            dataStoreObj.SaveAll(true);
            return;
        }

        if (message.equals("quicksave")) {
            com.gmt2001.Console.out.println("[CONSOLE] Executing quicksave");
            dataStoreObj.SaveChangedNow();
            return;
        }

        if (message.equals("exit")) {
            com.gmt2001.Console.out.println("[CONSOLE] Executing exit");
            System.exit(0);
        }
        handleCommand(username, message);
    }

    public void handleCommand(String sender, String commandString) {
        String command, arguments;
        int split = commandString.indexOf(' ');

        if (split == -1) {
            command = commandString;
            arguments = "";
        } else {
            command = commandString.substring(0, split);
            arguments = commandString.substring(split + 1);
        }

        ScriptEventManager.instance().runDirect(new CommandEvent(sender, command, arguments));
    }

    private static void sqlite2mysql() {
        com.gmt2001.Console.out.println("Performing SQLite to MySQL Conversion...");
        MySQLStore mysql = MySQLStore.instance();
        SqliteStore sqlite = SqliteStore.instance();

        com.gmt2001.Console.out.println("  Wiping Existing MySQL Tables...");
        String[] deltables = mysql.GetFileList();
        for (String table : deltables) {
            mysql.RemoveFile(table);
        }

        com.gmt2001.Console.out.println("  Converting SQLite to MySQL...");
        String[] tables = sqlite.GetFileList();
        for (String table : tables) {
            com.gmt2001.Console.out.println("    Converting Table: " + table);
            String[] sections = sqlite.GetCategoryList(table);
            for (String section : sections) {
                String[] keys = sqlite.GetKeyList(table, section);
                for (String key : keys) {
                    String value = sqlite.GetString(table, section, key);
                    mysql.SetString(table, section, key, value);
                }
            }
        }
        com.gmt2001.Console.out.println("  Finished Converting Tables.");

        com.gmt2001.Console.out.println("  Moving phantombot.db to phantombot.db.backup");
        try {
            FileUtils.moveFile(new java.io.File("phantombot.db"), new java.io.File("phantombot.db.backup"));
        } catch (IOException ex) {
            com.gmt2001.Console.err.println("Failed to move phantombot.db to phantombot.db.backup: " + ex.getMessage());
        }

        com.gmt2001.Console.out.println("SQLite to MySQL Conversion is Complete");
        
    }

    private static void ini2mysql(boolean delete) {
        com.gmt2001.Console.out.println("Performing INI to MySQL Conversion...");
        IniStore ini = IniStore.instance();
        MySQLStore mysql = MySQLStore.instance();

        com.gmt2001.Console.out.println("  Wiping Existing MySQL Tables...");
        String[] deltables = mysql.GetFileList();
        for (String table : deltables) {
            mysql.RemoveFile(table);
        }

        com.gmt2001.Console.out.println("  Converting IniStore to MySQL...");
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
            com.gmt2001.Console.out.println("\r  Converting File: " + file);
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
        com.gmt2001.Console.out.println("\r  Conversion from IniStore to MySQL is Complete" + str);

        if (delete) {
            com.gmt2001.Console.out.print("  Deleting IniStore folder...");
            for (String file : files) {
                ini.RemoveFile(file);
            }

            File f = new File("./inistore");
            if (f.delete()) {
                com.gmt2001.Console.out.println("Process is Done");
            }
        }
    }

    private static void ini2sqlite(boolean delete) {
        com.gmt2001.Console.out.print("Performing INI 2 SQLite Upgrade");
        IniStore ini = IniStore.instance();
        SqliteStore sqlite = SqliteStore.instance();
        com.gmt2001.Console.out.println("done");

        com.gmt2001.Console.out.print("  Wiping Existing SQLiteStore...");
        String[] deltables = sqlite.GetFileList();
        for (String table : deltables) {
            sqlite.RemoveFile(table);
        }
        com.gmt2001.Console.out.println("done");

        com.gmt2001.Console.out.print("  Copying IniStore to SQLiteStore...");
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
            com.gmt2001.Console.out.print("\r  Copying IniStore to SQLiteStore..." + str);
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
                com.gmt2001.Console.out.print("\r  Copying IniStore to SQLiteStore..." + str);

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
                    com.gmt2001.Console.out.print("\r  Copying IniStore to SQLiteStore..." + str);

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
        com.gmt2001.Console.out.println("\r  Copying IniStore to SQLiteStore is Completed" + str);

        if (delete) {
            com.gmt2001.Console.out.print("  Deleting IniStore folder...");
            for (String file : files) {
                ini.RemoveFile(file);
            }

            File f = new File("./inistore");
            if (f.delete()) {
                com.gmt2001.Console.out.println("Process is Done");
            }
        }
    }

    public static void main(String[] args) throws IOException {
        String mysql_db_host = "";
        String mysql_db_port = "";
        String mysql_db_name = "";
        String mysql_db_user = "";
        String mysql_db_pass = "";
        String user = "";
        String oauth = "";
        String webauth = "";
        String webauthro = "";
        String paneluser = "";
        String panelpassword = "";
        String ytauth = "";
        String ytauthro = "";
        String gamewispauth = "";
        String gamewisprefresh = "";
        String twitchalertskey = "";
        int twitchalertslimit = 5;
        String streamtipkey = "";
        String streamtipid = "";
        int streamtiplimit = 1;
        String apioauth = "";
        String clientid = "";
        String channel = "";
        String owner = "";
        String hostname = "";
        int baseport = 25000;
        int port = 0;
        double msglimit30 = 0;
        double whisperlimit60 = 0;
        String datastore = "";
        String datastoreconfig = "";
        String youtubekey = "";
        boolean webenable = true;
        boolean musicenable = true;
        boolean usehttps = false;
        String keystorepath = "";
        String keystorepassword = "";
        String keypassword = "";
        String log_timezone = "";

        String twitterUser = "";
        String twitter_access_token = "";
        String twitter_secret_token = "";
        String twitter_consumer_key = "";
        String twitter_consumer_secret = "";


        boolean changed = false;

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
                                     + "    [hostname=<custom irc server>]\r\n"
                                     + "    [port=<custom irc port>]\r\n"
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

        com.gmt2001.Console.out.println("The working directory is: " + System.getProperty("user.dir"));

        try {
            if (new File("./botlogin.txt").exists()) {
                String data = FileUtils.readFileToString(new File("./botlogin.txt"));
                String[] lines = data.replaceAll("\\r", "").split("\\n");

                for (String line : lines) {
                    if (line.startsWith("logtimezone=") && line.length() >= 15) {
                        log_timezone = line.substring(12);
                    }
                    if (line.startsWith("reloadscripts")) {
                        com.gmt2001.Console.out.println("Enabling Script Reloading");
                        PhantomBot.reloadScripts = true;
                    }
                    if (line.startsWith("debugon")) {
                        com.gmt2001.Console.out.println("Debug Mode Enabled via botlogin.txt");
                        PhantomBot.enableDebugging = true;
                    }
                    if (line.startsWith("user=") && line.length() > 8) {
                        user = line.substring(5);
                    }
                    if (line.startsWith("webauth=") && line.length() > 11) {
                        webauth = line.substring(8);
                    }
                    if (line.startsWith("webauthro=") && line.length() > 13) {
                        webauthro = line.substring(10);
                    }
                    if (line.startsWith("paneluser=") && line.length() > 12) {
                        paneluser = line.substring(10);
                    }
                    if (line.startsWith("panelpassword=") && line.length() > 16) {
                        panelpassword = line.substring(14);
                    }
                    if (line.startsWith("mysqlhost=") && line.length() > 11) {
                        mysql_db_host = line.substring(10);
                    }
                    if (line.startsWith("mysqlport=") && line.length() > 11) {
                        mysql_db_port = line.substring(10);
                    }
                    if (line.startsWith("mysqlname=") && line.length() > 11) {
                        mysql_db_name = line.substring(10);
                    }
                    if (line.startsWith("mysqluser=") && line.length() > 11) {
                        mysql_db_user = line.substring(10);
                    }
                    if (line.startsWith("mysqlpass=") && line.length() > 11) {
                        mysql_db_pass = line.substring(10);
                    }
                    if (line.startsWith("ytauth=") && line.length() > 8) {
                        ytauth = line.substring(7);
                    }
                    if (line.startsWith("ytauthro=") && line.length() > 10) {
                        ytauthro = line.substring(9);
                    }
                    if (line.startsWith("gamewispauth=") && line.length() > 14) {
                        gamewispauth = line.substring(13);
                    }
                    if (line.startsWith("gamewisprefresh=") && line.length() > 17) {
                        gamewisprefresh = line.substring(16);
                    }
                    if (line.startsWith("oauth=") && line.length() > 9) {
                        oauth = line.substring(6);
                    }
                    if (line.startsWith("apioauth=") && line.length() > 12) {
                        apioauth = line.substring(9);
                    }
                    if (line.startsWith("clientid=") && line.length() > 12) {
                        clientid = line.substring(9);
                    }
                    if (line.startsWith("channel=") && line.length() > 11) {
                        channel = line.substring(8);
                    }
                    if (line.startsWith("owner=") && line.length() > 9) {
                        owner = line.substring(6);
                    }
                    if (line.startsWith("baseport=") && line.length() > 10) {
                        baseport = Integer.parseInt(line.substring(9));
                    }
                    if (line.startsWith("hostname=") && line.length() > 10) {
                        hostname = line.substring(9);
                    }
                    if (line.startsWith("port=") && line.length() > 6) {
                        port = Integer.parseInt(line.substring(5));
                    }
                    if (line.startsWith("msglimit30=") && line.length() > 12) {
                        msglimit30 = Double.parseDouble(line.substring(11));
                    }
                    if (line.startsWith("whisperlimit60=") && line.length() > 16) {
                        whisperlimit60 = Double.parseDouble(line.substring(15));
                    }
                    if (line.startsWith("datastore=") && line.length() > 11) {
                        datastore = line.substring(10);
                    }
                    if (line.startsWith("youtubekey=") && line.length() > 12) {
                        youtubekey = line.substring(11);
                    }
                    if (line.startsWith("webenable=") && line.length() > 11) {
                        webenable = Boolean.valueOf(line.substring(10));
                    }
                    if (line.startsWith("musicenable=") && line.length() > 13) {
                        musicenable = Boolean.valueOf(line.substring(12));
                    }
                    if (line.startsWith("usehttps=") && line.length() > 10) {
                        usehttps = Boolean.valueOf(line.substring(9));
                    }
                    if (line.startsWith("keystorepath=") && line.length() > 14) {
                        keystorepath = line.substring(13);
                    }
                    if (line.startsWith("keystorepassword=") && line.length() > 18) {
                        keystorepassword = line.substring(17);
                    }
                    if (line.startsWith("keypassword=") && line.length() > 13) {
                        keypassword = line.substring(12);
                    }
                    if (line.startsWith("twitchalertskey=") && line.length() > 17) {
                        twitchalertskey = line.substring(16);
                    }
                    if (line.startsWith("twitchalertslimit=") && line.length() > 18) {
                        try {
                            twitchalertslimit = Integer.parseInt(line.substring(18));
                        } catch (NumberFormatException nfe) {
                            twitchalertslimit = 5;
                        }
                    }
                    if (line.startsWith("streamtipkey=") && line.length() > 14) {
                        streamtipkey = line.substring(13);
                    }
                    if (line.startsWith("streamtipid=") && line.length() > 13) {
                        streamtipid = line.substring(12);
                    }
                    if (line.startsWith("streamtiplimit=") && line.length() > 16) {
                        try {
                            streamtiplimit = Integer.parseInt(line.substring(15));
                        } catch (NumberFormatException nfe) {
                            streamtiplimit = 5;
                        }
                    }
                    if (line.startsWith("twitterUser=") && line.length() > 13) {
                        twitterUser = line.substring(12);
                    }
                    if (line.startsWith("twitter_access_token=") && line.length() > 22) {
                        twitter_access_token = line.substring(21);
                    }
                    if (line.startsWith("twitter_secret_token=") && line.length() > 22) {
                        twitter_secret_token = line.substring(21);
                    }
                    if (line.startsWith("twitter_consumer_secret=") && line.length() > 25) {
                        twitter_consumer_secret = line.substring(24);
                    }
                    if (line.startsWith("twitter_consumer_key=") && line.length() > 22) {
                        twitter_consumer_key = line.substring(21);
                    }
                }
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        if (webauth.isEmpty()) {
            webauth = generateWebAuth();
            com.gmt2001.Console.debug.println("New webauth key has been generated for botlogin.txt");
            changed = true;
        }
        if (webauthro.isEmpty()) {
            webauthro = generateWebAuth();
            com.gmt2001.Console.debug.println("New webauth read-only key has been generated for botlogin.txt");
            changed = true;
        }
        if (paneluser.isEmpty()) {
            com.gmt2001.Console.debug.println("No Panel Username, using default value of 'panel' for Control Panel and YouTube Player");
            paneluser = "panel";
            changed = true;
        }
        if (panelpassword.isEmpty()) {
            com.gmt2001.Console.debug.println("No Panel Password, using default value of 'panel' for Control Panel and YouTube Player");
            panelpassword = "panel";
            changed = true;
        }
        if (ytauth.isEmpty()) {
            ytauth = generateWebAuth();
            com.gmt2001.Console.debug.println("New YouTube websocket key has been generated for botlogin.txt");
            changed = true;
        }
        if (ytauthro.isEmpty()) {
            ytauthro = generateWebAuth();
            com.gmt2001.Console.debug.println("New YouTube read-only websocket key has been generated for botlogin.txt");
            changed = true;
        }

        if (user.isEmpty() || oauth.isEmpty() || channel.isEmpty()) {
            try {
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.out.println("Welcome to the PhantomBot setup process!");
                com.gmt2001.Console.out.println("If you have any issues please report them on our forum or tweet at us!");
                com.gmt2001.Console.out.println("Forum: https://community.phantombot.net/");
                com.gmt2001.Console.out.println("Twitter: https://twitter.com/phantombotapp/");
                com.gmt2001.Console.out.println("PhantomBot Knowledgebase: https://docs.phantombot.net/");
                com.gmt2001.Console.out.println();

                com.gmt2001.Console.out.print("Please enter the bot's Twitch username: ");
                user = System.console().readLine().trim();

                com.gmt2001.Console.out.print("Please enter the bot's OAuth token generated from https://twitchapps.com/tmi while logged in as the bot: ");
                oauth = System.console().readLine().trim();

                com.gmt2001.Console.out.print("Please enter your OAuth token generated from https://phantombot.net/oauth while logged in as the caster: ");
                apioauth = System.console().readLine().trim();

                com.gmt2001.Console.out.print("Please enter the name of the Twitch channel the bot should join: ");
                channel = System.console().readLine().trim();

                com.gmt2001.Console.out.print("Please enter a custom username for the web panel: ");
                paneluser = System.console().readLine().trim();

                com.gmt2001.Console.out.print("Please enter a custom password for the web panel: ");
                panelpassword = System.console().readLine().trim();

                changed = true;
                newSetup = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        if (owner.isEmpty()) {
            owner = channel;
            changed = true;
        }

        if (!oauth.startsWith("oauth:") && !oauth.isEmpty()) {
            oauth = "oauth:" + oauth;
            changed = true;
        }

        if (!apioauth.startsWith("oauth:") && !apioauth.isEmpty()) {
            apioauth = "oauth:" + apioauth;
            changed = true;
        }

        if (channel.startsWith("#")) {
            channel = channel.substring(1);
            changed = true;
        }

        if (args.length > 0) {
            for (String arg : args) {
                if (arg.equalsIgnoreCase("printlogin")) {
                    com.gmt2001.Console.out.println("user='" + user + "'");
                    com.gmt2001.Console.out.println("oauth='" + oauth + "'");
                    com.gmt2001.Console.out.println("apioauth='" + apioauth + "'");
                    com.gmt2001.Console.out.println("webauth='" + webauth + "'");
                    com.gmt2001.Console.out.println("webauthro='" + webauthro + "'");
                    com.gmt2001.Console.out.println("clientid='" + clientid + "'");
                    com.gmt2001.Console.out.println("channel='" + channel + "'");
                    com.gmt2001.Console.out.println("owner='" + owner + "'");
                    com.gmt2001.Console.out.println("baseport='" + baseport + "'");
                    com.gmt2001.Console.out.println("hostname='" + hostname + "'");
                    com.gmt2001.Console.out.println("port='" + port + "'");
                    com.gmt2001.Console.out.println("msglimit30='" + msglimit30 + "'");
                    com.gmt2001.Console.out.println("whisperlimit60='" + whisperlimit60 + "'");
                    com.gmt2001.Console.out.println("datastore='" + datastore + "'");
                    com.gmt2001.Console.out.println("youtubekey='" + youtubekey + "'");
                    com.gmt2001.Console.out.println("webenable=" + webenable);
                    com.gmt2001.Console.out.println("musicenable=" + musicenable);
                    com.gmt2001.Console.out.println("ytauth=" + ytauth);
                    com.gmt2001.Console.out.println("ytauthro=" + ytauthro);
                    com.gmt2001.Console.out.println("gamewispauth=" + gamewispauth);
                    com.gmt2001.Console.out.println("gamewisprefresh=" + gamewisprefresh);
                    com.gmt2001.Console.out.println("usehttps=" + usehttps);
                    com.gmt2001.Console.out.println("keystorepath='" + keystorepath + "'");
                    com.gmt2001.Console.out.println("keystorepassword='" + keystorepassword + "'");
                    com.gmt2001.Console.out.println("keypassword='" + keypassword + "'");
                    com.gmt2001.Console.out.println("twitchalertskey='" + twitchalertskey + "'");
                    com.gmt2001.Console.out.println("twitchalertslimit='" + twitchalertslimit + "'");
                    com.gmt2001.Console.out.println("streamtipkey='" + streamtipkey + "'");
                    com.gmt2001.Console.out.println("streamtipid='" + streamtipid + "'");
                    com.gmt2001.Console.out.println("streamtiplimit='" + streamtiplimit + "'");
                    com.gmt2001.Console.out.println("paneluser='" + paneluser + "'");
                    com.gmt2001.Console.out.println("panelpassword='" + panelpassword + "'");
                    com.gmt2001.Console.out.println("twitterUser='" + twitterUser + "'");
                    com.gmt2001.Console.out.println("twitter_consumer_secret='" + twitter_consumer_secret + "'");
                    com.gmt2001.Console.out.println("twitter_consumer_key='" + twitter_consumer_key + "'");
                    com.gmt2001.Console.out.println("twitter_access_token='" + twitter_access_token + "'");
                    com.gmt2001.Console.out.println("twitter_secret_token='" + twitter_secret_token + "'");
                }

                if (arg.equalsIgnoreCase("debugon")) {
                    com.gmt2001.Console.out.println("Debug Mode Enabled via command line");
                    PhantomBot.enableDebugging = true;
                }
                if (arg.equalsIgnoreCase("ini2sqlite")) {
                    com.gmt2001.Console.out.println("Converting default IniStore to default SqliteStore...");
                    ini2sqlite(false);
                    com.gmt2001.Console.out.println("Operation complete. The bot will now exit");
                    System.exit(0);
                    return;
                }
                if (arg.toLowerCase().startsWith("user=") && arg.length() > 8) {
                    if (!user.equals(arg.substring(5))) {
                        user = arg.substring(5);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("oauth=") && arg.length() > 9) {
                    if (!oauth.equals(arg.substring(6))) {
                        oauth = arg.substring(6);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("apioauth=") && arg.length() > 12) {
                    if (!apioauth.equals(arg.substring(9))) {
                        apioauth = arg.substring(9);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("paneluser=") && arg.length() > 12) {
                    if (!paneluser.equals(arg.substring(10))) {
                        paneluser = arg.substring(10);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("panelpassword=") && arg.length() > 16) {
                    if (!panelpassword.equals(arg.substring(14))) {
                        panelpassword = arg.substring(14);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("mysqlhost=") && arg.length() > 11) {
                    if (!mysql_db_host.equals(arg.substring(10))) {
                         mysql_db_host = arg.substring(10);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("mysqlport=") && arg.length() > 11) {
                    if (!mysql_db_port.equals(arg.substring(10))) {
                         mysql_db_port = arg.substring(10);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("mysqlname=") && arg.length() > 11) {
                    if (!mysql_db_name.equals(arg.substring(10))) {
                         mysql_db_name = arg.substring(10);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("mysqluser=") && arg.length() > 11) {
                    if (!mysql_db_user.equals(arg.substring(14))) {
                        mysql_db_user = arg.substring(10);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("mysqlpass=") && arg.length() > 11) {
                    if (!mysql_db_pass.equals(arg.substring(10))) {
                        mysql_db_pass = arg.substring(10);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("gamewispauth=") && arg.length() > 14) {
                    if (!gamewispauth.equals(arg.substring(13))) {
                        gamewispauth = arg.substring(13);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("gamewisprefresh=") && arg.length() > 17) {
                    if (!gamewisprefresh.equals(arg.substring(16))) {
                        gamewisprefresh = arg.substring(16);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("clientid=") && arg.length() > 12) {
                    if (!clientid.equals(arg.substring(9))) {
                        clientid = arg.substring(9);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("channel=") && arg.length() > 11) {
                    if (!channel.equals(arg.substring(8))) {
                        channel = arg.substring(8);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("owner=") && arg.length() > 9) {
                    if (!owner.equals(arg.substring(6))) {
                        owner = arg.substring(6);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("baseport=") && arg.length() > 10) {
                    if (baseport != Integer.parseInt(arg.substring(9))) {
                        baseport = Integer.parseInt(arg.substring(9));
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("hostname=") && arg.length() > 10) {
                    if (!hostname.equals(arg.substring(9))) {
                        hostname = arg.substring(9);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("port=") && arg.length() > 6) {
                    if (port != Integer.parseInt(arg.substring(5))) {
                        port = Integer.parseInt(arg.substring(5));
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("msglimit30=") && arg.length() > 12) {
                    if (msglimit30 != Double.parseDouble(arg.substring(11))) {
                        msglimit30 = Double.parseDouble(arg.substring(11));
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("whisperlimit60=") && arg.length() > 16) {
                    if (whisperlimit60 != Double.parseDouble(arg.substring(15))) {
                        whisperlimit60 = Double.parseDouble(arg.substring(15));
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("datastore=") && arg.length() > 11) {
                    if (!datastore.equals(arg.substring(10))) {
                        datastore = arg.substring(10);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("datastoreconfig=") && arg.length() > 17) {
                    datastoreconfig = arg.substring(16);
                }
                if (arg.toLowerCase().startsWith("youtubekey=") && arg.length() > 12) {
                    if (!youtubekey.equals(arg.substring(11))) {
                        youtubekey = arg.substring(11);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("webenable=") && arg.length() > 11) {
                    if (webenable != Boolean.valueOf(arg.substring(10))) {
                        webenable = Boolean.valueOf(arg.substring(10));
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("musicenable=") && arg.length() > 13) {
                    if (musicenable != Boolean.valueOf(arg.substring(12))) {
                        musicenable = Boolean.valueOf(arg.substring(12));
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("usehttps=") && arg.length() > 10) {
                    if (usehttps != Boolean.valueOf(arg.substring(9))) {
                        usehttps = Boolean.valueOf(arg.substring(9));
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("keystorepath=") && arg.length() > 14) {
                    if (!keystorepath.equals(arg.substring(13))) {
                        keystorepath = arg.substring(13);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("keystorepassword=") && arg.length() > 18) {
                    if (!keystorepassword.equals(arg.substring(17))) {
                        keystorepassword = arg.substring(17);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("keypassword=") && arg.length() > 13) {
                    if (!keypassword.equals(arg.substring(12))) {
                        keypassword = arg.substring(12);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("twitchalertskey=") && arg.length() > 17) {
                    if (!twitchalertskey.equals(arg.substring(16))) {
                        twitchalertskey = arg.substring(16);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("twitchalertslimit=") && arg.length() > 19) {
                    if (twitchalertslimit != Integer.parseInt(arg.substring(18))) {
                        try {
                            twitchalertslimit = Integer.parseInt(arg.substring(18));
                            changed = true;
                        } catch (NumberFormatException nfe) {
                            twitchalertslimit = 5;
                        }
                    }
                }
                if (arg.toLowerCase().startsWith("streamtipkey=") && arg.length() > 14) {
                    if (!streamtipkey.equals(arg.substring(13))) {
                        streamtipkey = arg.substring(13);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("streamtipid=") && arg.length() > 13) {
                    if (!streamtipid.equals(arg.substring(12))) {
                        streamtipid = arg.substring(12);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("streamtiplimit=") && arg.length() > 16) {
                    if (streamtiplimit != Integer.parseInt(arg.substring(15))) {
                        try {
                            streamtiplimit = Integer.parseInt(arg.substring(15));
                            changed = true;
                        } catch (NumberFormatException nfe) {
                            streamtiplimit = 5;
                        }
                    }
                }
                if (arg.toLowerCase().startsWith("twitterUser=") && arg.length() > 13) {
                    if (!twitterUser.equals(arg.substring(12))) {
                        twitterUser = arg.substring(12);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("twitter_secret_token=") && arg.length() > 22) {
                    if (!twitter_secret_token.equals(arg.substring(21))) {
                        twitter_secret_token = arg.substring(21);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("twitter_access_token=") && arg.length() > 22) {
                    if (!twitter_access_token.equals(arg.substring(21))) {
                        twitter_access_token = arg.substring(21);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("twitter_consumer_secret=") && arg.length() > 25) {
                    if (!twitter_consumer_secret.equals(arg.substring(24))) {
                        twitter_consumer_secret = arg.substring(24);
                        changed = true;
                    }
                }
                if (arg.toLowerCase().startsWith("twitter_consumer_key=") && arg.length() > 22) {
                    if (!twitter_consumer_key.equals(arg.substring(21))) {
                        twitter_consumer_key = arg.substring(21);
                        changed = true;
                    }
                }
            }
        }

        if (changed) {
            String data = "";
            data += "user=" + user + "\r\n";
            data += "webauth=" + webauth + "\r\n";
            data += "webauthro=" + webauthro + "\r\n";
            data += "oauth=" + oauth + "\r\n";
            data += "apioauth=" + apioauth + "\r\n";
            data += "clientid=" + clientid + "\r\n";
            data += "channel=" + channel + "\r\n";
            data += "owner=" + owner + "\r\n";
            data += "baseport=" + baseport + "\r\n";
            data += "hostname=" + hostname + "\r\n";
            data += "port=" + port + "\r\n";
            data += "msglimit30=" + msglimit30 + "\r\n";
            data += "whisperlimit60=" + whisperlimit60 + "\r\n";
            data += "datastore=" + datastore + "\r\n";
            data += "youtubekey=" + youtubekey + "\r\n";
            data += "webenable=" + webenable + "\r\n";
            data += "musicenable=" + musicenable + "\r\n";
            data += "ytauth=" + ytauth + "\r\n";
            data += "ytauthro=" + ytauthro + "\r\n";
            data += "gamewispauth=" + gamewispauth + "\r\n";
            data += "gamewisprefresh=" + gamewisprefresh + "\r\n";
            data += "usehttps=" + usehttps + "\r\n";
            data += "keystorepath=" + keystorepath + "\r\n";
            data += "keystorepassword=" + keystorepassword + "\r\n";
            data += "keypassword=" + keypassword + "\r\n";
            data += "twitchalertskey=" + twitchalertskey + "\r\n";
            data += "twitchalertslimit=" + twitchalertslimit + "\r\n";
            data += "paneluser=" + paneluser + "\r\n";
            data += "panelpassword=" + panelpassword + "\r\n";
            data += "mysqlhost=" + mysql_db_host + "\r\n";
            data += "mysqlport=" + mysql_db_port + "\r\n";
            data += "mysqlname=" + mysql_db_name + "\r\n";
            data += "mysqluser=" + mysql_db_user + "\r\n";
            data += "mysqlpass=" + mysql_db_pass + "\r\n";
            data += "twitterUser=" + twitterUser + "\r\n";
            data += "twitter_consumer_secret=" + twitter_consumer_secret + "\r\n";
            data += "twitter_consumer_key=" + twitter_consumer_key + "\r\n";
            data += "twitter_access_token=" + twitter_access_token + "\r\n";
            data += "twitter_secret_token=" + twitter_secret_token + "\r\n";
            if (!log_timezone.isEmpty()) {
                data += "logtimezone=" + log_timezone + "\r\n";
            }

            Files.write(Paths.get("./botlogin.txt"), data.getBytes(StandardCharsets.UTF_8),
                        StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
        }

        PhantomBot.instance = new PhantomBot(user, oauth, apioauth, clientid, channel, owner, baseport, hostname, port, msglimit30,
                                             whisperlimit60, datastore, datastoreconfig, youtubekey, webenable, musicenable,
                                             usehttps, keystorepath, keystorepassword, keypassword, twitchalertskey, twitchalertslimit,
                                             webauth, webauthro, ytauth, ytauthro, gamewispauth, gamewisprefresh, paneluser, panelpassword,
                                             twitterUser, twitter_access_token, twitter_secret_token, twitter_consumer_key, twitter_consumer_secret, log_timezone,
                                             mysql_db_host, mysql_db_port, mysql_db_name, mysql_db_user, mysql_db_pass, streamtipkey, streamtipid, streamtiplimit);
    }

    public void updateGameWispTokens(String[] newTokens) {
        String data = "";
        data += "user=" + username + "\r\n";
        data += "webauth=" + webauth + "\r\n";
        data += "webauthro=" + webauthro + "\r\n";
        data += "oauth=" + oauth + "\r\n";
        data += "apioauth=" + apioauth + "\r\n";
        data += "clientid=" + this.clientid + "\r\n";
        data += "channel=" + this.channelName + "\r\n";
        data += "owner=" + ownerName + "\r\n";
        data += "baseport=" + baseport + "\r\n";
        data += "hostname=" + hostname + "\r\n";
        data += "port=" + port + "\r\n";
        data += "msglimit30=" + msglimit30 + "\r\n";
        data += "whisperlimit60=" + whisperlimit60 + "\r\n";
        data += "datastore=" + datastore + "\r\n";
        data += "youtubekey=" + youtubekey + "\r\n";
        data += "webenable=" + webenable + "\r\n";
        data += "musicenable=" + musicenable + "\r\n";
        data += "ytauth=" + ytauth + "\r\n";
        data += "ytauthro=" + ytauthro + "\r\n";
        data += "gamewispauth=" + newTokens[0] + "\r\n";
        data += "gamewisprefresh=" + newTokens[1] + "\r\n";
        data += "usehttps=" + usehttps + "\r\n";
        data += "keystorepath=" + keystorepath + "\r\n";
        data += "keystorepassword=" + keystorepassword + "\r\n";
        data += "keypassword=" + keypassword + "\r\n";
        data += "twitchalertskey=" + twitchalertskey + "\r\n";
        data += "twitchalertslimit=" + twitchalertslimit + "\r\n";
        data += "streamtipkey=" + streamtipkey + "\r\n";
        data += "streamtiplimit=" + streamtiplimit + "\r\n";
        data += "streamtipid=" + streamtipid + "\r\n";
        data += "paneluser=" + paneluser + "\r\n";
        data += "panelpassword=" + panelpassword + "\r\n";
        data += "mysqlhost=" + mysql_db_host + "\r\n";
        data += "mysqlport=" + mysql_db_port + "\r\n";
        data += "mysqlname=" + mysql_db_name + "\r\n";
        data += "mysqluser=" + mysql_db_user + "\r\n";
        data += "mysqlpass=" + mysql_db_pass + "\r\n";
        data += "twitterUser=" + twitterUser + "\r\n";
        data += "twitter_consumer_secret=" + twitter_consumer_secret + "\r\n";
        data += "twitter_consumer_key=" + twitter_consumer_key + "\r\n";
        data += "twitter_access_token=" + twitter_access_token + "\r\n";
        data += "twitter_secret_token=" + twitter_secret_token + "\r\n";
        if (!log_timezone.isEmpty()) {
            data += "logtimezone=" + log_timezone + "\r\n";
        }

        try {
            Files.write(Paths.get("./botlogin.txt"), data.getBytes(StandardCharsets.UTF_8),
                        StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
            com.gmt2001.Console.out.println("GameWisp Token has been refreshed.");
        } catch (IOException ex) {
            com.gmt2001.Console.err.println("!!!! CRITICAL !!!! Failed to update GameWisp Refresh Tokens into botlogin.txt! Must manually add!");
            com.gmt2001.Console.err.println("!!!! CRITICAL !!!! gamewispauth = " + newTokens[0] + " gamewisprefresh = " + newTokens[1]);
        }

        SingularityAPI.instance().setAccessToken(gamewispauth);
        
    }

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

        if (!dataStoreObj.exists("settings", "gameWispRefreshTime")) {
            dataStoreObj.set("settings", "gameWispRefreshTime", String.valueOf(curTime));
        }

        ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
        service.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                long curTime = System.currentTimeMillis() / 1000l;
                String lastRunStr = dataStoreObj.GetString("settings", "", "gameWispRefreshTime");

                long lastRun = Long.parseLong(lastRunStr);
                if ((curTime - lastRun) > (10 * 24 * 60 * 60)) { // 10 days, token expires every 35.
                    dataStoreObj.set("settings", "gameWispRefreshTime", String.valueOf(curTime));
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
                        Thread.sleep(4000); 
                        com.gmt2001.Console.out.println();
                        com.gmt2001.Console.out.println("New PhantomBot Release Detected: " + newVersionInfo[0]);
                        com.gmt2001.Console.out.println("Release Changelog: https://github.com/PhantomBot/PhantomBot/releases/" + newVersionInfo[0]);
                        com.gmt2001.Console.out.println("Download Link: " + newVersionInfo[1]);
                        com.gmt2001.Console.out.println("A reminder will be provided in 24 hours!");
                        com.gmt2001.Console.out.println();
                    } catch (InterruptedException ex) {
                        com.gmt2001.Console.err.printStackTrace(ex);
                    }

                    if (webenabled) {
                        dataStoreObj.set("settings", "newrelease_info", newVersionInfo[0] + "|" + newVersionInfo[1]);
                    }
                } else {
                    dataStoreObj.del("settings", "newrelease_info");
                }
            }
        }, 0, 24, TimeUnit.HOURS);
    }

    public void setTwitchCacheReady(String twitchCacheReady) {
        this.twitchCacheReady = twitchCacheReady;
        Script.global.defineProperty("twitchCacheReady", this.twitchCacheReady, 0);
    }

    public void loadGameList(DataStore dataStore) {
        try {
            if (new File("./conf/game_list.txt").exists()) {
                long lastModified = new File("./conf/game_list.txt").lastModified();
                long dbLastModified = dataStore.GetLong("settings", "", "gameListModified");
                if (lastModified > dbLastModified) {
                    com.gmt2001.Console.out.println("Processing New Game List File");

                    com.gmt2001.Console.out.println("    Loading into database...");
                    String data = FileUtils.readFileToString(new File("./conf/game_list.txt"));
                    String[] lines = data.replaceAll("\\r", "").split("\\n");
                    dataStore.setbatch("gamelist", lines, lines);

                    com.gmt2001.Console.out.println("    Creating cache file for Control Panel...");

                    if (!new File ("./web/panel/js/games.js").exists()) {
                        new File ("./web/panel/js").mkdirs();
                    }

                    String string = "// PhantomBot Control Panel Game List\r\n// Generated by PhantomBot Core\r\n\r\n$.gamesList = [";
                    Files.write(Paths.get("./web/panel/js/games.js"), string.getBytes(StandardCharsets.UTF_8),
                                StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
                    
                    for (String line : lines) {
                        string = "'" + line.replace("'", "") + "', \r\n";
                        Files.write(Paths.get("./web/panel/js/games.js"), string.getBytes(StandardCharsets.UTF_8),
                                    StandardOpenOption.APPEND);
                        string = "";
                    }

                    string += "];";
                    Files.write(Paths.get("./web/panel/js/games.js"), string.getBytes(StandardCharsets.UTF_8),
                                StandardOpenOption.APPEND);
                    com.gmt2001.Console.out.println("Completed Processing.");
        
                    dataStore.SetLong("settings", "", "gameListModified", lastModified);
                }
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }
}
