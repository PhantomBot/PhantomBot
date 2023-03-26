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
package tv.phantombot;

/**
 * Provides the version of the bot
 *
 * DO NOT EDIT. THIS FILE IS FILLED IN AUTOMATICALLY BY ANT
 */
public final class RepoVersion {

    private static final String phantomBotVersion = "@phantombot.version@";
    private static final String repoVersion = "@repository.version@";
    private static final String buildType = "@buildtype@";
    private static final boolean isDocker = false;

    private RepoVersion() {
    }

    /**
     * The release version
     *
     * @return The release version; {@code custom} for a manual build
     */
    public static String getPhantomBotVersion() {
        return phantomBotVersion;
    }

    /**
     * The git SHA the build was made from
     *
     * @return The git SHA; {@code unknown} if ant is unable to determine this
     */
    public static String getRepoVersion() {
        return repoVersion;
    }

    /**
     * The build type, such as {@code stable}, {@code nightly}, or {@code edge}
     *
     * @return The build type
     */
    public static String getBuildType() {
        return buildType;
    }

    /**
     * The build type, with {@code _docker} appended if this is a Docker build
     *
     * @return The build type
     */
    public static String getBuildTypeWithDocker() {
        return buildType + (isDocker ? "_docker" : "");
    }


    /**
     * Indicates if this is a nightly build
     *
     * @return {@code true} if a nightly build
     */
    public static boolean isNightlyBuild() {
        return buildType.startsWith("nightly");
    }

    /**
     * @deprecated
     */
    @Deprecated(since = "3.8.0.0", forRemoval = true)
    public static boolean isPrereleaseBuild() {
        return buildType.equals("prerelease_build");
    }

    /**
     * Indicates if this is a manual/custom build
     *
     * @return {@code true} if a custom build
     */
    public static boolean isCustomBuild() {
        return phantomBotVersion.startsWith("custom") || buildType.startsWith("custom");
    }

    /**
     * Indicates if this is an edge build
     *
     * @return {@code true} if an edge build
     */
    public static boolean isEdgeBuild() {
        return buildType.startsWith("edge");
    }

    /**
     * Indicates if this is a Docker build
     *
     * @return {@code true} if a Docker build
     */
    public static boolean isDocker() {
        return isDocker;
    }
}
