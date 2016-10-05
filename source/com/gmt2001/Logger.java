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
package com.gmt2001;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;
import java.util.ArrayList;
import java.lang.ArrayIndexOutOfBoundsException;
import me.mast3rplan.phantombot.PhantomBot;

public class Logger implements Runnable {

    private static final Logger instance = new Logger();
    private boolean isRunning = false;
    private boolean disposed = false;
    private final ArrayList<LogItem> queue;

    private FileOutputStream fosCore = null;
    private FileOutputStream fosError = null;
    private FileOutputStream fosWarning = null;
    private FileOutputStream fosDebug = null;
    private PrintStream psCore = null;
    private PrintStream psError = null;
    private PrintStream psWarning = null;
    private PrintStream psDebug = null;
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
                    this.curLogTimestamp = timestamp;
                }

                try {
                  
                    if (queue.size() > 0) {
                        LogItem i = queue.remove(0);

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
                } catch (FileNotFoundException ex) {
                    ex.printStackTrace(System.err);
                } catch (SecurityException ex) {
                    ex.printStackTrace(System.err);
                } catch (ArrayIndexOutOfBoundsException ex) {
                    /* At shutdown queue.remove(0) throws an exception sometimes, it is expected, do not clutter the console/error logs. */
                } 
            } else {
                try {
                    Thread.sleep(500);
                } catch (InterruptedException ex) {
                    ex.printStackTrace(System.err);
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
        
    }

    public static Logger instance() {
        if (!instance.isRunning) {
            (new Thread(instance)).start();
        }

        return instance;
    }

    private Logger() {
        this.queue = new ArrayList<>();
    }

    public void log(LogType t, String s) {
        try {
            this.queue.add(new LogItem(t, s));
        } catch (ArrayIndexOutOfBoundsException ex) {
            /* At shutdown this throws an exception. */
        }
    }

    public String logTimestamp() {
        SimpleDateFormat datefmt = new SimpleDateFormat("MM-dd-yyyy @ HH:mm:ss.SSS z");
        datefmt.setTimeZone(TimeZone.getTimeZone(PhantomBot.timeZone));
        return datefmt.format(new Date());
    }

}
