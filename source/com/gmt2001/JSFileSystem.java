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
package com.gmt2001;

import java.io.IOException;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.FileVisitOption;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.FileTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Stream;

/**
 *
 * @author gmt2001
 */
public final class JSFileSystem {

    private JSFileSystem() {
    }

    public static boolean FileExists(String path) {
        if (!PathValidator.isValidPathScript(path)) {
            return false;
        }

        return Files.exists(Paths.get(path));
    }

    public static List<String> ReadFileAsLines(String path) throws IOException {
        if (!PathValidator.isValidPathScript(path)) {
            return CreateStringList();
        }

        return Files.readAllLines(Paths.get(path));
    }

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

    public static void MoveFileToDirectory(String pathToFile, String pathToTargetDirectory) throws IOException {
        if (!PathValidator.isValidPathScript(pathToFile) || !PathValidator.isValidPathScript(pathToTargetDirectory)) {
            return;
        }

        Files.move(Paths.get(pathToFile), Paths.get(pathToTargetDirectory, Paths.get(pathToFile).getFileName().toString()));
    }

    public static void WriteLinesToFile(String path, List<String> lines, boolean append) throws IOException {
        if (!PathValidator.isValidPathScript(path)) {
            return;
        }

        if (append) {
            Files.write(Paths.get(path), lines, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } else {
            Files.write(Paths.get(path), lines, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        }
    }

    public static void WriteLineToFile(String path, String line, boolean append) throws IOException {
        List<String> lines = CreateStringList();
        lines.add(line);
        WriteLinesToFile(path, lines, append);
    }

    public static void TouchFile(String path) throws IOException {
        if (!PathValidator.isValidPathScript(path)) {
            return;
        }

        try {
            Files.createFile(Paths.get(path));
        } catch (FileAlreadyExistsException ex) {
            Files.setLastModifiedTime(Paths.get(path), FileTime.fromMillis(new Date().getTime()));
        }
    }

    public static void DeleteFile(String path) throws IOException {
        if (!PathValidator.isValidPathScript(path)) {
            return;
        }

        Files.deleteIfExists(Paths.get(path));
    }

    public static boolean IsDirectory(String path) {
        if (!PathValidator.isValidPathScript(path)) {
            return false;
        }

        return Files.isDirectory(Paths.get(path));
    }

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

    public static List<String> CreateStringList() {
        return new ArrayList<>();
    }
}
