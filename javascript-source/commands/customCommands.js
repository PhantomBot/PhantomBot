/*
 * Copyright (C) 2016-2020 phantombot.tv
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
    var reCommandTag = new RegExp(/\(command\s([\w]+)\)/),
      customCommands = [],
      ScriptEventManager = Packages.tv.phantombot.script.ScriptEventManager,
      CommandEvent = Packages.tv.phantombot.event.command.CommandEvent;

    function quoteRegex (str) {
        return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    };

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
     * @function unescapeTags
     *
     * @param {string} args
     */
    function escapeTags(args) {
        return args.replace(/([\\()])/g, '\\$1');
    }

    /*
     * @function unescapeTags
     *
     * @param {string} args
     */
    function unescapeTags(args) {
        return args.replace(/\\([\\()])/g, '$1');
    }

    var transformers = (function () {
        var cmd,
            flag,
            i,
            j,
            keys,
            match,
            temp,
            transformers;

        // (#): a random integer from 1 to 100
        // (# a:int, b:int): a random integer from a to b
        function randomInt(args) {
            if (!args) {
                return {
                    result: String($.randRange(1, 100)),
                    cache: false
                };
            } else if ((match = args.match(/^\s(\d+), (\d+)$/))) {
                return {
                    result: String($.randRange(parseInt(match[1]), parseInt(match[2]))),
                    cache: false
                };
            }
        }

        // (n:int): the n-th argument (escaped by default)
        // (n:int=tag:str): the n-th argument if given else to the be expanded tag
        function buildArgs(n) {
            return function (args, event) {
                var arg = event.getArgs()[n - 1];
                if (!args) {
                    return {result: arg !== undefined ? String(arg) : ''};
                } else if ((match = args.match(/^([=\|])(.+)$/))) {
                    if (arg !== undefined) {
                        return {result: String(arg)};
                    }
                    return {
                        result: ($.equalsIgnoreCase(match[1], '=') ? '(' : '') + escapeTags(match[2]) + ($.equalsIgnoreCase(match[1], '=') ? ')' : ''),
                        raw: $.equalsIgnoreCase(match[1], '=')
                    };
                }
            }
        }

        // (@sender): '@<Sender's Name>, '
        function atSender(args, event) {
            if (!args) {
                return {result: String($.userPrefix(event.getSender(), true))};
            }
        }

        // (adminonlyedit): ''
        function adminonlyedit(args) {
            if (!args) {
                return {result: ''};
            }
        }

        // (age): output the channel's age and exit
        function age(args, event) {
            if (!args) {
                $.getChannelAge(event);
                return {cancel: 'true'};
            }
        }

        // (alert name:str): fire off the given alert
        function alert(args) {
            if ((match = args.match(/^ ([,.\w\W]+)$/))) {
                $.panelsocketserver.alertImage(match[1]);
                return {result: '', cache: false};
            }
        }

        // (baresender): the message's sender
        function baresender(args, event) {
            if (!args) {
                return {result: String(event.getSender())};
            }
        }

        // (channelname): name of the twitch channel
        function channelname(args) {
            if (!args) {
                return {result: String($.username.resolve($.channelName))};
            }
        }

        // (code=length:int): random code of of given lenght composed of a-zA-Z0-9
        function code(args) {
            var code,
                length,
                temp = '';
            if ((match = args.match(/^=([1-9]\d*)$/))) {
                code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                length = parseInt(match[1]);
                for (i = 0; i < length; i++) {
                    temp += code.charAt(Math.floor(Math.random() * code.length));
                }
                return {
                    result: temp,
                    cache: false
                }
            }
        }

        // (command name:str): execute command with given name and pass no args then exit
        // (command name:str args:str): execute command with given name and pass args then exit
        function command(args, event) {
            var argStr;
            if ((match = args.match(/^\s(\S+)(?:\s(.*))?$/))) {
                cmd = match[1];
                argStr = match[2] || '';
                if (cmd.length > 0) {
                    var EventBus = Packages.tv.phantombot.event.EventBus;
                    var CommandEvent = Packages.tv.phantombot.event.command.CommandEvent;
                    EventBus.instance().post(new CommandEvent(event.getSender(), cmd, argStr));
                }
                return {cancel: true};
            }
        }

        // (commandslist): lists custom commands (paginated) and exit.
        // (commandslist prefix:str): prefix + lists custom commands (paginated) and exit.
        function commandslist(args, event) {
            var prefix;
            if ((match = args.match(/^(?:\s(.*))?$/))) {
                prefix = match[1] || '';
                keys = $.inidb.GetKeyList('pricecom', '');
                temp = [];
                for (i in keys) {
                    if (!keys[i].includes(' ')) {
                        temp.push('!' + keys[i] + ': ' + $.getPointsString($.inidb.get('pricecom', keys[i])));
                    }
                }
                $.paginateArray(temp, 'NULL' + prefix, ', ', true, event.getSender());
                return {cancel: true};
            }
        }

        // (count): increases the count of how often this command has been called and output new count
        function count(args, event) {
            if (!args) {
                $.inidb.incr('commandCount', event.getCommand(), 1);
                return {result: String($.inidb.get('commandCount', event.getCommand()))};
            }
        }

        // (countdown=datetime:str): count down to given datetime
        function countdown(args) {
            if ((match = args.match(/^=(.*)$/))) {
                temp = Date.parse(match[1]);
                if (isNaN(temp)) {
                    return {result: $.lang.get('customcommands.datetime.format.invalid', match[1])};
                }
                temp -= Date.parse($.getLocalTime());
                return {result: String($.getCountString(temp / 1000, false))};
            }
        }

        // (countup=datetime:str): count up to given datetime
        function countup(args) {
            if ((match = args.match(/^=(.*)$/))) {
                temp = Date.parse(match[1]);
                if (isNaN(temp)) {
                    return {result: $.lang.get('customcommands.datetime.format.invalid', match[1])};
                }
                temp = Date.parse($.getLocalTime()) - temp;
                return {result: String($.getCountString(temp / 1000, true))};
            }
        }

        // (currenttime timezone:str, format:str): current date/time in given timezone
        function currenttime(args) {
            if ((match = args.match(/^ (.+), (.*)$/))) {
                return {result: String($.getCurrentLocalTimeString(match[2], match[1]))};
            }
        }

        // (customapi url:str): http GET url and output returned text (escaped by default)
        // $1-$9 in url will be expanded to the command's arguments
        function customapi(args, event) {
            if ((match = args.match(/^\s(.+)$/))) {
                cmd = event.getCommand();
                if (match[1].indexOf('(token)') !== -1 && $.inidb.HasKey('commandtoken', '', cmd)) {
                    match[1] = match[1].replace(/\(token\)/gi, $.inidb.GetString('commandtoken', '', cmd));
                }

                flag = false;
                match[1] = match[1].replace(/\$([1-9])/g, function (m) {
                    i = parseInt(m[1]);
                    if (!event.getArgs()[i - 1]) {
                        flag = true;
                        return m[0];
                    }
                    return event.getArgs()[i - 1];
                });
                if (flag) {
                    return {result: $.lang.get('customcommands.customapi.404', cmd)};
                }
                return {
                    result: String(getCustomAPIValue(encodeURI(match[1]))),
                    cache: false
                };
            }
        }

        // (customapijson url:str specs:str): httpGet url and extract json info according to specs (escaped by default)
        // Design Note.  As of this comment, this parser only supports parsing out of objects, it does not
        // support parsing of arrays, especially walking arrays.  If that needs to be done, please write
        // a custom JavaScript.  We limit $1 - $9 as well; 10 or more arguments being passed by users to an
        // API seems like overkill.  Even 9 does, to be honest.
        var reCustomAPITextTag = new RegExp(/{([\w\W]+)}/);
        var JSONObject = Packages.org.json.JSONObject;
        function customapijson(args, event) {
            var customJSONStringTag,
                jsonCheckList,
                jsonItems,
                jsonObject,
                response,
                responsePart,
                result = '';
            if ((match = args.match(/^ (\S+) (.+)$/))) {
                cmd = event.getCommand();
                if (match[1].indexOf('(token)') !== -1 && $.inidb.HasKey('commandtoken', '', cmd)) {
                    match[1] = match[1].replace(/\(token\)/gi, $.inidb.GetString('commandtoken', '', cmd));
                }

                flag = false;
                match[1] = match[1].replace(/\$([1-9])/g, function (m) {
                    i = parseInt(m[1]);
                    if (!event.getArgs()[i - 1]) {
                        flag = true;
                        return m[0];
                    }
                    return event.getArgs()[i - 1];
                });
                if (flag) {
                    return {result: $.lang.get('customcommands.customapi.404', cmd)};
                }

                result = '';
                response = getCustomAPIValue(encodeURI(match[1]));
                jsonItems = match[2].split(' ');
                for (j = 0; j < jsonItems.length; j++) {
                    if (jsonItems[j].startsWith('{') && jsonItems[j].endsWith('}')) {
                        result += " " + jsonItems[j].match(reCustomAPITextTag)[1];
                    } else if (jsonItems[j].startsWith('{') && !jsonItems[j].endsWith('}')) {
                        customJSONStringTag = '';
                        while (!jsonItems[j].endsWith('}')) {
                            customJSONStringTag += jsonItems[j++] + " ";
                        }
                        customJSONStringTag += jsonItems[j];
                        result += " " + customJSONStringTag.match(reCustomAPITextTag)[1];
                    } else {
                        jsonCheckList = jsonItems[j].split('.');
                        if (jsonCheckList.length === 1) {
                            try {
                                responsePart = new JSONObject(response).get(jsonCheckList[0]);
                            } catch (ex) {
                                $.log.error('Failed to get data from API: ' + ex.message);
                                return {result: $.lang.get('customcommands.customapijson.err', cmd)};
                            }
                            result += responsePart;
                        } else {
                            for (i = 0; i < jsonCheckList.length - 1; i++) {
                                if (i === 0) {
                                    try {
                                        jsonObject = new JSONObject(response).get(jsonCheckList[i]);
                                    } catch (ex) {
                                        $.log.error('Failed to get data from API: ' + ex.message);
                                        return {result: $.lang.get('customcommands.customapijson.err', cmd)};
                                    }
                                } else if (!isNaN(jsonCheckList[i + 1])) {
                                    try {
                                        jsonObject = jsonObject.get(jsonCheckList[i]);
                                    } catch (ex) {
                                        $.log.error('Failed to get data from API: ' + ex.message);
                                        return {result: $.lang.get('customcommands.customapijson.err', cmd)};
                                    }
                                } else {
                                    try {
                                        jsonObject = jsonObject.get(jsonCheckList[i]);
                                    } catch (ex) {
                                        $.log.error('Failed to get data from API: ' + ex.message);
                                        return {result: $.lang.get('customcommands.customapijson.err', cmd)};
                                    }
                                }
                            }
                            try {
                                responsePart = jsonObject.get(jsonCheckList[i]);
                            } catch (ex) {
                                $.log.error('Failed to get data from API: ' + ex.message);
                                return {result: $.lang.get('customcommands.customapijson.err', cmd)};
                            }
                            result += responsePart;
                        }
                    }
                }

                return {
                    result: String(result),
                    cache: false
                };
            }
        }

        // (downtime): how long the channel has been offline
        function downtime(args) {
            if (!args) {
                return {result: String($.getStreamDownTime())};
            }
        }

        // (echo): all arguments passed to the command
        function echo(args, event) {
            if (!args) {
                return {result: event.getArguments() ? String(event.getArguments()) : ''}
            }
        }

        // (encodeurl url:str): url encode the given url
        function encodeurl(args) {
            if ((match = args.match(/^ (.*)$/))) {
                return {result: encodeURI(match[1])};
            }
        }

        // (encodeurlparam paramter:str): like encodeurl but also ecapes "&", "=", "+", "/", etc.
        function encodeurlparam(args) {
            if ((match = args.match(/^ (.*)$/))) {
                return {result: encodeURIComponent(match[1])};
            }
        }

        // (followage): send message how long sender of command is following this channel and exit
        // (followage user:str): send message how long given user is following this channel and exit
        // (followage user:str channel:str): send message how long given user is following given channel and exit
        // leading @ will be stripped from user if present
        function followage(args, event) {
            var channel,
                user;
            if ((match = args.match(/^(?: (\S*)(?: (.*))?)?$/))) {
                user = (match[1] || String(event.getSender())).replace(/^@/, '');
                channel = (match[2] || String($.channelName)).replace(/^@/, '');
                $.getFollowAge(event.getSender(), user, channel);
                return {cancel: true};
            }
        }

        // (followdate): date since when sender of command is following this channel
        // (followdate user:str): date since when given user is following this channel
        // (followdate user:str channel:str): date since when given user is following given channel
        // leading @ will be stripped from user if present
        function followdate(args, event) {
            var channel,
                user;
            if ((match = args.match(/^(?: (\S*)(?: (.*))?)?$/))) {
                user = (match[1] || String(event.getSender())).replace(/^@/, '');
                channel = (match[2] || String($.channelName)).replace(/^@/, '');
                return {result: String($.getFollowDate(event.getSender(), user, channel))};
            }
        }

        // (follows): number of follower of this channel
        function follows(args) {
            if (!args) {
                return {result: String($.getFollows($.channelName))}
            }
        }

        // (game): currently played game
        function game(args) {
            if (!args) {
                return {result: String($.getGame($.channelName))};
            }
        }

        // (gameinfo): similar to (game) but include game time if online
        function gameinfo(args) {
            var game,
                playtime;
            if (!args) {
                game = $.getGame($.channelName);
                if (!game.trim()) {
                    return {result: $.lang.get('streamcommand.game.no.game')};
                } else if (!$.isOnline($.channelName) || !(playtime = $.getPlayTime())) {
                    return {result: $.lang.get('streamcommand.game.offline', game)};
                } else {
                    return {result: $.lang.get('streamcommand.game.online', $.getGame($.channelName), playtime)};
                }
            }
        }

        // (gameonly=name:str): exit if current game of this channel does not match
        function gameonly(args) {
            if ((match = args.match(/^=(.*)$/))) {
                if (!$.getGame($.channelName).equalsIgnoreCase(match[1])) {
                    return {cancel: true};
                }
                return {result: ''};
            }
        }

        // (gamesplayed): list games played in current stream; if offline, tell sender so and exit
        function gamesplayed(args, event) {
            if (!args) {
                if (!$.isOnline($.channelName)) {
                    $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                    return {cancel: true};
                }
                return {result: String($.getGamesPlayed())};
            }
        }

        // (help=message:str): say message and exit if no arguments are passed to the command; '' otherwise
        function help(args, event) {
            if ((match = args.match(/^=(.*)$/))) {
                if (event.getArgs()[0] === undefined) {
                    $.say(match[1]);
                    return {cancel: true};
                } else {
                    return {result: ''};
                }
            }
        }

        // (hours): number of hours sender has spent watching the channel
        // (hours user:str): number of hours the given sender has spent in this channel's chat
        function hours(args, event) {
            var user;
            if ((match = args.match(/^(?: (.*))?$/))) {
                user = (match[1] || String(event.getSender())).replace(/^@/, '');
                return {result: String($.getUserTime(user) / 3600)};
            }
        }

        // (keywordcount keyword:str): increase the keyword count for the given keyword and return new count
        function keywordcount(args) {
            var keyword,
                keywordInfo;
            if ((match = args.match(/^\s(.+)$/))) {
                keyword = match[1];
                if ($.inidb.exists('keywords', keyword)) {
                    keywordInfo = JSON.parse($.inidb.get('keywords', keyword));
                    if ('count' in keywordInfo) {
                        ++keywordInfo["count"];
                    } else {
                        keywordInfo["count"] = 1;
                    }
                    $.inidb.set('keywords', keyword, JSON.stringify(keywordInfo));
                    return {result: String(keywordInfo["count"])};
                } else {
                    return {result: $.lang.get('customcommands.keyword.404', keyword)};
                }
            }
        }

        // (lasttip): last tip message
        function lasttip(args) {
            if (!args) {
                if ($.inidb.exists('donations', 'last_donation_message')) {
                    return {result: String($.inidb.get('donations', 'last_donation_message'))};
                } else {
                    return {result: $.lang.get('customcommands.lasttip.404')};
                }
            }
        }

        // (offlineonly): exit if channel is not offline else ''
        function offlineonly(args, event) {
            if (!args) {
                if ($.isOnline($.channelName)) {
                    returnCommandCost(event.getSender(), event.getCommand(), $.isModv3(event.getSender(), event.getTags()));
                    return {cancel: true};
                }
                return {result: ''};
            }
        }

        // (onlineonly): exit if channel is not online else ''
        function onlineonly(args, event) {
            if (!args) {
                if (!$.isOnline($.channelName)) {
                    returnCommandCost(event.getSender(), event.getCommand(), $.isModv3(event.getSender(), event.getTags()));
                    return {cancel: true};
                }
                return {result: ''};
            }
        }

        // (pay): how much points this command will give
        // (pay command:str): how much points the given command will give
        function pay(args, event) {
            if ((match = args.match(/^(?:\s(.*))?$/))) {
                cmd = match[1] || event.getCommand();
                if ($.inidb.exists('paycom', cmd)) {
                    temp = $.inidb.get('paycom', cmd);
                } else {
                    temp = 0;
                }
                return {result: String($.getPointsString(temp))};
            }
        }

        // (playsound hook:str): play a sound hook
        function playsound(args) {
            if ((match = args.match(/^\s([a-zA-Z0-9_]+)$/))) {
                if (!$.audioHookExists(match[1])) {
                    $.log.error('Could not play audio hook: Audio hook does not exist.');
                    return {result: $.lang.get('customcommands.playsound.404', match[1])};
                }
                $.panelsocketserver.triggerAudioPanel(match[1]);
                return {result: '', cache: false};
            }
        }

        // (playtime): how long this channel has streamed current game
        //             if currently offline, tell sender and exit
        function playtime(args, event) {
            if (!args) {
                if (!$.isOnline($.channelName)) {
                    $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                    return {cancel: true};
                }
                return {result: String($.getPlayTime() || '')}
            }
        }

        // (pointname): the plural name of you loyalty points
        function pointname(args) {
            if (!args) {
                return {result: String($.pointNameMultiple)};
            }
        }

        // (pointtouser): like (@sender)
        // (pointtouser user:str): user name + ' -> '
        function pointtouser(args, event) {
            if ((match = args.match(/^(?:\s(.*))?$/))) {
                if (match[1]) {
                    temp = $.username.resolve(match[1].replace(/[^a-zA-Z0-9_@]/g, '')) + ' -> ';
                } else {
                    temp = $.username.resolve(event.getSender()) + ' -> ';
                }
                return {result: temp};
            }
        }

        // (points): points of the sender
        // (points user:str): points of the given user; leading @ will be stripped
        function points(args, event) {
            if ((match = args.match(/^(?:\s(.*))?$/))) {
                match[1] = match[1] ? match[1].replace(/^@/, '') : event.getSender();
                return {result: String($.getUserPoints(match[1]))};
            }
        }

        // (price): how much points this command costs
        // (price command:str): how much points the given command costs
        function price(args, event) {
            if ((match = args.match(/^(?:\s(.*))?$/))) {
                cmd = match[1] || event.getCommand();
                if ($.inidb.exists('pricecom', cmd)) {
                    temp = $.inidb.get('pricecom', cmd);
                } else {
                    temp = 0;
                }
                return {result: String($.getPointsString(temp))};
            }
        }

        // (random): random user in chat or the bot's name if chat is empty
        function random(args) {
            if (!args) {
                try {
                    return {
                        result: String($.username.resolve($.randElement($.users))),
                        cache: false
                    };
                } catch (ex) {
                    return {result: String($.username.resolve($.botName))};
                }
            }
        }

        // (randomrank): a random user in chat or the bot if chat is empty + their rank
        function randomrank(args) {
            if (!args) {
                try {
                    return {
                        result: String($.resolveRank($.randElement($.users))),
                        cache: false
                    };
                } catch (ex) {
                    return {result: String($.resolveRank($.botName))};
                }
            }
        }

        // (readfile filename:str): first line of file addons/filename
        function readfile(args) {
            var fileName;
            if ((match = args.match(/^ (.+)$/))) {
                fileName = './addons/' + match[1].replace(/\.\./g, '');
                if (!$.fileExists(fileName)) {
                    return {result: $.lang.get('customcommands.file.404', fileName)};
                }
                return {result: String($.readFile(fileName)[0] || '')};
            }
        }

        // (readfilerand filename:str): random line of file addons/filename
        function readfilerand(args) {
            var fileName;
            if ((match = args.match(/^ (.+)$/))) {
                fileName = './addons/' + match[1].replace(/\.\./g, '');
                if (!$.fileExists(fileName)) {
                    return {result: $.lang.get('customcommands.file.404', fileName)};
                }
                temp = $.readFile(fileName);
                return {result: String($.randElement(temp) || ''), cache: false};
            }
        }

        // (repeat n:int, message:str): repeat the message n times
        function repeat(args) {
            var MAX_COUNTER_VALUE = 30,
                n;
            if ((match = args.match(/^\s([1-9]\d*),\s(.*)$/))) {
                if (!match[2]) {
                    return {result: ''};
                }
                n = parseInt(match[1]);
                if (n > MAX_COUNTER_VALUE) {
                    n = MAX_COUNTER_VALUE;
                }
                temp = [];
                for (i = 0; i < n; i++) {
                    temp.push(match[2]);
                }
                return {result: temp.join(' ')};
            }
        }

        // (sender): the sender's name
        function sender(args, event) {
            if (!args) {
                return {result: String($.username.resolve(event.getSender()))};
            }
        }

        // (senderrank): sender's rank + ' ' + sender's name
        function senderrank(args, event) {
            if (!args) {
                return {result: String($.resolveRank(event.getSender()))};
            }
        }

        // (senderrankonly): sender's rank
        function senderrankonly(args, event) {
            if (!args) {
                return {result: String($.getRank(event.getSender()))};
            }
        }

        // (status): twitch status of this channel
        function status(args) {
            if (!args) {
                return {result: String($.getStatus($.channelName))};
            }
        }

        // (subscribers): number of subscribers of this channel
        function subscribers(args) {
            if (!args) {
                return {result: String($.getSubscriberCount() + ' ')};
            }
        }

        // (team_member_followers team:str, membername:str): number of followers of user membername in your given team
        function team_member_followers(args) {
            var teamObj,
                teamMember;
            if ((match = args.match(/^ ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)$/))) {
                teamObj = $.twitchteamscache.getTeam(match[1]);
                if (teamObj != null) {
                    teamMember = teamObj.getTeamMember(match[2]);
                    if (teamMember != null) {
                        return {result: String(teamMember.get('followers'))};
                    } else {
                        return {result: $.lang.get('customcommands.teamapi.member.404', match[1])};
                    }
                } else {
                    return {result: $.lang.get('customcommands.teamapi.team.404', match[2])};
                }
            }
        }

        // (team_member_game team:str, membername:str): game user membername in your given team currently plays
        function team_member_game(args) {
            var teamObj,
                teamMember;
            if ((match = args.match(/^ ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)$/))) {
                teamObj = $.twitchteamscache.getTeam(match[1]);
                if (teamObj != null) {
                    teamMember = teamObj.getTeamMember(match[2]);
                    if (teamMember != null) {
                        return {result: String(teamMember.getString('game'))};
                    } else {
                        return {result: $.lang.get('customcommands.teamapi.member.404', match[1])};
                    }
                } else {
                    return {result: $.lang.get('customcommands.teamapi.team.404', match[2])};
                }
            }
        }

        // (team_member_url team:str, membername:str): url of user membername in your given team currently plays
        function team_member_url(args) {
            var teamObj,
                teamMember;
            if ((match = args.match(/^ ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)$/))) {
                teamObj = $.twitchteamscache.getTeam(match[1]);
                if (teamObj != null) {
                    teamMember = teamObj.getTeamMember(match[2]);
                    if (teamMember != null) {
                        return {result: String(teamMember.getString('url'))};
                    } else {
                        return {result: $.lang.get('customcommands.teamapi.member.404', match[1])};
                    }
                } else {
                    return {result: $.lang.get('customcommands.teamapi.team.404', match[2])};
                }
            }
        }

        // (team_members team:str): number of members in your given team
        function team_members(args) {
            var teamObj;
            if ((match = args.match(/^ ([a-zA-Z0-9-_]+)$/))) {
                teamObj = $.twitchteamscache.getTeam(match[1]);
                if (teamObj != null) {
                    return {result: String(teamObj.getTotalMembers())};
                } else {
                    return {result: $.lang.get('customcommands.teamapi.team.404', match[1])};
                }
            }
        }

        // (team_name team:str): name of your given team
        function team_name(args) {
            var teamObj;
            if ((match = args.match(/^ ([a-zA-Z0-9-_]+)$/))) {
                teamObj = $.twitchteamscache.getTeam(match[1]);
                if (teamObj != null) {
                    return {result: String(teamObj.getName())};
                } else {
                    return {result: $.lang.get('customcommands.teamapi.team.404', match[1])};
                }
            }
        }

        // (team_random_member team:str): random member of your given team
        function team_random_member(args) {
            var teamObj;
            if ((match = args.match(/^ ([a-zA-Z0-9-_]+)$/))) {
                teamObj = $.twitchteamscache.getTeam(teamName);
                if (teamObj != null) {
                    return {result: String(teamObj.getRandomMember())};
                } else {
                    return {result: $.lang.get('customcommands.teamapi.team.404', match[1])};
                }
            }
        }

        // (team_url team:str): url to your given team
        function team_url(args) {
            var teamObj;
            if ((match = args.match(/^ ([a-zA-Z0-9-_]+)$/))) {
                teamObj = $.twitchteamscache.getTeam(teamName);
                if (teamObj != null) {
                    return {result: String(teamObj.getUrl())};
                } else {
                    return {result: $.lang.get('customcommands.teamapi.team.404', match[1])};
                }
            }
        }

        // (titleinfo): title + uptime if online
        function titleinfo(args) {
            var status;
            if (!args) {
                status = $.getStatus($.channelName);
                if (!status.trim()) {
                    return {result: $.lang.get('streamcommand.title.no.title')};
                } else if (!$.isOnline($.channelName)) {
                    return {result: $.lang.get('streamcommand.title.offline', status)};
                } else {
                    return {result: $.lang.get('streamcommand.title.online', status, String($.getStreamUptime($.channelName)))};
                }
            }
        }

        // (touser): sender's name
        // (touser name:str): given user's name
        function touser(args, event) {
            if ((match = args.match(/^(?:\s(.*))?$/))) {
                if (match[1]) {
                    temp = match[1].replace(/[^a-zA-Z0-9_@]/g, '');
                } else {
                    temp = event.getSender();
                }
                return {result: String($.username.resolve(temp))};
            }
        }

        // (unescape str:str): unescape \\ \( \) to \ ( ) respectively
        // NOTE: this might cause more substitutions and should only be applied
        // to trusted strings.
        function unescape(args) {
            if ((match = args.match(/^ (.*)$/))) {
                return {result: match[1], raw: true};
            }
        }

        // (uptime): how long the channel has been streaming this session. If offline, notify user and exit.
        function uptime(args, event) {
            if (!args) {
                if (!$.isOnline($.channelName)) {
                    $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                    return {cancel: true};
                }
                return {result: $.getStreamUptime($.channelName)};
            }
        }

        // (useronly=name:str): if sender does not match, tell user so
        //                      (given permComMsgEnabled in settings is set) and exit;
        //                      '' otherwise.
        function useronly(args, event) {
            if ((match = args.match(/^=(.*)$/))) {
                if (!event.getSender().equalsIgnoreCase(match[1])) {
                    if ($.getIniDbBoolean('settings', 'permComMsgEnabled', true)) {
                        $.say($.whisperPrefix(event.getSender()) + $.lang.get('cmd.useronly', match[1]));
                    }
                    return {cancel: true};
                }
                return {result: ''};
            }
        }

        // (viewers): number of current viewers
        function viewers(args) {
            if (!args) {
                return {result: String($.getViewers($.channelName) + ' ')};
            }
        }

        // (views): number of total views
        function views(args) {
            if (!args) {
                return {result: String($.twitchcache.getViews())};
            }
        }

        // (writefile filename:str, append:bool, text:str): write text to addons/filename
        //                                                  if append is 'true', append to file else overwrite
        function writefile(args) {
            var fileName;
            if ((match = args.match(/^ (.+), (.+), (.+)$/))) {
                fileName = './addons/' + match[1].replace(/\.\./g, '');
                $.writeToFile(match[3], fileName, match[2] === 'true');
                return {result: '', cache: false};
            }
        }

        transformers = {
            '#': randomInt,
            '@sender': atSender,
            'adminonlyedit': adminonlyedit,
            'age': age,
            'alert': alert,
            'baresender': baresender,
            'channelname': channelname,
            'code': code,
            'command': command,
            'commandslist': commandslist,
            'count': count,
            'countdown': countdown,
            'countup': countup,
            'currenttime': currenttime,
            'customapi': customapi,
            'customapijson': customapijson,
            'downtime': downtime,
            'echo': echo,
            'encodeurl': encodeurl,
            'encodeurlparam': encodeurlparam,
            'followage': followage,
            'followdate': followdate,
            'follows': follows,
            'game': game,
            'gameinfo': gameinfo,
            'gameonly': gameonly,
            'gamesplayed': gamesplayed,
            'help': help,
            'hours': hours,
            'keywordcount': keywordcount,
            'lasttip': lasttip,
            'offlineonly': offlineonly,
            'onlineonly': onlineonly,
            'pay': pay,
            'playsound': playsound,
            'playtime': playtime,
            'pointname': pointname,
            'pointtouser': pointtouser,
            'points': points,
            'price': price,
            'random': random,
            'randomrank': randomrank,
            'readfile': readfile,
            'readfilerand': readfilerand,
            'repeat': repeat,
            'sender': sender,
            'senderrank': senderrank,
            'senderrankonly': senderrankonly,
            'status': status,
            'subscribers': subscribers,
            'team_member_followers': team_member_followers,
            'team_member_game': team_member_game,
            'team_member_url': team_member_url,
            'team_members': team_members,
            'team_name': team_name,
            'team_random_member': team_random_member,
            'team_url': team_url,
            'titleinfo': titleinfo,
            'touser': touser,
            'unescape': unescape,
            'uptime': uptime,
            'useronly': useronly,
            'viewers': viewers,
            'views': views,
            'writefile': writefile,
        };
        for (i = 1; i <= 9; i++) {
            transformers[String(i)] = buildArgs(i);
        }

        return transformers;
    })();

    /*
     * @function tags
     *
     * @param {string} event
     * @param {string} message
     * @return {string}
     */
    function tags(event, message, atEnabled) {
        var match,
            tagFound = false,
            transformed,
            transformCache = {};
        message += '';  // make sure this is a JS string, not a Java string
        while ((match = message.match(/(?:[^\\]|^)(\(([^\\\s\|=()]*)([\s=\|](?:\\\(|\\\)|[^()])*)?\))/))) {
            var wholeMatch = match[1],
                tagName = match[2].toLowerCase(),
                tagArgs = match[3] ? unescapeTags(match[3]) : '';
            if (transformCache.hasOwnProperty(wholeMatch)) {
                $.replace(message, wholeMatch, transformCache[wholeMatch]);
            } else if (transformers.hasOwnProperty(tagName)
                       && (transformed = transformers[tagName](tagArgs, event))) {
                tagFound = true;
                if (transformed.hasOwnProperty('cancel') && transformed.cancel) {
                    return null;
                }
                if (!transformed.hasOwnProperty('raw') || !transformed.raw) {
                    transformed.result = escapeTags(transformed.result)
                }
                if (transformed.hasOwnProperty('cache') && transformed.cache) {
                    transformCache[wholeMatch] = transformed.result;
                    message = $.replace(message, wholeMatch, transformed.result);
                } else {
                    // only replace the first appearance
                    message = message.replace(wholeMatch, transformed.result);
                }

            } else {
                message = $.replace(message, wholeMatch, '\\(' + wholeMatch.slice(1, -1) + '\\)');
            }
        }

        // custom commands without tags can be directed towards users by mods
        if (tagFound === -1
            && atEnabled
            && event.getArgs()[0] !== undefined
            && $.isModv3(event.getSender(), event.getTags())) {
            return event.getArgs()[0] + ' -> ' + unescapeTags(message);
        }

        message = unescapeTags(message);

        if (message) {
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
