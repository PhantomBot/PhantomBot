/*
 * Copyright (C) 2016-2025 phantombot.github.io/PhantomBot
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
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.TimeUnit;

import org.jooq.DataType;
import org.jooq.SQLDialect;
import org.jooq.impl.DefaultDataType;
import org.jooq.impl.SQLDataType;
import org.sqlite.SQLiteConfig;
import org.sqlite.javax.SQLiteConnectionPoolDataSource;

import com.gmt2001.PathValidator;
import com.gmt2001.util.concurrent.ExecutorService;

import tv.phantombot.CaselessProperties;
import tv.phantombot.cache.TwitchCache;

/**
 * Provides a {@link Datastore2} driver for SQLite database v3.x
 *
 * @author gmt2001
 */
public final class SQLiteStore2 extends Datastore2 {
    /**
     * Maximum allowed WAL size before an forced WAL truncate occurs
     */
    private static final long MAXWALSIZE = 104857600L;
    /**
     * Instant when the next forced WAL restart will occur
     */
    private Instant nextCheckpoint = Instant.now().plus(1, ChronoUnit.DAYS);
    /**
     * Instant when the next {@code VACUUM} will occur
     */
    private Instant nextVacuum = Instant.now().plus(3, ChronoUnit.DAYS);
    /**
     * SQLite {@code LONGTEXT} type
     */
    private static final DataType<String> LONGTEXT = new DefaultDataType<>(SQLDialect.SQLITE, SQLDataType.CLOB, "text");

    /**
     * Returns the name of the SQLite database file
     *
     * @return the name of the database file
     */
    public static String getDbFile() {
        /**
         * @botproperty sqlitedbfile - The name of the H2 database file. Default `phantombot.db`
         * @botpropertycatsort sqlitedbfile 60 30 Datastore
         * @botpropertyrestart sqlitedbfile
         */
        return CaselessProperties.instance().getProperty("SQLiteDBFile", "phantombot.db");
    }

