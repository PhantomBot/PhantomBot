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
import java.util.Collections;
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
     * Whether this is a memory table
     */
    private boolean isMemory = false;
    /**
     * The list of fields
     */
    private List<FieldDefinition> fields = new ArrayList<>();
    /**
     * The list of indexes
     */
    private List<IndexDefinition> indexes = new ArrayList<>();
    /**
     * The list of foreign keys
     */
    private List<ForeignKeyDefinition> foreignKeys = new ArrayList<>();

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
     * Sets whether this is a memory table
     * <p>
     * This type of table is stored in-memory and is dropped when the server shuts down
     * <p>
     * For some datastore types, the bot is the server, and therfore the table drops when the bot shuts down
     *
     * @param isMemory whether this is a memory table
     * @return {@code this}
     */
    public TableBuilder isMemory(boolean isMemory) {
        this.isMemory = isMemory;
        return this;
    }

    /**
     * Whether this is a memory table
     *
     * @return {@code true} if a memory table
     */
    public boolean isMemory() {
        return this.isMemory;
    }

    /**
     * Adds a field to the end of the fields list
     *
     * @param name the name of the field
     * @return the new {@link FieldDefinition}
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
     * @return the new {@link FieldDefinition}
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
        return Collections.unmodifiableList(this.fields);
    }

    /**
     * Adds an index to the end of the indexes list
     *
     * @param name the name of the index
     * @return the new {@link IndexDefinition}
     * @throws IllegalArgumentException if the name is null or blank
     */
    public IndexDefinition index(String name) throws IllegalArgumentException {
        IndexDefinition index = new IndexDefinition(this, name);
        this.indexes.add(index);
        return index;
    }

    /**
     * Adds an index to the specified position of the indexes list
     *
     * @param name the name of the index
     * @param position the position to insert the index at
     * @return the new {@link IndexDefinition}
     * @throws IllegalArgumentException if the name is null or blank
     */
    public IndexDefinition index(String name, int position) throws IllegalArgumentException {
        IndexDefinition index = new IndexDefinition(this, name);
        this.indexes.add(position, index);
        return index;
    }

    /**
     * The list of indexes added to this {@link TableBuilder}
     *
     * @return the list of indexes
     */
    public List<IndexDefinition> indexes() {
        return Collections.unmodifiableList(this.indexes);
    }

    /**
     * Adds a foreign key to the end of the foreign keys list
     *
     * @param name the name of the foreign key
     * @return the new {@link ForeignKeyDefinition}
     * @throws IllegalArgumentException if the name is null or blank
     */
    public ForeignKeyDefinition foreignKey(String name) throws IllegalArgumentException {
        ForeignKeyDefinition foreignKey = new ForeignKeyDefinition(this, name);
        this.foreignKeys.add(foreignKey);
        return foreignKey;
    }

    /**
     * Adds a foreign key to the specified position of the foreign keys list
     *
     * @param name the name of the foreign key
     * @param position the position to insert the index at
     * @return the new {@link ForeignKeyDefinition}
     * @throws IllegalArgumentException if the name is null or blank
     */
    public ForeignKeyDefinition foreignKey(String name, int position) throws IllegalArgumentException {
        ForeignKeyDefinition foreignKey = new ForeignKeyDefinition(this, name);
        this.foreignKeys.add(position, foreignKey);
        return foreignKey;
    }

    /**
     * The list of foreign keys added to this {@link TableBuilder}
     *
     * @return the list of foreign keys
     */
    public List<ForeignKeyDefinition> foreignKeys() {
        return Collections.unmodifiableList(this.foreignKeys);
    }
}
