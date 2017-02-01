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

import me.mast3rplan.phantombot.PhantomBot;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;

public class ScriptManager {
    private static final HashMap<String, Script> scripts = new HashMap<>();

    /**
     * @function loadScript
     * @info Used to load scripts
     *
     * @param {File} scriptFile
     */
    public static void loadScript(File scriptFile) throws IOException {
        if (scripts.containsKey(scriptFile.toPath().toString()) && !scripts.get(scriptFile.toPath().toString()).isKilled()) {
            return;
        }

        Script script = new Script(scriptFile);
        scripts.put(scriptFile.toPath().toString(), script);
        try {
            script.load();
        } catch (Exception ex) {
            if (scriptFile.getPath().endsWith("init.js")) {
                com.gmt2001.Console.err.println("Failed to load module: init.js: " + ex.getMessage());
            } else {
                com.gmt2001.Console.err.println("Failed to load module: " + scriptFile.getPath().replace("./scripts/./", "") + ": " + ex.getMessage());
            }
            if (!PhantomBot.reloadScripts) {
                com.gmt2001.Console.err.println("Terminating PhantomBot due to Bad JavaScript File");
                System.exit(0);
            }
            throw new IOException(ex.getMessage());
        }
    }

    /**
     * @function reloadScript
     * @info Used to force reload scripts.
     *
     * @param {File} scriptFile
     */
    public static void reloadScript(File scriptFile) throws IOException {
        if (!scripts.containsKey(scriptFile.toPath().toString()) || scripts.get(scriptFile.toPath().toString()).isKilled()) {
            return;
        }

        Script script = scripts.get(scriptFile.toPath().toString());
        try {
            script.reload(false);
        } catch (Exception ex) {
            if (scriptFile.getPath().endsWith("init.js")) {
                com.gmt2001.Console.err.println("Failed to reload module: init.js: " + ex.getMessage());
            } else {
                com.gmt2001.Console.err.println("Failed to reload module: " + scriptFile.getPath().replace("./scripts/./", "") + ": " + ex.getMessage());
            }
            if (!PhantomBot.reloadScripts) {
                com.gmt2001.Console.err.println("Terminating PhantomBot due to Bad JavaScript File");
                System.exit(0);
            }
            throw new IOException(ex.getMessage());
        }
    }

    /**
     * @function reloadScriptR
     * @info Used to reload a script.
     *
     * @param {File} scriptFile
     * @return {Script} file
     */
    public static Script reloadScriptR(File scriptFile) throws IOException {
        reloadScript(scriptFile);
        return getScript(scriptFile);
    }

    /**
     * @function loadScriptR
     * @info Used to load scripts
     *
     * @param {File} scriptFile
     * @return {Script} file
     */
    public static Script loadScriptR(File scriptFile) throws IOException {
        loadScript(scriptFile);
        return getScript(scriptFile);
    }

    /**
     * @function getScript
     * @info Used to get scripts
     *
     * @param {File} scriptFile
     * @return {Script} file
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
     * @function getScripts
     * @info Used to all the scripts
     *
     * @return {Script} file
     */
    public static HashMap<String, Script> getScripts() {
        return scripts;
    }
}
