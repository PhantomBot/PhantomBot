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
package com.gmt2001.modules;

/**
 * A bot module which is a core module
 * <p>
 * A CoreModule will always load before other {@link Module}
 * <p>
 * A CoreModule <b>MUST</b> also implement {@link Module}
 *
 * @author gmt2001
 */
public interface CoreModule {
    /**
     * Executes after all CoreModule have loaded, but before other {@link Module} start loading
     */
    default void afterCoreLoad() {}

    /**
     * Indicates the order in which {@link #afterCoreLoad()} should be called
     * <p>
     * Modules which return lower numbers get called first
     * <p>
     * Call order when multiple modules have the same order is not guarenteed
     *
     * @return the sort order
     */
    default int afterCoreLoadOrder() {
        return 100;
    }
}
