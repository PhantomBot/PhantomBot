/*
 * Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
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
package com.gmt2001.datastore2.record;

import org.jooq.RecordListener;
import org.jooq.UpdatableRecord;

import com.gmt2001.datastore2.datatype.AttachableDataType;

/**
 * Allows {@link RecordListener#loadEnd(org.jooq.RecordContext)} to detect an {@link UpdatableRecord} which needs to call
 * {@link AttachableDataType#attach(org.jooq.UpdatableRecord, int)} on some of it's values
 *
 * @author gmt2001
 */
public interface AttachableRecord {
    /**
     * Calls {@link AttachableDataType#attach(org.jooq.UpdatableRecord, int)} on each value which implements {@link AttachableDataType}
     */
    public void doAttachments();
}
