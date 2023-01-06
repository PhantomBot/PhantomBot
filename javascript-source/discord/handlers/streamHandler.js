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

/* global Packages */

/*
 * This module is to handle online and offline events from Twitch.
 */
(function () {
    var onlineToggle = $.getSetIniDbBoolean('discordSettings', 'onlineToggle', false),
            onlinePublish = $.getSetIniDbBoolean('discordSettings', 'onlinePublish', false),
            onlineMessage = $.getSetIniDbString('discordSettings', 'onlineMessage', '(name) just went online on Twitch!'),
            offlineToggle = $.getSetIniDbBoolean('discordSettings', 'offlineToggle', false),
            offlinePublish = $.getSetIniDbBoolean('discordSettings', 'offlinePublish', false),
            offlineMessage = $.getSetIniDbString('discordSettings', 'offlineMessage', '(name) is now offline.'),
            gameToggle = $.getSetIniDbBoolean('discordSettings', 'gameToggle', false),
            gamePublish = $.getSetIniDbBoolean('discordSettings', 'gamePublish', false),
            gameMessage = $.getSetIniDbString('discordSettings', 'gameMessage', '(name) just changed game on Twitch!'),
            botGameToggle = $.getSetIniDbBoolean('discordSettings', 'botGameToggle', true),
            channelName = $.getSetIniDbString('discordSettings', 'onlineChannel', ''),
            deleteMessageToggle = $.getSetIniDbBoolean('discordSettings', 'deleteMessageToggle', true),
            timeout = (6e4 * 5), // 5 minutes.
            interval,
            msg,
            liveMessages = [],
            offlineMessages = [];

    /*
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function (event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/streamHandler.js')) {
            onlineToggle = $.getIniDbBoolean('discordSettings', 'onlineToggle', false);
            onlinePublish = $.getIniDbBoolean('discordSettings', 'onlinePublish', false);
            onlineMessage = $.getIniDbString('discordSettings', 'onlineMessage', '(name) just went online on Twitch!');
            offlineToggle = $.getIniDbBoolean('discordSettings', 'offlineToggle', false);
            offlinePublish = $.getIniDbBoolean('discordSettings', 'offlinePublish', false);
            offlineMessage = $.getIniDbString('discordSettings', 'offlineMessage', '(name) is now offline.');
            gameToggle = $.getIniDbBoolean('discordSettings', 'gameToggle', false);
            gamePublish = $.getIniDbBoolean('discordSettings', 'gamePublish', false);
            gameMessage = $.getIniDbString('discordSettings', 'gameMessage', '(name) just changed game on Twitch!');
            botGameToggle = $.getIniDbBoolean('discordSettings', 'botGameToggle', true);
            channelName = $.getIniDbString('discordSettings', 'onlineChannel', '');
            deleteMessageToggle = $.getSetIniDbBoolean('discordSettings', 'deleteMessageToggle', true);
        }
    });

    /*
     * @function getTrimmedGameName
     *
     * @return {String}
     */
    function getTrimmedGameName() {
        var game = $.jsString($.twitchcache.getGameTitle());

        return (game.length > 45 ? game.slice(0, 45) + '...' : game);
    }

    function sanitizeTitle(s) {
        return s.replace(/(\@everyone|\@here|<@&\d+>|<@\d+>|<#\d+>)/ig, '');
    }

    /*
     * @event twitchOffline
     */
    $.bind('twitchOffline', function (event) {
        // Make sure the channel is really offline before deleting and posting the data. Wait a minute and do another check.
        setTimeout(function () {
            // Delete live messages if any.
            if (deleteMessageToggle && liveMessages.length > 0) {
                while (liveMessages.length > 0) {
                    var message = liveMessages.shift();
                    if (message !== null) {
                        $.discordAPI.deleteMessage(message);
                    }
                }
            }

            if (botGameToggle === true) {
                $.discord.removeGame();
            }

            if (!$.twitchcache.isStreamOnline() && offlineToggle === true) {
                var keys = $.inidb.GetKeyList('discordStreamStats', ''),
                        chatters = [],
                        viewers = [],
                        i;

                // Get our data.
                for (i in keys) {
                    switch (true) {
                        case keys[i].indexOf('chatters_') !== - 1:
                            chatters.push($.getIniDbNumber('discordStreamStats', keys[i]));
                        case keys[i].indexOf('viewers_') !== - 1:
                            viewers.push($.getIniDbNumber('discordStreamStats', keys[i]));
                    }
                }

                // Get average viewers.
                var avgViewers = 1;
                if (viewers.length > 0) {
                    avgViewers = Math.round(viewers.reduce(function (a, b) {
                        return (a + b);
                    }) / (viewers.length < 1 ? 1 : viewers.length));
                } else {
                    viewers = [0];
                }

                // Get average chatters.
                var avgChatters = 1;
                if (chatters.length > 0) {
                    avgChatters = Math.round(chatters.reduce(function (a, b) {
                        return (a + b);
                    }) / (chatters.length < 1 ? 1 : chatters.length));
                } else {
                    chatters = [0];
                }

                // Get new follows.
                var followersNow = $.getFollows($.channelName),
                        follows = (followersNow - $.getIniDbNumber('discordStreamStats', 'followers', followersNow));

                // Get max viewers.
                var maxViewers = Math.max.apply(null, viewers);

                // Get max chatters.
                var maxChatters = Math.max.apply(null, chatters);

                var s = offlineMessage;

                if (s.match(/\(name\)/)) {
                    s = $.replace(s, '(name)', $.username.resolve($.channelName));
                }

                // Only say this when there is a mention.
                if (s.indexOf('@') !== -1) {
                    msg = $.discord.say(channelName, s);
                    if (deleteMessageToggle) {
                        offlineMessages.push(msg);
                    }
                }

                // Send the message as an embed.
                msg = $.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                        .withColor(100, 65, 164)
                        .withThumbnail($.twitchcache.getLogoLink())
                        .withTitle(sanitizeTitle(s))
                        .appendField($.lang.get('discord.streamhandler.offline.game'), getTrimmedGameName(), true)
                        .appendField($.lang.get('discord.streamhandler.offline.viewers'), $.lang.get('discord.streamhandler.offline.viewers.stat', avgViewers, maxViewers), true)
                        .appendField($.lang.get('discord.streamhandler.offline.chatters'), $.lang.get('discord.streamhandler.offline.chatters.stat', avgChatters, maxChatters), true)
                        .appendField($.lang.get('discord.streamhandler.offline.followers'), $.lang.get('discord.streamhandler.offline.followers.stat', follows, followersNow), true)
                        .withTimestamp(Date.now())
                        .withFooterText('Twitch')
                        .withFooterIcon($.twitchcache.getLogoLink())
                        .withUrl('https://twitch.tv/' + $.channelName).build());
                if (deleteMessageToggle) {
                    offlineMessages.push(msg);
                }

                if (offlinePublish && $.discordAPI.canChannelPublish(channelName)) {
                    try {
                        msg.publish().block();
                    } catch (e) {
                        $.log.error(e);
                    }
                }

                $.inidb.RemoveFile('discordStreamStats');
            }

            clearInterval(interval);
        }, 6e4);
    });

    /*
     * @event twitchOnline
     */
    $.bind('twitchOnline', function (event) {
        // Wait a minute for Twitch to generate a real thumbnail and make sure again that we are online.
        setTimeout(function () {
            if ($.twitchcache.isStreamOnline() && ($.systemTime() - $.getIniDbNumber('discordSettings', 'lastOnlineEvent', 0) >= timeout)) {
                // Remove old stats, if any.
                $.inidb.RemoveFile('discordStreamStats');

                // Delete offline messages if any.
                if (deleteMessageToggle && offlineMessages.length > 0) {
                    while (offlineMessages.length > 0) {
                        $.discordAPI.deleteMessage(offlineMessages.shift());
                    }
                }

                if (onlineToggle === true && channelName !== '') {
                    var s = onlineMessage;

                    if (s.match(/\(name\)/)) {
                        s = $.replace(s, '(name)', $.username.resolve($.channelName));
                    }

                    // Only say this when there is a mention.
                    if (s.indexOf('@') !== -1) {
                        msg = $.discord.say(channelName, s);
                        if (deleteMessageToggle) {
                            liveMessages.push(msg);
                        }
                    }

                    // Send the message as an embed.
                    msg = $.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                            .withColor(100, 65, 164)
                            .withThumbnail($.twitchcache.getLogoLink())
                            .withTitle(sanitizeTitle(s))
                            .appendField($.lang.get('discord.streamhandler.common.game'), getTrimmedGameName(), false)
                            .appendField($.lang.get('discord.streamhandler.common.title'), $.twitchcache.getStreamStatus(), false)
                            .withUrl('https://twitch.tv/' + $.channelName)
                            .withTimestamp(Date.now())
                            .withFooterText('Twitch')
                            .withFooterIcon($.twitchcache.getLogoLink())
                            .withImage($.twitchcache.getPreviewLink() + '?=' + $.randRange(1, 99999)).build());
                    if (deleteMessageToggle) {
                        liveMessages.push(msg);
                    }

                    if (onlinePublish && $.discordAPI.canChannelPublish(channelName)) {
                        try {
                            msg.publish().block();
                        } catch (e) {
                            $.log.error(e);
                        }
                    }

                    $.setIniDbNumber('discordSettings', 'lastOnlineEvent', $.systemTime());
                }
                if (botGameToggle === true) {
                    $.discord.setStream($.getStatus($.channelName), ('https://twitch.tv/' + $.channelName));
                }

                interval = setInterval(function () {
                    if ($.isOnline($.channelName)) {
                        var now = $.systemTime();

                        // Save this every time to make an average.
                        $.setIniDbNumber('discordStreamStats', 'chatters_' + now, $.users.length);
                        // Save this every time to make an average.
                        $.setIniDbNumber('discordStreamStats', 'viewers_' + now, $.getViewers($.channelName));

                        if (isNaN($.getIniDbNumber('discordStreamStats', 'followers'))) {
                            $.setIniDbNumber('discordStreamStats', 'followers', $.getFollows($.channelName));
                        }
                    }
                }, 18e5);

                $.setIniDbNumber('discordStreamStats', 'followers', $.getFollows($.channelName));
            }
        }, 6e4);
    });

    /*
     * @event twitchGameChange
     */
    $.bind('twitchGameChange', function (event) {
        if (gameToggle === false || $.jsString(channelName) === '' || $.isOnline($.channelName) === false) {
            return;
        }

        var s = gameMessage;

        if (s.match(/\(name\)/)) {
            s = $.replace(s, '(name)', $.username.resolve($.channelName));
        }

        // Only say this when there is a mention.
        if (s.indexOf('@') !== -1) {
            liveMessages.push($.discord.say(channelName, s));
        }
        var msg = $.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                .withColor(100, 65, 164)
                .withThumbnail($.twitchcache.getLogoLink())
                .withTitle(sanitizeTitle(s))
                .appendField($.lang.get('discord.streamhandler.common.game'), getTrimmedGameName(), false)
                .appendField($.lang.get('discord.streamhandler.common.title'), $.twitchcache.getStreamStatus(), false)
                .appendField($.lang.get('discord.streamhandler.common.uptime'), $.getTimeString($.twitchcache.getStreamUptimeSeconds()), false)
                .withUrl('https://twitch.tv/' + $.channelName)
                .withTimestamp(Date.now())
                .withFooterText('Twitch')
                .withFooterIcon($.twitchcache.getLogoLink())
                .withImage($.twitchcache.getPreviewLink() + '?=' + $.randRange(1, 99999)).build());
        liveMessages.push(msg);

        if (gamePublish && $.discordAPI.canChannelPublish(channelName)) {
            try {
                msg.publish().block();
            } catch (e) {
                $.log.error(e);
            }
        }
    });

    /*
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function (event) {
        var sender = event.getSender(),
                channel = event.getDiscordChannel(),
                command = event.getCommand(),
                mention = event.getMention(),
                arguments = event.getArguments(),
                args = event.getArgs(),
                action = args[0],
                subAction = args[1];

        if (command.equalsIgnoreCase('streamhandler')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.usage'));
                return;
            }

            /*
             * @discordcommandpath streamhandler toggleonline - Toggles the stream online announcements.
             */
            if (action.equalsIgnoreCase('toggleonline')) {
                onlineToggle = !onlineToggle;
                $.inidb.set('discordSettings', 'onlineToggle', onlineToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.online.toggle', (onlineToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /*
             * @discordcommandpath streamhandler toggleonlinepublish - Toggles stream online announcements being published in Discord Announcement channels.
             */
            if (action.equalsIgnoreCase('toggleonlinepublish')) {
                onlinePublish = !onlinePublish;
                $.inidb.set('discordSettings', 'onlinePublish', onlinePublish);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.online.publish.' + (onlinePublish === true ? 'on' : 'off')));
            }

            /*
             * @discordcommandpath streamhandler onlinemessage [message] - Sets the stream online announcement message.
             */
            if (action.equalsIgnoreCase('onlinemessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.online.message.usage'));
                    return;
                }

                onlineMessage = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'onlineMessage', onlineMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.online.message.set', onlineMessage));
            }

            /*
             * @discordcommandpath streamhandler toggleoffline - Toggles the stream offline announcements.
             */
            if (action.equalsIgnoreCase('toggleoffline')) {
                offlineToggle = !offlineToggle;
                $.inidb.set('discordSettings', 'offlineToggle', offlineToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.offline.toggle', (offlineToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /*
             * @discordcommandpath streamhandler toggleofflinepublish - Toggles stream offline announcements being published in Discord Announcement channels.
             */
            if (action.equalsIgnoreCase('toggleofflinepublish')) {
                offlinePublish = !offlinePublish;
                $.inidb.set('discordSettings', 'offlinePublish', offlinePublish);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.offline.publish.' + (offlinePublish === true ? 'on' : 'off')));
            }

            /*
             * @discordcommandpath streamhandler offlinemessage [message] - Sets the stream offline announcement message.
             */
            if (action.equalsIgnoreCase('offlinemessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.offline.message.usage'));
                    return;
                }

                offlineMessage = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'offlineMessage', offlineMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.offline.message.set', offlineMessage));
            }

            /*
             * @discordcommandpath streamhandler togglegame - Toggles the stream game change announcements.
             */
            if (action.equalsIgnoreCase('togglegame')) {
                gameToggle = !gameToggle;
                $.inidb.set('discordSettings', 'gameToggle', gameToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.game.toggle', (gameToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /*
             * @discordcommandpath streamhandler togglegamepublish - Toggles stream game change announcements being published in Discord Announcement channels.
             */
            if (action.equalsIgnoreCase('togglegamepublish')) {
                gamePublish = !gamePublish;
                $.inidb.set('discordSettings', 'gamePublish', gamePublish);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.game.publish.' + (gamePublish === true ? 'on' : 'off')));
            }

            /*
             * @discordcommandpath streamhandler gamemessage [message] - Sets the stream game change announcement message.
             */
            if (action.equalsIgnoreCase('gamemessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.game.message.usage'));
                    return;
                }

                gameMessage = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'gameMessage', gameMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.game.message.set', gameMessage));
            }

            /*
             * @discordcommandpath streamhandler togglebotstatus - If enabled the bot will be marked as streaming with your Twitch title when you go live.
             */
            if (action.equalsIgnoreCase('togglebotstatus')) {
                botGameToggle = !botGameToggle;
                $.inidb.set('discordSettings', 'botGameToggle', botGameToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.bot.game.toggle', (botGameToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /*
             * @discordcommandpath streamhandler channel [channel name] - Sets the channel that announcements from this module will be said in.
             */
            if (action.equalsIgnoreCase('channel')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.channel.usage'));
                    return;
                }

                channelName = $.discord.sanitizeChannelName(subAction);
                $.inidb.set('discordSettings', 'onlineChannel', channelName);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.channel.set', subAction));
            }

            /*
             * @discordcommandpath streamhandler toggledeletemessage - Toggles if online announcements get deleted after stream.
             */
            if (action.equalsIgnoreCase('toggledeletemessage')) {
                deleteMessageToggle = !deleteMessageToggle;
                $.inidb.set('discordSettings', 'deleteMessageToggle', deleteMessageToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.delete.toggle', (deleteMessageToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function () {
        $.discord.registerCommand('./discord/handlers/streamHandler.js', 'streamhandler', 1);
        $.discord.registerSubCommand('streamhandler', 'toggleonline', 1);
        $.discord.registerSubCommand('streamhandler', 'onlinemessage', 1);
        $.discord.registerSubCommand('streamhandler', 'togglegame', 1);
        $.discord.registerSubCommand('streamhandler', 'gamemessage', 1);
        $.discord.registerSubCommand('streamhandler', 'channel', 1);
        $.discord.registerSubCommand('streamhandler', 'toggledeletemessage', 1);
    });
})();
