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

import com.gmt2001.PathValidator;
import com.gmt2001.datastore.DataStore;
import com.mysql.cj.jdbc.MysqlConnectionPoolDataSource;

import tv.phantombot.CaselessProperties;

/**
 * Provides a {@link Datastore2} driver for MySQL database v8.x
 *
 * @author gmt2001
 */
public final class MySQLStore2 extends Datastore2 {
    /**
     * MySQL {@code LONGTEXT} type
     */
    private static final DataType<String> LONGTEXT = new DefaultDataType<>(SQLDialect.MYSQL, SQLDataType.CLOB, "longtext", "char");

    /**
     * Constructor
     */
    public MySQLStore2() {
        super();

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        }

        /**
         * @botproperty mysqlport - The port to use for MySQL connections. Default `3306`
         * @botpropertycatsort mysqlport 210 30 Datastore
         * @botpropertyrestart mysqlport
         */
        /**
         * @botproperty mysqlhost - The IP, domain name, or hostname of the MySQL server
         * @botpropertycatsort mysqlhost 200 30 Datastore
         * @botpropertyrestart mysqlhost
         */
        /**
         * @botproperty mysqlname - The schema where the tables for the bot will be created/located on the MySQL server
         * @botpropertycatsort mysqlname 220 30 Datastore
         * @botpropertyrestart mysqlname
         */
        /**
         * @botproperty mysqluser - The username to login as to the MySQL server
         * @botpropertycatsort mysqluser 230 30 Datastore
         * @botpropertyrestart mysqluser
         */
        /**
         * @botproperty mysqlpass - The password for `mysqluser`
         * @botpropertycatsort mysqlpass 240 30 Datastore
         * @botpropertyrestart mysqlpass
         */
        /**
         * @botproperty mysqlssl - Indicates if SSL should be used for the MySQL connection
         * @botpropertycatsort mysqlssl 250 30 Datastore
         * @botpropertyrestart mysqlssl
         */
        String connectionString;
        String dbname = CaselessProperties.instance().getProperty("mysqlname", "");

        if (dbname.isBlank()) {
            dbname = "phantombot";
        }

        if (CaselessProperties.instance().getProperty("mysqlport", "").isEmpty()) {
            connectionString = "jdbc:mysql://" + CaselessProperties.instance().getProperty("mysqlhost", "") + "/" + dbname + "?useSSL=" + (CaselessProperties.instance().getPropertyAsBoolean("mysqlssl", false) ? "true" : "false") + "&user=" + CaselessProperties.instance().getProperty("mysqluser", "") + "&password=" + CaselessProperties.instance().getProperty("mysqlpass", "");
        } else {
            connectionString = "jdbc:mysql://" + CaselessProperties.instance().getProperty("mysqlhost", "") + ":" + CaselessProperties.instance().getProperty("mysqlport", "") + "/" + dbname + "?useSSL=" + (CaselessProperties.instance().getPropertyAsBoolean("mysqlssl", false) ? "true" : "false") + "&user=" + CaselessProperties.instance().getProperty("mysqluser", "") + "&password=" + CaselessProperties.instance().getProperty("mysqlpass", "");
        }

        MysqlConnectionPoolDataSource dataSource = new MysqlConnectionPoolDataSource();
        dataSource.setURL(connectionString);

        try {
            //Ensure correct collation and encoding
            dataSource.setConnectionCollation("utf8mb4_general_ci");
            dataSource.setCharacterEncoding("UTF-8");
            /**
             * @botproperty mysqlallowpublickeyretrieval - Indicates if retrieval of the public key from the MySQL server is allowed for authentication (needed for newer authentication methods like 'caching_sha2_password')
             * @botpropertytype mysqlallowpublickeyretrieval Boolean
             * @botpropertycatsort mysqlallowpublickeyretrieval 260 30 Datastore
             * @botpropertyrestart mysqlallowpublickeyretrieval
             */
            dataSource.setAllowPublicKeyRetrieval(CaselessProperties.instance().getPropertyAsBoolean("mysqlallowpublickeyretrieval", false));
        } catch (SQLException ex) {
            ex.printStackTrace(System.err);
        }

        try (Connection connection = dataSource.getConnection()) {
            try (Statement statement = connection.createStatement()) {
                try (ResultSet rs = statement.executeQuery("SELECT VERSION() AS VERSION;")) {
                    if (rs.next() && rs.getString("VERSION").contains("-MariaDB")) {
                        throw new IllegalStateException("Detected MariaDB (" + rs.getString("VERSION") + "), but MySQLStore2 is selected. Please shutdown the bot, open botlogin.txt, and change the datastore to datastore=MariaDBStore2");
                    }
                }
            }
            this.checkVersion(SQLDialect.MYSQL, connection, MySQLStore2.class.getSimpleName());
            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE DATABASE IF NOT EXISTS `" + dbname.replaceAll("`", "``") + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;");
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex, Map.of("_____report", Boolean.FALSE));
        }

        this.init(dataSource, SQLDialect.MYSQL);
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
        com.gmt2001.Console.out.print("Restoring MySQLDB database from backup at " + p.toString() + "...");
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
