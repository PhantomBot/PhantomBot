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
    private Connection connection = null;
    private static final SqliteStore instance = new SqliteStore();
    private int autoCommitCtr = 0;
    private boolean use_indexes = false;

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
        use_indexes = (boolean) o[4];
        connection = (Connection) o[5];
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
        use_indexes = (boolean) o[4];
        connection = (Connection) o[5];
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
        Connection connection = null;

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

                connection = CreateConnection(dbname, cache_size, safe_write, journal, true);
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return new Object[] {
                   dbname, cache_size, safe_write, journal, use_indexes, connection
               };
    }

    private static Connection CreateConnection(String dbname, int cache_size, boolean safe_write, boolean journal, boolean autocommit) {
        Connection connection = null;

        try {
            SQLiteConfig config = new SQLiteConfig();
            config.setCacheSize(cache_size);
            config.setSynchronous(safe_write ? SQLiteConfig.SynchronousMode.FULL : SQLiteConfig.SynchronousMode.NORMAL);
            config.setTempStore(SQLiteConfig.TempStore.MEMORY);
            config.setJournalMode(journal ? SQLiteConfig.JournalMode.WAL : SQLiteConfig.JournalMode.OFF);
            connection = DriverManager.getConnection("jdbc:sqlite:" + dbname.replaceAll("\\\\", "/"), config.toProperties());
            connection.setAutoCommit(autocommit);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return connection;
    }

    @Override
    public void CloseConnection() {
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
    @SuppressWarnings("FinalizeDeclaration")
    protected void finalize() throws Throwable {
        super.finalize();

        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    private String validateFname(String fName) {
        fName = fName.replaceAll("([^a-zA-Z0-9_-])", "_");

        return fName;
    }

    private void CheckConnection() {
        try {
            if (connection == null || connection.isClosed() || !connection.isValid(10)) {
                connection = CreateConnection(dbname, cache_size, safe_write, journal, getAutoCommitCtr() == 0);
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void AddFile(String fName) {
        // "FileExists" already checks the connections.
        // CheckConnection();

        fName = validateFname(fName);

        if (!FileExists(fName)) {
            try (Statement statement = connection.createStatement()) {
                statement.setQueryTimeout(10);

                statement.executeUpdate("CREATE TABLE phantombot_" + fName + " (section string, variable string, value string);");
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            try (PreparedStatement statement = connection.prepareStatement("CREATE UNIQUE INDEX IF NOT EXISTS " + fName + "_idx on phantombot_" + fName + " (section, variable);")) {
                statement.execute();
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RemoveKey(String fName, String section, String key) {
        // "FileExists" already checks the connections.
        // CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            try (PreparedStatement statement = connection.prepareStatement("DELETE FROM phantombot_" + fName + " WHERE section=? AND variable=?;")) {
                statement.setQueryTimeout(10);
                statement.setString(1, section);
                statement.setString(2, key);
                statement.executeUpdate();
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RemoveSection(String fName, String section) {
        // "FileExists" already checks the connections.
        // CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            try (PreparedStatement statement = connection.prepareStatement("DELETE FROM phantombot_" + fName + " WHERE section=?;")) {
                statement.setQueryTimeout(10);
                statement.setString(1, section);
                statement.executeUpdate();
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RemoveFile(String fName) {
        // "FileExists" already checks the connections.
        // CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            try (Statement statement = connection.createStatement()) {
                statement.setQueryTimeout(10);

                statement.executeUpdate("DROP TABLE phantombot_" + fName + ";");
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RenameFile(String fNameSource, String fNameDest) {
        // "FileExists" already checks the connections.
        // CheckConnection();

        fNameSource = validateFname(fNameSource);
        fNameDest = validateFname(fNameDest);

        if (!FileExists(fNameSource)) {
            return;
        }

        RemoveFile(fNameDest);

        try (Statement statement = connection.createStatement()) {
            statement.setQueryTimeout(10);
            statement.executeUpdate("ALTER TABLE phantombot_" + fNameSource + " RENAME TO phantombot_" + fNameDest + ";");
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public boolean FileExists(String fName) {
        CheckConnection();

        fName = validateFname(fName);

        try (Statement statement = connection.createStatement()) {
            statement.setQueryTimeout(10);

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
        CheckConnection();

        try (Statement statement = connection.createStatement()) {
            statement.setQueryTimeout(10);

            try (ResultSet rs = statement.executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'phantombot_%';")) {

                ArrayList<String> s = new ArrayList<>();

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
        // "FileExists" already checks the connections.
        // CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            try (Statement statement = connection.createStatement()) {
                statement.setQueryTimeout(10);

                try (ResultSet rs = statement.executeQuery("SELECT section FROM phantombot_" + fName + " GROUP BY section;")) {

                    ArrayList<String> s = new ArrayList<>();

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
        // "FileExists" already checks the connections.
        // CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=?;")) {
                    statement.setQueryTimeout(10);
                    statement.setString(1, section);

                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<>();

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
                    statement.setQueryTimeout(10);

                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<>();

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
        fName = validateFname(fName);

        if (FileExists(fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable, value FROM phantombot_" + fName + " WHERE section=?;")) {
                    statement.setQueryTimeout(10);
                    statement.setString(1, section);

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<KeyValue> s = new ArrayList<>();

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
                    statement.setQueryTimeout(10);

                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<KeyValue> s = new ArrayList<>();

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
                    statement.setQueryTimeout(10);
                    statement.setString(1, section);

                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<>();

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
                    statement.setQueryTimeout(10);

                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<>();

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
                    statement.setQueryTimeout(10);
                    statement.setString(1, section);

                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<>();

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
                    statement.setQueryTimeout(10);

                    try (ResultSet rs = statement.executeQuery()) {

                        ArrayList<String> s = new ArrayList<>();

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
        // "FileExists" already checks the connections.
        // CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND value LIKE ?;")) {
                    statement.setQueryTimeout(10);
                    statement.setString(1, section);
                    statement.setString(2, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<>();

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
                    statement.setQueryTimeout(10);
                    statement.setString(1, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<>();

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
        // "FileExists" already checks the connections.
        // CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND variable LIKE ?;")) {
                    statement.setQueryTimeout(10);
                    statement.setString(1, section);
                    statement.setString(2, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<>();

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
                    statement.setQueryTimeout(10);
                    statement.setString(1, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<>();

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
        // "FileExists" already checks the connections.
        // CheckConnection();

        fName = validateFname(fName);
        order = sanitizeOrder(order);
        limit = sanitizeLimit(limit);
        offset = sanitizeOffset(offset);

        if (FileExists(fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND variable LIKE ? ORDER BY variable " + order + " LIMIT " + limit + " OFFSET " + offset + ";")) {
                    statement.setQueryTimeout(10);
                    statement.setString(1, section);
                    statement.setString(2, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<>();

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
                    statement.setQueryTimeout(10);
                    statement.setString(1, "%" + search + "%");

                    try (ResultSet rs = statement.executeQuery()) {
                        ArrayList<String> s = new ArrayList<>();

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
        // "FileExists" already checks the connections.
        // CheckConnection();

        fName = validateFname(fName);

        if (!FileExists(fName)) {
            return false;
        }

        if (section != null) {
            try (PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE section=? AND variable=?;")) {
                statement.setQueryTimeout(10);
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
                statement.setQueryTimeout(10);
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
        // "FileExists" already checks the connections.
        // CheckConnection();

        String result = null;

        fName = validateFname(fName);

        if (!FileExists(fName)) {
            return result;
        }

        if (section != null) {
            try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND value=?;")) {
                statement.setQueryTimeout(10);
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
                statement.setQueryTimeout(10);
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
        // "FileExists" already checks the connections.
        // CheckConnection();

        String result = null;

        fName = validateFname(fName);

        if (!FileExists(fName)) {
            return result;
        }

        if (section != null) {
            try (PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE section=? AND variable=?;")) {
                statement.setQueryTimeout(10);
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
                statement.setQueryTimeout(10);
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
        // "AddFile" already checks the connections.
        // CheckConnection();

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

        setAutoCommit(false);

        try {
            if (insertMap.size() > 0) {
                int idx = 0;
                try (PreparedStatement statement = connection.prepareStatement("INSERT INTO phantombot_" + fName + " (value, section, variable) values(?, ?, ?);")) {
                    statement.setQueryTimeout(10);
                    for (String key : insertMap.keySet()) {
                        statement.setString(1, insertMap.get(key));
                        statement.setString(2, section);
                        statement.setString(3, key);
                        statement.addBatch();

                        if (idx++ % 500 == 0) {
                            statement.executeBatch();
                            statement.clearBatch();
                        }
                    }
                    statement.executeBatch();
                    statement.clearBatch();
                    connection.commit();
                }
            }
            if (updateMap.size() > 0) {
                int idx = 0;
                try (PreparedStatement statement = connection.prepareStatement("UPDATE phantombot_" + fName + " SET value=? WHERE section=? and variable=?;")) {
                    statement.setQueryTimeout(10);
                    for (String key : updateMap.keySet()) {
                        statement.setString(1, updateMap.get(key));
                        statement.setString(2, section);
                        statement.setString(3, key);
                        statement.addBatch();

                        if (idx++ % 500 == 0) {
                            statement.executeBatch();
                            statement.clearBatch();
                        }
                    }
                    statement.executeBatch();
                    statement.clearBatch();
                    connection.commit();
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.println(ex);
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        setAutoCommit(true);
    }

    @Override
    public void SetString(String fName, String section, String key, String value) {
        // "AddFile" already checks the connections.
        // CheckConnection();

        fName = validateFname(fName);

        AddFile(fName);

        try {
            if (HasKey(fName, section, key)) {
                try (PreparedStatement statement = connection.prepareStatement("UPDATE phantombot_" + fName + " SET value=? WHERE section=? AND variable=?;")) {
                    statement.setQueryTimeout(10);
                    statement.setString(1, value);
                    statement.setString(2, section);
                    statement.setString(3, key);
                    statement.executeUpdate();
                }
            } else {
                try (PreparedStatement statement = connection.prepareStatement("INSERT INTO phantombot_" + fName + " values(?, ?, ?);")) {
                    statement.setQueryTimeout(10);
                    statement.setString(1, section);
                    statement.setString(2, key);
                    statement.setString(3, value);
                    statement.executeUpdate();
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void IncreaseBatchString(String fName, String section, String[] keys, String value) {
        fName = validateFname(fName);

        AddFile(fName);

        try {
            Statement statement = connection.createStatement();
            statement.addBatch("UPDATE phantombot_" + fName + " SET value = CAST(value AS INTEGER) + " + value + " WHERE section = '" + section + "' AND variable IN ('" + String.join("', '", keys) + "');");

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

            statement.addBatch(sb.toString());
            statement.executeBatch();
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void InsertString(String fName, String section, String key, String value) {
        // "AddFile" already checks the connections.
        // CheckConnection();

        fName = validateFname(fName);

        AddFile(fName);

        try {
            try (PreparedStatement statement = connection.prepareStatement("INSERT INTO phantombot_" + fName + " values(?, ?, ?);")) {
                statement.setQueryTimeout(10);
                statement.setString(1, section);
                statement.setString(2, key);
                statement.setString(3, value);
                statement.executeUpdate();
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void CreateIndexes() {
        CheckConnection();
        String[] tableNames = GetFileList();
        for (String tableName : tableNames) {
            tableName = validateFname(tableName);
            try (PreparedStatement statement = connection.prepareStatement("CREATE UNIQUE INDEX IF NOT EXISTS " + tableName + "_idx on phantombot_" + tableName + " (section, variable);")) {
                statement.execute();
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void DropIndexes() {
        CheckConnection();
        String[] tableNames = GetFileList();
        for (String tableName : tableNames) {
            tableName = validateFname(tableName);
            try (PreparedStatement statement = connection.prepareStatement("DROP INDEX IF EXISTS " + tableName + "_idx")) {
                statement.execute();
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

    }

    @Override
    public void setAutoCommit(boolean mode) {
        CheckConnection();

        try {
            if (mode == true) {
                decrAutoCommitCtr();
                if (getAutoCommitCtr() == 0) {
                    connection.commit();
                    connection.setAutoCommit(mode);
                }
            } else {
                incrAutoCommitCtr();
                connection.setAutoCommit(mode);
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.debug.println("SQLite commit was attempted too early, will perform later.");
        }
    }

    @Override
    public void backupSQLite3(String filename) {
        CheckConnection();

        if (!new File ("./dbbackup").exists()) new File ("./dbbackup").mkdirs();

        try (Statement statement = connection.createStatement()) {
            statement.setQueryTimeout(10);
            statement.executeUpdate("backup to ./dbbackup/" + filename);
            com.gmt2001.Console.debug.println("Backed up SQLite3 DB to ./dbbackup/" + filename);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    private synchronized void incrAutoCommitCtr() {
        autoCommitCtr++;
    }
    
    private synchronized void decrAutoCommitCtr() {
        autoCommitCtr--;
    }
    
    private synchronized int getAutoCommitCtr() {
        return autoCommitCtr;
    }

    public boolean getUseIndexes() {
        return use_indexes;
    }
}
