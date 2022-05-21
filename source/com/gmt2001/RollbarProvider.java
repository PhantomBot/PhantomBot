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
package com.gmt2001;

import com.rollbar.api.payload.data.Data;
import com.rollbar.api.payload.data.Level;
import com.rollbar.api.payload.data.Person;
import com.rollbar.api.payload.data.Server;
import com.rollbar.api.payload.data.body.BodyContent;
import com.rollbar.api.payload.data.body.Frame;
import com.rollbar.api.payload.data.body.Trace;
import com.rollbar.api.payload.data.body.TraceChain;
import com.rollbar.notifier.Rollbar;
import com.rollbar.notifier.config.ConfigBuilder;
import com.rollbar.notifier.filter.Filter;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Timer;
import java.util.TimerTask;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.apache.commons.codec.binary.Hex;
import org.apache.commons.lang3.SystemUtils;
import reactor.util.annotation.Nullable;
import tv.phantombot.CaselessProperties;
import tv.phantombot.CaselessProperties.Transaction;
import tv.phantombot.PhantomBot;
import tv.phantombot.RepoVersion;
import tv.phantombot.twitch.api.TwitchValidate;

/**
 *
 * @author gmt2001
 */
public final class RollbarProvider implements AutoCloseable {

    private static final RollbarProvider INSTANCE = new RollbarProvider();
    private static final String ACCESS_TOKEN = "@access.token@";
    private static final String ENDPOINT = "@endpoint@";
    private static final int REPEAT_INTERVAL_MINUTES = 180;
    private static final long REPEAT_CHECK_INTERVAL = 1800000L;
    private static final List<String> APP_PACKAGES = Collections.unmodifiableList(Arrays.asList("tv.phantombot", "com.gmt2001", "com.illusionaryone", "com.scaniatv"));
    private static final List<String> FINGERPRINT_FILE_REGEX = Collections.unmodifiableList(Arrays.asList("(.*).js"));
    private static final List<String> SEND_VALUES = Collections.unmodifiableList(Arrays.asList("allownonascii", "baseport", "channel", "datastore", "debugon", "debuglog",
            "helixdebug", "ircdebug", "logtimezone", "msglimit30", "musicenable", "owner", "proxybypasshttps", "reactordebug", "reloadscripts", "rhinodebugger",
            "rollbarid", "twitch_tcp_nodelay", "usehttps", "user", "useeventsub", "userollbar", "webenable", "whisperlimit60", "wsdebug"));
    private final Rollbar rollbar;
    private boolean enabled = false;
    private MessageDigest md;
    private final ConcurrentHashMap<String, Date> reportsPassedFilters = new ConcurrentHashMap<>();
    private final Timer t = new Timer();

