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

import java.io.File;
import java.io.IOException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

public class ScriptApi {

    private static final ScriptApi instance = new ScriptApi();
    private static final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(8);

    public static ScriptApi instance() {
        return instance;
    }

    private ScriptApi() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    public void on(Script script, String eventName, ScriptEventHandler handler) {
        script.destroyables().add(new ScriptDestroyable<ScriptEventHandler>(handler) {
            @Override
            public void destroy(ScriptEventHandler handler) {
                ScriptEventManager.instance().unregister(handler);
            }
        });
        ScriptEventManager.instance().register(eventName, handler);
    }

    @SuppressWarnings("rawtypes")
    public ScheduledFuture<?> setTimeout(Script script, Runnable task, int milliseconds) {
        ScheduledFuture future = scheduler.schedule(task, milliseconds, TimeUnit.MILLISECONDS);
        script.destroyables().add(new ScriptDestroyable<ScheduledFuture>(future) {
            @Override
            public void destroy(ScheduledFuture future) {
                future.cancel(false);
            }
        });
        return future;
    }

    @SuppressWarnings("rawtypes")
    public ScheduledFuture<?> setInterval(Script script, Runnable task, int milliseconds) {
        ScheduledFuture future = scheduler.scheduleAtFixedRate(task, milliseconds, milliseconds, TimeUnit.MILLISECONDS);
        script.destroyables().add(new ScriptDestroyable<ScheduledFuture>(future) {
            @Override
            public void destroy(ScheduledFuture future) {
                future.cancel(false);
            }
        });
        return future;
    }

    public boolean clearTimeout(ScheduledFuture<?> future) {
        return future.cancel(false);
    }

    public boolean clearInterval(ScheduledFuture<?> future) {
        return future.cancel(false);
    }

    public void loadScript(Script script, String fileName) throws IOException {
        ScriptManager.loadScript(new File(new File("./scripts/"), fileName));
    }

    public Script loadScriptR(Script script, String fileName) throws IOException {
        return ScriptManager.loadScriptR(new File(new File("./scripts/"), fileName));
    }

    public Script reloadScriptR(Script script, String fileName) throws IOException {
        return ScriptManager.reloadScriptR(new File(new File("./scripts/"), fileName));
    }

    public Script getScript(Script script, String fileName) throws IOException {
        return ScriptManager.getScript(new File(new File("./scripts/"), fileName));
    }

    public void kill() {
        scheduler.shutdownNow();
    }
}
