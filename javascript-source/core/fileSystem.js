/**
 * fileSystem.js
 *
 * Export general file management to th $ API
 */
(function() {
    var JFile = java.io.File,
        JFileInputStream = java.io.FileInputStream,
        JFileOutputStream = java.io.FileOutputStream;

    var fileHandles = [];

    /**
     * @function readFile
     * @export $
     * @param {string} path
     * @returns {Array}
     */
    function readFile(path) {
        var lines = [];
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
    };

    /**
     * @function mkDir
     * @export $
     * @param {string} path
     * @returns {boolean}
     */
    function mkDir(path) {
        var dir = new JFile(path);
        return dir.mkdir();
    };

    /**
     * @function moveFile
     * @export $
     * @param {string} file
     * @param {string} path
     */
    function moveFile(file, path) {
        var fileO = new JFile(file),
            pathO = new JFile(path);

        if ((fileO != null && pathO != null) || (file != "" && path != "")) {
            try {
                org.apache.commons.io.FileUtils.moveFileToDirectory(fileO, pathO, true);
            } catch (ex) {
                $.log.error("moveFile(" + file + ", " + path + ") failed: " + ex);
            }
        }
    };

    /**
     * @function saveArray
     * @export $
     * @param {Array} array
     * @param {string} path
     * @param {boolean} append
     */
    function saveArray(array, path, append) {
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
    };

    /**
     * @function closeOpenFiles
     */
    function closeOpenFiles() {
        for (var key in fileHandles) {
            if (fileHandles[key].lastWrite + 36e5 <= $.systemTime()) { 
                fileHandles[key].fos.close();
                delete fileHandles[key];
            }
        }
    };

    /**
     * @function writeToFile
     * @export $
     * @param {string} line
     * @param {string} path
     * @param {boolean} append
     */
    function writeToFile(line, path, append) {
        var fos,
            ps;

        closeOpenFiles();

        if (fileHandles[path] !== undefined && append) {
            fos = fileHandles[path].fos;
            ps = fileHandles[path].ps;
            fileHandles[path].lastWrite = $.systemTime();
        } else {
            fos = new JFileOutputStream(path, append);
            ps = new java.io.PrintStream(fos);
            fileHandles[path] = { 
                fos: fos,
                ps: ps,
                lastWrite: $.systemTime()
            };
        }
    
        try {
            ps.println(line);
            fos.flush();
            ps.close();
        } catch (e) {
            $.log.error('Failed to write to \'' + path + '\': ' + e);
        }
    };

    /**
     * @function touchFile
     * @export $
     * @param {string} path
     */
    function touchFile(path) {
        try {
            var fos = new JFileOutputStream(path, true);
            fos.close();
        } catch (e) {
            $.log.error('Failed to touch \'' + path + '\': ' + e);
        }
    };

    /**
     * @function deleteFile
     * @export $
     * @param {string} path
     * @param {boolean} now
     */
    function deleteFile(path, now) {
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
    };

    /**
     * @function fileExists
     * @export $
     * @param {string} path
     * @returns {boolean}
     */
    function fileExists(path) {
        try {
            var f = new JFile(path);
            return f.exists();
        } catch (e) {
            return false;
        }
    };

    /**
     * @function findFiles
     * @export $
     * @param {string} directory
     * @param {string} pattern
     * @returns {Array}
     */
    function findFiles(directory, pattern) {
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
    };

    /**
     * @function isDirectory
     * @export $
     * @param {string} path
     * @returns {boolean}
     */
    function isDirectory(path) {
        try {
            var f = new JFile(path);
            return f.isDirectory();
        } catch (e) {
            return false;
        }
    };

    /**
     * @function findSize
     * @export $
     * @param {string} file
     * @returns {Number}
     */
    function findSize(file) {
        var fileO = new JFile(file);
        return fileO.length();
    };

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
