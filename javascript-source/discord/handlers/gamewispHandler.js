/**
 * This module is to handle gamewisp subscriber notifications.
 */
(function() {
    var subMessage = $.getSetIniDbString('discordSettings', 'gamewispSubMessage', '(name) just subscribed via GameWisp at tier level (tier)!'),
        resubMessage = $.getSetIniDbString('discordSettings', 'gamewispReSubMessage', '(name) just subscribed for (months) months in a row via GameWisp!'),
        tierMessage = $.getSetIniDbString('discordSettings', 'gamewispTierMessage', '(name) upgraded to tier (tier) on GameWisp!'),
        channelName = $.getSetIniDbString('discordSettings', 'gamewispChannel', ''),
        subToggle = $.getSetIniDbBoolean('discordSettings', 'gamewispSubToggle', false),
        resubToggle = $.getSetIniDbBoolean('discordSettings', 'gamewispReSubToggle', false),
        tierToggle = $.getSetIniDbBoolean('discordSettings', 'gamewispTierToggle', false),
        announce = false;

    /**
     * @event panelWebSocket
     */
    $.bind('panelWebSocket', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/gamewispHandler.js')) {
            subMessage = $.getIniDbString('discordSettings', 'gamewispSubMessage', '(name) just subscribed via GameWisp at tier level (tier)!');
            resubMessage = $.getIniDbString('discordSettings', 'gamewispReSubMessage', '(name) just subscribed for (months) months in a row via GameWisp!');
            tierMessage = $.getIniDbString('discordSettings', 'gamewispTierMessage', '(name) upgraded to tier (tier) on GameWisp!');
            channelName = $.getIniDbString('discordSettings', 'gamewispChannel', '');
            subToggle = $.getIniDbBoolean('discordSettings', 'gamewispSubToggle', false);
            resubToggle = $.getIniDbBoolean('discordSettings', 'gamewispReSubToggle', false);
            tierToggle = $.getIniDbBoolean('discordSettings', 'gamewispTierToggle', false);
        }
    });

    /**
     * @event gameWispSubscribe
     */
    $.bind('gameWispSubscribe', function(event) {
        var username = event.getUsername(),
            tier = event.getTier(),
            s = subMessage;

        if (announce === false || subToggle === false || channelName == '') {
            return;
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', username);
        }

        if (s.match(/\(tier\)/g)) {
            s = $.replace(s, '(tier)', tier.toString());
        }

        $.discord.say(channelName, s);
    });

    /**
     * @event gameWispBenefits
     */
    $.bind('gameWispBenefits', function(event) {
        var username = event.getUsername(),
            tier = event.getTier(),
            s = tierMessage;

        if (announce === false || tierToggle === false || channelName == '' || parseInt(tier) < $.getGWTier(username)) {
            return;
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', username);
        }

        if (s.match(/\(tier\)/g)) {
            s = $.replace(s, '(tier)', tier.toString());
        }

        $.discord.say(channelName, s);
    });

    /**
     * @event gameWispAnniversary
     */
    $.bind('gameWispAnniversary', function(event) {
        var username = event.getUsername(),
            months = event.getMonths(),
            s = resubMessage;

        if (announce === false || resubToggle === false || channelName == '') {
            return;
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', username);
        }

        if (s.match(/\(months\)/g)) {
            s = $.replace(s, '(months)', months.toString());
        }

        $.discord.say(channelName, s);
    });

    /**
     * @event discordCommand
     */
    $.bind('discordCommand', function(event) {
        var sender = event.getSender(),
            channel = event.getChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            arguments = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        if (command.equalsIgnoreCase('gamewisphandler')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gamewisphandler.usage'));
                return;
            }

            /**
             * @discordcommandpath gamewisphandler subtoggle - Toggles GameWisp subscriber announcements.
             */
            if (action.equalsIgnoreCase('subtoggle')) {
                subToggle = !subToggle;
                $.inidb.set('discordSettings', 'gamewispSubToggle', subToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gamewisphandler.sub.toggle', (subToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));

            }

            /**
             * @discordcommandpath gamewisphandler resubtoggle - Toggles GameWisp re-subscriber announcements.
             */
            if (action.equalsIgnoreCase('resubtoggle')) {
                resubToggle = !resubToggle;
                $.inidb.set('discordSettings', 'gamewispReSubToggle', resubToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gamewisphandler.resub.toggle', (resubToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));

            }

            /**
             * @discordcommandpath gamewisphandler tieruptoggle - Toggles GameWisp tier-up announcements.
             */
            if (action.equalsIgnoreCase('tieruptoggle')) {
                tierToggle = !tierToggle;
                $.inidb.set('discordSettings', 'gamewispTierToggle', tierToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gamewisphandler.tier.toggle', (tierToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));         
            }

            /**
             * @discordcommandpath gamewisphandler submessage [message] - Sets the GameWisp subscriber announcement message.
             */
            if (action.equalsIgnoreCase('submessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gamewisphandler.sub.message.usage'));
                    return;
                }

                subMessage = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'gamewispSubMessage', subMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gamewisphandler.sub.message.set', subMessage));
            }

            /**
             * @discordcommandpath gamewisphandler resubmessage [message] - Sets the GameWisp re-subscriber announcement message.
             */
            if (action.equalsIgnoreCase('resubmessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gamewisphandler.resub.message.usage'));
                    return;
                }

                resubMessage = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'gamewispReSubMessage', resubMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gamewisphandler.resub.message.set', resubMessage));
            }

            /**
             * @discordcommandpath gamewisphandler tierupmessage [message] - Sets the GameWisp tier-up announcement message.
             */
            if (action.equalsIgnoreCase('tierupmessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gamewisphandler.tier.message.usage'));
                    return;
                }

                tierMessage = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'gamewispTierMessage', tierMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gamewisphandler.tier.message.set', tierMessage));
            }

            /**
             * @discordcommandpath gamewisphandler channel [channel name] - Sets the channel that announcements from this module will be said in.
             */
            if (action.equalsIgnoreCase('channel')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gamewisphandler.channel.usage'));
                    return;
                }

                channelName = subAction.replace('#', '').toLowerCase();
                $.inidb.set('discordSettings', 'gamewispChannel', channelName);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gamewisphandler.channel.set', channelName));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/handlers/gamewispHandler.js')) {
            $.discord.registerCommand('./discord/handlers/gamewispHandler.js', 'gamewisphandler', 1);
            $.discord.registerSubCommand('gamewisphandler', 'subtoggle', 1);
            $.discord.registerSubCommand('gamewisphandler', 'resubtoggle', 1);
            $.discord.registerSubCommand('gamewisphandler', 'tieruptoggle', 1);
            $.discord.registerSubCommand('gamewisphandler', 'resubmessage', 1);
            $.discord.registerSubCommand('gamewisphandler', 'submessage', 1);
            $.discord.registerSubCommand('gamewisphandler', 'tierupmessage', 1);
            $.discord.registerSubCommand('gamewisphandler', 'channel', 1);

            announce = true;
            // $.unbind('initReady'); Needed or not?
        }
    });
})();
