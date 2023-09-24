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

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.InsertValuesStep3;
import org.jooq.Record1;
import org.jooq.SelectConnectByStep;
import org.jooq.SelectForUpdateStep;
import org.jooq.SelectLimitPercentStep;
import org.jooq.SelectSeekStep1;
import org.jooq.SelectWhereStep;
import org.jooq.SortOrder;
import org.jooq.Table;
import org.jooq.exception.DataAccessException;
import org.jooq.impl.SQLDataType;

import com.gmt2001.datastore2.Datastore2;
import com.gmt2001.datastore2.H2Store2;
import com.gmt2001.datastore2.SQLiteStore2;

/**
 * Provides access to the database in a key-value store style
 *
 * @see Datastore2
 * @author gmt2001
 */
@SuppressWarnings({"removal"})
public sealed class DataStore permits H2Store, MySQLStore, MariaDBStore, SqliteStore {
    private static final DataStore INSTANCE = new DataStore(null);
    /**
     * Provides an instance of {@link DataStore}
     *
     * @return an instance of {@link DataStore}
     */
    public static DataStore instance() {
        return INSTANCE;
    }

    /**
     * Constructor
     *
     * @param unused only used by old classes
     */
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
        return Datastore2.instance().tables().stream().filter(t -> t.getName().equalsIgnoreCase("phantombot_" + fName)).findFirst();
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
     * Returns a list of values in the {@code variable} column within the table and section, sorted naturally
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @param limit the maximum number of results to return from this query; {@code 0} for no limit
     * @param offset the offset to start reading from; {@code 0} for the beginning
     * @param isValue {@code true} if sorting on the value instead of the variable
     * @param isNumber {@code true} if the variable should be cast as an unsigned int for ordering
     * @param like filters by partial matches on the variable; {@code null} to not use
     * @return a sorted list of variables
     */
    private String[] GetKeysByOrderInternal(String fName, String section, String order, int limit, int offset, boolean isValue, boolean isNumber, String like) {
        Optional<Table<?>> otbl = findTable(fName);

        if (otbl.isPresent()) {
            if (!order.equalsIgnoreCase("ASC") && !order.equalsIgnoreCase("DESC")) {
                order = "DESC";
            }
            Table<?> tbl = otbl.get();
            Field<?> ofield;

            if (isValue) {
                ofield = field("value", tbl);
            } else {
                ofield = field("variable", tbl);
            }
            if (isNumber) {
                ofield = ofield.cast(SQLDataType.INTEGERUNSIGNED);
            }
            SelectWhereStep<Record1<String>> w = dsl().select(field("variable", tbl)).from(tbl);
            SelectConnectByStep<Record1<String>> c = w;
            if (section == null) {
                if (like == null) {
                    c = w.where(field("section", tbl).eq(section));
                } else {
                    c = w.where(field("section", tbl).eq(section), field("variable", tbl).like("%" + like + "%"));
                }
            } else if (like != null) {
                c = w.where(field("variable", tbl).like("%" + like + "%"));
            }
            SelectSeekStep1<Record1<String>, ?> s = c.orderBy(ofield.sort(SortOrder.valueOf(order.toUpperCase())));
            SelectLimitPercentStep<Record1<String>> l = null;
            if (limit > 0) {
                l = s.limit(limit);
            }
            SelectForUpdateStep<Record1<String>> o = null;
            if (offset > 0) {
                if (l != null) {
                    o = l.offset(offset);
                } else {
                    o = s.offset(offset);
                }
            }
            List<String> keys;
            if (o != null) {
                keys = o.fetch(field("variable", tbl));
            } else if (l != null) {
                keys = l.fetch(field("variable", tbl));
            } else {
                keys = s.fetch(field("variable", tbl));
            }
            return keys.toArray(new String[0]);
        }
        return new String[]{};
    }

