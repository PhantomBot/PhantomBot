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

/**
 * fileSystem.js
 *
 * Export general file management to th $ API
 */
(function() {
    var JFile = java.io.File,
        JFileInputStream = java.io.FileInputStream,
        JFileOutputStream = java.io.FileOutputStream,
        fileHandles = [];

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
            var fis = new JFileInputStream(path),
                scan = new java.util.Scanner(fis);
            for (var i = 0; scan.hasNextLine(); ++i) {
                lines[i] = scan.nextLine();
            }
            fis.close();
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
        if (invalidLocation(path)){
            $.consoleLn('Blocked mkDir() target outside of validPaths:' + path);
            return false;
        }

        var dir = new JFile(path);
        return dir.mkdir();
    }

    /**
     * @function moveFile
     * @export $
     * @param {string} file
     * @param {string} path
     */
    function moveFile(file, path) {
        var fileO = new JFile(file),
            pathO = new JFile(path);

        if (invalidLocation(file) || invalidLocation(path)) {
            $.consoleLn('Blocked moveFile() source or target outside of validPaths:' + file + ' to ' + path);
            return;
        }

        if ((fileO != null && pathO != null) || (file != "" && path != "")) {
            try {
                org.apache.commons.io.FileUtils.moveFileToDirectory(fileO, pathO, true);
            } catch (ex) {
                $.log.error("moveFile(" + file + ", " + path + ") failed: " + ex);
            }
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
            var fos = new JFileOutputStream(path, append),
                ps = new java.io.PrintStream(fos),
                l = array.length;
            for (var i = 0; i < l; ++i) {
                ps.println(array[i]);
            }
            fos.close();
        } catch (e) {
            $.log.error('Failed to write to \'' + path + '\': ' + e);
        }
    }

    /**
     * @function closeOpenFiles
     */
    function closeOpenFiles() {
        var dateFormat = new java.text.SimpleDateFormat('MM-dd-yyyy'),
            date = dateFormat.format(new java.util.Date());

        for (var key in fileHandles) {
            if (!fileHandles[key].startDate.equals(date)) {
                fileHandles[key].fos.close();
                delete fileHandles[key];
            }
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
        var dateFormat = new java.text.SimpleDateFormat('MM-dd-yyyy'),
            date = dateFormat.format(new java.util.Date()),
            fos,
            ps;

        if (invalidLocation(path)){
            $.consoleLn('Blocked writeToFile() target outside of validPaths:' + path);
            return;
        }

        closeOpenFiles();

        if (fileHandles[path] !== undefined && append) {
            fos = fileHandles[path].fos;
            ps = fileHandles[path].ps;
        } else {
            fos = new JFileOutputStream(path, append);
            ps = new java.io.PrintStream(fos);
            fileHandles[path] = {
                fos: fos,
                ps: ps,
                startDate: date
            };
        }

        try {
            ps.println(line);
            fos.flush();
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
            var fos = new JFileOutputStream(path, true);
            fos.close();
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
            var f = new JFile(path);
            if (now) {
                f['delete']();
            } else {
                f.deleteOnExit();
            }
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

        try {
            var f = new JFile(path);
            return f.exists();
        } catch (e) {
            return false;
        }
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
            var f = new JFile(directory),
                ret = [];
            if (f.isDirectory()) {
                var files = f.list();
                for (var i = 0; i < files.length; i++) {
                    if (files[i].indexOf(pattern) != -1) {
                        ret.push(files[i]);
                    }
                }
                return ret;
            }
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

        try {
            var f = new JFile(path);
            return f.isDirectory();
        } catch (e) {
            return false;
        }
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

        var fileO = new JFile(file);
        return fileO.length();
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
