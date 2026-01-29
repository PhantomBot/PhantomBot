/*
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

import java.io.File;
import java.io.IOException;
import java.nio.file.ClosedWatchServiceException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardWatchEventKinds;
import java.nio.file.WatchEvent;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import com.gmt2001.util.concurrent.ExecutorService;

public class ScriptFileWatcher {

    private static final long INTERVAL_SECONDS = 5;
    private static ScriptFileWatcher instance;
    private final Map<String, Script> scripts = new ConcurrentHashMap<>();
    private final Map<Path, WatchKey> paths = new ConcurrentHashMap<>();
    private final ScheduledFuture<?> update;
    private final WatchService watchService;

    /**
     * Method that returns this object.
     *
     * @return
     * @throws IOException 
     */
    public static synchronized ScriptFileWatcher instance() throws IOException {
        if (instance == null) {
            instance = new ScriptFileWatcher();
        }
        return instance;
    }

    /**
     * Class constructor.
     * @throws IOException 
     */
    private ScriptFileWatcher() throws IOException {
        this.watchService = Paths.get(".").getFileSystem().newWatchService();
        this.update = ExecutorService.scheduleAtFixedRate(() -> {
            this.run();
        }, INTERVAL_SECONDS, INTERVAL_SECONDS, TimeUnit.SECONDS);
    }

    /**
     * Method to add scripts to the array list.
     *
     * @param script - Script to be reloaded.
     */
    public synchronized void addScript(Script script) {
        Path scriptPath = Paths.get(script.getPath()).toAbsolutePath();
        scripts.put(scriptPath.toString().replace('\\', '/'), script);
        Path path = scriptPath.getParent();
        if (!paths.containsKey(path)) {
            try {
                WatchKey key = path.register(watchService, StandardWatchEventKinds.ENTRY_MODIFY);
                paths.put(path, key);
            } catch (IOException | ClosedWatchServiceException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    /**
     * Method to kill this instance.
     */
    public void kill() {
        try {
            this.watchService.close();
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        this.update.cancel(false);
    }

    /**
     * Method that runs on a new thread to reload scripts.
     */
    private void run() {
        boolean isValid = true;
        try {
            while (isValid) {
                WatchKey key = this.watchService.poll();
                
                if (key != null) {
                    for (final WatchEvent<?> event: key.pollEvents()) {
                        if (event.kind() == StandardWatchEventKinds.ENTRY_MODIFY) {
                            @SuppressWarnings("unchecked")
                            WatchEvent<Path> watchEvent = (WatchEvent<Path>)event;
                            Path fileName = watchEvent.context();
                            Optional<Entry<Path, WatchKey>> pathEntry = paths.entrySet().stream().filter(e -> e.getValue().equals(key)).findFirst();

                            if (pathEntry.isPresent()) {
                                try {
                                    Path basePath = pathEntry.get().getKey();
                                    String scriptPath = basePath.resolve(fileName).toString().replace('\\', '/');
                                    if (scripts.containsKey(scriptPath)) {
                                        Script script = scripts.get(scriptPath);
                                        if (script.isKilled()) {
                                            scripts.remove(scriptPath);
                                        } else {
                                            File file = script.getFile();
                                            if (file.lastModified() != script.getLastModified()) {
                                                script.setLastModified(file.lastModified());
                                                script.reload();
                                            }
                                        }
                                    }
                                } catch (Exception ex) {
                                    com.gmt2001.Console.err.printStackTrace(ex);
                                }
                            }
                        }
                    }

                    key.reset();
                } else {
                    isValid = false;
                }
            }
        } catch (ClosedWatchServiceException ex) {}
    }
}
