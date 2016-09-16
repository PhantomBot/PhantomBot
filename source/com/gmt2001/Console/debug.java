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
package com.gmt2001.Console;

import com.gmt2001.Logger;
import java.lang.StackTraceElement;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;
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
            String stackInfo = "";
            String fullClassName = Thread.currentThread().getStackTrace()[2].getClassName();
            String className = fullClassName.substring(fullClassName.lastIndexOf(".") + 1);
            String methodName = Thread.currentThread().getStackTrace()[2].getMethodName();
            String fileName = Thread.currentThread().getStackTrace()[2].getFileName();
            int lineNumber = Thread.currentThread().getStackTrace()[2].getLineNumber();

            stackInfo = "[" +  methodName + "()@" + fileName + ":" + lineNumber + "] ";

            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
            Logger.instance().log(Logger.LogType.Debug, "");
            System.out.println("[" + logTimestamp.log() + "] [DEBUG] " + stackInfo + o);
        }
    }

    public static void println() {
        if (PhantomBot.enableDebugging) {
            System.out.println();
        }
    }

    public static void printlnRhino(Object o) {
        if (PhantomBot.enableDebugging) {
            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + o.toString());
            Logger.instance().log(Logger.LogType.Debug, "");
            System.out.println("[" + logTimestamp.log() + "] [DEBUG] " + o);
        }
    }

    public static void println(Object o) {
        if (PhantomBot.enableDebugging) {
            String stackInfo = "";
            String fullClassName = Thread.currentThread().getStackTrace()[2].getClassName();
            String className = fullClassName.substring(fullClassName.lastIndexOf(".") + 1);
            String methodName = Thread.currentThread().getStackTrace()[2].getMethodName();
            String fileName = Thread.currentThread().getStackTrace()[2].getFileName();
            int lineNumber = Thread.currentThread().getStackTrace()[2].getLineNumber();

            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
            Logger.instance().log(Logger.LogType.Debug, "");

            stackInfo = "[" +  methodName + "()@" + fileName + ":" + lineNumber + "] ";
            System.out.println("[" + logTimestamp.log() + "] [DEBUG] " + stackInfo + o);
        }
    }

    public static void println(Object o, Boolean force) {
        if (PhantomBot.enableDebugging || force) {
            String stackInfo = "";
            String fullClassName = Thread.currentThread().getStackTrace()[2].getClassName();
            String className = fullClassName.substring(fullClassName.lastIndexOf(".") + 1);
            String methodName = Thread.currentThread().getStackTrace()[2].getMethodName();
            String fileName = Thread.currentThread().getStackTrace()[2].getFileName();
            int lineNumber = Thread.currentThread().getStackTrace()[2].getLineNumber();

            Logger.instance().log(Logger.LogType.Debug, "[" + logTimestamp.log() + "] " + stackInfo + o.toString());
            Logger.instance().log(Logger.LogType.Debug, "");

            stackInfo = "[" +  methodName + "()@" + fileName + ":" + lineNumber + "] ";
            System.out.println("[" + logTimestamp.log() + "] [DEBUG] " + stackInfo + o);
        }
    }

    public static void printStackTrace(Throwable e) {
        if (PhantomBot.enableDebugging) {
            e.printStackTrace(System.err);
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
