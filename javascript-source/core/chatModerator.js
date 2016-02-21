(function () {
    var permitList = [],
        timeoutList = [],
        messageCooldown = [],
        whiteList = [],
        blackList = [],

        linksToggle = ($.inidb.exists('chatModerator', 'linksToggle') ? $.getIniDbBoolean('chatModerator', 'linksToggle') : true),
        linksMessage = ($.inidb.exists('chatModerator', 'linksMessage') ? $.inidb.get('chatModerator', 'linksMessage') : 'you were timed out for linking'),
        linkPermitTime = ($.inidb.exists('chatModerator', 'linkPermitTime') ? parseInt($.inidb.get('chatModerator', 'linkPermitTime')) : 120),

        capsToggle = ($.inidb.exists('chatModerator', 'capsToggle') ? $.getIniDbBoolean('chatModerator', 'capsToggle') : true),
        capsMessage = ($.inidb.exists('chatModerator', 'capsMessage') ? $.inidb.get('chatModerator', 'capsMessage') : 'you were timed out for overusing caps'),
        capsLimit = ($.inidb.exists('chatModerator', 'capsLimit') ? parseInt($.inidb.get('chatModerator', 'capsLimit')) : 50),
        capsTriggerLength = ($.inidb.exists('chatModerator', 'capsTriggerLength') ? parseInt($.inidb.get('chatModerator', 'capsTriggerLength')) : 10),

        spamToggle = ($.inidb.exists('chatModerator', 'spamToggle') ? $.getIniDbBoolean('chatModerator', 'spamToggle') : true),
        spamMessage = ($.inidb.exists('chatModerator', 'spamMessage') ? $.inidb.get('chatModerator', 'spamMessage') : 'you were timed out for spamming'),
        spamLimit = ($.inidb.exists('chatModerator', 'spamLimit') ? parseInt($.inidb.get('chatModerator', 'spamLimit')) : 25),

        symbolsToggle = ($.inidb.exists('chatModerator', 'symbolsToggle') ? $.getIniDbBoolean('chatModerator', 'symbolsToggle') : true),
        symbolsMessage = ($.inidb.exists('chatModerator', 'symbolsMessage') ? $.inidb.get('chatModerator', 'symbolsMessage') : 'you were timed out for overusing symbols'),
        symbolsLimit = ($.inidb.exists('chatModerator', 'symbolsLimit') ? parseInt($.inidb.get('chatModerator', 'symbolsLimit')) : 25),
        symbolsTriggerLength = ($.inidb.exists('chatModerator', 'symbolsTriggerLength') ? parseInt($.inidb.get('chatModerator', 'symbolsTriggerLength')) : 5),

        emotesToggle = ($.inidb.exists('chatModerator', 'emotesToggle') ? $.getIniDbBoolean('chatModerator', 'emotesToggle') : false),
        emotesMessage = ($.inidb.exists('chatModerator', 'emotesMessage') ? $.inidb.get('chatModerator', 'emotesMessage') : 'you were timed out for overusing emotes'),
        emotesLimit = ($.inidb.exists('chatModerator', 'emotesLimit') ? parseInt($.inidb.get('chatModerator', 'emotesLimit')) : 30),

        regularsToggle = ($.inidb.exists('chatModerator', 'regularsToggle') ? $.getIniDbBoolean('chatModerator', 'regularsToggle') : false),
        subscribersToggle = ($.inidb.exists('chatModerator', 'subscribersToggle') ? $.getIniDbBoolean('chatModerator', 'subscribersToggle') : true),

        blacklistMessage = ($.inidb.exists('chatModerator', 'blacklistMessage') ? $.inidb.get('chatModerator', 'blacklistMessage') : 'you were timed out using a blacklisted phrase'),
        warningTime = ($.inidb.exists('chatModerator', 'warningTime') ? parseInt($.inidb.get('chatModerator', 'warningTime')) : 5),
        timeoutTime = ($.inidb.exists('chatModerator', 'timeoutTime') ? parseInt($.inidb.get('chatModerator', 'timeoutTime')) : 600),
        msgCooldownSec = ($.inidb.exists('chatModerator', 'msgCooldownSec') ? parseInt($.inidb.get('chatModerator', 'msgCooldownSec')) : 20),
        warning = '';

    /**
     * @function loadBlackList
     */
    function loadBlackList(force) {
        var keys = $.inidb.GetKeyList('blacklist', '');

        if (force) {
            for (var i in keys) {
                blackList.push($.inidb.get('blacklist', keys[i]));
            }
        }
    };
  
    /**
     * @function loadWhiteList
     */
    function loadWhiteList(force) {
        var keys = $.inidb.GetKeyList('whitelist', '');

        if (force) {
            for (var i in keys) {
                whiteList.push($.inidb.get('whitelist', keys[i]));
            }
        }
    };
  
    /**
     * @function timeoutUser
     * @export $
     * @param {string} user
     * @param {number} time
     */
    function timeoutUser(user, time) {
        $.say('.timeout ' + user + ' ' + time);
        setTimeout(function () {
            $.say('.timeout ' + user + ' ' + time);
        }, 1000);
    };
  
    /**
     * @function deleteMessage
     * @param {string} user
     */
    function deleteMessage(user) {
        for (var i in timeoutList) {
            if (timeoutList[i].equalsIgnoreCase(user)) {
                timeoutUser(user, timeoutTime);
                setTimeoutAndCooldown(user);
                warning = '(timeout)';
                return;
            }
        }
        timeoutUser(user, warningTime);
        setTimeoutAndCooldown(user);
        warning = '(warning)';
    };
  
    /**
     * @function sendMessage
     * @param {string} user
     * @param {string} message
     */
    function sendMessage(user, message) {
        if (messageCooldown.length <= 1) { 
            $.say('@' + $.username.resolve(user) + ', ' + message + ' ' + warning);
        } 
    };
  
    /**
     * @function setTimeoutAndCooldown
     * @param {string} user
     */
    function setTimeoutAndCooldown(user) {
        timeoutList.push(user);
        clearTimeouts(user);
        if (msgCooldownSec > 0) {
            messageCooldown.push($.systemTime());
        }
    };
  
    /**
     * @function cleartimeouts
     * @param {string} user
     */
    function clearTimeouts(user) {
        if (msgCooldownSec > 0) {
            var a = setTimeout(function () {
                messageCooldown.splice(0);
                clearTimeout(a);
            }, (msgCooldownSec * 1000));
        }
        var b = setTimeout(function () {
            for (var i in timeoutList) {
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
     * @export $ as permitUserLink
     * @param {string} user
     */
    function permitUser(user) {
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
     * @param {boolean} filter
     * @returns {string}
     */
    function getModerationFilterStatus(filter) {
        return (filter ? $.lang.get('common.enabled') : $.lang.get('common.disabled'));
    };

  /**
   * @event ircChannelMessage
   */
    $.bind('ircChannelMessage', function (event) {
        var sender = event.getSender(),
            message = event.getMessage(),
            i;

        if (!$.isModv3(sender, event.getTags())) {
            for (i in blackList) {
                if (message.contains(blackList[i])) {
                    timeoutUser(sender, timeoutTime);
                    warning = '(timeout)';
                    sendMessage(sender, blacklistMessage);
                    return;
                }
            }
    
            for (i in permitList) {
                if (permitList[i].equalsIgnoreCase(sender) && $.patternDetector.hasLinks(event)) {
                    permitList.splice(i, 1);
                    return;
                }
            }
    
            if (linksToggle && $.patternDetector.hasLinks(event)) {
                for (i in whiteList) {
                    if (message.contains(whiteList[i])) {
                        return;
                    }
                }
    
                if ($.youtubePlayerConnected) {
                    if (message.contains('youtube.com') || message.contains('youtu.be') || message.contains('m.youtube.com')) {
                        return;
                    }
                }
    
                if (regularsToggle && $.isReg(sender)) {
                    return;
                }
    
                if (subscribersToggle && $.isSubv3(sender, event.getTags())) {
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

            if (emotesToggle) {
                if ($.patternDetector.getNumberOfEmotes(event) > emotesLimit) {
                    deleteMessage(sender);
                    sendMessage(sender, emotesMessage);
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
            } 
    
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.permit.usage'));
                return;
            }
    
            permitUser(action);
            $.say($.username.resolve(action) + $.lang.get('chatmoderator.permited', linkPermitTime));
            return;
        }
    
        /**
         * @commandpath blacklist [option] - Add a word to the blacklist
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
                var word = argString.replace(action, '').trim();
                $.inidb.set('blackList', 'phrase_' + blackList.length, word);
                blackList.push(word);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.blacklist.added'));
            }
    
          /**
           * @commandpath blacklist remove [id] - removes a word to the blacklist
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
                loadBlackList(true);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.blacklist.removed'));
            }
        
              /**
               * @commandpath blacklist show [id] - Shows that blacklist
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
         * @commandpath whitelist [option] - Adds a link to the whitelist
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
                var link = argString.replace(action, '').trim();
                $.inidb.set('whiteList', 'link_' + whiteList.length, link);
                whiteList.push(link);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.whitelist.link.added'));
            }
      
            /**
             * @commandpath whitelist remove [id] - Removes a link to the whitelist
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
                loadWhiteList(true);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.whitelist.removed'));
            }
      
            /**
             * @commandpath whitelist show [id] - Shows a link in the whitelist
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
         * @commandpath moderation [option] - Set the moderation filter for your chat
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
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    linksToggle = false;
                    $.inidb.set('chatModerator', 'linksToggle', linksToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.link.filter.disabled'));
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
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    capsToggle = false;
                    $.inidb.set('chatModerator', 'capsToggle', capsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.caps.filter.disabled'));
                    return;
                }
            }
        
            /**
             * @commandpath moderation links [on / off] - Enable/Disable the spam filter
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
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    spamToggle = false;
                    $.inidb.set('chatModerator', 'spamToggle', spamToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.spam.filter.disabled'));
                    return;
                }
            }
        
            /**
             * @commandpath moderation links [on / off] - Enable/Disable the symbol filter
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
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    symbolsToggle = false;
                    $.inidb.set('chatModerator', 'symbolsToggle', symbolsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.symbols.filter.disabled'));
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
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    emotesToggle = false;
                    $.inidb.set('chatModerator', 'symbolsToggle', emotesToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.emotes.filter.disabled'));
                    return;
                }
            }

            /**
             * @commandpath moderation regulars [true / false] - Allow regulars to post links
             */
            if (action.equalsIgnoreCase('regulars')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.usage'));
                    return;
                }
          
                if (subAction.equalsIgnoreCase('true')) {
                    regularsToggle = true;
                    $.inidb.set('chatModerator', 'regularsToggle', regularsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.enabled'));
                    return;
                } else if (subAction.equalsIgnoreCase('false')) {
                    regularsToggle = false;
                    $.inidb.set('chatModerator', 'regularsToggle', regularsToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.regulars.disabled'));
                    return;
                }
            }
        
            /**
             * @commandpath moderation subscribers [true / false] - Allows subscribers to avoid all spam filters
             */
            if (action.equalsIgnoreCase('subscribers')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.usage'));
                    return;
                }
          
                if (subAction.equalsIgnoreCase('true')) {
                    subscribersToggle = true;
                    $.inidb.set('chatModerator', 'subscribersToggle', subscribersToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.enabled'));
                    return;
                } else if (subAction.equalsIgnoreCase('false')) {
                    subscribersToggle = false;
                    $.inidb.set('chatModerator', 'subscribersToggle', subscribersToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.subscribers.disabled'));
                    return;
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
                return;
            }
        
            /**
             * @commandpath moderation permittime [amount] - Sets the permit time
             */
            if (action.equalsIgnoreCase('permittime')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.permit.time.usage'));
                    return;
                }
                linkPermitTime = parseInt(subAction);
                $.inidb.set('chatModerator', 'linkPermitTime', linkPermitTime);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.permit.time.set', linkPermitTime));
                return;
            }
        
            /**
             * @commandpath moderation capslimimt [amount] - Sets the caps limit
             */
            if (action.equalsIgnoreCase('capslimit')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.caps.limit.usage'));
                    return;
                }
                capsLimit = parseInt(subAction);
                $.inidb.set('chatModerator', 'capsLimit', capsLimit);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.caps.limit.set', capsLimit));
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
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.caps.trigger.length.set', capsLimit));
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
                return;
            }
        
            /**
             * @commandpath moderation symbolslimit [amount] - Sets the amount of symbols allowed in a message
             */
            if (action.equalsIgnoreCase('symbolslimit')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.symbols.limit.usage'));
                    return;
                }
                symbolsLimit = parseInt(subAction);
                $.inidb.set('chatModerator', 'symbolsLimit', symbolsLimit);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.symbols.limit.set', symbolsLimit));
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
                return;
            }
        
            /**
             * @commandpath moderation timeouttime [amount] - Sets the time in seconds for how a long a user gets timed out
             */
            if (action.equalsIgnoreCase('timeouttime')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.timeout.time.usage'));
                    return;
                }
                timeoutTime = parseInt(subAction);
                $.inidb.set('chatModerator', 'timeoutTime', timeoutTime);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.timeout.time.set', timeoutTime));
                return;
            }
        
            /**
             * @commandpath moderation warningtime [amount] - Sets the time in seconds for how a long a user gets purged for
             */
            if (action.equalsIgnoreCase('warningtime')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.warning.time.usage'));
                    return;
                }
                warningTime = parseInt(subAction);
                $.inidb.set('chatModerator', 'warningTime', warningTime);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.warning.time.set', warningTime));
                return;
            }

            if (action.equalsIgnoreCase('messagecooldown')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.mesgcooldown.usage'));
                    return;
                }

                msgCooldownSec = parseInt(subAction);
                $.inidb.set('chatModerator', 'msgCooldownSec', msgCooldownSec);
                $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.mesgcooldown.set', msgCooldownSec));
                return;
            }
        }
    });

  /**
   * @event initReady
   */
    $.bind('initReady', function () {
        if ($.bot.isModuleEnabled('./core/chatmoderator.js')) {
            $.consoleLn('loading the link whitelist...');
            loadWhiteList(true);
            $.consoleLn('loading the blacklist...');
            loadBlackList(true);
    
            $.registerChatCommand('./core/chatmoderator.js', 'permit', 2);
            $.registerChatCommand('./core/chatmoderator.js', 'moderation', 1);
            $.registerChatCommand('./core/chatmoderator.js', 'mod', 1);
            $.registerChatCommand('./core/chatmoderator.js', 'blacklist', 1);
            $.registerChatCommand('./core/chatmoderator.js', 'whitelist', 1);
        }
    });

    /** Export functions to API */
    $.timeoutUser = timeoutUser;
    $.permitUserLink = permitUser;
})();
