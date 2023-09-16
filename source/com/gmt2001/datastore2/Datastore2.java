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

import java.io.FileNotFoundException;
import java.lang.reflect.InvocationTargetException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Executor;

import javax.sql.ConnectionPoolDataSource;

import org.jooq.Configuration;
import org.jooq.ConnectionProvider;
import org.jooq.DSLContext;
import org.jooq.DataType;
import org.jooq.ExecutorProvider;
import org.jooq.RecordListener;
import org.jooq.SQLDialect;
import org.jooq.Table;
import org.jooq.conf.SettingsTools;
import org.jooq.exception.DataAccessException;
import org.jooq.impl.DSL;
import org.jooq.impl.DefaultConfiguration;

import com.gmt2001.datastore.DataStore;
import com.gmt2001.datastore2.record.AttachableRecord;
import com.gmt2001.util.Reflect;
import com.gmt2001.util.concurrent.ExecutorService;

import biz.source_code.miniConnectionPoolManager.MiniConnectionPoolManager;
import biz.source_code.miniConnectionPoolManager.MiniConnectionPoolManager.TimeoutException;
import reactor.core.publisher.Mono;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;

/**
 * Manages a JDBC-compatible, SQL-based, data storage method
 *
 * @see <a href="https://docs.oracle.com/javase/tutorial/jdbc/basics/index.html" target="_blank">JDBC Basics</a>
 *
 * @author gmt2001
 */
public abstract class Datastore2 {
    /**
     * Paths to exclude when calling {@link Reflect#loadPackageRecursive(String, List)}
     */
    private static final List<String> REFLECT_EXCLUDE = List.of("/meta/", "/records/");
    /**
     * Table name prefix for all tables created as POJOs
     */
    public static final String PREFIX = "phantombot2_";
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
     * Mono that caches the table list
     */
    private Mono<List<Table<?>>> tableMono = null;
    /**
     * Internal dispose sync
     */
    private boolean isDisposed = false;

    /**
     * Provides an instance of {@link Datastore2}
     * <p>
     * If the instance has not been initialized, calls {@link #init()}
     *
     * @return an instance of {@link Datastore2}
     */
    public static Datastore2 instance() {
        if (INSTANCE == null) {
            init();
        }

        return INSTANCE;
    }

    /**
     * Returns a timestamp suitable for database backup names in the format {@code yyyy-MM-dd.hh-mm-ss}
     *
     * @return the timestamp
     */
    public static String timestamp() {
        return LocalDateTime.now(PhantomBot.getTimeZoneId()).format(DateTimeFormatter.ofPattern("yyyy-MM-dd.hh-mm-ss"));
    }

    /**
     * Initializes a new instance of Datastore2, based on the property {@code datastore} in botlogin.txt
     * <p>
     * If a datastore driver is not specified or is blank, defaults to {@link H2Store2}
     * <p>
     * If this function is called when Datastore2 is already initialized, it is a no-op
     * <p>
     * Builtin datastore drivers are not case-sensitive. Custom datastore drivers are case-sensitive
     * <p>
     * If loading a custom datastore driver, the following requirements must be met:
     * <ul>
     * <li>Must extend {@link Datastore2}</li>
     * <li>Must call {@link #init(ConnectionPoolDataSource, SQLDialect)} or {@link #init(ConnectionPoolDataSource, int, int, SQLDialect)}, passing in a valid {@link ConnectionPoolDataSource}, in the constructor</li>
     * <li>May optionally start a timer in the constructor to periodically call {@link #doMaintenance()}</li>
     * <li>Must be in a JAR file located in the {@code ./datastores} folder</li>
     * <li>The name of the JAR file must match the output of {@link Class#getSimpleName()} (Classname) of the type, including case</li>
     * <li>The {@code .jar} file extension on the JAR file must be lower-case</li>
     * <li>The value of the {@code datastore} property in botlogin.txt must match the output of {@link Class#getName()} (Fully qualified classname) of the type, including case</li>
     * </ul>
     */
    public static synchronized void init() {
        if (INSTANCE != null) {
            return;
        }

        /**
         * @botproperty datastore - The type of DB to use. Valid values: `SQLiteStore2`, `MySQLStore2`, `MariaDBStore2`, `H2Store2`, a custom type as specified in the JavaDoc for Datastore2#init(). Default `H2Store2`
         * @botpropertycatsort datastore 10 30 Datastore
         * @botpropertyrestart datastore
         */
        Datastore2 instance = init(CaselessProperties.instance().getProperty("datastore", "H2Store2"));

        if (instance != null) {
            INSTANCE = instance;
        }
    }

