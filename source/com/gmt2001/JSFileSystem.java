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
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.FileVisitOption;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

/**
 * Provides access to File I/O from JS
 * <p>
 * Paths must in one of these base folders, relative to the location of {@code PhantomBot.jar},
 * otherwise the operation fails: {@code ./addons}, {@code ./config/audio-hooks},
 * {@code ./config/gif-alerts}, {@code ./config/clips}, {@code ./config/emotes},
 * {@code ./logs}, or {@code ./scripts}
 * <p>
 * If running in Docker, symlinks to the same paths relative to {@code /opt/PhantomBot_data}
 * are also allowed. No other symlinks are allowed unless they still meet the location restrictions
 * above after being resolved to their real paths
 *
 * @author gmt2001
 */
public final class JSFileSystem {

    private JSFileSystem() {
    }

    /**
     * Indicates if the file or directory exists
     *
     * @param path The path to check, relative to PhantomBot.jar
     * @return {@code true} if the path exists and is in an allowed location
     */
    public static boolean FileExists(String path) {
        if (!PathValidator.isValidPathScript(path)) {
            return false;
        }

        return Files.exists(Paths.get(path));
    }

    /**
     * Reads an entire file into a list of lines
     *
     * @param path The path to the file to read
     * @return A {@link List} of lines; empty list if not an allowed location
     * @throws IOException If an I/O error occurs reading from the file or a malformed or unmappable byte sequence is read
     */
    public static List<String> ReadFileAsLines(String path) throws IOException {
        if (!PathValidator.isValidPathScript(path)) {
            return CreateStringList();
        }

        return Files.readAllLines(Paths.get(path));
    }

    /**
     * Creates a new directory, if it doesn't already exist
     *
     * @param path The path to the directory to create
     * @return {@code true} if the directory was created or already exists and is in an allowed location
     */
    public static boolean MakeDir(String path) {
        if (!PathValidator.isValidPathScript(path)) {
            return false;
        }

        try {
            Files.createDirectories(PathValidator.getRealPath(Paths.get(path)));
        } catch (IOException ex) {
            return false;
        }

        return true;
    }

    /**
     * Moves the specified file to the specified directory. The original file name is kept
     *
     * @param pathToFile The path to the file to move
     * @param pathToTargetDirectory The directory to move the file into, not including the file name
     * @throws IOException If an I/O error occurs
     */
    public static void MoveFileToDirectory(String pathToFile, String pathToTargetDirectory) throws IOException {
        if (!PathValidator.isValidPathScript(pathToFile) || !PathValidator.isValidPathScript(pathToTargetDirectory)) {
            return;
        }

        MakeDir(pathToTargetDirectory);

        Files.move(Paths.get(pathToFile), Paths.get(pathToTargetDirectory, Paths.get(pathToFile).getFileName().toString()));
    }

    /**
     * Moves the specified file to the specified location and/or renames the file
     *
     * @param pathToFile The path to the file to move
     * @param newPathToFile The path to the new location of the file, including the new file name
     * @throws IOException If an I/O error occurs
     */
    public static void MoveFile(String pathToFile, String newPathToFile) throws IOException {
        if (!PathValidator.isValidPathScript(pathToFile) || !PathValidator.isValidPathScript(newPathToFile)) {
            return;
        }

        MakeDir(Paths.get(newPathToFile).getParent().toString());

        Files.move(Paths.get(pathToFile), Paths.get(newPathToFile));
    }

    /**
     * Writes a sequence of lines to a file
     *
     * @param path The path to the file to write to
     * @param lines A {@link List} of lines to write to the file
     * @param append {@code true} to add the lines to the end of the file if it already exists; {@code false} to truncate the file before writing
     * @throws IOException If an I/O error occurs writing to or creating the file, or the text cannot be encoded as {@code UTF-8}
     */
    public static void WriteLinesToFile(String path, List<String> lines, boolean append) throws IOException {
        if (!PathValidator.isValidPathScript(path)) {
            return;
        }

        MakeDir(Paths.get(path).getParent().toString());

        if (append) {
            Files.write(Paths.get(path), lines, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } else {
            Files.write(Paths.get(path), lines, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        }
    }

    /**
     * Writes a single line to a file
     *
     * @param path The path to the file to write to
     * @param line The line to write to the file
     * @param append {@code true} to add the line to the end of the file if it already exists; {@code false} to truncate the file before writing
     * @throws IOException If an I/O error occurs writing to or creating the file, or the text cannot be encoded as {@code UTF-8}
     */
    public static void WriteLineToFile(String path, String line, boolean append) throws IOException {
        List<String> lines = CreateStringList();
        lines.add(line);
        WriteLinesToFile(path, lines, append);
    }

    /**
     * Creates an empty file if it doesn't exist; updates the last modified timestamp of the file if it already exists
     *
     * @param path The path to the file to touch
     * @throws IOException If an I/O error occurs
     */
    public static void TouchFile(String path) throws IOException {
        if (!PathValidator.isValidPathScript(path)) {
            return;
        }

        MakeDir(Paths.get(path).getParent().toString());

        try {
            Files.createFile(Paths.get(path));
        } catch (FileAlreadyExistsException ex) {
            Files.setLastModifiedTime(Paths.get(path), FileTime.fromMillis(Instant.now().getEpochSecond()));
        }
    }

    /**
     * Deletes the specified file
     *
     * @param path The path to the file to delete
     * @throws IOException If an I/O error occurs
     */
    public static void DeleteFile(String path) throws IOException {
        if (!PathValidator.isValidPathScript(path)) {
            return;
        }

        Files.deleteIfExists(Paths.get(path));
    }

    /**
     * Indicates if the specified path points to a directory
     *
     * @param path The path to check
     * @return {@code true} if the path is a directory in an allowed location; {@code false} if the path does not exist,
     * is not a directory, it cannot be determined if it is a directory or not, or is not in an allowed location
     */
    public static boolean IsDirectory(String path) {
        if (!PathValidator.isValidPathScript(path)) {
            return false;
        }

        return Files.isDirectory(Paths.get(path));
    }

    /**
     * Gets the size of a file
     *
     * @param path The path to the file to check
     * @return The size of the file, in bytes; {@code 0} if the file does not exist, an I/O error occurs, or the path
     * is not in an allowed location
     */
    public static int GetFileSize(String path) {
        if (!PathValidator.isValidPathScript(path)) {
            return 0;
        }

        try {
            return (int) Files.size(Paths.get(path));
        } catch (IOException ex) {
            return 0;
        }
    }

    /**
     * Returns a list of files and sub-directories in the specified directory that contain the {@code needle}
     *
     * @param path The path to the directory to search
     * @param needle The substring to match against; {@code ""} (empty string) to return all files and sub-directories
     * @return A {@link List} of files and sub-directories; empty list if {@code path} is not a directory or is not in an allowed location
     * @throws IOException
     */
    public static List<String> FindFilesInDirectory(String path, String needle) throws IOException {
        if (!PathValidator.isValidPathScript(path)) {
            return CreateStringList();
        }

        List<String> files = CreateStringList();

        if (IsDirectory(path)) {
            try ( Stream<Path> fileStream = Files.find(Paths.get(path), 1, (p, a) -> p.getFileName().toString().contains(needle) && !p.getFileName().toString().equals("."), FileVisitOption.FOLLOW_LINKS)) {
                fileStream.forEach(p -> files.add(p.getFileName().toString()));
            }
        }

        return files;
    }

    /**
     * Helper method to create a {@link List} of {@link String}
     *
     * @return A new {@link List}
     */
    public static List<String> CreateStringList() {
        return new ArrayList<>();
    }
}
