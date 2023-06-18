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

import org.jooq.SQLDialect;
import org.sqlite.SQLiteConfig;
import org.sqlite.javax.SQLiteConnectionPoolDataSource;

import com.gmt2001.ExecutorService;
import com.gmt2001.PathValidator;

import tv.phantombot.CaselessProperties;

/**
 * Provides a {@link Datastore2} driver for SQLite database v3.x
 *
 * @author gmt2001
 */
public class SQLiteStore2 extends Datastore2 {
    /**
     * Maximum allowed WAL size before an early full {@code VACUUM} occurs
     */
    private static final long MAXWALSIZE = 104857600L;
    /**
     * Instant when the next periodic full {@code VACUUM} will occur
     */
    private Instant nextVacuum = Instant.now().plus(1, ChronoUnit.DAYS);

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

            com.gmt2001.Console.debug.println("STARTUP VACUUM");
            try ( PreparedStatement vacuumStatement = connection.prepareStatement("VACUUM;")) {
                vacuumStatement.execute();
            }

        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        ExecutorService.scheduleAtFixedRate(this::doMaintenance, 3, 3, TimeUnit.HOURS);
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
                boolean vacuumed = false;
                try {
                    Path walPath = PathValidator.getRealPath(Paths.get(getDbFile() + "-wal"));
                    if (Files.exists(walPath) && Files.size(walPath) > MAXWALSIZE) {
                        vacuumed = true;
                        com.gmt2001.Console.debug.println("MAXWALSIZE VACUUM");
                        try ( PreparedStatement vacuumStatement = connection.prepareStatement("VACUUM;")) {
                            vacuumStatement.execute();
                            this.nextVacuum = Instant.now().plus(1, ChronoUnit.DAYS);
                        }
                    }
                } catch (IOException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }

                if (!vacuumed) {
                    if (this.nextVacuum.isBefore(Instant.now())) {
                        com.gmt2001.Console.debug.println("DAILY VACUUM");
                        try ( PreparedStatement vacuumStatement = connection.prepareStatement("VACUUM;")) {
                            vacuumStatement.execute();
                            this.nextVacuum = Instant.now().plus(1, ChronoUnit.DAYS);
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
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    protected void driverDispose() {
        try {
            com.gmt2001.Console.debug.println("VACUUM on dispose");

            try ( Connection connection = this.getConnection()) {
                try ( PreparedStatement vacuumStatement = connection.prepareStatement("VACUUM;")) {
                    vacuumStatement.execute();
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }
}
