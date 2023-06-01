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

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Savepoint;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.gmt2001.datastore2.Datastore2;

/**
 * Provides a fluent interface to execute an SQL statement in a database-agnostic manner
 *
 * @author gmt2001
 */
public final class FluentStatement implements AutoCloseable {
    /**
     * A {@link PreparedStatement} that has been compiled for the underlying database
     */
    private final PreparedStatement preparedStatement;
    /**
     * A valid SQL statement for the underlying database, after variables are replaced with {@code ?}
     */
    private final String sqlStatement;
    /**
     * A map of string placeholder variables to integer indexes of the associated {@code ?} that will be replaced
     */
    private final Map<String, List<Integer>> variables;
    /**
     * The RegEx for validating replacement variable names
     * @see {@link #FluentStatement(String)}
     */
    public static final Pattern VARNAME_PATTERN = Pattern.compile("[a-zA-Z0-9_\\-\\.]+");
    /**
     * The RegEx used for detecting replacement variables in {@link #sqlStatement()}
     * @see {@link #FluentStatement(String)}
     */
    public static final Pattern VAR_PATTERN = Pattern.compile("<<(?<varname>[a-zA-Z0-9_\\-\\.]+)(?::(?<count>[1-9][0-9]*))?>>");

    /**
     * Constructor
     * <p>
     * The variables for replacement should be placed in the SQL statement so that they will match the RegEx {@code <<(?<varname>[a-zA-Z0-9_\-\.]+)(?::(?<count>[1-9][0-9]*))?>>}.
     * The Datastore2 driver generating the SQL statement should be careful to not intentionally allow the statement to match this RegEx except where a variable appears
     * <p>
     * Example: <br />
     * <blockquote>
     * <pre>
     * {@code
     * FluentStatement fs = new FluentStatement("SELECT * FROM `myTable` WHERE `X`=<<myXVar>>");
     * }
     * </pre>
     * </blockquote>
     * <p>
     * If the exact same variable name appears multiple times, then all instances will be replaced when the appropriate set method is called
     * <p>
     * Example: <br />
     * <blockquote>
     * <pre>
     * {@code
     * FluentStatement fs = new FluentStatement("SELECT * FROM `myTable` WHERE `X`=<<myVar>> OR `Y`=<<myVar>>");
     * fs.setString("myVar", "Z");
     * // Effective SQL Statement is now: SELECT * FROM `myTable` WHERE `X`='Z' OR `Y`='Z'
     * }
     * </pre>
     * </blockquote>
     * <p>
     * If the variable is being used for an {@code IN} expression, add a {@code :count} suffix to the variable name indicating the number of
     * operands for the right side of the {@code IN} expression
     * <p>
     * Example: <br />
     * <blockquote>
     * <pre>
     * {@code
     * FluentStatement fs = new FluentStatement("SELECT * FROM `myTable` WHERE `X` IN <<myVar:5>>");
     * fs.setString("myVar", List.of("A", "B", "C", "D", "E"));
     * // Effective SQL Statement is now: SELECT * FROM `myTable` WHERE `X` IN ("A", "B", "C", "D", "E")
     * }
     * </pre>
     * </blockquote>
     *
     * @param sqlStatement a valid SQL statement for the underlying database, with optional variables
     * @param connection a connection to the database
     * @throws SQLException if a database access error occurs or this method is called on a closed connection
     */
    protected FluentStatement(String sqlStatement, Connection connection) throws SQLException {
        Map<String, List<Integer>> variablesMap = new HashMap<>();
        StringBuilder sqlStatementBuilder = new StringBuilder();

        int i = 1;
        int lastIdx = 0;
        Matcher m = VAR_PATTERN.matcher(sqlStatement);
        while (m.find()) {
            if (m.start() > 0) {
                sqlStatementBuilder.append(sqlStatement.substring(lastIdx, m.start()));
            }
            if (!variablesMap.containsKey(m.group("varname"))) {
                variablesMap.put(m.group("varname"), new ArrayList<Integer>());
            }
            if (m.group("count") == null) {
                variablesMap.get(m.group("varname")).add(i++);
                sqlStatementBuilder.append('?');
            } else {
                int count = Integer.parseUnsignedInt(m.group("count"));
                if (count > 0) {
                    for (int j = 0; j < count; j++) {
                        String vj = m.group("varname") + ":" + j;
                        if (!variablesMap.containsKey(vj)) {
                            variablesMap.put(vj, new ArrayList<Integer>());
                        }
                        variablesMap.get(vj).add(i++);
                        if (j > 0) {
                            sqlStatementBuilder.append(',');
                        }
                        sqlStatementBuilder.append('?');
                    }
                }
            }
            lastIdx = m.end();
        }

        if (lastIdx < sqlStatement.length()) {
            sqlStatementBuilder.append(sqlStatement.substring(lastIdx));
        }

        this.sqlStatement = sqlStatementBuilder.toString();
        this.preparedStatement = connection.prepareStatement(this.sqlStatement);

        for (Map.Entry<String, List<Integer>> kv : variablesMap.entrySet()) {
            variablesMap.put(kv.getKey(), Collections.unmodifiableList(kv.getValue()));
        }

        this.variables = Collections.unmodifiableMap(variablesMap);
    }

