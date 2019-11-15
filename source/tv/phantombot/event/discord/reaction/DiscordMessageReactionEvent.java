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

package tv.phantombot.event.discord.reaction;

import sx.blah.discord.handle.impl.events.guild.channel.message.reaction.ReactionEvent;
import sx.blah.discord.handle.obj.IReaction;

/**
 *
 * @author Branden
 */
public class DiscordMessageReactionEvent extends DiscordReactionEvent {
    private final ReactionEvent event;
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
    public DiscordMessageReactionEvent(ReactionEvent event, ReactionType type) {
        super(event.getUser(), event.getChannel());
        
        this.event = event;
        this.type = type;
    }
    
    /**
     * Method that gets the reaction object.
     * 
     * @return 
     */
    public IReaction getReaction() {
        return event.getReaction();
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
    public ReactionEvent getEvent() {
        return event;
    }
}
