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

import java.util.ArrayList;
import java.util.Iterator;

public class ScriptFileWatcher implements Runnable {

    private final ArrayList<ScriptFile> scripts = new ArrayList<>();
    private static final ScriptFileWatcher instance = new ScriptFileWatcher();
    private boolean started = false;
    private boolean run = true;
    private final Object o = new Object();

    public static ScriptFileWatcher instance() {
        if (!instance.started) {
            new Thread(instance, "me.mast3rplan.phantombot.script.ScriptFileWatcher").start();
        }

        return instance;
    }

    private ScriptFileWatcher() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    public void addScript(Script s) {
        ScriptFile sf = new ScriptFile(s);
        synchronized(o) {
            scripts.add(sf);
        }
    }

    public void stop() {
        this.run = false;
    }

    @Override
    @SuppressWarnings( {
        "SleepWhileInLoop", "UseSpecificCatch"
    })
    public void run() {
        this.started = true;
        
        while (run) {
            try {
                Thread.sleep(10000);

                Iterator<ScriptFile> it = scripts.iterator();
                while (it.hasNext())
                {
                    ScriptFile sf = it.next();

                    if (sf.script.isKilled()) {
                        synchronized(o) {
                            scripts.remove(sf);
                        }
                        continue;
                    }
                    
                    if (sf.script.getFile().lastModified() != sf.lastModified) {
                        synchronized(o) {
                            sf.lastModified = sf.script.getFile().lastModified();
                        }
                        
                        sf.script.reload();
                    }
                }
            } catch (Exception e) {
                com.gmt2001.Console.err.printStackTrace(e);
            }
        }
    }

    private class ScriptFile {
        public Script script;
        public long lastModified;

        public ScriptFile(Script s) {
            this.script = s;
            this.lastModified = s.getFile().lastModified();
        }
    }
}
