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

(function() {
    var joinToggle = $.getSetIniDbBoolean('discordSettings', 'joinToggle', false),
        partToggle = $.getSetIniDbBoolean('discordSettings', 'partToggle', false),
        joinMessage = $.getSetIniDbString('discordSettings', 'joinMessage', '(name) just joined the server!'),
        partMessage = $.getSetIniDbString('discordSettings', 'partMessage', '(name) just left the server!'),
        channelName = $.getSetIniDbString('discordSettings', 'greetingsChannel', ''),
        joinGroup = $.getSetIniDbString('discordSettings', 'greetingsDefaultGroup', '');

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/systems/greetingsSystem.js')) {
            joinToggle = $.getIniDbBoolean('discordSettings', 'joinToggle', false);
            partToggle = $.getIniDbBoolean('discordSettings', 'partToggle', false);
            joinMessage = $.getIniDbString('discordSettings', 'joinMessage', '(name) just joined the server!');
            partMessage = $.getIniDbString('discordSettings', 'partMessage', '(name) just left the server!');
            channelName = $.getIniDbString('discordSettings', 'greetingsChannel', '');
            joinGroup = $.getIniDbString('discordSettings', 'greetingsDefaultGroup', '');
        }
    });

    /**
     * @event discordChannelJoin
     */
    $.bind('discordChannelJoin', function(event) {
        // Add the join group if there's one.
        if (joinGroup !== '' && joinGroup != null && joinGroup.length > 0) {
            $.discord.setRole(joinGroup, event.getDiscordUser());
        }

        // Check for the toggle.
        if (joinToggle === false || channelName == '') {
            return;
        }

        var username = event.getUsername(),
            mention = event.getMention(),
            s = joinMessage;

        if (s.match(/\(@name\)/)) {
            s = $.replace(s, '(@name)', mention);
        }

        if (s.match(/\(name\)/)) {
            s = $.replace(s, '(name)', username);
        }

        if (s.match(/\(role\)/)) {
            s = $.replace(s, '(role)', joinGroup);
        }

        $.discord.say(channelName, s);
    });

    /**
     * @event discordChannelPart
     */
    $.bind('discordChannelPart', function(event) {
        if (partToggle === false || channelName == '') {
            return;
        }

        var username = event.getUsername(),
            mention = event.getMention(),
            s = partMessage;

        if (s.match(/\(@name\)/)) {
            s = $.replace(s, '(@name)', mention);
        }

        if (s.match(/\(name\)/)) {
            s = $.replace(s, '(name)', username);
        }

        $.discord.say(channelName, s);
    });

    /**
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            channel = event.getDiscordChannel(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        if (command.equalsIgnoreCase('greetingssystem')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.greetingssystem.usage'));
                return;
            }

            /**
             * @discordcommandpath greetingssystem jointoggle - Toggles the announcement for when someone joins the server.
             */
            if (action.equalsIgnoreCase('jointoggle')) {
                joinToggle = !joinToggle;
                $.setIniDbBoolean('discordSettings', 'joinToggle', joinToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.greetingssystem.join.toggle', (joinToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /**
             * @discordcommandpath greetingssystem parttoggle - Toggles the announcement for when someone leaves the server.
             */
            if (action.equalsIgnoreCase('parttoggle')) {
                partToggle = !partToggle;
                $.setIniDbBoolean('discordSettings', 'partToggle', partToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.greetingssystem.part.toggle', (partToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /**
             * @discordcommandpath greetingssystem joinmessage [message] - Sets the message for when a user joins your server.
             */
            if (action.equalsIgnoreCase('joinmessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.greetingssystem.join.message.usage'));
                    return;
                }

                joinMessage = args.slice(1).join(' ');
                $.setIniDbString('discordSettings', 'joinMessage', joinMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.greetingssystem.join.message.set', joinMessage));
            }

            /**
             * @discordcommandpath greetingssystem partmessage [message] - Sets the message for when a user leaves your server.
             */
            if (action.equalsIgnoreCase('partmessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.greetingssystem.part.message.usage'));
                    return;
                }

                partMessage = args.slice(1).join(' ');
                $.setIniDbString('discordSettings', 'partMessage', partMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.greetingssystem.part.message.set', partMessage));
            }

            /**
             * @discordcommandpath greetingssystem channel [channel] - Sets the channel messages from this modules will be made in.
             */
            if (action.equalsIgnoreCase('channel')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.greetingssystem.channel.usage'));
                    return;
                }

                channelName = $.discord.sanitizeChannelName(subAction);
                $.setIniDbString('discordSettings', 'greetingsChannel', channelName);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.greetingssystem.channel.set', subAction));
            }

            /**
             * @discordcommandpath greetingssystem joinrole [role name] - Sets the default role users will get when joining.
             */
            if (action.equalsIgnoreCase('joinrole')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.greetingssystem.joinrole.usage'));
                    return;
                }

                joinGroup = subAction;
                $.setIniDbString('discordSettings', 'greetingsDefaultGroup', joinGroup);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.greetingssystem.joinrole.set', joinGroup));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/systems/greetingsSystem.js', 'greetingssystem', 1);
        $.discord.registerSubCommand('greetingssystem', 'jointoggle', 1);
        $.discord.registerSubCommand('greetingssystem', 'partoggle', 1);
        $.discord.registerSubCommand('greetingssystem', 'joinmessage', 1);
        $.discord.registerSubCommand('greetingssystem', 'partmessage', 1);
        $.discord.registerSubCommand('greetingssystem', 'channel', 1);
    });
})();
