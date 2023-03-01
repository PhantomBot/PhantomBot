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
package com.gmt2001.datastore;

import biz.source_code.miniConnectionPoolManager.MiniConnectionPoolManager;
import com.gmt2001.ExecutorService;
import com.gmt2001.PathValidator;
import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import org.apache.commons.io.FileUtils;
import org.sqlite.SQLiteConfig;
import org.sqlite.SQLiteDataSource;
import org.sqlite.SQLiteErrorCode;
import org.sqlite.SQLiteException;
import org.sqlite.javax.SQLiteConnectionPoolDataSource;

/**
 *
 * @author gmt2001
 */
public final class SqliteStore extends DataStore {

    private static final int MAX_CONNECTIONS = 30;
    private static final long MAXWALSIZE = 104857600L;
    private static SqliteStore instance;
    private final String dbFile;
    private final MiniConnectionPoolManager poolMgr;
    private final ReentrantReadWriteLock rwl = new ReentrantReadWriteLock();
    private Instant nextVacuum = Instant.now().plus(1, ChronoUnit.DAYS);

    public static SqliteStore instance() {
        return instance("");
    }

    public static synchronized SqliteStore instance(String configStr) {
        if (instance == null) {
            instance = new SqliteStore(configStr);
        }

        return instance;
    }

    public static boolean isAvailable(String configStr) {
        try {
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException ex) {
            com.gmt2001.Console.debug.printStackTrace(ex);
            return false;
        }

        SQLiteDataSource dataSource = new SQLiteDataSource();
        dataSource.setUrl("jdbc:sqlite::memory:");
        try ( Connection connection = dataSource.getConnection()) {
            try ( Statement statement = connection.createStatement()) {
                statement.execute("SELECT 1;");
            }
        } catch (UnsatisfiedLinkError | SQLException ex) {
            com.gmt2001.Console.debug.printStackTrace(ex);
            if (ex.getClass() == UnsatisfiedLinkError.class
                || (ex.getCause() != null && ex.getCause().getMessage() != null && ex.getCause().getMessage().contains("No native library found"))) {
                if (hasDatabase(configStr)) {
                    com.gmt2001.Console.warn.println();
                    com.gmt2001.Console.warn.println("SQLite database exists but unable to load SQLite library");
                    com.gmt2001.Console.warn.println();
                }
                return false;
            }
        }

        return true;
    }

