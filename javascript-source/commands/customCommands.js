/*
 * Copyright (C) 2016-2019 phantombot.tv
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
    // Pre-build regular expressions.z
    var reCustomAPI = new RegExp(/\(customapi\s([\w\-\.\_\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=]+)\)/), // URL[1]
        reCustomAPIJson = new RegExp(/\(customapijson ([\w\.:\/\$=\?\&\-]+)\s([\w\W]+)\)/), // URL[1], JSONmatch[2..n]
        reCustomAPITextTag = new RegExp(/{([\w\W]+)}/),
        reCommandTag = new RegExp(/\(command\s([\w]+)\)/),
        tagCheck = new RegExp(/\(help=|\(views\)|\(subscribers\)|\(age\)|\(sender\)|\(@sender\)|\(baresender\)|\(random\)|\(1\)|\(2\)|\(3\)|\(count\)|\(pointname\)|\(points\)|\(currenttime|\(price\)|\(#|\(uptime\)|\(follows\)|\(game\)|\(status\)|\(touser\)|\(echo\)|\(alert [,.\w]+\)|\(readfile|\(1=|\(countdown=|\(countup=|\(downtime\)|\(pay\)|\(onlineonly\)|\(offlineonly\)|\(code=|\(followage\)|\(followdate\)|\(hours\)|\(gameinfo\)|\(titleinfo\)|\(gameonly=|\(useronly=|\(playtime\)|\(gamesplayed\)|\(pointtouser\)|\(lasttip\)|\(writefile .+\)|\(readfilerand|\(team_|\(commandcostlist\)|\(playsound |\(repeat [1-9]\d*,[\w\s]+\)|\(customapi |\(customapijson /),
        customCommands = [],
        ScriptEventManager = Packages.tv.phantombot.script.ScriptEventManager,
        CommandEvent = Packages.tv.phantombot.event.command.CommandEvent;

    /*
     * @function getCustomAPIValue
     *
     * @param {string} url
     * @returns {string}
     */
    function getCustomAPIValue(url) {
        return $.customAPI.get(url).content;
    }

    /*
     * @function runCommand
     *
     * @param {string} username
     * @param {string} command
     * @param {string} args
     */
    function runCommand(username, command, args, tags) {
        if (tags !== undefined) {
            ScriptEventManager.instance().onEvent(new CommandEvent(username, command, args, tags));
        } else {
            ScriptEventManager.instance().onEvent(new CommandEvent(username, command, args));
        }
    }

    /*
     * @function returnCommandCost
     *
     * @export $
     * @param {string} sender
     * @param {string} command
     */
    function returnCommandCost(sender, command, isMod) {
        sender = sender.toLowerCase();
        command = command.toLowerCase();

        if ($.inidb.exists('pricecom', command) && parseInt($.inidb.get('pricecom', command)) > 0) {
            if ((((isMod && $.getIniDbBoolean('settings', 'pricecomMods', false) && !$.isBot(sender)) || !isMod))) {
                $.inidb.incr('points', sender, $.inidb.get('pricecom', command));
            }
        }
    }

    /*
     * @function tags
     *
     * @param {string} event
     * @param {string} message
     * @return {string}
     */
    function tags(event, message, atEnabled) {
        if (atEnabled && event.getArgs()[0] !== undefined && $.isModv3(event.getSender(), event.getTags())) {
            if (!message.match(tagCheck)) {
                return event.getArgs()[0] + ' -> ' + message;
            }
        }

        if (message.match(/\(help=.*\)/g) && event.getArgs()[0] === undefined) {
            message = message.match(/\(help=(.*?)\)/)[1];
            $.say(message);
            return null;
        }

        if (message.match(/\(help=.*\)/g)) {
            message = $.replace(message, message.match(/(\(help=.*\))/)[1], '');
        }

        if (message.match(/\(views\)/g)) {
            message = $.replace(message, '(views)', $.twitchcache.getViews());
        }

        if (message.match(/\(gameonly=.*\)/g)) {
            var game = message.match(/\(gameonly=(.*)\)/)[1];

            if (!$.getGame($.channelName).equalsIgnoreCase(game)) {
                return null;
            }
            message = $.replace(message, message.match(/(\(gameonly=.*\))/)[1], '');
        }

        if (message.match(/\(useronly=.*\)/g)) {
            var user = message.match(/\(useronly=(.*?)\)/)[1];
            if (!event.getSender().equalsIgnoreCase(user)) {
                if ($.getIniDbBoolean('settings', 'permComMsgEnabled', true)) {
                    $.say($.whisperPrefix(event.getSender()) + $.lang.get('cmd.useronly', user));
                }
                return null;
            }
            message = $.replace(message, message.match(/(\(useronly=.*?\))/)[1], '');
        }

        if (message.match(/\(readfile/)) {
            if (message.search(/\((readfile ([^)]+)\))/g) >= 0) {
                message = $.replace(message, '(' + RegExp.$1, $.readFile('./addons/' + RegExp.$2.replace(/\.\./g, ''))[0]);
            }
        }

        if (message.match(/\(readfilerand/)) {
            if (message.search(/\((readfilerand ([^)]+)\))/g) >= 0) {
                var path = RegExp.$2;
                var path2 = RegExp.$1;
                var results = $.arrayShuffle($.readFile('./addons/' + path.trim().replace(/\.\./g, '')));
                message = $.replace(message, '(' + path2.trim(), $.randElement(results));
            }
        }

        if (message.match(/\(adminonlyedit\)/)) {
            message = $.replace(message, '(adminonlyedit)', '');
        }

        if (message.match(/\(pointtouser\)/)) {
            if (event.getArgs()[0] !== undefined) {
                message = $.replace(message, '(pointtouser)', (String(event.getArgs()[0]).replace(/[^a-zA-Z0-9_@]/ig, '') + ' -> '));
            } else {
                message = $.replace(message, '(pointtouser)', $.userPrefix(event.getSender(), true));
            }
        }

        if (message.match(/\(currenttime/)) {
            var timezone = message.match(/\(currenttime ([\w\W]+), (.*)\)/)[1],
                format = message.match(/\(currenttime ([\w\W]+), (.*)\)/)[2];

            message = $.replace(message, message.match(/\(currenttime ([\w\W]+), (.*)\)/)[0], $.getCurrentLocalTimeString(format, timezone));
        }

        if (message.match(/\(1\)/g)) {
            for (var i = 1; i < 10; i++) {
                if (message.includes('(' + i + ')')) {
                    message = $.replace(message, '(' + i + ')', (event.getArgs()[i - 1] !== undefined ? event.getArgs()[i - 1] : ''));
                } else {
                    break;
                }
            }
        }

        if (message.match(/\(commandcostlist\)/)) {
            var keys = $.inidb.GetKeyList('pricecom', ''),
                temp = [],
                i;
            for (i in keys) {
                if (!keys[i].includes(' ')) {
                    temp.push('!' + keys[i] + ': ' + $.getPointsString($.inidb.get('pricecom', keys[i])));
                }
            }
            $.paginateArray(temp, 'NULL' + message.replace('(commandcostlist)', ''), ', ', true, event.getSender());
            return null;
        }

        if (message.match(/\(1=[^)]+\)/g)) {
            if (event.getArgs()[0]) {
                var t = message.match(/\(1=[^)]+\)/)[0];
                message = $.replace(message, t, event.getArgs()[0]);
            }
            message = $.replace(message, '(1=', '(');
        }

        if (message.match(/\(countdown=[^)]+\)/g)) {
            var t = message.match(/\([^)]+\)/)[0],
                countdown, time;
            countdown = t.replace('(countdown=', '').replace(')', '');
            time = (Date.parse(countdown) - Date.parse($.getLocalTime()));
            message = $.replace(message, t, $.getCountString(time / 1000, false));
        }

        if (message.match(/\(countup=[^)]+\)/g)) {
            var t = message.match(/\([^)]+\)/)[0],
                countup, time;
            countup = t.replace('(countup=', '').replace(')', '');
            time = (Date.parse($.getLocalTime()) - Date.parse(countup));
            message = $.replace(message, t, $.getCountString(time / 1000, true));
        }

        if (message.match(/\(downtime\)/g)) {
            message = $.replace(message, '(downtime)', String($.getStreamDownTime()));
        }

        if (message.match(/\(channelname\)/g)) {
            message = $.replace(message, '(channelname)', $.username.resolve($.channelName));
        }

        if (message.match(/\(onlineonly\)/g)) {
            if (!$.isOnline($.channelName)) {
                returnCommandCost(event.getSender(), event.getCommand(), $.isModv3(event.getSender(), event.getTags()));
                return null;
            }
            message = $.replace(message, '(onlineonly)', '');
        }

        if (message.match(/\(offlineonly\)/g)) {
            if ($.isOnline($.channelName)) {
                returnCommandCost(event.getSender(), event.getCommand(), $.isModv3(event.getSender(), event.getTags()));
                return null;
            }
            message = $.replace(message, '(offlineonly)', '');
        }

        if (message.match(/\(sender\)/g)) {
            message = $.replace(message, '(sender)', $.username.resolve(event.getSender()));
        }

        if (message.match(/\(senderrank\)/g)) {
            message = $.replace(message, '(senderrank)', $.resolveRank(event.getSender()));
        }

        if (message.match(/\(senderrankonly\)/g)) {
            message = $.replace(message, '(senderrankonly)', $.getRank(event.getSender()));
        }

        if (message.match(/\(@sender\)/g)) {
            message = $.replace(message, '(@sender)', $.userPrefix(event.getSender(), true));
        }

        if (message.match(/\(baresender\)/g)) {
            message = $.replace(message, '(baresender)', event.getSender());
        }

        if (message.match(/\(game\)/g)) {
            message = $.replace(message, '(game)', $.getGame($.channelName));
        }

        if (message.match(/\(status\)/g)) {
            message = $.replace(message, '(status)', $.getStatus($.channelName));
        }

        if (message.match(/\(count\)/g)) {
            $.inidb.incr('commandCount', event.getCommand(), 1);
            message = $.replace(message, '(count)', $.inidb.get('commandCount', event.getCommand()));
        }

        if (message.match(/\(keywordcount\s(.+)\)/g)) {
            var input_keyword = message.match(/.*\(keywordcount\s(.+)\).*/)[1],
                keyword_info = JSON.parse($.inidb.get('keywords', input_keyword));

            if ('count' in keyword_info) {
                ++keyword_info["count"];
            } else {
                keyword_info["count"] = 1;
            }
            $.inidb.set('keywords', input_keyword, JSON.stringify(keyword_info));

            message = $.replace(message, '(keywordcount ' + input_keyword + ')', keyword_info["count"]);
        }

        if (message.match(/\(random\)/g)) {
            try {
                message = $.replace(message, '(random)', $.username.resolve($.randElement($.users)));
            } catch (ex) {
                message = $.replace(message, '(random)', $.username.resolve($.botName));
            }
        }

        if (message.match(/\(randomrank\)/g)) {
            try {
                message = $.replace(message, '(randomrank)', $.resolveRank($.randElement($.users)));
            } catch (ex) {
                message = $.replace(message, '(randomrank)', $.resolveRank($.botName));
            }
        }

        if (message.match(/\(pointname\)/g)) {
            message = $.replace(message, '(pointname)', $.pointNameMultiple);
        }

        if (message.match(/\(points\)/g)) {
            message = $.replace(message, '(points)', $.getUserPoints(event.getSender()));
        }

        if (message.match(/\(price\)/g)) {
            message = $.replace(message, '(price)', String($.inidb.exists('pricecom', event.getCommand()) ? $.getPointsString($.inidb.get('pricecom', event.getCommand())) : $.getPointsString(0)));
        }

        if (message.match(/\(pay\)/g)) {
            message = $.replace(message, '(pay)', String($.inidb.exists('paycom', event.getCommand()) ? $.getPointsString($.inidb.get('paycom', event.getCommand())) : $.getPointsString(0)));
        }

        if (message.match(/\(#\)/g)) {
            message = $.replace(message, '(#)', String($.randRange(1, 100)));
        }

        if (message.match(/\(# (\d+),(\d+)\)/g)) {
            var mat = message.match(/\(# (\d+),(\d+)\)/);
            message = $.replace(message, mat[0], String($.randRange(parseInt(mat[1]), parseInt(mat[2]))));
        }

        if (message.match(/\(viewers\)/g)) {
            message = $.replace(message, '(viewers)', String($.getViewers($.channelName) + ' '));
        }

        if (message.match(/\(follows\)/g)) {
            message = $.replace(message, '(follows)', String($.getFollows($.channelName) + ' '));
        }

        if (message.match(/\(subscribers\)/g)) {
            message = $.replace(message, '(subscribers)', String($.getSubscriberCount() + ' '));
        }

        if (message.match(/\(touser\)/g)) {
            message = $.replace(message, '(touser)', (event.getArgs()[0] === undefined ? $.username.resolve(event.getSender()) : String(event.getArgs()[0]).replace(/[^a-zA-Z0-9_@]/ig, '')));
        }

        if (message.match(/\(echo\)/g)) {
            message = $.replace(message, '(echo)', (event.getArguments() ? event.getArguments() : ''));
        }

        if (message.match(/\(gamesplayed\)/g)) {
            if (!$.isOnline($.channelName)) {
                $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                return null;
            }
            message = $.replace(message, '(gamesplayed)', $.getGamesPlayed());
        }

        if (message.match(/\(code=/g)) {
            var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                length = message.substr(6).replace(')', ''),
                text = '',
                i;

            for (i = 0; i < length; i++) {
                text += code.charAt(Math.floor(Math.random() * code.length));
            }
            message = $.replace(message, '(code=' + length + ')', String(text));
        }

        if (message.match(/\(alert [,.\w\W]+\)/g)) {
            var filename = message.match(/\(alert ([,.\w\W]+)\)/)[1];
            $.panelsocketserver.alertImage(filename);
            message = (message + '').replace(/\(alert [,.\w\W]+\)/, '');
            if (message == '') return null;
        }

        if (message.match(/\(gameinfo\)/)) {
            if ($.getGame($.channelName) == ' ' || $.getGame($.channelName) == '') {
                message = $.replace(message, '(gameinfo)', $.lang.get('streamcommand.game.no.game'));
            } else if (!$.isOnline($.channelName) || $.getPlayTime() == 0) {
                message = $.replace(message, '(gameinfo)', $.lang.get('streamcommand.game.offline', $.getGame($.channelName)));
            } else {
                message = $.replace(message, '(gameinfo)', $.lang.get('streamcommand.game.online', $.getGame($.channelName), $.getPlayTime()));
            }
        }

        if (message.match(/\(titleinfo\)/)) {
            if ($.getStatus($.channelName) == ' ' || $.getStatus($.channelName) == '') {
                message = $.replace(message, '(titleinfo)', $.lang.get('streamcommand.title.no.title'));
            } else if (!$.isOnline($.channelName)) {
                message = $.replace(message, '(titleinfo)', $.lang.get('streamcommand.title.offline', $.getStatus($.channelName)));
            } else {
                message = $.replace(message, '(titleinfo)', $.lang.get('streamcommand.title.online', $.getStatus($.channelName), String($.getStreamUptime($.channelName))));
            }
        }

        if (message.match(/\(followdate\)/g)) {
            var args = event.getArgs(),
                channel = $.channelName,
                sender = event.getSender();

            if (args.length > 0) sender = args[0].replace('@','');
            if (args.length > 1) channel = args[1].replace('@','');

            message = $.replace(message, '(followdate)', $.getFollowDate(event.getSender(), sender, channel));
        }

        if (message.match(/\(hours\)/g)) {
            var args = event.getArgs(),
                sender = event.getSender();

            if (args.length > 0) sender = args[0].replace('@','');

            message = $.replace(message, '(hours)', parseInt($.getUserTime(sender) / 3600));
        }

        if (message.match(/\(followage\)/g)) {
            var args = event.getArgs(),
                channel = $.channelName,
                sender = event.getSender();

            if (args.length > 0) sender = args[0].replace('@','');
            if (args.length > 1) channel = args[1].replace('@','');

            $.getFollowAge(event.getSender(), sender, channel);
            return null;
        }

        if (message.match(/\(playtime\)/g)) {
            if (!$.isOnline($.channelName)) {
                $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                return null;
            }
            message = $.replace(message, '(playtime)', ($.getPlayTime() ? $.getPlayTime() : ''));
        }

        if (message.match(/\(uptime\)/g)) {
            if (!$.isOnline($.channelName)) {
                $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                return null;
            }
            message = $.replace(message, '(uptime)', String($.getStreamUptime($.channelName)));
        }

        if (message.match(/\(lasttip\)/g)) {
            message = $.replace(message, '(lasttip)', ($.inidb.exists('donations', 'last_donation_message') ? $.inidb.get('donations', 'last_donation_message') : 'No donations found.'));
        }

        if (message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/g)) {
            if (!$.audioHookExists(message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[1])) {
                $.log.error('Could not play audio hook: Audio hook does not exist.');
                return null;
            }
            $.panelsocketserver.triggerAudioPanel(message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[1]);
            message = $.replace(message, message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[0], '');
            if (message == '') {
                return null;
            }
        }

        if (message.match(/\(repeat\s[1-9]\d*,[\w\s]+\)/g)) {
            var MIN_COUNTER_VALUE = 1;
            var MAX_COUNTER_VALUE = 30;

            var matches = message.match(/\(repeat\s([1-9]\d*),([\w\s]+)\)/);
            var allMatch = matches[0];
            var counter = parseInt(matches[1]);
            var iteratingText = matches[2];

            if (counter < MIN_COUNTER_VALUE) {
                counter = MIN_COUNTER_VALUE;
            }

            if (counter > MAX_COUNTER_VALUE) {
                counter = MAX_COUNTER_VALUE;
            }

            var tmpArray = [];

            for(var i = 0; i < counter; i++) {
                tmpArray.push(iteratingText);
            }

            message = $.replace(message, allMatch, tmpArray.join(' '));
        }

        if (message.match(/\(age\)/g)) {
            $.getChannelAge(event);
            return null;
        }

        if (message.match(/\(writefile .+\)/)) {
            if (message.match(/\(writefile (.+), (.+), (.+)\)/)) {
                var file = message.match(/\(writefile (.+), (.+), (.+)\)/)[1],
                    append = (message.match(/\(writefile (.+), (.+), (.+)\)/)[2] == 'true' ? true : false),
                    string = message.match(/\(writefile (.+), (.+), (.+)\)/)[3];
                $.writeToFile(string, './addons/' + file.replace(/\.\./g, ''), append);
            }
            message = $.replace(message, message.match(/\(writefile (.+), (.+), (.+)\)/)[0], '');
            if (message == '') {
                return null;
            }
        }

        if (message.match(/\(encodeurl ([\w\W]+)\)/)) {
            var m = message.match(/\(encodeurl ([\w\W]+)\)/);
            message = $.replace(message, m[0], encodeURI(m[1]));
        }

        // Variables for Twitch teams.
        if (message.match(/\(team_.*/)) {
            message = handleTwitchTeamVariables(message);
        }

        if (message.match(reCustomAPIJson) || message.match(reCustomAPI) || message.match(reCommandTag)) {
            message = apiTags(event, message);
        }

        if (message !== null) {
            if (message.match('\n')) {
                var splitMessage = message.split('\n');

                for (var i = 0; i < splitMessage.length && i <= 4; ++i) {
                    $.say(splitMessage[i]);
                }
                return null;
            }
        }

        return message;
    }

    /*
     * @function handleTwitchTeamVariables Handles the twitch team tags.
     *
     * @return String
     */
    function handleTwitchTeamVariables(message) {
        if (message.match(/\(team_members ([a-zA-Z0-9-_]+)\)/)) {
            var teamMatch = message.match(/\(team_members ([a-zA-Z0-9-_]+)\)/),
                teamName = teamMatch[1],
                teamObj = $.twitchteamscache.getTeam(teamName);

            if (teamObj != null) {
                message = $.replace(message, teamMatch[0], teamObj.getTotalMembers());
            } else {
                message = $.replace(message, teamMatch[0], 'API_ERROR: You\'re not in that team.');
            }
        }

        if (message.match(/\(team_url ([a-zA-Z0-9-_]+)\)/)) {
            var teamMatch = message.match(/\(team_url ([a-zA-Z0-9-_]+)\)/),
                teamName = teamMatch[1],
                teamObj = $.twitchteamscache.getTeam(teamName);

            if (teamObj != null) {
                message = $.replace(message, teamMatch[0], teamObj.getUrl());
            } else {
                message = $.replace(message, teamMatch[0], 'API_ERROR: You\'re not in that team.');
            }
        }

        if (message.match(/\(team_name ([a-zA-Z0-9-_]+)\)/)) {
            var teamMatch = message.match(/\(team_name ([a-zA-Z0-9-_]+)\)/),
                teamName = teamMatch[1],
                teamObj = $.twitchteamscache.getTeam(teamName);

            if (teamObj != null) {
                message = $.replace(message, teamMatch[0], teamObj.getName());
            } else {
                message = $.replace(message, teamMatch[0], 'API_ERROR: You\'re not in that team.');
            }
        }

        if (message.match(/\(team_random_member ([a-zA-Z0-9-_]+)\)/)) {
            var teamMatch = message.match(/\(team_random_member ([a-zA-Z0-9-_]+)\)/),
                teamName = teamMatch[1],
                teamObj = $.twitchteamscache.getTeam(teamName);

            if (teamObj != null) {
                message = $.replace(message, teamMatch[0], teamObj.getRandomMember());
            } else {
                message = $.replace(message, teamMatch[0], 'API_ERROR: You\'re not in that team.');
            }
        }

        if (message.match(/\(team_member_game ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)\)/)) {
            var teamMatch = message.match(/\(team_member_game ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)\)/),
                teamName = teamMatch[1],
                teamUser = teamMatch[2]
                teamObj = $.twitchteamscache.getTeam(teamName),
                teamMember = teamObj.getTeamMember(teamUser);

            if (teamObj != null) {
                if (teamMember != null) {
                    message = $.replace(message, teamMatch[0], teamMember.getString('game'));
                } else {
                    message = $.replace(message, teamMatch[0], 'API_ERROR: That user is not in the team.');
                }
            } else {
                message = $.replace(message, teamMatch[0], 'API_ERROR: You\'re not in that team.');
            }
        }

        if (message.match(/\(team_member_followers ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)\)/)) {
            var teamMatch = message.match(/\(team_member_followers ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)\)/),
                teamName = teamMatch[1],
                teamUser = teamMatch[2]
                teamObj = $.twitchteamscache.getTeam(teamName),
                teamMember = teamObj.getTeamMember(teamUser);

            if (teamObj != null) {
                if (teamMember != null) {
                    message = $.replace(message, teamMatch[0], teamMember.get('followers'));
                } else {
                    message = $.replace(message, teamMatch[0], 'API_ERROR: That user is not in the team.');
                }
            } else {
                message = $.replace(message, teamMatch[0], 'API_ERROR: You\'re not in that team.');
            }
        }

        if (message.match(/\(team_member_url ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)\)/)) {
            var teamMatch = message.match(/\(team_member_url ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)\)/),
                teamName = teamMatch[1],
                teamUser = teamMatch[2]
                teamObj = $.twitchteamscache.getTeam(teamName),
                teamMember = teamObj.getTeamMember(teamUser);

            if (teamObj != null) {
                if (teamMember != null) {
                    message = $.replace(message, teamMatch[0], teamMember.getString('url'));
                } else {
                    message = $.replace(message, teamMatch[0], 'API_ERROR: That user is not in the team.');
                }
            } else {
                message = $.replace(message, teamMatch[0], 'API_ERROR: You\'re not in that team.');
            }
        }

        return message;
    }

    /*
     * @function apiTags
     *
     * @export $
     * @param {string} message
     * @param {Object} event
     * @returns {string}
     */
    function apiTags(event, message) {
        var JSONObject = Packages.org.json.JSONObject,
            JSONArray = Packages.org.json.JSONArray,
            command = event.getCommand(),
            args = event.getArgs(),
            origCustomAPIResponse = '',
            customAPIReturnString = '',
            message = message + '',
            customAPIResponse = '',
            customJSONStringTag = '',
            commandToExec = 0,
            jsonObject,
            regExCheck,
            jsonItems,
            jsonCheckList;

        // Get the URL for a customapi, if applicable, and process $1 - $9.  See below about that.
        if ((regExCheck = message.match(reCustomAPI))) {
            if (regExCheck[1].indexOf('(token)') !== -1 && $.inidb.HasKey('commandtoken', '', command)) {
                regExCheck[1] = regExCheck[1].replace(/\(token\)/gi, $.inidb.GetString('commandtoken', '', command));
            }

            if (regExCheck[1].indexOf('$1') != -1) {
                for (var i = 1; i <= 9; i++) {
                    if (regExCheck[1].indexOf('$' + i) != -1) {
                        if (!args[i - 1]) {
                            return $.lang.get('customcommands.customapi.404', command);
                        }
                        regExCheck[1] = regExCheck[1].replace('$' + i, args[i - 1]);
                    } else {
                        break;
                    }
                }
            }
            customAPIReturnString = getCustomAPIValue(regExCheck[1]);
        }

        // Design Note.  As of this comment, this parser only supports parsing out of objects, it does not
        // support parsing of arrays, especially walking arrays.  If that needs to be done, please write
        // a custom JavaScript.  We limit $1 - $9 as well; 10 or more arguments being passed by users to an
        // API seems like overkill.  Even 9 does, to be honest.
        if ((regExCheck = message.match(reCustomAPIJson))) {
            if (regExCheck[1].indexOf('(token)') !== -1 && $.inidb.HasKey('commandtoken', '', command)) {
                regExCheck[1] = regExCheck[1].replace(/\(token\)/gi, $.inidb.GetString('commandtoken', '', command));
            }

            if (regExCheck[1].indexOf('$1') != -1) {
                for (var i = 1; i <= 9; i++) {
                    if (regExCheck[1].indexOf('$' + i) != -1) {
                        if (!args[i - 1]) {
                            return $.lang.get('customcommands.customapi.404', command);
                        }
                        regExCheck[1] = regExCheck[1].replace('$' + i, args[i - 1]);
                    } else {
                        break;
                    }
                }
            }
            origCustomAPIResponse = getCustomAPIValue(regExCheck[1]);
            jsonItems = regExCheck[2].split(' ');
            for (var j = 0; j < jsonItems.length; j++) {
                if (jsonItems[j].startsWith('{') && jsonItems[j].endsWith('}')) {
                    customAPIReturnString += " " + jsonItems[j].match(reCustomAPITextTag)[1];
                } else if (jsonItems[j].startsWith('{') && !jsonItems[j].endsWith('}')) {
                    customJSONStringTag = '';
                    while (!jsonItems[j].endsWith('}')) {
                        customJSONStringTag += jsonItems[j++] + " ";
                    }
                    customJSONStringTag += jsonItems[j];
                    customAPIReturnString += " " + customJSONStringTag.match(reCustomAPITextTag)[1];
                } else {
                    jsonCheckList = jsonItems[j].split('.');
                    if (jsonCheckList.length == 1) {
                        try {
                            customAPIResponse = new JSONObject(origCustomAPIResponse).get(jsonCheckList[0]);
                        } catch (ex) {
                            $.log.error('Failed to get data from API: ' + ex.message);
                            return $.lang.get('customcommands.customapijson.err', command);
                        }
                        customAPIReturnString += customAPIResponse;
                    } else {
                        for (var i = 0; i < jsonCheckList.length - 1; i++) {
                            if (i == 0) {
                                try {
                                    jsonObject = new JSONObject(origCustomAPIResponse).get(jsonCheckList[i]);
                                } catch (ex) {
                                    $.log.error('Failed to get data from API: ' + ex.message);
                                    return $.lang.get('customcommands.customapijson.err', command);
                                }
                            } else if (!isNaN(jsonCheckList[i + 1])) {
                                try {
                                    jsonObject = jsonObject.get(jsonCheckList[i]);
                                } catch (ex) {
                                    $.log.error('Failed to get data from API: ' + ex.message);
                                    return $.lang.get('customcommands.customapijson.err', command);
                                }
                            } else {
                                try {
                                    jsonObject = jsonObject.get(jsonCheckList[i]);
                                } catch (ex) {
                                    $.log.error('Failed to get data from API: ' + ex.message);
                                    return $.lang.get('customcommands.customapijson.err', command);
                                }
                            }
                        }
                        try {
                            customAPIResponse = jsonObject.get(jsonCheckList[i]);
                        } catch (ex) {
                            $.log.error('Failed to get data from API: ' + ex.message);
                            return $.lang.get('customcommands.customapijson.err', command);
                        }
                        customAPIReturnString += customAPIResponse;
                    }
                }
            }
        }

        if (message.match(reCommandTag)) {
            commandToExec = message.match(reCommandTag)[1];
            if (commandToExec.length > 0) {
                var EventBus = Packages.tv.phantombot.event.EventBus;
                var CommandEvent = Packages.tv.phantombot.event.command.CommandEvent;
                EventBus.instance().post(new CommandEvent(event.getSender(), commandToExec, message.replace(reCommandTag, '').substring(1)));
                return null;
            }
        }

        return message.replace(reCustomAPI, customAPIReturnString).replace(reCustomAPIJson, customAPIReturnString);
    }

    /*
     * @function permCom
     *
     * @export $
     * @param {string} username
     * @param {string} command
     * @param {sub} subcommand
     * @returns 0 = good, 1 = command perm bad, 2 = subcommand perm bad
     */
    function permCom(username, command, subcommand, tags) {
        var commandGroup, allowed;
        if (subcommand === '') {
            commandGroup = $.getCommandGroup(command);
        } else {
            commandGroup = $.getSubcommandGroup(command, subcommand);
        }
        
        switch(commandGroup) {
            case 0:
                allowed = $.isCaster(username);
                break;
            case 1:
                allowed = $.isAdmin(username);
                break;
            case 2:
                allowed = $.isModv3(username, tags);
                break;
            case 3:
                allowed = $.isSubv3(username, tags) || $.isModv3(username, tags);
                break;
            case 4:
                allowed = $.isDonator(username) || $.isModv3(username, tags);
                break;
            case 5:
                allowed = $.isVIP(username, tags) || $.isModv3(username, tags);
                break;
            case 6:
                allowed = $.isReg(username) || $.isModv3(username, tags);
                break;
            default:
                allowed = true;
                break;
        }
        
        return allowed ? 0 : (subcommand === '' ? 1 : 2);
    }

    /*
     * @function priceCom
     *
     * @export $
     * @param {string} username
     * @param {string} command
     * @param {sub} subcommand
     * @param {bool} isMod
     * @returns 1 | 0 - Not a boolean
     */
    function priceCom(username, command, subCommand, isMod) {
        if ((subCommand !== '' && $.inidb.exists('pricecom', command + ' ' + subCommand)) || $.inidb.exists('pricecom', command)) {
            if ((((isMod && $.getIniDbBoolean('settings', 'pricecomMods', false) && !$.isBot(username)) || !isMod)) && $.bot.isModuleEnabled('./systems/pointSystem.js')) {
                if ($.getUserPoints(username) < getCommandPrice(command, subCommand, '')) {
                    return 1;
                }
                return 0;
            }
        }
        return -1;
    }

    /*
     * @function payCom
     *
     * @export $
     * @param {string} command
     * @returns 1 | 0 - Not a boolean
     */
    function payCom(command) {
        return ($.inidb.exists('paycom', command) ? 0 : 1);
    }

    /*
     * @function getCommandPrice
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @param {string} subCommandAction
     * @returns {Number}
     */
    function getCommandPrice(command, subCommand, subCommandAction) {
        command = command.toLowerCase();
        subCommand = subCommand.toLowerCase();
        subCommandAction = subCommandAction.toLowerCase();
        return parseInt($.inidb.exists('pricecom', command + ' ' + subCommand + ' ' + subCommandAction) ?
            $.inidb.get('pricecom', command + ' ' + subCommand + ' ' + subCommandAction) :
            $.inidb.exists('pricecom', command + ' ' + subCommand) ?
            $.inidb.get('pricecom', command + ' ' + subCommand) :
            $.inidb.exists('pricecom', command) ?
            $.inidb.get('pricecom', command) : 0);
    }

    /*
     * @function getCommandPay
     *
     * @export $
     * @param {string} command
     * @returns {Number}
     */
    function getCommandPay(command) {
        return ($.inidb.exists('paycom', command) ? $.inidb.get('paycom', command) : 0);
    }

    /*
     * @function addComRegisterCommands
     */
    function addComRegisterCommands() {
        if ($.bot.isModuleEnabled('./commands/customCommands.js')) {
            var commands = $.inidb.GetKeyList('command', ''),
                i;
            for (i in commands) {
                if (!$.commandExists(commands[i])) {
                    customCommands[commands[i]] = $.inidb.get('command', commands[i]);
                    $.registerChatCommand('./commands/customCommands.js', commands[i], 7);
                }
            }
        }
    }

    /*
     * @function addComRegisterAliases
     */
    function addComRegisterAliases() {
        if ($.bot.isModuleEnabled('./commands/customCommands.js')) {
            var aliases = $.inidb.GetKeyList('aliases', ''),
                i;
            for (i in aliases) {
                if (!$.commandExists(aliases[i])) {
                    $.registerChatCommand('./commands/customCommands.js', aliases[i], $.getIniDbNumber('permcom', aliases[i], 7));
                    $.registerChatAlias(aliases[i]);
                }
            }
        }
    }

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argsString = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /*
         * This handles custom commands, no command path is needed.
         */
        if (customCommands[command] !== undefined) {
            var tag = tags(event, customCommands[command], true);
            if (tag !== null) {
                $.say(tag);
            }
            return;
        }

        /*
         * @commandpath addcom [command] [command response] - Adds a custom command
         */
        if (command.equalsIgnoreCase('addcom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();
            argsString = args.slice(1).join(' ');

            if ($.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.error'));
                return;
            } else if ($.inidb.exists('disabledCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.disabled'));
                return;
            } else if (argsString.indexOf('(command ') !== -1) {
                if (argsString.indexOf('(command ') !== 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.commandtag.notfirst'));
                    return;
                } else {
                    if (!$.commandExists(argsString.match(reCommandTag)[1])) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.commandtag.invalid', argsString.match(reCommandTag)[1]));
                        return;
                    }
                }
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.success', action));
            $.logCustomCommand({
                'add.command': '!' + action,
                'add.response': argsString,
                'sender': sender,
            });
            $.registerChatCommand('./commands/customCommands.js', action);
            $.inidb.set('command', action, argsString);
            customCommands[action] = argsString;
            return;
        }

        /*
         * @commandpath editcom [command] [command response] - Edits the current response of that command
         */
        if (command.equalsIgnoreCase('editcom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();
            argsString = args.slice(1).join(' ');

            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cmd.404', action));
                return;
            } else if ($.commandExists(action) && !$.inidb.exists('command', action)) {
                if ($.inidb.exists('aliases', action)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.editcom.alias', $.inidb.get('aliases', action), argsString));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.404'));
                }
                return;
            } else if ($.inidb.get('command', action).match(/\(adminonlyedit\)/) && !$.isAdmin(sender)) {
                if ($.getIniDbBoolean('settings', 'permComMsgEnabled', true)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cmd.perm.404', $.getGroupNameById('1')));
                }
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.success', action));
            $.logCustomCommand({
                'edit.command': '!' + action,
                'edit.response': argsString,
                'sender': sender,
            });
            $.registerChatCommand('./commands/customCommands.js', action, 7);
            $.inidb.set('command', action, argsString);
            customCommands[action] = argsString;
            return;
        }

        /*
         * @commandpath tokencom [command] [token] - Stores a user/pass or API key to be replaced into a (customapi) tag. WARNING: This should be done from the bot console or web panel, if you run this from chat, anyone watching chat can copy your info!
         */
        if (command.equalsIgnoreCase('tokencom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.token.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();
            argsString = args.slice(1).join(' ');

            var silent = false;
            if (action.startsWith('silent@')) {
                silent = true;
                action = action.substr(7);
            }

            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cmd.404', action));
                return;
            } else if ($.inidb.get('command', action).match(/\(adminonlyedit\)/) && !$.isAdmin(sender)) {
                if ($.getIniDbBoolean('settings', 'permComMsgEnabled', true)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cmd.perm.404', $.getGroupNameById('1')));
                }
                return;
            }

            if (!silent) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.token.success', action));
            }

            if (argsString.length === 0) {
                $.inidb.RemoveKey('commandtoken', '', action);
            } else {
                $.inidb.SetString('commandtoken', '', action, argsString);
            }
            return;
        }

        /*
         * @commandpath delcom [command] - Delete that custom command
         */
        if (command.equalsIgnoreCase('delcom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.delete.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.inidb.exists('command', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cmd.404', action));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.delete.success', action));
            $.logCustomCommand({
                'delete.command': '!' + action,
                'sender': sender,
            });
            $.inidb.del('command', action);
            $.inidb.del('permcom', action);
            $.inidb.del('pricecom', action);
            $.inidb.del('aliases', action);
            $.inidb.del('commandtoken', action);
            $.unregisterChatCommand(action);
            delete customCommands[action];
            return;
        }

        /*
         * @commandpath aliascom [alias name] [existing command] - Create an alias to any command
         */
        if (command.equalsIgnoreCase('aliascom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();
            subAction = args.slice(1).join(' ').replace('!', '').toLowerCase();

            if ($.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error.exists'));
                return;
            } else if (!$.commandExists(subAction.split(' ')[0])) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error.target404'));
                return;
            } else if ($.inidb.exists('aliases', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error', action));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.success', subAction, action));
            $.logCustomCommand({
                'alias.command': '!' + action,
                'alias.target': '!' + subAction,
                'sender': sender,
            });
            $.registerChatCommand('./commands/customCommands.js', action);
            $.inidb.set('aliases', action, subAction);
            $.registerChatAlias(action);
            return;
        }

        /*
         * @commandpath delalias [alias] - Delete that alias
         */
        if (command.equalsIgnoreCase('delalias')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.inidb.exists('aliases', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.error.alias.404', action));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.success', action));
            $.logCustomCommand({
                'alias.delete.command': '!' + action,
                'sender': sender,
            });
            $.unregisterChatCommand(action);
            $.inidb.del('aliases', action);
            return;
        }

        /*
         * @commandpath permcom [command] [groupId] - Set the permissions for any command
         */
        if (command.equalsIgnoreCase('permcom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();
            var group = 7;

            if (args.length === 2) {
                group = args[1];

                if (!$.commandExists(action)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.404', action));
                    return;
                } else if (isNaN(parseInt(group))) {
                    group = $.getGroupIdByName(group);
                }

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.success', action, $.getGroupNameById(group)));
                $.logCustomCommand({
                    'set.perm.command': '!' + action,
                    'set.perm.group': $.getGroupNameById(group),
                    'sender': sender,
                });

                var list = $.inidb.GetKeyList('aliases', ''),
                    i;

                for (i in list) {
                    if (list[i].equalsIgnoreCase(action)) {
                        $.inidb.set('permcom', $.inidb.get('aliases', list[i]), group);
                        $.updateCommandGroup($.inidb.get('aliases', list[i]), group);
                    }
                }

                $.inidb.set('permcom', action, group);
                $.updateCommandGroup(action, group);
            } else {
                group = args[2];

                if (!$.subCommandExists(action, subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.404', action + ' ' + subAction));
                    return;
                } else if (isNaN(parseInt(group))) {
                    group = $.getGroupIdByName(group);
                }

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.success', action + ' ' + subAction, $.getGroupNameById(group)));
                $.logCustomCommand({
                    'set.perm.command': '!' + action + ' ' + subAction,
                    'set.perm.group': $.getGroupNameById(group),
                    'sender': sender,
                });
                $.inidb.set('permcom', action + ' ' + subAction, group);
                $.updateSubcommandGroup(action, subAction, group);
            }
            return;
        }

        /*
         * @commandpath pricecom [command] [amount] - Set the amount of points a command should cost
         */
        if (command.equalsIgnoreCase('pricecom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.404'));
                return;
            }

            if (args.length === 2) {
                if (isNaN(parseInt(subAction)) || parseInt(subAction) < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.invalid'));
                    return;
                }

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.success', action, subAction, $.pointNameMultiple));
                $.logCustomCommand({
                    'set.price.command': '!' + action,
                    'set.price.amount': subAction,
                    'sender': sender,
                });
                $.inidb.set('pricecom', action, subAction);

                var list = $.inidb.GetKeyList('aliases', ''),
                    i;

                for (i in list) {
                    if (list[i].equalsIgnoreCase(action)) {
                        $.inidb.set('pricecom', $.inidb.get('aliases', list[i]), parseInt(subAction));
                    }
                    if ($.inidb.get('aliases', list[i]).includes(action)) {
                        $.inidb.set('pricecom', list[i], parseInt(subAction));
                    }
                }
            } else if (args.length === 3) {
                if (isNaN(parseInt(args[2])) || parseInt(args[2]) < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.invalid'));
                    return;
                }

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.success', action + ' ' + subAction, args[2], $.pointNameMultiple));
                $.logCustomCommand({
                    'set.price.command': '!' + action + ' ' + subAction,
                    'set.price.amount': args[2],
                    'sender': sender,
                });
                $.inidb.set('pricecom', action + ' ' + subAction, args[2]);
            } else {
                if (args.length === 4) {
                    if (isNaN(parseInt(args[3])) || parseInt(args[3]) < 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.invalid'));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.success', action + ' ' + subAction + ' ' + args[2], args[3], $.pointNameMultiple));
                    $.logCustomCommand({
                        'set.price.command': '!' + action + ' ' + subAction + ' ' + args[2],
                        'set.price.amount': args[3],
                        'sender': sender,
                    });
                    $.inidb.set('pricecom', action + ' ' + subAction + ' ' + args[2], args[3]);
                }
            }
            return;
        }

        /*
         * @commandpath paycom [command] [amount] - Set the amount of points a command should reward a viewer
         */
        if (command.equalsIgnoreCase('paycom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.pay.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.pay.error.404'));
                return;
            } else if (isNaN(parseInt(subAction)) || parseInt(subAction) < 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.pay.error.invalid'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.pay.success', action, subAction, $.pointNameMultiple));
            $.logCustomCommand({
                'set.pay.command': '!' + action,
                'set.pay.amount': subAction,
                'sender': sender,
            });
            $.inidb.set('paycom', action, subAction);

            var list = $.inidb.GetKeyList('aliases', ''),
                i;

            for (i in list) {
                if (list[i].equalsIgnoreCase(action)) {
                    $.inidb.set('paycom', $.inidb.get('aliases', list[i]), subAction);
                }
                if ($.inidb.get('aliases', list[i]).includes(action)) {
                    $.inidb.set('paycom', list[i], subAction);
                }
            }
            return;
        }

        /*
         * @commandpath commands - Provides a list of all available custom commands.
         */
        if (command.equalsIgnoreCase('commands')) {
            var cmds = $.inidb.GetKeyList('command', ''),
                aliases = $.inidb.GetKeyList('aliases', ''),
                cmdList = [];

            for (idx in cmds) {
                if (!$.inidb.exists('disabledCommands', cmds[idx])) {
                    if (permCom(sender, cmds[idx], '') === 0) {
                        cmdList.push('!' + cmds[idx]);
                    }
                }
            }

            for (idx in aliases) {
                var aliasCmd = $.inidb.get('aliases', aliases[idx]);

                if (!$.inidb.exists('disabledCommands', aliasCmd)) {
                    if (permCom(sender, aliasCmd, '') === 0) {
                        cmdList.push('!' + aliases[idx]);
                    }
                }
            }

            if (cmdList.length > 0) {
                $.paginateArray(cmdList, 'customcommands.cmds', ', ', true, sender);
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.404.no.commands'));
            }
            return;
        }

        /*
         * @commandpath botcommands - Will show you all of the bots commands
         */
        if (command.equalsIgnoreCase('botcommands')) {
            var cmds = $.inidb.GetKeyList('permcom', ''),
                idx,
                totalPages,
                cmdList = [];

            for (idx in cmds) {
                if (cmds[idx].indexOf(' ') !== -1) {
                    continue;
                }
                if (permCom(sender, cmds[idx], '') === 0) {
                    cmdList.push('!' + cmds[idx]);
                }
            }

            if (action === undefined) {
                totalPages = $.paginateArray(cmdList, 'customcommands.botcommands', ', ', true, sender, 1);
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.botcommands.total', totalPages));
                return;
            } else if (!isNaN(action)) {
                totalPages = $.paginateArray(cmdList, 'customcommands.botcommands', ', ', true, sender, parseInt(action));
                return;
            }
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.botcommands.error'));
            return;
        }

        /*
         * @commandpath disablecom [command] - Disable a command from being used in chat
         */
        if (command.equalsIgnoreCase('disablecom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.404'));
                return;
            } else if ($.inidb.exists('disabledCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.err'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.success', action));
            $.logCustomCommand({
                'disable.command': '!' + action,
                'sender': sender,
            });
            $.inidb.set('disabledCommands', action, true);
            $.tempUnRegisterChatCommand(action);
            return;
        }

        /*
         * @commandpath enablecom [command] - Enable a command thats been disabled from being used in chat
         */
        if (command.equalsIgnoreCase('enablecom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.inidb.exists('disabledCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.err'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.success', action));
            $.logCustomCommand({
                'enable.command': '!' + action,
                'sender': sender,
            });
            $.inidb.del('disabledCommands', action);
            $.registerChatCommand(($.inidb.exists('tempDisabledCommandScript', action) ? $.inidb.get('tempDisabledCommandScript', action) : './commands/customCommands.js'), action);
            return;
        }

        /*
         * @commandpath resetcom [command] [count] - Resets the counter to zero, for a command that uses the (count) tag or optionally set to a specific value.
         */
        if (command.equalsIgnoreCase('resetcom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.reset.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (args.length === 1) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.reset.success', action));
                $.logCustomCommand({
                    'reset.command': '!' + action,
                    'reset.count': 0,
                    'sender': sender,
                });
                $.inidb.del('commandCount', action);
            } else {
                if (isNaN(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.reset.change.fail', subAction));
                } else {
                    $.inidb.set('commandCount', action, subAction);
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.reset.change.success', action, subAction));
                    $.logCustomCommand({
                        'reset.command': '!' + action,
                        'reset.count': subAction,
                        'sender': sender,
                    });
                }
            }
            return;
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./commands/customCommands.js', 'addcom', 2);
        $.registerChatCommand('./commands/customCommands.js', 'pricecom', 2);
        $.registerChatCommand('./commands/customCommands.js', 'paycom', 2);
        $.registerChatCommand('./commands/customCommands.js', 'aliascom', 2);
        $.registerChatCommand('./commands/customCommands.js', 'delalias', 2);
        $.registerChatCommand('./commands/customCommands.js', 'delcom', 2);
        $.registerChatCommand('./commands/customCommands.js', 'editcom', 2);
        $.registerChatCommand('./commands/customCommands.js', 'tokencom', 2);
        $.registerChatCommand('./commands/customCommands.js', 'permcom', 1);
        $.registerChatCommand('./commands/customCommands.js', 'commands', 7);
        $.registerChatCommand('./commands/customCommands.js', 'disablecom', 1);
        $.registerChatCommand('./commands/customCommands.js', 'enablecom', 1);
        $.registerChatCommand('./commands/customCommands.js', 'botcommands', 2);
        $.registerChatCommand('./commands/customCommands.js', 'resetcom', 2);
    });

    /*
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./commands/customCommands.js')) {
            if (event.getArgs()[0] == 'remove') {
                if (customCommands[event.getArgs()[1].toLowerCase()] !== undefined) {
                    delete customCommands[event.getArgs()[1].toLowerCase()];
                    $.unregisterChatCommand(event.getArgs()[1].toLowerCase());
                    $.coolDown.remove(event.getArgs()[1].toLowerCase());
                }
            } else if (event.getArgs()[0] == 'add') {
                customCommands[event.getArgs()[1].toLowerCase()] = event.getArgs()[2];
                $.registerChatCommand('./commands/customCommands.js', event.getArgs()[1].toLowerCase());
                if (event.getArgs()[3] != null && event.getArgs()[3].equalsIgnoreCase('cooldown')) {
                    $.coolDown.add(event.getArgs()[1].toLowerCase(), parseInt(event.getArgs()[4]), event.getArgs()[5].equals('true'));
                }
            } else if (event.getArgs()[0] == 'edit') {
                customCommands[event.getArgs()[1].toLowerCase()] = event.getArgs()[2];
                if (event.getArgs()[3] != null && event.getArgs()[3].equalsIgnoreCase('cooldown')) {
                    $.coolDown.add(event.getArgs()[1].toLowerCase(), parseInt(event.getArgs()[4]), event.getArgs()[5].equals('true'));
                }
            }
        }
    });

    /*
     * Export functions to API
     */
    $.addComRegisterCommands = addComRegisterCommands;
    $.addComRegisterAliases = addComRegisterAliases;
    $.returnCommandCost = returnCommandCost;
    $.permCom = permCom;
    $.priceCom = priceCom;
    $.getCommandPrice = getCommandPrice;
    $.tags = tags;
    $.getCommandPay = getCommandPay;
    $.payCom = payCom;
    $.command = {
        run: runCommand
    };
})();
