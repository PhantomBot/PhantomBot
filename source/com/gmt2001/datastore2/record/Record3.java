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
package com.gmt2001.datastore2.record;

import java.util.List;
import java.util.function.Supplier;

import org.jooq.Configuration;
import org.jooq.Field;
import org.jooq.Row3;
import org.jooq.Table;
import org.jooq.conf.Settings;
import org.jooq.impl.UpdatableRecordImpl;

import com.gmt2001.datastore2.Datastore2;
import com.gmt2001.datastore2.datatype.AttachableDataType;

/**
 * Abstract class which simplifies setup and usage of {@link org.jooq.Record3} on an {@link UpdateableRecordImpl}
 *
 * @param <RR> self-reference to the implementing class
 * @param <A> the Java data type of field 1, which is also the primary key
 * @param <B> the Java data type of field 2
 * @param <C> the Java data type of field 3
 *
 * @author gmt2001
 */
public abstract class Record3 <RR extends Record3<RR, A, B, C>, A, B, C>
    extends UpdatableRecordImpl<RR> implements org.jooq.Record3<A, B, C>, AttachableRecord {
    /**
     * The {@link Supplier} for the {@code A} {@link Field}, which is also the primary key
     */
    private final Supplier<Field<A>> field1Supplier;
    /**
     * The {@link Supplier} for the {@code B} {@link Field}
     */
    private final Supplier<Field<B>> field2Supplier;
    /**
     * The {@link Supplier} for the {@code C} {@link Field}
     */
    private final Supplier<Field<C>> field3Supplier;

    /**
     * Constructor
     * <p>
     * When using this constructor, {@code allowUpdatingPrimaryKeys} is set to {@code false}
     *
     * @param table the {@link Table} which stores this record
     * @param field1Supplier the {@link Supplier} for the {@code A} {@link Field}, which is also the primary key
     * @param field2Supplier the {@link Supplier} for the {@code B} {@link Field}
     * @param field3Supplier the {@link Supplier} for the {@code C} {@link Field}
     */
    protected Record3(Table<RR> table, Supplier<Field<A>> field1Supplier, Supplier<Field<B>> field2Supplier,
        Supplier<Field<C>> field3Supplier) {
        this(table, false, field1Supplier, field2Supplier, field3Supplier);
    }

    /**
     * Constructor
     *
     * @param table the {@link Table} which stores this record
     * @param allowUpdatingPrimaryKeys {@code true} to allow an {@code UPDATE} to change the value of field {@code A} in a record
     * @param field1Supplier the {@link Supplier} for the {@code A} {@link Field}, which is also the primary key
     * @param field2Supplier the {@link Supplier} for the {@code B} {@link Field}
     * @param field3Supplier the {@link Supplier} for the {@code C} {@link Field}
     */
    protected Record3(Table<RR> table, boolean allowUpdatingPrimaryKeys, Supplier<Field<A>> field1Supplier, Supplier<Field<B>> field2Supplier,
        Supplier<Field<C>> field3Supplier) {
        super(table);
        this.field1Supplier = field1Supplier;
        this.field2Supplier = field2Supplier;
        this.field3Supplier = field3Supplier;

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
    public Row3<A, B, C> fieldsRow() {
        return (Row3) super.fieldsRow();
    }

    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Row3<A, B, C> valuesRow() {
        return (Row3) super.valuesRow();
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
    public Field<C> field3() {
        return field3Supplier.get();
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
    @SuppressWarnings({"unchecked"})
    public C value3() {
        return (C) this.get(2);
    }

    @Override
    public org.jooq.Record3<A, B, C> value1(A value) {
        this.set(0, value);
        if (value != null && AttachableDataType.class.isAssignableFrom(value.getClass())) {
            ((AttachableDataType) value).attach(this, 0);
        }
        return this;
    }

    @Override
    public org.jooq.Record3<A, B, C> value2(B value) {
        this.set(1, value);
        if (value != null && AttachableDataType.class.isAssignableFrom(value.getClass())) {
            ((AttachableDataType) value).attach(this, 1);
        }
        return this;
    }

    @Override
    public org.jooq.Record3<A, B, C> value3(C value) {
        this.set(2, value);
        if (value != null && AttachableDataType.class.isAssignableFrom(value.getClass())) {
            ((AttachableDataType) value).attach(this, 2);
        }
        return this;
    }

    @Override
    public org.jooq.Record3<A, B, C> values(A t1, B t2, C t3) {
        return this.value1(t1).value2(t2).value3(t3);
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
    public C component3() {
        return this.value3();
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
