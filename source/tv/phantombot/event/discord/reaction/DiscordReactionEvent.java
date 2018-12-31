/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package tv.phantombot.event.discord.reaction;

import sx.blah.discord.handle.obj.IChannel;
import sx.blah.discord.handle.obj.IUser;

import tv.phantombot.event.discord.DiscordEvent;

/**
 *
 * @author ScaniaTV
 */
public abstract class DiscordReactionEvent extends DiscordEvent {
    
    /*
     * Abstract constructor.
     *
     * @param {IUser} user
     */
    protected DiscordReactionEvent(IUser user) {
        super(user);
    }

    /*
     * Abstract constructor.
     *
     * @param {IUser}    user
     * @param {IChannel} channel
     */
    protected DiscordReactionEvent(IUser user, IChannel channel) {
        super(user, channel);
    }
}
