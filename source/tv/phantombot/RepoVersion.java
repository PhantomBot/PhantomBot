/*
 * Copyright (C) 2016-2018 phantombot.tv
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
package tv.phantombot;

import java.io.File;
import java.io.IOException;
import java.util.jar.Attributes;
import java.util.jar.JarFile;
import java.util.jar.Manifest;

public class RepoVersion {

    private static final String phantomBotVersion = "3.0.0";
    private static final String repoVersion = "9a8a8a2e";
    private static final String buildType = "stable";
    private static final String panelVersion = "1.0.0";

    private RepoVersion() {
    }

    public static String getPhantomBotVersion() {
        return phantomBotVersion;
    }

    public static String getRepoVersion() {
        return repoVersion;
    }

    public static boolean getNightlyBuild() {
        return buildType.equals("nightly_build");
    }

    public static boolean getPrereleaseBuild() {
        return buildType.equals("prerelease_build");
    }

    public static String getPanelVersion() {
        return panelVersion;
    }
}