    /**
     * Initializes a new instance of Datastore2
     *
     * @param dataStoreType the implementation of Datastore2 to initialize
     * @return an instance of Datastore2; {@code null} on failure
     * @see #init()
     */
    static synchronized Datastore2 init(String dataStoreType) {
        String packageName;
        String className;

        if (dataStoreType.isBlank()) {
            dataStoreType = "H2Store2";
        }

        // Split into package name and class name
        // Use default package name if missing
        if (!dataStoreType.contains(".")) {
            com.gmt2001.Console.debug.println("Using default package name");
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
            com.gmt2001.Console.debug.println("Checking for a built-in driver");
            // Resolve builtin classes case-insensitively
            final String fDataStoreType = className;
            final String fDataStoreType2 = DataStore.resolveClassname(className);
            Optional<String> tempdataStoreType = Reflect.instance()
                .loadPackageRecursive(Datastore2.class.getName()
                    .substring(0, Datastore2.class.getName().lastIndexOf('.')), REFLECT_EXCLUDE)
                .getSubTypesOf(Datastore2.class).stream().filter((c) -> {
                    return c.getSimpleName().equalsIgnoreCase(fDataStoreType)
                        || c.getSimpleName().equalsIgnoreCase(fDataStoreType2);
                }).map(c -> c.getName()).findFirst();

            if (tempdataStoreType.isPresent()) {
                com.gmt2001.Console.debug.println("Found a built-in driver");
                dataStoreType = tempdataStoreType.get();
                loader = Datastore2.class.getClassLoader();
            }
        }

        if (loader == null) {
            com.gmt2001.Console.debug.println("Preparing to load a custom driver");
            // Set loader to retrieve custom classes from jar files
            try {
                loader = new URLClassLoader(new URL[] { new URL("file://./datastores/" + className + ".jar") },
                        Datastore2.class.getClassLoader());
            } catch (MalformedURLException ex) {
                com.gmt2001.Console.debug.println("Failed to prepare a URLClassLoader");
                com.gmt2001.Console.err.logStackTrace(ex);
                loader = Datastore2.class.getClassLoader();
            }
        }

        com.gmt2001.Console.debug.println("Attempting to load Datastore2 driver " + dataStoreType);

        try {
            // Attempt to load into memory
            t = Class.forName(dataStoreType, true, loader);
            // Attempt to instantiate
            Datastore2 instance = (Datastore2)t.getDeclaredConstructor().newInstance();
            com.gmt2001.Console.debug.println("Datastore2 driver initialized");
            return instance;
        } catch (NoSuchMethodException | SecurityException | InstantiationException | IllegalAccessException | IllegalArgumentException
                | InvocationTargetException | ClassNotFoundException ex) {
                com.gmt2001.Console.err.println("Unable to load the Datastore2 driver " + dataStoreType);
                com.gmt2001.Console.err.printStackTrace(ex, Collections.singletonMap("dataStoreType", dataStoreType));
                if (ex.getCause() != null) {
                    com.gmt2001.Console.err.println("Caused by: " + ex.getCause().getClass().getName() + ": " + ex.getCause().getMessage());
                }
        }

        return null;
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

        Configuration configuration = new DefaultConfiguration().set(new ConnectionProvider() {
            @Override
            public Connection acquire() throws DataAccessException {
                try {
                    return getConnection();
                } catch (SQLException ex) {
                    throw new DataAccessException("failed to acquire connection", ex);
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

        }).set(sqlDialect).set(new ExecutorProvider(){
            @Override
            public Executor provide() {
                return ExecutorService.executorService();
            }

        }).set(RecordListener.onLoadEnd(ctx -> {
            if (AttachableRecord.class.isAssignableFrom(ctx.record().getClass())) {
                ((AttachableRecord) ctx.record()).doAttachments();
            }
        })).set(SettingsTools.defaultSettings().withReturnIdentityOnUpdatableRecord(false));
        this.dslContext = DSL.using(configuration);
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
     * Transactions are <b>not</b> committed automatically when closing a {@link Connection} that has auto-commit disabled
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
     * Instantiates {@link #tableMono} with the latest list of available tables in the database
     */
    private void tableMono() {
        this.tableMono = Mono.<List<Table<?>>>create(emitter -> emitter.success(this.dslContext().meta().getTables())).cache();
    }

    /**
     * Invalidates the cache of known tables
     * <p>
     * This should be called every time a table is created, renamed, or deleted
     */
    public void invalidateTableCache() {
        if (this.tableMono != null) {
            synchronized(this) {
                this.tableMono = null;
            }
        }
    }

    /**
     * Returns a list of cached known tables in a {@link Mono}
     * <p>
     * If the cache has not been invalidated, returns a {@link Mono} which returns the previous cached result
     * <p>
     * If the cache has been invalidated with {@link #invalidateTableCache()}, refreshes the cache
     *
     * @return a {@link Mono} which will provive a list of {@link Table}
     */
    public Mono<List<Table<?>>> tablesAsync() {
        synchronized(this) {
            if (this.tableMono == null) {
                this.tableMono();
            }
        }

        return this.tableMono;
    }

    /**
     * Returns a list of cached known tables, blocking until available
     * <p>
     * If the cache has not been invalidated, returns the previous cached result
     * <p>
     * If the cache has been invalidated with {@link #invalidateTableCache()}, refreshes the cache
     *
     * @return a list of {@link Table}
     */
    public List<Table<?>> tables() {
        return this.tablesAsync().block();
    }

    /**
     * Attempts to find the named table
     *
     * @param tableName the table name
     * @return an {@link Optional} which contains the matching {@link Table}, if found
     */
    public Optional<Table<?>> findTable(String tableName) {
        return this.tables().stream().filter(t -> t.getName().equals(tableName)).findFirst();
    }

    /**
     * Attempts to find the named table
     *
     * @param tableName the table name
     * @return the matching {@link Table}
     * @throws TableDoesNotExistException if the table can not be found or the cache is stale
     */
    public Table<?> findTableRequired(String tableName) throws TableDoesNotExistException {
        Optional<Table<?>> table = this.findTable(tableName);

        if (!table.isPresent()) {
            throw new TableDoesNotExistException(tableName);
        }

        return table.get();
    }

    /**
     * Returns the {@link DataType} representing the {@code LONGTEXT} equivalent SQL data type for the driver
     *
     * @return the DataType
     */
    public abstract DataType<String> longTextDataType();

    /**
     * Indicates if this driver supports making backups without an external tool
     *
     * @return {@code true} if supported
     */
    public boolean supportsBackup() {
        return false;
    }

    /**
     * Returns the default backup filename, which is usually the database name with {@link #timestamp()} appended
     *
     * @return the filename
     */
    public String backupFileName() {
        return timestamp();
    }

    /**
     * Performs a backup of the database to the {@code dbbackup} folder
     * <p>
     * The default backup filename is used from {@link #backupFileName()}
     */
    public void backup() {
        this.backup(this.backupFileName());
    }

    /**
     * Performs a backup of the database to the {@code dbbackup} folder
     *
     * @param fileName the name of the backup file
     */
    public void backup(String fileName) {
    }

    /**
     * Restores a database from the specified backup file, which must be in the {@code dbbackup} folder
     *
     * @param fileName the name of the backup file
     * @throws FileNotFoundException if the backup file can not be found
     */
    public void restoreBackup(String fileName) throws FileNotFoundException {
    }

    /**
     * Performs periodic database maintenance
     */
    public void doMaintenance() {
    }

    /**
     * Disposes of resources as necessary
     * <p>
     * Once this is called, the connection pool is invalid and the program must be restarted to futher access the database
     */
    public synchronized void dispose() {
        if (this.isDisposed) {
            return;
        }

        this.isDisposed = true;

        this.driverDispose();

        if (this.connectionPoolManager != null) {
            try {
                this.connectionPoolManager.dispose();
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    /**
     * Allows the driver to perform additional disposal actions beyond what the base Datastore2 class performs
     * <p>
     * This method is called before the connection pool is disposed
     */
    protected void driverDispose() {
    }
}
