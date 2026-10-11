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
import com.gmt2001.datastore2.record.Record8;

/**
 * Stores the passkeys that panel users have registered for signing in to the panel
 *
 * @author mcawful
 */
public final class PanelPasskeyTable extends TableImpl<PanelPasskeyTable.PasskeyRecord> {

    /**
     * Instance
     */
    private static final PanelPasskeyTable INSTANCE = new PanelPasskeyTable();

    /**
     * Table name in the database
     */
    private static final String TABLENAME = Datastore2.PREFIX + "PanelPasskey";

    /**
     * Provides an instance of {@link PanelPasskeyTable}
     *
     * @return an instance of {@link PanelPasskeyTable}
     */
    public static PanelPasskeyTable instance() {
        return INSTANCE;
    }

    static {
        checkAndCreateTable();
    }

    /**
     * The class holding records for this table
     */
    @Override
    public Class<PasskeyRecord> getRecordType() {
        return PasskeyRecord.class;
    }

    /**
     * SHA-256 of the credential ID as a hex-encoded string. Credential IDs are case-sensitive
     * and can be too long for a primary key
     */
    public final TableField<PasskeyRecord, String> IDHASH = createField(DSL.name("idHash"), SQLDataType.VARCHAR(64).nullable(false), this, "");
    /**
     * Credential ID, base64url encoded
     */
    public final TableField<PasskeyRecord, String> CREDENTIALID = createField(DSL.name("credentialId"), SQLDataType.VARCHAR(1400).nullable(false), this, "");
    /**
     * Username of the panel user who owns the passkey
     */
    public final TableField<PasskeyRecord, String> USERNAME = createField(DSL.name("username"), SQLDataType.VARCHAR(255).nullable(false), this, "");
    /**
     * Public key in SubjectPublicKeyInfo form, base64url encoded
     */
    public final TableField<PasskeyRecord, String> PUBLICKEY = createField(DSL.name("publicKey"), SQLDataType.VARCHAR(2000).nullable(false), this, "");
    /**
     * Origin (scheme, host and port) the passkey was registered on
     */
    public final TableField<PasskeyRecord, String> ORIGIN = createField(DSL.name("origin"), SQLDataType.VARCHAR(255).nullable(false), this, "");
    /**
     * Signature counter last reported by the authenticator
     */
    public final TableField<PasskeyRecord, Long> SIGNCOUNT = createField(DSL.name("signCount"), SQLDataType.BIGINT.nullable(false).defaultValue(0L), this, "");
    /**
     * Name the user gave the passkey
     */
    public final TableField<PasskeyRecord, String> NAME = createField(DSL.name("name"), SQLDataType.VARCHAR(255).nullable(false), this, "");
    /**
     * Timestamp of when the passkey was registered
     */
    public final TableField<PasskeyRecord, Long> CREATIONDATE = createField(DSL.name("creationDate"), SQLDataType.BIGINT.nullable(false), this, "");

    /**
     * Constructor
     */
    private PanelPasskeyTable() {
        super(DSL.name(TABLENAME));
    }

    /**
     * The primary key constraint
     *
     * @return the key
     */
    @Override
    public UniqueKey<PasskeyRecord> getPrimaryKey() {
        return Internal.createUniqueKey(this, DSL.name(TABLENAME + "_PK"), this.IDHASH);
    }

    /**
     * Checks if the database table for {@link PanelPasskeyTable} exists, and creates it if it is missing
     */
    private static void checkAndCreateTable() {
        Optional<Table<?>> table = Datastore2.instance().findTable(TABLENAME);

        TableVersionRecord tvrecord = Datastore2.instance().dslContext().fetchOne(TableVersion.instance(), TableVersion.instance().TABLE.eq(TABLENAME));

        long version = tvrecord == null ? 0L : tvrecord.version();

        if (!table.isPresent() || version < PasskeyRecord.serialVersionUID) {
            try {
                Datastore2.instance().dslContext().createTableIfNotExists(TABLENAME)
                    .column(PanelPasskeyTable.instance().IDHASH)
                    .column(PanelPasskeyTable.instance().CREDENTIALID)
                    .column(PanelPasskeyTable.instance().USERNAME)
                    .column(PanelPasskeyTable.instance().PUBLICKEY)
                    .column(PanelPasskeyTable.instance().ORIGIN)
                    .column(PanelPasskeyTable.instance().SIGNCOUNT)
                    .column(PanelPasskeyTable.instance().NAME)
                    .column(PanelPasskeyTable.instance().CREATIONDATE)
                    .primaryKey(PanelPasskeyTable.instance().IDHASH).execute();

                Datastore2.instance().invalidateTableCache();
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            try {
                TableVersionRecord record = new TableVersionRecord();
                record.values(PanelPasskeyTable.instance(), PasskeyRecord.serialVersionUID);
                record.merge();
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    /**
     * A passkey registered by a panel user
     *
     * @author mcawful
     */
    public static final class PasskeyRecord extends Record8<PasskeyRecord, String, String, String, String, String, Long, String, Long> {
        /**
         * Version of this record implementation
         */
        public static final long serialVersionUID = 1L;

        /**
         * Constructor
         */
        public PasskeyRecord() {
            super(PanelPasskeyTable.instance(), () -> PanelPasskeyTable.instance().IDHASH,
                () -> PanelPasskeyTable.instance().CREDENTIALID, () -> PanelPasskeyTable.instance().USERNAME,
                () -> PanelPasskeyTable.instance().PUBLICKEY, () -> PanelPasskeyTable.instance().ORIGIN,
                () -> PanelPasskeyTable.instance().SIGNCOUNT, () -> PanelPasskeyTable.instance().NAME,
                () -> PanelPasskeyTable.instance().CREATIONDATE);
        }

        /**
         * @return SHA-256 of the credential ID as a hex-encoded string
         */
        public String idHash() {
            return this.value1();
        }

        /**
         * @return the credential ID, base64url encoded
         */
        public String credentialId() {
            return this.value2();
        }

        /**
         * @return the username of the panel user who owns the passkey
         */
        public String username() {
            return this.value3();
        }

        /**
         * @return the public key in SubjectPublicKeyInfo form, base64url encoded
         */
        public String publicKey() {
            return this.value4();
        }

        /**
         * @return the origin the passkey was registered on
         */
        public String origin() {
            return this.value5();
        }

        /**
         * @return the signature counter last reported by the authenticator
         */
        public Long signCount() {
            return this.value6();
        }

        /**
         * @return the name the user gave the passkey
         */
        public String name() {
            return this.value7();
        }

        /**
         * @return the timestamp of when the passkey was registered
         */
        public Long creationDate() {
            return this.value8();
        }
    }
}
