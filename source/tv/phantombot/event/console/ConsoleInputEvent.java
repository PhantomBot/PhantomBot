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
package tv.phantombot.event.console;

public class ConsoleInputEvent extends ConsoleEvent {

    private final String message;

    /**
     * Class constructor for this event.
     *
     * @param message
     */
    public ConsoleInputEvent(String message) {
        this.message = message;
    }

    /**
     * Method that will return the message said in the console.
     *
     * @return message
     */
    public String getMessage() {
        return this.message;
    }

    /**
     * Method that returns this object as a string.
     *
     * @return
     */
    @Override
    public String toString() {
        return "ConsoleInputEvent -> { message: [" + this.message + "] }";
    }
}
