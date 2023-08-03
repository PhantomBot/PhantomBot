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

import org.jooq.Field;
import org.jooq.Record1;
import org.jooq.Record2;
import org.jooq.Row2;
import org.jooq.Table;
import org.jooq.impl.UpdatableRecordImpl;

/**
 * A record in {@link TableVersion} denoting the DDL version of a managed Datastore2 table
 *
 * @author gmt2001
 */
public final class TableVersionRecord extends UpdatableRecordImpl<TableVersionRecord> implements Record2<String, Long> {
    /**
     * Version of this record implementation
     */
    public static final long serialVersionUID = 1L;

    /**
     * Constructor
     */
    public TableVersionRecord() {
        super(TableVersion.instance());
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
        this.set(0, name);
    }

    /**
     * Sets the name of the managed table whose version is stored in this record
     *
     * @param table the table to retrieve the name from
     */
    public void table(Table<?> table) {
        this.set(0, table.getName());
    }

    /**
     * The name of the managed table whose version is stored in this record
     *
     * @return the name of the table
     */
    public String table() {
        return (String) this.get(0);
    }

    /**
     * Sets the version of the managed table
     *
     * @param version the version
     */
    public void version(Long version) {
        this.set(1, version);
    }

    /**
     * The version of the managed table
     *
     * @return the version
     */
    public Long version() {
        return (Long) this.get(1);
    }

    /**
     * The primary key for this record, which is {@link #table()}
     *
     * @return the primary key
     */
    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Record1<String> key() {
        return (Record1) super.key();
    }

    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Row2<String, Long> fieldsRow() {
        return (Row2) super.fieldsRow();
    }

    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Row2<String, Long> valuesRow() {
        return (Row2) super.valuesRow();
    }

    /**
     * The {@link Field} which holds the name of the managed table whose version is stored in this record
     *
     * @return the field
     */
    @Override
    public Field<String> field1() {
        return TableVersion.instance().TABLE;
    }

    /**
     * The {@link Field} which holds the version of the managed table
     *
     * @return the field
     */
    @Override
    public Field<Long> field2() {
        return TableVersion.instance().VERSION;
    }

    /**
     * The name of the managed table whose version is stored in this record
     *
     * @return the name of the table
     */
    @Override
    public String value1() {
        return this.table();
    }

    /**
     * The version of the managed table
     *
     * @return the version
     */
    @Override
    public Long value2() {
        return this.version();
    }

    /**
     * Sets the name of the managed table whose version is stored in this record
     *
     * @param name the name of the table
     * @return {@code this}
     */
    @Override
    public Record2<String, Long> value1(String name) {
        this.table(name);
        return this;
    }

    /**
     * Sets the version of the managed table
     *
     * @param version the version
     * @return this
     */
    @Override
    public Record2<String, Long> value2(Long version) {
        this.version(version);
        return this;
    }

    /**
     * Sets the name and version of the managed table whose version is stored in this record
     *
     * @param name the name of the table
     * @param version the version
     * @return {@code this}
     */
    public Record2<String, Long> values(String name, Long version) {
        this.value1(name);
        this.value2(version);
        return this;
    }

    /**
     * Sets the name and version of the managed table whose version is stored in this record
     *
     * @param table the table to retrieve the name from
     * @param version the version
     * @return {@code this}
     */
    public Record2<String, Long> values(Table<?> table, Long version) {
        this.table(table);
        this.value2(version);
        return this;
    }

    /**
     * The name of the managed table whose version is stored in this record
     *
     * @return the name of the table
     */
    @Override
    public String component1() {
        return this.table();
    }

    /**
     * The version of the managed table
     *
     * @return the version
     */
    @Override
    public Long component2() {
        return this.version();
    }
}
