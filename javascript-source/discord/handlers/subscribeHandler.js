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

/**
 * This module is to handle subscriber notifications.
 */
(function() {
    var subMessage = $.getSetIniDbString('discordSettings', 'subMessage', '(name) just subscribed!'),
        primeMessage = $.getSetIniDbString('discordSettings', 'primeMessage', '(name) just subscribed with Twitch Prime!'),
        resubMessage = $.getSetIniDbString('discordSettings', 'resubMessage', '(name) just subscribed for (months) months in a row!'),
        giftsubMessage = $.getSetIniDbString('discordSettings', 'giftsubMessage', '(name) just gifted (recipient) a subscription!'),
        subToggle = $.getSetIniDbBoolean('discordSettings', 'subToggle', false),
        primeToggle = $.getSetIniDbBoolean('discordSettings', 'primeToggle', false),
        resubToggle = $.getSetIniDbBoolean('discordSettings', 'resubToggle', false),
        giftsubToggle = $.getSetIniDbBoolean('discordSettings', 'giftsubToggle', false),
        channelName = $.getSetIniDbString('discordSettings', 'subChannel', ''),
        announce = false;

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/subscribeHandler.js')) {
            subMessage = $.getIniDbString('discordSettings', 'subMessage', '(name) just subscribed!');
            primeMessage = $.getIniDbString('discordSettings', 'primeMessage', '(name) just subscribed with Twitch Prime!');
            resubMessage = $.getIniDbString('discordSettings', 'resubMessage', '(name) just subscribed for (months) months in a row!');
            giftsubMessage = $.getSetIniDbString('discordSettings', 'giftsubMessage', '(name) just gifted (recipient) a subscription!');
            subToggle = $.getIniDbBoolean('discordSettings', 'subToggle', false);
            primeToggle = $.getIniDbBoolean('discordSettings', 'primeToggle', false);
            resubToggle = $.getIniDbBoolean('discordSettings', 'resubToggle', false);
            giftsubToggle = $.getSetIniDbBoolean('discordSettings', 'giftsubToggle', false);
            channelName = $.getIniDbString('discordSettings', 'subChannel', '');
        }
    });

    /**
     * @event twitchSubscriber
     */
    $.bind('twitchSubscriber', function(event) {
        var subscriber = event.getSubscriber(),
            s = subMessage;

        if (announce === false || subToggle === false || channelName == '') {
            return;
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', subscriber);
        }

        $.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                    .withColor(100, 65, 164)
                    .withThumbnail('https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2')
                    .withTitle($.lang.get('discord.subscribehandler.subscriber.embedtitle'))
                    .appendDescription(s)
                    .withTimestamp(Date.now())
                    .withFooterText('Twitch')
                    .withFooterIcon($.twitchcache.getLogoLink()).build());
    });

     /*
     * @event twitchSubscriptionGift
     */
    $.bind('twitchSubscriptionGift', function(event) {
        var gifter = event.getUsername(),
            recipient = event.getRecipient(),
            months = event.getMonths(),
            s = giftsubMessage;

        if (announce === false || giftsubToggle === false || channelName == '') {
            return;
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', gifter);
        }

        if (s.match(/\(recipient\)/g)) {
            s = $.replace(s, '(recipient)', recipient);
        }

        if (s.match(/\(months\)/g)) {
            s = $.replace(s, '(months)', months);
        }

        $.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                    .withColor(100, 65, 164)
                    .withThumbnail('https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2')
                    .withTitle($.lang.get('discord.subscribehandler.giftsubscriber.embedtitle'))
                    .appendDescription(s)
                    .withTimestamp(Date.now())
                    .withFooterText('Twitch')
                    .withFooterIcon($.twitchcache.getLogoLink()).build());
    });

    /**
     * @event twitchPrimeSubscriber
     */
    $.bind('twitchPrimeSubscriber', function(event) {
        var subscriber = event.getSubscriber(),
            s = primeMessage;

        if (announce === false || primeToggle === false || channelName == '') {
            return;
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', subscriber);
        }

        $.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                    .withColor(100, 65, 164)
                    .withThumbnail('https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2')
                    .withTitle($.lang.get('discord.subscribehandler.primesubscriber.embedtitle'))
                    .appendDescription(s)
                    .withTimestamp(Date.now())
                    .withFooterText('Twitch')
                    .withFooterIcon($.twitchcache.getLogoLink()).build());
    });

    /**
     * @event twitchReSubscriber
     */
    $.bind('twitchReSubscriber', function(event) {
        var subscriber = event.getReSubscriber(),
            months = event.getMonths(),
            s = resubMessage;

        if (announce === false || resubToggle === false || channelName == '') {
            return;
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', subscriber);
        }

        if (s.match(/\(months\)/g)) {
            s = $.replace(s, '(months)', months);
        }

        $.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                    .withColor(100, 65, 164)
                    .withThumbnail('https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2')
                    .withTitle($.lang.get('discord.subscribehandler.resubscriber.embedtitle'))
                    .appendDescription(s)
                    .withTimestamp(Date.now())
                    .withFooterText('Twitch')
                    .withFooterIcon($.twitchcache.getLogoLink()).build());
    });

    /**
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        var sender = event.getSender(),
            channel = event.getDiscordChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            arguments = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        if (command.equalsIgnoreCase('subscribehandler')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.usage'));
                return;
            }

            /**
             * @discordcommandpath subscribehandler subtoggle - Toggles subscriber announcements.
             */
            if (action.equalsIgnoreCase('subtoggle')) {
                subToggle = !subToggle;
                $.inidb.set('discordSettings', 'subToggle', subToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.sub.toggle', (subToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /**
             * @discordcommandpath subscribehandler giftsubtoggle - Toggles gifted subscriber announcements.
             */
            if (action.equalsIgnoreCase('giftsubtoggle')) {
                giftsubToggle = !giftsubToggle;
                $.inidb.set('discordSettings', 'giftsubToggle', giftsubToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.giftsub.toggle', (giftsubToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /**
             * @discordcommandpath subscribehandler primetoggle - Toggles Twitch Prime subscriber announcements.
             */
            if (action.equalsIgnoreCase('primetoggle')) {
                primeToggle = !primeToggle;
                $.inidb.set('discordSettings', 'primeToggle', primeToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.prime.toggle', (primeToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /**
             * @discordcommandpath subscribehandler resubtoggle - Toggles re-subscriber announcements.
             */
            if (action.equalsIgnoreCase('resubtoggle')) {
                resubToggle = !resubToggle;
                $.inidb.set('discordSettings', 'resubToggle', resubToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.resub.toggle', (resubToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /**
             * @discordcommandpath subscribehandler submessage [message] - Sets the subscriber announcement message.
             */
            if (action.equalsIgnoreCase('submessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.sub.message.usage'));
                    return;
                }

                subMessage = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'subMessage', subMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.sub.message.set', subMessage));
            }


            /**
             * @discordcommandpath subscribehandler giftsubmessage [message] - Sets the gift subscriber announcement message.
             */
            if (action.equalsIgnoreCase('giftsubmessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.giftsub.message.usage'));
                    return;
                }

                giftsubMessage = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'giftsubMessage', giftsubMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.giftsub.message.set', giftsubMessage));
            }

            /**
             * @discordcommandpath subscribehandler primemessage [message] - Sets the Twitch Prime subscriber announcement message.
             */
            if (action.equalsIgnoreCase('primemessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.prime.sub.message.usage'));
                    return;
                }

                primeMessage = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'primeMessage', primeMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.prime.sub.message.set', primeMessage));
            }

            /**
             * @discordcommandpath subscribehandler resubmessage [message] - Sets the re-subscriber announcement message.
             */
            if (action.equalsIgnoreCase('resubmessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.resub.message.usage'));
                    return;
                }

                resubMessage = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'resubMessage', resubMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.resub.message.set', resubMessage));
            }

            /**
             * @discordcommandpath subscribehandler channel [channel name] - Sets the channel that announcements from this module will be said in.
             */
            if (action.equalsIgnoreCase('channel')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.channel.usage'));
                    return;
                }

                channelName = $.discord.sanitizeChannelName(subAction);
                $.inidb.set('discordSettings', 'subChannel', channelName);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.subscribehandler.channel.set', subAction));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/handlers/subscribeHandler.js', 'subscribehandler', 1);
        $.discord.registerSubCommand('subscribehandler', 'subtoggle', 1);
        $.discord.registerSubCommand('subscribehandler', 'giftsubtoggle', 1);
        $.discord.registerSubCommand('subscribehandler', 'primetoggle', 1);
        $.discord.registerSubCommand('subscribehandler', 'resubtoggle', 1);
        $.discord.registerSubCommand('subscribehandler', 'submessage', 1);
        $.discord.registerSubCommand('subscribehandler', 'giftsubmessage', 1);
        $.discord.registerSubCommand('subscribehandler', 'primemessage', 1);
        $.discord.registerSubCommand('subscribehandler', 'resubmessage', 1);
        $.discord.registerSubCommand('subscribehandler', 'channel', 1);

        announce = true;
    });
})();
