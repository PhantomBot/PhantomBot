/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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
(function() {
    var modules,
        versions,
        sounds,
        i;

    /** New setup */
    if ($.changed == true && $.changed != null && $.changed != undefined && !$.inidb.exists('updates', 'installedNewBot') && $.inidb.get('updates', 'installedNewBot') != 'true') {
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
        $.inidb.set('updates', 'installedNewBot', 'true');
        $.consoleLn('Initializing complete!');
        $.consoleLn('');
    }

    /* version 3.3.0 updates */
    if (!$.inidb.exists('updates', 'installedv3.3.0') || $.inidb.get('updates', 'installedv3.3.0') != 'true') {
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
                throw 'Could not update keywords list. The keyword "' +  key +
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
        $.inidb.set('updates', 'installedv3.3.0', 'true');
    }

    /* version 3.3.6 updates */
    if (!$.inidb.exists('updates', 'installedv3.3.6') || $.inidb.get('updates', 'installedv3.3.6') != 'true') {
        $.consoleLn('Starting PhantomBot update 3.3.6 updates...');

        $.inidb.set('modules', './systems/welcomeSystem.js', 'false');

        $.consoleLn('PhantomBot update 3.3.6 completed!');
        $.inidb.set('updates', 'installedv3.3.6', 'true');
    }

    /* version 3.4.1 updates */
    if (!$.inidb.exists('updates', 'installedv3.4.1') || $.inidb.get('updates', 'installedv3.4.1') != 'true') {
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
        $.inidb.set('updates', 'installedv3.4.1', 'true');
    }

    /* version 3.5.0 updates */
    if (!$.inidb.exists('updates', 'installedv3.5.0') || $.inidb.get('updates', 'installedv3.5.0') != 'true') {
        $.consoleLn('Starting PhantomBot update 3.5.0 updates...');

        // Remove org.mozilla.javascript entries in phantombot_time
        var keys = $.inidb.GetKeyList('time', ''),
        i;

        for (i = 0; i < keys.length; i++) {
            var key = $.javaString(keys[i]);
            if (key && key.startsWith('org.mozilla.javascript')) {
                $.inidb.RemoveKey('time', '', keys[i]);
            }
        }

        $.consoleLn('PhantomBot update 3.5.0 completed!');
        $.inidb.set('updates', 'installedv3.5.0', 'true');
    }

    /**
     * @function getTableContents
     * @param {string} tableName
     * @returns {Array}
     */
    function getTableContents(tableName) {
        var contents = [],
            keyList = $.inidb.GetKeyList(tableName, ''),
            temp,
            i;

        for (i in keyList) {

            // Handle Exceptions per table
            switch (tableName) {
                // Ignore rows with less than 600 seconds (10 minutes)
                case 'time':
                    temp = parseInt($.inidb.get(tableName, keyList[i]));
                    if (temp >= 600) {
                        contents[keyList[i]] = $.inidb.get(tableName, keyList[i]);
                    }
                    break;

                    // Ignore rows with less than 10 points
                case 'points':
                    temp = parseInt($.inidb.get(tableName, keyList[i]));
                    if (temp >= 10) {
                        contents[keyList[i]] = $.inidb.get(tableName, keyList[i]);
                    }
                    break;

                    // Put the rows in by default
                default:
                    contents[keyList[i]] = $.inidb.get(tableName, keyList[i]);
                    break;
            }
        }

        return contents;
    }

    /**
     * @function setTableContents
     * @param {string} tableName
     * @param {Array} contents
     */
    function restoreTableContents(tableName, contents) {
        var i;


        for (i in contents) {
            $.inidb.set(tableName, i, contents[i]);
        }

        $.inidb.SaveAll(true);
    }
})();
