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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiFunction;
import java.util.function.Function;

import org.jooq.UpdatableRecord;
import org.json.JSONArray;
import org.json.JSONObject;

import tv.phantombot.panel.PanelUser.PanelUserHandler.Permission;

/**
 * Class to allow a {@link HashMap} of {@code <String, Permission>} to be used in {@link PermissionConverter}
 * <p>
 * Also provides conversion methods
 *
 * @author gmt2001
 */
public final class PermissionMap extends HashMap<String, Permission> {
    /**
     * Special permissions which are only included in {@link #toJSON(boolean, boolean)} if the {@code isSave} parameter is set to {@code true}
     */
    public static final List<String> SPECIALPERMISSIONS = List.of("canRestartBot", "canManageUsers");
    /**
     * The linked record
     */
    private UpdatableRecord<?> record;
    /**
     * The field number
     */
    private int fieldNumber = -1;

    /**
     * Converts a plain {@link Map} of {@code <String, Permission>} into a {@link PermissionMap}
     *
     * @param map a {@link Map} of {@code <String, Permission>}
     * @return a {@link PermissionMap}
     */
    public static PermissionMap fromMap(Map<String, Permission> map) {
        PermissionMap permissionMap = new PermissionMap();
        permissionMap.putAll(map);
        return permissionMap;
    }

    /**
     * Converts a stringified {@link JSONArray} created by {@link #toJSON(boolean, boolean)} into a {@link PermissionMap}
     *
     * @param json the stringified {@link JSONArray}
     * @return a {@link PermissionMap}
     */
    public static PermissionMap fromJSON(String json) {
        return fromJSON(new JSONArray(json));
    }

    /**
     * Converts a {@link JSONArray} created by {@link #toJSON(boolean, boolean)} into a {@link PermissionMap}
     *
     * @param permissionsJSON the {@link JSONArray}
     * @return a {@link PermissionMap}
     */
    public static PermissionMap fromJSON(JSONArray permissionsJSON) {
        PermissionMap permissions = new PermissionMap();

        for (int i = 0; i < permissionsJSON.length(); i++) {
            JSONObject permissionObj = permissionsJSON.getJSONObject(i);
            String key = permissionObj.getString("section");
            Permission permission = Permission.getByValue(permissionObj.getInt("permission"));
            permissions.put(key, permission);
        }

        return permissions;
    }

    /**
     * Converts the permissions data to a {@link JSONArray}
     *
     * @param displayName {@code true} to encode the display name of the value; {@code false} to encode the numeric value
     * @param isSave {@code true} to include {@code canRestartBot}, {@code canManageUsers}, and other special permissions
     * @return the permissions data as a {@link JSONArray}
     */
    public JSONArray toJSON(boolean displayName, boolean isSave) {
        JSONArray permissionsJSON = new JSONArray();
        int counter = 0;

        for (Map.Entry<String, Permission> entry : this.entrySet()) {
            if (!isSave) {
                boolean found = false;
                for (String specialPermission : SPECIALPERMISSIONS) {
                    if (entry.getKey().equalsIgnoreCase(specialPermission)) {
                        found = true;
                        break;
                    }
                }

                if (found) {
                    continue;
                }
            }

            JSONObject permissionJSON = new JSONObject();
            permissionJSON.put("section", entry.getKey());
            permissionJSON.put("permission", (displayName ? entry.getValue().getDisplayName() : entry.getValue().getValue()));
            permissionsJSON.put(counter++, permissionJSON);
        }

        return permissionsJSON;
    }

    /**
     * Attaches this {@link PermissionMap} to a record and field to mark when changed
     *
     * @param record the record whichis storing this map
     * @param fieldNumber the 1-based field number where this map is located in the record
     */
    public void attach(UpdatableRecord<?> record, int fieldNumber) {
        this.record = record;
        this.fieldNumber = fieldNumber - 1;
    }

    @Override
    public void clear() {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        super.clear();
    }

    @Override
    public Permission put(String key, Permission value) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.put(key, value);
    }

    @Override
    public void putAll(Map<? extends String, ? extends Permission> m) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        super.putAll(m);
    }

    @Override
    public Permission putIfAbsent(String key, Permission value) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.putIfAbsent(key, value);
    }

    @Override
    public Permission remove(Object key) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.remove(key);
    }

    @Override
    public Permission replace(String key, Permission value) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.replace(key, value);
    }

    @Override
    public Permission compute(String key,
            BiFunction<? super String, ? super Permission, ? extends Permission> remappingFunction) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.compute(key, remappingFunction);
    }

    @Override
    public Permission computeIfAbsent(String key, Function<? super String, ? extends Permission> mappingFunction) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.computeIfAbsent(key, mappingFunction);
    }

    @Override
    public Permission merge(String key, Permission value,
            BiFunction<? super Permission, ? super Permission, ? extends Permission> remappingFunction) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.merge(key, value, remappingFunction);
    }

    @Override
    public boolean remove(Object key, Object value) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.remove(key, value);
    }

    @Override
    public boolean replace(String key, Permission oldValue, Permission newValue) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.replace(key, oldValue, newValue);
    }

    @Override
    public void replaceAll(BiFunction<? super String, ? super Permission, ? extends Permission> function) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        super.replaceAll(function);
    }
}
