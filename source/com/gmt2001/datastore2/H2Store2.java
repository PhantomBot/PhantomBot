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
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.sql.Connection;
import java.sql.Driver;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.stream.Stream;

import org.h2.jdbcx.JdbcDataSource;
import org.jooq.DataType;
import org.jooq.SQLDialect;
import org.jooq.impl.DefaultDataType;
import org.jooq.impl.SQLDataType;

import com.gmt2001.PathValidator;

import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;

/**
 * Provides a {@link Datastore2} driver for H2 database v2.x
 *
 * @author gmt2001
 */
public final class H2Store2 extends Datastore2 {
    /**
     * H2 {@code LONGTEXT} type
     */
    private static final DataType<String> LONGTEXT = new DefaultDataType<>(SQLDialect.H2, SQLDataType.CLOB, "longtext");
    /**
     * Map of H2 database formats and drivers for upgrading
     */
    private static final Map<Integer, String> UPGRADES = Map.of(
        1, "1.4.200",
        2, "2.1.214"
    );
    /**
     * The current format of H2 database
     */
    private static final int CURRENT_FORMAT = 3;

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

    /**
     * Constructor
     */
    public H2Store2() {
        super();

        int format = this.checkUpgrade();

        if (format >= 0) {
            format = this.startUpgrade(format);
            if (format == -1) {
                com.gmt2001.Console.err.println("H2 Database Upgrade Canceled");
            }
        }

        try {
            Class.forName("org.h2.Driver");
        } catch (ClassNotFoundException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        }

        if (format >= 0) {
            this.finishUpgrade(format);
        }

        this.restoreBackup();

        JdbcDataSource dataSource = new JdbcDataSource();
        dataSource.setURL("jdbc:h2:./config/" + getDbFile() + ";DB_CLOSE_ON_EXIT=FALSE;MAX_LENGTH_INPLACE_LOB=2048");
        this.init(dataSource, SQLDialect.H2);
    }

