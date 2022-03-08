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

(function() {
    var isOpened = false,
        info = {},
        queue = {};

    /*
     * @function open
     *
     * @param {String} username
     * @param {Number} size
     * @param {String} title
     */
    function open(username, size, title) {
        if (isOpened === true) {
            $.say($.whisperPrefix(username) + $.lang.get('queuesystem.open.error.opened'));
            return;
        } else if (size === undefined || isNaN(parseInt(size))) {
            $.say($.whisperPrefix(username) + $.lang.get('queuesystem.open.error.usage'));
            return;
        } else if (title === undefined) {
            $.say($.whisperPrefix(username) + $.lang.get('queuesystem.open.usage'));
            return;
        } else if (Object.keys(queue).length !== 0) {
            $.say($.whisperPrefix(username) + $.lang.get('queuesystem.open.error.clear'));
            return;
        }

        info = {
            size: parseInt(size),
            time: new Date(),
            title: title
        };

        if (parseInt(size) === 0) {
            $.say($.lang.get('queuesystem.open.normal', title));
        } else {
            $.say($.lang.get('queuesystem.open.limit', size, title));
        }
        isOpened = true;
        $.inidb.set('queueSettings', 'isActive', 'true');
    }

    /*
     * @function close
     *
     * @param {String} username
     */
    function close(username) {
        if (isOpened === false) {
            $.say($.whisperPrefix(username) + $.lang.get('queuesystem.close.error'));
            return;
        }

        $.say($.lang.get('queuesystem.close.success'));
        isOpened = false;
        $.inidb.set('queueSettings', 'isActive', 'false');
    }

    /*
     * @function clear
     *
     * @param {String} username
     */
    function clear(username) {
        queue = {};
        info = {};
        isOpened = false;
        $.inidb.RemoveFile('queue');
        $.say($.whisperPrefix(username) + $.lang.get('queuesystem.clear.success'));
    }

    /*
     * @function join
     *
     * @param {String} username
     * @param {String} action
     */
    function join(username, action, command) {
        if (queue[username] !== undefined) {
            $.say($.whisperPrefix(username) + $.lang.get('queuesystem.join.error.joined'));
            $.returnCommandCost(username, command, $.isMod(username));
            return;
        } else if (info.size !== 0 && (info.size <= Object.keys(queue).length)) {
            $.say($.whisperPrefix(username) + $.lang.get('queuesystem.join.error.full'));
            $.returnCommandCost(username, command, $.isMod(username));
            return;
        } else if (isOpened === false) {
            $.returnCommandCost(username, command, $.isMod(username));
            return;
        }

        queue[username] = {
            tag: (action === undefined ? '' : action),
            position: Object.keys(queue).length,
            time: new Date(),
            username: username
        };

        var temp = {
            'tag': String((action === undefined ? '' : action)),
            'time': String(date(new Date(), true)),
            'position': String(Object.keys(queue).length),
            'username': String(username)
        };
        $.inidb.set('queue', username, JSON.stringify(temp));
    }

    /*
     * @function remove
     *
     * @param {String} username
     * @param {String} action
     */
    function remove(username, action) {
        if (action === undefined) {
            $.say($.whisperPrefix(username) + $.lang.get('queuesystem.remove.usage'));
            return;
        } else if (queue[action.toLowerCase()] === undefined) {
            $.say($.whisperPrefix(username) + $.lang.get('queuesystem.remove.404'));
            return;
        }

        delete queue[action.toLowerCase()];
        $.say($.whisperPrefix(username) + $.lang.get('queuesystem.remove.removed', action));
    }

    /*
     * @function stats
     *
     * @param {String} username
     */
    function stats(username) {
        if (isOpened === true) {
            $.say($.lang.get('queuesystem.info.success', info.title, Object.keys(queue).length, info.size, date(info.time)));
        } else {
            $.say($.whisperPrefix(username) + $.lang.get('queuesystem.close.error'));
        }
    }

    /*
     * @function date
     *
     * @param  {Number} time
     * @return {String}
     */
    function date(time, simple) {
        var date = new Date(time),
            format = new java.text.SimpleDateFormat('HH:mm:ss z'),
            seconds = Math.floor((new Date() - time) / 1000),
            string = $.getTimeString(seconds);

        format.setTimeZone(java.util.TimeZone.getTimeZone(($.inidb.exists('settings', 'timezone') ? $.inidb.get('settings', 'timezone') : 'GMT')));
        if (simple === undefined) {
            return format.format(date) + ' ' + $.lang.get('queuesystem.time.info', string);
        } else {
            return format.format(date);
        }
    }

    /*
     * @function position
     *
     * @param {String} username
     * @param {String} action
     */
    function position(username, action) {
        if (action === undefined) {
            if (queue[username] !== undefined) {
                $.say($.whisperPrefix(username) + $.lang.get('queuesystem.position.self', queue[username].position, date(queue[username].time)));
            } else {
                $.say($.whisperPrefix(username) + $.lang.get('queuesystem.position.self.error'));
            }
        } else {
            action = action.toLowerCase();
            if (queue[action] !== undefined) {
                $.say($.whisperPrefix(username) + $.lang.get('queuesystem.position.other', action, queue[action].position, date(queue[action].time)));
            } else {
                $.say($.whisperPrefix(username) + $.lang.get('queuesystem.position.other.error', action));
            }
        }
    }

    /*
     * @function list
     *
     * @param {String} username
     */
    function list(username) {
        var keys = Object.keys(queue),
            temp = [],
            id = 1,
            i;

        for (i in keys) {
            temp.push('#' + (id++) + ': ' + queue[keys[i]].username);
        }

        if (temp.length !== 0) {
            if (temp.length < 10) {
                $.say($.lang.get('queuesystem.queue.list', temp.join(', ')));
            } else {
                $.say($.lang.get('queuesystem.queue.list.limited', temp.splice(0, 5).join(', '), (temp.length - 5)));
            }
        } else {
            $.say($.whisperPrefix(username) + $.lang.get('queuesystem.queue.list.empty'));
        }
    }

    /*
     * @function next
     *
     * @param {String} username
     * @param {String} action
     */
    function next(username, action) {
        var total = (action === undefined || isNaN(parseInt(action)) ? 1 : parseInt(action)),
            keys = Object.keys(queue),
            temp = [],
            t = 1,
            i;

        for (i in keys) {
            if (total >= t && temp.length < 400) {
                temp.push('#' + t + ': ' + queue[keys[i]].username);
                t++;
            } else {
                break;
            }
        }

        if (temp.length !== 0) {
            $.say($.whisperPrefix(username) + $.lang.get('queuesystem.queue.next', temp.join(', ')));
        } else {
            $.say($.whisperPrefix(username) + $.lang.get('queuesystem.queue.list.empty'));
        }
    }

    /*
     * @function resetPosition
     */
    function resetPosition(splice) {
        var keys = Object.keys(queue),
            t = 0,
            i;

        for (i in keys) {
            if (splice !== -1 && t <= splice) {
                $.inidb.del('queue', keys[i]);
                delete queue[keys[i]];
            }
            t++;
        }

        keys = Object.keys(queue);
        t = 1;

        for (i in keys) {
            queue[keys[i]].position = t;
            var temp = JSON.parse($.inidb.get('queue', keys[i]));
            temp.position = t;
            $.inidb.set('queue', keys[i], JSON.stringify(temp));
            t++;
        }

    }

    /*
     * @function pick
     *
     * @param {String} username
     * @param {String} action
     */
    function pick(username, action, random) {
        var total = (action === undefined || isNaN(parseInt(action)) ? 1 : parseInt(action)),
            keys = Object.keys(queue),
            temp = [],
            t = 1,
            i;

        if (random) {
            keys = $.arrayShuffle(keys);
        }

        for (i in keys) {
            if (total >= t && temp.length < 400) {
                temp.push('#' + t + ': ' + queue[keys[i]].username + (queue[keys[i]].tag !== '' ? ' ' + $.lang.get('queuesystem.gamertag', queue[keys[i]].tag) : ''));
                t++;
            } else {
                break;
            }
        }

        if (temp.length !== 0) {
            $.say($.lang.get('queuesystem.pick', temp.join(', ')));
        } else {
            $.say($.whisperPrefix(username) + $.lang.get('queuesystem.queue.list.empty'));
        }

        resetPosition(t - 2);
    }

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        if (command.equalsIgnoreCase('queue')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('queuesystem.usage'));
                return;
            }

            /*
             * @commandpath queue open [max size] [title] - Opens a new queue. Max size is optional.
             */
            if (action.equalsIgnoreCase('open')) {
                open(sender, (isNaN(parseInt(subAction)) ? 0 : subAction), (isNaN(parseInt(subAction)) ? args.slice(1).join(' ') : args.slice(2).join(' ')));
            }

            /*
             * @commandpath queue close - Closes the current queue that is opened.
             */
            else if (action.equalsIgnoreCase('close')) {
                close(sender);
            }

            /*
             * @commandpath queue clear - Closes and resets the current queue.
             */
            else if (action.equalsIgnoreCase('clear')) {
                clear(sender);
            }

            /*
             * @commandpath queue remove [username] - Removes that username from the queue.
             */
            else if (action.equalsIgnoreCase('remove')) {
                remove(sender, subAction);
            }

            /*
             * @commandpath queue list - Gives you the current queue list. Note that if the queue list is very long it will only show the first 5 users in the queue.
             */
            else if (action.equalsIgnoreCase('list')) {
                list(sender);
            }

            /*
             * @commandpath queue next [amount] - Shows the players that are to be picked next. Note if the amount is not specified it will only show one.
             */
            else if (action.equalsIgnoreCase('next')) {
                next(sender, subAction);
            }

            /*
             * @commandpath queue pick [amount] - Picks the players next in line from the queue. Note if the amount is not specified it will only pick one.
             */
            else if (action.equalsIgnoreCase('pick')) {
                pick(sender, subAction, false);
            }

            /*
             * @commandpath queue random [amount] - Picks random players from the queue. Note if the amount is not specified it will only pick one.
             */
            else if (action.equalsIgnoreCase('random')) {
                pick(sender, subAction, true);
            }

            /*
             * @commandpath queue position [username] - Tells what position that user is in the queue and at what time he joined.
             */
            else if (action.equalsIgnoreCase('position')) {
                position(sender, subAction);
            }

            /*
             * @commandpath queue info - Gives you the current information about the queue that is opened
             */
            else if (action.equalsIgnoreCase('info')) {
                stats(sender);
            }
        }

        /*
         * @commandpath joinqueue [gamertag] - Adds you to the current queue. Note that the gamertag part is optional.
         */
        if (command.equalsIgnoreCase('joinqueue')) {
            join(sender, args.join(' '), command);
        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./systems/queueSystem.js', 'joinqueue', 7);
        $.registerChatCommand('./systems/queueSystem.js', 'queue', 7);

        $.registerChatSubcommand('queue', 'open', 1);
        $.registerChatSubcommand('queue', 'close', 1);
        $.registerChatSubcommand('queue', 'clear', 1);
        $.registerChatSubcommand('queue', 'remove', 1);
        $.registerChatSubcommand('queue', 'pick', 1);
        $.registerChatSubcommand('queue', 'random', 1);
        $.registerChatSubcommand('queue', 'list', 7);
        $.registerChatSubcommand('queue', 'next', 7);
        $.registerChatSubcommand('queue', 'info', 7);
        $.registerChatSubcommand('queue', 'position', 7);

        $.inidb.set('queueSettings', 'isActive', 'false');
    });

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./systems/queueSystem.js')) {
            var action = event.getArgs()[0];

            if (action.equalsIgnoreCase('open')) {
                open($.channelName, event.getArgs()[1], event.getArgs().slice(2).join(' '));
            } else if (action.equalsIgnoreCase('close')) {
                close($.channelName);
            } else if (action.equalsIgnoreCase('pick')) {
                pick($.channelName, event.getArgs()[1], false);
            } else if (action.equalsIgnoreCase('random')) {
                pick($.channelName, event.getArgs()[1], true);
            } else if (action.equalsIgnoreCase('remove')) {
                if (event.getArgs()[1] !== undefined && queue[event.getArgs()[1]] !== undefined) {
                    delete queue[event.getArgs()[1].toLowerCase()];
                    $.inidb.del('queue', event.getArgs()[1].toLowerCase());
                    resetPosition(-1);
                }
            } else if (action.equalsIgnoreCase('clear')) {
                queue = {};
                info = {};
                isOpened = false;
                $.inidb.RemoveFile('queue');
            }
        }
    });
})();
