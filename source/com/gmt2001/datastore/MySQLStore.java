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
package com.gmt2001.datastore;

import biz.source_code.miniConnectionPoolManager.MiniConnectionPoolManager;
import com.mysql.jdbc.jdbc2.optional.MysqlConnectionPoolDataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;

/**
 *
 * @author gmt2001
 */
public class MySQLStore extends DataStore {

    private static final int MAX_CONNECTIONS = 30;
    private static MySQLStore instance;
    private final MiniConnectionPoolManager poolMgr;

    public static MySQLStore instance() {
        return instance("");
    }

    public static synchronized MySQLStore instance(String configStr) {
        if (instance == null) {
            instance = new MySQLStore(configStr);
        }

        return instance;
    }

    private MySQLStore(String configStr) {
        super(configStr);

        try {
            Class.forName("com.mysql.jdbc.Driver");
        } catch (ClassNotFoundException ex) {
            com.gmt2001.Console.err.println(ex.getMessage());
        } catch (Exception ex) {
            com.gmt2001.Console.err.println(ex.getMessage());
        }

        MysqlConnectionPoolDataSource dataSource = new MysqlConnectionPoolDataSource();
        dataSource.setURL(configStr);

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

    @Override
    @SuppressWarnings("try")
    public boolean CanConnect(String db, String user, String pass) {
        try (Connection connection = DriverManager.getConnection(db, user, pass)) {
            return true;
        } catch (SQLException ex) {
            com.gmt2001.Console.err.println("Failure to Connect to MySQL: " + ex.getMessage());
        }

        return false;
    }

    private String validateFname(String fName) {
        fName = fName.replaceAll("([^a-zA-Z0-9_$])", "_");

        if (fName.matches("^[0-9]+$")) {
            fName = fName + "$";
        }

        if (fName.length() > 64) {
            fName = fName.substring(0, 64);
        }

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

        try (Statement statement = connection.createStatement()) {
            statement.executeUpdate("CREATE TABLE IF NOT EXISTS phantombot_" + fName + " (section LONGTEXT, variable varchar(255) NOT NULL, value LONGTEXT, PRIMARY KEY (section(30), variable(150))) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci;");
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
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

        try {
            DatabaseMetaData md = connection.getMetaData();
            try (ResultSet rs = md.getTables(null, null, "phantombot_" + fName, null)) {
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

        try (Connection connection = GetConnection()) {
            DatabaseMetaData md = connection.getMetaData();
            try (ResultSet rs = md.getTables(null, null, "phantombot_%", null)) {
                ArrayList<String> s = new ArrayList<>();
                while (rs.next()) {
                    s.add(rs.getString(3).substring(11));
                }
                out = s.toArray(new String[s.size()]);
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
                        statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY CAST(variable as UNSIGNED) " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                    } else {
                        statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY variable " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
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
                        statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY CAST(variable as UNSIGNED) " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                    } else {
                        statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY variable " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
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
                        statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY CAST(value as UNSIGNED) " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                    } else {
                        statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY value " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
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
                        statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY CAST(value as UNSIGNED) " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                    } else {
                        statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY value " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
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

            connection.setAutoCommit(false);

            try (PreparedStatement statement = connection.prepareStatement("REPLACE INTO phantombot_" + fName + " (value, section, variable) values(?, ?, ?);")) {
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
        try (Connection connection = GetConnection()) {

            fName = validateFname(fName);

            AddFile(connection, fName);

            try (PreparedStatement statement = connection.prepareStatement("REPLACE INTO phantombot_" + fName + "(section, variable, value) values(?, ?, ?);")) {
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
        try (Connection connection = GetConnection()) {
            fName = validateFname(fName);

            AddFile(connection, fName);

            connection.setAutoCommit(false);

            StringBuilder sb = new StringBuilder(keys.length * 2);

            for (String key : keys) {
                sb.append("?,");
            }

            try (PreparedStatement statement = connection.prepareStatement("UPDATE phantombot_" + fName + " SET value = CAST(value AS UNSIGNED) + ? WHERE section = ? AND variable IN (" + sb.deleteCharAt(sb.length() - 1).toString() + ");")) {
                statement.setInt(1, Integer.parseUnsignedInt(value));
                statement.setString(2, section);
                int i = 3;
                for (String k : keys) {
                    statement.setString(i++, k);
                }
                statement.execute();
            }

            sb = new StringBuilder(keys.length * 10);

            for (String key : keys) {
                sb.append("(?, ?, ?),");
            }

            try (PreparedStatement statement = connection.prepareStatement("INSERT IGNORE INTO phantombot_" + fName + " (section, variable, value) VALUES " + sb.deleteCharAt(sb.length() - 1).toString() + ";")) {
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
    }
}
