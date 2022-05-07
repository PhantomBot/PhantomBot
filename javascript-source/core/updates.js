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
            './handlers/hostHandler.js',
            './handlers/subscribeHandler.js',
            './handlers/donationHandler.js',
            './handlers/wordCounter.js',
            './handlers/gameWispHandler.js',
            './handlers/keywordHandler.js',
            './handlers/twitterHandler.js',
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
            './discord/handlers/hostHandler.js',
            './discord/handlers/twitterHandler.js',
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

        $.consoleLn('Installing old updates...');
        versions = ['installedv3.3.0', 'installedv3.3.6', 'installedv3.4.1', 'installedv3.5.0'
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
})();
