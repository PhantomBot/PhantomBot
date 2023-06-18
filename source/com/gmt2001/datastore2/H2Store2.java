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
import java.sql.SQLException;
import java.sql.Statement;

import org.h2.jdbcx.JdbcDataSource;
import org.jooq.SQLDialect;

import com.gmt2001.PathValidator;

import tv.phantombot.CaselessProperties;

/**
 * Provides a {@link Datastore2} driver for H2 database v2.x
 *
 * @author gmt2001
 */
public class H2Store2 extends Datastore2 {
    /**
     * Returns the name of the H2 database file, without the trailing {@code .mv.db}
     *
     * @return the name of the database file
     */
    public static String getDbFile() {
        /**
         * @botproperty h2dbfile - The name of the H2 database file. Default `phantombot.h2`
         * @botpropertycatsort h2dbfile 20 30 Datastore
         * @botpropertyrestart h2dbfile
         */
        return CaselessProperties.instance().getProperty("H2DBFile", "phantombot.h2");
    }

    public H2Store2() {
        super();

        try {
            Class.forName("org.h2.Driver");
        } catch (ClassNotFoundException ex) {
            ex.printStackTrace(System.err);
            return;
        }

        JdbcDataSource dataSource = new JdbcDataSource();
        dataSource.setURL("jdbc:h2:./config/" + getDbFile() + ";AUTO_SERVER=TRUE;MAX_LENGTH_INPLACE_LOB=2048");
        this.init(dataSource, SQLDialect.H2);
    }

    @Override
    public String backupFileName() {
        return getDbFile() + "." + Datastore2.timestamp() + ".h2.sql.gz";
    }

    @Override
    public void backup(String fileName) {
        try ( Connection connection = this.getConnection()) {
            Files.createDirectories(PathValidator.getRealPath(Paths.get("./dbbackup/")));

            try ( Statement statement = connection.createStatement()) {
                statement.execute("SCRIPT DROP TO './dbbackup/" + fileName + "' COMPRESSION GZIP");
                com.gmt2001.Console.debug.println("Backed up H2 DB to ./dbbackup/" + fileName);
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
                statement.execute("RUNSCRIPT FROM '" + p.toString() + "' COMPRESSION GZIP");
                com.gmt2001.Console.debug.println("Restored H2 backup from " + p.toString());
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void doMaintenance() {
    }

    @Override
    protected void driverDispose() {
    }
}
