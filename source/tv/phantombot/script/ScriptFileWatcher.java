/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
package tv.phantombot.script;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class ScriptFileWatcher implements Runnable {
    private static ScriptFileWatcher instance;
    private final List<Script> scripts = new CopyOnWriteArrayList<>();
    private final Thread thread;
    private boolean isKilled = false;

    /**
     * Method that returns this object.
     *
     * @return
     */
    public static synchronized ScriptFileWatcher instance() {
        if (instance == null) {
            instance = new ScriptFileWatcher();
        } 
        return instance;
    }

    /**
     * Class constructor.
     */
    private ScriptFileWatcher() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        this.thread = new Thread(this, "tv.phantombot.script.ScriptFileWatcher::run");
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.thread.start();
    }

    /**
     * Method to add scripts to the array list.
     *
     * @param script - Script to be reloaded.
     */
    public void addScript(Script script) {
        scripts.add(script);
    }

    /**
     * Method to kill this instance.
     */
    public void kill() {
        this.isKilled = true;
    }

    /**
     * Method that runs on a new thread to reload scripts.
     */
    @SuppressWarnings("SleepWhileInLoop")
    @Override
    public void run() {
        while (!isKilled) {
            try {
                for (int i = 0; i < scripts.size(); i++) {
                    Script script = scripts.get(i);
                    File file = script.getFile();

                    if (script.isKilled()) {
                        scripts.remove(i);
                    } else {
                        if (file.lastModified() != script.getLastModified()) {
                            script.setLastModified(file.lastModified());
                            script.reload();
                        }
                    }
                    // Sleep a bit here to not grind the user's CPU.
                    Thread.sleep(1);
                }
                Thread.sleep(100);
            } catch (IOException | InterruptedException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }
}
