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
package com.gmt2001.Console;

import com.gmt2001.Logger;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import tv.phantombot.PhantomBot;

public final class warn {

    private warn() {
    }

    public static void print(Object o) {
        String stackInfo;
        StackTraceElement st = debug.findCaller();

        stackInfo = "[" + st.getMethodName() + "()@" + st.getFileName() + ":" + st.getLineNumber() + "] ";

        Logger.instance().log(Logger.LogType.Warning, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
        System.out.print("[" + logTimestamp.log() + "] [WARN] " + o);
    }

    public static void println() {
        System.out.println();
    }

    public static void printlnRhino(Object o) {
        // Do not write to a log file as the JS Rhino files already do this. //
        System.out.println("[" + logTimestamp.log() + "] [WARN] " + o);
    }

    public static void println(Object o) {
        String stackInfo;
        StackTraceElement st = debug.findCaller();

        stackInfo = "[" + st.getMethodName() + "()@" + st.getFileName() + ":" + st.getLineNumber() + "] ";

        Logger.instance().log(Logger.LogType.Warning, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
        Logger.instance().log(Logger.LogType.Warning, "");
        System.out.println("[" + logTimestamp.log() + "] [WARN] " + stackInfo + o.toString());
    }

    public static void println(Object o, Boolean logOnly) {
        String stackInfo;
        StackTraceElement st = debug.findCaller();

        stackInfo = "[" + st.getMethodName() + "()@" + st.getFileName() + ":" + st.getLineNumber() + "] ";

        Logger.instance().log(Logger.LogType.Warning, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
        Logger.instance().log(Logger.LogType.Warning, "");
        if (!logOnly) {
            System.out.println("[" + logTimestamp.log() + "] [WARN] " + stackInfo + o.toString());
        }
    }

    public static void printStackTrace(Throwable e) {
        if (PhantomBot.getEnableDebugging()) {
            e.printStackTrace(System.err);
        }
        logStackTrace(e);
    }

    public static void logStackTrace(Throwable e) {
        Writer trace = new StringWriter();
        PrintWriter ptrace = new PrintWriter(trace);

        e.printStackTrace(ptrace);

        Logger.instance().log(Logger.LogType.Warning, "[" + logTimestamp.log() + "] " + trace.toString());
        Logger.instance().log(Logger.LogType.Warning, "");
    }
}
