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
package com.gmt2001.datastore2.datatype;

import org.jooq.UpdatableRecord;

/**
 * Allows a custom {@link DataType} to attach a reference to a {@link UpdatableRecord}
 * <p>
 * This interface is used to allow the {@link UpdatableRecord} to automatically detect and trigger the attachment so that the
 * {@link DataType} can mark itself as changed when an internal state is updated which requires storage
 * <p>
 * It is up to the implmenting class to store the {@code record} and {@code fieldIndex} variables, override methods which
 * change their internal state, and call {@link UpdatableRecord#changed(int, boolean)} when appropriate
 *
 * @author gmt2001
 */
public interface AttachableDataType {
    /**
     * Attaches this {@link AttachableDataType} to a record and field to mark when changed
     *
     * @param record the record whichis storing this map
     * @param fieldIndex the field index where this map is located in the record
     */
    public void attach(UpdatableRecord<?> record, int fieldIndex);
}
