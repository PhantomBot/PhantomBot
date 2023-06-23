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
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.InsertValuesStep3;
import org.jooq.Nullability;
import org.jooq.Query;
import org.jooq.Table;
import org.jooq.impl.SQLDataType;

import com.gmt2001.datastore2.Datastore2;

/**
 * Provides access to the database in a key-value store style
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
     * Converts Datastore1 driver names to Datastore2 driver names
     *
     * @param classname the classname of the driver
     * @return the converted classname
     */
    public static String resolveClassname(String classname) {
        if (classname.equalsIgnoreCase("sqlite3store")) {
            classname = "SQLiteStore2";
        }

        if (!classname.endsWith("2")) {
            classname += "2";
        }

        return classname;
    }

    /**
     * Attempts to find the named table case-insensitively
     * <p>
     * The {@code phantombot_} prefix is automatically prefixed to the table name
     *
     * @param fName the table name, without the {@code phantombot_} prefix
     * @return an {@link Optional} which contains the matching {@link Table}, if found
     */
    public Optional<Table<?>> findTable(String fName) {
        return dsl().meta().getTables().stream().filter(t -> t.getName().equalsIgnoreCase("phantombot_" + fName)).findFirst();
    }

    /**
     * Attempts to find the named field case-insensitively
     *
     * @param name the name of the field
     * @param tbl the {@link Table} to search
     * @return an {@link Optional} which contains the matching {@link Field}, if found
     */
    public Field<String> field(String name, Table<?> tbl) {
        return tbl.fieldStream().filter(f -> f.getName().equalsIgnoreCase(name)).map(f -> f.coerce(String.class)).findFirst().orElse(null);
    }

    /**
     * Shortcut for {@link Datastore2#dslContext()}
     *
     * @return the active {@link DSLContext}
     */
    public DSLContext dsl() {
        return Datastore2.instance().dslContext();
    }

    /**
     * Returns a list of tables in the database.
     * <p>
     * Only tables with the {@code phantombot_} prefix are returned. The prefix is removed
     *
     * @return an array of table names
     */
    public String[] GetFileList() {
        return dsl().meta().getTables().stream().filter(t -> t.getName().toLowerCase().startsWith("phantombot_"))
            .map(t -> t.getName().replaceFirst("(?i)phantombot_", "")).collect(Collectors.toList()).toArray(new String[0]);
    }

    /**
     * Returns a list of all values in the {@code section} column within the table
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @return an array of sections
     */
    public String[] GetCategoryList(String fName) {
        Optional<Table<?>> otbl = findTable(fName);

        if (otbl.isPresent()) {
            Table<?> tbl = otbl.get();
            return dsl().select(field("section", tbl)).from(tbl)
            .groupBy(field("section", tbl)).fetch(field("section", tbl)).toArray(new String[0]);
        }

        return new String[0];
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return an array of variables
     */
    public String[] GetKeyList(String fName, String section) {
        Optional<Table<?>> otbl = findTable(fName);

        if (otbl.isPresent()) {
            Table<?> tbl = otbl.get();
            if (section == null) {
                return dsl().select(field("variable", tbl)).from(tbl)
                .fetch(field("variable", tbl)).toArray(new String[0]);
            } else {
                return dsl().select(field("variable", tbl)).from(tbl)
                .where(field("section", tbl).eq(section)).fetch(field("variable", tbl)).toArray(new String[0]);
            }
        }

        return new String[0];
    }

    /**
     * Returns a list of all {@code variable/value} pairs within the table and section
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return an array of {@link KeyValue} pairs denoting the variables and values
     */
    public KeyValue[] GetKeyValueList(String fName, String section) {
        Optional<Table<?>> otbl = findTable(fName);

        if (otbl.isPresent()) {
            Table<?> tbl = otbl.get();
            if (section == null) {
                return dsl().select(field("variable", tbl), field("value", tbl)).from(tbl)
                .fetchMap(field("variable", tbl), field("value", tbl)).entrySet().stream()
                .map(e -> new KeyValue(e.getKey(), e.getValue())).collect(Collectors.toList())
                .toArray(new KeyValue[0]);
            } else {
                return dsl().select(field("variable", tbl), field("value", tbl)).from(tbl)
                .where(field("section", tbl).eq(section))
                .fetchMap(field("variable", tbl), field("value", tbl)).entrySet().stream()
                .map(e -> new KeyValue(e.getKey(), e.getValue())).collect(Collectors.toList())
                .toArray(new KeyValue[0]);
            }
        }

        return new KeyValue[0];
    }

    /**
     * Returns a list of all values in the {@code variable} column within the default section of the table, sorted naturally in Descending order
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @return
     */
    public String[] GetKeysByOrder(String fName) {
        return this.GetKeysByOrder(fName, "", "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally in Descending order
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return
     */
    public String[] GetKeysByOrder(String fName, String section) {
        return this.GetKeysByOrder(fName, section, "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order Sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @return
     */
    public String[] GetKeysByOrder(String fName, String section, String order) {
        return this.GetKeysByOrder(fName, section, order, String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, sorted naturally
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
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
     * @param fName a table name, without the {@code phantombot_} prefix
     * @return
     */
    public String[] GetKeysByNumberOrder(String fName) {
        return this.GetKeysByNumberOrder(fName, "", "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally Descending as integers
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return
     */
    public String[] GetKeysByNumberOrder(String fName, String section) {
        return this.GetKeysByNumberOrder(fName, section, "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally as integers
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order Sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @return
     */
    public String[] GetKeysByNumberOrder(String fName, String section, String order) {
        return this.GetKeysByNumberOrder(fName, section, order, String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, sorted naturally as integers
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
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
     * @param fName a table name, without the {@code phantombot_} prefix
     * @return
     */
    public String[] GetKeysByOrderValue(String fName) {
        return this.GetKeysByOrderValue(fName, "", "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally Descending by the {@code value} column
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return
     */
    public String[] GetKeysByOrderValue(String fName, String section) {
        return this.GetKeysByOrderValue(fName, section, "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally by the {@code value} column
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order Sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @return
     */
    public String[] GetKeysByOrderValue(String fName, String section, String order) {
        return this.GetKeysByOrderValue(fName, section, order, String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, sorted naturally by the {@code value} column
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
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
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return
     */
    public String[] GetKeysByNumberOrderValue(String fName) {
        return this.GetKeysByNumberOrderValue(fName, "", "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally Descending by the {@code value} column as integers
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return
     */
    public String[] GetKeysByNumberOrderValue(String fName, String section) {
        return this.GetKeysByNumberOrderValue(fName, section, "DESC", String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally by the {@code value} column as integers
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order Sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @return
     */
    public String[] GetKeysByNumberOrderValue(String fName, String section, String order) {
        return this.GetKeysByNumberOrderValue(fName, section, order, String.valueOf(Integer.MAX_VALUE), "0");
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, sorted naturally by the {@code value} column as integers
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
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
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param value the value of the {@code value} column
     * @return
     */
    public String GetKeyByValue(String fName, String section, String value) {
        return "";
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, where the value of the {@code value} column contains the search phrase
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param search The partial value of the {@code value} column to match against
     * @return
     */
    public String[] GetKeysByLikeValues(String fName, String section, String search) {
        return new String[]{};
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, where the value of the {@code variable} column contains the search phrase
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param search The partial value of the {@code variable} column to match against
     * @return
     */
    public String[] GetKeysByLikeKeys(String fName, String section, String search) {
        return new String[]{};
    }

    /**
     * Returns a list of all values in the {@code variable} column within the default section of the table, where the value of the {@code variable} column contains the search phrase, sorted naturally Descending
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param search The partial value of the {@code variable} column to match against
     * @return
     */
    public String[] GetKeysByLikeKeysOrder(String fName, String search) {
        return this.GetKeysByLikeKeysOrder(fName, "", search, "DESC", "0", String.valueOf(Integer.MAX_VALUE));
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, where the value of the {@code variable} column contains the search phrase, sorted naturally Descending
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param search The partial value of the {@code variable} column to match against
     * @return
     */
    public String[] GetKeysByLikeKeysOrder(String fName, String section, String search) {
        return this.GetKeysByLikeKeysOrder(fName, section, search, "DESC", "0", String.valueOf(Integer.MAX_VALUE));
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, where the value of the {@code variable} column contains the search phrase, sorted naturally
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
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
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
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
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @return the value; {@code null} if not found
     */
    public String GetString(String fName, String section, String key) {
        Optional<Table<?>> otbl = findTable(fName);

        if (otbl.isPresent()) {
            Table<?> tbl = otbl.get();
            String r;
            if (section == null) {
                r = dsl().selectFrom(tbl)
                .where(field("variable", tbl).eq(key)).fetchAny(field("value", tbl));
            } else {
                r = dsl().selectFrom(tbl)
                .where(field("section", tbl).eq(section),
                field("variable", tbl).eq(key)).fetchAny(field("value", tbl));
            }

            return r;
        }

        return null;
    }

    /**
     * Sets the value of the {@code value} column for the given table, section, and key as a string
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to update
     * @param value the new value of the {@code value} column
     */
    public void SetString(String fName, String section, String key, String value) {
        Optional<Table<?>> otbl = findTable(fName);

        if (!otbl.isPresent()) {
            this.AddFile(fName);
            otbl = findTable(fName);
        }

        if (otbl.isPresent()) {
            this.SetString(dsl(), otbl.get(), this.HasKey(fName, section, key), section, key, value);
        }
    }

    /**
     * Sets the value of the {@code value} column for the given table, section, and key as a string
     *
     * @param dsl the {@link DSLContext} on which to execute the query
     * @param tbl the {@link Table} to operate on
     * @param hasKey {@code true} if the key already exists and an {@code UPDATE} should be performed
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to update
     * @param value the new value of the {@code value} column
     */
    private void SetString(DSLContext dsl, Table<?> tbl, boolean hasKey, String section, String key, String value) {
            if (hasKey) {
                if (section == null) {
                    dsl.update(tbl)
                    .set(field("value", tbl), value)
                    .where(field("variable", tbl).eq(key)).executeAsync();
                } else {
                    dsl.update(tbl)
                    .set(field("value", tbl), value)
                    .where(field("section", tbl).eq(section),
                    field("variable", tbl).eq(key)).executeAsync();
                }
            } else {
                dsl.insertInto(tbl).values(section, key, value).executeAsync();
            }
    }

    /**
     * Sets the value of the {@code value} column for the given table, section, and key as a string
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to update
     * @param value the new value of the {@code value} column
     */
    public void InsertString(String fName, String section, String key, String value) {
        SetString(fName, section, key, value);
    }

    /**
     * Increases the value of the {@code value} column as an integer for all keys of the given table and section
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param keys the values of the {@code variable} column to update
     * @param value the new value to increase the {@code value} column by
     */
    public void IncreaseBatchString(String fName, String section, String[] keys, String value) {
        int amount;

        try {
            amount = Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            amount = 0;
        }

        Optional<Table<?>> otbl = findTable(fName);

        if (otbl.isPresent()) {
            Table<?> tbl = otbl.get();
            List<String> updates;
            if (section == null) {
                updates = dsl().select(field("variable", tbl)).from(tbl).where(field("variable", tbl).in(keys)).fetch(field("variable", tbl));
            } else {
                updates = dsl().select(field("variable", tbl)).from(tbl).where(field("section", tbl).eq(section), field("variable", tbl).in(keys)).fetch(field("variable", tbl));
            }
            final int famount = amount;
            final String sfamount = Integer.toString(famount);
            dsl().batched(c -> {
                c.dsl().startTransaction().execute();
                if (section == null) {
                    c.dsl().update(tbl)
                    .set(Collections.singletonMap(field("value", tbl), field("value", tbl).cast(SQLDataType.INTEGERUNSIGNED).add(famount)))
                    .where(field("variable", tbl).in(keys)).execute();
                } else {
                    c.dsl().update(tbl)
                    .set(Collections.singletonMap(field("value", tbl), field("value", tbl).cast(SQLDataType.INTEGERUNSIGNED).add(famount)))
                    .where(field("section", tbl).eq(section), field("variable", tbl).in(keys)).execute();
                }

                if (updates.size() < keys.length) {
                    String isection = section;
                    if (isection == null) {
                        isection = "";
                    }

                    InsertValuesStep3<?, String, String, String> iq = c.dsl()
                    .insertInto(tbl, field("section", tbl), field("variable", tbl), field("value", tbl));

                    for (String key : keys) {
                        if (!updates.contains(key)) {
                            iq = iq.values(isection, key, sfamount);
                        }
                    }

                    iq.onDuplicateKeyIgnore().execute();
                }

                c.dsl().commit().execute();
            });
        }
    }

    /**
     * Performs a bulk {@link #SetString(String, String, String, String)} operation, using available database features to do so more efficiently.
     * <p>
     * The array index of the keys and value params are linked
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param keys the values of the {@code variable} column to update
     * @param value the new values to set the {@code value} column to
     */
    public void SetBatchString(String fName, String section, String[] key, String[] value) {
        Optional<Table<?>> otbl = findTable(fName);

        if (otbl.isPresent()) {
            Table<?> tbl = otbl.get();
            List<String> updates;
            if (section == null) {
                updates = dsl().select(field("variable", tbl)).from(tbl).where(field("variable", tbl).in(key)).fetch(field("variable", tbl));
            } else {
                updates = dsl().select(field("variable", tbl)).from(tbl).where(field("section", tbl).eq(section), field("variable", tbl).in(key)).fetch(field("variable", tbl));
            }
            dsl().batched(c -> {
                c.dsl().startTransaction().execute();
                for (int i = 0; i < Math.min(key.length, value.length); i++) {
                    if (updates.contains(key[i])) {
                        this.SetString(c.dsl(), tbl, true, section, key[i], value[i]);
                    }
                }
                for (int i = 0; i < Math.min(key.length, value.length); i++) {
                    if (!updates.contains(key[i])) {
                        this.SetString(c.dsl(), tbl, false, section, key[i], value[i]);
                    }
                }
                c.dsl().commit().execute();
            });
        }
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a long
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
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
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @param value the new value of the {@code value} column
     */
    public void SetLong(String fName, String section, String key, long value) {
        String sval = Long.toString(value);

        SetString(fName, section, key, sval);
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as an integer
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
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
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @param value the new value of the {@code value} column
     */
    public void SetInteger(String fName, String section, String key, int value) {
        String sval = Integer.toString(value);

        SetString(fName, section, key, sval);
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a float
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
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
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @param value the new value of the {@code value} column
     */
    public void SetFloat(String fName, String section, String key, float value) {
        String sval = Float.toString(value);

        SetString(fName, section, key, sval);
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a double
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
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
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @param value the new value of the {@code value} column
     */
    public void SetDouble(String fName, String section, String key, double value) {
        String sval = Double.toString(value);

        SetString(fName, section, key, sval);
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a boolean
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @return {@code true} if the value as a string is {@code "1"}, {@code "true"}, or {@code "yes"}; {@code false} otherwise
     */
    public boolean GetBoolean(String fName, String section, String key) {
        String val = GetString(fName, section, key);

        return val != null && (val.equals("1") || val.equalsIgnoreCase("true") || val.equalsIgnoreCase("yes"));
    }

    /**
     * Sets the value of the {@code value} column for the given table, section, and key as a boolean
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @param value the new value of the {@code value} column
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
     * <p>
     * If {@code section} is null, deletes all rows with a matching table and key, reguardless of section
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column
     */
    public void RemoveKey(String fName, String section, String key) {
        Optional<Table<?>> otbl = findTable(fName);

        if (otbl.isPresent()) {
            Table<?> tbl = otbl.get();
            if (section == null) {
                dsl().deleteFrom(tbl)
                .where(field("variable", tbl).eq(key)).executeAsync();
            } else {
                dsl().deleteFrom(tbl)
                .where(field("section", tbl).eq(section),
                field("variable", tbl).eq(key)).executeAsync();
            }
        }
    }

    /**
     * Deletes all rows that match the given table and section
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section
     */
    public void RemoveSection(String fName, String section) {
        Optional<Table<?>> otbl = findTable(fName);

        if (otbl.isPresent()) {
            Table<?> tbl = otbl.get();
            dsl().deleteFrom(tbl)
            .where(field("section", tbl).eq(section)).executeAsync();
        }
    }

    /**
     * Creates a new table
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     */
    public void AddFile(String fName) {
        this.AddFile(fName, false);
    }

    /**
     * Creates a new table
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param async {@code true} to execute asynchronously
     */
    public void AddFile(String fName, boolean async) {
        Query q = dsl().createTableIfNotExists("phantombot_" + fName)
        .column("section", SQLDataType.VARCHAR(255).nullability(Nullability.NULL))
        .column("varible", SQLDataType.VARCHAR(255).nullability(Nullability.NOT_NULL))
        .column("value", Datastore2.instance().longTextDataType())
        .unique("section", "varible");

        if (async) {
            q.executeAsync();
        } else {
            q.execute();
        }
    }

    /**
     * Deletes the table
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     */
    public void RemoveFile(String fName) {
        Optional<Table<?>> otbl = findTable(fName);

        if (otbl.isPresent()) {
            dsl().dropTable(otbl.get()).executeAsync();
        }
    }

    /**
     * Renames the table
     *
     * @param fNameSource a table name for an existing table, without the {@code phantombot_} prefix
     * @param fNameDest Aanew table name that does not yet exist, without the {@code phantombot_} prefix
     */
    public void RenameFile(String fNameSource, String fNameDest) {
        Optional<Table<?>> otbl = findTable(fNameSource);

         if (otbl.isPresent()) {
            dsl().alterTable(otbl.get()).renameTo("phantombot_" + fNameDest).executeAsync();
         }
    }

    /**
     * Indicates if the given table already exists
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @return {@code true} if the table exists
     */
    public boolean FileExists(String fName) {
        return findTable(fName).isPresent();
    }

    /**
     * Indicates if the given table contains a row matching the given section and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) or {@code null} for all sections
     * @param key the value of the {@code variable} column
     * @return {@code true} if the key exists
     */
    public boolean HasKey(String fName, String section, String key) {
        return GetString(fName, section, key) != null;
    }

    /**
     * Indicates if the given table contains a row matching the given key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param key the value of the {@code variable} column
     * @return {@code true} if the key exists
     */
    public boolean exists(String fName, String key) {
        return HasKey(fName, null, key);
    }

    /**
     * Returns the value of the {@code value} column from the default section of the given table and key as a string
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param key the value of the {@code variable} column to retrieve
     * @return the value; {@code null} if not found
     */
    public String get(String fName, String key) {
        return GetString(fName, null, key);
    }

    /**
     * Sets the value of the {@code value} column for the default section of the given table and key as a string
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param key the value of the {@code variable} column to update
     * @param value the new value of the {@code value} column
     */
    public void set(String fName, String key, String value) {
        SetString(fName, "", key, value);
    }

    /**
     * Performs a bulk {@link #set(String, String, String)} operation, using available database features to do so more efficiently.
     *
     * The array index of the keys and value params are linked
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param keys the values of the {@code variable} column to update
     * @param value the new values to set the {@code value} column to
     */
    public void setbatch(String fName, String[] keys, String[] values) {
        SetBatchString(fName, "", keys, values);
    }

    /**
     * Deletes the row from the default section that matches the given table and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param key the value of the {@code variable} column
     */
    public void del(String fName, String key) {
        RemoveKey(fName, "", key);
    }

    /**
     * Increases the value of the {@code value} column as an integer in the given table, section, and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column
     * @param amount the amount to increase the value of the {@code value} column by
     */
    public void incr(String fName, String section, String key, int amount) {
        int ival = GetInteger(fName, section, key);
        ival += amount;
        SetInteger(fName, section, key, ival);
    }

    /**
     * Increases the value of the {@code value} column as an integer in the default section of the given table and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param key the value of the {@code variable} column
     * @param amount the amount to increase the value of the {@code value} column by
     */
    public void incr(String fName, String key, int amount) {
        incr(fName, "", key, amount);
    }

    /**
     * Decreases the value of the {@code value} column as an integer in the given table, section, and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column
     * @param value the amount to decrease the value of the {@code value} column by
     */
    public void decr(String fName, String section, String key, int amount) {
        int ival = GetInteger(fName, section, key);
        ival -= amount;
        SetInteger(fName, section, key, ival);
    }

    /**
     * Decreases the value of the {@code value} column as an integer in the default section of the given table and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param key the value of the {@code variable} column
     * @param amount the amount to decrease the value of the {@code value} column by
     */
    public void decr(String fName, String key, int amount) {
        decr(fName, "", key, amount);
    }

    /**
     * Decreases the value of the {@code value} column as a long in the default section of the given table and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param key the value of the {@code variable} column
     * @param amount the amount to decrease the value of the {@code value} column by
     */
    public void decr(String fName, String key, long amount) {
        decr(fName, "", key, amount);
    }

    /**
     * Increases the value of the {@code value} column as a long in the given table, section, and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column
     * @param amount the amount to increase the value of the {@code value} column by
     */
    public void incr(String fName, String section, String key, long amount) {
        long ival = GetLong(fName, section, key);
        ival += amount;
        SetLong(fName, section, key, ival);
    }

    /**
     * Increases the value of the {@code value} column as a long in the default section of the given table and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param key the value of the {@code variable} column
     * @param amount the amount to increase the value of the {@code value} column by
     */
    public void incr(String fName, String key, long amount) {
        incr(fName, "", key, amount);
    }

    /**
     * Decreases the value of the {@code value} column as a long in the given table, section, and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column
     * @param amount the amount to decrease the value of the {@code value} column by
     */
    public void decr(String fName, String section, String key, long amount) {
        long ival = GetLong(fName, section, key);
        ival -= amount;
        SetLong(fName, section, key, ival);
    }

    /**
     * Returns a list of values in the {@code variable} column within the default section of the table, where the value of the {@code value} column contains the search phrase
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param search The partial value of the {@code value} column to match against
     * @return
     */
    public String[] searchByValue(String fName, String search) {
        return GetKeysByLikeValues(fName, "", search);
    }

    /**
     * Returns a list of values in the {@code variable} column within the default section of the table, where the value of the {@code variable} column contains the search phrase
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param search The partial value of the {@code variable} column to match against
     * @return
     */
    public String[] searchByKey(String fName, String search) {
        return GetKeysByLikeKeys(fName, "", search);
    }

    /**
     * Executes an SQL query.
     * <p>
     * The query is executed using a {@link PreparedStatement} with calls to {@link PreparedStatement#setString(int, String)}
     * <p>
     * For example:<br />
     * {@code executeSql("SELECT * FROM foo WHERE bar = ?", ["baz"])}
     * <p>
     * The value {@code "baz"} is escaped to prevent SQL injection, then inserted in place of the {@code ?}
     * <p>
     * This yields the final query of<br />
     * {@code SELECT * FROM foo WHERE bar = "baz"}
     * <p>
     * You can use {@code ?} as many times as necessary, but must provide the same number of elements in the replacements array for the replacement to work
     * <p>
     * Replacements are performed in order from left to right
     * <p>
     * Exceptions from failed SQL queries are NOT returned or thrown, but are logged in the core-error log
     *
     * @param sql The query to execute
     * @param replacements Replacements for {@link PreparedStatement#setString(int, String)}
     * @return An List of data as strings representing the result set, if the query was a DQL statement; an empty list otherwise. The outer list represents rows; the inner array represents columns; the values of the inner list represent the value of the row-column pair at that index as a string
     */
    public List<List<String>> query(String sql, String[] replacements) {
        return Collections.emptyList();
    }

    /**
     * Executes an SQL query.
     * <p>
     * The query is executed using a {@link PreparedStatement} with calls to {@link PreparedStatement#setString(int, String)}
     * <p>
     * For example:<br />
     * {@code executeSql("SELECT * FROM foo WHERE bar = ?", ["baz"])}
     * <p>
     * The value {@code "baz"} is escaped to prevent SQL injection, then inserted in place of the {@code ?}
     * <p>
     * This yields the final query of<br />
     * {@code SELECT * FROM foo WHERE bar = "baz"}
     * <p>
     * You can use {@code ?} as many times as necessary, but must provide the same number of elements in the replacements array for the replacement to work
     * <p>
     * Replacements are performed in order from left to right
     * <p>
     * Exceptions from failed SQL queries are NOT returned or thrown, but are logged in the core-error log
     *
     * @param sql The query to execute
     * @param replacements Replacements for {@link PreparedStatement#setString(int, String)}
     * @return An array of data as strings representing the result set, if the query was a DQL statement; empty arrays otherwise. The outer array represents rows; the inner array represents columns; the values of the inner array represent the value of the row-column pair at that index as a string
     */
    public String[][] executeSql(String sql, String[] replacements) {
        return this.query(sql, replacements).stream().map(al -> al.stream().toArray(String[]::new)).toArray(String[][]::new);
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
     * @return {@code true} on success or on embedded databases
     */
    public boolean CanConnect() {
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
     *
     * @param filename The filename for the backup, without extension
     */
    public void backupDB(String filename) {
    }

    public void dispose() {
    }
}
