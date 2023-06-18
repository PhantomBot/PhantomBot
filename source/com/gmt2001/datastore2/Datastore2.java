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

import org.jooq.ConnectionProvider;
import org.jooq.DSLContext;
import org.jooq.SQLDialect;
import org.jooq.exception.DataAccessException;
import org.jooq.impl.DSL;

import com.gmt2001.Reflect;

import biz.source_code.miniConnectionPoolManager.MiniConnectionPoolManager;
import biz.source_code.miniConnectionPoolManager.MiniConnectionPoolManager.TimeoutException;
import tv.phantombot.CaselessProperties;

/**
 * Manages a JDBC-compatible, SQL-based, data storage method
 *
 * @see <a href="https://docs.oracle.com/javase/tutorial/jdbc/basics/index.html" target="_blank">JDBC Basics</a>
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
    private MiniConnectionPoolManager connectionPoolManager;
    /**
     * Instance of {@link DSLContext} for generating and executing SQL statements
     */
    private DSLContext dslContext;

    /**
     * Provides an instance of {@link Datastore2}
     *
     * @return an instance of {@link Datastore2}; {@code null} if {@link #init()} has not been called
     */
    public static Datastore2 instance() {
        return INSTANCE;
    }

    /**
     * Initializes a new instance of Datastore2, based on the property {@code datastore} in botlogin.txt
     * <p>
     * If a datastore type is not specified or is blank, defaults to {@code H2Store}
     * <p>
     * Builtin datastore types are not case-sensitive, but custom types are
     * <p>
     * If loading a custom datastore, the following requirements must be met:
     * <ul>
     * <li>Must extend {@link Datastore2}</li>
     * <li>Must call {@link #init(ConnectionPoolDataSource, SQLDialect)} or {@link #init(ConnectionPoolDataSource, int, int, SQLDialect)}, passing in a valid {@link ConnectionPoolDataSource}, in the constructor</li>
     * <li>May optionally start a timer in the constructor to periodically call {@link #doMaintenance()}</li>
     * <li>Must be in a JAR file located in the {@code ./datastores} folder</li>
     * <li>The name of the JAR file must match the output of {@link Class#getSimpleName()} of the type, including case</li>
     * <li>The {@code .jar} file exension on the JAR file must be lower-case</li>
     * <li>The value of the {@code datastore} property in botlogin.txt must match the output of {@link Class#getName()} of the type, including case</li>
     * </ul>
     *
     * @throws IllegalStateException if {@link #init()} was called after a Datastore2 has already been initialized
     * @throws ClassNotFoundException if the class specified in the {@code datastore} property could not be found by the class loader
     * @throws RuntimeException if the specified class was unable to be instantiated
     */
    public static synchronized void init() throws IllegalStateException, ClassNotFoundException {
        if (INSTANCE != null) {
            throw new IllegalStateException("Datastore2 already initialized");
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
     * Instance Initializer. Sets a max connections of 30 and a timeout of 20
     * <p>
     * Valid dialects:
     * <ul>
     * <li>{@link SQLDialect#DERBY}</li>
     * <li>{@link SQLDialect#FIREBIRD}</li>
     * <li>{@link SQLDialect#H2}</li>
     * <li>{@link SQLDialect#HSQLDB}</li>
     * <li>{@link SQLDialect#MARIADB}</li>
     * <li>{@link SQLDialect#MYSQL}</li>
     * <li>{@link SQLDialect#POSTGRES}</li>
     * <li>{@link SQLDialect#SQLITE}</li>
     * <li>{@link SQLDialect#YUGABYTEDB}</li>
     * </ul>
     * <p>
     * <i>NOTE: SQL will be generated according to the latest supported version of the selected database dialect</i>
     *
     * @param dataSource a {@link ConnectionPoolDataSource} which can be used with {@link MiniConnectionPoolManager}
     * @param sqlDialect the dialect to use with objects created from the {@link DSLContext}
     */
    protected void init(ConnectionPoolDataSource dataSource, SQLDialect sqlDialect) {
        this.init(dataSource, 30, 20, sqlDialect);
    }

    /**
     * Instance Initializer
     * <p>
     * Valid dialects:
     * <ul>
     * <li>{@link SQLDialect#DERBY}</li>
     * <li>{@link SQLDialect#FIREBIRD}</li>
     * <li>{@link SQLDialect#H2}</li>
     * <li>{@link SQLDialect#HSQLDB}</li>
     * <li>{@link SQLDialect#MARIADB}</li>
     * <li>{@link SQLDialect#MYSQL}</li>
     * <li>{@link SQLDialect#POSTGRES}</li>
     * <li>{@link SQLDialect#SQLITE}</li>
     * <li>{@link SQLDialect#YUGABYTEDB}</li>
     * </ul>
     * <p>
     * <i>NOTE: SQL will be generated according to the latest supported version of the selected database dialect</i>
     *
     * @param dataSource a {@link ConnectionPoolDataSource} which can be used with {@link MiniConnectionPoolManager}
     * @param maxConnections the maximum number of {@link Connection} objects to hold in the pool
     * @param timeout the number of seconds until a call to {@link MiniConnectionPoolManager#getConnection()} fails waiting for a {@link Connection} to become available
     * @param sqlDialect the dialect to use with objects created from the {@link DSLContext}
     */
    protected void init(ConnectionPoolDataSource dataSource, int maxConnections, int timeout, SQLDialect sqlDialect) {
        this.connectionPoolManager = new MiniConnectionPoolManager(dataSource, maxConnections, timeout);
        this.dslContext = DSL.using(new ConnectionProvider() {
            @Override
            public Connection acquire() throws DataAccessException {
                try {
                    return getConnection();
                } catch (SQLException ex) {
                    throw new DataAccessException("failed to aquire connection", ex);
                }
            }

            @Override
            public void release(Connection connection) throws DataAccessException {
                try {
                    connection.close();
                } catch (SQLException ex) {
                    throw new DataAccessException("failed to close connection", ex);
                }
            }

        }, sqlDialect);
    }

    /**
     * Retrieves a {@link Connection} from the connection pool
     *
     * <p>
     * If the maximum number of connections are already in use, the method waits until a connection becomes available or the timeout
     * has elapsed
     * <p>
     * When the application is finished using the connection, it must call {@link Connection#close()} on it in order
     * to return it to the connection pool
     * <p>
     * Consider using try-with-resources instead to safely auto-close the connection
     * <p>
     * Transactions are <b>not</b> comitted automatically when closing a {@link Connection} that has auto-commit disabled
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
        try (Connection con = this.connectionPoolManager.getValidConnection()) {
            return true;
        } catch (TimeoutException ex) {
            com.gmt2001.Console.debug.printStackTrace(ex);
        }

        return false;
    }

    /**
     * Creates a {@link PreparedStatement} object for sending parameterized SQL statements to the database
     * <p>
     * This directly connects to the underlying database. It should only be used by custom scripts where the selected database is known
     * or by the implementing {@link Datastore2} sub-classes
     * <p>
     * The {@link PreparedStatement} must be closed by calling {@link PreparedStatement#close()} to release it back to the connection
     * pool when the operation is complete, otherwise exhaustion of the connection pool may occur, preventing other modules from accessing the database
     * <p>
     * Consider using try-with-resources instead to safely auto-close the connection
     * <p>
     * Transactions are <b>not</b> comitted automatically when closing a {@link PreparedStatement} that has auto-commit disabled
     *
     * @see <a href="https://docs.oracle.com/javase/tutorial/jdbc/basics/prepared.html" target="_blank">Using Prepared Statements</a>
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
     * <p>
     * This directly connects to the underlying database. It should only be used by custom scripts where the selected database is known
     * or by the implementing {@link Datastore2} sub-classes
     * <p>
     * The {@link Statement} must be closed by calling {@link Statement#close()} to release it back to the connection
     * pool when the operation is complete, otherwise exhaustion of the connection pool may occur, preventing other modules from accessing the database
     * <p>
     * Consider using try-with-resources instead to safely auto-close the connection
     * <p>
     * Transactions are <b>not</b> comitted automatically when closing a {@link Statement} that has auto-commit disabled
     *
     * @return a new default {@link Statement} object
     * @throws SQLException if a database access error occurs or this method is called on a closed connection
     */
    public Statement createStatement() throws SQLException {
        return this.getConnection().createStatement();
    }

    /**
     * Returns the {@link DSLContext} which can be used to start a fluent statement
     *
     * @see <a href="https://www.jooq.org/doc/3.18/manual/sql-building/" target="_blank">JOOQ - SQL Building</a>
     *
     * @return the {@link DSLContext}
     */
    public DSLContext dslContext() {
        return this.dslContext;
    }

    /**
     * Performs a backup of the database to the {@code dbbackup} folder
     * <p>
     * The default backup name is used, which is usually the database name with the current timestamp
     */
    public abstract void backup();

    /**
     * Performs a backup of the database to the {@code dbbackup} folder
     *
     * @param fileName the name of the backup file
     */
    public abstract void backup(String fileName);

    /**
     * Performs periodic database maintenance
     */
    public abstract void doMaintenance();
}
