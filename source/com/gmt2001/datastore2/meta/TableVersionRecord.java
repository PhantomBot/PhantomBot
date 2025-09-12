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
package com.gmt2001.datastore2.meta;

import org.jooq.Table;

import com.gmt2001.datastore2.record.Record2;

/**
 * A record in {@link TableVersion} denoting the DDL version of a managed Datastore2 table
 *
 * @author gmt2001
 */
public final class TableVersionRecord extends Record2<TableVersionRecord, String, Long> {
    /**
     * Version of this record implementation
     */
    public static final long serialVersionUID = 1L;

    /**
     * Constructor
     */
    public TableVersionRecord() {
        super(TableVersion.instance(), () -> TableVersion.instance().TABLE,
            () -> TableVersion.instance().VERSION);
    }

    /**
     * Constructor
     *
     * @param name the name of the table whose version is stored in this record
     * @param version the version
     */
    public TableVersionRecord(String name, Long version) {
        this();
        this.table(name);
        this.version(version);
        this.resetChangedOnNotNull();
    }

    /**
     * Constructor
     *
     * @param table the table whose version is stored in this record
     * @param version the version
     */
    public TableVersionRecord(Table<?> table, Long version) {
        this();
        this.table(table);
        this.version(version);
        this.resetChangedOnNotNull();
    }

    /**
     * Sets the name of the managed table whose version is stored in this record
     *
     * @param name the name of the table
     */
    public void table(String name) {
        this.value1(name);
    }

    /**
     * Sets the name of the managed table whose version is stored in this record
     *
     * @param table the table to retrieve the name from
     */
    public void table(Table<?> table) {
        this.value1(table.getName());
    }

    /**
     * The name of the managed table whose version is stored in this record
     *
     * @return the name of the table
     */
    public String table() {
        return this.value1();
    }

    /**
     * Sets the version of the managed table
     *
     * @param version the version
     */
    public void version(Long version) {
        this.value2(version);
    }

    /**
     * The version of the managed table
     *
     * @return the version
     */
    public Long version() {
        return this.value2();
    }

    /**
     * Sets the name and version of the managed table whose version is stored in this record
     *
     * @param table the table to retrieve the name from
     * @param version the version
     * @return {@code this}
     */
    public org.jooq.Record2<String, Long> values(Table<?> table, Long version) {
        this.table(table);
        return this.value2(version);
    }
}
