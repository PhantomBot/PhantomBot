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
package tv.phantombot.event.webpanel.websocket;

public class WebPanelSocketUpdateEvent extends WebPanelSocketEvent {
    private final String id;
    private final String script;
    private final String arguments;
    private final String[] args;

    /**
     * Class constructor.
     *
     * @param {String}   id
     * @param {String}   script
     * @param {String}   arguments
     * @param {String[]} args
     */
    public WebPanelSocketUpdateEvent(String id, String script, String arguments, String[] args) {
        this.id = id;
        this.script = script;
        this.arguments = arguments;
        this.args = args;
    }

    /**
     * Method that returns the socket event ID.
     *
     * @return {String} id
     */
    public String getId() {
        return this.id;
    }

    /**
     * Method that returns the script location and name.
     *
     * @return {String} script
     */
    public String getScript() {
        return this.script;
    }

    /**
     * Method that returns the arguments string.
     *
     * @return {String} arguments
     */
    public String getArguments() {
        return this.arguments;
    }

    /**
     * Method that returns the arguments array.
     *
     * @return {String[]} args
     */

    public String[] getArgs() {
        return this.args;
    }
}
