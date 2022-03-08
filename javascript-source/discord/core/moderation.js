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

(function() {
    var blacklist = [],
        whitelist = [],
        permitList = {},
        timeout = {},
        spam = {},
        lastMessage = 0,

        linkToggle = $.getSetIniDbBoolean('discordSettings', 'linkToggle', false),
        linkPermit = $.getSetIniDbNumber('discordSettings', 'linkPermit', 60),

        capsToggle = $.getSetIniDbBoolean('discordSettings', 'capToggle', false),
        capsLimitPercent = $.getSetIniDbNumber('discordSettings', 'capsLimitPercent', 50),
        capsTriggerLength = $.getSetIniDbNumber('discordSettings', 'capsTriggerLength', 15),

        longMessageToggle = $.getSetIniDbBoolean('discordSettings', 'longMessageToggle', false),
        longMessageLimit = $.getSetIniDbNumber('discordSettings', 'longMessageLimit', 600),

        spamToggle = $.getSetIniDbBoolean('discordSettings', 'spamToggle', false),
        spamLimit = $.getSetIniDbNumber('discordSettings', 'spamLimit', 5),

        modLogs = $.getSetIniDbBoolean('discordSettings', 'modLogs', false),
        modLogChannel = $.getSetIniDbString('discordSettings', 'modLogChannel', '');

    /**
     * @function reload
     */
    function reload() {
        linkToggle = $.getSetIniDbBoolean('discordSettings', 'linkToggle', false),
        linkPermit = $.getSetIniDbNumber('discordSettings', 'linkPermit', 60);
        capsToggle = $.getSetIniDbBoolean('discordSettings', 'capToggle', false);
        capsLimitPercent = $.getSetIniDbNumber('discordSettings', 'capsLimitPercent', 50);
        capsTriggerLength = $.getSetIniDbNumber('discordSettings', 'capsTriggerLength', 15);
        longMessageToggle = $.getSetIniDbBoolean('discordSettings', 'longMessageToggle', false);
        longMessageLimit = $.getSetIniDbNumber('discordSettings', 'longMessageLimit', 600);
        spamToggle = $.getSetIniDbBoolean('discordSettings', 'spamToggle', false);
        spamLimit = $.getSetIniDbNumber('discordSettings', 'spamLimit', 5);
        modLogs = $.getSetIniDbBoolean('discordSettings', 'modLogs', false);
        modLogChannel = $.getSetIniDbString('discordSettings', 'modLogChannel', '');
    }

    /**
     * @function loadBlackList
     */
    function loadBlackList() {
        var keys = $.inidb.GetKeyList('discordBlacklist', ''),
            i;

        blacklist = [];
        for (i = 0; i < keys.length; i++) {
            blacklist.push(keys[i].toLowerCase());
        }
    }

    /**
     * @function loadWhitelist
     */
    function loadWhitelist() {
        var keys = $.inidb.GetKeyList('discordWhitelist', ''),
            i;

        whitelist = []
        for (i = 0; i < keys.length; i++) {
            whitelist.push(keys[i].toLowerCase());
        }
    }

    /**
     * @function hasPermit
     *
     * @param {String} username
     */
    function hasPermit(username) {
        if (permitList[username] !== undefined && (permitList[username] + linkPermit) >= $.systemTime()) {
            return true;
        }
        return false;
    }

    /**
     * @function
     *
     * @param {String} sender
     * @param {String} message
     */
    function isWhiteList(username, message) {
        for (var i in whitelist) {
            if (message.includes(whitelist[i]) || username == whitelist[i]) {
                return true;
            }
        }
        return false;
    }

    /**
     * @hasBlackList
     *
     * @param {String} message
     */
    function hasBlackList(message) {
        for (var i in blacklist) {
            if (message.includes(blacklist[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * @function username
     *
     * @param {String} username
     */
    function bulkDelete(username, channel) {
        $.discordAPI.bulkDeleteMessages(channel, spam[username].messages);
        delete spam[username];
    }

    /**
     * function timeoutUser
     *
     * @param {Object} message
     */
    function timeoutUser(message) {
        $.discordAPI.deleteMessage(message);
    }
    
    /*
     * @function embedDelete
     *
     * @param {String} username
     * @param {String} creator
     * @param {String} message
     */
    function embedDelete(username, creator, message) {
        var toSend = '',
            obj = {},
            i;

        obj['**Deleted_message_of:**'] = '[' + username + '](https://twitch.tv/' + username.toLowerCase() + ')';
        obj['**Creator:**'] = creator;
        obj['**Last_message:**'] = (message.length() > 50 ? message.substring(0, 50) + '...' : message);

        var keys = Object.keys(obj);
        for (i in keys) {
            if (obj[keys[i]] != '') {
                toSend += keys[i].replace(/_/g, ' ') + ' ' + obj[keys[i]] + '\r\n\r\n';
            }
        }
        $.discordAPI.sendMessageEmbed(modLogChannel, 'blue', toSend);
    }

    /*
     * @function embedTimeout
     *
     * @param {String} username
     * @param {String} creator
     * @param {String} reason
     * @param {String} time
     * @param {String} message
     */
    function embedTimeout(username, creator, reason, time, message) {
        var toSend = '',
            obj = {},
            i;

        obj['**Timeout_placed_on:**'] = '[' + username + '](https://www.twitch.tv/popout/' + $.channelName + '/viewercard/' + username.toLowerCase() + ')';
        obj['**Creator:**'] = creator;
        obj['**Reason:**'] = reason;
        obj['**Time:**'] = time + ' seconds.';

        obj['**Last_message:**'] = (message.length() > 50 ? message.substring(0, 50) + '...' : message);

        var keys = Object.keys(obj);
        for (i in keys) {
            if (obj[keys[i]] != '') {
                toSend += keys[i].replace(/_/g, ' ') + ' ' + obj[keys[i]] + '\r\n\r\n';
            }
        }
        $.discordAPI.sendMessageEmbed(modLogChannel, 'yellow', toSend);
    }

    /*
     * @function embedBanned
     *
     * @param {String} username
     * @param {String} creator
     * @param {String} reason
     * @param {String} message
     */
    function embedBanned(username, creator, reason, message) {
        var toSend = '',
            obj = {},
            i;

        obj['**Ban_placed_on:**'] = '[' + username + '](https://twitch.tv/' + username.toLowerCase() + ')';
        obj['**Creator:**'] = creator;
        obj['**Reason:**'] = reason;
        obj['**Last_message:**'] = (message.length() > 50 ? message.substring(0, 50) + '...' : message);

        var keys = Object.keys(obj);
        for (i in keys) {
            if (obj[keys[i]] != '') {
                toSend += keys[i].replace(/_/g, ' ') + ' ' + obj[keys[i]] + '\r\n\r\n';
            }
        }
        $.discordAPI.sendMessageEmbed(modLogChannel, 'red', toSend);
    }
    
    /*
     * @event PubSubModerationDelete
     */
    $.bind('pubSubModerationDelete', function (event) {
        var username = event.getUsername(),
            creator = event.getCreator(),
            message = event.getMessage();

        if (modLogs === false || modLogChannel === '') {
            return;
        }

        embedDelete(username, creator, message);
    });

    /*
     * @event PubSubModerationTimeout
     */
    $.bind('pubSubModerationTimeout', function(event) {
        var username = event.getUsername(),
            creator = event.getCreator(),
            message = event.getMessage(),
            reason = event.getReason(),
            time = parseInt(event.getTime());

        if (modLogs === false || modLogChannel === '') {
            return;
        }

        embedTimeout(username, creator, reason, time, message);
    });

    /*
     * @event PubSubModerationUnTimeout
     */
    $.bind('pubSubModerationUnTimeout', function(event) {
        var username = event.getUsername(),
            creator = event.getCreator();

        if (modLogs === false || modLogChannel === '') {
            return;
        }

        $.discordAPI.sendMessageEmbed(modLogChannel, 'green', '**Timeout removed from:** ' + '[' + username + '](https://twitch.tv/' + username.toLowerCase() + ')' + ' \r\n\r\n **Creator:** ' + creator);
    });

    /*
     * @event PubSubModerationUnBan
     */
    $.bind('pubSubModerationUnBan', function(event) {
        var username = event.getUsername(),
            creator = event.getCreator();

        if (modLogs === false || modLogChannel === '') {
            return;
        }

        $.discordAPI.sendMessageEmbed(modLogChannel, 'green', '**Ban removed from:** ' + '[' + username + '](https://twitch.tv/' + username.toLowerCase() + ')' + ' \r\n\r\n **Creator:** ' + creator);
    });

    /*
     * @event PubSubModerationBan
     */
    $.bind('pubSubModerationBan', function(event) {
        var username = event.getUsername(),
            creator = event.getCreator(),
            message = event.getMessage(),
            reason = event.getReason();

        if (modLogs === false || modLogChannel === '') {
            return;
        }

        embedBanned(username, creator, reason, message);
    });

    /**
     * @event discordChannelMessage
     */
    $.bind('discordChannelMessage', function(event) {
        var sender = event.getSenderId(),
            channel = event.getDiscordChannel(),
            message = event.getMessage().toLowerCase(),
            messageLength = message.length();

        if (event.isAdmin() == false && !hasPermit(sender) && !isWhiteList(sender, message)) {
            if (linkToggle && $.discord.pattern.hasLink(message)) {
                timeoutUser(event.getDiscordMessage());
                return;
            }

            if (longMessageToggle && messageLength > longMessageLimit) {
                timeoutUser(event.getDiscordMessage());
                return;
            }

            if (capsToggle && messageLength > capsTriggerLength && (($.discord.pattern.getCapsCount(event.getMessage()) / messageLength) * 100) > capsLimitPercent) {
                timeoutUser(event.getDiscordMessage());
                return;
            }

            if (spamToggle) {
                if (spam[sender] !== undefined) {
                    if (spam[sender].time + 5000 > $.systemTime() && (spam[sender].total + 1) <= spamLimit) {
                        spam[sender].total++; spam[sender].messages.push(event.getDiscordMessage());
                    } else if (spam[sender].time + 5000 < $.systemTime() && (spam[sender].total + 1) <= spamLimit) {
                        spam[sender] = { total: 1, time: $.systemTime(), messages: [event.getDiscordMessage()] };
                    } else {
                        spam[sender].messages.push(event.getDiscordMessage());
                        bulkDelete(sender, channel);
                        return;
                    }
                } else {
                    spam[sender] = { total: 1, time: $.systemTime(), messages: [event.getDiscordMessage()] };
                }
            }

            if (hasBlackList(message)) {
                timeoutUser(event.getDiscordMessage());
                return;
            }
        }
        lastMessage = $.systemTime();
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
            subAction = args[1],
            actionArgs = args[2];

        if (command.equalsIgnoreCase('moderation')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.usage'));
                return;
            }

            if (action.equalsIgnoreCase('links')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.links.usage'));
                    return;
                }

                /**
                 * @discordcommandpath moderation links toggle - Toggles the link filter.
                 */
                if (subAction.equalsIgnoreCase('toggle')) {
                    linkToggle = !linkToggle;
                    $.setIniDbBoolean('discordSettings', 'linkToggle', linkToggle);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.links.toggle', (linkToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                }

                /**
                 * @discordcommandpath moderation links permittime [seconds] - Sets the amount a time a permit lasts for.
                 */
                if (subAction.equalsIgnoreCase('permittime')) {
                    if (isNaN(parseInt(actionArgs))) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.links.permit.time.usage'));
                        return;
                    }

                    linkPermit = parseInt(actionArgs);
                    $.setIniDbNumber('discordSettings', 'linkPermit', linkPermit);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.links.permit.time.set', linkPermit));
                }
            }

            if (action.equalsIgnoreCase('caps')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.caps.usage'));
                    return;
                }

                /**
                 * @discordcommandpath moderation caps toggle - Toggle the caps filter.
                 */
                if (subAction.equalsIgnoreCase('toggle')) {
                    capsToggle = !capsToggle;
                    $.setIniDbBoolean('discordSettings', 'capsToggle', capsToggle);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.caps.toggle', (capsToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                }

                /**
                 * @discordcommandpath moderation caps triggerlength [characters] - Sets the amount of characters needed a message before checking for caps.
                 */
                if (subAction.equalsIgnoreCase('triggerlength')) {
                    if (isNaN(parseInt(actionArgs))) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.caps.trigger.usage'));
                        return;
                    }

                    capsTriggerLength = parseInt(actionArgs);
                    $.setIniDbNumber('discordSettings', 'capsTriggerLength', capsTriggerLength);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.caps.trigger.set', capsTriggerLength));
                }

                /**
                 * @discordcommandpath moderation caps limitpercent [percent] - Sets the amount in percent of caps are allowed in a message.
                 */
                if (subAction.equalsIgnoreCase('limitpercent')) {
                    if (isNaN(parseInt(actionArgs))) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.caps.limit.usage'));
                        return;
                    }

                    capsLimitPercent = parseInt(actionArgs);
                    $.setIniDbNumber('discordSettings', 'capsLimitPercent', capsLimitPercent);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.caps.limit.set', capsLimitPercent));
                }
            }

            if (action.equalsIgnoreCase('longmessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.long.message.usage'));
                    return;
                }

                /**
                 * @discordcommandpath moderation longmessage toggle - Toggles the long message filter
                 */
                if (subAction.equalsIgnoreCase('toggle')) {
                    longMessageToggle = !longMessageToggle;
                    $.setIniDbBoolean('discordSettings', 'longMessageToggle', longMessageToggle);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.long.message.toggle', (longMessageToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                }

                /**
                 * @discordcommandpath moderation longmessage limit [characters] - Sets the amount of characters allowed in a message.
                 */
                if (subAction.equalsIgnoreCase('limit')) {
                    if (isNaN(parseInt(actionArgs))) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.long.message.limit.usage'));
                        return;
                    }

                    longMessageLimit = parseInt(actionArgs);
                    $.setIniDbNumber('discordSettings', 'longMessageLimit', longMessageLimit);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.long.message.limit.set', longMessageLimit));
                }
            }

            if (action.equalsIgnoreCase('spam')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.spam.usage'));
                    return;
                }

                /**
                 * @discordcommandpath moderation spam toggle - Toggles the spam filter.
                 */
                if (subAction.equalsIgnoreCase('toggle')) {
                    spamToggle = !spamToggle;
                    $.setIniDbBoolean('discordSettings', 'spamToggle', spamToggle);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.spam.toggle', (spamToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                }

                /**
                 * @discordcommandpath moderation limit [messages] - Sets the amount of messages users are allowed to send in 5 seconds.
                 */
                if (subAction.equalsIgnoreCase('limit')) {
                    if (isNaN(parseInt(actionArgs))) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.spam.limit.usage'));
                        return;
                    }

                    spamLimit = parseInt(actionArgs);
                    $.setIniDbNumber('discordSettings', 'spamLimit', spamLimit);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.spam.limit.set', spamLimit));
                }
            }


            if (action.equalsIgnoreCase('blacklist')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.usage'));
                    return;
                }

                /**
                 * @discordcommandpath moderation blacklist add [phrase] - Adds a word or phrase to the blacklist which will be deleted if said in any channel.
                 */
                if (subAction.equalsIgnoreCase('add')) {
                    if (actionArgs === undefined) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.add.usage'));
                        return;
                    }

                    actionArgs = args.splice(2).join(' ').toLowerCase();
                    $.setIniDbString('discordBlacklist', actionArgs, 'true');
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.add.success'));
                    loadBlackList();
                }

                /**
                 * @discordcommandpath moderation blacklist remove [phrase] - Removes a word or phrase to the blacklist.
                 */
                if (subAction.equalsIgnoreCase('remove')) {
                    if (actionArgs === undefined) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.remove.usage'));
                        return;
                    } else if (!$.inidb.exists('discordBlacklist', args.splice(2).join(' ').toLowerCase())) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.remove.404'));
                        return;
                    }

                    actionArgs = args.splice(2).join(' ').toLowerCase();
                    $.inidb.del('discordBlacklist', actionArgs);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.remove.success'));
                    loadBlackList();
                }

                /**
                 * @discordcommandpath moderation blacklist list - Gives you a list of everything in the blacklist.
                 */
                if (subAction.equalsIgnoreCase('list')) {
                    var keys = $.inidb.GetKeyList('discordBlacklist', ''),
                        temp = [],
                        i;

                    for (i = 0; i < keys.length; i++) {
                        temp.push('#' + i + ': ' + keys[i]);
                    }

                    if (temp.length === 0) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.list.404'));
                        return;
                    }

                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.list', temp.join('\r\n')));
                }
            }

            if (action.equalsIgnoreCase('whitelist')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.usage'));
                    return;
                }

                /**
                 * @discordcommandpath moderation whitelist add [phrase or username#discriminator] - Adds a phrase, word or username that will not get checked by the moderation system.
                 */
                if (subAction.equalsIgnoreCase('add')) {
                    if (actionArgs === undefined) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.add.usage'));
                        return;
                    }

                    actionArgs = args.splice(2).join(' ').toLowerCase();
                    $.setIniDbString('discordWhitelist', actionArgs, 'true');
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.add.success'));
                    loadWhitelist();
                }

                /**
                 * @discordcommandpath moderation whitelist add [phrase or username#discriminator] - Removes that phrase, word or username from the whitelist.
                 */
                if (subAction.equalsIgnoreCase('remove')) {
                    if (actionArgs === undefined) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.remove.usage'));
                        return;
                    } else if (!$.inidb.exists('discordWhitelist', args.splice(2).join(' ').toLowerCase())) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.remove.404'));
                        return;
                    }

                    actionArgs = args.splice(2).join(' ').toLowerCase();
                    $.inidb.del('discordWhitelist', actionArgs);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.remove.success'));
                    loadWhitelist();
                }

                /**
                 * @discordcommandpath moderation whitelist list - Gives you a list of everything in the whitelist.
                 */
                if (subAction.equalsIgnoreCase('list')) {
                    var keys = $.inidb.GetKeyList('discordWhitelist', ''),
                        temp = [],
                        i;

                    for (i = 0; i < keys.length; i++) {
                        temp.push('#' + i + ': ' + keys[i]);
                    }

                    if (temp.length === 0) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.list.404'));
                        return;
                    }

                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.list', temp.join('\r\n')));
                }
            }

            /**
             * @discordcommandpath moderation cleanup [channel] [amount] - Will delete that amount of messages for that channel.
             */
            if (action.equalsIgnoreCase('cleanup')) {
                var resolvedChannel = null;
                if (subAction === undefined || (actionArgs == undefined || isNaN(parseInt(actionArgs)))) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.cleanup.usage'));
                    return;
                } else if (parseInt(actionArgs) > 10000 || parseInt(actionArgs) < 2) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.cleanup.err.amount'));
                    return;
                }

                if (subAction.match(/<#\d+>/)) {
                    resolvedChannel = $.discordAPI.getChannelByID(subAction.match(/<#(\d+)>/)[1]);
                }
                if (resolvedChannel == null) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.cleanup.err.unknownchannel', subAction));
                    return;
                }

                $.discordAPI.bulkDelete(resolvedChannel, parseInt(actionArgs));

                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.cleanup.done', actionArgs));
            }

            if (action.equalsIgnoreCase('logs')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.logs.toggle.usage'));
                    return;
                }

                /**
                 * @discordcommandpath moderation logs toggle - Will toggle if Twitch moderation logs are to be said in Discord. Requires a bot restart.
                 */
                if (subAction.equalsIgnoreCase('toggle')) {
                    modLogs = !modLogs;
                    $.setIniDbBoolean('discordSettings', 'modLogs', modLogs);
                    $.setIniDbBoolean('chatModerator', 'moderationLogs', modLogs);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.logs.toggle', (modLogs ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                }

                /**
                 * @discordcommandpath moderation logs channel [channel name] - Will make Twitch moderator action be announced in that channel.
                 */
                if (subAction.equalsIgnoreCase('channel')) {
                    if (actionArgs === undefined) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.logs.channel.usage'));
                        return;
                    }

                    modLogChannel = $.discord.sanitizeChannelName(args.splice(2).join(' '));
                    $.setIniDbString('discordSettings', 'modLogChannel', modLogChannel);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.logs.channel.set', args.splice(2).join(' ')));
                }
            }
        }
    });

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/core/moderation.js')) {
            reload();
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/core/moderation.js')) {
            $.discord.registerCommand('./discord/core/moderation.js', 'moderation', 1);
            $.discord.registerSubCommand('moderation', 'links', 1);
            $.discord.registerSubCommand('moderation', 'caps', 1);
            $.discord.registerSubCommand('moderation', 'longmessage', 1);
            $.discord.registerSubCommand('moderation', 'spam', 1);
            $.discord.registerSubCommand('moderation', 'blacklist', 1);
            $.discord.registerSubCommand('moderation', 'whitelist', 1);
            $.discord.registerSubCommand('moderation', 'cleanup', 1);
            $.discord.registerSubCommand('moderation', 'logs', 1);

            loadWhitelist();
            loadBlackList();
            setInterval(function() {
                if (spam.length !== 0 && lastMessage - $.systemTime() <= 0) {
                    spam = {};
                    if (permitList.length !== 0) {
                        permitList = {};
                    }
                }
            }, 6e4, 'scripts::discord::core::moderation');
        }
    });
})();
