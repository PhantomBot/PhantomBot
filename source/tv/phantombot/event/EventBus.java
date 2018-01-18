/*
 * Copyright (C) 2016-2017 phantombot.tv
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
package tv.phantombot.event;

import net.engio.mbassy.bus.config.BusConfiguration;
import net.engio.mbassy.bus.config.Feature;
import net.engio.mbassy.bus.SyncMessageBus;

import net.engio.mbassy.bus.MBassador;

import tv.phantombot.PhantomBot;

public class EventBus {
    private static final EventBus instance = new EventBus();
    private final MBassador<Event> bus = new MBassador<Event>(new BusConfiguration().addFeature(Feature.SyncPubSub.Default()).addFeature(Feature.AsynchronousHandlerInvocation.Default()).addFeature(Feature.AsynchronousMessageDispatch.Default().setNumberOfMessageDispatchers(10)).addPublicationErrorHandler(new ExceptionHandler()));

    /*
     * Method that returns this instance
     *
     * @return {EventBus}
     */
    public static EventBus instance() {
        return instance;
    }

    /*
     * Method that registers a listener with the bus.
     *
     * @param {Listener} listener
     */
    public void register(Listener listener) {
        bus.subscribe(listener);
    }

    /*
     * Method that removes a listener from the bus.
     *
     * @param {Listener} listener
     */
    public void unregister(Listener listener) {
        bus.unsubscribe(listener);
    }

    /*
     * Method that posts an event in sync.
     *
     * @param {Event} event
     */
    public void post(Event event) {
        if (PhantomBot.instance().isExiting()) {
            return;
        }

        bus.publish(event);
    }

    /*
     * Method that posts an event in async.
     *
     * @param {Event} event
     */
    public void postAsync(Event event) {
        if (PhantomBot.instance().isExiting()) {
            return;
        }

        bus.publishAsync(event);
    }
}
