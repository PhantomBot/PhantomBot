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
package tv.phantombot.panel.PanelUser;

import java.util.Optional;

import org.jooq.Table;
import org.jooq.TableField;
import org.jooq.UniqueKey;
import org.jooq.impl.DSL;
import org.jooq.impl.Internal;
import org.jooq.impl.SQLDataType;
import org.jooq.impl.TableImpl;
import org.json.JSONObject;

import com.gmt2001.datastore.DataStore;
import com.gmt2001.datastore2.Datastore2;
import com.gmt2001.datastore2.meta.TableVersion;
import com.gmt2001.datastore2.meta.TableVersionRecord;

import tv.phantombot.PhantomBot;

/**
 * Stores panel login information
 *
 * @author gmt2001
 */
public final class PanelUserTable extends TableImpl<PanelUser> {
    /**
     * Instance
     */
    private static final PanelUserTable INSTANCE = new PanelUserTable();

    /**
     * Table name in the database
     */
    private static final String TABLENAME = Datastore2.PREFIX + "PanelUser";

    /**
     * Provides an instance of {@link PanelUserTable}
     *
     * @return an instance of {@link PanelUserTable}
     */
    public static PanelUserTable instance() {
        return INSTANCE;
    }

    static {
        checkAndCreateTable();
        upgrade();
    }

    /**
     * The class holding records for this table
     */
    @Override
    public Class<PanelUser> getRecordType() {
        return PanelUser.class;
    }

    /**
     * Username
     */
    public final TableField<PanelUser, String> USERNAME = createField(DSL.name("username"), SQLDataType.VARCHAR(255).nullable(false), this, "");
    /**
     * Hashed Password
     */
    public final TableField<PanelUser, String> PASSWORD = createField(DSL.name("password"), SQLDataType.VARCHAR(64).nullable(false), this, "");
    /**
     * WS Token
     */
    public final TableField<PanelUser, String> TOKEN = createField(DSL.name("token"), SQLDataType.VARCHAR(30).nullable(true), this, "");
    /**
     * Permissions in JSON format
     */
    public final TableField<PanelUser, PermissionMap> PERMISSIONS = createField(DSL.name("permissions"), PermissionConverter.PERMISSIONMAP.nullable(false), this, "");
    /**
     * If the account is enabled
     */
    public final TableField<PanelUser, Boolean> ENABLED = createField(DSL.name("enabled"), SQLDataType.BOOLEAN.nullable(false).defaultValue(false), this, "");
    /**
     * Account creation date
     */
    public final TableField<PanelUser, Long> CREATIONDATE = createField(DSL.name("creationDate"), SQLDataType.BIGINT.nullable(false), this, "");
    /**
     * Timestamp of last login
     */
    public final TableField<PanelUser, Long> LASTLOGIN = createField(DSL.name("lastLogin"), SQLDataType.BIGINT.nullable(false).defaultValue(-1L), this, "");
    /**
     * If {@code false}, {@link #PASSWORD} is only a temporary password and must be changed at next login
     */
    public final TableField<PanelUser, Boolean> HASSETPASSWORD = createField(DSL.name("hasSetPassword"), SQLDataType.BOOLEAN.nullable(false).defaultValue(false), this, "");

    /**
     * Constructor
     */
    private PanelUserTable() {
        super(DSL.name(TABLENAME));
    }

    /**
     * The primary key constraint
     *
     * @return the key
     */
    @Override
    public UniqueKey<PanelUser> getPrimaryKey() {
        return Internal.createUniqueKey(this, DSL.name(TABLENAME + "_PK"), this.USERNAME);
    }

    /**
     * Checks if the database table for {@link PanelUser} exists, and creates it if it is missing
     */
    private static void checkAndCreateTable() {
        Optional<Table<?>> table = Datastore2.instance().findTable(TABLENAME);

        TableVersionRecord tvrecord = Datastore2.instance().dslContext().fetchOne(TableVersion.instance(), TableVersion.instance().TABLE.eq(TABLENAME));

        long version = tvrecord == null ? 0L : tvrecord.version();

        if (!table.isPresent() || version < PanelUser.serialVersionUID) {
            try {
                Datastore2.instance().dslContext().createTableIfNotExists(TABLENAME)
                    .column(PanelUserTable.instance().USERNAME)
                    .column(PanelUserTable.instance().PASSWORD)
                    .column(PanelUserTable.instance().TOKEN)
                    .column(PanelUserTable.instance().PERMISSIONS)
                    .column(PanelUserTable.instance().ENABLED)
                    .column(PanelUserTable.instance().CREATIONDATE)
                    .column(PanelUserTable.instance().LASTLOGIN)
                    .column(PanelUserTable.instance().HASSETPASSWORD)
                    .primaryKey(PanelUserTable.instance().USERNAME)
                    .unique(PanelUserTable.instance().TOKEN).execute();

                Datastore2.instance().invalidateTableCache();
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }

            try {
                TableVersionRecord record = new TableVersionRecord();
                record.values(PanelUserTable.instance(), PanelUser.serialVersionUID);
                record.merge();
            } catch (Exception ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    /**
     * Upgrades the user database from DataStore to POJO
     */
    private static void upgrade() {
        if (DataStore.instance().FileExists("panelUsers") && !DataStore.instance().GetBoolean("updates", "", "installedv3.10.0.0-PanelUser")) {
            DataStore datastore = PhantomBot.instance().getDataStore();
            String[] keys = datastore.GetKeyList("panelUsers", "");
            for (String key : keys) {
                try {
                    new PanelUser(key, new JSONObject(datastore.GetString("panelUsers", "", key))).doinsert();
                } catch (Exception ex) {
                    com.gmt2001.Console.err.println("Failed to convert user " + key);
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            }
            DataStore.instance().RemoveFile("panelUsers");
            DataStore.instance().SetBoolean("updates", "", "installedv3.10.0.0-PanelUser", true);
        }
    }
}