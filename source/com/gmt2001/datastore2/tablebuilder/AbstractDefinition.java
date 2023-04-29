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

/**
 * Provides a fluent interface to define a component in a {@link TableBuilder}
 *
 * @author gmt2001
 */
public abstract class AbstractDefinition {
    /**
     * The parent {@link TableBuilder}
     */
    private final TableBuilder parent;

    /**
     * Constructor
     *
     * @param parent the parent {@link TableBuilder}
     * @throws IllegalArgumentException if the name is null or blank
     */
    protected AbstractDefinition(TableBuilder parent) {
        this.parent = parent;
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
