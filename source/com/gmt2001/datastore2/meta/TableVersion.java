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
package com.gmt2001.datastore2.meta;

import java.util.Optional;

import org.jooq.Table;
import org.jooq.TableField;
import org.jooq.UniqueKey;
import org.jooq.impl.DSL;
import org.jooq.impl.Internal;
import org.jooq.impl.SQLDataType;
import org.jooq.impl.TableImpl;

import com.gmt2001.datastore2.Datastore2;

/**
 * Stores the DDL version of managed Datastore2 tables
 *
 * @author gmt2001
 */
public final class TableVersion extends TableImpl<TableVersionRecord> {

    /**
     * Instance
     */
    private static final TableVersion INSTANCE = new TableVersion();

    /**
     * Table name in the database
     */
    private static final String TABLENAME = Datastore2.PREFIX + "Meta_TableVersion";

    /**
     * Provides an instance of {@link TableVersion}
     *
     * @return an instance of {@link TableVersion}
     */
    public static TableVersion instance() {
        return INSTANCE;
    }

    static {
        checkAndCreateTable();
    }

    /**
     * The class holding records for this table
     */
    @Override
    public Class<TableVersionRecord> getRecordType() {
        return TableVersionRecord.class;
    }

    /**
     * The name of the managed table whose version is stored in the record
     */
    public final TableField<TableVersionRecord, String> TABLE = createField(DSL.name("table"), SQLDataType.VARCHAR(255).nullable(false), this, "");

    /**
     * The version of the managed table
     */
    public final TableField<TableVersionRecord, Long> VERSION = createField(DSL.name("version"), SQLDataType.BIGINT.nullable(false).defaultValue(1L), this, "");

    /**
     * Constructor
     */
    private TableVersion() {
        super(DSL.name(TABLENAME));
    }

    /**
     * The primary key constraint
     *
     * @return the key
     */
    @Override
    public UniqueKey<TableVersionRecord> getPrimaryKey() {
        return Internal.createUniqueKey(this, DSL.name(TABLENAME + "_PK"), this.TABLE);
    }

    /**
     * Checks if the database table for {@link TableVersion} exists, and creates it if it is missing
     */
    private static void checkAndCreateTable() {
        Optional<Table<?>> table = Datastore2.instance().findTable(TABLENAME);

        if (!table.isPresent()) {
            try {
                Datastore2.instance().dslContext().createTableIfNotExists(TABLENAME)
                    .column(TableVersion.instance().TABLE)
                    .column(TableVersion.instance().VERSION)
                    .primaryKey(TableVersion.instance().TABLE).execute();

                Datastore2.instance().invalidateTableCache();
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            try {
                TableVersionRecord record = new TableVersionRecord();
                record.values(TableVersion.instance(), TableVersionRecord.serialVersionUID);
                record.merge();
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }
}