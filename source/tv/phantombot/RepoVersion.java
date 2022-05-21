/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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

public final class RepoVersion {

    private static final String phantomBotVersion = "@phantombot.version@";
    private static final String repoVersion = "@repository.version@";
    private static final String buildType = "@buildtype@";
    private static final String panelVersion = "@webpanel.version@";
    private static final boolean isDocker = false;

    private RepoVersion() {
    }

    public static String getPhantomBotVersion() {
        return phantomBotVersion;
    }

    public static String getRepoVersion() {
        return repoVersion;
    }

    public static String getBuildType() {
        return buildType;
    }

    public static String getBuildTypeWithDocker() {
        return buildType + (isDocker ? "_docker" : "");
    }

    public static boolean isNightlyBuild() {
        return buildType.equals("nightly_build");
    }

    public static boolean isPrereleaseBuild() {
        return buildType.equals("prerelease_build");
    }

    public static String getPanelVersion() {
        return panelVersion;
    }

    public static boolean isDocker() {
        return isDocker;
    }
}
