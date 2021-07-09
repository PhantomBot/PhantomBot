/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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
import com.rollbar.notifier.Rollbar;
import com.rollbar.notifier.config.ConfigBuilder;
import com.rollbar.notifier.filter.Filter;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.apache.commons.lang3.SystemUtils;
import reactor.util.annotation.Nullable;
import tv.phantombot.PhantomBot;
import tv.phantombot.RepoVersion;

/**
 *
 * @author gmt2001
 */
public class RollbarProvider implements AutoCloseable {

    private static final RollbarProvider INSTANCE = new RollbarProvider();
    private static final String ACCESS_TOKEN = "@access.token@";
    private static final String ENDPOINT = "@endpoint@";
    private static final List<String> APP_PACKAGES = Collections.unmodifiableList(Arrays.asList("tv.phantombot", "com.gmt2001", "com.illusionaryone", "com.scaniatv"));
    private static final List<String> SEND_VALUES = Collections.unmodifiableList(Arrays.asList("allownonascii", "baseport", "channel", "datastore", "debugon", "debuglog",
            "ircdebug", "logtimezone", "msglimit30", "musicenable", "owner", "reactordebug", "reloadscripts", "rhinodebugger", "rollbarid", "twitch_tcp_nodelay",
            "usehttps", "usemessagequeue", "user", "useeventsub", "userollbar", "webenable", "whisperlimit60", "wsdebug"));
    private final Rollbar rollbar;
    private boolean enabled = false;

    private RollbarProvider() {
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
                    return new Server.Builder().metadata(metadata).build();
                })
                .person(() -> {
                    Map<String, Object> metadata = new HashMap<>();
                    String username = "";
                    if (PhantomBot.instance() != null) {
                        metadata.put("user", PhantomBot.instance().getBotName());
                        metadata.put("channel", PhantomBot.instance().getChannelName());
                        username = PhantomBot.instance().getProperties().getProperty("owner", PhantomBot.instance().getBotName());
                    }

                    return new Person.Builder().id(RollbarProvider.getId()).username(username).metadata(metadata).build();
                })
                .custom(() -> {
                    Map<String, Object> metadata = new HashMap<>();
                    if (PhantomBot.instance() != null) {
                        metadata.put("phantombot.datastore", PhantomBot.instance().getDataStoreType());
                        metadata.put("phantombot.debugon", PhantomBot.getEnableDebugging() ? "true" : "false");
                        metadata.put("phantombot.debuglog", PhantomBot.getEnableDebuggingLogOnly() ? "true" : "false");
                        metadata.put("phantombot.rhinodebugger", PhantomBot.getEnableRhinoDebugger() ? "true" : "false");

                        PhantomBot.instance().getProperties().keySet().stream().map(k -> (String) k).forEachOrdered(s -> {
                            if (RollbarProvider.SEND_VALUES.contains(s)) {
                                metadata.put("config." + s, PhantomBot.instance().getProperties().getProperty(s));
                            } else {
                                metadata.put("config." + s, "set");
                            }
                        });
                    } else {
                        metadata.put("phantombot.instance", "null");
                    }

                    return metadata;
                })
                .filter(new Filter() {
                    @Override
                    public boolean preProcess(Level level, @Nullable Throwable error, @Nullable Map<String, Object> custom, @Nullable String description) {
                        if (!level.equals(Level.ERROR) && !level.equals(Level.CRITICAL)) {
                            return true;
                        }

                        if (error != null) {
                            if (error.getClass().getName().startsWith("org.mozilla.javascript")
                                    || (error.getStackTrace().length >= 4
                                    && error.getStackTrace()[3].getClassName().startsWith("org.mozilla.javascript"))) {
                                return true;
                            }

                            if (error.getStackTrace()[0].getClassName().startsWith("reactor.core.publisher")) {
                                return true;
                            }

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
                        }

                        com.gmt2001.Console.debug.println("[ROLLBAR] " + level.name() + (custom != null && (Boolean) custom.getOrDefault("isUncaught", false) ? "[Uncaught]" : "") + (description != null && !description.isBlank() ? " (" + description + ")" : "") + " " + (error != null ? error.toString() : "Null"));

                        return false;
                    }

                    @Override
                    public boolean postProcess(Data data) {
                        return false;
                    }
                }).appPackages(RollbarProvider.APP_PACKAGES).handleUncaughtErrors(false).build());
    }

    public static RollbarProvider instance() {
        return RollbarProvider.INSTANCE;
    }

    public Rollbar getRollbar() {
        return this.rollbar;
    }

    public boolean getEnabled() {
        return this.enabled;
    }

    public void enable() {
        if (RollbarProvider.ENDPOINT.length() > 0 && !RollbarProvider.ENDPOINT.equals("@endpoint@")
                && RollbarProvider.ACCESS_TOKEN.length() > 0 && !RollbarProvider.ACCESS_TOKEN.equals("@access.token@")) {
            this.enabled = true;
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
        if (PhantomBot.instance() != null) {
            return (String) PhantomBot.instance().getProperties().putIfAbsent("rollbarid", PhantomBot.instance().getProperties().getProperty("rollbarid", RollbarProvider::generateId));
        }

        return RollbarProvider.generateId();
    }

    private static String generateId() {
        return UUID.randomUUID().toString();
    }

    @Override
    public void close() throws Exception {
        this.rollbar.close(true);
    }
}
