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
package com.gmt2001.datastore2;

import java.util.HashMap;
import java.util.Map;
import java.util.function.BiFunction;
import java.util.function.Function;

import org.jooq.Converter;
import org.jooq.UpdatableRecord;

/**
 * Class to allow a {@link HashMap} to be used in a custom {@link Converter} on an {@link UpdatableRecord}
 *
 * @author gmt2001
 */
public abstract class AbstractDatabaseMap<K,V> extends HashMap<K, V> {
    /**
     * The linked record
     */
    private UpdatableRecord<?> record;
    /**
     * The field number
     */
    private int fieldNumber = -1;

    /**
     * Attaches this {@link AbstractDatabaseMap} to a record and field to mark when changed
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
    public V put(K key, V value) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.put(key, value);
    }

    @Override
    public void putAll(Map<? extends K, ? extends V> m) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        super.putAll(m);
    }

    @Override
    public V putIfAbsent(K key, V value) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.putIfAbsent(key, value);
    }

    @Override
    public V remove(Object key) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.remove(key);
    }

    @Override
    public V replace(K key, V value) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.replace(key, value);
    }

    @Override
    public V compute(K key,
            BiFunction<? super K, ? super V, ? extends V> remappingFunction) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.compute(key, remappingFunction);
    }

    @Override
    public V computeIfAbsent(K key, Function<? super K, ? extends V> mappingFunction) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.computeIfAbsent(key, mappingFunction);
    }

    @Override
    public V merge(K key, V value,
            BiFunction<? super V, ? super V, ? extends V> remappingFunction) {
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
    public boolean replace(K key, V oldValue, V newValue) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        return super.replace(key, oldValue, newValue);
    }

    @Override
    public void replaceAll(BiFunction<? super K, ? super V, ? extends V> function) {
        if (fieldNumber >= 0) {
            record.changed(fieldNumber, true);
        }

        super.replaceAll(function);
    }
}
