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
package com.gmt2001.datastore2;

import java.lang.reflect.InvocationTargetException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Optional;

import javax.sql.ConnectionPoolDataSource;

import com.gmt2001.Reflect;
import com.gmt2001.datastore2.tablebuilder.TableBuilder;

import biz.source_code.miniConnectionPoolManager.MiniConnectionPoolManager;
import biz.source_code.miniConnectionPoolManager.MiniConnectionPoolManager.TimeoutException;
import tv.phantombot.CaselessProperties;

/**
 * Manages a JDBC-compatible, SQL-based, data storage method
 *
 * @author gmt2001
 */
public abstract class Datastore2 {
    /**
     * Active instance of {@link Datastore2}
     */
    private static Datastore2 INSTANCE = null;
    /**
     * Instance of {@link MiniConnectionPoolManager} that provides pooled {@link Connection} objects on demand
     */
    private final MiniConnectionPoolManager connectionPoolManager;

    /**
     * Provides an instance of {@link Datastore2}
     *
     * @return an instance of {@link Datastore2}; {@code null} if {@link #init()} has not been called
     */
    public static Datastore2 instance() {
        return INSTANCE;
    }

    /**
     * Initializes a new instance of DataStore2, based on the property {@code datastore} in botlogin.txt
     * <p>
     * If a datastore type is not specified or is blank, defaults to {@code H2Store}
     * <p>
     * Builtin datastore types are not case-sensitive, but custom types are
     * <p>
     * If loading a custom datastore, the following requirements must be met:
     * <ul>
     * <li>Must implement/reference {@link Datastore2} and any other required types in the {@code com.gmt2001.datastore2} namespace</li>
     * <li>Must call {@link #Datastore2(ConnectionPoolDataSource)} or {@link #Datastore2(ConnectionPoolDataSource, int, int)} via {@code super} in a public, no-parameter constructor, passing in a valid {@link ConnectionPoolDataSource}</li>
     * <li>Must be in a JAR file located in the {@code ./datastores} folder</li>
     * <li>The name of the JAR file must match the output of {@link Class#getSimpleName()} of the type, including case</li>
     * <li>The {@code .jar} file exension on the JAR file must be lower-case</li>
     * <li>The value of the {@code datastore} property in botlogin.txt must match the output of {@link Class#getName()} of the type, including case</li>
     * </ul>
     *
     * @throws IllegalStateException if {@link #init()} was called after a DataStore2 has already been initialized
     * @throws ClassNotFoundException if the class specified in the {@code datastore} property could not be found by the class loader
     * @throws RuntimeException if the specified class was unable to be instantiated
     */
    public static synchronized void init() throws IllegalStateException, ClassNotFoundException {
        if (INSTANCE != null) {
            throw new IllegalStateException("DataStore2 already initialized");
        }

        String packageName;
        String className;
        String dataStoreType = CaselessProperties.instance().getProperty("datastore", "H2Store");

        if (dataStoreType.isBlank()) {
            dataStoreType = "H2Store";
        }

        // Split into package name and class name
        // Use default package name if missing
        if (!dataStoreType.contains(".")) {
            packageName = "com.gmt2001.datastore2.";
            className = dataStoreType;
            dataStoreType = packageName + className;
        } else {
            packageName = dataStoreType.substring(0, dataStoreType.lastIndexOf(".") + 1);
            className = dataStoreType.substring(dataStoreType.lastIndexOf(".") + 1);
        }

        Class<?> t;
        ClassLoader loader = null;

        if (packageName.startsWith("com.gmt2001.datastore2.")) {
            // Resolve builtin classes case-insensitively
            final String fdataStoreType = className;
            Reflect.instance().loadPackageRecursive(Datastore2.class.getName().substring(0, Datastore2.class.getName().lastIndexOf('.')));
            Optional<String> tempdataStoreType = Reflect.instance().getSubTypesOf(Datastore2.class).stream().filter((c) -> {
                return c.getSimpleName().equalsIgnoreCase(fdataStoreType);
            }).map(c -> c.getName()).findFirst();

            if (tempdataStoreType.isPresent()) {
                dataStoreType = tempdataStoreType.get();
                loader = Datastore2.class.getClassLoader();
            }
        }

        if (loader == null) {
            // Set loader to retrieve custom classes from jar files
            try {
                loader = new URLClassLoader(new URL[] { new URL("file://./datastores/" + className + ".jar") },
                        Datastore2.class.getClassLoader());
            } catch (MalformedURLException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
                loader = Datastore2.class.getClassLoader();
            }
        }

        // Attempt to load into memory
        t = Class.forName(dataStoreType, true, loader);

        try {
            // Attempt to instantiate
            INSTANCE = (Datastore2)t.getDeclaredConstructor().newInstance();
        } catch (NoSuchMethodException | SecurityException | InstantiationException | IllegalAccessException | IllegalArgumentException
                | InvocationTargetException ex) {
                throw new RuntimeException("Unable to load the Datastore2 type " + dataStoreType, ex);
        }
    }

