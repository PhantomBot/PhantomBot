/**
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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

import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.StackStyle;
import org.mozilla.javascript.tools.debugger.Main;

import tv.phantombot.CaselessProperties;

/**
 * Rhino runtime environment configuration and management.
 * @author sartharon
 */
public final class RhinoRuntime {
    private static final RhinoContextFactory FACTORY = new RhinoContextFactory();
    private static final NativeObject GLOBAL = new NativeObject(); // $ api used in scripts
    private static ScriptableObject BASESCOPE;
    private static Main guiDebugger;

    private RhinoRuntime() {}

    /**
     * Get the Rhino ContextFactory instance.
     */
    public static RhinoContextFactory getContextFactory() {
        return FACTORY;
    }

    
    /**
     * Initialize the Rhino runtime environment with optional GUI debugger.
     * @param enableGuiDebugger true to enable the GUI debugger, false otherwise.
     */
	public static void init(boolean enableGuiDebugger) {
        RhinoException.setStackStyle(StackStyle.MOZILLA);

        if (enableGuiDebugger) {
            guiDebugger = new Main("Rhino Debugger");
            guiDebugger.attachTo(FACTORY);
            guiDebugger.setBreakOnEnter(false);
            guiDebugger.setSize(640, 480);
            guiDebugger.setVisible(true);
        }

        /**
         * @botproperty rhinointerpretmode - If `true`, Rhino will be running in interpret mode and won't compile ByteCode on the fly. Interpret mode is slower but can lead to reduced memory usage. Default `false`
         * @botpropertycatsort rhinointerpretmode 10 50 Misc
         * @botpropertyrestart rhinointerpretmode
         */
        if (CaselessProperties.instance().getPropertyAsBoolean("rhinointerpretmode", false)) {
            com.gmt2001.Console.debug.println("Initializing Rhino in interpret mode. Scripts will not be compiled in to ByteCode!");
        } else {
            com.gmt2001.Console.debug.println("Initializing Rhino in JIT mode. Producing compiled ByteCode!");
        }

        BASESCOPE = getContextFactory().enterContext().initStandardObjects(new NativeObject(), false); //Holds globally, scopeless defined things like setInterval() etc.
        BASESCOPE.defineProperty("$", GLOBAL, ScriptableObject.PERMANENT);// Global functions that can only be accessed and replaced with $.
        BASESCOPE.defineProperty("$api", ScriptApi.instance(), ScriptableObject.PERMANENT);

        if (enableGuiDebugger) {
            guiDebugger.setScope(BASESCOPE);
        }
    }


    /**
     * Get the Rhino GUI debugger instance
     * @return
     */
    public static Main getDebugger() {
        return guiDebugger;
    }

    /**
     * Get the shared default Phantombot Rhino runtime script scope
     */
    public static ScriptableObject getBaseScope() {
        return BASESCOPE;
    }


    public static String callGlobalExposedScriptMethod(String method, String arg) {
        Object[] obj = new Object[]{arg};
        return ScriptableObject.callMethod(FACTORY.enterContext(), GLOBAL, method, obj).toString();
    }

    /**
     * Expose a property to all scripts via the {@code $} api. Scripts can later use {@code $.property} and {@code $.property.function()} to access these
     * @param propertyName The name of the property visible to the scripts
     * @param property The property object to be exposed to the scripts
     */
    public static void ExposePropertyToScripts(String propertyName, Object property) {
        GLOBAL.defineProperty(propertyName, property, ScriptableObject.PERMANENT);
    }
}