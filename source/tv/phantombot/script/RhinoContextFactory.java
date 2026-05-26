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

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;

import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;

/**
 * Custom Rhino ContextFactory
 * @author sartharon
 */
public final class RhinoContextFactory extends ContextFactory {

    @Override
    protected Context makeContext() {
        Context cx = super.makeContext();
        setContextOptions(cx);
        return cx;
    }

    @Override
    protected boolean hasFeature(Context cx, int featureIndex) {
        if (featureIndex == Context.FEATURE_LOCATION_INFORMATION_IN_ERROR) {
            return true;
        }
        return super.hasFeature(cx, featureIndex);
    }

    @Override
    public Context enterContext() {
        try {
            return super.enterContext();
        } catch (RuntimeException e) {
            com.gmt2001.Console.err.println("Failed to enter Rhino context. Creating new context: " + e.getMessage());
            com.gmt2001.Console.err.printStackTrace(e);
        }

        return this.makeContext();
    }

    /**
     * Set Phantombot specific context options based on configuration.
     * @param cx Context to configure
     */
    private void setContextOptions(Context cx) {
        if (CaselessProperties.instance().getPropertyAsBoolean("rhinointerpretmode", false)) {
            cx.setInterpretedMode(true);
        }
        if (PhantomBot.getEnableRhinoDebugger()) {
            cx.setGeneratingDebug(true);
        }
    }
}