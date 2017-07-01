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
package tv.phantombot.discord;

import sx.blah.discord.handle.obj.Permissions;
import sx.blah.discord.handle.obj.IChannel;
import sx.blah.discord.handle.obj.IMessage;
import sx.blah.discord.handle.obj.IGuild;
import sx.blah.discord.handle.obj.IUser;
import sx.blah.discord.handle.obj.IRole;

import sx.blah.discord.util.MissingPermissionsException;
import sx.blah.discord.util.DiscordException;
import sx.blah.discord.util.RequestBuffer;

import java.util.List;

/*
 * Handles Discord requests.
 *
 * @author Illusionaryone
 * @author ScaniaTV
 */
public class DiscordUtil {
	/*
     * Method to send a message to a channel.
     *
     * @param {IChannel} channel
     * @param {String} message
     */
    public void sendMessage(IChannel channel, String message) {
        RequestBuffer.request(() -> {
            try {
                if (channel != null) {
                    channel.sendMessage(message);
                    com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getName() + "] [CHAT] " + message);
                }
            } catch (DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to send a message [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /*
     * Method to send a message to a channel.
     *
     * @param {String} channelName
     * @param {String} message
     */
    public void sendMessage(String channelName, String message) {
        sendMessage(getChannel(channelName), message);
    }

    /*
     * Method to send private messages to a user.
     *
     * @param {IUser} user
     * @param {String} message
     */
    public void sendPrivateMessage(IUser user, String message) {
        RequestBuffer.request(() -> {
            try {
                if (user != null) {
                    user.getOrCreatePMChannel().sendMessage(message);
                    com.gmt2001.Console.out.println("[DISCORD] [@" + user.getName().toLowerCase() + "#" + user.getDiscriminator() + "] [DM] " + message);
                }
            } catch (DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to send a private message [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /*
     * Method to send private messages to a user.
     *
     * @param {String} userName
     * @param {String} message
     */
    public void sendPrivateMessage(String userName, String message) {
        sendPrivateMessage(getUser(userName), message);
    }

    /*
     * Method to return a channel object by its name.
     *
     * @param  {String} channelName
     * @return {IChannel}
     */
    public IChannel getChannel(String channelName) {
        List<IChannel> channels = DiscordAPI.guild.getChannelsByName(channelName);

        for (IChannel channel : channels) {
            if (channel.getName().equalsIgnoreCase(channelName)) {
                return channel;
            }
        }
        return null;
    }

    /*
     * Method to return a user object by its name.
     *
     * @param  {String} userName
     * @return {IUser}
     */
    public IUser getUser(String userName) {
        List<IUser> users = DiscordAPI.guild.getUsersByName(userName, true);

        for (IUser user : users) {
            if (user.getDisplayName(DiscordAPI.guild).equalsIgnoreCase(userName)) {
                return user;
            }
        }
        return null;
    }

    /*
     * Method to return a role object by its name.
     *
     * @param  {String} roleName
     * @return {IRole}
     */
    public IRole getRole(String roleName) {
        List<IRole> roles = DiscordAPI.guild.getRolesByName(roleName);

        for (IRole role : roles) {
            if (role.getName().equalsIgnoreCase(roleName)) {
                return role;
            }
        }
        return null;
    }

    /*
     * Method to set a role on a user.
     *
     * @param {IRole} role
     * @param {IUser} user
     */
    public void addRole(IRole role, IUser user) {
        RequestBuffer.request(() -> {
            try {
                if (role != null && user != null) {
                    user.addRole(role);
                }
            } catch (MissingPermissionsException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to add role on user: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /*
     * Method to set a role on a user.
     *
     * @param {String} roleName
     * @param {String} userName
     */
    public void addRole(String roleName, String userName) {
        addRole(getRole(roleName), getUser(userName));
    }

    /*
     * Method to remove a role on a user.
     *
     * @param {IRole} role
     * @param {IUser} user
     */
    public void removeRole(IRole role, IUser user) {
        RequestBuffer.request(() -> {
            try {
                if (role != null && user != null) {
                    user.removeRole(role);
                }
            } catch (MissingPermissionsException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to remove role on user: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /*
     * Method to remove a role on a user.
     *
     * @param {String} roleName
     * @param {String} userName
     */
    public void removeRole(String roleName, String userName) {
        removeRole(getRole(roleName), getUser(userName));
    }
    
    /*
     * Method to create a new role
     *
     * @param {String} roleName
     */
    public void createRole(String roleName) {
    	RequestBuffer.request(() -> {
    		try {
    			DiscordAPI.guild.createRole().changeName(roleName);
    		} catch (MissingPermissionsException | DiscordException ex) {
    			com.gmt2001.Console.err.println("Failed to create role: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
    		}
    	});
    }

    /*
     * Method to delete a new role
     *
     * @param {IRole} role
     */
    public void deleteRole(IRole role) {
    	RequestBuffer.request(() -> {
    		try {
    			if (role != null) {
    				role.delete();
    			}
    		} catch (MissingPermissionsException | DiscordException ex) {
    			com.gmt2001.Console.err.println("Failed to delete role: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
    		}
    	});
    }

    /*
     * Method to delete a new role
     *
     * @param {String} roleName
     */
    public void deleteRole(String roleName) {
    	deleteRole(getRole(roleName));
    }

    /*
     * Method to check if someone is an administrator.
     *
     * @param  {IUser} user
     * @return {Boolean}
     */
    public boolean isAdministrator(IUser user) {
        return user.getPermissionsForGuild(DiscordAPI.guild).contains(Permissions.ADMINISTRATOR);
    }

    /*
     * Method to check if someone is a moderator.
     *
     * @param  {IUser} user
     * @return {Boolean}
     */
    public boolean isModerator(IUser user) {
        return user.getPermissionsForGuild(DiscordAPI.guild).contains(Permissions.KICK);
    }
}
