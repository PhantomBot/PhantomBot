(function () {
    var permitList = [],
        timeoutList = [],
        messageCooldown = [],
        whiteList = [],
        blackList = [],

        linksToggle = ($.inidb.exists('chatModerator', 'linksToggle') ? $.getIniDbBoolean('chatModerator', 'linksToggle') : true),
        linksMessage = ($.inidb.exists('chatModerator', 'linksMessage') ? $.inidb.get('chatModerator', 'linksMessage') : 'you were timed out for linking'),
        linkPermitTime = (parseInt($.inidb.exists('chatModerator', 'linkPermitTime')) ? parseInt($.getIniDbBoolean('chatModerator', 'linkPermitTime')) : 120),

        capsToggle = ($.inidb.exists('chatModerator', 'capsToggle') ? $.getIniDbBoolean('chatModerator', 'capsToggle') : true),
        capsMessage = ($.inidb.exists('chatModerator', 'capsMessage') ? $.inidb.get('chatModerator', 'capsMessage') : 'you were timed out for overusing caps'),
        capsLimit = (parseInt($.inidb.exists('chatModerator', 'capsLimit')) ? parseInt($.getIniDbBoolean('chatModerator', 'capsLimit')) : 30),
        capsTriggerLength = (parseInt($.inidb.exists('chatModerator', 'capsTriggerLength')) ? parseInt($.getIniDbBoolean('chatModerator', 'capsTriggerLength')) : 0),

        spamToggle = ($.inidb.exists('chatModerator', 'spamToggle') ? $.getIniDbBoolean('chatModerator', 'spamToggle') : true),
        spamMessage = ($.inidb.exists('chatModerator', 'spamMessage') ? $.inidb.get('chatModerator', 'spamMessage') : 'you were timed out for spamming'),
        spamLimit = (parseInt($.inidb.exists('chatModerator', 'spamLimit')) ? parseInt($.getIniDbBoolean('chatModerator', 'spamLimit')) : 10),

        symbolsToggle = ($.inidb.exists('chatModerator', 'symbolsToggle') ? $.getIniDbBoolean('chatModerator', 'symbolsToggle') : true),
        symbolsMessage = ($.inidb.exists('chatModerator', 'symbolsMessage') ? $.inidb.get('chatModerator', 'symbolsMessage') : 'you were timed out for overusing symbols'),
        symbolsLimit = (parseInt($.inidb.exists('chatModerator', 'symbolsLimit')) ? parseInt($.getIniDbBoolean('chatModerator', 'symbolsLimit')) : 10),
        symbolsTriggerLength = (parseInt($.inidb.exists('chatModerator', 'symbolsTriggerLength')) ? parseInt($.getIniDbBoolean('chatModerator', 'symbolsTriggerLength')) : 0),

        regularsToggle = ($.inidb.exists('chatModerator', 'regularsToggle') ? $.getIniDbBoolean('chatModerator', 'regularsToggle') : false),
        subscribersToggle = ($.inidb.exists('chatModerator', 'subscribersToggle') ? $.getIniDbBoolean('chatModerator', 'subscribersToggle') : true),

        blacklistMessage = ($.inidb.exists('chatModerator', 'blacklistMessage') ? $.inidb.get('chatModerator', 'blacklistMessage') : 'you were timed out using a blacklisted phrase'),
        warningTime = (parseInt($.inidb.exists('chatModerator', 'warningTime')) ? parseInt($.getIniDbBoolean('chatModerator', 'warningTime')) : 10),
        timeoutTime = (parseInt($.inidb.exists('chatModerator', 'timeoutTime')) ? parseInt($.getIniDbBoolean('chatModerator', 'timeoutTime')) : 600),
        warning = '';
    
    /**
    * @function loadBlackList
    */
    function loadBlackList () {
        var keys = $.inidb.GetKeyList('blacklist', '');

        for (var i in keys) {
            blackList.push($.inidb.get('blacklist', keys[i]));
        }
    };
    
    /**
    * @function loadWhiteList
    */
    function loadWhiteList () {
        var keys = $.inidb.GetKeyList('whitelist', '');
        
        for (var i in keys) {
            whiteList.push($.inidb.get('whitelist', keys[i]));
        }
    };

    /**
    * @function timeoutUser
    * @export $
    */
    function timeoutUser (user, time) {
        $.say('.timeout ' + user + ' ' + time);
        setTimeout(function () {
            $.say('.timeout ' + user + ' ' + time);
        }, 1000);
    };

    /**
    * @function deleteMessage
    * @export $
    */
    function deleteMessage (user) {
        for (var i in timeoutList) {
            if (timeoutList[i].equalsIgnoreCase(user)) {
                timeoutUser(user, timeoutTime);
                setTimeoutAndCooldown(user);
                warning = '(timeout)'
                return;
            }
        }
        timeoutUser(user, warningTime);
        setTimeoutAndCooldown(user);
        warning = '(warning)';
    };

    /**
    * @function sendMessage
    * @export $
    */
    function sendMessage (user, message) {
        if (messageCooldown.length <= 1) {
            $.say('@' + $.username.resolve(user) + ', ' + message + ' ' + warning);
        }
    };

    /**
    * @function setTimeoutAndCooldown
    * @export $
    */
    function setTimeoutAndCooldown (user) {
        timeoutList.push(user);
        messageCooldown.push($.systemTime());
        clearTimeouts(user);
    };

    /**
    * @function cleartimeouts
    * @export $
    */
    function clearTimeouts (user) {
        var a = setTimeout(function () {
            for (var i in messageCooldown) {
                messageCooldown.splice(0);
                return;
            }
            clearTimeout(a);
        }, (30 * 1000));
        var b = setTimeout(function () {
            for (i in timeoutList) {
                if (timeoutList[i].equalsIgnoreCase(user)) {
                    timeoutList.splice(i, 0);
                    break;
                }
            }
            clearTimeout(b);
        }, (60 * 60 * 1000));
    };

    /**
    * @function permitUser
    * @export $
    */
    function permitUser (user) {
        permitList.push(user);
        var c = setTimeout(function () {
            for (var i in permitList) {
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
    * @export $
    */
    function getModerationFilterStatus (filter) {
        return (filter ? $.lang.get('common.enabled') : $.lang.get('common.disabled'));
    };

    /**
    * @event ircChannelMessage
    */
    $.bind('ircChannelMessage', function (event) {
        var sender = event.getSender(),
            message = event.getMessage();

        if (!$.isModv3(sender, event.getTags()) && (subscribersToggle || !$.isSubv3(sender, event.getTags()))) {
            for (var i in blackList) {
                if (message.contains(blackList[i])) {
                    timeoutUser(sender, timeoutTime);
                    sendMessage(sender, blacklistMessage);
                    return;
                }
            }

            if (linksToggle && $.patternDetector.hasLinks(event)) {
                for (i in permitList) {
                    if (permitList[i].equalsIgnoreCase(sender) && $.patternDetector.hasLinks(event)) {
                        permitList.splice(i, 1);
                        return;
                    }
                }

                for (i in whiteList) {
                    if (message.contains(whiteList[i])) {
                        return;
                    }
                }

                if (regularsToggle && $.getUserGroupId(sender) <= 6) {
                    return;
                }

                deleteMessage(sender);
                sendMessage(sender, linksMessage);
                return;
            }

            if (capsToggle && message.length() > capsTriggerLength) {
                if (event.getCapsCount() > capsLimit) {
                    deleteMessage(sender);
                    sendMessage(sender, capsMessage);
                    return;
                }
            }

            if (symbolsToggle && message.length() > symbolsTriggerLength) {
                if ($.patternDetector.getNumberOfNonLetters(event) > symbolsLimit) {
                    deleteMessage(sender);
                    sendMessage(sender, symbolsMessage);
                    return;
                }
            }

            if (spamToggle) {
                if ($.patternDetector.getLongestRepeatedSequence(event) > spamLimit) {
                    deleteMessage(sender);
                    sendMessage(sender, spamMessage);
                    return;
                }
            }
        }
    });
    
    /**
    * @event command
    */
    $.bind('command', function (event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argString = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /**
        * @commandpath permit [user] - Permit someone to post a link
        */    
        if (command.equalsIgnoreCase('permit')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            } else if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.permit.usage'));
                return;
            }
            $.permitUser(action);
            $.say($.username.resolve(action) + $.lang.get('chatModerator.permited', linkPermitTime));
            return;
        }

        /**
        * @commandpath blacklist [option] - Add a word to the blacklist
        */
        if (command.equalsIgnoreCase('blacklist')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.blacklist.usage'));
                return;
            }

            /**
            * @commandpath blacklist add [word] - Adds a word to the blacklist
            */
            if (action.equalsIgnoreCase('add')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.blacklist.add.usage'));
                    return;
                }
                var word = argString.replace(action, '').trim();
                $.inidb.set('blackList', 'phrase_' + blackList.length, word);
                blackList.push(word);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.blacklist.added'));
                return;
            }

            /**
            * @commandpath blacklist remove [id] - removes a word to the blacklist
            */
            if (action.equalsIgnoreCase('remove')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.blacklist.remove.usage'));
                    return;
                } else if (!$.inidb.exists('blackList', 'phrase_' + parseInt(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.err'));
                    return;
                }
                $.inidb.del('blackList', 'phrase_' + parseInt(subAction));
                loadBlackList();
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.blacklist.removed'));
            }

            /**
            * @commandpath blacklist show [id] - Shows that blacklist
            */
            if (action.equalsIgnoreCase('show')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.blacklist.show.usage'));
                    return;
                } else if (!$.inidb.exists('blackList', 'phrase_' + parseInt(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.err'));
                    return;
                }
                $.say($.whisperPrefix(sender) + $.inidb.get('blackList', 'phrase_' + parseInt(subAction)));
                return;
            }
        }

        /**
        * @commandpath whitelist [option] - Adds a link to the whitelist
        */
        if (command.equalsIgnoreCase('whiteList')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.whitelist.usage'));
                return;
            }

            /**
            * @commandpath whitelist add [link] - Adds a link to the whitelist
            */
            if (action.equalsIgnoreCase('add')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.whitelist.add.usage'));
                    return;
                }
                var link = argString.replace(action, '').trim();
                $.inidb.set('whiteList', 'link_' + whiteList.length, link);
                whiteList.push(link);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.whitelist.link.added'));
                return;
            }

            /**
            * @commandpath whitelist remove [id] - Removes a link to the whitelist
            */
            if (action.equalsIgnoreCase('remove')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.whitelist.remove.usage'));
                    return;
                } else if (!$.inidb.exists('whiteList', 'link_' + parseInt(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.err'));
                    return;
                }
                $.inidb.del('whiteList', 'link_' + parseInt(subAction));
                loadWhiteList();
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.whitelist.removed'));
                return;
            }

            /**
            * @commandpath whitelist show [id] - Shows a link in the whitelist
            */
            if (action.equalsIgnoreCase('show')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.whitelist.show.usage'));
                    return;
                } 
                if (!$.inidb.exists('whiteList', 'link_' + parseInt(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.err'));
                    return;
                }
                $.say($.whisperPrefix(sender) + $.inidb.get('whiteList', 'link_' + parseInt(subAction)));
                return;
            }
        }

        /**
        * @commandpath moderation [option] - Set the moderation filter for your chat 
        */
        if (command.equalsIgnoreCase('moderation')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.usage.toggles'));
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.usage.messages'));
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.options'));
                return;
            }

            /**
            * @commandpath moderation links [on / off] - Enable/Disable the link filter
            */
            if (action.equalsIgnoreCase('links')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.link.usage', getModerationFilterStatus(linksToggle)));
                    return;
                }

                if (subAction.equalsIgnoreCase('on')) {
                    linksToggle = true;
                    $.inidb.set('chatModerator', 'linksToggle', linksToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.link.filter.enabled'));
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    linksToggle = false;
                    $.inidb.set('chatModerator', 'linksToggle', linksToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.link.filter.disabled'));
                    return;
                }
            }

            /**
            * @commandpath moderation caps [on / off] - Enable/Disable the caps filter
            */
            if (action.equalsIgnoreCase('caps')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.caps.usage', getModerationFilterStatus(capsToggle)));
                    return;
                }

                if (subAction.equalsIgnoreCase('on')) {
                    capsToggle = true;
                    $.inidb.set('chatModerator', 'capsToggle', capsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.caps.filter.enabled'));
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    capsToggle = false;
                    $.inidb.set('chatModerator', 'capsToggle', capsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.caps.filter.disabled'));
                    return;
                }
            }

            /**
            * @commandpath moderation links [on / off] - Enable/Disable the spam filter
            */
            if (action.equalsIgnoreCase('spam')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.spam.usage', getModerationFilterStatus(spamToggle)));
                    return;
                }

                if (subAction.equalsIgnoreCase('on')) {
                    spamToggle = true;
                    $.inidb.set('chatModerator', 'spamToggle', spamToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.spam.filter.enabled'));
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    spamToggle = false;
                    $.inidb.set('chatModerator', 'spamToggle', spamToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.spam.filter.disabled'));
                    return;
                }
            }

            /**
            * @commandpath moderation links [on / off] - Enable/Disable the symbol filter
            */
            if (action.equalsIgnoreCase('symbols')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.symbols.usage', getModerationFilterStatus(symbolsToggle)));
                    return;
                }

                if (subAction.equalsIgnoreCase('on')) {
                    symbolsToggle = true;
                    $.inidb.set('chatModerator', 'symbolsToggle', symbolsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.symbols.filter.enabled'));
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    symbolsToggle = false;
                    $.inidb.set('chatModerator', 'symbolsToggle', symbolsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.symbols.filter.disabled'));
                    return;
                }
            }

            /**
            * @commandpath moderation regulars [true / false] - Allow regulars to post links
            */
            if (action.equalsIgnoreCase('regulars')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.regulars.usage'));
                    return;
                }

                if (subAction.equalsIgnoreCase('true')) {
                    regularsToggle = true;
                    $.inidb.set('chatModerator', 'regularsToggle', regularsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.regulars.enabled'));
                    return;
                } else if (subAction.equalsIgnoreCase('false')) {
                    regularsToggle = false;
                    $.inidb.set('chatModerator', 'regularsToggle', regularsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.regulars.disabled'));
                    return;
                }
            }

            /**
            * @commandpath moderation subscribers [true / false] - Allows subscribers to avoid all spam filters
            */
            if (action.equalsIgnoreCase('subscribers')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.subscribers.usage'));
                    return;
                }

                if (subAction.equalsIgnoreCase('true')) {
                    subscribersToggle = true;
                    $.inidb.set('chatModerator', 'subscribersToggle', subscribersToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.subscribers.enabled'));
                    return;
                } else if (subAction.equalsIgnoreCase('false')) {
                    subscribersToggle = false;
                    $.inidb.set('chatModerator', 'subscribersToggle', subscribersToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.subscribers.disabled'));
                    return;
                }
            }

            /**
            * @commandpath moderation linksmessage [message] - Sets the link warning message
            */
            if (action.equalsIgnoreCase('linksmessage')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.link.message.usage'));
                    return;
                }
                linksMessage = argString.replace(action, '').trim();
                $.inidb.set('chatModerator', 'linksMessage', linksMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.link.message.set', linksMessage));
                return;
            }

            /**
            * @commandpath moderation capsmessage [message] - Sets the cap warning message
            */
            if (action.equalsIgnoreCase('capsmessage')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.caps.message.usage'));
                    return;
                }
                capsMessage = argString.replace(action, '').trim();
                $.inidb.set('chatModerator', 'capsMessage', capsMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.caps.message.set', capsMessage));
                return;
            }

            /**
            * @commandpath moderation symbolsmessage [message] - Sets the symbols warning message
            */
            if (action.equalsIgnoreCase('symbolsmessage')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.symbols.message.usage'));
                    return;
                }
                symbolsMessage = argString.replace(action, '').trim();
                $.inidb.set('chatModerator', 'symbolsMessage', symbolsMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.symbols.message.set', symbolsMessage));
                return;
            }

            /**
            * @commandpath moderation spammessage [message] - Sets the spam warning message
            */
            if (action.equalsIgnoreCase('spammessage')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.spam.message.usage'));
                    return;
                }
                spamMessage = argString.replace(action, '').trim();
                $.inidb.set('chatModerator', 'spamMessage', spamMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.spam.message.set', spamMessage));
                return;
            }

            /**
            * @commandpath moderation blacklistmessage [message] - Sets the blacklist warning message
            */
            if (action.equalsIgnoreCase('blacklistmessage')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.blacklist.message.usage'));
                    return;
                }
                blacklistMessage = argString.replace(action, '').trim();
                $.inidb.set('chatModerator', 'blacklistMessage', blacklistMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.blacklist.message.set', blacklistMessage));
                return;
            }

            /**
            * @commandpath moderation permittime [amount] - Sets the permit time
            */
            if (action.equalsIgnoreCase('permittime')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.permit.time.usage'));
                    return;
                }
                linkPermitTime = parseInt(subAction);
                $.inidb.set('chatModerator', 'linkPermitTime', linkPermitTime);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.permit.time.set', linkPermitTime));
                return;
            }

            /**
            * @commandpath moderation capslimimt [amount] - Sets the caps limit
            */
            if (action.equalsIgnoreCase('capslimit')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.caps.limit.usage'));
                    return;
                }
                capsLimit = parseInt(subAction);
                $.inidb.set('chatModerator', 'capsLimit', capsLimit);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.caps.limit.set', capsLimit));
                return;
            }

            /**
            * @commandpath moderation capstriggerlength [amount] - Sets the minimum amount of charaters before checking for caps
            */
            if (action.equalsIgnoreCase('capstriggerlength')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.caps.trigger.length.usage'));
                    return;
                }
                capsTriggerLength = parseInt(subAction);
                $.inidb.set('chatModerator', 'capsTriggerLength', capsTriggerLength);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.caps.trigger.length.set', capsLimit));
                return;
            }

            /**
            * @commandpath moderation spamlimit [amount] - Sets the amount of repeating charaters allowed in a message
            */
            if (action.equalsIgnoreCase('spamlimit')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.spam.limit.usage'));
                    return;
                }
                spamLimit = parseInt(subAction);
                $.inidb.set('chatModerator', 'spamLimit', spamLimit);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.spam.limit.set', spamLimit));
                return;
            }

            /**
            * @commandpath moderation symbolslimit [amount] - Sets the amount of symbols allowed in a message
            */
            if (action.equalsIgnoreCase('symbolslimit')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.symbols.limit.usage'));
                    return;
                }
                symbolsLimit = parseInt(subAction);
                $.inidb.set('chatModerator', 'symbolsLimit', symbolsLimit);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.symbols.limit.set', symbolsLimit));
                return;
            }

            /**
            * @commandpath moderation symbolstriggerlength [amount] - Sets the minimum amount of charaters before checking for symbols
            */
            if (action.equalsIgnoreCase('symbolsTriggerLength')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.symbols.trigger.length.usage'));
                    return;
                }
                symbolsTriggerLength = parseInt(subAction);
                $.inidb.set('chatModerator', 'symbolsTriggerLength', symbolsTriggerLength);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.symbols.trigger.length.set', symbolsTriggerLength));
                return;
            }

            /**
            * @commandpath moderation timeouttime [amount] - Sets the time in seconds for how a long a user gets timed out
            */
            if (action.equalsIgnoreCase('timeoutime')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.timeout.time.usage'));
                    return;
                }
                timeoutTime = parseInt(subAction);
                $.inidb.set('chatModerator', 'timeoutTime', timeoutTime);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.timeout.time.set', timeoutTime));
                return;
            }

            /**
            * @commandpath moderation warningtime [amount] - Sets the time in seconds for how a long a user gets purged for
            */
            if (action.equalsIgnoreCase('warningtime')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.warning.time.usage'));
                    return;
                }
                warningTime = parseInt(subAction);
                $.inidb.set('chatModerator', 'warningTime', warningTime);
                $.say($.whisperPrefix(sender) + $.lang.get('chatModerator.warning.time.set', warningTime));
                return;
            }
        }
    });
    
    /**
    * @event initReady
    */
    $.bind('initReady', function () {
        if ($.bot.isModuleEnabled('./core/chatModerator.js')) {
            $.registerChatCommand('./core/chatModerator.js', 'permit', 1);
            $.registerChatCommand('./core/chatModerator.js', 'moderation', 1);
            $.registerChatCommand('./core/chatModerator.js', 'blacklist', 1);
            $.registerChatCommand('./core/chatModerator.js', 'whitelist', 1);
            loadWhiteList();
            loadBlackList();
        }
    });
})();
