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
 * This module will be executed before loading any of the non-bootstrap scripts
 */
(function () {
    let updates = [];

    function newSetup() {
        $.consoleLn('');
        $.consoleLn('Initializing PhantomBot version ' + $.version + ' for the first time...');

        let modules = [
            './commands/dualstreamCommand.js',
            './commands/highlightCommand.js',
            './discord/games/8ball.js',
            './discord/games/gambling.js',
            './discord/games/kill.js',
            './discord/games/random.js',
            './discord/games/roll.js',
            './discord/games/roulette.js',
            './discord/games/slotMachine.js',
            './discord/handlers/streamElementsHandler.js',
            './discord/handlers/streamlabsHandler.js',
            './discord/handlers/tipeeeStreamHandler.js',
            './discord/systems/greetingsSystem.js',
            './discord/systems/pointSystem.js',
            './handlers/donationHandler.js',
            './handlers/streamElementsHandler.js',
            './handlers/tipeeeStreamHandler.js',
            './handlers/wordCounter.js',
            './systems/cleanupSystem.js',
            './systems/greetingSystem.js',
            './systems/queueSystem.js',
            './systems/welcomeSystem.js',
            './systems/youtubePlayer.js'
        ];

        $.consoleLn('Settings initial disabled modules...');
        for (let i in modules) {
            $.inidb.set('modules', modules[i], 'false');
        }

        $.consoleLn('Adding default custom commands...');
        $.inidb.set('command', 'uptime', '(pointtouser) (channelname) has been online for (uptime)');
        $.inidb.set('command', 'followage', '(followage)');
        $.inidb.set('command', 'playtime', '(pointtouser) (channelname) has been playing (game) for (playtime)');
        $.inidb.set('command', 'title', '(pointtouser) (titleinfo)');
        $.inidb.set('command', 'game', '(pointtouser) (gameinfo)');
        $.inidb.set('command', 'age', '(age)');

        $.consoleLn('Fast-forwarding updates...');
        for (let x in updates) {
            $.inidb.SetBoolean('updates', '', updates[x].variable, true);
        }

        $.inidb.SetBoolean('updates', '', 'installedNewBot', true);
        $.consoleLn('Initialization complete!');
        $.consoleLn('');
    }

    function addUpdate(version, variable, fn) {
        updates.push({version: version, variable: variable, fn: fn});
    }

    // ------ Add updates below this line in execution order ------

    addUpdate('3.3.0', 'installedv3.3.0', function() {
        $.consoleLn('Updating keywords...');
        let keys = $.inidb.GetKeyList('keywords', ''),
                newKeywords = [],
                key,
                json,
                strippedKeys = {};

        for (let i = 0; i < keys.length; i++) {
            key = keys[i];
            json = JSON.parse($.getIniDbString('keywords', key));
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

        for (let i = 0; i < newKeywords.length; i++) {
            $.inidb.set('keywords', newKeywords[i].key, JSON.stringify(newKeywords[i].json));
        }
    });

    addUpdate('3.3.6', 'installedv3.3.6', function() {
        $.inidb.set('modules', './systems/welcomeSystem.js', 'false');
    });

    addUpdate('3.4.1', 'installedv3.4.1', function() {
        let keys = $.inidb.GetKeyList('keywords', ''),
                coolkey,
                json;

        for (let i = 0; i < keys.length; i++) {
            json = JSON.parse($.getIniDbString('keywords', keys[i]));

            if (json.isCaseSensitive) {
                coolkey = $.getIniDbString('coolkey', $.jsString(json.keyword).toLowerCase());
                $.inidb.del('coolkey', $.jsString(json.keyword).toLowerCase());
                $.inidb.set('coolkey', json.keyword, coolkey);
            } else {
                json.keyword = $.jsString(json.keyword).toLowerCase();
                $.inidb.del('keywords', keys[i]);
                $.inidb.set('keywords', json.keyword, JSON.stringify(json));
            }
        }
    });

    addUpdate('3.4.8', 'installedv3.4.8', function() {
        if ($.inidb.FileExists('notices') || $.inidb.FileExists('noticeSettings')) {
            $.consoleLn('Updating timers...');
            let noticeReqMessages = $.getIniDbNumber('noticeSettings', 'reqmessages'),
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
                notice = $.getIniDbString('notices', noticeKeys[noticeIdx]);
                if (notice) {
                    // JSON.stringify will indefinitely hang on serializing Java strings
                    notices.push($.jsString(notice));
                    disabledKey = noticeKeys[noticeIdx] + '_disabled';
                    if ($.inidb.exists('notices', disabledKey)) {
                        disabled.push($.getIniDbBoolean('notices', disabledKey));
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
    });

    addUpdate('3.5.0', 'installedv3.5.0', function() {
        // Remove org.mozilla.javascript entries in phantombot_time
        let keys = $.inidb.GetKeyList('time', '');

        $.consoleLn('Checking ' + keys.length + ' time entries for bad keys...');

        for (let i = 0; i < keys.length; i++) {
            let key = $.javaString(keys[i]);
            if (key === null || key === undefined || key.startsWith('org.mozilla.javascript')) {
                $.inidb.RemoveKey('time', '', key);
            }
            if (i % 100 === 0) {
                $.consoleLn('Still checking time entries ' + i + '/' + keys.length + '...');
            }
        }
    });

    addUpdate('3.6.0', 'installedv3.6.0', function() {
        // Convert cooldowns to separate global and user cooldowns
        let cooldowns = $.inidb.GetKeyList('cooldown', ''),
                json;


        for (let i in cooldowns) {
            json = JSON.parse($.getIniDbString('cooldown', cooldowns[i]));

            let globalSec,
                    userSec,
                    curSec = parseInt(json.seconds);

            if (json.isGlobal !== undefined && json.isGlobal.toString().equals('true')) {
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
            $.inidb.set('settings', 'quoteMessage', $.getIniDbString('settings', 'quoteMessage').replace('(user)', '(userrank)'));
        }

        // Convert cooldowns to separate global and user cooldowns
        cooldowns = $.inidb.GetKeyList('discordCooldown', '');


        for (let i in cooldowns) {
            json = JSON.parse($.getIniDbString('discordCooldown', cooldowns[i]));

            let globalSec,
                    userSec,
                    curSec = parseInt(json.seconds);

            if (json.isGlobal !== undefined && json.isGlobal.toString().equals('true')) {
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
    });

    addUpdate('3.6.2.5', 'installedv3.6.2.5', function() {
        let keys = $.inidb.GetKeyList('greeting', '');

        for (let i = 0; i < keys.length; i++) {
            let key = $.javaString(keys[i]);

            if (key === null || key === undefined || key.startsWith('function(n)')) {
                $.inidb.RemoveKey('greeting', '', key);
            }
        }
    });

    addUpdate('3.6.3', 'installedv3.6.3', function() {
        let logFiles,
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

        let commands = $.inidb.GetKeyList('cooldown', ''),
                json;

        for (let i in commands) {
            json = JSON.parse($.getIniDbString('cooldown', commands[i]));
            json.modsSkip = false;
            $.inidb.set('cooldown', commands[i], JSON.stringify(json));
        }

        if ($.inidb.FileExists('greeting')) {
            let autoGreetEnabled = $.getIniDbBoolean('greeting', 'autoGreetEnabled'),
                    defaultJoinMessage = $.getIniDbString('greeting', 'defaultJoin'),
                    greetingCooldown = $.getIniDbNumber('greeting', 'cooldown');

            $.inidb.SetBoolean('greetingSettings', '', 'autoGreetEnabled', autoGreetEnabled);
            $.setIniDbString('greetingSettings', 'defaultJoin', defaultJoinMessage);
            $.setIniDbNumber('greetingSettings', 'cooldown', greetingCooldown);

            $.inidb.RemoveKey('greeting', '', 'autoGreetEnabled');
            $.inidb.RemoveKey('greeting', '', 'defaultJoin');
            $.inidb.RemoveKey('greeting', '', 'cooldown');
        }

        $.consoleLn('Fixing duplicate database entries...');
        $.inidb.DropIndexes();
        $.inidb.CreateIndexes();
    });

    addUpdate('3.6.4', 'installedv3.6.4', function() {
        let subMessage = $.getIniDbString('subscribeHandler', 'subscribeMessage', '(name) just subscribed!'),
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

        let createSingleJson = function (val) {
            return JSON.stringify({
                '1000': val,
                '2000': val,
                '3000': val,
                'Prime': val
            });
        };

        let createSingleNPJson = function (val) {
            return JSON.stringify({
                '1000': val,
                '2000': val,
                '3000': val
            });
        };

        let createDuoJson = function (val, vPrime) {
            return JSON.stringify({
                '1000': val,
                '2000': val,
                '3000': val,
                'Prime': vPrime
            });
        };

        let createMultiJson = function (v1000, v2000, v3000, vPrime) {
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
    });

    addUpdate('3.6.4-1', 'installedv3.6.4-1', function() {
        let commands = $.inidb.GetKeyList('tempDisabledCommandScript', ''),
                cmd;

        for (let i in commands) {
            cmd = $.jsString(commands[i]);
            if (cmd.toLowerCase() !== cmd) {
                $.inidb.set('tempDisabledCommandScript', cmd.toLowerCase(), $.getIniDbString('tempDisabledCommandScript', cmd));
                $.inidb.del('tempDisabledCommandScript', cmd);
            }
        }

        if ($.inidb.FileExists('traffleState') && $.inidb.HasKey('traffleState', '', 'bools')) {
            let bools = JSON.parse($.getIniDbString('traffleState', 'bools'));

            $.inidb.SetBoolean('traffleState', '', 'followers', (bools[0] === 'true'));
            $.inidb.RemoveKey('traffleState', '', 'bools');

            if ($.inidb.FileExists('traffleSettings')) {
                $.inidb.set('traffleState', 'isActive', $.getIniDbString('traffleSettings', 'isActive'));
                $.inidb.RemoveKey('traffleSettings', '', 'isActive');
            }
        }

        $.inidb.set('traffleSettings', 'traffleMSGToggle', $.getIniDbString('settings', 'tRaffleMSGToggle'));
        $.inidb.set('traffleSettings', 'traffleMessage', $.getIniDbString('settings', 'traffleMessage'));
        $.inidb.set('traffleSettings', 'traffleMessageInterval', $.getIniDbString('settings', 'traffleMessageInterval'));
        $.inidb.set('traffleSettings', 'traffleLimiter', $.getIniDbString('settings', 'tRaffleLimiter'));
        $.inidb.RemoveKey('settings', '', 'traffleMSGToggle');
        $.inidb.RemoveKey('settings', '', 'traffleMessage');
        $.inidb.RemoveKey('settings', '', 'traffleMessageInterval');
        $.inidb.RemoveKey('settings', '', 'traffleLimiter');

        let calcBonus = function (subTMulti, regTMulti, user, tickets) {
            let bonus = tickets;

            if ($.isSub(user, null)) {
                bonus = tickets * subTMulti;
            } else if ($.isRegular(user)) {
                bonus = tickets * regTMulti;
            }

            return Math.round(bonus - tickets);
        };

        if ($.inidb.FileExists('ticketsList') && $.inidb.HasKey('traffleState', '', 'subTMulti') && $.inidb.HasKey('traffleState', '', 'regTMulti')) {
            let users = $.inidb.GetKeyList('ticketsList', ''),
                    first = $.getIniDbString('ticketsList', users[0]),
                    subTMulti = parseInt($.getIniDbString('traffleState', 'subTMulti')),
                    regTMulti = parseInt($.getIniDbString('traffleState', 'regTMulti'));

            if (!isNaN(first)) { // NaN = JSON present instead of a basic ticket count (old value) - do not update the list
                for (let i = 0; i < users.length; i++) {
                    let times = $.getIniDbNumber('ticketsList', users[i]),
                            bonus = calcBonus(subTMulti, regTMulti, users[i], times);

                    $.inidb.set('ticketsList', users[i], JSON.stringify([times, bonus]));
                }
            }
        }
    });

    addUpdate('3.6.4.2', 'installedv3.6.4.2', function() {
        if ($.inidb.FileExists('raffleState') && $.inidb.HasKey('raffleState', '', 'bools')) {
            let bools = JSON.parse($.getIniDbString('raffleState', 'bools'));

            $.inidb.SetBoolean('raffleState', '', 'isFollowersOnly', (bools[0] === 'true'));
            $.inidb.SetBoolean('raffleState', '', 'isSubscribersOnly', (bools[1] === 'true'));
            $.inidb.SetBoolean('raffleState', '', 'usePoints', (bools[2] === 'true'));
            //bools[3] Is the old status we won't be using anymore ([followers, subscribers, usePoints, status, hasDrawn])
            $.inidb.SetBoolean('raffleState', '', 'hasDrawn', (bools[4] === 'true'));
            $.inidb.RemoveKey('raffleState', '', 'bools');

            if ($.inidb.FileExists('raffleSettings')) {
                $.inidb.set('raffleState', 'isActive', $.getIniDbString('raffleSettings', 'isActive'));
                $.inidb.RemoveKey('raffleSettings', '', 'isActive');
            }
        }
    });


    addUpdate('3.6.4.5', 'installedv3.6.4.5', function() {
        $.inidb.RemoveFile('ytcache');
    });


    addUpdate('3.6.5.0', 'installedv3.6.5.0', function() {
        $.inidb.RemoveKey('settings', '', 'gamesList-lastCheck');
    });


    addUpdate('3.7.0.0', 'installedv3.7.0.0', function() {
        let cpcommands = JSON.parse($.getSetIniDbString('channelPointsSettings', 'commands', '[]'));

        let transferID = $.jsString($.getIniDbString('channelPointsSettings', 'transferID', 'noIDSet'));
        let giveAllID = $.jsString($.getIniDbString('channelPointsSettings', 'giveAllID', 'noIDSet'));
        let emoteOnlyID = $.jsString($.getIniDbString('channelPointsSettings', 'emoteOnlyID', 'noIDSet'));
        let timeoutID = $.jsString($.getIniDbString('channelPointsSettings', 'timeoutID', 'noIDSet'));

        if (transferID !== 'noIDSet' && $.getIniDbBoolean('channelPointsSettings', 'transferToggle', false)) {
            let transferAmount = $.getIniDbNumber('channelPointsSettings', 'transferAmount', 0);
            let tdata = {
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
            let giveAllAmount = $.getIniDbNumber('channelPointsSettings', 'giveAllAmount', 0);
            let gdata = {
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
            let emoteOnlyDuration = $.getIniDbNumber('channelPointsSettings', 'emoteOnlyDuration', 0);
            let edata = {
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
            let timeoutDuration = $.getIniDbNumber('channelPointsSettings', 'timeoutDuration', 0);
            let odata = {
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
    });

    addUpdate('3.7.3.2', 'installedv3.7.3.2', function() {
        let keys = $.inidb.GetKeyList('command', '');

        for (let i in keys) {
            try {
                let command = $.jsString($.getIniDbString('command', keys[i]));

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
    });

    addUpdate('3.7.5.0', 'installedv3.7.5.0', function() {
        $.getSetIniDbBoolean('settings', 'isSwappedSubscriberVIP', false);
    });

    addUpdate('3.8.1.0', 'installedv3.8.1.0-1', function() {
        let pointNameSingle = $.getIniDbString('pointSettings', 'pointNameSingle');
        let pointNameMultiple = $.getIniDbString('pointSettings', 'pointNameMultiple');
        let subCommands = [
            'add', 'give', 'take', 'remove', 'set',
            'all', 'takeall', 'setname', 'setgain',
            'setofflinegain', 'setinterval', 'user',
            'resetall', 'setmessage', 'setactivebonus'
        ];

        if (pointNameSingle !== undefined && pointNameSingle !== 'point') {
            for (let x in subCommands) {
                if ($.getIniDbNumber('permcom', (pointNameSingle + ' ' + subCommands[x]), 1) !== 1) {
                    $.setIniDbNumber('permcom', ('points ' + subCommands[x]), $.getIniDbNumber('permcom', (pointNameSingle + ' ' + subCommands[x]), 1));
                }
                $.inidb.del('permcom', (pointNameSingle + ' ' + subCommands[x]));
            }
        }

        if (pointNameMultiple !== undefined && pointNameMultiple !== 'points') {
            for (let x in subCommands) {
                if ($.getIniDbNumber('permcom', (pointNameMultiple + ' ' + subCommands[x]), 1) !== 1) {
                    $.setIniDbNumber('permcom', ('points ' + subCommands[x]), $.getIniDbNumber('permcom', (pointNameMultiple + ' ' + subCommands[x]), 1));
                }
                $.inidb.del('permcom', (pointNameMultiple + ' ' + subCommands[x]));
            }
        }

        subCommands = ['check', 'bonus'];

        if (pointNameSingle !== undefined && pointNameSingle !== 'point') {
            for (let x in subCommands) {
                if ($.getIniDbNumber('permcom', (pointNameSingle + ' ' + subCommands[x]), 7) !== 7) {
                    $.setIniDbNumber('permcom', ('points ' + subCommands[x]), $.getIniDbNumber('permcom', (pointNameSingle + ' ' + subCommands[x]), 7));
                }
                $.inidb.del('permcom', (pointNameSingle + ' ' + subCommands[x]));
            }
        }

        if (pointNameMultiple !== undefined && pointNameMultiple !== 'points') {
            for (let x in subCommands) {
                if ($.getIniDbNumber('permcom', (pointNameMultiple + ' ' + subCommands[x]), 7) !== 7) {
                    $.setIniDbNumber('permcom', ('points ' + subCommands[x]), $.getIniDbNumber('permcom', (pointNameMultiple + ' ' + subCommands[x]), 7));
                }
                $.inidb.del('permcom', (pointNameMultiple + ' ' + subCommands[x]));
            }
        }

        let keys = $.inidb.GetKeyList('blackList', '');

        for (let i = 0; i < keys.length; i++) {
            let json = JSON.parse($.getIniDbString('blackList', keys[i]));

            if (json !== null && json.timeout !== undefined && json.timeout !== null) {
                try {
                    json.timeout = parseInt(json.timeout);

                    $.inidb.set('blackList', keys[i], JSON.stringify(json));
                } catch (e){}
            }
        }
    });

    addUpdate('3.8.1.1', 'installedv3.8.1.1', function() {
        let pointNameSingle = $.getIniDbString('pointSettings', 'pointNameSingle');
        let pointNameMultiple = $.getIniDbString('pointSettings', 'pointNameMultiple');

        if (pointNameSingle !== 'point') {
            $.inidb.del('aliases', pointNameSingle);
        }

        if (pointNameMultiple !== 'points') {
            $.inidb.del('aliases', pointNameMultiple);
        }
    });

    addUpdate('3.8.1.2', 'installedv3.8.1.2', function() {
        let keys = $.inidb.GetKeyList('blackList', '');

        for (let i = 0; i < keys.length; i++) {
            $.inidb.set('blackList', Packages.com.gmt2001.Digest.sha256($.javaString(keys[i])), $.getIniDbString('blackList', keys[i]));
            $.inidb.del('blackList', keys[i]);
        }
    });

    addUpdate('3.8.4.0', 'installedv3.8.4.0', function() {
        //Remove $.PERMISSION.None
        let keys = $.inidb.GetKeysByLikeValues('preSubGroup', '', $.javaString('99'));
        for (let key in keys) {
            $.inidb.del('preSubGroup', key);
        }

        //Remove $.PERMISSION.Viewer and save some space since default of $.PERMISSION.Viewer will be set if no value could be found in the db
        let keys2 = $.inidb.GetKeysByLikeValues('preSubGroup', '', $.javaString('7'));
        for (let key in keys2) {
            $.inidb.del('preSubGroup', key);
        }

        // Set any users with $.PERMISSION.NONE to $.PERMISSION.Viewer
        let keys3 = $.inidb.GetKeysByLikeValues('group', '', $.javaString('99'));
        for (let key in keys3) {
            $.inidb.set('group', key, $.javaString('7'));
        }
    });

    addUpdate('3.8.4.0-2', 'installedv3.8.4.0-2', function() { // Ensure nightly bots which already have 3.8.4.0 updates installed can handle the permissions update correctly
        if ($.inidb.FileExists('panelUsers')) {
            let panelUsers = $.inidb.GetKeyList('panelUsers', '');
            for (let i = 0; i < panelUsers.length; i++) {
                let user = JSON.parse($.getIniDbString('panelUsers', panelUsers[i]));
                user.token = "";
                delete user.permission;
                $.setIniDbString('panelUsers', panelUsers[i], JSON.stringify(user));
            }
        }
    });

    addUpdate('3.8.4.0-3', 'installedv3.8.4.0-3', function() { // Ensure nightly bots which already have 3.8.4.0-2 get the change
        let commands = $.inidb.GetKeyList('cooldown', '');
        for (let i in commands) {
            let json = JSON.parse($.getIniDbString('cooldown', commands[i]));
            json.clearOnOnline = false;
            $.inidb.set('cooldown', commands[i], JSON.stringify(json));
        }
    });

    addUpdate('3.10.0.3', 'installedv3.10.0.3', function() {
        let tables = ['points', 'deaths', 'time', 'adventurePayouts', 'wordCounter', 'bettingVotes', 'pollVotes', 'commandCount', 'discordCommandCount'];
        let val;
        let toint = function(inval) {
            try {
                return parseInt(inval);
            } catch(e) {
                return NaN;
            }
        }

        for (let x in tables) {
            let keys = $.inidb.GetKeyList(tables[x], '');

            for (let i = 0; i < keys.length; i++) {
                val = toint($.getIniDbString(tables[x], keys[i]));
                if (!isNaN(val)) {
                    $.inidb.SetInteger(tables[x], '', keys[i], val);
                }
            }
        }

        val = toint($.getIniDbString('panelstats', 'gameCount'));
        if (!isNaN(val)) {
            $.inidb.SetInteger('panelstats', '', 'gameCount', val);
        }
        if ($.inidb.exists('raffleresults', 'raffleEntries')) {
            val = toint($.getIniDbString('raffleresults', 'raffleEntries'));
            if (!isNaN(val)) {
                $.inidb.SetInteger('raffleresults', '', 'raffleEntries', val);
            }
        }
        if ($.inidb.exists('traffleresults', 'ticketRaffleEntries')) {
            val = toint($.getIniDbString('traffleresults', 'ticketRaffleEntries'));
            if (!isNaN(val)) {
                $.inidb.SetInteger('traffleresults', '', 'ticketRaffleEntries', val);
            }
        }
    });

    // ------ Add updates above this line in execution order ------
    if ($.inidb.FileExists('updates') && $.getIniDbBoolean('updates', updates[0].variable)) {
        $.inidb.SetBoolean('updates', '', 'installedNewBot', true);
    }


    if (!$.getIniDbBoolean('updates', 'installedNewBot')) {
        newSetup();
    } else {
        for (let x in updates) {
            if (!$.getIniDbBoolean('updates', updates[x].variable)) {
                $.consoleLn('Starting PhantomBot v' + updates[x].version + ' updates...');

                try {
                    updates[x].fn();
                    $.consoleLn('PhantomBot v' + updates[x].version + ' update completed!');
                    $.inidb.SetBoolean('updates', '', updates[x].variable, true);
                } catch (e) {
                    $.consoleLn('PhantomBot v' + updates[x].version + ' update failed!');
                    $.handleException('900updates#' + updates[x].version, e);
                }
            }
        }
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
