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

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Map;

import org.jooq.DataType;
import org.jooq.SQLDialect;
import org.jooq.impl.DefaultDataType;
import org.jooq.impl.SQLDataType;

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
}
