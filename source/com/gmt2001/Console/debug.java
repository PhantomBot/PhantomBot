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
package com.gmt2001.Console;

import com.gmt2001.Logger;
import com.gmt2001.RollbarProvider;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.util.Map;
import tv.phantombot.PhantomBot;

public final class debug {

    private debug() {
    }

    static StackTraceElement findCaller() {
        StackTraceElement[] st = Thread.currentThread().getStackTrace();
        for (StackTraceElement st1 : st) {
            if (!st1.getClassName().startsWith("com.gmt2001.Console") && !st1.getMethodName().startsWith("getStackTrace")
                    && !st1.getClassName().startsWith("reactor.")) {
                return st1;
            }
        }

        return st.length >= 4 ? st[3] : st[0];
    }

    public static StackTraceElement findCaller(String myClassName) {
        StackTraceElement[] st = Thread.currentThread().getStackTrace();
        StackTraceElement foundme = null;
        for (StackTraceElement st1 : st) {
            if (st1.getClassName().startsWith(myClassName)) {
                foundme = st1;
            } else if (foundme != null && !st1.getClassName().startsWith("reactor.")) {
                return st1;
            }
        }

        return foundme != null ? foundme : st[0];
    }

    public static void println() {
        if (PhantomBot.getEnableDebugging()) {
            Logger.instance().log(Logger.LogType.Debug, "");
            if (!PhantomBot.getEnableDebuggingLogOnly()) {
                System.out.println();
            }
        }
    }

    public static void printlnRhino(Object o) {
        if (PhantomBot.getEnableDebugging()) {
            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + o.toString());
            Logger.instance().log(Logger.LogType.Debug, "");
            if (!PhantomBot.getEnableDebuggingLogOnly()) {
                System.out.println("[" + logTimestamp.log() + "] [DEBUG] " + o);
            }
        }
    }

    public static void println(Object o) {
        println(o, false);
    }

    public static void println(Object o, boolean force) {
        if (PhantomBot.getEnableDebugging() || force) {
            String stackInfo;
            StackTraceElement st = findCaller();

            stackInfo = "[" + st.getMethodName() + "()@" + st.getFileName() + ":" + st.getLineNumber() + "] ";
            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
            Logger.instance().log(Logger.LogType.Debug, "");

            if (!PhantomBot.getEnableDebuggingLogOnly()) {
                System.out.println("[" + logTimestamp.log() + "] [DEBUG] " + stackInfo + o);
            }
        }
    }

    public static void logln(Object o) {
        logln(o, false);
    }

    public static void logln(Object o, boolean force) {
        if (PhantomBot.getEnableDebugging() || force) {
            String stackInfo;
            StackTraceElement st = findCaller();

            stackInfo = "[" + st.getMethodName() + "()@" + st.getFileName() + ":" + st.getLineNumber() + "] ";
            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
            Logger.instance().log(Logger.LogType.Debug, "");
        }
    }

    public static void printStackTrace(Throwable e) {
        printStackTrace(e, "");
    }

    public static void printStackTrace(Throwable e, String description) {
        printStackTrace(e, null, description);
    }

    public static void printStackTrace(Throwable e, Map<String, Object> custom) {
        printStackTrace(e, custom, "");
    }

    public static void printStackTrace(Throwable e, Map<String, Object> custom, String description) {
        if (PhantomBot.getEnableDebugging()) {
            e.printStackTrace(System.err);
        }

        logStackTrace(e, custom, description);
    }

    /**
     * Prints the stack trace if debug is enabled and not in log only mode
     *
     * Always logs the stack trace, even with debug off
     *
     * @param e A {@link Throwable} to print/log
     */
    public static void printOrLogStackTrace(Throwable e) {
        if (PhantomBot.getEnableDebugging()) {
            if (!PhantomBot.getEnableDebuggingLogOnly()) {
                printStackTrace(e);
            } else {
                logStackTrace(e);
            }
        }
    }

    public static void logStackTrace(Throwable e) {
        logStackTrace(e, "");
    }

    public static void logStackTrace(Throwable e, String description) {
        logStackTrace(e, null, description);
    }

    public static void logStackTrace(Throwable e, Map<String, Object> custom) {
        logStackTrace(e, custom, "");
    }

    public static void logStackTrace(Throwable e, Map<String, Object> custom, String description) {
        if (PhantomBot.getEnableDebugging()) {
            RollbarProvider.instance().debug(e, custom, description);

            try ( Writer trace = new StringWriter()) {
                try ( PrintWriter ptrace = new PrintWriter(trace)) {

                    e.printStackTrace(ptrace);

                    Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + trace.toString());
                    Logger.instance().log(Logger.LogType.Debug, "");
                }
            } catch (IOException ex) {
                err.printStackTrace(ex);
            }
        }
    }
}
