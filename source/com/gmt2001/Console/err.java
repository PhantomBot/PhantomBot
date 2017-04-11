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

/**
 *
 * @author Gary Tekulsky
 */
public class err {

    private static final err instance = new err();

    public static err instance() {
        return instance;
    }

    private err() {
    }

    public static void print(Object o) {
        String stackInfo;
        String methodName = Thread.currentThread().getStackTrace()[2].getMethodName();
        String fileName = Thread.currentThread().getStackTrace()[2].getFileName();
        int lineNumber = Thread.currentThread().getStackTrace()[2].getLineNumber();
        stackInfo = "[" +  methodName + "()@" + fileName + ":" + lineNumber + "] ";

        Logger.instance().log(Logger.LogType.Error, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());

        if (PhantomBot.useLanterna) {
            printQueue("[" + logTimestamp.log() + "] [ERROR] " + stackInfo + o);
        } else {
            printConsole("[" + logTimestamp.log() + "] [ERROR] " + stackInfo + o);
        }
    }

    public static void println() {
        if (PhantomBot.useLanterna) {
            printlnQueue("");
        } else {
            printlnConsole("");
        }
    }

    private static void printlnQueue(String s) {
        Console.instance().queueOutput(s);
    }

    private static void printQueue(String s) {
        printlnQueue(s);
    }

    private static void printlnConsole(String s) {
        System.err.println(s);
    }

    private static void printConsole(String s) {
        System.err.print(s);
    }

    public static void printlnRhino(Object o) {
        // Do not write to a log file as the JS Rhino files already do this. //
        if (PhantomBot.useLanterna) {
            printlnQueue("[" + logTimestamp.log() + "] [ERROR] " + o);
        } else {
            printlnConsole("[" + logTimestamp.log() + "] [ERROR] " + o);
        }
    }

    public static void println(Object o) {
        String stackInfo;
        String methodName = Thread.currentThread().getStackTrace()[2].getMethodName();
        String fileName = Thread.currentThread().getStackTrace()[2].getFileName();
        int lineNumber = Thread.currentThread().getStackTrace()[2].getLineNumber();
        stackInfo = "[" +  methodName + "()@" + fileName + ":" + lineNumber + "] ";

        Logger.instance().log(Logger.LogType.Error, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
        Logger.instance().log(Logger.LogType.Error, "");

        if (PhantomBot.useLanterna) {
            printlnQueue("[" + logTimestamp.log() + "] [ERROR] " + stackInfo + o);
        } else {
            printlnConsole("[" + logTimestamp.log() + "] [ERROR] " + stackInfo + o);
        }
    }

    public static void println(Object o, Boolean logOnly) {
        String stackInfo;
        String methodName = Thread.currentThread().getStackTrace()[2].getMethodName();
        String fileName = Thread.currentThread().getStackTrace()[2].getFileName();
        int lineNumber = Thread.currentThread().getStackTrace()[2].getLineNumber();
        stackInfo = "[" +  methodName + "()@" + fileName + ":" + lineNumber + "] ";

        Logger.instance().log(Logger.LogType.Error, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
        Logger.instance().log(Logger.LogType.Error, "");
        if (!logOnly) {
            if (PhantomBot.useLanterna) {
                printlnQueue("[" + logTimestamp.log() + "] [ERROR] " + stackInfo + o);
            } else {
                printlnConsole("[" + logTimestamp.log() + "] [ERROR] " + stackInfo + o);
            }
        }
    }

    public static void printStackTrace(Throwable e) {
        if (PhantomBot.enableDebugging) {
            Writer trace = new StringWriter();
            PrintWriter ptrace = new PrintWriter(trace);

            e.printStackTrace(ptrace);

            if (PhantomBot.useLanterna) {
                printlnQueue(trace.toString());
            } else {
                printlnConsole(trace.toString());
            }
        }
        logStackTrace(e);
    }

    public static void logStackTrace(Throwable e) {
        Writer trace = new StringWriter();
        PrintWriter ptrace = new PrintWriter(trace);

        e.printStackTrace(ptrace);

        Logger.instance().log(Logger.LogType.Error, "[" + logTimestamp.log() + "] " + trace.toString());
        Logger.instance().log(Logger.LogType.Error, "");
    }
}
