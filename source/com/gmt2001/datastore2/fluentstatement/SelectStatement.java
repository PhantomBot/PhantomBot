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
     * The columns to select
     */
    private List<ColumnInfo> columns = new ArrayList<>();
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
     * The limit on the number of rows to return
     */
    private long limit = -1L;
    /**
     * The offset to start returning rows from
     */
    private long offset = -1L;
    /**
     * The columns to sort by
     */
    private List<ColumnSort> orderBy = new ArrayList<>();

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
     * Sorting directions
     */
    public enum SortDirection {
        /**
         * Ascending (eg. A-Z or 0-9)
         */
        ASC,
        /**
         * Descending (eg. Z-A or 9-0)
         */
        DESC
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
     * A column and sort order used for {@code ORDER BY}
     */
    public final class ColumnSort extends ColumnInfo {
        /**
         * The sort direction
         */
        private final SortDirection sortDirection;

        /**
         * Constructor
         *
         * @param isTableB if this column is from table {@code B}
         * @param column the column
         * @param sortDirection the sort direction
         */
        private ColumnSort(boolean isTableB, String column, SortDirection sortDirection) {
            super(isTableB, column);
            this.sortDirection = sortDirection;
        }

        /**
         * The sort direction
         *
         * @return the sort direction
         */
        public SortDirection sortDirection() {
            return this.sortDirection;
        }
    }

    /**
     * Information about a column
     */
    public sealed class ColumnInfo {
        /**
         * If this column is from table {@code B}
         */
        private final boolean isTableB;
        /**
         * The column
         */
        private final String column;

        /**
         * Constructor
         *
         * @param isTableB if this column is from table {@code B}
         * @param column the column
         * @param sortDirection the sort direction
         */
        private ColumnInfo(boolean isTableB, String column) {
            this.isTableB = isTableB;
            this.column = column;
        }

        /**
         * If this column is from table {@code B}
         *
         * @return {@code true} if from table {@code B}; {@code false} if from table {@code A}
         */
        public boolean isTableB() {
            return this.isTableB;
        }

        /**
         * The column
         *
         * @return the column name
         */
        public String column() {
            return this.column;
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
     * <p>
     * To perform a {@code SELECT *}, don't call this method
     * <p>
     * The order of calls to {@link #column(String)}, {@link #columns(String...)}, {@link #columnB(String)}, and {@link #columnsB(String...)} determines
     * the order in which the columns appear in the resultset
     *
     * @param column the column to select
     * @return {@code this}
     */
    public SelectStatement column(String column) {
        if (column != null && !column.isBlank() && !column.equals("*")) {
            this.columns.add(new ColumnInfo(false, column));
        }

        return this;
    }

    /**
     * Adds multiple columns to be selected
     * <p>
     * When performing a {@code SELECT} that contains a join, the specified columns will be selected from table {@code A}
     * <p>
     * To perform a {@code SELECT *}, don't call this method
     * <p>
     * The order of calls to {@link #column(String)}, {@link #columns(String...)}, {@link #columnB(String)}, and {@link #columnsB(String...)} determines
     * the order in which the columns appear in the resultset
     *
     * @param columns the columns to select
     * @return {@code this}
     */
    public SelectStatement columns(String... columns) {
        if (columns != null && columns.length > 0) {
            for (int i = 0; i < columns.length; i++) {
                String column = columns[i];

                if (column != null && !column.isBlank() && !column.equals("*")) {
                    this.columns.add(new ColumnInfo(false, column));
                }
            }
        }

        return this;
    }

    /**
     * Returns the columns that are being selected
     * <p>
     * If the list is empty, then {@code *} is being selected
     *
     * @return the list of columns
     */
    public List<ColumnInfo> columns() {
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
     * <p>
     * To perform a {@code SELECT *}, don't call this method
     * <p>
     * The order of calls to {@link #column(String)}, {@link #columns(String...)}, {@link #columnB(String)}, and {@link #columnsB(String...)} determines
     * the order in which the columns appear in the resultset
     *
     * @param column the column to select
     * @return {@code this}
     */
    public SelectStatement columnB(String column) {
        if (column != null && !column.isBlank() && !column.equals("*")) {
            this.columns.add(new ColumnInfo(true, column));
        }

        return this;
    }

    /**
     * Adds multiple columns to be selected from table {@code B} in a {@code JOIN}
     * <p>
     * To perform a {@code SELECT *}, don't call this method
     * <p>
     * The order of calls to {@link #column(String)}, {@link #columns(String...)}, {@link #columnB(String)}, and {@link #columnsB(String...)} determines
     * the order in which the columns appear in the resultset
     *
     * @param columns the columns to select
     * @return {@code this}
     */
    public SelectStatement columnsB(String... columns) {
        if (columns != null && columns.length > 0) {
            for (int i = 0; i < columns.length; i++) {
                String column = columns[i];

                if (column != null && !column.isBlank() && !column.equals("*")) {
                    this.columns.add(new ColumnInfo(true, column));
                }
            }
        }

        return this;
    }

    /**
     * Sets the limit on the number of rows to return in the resultset
     *
     * @param limit the row limit
     * @return {@code this}
     */
    public SelectStatement limit(long limit) {
        if (limit > 0) {
            this.limit = limit;
        }

        return this;
    }

    /**
     * The limit on the number of rows to return in the resultset
     *
     * @return the limit; {@code -1} if not set
     */
    public long limit() {
        return this.limit;
    }

    /**
     * Sets the offset to start returning rows from in the resultset
     *
     * @param offset the result offset
     * @return {@code this}
     */
    public SelectStatement offset(long offset) {
        if (offset > 0) {
            this.offset = offset;
        }

        return this;
    }

    /**
     * The offset to start returning rows from in the resultset
     *
     * @return the offset; {@code -1} if not set
     */
    public long offset() {
        return this.offset;
    }

    /**
     * Adds a column to {@code ORDER BY} from table {@code A}
     * <p>
     * The order of calls to {@link #orderBy(String, SortDirection)} and {@link #orderByB(String, SortDirection)} determine
     * the order in which the columns are sorted
     *
     * @param column the column to sort by
     * @param sortDirection the sort direction
     * @return {@code this}
     */
    public SelectStatement orderBy(String column, SortDirection sortDirection) {
        if (column != null && !column.isBlank()) {
            this.orderBy.add(new ColumnSort(false, column, sortDirection));
        }

        return this;
    }

    /**
     * Adds a column to {@code ORDER BY} from table {@code B}
     * <p>
     * The order of calls to {@link #orderBy(String, SortDirection)} and {@link #orderByB(String, SortDirection)} determine
     * the order in which the columns are sorted
     *
     * @param column the column to sort by
     * @param sortDirection the sort direction
     * @return {@code this}
     */
    public SelectStatement orderByB(String column, SortDirection sortDirection) {
        if (column != null && !column.isBlank()) {
            this.orderBy.add(new ColumnSort(true, column, sortDirection));
        }

        return this;
    }

    /**
     * Returns the list of columns and sort directions from both tables that are being used to sort the resultset
     * <p>
     * If the list is empty, then there is no {@code ORDER BY}
     *
     * @return the list of column sort data
     */
    public List<ColumnSort> orderBy() {
        return Collections.unmodifiableList(this.orderBy);
    }
}