    /**
     * Sets the underlying {@link PreparedStatement}'s auto-commit mode to the given state.
     * <p>
     * If a connection is in auto-commit mode, then all its SQL statements will be executed and committed as individual
     * transactions. Otherwise, its SQL statements are grouped into transactions that are terminated by a call
     * to either {@link #commit()} or {@link #rollback()}. By default, new connections are in auto-commit mode
     * <p>
     * The commit occurs when the statement completes. The time when the statement completes depends on the type of SQL Statement:
     * <ul>
     * <li>For DML statements, such as Insert, Update or Delete, and DDL statements, the statement is complete as soon as it has finished executing</li>
     * <li>For Select statements, the statement is complete when the associated result set is closed</li>
     * </Ul>
     *
     * @param autoCommit {@code true} to enable auto-commit mode
     * @throws SQLException if a database access error occurs or this is called when the
     * underlying {@link PreparedStatement} is closed
     */
    public void setAutoCommit(boolean autoCommit) throws SQLException {
        this.preparedStatement.getConnection().setAutoCommit(autoCommit);
    }

    /**
     * Indicates the current auto-commit mode for the underlying {@link PreparedStatement}
     *
     * @return {@code true} if auto-commit mode is enabled
     * @throws SQLException if a database access error occurs or this is called when the
     * underlying {@link PreparedStatement} is closed
     */
    public boolean getAutoCommit() throws SQLException {
        return this.preparedStatement.getConnection().getAutoCommit();
    }

    /**
     * Creates a savepoint in the current transaction and returns the new {@link Savepoint} object that represents it
     *
     * @return the new {@link Savepoint} object
     * @throws SQLException if a database access error occurs, this is called when the
     * underlying {@link PreparedStatement} is closed, or auto-commit mode is enabled
     */
    public Savepoint setSavepoint() throws SQLException {
        return this.preparedStatement.getConnection().setSavepoint();
    }

    /**
     * Makes all changes made since the previous commit/rollback permanent and releases any
     * database locks currently held by the underlying {@link PreparedStatement}
     *
     * @throws SQLException if a database access error occurs, this is called when the
     * underlying {@link PreparedStatement} is closed, or auto-commit mode is enabled
     */
    public void commit() throws SQLException {
        this.preparedStatement.getConnection().commit();
    }

    /**
     * Undoes all changes made in the current transaction and releases any
     * database locks currently held by the underlying {@link PreparedStatement}
     *
     * @throws SQLException if a database access error occurs, this is called when the
     * underlying {@link PreparedStatement} is closed, or auto-commit mode is enabled
     */
    public void rollback() throws SQLException {
        this.preparedStatement.getConnection().rollback();
    }

    /**
     * Undoes all changes made in the current transaction and releases any
     * database locks currently held by the underlying {@link PreparedStatement}
     *
     * @param savepoint the {@link Savepoint} object to rollback to
     * @throws SQLException if a database access error occurs, this is called when the
     * underlying {@link PreparedStatement} is closed, or auto-commit mode is enabled
     */
    public void rollback(Savepoint savepoint) throws SQLException {
        this.preparedStatement.getConnection().rollback(savepoint);
    }

    /**
     * Sets the designated parameter to the given string value
     * <p>
     * The database driver automatically escapes the string to prevent SQL injection attacks
     *
     * @param variable the variable to replace
     * @param value the value to set
     * @throws IllegalArgumentException if the variable specified was not added to the builder before compiling
     * @throws SQLException if one or more of the {@code ?} marker for the variable was not found in the SQL statement by
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
     * Sets the right hand side of the designated {@code IN} expression variable to the given list of string values
     * <p>
     * The database driver automatically escapes the strings to prevent SQL injection attacks
     *
     * @param variable the variable to replace
     * @param values the values to set
     * @throws IllegalArgumentException if the variable specified was not added to the builder before compiling
     * @throws SQLException if one or more of the {@code ?} marker for the variable was not found in the SQL statement by
     * the {@link Datastore2} class for the database, a database access error occurs, or this is called when the
     * underlying {@link PreparedStatement} is closed
     */
    public void setString(String variable, List<String> values) throws IllegalArgumentException, SQLException {
        this.setString(variable, values.get(0));

        for (int i = 0; i < values.size(); i++) {
            String vi = variable + ":" + i;
            if (variables.containsKey(vi)) {
                this.setString(vi, values.get(i));
            }
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
     * The underlying SQL statement, after variables are replaced with {@code ?}
     *
     * @return the underlying SQL statement
     */
    public String sqlStatement() {
        return this.sqlStatement;
    }

    /**
     * A map of string placeholder variables to integer indexes of the associated {@code ?} that will be replaced
     * <p>
     * For {@code IN} expression operands that were defined in the constructor with a count as in {@code <<myVar:5>>}, the map will include:
     * <ul>
     * <li>{@code myVar} - used to validate the variable name exists. If spotted elsewhere in the query as {@code <<myVar>>}, will be replaced with {@code myVar:0}
     * <li>{@code myVar:0} - the first value in the input list to {@link #setString(String, List)}</li>
     * <li>{@code myVar:1} - the second value in the input list to {@link #setString(String, List)}</li>
     * <li>{@code myVar:2} - the third value in the input list to {@link #setString(String, List)}</li>
     * <li>{@code myVar:3} - the fourth value in the input list to {@link #setString(String, List)}</li>
     * <li>{@code myVar:4} - the fifth value in the input list to {@link #setString(String, List)}</li>
     * <li>The number of these will match the defined count of the variable</li>
     * </ul>
     *
     * @return An unmodifiable map of placeholder variables to integer indexes
     */
    public Map<String, List<Integer>> variables() {
        return this.variables;
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

    /**
     * Releases the underlying {@link PreparedStatement}, releasing the connection back to the connection pool
     *
     * @throws SQLException if a database access error occurs
     */
    @Override
    public void close() throws SQLException {
        this.preparedStatement.close();
    }
}
