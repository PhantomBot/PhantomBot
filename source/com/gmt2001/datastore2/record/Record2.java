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
package com.gmt2001.datastore2.record;

import java.util.List;
import java.util.function.Supplier;

import org.jooq.Configuration;
import org.jooq.Field;
import org.jooq.Row2;
import org.jooq.Table;
import org.jooq.conf.Settings;
import org.jooq.impl.UpdatableRecordImpl;

import com.gmt2001.datastore2.Datastore2;
import com.gmt2001.datastore2.datatype.AttachableDataType;

/**
 * Abstract class which simplifies setup and usage of {@link org.jooq.Record2} on an {@link UpdateableRecordImpl}
 *
 * @param <RR> self-reference to the implementing class
 * @param <A> the Java data type of field 1, which is also the primary key
 * @param <B> the Java data type of field 2
 *
 * @author gmt2001
 */
public abstract class Record2 <RR extends Record2<RR, A, B>, A, B>
    extends UpdatableRecordImpl<RR> implements org.jooq.Record2<A, B>, AttachableRecord {
    /**
     * The {@link Supplier} for the {@code A} {@link Field}, which is also the primary key
     */
    private final Supplier<Field<A>> field1Supplier;
    /**
     * The {@link Supplier} for the {@code B} {@link Field}
     */
    private final Supplier<Field<B>> field2Supplier;

    /**
     * Constructor
     * <p>
     * When using this constructor, {@code allowUpdatingPrimaryKeys} is set to {@code false}
     *
     * @param table the {@link Table} which stores this record
     * @param field1Supplier the {@link Supplier} for the {@code A} {@link Field}, which is also the primary key
     * @param field2Supplier the {@link Supplier} for the {@code B} {@link Field}
     */
    protected Record2(Table<RR> table, Supplier<Field<A>> field1Supplier, Supplier<Field<B>> field2Supplier) {
        this(table, false, field1Supplier, field2Supplier);
    }

    /**
     * Constructor
     *
     * @param table the {@link Table} which stores this record
     * @param allowUpdatingPrimaryKeys {@code true} to allow an {@code UPDATE} to change the value of field {@code A} in a record
     * @param field1Supplier the {@link Supplier} for the {@code A} {@link Field}, which is also the primary key
     * @param field2Supplier the {@link Supplier} for the {@code B} {@link Field}
     */
    protected Record2(Table<RR> table, boolean allowUpdatingPrimaryKeys, Supplier<Field<A>> field1Supplier, Supplier<Field<B>> field2Supplier) {
        super(table);
        this.field1Supplier = field1Supplier;
        this.field2Supplier = field2Supplier;

        Configuration c = Datastore2.instance().dslContext().configuration();

        if (allowUpdatingPrimaryKeys) {
            c = c.derive(new Settings().withUpdatablePrimaryKeys(allowUpdatingPrimaryKeys));
        }

        this.attach(c);
    }

    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public org.jooq.Record1<A> key() {
        return (org.jooq.Record1) super.key();
    }

    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Row2<A, B> fieldsRow() {
        return (Row2) super.fieldsRow();
    }

    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Row2<A, B> valuesRow() {
        return (Row2) super.valuesRow();
    }

    @Override
    public Field<A> field1() {
        return field1Supplier.get();
    }

    @Override
    public Field<B> field2() {
        return field2Supplier.get();
    }

    @Override
    @SuppressWarnings({"unchecked"})
    public A value1() {
        return (A) this.get(0);
    }

    @Override
    @SuppressWarnings({"unchecked"})
    public B value2() {
        return (B) this.get(1);
    }

    @Override
    public org.jooq.Record2<A, B> value1(A value) {
        this.set(0, value);
        if (value != null && AttachableDataType.class.isAssignableFrom(value.getClass())) {
            ((AttachableDataType) value).attach(this, 0);
        }
        return this;
    }

    @Override
    public org.jooq.Record2<A, B> value2(B value) {
        this.set(1, value);
        if (value != null && AttachableDataType.class.isAssignableFrom(value.getClass())) {
            ((AttachableDataType) value).attach(this, 1);
        }
        return this;
    }

    @Override
    public org.jooq.Record2<A, B> values(A t1, B t2) {
        return this.value1(t1).value2(t2);
    }

    @Override
    public A component1() {
        return this.value1();
    }

    @Override
    public B component2() {
        return this.value2();
    }

    @Override
    public void doAttachments() {
        List<Object> values = this.intoList();

        for (int i = 0; i < values.size(); i++) {
            if (values.get(i) != null && AttachableDataType.class.isAssignableFrom(values.get(i).getClass())) {
                ((AttachableDataType) values.get(i)).attach(this, i);
            }
        }
    }
}
