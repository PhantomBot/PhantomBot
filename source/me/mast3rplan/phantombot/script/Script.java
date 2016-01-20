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

import com.google.common.collect.Lists;
import java.io.File;
import java.io.IOException;
import java.util.List;
import org.apache.commons.io.FileUtils;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.ScriptableObject;

public class Script
{

    public static final NativeObject global = new NativeObject();
    @SuppressWarnings("rawtypes")
    private final List<ScriptDestroyable> destroyables = Lists.newArrayList();
    private final NativeObject vars = new NativeObject();
    private final ScriptFileWatcher fileWatcher;
    private final File file;
    private Context context;
    private boolean killed = false;

    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    public Script(File file)
    {
        this.fileWatcher = new ScriptFileWatcher(this);
        this.file = file;

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        new Thread(fileWatcher).start();
    }

    @SuppressWarnings("rawtypes")
    public void reload() throws IOException
    {
        if (killed)
        {
            return;
        }

        doDestroyables();
        load();
    }

    public void load() throws IOException
    {
        if (killed)
        {
            return;
        }

        context = Context.enter();
        ScriptableObject scope = context.initStandardObjects(global, false);
        scope.defineProperty("$", global, 0);
        scope.defineProperty("$api", ScriptApi.instance(), 0);
        scope.defineProperty("$script", this, 0);
        scope.defineProperty("$var", vars, 0);

        context.evaluateString(scope, FileUtils.readFileToString(file), file.getName(), 1, null);
    }

    @SuppressWarnings("rawtypes")
    public List<ScriptDestroyable> destroyables()
    {
        return destroyables;
    }

    @SuppressWarnings("rawtypes")
    public void doDestroyables()
    {
        for (ScriptDestroyable destroyable : destroyables)
        {
            destroyable.destroy();
        }

        destroyables.clear();
    }

    public File getFile()
    {
        return file;
    }

    public String getPath()
    {
        return file.toPath().toString();
    }

    public Context getContext()
    {
        return context;
    }

    public boolean isKilled()
    {
        return killed;
    }

    public void kill()
    {
        ObservingDebugger od = new ObservingDebugger();
        context.setDebugger(od, 0);
        context.setGeneratingDebug(true);
        context.setOptimizationLevel(-1);
        doDestroyables();
        od.setDisconnected(true);
        killed = true;
    }
}
