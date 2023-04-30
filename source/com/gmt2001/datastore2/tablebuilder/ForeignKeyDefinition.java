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
 * Provides a fluent interface to define a fireign key in a {@link TableBuilder}
 *
 * @author gmt2001
 */
public final class ForeignKeyDefinition extends AbstractDefinition {
    /**
     * The name of the foreign key
     */
    private final String name;
    /**
     * The local fields referenced by the foreign key
     */
    private List<String> localFields = new ArrayList<>();
    /**
     * The name of the foreign table referenced by the foreign key
     */
    private String foreignTable;
    /**
     * The foreign fields referenced by the foreign key
     */
    private List<String> foreignFields = new ArrayList<>();
    /**
     * The action to take when the foreign row is updated
     */
    private Action onUpdate = Action.NO_ACTION;
    /**
     * The action to take when the foreign row is deleted
     */
    private Action onDelete = Action.NO_ACTION;

    /**
     * Potential actions to take on update or delete
     */
    public static enum Action {
        /**
         * No Action
         * <p>
         * Depending on the underlying engine, this could allow the broken reference to exist
         * or could act the same as {@link #RESTRICT}
         */
        NO_ACTION,
        /**
         * Blocks the update/delete from taking place on the foreign row unless the referencing
         * local row is also updated/deleted
         */
        RESTRICT,
        /**
         * Sets the local fields to the SQL literal {@code NULL} when the foreign fields are updated/deleted
         * <p>
         * Requires the local fields to not contain the {@code NOT NULL} constraint
         */
        SET_NULL,
        /**
         * If the foreign row is updated, the referencing local row is updated to match
         * <p>
         * If the foreign row is deleted, the referencing local row is also deleted
         */
        CASCADE
    }

    /**
     * Constructor
     *
     * @param parent the parent {@link TableBuilder}
     * @param name the name of the foreign key
     * @throws IllegalArgumentException if the name is null or blank
     */
    ForeignKeyDefinition(TableBuilder parent, String name) {
        super(parent);

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name is null or blank");
        }

        this.name = name;
    }

     /**
     * The name of the foreign key
     *
     * @return the foreign key name
     */
    public String name() {
        return this.name;
    }

    /**
     * Adds a local field to the end of the list
     *
     * @param name the name of the local field
     * @return {@code this}
     */
    public ForeignKeyDefinition localField(String name) {
        this.localFields.add(name);
        return this;
    }

    /**
     * The list of local fields added to this {@link ForeignKeyDefinition}
     *
     * @return the lsit of local fields
     */
    public List<String> localFields() {
        return Collections.unmodifiableList(this.localFields);
    }

    /**
     * Sets the name of the referenced foreign table
     *
     * @param name the name of the referenced foreign table
     * @return {@code this}
     */
    public ForeignKeyDefinition foreignTable(String name) {
        this.foreignTable = name;
        return this;
    }

    /**
     * The name of the foreign table referenced by this {@link ForeignKeyDefinition}
     *
     * @return the name of the foreign table
     */
    public String foreignTable() {
        return this.foreignTable;
    }

    /**
     * Adds a foreign field to the end of the list
     *
     * @param name the name of the foreign field
     * @return {@code this}
     */
    public ForeignKeyDefinition foreignField(String name) {
        this.foreignFields.add(name);
        return this;
    }

    /**
     * The list of foreign fields added to this {@link ForeignKeyDefinition}
     *
     * @return the lsit of foreign fields
     */
    public List<String> foreignFields() {
        return Collections.unmodifiableList(this.foreignFields);
    }

    /**
     * Sets the action to take when the referenced row in the foreign table is updated
     *
     * @param action the action to take on update
     * @return {@code this}
     */
    public ForeignKeyDefinition onUpdate(Action action) {
        this.onUpdate = action;
        return this;
    }

    /**
     * The action to take when the referenced row in the foreign table is updated
     *
     * @return the action to take on update
     */
    public Action onUpdate() {
        return this.onUpdate;
    }

    /**
     * Sets the action to take when the referenced row in the foreign table is deleted
     *
     * @param action the action to take on delete
     * @return {@code this}
     */
    public ForeignKeyDefinition onDelete(Action action) {
        this.onDelete = action;
        return this;
    }

    /**
     * The action to take when the referenced row in the foreign table is deleted
     *
     * @return the action to take on delete
     */
    public Action onDelete() {
        return this.onDelete;
    }
}