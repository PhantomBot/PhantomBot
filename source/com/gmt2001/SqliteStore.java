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

/**
 *
 * @author gmt2001
 */
public class SqliteStore extends DataStore
{

    private String dbname = "phantombot.db";
    private int cache_size = 2000;
    private boolean safe_write = false;
    private Connection connection = null;
    private static final SqliteStore instance = new SqliteStore();

    public static SqliteStore instance()
    {
        return instance;
    }

    private SqliteStore()
    {
        try
        {
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException ex)
        {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        Object o[] = LoadConfigReal("");

        dbname = (String) o[0];
        cache_size = (int) o[1];
        safe_write = (boolean) o[2];
        connection = (Connection) o[3];
    }

    @Override
    public void LoadConfig(String configStr)
    {
        Object o[] = LoadConfigReal(configStr);

        dbname = (String) o[0];
        cache_size = (int) o[1];
        safe_write = (boolean) o[2];
        connection = (Connection) o[3];
    }

    private static Object[] LoadConfigReal(String configStr)
    {
        if (configStr.isEmpty())
        {
            configStr = "sqlite3config.txt";
        }

        String dbname = "phantombot.db";
        int cache_size = 2000;
        boolean safe_write = false;
        Connection connection = null;

        try
        {
            File f = new File("./" + configStr);

            if (f.exists())
            {
                String data = FileUtils.readFileToString(new File("./" + configStr));
                String[] lines = data.replaceAll("\\r", "").split("\\n");

                for (String line : lines)
                {
                    if (line.startsWith("dbname=") && line.length() > 8)
                    {
                        dbname = line.substring(7);
                    }
                    if (line.startsWith("cachesize=") && line.length() > 11)
                    {
                        cache_size = Integer.parseInt(line.substring(10));
                    }
                    if (line.startsWith("safewrite=") && line.length() > 11)
                    {
                        safe_write = line.substring(10).equalsIgnoreCase("true") || line.substring(10).equalsIgnoreCase("1");
                    }
                }

                connection = CreateConnection(dbname, cache_size, safe_write);
            }
        } catch (IOException ex)
        {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return new Object[]
        {
            dbname, cache_size, safe_write, connection
        };
    }

    private static Connection CreateConnection(String dbname, int cache_size, boolean safe_write)
    {
        Connection connection = null;

        try
        {
            SQLiteConfig config = new SQLiteConfig();
            config.setCacheSize(cache_size);
            config.setSynchronous(safe_write ? SQLiteConfig.SynchronousMode.FULL : SQLiteConfig.SynchronousMode.NORMAL);
            connection = DriverManager.getConnection("jdbc:sqlite:" + dbname.replaceAll("\\\\", "/"), config.toProperties());
            connection.setAutoCommit(true);
        } catch (SQLException ex)
        {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return connection;
    }

    @Override
    protected void finalize() throws Throwable
    {
        super.finalize();

        if (connection != null && !connection.isClosed())
        {
            connection.close();
        }
    }

    private String validateFname(String fName)
    {
        fName = fName.replaceAll("([^a-zA-Z0-9_-])", "_");

        return fName;
    }

    private void CheckConnection()
    {
        try
        {
            if (connection == null || connection.isClosed() || !connection.isValid(10))
            {
                connection = CreateConnection(dbname, cache_size, safe_write);
            }
        } catch (SQLException ex)
        {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void AddFile(String fName)
    {
        CheckConnection();

        fName = validateFname(fName);

        if (!FileExists(fName))
        {
            try (Statement statement = connection.createStatement())
            {
                statement.setQueryTimeout(10);

                statement.executeUpdate("CREATE TABLE phantombot_" + fName + " (section string, variable string, value string);");
            } catch (SQLException ex)
            {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RemoveKey(String fName, String section, String key)
    {
        CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName))
        {
            try (PreparedStatement statement = connection.prepareStatement("DELETE FROM phantombot_" + fName + " WHERE section=? AND variable=?;"))
            {
                statement.setQueryTimeout(10);
                statement.setString(1, section);
                statement.setString(2, key);
                statement.executeUpdate();
            } catch (SQLException ex)
            {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RemoveSection(String fName, String section)
    {
        CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName))
        {
            try (PreparedStatement statement = connection.prepareStatement("DELETE FROM phantombot_" + fName + " WHERE section=?;"))
            {
                statement.setQueryTimeout(10);
                statement.setString(1, section);
                statement.executeUpdate();
            } catch (SQLException ex)
            {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void RemoveFile(String fName)
    {
        CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName))
        {
            try (Statement statement = connection.createStatement())
            {
                statement.setQueryTimeout(10);

                statement.executeUpdate("DROP TABLE phantombot_" + fName + ";");
            } catch (SQLException ex)
            {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public boolean FileExists(String fName)
    {
        CheckConnection();

        fName = validateFname(fName);

        try (Statement statement = connection.createStatement())
        {
            statement.setQueryTimeout(10);

            try (ResultSet rs = statement.executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name='phantombot_" + fName + "';"))
            {

                return rs.next();
            }
        } catch (SQLException ex)
        {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return false;
    }

    @Override
    public String[] GetFileList()
    {
        CheckConnection();

        try (Statement statement = connection.createStatement())
        {
            statement.setQueryTimeout(10);

            try (ResultSet rs = statement.executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'phantombot_%';"))
            {

                ArrayList<String> s = new ArrayList<>();

                while (rs.next())
                {
                    s.add(rs.getString("name").substring(11));
                }

                return s.toArray(new String[s.size()]);
            }
        } catch (SQLException ex)
        {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return new String[]
        {
        };
    }

    @Override
    public String[] GetCategoryList(String fName)
    {
        CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName))
        {
            try (Statement statement = connection.createStatement())
            {
                statement.setQueryTimeout(10);

                try (ResultSet rs = statement.executeQuery("SELECT section FROM phantombot_" + fName + " GROUP BY section;"))
                {

                    ArrayList<String> s = new ArrayList<>();

                    while (rs.next())
                    {
                        s.add(rs.getString("section"));
                    }

                    return s.toArray(new String[s.size()]);
                }
            } catch (SQLException ex)
            {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        return new String[]
        {
        };
    }

    @Override
    public String[] GetKeyList(String fName, String section)
    {
        CheckConnection();

        fName = validateFname(fName);

        if (FileExists(fName))
        {
            try (PreparedStatement statement = connection.prepareStatement("SELECT variable FROM phantombot_" + fName + " WHERE section=?;"))
            {
                statement.setQueryTimeout(10);
                statement.setString(1, section);

                try (ResultSet rs = statement.executeQuery())
                {

                    ArrayList<String> s = new ArrayList<>();

                    while (rs.next())
                    {
                        s.add(rs.getString("variable"));
                    }

                    return s.toArray(new String[s.size()]);
                }
            } catch (SQLException ex)
            {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        return new String[]
        {
        };
    }

    @Override
    public boolean HasKey(String fName, String section, String key)
    {
        CheckConnection();

        fName = validateFname(fName);

        if (!FileExists(fName))
        {
            return false;
        }

        try (PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE section=? AND variable=?;"))
        {
            statement.setQueryTimeout(10);
            statement.setString(1, section);
            statement.setString(2, key);

            try (ResultSet rs = statement.executeQuery())
            {

                if (rs.next())
                {
                    return true;
                }
            }
        } catch (SQLException ex)
        {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return false;
    }

    @Override
    public String GetString(String fName, String section, String key)
    {
        CheckConnection();

        String result = null;

        fName = validateFname(fName);

        if (!FileExists(fName))
        {
            return result;
        }

        try (PreparedStatement statement = connection.prepareStatement("SELECT value FROM phantombot_" + fName + " WHERE section=? AND variable=?;"))
        {
            statement.setQueryTimeout(10);
            statement.setString(1, section);
            statement.setString(2, key);

            try (ResultSet rs = statement.executeQuery())
            {

                if (rs.next())
                {
                    result = rs.getString("value");
                }
            }
        } catch (SQLException ex)
        {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return result;
    }

    @Override
    public void SetString(String fName, String section, String key, String value)
    {
        CheckConnection();

        fName = validateFname(fName);

        AddFile(fName);

        try
        {
            if (HasKey(fName, section, key))
            {
                try (PreparedStatement statement = connection.prepareStatement("UPDATE phantombot_" + fName + " SET value=? WHERE section=? AND variable=?;"))
                {
                    statement.setQueryTimeout(10);
                    statement.setString(1, value);
                    statement.setString(2, section);
                    statement.setString(3, key);
                    statement.executeUpdate();
                }
            } else
            {
                try (PreparedStatement statement = connection.prepareStatement("INSERT INTO phantombot_" + fName + " values(?, ?, ?);"))
                {
                    statement.setQueryTimeout(10);
                    statement.setString(1, section);
                    statement.setString(2, key);
                    statement.setString(3, value);
                    statement.executeUpdate();
                }
            }
        } catch (SQLException ex)
        {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }
}
