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
package com.gmt2001.datastore;

import biz.source_code.miniConnectionPoolManager.MiniConnectionPoolManager;
import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.BlockingDeque;
import java.util.concurrent.LinkedBlockingDeque;
import org.apache.commons.io.FileUtils;
import org.sqlite.SQLiteConfig;
import org.sqlite.javax.SQLiteConnectionPoolDataSource;

/**
 *
 * @author gmt2001
 */
public class SqliteStore extends DataStore {

    private static final int MAX_CONNECTIONS = 10;
    private static SqliteStore instance;
    private static WriteQueue writequeue;
    private MiniConnectionPoolManager poolMgr;

    public static SqliteStore instance() {
        if (instance == null) {
            instance = new SqliteStore();
            writequeue = new WriteQueue();
        }

        return instance;
    }

    private SqliteStore() {
        try {
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        Object o[] = LoadConfigReal("");

        SQLiteConfig config = new SQLiteConfig();
        config.setCacheSize((int) o[1]);
        config.setSynchronous((boolean) o[2] ? SQLiteConfig.SynchronousMode.FULL : SQLiteConfig.SynchronousMode.NORMAL);
        config.setTempStore(SQLiteConfig.TempStore.MEMORY);
        config.setJournalMode((boolean) o[3] ? SQLiteConfig.JournalMode.WAL : SQLiteConfig.JournalMode.OFF);
        config.setBusyTimeout(10000);

        SQLiteConnectionPoolDataSource dataSource = new SQLiteConnectionPoolDataSource(config);
        dataSource.setUrl("jdbc:sqlite:" + ((String) o[0]).replaceAll("\\\\", "/"));
        poolMgr = new MiniConnectionPoolManager(dataSource, MAX_CONNECTIONS);
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

    public void CloseConnection(Connection connection) {
        try {
            if (connection != null) {
                connection.close();
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    private String validateFname(String fName) {
        fName = fName.replaceAll("([^a-zA-Z0-9_-])", "_");

        return fName;
    }

    private Connection GetConnection() {
        if (!writequeue.isRunning) {
            writequeue.start();
        }

        return poolMgr.getValidConnection();
    }

    @Override
    public void AddFile(String fName) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        if (!FileExists(connection, fName)) {
            try {
                Statement statement = connection.createStatement();
                statement.addBatch("CREATE TABLE IF NOT EXISTS phantombot_" + fName + " (section string, variable string, value string);");
                statement.addBatch("CREATE UNIQUE INDEX IF NOT EXISTS " + fName + "_idx on phantombot_" + fName + " (section, variable);");
                writequeue.block(statement, connection);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RemoveKey(String fName, String section, String key) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        if (FileExists(connection, fName)) {
            try {
                PreparedStatement statement = connection.prepareStatement("DELETE FROM phantombot_" + fName + " WHERE section=? AND variable=?;");
                statement.setString(1, section);
                statement.setString(2, key);
                statement.addBatch();
                writequeue.enqueue(statement, connection);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RemoveSection(String fName, String section) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        if (FileExists(connection, fName)) {
            try {
                PreparedStatement statement = connection.prepareStatement("DELETE FROM phantombot_" + fName + " WHERE section=?;");
                statement.setString(1, section);
                statement.addBatch();
                writequeue.enqueue(statement, connection);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RemoveFile(String fName) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        if (FileExists(connection, fName)) {
            try {
                Statement statement = connection.createStatement();
                statement.addBatch("DROP TABLE phantombot_" + fName + ";");
                writequeue.block(statement, connection);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RenameFile(String fNameSource, String fNameDest) {
        Connection connection = GetConnection();

        fNameSource = validateFname(fNameSource);
        fNameDest = validateFname(fNameDest);

        if (!FileExists(connection, fNameSource)) {
            CloseConnection(connection);
            return;
        }

        try {
            Statement statement = connection.createStatement();

            if (FileExists(connection, fNameDest)) {
                statement.addBatch("DROP TABLE phantombot_" + fNameDest + ";");
            }

            statement.addBatch("ALTER TABLE phantombot_" + fNameSource + " RENAME TO phantombot_" + fNameDest + ";");
            writequeue.block(statement, connection);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public boolean FileExists(String fName) {
        Connection connection = GetConnection();
        boolean out = FileExists(connection, fName);

        CloseConnection(connection);

        return out;
    }

    public boolean FileExists(Connection connection, String fName) {
        fName = validateFname(fName);

        boolean out = false;
        try (Statement statement = connection.createStatement()) {
            try (ResultSet rs = statement.executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name='phantombot_" + fName + "';")) {
                out = rs.next();
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return out;
    }

    @Override
    public String[] GetFileList() {
        Connection connection = GetConnection();
        String[] out = new String[]{};

        try (Statement statement = connection.createStatement()) {
            try (ResultSet rs = statement.executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'phantombot_%';")) {

                ArrayList<String> s = new ArrayList<>();

                while (rs.next()) {
                    s.add(rs.getString("name").substring(11));
                }

                out = s.toArray(new String[s.size()]);
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        } finally {
            CloseConnection(connection);
        }

        return out;
    }

    @Override
    public String[] GetCategoryList(String fName) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        String[] out = new String[]{};

        if (FileExists(connection, fName)) {
            try (Statement statement = connection.createStatement()) {
                try (ResultSet rs = statement.executeQuery("SELECT section FROM phantombot_" + fName + " GROUP BY section;")) {

                    ArrayList<String> s = new ArrayList<>();

                    while (rs.next()) {
                        s.add(rs.getString("section"));
                    }

                    out = s.toArray(new String[s.size()]);
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } finally {
                CloseConnection(connection);
            }
        }

        return out;
    }

    @Override
    public String[] GetKeyList(String fName, String section) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        String[] out = new String[]{};

        if (FileExists(connection, fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=?;")) {
                    statement.setString(1, section);

                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }

                        out = s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } finally {
                    CloseConnection(connection);
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + ";")) {
                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }

                        out = s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } finally {
                    CloseConnection(connection);
                }
            }
        }

        return out;
    }

    @Override
    public KeyValue[] GetKeyValueList(String fName, String section) {
        Connection connection = GetConnection();
        fName = validateFname(fName);

        KeyValue[] out = new KeyValue[]{};

        if (FileExists(connection, fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable, value FROM phantombot_" + fName + " WHERE section=?;")) {
                    statement.setString(1, section);

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<KeyValue> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(new KeyValue(rs.getString("variable"), rs.getString("value")));
                        }

                        out = s.toArray(new KeyValue[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } finally {
                    CloseConnection(connection);
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable, value FROM phantombot_" + fName + ";")) {
                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<KeyValue> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(new KeyValue(rs.getString("variable"), rs.getString("value")));
                        }

                        out = s.toArray(new KeyValue[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } finally {
                    CloseConnection(connection);
                }
            }
        }

        return out;
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
        Connection connection = GetConnection();
        String statementStr;
        fName = validateFname(fName);
        order = sanitizeOrder(order);
        limit = sanitizeLimit(limit);
        offset = sanitizeOffset(offset);

        String[] out = new String[]{};

        if (FileExists(connection, fName)) {
            if (section != null) {
                if (isNumber) {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY CAST(variable as INTEGER) COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                } else {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY variable COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                }
                try (PreparedStatement statement = connection.prepareStatement(statementStr)) {
                    statement.setString(1, section);

                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }

                        out = s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } finally {
                    CloseConnection(connection);
                }
            } else {
                if (isNumber) {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY CAST(variable as INTEGER) COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                } else {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY variable COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                }
                try (PreparedStatement statement = connection.prepareStatement(statementStr)) {
                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }

                        out = s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } finally {
                    CloseConnection(connection);
                }
            }
        }

        return out;
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
        Connection connection = GetConnection();
        String statementStr;
        fName = validateFname(fName);
        order = sanitizeOrder(order);
        limit = sanitizeLimit(limit);
        offset = sanitizeOffset(offset);

        String[] out = new String[]{};

        if (FileExists(connection, fName)) {
            if (section != null) {
                if (isNumber) {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY CAST(value as INTEGER) COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                } else {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY value COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                }

                try (PreparedStatement statement = connection.prepareStatement(statementStr)) {
                    statement.setString(1, section);

                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }

                        out = s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } finally {
                    CloseConnection(connection);
                }
            } else {
                if (isNumber) {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY CAST(value as INTEGER) COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                } else {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY value COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                }
                try (PreparedStatement statement = connection.prepareStatement(statementStr)) {
                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }

                        out = s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } finally {
                    CloseConnection(connection);
                }
            }
        }

        return out;
    }

    @Override
    public String[] GetKeysByLikeValues(String fName, String section, String search) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        String[] out = new String[]{};

        if (FileExists(connection, fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND value LIKE ?;")) {
                    statement.setString(1, section);
                    statement.setString(2, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }
                        out = s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } finally {
                    CloseConnection(connection);
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE value LIKE ?;")) {
                    statement.setString(1, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }
                        out = s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } catch (Exception ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } finally {
                    CloseConnection(connection);
                }
            }
        }

        return out;
    }

    @Override
    public String[] GetKeysByLikeKeys(String fName, String section, String search) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        String[] out = new String[]{};

        if (FileExists(connection, fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND variable LIKE ?;")) {
                    statement.setString(1, section);
                    statement.setString(2, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }
                        out = s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } finally {
                    CloseConnection(connection);
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE variable LIKE ?;")) {
                    statement.setString(1, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }
                        out = s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } catch (Exception ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } finally {
                    CloseConnection(connection);
                }
            }
        }

        return out;
    }

    @Override
    public String[] GetKeysByLikeKeysOrder(String fName, String section, String search, String order, String limit, String offset) {
        Connection connection = GetConnection();

        fName = validateFname(fName);
        order = sanitizeOrder(order);
        limit = sanitizeLimit(limit);
        offset = sanitizeOffset(offset);

        String[] out = new String[]{};

        if (FileExists(connection, fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND variable LIKE ? ORDER BY variable " + order + " LIMIT " + limit + " OFFSET " + offset + ";")) {
                    statement.setString(1, section);
                    statement.setString(2, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }

                        out = s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } finally {
                    CloseConnection(connection);
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE variable LIKE ? ORDER BY variable " + order + " LIMIT " + limit + " OFFSET " + offset + ";")) {
                    statement.setString(1, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }

                        out = s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } catch (Exception ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } finally {
                    CloseConnection(connection);
                }
            }
        }

        return out;
    }

    @Override
    public boolean HasKey(String fName, String section, String key) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        if (!FileExists(connection, fName)) {
            CloseConnection(connection);

            return false;
        }

        boolean out = false;

        if (section != null) {
            try (PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE section=? AND variable=?;")) {
                statement.setString(1, section);
                statement.setString(2, key);

                try (ResultSet rs = statement.executeQuery()) {

                    if (rs.next()) {
                        out = true;
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } finally {
                CloseConnection(connection);
            }
        } else {
            try (PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE variable=?;")) {
                statement.setString(1, key);

                try (ResultSet rs = statement.executeQuery()) {

                    if (rs.next()) {
                        out = true;
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } finally {
                CloseConnection(connection);
            }
        }

        return out;
    }

    @Override
    public String GetKeyByValue(String fName, String section, String value) {
        Connection connection = GetConnection();

        String result = null;

        fName = validateFname(fName);

        if (!FileExists(connection, fName)) {
            CloseConnection(connection);

            return result;
        }

        if (section != null) {
            try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND value=?;")) {
                statement.setString(1, section);
                statement.setString(2, value);

                try (ResultSet rs = statement.executeQuery()) {

                    if (rs.next()) {
                        result = rs.getString("variable");
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } finally {
                CloseConnection(connection);
            }
        } else {
            try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE value=?;")) {
                statement.setString(1, value);

                try (ResultSet rs = statement.executeQuery()) {

                    if (rs.next()) {
                        result = rs.getString("variable");
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } finally {
                CloseConnection(connection);
            }
        }

        return result;

    }

    @Override
    public String GetString(String fName, String section, String key) {
        Connection connection = GetConnection();

        String result = null;

        fName = validateFname(fName);

        if (!FileExists(connection, fName)) {
            CloseConnection(connection);

            return result;
        }

        if (section != null) {
            try (PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE section=? AND variable=?;")) {
                statement.setString(1, section);
                statement.setString(2, key);

                try (ResultSet rs = statement.executeQuery()) {

                    if (rs.next()) {
                        result = rs.getString("value");
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } finally {
                CloseConnection(connection);
            }
        } else {
            try (PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE variable=?;")) {
                statement.setString(1, key);

                try (ResultSet rs = statement.executeQuery()) {

                    if (rs.next()) {
                        result = rs.getString("value");
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } finally {
                CloseConnection(connection);
            }
        }

        return result;
    }

    @Override
    public void SetBatchString(String fName, String section, String[] keys, String[] values) {
        Connection connection = GetConnection();

        fName = validateFname(fName);
        AddFile(fName);

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

        try {
            if (insertMap.size() > 0) {
                PreparedStatement statement = connection.prepareStatement("INSERT INTO phantombot_" + fName + " (value, section, variable) values(?, ?, ?);");
                for (String key : insertMap.keySet()) {
                    statement.setString(1, insertMap.get(key));
                    statement.setString(2, section);
                    statement.setString(3, key);
                    statement.addBatch();
                }

                writequeue.enqueue(statement, connection, true, false, true);
            }
            if (updateMap.size() > 0) {
                PreparedStatement statement = connection.prepareStatement("UPDATE phantombot_" + fName + " SET value=? WHERE section=? and variable=?;");
                for (String key : updateMap.keySet()) {
                    statement.setString(1, updateMap.get(key));
                    statement.setString(2, section);
                    statement.setString(3, key);
                    statement.addBatch();
                }

                writequeue.enqueue(statement, connection, true, false, true);
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.println(ex);
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        setAutoCommit(true);
    }

    @Override
    public void SetString(String fName, String section, String key, String value) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        AddFile(fName);

        try {
            if (HasKey(fName, section, key)) {
                PreparedStatement statement = connection.prepareStatement("UPDATE phantombot_" + fName + " SET value=? WHERE section=? AND variable=?;");
                statement.setString(1, value);
                statement.setString(2, section);
                statement.setString(3, key);
                statement.addBatch();
                writequeue.enqueue(statement, connection);
            } else {
                PreparedStatement statement = connection.prepareStatement("INSERT INTO phantombot_" + fName + " values(?, ?, ?);");
                statement.setString(1, section);
                statement.setString(2, key);
                statement.setString(3, value);
                statement.addBatch();
                writequeue.enqueue(statement, connection);
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void IncreaseBatchString(String fName, String section, String[] keys, String value) {
        Connection connection = GetConnection();
        fName = validateFname(fName);

        AddFile(fName);

        try {
            PreparedStatement statement = connection.prepareStatement("UPDATE phantombot_" + fName + " SET value = CAST(value AS INTEGER) + " + value + " WHERE section = '" + section + "' AND variable IN ('" + String.join("', '", keys) + "');");
            statement.addBatch();
            writequeue.enqueue(statement, connection, false);

            StringBuilder sb = new StringBuilder(69 + fName.length() + (keys.length * (keys[0].length() + 17 + section.length() + value.length())));

            sb.append("INSERT OR IGNORE INTO phantombot_");
            sb.append(fName);
            sb.append(" (section, variable, value) VALUES ");

            boolean first = true;
            for (String k : keys) {
                if (!first) {
                    sb.append(",");
                }

                first = false;
                sb.append("('");
                sb.append(section);
                sb.append("', '");
                sb.append(k);
                sb.append("', ");
                sb.append(value);
                sb.append(")");
            }

            sb.append(";");

            statement = connection.prepareStatement(sb.toString());
            statement.addBatch();
            writequeue.enqueue(statement, connection, true);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void InsertString(String fName, String section, String key, String value) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        AddFile(fName);

        try {
            PreparedStatement statement = connection.prepareStatement("INSERT INTO phantombot_" + fName + " values(?, ?, ?);");
            statement.setString(1, section);
            statement.setString(2, key);
            statement.setString(3, value);
            statement.addBatch();
            writequeue.enqueue(statement, connection);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void CreateIndexes() {
        Connection connection = GetConnection();
        String[] tableNames = GetFileList();
        for (String tableName : tableNames) {
            tableName = validateFname(tableName);
            try {
                PreparedStatement statement = connection.prepareStatement("CREATE UNIQUE INDEX IF NOT EXISTS " + tableName + "_idx on phantombot_" + tableName + " (section, variable);");
                statement.addBatch();
                writequeue.enqueue(statement, connection, false);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        writequeue.enqueue(null, connection, true);
    }

    @Override
    public void DropIndexes() {
        Connection connection = GetConnection();
        String[] tableNames = GetFileList();
        for (String tableName : tableNames) {
            tableName = validateFname(tableName);
            try {
                PreparedStatement statement = connection.prepareStatement("DROP INDEX IF EXISTS " + tableName + "_idx");
                statement.addBatch();
                writequeue.enqueue(statement, connection, false);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        writequeue.enqueue(null, connection, true);
    }

    @Override
    public void backupSQLite3(String filename) {
        Connection connection = GetConnection();

        if (!new File("./dbbackup").exists()) {
            new File("./dbbackup").mkdirs();
        }

        try {
            try (Statement statement = connection.createStatement()) {
                statement.execute("backup to ./dbbackup/" + filename);
                com.gmt2001.Console.debug.println("Backed up SQLite3 DB to ./dbbackup/" + filename);
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        } finally {
            CloseConnection(connection);
        }
    }

    @Override
    public void killWriteQueue() {
        writequeue.kill();
    }

    private static class WQStatement {

        public int id;
        public Statement statement;
        public Connection connection = null;
        public boolean isBatch = false;
        public boolean autoCommit = true;
        public boolean blocking = false;
        public boolean shouldClose = true;

        public WQStatement(int id, Statement statement, Connection connection) {
            this.id = id;
            this.statement = statement;
            this.connection = connection;
        }

        public WQStatement(int id, Statement statement, Connection connection, boolean isBatch, boolean autoCommit) {
            this.id = id;
            this.statement = statement;
            this.connection = connection;
            this.isBatch = isBatch;
            this.autoCommit = autoCommit;
        }

        public WQStatement(int id, Statement statement, Connection connection, boolean isBatch, boolean autoCommit, boolean blocking, boolean shouldClose) {
            this.id = id;
            this.statement = statement;
            this.connection = connection;
            this.isBatch = isBatch;
            this.autoCommit = autoCommit;
            this.blocking = blocking;
            this.shouldClose = shouldClose;
        }
    }

    private static class WriteQueue implements Runnable {

        private final BlockingDeque<WQStatement> queue = new LinkedBlockingDeque<>();
        private final BlockingDeque<WQStatement> completed = new LinkedBlockingDeque<>();
        private final Thread thread;
        public boolean isRunning = false;
        private boolean isKilled = false;
        private int nextID = 0;

        /**
         * Class constructor.
         *
         * @param {String} channelName
         */
        public WriteQueue() {
            // Set the default thread uncaught exception handler.
            Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

            // Start a new thread for our final queue.
            this.thread = new Thread(this, "com.gmt2001.datastore.SqliteStore.WriteQueue::run");
            this.thread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
            this.thread.setPriority(Thread.NORM_PRIORITY);
        }

        /**
         * Method that starts this queue.
         *
         * @param {TwitchSession} session
         */
        public void start() {
            // Start the write thread.
            this.isRunning = true;
            this.thread.start();
        }

        /**
         * Method that adds a statement to the end of the queue.
         *
         * @param {PreparedStatement} statement
         */
        public void enqueue(Statement statement, Connection connection) {
            enqueue(statement, connection, false, true, true);
        }

        /**
         * Method that adds a statement to the end of the queue.
         *
         * @param {PreparedStatement} statement
         */
        public void enqueue(Statement statement, Connection connection, boolean shouldClose) {
            enqueue(statement, connection, false, true, shouldClose);
        }

        /**
         * Method that adds a statement to the end of the queue.
         *
         * @param {PreparedStatement} statement
         * @param {boolean} isBatch
         * @param {boolean} autoCommit
         */
        public void enqueue(Statement statement, Connection connection, boolean isBatch, boolean autoCommit, boolean close) {
            queue.add(new WQStatement(nextID++, statement, connection, isBatch, autoCommit, false, close));

            if (nextID >= Integer.MAX_VALUE - 5) {
                nextID = 0;
            }
        }

        public void block(Statement statement, Connection connection) {
            block(statement, connection, false, true, true);
        }

        @SuppressWarnings("SleepWhileInLoop")
        public void block(Statement statement, Connection connection, boolean isBatch, boolean autoCommit, boolean close) {
            queue.add(new WQStatement(nextID++, statement, connection, isBatch, autoCommit, true, close));

            int id = nextID - 1;

            if (nextID >= Integer.MAX_VALUE - 5) {
                nextID = 0;
            }

            boolean found = false;

            while (!found) {
                try {
                    WQStatement cstatement = completed.peek();

                    if (cstatement != null && cstatement.id == id) {
                        found = true;
                    } else {
                        Thread.sleep(100);
                    }
                } catch (InterruptedException ex) {
                    com.gmt2001.Console.err.logStackTrace(ex);
                }
            }

            try {
                completed.take();
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }

        /**
         * Method that handles sending messages to Twitch from our queue.
         */
        @Override
        public void run() {
            while (!isKilled) {
                int id = 0;
                boolean blocking = false;

                try {
                    // Get the next message in the queue.
                    WQStatement statement = queue.take();

                    id = statement.id;
                    blocking = statement.blocking;

                    if (!statement.autoCommit) {
                        statement.connection.setAutoCommit(false);
                    }

                    if (statement.statement != null) {
                        statement.statement.executeBatch();
                        statement.statement.clearBatch();

                        statement.statement.close();
                    }

                    if (!statement.autoCommit) {
                        statement.connection.commit();
                        statement.connection.setAutoCommit(true);
                    }

                    if (statement.shouldClose) {
                        statement.connection.close();
                    }

                    if (blocking) {
                        completed.add(statement);
                    }
                } catch (InterruptedException | SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);

                    if (blocking) {
                        completed.add(new WQStatement(id, null, null));
                    }
                }
            }
        }

        /**
         * Method that kills this instance.
         */
        public void kill() {
            this.isKilled = true;
        }
    }
}