    private SqliteStore(String configStr) {
        super(configStr);

        try {
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        Object o[] = LoadConfigReal(configStr);

        SQLiteConfig config = new SQLiteConfig();
        config.setCacheSize((int) o[1]);
        config.setSynchronous((boolean) o[2] ? SQLiteConfig.SynchronousMode.FULL : SQLiteConfig.SynchronousMode.NORMAL);
        config.setTempStore(SQLiteConfig.TempStore.MEMORY);
        config.setJournalMode((boolean) o[3] ? SQLiteConfig.JournalMode.WAL : SQLiteConfig.JournalMode.OFF);
        config.setBusyTimeout(10000);

        this.dbFile = ((String) o[0]).replaceAll("\\\\", "/");

        SQLiteConnectionPoolDataSource dataSource = new SQLiteConnectionPoolDataSource(config);
        dataSource.setUrl("jdbc:sqlite:" + this.dbFile);
        this.poolMgr = new MiniConnectionPoolManager(dataSource, MAX_CONNECTIONS);

        try ( Connection connection = this.poolMgr.getConnection()) {
            boolean hasAutoVacuum = false;
            try ( PreparedStatement statement = connection.prepareStatement("PRAGMA auto_vacuum;")) {
                try ( ResultSet rs = statement.executeQuery()) {
                    if (rs.next()) {
                        if (rs.getInt("auto_vacuum") == 2) {
                            hasAutoVacuum = true;
                        }
                    }
                }
            }

            try {
                this.rwl.writeLock().lock();
                if (!hasAutoVacuum) {
                    com.gmt2001.Console.debug.println("Enabling auto_vacuum");
                    try ( PreparedStatement pragmaStatement = connection.prepareStatement("PRAGMA auto_vacuum = 2;")) {
                        pragmaStatement.execute();
                    }
                }

                com.gmt2001.Console.debug.println("STARTUP VACUUM");
                try ( PreparedStatement vacuumStatement = connection.prepareStatement("VACUUM;")) {
                    vacuumStatement.execute();
                }
            } finally {
                this.rwl.writeLock().unlock();
            }

        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        ExecutorService.scheduleAtFixedRate(this::doMaintenance, 3, 3, TimeUnit.HOURS);
    }

    private String sanitizeOrder(String order) {
        return order.equalsIgnoreCase("ASC") ? "ASC" : "DESC";
    }

    private String sanitizeLimit(String limit) {
        try {
            int intValue = Integer.parseInt(limit);
            return String.valueOf(intValue);
        } catch (NumberFormatException | NullPointerException ex) {
            return String.valueOf(Integer.MAX_VALUE);
        }
    }

    private String sanitizeOffset(String offset) {
        try {
            int intValue = Integer.parseInt(offset);
            return String.valueOf(intValue);
        } catch (NumberFormatException | NullPointerException ex) {
            return "0";
        }
    }

    public static boolean hasDatabase(String configStr) {
        return Files.exists(Paths.get((String) LoadConfigReal(configStr)[0]), LinkOption.NOFOLLOW_LINKS);
    }

    private static Object[] LoadConfigReal(String configStr) {
        if (configStr.isEmpty()) {
            configStr = "sqlite3config.txt";
        }

        String dbname = "config/phantombot.db";
        int cache_size = -50000;
        boolean safe_write = false;
        boolean journal = true;

        try {
            File f = new File("./" + configStr);

            if (f.exists()) {
                String data = FileUtils.readFileToString(new File("./" + configStr), Charset.defaultCharset());
                String[] lines = data.replaceAll("\\r", "").split("\\n");

                for (String line : lines) {
                    if (line.startsWith("dbname=") && line.length() > 8) {
                        dbname = line.substring(7);
                    } else if (line.startsWith("cachesize=") && line.length() > 11) {
                        cache_size = Integer.parseInt(line.substring(10));
                    } else if (line.startsWith("safewrite=") && line.length() > 11) {
                        safe_write = line.substring(10).equalsIgnoreCase("true") || line.substring(10).equalsIgnoreCase("1");
                    } else if (line.startsWith("journal=") && line.length() > 9) {
                        journal = line.substring(8).equalsIgnoreCase("true") || line.substring(10).equalsIgnoreCase("1");
                    }
                }
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return new Object[]{
            dbname, cache_size, safe_write, journal
        };
    }

    private String validateFname(String fName) {
        fName = fName.replaceAll("([^a-zA-Z0-9_])", "_");

        if (fName.startsWith("sqlite_")) {
            fName = fName.substring(7);
        }

        if (fName.matches("^[0-9]+")) {
            fName = "_" + fName;
        }

        return fName;
    }

    private Connection GetConnection() throws SQLException {
        return this.poolMgr.getConnection();
    }

    @Override
    public void AddFile(String fName) {
        try ( Connection connection = GetConnection()) {
            AddFile(connection, fName);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public void AddFile(Connection connection, String fName) {
        try {
            this.rwl.readLock().lock();
            fName = validateFname(fName);

            if (!FileExists(connection, fName)) {
                try ( Statement statement = connection.createStatement()) {
                    statement.addBatch("CREATE TABLE IF NOT EXISTS phantombot_" + fName + " (section string, variable string, value string);");
                    statement.addBatch("CREATE UNIQUE INDEX IF NOT EXISTS " + fName + "_idx on phantombot_" + fName + " (section, variable);");
                    statement.executeBatch();
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            }
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public void RemoveKey(String fName, String section, String key) {
        try {
            this.rwl.readLock().lock();
            try ( Connection connection = GetConnection()) {
                fName = validateFname(fName);

                if (FileExists(connection, fName)) {
                    try ( PreparedStatement statement = connection.prepareStatement("DELETE FROM phantombot_" + fName + " WHERE section=? AND variable=?;")) {
                        statement.setString(1, section);
                        statement.setString(2, key);
                        statement.execute();
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public void RemoveSection(String fName, String section) {
        try {
            this.rwl.readLock().lock();
            try ( Connection connection = GetConnection()) {
                fName = validateFname(fName);

                if (FileExists(connection, fName)) {
                    try ( PreparedStatement statement = connection.prepareStatement("DELETE FROM phantombot_" + fName + " WHERE section=?;")) {
                        statement.setString(1, section);
                        statement.execute();
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public void RemoveFile(String fName) {
        try {
            this.rwl.readLock().lock();
            try ( Connection connection = GetConnection()) {
                fName = validateFname(fName);

                if (FileExists(connection, fName)) {
                    try ( Statement statement = connection.createStatement()) {
                        statement.execute("DROP TABLE phantombot_" + fName + ";");
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public void RenameFile(String fNameSource, String fNameDest) {
        try {
            this.rwl.readLock().lock();
            try ( Connection connection = GetConnection()) {
                fNameSource = validateFname(fNameSource);
                fNameDest = validateFname(fNameDest);

                if (!FileExists(connection, fNameSource)) {
                    return;
                }

                try ( Statement statement = connection.createStatement()) {

                    if (FileExists(connection, fNameDest)) {
                        statement.execute("DROP TABLE phantombot_" + fNameDest + ";");
                    }

                    statement.execute("ALTER TABLE phantombot_" + fNameSource + " RENAME TO phantombot_" + fNameDest + ";");
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public boolean FileExists(String fName) {
        boolean out = false;

        try ( Connection connection = GetConnection()) {
            out = FileExists(connection, fName);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return out;
    }

    public boolean FileExists(Connection connection, String fName) {
        try {
            this.rwl.readLock().lock();
            fName = validateFname(fName);

            boolean out = false;

            try ( Statement statement = connection.createStatement()) {
                try ( ResultSet rs = statement.executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name='phantombot_" + fName + "';")) {
                    out = rs.next();
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            return out;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public String[] GetFileList() {
        try {
            this.rwl.readLock().lock();
            String[] out = new String[]{};

            try ( Connection connection = GetConnection()) {
                try ( Statement statement = connection.createStatement()) {
                    try ( ResultSet rs = statement.executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'phantombot_%';")) {

                        ArrayList<String> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(rs.getString("name").substring(11));
                        }

                        out = s.toArray(String[]::new);
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            return out;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public String[] GetCategoryList(String fName) {
        try {
            this.rwl.readLock().lock();
            String[] out = new String[]{};

            try ( Connection connection = GetConnection()) {
                fName = validateFname(fName);

                if (FileExists(connection, fName)) {
                    try ( Statement statement = connection.createStatement()) {
                        try ( ResultSet rs = statement.executeQuery("SELECT section FROM phantombot_" + fName + " GROUP BY section;")) {

                            ArrayList<String> s = new ArrayList<>();

                            while (rs.next()) {
                                s.add(rs.getString("section"));
                            }

                            out = s.toArray(String[]::new);
                        }
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            return out;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public String[] GetKeyList(String fName, String section) {
        try {
            this.rwl.readLock().lock();
            String[] out = new String[]{};

            try ( Connection connection = GetConnection()) {
                fName = validateFname(fName);

                if (FileExists(connection, fName)) {
                    if (section != null) {
                        try ( PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=?;")) {
                            statement.setString(1, section);

                            try ( ResultSet rs = statement.executeQuery()) {

                                ArrayList<String> s = new ArrayList<>();

                                while (rs.next()) {
                                    s.add(rs.getString("variable"));
                                }

                                out = s.toArray(String[]::new);
                            }
                        }
                    } else {
                        try ( PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + ";")) {
                            try ( ResultSet rs = statement.executeQuery()) {

                                ArrayList<String> s = new ArrayList<>();

                                while (rs.next()) {
                                    s.add(rs.getString("variable"));
                                }

                                out = s.toArray(String[]::new);
                            }
                        }
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            return out;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public KeyValue[] GetKeyValueList(String fName, String section) {
        try {
            this.rwl.readLock().lock();
            KeyValue[] out = new KeyValue[]{};

            try ( Connection connection = GetConnection()) {
                fName = validateFname(fName);

                if (FileExists(connection, fName)) {
                    if (section != null) {
                        try ( PreparedStatement statement = connection.prepareStatement("SELECT variable, value FROM phantombot_" + fName + " WHERE section=?;")) {
                            statement.setString(1, section);

                            try ( ResultSet rs = statement.executeQuery()) {
                                ArrayList<KeyValue> s = new ArrayList<>();

                                while (rs.next()) {
                                    s.add(new KeyValue(rs.getString("variable"), rs.getString("value")));
                                }

                                out = s.toArray(KeyValue[]::new);
                            }
                        }
                    } else {
                        try ( PreparedStatement statement = connection.prepareStatement("SELECT variable, value FROM phantombot_" + fName + ";")) {
                            try ( ResultSet rs = statement.executeQuery()) {

                                ArrayList<KeyValue> s = new ArrayList<>();

                                while (rs.next()) {
                                    s.add(new KeyValue(rs.getString("variable"), rs.getString("value")));
                                }

                                out = s.toArray(KeyValue[]::new);
                            }
                        }
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            return out;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public String[] GetKeysByOrder(String fName, String section, String order, String limit, String offset) {
        return GetKeysByOrderInternal(fName, section, order, limit, offset, false);
    }

    @Override
    public String[] GetKeysByNumberOrder(String fName, String section, String order, String limit, String offset) {
        return GetKeysByOrderInternal(fName, section, order, limit, offset, true);
    }

    private String[] GetKeysByOrderInternal(String fName, String section, String order, String limit, String offset, boolean isNumber) {
        try {
            this.rwl.readLock().lock();
            String[] out = new String[]{};

            try ( Connection connection = GetConnection()) {
                String statementStr;
                fName = validateFname(fName);
                order = sanitizeOrder(order);
                limit = sanitizeLimit(limit);
                offset = sanitizeOffset(offset);

                if (FileExists(connection, fName)) {
                    if (section != null) {
                        if (isNumber) {
                            statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY CAST(variable as INTEGER) COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                        } else {
                            statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY variable COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                        }
                        try ( PreparedStatement statement = connection.prepareStatement(statementStr)) {
                            statement.setString(1, section);

                            try ( ResultSet rs = statement.executeQuery()) {

                                ArrayList<String> s = new ArrayList<>();

                                while (rs.next()) {
                                    s.add(rs.getString("variable"));
                                }

                                out = s.toArray(String[]::new);
                            }
                        }
                    } else {
                        if (isNumber) {
                            statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY CAST(variable as INTEGER) COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                        } else {
                            statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY variable COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                        }
                        try ( PreparedStatement statement = connection.prepareStatement(statementStr)) {
                            try ( ResultSet rs = statement.executeQuery()) {

                                ArrayList<String> s = new ArrayList<>();

                                while (rs.next()) {
                                    s.add(rs.getString("variable"));
                                }

                                out = s.toArray(String[]::new);
                            }
                        }
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            return out;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public String[] GetKeysByOrderValue(String fName, String section, String order, String limit, String offset) {
        return GetKeysByOrderValueInternal(fName, section, order, limit, offset, false);
    }

    @Override
    public String[] GetKeysByNumberOrderValue(String fName, String section, String order, String limit, String offset) {
        return GetKeysByOrderValueInternal(fName, section, order, limit, offset, true);
    }

    private String[] GetKeysByOrderValueInternal(String fName, String section, String order, String limit, String offset, boolean isNumber) {
        try {
            this.rwl.readLock().lock();
            String[] out = new String[]{};

            try ( Connection connection = GetConnection()) {
                String statementStr;
                fName = validateFname(fName);
                order = sanitizeOrder(order);
                limit = sanitizeLimit(limit);
                offset = sanitizeOffset(offset);

                if (FileExists(connection, fName)) {
                    if (section != null) {
                        if (isNumber) {
                            statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY CAST(value as INTEGER) COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                        } else {
                            statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY value COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                        }

                        try ( PreparedStatement statement = connection.prepareStatement(statementStr)) {
                            statement.setString(1, section);

                            try ( ResultSet rs = statement.executeQuery()) {

                                ArrayList<String> s = new ArrayList<>();

                                while (rs.next()) {
                                    s.add(rs.getString("variable"));
                                }

                                out = s.toArray(String[]::new);
                            }
                        }
                    } else {
                        if (isNumber) {
                            statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY CAST(value as INTEGER) COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                        } else {
                            statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY value COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                        }
                        try ( PreparedStatement statement = connection.prepareStatement(statementStr)) {
                            try ( ResultSet rs = statement.executeQuery()) {

                                ArrayList<String> s = new ArrayList<>();

                                while (rs.next()) {
                                    s.add(rs.getString("variable"));
                                }

                                out = s.toArray(String[]::new);
                            }
                        }
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            return out;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public String[] GetKeysByLikeValues(String fName, String section, String search) {
        try {
            this.rwl.readLock().lock();
            String[] out = new String[]{};

            try ( Connection connection = GetConnection()) {
                fName = validateFname(fName);

                if (FileExists(connection, fName)) {
                    if (section != null) {
                        try ( PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND value LIKE ?;")) {
                            statement.setString(1, section);
                            statement.setString(2, "%" + search + "%");

                            try ( ResultSet rs = statement.executeQuery()) {
                                ArrayList<String> s = new ArrayList<>();

                                while (rs.next()) {
                                    s.add(rs.getString("variable"));
                                }
                                out = s.toArray(String[]::new);
                            }
                        }
                    } else {
                        try ( PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE value LIKE ?;")) {
                            statement.setString(1, "%" + search + "%");

                            try ( ResultSet rs = statement.executeQuery()) {
                                ArrayList<String> s = new ArrayList<>();

                                while (rs.next()) {
                                    s.add(rs.getString("variable"));
                                }
                                out = s.toArray(String[]::new);
                            }
                        }
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            return out;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public String[] GetKeysByLikeKeys(String fName, String section, String search) {
        try {
            this.rwl.readLock().lock();
            String[] out = new String[]{};

            try ( Connection connection = GetConnection()) {
                fName = validateFname(fName);

                if (FileExists(connection, fName)) {
                    if (section != null) {
                        try ( PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND variable LIKE ?;")) {
                            statement.setString(1, section);
                            statement.setString(2, "%" + search + "%");

                            try ( ResultSet rs = statement.executeQuery()) {
                                ArrayList<String> s = new ArrayList<>();

                                while (rs.next()) {
                                    s.add(rs.getString("variable"));
                                }
                                out = s.toArray(String[]::new);
                            }
                        }
                    } else {
                        try ( PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE variable LIKE ?;")) {
                            statement.setString(1, "%" + search + "%");

                            try ( ResultSet rs = statement.executeQuery()) {
                                ArrayList<String> s = new ArrayList<>();

                                while (rs.next()) {
                                    s.add(rs.getString("variable"));
                                }
                                out = s.toArray(String[]::new);
                            }
                        }
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            return out;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public String[] GetKeysByLikeKeysOrder(String fName, String section, String search, String order, String limit, String offset) {
        try {
            this.rwl.readLock().lock();
            String[] out = new String[]{};

            try ( Connection connection = GetConnection()) {
                fName = validateFname(fName);
                order = sanitizeOrder(order);
                limit = sanitizeLimit(limit);
                offset = sanitizeOffset(offset);

                if (FileExists(connection, fName)) {
                    if (section != null) {
                        try ( PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND variable LIKE ? ORDER BY variable " + order + " LIMIT " + limit + " OFFSET " + offset + ";")) {
                            statement.setString(1, section);
                            statement.setString(2, "%" + search + "%");

                            try ( ResultSet rs = statement.executeQuery()) {
                                ArrayList<String> s = new ArrayList<>();

                                while (rs.next()) {
                                    s.add(rs.getString("variable"));
                                }

                                out = s.toArray(String[]::new);
                            }
                        }
                    } else {
                        try ( PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE variable LIKE ? ORDER BY variable " + order + " LIMIT " + limit + " OFFSET " + offset + ";")) {
                            statement.setString(1, "%" + search + "%");

                            try ( ResultSet rs = statement.executeQuery()) {
                                ArrayList<String> s = new ArrayList<>();

                                while (rs.next()) {
                                    s.add(rs.getString("variable"));
                                }

                                out = s.toArray(String[]::new);
                            }
                        }
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            return out;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public boolean HasKey(String fName, String section, String key) {
        try {
            this.rwl.readLock().lock();
            boolean out = false;

            try ( Connection connection = GetConnection()) {
                fName = validateFname(fName);

                if (!FileExists(connection, fName)) {
                    return false;
                }

                if (section != null && !section.isEmpty()) {
                    try ( PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE section=? AND variable=?;")) {
                        statement.setString(1, section);
                        statement.setString(2, key);

                        try ( ResultSet rs = statement.executeQuery()) {

                            if (rs.next()) {
                                out = true;
                            }
                        }
                    }
                } else {
                    try ( PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE variable=?;")) {
                        statement.setString(1, key);

                        try ( ResultSet rs = statement.executeQuery()) {

                            if (rs.next()) {
                                out = true;
                            }
                        }
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            return out;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public String GetKeyByValue(String fName, String section, String value) {
        try {
            this.rwl.readLock().lock();
            String result = null;

            try ( Connection connection = GetConnection()) {
                fName = validateFname(fName);

                if (!FileExists(connection, fName)) {
                    return result;
                }

                if (section != null) {
                    try ( PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND value=?;")) {
                        statement.setString(1, section);
                        statement.setString(2, value);

                        try ( ResultSet rs = statement.executeQuery()) {

                            if (rs.next()) {
                                result = rs.getString("variable");
                            }
                        }
                    }
                } else {
                    try ( PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE value=?;")) {
                        statement.setString(1, value);

                        try ( ResultSet rs = statement.executeQuery()) {

                            if (rs.next()) {
                                result = rs.getString("variable");
                            }
                        }
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            return result;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public String GetString(String fName, String section, String key) {
        try {
            this.rwl.readLock().lock();
            String result = null;

            try ( Connection connection = GetConnection()) {
                fName = validateFname(fName);

                if (!FileExists(connection, fName)) {
                    return result;
                }

                if (section != null) {
                    try ( PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE section=? AND variable=?;")) {
                        statement.setString(1, section);
                        statement.setString(2, key);

                        try ( ResultSet rs = statement.executeQuery()) {

                            if (rs.next()) {
                                result = rs.getString("value");
                            }
                        }
                    }
                } else {
                    try ( PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE variable=?;")) {
                        statement.setString(1, key);

                        try ( ResultSet rs = statement.executeQuery()) {

                            if (rs.next()) {
                                result = rs.getString("value");
                            }
                        }
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            return result;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public void SetBatchString(String fName, String section, String[] keys, String[] values) {
        try {
            this.rwl.readLock().lock();
            try ( Connection connection = GetConnection()) {

                fName = validateFname(fName);
                AddFile(connection, fName);

                /* Walk the list of keys to figure out which ones can pass INSERT and which ones need UPDATE */
                Map<String, String> insertMap = new HashMap<>();
                Map<String, String> updateMap = new HashMap<>();

                for (int idx = 0; idx < keys.length; idx++) {
                    if (HasKey(fName, section, keys[idx])) {
                        updateMap.put(keys[idx], values[idx]);
                    } else {
                        insertMap.put(keys[idx], values[idx]);
                    }
                }

                connection.setAutoCommit(false);

                if (!insertMap.isEmpty()) {
                    try ( PreparedStatement statement = connection.prepareStatement("INSERT INTO phantombot_" + fName + " (value, section, variable) values(?, ?, ?);")) {
                        for (String key : insertMap.keySet()) {
                            statement.setString(1, insertMap.get(key));
                            statement.setString(2, section);
                            statement.setString(3, key);
                            statement.addBatch();
                        }

                        statement.executeBatch();
                    }
                }

                if (!updateMap.isEmpty()) {
                    try ( PreparedStatement statement = connection.prepareStatement("UPDATE phantombot_" + fName + " SET value=? WHERE section=? and variable=?;")) {
                        for (String key : updateMap.keySet()) {
                            statement.setString(1, updateMap.get(key));
                            statement.setString(2, section);
                            statement.setString(3, key);
                            statement.addBatch();
                        }

                        statement.executeBatch();
                    }
                }

                connection.commit();
                connection.setAutoCommit(true);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public void SetString(String fName, String section, String key, String value) {
        try {
            this.rwl.readLock().lock();
            try ( Connection connection = GetConnection()) {

                fName = validateFname(fName);

                AddFile(connection, fName);

                if (HasKey(fName, section, key)) {
                    try ( PreparedStatement statement = connection.prepareStatement("UPDATE phantombot_" + fName + " SET value=? WHERE section=? AND variable=?;")) {
                        statement.setString(1, value);
                        statement.setString(2, section);
                        statement.setString(3, key);
                        statement.execute();
                    }
                } else {
                    try ( PreparedStatement statement = connection.prepareStatement("INSERT INTO phantombot_" + fName + " values(?, ?, ?);")) {
                        statement.setString(1, section);
                        statement.setString(2, key);
                        statement.setString(3, value);
                        statement.execute();
                    }
                }

            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public void IncreaseBatchString(String fName, String section, String[] keys, String value) {
        try {
            this.rwl.readLock().lock();
            if (keys.length == 0) {
                return;
            }

            try ( Connection connection = GetConnection()) {
                fName = validateFname(fName);

                AddFile(connection, fName);

                connection.setAutoCommit(false);

                StringBuilder sb = new StringBuilder(keys.length * 2);

                for (String unused : keys) {
                    sb.append("?,");
                }

                try ( PreparedStatement statement = connection.prepareStatement("UPDATE phantombot_" + fName + " SET value = CAST(value AS UNSIGNED) + ? WHERE section = ? AND variable IN (" + sb.deleteCharAt(sb.length() - 1).toString() + ");")) {
                    statement.setInt(1, Integer.parseUnsignedInt(value));
                    statement.setString(2, section);
                    int i = 3;
                    for (String k : keys) {
                        statement.setString(i++, k);
                    }
                    statement.execute();
                }

                sb = new StringBuilder(keys.length * 10);

                for (String unused : keys) {
                    sb.append("(?, ?, ?),");
                }

                try ( PreparedStatement statement = connection.prepareStatement("INSERT OR IGNORE INTO phantombot_" + fName + " (section, variable, value) VALUES " + sb.deleteCharAt(sb.length() - 1).toString() + ";")) {
                    int i = 1;
                    for (String k : keys) {
                        statement.setString(i++, section);
                        statement.setString(i++, k);
                        statement.setString(i++, value);
                    }
                    statement.execute();
                }

                connection.commit();
                connection.setAutoCommit(true);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public String[][] executeSql(String sql, String[] replacements) {
        try {
            this.rwl.readLock().lock();
            ArrayList<ArrayList<String>> results = new ArrayList<>();

            try ( Connection connection = GetConnection()) {
                try ( PreparedStatement statement = connection.prepareStatement(sql)) {
                    int i = 1;
                    for (String k : replacements) {
                        statement.setString(i++, k);
                    }

                    try ( ResultSet rs = statement.executeQuery()) {
                        int numcol = rs.getMetaData().getColumnCount();
                        i = 0;

                        while (rs.next()) {
                            results.add(new ArrayList<>());

                            for (int b = 1; b <= numcol; b++) {
                                results.get(i).add(rs.getString(b));
                            }

                            i++;
                        }
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            return results.stream().map(al -> al.stream().toArray(String[]::new)).toArray(String[][]::new);
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Override
    public void CreateIndexes() {
        try {
            this.rwl.writeLock().lock();
            try ( Connection connection = GetConnection()) {
                String[] tableNames = GetFileList();
                try ( Statement statement = connection.createStatement()) {
                    for (String tableName : tableNames) {
                        tableName = validateFname(tableName);
                        try {
                            statement.execute("CREATE UNIQUE INDEX IF NOT EXISTS " + tableName + "_idx on phantombot_" + tableName + " (section, variable);");
                        } catch (SQLiteException ex) {
                            if (ex.getResultCode() == SQLiteErrorCode.SQLITE_CONSTRAINT || ex.getResultCode() == SQLiteErrorCode.SQLITE_CONSTRAINT_UNIQUE) {
                                statement.execute("DELETE FROM phantombot_" + tableName + " WHERE rowid NOT IN (SELECT MIN(rowid) FROM phantombot_" + tableName + " GROUP BY section, variable);");
                                statement.execute("CREATE UNIQUE INDEX IF NOT EXISTS " + tableName + "_idx on phantombot_" + tableName + " (section, variable);");
                            } else {
                                throw ex;
                            }
                        }
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } finally {
            this.rwl.writeLock().unlock();
        }
    }

    @Override
    public void DropIndexes() {
        try {
            this.rwl.writeLock().lock();
            try ( Connection connection = GetConnection()) {
                String[] tableNames = GetFileList();
                try ( Statement statement = connection.createStatement()) {
                    for (String tableName : tableNames) {
                        tableName = validateFname(tableName);
                        statement.execute("DROP INDEX IF EXISTS " + tableName + "_idx");
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } finally {
            this.rwl.writeLock().unlock();
        }
    }

    @Override
    public boolean canBackup() {
        return true;
    }

    @Override
    public void backupDB(String filename) {
        try {
            this.rwl.writeLock().lock();
            try ( Connection connection = GetConnection()) {
                if (!new File("./dbbackup").exists()) {
                    new File("./dbbackup").mkdirs();
                }

                try ( Statement statement = connection.createStatement()) {
                    statement.execute("backup to ./dbbackup/" + filename);
                    com.gmt2001.Console.debug.println("Backed up SQLite3 DB to ./dbbackup/" + filename);
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } finally {
            this.rwl.writeLock().unlock();
        }
    }

    public void doMaintenance() {
        try {
            this.rwl.writeLock().lock();

            try ( Connection connection = this.poolMgr.getConnection()) {
                boolean vacuumed = false;
                try {
                    Path walPath = PathValidator.getRealPath(Paths.get(this.dbFile + "-wal"));
                    if (Files.exists(walPath) && Files.size(walPath) > MAXWALSIZE) {
                        vacuumed = true;
                        com.gmt2001.Console.debug.println("MAXWALSIZE VACUUM");
                        try ( PreparedStatement vacuumStatement = connection.prepareStatement("VACUUM;")) {
                            vacuumStatement.execute();
                            this.nextVacuum = Instant.now().plus(1, ChronoUnit.DAYS);
                        }
                    }
                } catch (IOException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }

                if (!vacuumed) {
                    if (this.nextVacuum.isBefore(Instant.now())) {
                        com.gmt2001.Console.debug.println("DAILY VACUUM");
                        try ( PreparedStatement vacuumStatement = connection.prepareStatement("VACUUM;")) {
                            vacuumStatement.execute();
                            this.nextVacuum = Instant.now().plus(1, ChronoUnit.DAYS);
                        }
                    } else {
                        com.gmt2001.Console.debug.println("PRAGMA incremental_vacuum(2048)");
                        try ( PreparedStatement vacuumStatement = connection.prepareStatement("PRAGMA incremental_vacuum(2048);")) {
                            vacuumStatement.execute();
                        }
                    }
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        } finally {
            this.rwl.writeLock().unlock();
        }
    }

    @Override
    public void dispose() {
        super.dispose();

        try {
            com.gmt2001.Console.debug.println("VACUUM on dispose");
            this.rwl.writeLock().lock();

            try ( Connection connection = this.poolMgr.getConnection()) {
                try ( PreparedStatement vacuumStatement = connection.prepareStatement("VACUUM;")) {
                    vacuumStatement.execute();
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        } finally {
            this.rwl.writeLock().unlock();
        }

        try {
            poolMgr.dispose();
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }
}
