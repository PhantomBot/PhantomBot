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

import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.StackStyle;
import org.mozilla.javascript.tools.debugger.Main;

import tv.phantombot.CaselessProperties;

/**
 * Rhino runtime environment configuration and management.
 * @author sartharon
 */
public final class RhinoRuntime {
    private static final RhinoContextFactory FACTORY = new RhinoContextFactory();
    private static Main guiDebugger;

    private RhinoRuntime() {}

    /**
     * Get the Rhino ContextFactory instance.
     */
    public static RhinoContextFactory factory() {
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
    }


    /**
     * Get the Rhino GUI debugger instance
     * @return
     */
    public static Main debugger() {
        return guiDebugger;
    }
}