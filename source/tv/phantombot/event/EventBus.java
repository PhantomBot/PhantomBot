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
package tv.phantombot.event;

import net.engio.mbassy.bus.MBassador;
import net.engio.mbassy.bus.config.BusConfiguration;
import net.engio.mbassy.bus.config.Feature;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.jvm.JVMEvent;

/**
 * Sends events to downstream subscribers
 * <br /><br />
 * To subscribe to an event, a Java class must be non-static, implement {@link Listener}, have a public method for each desired event
 * with the signature {@code public void methodName(EventClass event)} where {@code EventClass} is the class of the event to be
 * captured, have the {@code @net.engio.mbassy.listener.Handler} annotation applied to each event handler method, and must call
 * {@link #register(Listener)} for each instance of the class that should receive events
 * <br /><br />
 * The event bus will deliver each event to all subscribers of the matching event class, as well as subscribers of any event class in
 * the parent chain going back up to the {@link Event} base class. For example: subscribing to {@link JVMEvent} will receive all
 * events in the {@code tv.phantombot.event.jvm} package, as it is the base event for the package
 */
public final class EventBus {
    private static final EventBus instance = new EventBus();
    private static final MBassador<Event> bus = new MBassador<>(new BusConfiguration().addFeature(Feature.SyncPubSub.Default())
            .addFeature(Feature.AsynchronousHandlerInvocation.Default()).addFeature(Feature.AsynchronousMessageDispatch.Default()
            .setNumberOfMessageDispatchers(10)).addPublicationErrorHandler(new ExceptionHandler()));

    /**
     * Class constructor.
     */
    private EventBus() {

    }

    /**
     * Singleton method
     *
     * @return An instance of eventbus
     */
    public static EventBus instance() {
        return instance;
    }

    /**
     * Registers an instance of a class implementing {@link Listener} to receive events
     *
     * @param listener An instance to register to receive events
     */
    public void register(Listener listener) {
        bus.subscribe(listener);
    }

    /**
     * Deregisters an instance of a class implementing {@link Listener} to no longer receive events
     *
     * @param listener An instance to deregister to no longer receive events
     */
    public void unregister(Listener listener) {
        bus.unsubscribe(listener);
    }

    /**
     * Performs a blocking publish of an event to the relevant subscribers
     * <br /><br />
     * This method should only be used in extremely rare circumstances. Most publishes should be done using {@link #postAsync(Event)}
     *
     * @param event An event to publish
     */
    public void post(Event event) {
        if (PhantomBot.isInExitState()) {
            return;
        }

        bus.publish(event);
    }

    /**
     * Publishes an event to the relevant subscribers on a separate thread
     *
     * @param event An event to publish
     */
    public void postAsync(Event event) {
        if (PhantomBot.isInExitState()) {
            return;
        }

        bus.publishAsync(event);
    }
}
