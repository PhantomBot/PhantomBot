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
 * Information about a column in a query
 */
public sealed class ColumnInfo permits SelectStatement.ColumnSort {
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
     */
    protected ColumnInfo(boolean isTableB, String column) {
        this.isTableB = isTableB;
        this.column = column;
    }

    /**
     * If this column is from table {@code A}
     *
     * @return {@code true} if from table {@code A}; {@code false} if from table {@code B}
     */
    public boolean isTableA() {
        return !this.isTableB;
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
     * Returns the table alias this column is from
     *
     * @return {@code "A"} or {@code "B"}
     */
    public String table() {
        return this.isTableA() ? "A" : "B";
    }

    /**
     * The column name
     *
     * @return the column name
     */
    public String column() {
        return this.column;
    }
}
