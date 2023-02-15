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
package tv.phantombot.event.twitch;

/**
 * One of the Twitch OAuth tokens has been re-authorized from the {@code /oauth} page on the bots webserver
 */
public class TwitchOAuthReauthorizedEvent extends TwitchEvent {
    private final boolean isAPI;

    public TwitchOAuthReauthorizedEvent(boolean isAPI) {
        super();
        this.isAPI = isAPI;
    }

    /**
     * If {@code true}, the API OAuth was re-authorized; otherwise, it was the Chat OAuth
     *
     * @return
     */
    public boolean isAPI() {
        return this.isAPI;
    }
}
