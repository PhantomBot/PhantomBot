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
package com.gmt2001.datastore;

import java.sql.PreparedStatement;

/**
 * Database Access Base Class
 *
 * @author gmt2001
 */
public abstract class DataStore {

    public static DataStore instance() {
        return null;
    }

    protected DataStore(String unused) {
    }

    /**
     * Returns a list of tables in the database.
     *
     * Only tables with the {@code phantombot_} prefix are returned. The prefix is removed
     *
     * @return
     */
    public abstract String[] GetFileList();

    /**
     * Returns a list of all values in the {@code section} column within the table
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @return
     */
    public abstract String[] GetCategoryList(String fName);

    /**
     * Returns a list of all values in the {@code variable} column within the table and section
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return
     */
    public abstract String[] GetKeyList(String fName, String section);

    /**
     * Returns a list of all {@code variable/value} pairs within the table and section
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return
     */
    public abstract KeyValue[] GetKeyValueList(String fName, String section);

    /**
     * Returns a list of all values in the {@code variable} column within the default section of the table, sorted naturally in Descending order
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @return
     */
    public String[] GetKeysByOrder(String fName) {
        return this.GetKeysByOrder(fName, "", "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally in Descending order
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return
     */
    public String[] GetKeysByOrder(String fName, String section) {
        return this.GetKeysByOrder(fName, section, "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order Sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @return
     */
    public String[] GetKeysByOrder(String fName, String section, String order) {
        return this.GetKeysByOrder(fName, section, order, String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, sorted naturally
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order Sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @param limit The maximum number of results to return from this query
     * @param offset The offset to start reading from
     * @return
     */
    public String[] GetKeysByOrder(String fName, String section, String order, String limit, String offset) {
        return new String[]{};
    }

    /**
     * Returns a list of all values in the {@code variable} column within the default section of the table, sorted naturally Descending as integers
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @return
     */
    public String[] GetKeysByNumberOrder(String fName) {
        return this.GetKeysByNumberOrder(fName, "", "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally Descending as integers
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return
     */
    public String[] GetKeysByNumberOrder(String fName, String section) {
        return this.GetKeysByNumberOrder(fName, section, "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally as integers
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order Sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @return
     */
    public String[] GetKeysByNumberOrder(String fName, String section, String order) {
        return this.GetKeysByNumberOrder(fName, section, order, String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, sorted naturally as integers
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order Sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @param limit The maximum number of results to return from this query
     * @param offset The offset to start reading from
     * @return
     */
    public String[] GetKeysByNumberOrder(String fName, String section, String order, String limit, String offset) {
        return new String[]{};
    }

    /**
     * Returns a list of all values in the {@code variable} column within the default section of the table, sorted naturally Descending by the {@code value} column
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @return
     */
    public String[] GetKeysByOrderValue(String fName) {
        return this.GetKeysByOrderValue(fName, "", "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally Descending by the {@code value} column
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return
     */
    public String[] GetKeysByOrderValue(String fName, String section) {
        return this.GetKeysByOrderValue(fName, section, "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally by the {@code value} column
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order Sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @return
     */
    public String[] GetKeysByOrderValue(String fName, String section, String order) {
        return this.GetKeysByOrderValue(fName, section, order, String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, sorted naturally by the {@code value} column
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order Sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @param limit The maximum number of results to return from this query
     * @param offset The offset to start reading from
     * @return
     */
    public String[] GetKeysByOrderValue(String fName, String section, String order, String limit, String offset) {
        return new String[]{};
    }

    /**
     * Returns a list of all values in the {@code variable} column within the default section of the table, sorted naturally Descending by the {@code value} column as integers
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return
     */
    public String[] GetKeysByNumberOrderValue(String fName) {
        return this.GetKeysByNumberOrderValue(fName, "", "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally Descending by the {@code value} column as integers
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return
     */
    public String[] GetKeysByNumberOrderValue(String fName, String section) {
        return this.GetKeysByNumberOrderValue(fName, section, "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally by the {@code value} column as integers
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order Sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @return
     */
    public String[] GetKeysByNumberOrderValue(String fName, String section, String order) {
        return this.GetKeysByNumberOrderValue(fName, section, order, String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, sorted naturally by the {@code value} column as integers
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order Sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @param limit The maximum number of results to return from this query
     * @param offset The offset to start reading from
     * @return
     */
    public String[] GetKeysByNumberOrderValue(String fName, String section, String order, String limit, String offset) {
        return new String[]{};
    }

    /**
     * Returns the value of the {@code variable} column for the given table, section, and value
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param value The value of the {@code value} column
     * @return
     */
    public String GetKeyByValue(String fName, String section, String value) {
        return "";
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, where the value of the {@code value} column contains the search phrase
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param search The partial value of the {@code value} column to match against
     * @return
     */
    public String[] GetKeysByLikeValues(String fName, String section, String search) {
        return new String[]{};
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, where the value of the {@code variable} column contains the search phrase
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param search The partial value of the {@code variable} column to match against
     * @return
     */
    public String[] GetKeysByLikeKeys(String fName, String section, String search) {
        return new String[]{};
    }

    /**
     * Returns a list of all values in the {@code variable} column within the default section of the table, where the value of the {@code variable} column contains the search phrase, sorted naturally Descending
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param search The partial value of the {@code variable} column to match against
     * @return
     */
    public String[] GetKeysByLikeKeysOrder(String fName, String search) {
        return this.GetKeysByLikeKeysOrder(fName, "", search, "DESC", "0", String.valueOf(Integer.MAX_VALUE));
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, where the value of the {@code variable} column contains the search phrase, sorted naturally Descending
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param search The partial value of the {@code variable} column to match against
     * @return
     */
    public String[] GetKeysByLikeKeysOrder(String fName, String section, String search) {
        return this.GetKeysByLikeKeysOrder(fName, section, search, "DESC", "0", String.valueOf(Integer.MAX_VALUE));
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, where the value of the {@code variable} column contains the search phrase, sorted naturally
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param search The partial value of the {@code variable} column to match against
     * @param order Sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @return
     */
    public String[] GetKeysByLikeKeysOrder(String fName, String section, String search, String order) {
        return this.GetKeysByLikeKeysOrder(fName, "", search, "DESC", "0", String.valueOf(Integer.MAX_VALUE));
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, where the value of the {@code variable} column contains the search phrase, sorted naturally
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param search The partial value of the {@code variable} column to match against
     * @param order Sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @param limit The maximum number of results to return from this query
     * @param offset The offset to start reading from
     * @return
     */
    public String[] GetKeysByLikeKeysOrder(String fName, String section, String search, String order, String limit, String offset) {
        return new String[]{};
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a string
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column to retrieve
     * @return
     */
    public abstract String GetString(String fName, String section, String key);

    /**
     * Sets the value of the {@code value} column for the given table, section, and key as a string
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column to update
     * @param value The new value of the {@code value} column
     * @return
     */
    public abstract void SetString(String fName, String section, String key, String value);

    /**
     * Sets the value of the {@code value} column for the given table, section, and key as a string
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column to update
     * @param value The new value of the {@code value} column
     * @return
     */
    public void InsertString(String fName, String section, String key, String value) {
        SetString(fName, section, key, value);
    }

    /**
     * Increases the value of the {@code value} column as an integer for all keys of the given table and section
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param keys The values of the {@code variable} column to update
     * @param value The new value to increase the {@code value} column by
     * @return
     */
    public void IncreaseBatchString(String fName, String section, String[] keys, String value) {
        int amount;

        try {
            amount = Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            amount = 0;
        }

        for (String key : keys) {
            int ival = GetInteger(fName, section, key);
            ival += amount;
            SetInteger(fName, section, key, ival);
        }
    }

    /**
     * Performs a bulk {@link #SetString(String, String, String, String)} operation, using available database features to do so more efficiently.
     *
     * The array index of the keys and value params are linked
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param keys The values of the {@code variable} column to update
     * @param value The new values to set the {@code value} column to
     * @return
     */
    public void SetBatchString(String fName, String section, String[] key, String[] value) {
        for (int i = 0; i < key.length; i++) {
            SetString(fName, section, key[i], value[i]);
        }
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a long
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column to retrieve
     * @return The value as a long; {@code 0L} if the conversion fails
     */
    public long GetLong(String fName, String section, String key) {
        String sval = GetString(fName, section, key);

        try {
            return Long.parseLong(sval);
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    /**
     * Sets the value of the {@code value} column for the given table, section, and key as a long
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column to retrieve
     * @param value The new value of the {@code value} column
     */
    public void SetLong(String fName, String section, String key, long value) {
        String sval = Long.toString(value);

        SetString(fName, section, key, sval);
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as an integer
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column to retrieve
     * @return The value as an integer; {@code 0} if the conversion fails
     */
    public int GetInteger(String fName, String section, String key) {
        String sval = GetString(fName, section, key);

        try {
            return Integer.parseInt(sval);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    /**
     * Sets the value of the {@code value} column for the given table, section, and key as an integer
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column to retrieve
     * @param value The new value of the {@code value} column
     */
    public void SetInteger(String fName, String section, String key, int value) {
        String sval = Integer.toString(value);

        SetString(fName, section, key, sval);
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a float
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column to retrieve
     * @return The value as a float; {@code 0.0f} if the conversion fails
     */
    public float GetFloat(String fName, String section, String key) {
        String sval = GetString(fName, section, key);

        try {
            return Float.parseFloat(sval);
        } catch (NumberFormatException ex) {
            return 0.0f;
        }
    }

    /**
     * Sets the value of the {@code value} column for the given table, section, and key as a float
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column to retrieve
     * @param value The new value of the {@code value} column
     */
    public void SetFloat(String fName, String section, String key, float value) {
        String sval = Float.toString(value);

        SetString(fName, section, key, sval);
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a double
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column to retrieve
     * @return The value as a double; {@code 0.0} if the conversion fails
     */
    public double GetDouble(String fName, String section, String key) {
        String sval = GetString(fName, section, key);

        try {
            return Double.parseDouble(sval);
        } catch (NumberFormatException ex) {
            return 0.0;
        }
    }

    /**
     * Sets the value of the {@code value} column for the given table, section, and key as a double
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column to retrieve
     * @param value The new value of the {@code value} column
     */
    public void SetDouble(String fName, String section, String key, double value) {
        String sval = Double.toString(value);

        SetString(fName, section, key, sval);
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a boolean
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column to retrieve
     * @return {@code true} if the value as a string is {@code "1"}, {@code "true"}, or {@code "yes"}; {@code false} otherwise
     */
    public boolean GetBoolean(String fName, String section, String key) {
        String val = GetString(fName, section, key);

        return val != null && (val.equals("1") || val.equalsIgnoreCase("true") || val.equalsIgnoreCase("yes"));
    }

    /**
     * Sets the value of the {@code value} column for the given table, section, and key as a boolean
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column to retrieve
     * @param value The new value of the {@code value} column
     */
    public void SetBoolean(String fName, String section, String key, boolean value) {
        int ival = 0;

        if (value) {
            ival = 1;
        }

        SetInteger(fName, section, key, ival);
    }

    /**
     * Deletes the row that matches the given table, section, and key
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column
     */
    public abstract void RemoveKey(String fName, String section, String key);

    /**
     * Deletes all rows that matches the given table and section
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section
     */
    public abstract void RemoveSection(String fName, String section);

    /**
     * Creates a new table
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     */
    public abstract void AddFile(String fName);

    /**
     * Deletes the table
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     */
    public abstract void RemoveFile(String fName);

    /**
     * Renames the table
     *
     * @param fNameSource A table name for an existing table, without the {@code phantombot_} prefix
     * @param fNameDest A new table name that does not yet exist, without the {@code phantombot_} prefix
     */
    public abstract void RenameFile(String fNameSource, String fNameDest);

    /**
     * Indicates if the given table already exists
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @return
     */
    public abstract boolean FileExists(String fName);

    /**
     * Indicates if the given table contains a row matching the given section and key
     *
     * @param A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) or {@code null} for all sections
     * @param key The value of the {@code variable} column
     * @return
     */
    public boolean HasKey(String fName, String section, String key) {
        return GetString(fName, section, key) != null;
    }

    /**
     * Indicates if the given table contains a row matching the given key
     *
     * @param A table name, without the {@code phantombot_} prefix
     * @param key The value of the {@code variable} column
     * @return
     */
    public boolean exists(String fName, String key) {
        return HasKey(fName, null, key);
    }

    /**
     * Returns the value of the {@code value} column from the default section of the given table and key as a string
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param key The value of the {@code variable} column to retrieve
     * @return
     */
    public String get(String fName, String key) {
        return GetString(fName, null, key);
    }

    /**
     * Sets the value of the {@code value} column for the default section of the given table and key as a string
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param key The value of the {@code variable} column to update
     * @param value The new value of the {@code value} column
     * @return
     */
    public void set(String fName, String key, String value) {
        SetString(fName, "", key, value);
    }

    /**
     * Performs a bulk {@link #set(String, String, String)} operation, using available database features to do so more efficiently.
     *
     * The array index of the keys and value params are linked
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param keys The values of the {@code variable} column to update
     * @param value The new values to set the {@code value} column to
     * @return
     */
    public void setbatch(String fName, String[] keys, String[] values) {
        SetBatchString(fName, "", keys, values);
    }

    /**
     * Deletes the row from the default section that matches the given tableand key
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param key The value of the {@code variable} column
     */
    public void del(String fName, String key) {
        RemoveKey(fName, "", key);
    }

    /**
     * Increases the value of the {@code value} column as an integer in the given table, section, and key
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column
     * @param amount The amount to increase the value of the {@code value} column by
     */
    public void incr(String fName, String section, String key, int amount) {
        int ival = GetInteger(fName, section, key);
        ival += amount;
        SetInteger(fName, section, key, ival);
    }

    /**
     * Increases the value of the {@code value} column as an integer in the default section of the given table and key
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param key The value of the {@code variable} column
     * @param amount The amount to increase the value of the {@code value} column by
     */
    public void incr(String fName, String key, int amount) {
        incr(fName, "", key, amount);
    }

    /**
     * Decreases the value of the {@code value} column as an integer in the given table, section, and key
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column
     * @param amount The amount to decrease the value of the {@code value} column by
     */
    public void decr(String fName, String section, String key, int amount) {
        int ival = GetInteger(fName, section, key);
        ival -= amount;
        SetInteger(fName, section, key, ival);
    }

    /**
     * Decreases the value of the {@code value} column as an integer in the default section of the given table and key
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param key The value of the {@code variable} column
     * @param amount The amount to decrease the value of the {@code value} column by
     */
    public void decr(String fName, String key, int amount) {
        decr(fName, "", key, amount);
    }

    /**
     * Decreases the value of the {@code value} column as a long in the default section of the given table and key
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param key The value of the {@code variable} column
     * @param amount The amount to decrease the value of the {@code value} column by
     */
    public void decr(String fName, String key, long amount) {
        decr(fName, "", key, amount);
    }

    /**
     * Increases the value of the {@code value} column as a long in the given table, section, and key
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column
     * @param amount The amount to increase the value of the {@code value} column by
     */
    public void incr(String fName, String section, String key, long amount) {
        long ival = GetLong(fName, section, key);
        ival += amount;
        SetLong(fName, section, key, ival);
    }

    /**
     * Increases the value of the {@code value} column as a long in the default section of the given table and key
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param key The value of the {@code variable} column
     * @param amount The amount to increase the value of the {@code value} column by
     */
    public void incr(String fName, String key, long amount) {
        incr(fName, "", key, amount);
    }

    /**
     * Decreases the value of the {@code value} column as a long in the given table, section, and key
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param section A section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key The value of the {@code variable} column
     * @param amount The amount to decrease the value of the {@code value} column by
     */
    public void decr(String fName, String section, String key, long amount) {
        long ival = GetLong(fName, section, key);
        ival -= amount;
        SetLong(fName, section, key, ival);
    }

    /**
     * Returns a list of values in the {@code variable} column within the default section of the table, where the value of the {@code value} column contains the search phrase
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param search The partial value of the {@code value} column to match against
     * @return
     */
    public String[] searchByValue(String fName, String search) {
        return GetKeysByLikeValues(fName, "", search);
    }

    /**
     * Returns a list of values in the {@code variable} column within the default section of the table, where the value of the {@code variable} column contains the search phrase
     *
     * @param fName A table name, without the {@code phantombot_} prefix
     * @param search The partial value of the {@code variable} column to match against
     * @return
     */
    public String[] searchByKey(String fName, String search) {
        return GetKeysByLikeKeys(fName, "", search);
    }

    /**
     * Executes an SQL query.
     *
     * The query is executed using a {@link PreparedStatement} with calls to {@link PreparedStatement#setString(int, String)}
     *
     * For example:
     * {@code executeSql("SELECT * FROM foo WHERE bar = ?", ["baz"])}
     *
     * The value {@code "baz"} is escaped to prevent SQL injection, then inserted in place of the {@code ?}
     *
     * This yields the final query of
     * {@code SELECT * FROM foo WHERE bar = "baz"}
     *
     * You can use {@code ?} as many times as neccessary, but must provide the same number of elements in the replacements array for the replacement to work
     *
     * Replacements are performed in order from left to right
     *
     * @param sql The query to execute
     * @param replacements Replacements for {@link PreparedStatement#setString(int, String)}
     * @return An array of data as strings representing the result set, if the query was a DQL statement; empty arrays otherwise. The outer array represents rows; the inner array represents columns; the values of the inner array represent the value of the row-column pair at that index as a string
     */
    public String[][] executeSql(String sql, String[] replacements) {
        return new String[][]{};
    }

    /**
     * Ensures that all tables created with {@link #AddFile(String)} have a {@code UNIQUE} index across the {@code section} and {@code variable} columns.
     *
     * If a constraint violation occurs while attempting to create the index, all rows violating the constraint except the first for each pair are deleted
     */
    public void CreateIndexes() {
    }

    /**
     * Drops all {@code UNIQUE} indexes from tables created with {@link #AddFile(String)}
     */
    public void DropIndexes() {
    }

    /**
     * Tests if the connection to the database succeeds.
     *
     * This is a no-op on embedded databases. Only remote databases such as MySQL will provide an implementation of this method
     *
     * @param db The JDBC connection string
     * @param user The username
     * @param pass The password
     * @return {@code true} on success or on embedded databases
     */
    public boolean CanConnect(String db, String user, String pass) {
        return true;
    }

    /**
     * Indicates if this database type supports generating backup files
     *
     * @return
     */
    public boolean canBackup() {
        return false;
    }

    /**
     * Backs up the database to the specified filename in the {@code dbbackup} folder
     * @param filename
     */
    public void backupDB(String filename) {
    }

    public void dispose() {
    }
}
