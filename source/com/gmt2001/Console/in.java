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
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.concurrent.ConcurrentLinkedQueue;
import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.console.ConsoleInputEvent;

/**
 *
 * @author Gary Tekulsky
 */
public class in {

    private static final in instance = new in();
    private static final BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    private static final ConcurrentLinkedQueue<String> inputQueue = new ConcurrentLinkedQueue<>();

    public static in instance() {
        return instance;
    }

    private in() {
    }

    public static String readLine() {
        return queueReadLine();
    }

    public static String consoleReadLine() {
        return System.console().readLine();
    }

    public static String brReadLine() {
        String s = "";

        try {
            s = br.readLine();
        } catch (IOException e) {
            err.logStackTrace(e);
        }

        if (PhantomBot.enableDebugging) {
            Logger.instance().log(Logger.LogType.Input, "[" + logTimestamp.log() + "] " + s);
            Logger.instance().log(Logger.LogType.Input, "");
        }

        return s;
    }

    @SuppressWarnings("SleepWhileInLoop")
    public static String queueReadLine() {
        while (true) {
            try {
                String msg = inputQueue.poll();

                if (msg != null) {
                    return msg;
                }

                Thread.sleep(10);
            } catch (Exception e) {
                com.gmt2001.Console.err.logStackTrace(e);
                return "";
            }
        }
    }

    public static void queueInput(String input) {
        inputQueue.add(input);
    }
}
