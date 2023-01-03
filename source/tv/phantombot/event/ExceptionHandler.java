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

import net.engio.mbassy.bus.error.IPublicationErrorHandler;
import net.engio.mbassy.bus.error.PublicationError;

public class ExceptionHandler implements IPublicationErrorHandler {

    @Override
    public void handleError(PublicationError err) {
        com.gmt2001.Console.err.println("Failed to dispatch event [" + err.getHandler().toString() + "] to [" + err.getListener().toString() + "] " + err.getCause().getMessage());
        com.gmt2001.Console.err.printStackTrace(err.getCause());
    }
}
