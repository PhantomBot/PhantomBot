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
package com.gmt2001;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import tv.phantombot.CaselessProperties;
import tv.phantombot.RepoVersion;

/**
 *
 * @author gmt2001
 */
public final class PathValidator {

    private static final String[] VALID_PATHS_SHARED = new String[]{
        "./addons",
        "./config/audio-hooks",
        "./config/gif-alerts",
        "./config/clips",
        "./config/emotes"
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

    public static Path getRealPath(String path) {
        return getRealPath(Paths.get(path));
    }

    public static Path getRealPath(Path path) {
        Path originalPath = path.toAbsolutePath().normalize();
        try {
            return originalPath.toRealPath();
        } catch (IOException ex) {
            if (NoSuchFileException.class.isAssignableFrom(ex.getClass())) {
                Path parentPath = originalPath.getParent();

                if (parentPath != null) {
                    Path realPath = getRealPath(parentPath);
                    return realPath.resolve(originalPath.getFileName());
                }
            }
        }

        return path;
    }

    public static String getDockerPath() {
        try {
            Path p = Paths.get(Reflect.GetExecutionPath());
            return p.resolveSibling(p.getFileName().toString().concat("_data")).toAbsolutePath().toRealPath().toString();
        } catch (IOException ex) {
            com.gmt2001.Console.debug.printOrLogStackTrace(ex);
        }

        return ".";
    }

    public static boolean isValidPathShared(String pathToFile) {
        return isValidPathSharedInternal(pathToFile, true);
    }

    private static boolean isValidPathSharedInternal(String pathToFile, boolean dbg) {
        boolean retval = isValidPathInternal(pathToFile, VALID_PATHS_SHARED);

        if (!retval && dbg) {
            com.gmt2001.Console.debug.println("Rejected path [" + pathToFile + "] on validator Shared");
        }

        return retval;
    }

    public static boolean isValidPathScript(String pathToFile) {
        return isValidPathScriptInternal(pathToFile, true);
    }

    private static boolean isValidPathScriptInternal(String pathToFile, boolean dbg) {
        boolean retval = isValidPathSharedInternal(pathToFile, false) || isValidPathInternal(pathToFile, VALID_PATHS_SCRIPT);

        if (!retval && dbg) {
            com.gmt2001.Console.debug.println("Rejected path [" + pathToFile + "] on validator Script");
        }

        return retval;
    }

    public static boolean isValidPathWeb(String pathToFile) {
        return isValidPathWebInternal(pathToFile, true);
    }

    private static boolean isValidPathWebInternal(String pathToFile, boolean dbg) {
        boolean retval = isValidPathSharedInternal(pathToFile, false) || isValidPathInternal(pathToFile, VALID_PATHS_WEB_NOAUTH);

        if (!retval && dbg) {
            com.gmt2001.Console.debug.println("Rejected path [" + pathToFile + "] on validator Web_NoAuth");
        }

        return retval;
    }

    public static boolean isValidPathWebAuth(String pathToFile) {
        return isValidPathWebAuthInternal(pathToFile, true);
    }

    private static boolean isValidPathWebAuthInternal(String pathToFile, boolean dbg) {
        boolean retval = isValidPathWebInternal(pathToFile, false) || isValidPathInternal(pathToFile, VALID_PATHS_WEB_AUTH);

        if (!retval && dbg) {
            com.gmt2001.Console.debug.println("Rejected path [" + pathToFile + "] on validator Web_Auth");
        }

        return retval;
    }

    public static boolean isValidPathLang(String pathToFile) {
        return isValidPathLangInternal(pathToFile, true);
    }

    private static boolean isValidPathLangInternal(String pathToFile, boolean dbg) {
        boolean retval = isValidPathInternal(pathToFile, VALID_PATHS_LANG);

        if (!retval && dbg) {
            com.gmt2001.Console.debug.println("Rejected path [" + pathToFile + "] on validator Lang");
        }

        return retval;
    }

    private static boolean isValidPathInternal(String pathToFile, String[] validPaths) {
        try {
            String executionPath = Reflect.GetExecutionPath();
            Path p = Paths.get(pathToFile).toAbsolutePath();

            /**
             * @botproperty pathvalidatedebug - If `true`, prints debug information for the path validator to the debug log. Default `false`
             * @botpropertycatsort pathvalidatedebug 900 900 Debug
             */
            if (CaselessProperties.instance().getPropertyAsBoolean("pathvalidatedebug", false)) {
                com.gmt2001.Console.debug.println("orig=" + p.toString());
            }

            boolean useReal = true;
            if (!Files.exists(p)) {
                if (CaselessProperties.instance().getPropertyAsBoolean("pathvalidatedebug", false)) {
                    com.gmt2001.Console.debug.println("!exists");
                }

                if (p.compareTo(Paths.get(executionPath).toAbsolutePath()) <= 0) {
                    if (!RepoVersion.isDocker() || p.compareTo(Paths.get(getDockerPath()).toAbsolutePath()) <= 0) {
                        if (CaselessProperties.instance().getPropertyAsBoolean("pathvalidatedebug", false)) {
                            com.gmt2001.Console.debug.println("escaped");
                        }

                        return false;
                    }
                }

                if (!isValidPathInternal(p.getParent().toString(), validPaths)) {
                    if (CaselessProperties.instance().getPropertyAsBoolean("pathvalidatedebug", false)) {
                        com.gmt2001.Console.debug.println("!validparent");
                    }

                    return false;
                }

                useReal = false;
            }

            if (useReal) {
                p = p.toRealPath();
            } else {
                p = p.normalize();
            }

            if (CaselessProperties.instance().getPropertyAsBoolean("pathvalidatedebug", false)) {
                com.gmt2001.Console.debug.println("normalreal=" + p.toString());
                com.gmt2001.Console.debug.println("execution=" + executionPath);
                com.gmt2001.Console.debug.println("testpath=" + Paths.get(executionPath, VALID_PATHS_SHARED[0]).toAbsolutePath().normalize().toString());

                if (RepoVersion.isDocker()) {
                    com.gmt2001.Console.debug.println("docker=" + getDockerPath());
                    com.gmt2001.Console.debug.println("dockertestpath=" + Paths.get(getDockerPath(), VALID_PATHS_SHARED[0]).toAbsolutePath().normalize().toString());
                }
            }

            if (Files.exists(p) && (Files.isHidden(p) || !Files.isReadable(p))) {
                if (CaselessProperties.instance().getPropertyAsBoolean("pathvalidatedebug", false)) {
                    if (Files.isHidden(p)) {
                        com.gmt2001.Console.debug.println("hidden");
                    } else if (!Files.isReadable(p)) {
                        com.gmt2001.Console.debug.println("!readable");
                    }
                }

                return false;
            }

            for (String vp : validPaths) {
                if (p.startsWith(Paths.get(executionPath, vp).toAbsolutePath().normalize())) {
                    return true;
                }

                if (RepoVersion.isDocker() && p.startsWith(Paths.get(getDockerPath(), vp).toAbsolutePath().normalize())) {
                    return true;
                }
            }
        } catch (IOException ex) {
            com.gmt2001.Console.debug.printOrLogStackTrace(ex);
        }

        if (CaselessProperties.instance().getPropertyAsBoolean("pathvalidatedebug", false)) {
            com.gmt2001.Console.debug.println("!valid");
        }

        return false;
    }
}
