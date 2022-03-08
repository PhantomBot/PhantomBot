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

/**
 * fileSystem.js
 *
 * Export general file management to th $ API
 */
(function () {
    /**
     * @function readFile
     * @export $
     * @param {string} path
     * @returns {Array}
     */
    function readFile(path) {
        var lines = [];

        if (!fileExists(path)) {
            return lines;
        }

        if (invalidLocation(path)) {
            $.consoleLn('Blocked readFile() target outside of validPaths:' + path);
            return lines;
        }

        try {
            var jlines = Packages.com.gmt2001.JSFileSystem.ReadFileAsLines($.javaString(path));
            for (var i = 0; i < jlines.size(); ++i) {
                lines.push($.jsString(jlines.get(i)));
            }
        } catch (e) {
            $.log.error('Failed to open \'' + path + '\': ' + e);
        }
        return lines;
    }

    /**
     * @function mkDir
     * @export $
     * @param {string} path
     * @returns {boolean}
     */
    function mkDir(path) {
        if (invalidLocation(path)) {
            $.consoleLn('Blocked mkDir() target outside of validPaths:' + path);
            return false;
        }

        return Packages.com.gmt2001.JSFileSystem.MakeDir($.javaString(path));
    }

    /**
     * @function moveFile
     * @export $
     * @param {string} file
     * @param {string} path
     */
    function moveFile(file, path) {
        if (invalidLocation(file) || invalidLocation(path)) {
            $.consoleLn('Blocked moveFile() source or target outside of validPaths:' + file + ' to ' + path);
            return;
        }

        try {
            Packages.com.gmt2001.JSFileSystem.MoveFileToDirectory($.javaString(file), $.javaString(path));
        } catch (ex) {
            $.log.error("moveFile(" + file + ", " + path + ") failed: " + ex);
        }
    }

    /**
     * @function saveArray
     * @export $
     * @param {Array} array
     * @param {string} path
     * @param {boolean} append
     */
    function saveArray(array, path, append) {
        if (invalidLocation(path)) {
            $.consoleLn('Blocked saveArray() target outside of validPaths:' + path);
            return;
        }

        try {
            var lines = new Packages.com.gmt2001.JSFileSystem.CreateStringList();
            for (var i = 0; i < array.length; ++i) {
                lines.add($.javaString(array[i]));
            }
            Packages.com.gmt2001.JSFileSystem.WriteLinesToFile($.javaString(path), lines, append);
        } catch (e) {
            $.log.error('Failed to write to \'' + path + '\': ' + e);
        }
    }

    /**
     * @function writeToFile
     * @export $
     * @param {string} line
     * @param {string} path
     * @param {boolean} append
     */
    function writeToFile(line, path, append) {
        if (invalidLocation(path)) {
            $.consoleLn('Blocked writeToFile() target outside of validPaths:' + path);
            return;
        }

        try {
            Packages.com.gmt2001.JSFileSystem.WriteLineToFile($.javaString(path), $.javaString(line), append);
        } catch (e) {
            $.log.error('Failed to write to \'' + path + '\': ' + e);
        }
    }

    /**
     * @function touchFile
     * @export $
     * @param {string} path
     */
    function touchFile(path) {
        if (invalidLocation(path)) {
            $.consoleLn('Blocked touchFile() target outside of validPaths:' + path);
            return;
        }

        try {
            Packages.com.gmt2001.JSFileSystem.TouchFile($.javaString(path));
        } catch (e) {
            $.log.error('Failed to touch \'' + path + '\': ' + e);
        }
    }

    /**
     * @function deleteFile
     * @export $
     * @param {string} path
     * @param {boolean} now
     */
    function deleteFile(path, now) {
        if (invalidLocation(path)) {
            $.consoleLn('Blocked deleteFile() target outside of validPaths:' + path);
            return;
        }

        try {
            Packages.com.gmt2001.JSFileSystem.DeleteFile($.javaString(path));
        } catch (e) {
            $.log.error('Failed to delete \'' + path + '\': ' + e);
        }
    }

    /**
     * @function fileExists
     * @export $
     * @param {string} path
     * @returns {boolean}
     */
    function fileExists(path) {
        if (invalidLocation(path)) {
            $.consoleLn('Blocked fileExists() target outside of validPaths:' + path);
            return false;
        }

        return Packages.com.gmt2001.JSFileSystem.FileExists($.javaString(path));
    }

    /**
     * @function findFiles
     * @export $
     * @param {string} directory
     * @param {string} pattern
     * @returns {Array}
     */
    function findFiles(directory, pattern) {
        if (invalidLocation(directory)) {
            $.consoleLn('Blocked findFiles() target outside of validPaths:' + directory);
            return [];
        }

        try {
            var ret = [];
            var files = Packages.com.gmt2001.JSFileSystem.FindFilesInDirectory($.javaString(directory), $.javaString(pattern));
            for (var i = 0; i < files.size(); i++) {
                ret.push($.jsString(files.get(i)));
            }
            return ret;
        } catch (e) {
            $.log.error('Failed to search in \'' + directory + '\': ' + e);
        }
        return [];
    }

    /**
     * @function isDirectory
     * @export $
     * @param {string} path
     * @returns {boolean}
     */
    function isDirectory(path) {
        if (invalidLocation(path)) {
            $.consoleLn('Blocked isDirectory() target outside of validPaths:' + path);
            return false;
        }

        return Packages.com.gmt2001.JSFileSystem.IsDirectory($.javaString(path));
    }

    /**
     * @function findSize
     * @export $
     * @param {string} file
     * @returns {Number}
     */
    function findSize(file) {
        if (invalidLocation(file)) {
            $.consoleLn('Blocked findSize() target outside of validPaths:' + file);
            return 0;
        }

        return Packages.com.gmt2001.JSFileSystem.GetFileSize($.javaString(file));
    }

    function invalidLocation(path) {
        return !Packages.com.gmt2001.PathValidator.isValidPathScript($.javaString(path));
    }

    /** Export functions to API */
    $.deleteFile = deleteFile;
    $.fileExists = fileExists;
    $.findFiles = findFiles;
    $.findSize = findSize;
    $.isDirectory = isDirectory;
    $.mkDir = mkDir;
    $.moveFile = moveFile;
    $.readFile = readFile;
    $.saveArray = saveArray;
    $.touchFile = touchFile;
    $.writeToFile = writeToFile;
})();
