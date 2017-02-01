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
package me.mast3rplan.phantombot.script;

import java.io.File;

public class ScriptFileWatcher implements Runnable {

    private final Script script;

    public ScriptFileWatcher(Script script) {
        this.script = script;

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    @Override
    @SuppressWarnings( {
        "SleepWhileInLoop", "UseSpecificCatch"
    })
    public void run() {
        File file = script.getFile();
        long lastUpdate = file.lastModified();
        boolean run = true;
        while (run) {
            try {
                Thread.sleep(100);
                if (file.lastModified() != lastUpdate) {
                    lastUpdate = file.lastModified();
                    script.reload();
                }

                if (script.isKilled()) {
                    run = false;
                }
            } catch (Exception e) {
                com.gmt2001.Console.err.printStackTrace(e);
            }
        }
    }
}
