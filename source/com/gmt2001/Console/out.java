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

        System.out.print(o);
    }

    public static void println() {
        System.out.println();
    }

    public static void println(Object o) {
        System.out.println("[" + logTimestamp.log() + "] " + o);
    }
}
