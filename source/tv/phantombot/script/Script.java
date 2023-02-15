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
package tv.phantombot.script;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.StackStyle;
import org.mozilla.javascript.tools.debugger.Main;
import tv.phantombot.PhantomBot;

public class Script {

    public static final NativeObject global = new NativeObject();
    @SuppressWarnings("rawtypes")
    private final List<ScriptDestroyable> destroyables = new ArrayList<>();
    private static final NativeObject vars = new NativeObject();
    private final File file;
    private final String fileName;
    private long lastModified;
    private Context context;
    private boolean killed = false;
    private static ScriptableObject scope;

    @SuppressWarnings({"CallToThreadStartDuringObjectConstruction", "LeakingThisInConstructor"})
    public Script(File file, String fileName) {
        this.file = file;
        this.fileName = fileName;
        this.lastModified = file.lastModified();

        if (PhantomBot.getReloadScripts()) {
            ScriptFileWatcher.instance().addScript(this);
        }
    }

    public static String callMethod(String method, String arg) {
        Object[] obj = new Object[]{arg};

        return ScriptableObject.callMethod(global, method, obj).toString();
    }

    public void reload() throws IOException {
        if (killed) {
            return;
        }

        doDestroyables();
        load();
        if (file.getPath().endsWith("init.js")) {
            com.gmt2001.Console.out.println("Reloaded module: init.js");
        } else {
            String path = file.getPath().replace("\056\134", "").replace("\134", "/").replace("scripts/", "");
            com.gmt2001.Console.out.println("Reloaded module: " + path);
        }
    }

    public void reload(boolean silent) throws IOException {
        if (killed) {
            return;
        }

        doDestroyables();
        load();
        if (silent) {
            if (file.getPath().endsWith("init.js")) {
                com.gmt2001.Console.out.println("Reloaded module: init.js");
            } else {
                String path = file.getPath().replace("\056\134", "").replace("\134", "/").replace("scripts/", "");
                com.gmt2001.Console.out.println("Reloaded module: " + path);
            }
        }
    }

    public void load() {
        if (killed) {
            return;
        }

        if (!file.getName().endsWith(".js")) {
            return;
        }

        /* macOS user reported errors loading ._ files. Could be from text editor. */
        if (file.getName().startsWith("._")) {
            return;
        }

        /* Enable Error() in JS to provide an object with fileName and lineNumber. */
        final ContextFactory ctxFactory = new ContextFactory() {
            @Override
            protected boolean hasFeature(Context cx, int featureIndex) {
                switch (featureIndex) {
                    case Context.FEATURE_LOCATION_INFORMATION_IN_ERROR:
                        return true;
                    default:
                        return super.hasFeature(cx, featureIndex);
                }
            }
        };
        RhinoException.setStackStyle(StackStyle.MOZILLA);

        /* Create Debugger Instance - this opens for only init.js */
        Main debugger = null;
        if (PhantomBot.getEnableRhinoDebugger()) {
            if (file.getName().endsWith("init.js")) {
                debugger = new Main(file.getName());
                debugger.attachTo(ctxFactory);
            }
        }

        context = ctxFactory.enterContext();
        context.setLanguageVersion(Context.VERSION_ES6);

        if (!PhantomBot.getEnableRhinoDebugger()) {
            context.setOptimizationLevel(9);
        }

        scope = context.initStandardObjects(vars, false);//Normal scripting object.
        scope.defineProperty("$", global, 0);// Global functions that can only be accessed and replaced with $.
        scope.defineProperty("$api", ScriptApi.instance(), 0);
        scope.defineProperty("$script", this, 0);

        /* Configure debugger. */
        if (PhantomBot.getEnableRhinoDebugger() && debugger != null) {
            if (file.getName().endsWith("init.js")) {
                debugger.setBreakOnEnter(false);
                debugger.setScope(scope);
                debugger.setSize(640, 480);
                debugger.setVisible(true);
            }
        }

        try {
            context.evaluateString(scope, Files.readString(file.toPath()), file.getName(), 1, null);
        } catch (EvaluatorException | IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex, Collections.singletonMap("file", this.getPath()));
        }
    }

    @SuppressWarnings("rawtypes")
    public List<ScriptDestroyable> destroyables() {
        return destroyables;
    }

    public void doDestroyables() {
        destroyables.forEach((destroyable) -> {
            destroyable.destroy();
        });

        destroyables.clear();
    }

    public File getFile() {
        return file;
    }

    public long getLastModified() {
        return lastModified;
    }

    public void setLastModified(long lastModified) {
        this.lastModified = lastModified;
    }

    public String getPath() {
        return file.toPath().toString();
    }

    public String getRealFileName() {
        return fileName;
    }

    public Context getContext() {
        return context;
    }

    public boolean isKilled() {
        return killed;
    }

    public void kill() {
        if (context == null) {
            return;
        }
        ObservingDebugger od = new ObservingDebugger();
        context.setDebugger(od, 0);
        context.setGeneratingDebug(true);
        context.setOptimizationLevel(-1);
        doDestroyables();
        od.setDisconnected(true);
        killed = true;
    }
}
