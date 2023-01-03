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
package tv.phantombot.event.discord.reaction;

import discord4j.core.event.domain.message.MessageEvent;
import discord4j.core.event.domain.message.ReactionAddEvent;
import discord4j.core.event.domain.message.ReactionRemoveEvent;
import discord4j.core.object.reaction.ReactionEmoji;

/**
 *
 * @author Branden
 */
public class DiscordMessageReactionEvent extends DiscordReactionEvent {

    private final MessageEvent event;
    private final ReactionType type;

    /**
     * The type of reaction, either a "add" or "remove".
     */
    public static enum ReactionType {
        ADD,
        REMOVE
    }

    /**
     * Class constructor.
     *
     * @param event
     * @param type
     */
    public DiscordMessageReactionEvent(ReactionAddEvent event) {
        super(event.getUser().block(), event.getChannel().block());

        this.event = event;
        this.type = ReactionType.ADD;
    }

    /**
     * Class constructor.
     *
     * @param event
     * @param type
     */
    public DiscordMessageReactionEvent(ReactionRemoveEvent event) {
        super(event.getUser().block(), event.getChannel().block());

        this.event = event;
        this.type = ReactionType.REMOVE;
    }

    /**
     * Method that gets the reaction object.
     *
     * @return
     */
    public ReactionEmoji getReactionEmoji() {
        if (type == ReactionType.ADD) {
            return ((ReactionAddEvent) event).getEmoji();
        } else {
            return ((ReactionRemoveEvent) event).getEmoji();
        }
    }

    /**
     * Method that gets the type of reaction.
     *
     * @return
     */
    public ReactionType getType() {
        return type;
    }

    /**
     * Method that returns the event object.
     *
     * @return
     */
    public MessageEvent getEvent() {
        return event;
    }
}
