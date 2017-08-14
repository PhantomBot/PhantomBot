/*
 * Copyright (C) 2016-2017 phantombot.tv
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

import java.util.concurrent.CopyOnWriteArrayList;
import java.util.List;

import java.io.File;

public class ScriptFileWatcher implements Runnable {
    private static final ScriptFileWatcher instance = new ScriptFileWatcher();
    private final List<Script> scripts = new CopyOnWriteArrayList<>();
    private final Thread thread;
    private boolean isKilled = false;

    /*
     * Method that returns this object.
     *
     * @return {Object}
     */
    public static ScriptFileWatcher instance() {
        return instance;
    }

    /*
     * Class constructor.
     */
    private ScriptFileWatcher() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        this.thread = new Thread(this, "tv.phantombot.script.ScriptFileWatcher::run");
        this.thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.thread.start();
    }

    /*
     * Method to add scripts to the array list.
     *
     * @param {Script} script
     */
    public void addScript(Script script) {
        scripts.add(script);
    }

    /*
     * Method to kill this instance.
     */
    public void kill() {
        this.isKilled = true;
    }

    /*
     * Method that runs on a new thread to reload scripts.
     */
    @SuppressWarnings("SleepWhileInLoop")
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
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }
}
