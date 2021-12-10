/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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
package com.gmt2001;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import tv.phantombot.PhantomBot;
import tv.phantombot.RepoVersion;

/**
 *
 * @author gmt2001
 */
public final class PathValidator {

    private static final String[] VALID_PATHS_SHARED = new String[]{
        "./addons",
        "./config/audio-hooks",
        "./config/gif-alerts"
    };
    private static final String[] VALID_PATHS_SCRIPT = new String[]{
        "./logs",
        "./scripts"
    };
    private static final String[] VALID_PATHS_WEB_NOAUTH = new String[]{
        "./web"
    };
    private static final String[] VALID_PATHS_WEB_AUTH = new String[]{
        "./logs"
    };
    private static final String[] VALID_PATHS_LANG = new String[]{
        "./scripts/lang"
    };

    private PathValidator() {
    }

    public static String getDockerPath() {
        try {
            Path p = Paths.get(PhantomBot.GetExecutionPath());
            return p.resolveSibling(p.getFileName().toString().concat("_data")).toAbsolutePath().toRealPath().toString();
        } catch (IOException ex) {
            com.gmt2001.Console.debug.printOrLogStackTrace(ex);
        }

        return ".";
    }

    public static boolean isValidPathShared(String pathToFile) {
        return isValidPathInternal(pathToFile, VALID_PATHS_SHARED);
    }

    public static boolean isValidPathScript(String pathToFile) {
        return isValidPathShared(pathToFile) || isValidPathInternal(pathToFile, VALID_PATHS_SCRIPT);
    }

    public static boolean isValidPathWeb(String pathToFile) {
        return isValidPathShared(pathToFile) || isValidPathInternal(pathToFile, VALID_PATHS_WEB_NOAUTH);
    }

    public static boolean isValidPathWebAuth(String pathToFile) {
        return isValidPathWeb(pathToFile) || isValidPathInternal(pathToFile, VALID_PATHS_WEB_AUTH);
    }

    public static boolean isValidPathLang(String pathToFile) {
        return isValidPathInternal(pathToFile, VALID_PATHS_LANG);
    }

    private static boolean isValidPathInternal(String pathToFile, String[] validPaths) {
        try {
            Path p = Paths.get(pathToFile).toAbsolutePath().toRealPath();
            String executionPath = PhantomBot.GetExecutionPath();

            if (!Files.exists(p) || Files.isHidden(p) || !Files.isReadable(p)) {
                return false;
            }

            for (String vp : validPaths) {
                if (p.startsWith(Paths.get(executionPath, vp)) || (RepoVersion.isDocker() && p.startsWith(Paths.get(getDockerPath(), vp)))) {
                    return true;
                }
            }
        } catch (IOException ex) {
            com.gmt2001.Console.debug.printOrLogStackTrace(ex);
        }

        return false;
    }
}
