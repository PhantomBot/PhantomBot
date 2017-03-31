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
package com.gmt2001;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.PrintStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;
import java.util.concurrent.ConcurrentLinkedQueue;
import me.mast3rplan.phantombot.PhantomBot;

public class Logger implements Runnable {

    private static final Logger instance = new Logger();
    private final ConcurrentLinkedQueue<LogItem> queue;
    private boolean isRunning = false;
    private boolean disposed = false;

    private FileOutputStream fosCore = null;
    private FileOutputStream fosError = null;
    private FileOutputStream fosWarning = null;
    private FileOutputStream fosDebug = null;
    private FileOutputStream fosModeration = null;
    private PrintStream psCore = null;
    private PrintStream psError = null;
    private PrintStream psWarning = null;
    private PrintStream psDebug = null;
    private PrintStream psModeration = null;
    private String curLogTimestamp = "";

    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
        this.isRunning = true;

        if (!new File ("./logs/").exists()) {
            new File ("./logs/").mkdirs();
        }
        if (!new File ("./logs/core").exists()) {
            new File ("./logs/core/").mkdirs();
        }
        if (!new File ("./logs/core-error").exists()) {
            new File ("./logs/core-error/").mkdirs();
        }
        if (!new File ("./logs/core-warnings").exists()) {
            new File ("./logs/core-warnings/").mkdirs();
        }
        if (!new File ("./logs/core-debug").exists()) {
            new File ("./logs/core-debug/").mkdirs();
        }
        if (!new File ("./logs/moderation").exists()) {
            new File ("./logs/moderation/").mkdirs();
        }

        while (!disposed) {
            if (!queue.isEmpty()) {

                SimpleDateFormat datefmt = new SimpleDateFormat("dd-MM-yyyy");
                datefmt.setTimeZone(TimeZone.getTimeZone("GMT"));
                String timestamp = datefmt.format(new Date());

                // New date, close all open streams.  Java spec says that closing the PrintStream closes the
                // underlying streams automatically (FileOutputStream).
                if (!timestamp.equals(this.curLogTimestamp)) {
                    if (this.psCore != null) {
                        this.psCore.close();
                        this.psCore = null;
                    }
                    if (psError != null) {
                        this.psError.close();
                        this.psError = null;
                    }
                    if (psWarning != null) {
                        this.psWarning.close();
                        this.psWarning = null;
                    }
                    if (this.psDebug != null) {
                        this.psDebug.close();
                        this.psDebug = null;
                    }
                    if (this.psModeration != null) {
                        this.psModeration.close();
                        this.psModeration = null;
                    }
                    this.curLogTimestamp = timestamp;
                }

                try {
                    if (!queue.isEmpty()) {
                        LogItem i = queue.poll();

                        if (i == null) {
                            return;
                        }

                        switch (i.t) {
                            case Output:
                                if (this.psCore == null) {
                                    this.fosCore = new FileOutputStream("./logs/core/" + timestamp + ".txt", true);
                                    this.psCore = new PrintStream(this.fosCore);
                                }
                                this.psCore.println(i.s);
                                this.psCore.flush();
                                break;
                            case Input:
                                if (this.psCore == null) {
                                    this.fosCore = new FileOutputStream("./logs/core/" + timestamp + ".txt", true);
                                    this.psCore = new PrintStream(this.fosCore);
                                }
                                this.psCore.println(i.s);
                                this.psCore.flush();
                                break;
                            case Error:
                                if (this.psError == null) {
                                    this.fosError = new FileOutputStream("./logs/core-error/" + timestamp + ".txt", true);
                                    this.psError = new PrintStream(this.fosError);
                                }
                                this.psError.println(i.s);
                                this.psError.flush();
                                break;
                            case Debug:
                                if (this.psDebug == null) {
                                    this.fosDebug = new FileOutputStream("./logs/core-debug/" + timestamp + ".txt", true);
                                    this.psDebug = new PrintStream(this.fosDebug);
                                }
                                this.psDebug.println(i.s);
                                this.psDebug.flush();
                                break;
                            case Warning:
                                if (this.psWarning == null) {
                                    this.fosWarning = new FileOutputStream("./logs/core-warnings/" + timestamp + ".txt", true);
                                    this.psWarning = new PrintStream(this.fosWarning);
                                }
                                this.psWarning.println(i.s);
                                this.psWarning.flush();
                                break;
                            case Moderation:
                                if (this.psModeration == null) {
                                    this.fosModeration = new FileOutputStream("./logs/moderation/" + timestamp + ".txt", true);
                                    this.psModeration = new PrintStream(this.fosModeration);
                                }
                                this.psModeration.println(i.s);
                                this.psModeration.flush();
                                break;
                            default:
                                if (this.psCore == null) {
                                    this.fosCore = new FileOutputStream("./logs/core/" + timestamp + ".txt", true);
                                    this.psCore = new PrintStream(this.fosCore);
                                }
                                this.psCore.println(i.s);
                                this.psCore.flush();
                                break;
                        }
                    }
                } catch (FileNotFoundException | SecurityException ex) {
                    ex.printStackTrace(System.err);
                } catch (NullPointerException ex) {
                    com.gmt2001.Console.err.println("Failed to log [NullPointerException]: " + ex.getMessage());
                }
            } else {
                try {
                    Thread.sleep(500);
                } catch (InterruptedException ex) {
                    com.gmt2001.Console.debug.println("Failed to sleep while logging [InterruptedException]: " + ex.getMessage());
                }
            }
        }
    }

    @Override
    protected void finalize() throws Throwable {
        super.finalize();

        this.disposed = true;
    }

    private class LogItem {

        public LogType t;
        public String s;

        public LogItem(LogType t, String s) {
            this.t = t;
            this.s = s;
        }
    }

    public enum LogType {
        Output,
        Input,
        Error,
        Debug,
        Warning,
        Moderation,
    }

    public static Logger instance() {
        if (!instance.isRunning) {
            (new Thread(instance, "com.gmt2001.Logger")).start();
        }
        return instance;
    }

    private Logger() {
        this.queue = new ConcurrentLinkedQueue<>();
    }

    public void log(LogType t, String s) {
        try {
            this.queue.add(new LogItem(t, s));
        } catch (IllegalStateException ex) {
            com.gmt2001.Console.err.println("Failed to add item to the log queue [IllegalStateException]: " + ex.getMessage());
        }
    }

    public String logTimestamp() {
        SimpleDateFormat datefmt = new SimpleDateFormat("MM-dd-yyyy @ HH:mm:ss.SSS z");
        datefmt.setTimeZone(TimeZone.getTimeZone(PhantomBot.timeZone));
        return datefmt.format(new Date());
    }
}
