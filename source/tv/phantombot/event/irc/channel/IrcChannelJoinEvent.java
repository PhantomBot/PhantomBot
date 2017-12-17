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
package tv.phantombot.event.irc.channel;

import tv.phantombot.twitchwsirc.chat.Session;

public class IrcChannelJoinEvent extends IrcChannelEvent {
    private final String user;

    /*
     * Class constructor
     *
     * @param {Session} session
     * @param {String}  user
     */
    public IrcChannelJoinEvent(Session session, String user) {
        super(session);

        this.user = user;
    }

    /*
     * Class constructor
     *
     * @param {String}  user
     */
    public IrcChannelJoinEvent(String user) {
        super(null);
        
        this.user = user;
    }

    /*
     * Method that returns the user who joined the channel.
     *
     * @return {String} user
     */
    public String getUser() {
        return this.user;
    }
}
