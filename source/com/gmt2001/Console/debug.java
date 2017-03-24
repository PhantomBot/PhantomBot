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
package com.gmt2001.Console;

import com.gmt2001.Logger;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import me.mast3rplan.phantombot.PhantomBot;

public class debug {

    private static final debug instance = new debug();

    public static debug instance() {
        return instance;
    }

    private debug() {
    }

    private debug(Object o) {
        if (PhantomBot.enableDebugging) {
            String stackInfo;
            String methodName = Thread.currentThread().getStackTrace()[2].getMethodName();
            String fileName = Thread.currentThread().getStackTrace()[2].getFileName();
            int lineNumber = Thread.currentThread().getStackTrace()[2].getLineNumber();

            stackInfo = "[" +  methodName + "()@" + fileName + ":" + lineNumber + "] ";

            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
            Logger.instance().log(Logger.LogType.Debug, "");
            if (!PhantomBot.enableDebuggingLogOnly) {
                System.out.println("[" + logTimestamp.log() + "] [DEBUG] " + stackInfo + o);
            }
        }
    }

    public static void println() {
        if (PhantomBot.enableDebugging) {
            Logger.instance().log(Logger.LogType.Debug, "");
            if (!PhantomBot.enableDebuggingLogOnly) {
                System.out.println();
            }
        }
    }

    public static void printlnRhino(Object o) {
        if (PhantomBot.enableDebugging) {
            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + o.toString());
            Logger.instance().log(Logger.LogType.Debug, "");
            if (!PhantomBot.enableDebuggingLogOnly) {
                System.out.println("[" + logTimestamp.log() + "] [DEBUG] " + o);
            }
        }
    }

    public static void println(Object o) {
        if (PhantomBot.enableDebugging) {
            String stackInfo;
            String methodName = Thread.currentThread().getStackTrace()[2].getMethodName();
            String fileName = Thread.currentThread().getStackTrace()[2].getFileName();
            int lineNumber = Thread.currentThread().getStackTrace()[2].getLineNumber();

            stackInfo = "[" +  methodName + "()@" + fileName + ":" + lineNumber + "] ";
            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
            Logger.instance().log(Logger.LogType.Debug, "");

            if (!PhantomBot.enableDebuggingLogOnly) {
                System.out.println("[" + logTimestamp.log() + "] [DEBUG] " + stackInfo + o);
            }
        }
    }

    public static void println(Object o, Boolean force) {
        if (PhantomBot.enableDebugging || force) {
            String stackInfo;
            String methodName = Thread.currentThread().getStackTrace()[2].getMethodName();
            String fileName = Thread.currentThread().getStackTrace()[2].getFileName();
            int lineNumber = Thread.currentThread().getStackTrace()[2].getLineNumber();

            stackInfo = "[" +  methodName + "()@" + fileName + ":" + lineNumber + "] ";
            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
            Logger.instance().log(Logger.LogType.Debug, "");

            if (!PhantomBot.enableDebuggingLogOnly) {
                System.out.println("[" + logTimestamp.log() + "] [DEBUG] " + stackInfo + o);
            }
        }
    }

    public static void printStackTrace(Throwable e) {
        if (PhantomBot.enableDebugging) {
            if (!PhantomBot.enableDebuggingLogOnly) {
                e.printStackTrace(System.err);
            }
            logStackTrace(e);
        }
    }

    public static void logStackTrace(Throwable e) {
        if (PhantomBot.enableDebugging) {
            Writer trace = new StringWriter();
            PrintWriter ptrace = new PrintWriter(trace);

            e.printStackTrace(ptrace);

            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + trace.toString());
            Logger.instance().log(Logger.LogType.Debug, "");
        }
    }
}
