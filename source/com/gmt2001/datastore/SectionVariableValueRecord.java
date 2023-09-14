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
package com.gmt2001.datastore;

import com.gmt2001.datastore2.record.Record3;

/**
 * A record in {@link SectionVariableValueTable}
 *
 * @author gmt2001
 */
public final class SectionVariableValueRecord extends Record3<SectionVariableValueRecord, String, String, String> {
    /**
     * Version of this record implementation
     */
    public static final long serialVersionUID = 1L;

    /**
     * Default Constructor for JOOQ
     */
    private SectionVariableValueRecord() {
        super(SectionVariableValueTable.EMPTY, () -> SectionVariableValueTable.EMPTY.SECTION,
            () -> SectionVariableValueTable.EMPTY.VARIABLE,
            () -> SectionVariableValueTable.EMPTY.VALUE);
    }

    /**
     * Constructor
     *
     * @param table the table this record is stored in
     */
    public SectionVariableValueRecord(SectionVariableValueTable table) {
        super(table, () -> table.SECTION,
            () -> table.VARIABLE, () -> table.VALUE);
    }

    /**
     * Constructor
     *
     * @param table the table this record is stored in
     * @param section the section
     * @param variable the variable
     * @param value the value
     */
    public SectionVariableValueRecord(SectionVariableValueTable table, String section, String variable, String value) {
        this(table);
        this.section(section);
        this.variable(variable);
        this.value(value);
        this.resetChangedOnNotNull();
    }

    /**
     * Constructor
     *
     * @param table the table this record is stored in
     * @param variable the variable
     * @param value the value
     */
    public SectionVariableValueRecord(SectionVariableValueTable table, String variable, String value) {
        this(table, null, variable, value);
    }

    /**
     * Sets the section
     *
     * @param section the section
     */
    public void section(String section) {
        this.value1(section);
    }

    /**
     * The section
     *
     * @return the section
     */
    public String section() {
        return this.value1();
    }

    /**
     * Sets the variable
     *
     * @param variable the variable
     */
    public void variable(String variable) {
        this.value2(variable);
    }

    /**
     * The variable
     *
     * @return the variable
     */
    public String variable() {
        return this.value2();
    }

    /**
     * Sets the value
     *
     * @param value the value
     */
    public void value(String value) {
        this.value3(value);
    }

    /**
     * The value
     *
     * @return the value
     */
    public String value() {
        return this.value3();
    }

    /**
     * Sets the section, variable, and value
     * <p>
     * The section is set to {@code null}
     *
     * @param variable the variable
     * @param value the value
     * @return {@code this}
     */
    public org.jooq.Record3<String, String, String> values(String variable, String value) {
        return this.value1(null).value2(variable).value3(value);
    }

    /**
     * Sets the section, variable, and value
     *
     * @param section the section
     * @param variable the variable
     * @param value the value
     * @return {@code this}
     */
    public org.jooq.Record3<String, String, String> values(String section, String variable, String value) {
        return this.value1(section).value2(variable).value3(value);
    }

    /**
     * Copies the values and changed state of this record to a new one on the given table
     *
     * @param table the table to attach the new record to
     * @return the new record
     */
    public SectionVariableValueRecord with(SectionVariableValueTable table) {
        SectionVariableValueRecord record = new SectionVariableValueRecord(table);
        record.values(this.section(), this.variable(), this.value());
        record.changed(table.SECTION, this.changed(0));
        record.changed(table.VARIABLE, this.changed(1));
        record.changed(table.VALUE, this.changed(2));
        return record;
    }
}
