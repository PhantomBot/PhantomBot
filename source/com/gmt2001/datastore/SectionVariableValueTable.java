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

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.jooq.Table;
import org.jooq.TableField;
import org.jooq.UniqueKey;
import org.jooq.impl.DSL;
import org.jooq.impl.Internal;
import org.jooq.impl.SQLDataType;
import org.jooq.impl.TableImpl;

import com.gmt2001.datastore2.Datastore2;
import com.gmt2001.datastore2.meta.TableVersionRecord;

/**
 * Stores data in the {@link DataStore} format
 *
 * @author gmt2001
 */
public final class SectionVariableValueTable extends TableImpl<SectionVariableValueRecord> {

    /**
     * Table cache
     */
    private static final Map<String, SectionVariableValueTable> TABLES = new ConcurrentHashMap<>();

    /**
     * Empty table object for {@link SectionVariableValueRecord} default constructor
     */
    static final SectionVariableValueTable EMPTY = new SectionVariableValueTable();

    /**
     * Retrieves an instance for the specified table
     *
     * @param table the table
     * @return the table instance
     */
    public static SectionVariableValueTable instance(Table<?> table) {
        return instance(table.getName());
    }

    /**
     * Retrieves an instance for the specified table
     * <p>
     * If the table does not exist, it is created
     * <p>
     * A case-insensitive search for the table is performed in the database if it is not already cached
     *
     * @param tableName the table name to lookup
     * @return the table instance
     */
    public static SectionVariableValueTable instance(String tableName) {
        return instance(tableName, true);
    }

    /**
     * Retrieves an instance for the specified table
     * <p>
     * A case-insensitive search for the table is performed in the database if it is not already cached
     *
     * @param tableName the table name to lookup
     * @param create if {@code true} and the table does not exist, it is created
     * @return the table instance; {@code null} if the table does not exist and {@code create} was {@code false}
     */
    public static SectionVariableValueTable instance(String tableName, boolean create) {
        tableName = tableName.toLowerCase();
        if (!tableName.startsWith("phantombot_")) {
            tableName = "phantombot_" + tableName;
        }
        return TABLES.computeIfAbsent(tableName, lTableName -> {
            Optional<Table<?>> cTable = Datastore2.instance().tables().stream().filter(t -> t.getName().equalsIgnoreCase(lTableName)).findFirst();

            if (cTable.isPresent()) {
                return new SectionVariableValueTable(cTable.get().getName(), cTable.get().field(0).getName(), cTable.get().field(1).getName(), cTable.get().field(2).getName());
            } else if (create) {
                com.gmt2001.Console.debug.println("create " + lTableName);
                return new SectionVariableValueTable(lTableName);
            }

            return null;
        });
    }

    /**
     * Table name in the database
     */
    private final String tableName;

    /**
     * The class holding records for this table
     */
    @Override
    public Class<SectionVariableValueRecord> getRecordType() {
        return SectionVariableValueRecord.class;
    }

    /**
     * The section
     */
    public final TableField<SectionVariableValueRecord, String> SECTION;

    /**
     * The variable
     */
    public final TableField<SectionVariableValueRecord, String> VARIABLE;

    /**
     * The value
     */
    public final TableField<SectionVariableValueRecord, String> VALUE;

    /**
     * Constructor for {@link #EMPTY}
     */
    private SectionVariableValueTable() {
        this("EMPTY", "section", "variable", "value");
    }

    /**
     * Constructor
     *
     * @param tableName the exact case-sensitive name of the table
     */
    private SectionVariableValueTable(String tableName) {
        this(tableName, "section", "variable", "value");
    }

    /**
     * Constructor
     *
     * @param tableName the exact case-sensitive name of the table
     * @param section the exact case-sensitive name of the {@code section} field
     * @param variable the exact case-sensitive name of the {@code variable} field
     * @param value the exact case-sensitive name of the {@code value} field
     */
    private SectionVariableValueTable(String tableName, String section, String variable, String value) {
        super(DSL.name(tableName));
        this.tableName = tableName;
        this.SECTION = createField(DSL.name(section), SQLDataType.VARCHAR(255).nullable(true), this, "");
        this.VARIABLE = createField(DSL.name(variable), SQLDataType.VARCHAR(255).nullable(false), this, "");
        this.VALUE = createField(DSL.name(value), Datastore2.instance().longTextDataType().nullable(true), this, "");
        this.checkAndCreateTable();
    }

    /**
     * The primary key constraint
     *
     * @return the key
     */
    @Override
    public UniqueKey<SectionVariableValueRecord> getPrimaryKey() {
        return Internal.createUniqueKey(this, DSL.name(this.tableName + "_PK"), this.SECTION, this.VARIABLE);
    }

    /**
     * Renames the table
     *
     * @param newName the new table name
     * @return
     */
    public Table<SectionVariableValueRecord> rename(String newName) {
        Datastore2.instance().dslContext().alterTable(this).renameTo(newName.toLowerCase()).execute();
        Datastore2.instance().invalidateTableCache();
        TABLES.remove(this.tableName);
        return instance(newName);
    }

    /**
     * Drops the table
     */
    public void drop() {
        com.gmt2001.Console.debug.println("DROP " + this.tableName);
        Datastore2.instance().invalidateTableCache();
        TABLES.remove(this.tableName);
    }

    /**
     * Checks if the database table for {@link SectionVariableValueTable} exists, and creates it if it is missing
     */
    private void checkAndCreateTable() {
        if (this.tableName.equals("EMPTY")) {
            return;
        }

        Optional<Table<?>> table = Datastore2.instance().findTable(this.tableName);

        if (!table.isPresent()) {
            try {
                Datastore2.instance().dslContext().createTableIfNotExists(this.tableName)
                    .column(this.SECTION)
                    .column(this.VARIABLE)
                    .column(this.VALUE)
                    .primaryKey(this.SECTION, this.VARIABLE).execute();

                Datastore2.instance().invalidateTableCache();
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            try {
                TableVersionRecord record = new TableVersionRecord();
                record.values(this.tableName, SectionVariableValueRecord.serialVersionUID);
                record.merge();
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }
}