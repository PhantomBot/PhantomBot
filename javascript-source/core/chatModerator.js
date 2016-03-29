(function() {
    var permitList = [],
        timeouts = [],
        whiteList = [],
        blackList = [],

        linksToggle = $.getSetIniDbBoolean('chatModerator', 'linksToggle', true),
        linksMessage = $.getSetIniDbString('chatModerator', 'linksMessage', 'you were timed out for linking'),
        linkPermitTime = $.getSetIniDbNumber('chatModerator', 'linkPermitTime', 120),

        capsToggle = $.getSetIniDbBoolean('chatModerator', 'capsToggle', true),
        capsMessage = $.getSetIniDbString('chatModerator', 'capsMessage', 'you were timed out for overusing caps'),
        capsLimitPercent = $.getSetIniDbFloat('chatModerator', 'capsLimitPercent', 50),
        capsTriggerLength = $.getSetIniDbNumber('chatModerator', 'capsTriggerLength', 15),

        spamToggle = $.getSetIniDbBoolean('chatModerator', 'spamToggle', true),
        spamMessage = $.getSetIniDbString('chatModerator', 'spamMessage', 'you were timed out for spamming repeating characters'),
        spamLimit = $.getSetIniDbNumber('chatModerator', 'spamLimit', 15),

        symbolsToggle = $.getSetIniDbBoolean('chatModerator', 'symbolsToggle', true),
        symbolsMessage = $.getSetIniDbString('chatModerator', 'symbolsMessage', 'you were timed out for overusing symbols'),
        symbolsLimitPercent = $.getSetIniDbFloat('chatModerator', 'symbolsLimitPercent', 50),
        symbolsGroupLimit = $.getSetIniDbFloat('chatModerator', 'symbolsGroupLimit', 10),
        symbolsTriggerLength = $.getSetIniDbNumber('chatModerator', 'symbolsTriggerLength', 15),

        emotesToggle = $.getSetIniDbBoolean('chatModerator', 'emotesToggle', false),
        emotesMessage = $.getSetIniDbString('chatModerator', 'emotesMessage', 'you were timed out for overusing emotes'),
        emotesLimit = $.getSetIniDbNumber('chatModerator', 'emotesLimit', 25),

        longMessageToggle = $.getSetIniDbBoolean('chatModerator', 'longMessageToggle', true),
        longMessageMessage = $.getSetIniDbBoolean('chatModerator', 'longMessageMessage',  'you were timed out for posting a long message'),
        longMessageLimit = $.getSetIniDbNumber('chatModerator', 'longMessageLimit', 300),

        colorsToggle = $.getSetIniDbBoolean('chatModerator', 'colorsToggle', false),
        colorsMessage = $.getSetIniDbString('chatModerator', 'colorsMessage', 'you were timed out for using /me.'),

        subscribers = {
            Links: $.getSetIniDbBoolean('chatModerator', 'subscribersModerateLinks', true),
            Caps: $.getSetIniDbBoolean('chatModerator', 'subscribersModerateCaps', true),
            Symbols: $.getSetIniDbBoolean('chatModerator', 'subscribersModerateSymbols', true),
            Spam: $.getSetIniDbBoolean('chatModerator', 'subscribersModerateSpam', true),
            Emotes: $.getSetIniDbBoolean('chatModerator', 'subscribersModerateEmotes', true),
            Colors: $.getSetIniDbBoolean('chatModerator', 'subscribersModerateColors', true),
            LongMsg: $.getSetIniDbBoolean('chatModerator', 'subscribersModerateLongMsg', true),
        },

        regulars = {
            Links: $.getSetIniDbBoolean('chatModerator', 'regularsModerateLinks', true),
            Caps: $.getSetIniDbBoolean('chatModerator', 'regularsModerateCaps', true),
            Symbols: $.getSetIniDbBoolean('chatModerator', 'regularsModerateSymbols', true),
            Spam: $.getSetIniDbBoolean('chatModerator', 'regularsModerateSpam', true),
            Emotes: $.getSetIniDbBoolean('chatModerator', 'regularsModerateEmotes', true),
            Colors: $.getSetIniDbBoolean('chatModerator', 'regularsModerateColors', true),
            LongMsg: $.getSetIniDbBoolean('chatModerator', 'regularsModerateLongMsg', true),
        },

        silentTimeout = {
            Links: $.getSetIniDbBoolean('chatModerator', 'silentTimeoutLinks', false),
            Caps: $.getSetIniDbBoolean('chatModerator', 'silentTimeoutCaps', false),
            Symbols: $.getSetIniDbBoolean('chatModerator', 'silentTimeoutSymbols', false),
            Spam: $.getSetIniDbBoolean('chatModerator', 'silentTimeoutSpam', false),
            Emotes: $.getSetIniDbBoolean('chatModerator', 'silentTimeoutEmotes', false),
            Colors: $.getSetIniDbBoolean('chatModerator', 'silentTimeoutColors', false),
            LongMsg: $.getSetIniDbBoolean('chatModerator', 'silentTimeoutLongMsg', false),
        },

        blacklistMessage = $.getSetIniDbString('chatModerator', 'blacklistMessage', 'you were timed out using a blacklisted phrase'),
        warningTime = $.getSetIniDbNumber('chatModerator', 'warningTime', 5),
        timeoutTime = $.getSetIniDbNumber('chatModerator', 'timeoutTime', 600),
        msgCooldownSec = $.getSetIniDbNumber('chatModerator', 'msgCooldownSec', 20),
        warning = '',
        resetTime = (60 * 60 * 1000) + $.systemTime(),
        messageTime = 0,
        messageReset = 0,
        i;

    /**
     * @function reloadModeration
     * To be called by the panel to update the chatmod settings after updating the DB directly.
     */
    function reloadModeration() {
        linksToggle = $.getIniDbBoolean('chatModerator', 'linksToggle');
        linksMessage = $.getIniDbString('chatModerator', 'linksMessage');
        linkPermitTime = $.getIniDbNumber('chatModerator', 'linkPermitTime');

        capsToggle = $.getIniDbBoolean('chatModerator', 'capsToggle');
        capsMessage = $.getIniDbString('chatModerator', 'capsMessage');
        capsLimitPercent = $.getIniDbFloat('chatModerator', 'capsLimitPercent');
        capsTriggerLength = $.getIniDbNumber('chatModerator', 'capsTriggerLength');

        spamToggle = $.getIniDbBoolean('chatModerator', 'spamToggle');
        spamMessage = $.getIniDbString('chatModerator', 'spamMessage');
        spamLimit = $.getIniDbNumber('chatModerator', 'spamLimit');

        symbolsToggle = $.getIniDbBoolean('chatModerator', 'symbolsToggle');
        symbolsMessage = $.getIniDbString('chatModerator', 'symbolsMessage');
        symbolsLimitPercent = $.getIniDbFloat('chatModerator', 'symbolsLimitPercent');
        symbolsGroupLimit = $.getIniDbFloat('chatModerator', 'symbolsGroupLimit');
        symbolsTriggerLength = $.getIniDbNumber('chatModerator', 'symbolsTriggerLength');

        emotesToggle = $.getIniDbBoolean('chatModerator', 'emotesToggle');
        emotesMessage = $.getIniDbString('chatModerator', 'emotesMessage');
        emotesLimit = $.getIniDbNumber('chatModerator', 'emotesLimit');

        longMessageToggle = $.getIniDbBoolean('chatModerator', 'longMessageToggle');
        longMessageMessage = $.getIniDbBoolean('chatModerator', 'longMessageMessage');
        longMessageLimit = $.getIniDbNumber('chatModerator', 'longMessageLimit');

        colorsToggle = $.getIniDbBoolean('chatModerator', 'colorsToggle');
        colorsMessage = $.getIniDbString('chatModerator', 'colorsMessage');

        subscribers = {
            Links: $.getIniDbBoolean('chatModerator', 'subscribersModerateLinks'),
            Caps: $.getIniDbBoolean('chatModerator', 'subscribersModerateCaps'),
            Symbols: $.getIniDbBoolean('chatModerator', 'subscribersModerateSymbols'),
            Spam: $.getIniDbBoolean('chatModerator', 'subscribersModerateSpam'),
            Emotes: $.getIniDbBoolean('chatModerator', 'subscribersModerateEmotes'),
            Colors: $.getIniDbBoolean('chatModerator', 'subscribersModerateColors'),
            LongMsg: $.getIniDbBoolean('chatModerator', 'subscribersModerateLongMsg'),
        };

        regulars = {
            Links: $.getIniDbBoolean('chatModerator', 'regularsModerateLinks'),
            Caps: $.getIniDbBoolean('chatModerator', 'regularsModerateCaps'),
            Symbols: $.getIniDbBoolean('chatModerator', 'regularsModerateSymbols'),
            Spam: $.getIniDbBoolean('chatModerator', 'regularsModerateSpam'),
            Emotes: $.getIniDbBoolean('chatModerator', 'regularsModerateEmotes'),
            Colors: $.getIniDbBoolean('chatModerator', 'regularsModerateColors'),
            LongMsg: $.getIniDbBoolean('chatModerator', 'regularsModerateLongMsg'),
        };

        silentTimeout = {
            Links: $.getIniDbBoolean('chatModerator', 'silentTimeoutLinks'),
            Caps: $.getIniDbBoolean('chatModerator', 'silentTimeoutCaps'),
            Symbols: $.getIniDbBoolean('chatModerator', 'silentTimeoutSymbols'),
            Spam: $.getIniDbBoolean('chatModerator', 'silentTimeoutSpam'),
            Emotes: $.getIniDbBoolean('chatModerator', 'silentTimeoutEmotes'),
            Colors: $.getIniDbBoolean('chatModerator', 'silentTimeoutColors'),
            LongMsg: $.getIniDbBoolean('chatModerator', 'silentTimeoutLongMsg'),
        };

        blacklistMessage = $.getIniDbString('chatModerator', 'blacklistMessage');
        warningTime = $.getIniDbNumber('chatModerator', 'warningTime', 5);
        timeoutTime = $.getIniDbNumber('chatModerator', 'timeoutTime', 600);

        loadBlackList();
        loadWhiteList();
    }

    /**
     * @function loadBlackList
     */
    function loadBlackList() {
        var keys = $.inidb.GetKeyList('blackList', '');
        for (i in keys) {
            blackList.push($.inidb.get('blackList', keys[i]));
        }
    };

    /**
     * @function loadWhiteList
     */
    function loadWhiteList() {
        var keys = $.inidb.GetKeyList('whiteList', '');
        for (i in keys) {
            whiteList.push($.inidb.get('whiteList', keys[i]));
        }
    };

    /**
     * @function timeoutUserFor
     */
    function timeoutUserFor(user, time) {
        $.say('.timeout ' + user + ' ' + time);
        setTimeout(function() {
            $.say('.timeout ' + user + ' ' + time);
        }, 1000);
    };

    /**
     * @function timeout
     */
    function timeout(user) {
        for (i in timeouts) {
            if (timeouts[i].user.equalsIgnoreCase(user)) {
                var time = timeouts[i].time - $.systemTime();
                if (time > 0) {
                    timeoutUserFor(user, timeoutTime);
                    timeouts.splice(i, 1);
                    timeouts.push({user: user, time: resetTime});
                    panelLog();
                    warning = $.lang.get('chatmoderator.timeout');
                } else {
                    timeoutUserFor(user, warningTime);
                    timeouts.splice(i, 1);
                    timeouts.push({user: user, time: resetTime});
                    panelLog();
                    warning = $.lang.get('chatmoderator.warning');
                }
                return;
            }
        }
        timeoutUserFor(user, warningTime);
        timeouts.push({user: user, time: resetTime});
        panelLog();
        warning = $.lang.get('chatmoderator.warning');
    };

    /**
     * @function panelLog
     */
    function panelLog() {
        if ($.bot.isModuleEnabled('./handlers/panelHandler.js')) {
            $.panelDB.updateModLinesDB();
        }
    };

    /**
     * @function sendMessage
     */
    function sendMessage(user, message, filter) {
        messageReset = messageTime - $.systemTime();
        if (messageReset <= 0) {
            if (!filter) {
                $.say('@' + $.username.resolve(user) + ', ' + message + ' ' + warning);
            }
        }
        messageTime = (msgCooldownSec * 1000) + $.systemTime();
    };

    /**
     * @function permitUser
     */
    function permitUser(user) {
        permitList.push(user);
        var c = setTimeout(function() {
            for (i in permitList) {
                if (permitList[i].equalsIgnoreCase(user)) {
                    permitList.splice(i, 1);
                    break;
                }
            }
            clearTimeout(c);
        }, (linkPermitTime * 1000));
    };

    /**
     * @function getModerationFilterStatus
     */
    function getModerationFilterStatus(filter) {
        return (filter ? $.lang.get('common.enabled') : $.lang.get('common.disabled'));
    };

    /**
     * @function getSatusCheck
     */
    function getSatusCheck(filter) {
        return (filter ? 'not allowed' : 'allowed');
    }

    /**
     * @function checkBlackList
     */
    function checkBlackList(event) {
        var sender = event.getSender(),
            message = event.getMessage().toLowerCase();

        for (i in blackList) {
            if (message.contains(blackList[i].toLowerCase())) {
                timeoutUser(sender, timeoutTime);
                warning = $.lang.get('chatmoderator.timeout');
                sendMessage(sender, blacklistMessage);
                return true;
            }
        }
        return false;
    };

    /**
     * @function checkPermitList
     */
    function checkPermitList(event) {
        var sender = event.getSender(),
            message = event.getMessage().toLowerCase();

        for (i in permitList) {
            if (permitList[i].equalsIgnoreCase(sender) && $.patternDetector.hasLinks(event)) {
                permitList.splice(i, 1);
                return true;
            }
        }
        return false;
    };

    /**
     * @function checkWhiteList
     */
    function checkWhiteList(event) {
        var sender = event.getSender(),
            message = event.getMessage().toLowerCase();

        for (i in whiteList) {
            if (message.contains(whiteList[i])) {
                return true;
            }
        }
        return false;
    };

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        var sender = event.getSender(),
            message = event.getMessage(),
            messageLength = message.length();

        if (!$.isModv3(sender, event.getTags())) {
            if (message && checkBlackList(event)) {
                return;
            }
            
            if (linksToggle && $.patternDetector.hasLinks(event)) {
                if ($.youtubePlayerConnected && message.contains('youtube.com') || message.contains('youtu.be')) {
                    return;
                }

                if (message && checkPermitList(event) || checkWhiteList(event)) {
                    return;
                }

                if (!regulars.Links && $.isReg(sender) || !subscribers.Links && $.isSubv3(sender, event.getTags())) {
                    return;
                }

                timeout(sender);
                sendMessage(sender, linksMessage, silentTimeout.Links);
                $.logEvent('chatModerator.js', 269, sender + ' was timed out for linking.');
                return;
            }

            if (capsToggle && messageLength > capsTriggerLength) {
                if (((parseFloat($.patternDetector.getNumberOfCaps(event)) / messageLength) * 100) > capsLimitPercent) {
                    if (!regulars.Caps && $.isReg(sender) || !subscribers.Caps && $.isSubv3(sender, event.getTags())) {
                        return;
                    }
                    timeout(sender);
                    sendMessage(sender, capsMessage, silentTimeout.Caps);
                    $.logEvent('chatModerator.js', 280, sender + ' was timed out for overusing caps.');
                    return;
                }
            }

            if (symbolsToggle && messageLength > symbolsTriggerLength) {
                if ($.patternDetector.getLongestNonLetterSequence(event) > symbolsGroupLimit || ((parseFloat($.patternDetector.getNumberOfNonLetters(event)) / messageLength) * 100) > symbolsLimitPercent) {
                    if (!regulars.Symbols && $.isReg(sender) || !subscribers.Symbols && $.isSubv3(sender, event.getTags())) {
                        return;
                    }
                    timeout(sender);
                    sendMessage(sender, symbolsMessage, silentTimeout.Symbols);
                    $.logEvent('chatModerator.js', 292, sender + ' was timed out for overusing symbols.');
                    return;
                }
            }

            if (spamToggle && $.patternDetector.getLongestRepeatedSequence(event) > spamLimit) {
                if (!regulars.Spam && $.isReg(sender) || !subscribers.Spam && $.isSubv3(sender, event.getTags())) {
                    return;
                }
                timeout(sender);
                sendMessage(sender, spamMessage, silentTimeout.Spam);
                $.logEvent('chatModerator.js', 303, sender + ' was timed out for spamming.');
                return;
            }

            if (emotesToggle && $.patternDetector.getNumberOfEmotes(event) > emotesLimit) {
                if (!regulars.Emotes && $.isReg(sender) || !subscribers.Emotes && $.isSubv3(sender, event.getTags())) {
                    return;
                }
                timeout(sender);
                sendMessage(sender, emotesMessage, silentTimeout.Emotes);
                $.logEvent('chatModerator.js', 313, sender + ' was timed out for overusing emotes.');
                return;
            }

            if (colorsToggle && message.startsWith('/me')) {
                if (!regulars.Colors && $.isReg(sender) || !subscribers.Colors && $.isSubv3(sender, event.getTags())) {
                    return;
                }
                timeout(sender);
                sendMessage(sender, colorsMessage, silentTimeout.Colors);
                $.logEvent('chatModerator.js', 323, sender + ' was timed out for using /me');
                return;
            }

            if (longMessageToggle && messageLength > longMessageLimit) {
                if (!regulars.LongMsg && $.isReg(sender) || !subscribers.LongMsg && $.isSubv3(sender, event.getTags())) {
                    return;
                }
                timeout(sender);
                sendMessage(sender, longMessageMessage, silentTimeout.LongMsg);
                $.logEvent('chatModerator.js', 333, sender + ' was timed out for posting a long message.');
            }
        }
    });

    /**
     * @function moderationCommand
     * @param event
     */
    function moderationCommand(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argString = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /**
         * @commandpath moderation - Shows usage for the various chat moderation options
         */
        if (command.equalsIgnoreCase('moderation') || command.equalsIgnoreCase('mod')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.usage.toggles'));
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.usage.messages'));
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.options'));
                return;
            }

            /**
             * @commandpath moderation links [on / off] - Enable/Disable the link filter
             */
            if (action.equalsIgnoreCase('links')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.link.usage', getModerationFilterStatus(linksToggle)));
                    return;
                }

                if (subAction.equalsIgnoreCase('on')) {
                    linksToggle = true;
                    $.inidb.set('chatModerator', 'linksToggle', linksToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.link.filter.enabled'));
                    $.logEvent('chatModerator.js', 518, 'Link filter has been enabled by ' + sender);
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    linksToggle = false;
                    $.inidb.set('chatModerator', 'linksToggle', linksToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.link.filter.disabled'));
                    $.logEvent('chatModerator.js', 524, 'Link filter was disabled by ' + sender);
                    return;
                }
            }

            /**
             * @commandpath moderation caps [on / off] - Enable/Disable the caps filter
             */
            if (action.equalsIgnoreCase('caps')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.caps.usage', getModerationFilterStatus(capsToggle)));
                    return;
                }

                if (subAction.equalsIgnoreCase('on')) {
                    capsToggle = true;
                    $.inidb.set('chatModerator', 'capsToggle', capsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.caps.filter.enabled'));
                    $.logEvent('chatModerator.js', 542, 'Caps filter was enabled by ' + sender);
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    capsToggle = false;
                    $.inidb.set('chatModerator', 'capsToggle', capsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.caps.filter.disabled'));
                    $.logEvent('chatModerator.js', 548, 'Caps filter was disabled by ' + sender);
                    return;
                }
            }

            /**
             * @commandpath moderation spam [on / off] - Enable/Disable the spam filter
             */
            if (action.equalsIgnoreCase('spam')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.spam.usage', getModerationFilterStatus(spamToggle)));
                    return;
                }

                if (subAction.equalsIgnoreCase('on')) {
                    spamToggle = true;
                    $.inidb.set('chatModerator', 'spamToggle', spamToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.spam.filter.enabled'));
                    $.logEvent('chatModerator.js', 566, 'Spam filter was enabled by ' + sender);
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    spamToggle = false;
                    $.inidb.set('chatModerator', 'spamToggle', spamToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.spam.filter.disabled'));
                    $.logEvent('chatModerator.js', 572, 'Spam filter was disabled by ' + sender);
                    return;
                }
            }

            /**
             * @commandpath moderation symbols [on / off] - Enable/Disable the symbol filter
             */
            if (action.equalsIgnoreCase('symbols')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.symbols.usage', getModerationFilterStatus(symbolsToggle)));
                    return;
                }

                if (subAction.equalsIgnoreCase('on')) {
                    symbolsToggle = true;
                    $.inidb.set('chatModerator', 'symbolsToggle', symbolsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.symbols.filter.enabled'));
                    $.logEvent('chatModerator.js', 590, 'Symbols filter was enabled by ' + sender);
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    symbolsToggle = false;
                    $.inidb.set('chatModerator', 'symbolsToggle', symbolsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.symbols.filter.disabled'));
                    $.logEvent('chatModerator.js', 596, 'Symbols filter was enabled by ' + sender);
                    return;
                }
            }

            /**
             * @commandpath moderation emotes [on / off] - Enable/Disable the emotes filter
             */
            if (action.equalsIgnoreCase('emotes')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.emotes.usage', getModerationFilterStatus(emotesToggle)));
                    return;
                }

                if (subAction.equalsIgnoreCase('on')) {
                    emotesToggle = true;
                    $.inidb.set('chatModerator', 'emotesToggle', emotesToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.emotes.filter.enabled'));
                    $.logEvent('chatModerator.js', 614, 'Emotes filter was enabled by ' + sender);
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    emotesToggle = false;
                    $.inidb.set('chatModerator', 'emotesToggle', emotesToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.emotes.filter.disabled'));
                    $.logEvent('chatModerator.js', 620, 'Emotes filter was disabled by ' + sender);
                    return;
                }
            }

            /**
             * @commandpath moderation colors [on / off] - Enable/Disable the message color filter
             */
            if (action.equalsIgnoreCase('colors')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.colors.usage', getModerationFilterStatus(colorsToggle)));
                    return;
                }

                if (subAction.equalsIgnoreCase('on')) {
                    colorsToggle = true;
                    $.inidb.set('chatModerator', 'colorsToggle', colorsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.colors.filter.enabled'));
                    $.logEvent('chatModerator.js', 638, 'Colors filter was enabled by ' + sender);
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    colorsToggle = false;
                    $.inidb.set('chatModerator', 'colorsToggle', colorsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.colors.filter.disabled'));
                    $.logEvent('chatModerator.js', 644, 'Colors filter was disabled by ' + sender);
                    return;
                }
            }

            /**
             * @commandpath moderation longmessages [on / off] - Enable/Disable the longmessages filter
             */
            if (action.equalsIgnoreCase('longmessages')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.message.usage', getModerationFilterStatus(longMessageToggle)));
                    return;
                }

                if (subAction.equalsIgnoreCase('on')) {
                    longMessageToggle = true;
                    $.inidb.set('chatModerator', 'longMessageToggle', longMessageToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.message.filter.enabled'));
                    $.logEvent('chatModerator.js', 662, 'Long message filter was enabled by ' + sender);
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    longMessageToggle = false;
                    $.inidb.set('chatModerator', 'longMessageToggle', longMessageToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.message.filter.disabled'));
                    $.logEvent('chatModerator.js', 668, 'Long message filter was disabled by ' + sender);
                    return;
                }
            }

            /**
             * @commandpath moderation regulars [links / caps / symbols / spam / emotes / colors / longmessages] [true / false] - Enable or disable if regulars get moderated by that filter
             */
            if (action.equalsIgnoreCase('regulars')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.usage'));
                    return;
                }

                if (subAction.equalsIgnoreCase('links')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.toggle.link', getSatusCheck(regulars.Links)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        regulars.Links = true;
                        $.inidb.set('chatModerator', 'regularsModerateLinks', regulars.Links);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.links.allowed'));
                        $.logEvent('chatModerator.js', 691, sender + ' changed regulars moderation for links to true');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        regulars.Links = false;
                        $.inidb.set('chatModerator', 'regularsModerateLinks', regulars.Links);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.links.not.allowed'));
                        $.logEvent('chatModerator.js', 696, sender + ' changed regulars moderation for links to false');
                    }
                } else if (subAction.equalsIgnoreCase('caps')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.toggle.caps', getSatusCheck(regulars.Caps)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        regulars.Caps = true;
                        $.inidb.set('chatModerator', 'regularsModerateCaps', regulars.Caps);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.caps.allowed'));
                        $.logEvent('chatModerator.js', 707, sender + ' changed regulars moderation for caps to true');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        regulars.Caps = false;
                        $.inidb.set('chatModerator', 'regularsModerateCaps', regulars.Caps);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.caps.not.allowed'));
                        $.logEvent('chatModerator.js', 712, sender + ' changed regulars moderation for caps to false');
                    }
                } else if (subAction.equalsIgnoreCase('symbols')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.toggle.symbols', getSatusCheck(regulars.Symbols)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        regulars.Symbols = true;
                        $.inidb.set('chatModerator', 'regularsModerateSymbols', regulars.Symbols);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.symbols.allowed'));
                        $.logEvent('chatModerator.js', 723, sender + ' changed regulars moderation for symbols to true');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        regulars.Symbols = false;
                        $.inidb.set('chatModerator', 'regularsModerateSymbols', regulars.Symbols);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.symbols.not.allowed'));
                        $.logEvent('chatModerator.js', 728, sender + ' changed regulars moderation for symbols to false');
                    }
                } else if (subAction.equalsIgnoreCase('spam')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.toggle.spam', getSatusCheck(regulars.Spam)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        regulars.Spam = true;
                        $.inidb.set('chatModerator', 'regularsModerateSpam', regulars.Spam);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.spam.allowed'));
                        $.logEvent('chatModerator.js', 739, sender + ' changed regulars moderation for spam to true');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        regulars.Spam = false;
                        $.inidb.set('chatModerator', 'regularsModerateSpam', regulars.Spam);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.spam.not.allowed'));
                        $.logEvent('chatModerator.js', 744, sender + ' changed regulars moderation for spam to false');
                    }
                } else if (subAction.equalsIgnoreCase('emotes')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.toggle.emotes', getSatusCheck(regulars.Emotes)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        regulars.Emotes = true;
                        $.inidb.set('chatModerator', 'regularsModerateEmotes', regulars.Emotes);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.emotes.allowed'));
                        $.logEvent('chatModerator.js', 755, sender + ' changed regulars moderation for emotes to true');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        regulars.Emotes = false;
                        $.inidb.set('chatModerator', 'regularsModerateEmotes', regulars.Emotes);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.emotes.not.allowed'));
                        $.logEvent('chatModerator.js', 760, sender + ' changed regulars moderation for emotes to false');
                    }
                } else if (subAction.equalsIgnoreCase('colors')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.toggle.colors', getSatusCheck(regulars.Colors)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        regulars.Colors = true;
                        $.inidb.set('chatModerator', 'regularsModerateColors', regulars.Colors);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.colors.allowed'));
                        $.logEvent('chatModerator.js', 771, sender + ' changed regulars moderation for colors to true');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        regulars.Colors = false;
                        $.inidb.set('chatModerator', 'regularsModerateColors', regulars.Colors);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.colors.not.allowed'));
                        $.logEvent('chatModerator.js', 776, sender + ' changed regulars moderation for colors to false');
                    }
                } else if (subAction.equalsIgnoreCase('longmessages')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.toggle.long.msg', getSatusCheck(regulars.LongMsg)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        regulars.LongMsg = true;
                        $.inidb.set('chatModerator', 'regularsModerateLongMsg', regulars.LongMsg);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.long.messages.allowed'));
                        $.logEvent('chatModerator.js', 787, sender + ' changed regulars moderation for long messages to true');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        regulars.LongMsg = false;
                        $.inidb.set('chatModerator', 'regularsModerateLongMsg', regulars.LongMsg);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.long.messages.not.allowed'));
                        $.logEvent('chatModerator.js', 792, sender + ' changed regulars moderation for long messages to false');
                    }
                }
            }

            /**
             * @commandpath moderation subscribers [links / caps / symbols / spam / emotes / colors / longmessages] [true / false] - Enable or disable if subscribers get moderated by that filter
             */
            if (action.equalsIgnoreCase('subscribers')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.usage'));
                    return;
                }

                if (subAction.equalsIgnoreCase('links')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.toggle.link', getSatusCheck(subscribers.Links)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        subscribers.Links = true;
                        $.inidb.set('chatModerator', 'subscribersModerateLinks', subscribers.Links);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.links.allowed'));
                        $.logEvent('chatModerator.js', 691, sender + ' changed subscribers moderation for links to true');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        subscribers.Links = false;
                        $.inidb.set('chatModerator', 'subscribersModerateLinks', subscribers.Links);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.links.not.allowed'));
                        $.logEvent('chatModerator.js', 696, sender + ' changed subscribers moderation for links to false');
                    }
                } else if (subAction.equalsIgnoreCase('caps')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.toggle.caps', getSatusCheck(subscribers.Caps)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        subscribers.Caps = true;
                        $.inidb.set('chatModerator', 'subscribersModerateCaps', subscribers.Caps);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.caps.allowed'));
                        $.logEvent('chatModerator.js', 707, sender + ' changed subscribers moderation for caps to true');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        subscribers.Caps = false;
                        $.inidb.set('chatModerator', 'subscribersModerateCaps', subscribers.Caps);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.caps.not.allowed'));
                        $.logEvent('chatModerator.js', 712, sender + ' changed subscribers moderation for caps to false');
                    }
                } else if (subAction.equalsIgnoreCase('symbols')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.toggle.symbols', getSatusCheck(subscribers.Symbols)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        subscribers.Symbols = true;
                        $.inidb.set('chatModerator', 'subscribersModerateSymbols', subscribers.Symbols);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.symbols.allowed'));
                        $.logEvent('chatModerator.js', 723, sender + ' changed subscribers moderation for symbols to true');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        subscribers.Symbols = false;
                        $.inidb.set('chatModerator', 'subscribersModerateSymbols', subscribers.Symbols);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.symbols.not.allowed'));
                        $.logEvent('chatModerator.js', 728, sender + ' changed subscribers moderation for symbols to false');
                    }
                } else if (subAction.equalsIgnoreCase('spam')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.toggle.spam', getSatusCheck(subscribers.Spam)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        subscribers.Spam = true;
                        $.inidb.set('chatModerator', 'subscribersModerateSpam', subscribers.Spam);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.spam.allowed'));
                        $.logEvent('chatModerator.js', 739, sender + ' changed subscribers moderation for spam to true');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        subscribers.Spam = false;
                        $.inidb.set('chatModerator', 'subscribersModerateSpam', subscribers.Spam);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.spam.not.allowed'));
                        $.logEvent('chatModerator.js', 744, sender + ' changed subscribers moderation for spam to false');
                    }
                } else if (subAction.equalsIgnoreCase('emotes')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.toggle.emotes', getSatusCheck(subscribers.Emotes)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        subscribers.Emotes = true;
                        $.inidb.set('chatModerator', 'subscribersModerateEmotes', subscribers.Emotes);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.emotes.allowed'));
                        $.logEvent('chatModerator.js', 755, sender + ' changed subscribers moderation for emotes to true');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        subscribers.Emotes = false;
                        $.inidb.set('chatModerator', 'subscribersModerateEmotes', subscribers.Emotes);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.emotes.not.allowed'));
                        $.logEvent('chatModerator.js', 760, sender + ' changed subscribers moderation for emotes to false');
                    }
                } else if (subAction.equalsIgnoreCase('colors')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.toggle.colors', getSatusCheck(subscribers.Colors)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        subscribers.Colors = true;
                        $.inidb.set('chatModerator', 'subscribersModerateColors', subscribers.Colors);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.colors.allowed'));
                        $.logEvent('chatModerator.js', 771, sender + ' changed subscribers moderation for colors to true');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        subscribers.Colors = false;
                        $.inidb.set('chatModerator', 'subscribersModerateColors', subscribers.Colors);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.colors.not.allowed'));
                        $.logEvent('chatModerator.js', 776, sender + ' changed subscribers moderation for colors to false');
                    }
                } else if (subAction.equalsIgnoreCase('longmessages')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.toggle.long.msg', getSatusCheck(subscribers.LongMsg)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        subscribers.LongMsg = true;
                        $.inidb.set('chatModerator', 'subscribersModerateLongMsg', subscribers.LongMsg);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.long.messages.allowed'));
                        $.logEvent('chatModerator.js', 787, sender + ' changed subscribers moderation for long messages to true');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        subscribers.LongMsg = false;
                        $.inidb.set('chatModerator', 'subscribersModerateLongMsg', subscribers.LongMsg);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.long.messages.not.allowed'));
                        $.logEvent('chatModerator.js', 792, sender + ' changed subscribers moderation for long messages to false');
                    }
                }
            }

            /**
             * @commandpath moderation silenttimeout [links / caps / symbols / spam / emotes / colors / longmessages] [true / false] - Enable or disable if the warning and timeout message will be said for that filter
             */
            if (action.equalsIgnoreCase('silenttimeout')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.usage'));
                    return;
                }
                
                if (subAction.equalsIgnoreCase('links')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.toggle.links', getModerationFilterStatus(silentTimeout.Links)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        silentTimeout.Links = true;
                        $.inidb.set('chatModerator', 'silentTimeoutLinks', silentTimeout.Links);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.links.true'));
                        $.logEvent('chatModerator.js', 939, sender + ' enabled silent timeout for links');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        silentTimeout.Links = false;
                        $.inidb.set('chatModerator', 'silentTimeoutLinks', silentTimeout.Links);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.links.false'));
                        $.logEvent('chatModerator.js', 944, sender + ' disabled silent timeout for links');
                    }
                } else if (subAction.equalsIgnoreCase('caps')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.toggle.caps', getSatusCheck(silentTimeout.Caps)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        silentTimeout.Caps = true;
                        $.inidb.set('chatModerator', 'silentTimeoutCaps', silentTimeout.Caps);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.caps.true'));
                        $.logEvent('chatModerator.js', 955, sender + ' enabled silent timeout for caps');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        silentTimeout.Caps = false;
                        $.inidb.set('chatModerator', 'silentTimeoutCaps', silentTimeout.Caps);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.caps.false'));
                        $.logEvent('chatModerator.js', 960, sender + ' disabled silent timeout for caps');
                    }
                } else if (subAction.equalsIgnoreCase('symbols')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.toggle.symbols', getSatusCheck(silentTimeout.Symbols)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        silentTimeout.Symbols = true;
                        $.inidb.set('chatModerator', 'silentTimeoutSymbols', silentTimeout.Symbols);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.symbols.true'));
                        $.logEvent('chatModerator.js', 971, sender + ' enabled silent timeout for symbols');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        silentTimeout.Symbols = false;
                        $.inidb.set('chatModerator', 'silentTimeoutSymbols', silentTimeout.Symbols);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.symbols.false'));
                        $.logEvent('chatModerator.js', 976, sender + ' disabled silent timeout for symbols');
                    }
                } else if (subAction.equalsIgnoreCase('spam')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.toggle.spam', getSatusCheck(silentTimeout.Spam)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        silentTimeout.Spam = true;
                        $.inidb.set('chatModerator', 'silentTimeoutSpam', silentTimeout.Spam);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.spam.true'));
                        $.logEvent('chatModerator.js', 987, sender + ' enabled silent timeout for spam');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        silentTimeout.Spam = false;
                        $.inidb.set('chatModerator', 'silentTimeoutSpam', silentTimeout.Spam);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.spam.false'));
                        $.logEvent('chatModerator.js', 992, sender + ' disabled silent timeout for spam');
                    }
                } else if (subAction.equalsIgnoreCase('emotes')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.toggle.emotes', getSatusCheck(silentTimeout.Emotes)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        silentTimeout.Emotes = true;
                        $.inidb.set('chatModerator', 'silentTimeoutEmotes', silentTimeout.Emotes);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.emotes.true'));
                        $.logEvent('chatModerator.js', 1003, sender + ' enabled silent timeout for emotes');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        silentTimeout.Emotes = false;
                        $.inidb.set('chatModerator', 'silentTimeoutEmotes', silentTimeout.Emotes);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.emotes.false'));
                        $.logEvent('chatModerator.js', 1008, sender + ' disabled silent timeout for emotes');
                    }
                } else if (subAction.equalsIgnoreCase('colors')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.toggle.colors', getSatusCheck(silentTimeout.Colors)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        silentTimeout.Colors = true;
                        $.inidb.set('chatModerator', 'silentTimeoutColors', silentTimeout.Colors);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.colors.true'));
                        $.logEvent('chatModerator.js', 1019, sender + ' enabled silent timeout for colors');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        silentTimeout.Colors = false;
                        $.inidb.set('chatModerator', 'silentTimeoutColors', silentTimeout.Colors);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.colors.false'));
                        $.logEvent('chatModerator.js', 1024, sender + ' disabled silent timeout for colors');
                    }
                } else if (subAction.equalsIgnoreCase('longmessages')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.toggle.long.msg', getSatusCheck(silentTimeout.LongMsg)));
                        return;
                    }
                    if (args[2].equalsIgnoreCase('true')) {
                        silentTimeout.LongMsg = true;
                        $.inidb.set('chatModerator', 'silentTimeoutLongMsg', silentTimeout.LongMsg);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.long.messages.true'));
                        $.logEvent('chatModerator.js', 1035, sender + ' enabled silent timeout for long messages');
                    } else if (args[2].equalsIgnoreCase('false')) {
                        silentTimeout.LongMsg = false;
                        $.inidb.set('chatModerator', 'silentTimeoutLongMsg', silentTimeout.LongMsg);
                        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.silenttimeout.long.messages.false'));
                        $.logEvent('chatModerator.js', 1040, sender + ' disabled silent timeout for long messages');
                    }
                }
            }

            /**
             * @commandpath moderation linksmessage [message] - Sets the link warning message
             */
            if (action.equalsIgnoreCase('linksmessage')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.link.message.usage'));
                    return;
                }
                linksMessage = argString.replace(action, '').trim();
                $.inidb.set('chatModerator', 'linksMessage', linksMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.link.message.set', linksMessage));
                $.logEvent('chatModerator.js', 1056, sender + ' changed the links warning message to "' + linksMessage + '"');
                return;
            }

            /**
             * @commandpath moderation capsmessage [message] - Sets the cap warning message
             */
            if (action.equalsIgnoreCase('capsmessage')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.caps.message.usage'));
                    return;
                }
                capsMessage = argString.replace(action, '').trim();
                $.inidb.set('chatModerator', 'capsMessage', capsMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.caps.message.set', capsMessage));
                $.logEvent('chatModerator.js', 1071, sender + ' changed the caps warning message to "' + capsMessage + '"');
                return;
            }

            /**
             * @commandpath moderation symbolsmessage [message] - Sets the symbols warning message
             */
            if (action.equalsIgnoreCase('symbolsmessage')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.symbols.message.usage'));
                    return;
                }
                symbolsMessage = argString.replace(action, '').trim();
                $.inidb.set('chatModerator', 'symbolsMessage', symbolsMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.symbols.message.set', symbolsMessage));
                $.logEvent('chatModerator.js', 1086, sender + ' changed the symbols warning message to "' + symbolsMessage + '"');
                return;
            }

            /**
             * @commandpath moderation emotesmessage [message] - Sets the emotes warning message
             */
            if (action.equalsIgnoreCase('emotesmessage')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.emotes.message.usage'));
                    return;
                }
                emotesMessage = argString.replace(action, '').trim();
                $.inidb.set('chatModerator', 'emotesMessage', emotesMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.emotes.message.set', emotesMessage));
                $.logEvent('chatModerator.js', 1101, sender + ' changed the emotes warning message to "' + emotesMessage + '"');
                return;
            }

            /**
             * @commandpath moderation colorsmessage [message] - Sets the color warning message
             */
            if (action.equalsIgnoreCase('colorsmessage')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.colors.message.usage'));
                    return;
                }
                colorsMessage = argString.replace(action, '').trim();
                $.inidb.set('chatModerator', 'colorsMessage', colorsMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.colors.message.set', colorsMessage));
                $.logEvent('chatModerator.js', 1116, sender + ' changed the colors warning message to "' + colorsMessage + '"');
                return;
            }

            /**
             * @commandpath moderation longmsgmessage [message] - Sets the long message warning message
             */
            if (action.equalsIgnoreCase('longmsgmessage')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.message.message.usage'));
                    return;
                }
                longMessageMessage = argString.replace(action, '').trim();
                $.inidb.set('chatModerator', 'longMessageMessage', longMessageMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.message.message.set', longMessageMessage));
                $.logEvent('chatModerator.js', 1131, sender + ' changed the long messages warning message to "' + longMessageMessage + '"');
                return;
            }

            /**
             * @commandpath moderation spammessage [message] - Sets the spam warning message
             */
            if (action.equalsIgnoreCase('spammessage')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.spam.message.usage'));
                    return;
                }
                spamMessage = argString.replace(action, '').trim();
                $.inidb.set('chatModerator', 'spamMessage', spamMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.spam.message.set', spamMessage));
                $.logEvent('chatModerator.js', 1146, sender + ' changed the spam warning message to "' + spamMessage + '"');
                return;
            }

            /**
             * @commandpath moderation blacklistmessage [message] - Sets the blacklist warning message
             */
            if (action.equalsIgnoreCase('blacklistmessage')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.blacklist.message.usage'));
                    return;
                }
                blacklistMessage = argString.replace(action, '').trim();
                $.inidb.set('chatModerator', 'blacklistMessage', blacklistMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.blacklist.message.set', blacklistMessage));
                $.logEvent('chatModerator.js', 1161, sender + ' changed the spam warning message to "' + blacklistMessage + '"');
                return;
            }

            /**
             * @commandpath moderation permittime [seconds] - Sets the permit time in seconds
             */
            if (action.equalsIgnoreCase('permittime')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.permit.time.usage'));
                    return;
                }
                linkPermitTime = parseInt(subAction);
                $.inidb.set('chatModerator', 'linkPermitTime', linkPermitTime);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.permit.time.set', linkPermitTime));
                $.logEvent('chatModerator.js', 1176, sender + ' changed the link permit time to ' + linkPermitTime + ' seconds');
                return;
            }

            /**
             * @commandpath moderation capslimit [amount] - Sets the amount (in percent) of caps allowed in a message
             */
            if (action.equalsIgnoreCase('capslimit')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.caps.limit.usage'));
                    return;
                }
                capsLimitPercent = parseFloat(subAction);
                $.inidb.set('chatModerator', 'capsLimitPercent', capsLimitPercent);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.caps.limit.set', capsLimitPercent));
                $.logEvent('chatModerator.js', 1191, sender + ' changed the caps limit to ' + capsLimitPercent);
                return;
            }

            /**
             * @commandpath moderation capstriggerlength [amount] - Sets the minimum amount of charaters before checking for caps
             */
            if (action.equalsIgnoreCase('capstriggerlength')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.caps.trigger.length.usage'));
                    return;
                }
                capsTriggerLength = parseInt(subAction);
                $.inidb.set('chatModerator', 'capsTriggerLength', capsTriggerLength);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.caps.trigger.length.set', capsTriggerLength));
                $.logEvent('chatModerator.js', 1206, sender + ' changed the caps trigger length to ' + capsTriggerLength);
                return;
            }

            /**
             * @commandpath moderation spamlimit [amount] - Sets the amount of repeating charaters allowed in a message
             */
            if (action.equalsIgnoreCase('spamlimit')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.spam.limit.usage'));
                    return;
                }
                spamLimit = parseInt(subAction);
                $.inidb.set('chatModerator', 'spamLimit', spamLimit);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.spam.limit.set', spamLimit));
                $.logEvent('chatModerator.js', 1221, sender + ' changed the spam limit to ' + spamLimit);
                return;
            }

            /**
             * @commandpath moderation symbolslimit [amount] - Sets the amount (in percent) of symbols allowed in a message
             */
            if (action.equalsIgnoreCase('symbolslimit')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.symbols.limit.usage'));
                    return;
                }
                symbolsLimitPercent = parseFloat(subAction);
                $.inidb.set('chatModerator', 'symbolsLimitPercent', symbolsLimitPercent);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.symbols.limit.set', symbolsLimitPercent));
                $.logEvent('chatModerator.js', 1236, sender + ' changed the symbols limit to ' + symbolsLimitPercent);
                return;
            }

            /**
             * @commandpath moderation symbolsgrouplimit [amount] - Sets the max amount of grouped symbols allowed in a message
             */
            if (action.equalsIgnoreCase('symbolsgrouplimit')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.symbols.group.limit.usage'));
                    return;
                }
                symbolsGroupLimit = parseInt(subAction);
                $.inidb.set('chatModerator', 'symbolsLimitPercent', symbolsGroupLimit);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.symbols.group.limit.set', symbolsGroupLimit));
                $.logEvent('chatModerator.js', 1251, sender + ' changed the symbols group limit to ' + symbolsGroupLimit);
                return;
            }

            /**
             * @commandpath moderation symbolstriggerlength [amount] - Sets the minimum amount of charaters before checking for symbols
             */
            if (action.equalsIgnoreCase('symbolsTriggerLength')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.symbols.trigger.length.usage'));
                    return;
                }
                symbolsTriggerLength = parseInt(subAction);
                $.inidb.set('chatModerator', 'symbolsTriggerLength', symbolsTriggerLength);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.symbols.trigger.length.set', symbolsTriggerLength));
                $.logEvent('chatModerator.js', 1266, sender + ' changed the symbols trigger length to ' + symbolsTriggerLength);
                return;
            }

            /**
             * @commandpath moderation emoteslimit [amount] - Sets the amount of emotes allowed in a message
             */
            if (action.equalsIgnoreCase('emoteslimit')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.emotes.limit.usage'));
                    return;
                }
                emotesLimit = parseInt(subAction);
                $.inidb.set('chatModerator', 'emotesLimit', emotesLimit);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.emotes.limit.set', emotesLimit));
                $.logEvent('chatModerator.js', 1281, sender + ' changed the emote limit to ' + emotesLimit);
                return;
            }

            /**
             * @commandpath moderation messagecharacterlimit [amount] - Sets the amount of characters allowed in a message
             */
            if (action.equalsIgnoreCase('messagecharacterlimit')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.message.limit.usage'));
                    return;
                }
                longMessageLimit = parseInt(subAction);
                $.inidb.set('chatModerator', 'longMessageLimit', longMessageLimit);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.message.limit.set', longMessageLimit));
                $.logEvent('chatModerator.js', 1296, sender + ' changed the max characters per message limit to ' + longMessageLimit);
                return;
            }

            /**
             * @commandpath moderation timeouttime [seconds] - Sets the time in seconds for how a long a user gets timed out
             */
            if (action.equalsIgnoreCase('timeouttime')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.timeout.time.usage'));
                    return;
                }
                timeoutTime = parseInt(subAction);
                $.inidb.set('chatModerator', 'timeoutTime', timeoutTime);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.timeout.time.set', timeoutTime));
                $.logEvent('chatModerator.js', 1311, sender + ' changed the timeout time to ' + timeoutTime + ' seconds');
                return;
            }

            /**
             * @commandpath moderation warningtime [seconds] - Sets the time in seconds for how a long a user gets purged for
             */
            if (action.equalsIgnoreCase('warningtime')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.warning.time.usage'));
                    return;
                }
                warningTime = parseInt(subAction);
                $.inidb.set('chatModerator', 'warningTime', warningTime);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.warning.time.set', warningTime));
                $.logEvent('chatModerator.js', 1326, sender + ' changed the warning time to ' + warningTime + ' seconds');
                return;
            }

            /**
             * @commandpath moderation messagecooldown [seconds] - Sets a cooldown in seconds on the timeout messages
             */
            if (action.equalsIgnoreCase('messagecooldown')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.msgcooldown.usage'));
                    return;
                }
                msgCooldownSec = parseInt(subAction);
                $.inidb.set('chatModerator', 'msgCooldownSec', msgCooldownSec);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.msgcooldown.set', msgCooldownSec));
                $.logEvent('chatModerator.js', 1342, sender + ' changed the timeout message cooldown to ' + msgCooldownSec + ' seconds');
            }
        }

    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argString = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];


        /**
         * Handle !moderation command
         */
        moderationCommand(event);

        /**
         * @commandpath permit [user] - Permit someone to post a link for a configured period of time
         */
        if (command.equalsIgnoreCase('permit')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.permit.usage'));
                return;
            }

            permitUser(action);
            $.say($.username.resolve(action) + $.lang.get('chatmoderator.permited', linkPermitTime));
            $.logEvent('chatModerator.js', 365, action + ' was permited by ' + sender);
            return;
        }

        /**
         * @commandpath blacklist - Show usage of command to manipulate the blacklist of words in chat
         */
        if (command.equalsIgnoreCase('blacklist')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.blacklist.usage'));
                return;
            }

            /**
             * @commandpath blacklist add [word] - Adds a word to the blacklist
             */
            if (action.equalsIgnoreCase('add')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.blacklist.add.usage'));
                    return;
                }
                var word = argString.replace(action, '').trim().toLowerCase();
                $.inidb.set('blackList', 'phrase_' + blackList.length, word);
                blackList.push(word);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.blacklist.added'));
                $.logEvent('chatModerator.js', 395, '"' + word + '" was added to the blacklist by ' + sender);
            }

            /**
             * @commandpath blacklist remove [id] - Removes a word from the blacklist based on ID.
             */
            if (action.equalsIgnoreCase('remove')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.blacklist.remove.usage'));
                    return;
                } else if (!$.inidb.exists('blackList', 'phrase_' + parseInt(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.err'));
                    return;
                }
                $.inidb.del('blackList', 'phrase_' + parseInt(subAction));
                loadBlackList();
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.blacklist.removed'));
            }

            /**
             * @commandpath blacklist show [id] - Shows the blacklist word related to the ID.
             */
            if (action.equalsIgnoreCase('show')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.blacklist.show.usage'));
                    return;
                } else if (!$.inidb.exists('blackList', 'phrase_' + parseInt(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.err'));
                    return;
                }
                $.say($.whisperPrefix(sender) + $.inidb.get('blackList', 'phrase_' + parseInt(subAction)));
            }
        }

        /**
         * @commandpath whitelist - Shows usage of command to manipulate the whitelist links
         */
        if (command.equalsIgnoreCase('whiteList')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.whitelist.usage'));
                return;
            }

            /**
             * @commandpath whitelist add [link] - Adds a link to the whitelist
             */
            if (action.equalsIgnoreCase('add')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.whitelist.add.usage'));
                    return;
                }
                var link = argString.replace(action, '').trim().toLowerCase();
                $.inidb.set('whiteList', 'link_' + whiteList.length, link);
                whiteList.push(link);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.whitelist.link.added'));
                $.logEvent('chatModerator.js', 455, '"' + link + '" was added the the whitelist by ' + sender);
            }

            /**
             * @commandpath whitelist remove [id] - Removes a link from the whitelist based on ID.
             */
            if (action.equalsIgnoreCase('remove')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.whitelist.remove.usage'));
                    return;
                } else if (!$.inidb.exists('whiteList', 'link_' + parseInt(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.err'));
                    return;
                }
                $.inidb.del('whiteList', 'link_' + parseInt(subAction));
                loadWhiteList();
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.whitelist.removed'));
            }

            /**
             * @commandpath whitelist show [id] - Shows a link in the whitelist based on ID.
             */
            if (action.equalsIgnoreCase('show')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.whitelist.show.usage'));
                    return;
                } else if (!$.inidb.exists('whiteList', 'link_' + parseInt(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.err'));
                    return;
                }
                $.say($.whisperPrefix(sender) + $.inidb.get('whiteList', 'link_' + parseInt(subAction)));
            }
        }


        /**
         * Used by the panel, no commandpath given. 
         */
        if (command.equalsIgnoreCase('reloadmod')) {
            reloadModeration();
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./core/chatmoderator.js')) {
            loadWhiteList();
            loadBlackList();

            $.registerChatCommand('./core/chatmoderator.js', 'permit', 2);
            $.registerChatCommand('./core/chatmoderator.js', 'moderation', 1);
            $.registerChatCommand('./core/chatmoderator.js', 'mod', 1);
            $.registerChatCommand('./core/chatmoderator.js', 'blacklist', 1);
            $.registerChatCommand('./core/chatmoderator.js', 'whitelist', 1);
            $.registerChatCommand('./core/chatmoderator.js', 'reloadmod', 1); // Used by the panel //
        }
    });

    /** Export functions to API */
    $.timeoutUser = timeoutUserFor;
    $.permitUserLink = permitUser;
})();
