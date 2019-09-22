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

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;

/**
 *
 * @author illusionaryone
 * @author gmt2001
 *
 */
public class H2Store extends DataStore {

    private static Connection connection = null;
    private static H2Store instance;
    private boolean firstConnection = true;

    private String db = "";
    private String user = "";
    private String pass = "";

    private int autoCommitCtr = 0;

    public static H2Store instance() {
        if (instance == null) {
            instance = new H2Store();
        }
        
        return instance;
    }

    private H2Store() {
        try {
            Class.forName("org.h2.Driver");
        } catch (ClassNotFoundException ex) {
            com.gmt2001.Console.err.println(ex.getMessage());
        } catch (Exception ex) {
            com.gmt2001.Console.err.println(ex.getMessage());
        }
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
    public Connection CreateConnection(String db, String user, String pass) {
        try {
            connection = DriverManager.getConnection("jdbc:h2:./config/phantombot.h2;DB_CLOSE_ON_EXIT=true;MAX_LENGTH_INPLACE_LOB=2048", "", "");
            connection.setAutoCommit(true);
            if (firstConnection) {
                com.gmt2001.Console.out.println("Connected to H2 Database");
                firstConnection = false;
            }
            return connection;
        } catch (SQLException ex) {
            return null;
        }
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
                connection = CreateConnection(db, "", "");
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void AddFile(String fName) {
        CheckConnection();

        fName = validateFname(fName);

        // Creates a database with 3 columns, the section and variable are used as keys.  value is a 2GB CLOB of text.
        try (Statement statement = connection.createStatement()) {
            statement.setQueryTimeout(10);
            statement.executeUpdate("CREATE TABLE IF NOT EXISTS phantombot_" + fName + " (section varchar(255), variable varchar(255) NOT NULL, value LONGTEXT);");

            // Creates an index for the table.
            try (Statement indexStmt = connection.createStatement()) {
                indexStmt.setQueryTimeout(10);
                indexStmt.executeUpdate("CREATE INDEX IF NOT EXISTS phantombot_" + fName + "_idx ON phantombot_" + fName + "(VARIABLE);");
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void RemoveKey(String fName, String section, String key) {
        CheckConnection();

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
        CheckConnection();

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
        CheckConnection();

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
        CheckConnection();

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

            DatabaseMetaData md = connection.getMetaData();
            try (ResultSet rs = md.getTables(null, null, "PHANTOMBOT_" + fName.toUpperCase(), null)) {
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

            DatabaseMetaData md = connection.getMetaData();
            try (ResultSet rs = md.getTables(null, null, "PHANTOMBOT_%", null)) {
                ArrayList<String> s = new ArrayList<String>();
                while (rs.next()) {
                    s.add(rs.getString(3).substring(11));
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
        CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            try (Statement statement = connection.createStatement()) {
                statement.setQueryTimeout(10);

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
        CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=?;")) {
                    statement.setQueryTimeout(10);
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
                    statement.setQueryTimeout(10);

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
        CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable, value FROM phantombot_" + fName + " WHERE section=?;")) {
                    statement.setQueryTimeout(10);
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
                    statement.setQueryTimeout(10);

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
        String statementStr;
        CheckConnection();

        fName = validateFname(fName);
        order = sanitizeOrder(order);
        limit = sanitizeLimit(limit);
        offset = sanitizeOffset(offset);

        if (FileExists(fName)) {
            if (section != null) {
                if (isNumber) {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY CAST(variable as INTEGER) " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                } else {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY variable " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                }
                try (PreparedStatement statement = connection.prepareStatement(statementStr)) {
                    statement.setQueryTimeout(10);
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
                    statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY CAST(variable as INTEGER) " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                } else {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY variable " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                }
                try (PreparedStatement statement = connection.prepareStatement(statementStr)) {
                    statement.setQueryTimeout(10);

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
        String statementStr;
        CheckConnection();

        fName = validateFname(fName);
        order = sanitizeOrder(order);
        limit = sanitizeLimit(limit);
        offset = sanitizeOffset(offset);

        if (FileExists(fName)) {
            if (section != null) {
                if (isNumber) {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY CAST(value as INTEGER) " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                } else {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " WHERE section=? ORDER BY value " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                }
                try (PreparedStatement statement = connection.prepareStatement(statementStr)) {
                    statement.setQueryTimeout(10);
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
                    statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY CAST(value as INTEGER) " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                } else {
                    statementStr = "SELECT variable FROM phantombot_" + fName + " ORDER BY value " + order + " LIMIT " + limit + " OFFSET " + offset + ";";
                }
                try (PreparedStatement statement = connection.prepareStatement(statementStr)) {
                    statement.setQueryTimeout(10);

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
        CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND value LIKE ?;")) {
                    statement.setQueryTimeout(10);
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
                    statement.setQueryTimeout(10);
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
        CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            if (section != null) {
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=? AND variable LIKE ?;")) {
                    statement.setQueryTimeout(10);
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
                try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE variable LIKE '%?%';")) {
                    statement.setQueryTimeout(10);
                    statement.setString(1, search);

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
        CheckConnection();

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
                    statement.setQueryTimeout(10);
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
        CheckConnection();

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
        CheckConnection();

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
        CheckConnection();

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
        CheckConnection();

        fName = validateFname(fName);
        AddFile(fName);

        setAutoCommit(false);

        try {
            try (PreparedStatement statement = connection.prepareStatement("MERGE INTO phantombot_" + fName + "(SECTION, VARIABLE, VALUE) KEY(SECTION, VARIABLE) VALUES(?, ?, ?);")) {
                statement.setQueryTimeout(10);
                for (int idx = 0; idx < keys.length; idx++) {
                    statement.setString(1, section);
                    statement.setString(2, keys[idx]);
                    statement.setString(3, values[idx]);
                    statement.addBatch();

                    if (idx % 500 == 0) {
                        statement.executeBatch();
                        statement.clearBatch();
                    }
                }
                statement.executeBatch();
                statement.clearBatch();
                connection.commit();
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.println(ex);
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        setAutoCommit(true);
    }
    
    @Override
    public void IncreaseBatchString(String fName, String section, String[] keys, String value) {
        fName = validateFname(fName);

        AddFile(fName);
        try {
            
            int valueInt =  Integer.parseInt(value);
        
            for (String key : keys)  {
                int amount = valueInt;
            
                if (HasKey(fName, section, key)) {
                    amount = (Integer.parseInt(GetString(fName, section, key)) + valueInt);
                }
                
                SetString(fName, section, key, Integer.toString(amount));
            }
        } catch (NumberFormatException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void SetString(String fName, String section, String key, String value) {
        CheckConnection();

        fName = validateFname(fName);

        AddFile(fName);

        try {
            try (PreparedStatement statement = connection.prepareStatement("MERGE INTO phantombot_" + fName + "(SECTION, VARIABLE, VALUE) KEY(SECTION, VARIABLE) VALUES(?, ?, ?);")) {
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
            try (PreparedStatement statement = connection.prepareStatement("CREATE INDEX IF NOT EXISTS " + tableName + "_idx on phantombot_" + tableName + " (VARIABLE);")) {
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
                com.gmt2001.Console.debug.println(getAutoCommitCtr());
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.debug.println("MySQL commit was attempted too early, will perform later.");
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
}
