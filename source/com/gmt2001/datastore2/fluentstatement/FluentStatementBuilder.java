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
package com.gmt2001.datastore2.fluentstatement;

/**
 * Provides a fluent interface to define the components of a SQL statement in a database-agnostic manner
 *
 * @author gmt2001
 */
public abstract class FluentStatementBuilder {
    /**
     * The name of the primary table of the query
     */
    private final String table;

    /**
     * Constructor
     *
     * @param table the name of the primary table of the query
     */
    protected FluentStatementBuilder(String table) {
        this.table = table;
    }

    /**
     * The primary table of the query
     * <p>
     * When performing a {@code SELECT} that contains a join, this table must be aliased as {@code A}
     *
     * @return the name of the table
     */
    public String table() {
        return this.table;
    }
}
