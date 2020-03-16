/*
 * Copyright (C) 2016-2019 phantombot.tv
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

public final class debug {

    private debug() {
    }

    private debug(Object o) {
        if (PhantomBot.getEnableDebugging()) {
            String stackInfo;
            String methodName = Thread.currentThread().getStackTrace()[2].getMethodName();
            String fileName = Thread.currentThread().getStackTrace()[2].getFileName();
            int lineNumber = Thread.currentThread().getStackTrace()[2].getLineNumber();

            stackInfo = "[" +  methodName + "()@" + fileName + ":" + lineNumber + "] ";

            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
            Logger.instance().log(Logger.LogType.Debug, "");
            if (!PhantomBot.getEnableDebuggingLogOnly()) {
                System.out.println("[" + logTimestamp.log() + "] [DEBUG] " + stackInfo + o);
            }
        }
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
        if (PhantomBot.getEnableDebugging()) {
            String stackInfo;
            String methodName = Thread.currentThread().getStackTrace()[2].getMethodName();
            String fileName = Thread.currentThread().getStackTrace()[2].getFileName();
            int lineNumber = Thread.currentThread().getStackTrace()[2].getLineNumber();

            stackInfo = "[" +  methodName + "()@" + fileName + ":" + lineNumber + "] ";
            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
            Logger.instance().log(Logger.LogType.Debug, "");

            if (!PhantomBot.getEnableDebuggingLogOnly()) {
                System.out.println("[" + logTimestamp.log() + "] [DEBUG] " + stackInfo + o);
            }
        }
    }

    public static void println(Object o, Boolean force) {
        if (PhantomBot.getEnableDebugging() || force) {
            String stackInfo;
            String methodName = Thread.currentThread().getStackTrace()[2].getMethodName();
            String fileName = Thread.currentThread().getStackTrace()[2].getFileName();
            int lineNumber = Thread.currentThread().getStackTrace()[2].getLineNumber();

            stackInfo = "[" +  methodName + "()@" + fileName + ":" + lineNumber + "] ";
            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
            Logger.instance().log(Logger.LogType.Debug, "");

            if (!PhantomBot.getEnableDebuggingLogOnly()) {
                System.out.println("[" + logTimestamp.log() + "] [DEBUG] " + stackInfo + o);
            }
        }
    }

    public static void printStackTrace(Throwable e) {
        if (PhantomBot.getEnableDebugging()) {
            if (!PhantomBot.getEnableDebuggingLogOnly()) {
                e.printStackTrace(System.err);
            }
            logStackTrace(e);
        }
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
                e.printStackTrace(System.err);
            }
        }

        logStackTrace(e);
    }

    public static void logStackTrace(Throwable e) {
        if (PhantomBot.getEnableDebugging()) {
            Writer trace = new StringWriter();
            PrintWriter ptrace = new PrintWriter(trace);

            e.printStackTrace(ptrace);

            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + trace.toString());
            Logger.instance().log(Logger.LogType.Debug, "");
        }
    }
}
