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
    private FileOutputStream fosDebug = null;
    private PrintStream psCore = null;
    private PrintStream psError = null;
    private PrintStream psDebug = null;
    private String logTimestamp = "";

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
                if (!timestamp.equals(logTimestamp)) {
                    if (psCore != null) {
                        psCore.close();
                        psCore = null;
                    }
                    if (psError != null) {
                        psError.close();
                        psError = null;
                    }
                    if (psDebug != null) {
                        psDebug.close();
                        psDebug = null;
                    }
                    logTimestamp = logTimestamp();
                }

                try {
                  
                    if (queue.size() > 0) {
                        LogItem i = queue.remove(0);

                        switch (i.t) {
                        case Output:
                            if (psCore == null) {
                                fosCore = new FileOutputStream("./logs/core/" + timestamp + ".txt");
                                psCore = new PrintStream(fosCore);
                            }
                            psCore.println(">>" + i.s);
                            psCore.flush();
                            break;

                        case Input:
                            if (psCore == null) {
                                fosCore = new FileOutputStream("./logs/core/" + timestamp + ".txt");
                                psCore = new PrintStream(fosCore);
                            }
                            psCore.println("<<" + i.s);
                            psCore.flush();
                            break;

                        case Error:
                            if (psError == null) {
                                fosError = new FileOutputStream("./logs/core-error/" + timestamp + ".txt");
                                psError = new PrintStream(fosError);
                            }
                            psError.println(i.s);
                            psError.flush();
                            break;

                        case Debug:
                            if (psDebug == null) {
                                fosDebug = new FileOutputStream("./logs/core-debug/" + timestamp + ".txt");
                                psDebug = new PrintStream(fosDebug);
                            }
                            psDebug.println(i.s);
                            psDebug.flush();
                            break;

                        default:
                            if (psCore == null) {
                                fosCore = new FileOutputStream("./logs/core/" + timestamp + ".txt");
                                psCore = new PrintStream(fosCore);
                            } 
                            psCore.println("??" + i.s);
                            psCore.flush();
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
        Debug
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
        datefmt.setTimeZone(TimeZone.getTimeZone(PhantomBot.instance().log_timezone));
        return datefmt.format(new Date());
    }

}
