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
import java.nio.file.FileVisitOption;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

public final class ScriptApi {

    private static final ScriptApi instance = new ScriptApi();

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

    public List<String> getEventNames() {
        return ScriptEventManager.instance().getEventNames();
    }

    public String formatEventName(String eventName) {
        return ScriptEventManager.instance().formatEventName(eventName);
    }

    public boolean exists(String eventName) {
        return ScriptEventManager.instance().hasEvent(eventName);
    }

    public void loadScript(Script script, String fileName) throws IOException {
        ScriptManager.loadScript(new File(new File("./scripts/"), fileName), fileName);
    }

    public Script loadScriptR(Script script, String fileName) throws IOException {
        return ScriptManager.loadScriptR(new File(new File("./scripts/"), fileName), fileName);
    }

    public Script reloadScriptR(Script script, String fileName) throws IOException {
        return ScriptManager.reloadScriptR(new File(new File("./scripts/"), fileName));
    }

    public Script getScript(Script script, String fileName) throws IOException {
        return ScriptManager.getScript(new File(new File("./scripts/"), fileName));
    }

    public boolean isDirectory(String path) {
        return Files.isDirectory(Paths.get(path));
    }

    public List<String> findFiles(String path, String needle) throws IOException {
        List<String> files = new ArrayList<>();

        if (this.isDirectory(path)) {
            try ( Stream<Path> fileStream = Files.find(Paths.get(path), 1, (p, a) -> p.getFileName().toString().contains(needle) && !p.getFileName().toString().equals("."), FileVisitOption.FOLLOW_LINKS)) {
                fileStream.forEach(p -> files.add(p.getFileName().toString()));
            }
        }

        return files;
    }
}
