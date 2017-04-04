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
import me.mast3rplan.phantombot.PhantomBot;

/**
 *
 * @author Gary Tekulsky
 */
public class out {

    private static final out instance = new out();

    public static out instance() {
        return instance;
    }

    private out() {
    }

    public static void print(Object o) {
        if (PhantomBot.enableDebugging) {
            Logger.instance().log(Logger.LogType.Output, "[" + logTimestamp.log() + "] " + o.toString());
        }

        if (PhantomBot.useLanterna) {
            printQueue("" + o);
        } else {
            printConsole("" + o);
        }
    }

    public static void println() {
        if (PhantomBot.useLanterna) {
            printlnQueue("");
        } else {
            printlnConsole("");
        }
    }

    public static void println(Object o) {
        if (PhantomBot.enableDebugging) {
            Logger.instance().log(Logger.LogType.Output, "[" + logTimestamp.log() + "] " + o.toString());
            Logger.instance().log(Logger.LogType.Output, "");
        }

        if (PhantomBot.useLanterna) {
            printlnQueue("[" + logTimestamp.log() + "] " + o);
        } else {
            printlnConsole("[" + logTimestamp.log() + "] " + o);
        }
    }

    private static void printlnQueue(String s) {
        Console.instance().queueOutput(s);
    }
    
    private static void printQueue(String s) {
        printlnQueue(s);
    }

    private static void printlnConsole(String s) {
        System.out.println(s);
    }

    private static void printConsole(String s) {
        System.out.print(s);
    }
}
