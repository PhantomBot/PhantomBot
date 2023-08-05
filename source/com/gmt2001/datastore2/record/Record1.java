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

import java.util.function.Supplier;

import org.jooq.Field;
import org.jooq.Row1;
import org.jooq.Table;
import org.jooq.conf.Settings;
import org.jooq.impl.UpdatableRecordImpl;

import com.gmt2001.datastore2.Datastore2;

/**
 * Abstract class which simplifies setup and usage of {@link org.jooq.Record1} on an {@link UpdateableRecordImpl}
 *
 * @param <RR> self-reference to the implementing class
 * @param <A> the Java data type of field 1, which is also the primary key
 *
 * @author gmt2001
 */
public abstract class Record1 <RR extends Record1<RR, A>, A>
    extends UpdatableRecordImpl<RR> implements org.jooq.Record1<A> {
    /**
     * The {@link Supplier} for the {@code A} {@link Field}, which is also the primary key
     */
    private final Supplier<Field<A>> field1Supplier;

    /**
     * Constructor
     * <p>
     * Since there is only 1 field, this record type always allows updating priamry keys
     *
     * @param table the {@link Table} which stores this record
     * @param field1Supplier the {@link Supplier} for the {@code A} {@link Field}, which is also the primary key
     */
    protected Record1(Table<RR> table, Supplier<Field<A>> field1Supplier) {
        super(table);
        this.field1Supplier = field1Supplier;

        this.attach(Datastore2.instance().dslContext().configuration().derive(new Settings().withUpdatablePrimaryKeys(true)));
    }

    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public org.jooq.Record1<A> key() {
        return (org.jooq.Record1) super.key();
    }

    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Row1<A> fieldsRow() {
        return (Row1) super.fieldsRow();
    }

    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Row1<A> valuesRow() {
        return (Row1) super.valuesRow();
    }

    @Override
    public Field<A> field1() {
        return field1Supplier.get();
    }

    @Override
    @SuppressWarnings({"unchecked"})
    public A value1() {
        return (A) this.get(0);
    }

    @Override
    public org.jooq.Record1<A> value1(A value) {
        this.set(0, value);
        return this;
    }

    @Override
    public org.jooq.Record1<A> values(A t1) {
        return this.value1(t1);
    }

    @Override
    public A component1() {
        return this.value1();
    }
}
