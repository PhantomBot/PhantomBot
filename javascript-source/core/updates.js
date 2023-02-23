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

/**
 * updater.js
 *
 * Update PhantomBot database
 *
 * This module will be executed before loading any of the other scripts even the core!
 * Add a new wrapped function if you want to apply updates for a new version
 */

/**
 * PhantomBot v3.5.0
 */
(function () {
    var modules,
            versions,
            sounds,
            i;

    /** New setup */
    if ($.changed !== undefined && $.changed !== null && $.changed === true && !$.inidb.GetBoolean('updates', '', 'installedNewBot')) {
        $.consoleLn('');
        $.consoleLn('Initializing PhantomBot version ' + $.version + ' for the first time...');

        modules = [
            './commands/topCommand.js',
            './commands/highlightCommand.js',
            './commands/deathctrCommand.js',
            './commands/dualstreamCommand.js',
            './games/8ball.js',
            './games/adventureSystem.js',
            './games/killCommand.js',
            './games/random.js',
            './games/roll.js',
            './games/roulette.js',
            './games/slotMachine.js',
            './games/gambling.js',
            './handlers/followHandler.js',
            './handlers/subscribeHandler.js',
            './handlers/donationHandler.js',
            './handlers/wordCounter.js',
            './handlers/gameWispHandler.js',
            './handlers/keywordHandler.js',
            './handlers/tipeeeStreamHandler.js',
            './systems/cleanupSystem.js',
            './systems/greetingSystem.js',
            './systems/pointSystem.js',
            './systems/noticeSystem.js',
            './systems/pollSystem.js',
            './systems/quoteSystem.js',
            './systems/raffleSystem.js',
            './systems/ticketraffleSystem.js',
            './systems/raidSystem.js',
            './systems/youtubePlayer.js',
            './systems/ranksSystem.js',
            './systems/auctionSystem.js',
            './systems/audioPanelSystem.js',
            './systems/queueSystem.js',
            './systems/bettingSystem.js',
            './commands/nameConverter.js',
            './handlers/clipHandler.js',
            './handlers/dataServiceHandler.js',
            './handlers/gameScanHandler.js',
            './discord/handlers/bitsHandler.js',
            './discord/handlers/followHandler.js',
            './discord/handlers/subscribeHandler.js',
            './discord/handlers/tipeeeStreamHandler.js',
            './discord/handlers/streamlabsHandler.js',
            './discord/handlers/keywordHandler.js',
            './discord/handlers/streamHandler.js',
            './discord/systems/greetingsSystem.js',
            './systems/welcomeSystem.js',
            './discord/commands/customCommands.js',
            './discord/games/8ball.js',
            './discord/games/kill.js',
            './discord/games/random.js',
            './discord/games/roulette.js',
            './discord/games/gambling.js',
            './discord/games/roll.js',
            './discord/games/slotMachine.js',
            './discord/systems/pointSystem.js'
        ];

        $.consoleLn('Disabling default modules...');
        for (i in modules) {
            $.inidb.set('modules', modules[i], 'false');
        }

        $.consoleLn('Adding default custom commands...');
        $.inidb.set('command', 'uptime', '(pointtouser) (channelname) has been online for (uptime)');
        $.inidb.set('command', 'followage', '(followage)');
        $.inidb.set('command', 'playtime', '(pointtouser) (channelname) has been playing (game) for (playtime)');
        $.inidb.set('command', 'title', '(pointtouser) (titleinfo)');
        $.inidb.set('command', 'game', '(pointtouser) (gameinfo)');
        $.inidb.set('command', 'age', '(age)');

        versions = ['installedv3.3.0', 'installedv3.3.6', 'installedv3.4.1', 'installedv3.5.0', 'installedv3.6.0', 'installedv3.6.2.5',
            'installedv3.6.3', 'installedv3.6.4', 'installedv3.6.4-1', 'installedv3.6.4.2', 'installedv3.6.4.5', 'installedv3.6.5.0',
            'installedv3.7.0.0', 'installedv3.7.3.2'
        ];
        for (i in versions) {
            $.inidb.set('updates', versions[i], 'true');
        }

        sounds = "";
        modules = "";
        versions = "";
        $.changed = false;
        $.inidb.SetBoolean('updates', '', 'installedNewBot', true);
        $.consoleLn('Initializing complete!');
        $.consoleLn('');
    }

    /* version 3.3.0 updates */
    if (!$.inidb.GetBoolean('updates', '', 'installedv3.3.0')) {
        $.consoleLn('Starting PhantomBot update 3.3.0 updates...');

        $.consoleLn('Updating keywords...');
        var keys = $.inidb.GetKeyList('keywords', ''),
                newKeywords = [],
                key,
                json,
                i,
                strippedKeys = {};

        for (i = 0; i < keys.length; i++) {
            key = keys[i];
            json = JSON.parse($.inidb.get('keywords', key));
            if (json.isRegex) {
                json.isCaseSensitive = true;
                key = key.replace('regex:', '');
                json.keyword = json.keyword.replace('regex:', '');
            } else {
                json.isCaseSensitive = false;
            }
            if (strippedKeys.hasOwnProperty(key)) {
                throw 'Could not update keywords list. The keyword "' + key +
                        '" exists both as regex and as plain keyword. ' +
                        "Please resolve the conflict and restart phantombot.";
            }
            strippedKeys[key] = true;
            newKeywords.push({
                key: key,
                json: json
            });
        }

        $.inidb.RemoveFile('keywords');

        for (i = 0; i < newKeywords.length; i++) {
            $.inidb.set('keywords', newKeywords[i].key, JSON.stringify(newKeywords[i].json));
        }

        $.consoleLn('PhantomBot update 3.3.0 completed!');
        $.inidb.SetBoolean('updates', '', 'installedv3.3.0', true);
    }

    /* version 3.3.6 updates */
    if (!$.inidb.GetBoolean('updates', '', 'installedv3.3.6')) {
        $.consoleLn('Starting PhantomBot update 3.3.6 updates...');

        $.inidb.set('modules', './systems/welcomeSystem.js', 'false');

        $.consoleLn('PhantomBot update 3.3.6 completed!');
        $.inidb.SetBoolean('updates', '', 'installedv3.3.6', true);
    }

    /* version 3.4.1 updates */
    if (!$.inidb.GetBoolean('updates', '', 'installedv3.4.1')) {
        $.consoleLn('Starting PhantomBot update 3.4.1 updates...');

        var keys = $.inidb.GetKeyList('keywords', ''),
                i,
                coolkey,
                json;

        for (i = 0; i < keys.length; i++) {
            json = JSON.parse($.inidb.get('keywords', keys[i]));

            if (json.isCaseSensitive) {
                coolkey = $.inidb.get('coolkey', $.jsString(json.keyword).toLowerCase());
                $.inidb.del('coolkey', $.jsString(json.keyword).toLowerCase());
                $.inidb.set('coolkey', json.keyword, coolkey);
            } else {
                json.keyword = $.jsString(json.keyword).toLowerCase();
                $.inidb.del('keywords', keys[i]);
                $.inidb.set('keywords', json.keyword, JSON.stringify(json));
            }
        }

        $.consoleLn('PhantomBot update 3.4.1 completed!');
        $.inidb.SetBoolean('updates', '', 'installedv3.4.1', true);
    }

    /* version 3.4.8 updates */
    if (!$.inidb.GetBoolean('updates', '', 'installedv3.4.8')) {
        $.consoleLn('Starting PhantomBot update 3.4.8 updates...');

        if ($.inidb.FileExists('notices') || $.inidb.FileExists('noticeSettings')) {
            $.consoleLn('Updating timers...');
            var noticeReqMessages = $.getIniDbNumber('noticeSettings', 'reqmessages'),
                    noticeInterval = $.getIniDbNumber('noticeSettings', 'interval'),
                    noticeToggle = $.getIniDbBoolean('noticeSettings', 'noticetoggle'),
                    noticeOffline = $.getIniDbBoolean('noticeSettings', 'noticeOfflineToggle'),
                    noticeKeys = $.inidb.GetKeyList('notices', ''),
                    noticeIdx,
                    notice,
                    notices = [],
                    disabled = [],
                    disabledKey,
                    noticeTimer;

            noticeKeys.sort();

            for (noticeIdx = 0; noticeIdx < noticeKeys.length; noticeIdx++) {
                if (noticeKeys[noticeIdx].endsWith('_disabled')) {
                    continue;
                }
                notice = $.inidb.get('notices', noticeKeys[noticeIdx]);
                if (notice) {
                    // JSON.stringify will indefinitely hang on serializing Java strings
                    notices.push($.jsString(notice));
                    disabledKey = noticeKeys[noticeIdx] + '_disabled';
                    if ($.inidb.exists('notices', disabledKey)) {
                        disabled.push($.inidb.GetBoolean('notices', '', disabledKey));
                    } else {
                        disabled.push(false);
                    }
                }
            }

            noticeTimer = {
                'name': 'Announcements',
                'reqMessages': isNaN(noticeReqMessages) ? 25 : noticeReqMessages,
                'intervalMin': isNaN(noticeInterval) ? 10 : noticeInterval,
                'intervalMax': isNaN(noticeInterval) ? 10 : noticeInterval,
                'shuffle': false,
                'noticeToggle': noticeToggle,
                'noticeOfflineToggle': noticeOffline,
                'messages': notices,
                'disabled': disabled
            };

            $.inidb.set('noticeTmp', '0', JSON.stringify(noticeTimer));
            $.inidb.RemoveFile('noticeSettings');
            $.inidb.RemoveFile('notices');
            $.inidb.RenameFile('noticeTmp', 'notices');
        }


        $.consoleLn('PhantomBot update 3.4.8 completed!');
        $.inidb.SetBoolean('updates', '', 'installedv3.4.8', true);
    }

    /* version 3.5.0 updates */
    if (!$.inidb.GetBoolean('updates', '', 'installedv3.5.0')) {
        $.consoleLn('Starting PhantomBot update 3.5.0 updates...');

        // Remove org.mozilla.javascript entries in phantombot_time
        var keys = $.inidb.GetKeyList('time', ''),
                i;

        $.consoleLn('Checking ' + keys.length + ' time entries for bad keys...');

        for (i = 0; i < keys.length; i++) {
            var key = $.javaString(keys[i]);
            if (key === null || key === undefined || key.startsWith('org.mozilla.javascript')) {
                $.inidb.RemoveKey('time', '', key);
            }
            if (i % 100 === 0) {
                $.consoleLn('Still checking time entries ' + i + '/' + keys.length + '...');
            }
        }

        $.consoleLn('PhantomBot update 3.5.0 completed!');
        $.inidb.SetBoolean('updates', '', 'installedv3.5.0', true);
    }

    /* version 3.6.0 updates */
    if (!$.inidb.GetBoolean('updates', '', 'installedv3.6.0')) {
        $.consoleLn('Starting PhantomBot update 3.6.0 updates...');

        // Convert cooldowns to separate global and user cooldowns
        var cooldowns = $.inidb.GetKeyList('cooldown', ''),
                json,
                i;


        for (i in cooldowns) {
            json = JSON.parse($.inidb.get('cooldown', cooldowns[i]));

            var globalSec,
                    userSec,
                    curSec = parseInt(json.seconds);

            if (json.isGlobal.toString().equals('true')) {
                globalSec = curSec;
                userSec = -1;
            } else {
                globalSec = -1;
                userSec = curSec;
            }

            $.inidb.set('cooldown', cooldowns[i], JSON.stringify({
                command: String(json.command),
                globalSec: globalSec,
                userSec: userSec
            }));
        }

        if ($.inidb.exists('settings', 'quoteMessage')) {
            $.inidb.set('settings', 'quoteMessage', $.inidb.get('settings', 'quoteMessage').replace('(user)', '(userrank)'));
        }

        // Convert cooldowns to separate global and user cooldowns
        var cooldowns = $.inidb.GetKeyList('discordCooldown', ''),
                json,
                i;


        for (i in cooldowns) {
            json = JSON.parse($.inidb.get('discordCooldown', cooldowns[i]));

            var globalSec,
                    userSec,
                    curSec = parseInt(json.seconds);

            if (json.isGlobal.toString().equals('true')) {
                globalSec = curSec;
                userSec = -1;
            } else {
                globalSec = -1;
                userSec = curSec;
            }

            $.inidb.set('discordCooldown', cooldowns[i], JSON.stringify({
                command: String(json.command),
                globalSec: globalSec,
                userSec: userSec
            }));
        }

        //Send cooldown messages in discord channel? (default=false)
        $.inidb.SetBoolean('discordCooldownSettings', '', 'coolDownMsgEnabled', false);

        $.consoleLn('PhantomBot update 3.6.0 completed!');
        $.inidb.SetBoolean('updates', '', 'installedv3.6.0', true);
    }

    /* version 3.6.2.5 updates */
    if (!$.inidb.GetBoolean('updates', '', 'installedv3.6.2.5')) {
        $.consoleLn('Starting PhantomBot update 3.6.2.5 updates...');

        var keys = $.inidb.GetKeyList('greeting', ''),
                i;

        for (i = 0; i < keys.length; i++) {
            var key = $.javaString(keys[i]);

            if (key === null || key === undefined || key.startsWith('function(n)')) {
                $.inidb.RemoveKey('greeting', '', key);
            }
        }

        $.consoleLn('PhantomBot update 3.6.2.5 completed!');
        $.inidb.SetBoolean('updates', '', 'installedv3.6.2.5', true);
    }

    /* version 3.6.3 updates */
    if (!$.inidb.GetBoolean('updates', '', 'installedv3.6.3')) {
        $.consoleLn('Starting PhantomBot update 3.6.3 updates...');

        var logFiles,
                idx,
                logFileDate,
                logDirs = ['chat', 'chatModerator', 'core', 'core-debug', 'core-error', 'error', 'event', 'patternDetector', 'pointSystem', 'private-messages'],
                logDirIdx;
        for (logDirIdx = 0; logDirIdx < logDirs.length; logDirIdx++) {
            logFiles = $.findFiles('./logs/' + logDirs[logDirIdx], 'txt');
            for (idx = 0; idx < logFiles.length; idx++) {
                logFileDate = logFiles[idx].match(/((\d{2})-(\d{2})-(\d{4}))/);
                if (logFileDate !== null && logFileDate[1] !== null) {
                    $.moveRenameFile('./logs/' + logDirs[logDirIdx] + '/' + logFiles[idx], './logs/' + logDirs[logDirIdx] + '/' + logFiles[idx].replace(/((\d{2})-(\d{2})-(\d{4}))/, '$4-$3-$2'));
                }
            }
        }

        var commands = $.inidb.GetKeyList('cooldown', ''),
                json,
                i;

        for (i in commands) {
            json = JSON.parse($.inidb.get('cooldown', commands[i]));
            json.modsSkip = false;
            $.inidb.set('cooldown', commands[i], JSON.stringify(json));
        }

        if ($.inidb.FileExists('greeting')) {
            var autoGreetEnabled = $.inidb.GetBoolean('greeting', '', 'autoGreetEnabled'),
                    defaultJoinMessage = $.getIniDbString('greeting', 'defaultJoin'),
                    greetingCooldown = $.getIniDbNumber('greeting', 'cooldown');

            $.inidb.SetBoolean('greetingSettings', '', 'autoGreetEnabled', autoGreetEnabled);
            $.setIniDbString('greetingSettings', 'defaultJoin', defaultJoinMessage);
            $.setIniDbNumber('greetingSettings', 'cooldown', greetingCooldown);

            $.inidb.RemoveKey('greeting', '', 'autoGreetEnabled');
            $.inidb.RemoveKey('greeting', '', 'defaultJoin');
            $.inidb.RemoveKey('greeting', '', 'cooldown');
        }

        $.consoleLn('PhantomBot update 3.6.3 completed!');
        $.inidb.SetBoolean('updates', '', 'installedv3.6.3', true);
    }

    if (!$.inidb.GetBoolean('updates', '', 'installedv3.6.4') || !$.inidb.GetBoolean('updates', '', 'installedv3.6.4-1')) {
        $.consoleLn('Starting PhantomBot update 3.6.4 updates...');
        if (!$.inidb.GetBoolean('updates', '', 'installedv3.6.4')) {
            var subMessage = $.getIniDbString('subscribeHandler', 'subscribeMessage', '(name) just subscribed!'),
                    primeSubMessage = $.getIniDbString('subscribeHandler', 'primeSubscribeMessage', '(name) just subscribed with Twitch Prime!'),
                    reSubMessage = $.getIniDbString('subscribeHandler', 'reSubscribeMessage', '(name) just subscribed for (months) months in a row!'),
                    giftSubMessage = $.getIniDbString('subscribeHandler', 'giftSubMessage', '(name) just gifted (recipient) a subscription!'),
                    giftAnonSubMessage = $.getIniDbString('subscribeHandler', 'giftAnonSubMessage', 'An anonymous viewer gifted (recipient) a subscription!'),
                    massGiftSubMessage = $.getIniDbString('subscribeHandler', 'massGiftSubMessage', '(name) just gifted (amount) subscriptions to random users in the channel!'),
                    massAnonGiftSubMessage = $.getIniDbString('subscribeHandler', 'massAnonGiftSubMessage', 'An anonymous viewer gifted (amount) subscriptions to random viewers!'),
                    subReward = $.getIniDbNumber('subscribeHandler', 'subscribeReward', 0),
                    reSubReward = $.getIniDbNumber('subscribeHandler', 'reSubscribeReward', 0),
                    giftSubReward = $.getIniDbNumber('subscribeHandler', 'giftSubReward', 0),
                    massGiftSubReward = $.getIniDbNumber('subscribeHandler', 'massGiftSubReward', 0),
                    customEmote = $.getIniDbString('subscribeHandler', 'resubEmote', ''),
                    subPlan1000 = $.getIniDbString('subscribeHandler', 'subPlan1000', 'Tier 1'),
                    subPlan2000 = $.getIniDbString('subscribeHandler', 'subPlan2000', 'Tier 2'),
                    subPlan3000 = $.getIniDbString('subscribeHandler', 'subPlan3000', 'Tier 3'),
                    subPlanPrime = $.getIniDbString('subscribeHandler', 'subPlanPrime', 'Prime');

            var createSingleJson = function (val) {
                return JSON.stringify({
                    '1000': val,
                    '2000': val,
                    '3000': val,
                    'Prime': val
                });
            };

            var createSingleNPJson = function (val) {
                return JSON.stringify({
                    '1000': val,
                    '2000': val,
                    '3000': val
                });
            };

            var createDuoJson = function (val, vPrime) {
                return JSON.stringify({
                    '1000': val,
                    '2000': val,
                    '3000': val,
                    'Prime': vPrime
                });
            };

            var createMultiJson = function (v1000, v2000, v3000, vPrime) {
                return JSON.stringify({
                    '1000': v1000,
                    '2000': v2000,
                    '3000': v3000,
                    'Prime': vPrime
                });
            };

            $.inidb.set('subscribeHandler', 'subscribeMessage', createDuoJson(subMessage, primeSubMessage));
            $.inidb.del('subscribeHandler', 'primeSubscribeMessage');
            $.inidb.set('subscribeHandler', 'reSubscribeMessage', createSingleJson(reSubMessage));
            $.inidb.set('subscribeHandler', 'giftSubMessage', createSingleNPJson(giftSubMessage));
            $.inidb.set('subscribeHandler', 'giftAnonSubMessage', createSingleNPJson(giftAnonSubMessage));
            $.inidb.set('subscribeHandler', 'massGiftSubMessage', createSingleNPJson($.jsString(massGiftSubMessage).replace('(reward)', '(giftreward)')));
            $.inidb.set('subscribeHandler', 'massAnonGiftSubMessage', createSingleNPJson(massAnonGiftSubMessage));
            $.inidb.del('subscribeHandler', 'primeSubscriberWelcomeToggle');
            $.inidb.set('subscribeHandler', 'subscribeReward', createSingleJson(subReward));
            $.inidb.set('subscribeHandler', 'reSubscribeReward', createSingleJson(reSubReward));
            $.inidb.set('subscribeHandler', 'giftSubReward', createSingleNPJson(giftSubReward));
            $.inidb.set('subscribeHandler', 'massGiftSubReward', createSingleNPJson(massGiftSubReward));
            $.inidb.set('subscribeHandler', 'subEmote', createSingleJson(customEmote));
            $.inidb.del('subscribeHandler', 'resubEmote');
            $.inidb.set('subscribeHandler', 'subPlans', createMultiJson(subPlan1000, subPlan2000, subPlan3000, subPlanPrime));
            $.inidb.del('subscribeHandler', 'subPlan1000');
            $.inidb.del('subscribeHandler', 'subPlan2000');
            $.inidb.del('subscribeHandler', 'subPlan3000');
            $.inidb.del('subscribeHandler', 'subPlanPrime');
        }

        var commands = $.inidb.GetKeyList('tempDisabledCommandScript', ''),
                i, cmd;

        for (i in commands) {
            cmd = $.jsString(commands[i]);
            if (cmd.toLowerCase() !== cmd) {
                $.inidb.set('tempDisabledCommandScript', cmd.toLowerCase(), $.inidb.get('tempDisabledCommandScript', cmd));
                $.inidb.del('tempDisabledCommandScript', cmd);
            }
        }

        if ($.inidb.FileExists('traffleState')) {
            var bools = JSON.parse($.inidb.get('traffleState', 'bools'));

            $.inidb.SetBoolean('traffleState', '', 'followers', (bools[0] === 'true'));
            $.inidb.RemoveKey('traffleState', '', 'bools');

            if ($.inidb.FileExists('traffleSettings')) {
                $.inidb.set('traffleState', 'isActive', $.inidb.get('traffleSettings', 'isActive'));
                $.inidb.RemoveKey('traffleSettings', '', 'isActive');
            }
        }

        $.inidb.set('traffleSettings', 'traffleMSGToggle', $.inidb.get('settings', 'tRaffleMSGToggle'));
        $.inidb.set('traffleSettings', 'traffleMessage', $.inidb.get('settings', 'traffleMessage'));
        $.inidb.set('traffleSettings', 'traffleMessageInterval', $.inidb.get('settings', 'traffleMessageInterval'));
        $.inidb.set('traffleSettings', 'traffleLimiter', $.inidb.get('settings', 'tRaffleLimiter'));
        $.inidb.RemoveKey('settings', '', 'traffleMSGToggle');
        $.inidb.RemoveKey('settings', '', 'traffleMessage');
        $.inidb.RemoveKey('settings', '', 'traffleMessageInterval');
        $.inidb.RemoveKey('settings', '', 'traffleLimiter');

        var calcBonus = function (subTMulti, regTMulti, user, tickets) {
            var bonus = tickets;

            if ($.isSub(user, null)) {
                bonus = tickets * subTMulti;
            } else if ($.isRegular(user)) {
                bonus = tickets * regTMulti;
            }

            return Math.round(bonus - tickets);
        };

        if ($.inidb.FileExists('ticketsList') && $.inidb.HasKey('traffleState', '', 'subTMulti') && $.inidb.HasKey('traffleState', '', 'regTMulti')) {
            var users = $.inidb.GetKeyList('ticketsList', ''),
                    first = $.inidb.get('ticketsList', users[0]),
                    subTMulti = parseInt($.inidb.get('traffleState', 'subTMulti')),
                    regTMulti = parseInt($.inidb.get('traffleState', 'regTMulti'));

            if (!isNaN(first)) { // NaN = JSON present instead of a basic ticket count (old value) - do not update the list
                for (var i = 0; i < users.length; i++) {
                    var times = $.getIniDbNumber('ticketsList', users[i]),
                            bonus = calcBonus(subTMulti, regTMulti, users[i], times);

                    $.inidb.set('ticketsList', users[i], JSON.stringify([times, bonus]));
                }
            }
        }

        $.consoleLn('PhantomBot update 3.6.4 completed!');
        $.inidb.SetBoolean('updates', '', 'installedv3.6.4', true);
        $.inidb.SetBoolean('updates', '', 'installedv3.6.4-1', true);
    }

    if (!$.inidb.GetBoolean('updates', '', 'installedv3.6.4.2')) {
        $.consoleLn('Starting PhantomBot update 3.6.4.2 updates...');
        if ($.inidb.FileExists('raffleState')) {
            var bools = JSON.parse($.inidb.get('raffleState', 'bools'));

            $.inidb.SetBoolean('raffleState', '', 'isFollowersOnly', (bools[0] === 'true'));
            $.inidb.SetBoolean('raffleState', '', 'isSubscribersOnly', (bools[1] === 'true'));
            $.inidb.SetBoolean('raffleState', '', 'usePoints', (bools[2] === 'true'));
            //bools[3] Is the old status we won't be using anymore ([followers, subscribers, usePoints, status, hasDrawn])
            $.inidb.SetBoolean('raffleState', '', 'hasDrawn', (bools[4] === 'true'));
            $.inidb.RemoveKey('raffleState', '', 'bools');

            if ($.inidb.FileExists('raffleSettings')) {
                $.inidb.set('raffleState', 'isActive', $.inidb.get('raffleSettings', 'isActive'));
                $.inidb.RemoveKey('raffleSettings', '', 'isActive');
            }
        }

        $.consoleLn('PhantomBot update 3.6.4.2 completed!');
        $.inidb.SetBoolean('updates', '', 'installedv3.6.4.2', true);
    }


    if (!$.inidb.GetBoolean('updates', '', 'installedv3.6.4.5')) {
        $.consoleLn('Starting PhantomBot update 3.6.4.5 updates...');

        $.inidb.RemoveFile('ytcache');

        $.consoleLn('PhantomBot update 3.6.4.5 completed!');
        $.inidb.SetBoolean('updates', '', 'installedv3.6.4.5', true);
    }


    if (!$.inidb.GetBoolean('updates', '', 'installedv3.6.5.0')) {
        $.consoleLn('Starting PhantomBot update 3.6.5.0 updates...');

        if (!$.inidb.GetBoolean('updates', '', 'installedv3.6.5.0')) {
            $.inidb.RemoveKey('settings', '', 'gamesList-lastCheck');
        }

        $.consoleLn('PhantomBot update 3.6.5.0 completed!');
        $.inidb.SetBoolean('updates', '', 'installedv3.6.5.0', true);
    }


    if (!$.inidb.GetBoolean('updates', '', 'installedv3.7.0.0')) {
        $.consoleLn('Starting PhantomBot update 3.7.0.0 updates...');

        var cpcommands = JSON.parse($.getSetIniDbString('channelPointsSettings', 'commands', '[]'));

        var transferID = $.jsString($.getIniDbString('channelPointsSettings', 'transferID', 'noIDSet'));
        var giveAllID = $.jsString($.getIniDbString('channelPointsSettings', 'giveAllID', 'noIDSet'));
        var emoteOnlyID = $.jsString($.getIniDbString('channelPointsSettings', 'emoteOnlyID', 'noIDSet'));
        var timeoutID = $.jsString($.getIniDbString('channelPointsSettings', 'timeoutID', 'noIDSet'));

        if (transferID !== 'noIDSet' && $.getIniDbBoolean('channelPointsSettings', 'transferToggle', false)) {
            var transferAmount = $.getIniDbNumber('channelPointsSettings', 'transferAmount', 0);
            var tdata = {
                'id': transferID,
                'title': $.jsString($.getIniDbString('channelPointsSettings', 'transferReward', 'noNameSet')),
                'command': '(addpoints ' + transferAmount + ' (cpusername))@(cpdisplayname), you have been awarded ' + transferAmount + ' (pointname ' + transferAmount
                        + ') by redeeming (cptitle)'
            };
            cpcommands.push(tdata);
        }
        $.inidb.del('channelPointsSettings', 'transferToggle');
        $.inidb.del('channelPointsSettings', 'transferAmount');
        $.inidb.del('channelPointsSettings', 'transferID');
        $.inidb.del('channelPointsSettings', 'transferConfig');
        $.inidb.del('channelPointsSettings', 'transferReward');

        if (giveAllID !== 'noIDSet' && $.getIniDbBoolean('channelPointsSettings', 'giveAllToggle', false)) {
            var giveAllAmount = $.getIniDbNumber('channelPointsSettings', 'giveAllAmount', 0);
            var gdata = {
                'id': giveAllID,
                'title': $.jsString($.getIniDbString('channelPointsSettings', 'giveAllReward', 'noNameSet')),
                'command': '(addpointstoall ' + giveAllAmount + ')'
            };
            cpcommands.push(gdata);
        }
        $.inidb.del('channelPointsSettings', 'giveAllToggle');
        $.inidb.del('channelPointsSettings', 'giveAllAmount');
        $.inidb.del('channelPointsSettings', 'giveAllID');
        $.inidb.del('channelPointsSettings', 'giveAllConfig');
        $.inidb.del('channelPointsSettings', 'giveAllReward');

        if (emoteOnlyID !== 'noIDSet' && $.getIniDbBoolean('channelPointsSettings', 'emoteOnlyToggle', false)) {
            var emoteOnlyDuration = $.getIniDbNumber('channelPointsSettings', 'emoteOnlyDuration', 0);
            var edata = {
                'id': emoteOnlyID,
                'title': $.jsString($.getIniDbString('channelPointsSettings', 'emoteOnlyReward', 'noNameSet')),
                'command': '(delaysay ' + emoteOnlyDuration + ' /emoteonlyoff)/emoteonly'
            };
            cpcommands.push(edata);
        }
        $.inidb.del('channelPointsSettings', 'emoteOnlyToggle');
        $.inidb.del('channelPointsSettings', 'emoteOnlyDuration');
        $.inidb.del('channelPointsSettings', 'emoteOnlyID');
        $.inidb.del('channelPointsSettings', 'emoteOnlyConfig');
        $.inidb.del('channelPointsSettings', 'emoteOnlyReward');

        if (timeoutID !== 'noIDSet' && $.getIniDbBoolean('channelPointsSettings', 'timeoutToggle', false)) {
            var timeoutDuration = $.getIniDbNumber('channelPointsSettings', 'timeoutDuration', 0);
            var odata = {
                'id': timeoutID,
                'title': $.jsString($.getIniDbString('channelPointsSettings', 'timeoutReward', 'noNameSet')),
                'command': '(delaysay 1 (cpinput) has been timed out for ' + timeoutDuration + ' seconds by (cpdisplayname))/timeout (sanitizeuser (cpinput)) ' + timeoutDuration
            };
            cpcommands.push(odata);
        }
        $.inidb.del('channelPointsSettings', 'timeoutToggle');
        $.inidb.del('channelPointsSettings', 'timeoutDuration');
        $.inidb.del('channelPointsSettings', 'timeoutID');
        $.inidb.del('channelPointsSettings', 'timeoutConfig');
        $.inidb.del('channelPointsSettings', 'timeoutReward');

        $.setIniDbString('channelPointsSettings', 'commands', JSON.stringify(cpcommands));

        $.consoleLn('PhantomBot update 3.7.0.0 completed!');
        $.inidb.SetBoolean('updates', '', 'installedv3.7.0.0', true);
    }

    if (!$.inidb.GetBoolean('updates', '', 'installedv3.7.3.2')) {
        $.consoleLn('Starting PhantomBot update 3.7.3.2 updates...');

        let keys = $.inidb.GetKeyList('command', '');

        for (let i in keys) {
            try {
                let command = $.jsString($.inidb.get('command', keys[i]));

                if (command.includes('(customapi ')) {
                    command = command.replace(command, '(customapi ', '(customapi (encodeurl ');
                    let start = command.indexOf('(customapi (encodeurl ');
                    let tkn = command.indexOf('(token)', start);
                    let idx = command.indexOf(')',  tkn > 0 ? tkn + 1 : start);

                    if (idx > 0) {
                        let newcommand = command.substring(0, idx) + ')' + command.substring(idx);
                        $.inidb.set('command', keys[i], newcommand);
                    }
                }

                if (command.includes('(customapijson ')) {
                    command = command.replace(command, '(customapijson ', '(customapijson (encodeurl ');
                    let start = command.indexOf('(customapijson (encodeurl ');
                    let tkn = command.indexOf('(token)', start);
                    let idx = command.indexOf(' ',  tkn > 0 ? tkn + 1 : start);

                    if (idx > 0) {
                        let newcommand = command.substring(0, idx) + ')' + command.substring(idx);
                        $.inidb.set('command', keys[i], newcommand);
                    }
                }
            } catch (e) {}
        }

        $.consoleLn('PhantomBot update 3.7.3.2 completed!');
        $.inidb.SetBoolean('updates', '', 'installedv3.7.3.2', true);
    }

    if (!Packages.tv.phantombot.twitch.api.TwitchValidate.instance().hasChatScope('moderator:manage:banned_users')) {
        Packages.com.gmt2001.Console.warn.println('');
        Packages.com.gmt2001.Console.warn.println('');
        Packages.com.gmt2001.Console.warn.println('New Bot (Chat) OAuth required by Twitch to continue using ban/timeout/purge on the bot');
        Packages.com.gmt2001.Console.warn.println('Please visit the OAuth page on the panel and re-auth the Bot');
        Packages.com.gmt2001.Console.warn.println('');
        Packages.com.gmt2001.Console.warn.println('');
    }

    $.bind('webPanelSocketConnect', function (event) {
        setTimeout(function () {
            if (!Packages.tv.phantombot.twitch.api.TwitchValidate.instance().hasChatScope('moderator:manage:banned_users')) {
                $.panelsocketserver.panelNotification('warning', 'New Bot (Chat) OAuth required by Twitch to continue using ban/timeout/purge on the bot'
                        + '<br />Please visit the <a href="../oauth/" style="text-decoration: underline" target="_blank" rel="noopener noreferrer">OAuth page</a> and re-auth the Bot',
                        'OAuth Scope Change', 0, 0, false);
            } else {
                let missingChatScopes = Packages.tv.phantombot.twitch.api.TwitchValidate.instance().getMissingChatScopes();
                let missingAPIScopes = Packages.tv.phantombot.twitch.api.TwitchValidate.instance().getMissingAPIScopes();

                if (!missingChatScopes.isEmpty()) {
                    let scopes = '';

                    for (let i = 0; i < missingChatScopes.size(); i++) {
                        scopes += '<li>' + missingChatScopes.get(i) + '</li>';
                    }

                    $.panelsocketserver.panelNotification('info', 'The following new Bot (Chat) OAuth scopes are available:'
                        + '<br /><ul>'
                        + scopes
                        + '</ul>'
                        + '<br /><br />Please visit the <a href="../oauth/" style="text-decoration: underline" target="_blank" rel="noopener noreferrer">OAuth page</a> and re-auth the Bot to add them',
                        'New Bot (Chat) OAuth Scopes', 20e3, 60e3, true);
                }

                if (!missingAPIScopes.isEmpty()) {
                    let scopes = '';

                    for (let i = 0; i < missingAPIScopes.size(); i++) {
                        scopes += '<li>' + missingAPIScopes.get(i) + '</li>';
                    }

                    $.panelsocketserver.panelNotification('info', 'The following new Broadcaster (API) OAuth scopes are available:'
                        + '<br /><ul>'
                        + scopes
                        + '</ul>'
                        + '<br /><br />Please visit the <a href="../oauth/" style="text-decoration: underline" target="_blank" rel="noopener noreferrer">OAuth page</a> and re-auth the Broadcaster to add them',
                        'New Broadcaster (API) OAuth Scopes', 20e3, 60e3, true);
                }
            }
        }, 2000);
    });
})();
