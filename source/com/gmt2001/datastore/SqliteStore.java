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

import java.io.File;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.BlockingDeque;
import java.util.concurrent.LinkedBlockingDeque;
import org.apache.commons.io.FileUtils;
import org.sqlite.SQLiteConfig;

/**
 *
 * @author gmt2001
 */
public class SqliteStore extends DataStore {

    private String dbname = "config/phantombot.db";
    private int cache_size = -50000;
    private boolean safe_write = false;
    private boolean journal = true;
    private static final SqliteStore instance = new SqliteStore();
    private static final WriteQueue writequeue = new WriteQueue();

    public static SqliteStore instance() {
        return instance;
    }

    private SqliteStore() {
        try {
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        Object o[] = LoadConfigReal("");

        dbname = (String) o[0];
        cache_size = (int) o[1];
        safe_write = (boolean) o[2];
        journal = (boolean) o[3];
    }

    private String sanitizeOrder(String order) {
        if (order.equalsIgnoreCase("ASC")) {
            return "ASC";
        }
        return "DESC";
    }

    private String sanitizeLimit(String limit) {
        try {
            int intValue = Integer.parseInt(limit);
            return String.valueOf(intValue);
        } catch (NumberFormatException ex) {
            return String.valueOf(Integer.MAX_VALUE);
        } catch (NullPointerException ex) {
            return String.valueOf(Integer.MAX_VALUE);
        } catch (Exception ex) {
            return String.valueOf(Integer.MAX_VALUE);
        }
    }

    private String sanitizeOffset(String offset) {
        try {
            int intValue = Integer.parseInt(offset);
            return String.valueOf(intValue);
        } catch (NumberFormatException ex) {
            return "0";
        } catch (NullPointerException ex) {
            return "0";
        } catch (Exception ex) {
            return "0";
        }
    }

    @Override
    public void LoadConfig(String configStr) {
        Object o[] = LoadConfigReal(configStr);

        dbname = (String) o[0];
        cache_size = (int) o[1];
        safe_write = (boolean) o[2];
        journal = (boolean) o[3];
    }

    private static Object[] LoadConfigReal(String configStr) {
        if (configStr.isEmpty()) {
            configStr = "sqlite3config.txt";
        }

        String dbname = "config/phantombot.db";
        int cache_size = -50000;
        boolean safe_write = false;
        boolean journal = true;
        boolean use_indexes = false;

        try {
            File f = new File("./" + configStr);

            if (f.exists()) {
                String data = FileUtils.readFileToString(new File("./" + configStr));
                String[] lines = data.replaceAll("\\r", "").split("\\n");

                for (String line : lines) {
                    if (line.startsWith("dbname=") && line.length() > 8) {
                        dbname = line.substring(7);
                    }
                    if (line.startsWith("cachesize=") && line.length() > 11) {
                        cache_size = Integer.parseInt(line.substring(10));
                    }
                    if (line.startsWith("safewrite=") && line.length() > 11) {
                        safe_write = line.substring(10).equalsIgnoreCase("true") || line.substring(10).equalsIgnoreCase("1");
                    }
                    if (line.startsWith("journal=") && line.length() > 9) {
                        journal = line.substring(8).equalsIgnoreCase("true");
                    }
                    if (line.startsWith("useindex=") && line.length() > 10) {
                        use_indexes = line.substring(9).equalsIgnoreCase("true");
                    }
                }
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return new Object[] {
                   dbname, cache_size, safe_write, journal, use_indexes
               };
    }

    private static Connection CreateConnection(String dbname, int cache_size, boolean safe_write, boolean journal, boolean autocommit) {
        Connection connection = null;
        
        if (!writequeue.isRunning) {
            writequeue.start();
        }

        try {
            SQLiteConfig config = new SQLiteConfig();
            config.setCacheSize(cache_size);
            config.setSynchronous(safe_write ? SQLiteConfig.SynchronousMode.FULL : SQLiteConfig.SynchronousMode.NORMAL);
            config.setTempStore(SQLiteConfig.TempStore.MEMORY);
            config.setJournalMode(journal ? SQLiteConfig.JournalMode.WAL : SQLiteConfig.JournalMode.OFF);
            config.setBusyTimeout(10000);
            connection = DriverManager.getConnection("jdbc:sqlite:" + dbname.replaceAll("\\\\", "/"), config.toProperties());
            connection.setAutoCommit(autocommit);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return connection;
    }

    public void CloseConnection(Connection connection) {
        try {
            if (connection != null) {
                connection.close();
                connection = null;
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    protected void finalize() throws Throwable {
        super.finalize();

        writequeue.kill();
    }

    private String validateFname(String fName) {
        fName = fName.replaceAll("([^a-zA-Z0-9_-])", "_");

        return fName;
    }

    private Connection GetConnection() {
        return CreateConnection(dbname, cache_size, safe_write, journal, true);
    }

    @Override
    public void AddFile(String fName) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        if (!FileExists(fName)) {
            try {
                Statement statement = connection.createStatement();
                statement.addBatch("CREATE TABLE IF NOT EXISTS phantombot_" + fName + " (section string, variable string, value string);");
                statement.addBatch("CREATE UNIQUE INDEX IF NOT EXISTS " + fName + "_idx on phantombot_" + fName + " (section, variable);");
                writequeue.block(statement);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RemoveKey(String fName, String section, String key) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            try {
                PreparedStatement statement = connection.prepareStatement("DELETE FROM phantombot_" + fName + " WHERE section=? AND variable=?;");
                statement.setString(1, section);
                statement.setString(2, key);
                statement.addBatch();
                writequeue.enqueue(statement);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RemoveSection(String fName, String section) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            try {
                PreparedStatement statement = connection.prepareStatement("DELETE FROM phantombot_" + fName + " WHERE section=?;");
                statement.setString(1, section);
                statement.addBatch();
                writequeue.enqueue(statement);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RemoveFile(String fName) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            try {
                Statement statement = connection.createStatement();
                statement.addBatch("DROP TABLE phantombot_" + fName + ";");
                writequeue.block    (statement);
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

        if (!FileExists(fNameSource)) {
            return;
        }

        RemoveFile(fNameDest);

        try {
            Statement statement = connection.createStatement();
            statement.addBatch("ALTER TABLE phantombot_" + fNameSource + " RENAME TO phantombot_" + fNameDest + ";");
            writequeue.block(statement);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public boolean FileExists(String fName) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        try (Statement statement = connection.createStatement()) {
            try (ResultSet rs = statement.executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name='phantombot_" + fName + "';")) {

                return rs.next();
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return false;
    }

    @Override
    public String[] GetFileList() {
        Connection connection = GetConnection();

        try (Statement statement = connection.createStatement()) {
            try (ResultSet rs = statement.executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'phantombot_%';")) {

                ArrayList<String> s = new ArrayList<String>();

                while (rs.next()) {
                    s.add(rs.getString("name").substring(11));
                }

                return s.toArray(new String[s.size()]);
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return new String[] {
               };
    }

    @Override
    public String[] GetCategoryList(String fName) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            try (Statement statement = connection.createStatement()) {
                try (ResultSet rs = statement.executeQuery("SELECT section FROM phantombot_" + fName + " GROUP BY section;")) {

                    ArrayList<String> s = new ArrayList<String>();

                    while (rs.next()) {
                        s.add(rs.getString("section"));
                    }

                    return s.toArray(new String[s.size()]);
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        return new String[] {
               };
    }

    @Override
    public String[] GetKeyList(String fName, String section) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=?;")) {
                    statement.setString(1, section);

                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<String>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }

                        return s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + ";")) {
                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<String>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }

                        return s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            }
        }

        return new String[] {
               };
    }

    @Override
    public KeyValue[] GetKeyValueList(String fName, String section) {
        Connection connection = GetConnection();
        fName = validateFname(fName);

        if (FileExists(fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable, value FROM phantombot_" + fName + " WHERE section=?;")) {
                    statement.setString(1, section);

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<KeyValue> s = new ArrayList<KeyValue>();

                        while (rs.next()) {
                            s.add(new KeyValue(rs.getString("variable"), rs.getString("value")));
                        }

                        return s.toArray(new KeyValue[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable, value FROM phantombot_" + fName + ";")) {
                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<KeyValue> s = new ArrayList<KeyValue>();

                        while (rs.next()) {
                            s.add(new KeyValue(rs.getString("variable"), rs.getString("value")));
                        }

                        return s.toArray(new KeyValue[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            }
        }

        return new KeyValue[] {};
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

        if (FileExists(fName)) {
            if (section != null) {
                if (isNumber) {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY CAST(variable as INTEGER) COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                } else {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY variable COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                }
                try (PreparedStatement statement = connection.prepareStatement(statementStr)) {
                    statement.setString(1, section);

                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<String>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }

                        return s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            } else {
                if (isNumber) {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY CAST(variable as INTEGER) COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                } else {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY variable COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                }
                try (PreparedStatement statement = connection.prepareStatement(statementStr)) {
                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<String>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }

                        return s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            }
        }

        return new String[] {
               };
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

        if (FileExists(fName)) {
            if (section != null) {
                if (isNumber) {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY CAST(value as INTEGER) COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                } else {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY value COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                }

                try (PreparedStatement statement = connection.prepareStatement(statementStr)) {
                    statement.setString(1, section);

                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<String>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }

                        return s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            } else {
                if (isNumber) {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY CAST(value as INTEGER) COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                } else {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY value COLLATE NOCASE " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                }
                try (PreparedStatement statement = connection.prepareStatement(statementStr)) {
                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<String>();

                        while (rs.next()) {
                            s.add(rs.getString("variable"));
                        }

                        return s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            }
        }

        return new String[] {
               };
    }

    @Override
    public String[] GetKeysByLikeValues(String fName, String section, String search) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND value LIKE ?;")) {
                    statement.setString(1, section);
                    statement.setString(2, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<String>();

                        while(rs.next()) {
                            s.add(rs.getString("variable"));
                        }
                        return s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE value LIKE ?;")) {
                    statement.setString(1, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<String>();

                        while(rs.next()) {
                            s.add(rs.getString("variable"));
                        }
                        return s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } catch (Exception ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            }
        }

        return new String[] {
               };
    }

    @Override
    public String[] GetKeysByLikeKeys(String fName, String section, String search) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND variable LIKE ?;")) {
                    statement.setString(1, section);
                    statement.setString(2, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<String>();

                        while(rs.next()) {
                            s.add(rs.getString("variable"));
                        }
                        return s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE variable LIKE ?;")) {
                    statement.setString(1, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<String>();

                        while(rs.next()) {
                            s.add(rs.getString("variable"));
                        }
                        return s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } catch (Exception ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            }
        }

        return new String[] {
               };
    }

    @Override
    public String[] GetKeysByLikeKeysOrder(String fName, String section, String search, String order, String limit, String offset) {
        Connection connection = GetConnection();

        fName = validateFname(fName);
        order = sanitizeOrder(order);
        limit = sanitizeLimit(limit);
        offset = sanitizeOffset(offset);

        if (FileExists(fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND variable LIKE ? ORDER BY variable " + order + " LIMIT " + limit + " OFFSET " + offset + ";")) {
                    statement.setString(1, section);
                    statement.setString(2, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<String>();

                        while(rs.next()) {
                            s.add(rs.getString("variable"));
                        }
                        return s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE variable LIKE ? ORDER BY variable " + order + " LIMIT " + limit + " OFFSET " + offset + ";")) {
                    statement.setString(1, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<String>();

                        while(rs.next()) {
                            s.add(rs.getString("variable"));
                        }
                        return s.toArray(new String[s.size()]);
                    }
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                } catch (Exception ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            }
        }

        return new String[] {
               };
    }

    @Override
    public boolean HasKey(String fName, String section, String key) {
        Connection connection = GetConnection();

        fName = validateFname(fName);

        if (!FileExists(fName)) {
            return false;
        }

        if (section != null) {
            try (PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE section=? AND variable=?;")) {
                statement.setString(1, section);
                statement.setString(2, key);

                try (ResultSet rs = statement.executeQuery()) {

                    if (rs.next()) {
                        return true;
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } else {
            try (PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE variable=?;")) {
                statement.setString(1, key);

                try (ResultSet rs = statement.executeQuery()) {

                    if (rs.next()) {
                        return true;
                    }
                }
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        return false;
    }

    @Override
    public String GetKeyByValue(String fName, String section, String value) {
        Connection connection = GetConnection();

        String result = null;

        fName = validateFname(fName);

        if (!FileExists(fName)) {
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
            }
        }

        return result;

    }

    @Override
    public String GetString(String fName, String section, String key) {
        Connection connection = GetConnection();

        String result = null;

        fName = validateFname(fName);

        if (!FileExists(fName)) {
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
        Map<String, String> insertMap = new HashMap<String, String>();
        Map<String, String> updateMap = new HashMap<String, String>();

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
                
                writequeue.enqueue(statement, connection, true, false);
            }
            if (updateMap.size() > 0) {
                PreparedStatement statement = connection.prepareStatement("UPDATE phantombot_" + fName + " SET value=? WHERE section=? and variable=?;");
                for (String key : updateMap.keySet()) {
                    statement.setString(1, updateMap.get(key));
                    statement.setString(2, section);
                    statement.setString(3, key);
                    statement.addBatch();
                }
                
                writequeue.enqueue(statement, connection, true, false);
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
                writequeue.enqueue(statement);
            } else {
                PreparedStatement statement = connection.prepareStatement("INSERT INTO phantombot_" + fName + " values(?, ?, ?);");
                statement.setString(1, section);
                statement.setString(2, key);
                statement.setString(3, value);
                statement.addBatch();
                writequeue.enqueue(statement);
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
            writequeue.enqueue(statement);

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
            writequeue.enqueue(statement);
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
            writequeue.enqueue(statement);
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
                writequeue.enqueue(statement);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
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
                writequeue.enqueue(statement);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

    }

    @Override
    public void backupSQLite3(String filename) {
        Connection connection = GetConnection();

        if (!new File ("./dbbackup").exists()) new File ("./dbbackup").mkdirs();

        try {
            Statement statement = connection.createStatement();
            statement.execute("backup to ./dbbackup/" + filename);
            com.gmt2001.Console.debug.println("Backed up SQLite3 DB to ./dbbackup/" + filename);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }
    
    private static class WQStatement {
        public int id;
        public Statement statement;
        public Connection connection = null;
        public boolean isBatch = false;
        public boolean autoCommit = true;
        public boolean blocking = false;
        
        public WQStatement(int id, Statement statement) {
            this.id = id;
            this.statement = statement;
        }
        
        public WQStatement(int id, Statement statement, Connection connection, boolean isBatch, boolean autoCommit) {
            this.id = id;
            this.statement = statement;
            this.connection = connection;
            this.isBatch = isBatch;
            this.autoCommit = autoCommit;
        }
        
        public WQStatement(int id, Statement statement, Connection connection, boolean isBatch, boolean autoCommit, boolean blocking) {
            this.id = id;
            this.statement = statement;
            this.connection = connection;
            this.isBatch = isBatch;
            this.autoCommit = autoCommit;
            this.blocking = blocking;
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
        public void enqueue(Statement statement) {
            enqueue(statement, null, false, true);
        }

        /**
         * Method that adds a statement to the end of the queue.
         *
         * @param {PreparedStatement} statement
         * @param {boolean} isBatch
         * @param {boolean} autoCommit
         */
        public void enqueue(Statement statement, Connection connection, boolean isBatch, boolean autoCommit) {
            queue.add(new WQStatement(nextID++, statement, connection, isBatch, autoCommit));
            
            if (nextID >= Integer.MAX_VALUE - 5) {
                nextID = 0;
            }
        }
        
        public void block(Statement statement) {
            block(statement, null, false, true);
        }
        
        @SuppressWarnings("SleepWhileInLoop")
        public void block(Statement statement, Connection connection, boolean isBatch, boolean autoCommit) {
            queue.add(new WQStatement(nextID++, statement, connection, isBatch, autoCommit, true));
            
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
                    
                    if (statement.connection != null && !statement.autoCommit) {
                        statement.connection.setAutoCommit(false);
                    }
                    
                    statement.statement.executeBatch();
                    statement.statement.clearBatch();
                    
                    statement.statement.close();
                    
                    if (statement.connection != null && !statement.autoCommit) {
                        statement.connection.commit();
                        statement.connection.setAutoCommit(true);
                    }
                    
                    if (blocking) {
                        completed.add(statement);
                    }
                } catch (InterruptedException | SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                    
                    if (blocking) {
                        completed.add(new WQStatement(id, null));
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
