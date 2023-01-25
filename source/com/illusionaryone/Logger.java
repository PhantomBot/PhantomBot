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
package com.illusionaryone;

import com.gmt2001.PathValidator;
import com.gmt2001.RollbarProvider;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Flow;
import java.util.concurrent.SubmissionPublisher;
import java.util.stream.Collectors;
import net.engio.mbassy.listener.Handler;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.Listener;
import tv.phantombot.event.jvm.PropertiesLoadedEvent;
import tv.phantombot.event.jvm.PropertiesReloadedEvent;

public final class Logger extends SubmissionPublisher<Logger.LogItem> implements Flow.Processor<Logger.LogItem, Logger.LogItem>, Listener {

    private Flow.Subscription subscription = null;
    private static final DateTimeFormatter logdatefmt = DateTimeFormatter.ofPattern("MM-dd-yyyy @ HH:mm:ss.SSS z");
    private static final DateTimeFormatter filedatefmt = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter filedatetimefmt = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss");
    private ZoneId zoneId;
    private static final Map<LogType, String> LOG_PATHS = Map.of(
            LogType.Output, "./logs/core/",
            LogType.Input, "./logs/core/",
            LogType.Error, "./logs/core-error/",
            LogType.Debug, "./logs/core-debug/",
            LogType.Warning, "./logs/core-warnings/",
            LogType.Moderation, "./logs/moderation/"
    );
    private static final Logger INSTANCE = new Logger();
    private static boolean subscribed = false;
    private final boolean pathsCreated;

    public enum LogType {
        Output,
        Input,
        Error,
        Debug,
        Warning,
        Moderation,
    }

    @Override
    public void onSubscribe(Flow.Subscription subscription) {
        this.subscription = subscription;
        this.subscription.request(1);
    }

    @Override
    public void onNext(LogItem item) {
        try {
            Files.write(Paths.get(LOG_PATHS.get(item.type), this.logFileTimestamp() + ".txt"), item.lines,
                    StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.APPEND, StandardOpenOption.WRITE);
        } catch (IOException ex) {
            RollbarProvider.instance().error(ex, Collections.singletonMap("LogItem", item));
            ex.printStackTrace(System.err);
        }
        this.subscription.request(1);
    }

    @Override
    public void onError(Throwable throwable) {
        RollbarProvider.instance().error(throwable, null, "", true);
        throwable.printStackTrace(System.err);
        com.gmt2001.Console.err.println("Logger threw an exception and is being disconnected...");
    }

    @Override
    public void onComplete() {
        this.close();
    }

    public final class LogItem {

        public final LogType type;
        public final List<String> lines;

        private LogItem(LogType type, String lines) {
            this.type = type;
            this.lines = Collections.unmodifiableList(lines.lines().collect(Collectors.toList()));
        }

        private LogItem(LogType type, List<String> lines) {
            this.type = type;
            this.lines = Collections.unmodifiableList(lines);
        }
    }

    public static Logger instance() {
        if (!subscribed) {
            synchronized (LOG_PATHS) {
                try {
                    if (!subscribed) {
                        INSTANCE.subscribe(INSTANCE);
                        EventBus.instance().register(INSTANCE);
                    }
                    subscribed = true;
                } catch (IllegalStateException ex) {
                }
            }
        }

        return INSTANCE;
    }

    @SuppressWarnings("UseSpecificCatch")
    private Logger() {
        super();
        this.zoneId = PhantomBot.getTimeZoneId();

        List<Boolean> success = new ArrayList<>();
        LOG_PATHS.forEach((t, p) -> {
            try {
                Files.createDirectories(PathValidator.getRealPath(Paths.get(p)));
                success.add(Boolean.TRUE);
            } catch (Exception ex) {
                Map<String, Object> locals = RollbarProvider.localsToCustom(new String[]{"LOG_PATHS[]", "absoluteNormalizedReal"}, new Object[]{p, PathValidator.getRealPath(Paths.get(p))});
                RollbarProvider.instance().error(ex, locals);
                ex.printStackTrace(System.err);
                success.add(Boolean.FALSE);
            }
        });

        this.pathsCreated = !success.contains(Boolean.FALSE);
    }

    @Handler
    public void onPropertiesLoadedEvent(PropertiesLoadedEvent event) {
        this.zoneId = PhantomBot.getTimeZoneId();
    }

    public void log(LogType type, String lines) {
        if (!this.pathsCreated) {
            return;
        }

        this.submit(new LogItem(type, lines));
    }

    public void log(LogType type, List<String> lines) {
        if (!this.pathsCreated) {
            return;
        }

        this.submit(new LogItem(type, lines));
    }

    public static DateTimeFormatter getLogTimestampFormatter() {
        return logdatefmt;
    }

    public String logTimestamp() {
        return this.logTimestamp(this.zoneId);
    }

    public String logTimestamp(ZoneId zoneId) {
        return ZonedDateTime.now(zoneId).format(logdatefmt);
    }

    public static DateTimeFormatter getLogFileTimestampFormatter() {
        return filedatefmt;
    }

    public String logFileTimestamp() {
        return this.logFileTimestamp(this.zoneId);
    }

    public String logFileTimestamp(ZoneId zoneId) {
        return LocalDate.now(zoneId).format(filedatefmt);
    }

    public String logFileDTTimestamp() {
        return this.logFileDTTimestamp(this.zoneId);
    }

    public String logFileDTTimestamp(ZoneId zoneId) {
        return LocalDateTime.now(zoneId).format(filedatetimefmt);
    }
}
