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
import org.mariadb.jdbc.MariaDbPoolDataSource;

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

        MariaDbPoolDataSource dataSource = new MariaDbPoolDataSource();
        try {
            dataSource.setUrl(connectionString);
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

        this.init(dataSource, SQLDialect.MARIADB);
    }

    @Override
    public DataType<String> longTextDataType() {
        return LONGTEXT;
    }
}
