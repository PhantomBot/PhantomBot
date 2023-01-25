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
package tv.phantombot.console;

import tv.phantombot.event.EventBus;
import tv.phantombot.event.console.ConsoleInputEvent;

public class ConsoleInputListener extends Thread {

    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        while (true) {
            try {
                String msg = com.gmt2001.Console.in.readLine();
                EventBus.instance().postAsync(new ConsoleInputEvent(msg));
                Thread.sleep(10);
            } catch (InterruptedException e) {
                com.gmt2001.Console.err.printStackTrace(e);
            }
        }
    }
}
