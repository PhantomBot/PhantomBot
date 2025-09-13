/*
 * Copyright (C) 2016-2025 phantombot.github.io/PhantomBot
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
package com.gmt2001.datastore2;

/**
 * An exception which indicates that the specified table does not exist; or that the table cache may be stale
 */
public class TableDoesNotExistException extends IllegalStateException {
    private final String tableName;

    /**
     * Constructor
     *
     * @param tableName the name of the table
     */
    public TableDoesNotExistException(String tableName) {
        this(tableName, null);
    }

    /**
     * Constructor
     *
     * @param tableName the name of the table
     * @param cause the {@link Throwable} which caused this exception
     */
    public TableDoesNotExistException(String tableName, Throwable cause) {
        super(tableName + " does not exist in the database or the cache is stale", cause);
        this.tableName = tableName;
    }

    /**
     * Returns the name of the table which caused this exception
     *
     * @return the name of the table
     */
    public String getTableName() {
        return this.tableName;
    }
}
