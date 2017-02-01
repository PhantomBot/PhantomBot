/*
 * Copyright (C) 2017 phantombot.tv
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
package me.mast3rplan.phantombot.event;

import com.google.common.collect.Sets;
import java.util.Set;
import java.util.concurrent.Executors;
import me.mast3rplan.phantombot.PhantomBot;

public class EventBus {

    private static final EventBus instance = new EventBus();

    public static EventBus instance() {
        return instance;
    }

    private final com.google.common.eventbus.AsyncEventBus aeventBus = new com.google.common.eventbus.AsyncEventBus(Executors.newFixedThreadPool(16), new ExceptionHandler());
    private final com.google.common.eventbus.EventBus eventBus = new com.google.common.eventbus.EventBus(new ExceptionHandler());
    private final com.google.common.eventbus.EventBus peventBus = new com.google.common.eventbus.EventBus(new ExceptionHandler());

    private final Set<Listener> listeners = Sets.newHashSet();

    public void register(Listener listener) {
        listeners.add(listener);
        eventBus.register(listener);
        aeventBus.register(listener);
        peventBus.register(listener);
    }

    public void unregister(Listener listener) {
        listeners.remove(listener);
        eventBus.unregister(listener);
        aeventBus.unregister(listener);
        peventBus.unregister(listener);
    }

    public void post(Event event) {
        if (PhantomBot.instance() == null || PhantomBot.instance().isExiting()) {
            return;
        }

        eventBus.post(event);
    }

    public void postAsync(Event event) {
        if (PhantomBot.instance() == null || PhantomBot.instance().isExiting()) {
            return;
        }

        aeventBus.post(event);
    }

    public void postPVMSG(Event event) {
        if (PhantomBot.instance() == null || PhantomBot.instance().isExiting()) {
            return;
        }

        peventBus.post(event);
    }
}
