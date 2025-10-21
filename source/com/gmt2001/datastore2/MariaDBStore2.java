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
import java.nio.file.StandardOpenOption;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.jooq.CreateIndexIncludeStep;
import org.jooq.CreateIndexStep;
import org.jooq.CreateTableElementListStep;
import org.jooq.DDLQuery;
import org.jooq.DataType;
import org.jooq.Index;
import org.jooq.InsertSetMoreStep;
import org.jooq.InsertSetStep;
import org.jooq.SQLDialect;
import org.jooq.UniqueKey;
import org.jooq.impl.DefaultDataType;
import org.jooq.impl.SQLDataType;
import org.mariadb.jdbc.MariaDbDataSource;

import com.gmt2001.PathValidator;
import com.gmt2001.datastore.DataStore;

import tv.phantombot.CaselessProperties;

/**
 * Provides a {@link Datastore2} driver for MariaDB v11.x
 *
 * @author gmt2001
 */
public final class MariaDBStore2 extends Datastore2 {
    /**
     * MariaDB {@code LONGTEXT} type
     */
    private static final DataType<String> LONGTEXT = new DefaultDataType<>(SQLDialect.MARIADB, SQLDataType.CLOB, "longtext", "char");

    /**
     * Constructor
     */
    public MariaDBStore2() {
        super();

        try {
            Class.forName("org.mariadb.jdbc.Driver");
        } catch (ClassNotFoundException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        }

        String connectionString;
        String dbname = CaselessProperties.instance().getProperty("mysqlname", "");

        if (dbname.isBlank()) {
            dbname = "phantombot";
        }

        if (CaselessProperties.instance().getProperty("mysqlport", "").isEmpty()) {
            connectionString = "jdbc:mariadb://" + CaselessProperties.instance().getProperty("mysqlhost", "") + "/" + dbname + "?useSSL=" + (CaselessProperties.instance().getPropertyAsBoolean("mysqlssl", false) ? "true" : "false") + "&user=" + CaselessProperties.instance().getProperty("mysqluser", "") + "&password=" + CaselessProperties.instance().getProperty("mysqlpass", "");
        } else {
            connectionString = "jdbc:mariadb://" + CaselessProperties.instance().getProperty("mysqlhost", "") + ":" + CaselessProperties.instance().getProperty("mysqlport", "") + "/" + dbname + "?useSSL=" + (CaselessProperties.instance().getPropertyAsBoolean("mysqlssl", false) ? "true" : "false") + "&user=" + CaselessProperties.instance().getProperty("mysqluser", "") + "&password=" + CaselessProperties.instance().getProperty("mysqlpass", "");
        }

        MariaDbDataSource dataSource = new MariaDbDataSource();
        try {
            dataSource.setUrl(connectionString);
        } catch (SQLException ex) {
            ex.printStackTrace(System.err);
        }

        try (Connection connection = dataSource.getConnection()) {
            try (Statement statement = connection.createStatement()) {
                try (ResultSet rs = statement.executeQuery("SELECT VERSION() AS VERSION;")) {
                    if (rs.next() && !rs.getString("VERSION").contains("-MariaDB")) {
                        com.gmt2001.Console.warn.println("This looks like MySQL (" + rs.getString("VERSION") + "), but MariaDBStore2 is selected. If this is MariaDB, you can ignore this message. If this is MySQL, please shutdown the bot, open botlogin.txt, and change the datastore to datastore=MySQLStore2");
                    }
                }
            }
            this.checkVersion(SQLDialect.MARIADB, connection, MariaDBStore2.class.getSimpleName());
            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE DATABASE IF NOT EXISTS `" + dbname.replaceAll("`", "``") + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;");
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex, Map.of("_____report", Boolean.FALSE));
        }

        this.init(dataSource, SQLDialect.MARIADB);
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
        return "mariadb." + Datastore2.timestamp() + ".sql";
    }

    @Override
    public void backup(String fileName) {
        try {
            Files.createDirectories(PathValidator.getRealPath(Paths.get("./dbbackup/")));
            final List<String> lines = new ArrayList<>();
            this.tables().stream()
                    .filter(t -> t.getName().toLowerCase().startsWith(DataStore.PREFIX.toLowerCase())
                            || t.getName().toLowerCase().startsWith(Datastore2.PREFIX.toLowerCase()))
                    .forEach(oldtable -> {
                        lines.add(this.dslContext().dropTableIfExists(oldtable.getName()).cascade().getSQL());
                        CreateTableElementListStep cr = this.dslContext()
                                .createTableIfNotExists(oldtable.getName()).columns(oldtable.fields());
                        UniqueKey<?> primaryKey = oldtable.getPrimaryKey();
                        if (primaryKey != null && !primaryKey.getFields().isEmpty()) {
                            cr = cr.primaryKey(primaryKey.getFields());
                        }
                        lines.add(cr.getSQL());
                        List<Index> indexes = oldtable.getIndexes();
                        if (!indexes.isEmpty()) {
                            indexes.forEach(index -> {
                                CreateIndexStep cii;
                                if (index.getUnique()) {
                                    cii = this.dslContext().createUniqueIndexIfNotExists(index.getName());
                                } else {
                                    cii = this.dslContext().createIndexIfNotExists(index.getName());
                                }
                                CreateIndexIncludeStep ci = cii.on(oldtable.getName(),
                                        index.getFields().stream().map(f -> f.getName()).toList());
                                DDLQuery cid = ci;
                                if (index.getWhere() != null) {
                                    cid = ci.where(index.getWhere());
                                }
                                lines.add(cid.getSQL());
                            });
                        }
                        InsertSetStep<?> is = this.dslContext().insertInto(oldtable);
                        InsertSetMoreStep<?> ism = null;
                        for (org.jooq.Record record: this.dslContext()
                                .selectFrom(oldtable).fetch().stream().collect(Collectors.toList())) {
                                    record.changed(true);
                                    if (ism == null) {
                                        ism = is.set(record);
                                    } else {
                                        ism = ism.set(record);
                                    }
                                }
                        if (ism != null) {
                            lines.add(ism.getSQL());
                        }
                    });
                    Files.write(PathValidator.getRealPath(Paths.get("./dbbackup/", fileName)), lines, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void restoreBackup(String fileName) throws FileNotFoundException {
        Path p = PathValidator.getRealPath(Paths.get("./dbbackup/", fileName));

        if (!Files.exists(p)) {
            throw new FileNotFoundException(p.toString());
        }

        this.restoreBackup(p);
    }

    private void restoreBackup(Path p) {
        com.gmt2001.Console.out.print("Restoring MariaDB database from backup at " + p.toString() + "...");
        try {
            List<String> lines = Files.readAllLines(p);
            this.dslContext().transaction(c -> {
                lines.forEach(line -> {
                    c.dsl().execute(line);
                });
            });
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        com.gmt2001.Console.out.println("done");
    }
}
