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
package tv.phantombot.panel.PanelUser;

import org.jooq.Converter;
import org.jooq.DataType;

import com.gmt2001.datastore2.Datastore2;

/**
 * Provides a {@link Converter} and {@link DataType} for storing the permissions map of {@link PanelUser} in the database
 *
 * @author gmt2001
 */
public final class PermissionConverter implements Converter<String, PermissionMap> {
    /**
     * A data type storing a {@link PermissionMap}
     */
    public static final DataType<PermissionMap> PERMISSIONMAP = Datastore2.instance().longTextDataType().asConvertedDataType(new PermissionConverter());

    /**
     * Constructor
     */
    private PermissionConverter(){
    }

    @Override
    public PermissionMap from(String databaseObject) {
        return PermissionMap.fromJSON(databaseObject);
    }

    @Override
    public String to(PermissionMap userObject) {
        return userObject.toJSON(false, true).toString();
    }

    @Override
    public Class<String> fromType() {
        return String.class;
    }

    @Override
    public Class<PermissionMap> toType() {
        return PermissionMap.class;
    }
}
