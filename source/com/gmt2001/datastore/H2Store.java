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
package com.gmt2001.datastore;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import org.h2.jdbcx.JdbcConnectionPool;

/**
 *
 * @author illusionaryone
 * @author gmt2001
 *
 */
public final class H2Store extends DataStore {

    private static final int MAX_CONNECTIONS = 30;
    private static JdbcConnectionPool poolMgr;
    private static H2Store instance;

    public static H2Store instance() {
        return instance("");
    }

    public static synchronized H2Store instance(String configStr) {
        if (instance == null) {
            instance = new H2Store(configStr);
        }

        return instance;
    }

    private H2Store(String configStr) {
        super(configStr);

        try {
            Class.forName("org.h2.Driver");
        } catch (ClassNotFoundException ex) {
            ex.printStackTrace(System.err);
        }

        if (configStr.isBlank()) {
            configStr = "phantombot.h2";
        }

        poolMgr = JdbcConnectionPool.create("jdbc:h2:./config/" + configStr + ";DB_CLOSE_ON_EXIT=FALSE;MAX_LENGTH_INPLACE_LOB=2048", "", "");
        poolMgr.setMaxConnections(MAX_CONNECTIONS);
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

    private String validateFname(String fName) {
        fName = fName.replaceAll("([^a-zA-Z0-9_])", "_");

        if (fName.matches("^[0-9]+")) {
            fName = "_" + fName;
        }

        return fName;
    }

    private Connection GetConnection() throws SQLException {
        return poolMgr.getConnection();
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
        fName = validateFname(fName);

        // Creates a database with 3 columns, the section and variable are used as keys.  value is a 2GB CLOB of text.
        try ( Statement statement = connection.createStatement()) {
            statement.addBatch("CREATE TABLE IF NOT EXISTS phantombot_" + fName + " (section varchar(255), variable varchar(255) NOT NULL, value LONGTEXT);");
            statement.addBatch("CREATE UNIQUE INDEX IF NOT EXISTS phantombot_" + fName + "_idx ON phantombot_" + fName + "(section, variable);");
            statement.executeBatch();
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void RemoveKey(String fName, String section, String key) {
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
    }

    @Override
    public void RemoveSection(String fName, String section) {
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
    }

    @Override
    public void RemoveFile(String fName) {
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
    }

    @Override
    public void RenameFile(String fNameSource, String fNameDest) {
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
        fName = validateFname(fName);

        try {
            DatabaseMetaData md = connection.getMetaData();
            try ( ResultSet rs = md.getTables(null, null, "PHANTOMBOT_" + fName.toUpperCase(), null)) {
                return rs.next();
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return false;
    }

    @Override
    public String[] GetFileList() {
        String[] out = new String[]{};

        try ( Connection connection = GetConnection()) {
            DatabaseMetaData md = connection.getMetaData();
            try ( ResultSet rs = md.getTables(null, null, "PHANTOMBOT_%", null)) {
                ArrayList<String> s = new ArrayList<>();
                while (rs.next()) {
                    s.add(rs.getString(3).substring(11));
                }
                out = s.toArray(String[]::new);
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return out;
    }

    @Override
    public String[] GetCategoryList(String fName) {
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
    }

    @Override
    public String[] GetKeyList(String fName, String section) {
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
    }

    @Override
    public KeyValue[] GetKeyValueList(String fName, String section) {
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

        try ( Connection connection = GetConnection()) {
            String statementStr;
            fName = validateFname(fName);
            order = sanitizeOrder(order);
            limit = sanitizeLimit(limit);
            offset = sanitizeOffset(offset);

            if (FileExists(connection, fName)) {
                if (section != null) {
                    if (isNumber) {
                        statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY CAST(variable as INTEGER) " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                    } else {
                        statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY variable " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
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
                        statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY CAST(variable as INTEGER) " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                    } else {
                        statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY variable " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
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

        try ( Connection connection = GetConnection()) {
            String statementStr;
            fName = validateFname(fName);
            order = sanitizeOrder(order);
            limit = sanitizeLimit(limit);
            offset = sanitizeOffset(offset);

            if (FileExists(connection, fName)) {
                if (section != null) {
                    if (isNumber) {
                        statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY CAST(value as INTEGER) " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                    } else {
                        statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY value " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
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
                        statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY CAST(value as INTEGER) " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                    } else {
                        statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY value " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
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
    }

    @Override
    public String[] GetKeysByLikeValues(String fName, String section, String search) {
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
    }

    @Override
    public String[] GetKeysByLikeKeys(String fName, String section, String search) {
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
    }

    @Override
    public String[] GetKeysByLikeKeysOrder(String fName, String section, String search, String order, String limit, String offset) {
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
    }

    @Override
    public boolean HasKey(String fName, String section, String key) {
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
    }

    @Override
    public String GetKeyByValue(String fName, String section, String value) {
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

    }

    @Override
    public String GetString(String fName, String section, String key) {
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
    }

    @Override
    public void SetBatchString(String fName, String section, String[] keys, String[] values) {
        try ( Connection connection = GetConnection()) {

            fName = validateFname(fName);
            AddFile(connection, fName);

            connection.setAutoCommit(false);

            try ( PreparedStatement statement = connection.prepareStatement("MERGE INTO phantombot_" + fName + " (value, section, variable) KEY(SECTION, VARIABLE) values(?, ?, ?);")) {
                for (int idx = 0; idx < keys.length; idx++) {
                    statement.setString(1, values[idx]);
                    statement.setString(2, section);
                    statement.setString(3, keys[idx]);
                    statement.addBatch();
                }

                statement.executeBatch();
            }

            connection.commit();
            connection.setAutoCommit(true);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void SetString(String fName, String section, String key, String value) {
        try ( Connection connection = GetConnection()) {

            fName = validateFname(fName);

            AddFile(connection, fName);

            try ( PreparedStatement statement = connection.prepareStatement("MERGE INTO phantombot_" + fName + " KEY(SECTION, VARIABLE) values(?, ?, ?);")) {
                statement.setString(1, section);
                statement.setString(2, key);
                statement.setString(3, value);
                statement.execute();
            }

        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void IncreaseBatchString(String fName, String section, String[] keys, String value) {
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

            try ( PreparedStatement statement = connection.prepareStatement("UPDATE phantombot_" + fName + " SET value = CAST(value AS INTEGER) + ? WHERE section = ? AND variable IN (" + sb.deleteCharAt(sb.length() - 1).toString() + ");")) {
                statement.setInt(1, Integer.parseUnsignedInt(value));
                statement.setString(2, section);
                int i = 3;
                for (String k : keys) {
                    statement.setString(i++, k);
                }
                statement.execute();
            }

            try ( PreparedStatement statement = connection.prepareStatement("MERGE INTO phantombot_" + fName + " USING DUAL ON section=? AND variable=? WHEN NOT MATCHED THEN INSERT VALUES (?, ?, ?);")) {
                for (String k : keys) {
                    statement.setString(1, section);
                    statement.setString(2, k);
                    statement.setString(3, section);
                    statement.setString(4, k);
                    statement.setString(5, value);
                    statement.addBatch();
                }

                statement.executeBatch();
            }

            connection.commit();
            connection.setAutoCommit(true);
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public String[][] executeSql(String sql, String[] replacements) {
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
    }

    @Override
    public void CreateIndexes() {
        try ( Connection connection = GetConnection()) {
            String[] tableNames = GetFileList();
            try ( Statement statement = connection.createStatement()) {
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
    }

    @Override
    public void dispose() {
        super.dispose();

        poolMgr.dispose();
    }
}
