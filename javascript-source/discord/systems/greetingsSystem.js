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

        if (joinGroup !== '') {
            $.discord.setRole(joinGroup, event.getDiscordUser());
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
            channel = event.getChannel(),
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

                channelName = subAction.replace('#', '').toLowerCase();
                $.setIniDbString('discordSettings', 'greetingsChannel', channelName);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.greetingssystem.channel.set', channelName));
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