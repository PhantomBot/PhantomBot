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
package me.mast3rplan.phantombot.console;

import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.console.ConsoleInputEvent;

public class ConsoleInputListener extends Thread {

    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        while (true) {
            try {
                String msg = com.gmt2001.Console.in.readLine();
                EventBus.instance().post(new ConsoleInputEvent(msg));
                Thread.sleep(10);
            } catch (Exception e) {
                com.gmt2001.Console.err.printStackTrace(e);
            }
        }
    }
}
