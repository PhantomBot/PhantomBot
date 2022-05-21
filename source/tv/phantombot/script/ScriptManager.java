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
import java.util.HashMap;
import java.util.Map;
import tv.phantombot.PhantomBot;

public class ScriptManager {

    private static final Map<String, Script> scripts = new HashMap<>();

    /**
     * @param scriptFile
     * @param fileName
     * @throws java.io.IOException
     */
    public static void loadScript(File scriptFile, String fileName) throws IOException {
        if (scripts.containsKey(scriptFile.toPath().toString()) && !scripts.get(scriptFile.toPath().toString()).isKilled()) {
            return;
        }

        Script script = new Script(scriptFile, fileName);
        scripts.put(scriptFile.toPath().toString(), script);
        try {
            script.load();
        } catch (IOException ex) {
            if (scriptFile.getPath().endsWith("init.js")) {
                com.gmt2001.Console.err.println("Failed to load module: init.js: " + ex.getMessage());
            } else {
                com.gmt2001.Console.err.println("Failed to load module: " + scriptFile.getPath().replace("./scripts/./", "") + ": " + ex.getMessage());
            }
            com.gmt2001.Console.err.printStackTrace(ex);
            if (!PhantomBot.getReloadScripts()) {
                com.gmt2001.Console.err.println("Terminating PhantomBot due to Bad JavaScript File");
                PhantomBot.exitError();
            }
            throw ex;
        }
    }

    /**
     * @param scriptFile
     * @throws java.io.IOException
     */
    public static void reloadScript(File scriptFile) throws IOException {
        if (!scripts.containsKey(scriptFile.toPath().toString()) || scripts.get(scriptFile.toPath().toString()).isKilled()) {
            return;
        }

        Script script = scripts.get(scriptFile.toPath().toString());
        try {
            script.reload(false);
        } catch (IOException ex) {
            if (scriptFile.getPath().endsWith("init.js")) {
                com.gmt2001.Console.err.println("Failed to reload module: init.js: " + ex.getMessage());
            } else {
                com.gmt2001.Console.err.println("Failed to reload module: " + scriptFile.getPath().replace("./scripts/./", "") + ": " + ex.getMessage());
            }
            if (!PhantomBot.getReloadScripts()) {
                com.gmt2001.Console.err.println("Terminating PhantomBot due to Bad JavaScript File");
                PhantomBot.exitError();
            }
            throw new IOException(ex.getMessage());
        }
    }

    /**
     * @param scriptFile
     * @return
     * @throws java.io.IOException
     */
    public static Script reloadScriptR(File scriptFile) throws IOException {
        reloadScript(scriptFile);
        return getScript(scriptFile);
    }

    /**
     * @param scriptFile
     * @param fileName
     * @return
     * @throws java.io.IOException
     */
    public static Script loadScriptR(File scriptFile, String fileName) throws IOException {
        loadScript(scriptFile, fileName);
        return getScript(scriptFile);
    }

    /**
     * @param scriptFile
     * @return file
     * @throws java.io.IOException
     */
    public static Script getScript(File scriptFile) throws IOException {
        if (!scripts.containsKey(scriptFile.toPath().toString())) {
            return null;
        }

        if (scripts.get(scriptFile.toPath().toString()).isKilled()) {
            scripts.remove(scriptFile.toPath().toString());
            return null;
        }

        return scripts.get(scriptFile.toPath().toString());
    }

    /**
     * @return file
     */
    public static Map<String, Script> getScripts() {
        return scripts;
    }
}
