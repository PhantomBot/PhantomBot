/**
 * gameWispHandler.js
 *
 * Handle GameWisp subscriptions.
 */
(function() {

    var subMessage = $.getSetIniDbString('gameWispSubHandler', 'subscribeMessage', '(name) just subscribed via GameWisp at tier level (tier)!'),
        reSubMessage = $.getSetIniDbString('gameWispSubHandler', 'reSubscribeMessage', '(name) just subscribed for (months) months in a row via GameWisp!'),
        tierUpMessage = $.getSetIniDbString('gameWispSubHandler', 'tierUpMessage', '(name) upgraded to tier (tier) on GameWisp!');
        subShowMessages = $.getSetIniDbBoolean('gameWispSubHandler', 'subscriberShowMessages', true),
        subReward = $.getSetIniDbNumber('gameWispSubHandler', 'subscribeReward', 0),
        reSubReward = $.getSetIniDbNumber('gameWispSubHandler', 'reSubscribeReward', 0);

    /*
     * The tierData primary key needs to match the subcommand for !gamewisptier.  See notes below 
     * in the gamewisptier command handling.
     */
    var tierData = [];

    /*
     * Throw an error into the Console only once if the key is bad and stop querying GameWisp until reboot.
     * Assume that we did authenticate at first, then move to false if this is not the case.
     */
    var gameWispAuthenticated = true;

    tierData['songrequests'] = [],
    tierData['songrequests'][0] = 0;
    tierData['songrequests'][1] = $.getSetIniDbNumber('gameWispTiers', 'songrequest_1', 0);
    tierData['songrequests'][2] = $.getSetIniDbNumber('gameWispTiers', 'songrequest_2', 0);
    tierData['songrequests'][3] = $.getSetIniDbNumber('gameWispTiers', 'songrequest_3', 0);
    tierData['songrequests'][4] = $.getSetIniDbNumber('gameWispTiers', 'songrequest_4', 0);
    tierData['songrequests'][5] = $.getSetIniDbNumber('gameWispTiers', 'songrequest_5', 0);
    tierData['songrequests'][6] = $.getSetIniDbNumber('gameWispTiers', 'songrequest_6', 0);

    tierData['bonuspoints'] = [];
    tierData['bonuspoints'][0] = 0;
    tierData['bonuspoints'][1] = $.getSetIniDbNumber('gameWispTiers', 'bonuspoints_1', 0);
    tierData['bonuspoints'][2] = $.getSetIniDbNumber('gameWispTiers', 'bonuspoints_2', 0);
    tierData['bonuspoints'][3] = $.getSetIniDbNumber('gameWispTiers', 'bonuspoints_3', 0);
    tierData['bonuspoints'][4] = $.getSetIniDbNumber('gameWispTiers', 'bonuspoints_4', 0);
    tierData['bonuspoints'][5] = $.getSetIniDbNumber('gameWispTiers', 'bonuspoints_5', 0);
    tierData['bonuspoints'][6] = $.getSetIniDbNumber('gameWispTiers', 'bonuspoints_6', 0);

    tierData['subbonuspoints'] = [];
    tierData['subbonuspoints'][0] = 0;
    tierData['subbonuspoints'][1] = $.getSetIniDbNumber('gameWispTiers', 'subbonuspoints_1', 0);
    tierData['subbonuspoints'][2] = $.getSetIniDbNumber('gameWispTiers', 'subbonuspoints_2', 0);
    tierData['subbonuspoints'][3] = $.getSetIniDbNumber('gameWispTiers', 'subbonuspoints_3', 0);
    tierData['subbonuspoints'][4] = $.getSetIniDbNumber('gameWispTiers', 'subbonuspoints_4', 0);
    tierData['subbonuspoints'][5] = $.getSetIniDbNumber('gameWispTiers', 'subbonuspoints_5', 0);
    tierData['subbonuspoints'][6] = $.getSetIniDbNumber('gameWispTiers', 'subbonuspoints_6', 0);

    /**
     * @function updateGameWispDB
     */
    function updateGameWispDB() {
        subMessage = $.getIniDbString('gameWispSubHandler', 'subscribeMessage');
        reSubMessage = $.getIniDbString('gameWispSubHandler', 'reSubscribeMessage');
        tierUpMessage = $.getIniDbString('gameWispSubHandler', 'tierUpMessage');
        subShowMessages = $.getIniDbBoolean('gameWispSubHandler', 'subscriberShowMessages');
        subReward = $.getIniDbNumber('gameWispSubHandler', 'subscribeReward');
        reSubReward = $.getIniDbNumber('gameWispSubHandler', 'reSubscribeReward');

        tierData['songrequests'][1] = $.getIniDbNumber('gameWispTiers', 'songrequest_1');
        tierData['songrequests'][2] = $.getIniDbNumber('gameWispTiers', 'songrequest_2');
        tierData['songrequests'][3] = $.getIniDbNumber('gameWispTiers', 'songrequest_3');
        tierData['songrequests'][4] = $.getIniDbNumber('gameWispTiers', 'songrequest_4');
        tierData['songrequests'][5] = $.getIniDbNumber('gameWispTiers', 'songrequest_5');
        tierData['songrequests'][6] = $.getIniDbNumber('gameWispTiers', 'songrequest_6');

        tierData['bonuspoints'][1] = $.getIniDbNumber('gameWispTiers', 'bonuspoints_1');
        tierData['bonuspoints'][2] = $.getIniDbNumber('gameWispTiers', 'bonuspoints_2');
        tierData['bonuspoints'][3] = $.getIniDbNumber('gameWispTiers', 'bonuspoints_3');
        tierData['bonuspoints'][4] = $.getIniDbNumber('gameWispTiers', 'bonuspoints_4');
        tierData['bonuspoints'][5] = $.getIniDbNumber('gameWispTiers', 'bonuspoints_5');
        tierData['bonuspoints'][6] = $.getIniDbNumber('gameWispTiers', 'bonuspoints_6');

        tierData['subbonuspoints'][1] = $.getIniDbNumber('gameWispTiers', 'subbonuspoints_1');
        tierData['subbonuspoints'][2] = $.getIniDbNumber('gameWispTiers', 'subbonuspoints_2');
        tierData['subbonuspoints'][3] = $.getIniDbNumber('gameWispTiers', 'subbonuspoints_3');
        tierData['subbonuspoints'][4] = $.getIniDbNumber('gameWispTiers', 'subbonuspoints_4');
        tierData['subbonuspoints'][5] = $.getIniDbNumber('gameWispTiers', 'subbonuspoints_5');
        tierData['subbonuspoints'][6] = $.getIniDbNumber('gameWispTiers', 'subbonuspoints_6');
    }

    /**
     * @event gameWispChange
     */
    $.bind('gameWispChange', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/gameWispHandler.js')) {
            return;
        }

        var username = event.getUsername().toLowerCase(),
            userstatus = event.getStatus();

        if (userstatus.equals('inactive')) {
            $.delGWSubUsersList(username);
            $.restoreSubscriberStatus(username, false);
        }
    });

    /**
     * @event gameWispBenefits
     */
    $.bind('gameWispBenefits', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/gameWispHandler.js')) {
            return;
        }

        var username = event.getUsername().toLowerCase(),
            resolvename = $.resolveRank(username),
            tier = parseInt(event.getTier());

        if (tier > $.getGWTier(username)) {
            $.addGWSubUsersList(username, tier);
            if (subShowMessages) {
                $.say(tierUpMessage.replace('(name)', resolvename).replace('(tier)', tier));
            }
        }
    });

    /**
     * @event gameWispSubscribe
     */
    $.bind('gameWispSubscribe', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/gameWispHandler.js')) {
            return;
        }
        var username = event.getUsername().toLowerCase(),
            resolvename = $.resolveRank(username),
            tier = parseInt(event.getTier()),
            userreward = subReward + tierData['subbonuspoints'][tier];

        $.addGWSubUsersList(username, tier);
        $.restoreSubscriberStatus(username, false);

        if (subShowMessages) {
            $.inidb.incr('points', username, userreward);
            $.say(subMessage.replace('(name)', resolvename).replace('(tier)', tier.toString()).replace('(reward)', userreward.toString()));
        }
    });

    /**
     * @event gameWispAnniversary
     */
    $.bind('gameWispAnniversary', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/gameWispHandler.js')) {
            return;
        }
        var username = event.getUsername().toLowerCase(),
            resolvename = $.resolveRank(username),
            months = parseInt(event.getMonths()),
            tier = $.getGWTier(username),
            userreward = subReward + tierData['subbonuspoints'][tier];

        if (subShowMessages) {
            $.inidb.incr('points', username, parseInt(userreward));
            $.say(reSubMessage.replace('(name)', resolvename).replace('(tier)', tier.toString()).replace('(reward)', userreward.toString()).replace('(months)', months.toString()));
        }
    });

    /**
     * @function checkGameWispSub
     * @param {String}
     */
    function checkGameWispSub(username) {
        if (!gameWispAuthenticated) {
            return;
        }

        if (!$.bot.isModuleEnabled('./handlers/gameWispHandler.js')) {
            return;
        }
        $.consoleDebug('checkGameWispSub(' + username + ')');

        var jsonString = $.gamewisp.getUserSubInfoString(username) + '',
            jsonData = JSON.parse(jsonString);

        $.consoleDebug('checkGameWispSub(' + username + '): ' + jsonString);

        if (jsonData['error_description'] !== undefined) {
            if (jsonData['error_description'].equals('The resource owner or authorization server denied the request.')) {
                gameWispAuthenticated = false;
                $.log.error('GameWisp: Access denied, please check your access tokens, will stop checking subscriber status.');
                return;
            }
        }

        if (jsonData['result'] === undefined) {
            return;
        }

        // If an error occurs in the API, pull back data from the database.
        if (jsonData['result']['status'] != 1) {
            $.consoleDebug('checkGameWispSub(' + username + '): status != 1');
            if ($.getIniDbBoolean('gamewispsubs', username, false)) {
                $.addGWSubUsersList($.users[i][0], $.getIniDbNumber('gamewispsubs', username + '_tier', 1));
            }
            return;
        }
        if (jsonData['data'][0] == undefined) {
            $.consoleDebug('checkGameWispSub(' + username + '): data is undefined');
            if ($.getIniDbBoolean('gamewispsubs', username, false)) {
                $.addGWSubUsersList($.users[i][0], $.getIniDbNumber('gamewispsubs', username + '_tier', 1));
            }
            return;
        }
        if (jsonData['data'][0]['status'] == undefined) {
            $.consoleDebug('checkGameWispSub(' + username + '): status is undefined');
            if ($.getIniDbBoolean('gamewispsubs', username, false)) {
                $.addGWSubUsersList($.users[i][0], $.getIniDbNumber('gamewispsubs', username + '_tier', 1));
            }
            return;
        }

        if (jsonData['data'][0]['status'].equals('inactive')) {
            $.consoleDebug('checkGameWispSub(' + username + '): inactive account');
            $.delGWSubUsersList(username);
            $.restoreSubscriberStatus(username, false);
        } else {
            $.consoleDebug('checkGameWispSub(' + username + '): adding to sub users list');
            $.addGWSubUsersList(username, parseInt(jsonData['data'][0]['tier']['data']['level']));
            $.consoleDebug('checkGameWispSub(' + username + '): calling DB update; mods are ignored');
            $.restoreSubscriberStatus(username, false);
            $.consoleDebug('checkGameWispSub(' + username + '): handler complete');
        }
    }

    /**
     * @function getTierData
     * @param {String}
     * @param {String}
     * @return {Number}
     */
    function getTierData(username, tierKey) {
        var tier = $.getGWTier(username.toLowerCase());
        return tierData[tierKey][tier];
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var command = event.getCommand(),
            sender = event.getSender().toLowerCase(),
            args = event.getArgs();

        /*
         * @commandpath gamewisp - Base command for GameWisp options.
         */
        if (command.equalsIgnoreCase('gamewisp')) {
            var langSubCommandHelper = ['submessage', 'resubmessage', 'togglemessage', 'reward', 'resubreward'];

            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.usage', langSubCommandHelper.join(' | ')));
                return;
            }

            /*
             * @commandpath gamewisp submessage [message] - Edit/show the new subscription message for GameWisp.
             */
            if (args[0].equalsIgnoreCase('submessage')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.submessage.usage', subMessage));
                    return;
                }
                subMessage = args.splice(1).join(' ');
                $.inidb.set('gameWispSubHandler', 'subscribeMessage', subMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.submessage.success', subMessage));
                return;
            }

            /*
             * @commandpath gamewisp resubmessage [message] - Edit/show the resubscription message for GameWisp.
             */
            if (args[0].equalsIgnoreCase('resubmessage')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.resubmessage.usage', reSubMessage));
                    return;
                }
                reSubMessage = args.splice(1).join(' ');
                $.inidb.set('gameWispSubHandler', 'reSubscribeMessage', reSubMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.resubmessage.success', reSubMessage));
                return;
            }

            /* 
             * @commandpath gamewisp tierupmessage [message] - Edit/show the tier upgrade message for GameWisp.
             */
            if (args[0].equalsIgnoreCase('tierupmessage')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.tierupmessage.usage', tierUpMessage));
                    return;
                }
                tierUpMessage = args.splice(1).join(' ');
                $.inidb.set('gameWispSubHandler', 'tierUpMessage', tierUpessage);
                $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.tierupmessage.success', tierUpMessage));
                return;
            }

            /*
             * @commandpath gamewisp togglemessage [on/off] - Toggle/show the setting for showing GameWisp sub and resub messages.
             */
            if (args[0].equalsIgnoreCase('togglemessage')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.togglemessage.usage', subShowMessages));
                    return;
                }
                if (args[1].equalsIgnoreCase("on")) {
                    $.setIniDbBoolean('gameWispSubHandler', 'subscriberShowMessages', true);
                } else if (args[1].equalsIgnoreCase("off")) {
                    $.setIniDbBoolean('gameWispSubHandler', 'subscriberShowMessages', false);
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.togglemessage.usage', subShowMessages));
                    return;
                }
                $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.togglemessage.success', subShowMessages));
                return;
            }

            /*
             * @commandpath gamewisp reward [points] - Set/show base points given for a subscriber. Tiers can add onto this.
             */
            if (args[0].equalsIgnoreCase('reward')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.reward.usage', subReward));
                    return;
                }
                if (isNaN(args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.reward.usage', subReward));
                    return;
                }
                subReward = parseInt(args[1]);
                $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.reward.success', subReward));
                return;
            }

            /*
             * @commandpath gamewisp resubreward [points] - Set/show base points given for a resubscriber. Tiers can add onto this.
             */
            if (args[0].equalsIgnoreCase('resubreward')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.resubreward.usage', reSubReward));
                    return;
                }
                if (isNaN(args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.resubreward.usage', reSubReward));
                    return;
                }
                reSubReward = parseInt(args[1]);
                $.say($.whisperPrefix(sender) + $.lang.get('gamewisp.resubreward.success', reSubReward));
                return;
            }
        }

        /*
         * @commandpath gamewisp tier - Base command for GameWisp tier options.
         */
        if (command.equalsIgnoreCase('gamewisptier')) {
            var tierLevel = 0,
                newValue = 0,
                oldValue = 0,
                subCommands = ['songrequests', 'bonuspoints', 'subbonuspoints'];

            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('gamewisptier.usage', subCommands.join(' | ')));
                return;
            }

            /*
             * @commandpath gamewisptier songrequest [tier] [number] - Set/view number of additional song requests per tier.
             * @commandpath gamewisptier bonuspoints [tier] [points] - Set/view point percentage bonus, use whole numbers (30 = 30%).
             * @commandpath gamewisptier subbonuspoints [tier] [points] - Set/view bonus points to give for sub or resubbing per tier.
             *
             * NOTE: When adding more options, ensure that the primary key of tierData and the database key and lang file entries
             * match the subcommand. This function will then take care of all of the rest for you.
             */
            if (subCommands.indexOf(args[0] + '') !== -1) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('gamewisptier.' + args[0] + '.usage'));
                    return;
                }

                tierLevel = parseInt(args[1]);
                if (isNaN(tierLevel) || tierLevel < 1 || tierLevel > 6) {
                    $.say($.whisperPrefix(sender) + $.lang.get('gamewisptier.' + args[0] + '.usage'));
                    return;
                }

                oldValue = tierData[args[0]][tierLevel];
                if (args.length < 3) {
                    $.say($.whisperPrefix(sender) + $.lang.get('gamewisptier.' + args[0] + '.usage.tier', tierLevel, oldValue));
                    return;
                }

                newValue = parseInt(args[2]);
                if (isNaN(newValue) || newValue < 1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('gamewisptier.' + args[0] + 'usage.tier', tierLevel, oldValue));
                    return;
                }

                tierData[args[0]][tierLevel] = newValue;
                $.inidb.set('gameWispTiers', args[0] + '_' + tierLevel, newValue);
                $.say($.whisperPrefix(sender) + $.lang.get('gamewisptier.' + args[0] + '.success', tierLevel, oldValue, newValue));
                return;
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/gameWispHandler.js')) {
            $.registerChatCommand('./handlers/gameWispHandler.js', 'gamewisp', 1);
            $.registerChatCommand('./handlers/gameWispHandler.js', 'gamewisptier', 1);
        }
    });

    /** Export functions to API */
    $.getTierData = getTierData;
    $.checkGameWispSub = checkGameWispSub;
    $.updateGameWispDB = updateGameWispDB;
})();
