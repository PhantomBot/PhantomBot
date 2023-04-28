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
 * Provides a fluent interface to define an index in a {@link TableBuilder}
 *
 * @author gmt2001
 */
public final class IndexDefinition {
    /**
     * The parent {@link TableBuilder}
     */
    private final TableBuilder parent;
    /**
     * The name of the index
     */
    private final String name;
     /**
     * The type of index
     */
    private IndexType type = IndexType.INDEX;
    /**
     * The fields referenced by the index
     */
    private List<IndexField> referencedFields = new ArrayList<>();

    /**
     * Represents potential index types
     */
    public static enum IndexType {
        /**
         * A normal index
         */
        INDEX,
        /**
         * The primary key, a type of unique index that is used as the row identifier
         */
        PRIMARY,
        /**
         * An index where the combination of values in the referenced fields must be unique across all rows
         */
        UNIQUE,
        /**
         * An index that allows fully searching {@link FieldDefinition.DataType#TEXT} fields
         */
        FULLTEXT
    }

    /**
     * A field referenced by the index
     */
    public final class IndexField {
        /**
         * The name of the referenced field
         */
        private final String name;
        /**
         * The length to reference, for text-type fields
         */
        private final int length;

        /**
         * Constructor
         *
         * @param name the name of the referenced field
         * @param length the length to reference, for text-type fields
         */
        private IndexField(String name, int length) {
            this.name = name;
            this.length = length;
        }

        /**
         * The name of the referenced field
         *
         * @return the field name
         */
        public String name() {
            return this.name;
        }

        /**
         * The length to reference, for text-type fields
         *
         * @return the length of the reference; {@code -1} if not set
         */
        public int length() {
            return this.length;
        }
    }

    /**
     * Constructor
     *
     * @param parent the parent {@link TableBuilder}
     * @param name the name of the index
     * @throws IllegalArgumentException if the name is null or blank
     */
    IndexDefinition(TableBuilder parent, String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name is null or blank");
        }

        this.parent = parent;
        this.name = name;
    }

     /**
     * The name of the index
     *
     * @return the index name
     */
    public String name() {
        return this.name;
    }

    /**
     * Sets the type of index
     *
     * @param type the {@link IndexType} of the field
     * @return {@code this}
     */
    public IndexDefinition type(IndexType type) {
        this.type = type;
        return this;
    }

    /**
     * The type of index
     *
     * @return the {@link Indexype}
     */
    public IndexType type() {
        return this.type;
    }

    /**
     * Adds a referenced field to the end of the list
     *
     * @param name the name of the referenced field
     * @return {@code this}
     */
    public IndexDefinition referencedField(String name) {
        return this.referencedField(name, -1);
    }

    /**
     * Adds a referenced field to the end of the list
     *
     * @param name the name of the referenced field
     * @param length the length to reference, for text-type fields; {@code -1} if not set
     * @return {@code this}
     */
    public IndexDefinition referencedField(String name, int length) {
        this.referencedFields.add(new IndexField(name, length));
        return this;
    }

    /**
     * Adds a referenced field to the specified position of the list
     *
     * @param name the name of the referenced field
     * @param length the length to reference, for text-type fields; {@code -1} if not set
     * @param position the position to insert the field at
     * @return {@code this}
     */
    public IndexDefinition referencedField(String name, int length, int position) {
        this.referencedFields.add(position, new IndexField(name, length));
        return this;
    }

    /**
     * The list of referenced fields added to this {@link IndexDefinition}
     *
     * @return the list of referenced fields
     */
    public List<IndexField> referencedFields() {
        return Collections.unmodifiableList(this.referencedFields);
    }

    /**
     * Adds a field to the end of the fields list
     *
     * @param name the name of the field
     * @return the new {@link FieldDefinition}
     * @throws IllegalArgumentException if the name is null or blank
     */
    public FieldDefinition field(String name) throws IllegalArgumentException {
        return parent.field(name);
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
        return parent.field(name, position);
    }

    /**
     * Adds an index to the end of the indexes list
     *
     * @param name the name of the index
     * @return the new {@link IndexDefinition}
     * @throws IllegalArgumentException if the name is null or blank
     */
    public IndexDefinition index(String name) throws IllegalArgumentException {
        return parent.index(name);
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
        return parent.index(name, position);
    }
}
