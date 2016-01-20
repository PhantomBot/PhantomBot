/* 
 * Copyright (C) 2015 www.phantombot.net
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
import java.io.IOException;
import java.util.HashMap;

public class ScriptManager
{

    private static final HashMap<String, Script> scripts = new HashMap<>();

    public static void loadScript(File scriptFile) throws IOException
    {
        if (scripts.containsKey(scriptFile.toPath().toString()) && !scripts.get(scriptFile.toPath().toString()).isKilled())
        {
            return;
        }

        Script script = new Script(scriptFile);
        scripts.put(scriptFile.toPath().toString(), script);
        script.load();
    }

    public static Script loadScriptR(File scriptFile) throws IOException
    {
        loadScript(scriptFile);
        return getScript(scriptFile);
    }

    public static Script getScript(File scriptFile) throws IOException
    {
        if (!scripts.containsKey(scriptFile.toPath().toString()))
        {
            return null;
        }

        if (scripts.get(scriptFile.toPath().toString()).isKilled())
        {
            scripts.remove(scriptFile.toPath().toString());

            return null;
        }

        return scripts.get(scriptFile.toPath().toString());
    }

    public static HashMap<String, Script> getScripts()
    {
        return scripts;
    }
}
