/*
 * Copyright (C) 2016-2019 phantombot.tv
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

public class EventBus {

	private static final MBassador<Event> MESSAGE_BUS = new MBassador<Event>(new BusConfiguration()
			.addFeature(Feature.SyncPubSub.Default())
			.addFeature(Feature.AsynchronousHandlerInvocation.Default())
			.addFeature(Feature.AsynchronousMessageDispatch.Default()
			.setNumberOfMessageDispatchers(10))
			.addPublicationErrorHandler(new ExceptionHandler()));

	/**
	 * Method that registers a listener with the bus.
	 *
	 * @param {Listener} listener
	 */
	public static void register(Listener listener) {
		EventBus.MESSAGE_BUS.subscribe(listener);
	}

	/**
	 * Method that removes a listener from the bus.
	 *
	 * @param {Listener} listener
	 */
	public static void unregister(Listener listener) {
		EventBus.MESSAGE_BUS.unsubscribe(listener);
	}

	/**
	 * Method that posts an event in sync.
	 *
	 * @param {Event} event
	 */
	public static void post(Event event) {
		if (PhantomBot.isInExitState()) {
			return;
		}

		EventBus.MESSAGE_BUS.publish(event);
	}

	/**
	 * Method that posts an event in async.
	 *
	 * @param {Event} event
	 */
	public static void postAsync(Event event) {
		if (PhantomBot.isInExitState()) {
			return;
		}

		EventBus.MESSAGE_BUS.publishAsync(event);
	}
}