    /**
     * Constructor
     *
     * @param dataSource a {@link ConnectionPoolDataSource} which can be used with {@link MiniConnectionPoolManager}
     */
    protected Datastore2(ConnectionPoolDataSource dataSource) {
        this(dataSource, 30, 20);
    }

    /**
     * Constructor
     *
     * @param dataSource a {@link ConnectionPoolDataSource} which can be used with {@link MiniConnectionPoolManager}
     * @param maxConnections the maximum number of {@link Connection} objects to hold in the pool
     * @param timeout the number of seconds until a call to {@link MiniConnectionPoolManager#getConnection()} fails waiting for a {@link Connection} to become available
     */
    protected Datastore2(ConnectionPoolDataSource dataSource, int maxConnections, int timeout) {
        this.connectionPoolManager = new MiniConnectionPoolManager(dataSource, maxConnections, timeout);
    }

    /**
     * Retrieves a connection from the connection pool
     *
     * <p>
     * If the maximum number of connections are already in use, the method waits until a connection becomes available or the timeout
     * has elapsed. When the application is finished using the connection, it must call {@link Connection#close()} on it in order
     * to return it to the pool
     *
     * @return a new {@link Connection} object
     * @throws SQLException if a database access error occurs
     * @throws TimeoutException when no connection becomes available within the timeout
     */
    public Connection getConnection() throws SQLException, TimeoutException {
        return this.connectionPoolManager.getConnection();
    }

    /**
     * Tests if the database is accessible
     * <p>
     * How this is achieved is driver-defined, but is usually something similar to executing {@code SELECT 1;}
     *
     * @return {@code true} if a valid connection can be established to the database before the timeout expires
     * @throws SQLException if a database access error occurs
     */
    public boolean testConnection() throws SQLException {
        try {
            this.connectionPoolManager.getValidConnection().close();
            return true;
        } catch (TimeoutException ex) {
            com.gmt2001.Console.debug.printStackTrace(ex);
        }

        return false;
    }

    /**
     * Creates a {@link PreparedStatement} object for sending parameterized SQL statements to the database
     *
     * @param sql an SQL statement that may contain one or more {@code ?} IN parameter placeholders
     * @return a new default {@link PreparedStatement} object containing the pre-compiled SQL statement
     * @throws SQLException if a database access error occurs or this method is called on a closed connection
     */
    public PreparedStatement prepareStatement(String sql) throws SQLException {
        return this.getConnection().prepareStatement(sql);
    }

    /**
     * Creates a {@link Statement} object for sending SQL statements to the database
     *
     * @return a new default {@link Statement} object
     * @throws SQLException if a database access error occurs or this method is called on a closed connection
     */
    public Statement createStatement() throws SQLException {
        return this.getConnection().createStatement();
    }

    /**
     * Indicates if the specified table exists in the database
     *
     * @param table the table to check
     * @return {@code true} if the table exists
     * @throws SQLException if a database access error occurs or this method is called on a closed connection
     */
    public abstract boolean tableExists(String table) throws SQLException;

    /**
     * Drops the specified table from the database
     *
     * @param table the table to drop
     * @throws SQLException if a database access error occurs or this method is called on a closed connection
     */
    public abstract void dropTable(String table) throws SQLException;

    /**
     * Compiles a {@link TableBuilder} into a valid SQL statement for the underlying database, then creates the table
     * <p>
     * This method executes a {@code CREATE TABLE} statement. An exception will be thrown if the table already exists
     *
     * @param tableBuilder a {@link TableBuilder} which provides a definition for the table
     * @throws SQLException if a database access error occurs or this method is called on a closed connection
     */
    public abstract void createTable(TableBuilder tableBuilder) throws SQLException;

    /**
     * Compiles a {@link TableBuilder} into a valid SQL statement for the underlying database, then creates the table if it doesn't exist
     * <p>
     * This method executes a {@code CREATE TABLE IF NOT EXISTS} statement, or uses
     * an implementation-defined alternative if the underlying database doesn't support {@code IF NOT EXISTS}
     *
     * @param tableBuilder a {@link TableBuilder} which provides a definition for the table
     * @throws SQLException if a database access error occurs or this method is called on a closed connection
     */
    public abstract void createTableIfNotExists(TableBuilder tableBuilder) throws SQLException;

    /**
     * Compiles a {@link TableBuilder} into a valid SQL statement for the underlying database, then creates the table if it doesn't exist or alters the table if it does exist
     * <p>
     * This method executes a {@code CREATE TABLE} statement if the table does not exist, or an {@code ALTER TABLE} statement if the
     * table already exists. How this is achieved is implementation-defined
     *
     * @param tableBuilder a {@link TableBuilder} which provides a definition for the table
     * @throws SQLException if a database access error occurs or this method is called on a closed connection
     */
    public abstract void createOrAlterTable(TableBuilder tableBuilder) throws SQLException;
}