    /**
     * Checks if the database needs to be upgraded
     *
     * @return {@code -1} if no upgrade is required or an Exception ocurred; otherwise, the format that was detected
     */
    private int checkUpgrade() {
        Path dbfile = Paths.get("./config/", getDbFile() + ".mv.db");

        if (!Files.exists(dbfile)) {
            return -1;
        }

        try (Stream<String> fs = Files.lines(dbfile)) {
            String line = fs.limit(1).findFirst().orElse("");
            int fmtloc = line.indexOf(",format:") + 8;
            int fmt = Integer.parseInt(line.substring(fmtloc, line.indexOf(",", fmtloc)));
            if (fmt < CURRENT_FORMAT && UPGRADES.containsKey(fmt)) {
                return fmt;
            }
        } catch (IOException | NumberFormatException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return -1;
    }

    /**
     * Starts the upgrade process
     * <p>
     * <ul>
     * <li>Backs up the database file to the {@code dbbackup} folder</li>
     * <li>Loads the old H2 engine</li>
     * <li>Exports the database to an SQL script file using {@code SCRIPT TO}</li>
     * <li>Deletes the original database file</li>
     * </ul>
     *
     * @param format the format the database is being upgraded from
     * @return {@code -1} if the upgrade is canceled due to an Exception; otherwise, the format the database is being upgraded from
     */
    private int startUpgrade(int format) {
        com.gmt2001.Console.out.println("Upgrading H2 database from v" + format + " to v" + CURRENT_FORMAT);

        Path dbfile = Paths.get("./config/", getDbFile() + ".mv.db");
        Path scriptfile = Paths.get("./config/", getDbFile() + ".sql");
        Path backupfile = Paths.get("./dbbackup/", getDbFile() + ".mv.db");

        try {
            com.gmt2001.Console.out.print("Saving a backup to " + backupfile.toString() + "...");
            Files.createDirectories(Paths.get("./dbbackup/"));
            Files.copy(dbfile, backupfile, StandardCopyOption.REPLACE_EXISTING);
            com.gmt2001.Console.out.println("done");
        } catch (IOException e) {
            com.gmt2001.Console.err.printStackTrace(e);
        }

        com.gmt2001.Console.out.print("Loading H2 engine " + UPGRADES.get(format) + "...");
        try {
            URL oldh2Jar = Paths.get(PhantomBot.class.getProtectionDomain().getCodeSource().getLocation().toURI()).getParent().resolve("lib.extra/h2-" + UPGRADES.get(format) + ".jar").toUri().toURL();
            try (URLClassLoader cl = URLClassLoader.newInstance(new URL[] { oldh2Jar }, ClassLoader.getPlatformClassLoader())) {
                Driver drv = null;
                try {
                    Class<?> c = Class.forName("org.h2.Driver", true, cl);
                    Method m = c.getDeclaredMethod("load");
                    drv = (Driver) c.getConstructor().newInstance();
                    m.invoke(c);
                    com.gmt2001.Console.out.println("done");
                } catch (ClassNotFoundException | InstantiationException | IllegalAccessException | IllegalArgumentException | InvocationTargetException | NoSuchMethodException | SecurityException ex) {
                    com.gmt2001.Console.out.println();
                    com.gmt2001.Console.err.printStackTrace(ex);
                    return -1;
                }

                try {
                    com.gmt2001.Console.out.print("Exporting the database from H2 " + UPGRADES.get(format) + "...");
                    Properties prop = new Properties();
                    prop.put("user", "");
                    prop.put("password", "");
                    try (Connection con = drv.connect("jdbc:h2:./config/" + getDbFile() + ";DB_CLOSE_ON_EXIT=FALSE;MAX_LENGTH_INPLACE_LOB=2048", prop);
                            Statement st = con.createStatement()) {
                        st.execute("SCRIPT TO '" + scriptfile.toString() + "' COMPRESSION GZIP");
                    } catch (SQLException ex) {
                        com.gmt2001.Console.out.println();
                        com.gmt2001.Console.err.printStackTrace(ex);
                        return -1;
                    }
                    Files.delete(dbfile);
                    com.gmt2001.Console.out.println("done");
                } catch (Exception ex) {
                    com.gmt2001.Console.out.println();
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            }
        } catch(IOException | URISyntaxException ex) {
            com.gmt2001.Console.out.println();
            com.gmt2001.Console.err.printStackTrace(ex);
            return -1;
        }

        return format;
    }

    /**
     * Completes the upgrade process
     * <p>
     * <ul>
     * <li>Imports the database from an SQL script file using {@code RUNSCRIPT}</li>
     * <li>Deletes the SQL script file</li>
     * </ul>
     *
     * @param format the format the database is being upgraded from
     */
    private void finishUpgrade(int format) {
        Path scriptfile = Paths.get("./config/", getDbFile() + ".sql");

        try {
            com.gmt2001.Console.out.print("Importing the database to the latest H2...");
            JdbcDataSource dataSource = new JdbcDataSource();
            dataSource.setURL("jdbc:h2:./config/" + getDbFile() + ";DB_CLOSE_ON_EXIT=FALSE;MAX_LENGTH_INPLACE_LOB=2048");
            try (Connection con = dataSource.getConnection();
                        Statement st = con.createStatement()) {
                st.execute("RUNSCRIPT FROM '" + scriptfile.toString() + "' COMPRESSION GZIP" + (format == 1 ? " FROM_1X" : ""));
            } catch (SQLException ex) {
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.err.printStackTrace(ex);
            }
            com.gmt2001.Console.out.println("done");
        } catch (Exception ex) {
            com.gmt2001.Console.out.println();
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        try {
            com.gmt2001.Console.out.print("Performing cleanup...");
            Files.delete(scriptfile);
            com.gmt2001.Console.out.println("done");
        } catch (IOException e) {
            com.gmt2001.Console.err.printStackTrace(e);
        }

        com.gmt2001.Console.out.println("H2 Database Upgrade Complete");
    }

    /**
     * Automatically restores a backup from a {@code .h2.sql.gz} file that has been placed in the {@code config} directory
     * <p>
     * This method will run {@code DROP ALL OBJECTS} before it imports the backup with {@code RUNSCRIPT}
     */
    private void restoreBackup() {
        try (Stream<Path> backupStream = Files.find(Paths.get("./config/"), 1, (path, attr) -> attr.isRegularFile() && path.toString().endsWith(".h2.sql.gz"))) {
            Optional<Path> backup = backupStream.findFirst();
            if (backup.isPresent()) {
                com.gmt2001.Console.out.print("Restoring H2 database from backup at " + backup.get().toString() + "...");
                Path dbfile = Paths.get("./config/", getDbFile() + ".mv.db");
                JdbcDataSource dataSource = new JdbcDataSource();
                dataSource.setURL("jdbc:h2:./config/" + getDbFile() + ";DB_CLOSE_ON_EXIT=FALSE;MAX_LENGTH_INPLACE_LOB=2048");
                try (Connection con = dataSource.getConnection();
                        Statement st = con.createStatement()) {
                    st.execute("DROP ALL OBJECTS");
                    st.execute("RUNSCRIPT FROM '" + backup.get().toString() + "' COMPRESSION GZIP");
                } catch (SQLException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
                Files.delete(backup.get());
                com.gmt2001.Console.out.println("done");
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
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
}
