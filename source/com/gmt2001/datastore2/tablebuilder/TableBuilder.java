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
package com.gmt2001.datastore2.tablebuilder;

import java.util.ArrayList;
import java.util.List;

/**
 * Provides a fluent interface to define a table, then create or alter it in the database
 *
 * @author gmt2001
 */
public final class TableBuilder {
    /**
     * The name of the table
     */
    private final String name;
    /**
     * Whether this is a temporary table
     */
    private boolean isTemporary = false;
    /**
     * The list of fields
     */
    private List<FieldDefinition> fields = new ArrayList<>();

    /**
     * Constructor
     *
     * @param name the name of the table
     * @throws IllegalArgumentException if the name is null or blank
     */
    public TableBuilder(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name is null or blank");
        }

        this.name = name;
    }

    /**
     * The name of the table
     *
     * @return the table name
     */
    public String name() {
        return this.name;
    }

    /**
     * Sets whether this is a temporary table
     * <p>
     * How a temporary table is handeled is engine-defined,
     * but it usually means that the table is stored in-memory,
     * is only visible to the {@link java.sql.Connection} that creates it,
     * and is dropped once {@link java.sql.Connection#close()} is called
     *
     * @param isTemporary whether this is a temporary table
     * @return {@code this}
     */
    public TableBuilder isTemporary(boolean isTemporary) {
        this.isTemporary = isTemporary;
        return this;
    }

    /**
     * Whether this is a temporary table
     *
     * @return {@code true} if a temporary table
     */
    public boolean isTemporary() {
        return this.isTemporary;
    }

    /**
     * Adds a field to the end of the fields list
     *
     * @param name the name of the field
     * @throws IllegalArgumentException if the name is null or blank
     */
    public FieldDefinition field(String name) throws IllegalArgumentException {
        FieldDefinition field = new FieldDefinition(this, name);
        this.fields.add(field);
        return field;
    }

    /**
     * Adds a field to the specified position of the fields list
     *
     * @param name the name of the field
     * @param position the position to insert the field at
     * @throws IllegalArgumentException if the name is null or blank
     */
    public FieldDefinition field(String name, int position) throws IllegalArgumentException {
        FieldDefinition field = new FieldDefinition(this, name);
        this.fields.add(position, field);
        return field;
    }

    /**
     * The list of fields added to this {@link TableBuilder}
     *
     * @return the list of fields
     */
    public List<FieldDefinition> fields() {
        return this.fields;
    }
}
