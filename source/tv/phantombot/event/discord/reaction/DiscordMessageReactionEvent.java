/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
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
