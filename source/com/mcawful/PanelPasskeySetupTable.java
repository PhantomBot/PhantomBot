/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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
package com.mcawful;

import java.util.Optional;

import org.jooq.Table;
import org.jooq.TableField;
import org.jooq.UniqueKey;
import org.jooq.impl.DSL;
import org.jooq.impl.Internal;
import org.jooq.impl.SQLDataType;
import org.jooq.impl.TableImpl;

import com.gmt2001.datastore2.Datastore2;
import com.gmt2001.datastore2.meta.TableVersion;
import com.gmt2001.datastore2.meta.TableVersionRecord;
import com.gmt2001.datastore2.record.Record3;

/**
 * Stores the one-time links that let a panel user add a passkey without signing in
 *
 * @author mcawful
 */
public final class PanelPasskeySetupTable extends TableImpl<PanelPasskeySetupTable.SetupLinkRecord> {

    /**
     * Instance
     */
    private static final PanelPasskeySetupTable INSTANCE = new PanelPasskeySetupTable();

    /**
     * Table name in the database
     */
    private static final String TABLENAME = Datastore2.PREFIX + "PanelPasskeySetup";

    /**
     * Provides an instance of {@link PanelPasskeySetupTable}
     *
     * @return an instance of {@link PanelPasskeySetupTable}
     */
    public static PanelPasskeySetupTable instance() {
        return INSTANCE;
    }

    static {
        checkAndCreateTable();
    }

    /**
     * The class holding records for this table
     */
    @Override
    public Class<SetupLinkRecord> getRecordType() {
        return SetupLinkRecord.class;
    }

    /**
     * SHA-256 of the token in the link as a hex-encoded string, so the database never holds a working link
     */
    public final TableField<SetupLinkRecord, String> TOKENHASH = createField(DSL.name("tokenHash"), SQLDataType.VARCHAR(64).nullable(false), this, "");
    /**
     * Username of the panel user the link adds a passkey for
     */
    public final TableField<SetupLinkRecord, String> USERNAME = createField(DSL.name("username"), SQLDataType.VARCHAR(255).nullable(false), this, "");
    /**
     * Timestamp of when the link stops working
     */
    public final TableField<SetupLinkRecord, Long> EXPIRES = createField(DSL.name("expires"), SQLDataType.BIGINT.nullable(false), this, "");

    /**
     * Constructor
     */
    private PanelPasskeySetupTable() {
        super(DSL.name(TABLENAME));
    }

    /**
     * The primary key constraint
     *
     * @return the key
     */
    @Override
    public UniqueKey<SetupLinkRecord> getPrimaryKey() {
        return Internal.createUniqueKey(this, DSL.name(TABLENAME + "_PK"), this.TOKENHASH);
    }

    /**
     * Checks if the database table for {@link PanelPasskeySetupTable} exists, and creates it if it is missing
     */
    private static void checkAndCreateTable() {
        Optional<Table<?>> table = Datastore2.instance().findTable(TABLENAME);

        TableVersionRecord tvrecord = Datastore2.instance().dslContext().fetchOne(TableVersion.instance(), TableVersion.instance().TABLE.eq(TABLENAME));

        long version = tvrecord == null ? 0L : tvrecord.version();

        if (!table.isPresent() || version < SetupLinkRecord.serialVersionUID) {
            try {
                Datastore2.instance().dslContext().createTableIfNotExists(TABLENAME)
                    .column(PanelPasskeySetupTable.instance().TOKENHASH)
                    .column(PanelPasskeySetupTable.instance().USERNAME)
                    .column(PanelPasskeySetupTable.instance().EXPIRES)
                    .primaryKey(PanelPasskeySetupTable.instance().TOKENHASH).execute();

                Datastore2.instance().invalidateTableCache();
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            try {
                TableVersionRecord record = new TableVersionRecord();
                record.values(PanelPasskeySetupTable.instance(), SetupLinkRecord.serialVersionUID);
                record.merge();
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    /**
     * A one-time passkey setup link
     *
     * @author mcawful
     */
    public static final class SetupLinkRecord extends Record3<SetupLinkRecord, String, String, Long> {
        /**
         * Version of this record implementation
         */
        public static final long serialVersionUID = 1L;

        /**
         * Constructor
         */
        public SetupLinkRecord() {
            super(PanelPasskeySetupTable.instance(), () -> PanelPasskeySetupTable.instance().TOKENHASH,
                () -> PanelPasskeySetupTable.instance().USERNAME, () -> PanelPasskeySetupTable.instance().EXPIRES);
        }

        /**
         * @return the username of the panel user the link adds a passkey for
         */
        public String username() {
            return this.value2();
        }

        /**
         * @return the timestamp of when the link stops working
         */
        public Long expires() {
            return this.value3();
        }
    }
}
