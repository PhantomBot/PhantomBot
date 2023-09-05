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
package com.gmt2001.module;

import com.gmt2001.datastore2.record.Record2;

/**
 * A record in {@link ModuleVersionTable} denoting the version of a {@link Module} for version tracking
 *
 * @author gmt2001
 */
public final class ModuleVersionRecord extends Record2<ModuleVersionRecord, String, Long> {
    /**
     * Version of this record implementation
     */
    public static final long serialVersionUID = 1L;

    /**
     * Constructor
     */
    public ModuleVersionRecord() {
        super(ModuleVersionTable.instance(), () -> ModuleVersionTable.instance().MODULE,
            () -> ModuleVersionTable.instance().VERSION);
    }

    /**
     * Constructor
     *
     * @param name the name of the {@link Module} whose version is stored in this record
     * @param version the version
     */
    public ModuleVersionRecord(String name, Long version) {
        this();
        this.module(name);
        this.version(version);
        this.resetChangedOnNotNull();
    }

    /**
     * Constructor
     *
     * @param module the {@link Module} whose version is stored in this record
     * @param version the version
     */
    public ModuleVersionRecord(Module module, Long version) {
        this();
        this.module(module);
        this.version(version);
        this.resetChangedOnNotNull();
    }

    /**
     * Sets the name of the module whose version is stored in this record
     *
     * @param name the name of the module
     */
    public void module(String name) {
        this.value1(name);
    }

    /**
     * Sets the name of the module whose version is stored in this record
     *
     * @param module the module to retrieve the name from
     */
    public void module(Module module) {
        this.value1(module.getClass().getName());
    }

    /**
     * The name of the module whose version is stored in this record
     *
     * @return the name of the module
     */
    public String module() {
        return this.value1();
    }

    /**
     * Sets the version of the module
     *
     * @param version the version
     */
    public void version(Long version) {
        this.value2(version);
    }

    /**
     * The version of the module
     *
     * @return the version
     */
    public Long version() {
        return this.value2();
    }

    /**
     * Sets the name and version of the module whose version is stored in this record
     *
     * @param module the module to retrieve the name from
     * @param version the version
     * @return {@code this}
     */
    public org.jooq.Record2<String, Long> values(Module module, Long version) {
        this.module(module);
        return this.value2(version);
    }
}
