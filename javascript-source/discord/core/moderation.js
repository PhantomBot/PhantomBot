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
        spamLimit = $.getSetIniDbNumber('discordSettings', 'spamLimit', 5);

    /**
     * @function loadBlackList
     */
    function loadBlackList() {
        var keys = $.inidb.GetKeyList('discordBlacklist', ''),
            i;

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
            if (message.includes(whitelist[i]) || username === whitelist[i]) {
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
    function hasBlackList(username, message) {
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
        $.discordAPI.resolveChannel(channel).deleteMessagesByIds(spam[username].messages).queue();
        delete spam[username];
    }

    /**
     * function timeoutUser
     *
     * @param {String} username
     * @param {String} channel
     * @param {String} message
     */
    function timeoutUser(username, channel, message) {
        $.discordAPI.resolveChannel(channel).deleteMessageById(message).queue();
    }

    /**
     * @event discordMessage
     */
    $.bind('discordMessage', function(event) {
        var sender = event.getSenderId(),
            channel = event.getChannel(),
            message = event.getMessage().toLowerCase(),
            messageLength = message.length();

        if (event.isAdmin() == false && !hasPermit(sender) && !isWhiteList(sender, message)) {
            if (linkToggle && $.discord.pattern.hasLink(message)) {
                timeoutUser(sender, channel, event.getMessageId());
                return;
            }

            if (longMessageToggle && messageLength > longMessageLimit) {
                timeoutUser(sender, channel, event.getMessageId());
                return;
            }

            if (capsToggle && messageLength > capsTriggerLength && (($.discord.pattern.getCapsCount(event.getMessage()) / messageLength) * 100) > capsLimitPercent) {
                timeoutUser(sender, channel, event.getMessageId());
                return;
            }

            if (spamToggle) {
                if (spam[sender] !== undefined) {
                    if (spam[sender].time + 5000 > $.systemTime() && (spam[sender].total + 1) <= spamLimit) {
                        spam[sender].total++; spam[sender].messages.push(event.getMessageId());
                    } else if (spam[sender].time + 5000 < $.systemTime() && (spam[sender].total + 1) <= spamLimit) {
                        spam[sender] = { total: 1, time: $.systemTime(), messages: [event.getMessageId()] };
                    } else {
                        spam[sender].messages.push(event.getMessageId()); 
                        bulkDelete(sender, channel);
                        return;
                    }
                } else {
                    spam[sender] = { total: 1, time: $.systemTime(), messages: [event.getMessageId()] };
                }
            }

            if (hasBlackList(message)) {
                timeoutUser(sender, channel, event.getMessageId());
                return;
            }
        }
        lastMessage = $.systemTime();
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
                if (subAction === undefined || (actionArgs == undefined || isNaN(parseInt(actionArgs)))) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.cleanup.usage'));
                    return;
                } else if (parseInt(actionArgs) > 10000 || parseInt(actionArgs) < 1) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.cleanup.err'));
                    return;
                }

                if ($.discordAPI.isPurging() == true) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.cleanup.failed'));
                } else {
                    if ($.discordAPI.massPurge(subAction, parseInt(actionArgs)) == true) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.cleanup.done', actionArgs));
                    } else {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.cleanup.failed.err'));
                    }
                }
            }
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

            setInterval(function() {
                if (spam.length !== 0 && lastMessage - $.systemTime() <= 0) {
                    spam = {};
                    if (permitList.length !== 0) {
                        permitList = {};
                    }
                }
            }, 6e4);
        }
    });
})();