    private RollbarProvider() {
        if (RollbarProvider.ENDPOINT.length() > 0 && !RollbarProvider.ENDPOINT.equals("@endpoint@")
                && RollbarProvider.ACCESS_TOKEN.length() > 0 && !RollbarProvider.ACCESS_TOKEN.equals("@access.token@")) {
            this.rollbar = Rollbar.init(ConfigBuilder.withAccessToken(ACCESS_TOKEN).endpoint(ENDPOINT)
                    .codeVersion(RepoVersion.getBuildType().equals("stable") ? RepoVersion.getPhantomBotVersion() : RepoVersion.getRepoVersion())
                    .environment(RepoVersion.getBuildTypeWithDocker()).platform(RollbarProvider.determinePlatform())
                    .server(() -> {
                        Map<String, Object> metadata = new HashMap<>();
                        metadata.put("cpu", System.getProperty("os.arch", "unknown"));
                        metadata.put("java.home", System.getProperty("java.home", "unknown"));
                        metadata.put("java.specification.name", System.getProperty("java.specification.name", "unknown"));
                        metadata.put("java.specification.vendor", System.getProperty("java.specification.vendor", "unknown"));
                        metadata.put("java.specification.version", System.getProperty("java.specification.version", "unknown"));
                        metadata.put("java.vendor", System.getProperty("java.vendor", "unknown"));
                        metadata.put("java.version", System.getProperty("java.version", "unknown"));
                        metadata.put("os.arch", System.getProperty("os.arch", "unknown"));
                        metadata.put("os.name", System.getProperty("os.name", "unknown"));
                        metadata.put("os.version", System.getProperty("os.version", "unknown"));
                        return new Server.Builder().root("/").metadata(metadata).build();
                    })
                    .person(() -> {
                        Map<String, Object> metadata = new HashMap<>();
                        String botName = CaselessProperties.instance().getProperty("user", "").toLowerCase();
                        metadata.put("user", botName);
                        metadata.put("channel", CaselessProperties.instance().getProperty("channel", "").toLowerCase());
                        metadata.put("owner", CaselessProperties.instance().getProperty("owner", botName));

                        return new Person.Builder().id(RollbarProvider.getId()).username(CaselessProperties.instance().getProperty("owner", botName)).metadata(metadata).build();
                    })
                    .custom(() -> {
                        Map<String, Object> metadata = new HashMap<>();
                        metadata.put("phantombot.datastore", CaselessProperties.instance().getProperty("datastore", "sqlite3store"));
                        metadata.put("phantombot.debugon", PhantomBot.getEnableDebugging() ? "true" : "false");
                        metadata.put("phantombot.debuglog", PhantomBot.getEnableDebuggingLogOnly() ? "true" : "false");
                        metadata.put("phantombot.rhinodebugger", PhantomBot.getEnableRhinoDebugger() ? "true" : "false");
                        metadata.put("config.oauth.isuser", TwitchValidate.instance().getChatLogin().equalsIgnoreCase(CaselessProperties.instance().getProperty("user", "")) ? "true" : "false");
                        metadata.put("config.apioauth.iscaster", TwitchValidate.instance().getAPILogin().equalsIgnoreCase(CaselessProperties.instance().getProperty("channel", "")) ? "true" : "false");

                        CaselessProperties.instance().keySet().stream().map(k -> (String) k).forEachOrdered(s -> {
                            if (RollbarProvider.SEND_VALUES.contains(s)) {
                                metadata.put("config." + s, CaselessProperties.instance().getProperty(s));
                            } else {
                                metadata.put("config." + s, "set");
                            }
                        });

                        return metadata;
                    })
                    .filter(new Filter() {
                        @Override
                        public boolean preProcess(Level level, @Nullable Throwable error, @Nullable Map<String, Object> custom, @Nullable String description) {
                            if (!level.equals(Level.ERROR) && !level.equals(Level.CRITICAL)) {
                                return true;
                            }

                            if (error != null) {
                                if (error.getClass().equals(java.lang.Exception.class)
                                        && error.getStackTrace()[0].getClassName().equals(reactor.netty.channel.ChannelOperations.class.getName())
                                        && error.getStackTrace()[0].getMethodName().equals("terminate")) {
                                    return true;
                                }

                                if (error.getClass().equals(java.io.IOException.class)
                                        && error.getStackTrace()[0].getClassName().equals("java.base/sun.nio.ch.SocketDispatcher")
                                        && error.getStackTrace()[0].getMethodName().equals("read0")) {
                                    return true;
                                }

                                if (error.getStackTrace()[0].getClassName().startsWith("reactor.core.publisher")) {
                                    return true;
                                }

                                if (error.getClass().equals(discord4j.common.close.CloseException.class)) {
                                    return true;
                                }

                                if (error.getClass().equals(discord4j.rest.http.client.ClientException.class) && error.getMessage().contains("401")
                                        && error.getMessage().contains("Unauthorized")) {
                                    return true;
                                }

                                if (error.getClass().equals(com.mysql.jdbc.exceptions.jdbc4.MySQLQueryInterruptedException.class)) {
                                    return true;
                                }

                                if (error.getClass().equals(com.mysql.jdbc.exceptions.jdbc4.MySQLNonTransientConnectionException.class)) {
                                    return true;
                                }

                                if (error.getMessage().contains("Timeout while waiting for a free database connection")) {
                                    return true;
                                }

                                if (error.getMessage().contains("setAutoCommit")) {
                                    return true;
                                }

                                if (error.getMessage().contains("path to") && error.getMessage().contains("phantombot.db") && error.getMessage().contains("not exist")) {
                                    return true;
                                }

                                if (error.getMessage().contains("attempt to write a readonly database")) {
                                    return true;
                                }

                                if (error.getMessage().contains("Incorrect string value: '\\xF0*")) {
                                    return true;
                                }

                                if (error.getMessage().startsWith("[SQLITE_BUSY]")) {
                                    return true;
                                }

                                if (error.getMessage().startsWith("[SQLITE_CORRUPT]")) {
                                    return true;
                                }

                                if (error.getMessage().startsWith("[SQLITE_READONLY]")) {
                                    return true;
                                }

                                if (error.getMessage().startsWith("[SQLITE_CONSTRAINT]")) {
                                    return true;
                                }

                                if (error.getMessage().startsWith("[SQLITE_CANTOPEN]")) {
                                    return true;
                                }

                                if (error.getMessage().startsWith("[SQLITE_PROTOCOL]")) {
                                    return true;
                                }

                                if (error.getMessage().startsWith("[SQLITE_IOERROR]")) {
                                    return true;
                                }

                                if (error.getMessage().startsWith("opening db")) {
                                    return true;
                                }

                                if (error.getMessage().contains("sql") && error.getMessage().contains("unrecognized token")) {
                                    return true;
                                }

                                if (error.getMessage().contains("sql") && error.getMessage().contains("no such table")) {
                                    return true;
                                }

                                if (error.getClass().equals(java.io.FileNotFoundException.class) || error.getMessage().contains("java.io.FileNotFoundException")) {
                                    return true;
                                }

                                if (error.getClass().equals(java.nio.file.NoSuchFileException.class) || error.getMessage().contains("java.nio.file.NoSuchFileException")) {
                                    return true;
                                }

                                if (error.getClass().equals(java.nio.file.InvalidPathException.class) || error.getMessage().contains("java.nio.file.InvalidPathException")) {
                                    return true;
                                }

                                if (error.getClass().equals(java.nio.file.AccessDeniedException.class) || error.getMessage().contains("java.nio.file.AccessDeniedException")) {
                                    return true;
                                }

                                if (error.getClass().equals(java.net.SocketException.class) && error.getMessage().equals("Operation not permitted")) {
                                    return true;
                                }

                                if (error.getMessage().contains("Connection reset by peer")) {
                                    return true;
                                }

                                if (error.getClass().equals(java.lang.OutOfMemoryError.class)) {
                                    return true;
                                }

                                if (error.getClass().equals(java.net.UnknownHostException.class)) {
                                    return true;
                                }

                                if (error.getClass().equals(java.net.SocketTimeoutException.class)) {
                                    return true;
                                }

                                if (error.getMessage().contains("Connection pool has been disposed")) {
                                    return true;
                                }

                                if (error.getClass().equals(java.net.ConnectException.class) && error.getMessage().contains("Connection refused")) {
                                    return true;
                                }

                                if (error.getClass().equals(javax.net.ssl.SSLHandshakeException.class)) {
                                    return true;
                                }

                                if (error.getClass().equals(java.io.IOException.class) && error.getMessage().contains("Input/output error")) {
                                    return true;
                                }

                                if (error.getClass().equals(java.io.IOException.class) && error.getMessage().contains("Stream closed")) {
                                    return true;
                                }

                                if (error.getMessage().contains("Address already in use")) {
                                    return true;
                                }
                            }

                            com.gmt2001.Console.debug.println("[ROLLBAR-PRE] " + level.name() + (custom != null && (boolean) custom.getOrDefault("isUncaught", false)
                                    ? "[Uncaught]" : "") + (description != null && !description.isBlank() ? " (" + description + ")" : "") + " " + (error != null ? error.toString() : "Null"));

                            return false;
                        }

                        @Override
                        public boolean postProcess(Data data) {
                            if (md != null) {
                                try {
                                    md.reset();

                                    md.update(Optional.ofNullable(data.getCodeVersion()).orElse("").getBytes());
                                    md.update(Optional.ofNullable(data.getEnvironment()).orElse("").getBytes());
                                    md.update(Optional.ofNullable(data.getLevel()).orElse(Level.ERROR).name().getBytes());
                                    md.update(Optional.ofNullable(data.getTitle()).orElse("").getBytes());

                                    BodyContent bc = data.getBody().getContents();

                                    if (bc instanceof TraceChain) {
                                        TraceChain tc = (TraceChain) bc;
                                        tc.getTraces().stream().forEachOrdered(t -> {
                                            md.update(Optional.ofNullable(t.getException().getClassName()).orElse("").getBytes());
                                            md.update(Optional.ofNullable(t.getException().getDescription()).orElse("").getBytes());
                                            md.update(Optional.ofNullable(t.getException().getMessage()).orElse("").getBytes());
                                            int last = -1;
                                            for (int i = 0; i < t.getFrames().size(); i++) {
                                                Frame f = t.getFrames().get(i);
                                                for (String p : APP_PACKAGES) {
                                                    if (f.getClassName() != null && f.getClassName().contains(p)) {
                                                        last = i;
                                                    }
                                                }
                                                for (String p : FINGERPRINT_FILE_REGEX) {
                                                    if (f.getFilename() != null && f.getFilename().matches(p)) {
                                                        last = i;
                                                    }
                                                }
                                            }

                                            if (last >= 0) {
                                                Frame f = t.getFrames().get(last);
                                                md.update(Optional.ofNullable(f.getClassName()).orElse("").getBytes());
                                                md.update(Optional.ofNullable(f.getFilename()).orElse("").getBytes());
                                                md.update(Optional.ofNullable(f.getLineNumber()).orElse(0).toString().getBytes());
                                                md.update(Optional.ofNullable(f.getMethod()).orElse("").getBytes());
                                            }
                                        });
                                    } else if (bc instanceof Trace) {
                                        Trace t = (Trace) bc;
                                        md.update(Optional.ofNullable(t.getException().getClassName()).orElse("").getBytes());
                                        md.update(Optional.ofNullable(t.getException().getDescription()).orElse("").getBytes());
                                        md.update(Optional.ofNullable(t.getException().getMessage()).orElse("").getBytes());
                                        int last = -1;
                                        for (int i = 0; i < t.getFrames().size(); i++) {
                                            Frame f = t.getFrames().get(i);
                                            for (String p : APP_PACKAGES) {
                                                if (f.getClassName() != null && f.getClassName().contains(p)) {
                                                    last = i;
                                                }
                                            }
                                            for (String p : FINGERPRINT_FILE_REGEX) {
                                                if (f.getFilename() != null && f.getFilename().matches(p)) {
                                                    last = i;
                                                }
                                            }
                                        }

                                        if (last >= 0) {
                                            Frame f = t.getFrames().get(last);
                                            md.update(Optional.ofNullable(f.getClassName()).orElse("").getBytes());
                                            md.update(Optional.ofNullable(f.getFilename()).orElse("").getBytes());
                                            md.update(Optional.ofNullable(f.getLineNumber()).orElse(0).toString().getBytes());
                                            md.update(Optional.ofNullable(f.getMethod()).orElse("").getBytes());
                                        }
                                    }

                                    String digest = Hex.encodeHexString(md.digest());

                                    Calendar c = Calendar.getInstance();

                                    com.gmt2001.Console.debug.println("[ROLLBAR-POST] " + digest + " " + (reportsPassedFilters.containsKey(digest) ? "t" : "f") + (reportsPassedFilters.containsKey(digest) && reportsPassedFilters.get(digest).after(c.getTime()) ? "t" : "f"));

                                    if (reportsPassedFilters.containsKey(digest) && reportsPassedFilters.get(digest).after(c.getTime())) {
                                        com.gmt2001.Console.debug.println("[ROLLBAR-POST] filtered");
                                        return true;
                                    } else {
                                        c.add(Calendar.MINUTE, REPEAT_INTERVAL_MINUTES);
                                        reportsPassedFilters.put(digest, c.getTime());
                                    }
                                } catch (Exception e) {
                                    com.gmt2001.Console.debug.printOrLogStackTrace(e);
                                }
                            }

                            com.gmt2001.Console.debug.println("[ROLLBAR-POST] not filtered");

                            return false;
                        }
                    }).appPackages(RollbarProvider.APP_PACKAGES).handleUncaughtErrors(false).build());

            t.scheduleAtFixedRate(new TimerTask() {
                @Override
                public void run() {
                    Date now = Calendar.getInstance().getTime();

                    reportsPassedFilters.forEach((digest, date) -> {
                        if (date.before(now)) {
                            reportsPassedFilters.remove(digest);
                        }
                    });
                }
            }, REPEAT_CHECK_INTERVAL, REPEAT_CHECK_INTERVAL);
        } else {
            this.rollbar = null;
        }

        try {
            md = MessageDigest.getInstance("SHA-1");
        } catch (NoSuchAlgorithmException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public static RollbarProvider instance() {
        return RollbarProvider.INSTANCE;
    }

    public static Map<String, Object> localsToCustom(String[] names, Object[] values) {
        Map<String, Object> custom = new HashMap<>();
        Map<String, Object> locals = new HashMap<>();

        for (int i = 0; i < Math.min(names.length, values.length); i++) {
            locals.put(names[i], values[i]);
        }

        custom.put("__locals", locals);

        return custom;
    }

    public Rollbar getRollbar() {
        return this.rollbar;
    }

    public boolean isEnabled() {
        return this.enabled;
    }

    public void enable() {
        if (RollbarProvider.ENDPOINT.length() > 0 && !RollbarProvider.ENDPOINT.equals("@endpoint@")
                && RollbarProvider.ACCESS_TOKEN.length() > 0 && !RollbarProvider.ACCESS_TOKEN.equals("@access.token@")) {
            this.enabled = true;
            com.gmt2001.Console.out.println();
            com.gmt2001.Console.out.println("Sending exceptions to Rollbar");
            com.gmt2001.Console.out.println("You can disable this by adding the following to a new line in botlogin.txt and restarting: userollbar=false");
            com.gmt2001.Console.out.println("If you got this from the official PhantomBot GitHub, you can submit GDPR delete requests to gdpr@phantombot.hopto.org");
            com.gmt2001.Console.out.println();
        }
    }

    public void critical(Throwable error) {
        this.critical(error, null, null);
    }

    public void critical(Throwable error, String description) {
        this.critical(error, null, description);
    }

    public void critical(Throwable error, Map<String, Object> custom) {
        this.critical(error, custom, null);
    }

    public void critical(String message) {
        this.critical(null, null, message);
    }

    public void critical(String message, Map<String, Object> custom) {
        this.critical(null, custom, message);
    }

    public void critical(Throwable error, Map<String, Object> custom, String description) {
        this.critical(error, custom, description, false);
    }

    public void critical(Throwable error, Map<String, Object> custom, String description, boolean isUncaught) {
        if (this.enabled) {
            if (isUncaught) {
                if (custom == null) {
                    custom = new HashMap<>();
                }

                custom.put("uncaught", true);
            }
            this.rollbar.critical(error, custom, description);
        }
    }

    public void error(Throwable error) {
        this.error(error, null, null);
    }

    public void error(Throwable error, String description) {
        this.error(error, null, description);
    }

    public void error(Throwable error, Map<String, Object> custom) {
        this.error(error, custom, null);
    }

    public void error(String message) {
        this.error(null, null, message);
    }

    public void error(String message, Map<String, Object> custom) {
        this.error(null, custom, message);
    }

    public void error(Throwable error, Map<String, Object> custom, String description) {
        this.error(error, custom, description, false);
    }

    public void error(Throwable error, Map<String, Object> custom, String description, boolean isUncaught) {
        if (this.enabled) {
            if (isUncaught) {
                if (custom == null) {
                    custom = new HashMap<>();
                }

                custom.put("uncaught", true);
            }

            this.rollbar.error(error, custom, description);
        }
    }

    public void warning(Throwable error) {
        this.warning(error, null, null);
    }

    public void warning(Throwable error, String description) {
        this.warning(error, null, description);
    }

    public void warning(Throwable error, Map<String, Object> custom) {
        this.warning(error, custom, null);
    }

    public void warning(String message) {
        this.warning(null, null, message);
    }

    public void warning(String message, Map<String, Object> custom) {
        this.warning(null, custom, message);
    }

    public void warning(Throwable error, Map<String, Object> custom, String description) {
        if (this.enabled) {
            this.rollbar.warning(error, custom, description);
        }
    }

    public void info(Throwable error) {
        this.info(error, null, null);
    }

    public void info(Throwable error, String description) {
        this.info(error, null, description);
    }

    public void info(Throwable error, Map<String, Object> custom) {
        this.info(error, custom, null);
    }

    public void info(String message) {
        this.info(null, null, message);
    }

    public void info(String message, Map<String, Object> custom) {
        this.info(null, custom, message);
    }

    public void info(Throwable error, Map<String, Object> custom, String description) {
        if (this.enabled) {
            this.rollbar.info(error, custom, description);
        }
    }

    public void debug(Throwable error) {
        this.debug(error, null, null);
    }

    public void debug(Throwable error, String description) {
        this.debug(error, null, description);
    }

    public void debug(Throwable error, Map<String, Object> custom) {
        this.debug(error, custom, null);
    }

    public void debug(String message) {
        this.debug(null, null, message);
    }

    public void debug(String message, Map<String, Object> custom) {
        this.debug(null, custom, message);
    }

    public void debug(Throwable error, Map<String, Object> custom, String description) {
        if (this.enabled) {
            this.rollbar.debug(error, custom, description);
        }
    }

    private static String determinePlatform() {
        if (SystemUtils.IS_OS_WINDOWS) {
            return "windows";
        } else if (SystemUtils.IS_OS_LINUX) {
            return "linux";
        } else if (SystemUtils.IS_OS_MAC) {
            return "osx";
        } else if (SystemUtils.IS_OS_FREE_BSD || SystemUtils.IS_OS_NET_BSD || SystemUtils.IS_OS_OPEN_BSD) {
            return "bsd";
        } else if (SystemUtils.IS_OS_UNIX) {
            return "unix";
        }

        return "unknown";
    }

    private static String getId() {
        String id = CaselessProperties.instance().getProperty("rollbarid");

        if (id == null || id.isBlank()) {
            Transaction transaction = CaselessProperties.instance().startTransaction(Transaction.PRIORITY_NORMAL);
            id = RollbarProvider.generateId();
            transaction.setProperty("rollbarid", id);
            transaction.commit();
        }

        return id;
    }

    private static String generateId() {
        return UUID.randomUUID().toString();
    }

    @Override
    public void close() {
        try {
            if (this.rollbar != null) {
                this.rollbar.close(true);
            }
        } catch (Exception ex) {
            ex.printStackTrace(System.err);
        }
    }
}
