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

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.debug.DebugFrame;
import org.mozilla.javascript.debug.DebuggableScript;
import org.mozilla.javascript.debug.Debugger;

public class ObservingDebugger implements Debugger {

    boolean isDisconnected = false;

    private DebugFrame debugFrame = null;

    public boolean isDisconnected() {
        return isDisconnected;
    }

    public void setDisconnected(boolean isDisconnected) {
        this.isDisconnected = isDisconnected;
        if (debugFrame != null) {
            ((ObservingDebugFrame) debugFrame).setDisconnected(isDisconnected);
        }
    }

    public ObservingDebugger() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    @Override
    public DebugFrame getFrame(Context cx, DebuggableScript fnOrScript) {
        if (debugFrame == null) {
            debugFrame = new ObservingDebugFrame(isDisconnected);
        }
        return debugFrame;
    }

    @Override
    public void handleCompilationDone(Context arg0, DebuggableScript arg1, String arg2) {
    }
}

class ObservingDebugFrame implements DebugFrame {

    boolean isDisconnected = false;

    public boolean isDisconnected() {
        return isDisconnected;
    }

    public void setDisconnected(boolean isDisconnected) {
        this.isDisconnected = isDisconnected;
    }

    ObservingDebugFrame(boolean isDisconnected) {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.isDisconnected = isDisconnected;
    }

    @Override
    public void onEnter(Context cx, Scriptable activation,
            Scriptable thisObj, Object[] args) {
    }

    @Override
    public void onLineChange(Context cx, int lineNumber) {
        if (isDisconnected) {
            throw new RuntimeException("Script Execution terminated");
        }
    }

    @Override
    public void onExceptionThrown(Context cx, Throwable ex) {
    }

    @Override
    public void onExit(Context cx, boolean byThrow,
            Object resultOrException) {
    }

    @Override
    public void onDebuggerStatement(Context arg0) {
    }
}
