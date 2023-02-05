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
package com.gmt2001.Console;

import com.gmt2001.RollbarProvider;
import com.illusionaryone.Logger;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.util.HashMap;
import java.util.Map;
import tv.phantombot.PhantomBot;

/**
 *
 * @author gmt2001
 */
public final class err {

    private err() {
    }

    public static void print(Object o) {
        String stackInfo = debug.findCallerInfo();

        Logger.instance().log(Logger.LogType.Error, "[" + logTimestamp.log() + "] " + stackInfo + " " + o.toString());
        System.err.print("[" + logTimestamp.log() + "] [ERROR] " + stackInfo + " " + o);
    }

    public static void println() {
        System.err.println();
    }

    public static void printlnRhino(Object o) {
        // Do not write to a log file as the JS Rhino files already do this. //
        System.out.println("[" + logTimestamp.log() + "] [ERROR] " + o);
    }

    public static void println(Object o) {
        String stackInfo = debug.findCallerInfo();

        Logger.instance().log(Logger.LogType.Error, "[" + logTimestamp.log() + "] " + stackInfo + " " + o.toString());
        Logger.instance().log(Logger.LogType.Error, "");
        System.err.println("[" + logTimestamp.log() + "] [ERROR] " + stackInfo + " " + o);
    }

    public static void println(Object o, boolean logOnly) {
        String stackInfo = debug.findCallerInfo();

        Logger.instance().log(Logger.LogType.Error, "[" + logTimestamp.log() + "] " + stackInfo + " " + o.toString());
        Logger.instance().log(Logger.LogType.Error, "");
        if (!logOnly) {
            System.err.println("[" + logTimestamp.log() + "] [ERROR] " + stackInfo + " " + o);
        }
    }

    public static void printStackTrace(Throwable e) {
        printStackTrace(e, false);
    }

    public static void printStackTrace(Throwable e, boolean isUncaught) {
        printStackTrace(e, null, isUncaught);
    }

    public static void printStackTrace(Throwable e, boolean isUncaught, boolean force) {
        printStackTrace(e, null, "", isUncaught, force);
    }

    public static void printStackTrace(Throwable e, String description) {
        printStackTrace(e, null, description, false);
    }

    public static void printStackTrace(Throwable e, Map<String, Object> custom) {
        printStackTrace(e, custom, false);
    }

    public static void printStackTrace(Throwable e, Map<String, Object> custom, boolean isUncaught) {
        printStackTrace(e, custom, "", isUncaught);
    }

    public static void printStackTrace(Throwable e, Map<String, Object> custom, String description, boolean isUncaught) {
        printStackTrace(e, custom, description, isUncaught, false);
    }

    public static void oops(Object o, Map<String, Object> custom, String description, boolean isUncaught) {
        try {
            throw new RuntimeException(o.toString());
        } catch (RuntimeException e) {
            printStackTrace(e, custom, description, isUncaught);
        }
    }

    public static void printStackTrace(Throwable e, Map<String, Object> custom, String description, boolean isUncaught, boolean force) {
        if (PhantomBot.getEnableDebugging() || force) {
            e.printStackTrace(System.err);
        } else {
            println(e.getClass().getName() + ": " + e.getMessage());
        }

        logStackTrace(e, custom, description, isUncaught);
    }

    public static void logStackTrace(Throwable e) {
        logStackTrace(e, false);
    }

    public static void logStackTrace(Throwable e, boolean isUncaught) {
        logStackTrace(e, null, isUncaught);
    }

    public static void logStackTrace(Throwable e, String description) {
        logStackTrace(e, null, description, false);
    }

    public static void logStackTrace(Throwable e, Map<String, Object> custom) {
        logStackTrace(e, custom, false);
    }

    public static void logStackTrace(Throwable e, Map<String, Object> custom, boolean isUncaught) {
        logStackTrace(e, custom, "", false);
    }

    public static void logStackTrace(Throwable e, Map<String, Object> custom, String description, boolean isUncaught) {
        if (custom == null) {
            custom = new HashMap<>();
        }

        custom.putIfAbsent("__caller", debug.findCallerInfo());

        RollbarProvider.instance().error(e, custom, description, isUncaught);

        Logger.instance().log(Logger.LogType.Error, "[" + logTimestamp.log() + "] " + getStackTrace(e));
        Logger.instance().log(Logger.LogType.Error, "");
    }

    public static String getStackTrace(Throwable e) {
        try ( Writer trace = new StringWriter()) {
            try ( PrintWriter ptrace = new PrintWriter(trace)) {

                e.printStackTrace(ptrace);

                return trace.toString();
            }
        } catch (IOException ex) {
            ex.printStackTrace(System.err);
        }

        return "";
    }
}
