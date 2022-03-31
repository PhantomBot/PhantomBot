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

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.Flow;
import java.util.concurrent.SubmissionPublisher;
import net.engio.mbassy.listener.Handler;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.Listener;
import tv.phantombot.event.jvm.PropertiesReloadedEvent;

public final class Logger extends SubmissionPublisher<Logger.LogItem> implements Flow.Processor<Logger.LogItem, Logger.LogItem>, Listener {

    private static final Logger INSTANCE = new Logger();
    private Flow.Subscription subscription;
    private static final SimpleDateFormat logdatefmt = new SimpleDateFormat("MM-dd-yyyy @ HH:mm:ss.SSS z");
    private static final SimpleDateFormat filedatefmt = new SimpleDateFormat("dd-MM-yyyy");
    private static final Map<LogType, String> LOG_PATHS = Map.of(
            LogType.Output, "./logs/core/",
            LogType.Input, "./logs/core/",
            LogType.Error, "./logs/core-error/",
            LogType.Debug, "./logs/core-debug/",
            LogType.Warning, "./logs/core-warnings/",
            LogType.Moderation, "./logs/moderation/"
    );

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
            Files.write(Paths.get(LOG_PATHS.get(item.type), filedatefmt.format(new Date()) + ".txt"), item.lines,
                    StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.APPEND, StandardOpenOption.WRITE);
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        this.subscription.request(1);
    }

    @Override
    public void onError(Throwable throwable) {
        com.gmt2001.Console.err.printStackTrace(throwable);
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
            this.lines = Collections.unmodifiableList(lines.lines().toList());
        }

        private LogItem(LogType type, List<String> lines) {
            this.type = type;
            this.lines = Collections.unmodifiableList(lines);
        }
    }

    public static Logger instance() {
        return INSTANCE;
    }

    private Logger() {
        logdatefmt.setTimeZone(TimeZone.getTimeZone(PhantomBot.getTimeZone()));
        filedatefmt.setTimeZone(TimeZone.getTimeZone(PhantomBot.getTimeZone()));

        LOG_PATHS.forEach((t, p) -> {
            try {
                Files.createDirectories(Paths.get(p));
            } catch (IOException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        });
    }

    @Handler
    public void onPropertiesReloadedEvent(PropertiesReloadedEvent event) {
        logdatefmt.setTimeZone(TimeZone.getTimeZone(PhantomBot.getTimeZone()));
        filedatefmt.setTimeZone(TimeZone.getTimeZone(PhantomBot.getTimeZone()));
    }

    public void log(LogType type, String lines) {
        this.submit(new LogItem(type, lines));
    }

    public void log(LogType type, List<String> lines) {
        this.submit(new LogItem(type, lines));
    }

    public String logTimestamp() {
        return logdatefmt.format(new Date());
    }
}
