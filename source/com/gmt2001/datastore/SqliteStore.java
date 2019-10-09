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
import org.apache.commons.io.FileUtils;
import org.sqlite.SQLiteConfig;
import org.sqlite.javax.SQLiteConnectionPoolDataSource;

/**
 *
 * @author gmt2001
 */
public class SqliteStore extends DataStore {

    private static final int MAX_CONNECTIONS = 30;
    private static SqliteStore instance;
    private final MiniConnectionPoolManager poolMgr;

    public static SqliteStore instance() {
        return instance("");
    }

    public static synchronized SqliteStore instance(String configStr) {
        if (instance == null) {
            instance = new SqliteStore(configStr);
        }

        return instance;
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

    private String validateFname(String fName) {
        fName = fName.replaceAll("([^a-zA-Z0-9_-])", "_");

        return fName;
    }

    private Connection GetConnection() {
        try {
            return poolMgr.getConnection();
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return null;
    }

    @Override
    public void AddFile(String fName) {
        try (Connection connection = GetConnection()) {
            AddFile(connection, fName);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public void AddFile(Connection connection, String fName) {
        fName = validateFname(fName);

        if (!FileExists(connection, fName)) {
            try (Statement statement = connection.createStatement()) {
                statement.addBatch("CREATE TABLE IF NOT EXISTS phantombot_" + fName + " (section string, variable string, value string);");
                statement.addBatch("CREATE UNIQUE INDEX IF NOT EXISTS " + fName + "_idx on phantombot_" + fName + " (section, variable);");
                statement.executeBatch();
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RemoveKey(String fName, String section, String key) {
        try (Connection connection = GetConnection()) {
            fName = validateFname(fName);

            if (FileExists(connection, fName)) {
                try (PreparedStatement statement = connection.prepareStatement("DELETE FROM phantombot_" + fName + " WHERE section=? AND variable=?;")) {
                    statement.setString(1, section);
                    statement.setString(2, key);
                    statement.execute();
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void RemoveSection(String fName, String section) {
        try (Connection connection = GetConnection()) {
            fName = validateFname(fName);

            if (FileExists(connection, fName)) {
                try (PreparedStatement statement = connection.prepareStatement("DELETE FROM phantombot_" + fName + " WHERE section=?;")) {
                    statement.setString(1, section);
                    statement.execute();
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void RemoveFile(String fName) {
        try (Connection connection = GetConnection()) {
            fName = validateFname(fName);

            if (FileExists(connection, fName)) {
                try (Statement statement = connection.createStatement()) {
                    statement.execute("DROP TABLE phantombot_" + fName + ";");
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void RenameFile(String fNameSource, String fNameDest) {
        try (Connection connection = GetConnection()) {
            fNameSource = validateFname(fNameSource);
            fNameDest = validateFname(fNameDest);

            if (!FileExists(connection, fNameSource)) {
                return;
            }

            try (Statement statement = connection.createStatement()) {

                if (FileExists(connection, fNameDest)) {
                    statement.execute("DROP TABLE phantombot_" + fNameDest + ";");
                }

                statement.execute("ALTER TABLE phantombot_" + fNameSource + " RENAME TO phantombot_" + fNameDest + ";");
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public boolean FileExists(String fName) {
        boolean out = false;

        try (Connection connection = GetConnection()) {
            out = FileExists(connection, fName);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

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
        String[] out = new String[]{};

        try (Connection connection = GetConnection()) {
            try (Statement statement = connection.createStatement()) {
                try (ResultSet rs = statement.executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'phantombot_%';")) {

                    ArrayList<String> s = new ArrayList<>();

                    while (rs.next()) {
                        s.add(rs.getString("name").substring(11));
                    }

                    out = s.toArray(new String[s.size()]);
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return out;
    }

    @Override
    public String[] GetCategoryList(String fName) {
        String[] out = new String[]{};

        try (Connection connection = GetConnection()) {
            fName = validateFname(fName);

            if (FileExists(connection, fName)) {
                try (Statement statement = connection.createStatement()) {
                    try (ResultSet rs = statement.executeQuery("SELECT section FROM phantombot_" + fName + " GROUP BY section;")) {

                        ArrayList<String> s = new ArrayList<>();

                        while (rs.next()) {
                            s.add(rs.getString("section"));
                        }

                        out = s.toArray(new String[s.size()]);
                    }
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return out;
    }

    @Override
    public String[] GetKeyList(String fName, String section) {
        String[] out = new String[]{};

        try (Connection connection = GetConnection()) {
            fName = validateFname(fName);

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
                    }
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return out;
    }

    @Override
    public KeyValue[] GetKeyValueList(String fName, String section) {
        KeyValue[] out = new KeyValue[]{};

        try (Connection connection = GetConnection()) {
            fName = validateFname(fName);

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
                    }
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
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
        String[] out = new String[]{};

        try (Connection connection = GetConnection()) {
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
                    try (PreparedStatement statement = connection.prepareStatement(statementStr)) {
                        statement.setString(1, section);

                        try (ResultSet rs = statement.executeQuery()) {

                            ArrayList<String> s = new ArrayList<>();

                            while (rs.next()) {
                                s.add(rs.getString("variable"));
                            }

                            out = s.toArray(new String[s.size()]);
                        }
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
                    }
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
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
        String[] out = new String[]{};

        try (Connection connection = GetConnection()) {
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

                    try (PreparedStatement statement = connection.prepareStatement(statementStr)) {
                        statement.setString(1, section);

                        try (ResultSet rs = statement.executeQuery()) {

                            ArrayList<String> s = new ArrayList<>();

                            while (rs.next()) {
                                s.add(rs.getString("variable"));
                            }

                            out = s.toArray(new String[s.size()]);
                        }
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
                    }
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return out;
    }

    @Override
    public String[] GetKeysByLikeValues(String fName, String section, String search) {
        String[] out = new String[]{};

        try (Connection connection = GetConnection()) {
            fName = validateFname(fName);

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
                    }
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return out;
    }

    @Override
    public String[] GetKeysByLikeKeys(String fName, String section, String search) {
        String[] out = new String[]{};

        try (Connection connection = GetConnection()) {
            fName = validateFname(fName);

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
                    }
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return out;
    }

    @Override
    public String[] GetKeysByLikeKeysOrder(String fName, String section, String search, String order, String limit, String offset) {
        String[] out = new String[]{};

        try (Connection connection = GetConnection()) {
            fName = validateFname(fName);
            order = sanitizeOrder(order);
            limit = sanitizeLimit(limit);
            offset = sanitizeOffset(offset);

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
                    }
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return out;
    }

    @Override
    public boolean HasKey(String fName, String section, String key) {
        boolean out = false;

        try (Connection connection = GetConnection()) {
            fName = validateFname(fName);

            if (!FileExists(connection, fName)) {
                return false;
            }

            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE section=? AND variable=?;")) {
                    statement.setString(1, section);
                    statement.setString(2, key);

                    try (ResultSet rs = statement.executeQuery()) {

                        if (rs.next()) {
                            out = true;
                        }
                    }
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE variable=?;")) {
                    statement.setString(1, key);

                    try (ResultSet rs = statement.executeQuery()) {

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
    }

    @Override
    public String GetKeyByValue(String fName, String section, String value) {
        String result = null;

        try (Connection connection = GetConnection()) {
            fName = validateFname(fName);

            if (!FileExists(connection, fName)) {
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
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE value=?;")) {
                    statement.setString(1, value);

                    try (ResultSet rs = statement.executeQuery()) {

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

    }

    @Override
    public String GetString(String fName, String section, String key) {
        String result = null;

        try (Connection connection = GetConnection()) {
            fName = validateFname(fName);

            if (!FileExists(connection, fName)) {
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
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE variable=?;")) {
                    statement.setString(1, key);

                    try (ResultSet rs = statement.executeQuery()) {

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
    }

    @Override
    public void SetBatchString(String fName, String section, String[] keys, String[] values) {
        try (Connection connection = GetConnection()) {

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

            if (insertMap.size() > 0) {
                try (PreparedStatement statement = connection.prepareStatement("INSERT INTO phantombot_" + fName + " (value, section, variable) values(?, ?, ?);")) {
                    for (String key : insertMap.keySet()) {
                        statement.setString(1, insertMap.get(key));
                        statement.setString(2, section);
                        statement.setString(3, key);
                        statement.addBatch();
                    }

                    statement.executeBatch();
                }
            }

            if (updateMap.size() > 0) {
                try (PreparedStatement statement = connection.prepareStatement("UPDATE phantombot_" + fName + " SET value=? WHERE section=? and variable=?;")) {
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
    }

    @Override
    public void SetString(String fName, String section, String key, String value) {
        try (Connection connection = GetConnection()) {

            fName = validateFname(fName);

            AddFile(connection, fName);

            if (HasKey(fName, section, key)) {
                try (PreparedStatement statement = connection.prepareStatement("UPDATE phantombot_" + fName + " SET value=? WHERE section=? AND variable=?;")) {
                    statement.setString(1, value);
                    statement.setString(2, section);
                    statement.setString(3, key);
                    statement.execute();
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("INSERT INTO phantombot_" + fName + " values(?, ?, ?);")) {
                    statement.setString(1, section);
                    statement.setString(2, key);
                    statement.setString(3, value);
                    statement.execute();
                }
            }

        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void IncreaseBatchString(String fName, String section, String[] keys, String value) {
        try (Connection connection = GetConnection()) {
            fName = validateFname(fName);

            AddFile(connection, fName);

            connection.setAutoCommit(false);

            try (Statement statement = connection.createStatement()) {
                statement.addBatch("UPDATE phantombot_" + fName + " SET value = CAST(value AS INTEGER) + " + value + " WHERE section = '" + section + "' AND variable IN ('" + String.join("', '", keys) + "');");

                StringBuilder sb = new StringBuilder(69 + fName.length() + (keys.length * (keys[0].length() + 17 + section.length() + value.length())));

                sb.append("INSERT OR IGNORE INTO phantombot_")
                        .append(fName)
                        .append(" (section, variable, value) VALUES ");

                boolean first = true;
                for (String k : keys) {
                    if (!first) {
                        sb.append(",");
                    }

                    first = false;
                    sb.append("('")
                            .append(section)
                            .append("', '")
                            .append(k)
                            .append("', ")
                            .append(value)
                            .append(")");
                }

                sb.append(";");

                statement.addBatch(sb.toString());
                statement.executeBatch();
            }

            connection.commit();
            connection.setAutoCommit(true);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void CreateIndexes() {
        try (Connection connection = GetConnection()) {
            String[] tableNames = GetFileList();
            try (Statement statement = connection.createStatement()) {
                for (String tableName : tableNames) {
                    tableName = validateFname(tableName);
                    statement.execute("CREATE UNIQUE INDEX IF NOT EXISTS " + tableName + "_idx on phantombot_" + tableName + " (section, variable);");
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void DropIndexes() {
        try (Connection connection = GetConnection()) {
            String[] tableNames = GetFileList();
            try (Statement statement = connection.createStatement()) {
                for (String tableName : tableNames) {
                    tableName = validateFname(tableName);
                    statement.execute("DROP INDEX IF EXISTS " + tableName + "_idx");
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public boolean canBackup() {
        return true;
    }

    @Override
    public void backupDB(String filename) {
        try (Connection connection = GetConnection()) {
            if (!new File("./dbbackup").exists()) {
                new File("./dbbackup").mkdirs();
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute("backup to ./dbbackup/" + filename);
                com.gmt2001.Console.debug.println("Backed up SQLite3 DB to ./dbbackup/" + filename);
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void dispose() {
        super.dispose();

        try {
            poolMgr.dispose();
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }
}
