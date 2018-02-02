/*
 * Copyright (C) 2016-2018 phantombot.tv
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
package tv.phantombot.event.twitch.user;

import tv.phantombot.event.twitch.TwitchEvent;

/**
 *
 * @author gmt2001
 */
public class TwitchUserNameChangedEvent extends TwitchEvent {
    private final String userID;
    private final String oldName;
    private final String newName;
    
    public TwitchUserNameChangedEvent(String userID, String oldName, String newName) {
        this.userID = userID;
        this.oldName = oldName;
        this.newName = newName;
    }
    
    public String getUserID() {
        return this.userID;
    }
    
    public String getOldName() {
        return this.oldName;
    }
    
    public String getNewName() {
        return this.newName;
    }
}
