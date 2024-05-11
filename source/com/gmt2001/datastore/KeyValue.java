/*
 * Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
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
package com.gmt2001.datastore;

/**
 * A key/value pair in the database
 *
 * @author gmt2001
 */
public final class KeyValue {

    /**
     * Constructor
     *
     * @param key the value of the {@code variable} column
     * @param value the value of the {@code value} column
     */
    public KeyValue(String key, String value) {
        this.key = key;
        this.value = value;
    }

    /**
     * The value of the {@code variable} column
     *
     * @return the variable
     */
    public String getKey() {
        return key;
    }

    /**
     * The value of the {@code value} column
     *
     * @return the value
     */
    public String getValue() {
        return value;
    }

    private final String key;
    private final String value;
}
