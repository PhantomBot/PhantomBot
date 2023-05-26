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

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import com.gmt2001.datastore2.Datastore2;

/**
 * Provides a fluent interface to execute an SQL statement in a database-agnostic manner
 *
 * @author gmt2001
 */
public final class FluentStatement {
    /**
     * A {@link PreparedStatement} that has been compiled for the underlying database
     */
    private final PreparedStatement preparedStatement;
    /**
     * A map of string placeholder variables to integer indexes of the associated {@code ?} that will be replaced
     */
    private final Map<String, List<Integer>> variables;

    /**
     * Constructor
     *
     * @param preparedStatement a {@link PreparedStatement} that has been compiled for the underlying database
     * @param variables a map of string placeholder variables to integer indexes of the associated {@code ?} that will be replaced
     */
    protected FluentStatement(PreparedStatement preparedStatement, Map<String, List<Integer>> variables) {
        this.preparedStatement = preparedStatement;

        for (Map.Entry<String, List<Integer>> kv : variables.entrySet()) {
            variables.put(kv.getKey(), Collections.unmodifiableList(kv.getValue()));
        }

        this.variables = Collections.unmodifiableMap(variables);
    }

    /**
     * Constructor
     *
     * @param preparedStatement a {@link PreparedStatement} that has been compiled for the underlying database
     */
    protected FluentStatement(PreparedStatement preparedStatement) {
        this(preparedStatement, Collections.emptyMap());
    }

    /**
     * Sets the designated parameter to the given string value
     * <p>
     * The database driver automatically escapes the string to prevent SQL injection attacks
     *
     * @param variable the variable to replace
     * @param value the value to set
     * @throws IllegalArgumentException if the variable specified was not added to the builder before compiling
     * @throws SQLException if one or more of the {@code ?} marker for the variable was not placed into the SQL statement by
     * the {@link Datastore2} class for the database, a database access error occurs, or this is called when the
     * underlying {@link PreparedStatement} is closed
     */
    public void setString(String variable, String value) throws IllegalArgumentException, SQLException {
        if (!variables.containsKey(variable)) {
            throw new IllegalArgumentException("No variable named " + variable);
        }

        for (int i : variables.get(variable)) {
            this.preparedStatement.setString(i, value);
        }
    }

    /**
     * Adds the current set of parameters to the command batch of the udnerlying {@link PreparedStatement}
     *
     * @throws SQLException if a database access error occurs, or this is called when the
     * underlying {@link PreparedStatement} is closed
     */
    public void addBatch() throws SQLException {
        this.preparedStatement.addBatch();
    }

    /**
     * Creates a {@code SELECT} statement
     * <p>
     * When performing a {@code SELECT} that contains a join, the {@code fromTable} will be aliased as {@code A}
     *
     * @param fromTable the primary table of the query
     * @return a new {@link SelectStatement}
     */
    public static SelectStatement Select(String fromTable) {
        return new SelectStatement(fromTable);
    }
}
