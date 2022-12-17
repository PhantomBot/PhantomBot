/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
package tv.phantombot.event.irc.message;

import java.util.Map;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;
import tv.phantombot.event.command.CommandEvent;
import tv.phantombot.twitch.irc.TwitchSession;

public class IrcModerationEvent extends IrcMessageEvent {

    private final Sinks.One<Boolean> moderated = Sinks.one();

    /**
     * Class constructor.
     *
     * @param session
     * @param sender
     * @param message
     */
    public IrcModerationEvent(TwitchSession session, String sender, String message) {
        super(session, sender, message);
    }

    /**
     * Class constructor.
     *
     * @param session
     * @param sender
     * @param message
     * @param tags
     */
    public IrcModerationEvent(TwitchSession session, String sender, String message, Map<String, String> tags) {
        super(session, sender, message, tags);
    }

    /**
     * Returns a {@link Mono} which emits {@code true} if a moderation was performed and further processing of this message should be stopped
     *
     * @return
     */
    public Mono<Boolean> mono() {
        return this.moderated.asMono();
    }

    /**
     * Emits {@code true} from the mono, signaling that moderation has occurred and further processing of this message should be stopped
     */
    public void moderated() {
        this.moderated.tryEmitValue(Boolean.TRUE);
    }

    /**
     * Emits {@code false} from the mono, signaling that moderation has not occurred in any handlers and the message is safe to consume
     */
    public void complete() {
        this.moderated.tryEmitValue(Boolean.FALSE);
    }

    /**
     * Indicates if this message appears to be a command, defined as exclamation point {@code !} followed by any character except for a space
     *
     * @return {@code true} if the message appears to be a command
     */
    public boolean isCommand() {
        return CommandEvent.isCommand(this.message);
    }

    /**
     * Converts this message into a {@link CommandEvent}
     *
     * @return {@code null} if {@link #isCommand(java.lang.String)} returns {@code false}; otherwise a {@link CommandEvent}
     */
    public CommandEvent asCommand() {
        return CommandEvent.asCommand(this.sender, this.message, this.tags);
    }
}
