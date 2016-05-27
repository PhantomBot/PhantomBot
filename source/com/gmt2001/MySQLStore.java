/*
 * Copyright (C) 2015 www.phantombot.net
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
package com.gmt2001;

import java.io.File;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import org.apache.commons.io.FileUtils;
import org.sqlite.SQLiteConfig;

import me.mast3rplan.phantombot.PhantomBot;

/**
 *
 * @author gmt2001
 */
public class MySQLStore extends DataStore {

    private static Connection connection = null;
    private static final MySQLStore instance = new MySQLStore();

    private String db = "";
    private String user = "";
    private String pass = "";
   

    public static MySQLStore instance() {
        return instance;
    }

    private MySQLStore() {
        try {
            Class.forName("com.mysql.jdbc.Driver");
        } catch (ClassNotFoundException ex) {
            com.gmt2001.Console.err.println(ex.getMessage());
        } catch (Exception ex) {
            com.gmt2001.Console.err.println(ex.getMessage());
        }
    }

    @Override
    public Connection CreateConnection(String db, String user, String pass) {
        this.db = db;
        this.user = user;
        this.pass = pass;
        try {
            connection = DriverManager.getConnection(db, user, pass);
            com.gmt2001.Console.out.println("Connected to MySQL");
            return connection;
        } catch (SQLException ex) {
            com.gmt2001.Console.err.println("Failure to Connect to MySQL: " + ex.getMessage());
            return null;
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
                connection = CreateConnection(db, user, pass);
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void AddFile(String fName) {
        CheckConnection();

        fName = validateFname(fName);

        if (!FileExists(fName)) {
            try (Statement statement = connection.createStatement()) {
                statement.setQueryTimeout(10);

                statement.executeUpdate("CREATE TABLE phantombot_" + fName + " (section LONGTEXT, variable LONGTEXT as PRIMARY KEY, value LONGTEXT);");
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
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
        CheckConnection();

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
        CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName)) {
            if (section.length() > 0) {
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
    public boolean HasKey(String fName, String section, String key) {
        CheckConnection();

        fName = validateFname(fName);

        if (!FileExists(fName)) {
            return false;
        }

        if (section.length() > 0) {
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
    public String GetString(String fName, String section, String key) {
        CheckConnection();

        String result = null;

        fName = validateFname(fName);

        if (!FileExists(fName)) {
            return result;
        }

        if (section.length() > 0) {
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
    public void SetString(String fName, String section, String key, String value) {
        CheckConnection();

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
    public void CreateIndexes() {
        CheckConnection();
        String[] tableNames = GetFileList();
        for (String tableName : tableNames) {
            tableName = validateFname(tableName);
            com.gmt2001.Console.out.println("    Indexing Table: " + tableName);
            try (PreparedStatement statement = connection.prepareStatement("CREATE INDEX IF NOT EXISTS " + tableName + "_idx on phantombot_" + tableName + " (variable);")) {
                statement.execute();
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

}