    /**
     * Constructor
     */
    public SQLiteStore2() {
        super();

        try {
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        }

        SQLiteConfig config = new SQLiteConfig();
        config.setCacheSize(-50000);
        config.setSynchronous(SQLiteConfig.SynchronousMode.NORMAL);
        config.setTempStore(SQLiteConfig.TempStore.MEMORY);
        config.setJournalMode(SQLiteConfig.JournalMode.WAL);
        config.setBusyTimeout(10000);

        SQLiteConnectionPoolDataSource dataSource = new SQLiteConnectionPoolDataSource(config);
        dataSource.setUrl("jdbc:sqlite:./config/" + getDbFile());
        this.init(dataSource, SQLDialect.SQLITE);

        try ( Connection connection = this.getConnection()) {
            boolean hasAutoVacuum = false;
            try ( PreparedStatement statement = connection.prepareStatement("PRAGMA auto_vacuum;")) {
                try ( ResultSet rs = statement.executeQuery()) {
                    if (rs.next()) {
                        if (rs.getInt("auto_vacuum") == 2) {
                            hasAutoVacuum = true;
                        }
                    }
                }
            }

            if (!hasAutoVacuum) {
                com.gmt2001.Console.debug.println("Enabling auto_vacuum");
                try ( PreparedStatement pragmaStatement = connection.prepareStatement("PRAGMA auto_vacuum = 2;")) {
                    pragmaStatement.execute();
                }
            }

            com.gmt2001.Console.debug.println("Startup checkpoint");
            try ( PreparedStatement vacuumStatement = connection.prepareStatement("PRAGMA wal_checkpoint(RESTART);")) {
                vacuumStatement.execute();
            }

            try (ResultSet rs = connection.getMetaData().getTables(null, null, "phantombot2_sqlite_pragma", null)) {
                if (!rs.next()) {
                    try ( PreparedStatement createPragmaStatement = connection.prepareStatement("CREATE TABLE IF NOT EXISTS phantombot2_sqlite_pragma (variable string PRIMARY KEY, value string);") ) {
                        createPragmaStatement.execute();
                    }
                }
            }
            try ( PreparedStatement nextVacuumStatement = connection.prepareStatement("SELECT value FROM phantombot2_sqlite_pragma WHERE variable='nextVacuum';") ) {
                try ( ResultSet rs = nextVacuumStatement.executeQuery() ) {
                    if (rs.next()) {
                        this.nextVacuum = Instant.parse(rs.getString("value"));
                    }
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        ExecutorService.scheduleAtFixedRate(this::doMaintenance, 3, 3, TimeUnit.HOURS);
    }

    @Override
    public DataType<String> longTextDataType() {
        return LONGTEXT;
    }

    @Override
    public boolean supportsBackup() {
        return true;
    }

    @Override
    public String backupFileName() {
        return getDbFile() + "." + Datastore2.timestamp() + ".sqlite3.db";
    }

    @Override
    public void backup(String fileName) {
        try ( Connection connection = this.getConnection()) {
            Files.createDirectories(PathValidator.getRealPath(Paths.get("./dbbackup/")));

            try ( Statement statement = connection.createStatement()) {
                statement.execute("BACKUP TO './dbbackup/" + fileName + "'");
                com.gmt2001.Console.debug.println("Backed up SQLite DB to ./dbbackup/" + fileName);
            }
        } catch (SQLException | IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void restoreBackup(String fileName) throws FileNotFoundException {
        Path p = PathValidator.getRealPath(Paths.get("./dbbackup/"));

        if (!Files.exists(p)) {
            throw new FileNotFoundException(p.toString());
        }

        try ( Connection connection = this.getConnection()) {
            try ( Statement statement = connection.createStatement()) {
                statement.execute("RESTORE FROM '" + p.toString() + "'");
                com.gmt2001.Console.debug.println("Restored SQLite backup from " + p.toString());
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void doMaintenance() {
        try {
            try ( Connection connection = this.getConnection()) {
                boolean checkpointed = false;

                if (!TwitchCache.instance().isStreamOnline() && this.nextVacuum.isBefore(Instant.now())) {
                    checkpointed = true;
                    com.gmt2001.Console.debug.println("3 day VACUUM");
                    try ( PreparedStatement vacuumStatement = connection.prepareStatement("VACUUM;")) {
                        vacuumStatement.execute();
                    }

                    try ( PreparedStatement pragmaTableStatement = connection.prepareStatement("INSERT OR REPLACE INTO phantombot2_sqlite_pragma (variable, value) VALUES ('nextVacuum', ?);")) {
                        this.nextVacuum = Instant.now().plus(3, ChronoUnit.DAYS);
                        pragmaTableStatement.setString(1, this.nextVacuum.toString());
                        pragmaTableStatement.execute();
                    }
                }

                try {
                    Path walPath = PathValidator.getRealPath(Paths.get(getDbFile() + "-wal"));
                    if (!checkpointed && !TwitchCache.instance().isStreamOnline() && Files.exists(walPath) && Files.size(walPath) > MAXWALSIZE) {
                        checkpointed = true;
                        com.gmt2001.Console.debug.println("MAXWALSIZE CHECKPOINT");
                        try ( PreparedStatement checkpointStatement = connection.prepareStatement("PRAGMA wal_checkpoint(TRUNCATE);")) {
                            checkpointStatement.execute();
                            this.nextCheckpoint = Instant.now().plus(1, ChronoUnit.DAYS);
                        }
                    }
                } catch (IOException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }

                if (!checkpointed) {
                    if (this.nextCheckpoint.isBefore(Instant.now())) {
                        com.gmt2001.Console.debug.println("DAILY CHECKPOINT");
                        try ( PreparedStatement vacuumStatement = connection.prepareStatement("PRAGMA wal_checkpoint(RESTART);")) {
                            vacuumStatement.execute();
                            this.nextCheckpoint = Instant.now().plus(1, ChronoUnit.DAYS);
                        }
                    } else {
                        com.gmt2001.Console.debug.println("PRAGMA incremental_vacuum(2048)");
                        try ( PreparedStatement vacuumStatement = connection.prepareStatement("PRAGMA incremental_vacuum(2048);")) {
                            vacuumStatement.execute();
                        }
                    }
                }
            }
        } catch (SQLException ex) {
            if (!ex.getMessage().contains("cannot VACUUM from within a transaction")) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }
}