    /**
     * Returns a list of all values in the {@code variable} column within the default section of the table, sorted naturally in Descending order
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @return a sorted list of variables
     */
    public String[] GetKeysByOrder(String fName) {
        return this.GetKeysByOrderInternal(fName, "", "DESC", 0, 0, false, false, null);
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally in Descending order
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return a sorted list of variables
     */
    public String[] GetKeysByOrder(String fName, String section) {
        return this.GetKeysByOrderInternal(fName, section, "DESC", 0, 0, false, false, null);
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @return a sorted list of variables
     */
    public String[] GetKeysByOrder(String fName, String section, String order) {
        return this.GetKeysByOrderInternal(fName, section, order, 0, 0, false, false, null);
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, sorted naturally
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @param limit the maximum number of results to return from this query
     * @param offset the offset to start reading from
     * @return a sorted list of variables
     */
    public String[] GetKeysByOrder(String fName, String section, String order, String limit, String offset) {
        int ilimit;
        int ioffset;
        try {
            ilimit = Integer.parseInt(limit);
        } catch (NumberFormatException ex) {
            ilimit = 0;
        }
        try {
            ioffset = Integer.parseInt(offset);
        } catch (NumberFormatException ex) {
            ioffset = 0;
        }
        return this.GetKeysByOrderInternal(fName, section, order, ilimit, ioffset, false, false, null);
    }

    /**
     * Returns a list of all values in the {@code variable} column within the default section of the table, sorted naturally Descending as integers
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @return a sorted list of variables
     */
    public String[] GetKeysByNumberOrder(String fName) {
        return this.GetKeysByOrderInternal(fName, "", "DESC", 0, 0, false, true, null);
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally Descending as integers
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return a sorted list of variables
     */
    public String[] GetKeysByNumberOrder(String fName, String section) {
        return this.GetKeysByOrderInternal(fName, section, "DESC", 0, 0, false, true, null);
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally as integers
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @return a sorted list of variables
     */
    public String[] GetKeysByNumberOrder(String fName, String section, String order) {
        return this.GetKeysByOrderInternal(fName, section, order, 0, 0, false, true, null);
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, sorted naturally as integers
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @param limit the maximum number of results to return from this query
     * @param offset the offset to start reading from
     * @return a sorted list of variables
     */
    public String[] GetKeysByNumberOrder(String fName, String section, String order, String limit, String offset) {
        int ilimit;
        int ioffset;
        try {
            ilimit = Integer.parseInt(limit);
        } catch (NumberFormatException ex) {
            ilimit = 0;
        }
        try {
            ioffset = Integer.parseInt(offset);
        } catch (NumberFormatException ex) {
            ioffset = 0;
        }
        return this.GetKeysByOrderInternal(fName, section, order, ilimit, ioffset, false, true, null);
    }

    /**
     * Returns a list of all values in the {@code variable} column within the default section of the table, sorted naturally Descending by the {@code value} column
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @return a sorted list of variables
     */
    public String[] GetKeysByOrderValue(String fName) {
        return this.GetKeysByOrderInternal(fName, "", "DESC", 0, 0, true, false, null);
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally Descending by the {@code value} column
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return a sorted list of variables
     */
    public String[] GetKeysByOrderValue(String fName, String section) {
        return this.GetKeysByOrderInternal(fName, section, "DESC", 0, 0, true, false, null);
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally by the {@code value} column
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @return a sorted list of variables
     */
    public String[] GetKeysByOrderValue(String fName, String section, String order) {
        return this.GetKeysByOrderInternal(fName, section, order, 0, 0, true, false, null);
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, sorted naturally by the {@code value} column
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @param limit the maximum number of results to return from this query
     * @param offset the offset to start reading from
     * @return a sorted list of variables
     */
    public String[] GetKeysByOrderValue(String fName, String section, String order, String limit, String offset) {
        int ilimit;
        int ioffset;
        try {
            ilimit = Integer.parseInt(limit);
        } catch (NumberFormatException ex) {
            ilimit = 0;
        }
        try {
            ioffset = Integer.parseInt(offset);
        } catch (NumberFormatException ex) {
            ioffset = 0;
        }
        return this.GetKeysByOrderInternal(fName, section, order, ilimit, ioffset, true, false, null);
    }

    /**
     * Returns a list of all values in the {@code variable} column within the default section of the table, sorted naturally Descending by the {@code value} column as integers
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return a sorted list of variables
     */
    public String[] GetKeysByNumberOrderValue(String fName) {
        return this.GetKeysByOrderInternal(fName, "", "DESC", 0, 0, true, true, null);
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally Descending by the {@code value} column as integers
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @return a sorted list of variables
     */
    public String[] GetKeysByNumberOrderValue(String fName, String section) {
        return this.GetKeysByOrderInternal(fName, section, "DESC", 0, 0, true, true, null);
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, sorted naturally by the {@code value} column as integers
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @return a sorted list of variables
     */
    public String[] GetKeysByNumberOrderValue(String fName, String section, String order) {
        return this.GetKeysByOrderInternal(fName, section, order, 0, 0, true, true, null);
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, sorted naturally by the {@code value} column as integers
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param order sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @param limit the maximum number of results to return from this query
     * @param offset the offset to start reading from
     * @return a sorted list of variables
     */
    public String[] GetKeysByNumberOrderValue(String fName, String section, String order, String limit, String offset) {
        int ilimit;
        int ioffset;
        try {
            ilimit = Integer.parseInt(limit);
        } catch (NumberFormatException ex) {
            ilimit = 0;
        }
        try {
            ioffset = Integer.parseInt(offset);
        } catch (NumberFormatException ex) {
            ioffset = 0;
        }
        return this.GetKeysByOrderInternal(fName, section, order, ilimit, ioffset, true, true, null);
    }

    /**
     * Returns the value of the {@code variable} column for the given table, section, and value
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param value the value of the {@code value} column
     * @return the variable; {@code null} if not found
     */
    public String GetKeyByValue(String fName, String section, String value) {
        Optional<Table<?>> otbl = findTable(fName);

        if (otbl.isPresent()) {
            Table<?> tbl = otbl.get();
            String r;
            if (section == null) {
                r = dsl().select(field("variable", tbl)).from(tbl)
                .where(field("value", tbl).eq(value)).fetchAny(field("variable", tbl));
            } else {
                r = dsl().select(field("variable", tbl)).from(tbl)
                .where(field("section", tbl).eq(section),
                field("value", tbl).eq(value)).fetchAny(field("variable", tbl));
            }

            return r;
        }

        return null;
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, where the value of the {@code value} column contains the search phrase
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param search the partial value of the {@code value} column to match against
     * @return a list of variables
     */
    public String[] GetKeysByLikeValues(String fName, String section, String search) {
        Optional<Table<?>> otbl = findTable(fName);

        if (otbl.isPresent()) {
            Table<?> tbl = otbl.get();
            if (section == null) {
                return dsl().select(field("variable", tbl)).from(tbl)
                .where(field("value", tbl).like("%" + search + "%"))
                .fetch(field("variable", tbl)).toArray(new String[0]);
            } else {
                return dsl().select(field("variable", tbl)).from(tbl)
                .where(field("section", tbl).eq(section),
                field("value", tbl).like("%" + search + "%"))
                .fetch(field("variable", tbl)).toArray(new String[0]);
            }
        }
        return new String[]{};
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, where the value of the {@code variable} column contains the search phrase
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param search the partial value of the {@code variable} column to match against
     * @return a list of variables
     */
    public String[] GetKeysByLikeKeys(String fName, String section, String search) {
        Optional<Table<?>> otbl = findTable(fName);

        if (otbl.isPresent()) {
            Table<?> tbl = otbl.get();
            if (section == null) {
                return dsl().select(field("variable", tbl)).from(tbl)
                .where(field("variable", tbl).like("%" + search + "%"))
                .fetch(field("variable", tbl)).toArray(new String[0]);
            } else {
                return dsl().select(field("variable", tbl)).from(tbl)
                .where(field("section", tbl).eq(section),
                field("variable", tbl).like("%" + search + "%"))
                .fetch(field("variable", tbl)).toArray(new String[0]);
            }
        }
        return new String[]{};
    }

    /**
     * Returns a list of all values in the {@code variable} column within the default section of the table, where the value of the {@code variable} column contains the search phrase, sorted naturally Descending
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param search the partial value of the {@code variable} column to match against
     * @return a sorted list of variables
     */
    public String[] GetKeysByLikeKeysOrder(String fName, String search) {
        return this.GetKeysByOrderInternal(fName, "", "DESC", 0, 0, false, false, search);
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, where the value of the {@code variable} column contains the search phrase, sorted naturally Descending
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param search the partial value of the {@code variable} column to match against
     * @return a sorted list of variables
     */
    public String[] GetKeysByLikeKeysOrder(String fName, String section, String search) {
        return this.GetKeysByOrderInternal(fName, section, "DESC", 0, 0, false, false, search);
    }

    /**
     * Returns a list of all values in the {@code variable} column within the table and section, where the value of the {@code variable} column contains the search phrase, sorted naturally
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param search the partial value of the {@code variable} column to match against
     * @param order sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @return a sorted list of variables
     */
    public String[] GetKeysByLikeKeysOrder(String fName, String section, String search, String order) {
        return this.GetKeysByOrderInternal(fName, section, order, 0, 0, false, false, search);
    }

    /**
     * Returns a list of values in the {@code variable} column within the table and section, where the value of the {@code variable} column contains the search phrase, sorted naturally
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param search the partial value of the {@code variable} column to match against
     * @param order sort order. Valid values: {@code "ASC"} (Ascending) or {@code "DESC"} (Descending)
     * @param limit the maximum number of results to return from this query
     * @param offset the offset to start reading from
     * @return a sorted list of variables
     */
    public String[] GetKeysByLikeKeysOrder(String fName, String section, String search, String order, String limit, String offset) {
        int ilimit;
        int ioffset;
        try {
            ilimit = Integer.parseInt(limit);
        } catch (NumberFormatException ex) {
            ilimit = 0;
        }
        try {
            ioffset = Integer.parseInt(offset);
        } catch (NumberFormatException ex) {
            ioffset = 0;
        }
        return this.GetKeysByOrderInternal(fName, section, order, ilimit, ioffset, false, false, search);
    }

    /**
     * Returns the record for the given table, section, and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @return an {@link Optional} that may contain a {@link SectionVariableValueRecord} if the row exists
     */
    public Optional<SectionVariableValueRecord> OptRecord(String fName, String section, String key) {
        SectionVariableValueTable table = SectionVariableValueTable.instance("phantombot_" + fName, false);

        if (table == null) {
            return Optional.empty();
        } else {
            return this.OptRecord(table, section, key);
        }
    }

    /**
     * Returns the record for the given table, section, and key
     *
     * @param table the table to search
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @return an {@link Optional} that may contain a {@link SectionVariableValueRecord} if the row exists
     */
    public Optional<SectionVariableValueRecord> OptRecord(SectionVariableValueTable table, String section, String key) {
        Optional<SectionVariableValueRecord> res;
        if (section == null) {
            res = dsl().fetchOptional(table, table.VARIABLE.eq(key));
        } else {
            res = dsl().fetchOptional(table, table.SECTION.eq(section), table.VARIABLE.eq(key));
        }

        return res.map(r -> r.with(table));
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a string
     * <p>
     * It is not possible to distinguish between the SQL value {@code NULL} and the table/row not being found with this method
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @return an {@link Optional} that may contain the value
     */
    public Optional<String> OptString(String fName, String section, String key) {
        return Optional.ofNullable(this.GetString(fName, section, key));
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a string
     * <p>
     * A return value of {@code null} may denote that the table/row is not found, or that the actual stored value is SQL {@code NULL}.
     * Use {@link #HasKey(String, String, String)} to verify if the row exists
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @return the value
     */
    public String GetString(String fName, String section, String key) {
        return this.OptRecord(fName, section, key).map(r -> r.value()).orElse(null);
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a string
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @param fallback the fallback String; returned if the key is not present or the string is {@code null}
     * @return the value; {@code fallback} if not found or the value being {@code null}
     */
    public String GetString(String fName, String section, String key, String fallback) {
        return this.OptString(fName, section, key).orElse(fallback);
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
        SectionVariableValueTable table = SectionVariableValueTable.instance("phantombot_" + fName);
        SectionVariableValueRecord record = this.OptRecord(table, section, key)
            .orElseGet(() -> new SectionVariableValueRecord(table, section, key, value));
        record.value(value);
        record.changed(true);
        record.merge();
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
            return;
        }

        SectionVariableValueTable table = SectionVariableValueTable.instance("phantombot_" + fName, false);

        if (table != null) {
            final int famount = amount;
            final String sfamount = Integer.toString(famount);
            dsl().batched(c -> {
                try {
                    c.dsl().startTransaction().execute();
                } catch (DataAccessException ex) {
                    if (!ex.getMessage().contains("cannot start a transaction within a transaction")) {
                        throw ex;
                    }
                }

                int numUpdate;
                if (section == null) {
                    numUpdate = c.dsl().update(table)
                    .set(Collections.singletonMap(table.VALUE, table.VALUE.cast(SQLDataType.INTEGERUNSIGNED).add(famount)))
                    .where(table.VARIABLE.in(keys)).execute();
                } else {
                    numUpdate = c.dsl().update(table)
                    .set(Collections.singletonMap(table.VALUE, table.VALUE.cast(SQLDataType.INTEGERUNSIGNED).add(famount)))
                    .where(table.SECTION.eq(section), table.VARIABLE.in(keys)).execute();
                }

                if (numUpdate < keys.length) {
                    String isection = section;
                    if (isection == null) {
                        isection = "";
                    }

                    InsertValuesStep3<?, String, String, String> iq = c.dsl()
                    .insertInto(table, table.SECTION, table.VARIABLE, table.VALUE);

                    for (String key : keys) {
                        iq = iq.values(isection, key, sfamount);
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
     * @param values the new values to set the {@code value} column to
     */
    public void SetBatchString(String fName, String section, String[] keys, String[] values) {
        SectionVariableValueTable table = SectionVariableValueTable.instance("phantombot_" + fName, false);

        if (table != null) {
            dsl().batched(c -> {
                try {
                    c.dsl().startTransaction().execute();
                } catch (DataAccessException ex) {
                    if (!ex.getMessage().contains("cannot start a transaction within a transaction")) {
                        throw ex;
                    }
                }

                List<SectionVariableValueRecord> records = new ArrayList<>();
                for (int i = 0; i < Math.min(keys.length, values.length); i++) {
                    SectionVariableValueRecord record = new SectionVariableValueRecord(table, section, keys[i], values[i]);
                    record.attach(c);
                    records.add(record);
                }

                c.dsl().batchMerge(records).execute();

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
     * @return an {@link Optional} that may contain the value as a long
     */
    public Optional<Long> OptLong(String fName, String section, String key) {
        Optional<String> sval = OptString(fName, section, key);

        if (!sval.isPresent()) {
            return Optional.empty();
        }

        try {
            return Optional.of(Long.valueOf(sval.get()));
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a long
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @return the value as a long; {@code 0L} if the conversion fails
     */
    public long GetLong(String fName, String section, String key) {
        return this.OptLong(fName, section, key).orElse(0L);
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a long
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @param fallback the fallback int; returned if the key is not present
      @return the value as a long; {@code fallback} if the conversion fails
     */
    public long GetLong(String fName, String section, String key, long fallback) {
        return this.OptLong(fName, section, key).orElse(fallback);
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
     * @return an {@link Optional} that may contain the value as an integer
     */
    public Optional<Integer> OptInteger(String fName, String section, String key) {
        Optional<String> sval = OptString(fName, section, key);

        if (!sval.isPresent()) {
            return Optional.empty();
        }

        try {
            return Optional.of(Integer.valueOf(sval.get()));
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as an integer
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @return the value as an integer; {@code 0} if the conversion fails
     */
    public int GetInteger(String fName, String section, String key) {
        return this.OptInteger(fName, section, key).orElse(0);
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as an integer
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @param fallback the fallback integer; returned if the key is not present
     * @return the value as an integer; {@code fallback} if the conversion fails
     */
    public int GetInteger(String fName, String section, String key, int fallback) {
        return this.OptInteger(fName, section, key).orElse(fallback);
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
     * @return an {@link Optional} that may contain the value as a float
     */
    public Optional<Float> OptFloat(String fName, String section, String key) {
        Optional<String> sval = OptString(fName, section, key);

        if (!sval.isPresent()) {
            return Optional.empty();
        }

        try {
            return Optional.of(Float.valueOf(sval.get()));
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a float
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @return the value as a float; {@code 0.0f} if the conversion fails
     */
    public float GetFloat(String fName, String section, String key) {
        return this.OptFloat(fName, section, key).orElse(0.0f);
    }


    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a float
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @param fallback the fallback float; returned if the key is not present
     * @return the value as a float; {@code fallback} if the conversion fails
     */
    public float GetFloat(String fName, String section, String key, float fallback) {
        return this.OptFloat(fName, section, key).orElse(fallback);
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
     * @return an {@link Optional} that may contain the value as a double
     */
    public Optional<Double> OptDouble(String fName, String section, String key) {
        Optional<String> sval = OptString(fName, section, key);

        if (!sval.isPresent()) {
            return Optional.empty();
        }

        try {
            return Optional.of(Double.valueOf(sval.get()));
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a double
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @return the value as a double; {@code 0.0} if the conversion fails
     */
    public double GetDouble(String fName, String section, String key) {
        return this.OptDouble(fName, section, key).orElse(0.0);
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a double
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @param fallback the fallback double; returned if the key is not present
     * @return the value as a double; {@code fallback} if the conversion fails
     */
    public double GetDouble(String fName, String section, String key, double fallback) {
        return this.OptDouble(fName, section, key).orElse(fallback);
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
     * @return an {@link Optional} that may contain the value as a boolean; {@code true} if the value as a string is {@code "1"}, {@code "true"}, or {@code "yes"}; {@code false} otherwise
     */
    public Optional<Boolean> OptBoolean(String fName, String section, String key) {
        Optional<String> sval = OptString(fName, section, key);

        if (!sval.isPresent()) {
            return Optional.empty();
        }

        return Optional.of(sval.get().equals("1") || sval.get().equalsIgnoreCase("true") || sval.get().equalsIgnoreCase("yes"));
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
        return this.OptBoolean(fName, section, key).orElse(false);
    }

    /**
     * Returns the value of the {@code value} column for the given table, section, and key as a boolean
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column to retrieve
     * @param fallback the fallback boolean; returned if the key is not present
     * @return {@code true} if the value as a string is {@code "1"}, {@code "true"}, or {@code "yes"}; {@code fallback} otherwise
     */
    public boolean GetBoolean(String fName, String section, String key, boolean fallback) {
        return this.OptBoolean(fName, section, key).orElse(fallback);
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
     * If {@code section} is null, deletes all rows with a matching table and key, regardless of section
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
                .where(field("variable", tbl).eq(key)).execute();
            } else {
                dsl().deleteFrom(tbl)
                .where(field("section", tbl).eq(section),
                field("variable", tbl).eq(key)).execute();
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
            .where(field("section", tbl).eq(section)).execute();
        }
    }

    /**
     * Creates a new table
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     */
    public void AddFile(String fName) {
        SectionVariableValueTable.instance(fName);
    }

    /**
     * Deletes the table
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     */
    public void RemoveFile(String fName) {
        SectionVariableValueTable.instance(fName).drop();
    }

    /**
     * Renames the table
     *
     * @param fNameSource a table name for an existing table, without the {@code phantombot_} prefix
     * @param fNameDest a new table name that does not yet exist, without the {@code phantombot_} prefix
     */
    public void RenameFile(String fNameSource, String fNameDest) {
        SectionVariableValueTable.instance(fNameSource).rename(fNameDest);
    }

    /**
     * Indicates if the given table already exists
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @return {@code true} if the table exists
     */
    public boolean FileExists(String fName) {
        return SectionVariableValueTable.instance(fName, false) != null;
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
        Optional<Table<?>> otbl = findTable(fName);

        if (otbl.isPresent()) {
            Table<?> tbl = otbl.get();
            if (section == null) {
                return dsl().select(field("value", tbl)).from(tbl)
                .where(field("variable", tbl).eq(key)).execute() > 0;
            } else {
                return dsl().select(field("value", tbl)).from(tbl)
                .where(field("section", tbl).eq(section),
                field("variable", tbl).eq(key)).execute() > 0;
            }
        }

        return false;
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
     * <p>
     * A return value of {@code null} may denote that the table/row is not found, or that the actual stored value is SQL {@code NULL}.
     * Use {@link #exists(String, String)} to verify if the row exists
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
     * <p>
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
        if (amount == 0) {
            return;
        }

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
     * Increases the value of the {@code value} column as a long in the given table, section, and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column
     * @param amount the amount to increase the value of the {@code value} column by
     */
    public void incrL(String fName, String section, String key, long amount) {
        if (amount == 0L) {
            return;
        }

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
    public void incrL(String fName, String key, long amount) {
        incrL(fName, "", key, amount);
    }

    /**
     * Increases the value of the {@code value} column as an integer in the given table, section, and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column
     * @param amount the amount to increase the value of the {@code value} column by
     */
    public void incrD(String fName, String section, String key, double amount) {
        if (amount == 0.0d) {
            return;
        }

        double ival = GetDouble(fName, section, key);
        ival += amount;
        SetDouble(fName, section, key, ival);
    }

    /**
     * Increases the value of the {@code value} column as an integer in the default section of the given table and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param key the value of the {@code variable} column
     * @param amount the amount to increase the value of the {@code value} column by
     */
    public void incrD(String fName, String key, double amount) {
        incrD(fName, "", key, amount);
    }

    /**
     * Increases the value of the {@code value} column as an integer in the given table, section, and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column
     * @param amount the amount to increase the value of the {@code value} column by
     */
    public void incrF(String fName, String section, String key, float amount) {
        if (amount == 0.0f) {
            return;
        }

        float ival = GetFloat(fName, section, key);
        ival += amount;
        SetFloat(fName, section, key, ival);
    }

    /**
     * Increases the value of the {@code value} column as an integer in the default section of the given table and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param key the value of the {@code variable} column
     * @param amount the amount to increase the value of the {@code value} column by
     */
    public void incrF(String fName, String key, float amount) {
        incrF(fName, "", key, amount);
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
        incr(fName, section, key, -amount);
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
    public void decrL(String fName, String key, long amount) {
        decrL(fName, "", key, amount);
    }

    /**
     * Decreases the value of the {@code value} column as a long in the given table, section, and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column
     * @param amount the amount to decrease the value of the {@code value} column by
     */
    public void decrL(String fName, String section, String key, long amount) {
        incrL(fName, section, key, -amount);
    }

    /**
     * Decreases the value of the {@code value} column as a long in the default section of the given table and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param key the value of the {@code variable} column
     * @param amount the amount to decrease the value of the {@code value} column by
     */
    public void decrD(String fName, String key, double amount) {
        decrD(fName, "", key, amount);
    }

    /**
     * Decreases the value of the {@code value} column as a long in the given table, section, and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column
     * @param amount the amount to decrease the value of the {@code value} column by
     */
    public void decrD(String fName, String section, String key, double amount) {
        incrD(fName, section, key, -amount);
    }

    /**
     * Decreases the value of the {@code value} column as a long in the default section of the given table and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param key the value of the {@code variable} column
     * @param amount the amount to decrease the value of the {@code value} column by
     */
    public void decrF(String fName, String key, float amount) {
        decrF(fName, "", key, amount);
    }

    /**
     * Decreases the value of the {@code value} column as a long in the given table, section, and key
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param section a section name. {@code ""} (empty string) for the default section; {@code null} for all sections
     * @param key the value of the {@code variable} column
     * @param amount the amount to decrease the value of the {@code value} column by
     */
    public void decrF(String fName, String section, String key, float amount) {
        incrF(fName, section, key, (-amount));
    }

    /**
     * Returns a list of values in the {@code variable} column within the default section of the table, where the value of the {@code value} column contains the search phrase
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param search the partial value of the {@code value} column to match against
     * @return a list of variables
     */
    public String[] searchByValue(String fName, String search) {
        return GetKeysByLikeValues(fName, "", search);
    }

    /**
     * Returns a list of values in the {@code variable} column within the default section of the table, where the value of the {@code variable} column contains the search phrase
     *
     * @param fName a table name, without the {@code phantombot_} prefix
     * @param search the partial value of the {@code variable} column to match against
     * @return a list of variables
     */
    public String[] searchByKey(String fName, String search) {
        return GetKeysByLikeKeys(fName, "", search);
    }

    /**
     * Executes an SQL query
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
        List<List<String>> results = new ArrayList<>();

        try (Connection conn = Datastore2.instance().getConnection()) {
            try ( PreparedStatement statement = conn.prepareStatement(sql)) {
                int i = 1;
                for (String k : replacements) {
                    statement.setString(i++, k);
                }

                if (statement.execute()) {
                    try ( ResultSet rs = statement.getResultSet()) {
                        int numcol = rs.getMetaData().getColumnCount();

                        while (rs.next()) {
                            List<String> row = new ArrayList<>();

                            for (int b = 1; b <= numcol; b++) {
                                row.add(rs.getString(b));
                            }

                            results.add(row);
                        }
                    }
                }
            }
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return results;
    }

    /**
     * Executes an SQL query
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
     * Ensures that all tables created with {@link #AddFile(String)} have a {@code UNIQUE} index across the {@code section} and {@code variable} columns
     * <p>
     * If a constraint violation occurs while attempting to create the index, all rows violating the constraint except the first for each pair are deleted
     *
     * @deprecated Indexes are created automatically upon {@code CREATE TABLE}
     */
    @Deprecated(since = "3.9.0.0", forRemoval = true)
    public void CreateIndexes() {
        if (Datastore2.instance() instanceof SQLiteStore2) {
            try (Connection c = Datastore2.instance().getConnection()) {
                SqliteStore.CreateIndexes(c);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } else if (Datastore2.instance() instanceof H2Store2) {
            try (Connection c = Datastore2.instance().getConnection()) {
                H2Store.CreateIndexes(c);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    /**
     * Drops all {@code UNIQUE} indexes from tables created with {@link #AddFile(String)}
     *
     * @deprecated Indexes are dropped automatically upon {@code DROP TABLE}
     */
    @Deprecated(since = "3.9.0.0", forRemoval = true)
    public void DropIndexes() {
        if (Datastore2.instance() instanceof SQLiteStore2) {
            try (Connection c = Datastore2.instance().getConnection()) {
                SqliteStore.DropIndexes(c);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } else if (Datastore2.instance() instanceof H2Store2) {
            try (Connection c = Datastore2.instance().getConnection()) {
                H2Store.DropIndexes(c);
            } catch (SQLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    /**
     * Tests if the connection to the database succeeds
     *
     * @return {@code true} on success
     */
    public boolean CanConnect() {
        try {
            return Datastore2.instance().testConnection();
        } catch (SQLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return false;
    }

    /**
     * Indicates if this database type supports generating backup files
     *
     * @return {@code true} if backups are supported
     */
    public boolean canBackup() {
        return Datastore2.instance().supportsBackup();
    }

    /**
     * Backs up the database to the specified filename in the {@code dbbackup} folder
     *
     * @param filename The filename for the backup, without extension
     */
    public void backupDB(String filename) {
        Datastore2.instance().backup(filename);
    }

    /**
     * Cleanup open connections
     *
     * @deprecated Please instead call {@link Datastore2#dispose()}
     */
    @Deprecated(since = "3.9.0.0", forRemoval = true)
    public void dispose() {
    }
}
