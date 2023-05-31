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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Provides a fluent interface to define the components of a SQL {@code SELECT} statement in a database-agnostic manner
 *
 * @author gmt2001
 */
public final class SelectStatement extends FluentStatementBuilder {
    /**
     * Whether this query is a {@code SELECT DISTINCT} query
     */
    private boolean distinct = false;
    /**
     * The columns to select from table {@code A}
     */
    private List<String> columns = new ArrayList<>();
    /**
     * The table to join as {@code B}
     */
    private String joinTable = null;
    /**
     * The type of join
     */
    private JoinType joinType = JoinType.INNER;
    /**
     * The column mapping for the {@code ON} clause of the join
     */
    private List<JoinOn> joinOn = new ArrayList<>();
    /**
     * The columns to select from table {@code B}
     */
    private List<String> columnsB = new ArrayList<>();

    /**
     * Types of table joins
     */
    public enum JoinType {
        /**
         * {@code INNER JOIN}
         */
        INNER,
        /**
         * {@code LEFT OUTER JOIN}
         */
        LEFT_OUTER,
        /**
         * {@code RIGHT OUTER JOIN}
         */
        RIGHT_OUTER
    }

    /**
     * The columns that are used to match rows in a {@code JOIN}
     */
    public final class JoinOn {
        /**
         * The column from table {@code A}
         */
        private final String columnA;
        /**
         * The column from table {@code B}
         */
        private final String columnB;

        /**
         * Constructor
         *
         * @param columnA the column from table {@code A}
         * @param columnB the column from table {@code B}
         */
        private JoinOn(String columnA, String columnB) {
            this.columnA = columnA;
            this.columnB = columnB;
        }

        /**
         * The column from table {@code A}
         *
         * @return the column name
         */
        public String columnA() {
            return this.columnA;
        }

        /**
         * The column from table {@code B}
         *
         * @return the column name
         */
        public String columnB() {
            return this.columnB;
        }
    }

    /**
     * Constructor
     * <p>
     * When performing a {@code SELECT} that contains a join, the {@code fromTable} will be aliased as {@code A}
     *
     * @param fromTable the primary table of the query
     */
    protected SelectStatement(String fromTable) {
        super(fromTable);
    }

    /**
     * Sets this query to be a {@code SELECT DISTINCT} query
     *
     * @return {@code this}
     */
    public SelectStatement distinct() {
        this.distinct = true;
        return this;
    }

    /**
     * Indicates if this query is a {@code SELECT DISTINCT} query
     *
     * @return {@code true} if this query is a {@code SELECT DISTINCT} query
     */
    public boolean isDistinct() {
        return this.distinct;
    }

    /**
     * Adds a column to be selected
     * <p>
     * When performing a {@code SELECT} that contains a join, the specified column will be selected from table {@code A}
     *
     * @param column the column to select
     * @return {@code this}
     */
    public SelectStatement column(String column) {
        if (column != null && !column.isBlank() && !column.equals("*")) {
            this.columns.add(column);
        }

        return this;
    }

    /**
     * Adds multiple columns to be selected
     * <p>
     * When performing a {@code SELECT} that contains a join, the specified columns will be selected from table {@code A}
     *
     * @param columns the columns to select
     * @return {@code this}
     */
    public SelectStatement columns(String... columns) {
        if (columns != null && columns.length > 0) {
            for (int i = 0; i < columns.length; i++) {
                String column = columns[i];

                if (column != null && !column.isBlank() && !column.equals("*")) {
                    this.columns.add(column);
                }
            }
        }

        return this;
    }

    /**
     * Returns the columns that are being selected
     * <p>
     * When performing a {@code SELECT} that contains a join, the specified columns are selected from table {@code A}
     * <p>
     * If the list is empty, then {@code *} is being selected
     *
     * @return the list of columns
     */
    public List<String> columns() {
        return Collections.unmodifiableList(this.columns);
    }

    /**
     * Adds a {@code JOIN}
     * <p>
     * The specified {@code joinTable} will be aliased as {@code B}
     *
     * @param joinType the type of join
     * @param joinTable the table to join
     * @return {@code this}
     */
    public SelectStatement join(JoinType joinType, String joinTable) {
        this.joinType = joinType;
        this.joinTable = joinTable;

        return this;
    }

    /**
     * The type of {@code JOIN} to perform
     *
     * @return the type of join
     */
    public JoinType joinType() {
        return this.joinType;
    }

    /**
     * The table to join
     * <p>
     * The specified table must be aliased as {@code B}
     * <p>
     * If {@code null} is returned, then there is no {@code JOIN} in this select statement
     *
     * @return the table to join; {@code null} if there is no join
     */
    public String joinTable() {
        return this.joinTable;
    }

    /**
     * Adds a set of columns which are used to match rows in a {@code JOIN}
     * <p>
     * The columns will be used as {@code ON (A.columnA = B.columnB)}
     * <p>
     * If multiple columns are added, they will be {@code AND} together as in
     * {@code ON (A.columnA1 = B.columnB1 AND A.columnA2 = B.columnB2)}
     *
     * @param columnA the column from table {@code A}
     * @param columnB the column from table {@code B}
     * @return {@code this}
     */
    public SelectStatement joinOn(String columnA, String columnB) {
        this.joinOn.add(new JoinOn(columnA, columnB));
        return this;
    }

    /**
     * The set of columns which are used to match rows in a {@code JOIN}
     * <p>
     * The columns must be used as {@code ON (A.columnA = B.columnB)}
     * <p>
     * If there are multiple entries, they must be {@code AND} together as in
     * {@code ON (A.columnA1 = B.columnB1 AND A.columnA2 = B.columnB2)}
     *
     * @return the list of join columns
     */
    public List<JoinOn> joinOn() {
        return Collections.unmodifiableList(this.joinOn);
    }

    /**
     * Adds a column to be selected from table {@code B} in a {@code JOIN}
     *
     * @param column the column to select
     * @return {@code this}
     */
    public SelectStatement columnB(String column) {
        if (column != null && !column.isBlank() && !column.equals("*")) {
            this.columnsB.add(column);
        }

        return this;
    }

    /**
     * Adds multiple columns to be selected from table {@code B} in a {@code JOIN}
     *
     * @param columns the columns to select
     * @return {@code this}
     */
    public SelectStatement columnsB(String... columns) {
        if (columns != null && columns.length > 0) {
            for (int i = 0; i < columns.length; i++) {
                String column = columns[i];

                if (column != null && !column.isBlank() && !column.equals("*")) {
                    this.columnsB.add(column);
                }
            }
        }

        return this;
    }

    /**
     * Returns the columns that are being selected from table {@code B} in a {@code JOIN}
     * <p>
     * If the list is empty, then no additional columns are being selected
     *
     * @return the list of columns
     */
    public List<String> columnsB() {
        return Collections.unmodifiableList(this.columnsB);
    }
}
