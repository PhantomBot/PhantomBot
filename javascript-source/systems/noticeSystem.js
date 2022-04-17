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
 * noticeSystem.js
 *
 * Will say a message or a command every x amount of minutes.
 */

(function () {
    var noticeGroups = [],
            selectedGroup = null,
            noticeTimoutIds = [],
            noticeLock = new java.util.concurrent.locks.ReentrantLock,
            messageCounts = [],
            lastNoticesSent = [],
            lastTimeNoticesSent = [];
    loadNotices();

    /**
     * @function loadNotices
     */
    function loadNotices() {
        noticeLock.lock();
        var keys = $.inidb.GetKeyList('notices', '').sort(),
                inconsistent = false,
                i,
                messages,
                disabled,
                intervalMin,
                intervalMax;

        noticeGroups = [];
        noticeTimoutIds = [];
        messageCounts = [];
        lastNoticesSent = [];
        lastTimeNoticesSent = [];
        for (i = 0; i < keys.length; i++) {
            inconsistent |= String(i) !== keys[i];
            if (selectedGroup == null) {
                selectedGroup = i;
            }
            noticeGroups.push(JSON.parse($.inidb.get('notices', keys[i])));
            messages = noticeGroups[noticeGroups.length - 1].messages;
            disabled = noticeGroups[noticeGroups.length - 1].disabled;
            intervalMin = noticeGroups[noticeGroups.length - 1].intervalMin;
            intervalMax = noticeGroups[noticeGroups.length - 1].intervalMax;
            if (intervalMin == null) {
                intervalMin = intervalMax || 10;
                inconsistent = true;
            }
            if (intervalMax == null) {
                intervalMax = intervalMin;
                inconsistent = true;
            }
            if (messages.length > disabled.length) {
                while (messages.length > disabled.length) {
                    disabled.push(false);
                }
                noticeGroups[noticeGroups.length - 1].disabled = disabled;
                inconsistent = true;
            } else if (messages.length < disabled.length) {
                disabled = disabled.slice(0, messages.length);
                noticeGroups[noticeGroups.length - 1].disabled = disabled;
                inconsistent = true;
            }
            noticeTimoutIds.push(null);
            messageCounts.push(0);
            lastNoticesSent.push(-1);
            lastTimeNoticesSent.push(0);
        }

        if (inconsistent) {
            $.inidb.RemoveFile('notices');
            for (i = 0; i < noticeGroups.length; i++) {
                $.inidb.set('notices', i, JSON.stringify(noticeGroups[i]));
            }
        }
        noticeLock.unlock();
    }

    /**
     * @function startNoticeTimers
     */
    function startNoticeTimers() {
        for (var i = 0; i < noticeGroups.length; i++) {
            startNoticeTimer(i);
        }
    }

    /**
     * @function startNoticeTimer
     */
    function startNoticeTimer(idx, retryCall) {
        if (retryCall == null) {
            retryCall = false;
        }
        noticeLock.lock();
        stopNoticeTimer(idx);

        var minTime = noticeGroups[idx].intervalMin,
                maxTime = noticeGroups[idx].intervalMax,
                now = $.systemTime(),
                rnd = Math.random(),
                lastSent = lastTimeNoticesSent[idx],
                time = (minTime + (maxTime - minTime) * rnd) * 6e4;
        if (isNaN(time)) {
            time = 10 * 6e4;
        }
        if (isNaN(lastSent)) {
            lastSent = now - time;
        }
        if (!retryCall && lastSent + time <= now) {
            if (trySendNotice(idx)) {
                startNoticeTimer(idx);
            } else {
                startNoticeTimer(idx, true);
            }
        } else {
            time -= now - lastSent;
            if (retryCall) {
                time = Math.max(5e3, time);
            }
            if (isNaN(time)) {
                time = 10 * 6e4;
            }
            noticeTimoutIds[idx] = setTimeout(function () {
                noticeLock.lock();
                if (noticeTimoutIds[idx] == null) {
                    // got canceled
                    return;
                }
                if (trySendNotice(idx)) {
                    noticeLock.unlock();
                    startNoticeTimer(idx);
                } else {
                    noticeLock.unlock();
                    startNoticeTimer(idx, true);
                }
            }, Math.floor(time), 'scripts::handlers::noticeSystem.js::timer_' + idx);
        }
        noticeLock.unlock();
    }

    /**
     * @function stopNoticeTimers
     */
    function stopNoticeTimers() {
        for (var i = 0; i < noticeGroups.length; i++) {
            stopNoticeTimer(i);
        }
    }

    /**
     * @function stopNoticeTimer
     */
    function stopNoticeTimer(idx) {
        noticeLock.lock();
        if (noticeTimoutIds[idx] != null) {
            clearTimeout(noticeTimoutIds[idx]);
            noticeTimoutIds[idx] = null;
        }
        noticeLock.unlock();
    }

    /**
     * @function trySendNotice
     */
    function trySendNotice(idx) {
        noticeLock.lock();
        var timer = noticeGroups[idx],
                messageCount = messageCounts[idx],
                res = false;
        if (timer.noticeToggle
                && $.bot.isModuleEnabled('./systems/noticeSystem.js')
                && (timer.reqMessages < 0 || messageCount >= timer.reqMessages)
                && (timer.noticeOfflineToggle || $.isOnline($.channelName))) {
            res = sendNotice(idx);
        }
        noticeLock.unlock();
        return res;
    }

    /**
     * @function sendNotice
     *
     * @returns {boolean} whether a was found and sent
     */
    function sendNotice(groupIdx) {
        function getNotice(noticeIdx) {
            if (disabled[noticeIdx]) {
                return null;
            }
            var notice = notices[noticeIdx]
            if (notice && notice.match(/\(gameonly=.*\)/g)) {
                var game = notice.match(/\(gameonly=(.*)\)/)[1];
                if ($.getGame($.channelName).equalsIgnoreCase(game)) {
                    return $.replace(notice, notice.match(/(\(gameonly=.*\))/)[1], "");
                } else {
                    return null;
                }
            }
            return notice;
        }

        noticeLock.lock();
        var EventBus = Packages.tv.phantombot.event.EventBus,
                CommandEvent = Packages.tv.phantombot.event.command.CommandEvent,
                i,
                timer = noticeGroups[groupIdx],
                notices = timer.messages,
                disabled = timer.disabled,
                tmp,
                randOptions = [],
                notice = null;

        if (notices.length === 0) {
            noticeLock.unlock();
            return false;
        }

        if (!timer.shuffle) {
            for (i = 1; i <= notices.length; i++) {
                notice = getNotice((lastNoticesSent[groupIdx] + i) % notices.length);
                if (notice != null) {
                    lastNoticesSent[groupIdx] = (lastNoticesSent[groupIdx] + i) % notices.length;
                    break;
                }
            }
        } else {
            for (i = 0; i <= notices.length; i++) {
                tmp = getNotice(i);
                if (tmp != null) {
                    randOptions.push([i, tmp]);
                }
            }
            if (randOptions.length > 1) {
                randOptions = randOptions.filter(function (opt) {
                    return opt[0] !== lastNoticesSent[groupIdx];
                });
            }
            if (randOptions.length > 0) {
                tmp = Math.floor(Math.random() * randOptions.length);
                notice = randOptions[tmp][1];
                lastNoticesSent[groupIdx] = randOptions[tmp][0];
            }
        }

        if (notice === null) {
            noticeLock.unlock();
            return false;
        }

        messageCounts[groupIdx] = 0;
        lastTimeNoticesSent[groupIdx] = $.systemTime();

        if (notice.startsWith('command:')) {
            notice = notice.substring(8).replace('!', '');
            EventBus.instance().postAsync(new CommandEvent($.botName, notice, ' '));
        } else if (notice.startsWith('!')) {
            notice = notice.substring(1);
            EventBus.instance().postAsync(new CommandEvent($.botName, notice, ' '));
        } else {
            $.say(notice);
        }
        noticeLock.unlock();
        return true;
    }

    /**
     * @function reloadNoticeTimer
     */
    function reloadNoticeTimer(idx) {
        noticeLock.lock();
        noticeGroups[idx] = JSON.parse($.inidb.get('notices', idx));
        lastNoticesSent[idx] = -1;
        startNoticeTimer(idx);
        noticeLock.unlock();
    }

    /**
     * @function startNoticeTimers
     * @export $
     */
    function reloadNoticeTimers() {
        for (var i = 0; i < noticeGroups.length; i++) {
            reloadNoticeTimer(i);
        }
    }

    /**
     * @function reloadNoticeTimerSettings
     */
    function reloadNoticeTimerSettings(idx) {
        noticeLock.lock();
        noticeGroups[idx] = JSON.parse($.inidb.get('notices', idx));
        startNoticeTimer(idx);
        noticeLock.unlock();
    }

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function (event) {
        noticeLock.lock();
        for (var i = 0; i < noticeGroups.length; i++) {
            messageCounts[i]++;
        }
        noticeLock.unlock();
    });

    /**
     * @function formatGroupName
     *
     * @param {number} id
     * @returns {string} the formatted name of a timer + it's id
     *
     * if the id is out of bounds: "None"
     * if the timer has a name: "<id> (<name>)"
     * if the name is empty: "<id>"
     */
    function formatGroupName(id) {
        var name;
        noticeLock.lock();
        if (id < 0 || id >= noticeGroups.length) {
            name = "None";
        } else {
            name = String(id);
            if (noticeGroups[id].name !== "") {
                name += " (" + noticeGroups[id].name + ")";
            }
        }
        noticeLock.unlock();
        return name
    }

    /**
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender(),
                command = event.getCommand(),
                argsString = event.getArguments().trim(),
                args = event.getArgs(),
                i,
                idx,
                length,
                message,
                minInterval,
                maxInterval,
                list,
                disabled,
                nameOfRemovedGroup,
                action = args[0];

        /**
         * @commandpath notice - Base command for managing notices
         */
        if (command.equalsIgnoreCase('notice')) {
            if (args.length === 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-usage'));
                return;
            }

            /**
             * @commandpath notice list - Lists the beginning of all notices in the currently selected group
             */
            if (action.equalsIgnoreCase('list')) {
                if (noticeGroups.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                    return;
                }
                noticeLock.lock();
                if (noticeGroups[selectedGroup].messages.length === 0) {
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-notices', formatGroupName(selectedGroup)));
                    return;
                }
                length = $.whisperPrefix(sender).length;
                length += $.lang.get('noticesystem.notice-list', formatGroupName(selectedGroup), "").length;
                list = [];
                for (i = 0; i < noticeGroups[selectedGroup].messages.length; i++) {
                    message = '[' + String(i) + '] ' + noticeGroups[selectedGroup].messages[i];
                    if (message.length > 48) {
                        message = message.slice(0, 48) + '…';
                    }
                    list.push(message);
                    length += message.length + 1;  // + 1 for the space used later to join the messages
                    if (length >= 480) {  // message limit is 500. Don't attempt to add another message if only a few characters are left
                        break
                    }
                }
                noticeLock.unlock();
                message = $.whisperPrefix(sender) + $.lang.get('noticesystem.notice-list', formatGroupName(selectedGroup), list.join(' '));
                if (message.length > 500) {
                    message = message.slice(0, 499) + '…';
                }
                $.say(message);
                return;
            }

            /**
             * @commandpath notice get [id] - Gets the notice related to the ID in the currently selected group
             */
            if (action.equalsIgnoreCase('get')) {
                if (noticeGroups.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                    return;
                }
                noticeLock.lock();
                if (noticeGroups[selectedGroup].messages.length === 0) {
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-notices', formatGroupName(selectedGroup)));
                    return;
                }
                if (args.length < 2 || isNaN(parseInt(args[1])) || parseInt(args[1]) < 0 || parseInt(args[1]) >= noticeGroups[selectedGroup].messages.length) {
                    length = noticeGroups[selectedGroup].messages.length;
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-get-usage', formatGroupName(selectedGroup), length - 1));
                    return;
                } else {
                    message = noticeGroups[selectedGroup].messages[parseInt(args[1])];
                    noticeLock.unlock();
                    $.say(message);
                    return;
                }
            }

            /**
             * @commandpath notice edit [id] [new message] - Replace the notice at the given ID in the currently selected group
             */
            if (action.equalsIgnoreCase('edit')) {
                if (noticeGroups.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                    return;
                }
                noticeLock.lock();
                if (args.length < 3 || isNaN(parseInt(args[1])) || parseInt(args[1]) < 0 || parseInt(args[1]) >= noticeGroups[selectedGroup].messages.length) {
                    length = noticeGroups[selectedGroup].messages.length;
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-edit-usage', formatGroupName(selectedGroup), length - 1));
                    return;
                } else {
                    argsString = args.slice(2).join(' ');
                    noticeGroups[selectedGroup].messages[parseInt(args[1])] = argsString;
                    $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-edit-success', formatGroupName(selectedGroup)));
                    return;
                }
            }

            /**
             * @commandpath notice toggleid [id] - Toggles on/off the notice at the given ID
             */
            if (action.equalsIgnoreCase('toggleid')) {
                if (noticeGroups.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                    return;
                }
                noticeLock.lock();
                if (args.length < 2 || isNaN(parseInt(args[1])) || parseInt(args[1]) < 0 || parseInt(args[1]) >= noticeGroups[selectedGroup].messages.length) {
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-toggleid-usage', formatGroupName(selectedGroup), noticeGroups[selectedGroup].messages.length));
                    return;
                } else {
                    disabled = noticeGroups[selectedGroup].disabled[parseInt(args[1])];
                    noticeGroups[selectedGroup].disabled[parseInt(args[1])] = !disabled;
                    $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-toggleid-success', args[1], disabled ? 'enabled' : 'disabled'));
                    return;
                }
            }


            /**
             * @commandpath notice remove [id] - Removes the notice related to the given ID in the currently selected group
             */
            if (action.equalsIgnoreCase('remove')) {
                if (noticeGroups.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                    return;
                }
                noticeLock.lock();
                if (args.length < 2 || isNaN(parseInt(args[1])) || parseInt(args[1]) < 0 || parseInt(args[1]) >= noticeGroups[selectedGroup].messages.length) {
                    length = noticeGroups[selectedGroup].messages.length;
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-remove-usage', formatGroupName(selectedGroup), length - 1));
                    return;
                } else {
                    noticeGroups[selectedGroup].messages.splice(parseInt(args[1]), 1);
                    noticeGroups[selectedGroup].disabled.splice(parseInt(args[1]), 1);
                    if (lastNoticesSent[selectedGroup] === parseInt(args[1])) {
                        lastNoticesSent[selectedGroup] = -1;
                    }
                    $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-remove-success', formatGroupName(selectedGroup)));
                    return;
                }
            }

            /**
             * @commandpath notice add [message or command] - Adds a notice, with a custom message or a command ex: !notice add command:COMMANDS_NAME to the currently selected group
             */
            if (action.equalsIgnoreCase('add')) {
                if (noticeGroups.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                    return;
                }
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-add-usage'));
                    return;
                } else {
                    argsString = args.slice(1).join(' ');
                    noticeLock.lock();
                    noticeGroups[selectedGroup].messages.push(argsString);
                    noticeGroups[selectedGroup].disabled.push(false);
                    $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-add-success', formatGroupName(selectedGroup), noticeGroups[selectedGroup].messages.length - 1));
                    return;
                }
            }

            /**
             * @commandpath notice insert [id] [message or command] - Inserts a notice at place [id], with a custom message or a command ex: !notice add command:COMMANDS_NAME to the currently selected group
             */
            if (action.equalsIgnoreCase('insert')) {
                if (noticeGroups.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                    return;
                }
                if (args.length < 3) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-insert-usage'));
                    return;
                }
                if (isNaN(parseInt(args[1]))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-insert-nan'));
                    return;
                }
                idx = parseInt(args[1]);
                argsString = args.slice(2).join(' ');
                noticeLock.lock();
                length = noticeGroups[selectedGroup].messages.slice(0, idx).length;
                noticeGroups[selectedGroup].messages =
                        noticeGroups[selectedGroup].messages.slice(0, idx).concat(
                        [argsString], noticeGroups[selectedGroup].messages.slice(idx)
                        );
                noticeGroups[selectedGroup].disabled =
                        noticeGroups[selectedGroup].disabled.slice(0, idx).concat(
                        [false], noticeGroups[selectedGroup].disabled.slice(idx)
                        );
                $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                noticeLock.unlock();
                $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-insert-success', length, formatGroupName(selectedGroup)));
                return;
            }

            /**
             * @commandpath notice interval [min minutes] [max minutes] | [fixed minutes] - Sets the notice interval in minutes
             */
            if (action.equalsIgnoreCase('interval')) {
                if (noticeGroups.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                    return;
                }
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-interval-usage'));
                    return;
                }
                if (args.length === 2) {
                    minInterval = maxInterval = parseFloat(args[1]);
                } else {
                    minInterval = parseFloat(args[1]);
                    maxInterval = parseFloat(args[2]);
                }
                if (isNaN(minInterval) || isNaN(maxInterval)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-interval-nan'));
                    return;
                }
                if (minInterval < 0.25 || maxInterval < 0.25) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-interval-too-small'));
                    return;
                }
                if (maxInterval < minInterval) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-interval-wrong-order'));
                    return;
                }
                noticeLock.lock();
                noticeGroups[selectedGroup].intervalMin = minInterval;
                noticeGroups[selectedGroup].intervalMax = maxInterval;
                startNoticeTimer(selectedGroup);
                $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                noticeLock.unlock();
                $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-inteval-success', formatGroupName(selectedGroup)));
                return;
            }

            /**
             * @commandpath notice req [message count] - Set the number of messages needed to trigger a notice in current group
             */
            if (action.equalsIgnoreCase('req')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-req-usage'));
                    return;
                }

                if (isNaN(parseInt(args[1])) || parseInt(args[1]) < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-req-404'));
                    return;
                }
                noticeLock.lock();
                noticeGroups[selectedGroup].reqMessages = parseInt(args[1]);
                $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                noticeLock.unlock();
                $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-req-success', formatGroupName(selectedGroup)));
                return;
            }

            /**
             * @commandpath notice status - Shows notice configuration for currently selected group
             */
            if (action.equalsIgnoreCase('status')) {
                noticeLock.lock();
                if (noticeGroups.length > 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-config',
                            formatGroupName(selectedGroup), noticeGroups.length, noticeGroups[selectedGroup].noticeToggle,
                            noticeGroups[selectedGroup].intervalMin, noticeGroups[selectedGroup].intervalMax,
                            noticeGroups[selectedGroup].reqMessages, noticeGroups[selectedGroup].messages.length,
                            noticeGroups[selectedGroup].noticeOfflineToggle, noticeGroups[selectedGroup].shuffle));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                }
                noticeLock.unlock();
                return;
            }

            /**
             * @commandpath notice selectgroup - Change the group currently selected for inspection and editing
             */
            if (action.equalsIgnoreCase('selectgroup')) {
                if (noticeGroups.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                    return;
                }
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-selectgroup-usage'));
                    return;
                } else {
                    noticeLock.lock();
                    if (isNaN(parseInt(args[1])) || parseInt(args[1]) < 0 || parseInt(args[1]) >= noticeGroups.length) {
                        noticeLock.unlock();
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-selectgroup-404', noticeGroups.length - 1));
                        return;
                    }
                }
                selectedGroup = parseInt(args[1]);
                noticeLock.unlock();
                $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-selectgroup-success', formatGroupName(selectedGroup)));
                return;
            }

            /**
             * @commandpath notice addgroup [name] - Add a group of notices with their own timer and settings
             */
            if (action.equalsIgnoreCase('addgroup')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-addgroup-usage'));
                    return;
                }
                noticeLock.lock();
                noticeGroups.push({
                    name: args.slice(1).join(' '),
                    reqMessages: 25,
                    intervalMin: 10,
                    intervalMax: 10,
                    shuffle: false,
                    noticeToggle: false,
                    noticeOfflineToggle: false,
                    messages: [],
                    disabled: []
                });
                noticeTimoutIds.push(null);
                messageCounts.push(0);
                lastNoticesSent.push(-1);
                lastTimeNoticesSent.push(0);
                selectedGroup = noticeGroups.length - 1;
                $.inidb.set('notices', selectedGroup, JSON.stringify(noticeGroups[selectedGroup]));
                startNoticeTimer(selectedGroup);
                noticeLock.unlock();
                $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-addgroup-success', formatGroupName(selectedGroup)));
                return;
            }

            /**
             * @commandpath notice removegroup [id] - Remove a group of notices
             */
            if (action.equalsIgnoreCase('removegroup')) {
                if (noticeGroups.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                    return;
                }
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-removegroup-usage', noticeGroups.length - 1));
                    return;
                } else {
                    idx = parseInt(args[1]);
                    noticeLock.lock();
                    if (isNaN(idx) || idx < 0 || idx >= noticeGroups.length) {
                        noticeLock.unlock();
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-removegroup-404', noticeGroups.length - 1));
                        return;
                    }
                }

                nameOfRemovedGroup = formatGroupName(idx);

                stopNoticeTimer(idx);
                noticeGroups.splice(idx, 1);
                noticeTimoutIds.splice(idx, 1);
                messageCounts.splice(idx, 1);
                lastNoticesSent.splice(idx, 1);
                lastTimeNoticesSent.splice(idx, 1);
                for (i = idx; i < noticeGroups.length; i++) {
                    $.inidb.set('notices', i, $.inidb.get('notices', i + 1));
                }
                $.inidb.del('notices', noticeGroups.length);

                if (noticeGroups.length === 0) {
                    selectedGroup = null;
                } else if (selectedGroup > idx) {
                    selectedGroup--;
                } else if (selectedGroup === idx) {
                    selectedGroup = 0;
                }
                noticeLock.unlock();
                if (selectedGroup !== null) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-removegroup-success', nameOfRemovedGroup, formatGroupName(selectedGroup)));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-removegroup-success-none-left', nameOfRemovedGroup));
                }
                return;
            }

            /**
             * @commandpath notice renamegroup [id] [name] - Rename a group of notices
             */
            if (action.equalsIgnoreCase('renamegroup')) {
                if (noticeGroups.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                    return;
                }
                if (args.length < 3) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-renamegroup-usage'));
                    return;
                }
                idx = parseInt(args[1]);
                noticeLock.lock();
                if (isNaN(idx) || idx < 0 || idx >= noticeGroups.length) {
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-renamegroup-404', noticeGroups.length - 1));
                    return;
                }

                message = $.lang.get('noticesystem.notice-renamegroup-success', formatGroupName(idx), args[2]);
                noticeGroups[idx].name = '' + args[2];

                $.inidb.set('notices', String(idx), JSON.stringify(noticeGroups[idx]));
                noticeLock.unlock();

                $.say($.whisperPrefix(sender) + message);
                return;
            }

            /**
             * @commandpath notice toggle - Toggles currently selected notice group on and off
             */
            if (action.equalsIgnoreCase('toggle')) {
                if (noticeGroups.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                    return;
                }
                noticeLock.lock();
                noticeGroups[selectedGroup].noticeToggle = !noticeGroups[selectedGroup].noticeToggle;
                $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                if (noticeGroups[selectedGroup].noticeToggle) {
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-enabled', formatGroupName(selectedGroup)));
                } else {
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-disabled', formatGroupName(selectedGroup)));
                }
                return;
            }

            /**
             * @commandpath notice toggleoffline - Toggles on and off if notices of currently selected group will be sent in chat if the channel is offline
             */
            if (action.equalsIgnoreCase('toggleoffline')) {
                if (noticeGroups.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                    return;
                }
                noticeLock.lock();
                noticeGroups[selectedGroup].noticeOfflineToggle = !noticeGroups[selectedGroup].noticeOfflineToggle;
                $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                if (noticeGroups[selectedGroup].noticeOfflineToggle) {
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-enabled.offline', formatGroupName(selectedGroup)));
                } else {
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-disabled.offline', formatGroupName(selectedGroup)));
                }
                return;
            }

            /**
             * @commandpath notice toggleshuffle - Toggles on and off if notices of currently selected group will be sent in random order
             */
            if (action.equalsIgnoreCase('toggleshuffle')) {
                if (noticeGroups.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                    return;
                }
                noticeLock.lock();
                noticeGroups[selectedGroup].shuffle = !noticeGroups[selectedGroup].shuffle;
                $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                if (noticeGroups[selectedGroup].shuffle) {
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-enabled.shuffle', formatGroupName(selectedGroup)));
                } else {
                    noticeLock.unlock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-disabled.shuffle', formatGroupName(selectedGroup)));
                }
                return;
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./systems/noticeSystem.js', 'notice', 1);
        startNoticeTimers();
    });

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function (event) {
        if (event.getScript().equalsIgnoreCase('./systems/noticeSystem.js')) {
            var args = event.getArgs(),
                    eventName = args[0] + '',
                    groupIdx = parseInt(args[1]),
                    tmp;
            if (eventName === 'appendGroup') {
                var params = {};
                try {
                    params = JSON.parse(args[1]);
                } catch (e) {
                    $.log.error("Received invalid parameters from frontend (" + e + ")\n" + params);
                }
                noticeLock.lock();
                noticeGroups.push({
                    name: params["name"] == null ? "Timer Group" : params["name"],
                    reqMessages: isNaN(params["reqMessages"]) ? 25 : parseInt(params["reqMessages"]),
                    intervalMin: isNaN(params["intervalMin"]) ? 10 : parseInt(params["intervalMin"]),
                    intervalMax: isNaN(params["intervalMax"]) ? 10 : parseInt(params["intervalMax"]),
                    shuffle: params["shuffle"] == null ? false : !!params["shuffle"],
                    noticeToggle: params["noticeToggle"] == null ? false : !!params["noticeToggle"],
                    noticeOfflineToggle: params["noticeOfflineToggle"] == null ? false : !!params["noticeOfflineToggle"],
                    messages: [],
                    disabled: []
                });
                noticeTimoutIds.push(null);
                messageCounts.push(0);
                lastNoticesSent.push(-1);
                lastTimeNoticesSent.push(0);
                $.inidb.set('notices', noticeGroups.length - 1, JSON.stringify(noticeGroups[noticeGroups.length - 1]));
                if (selectedGroup == null) {
                    selectedGroup = noticeGroups.length - 1;
                }
                startNoticeTimer(noticeGroups.length - 1);
                noticeLock.unlock();
            } else if (eventName === 'removeGroup') {
                noticeLock.lock();
                if (isNaN(groupIdx) || groupIdx >= noticeGroups.length) {
                    noticeLock.unlock();
                    return;
                }
                stopNoticeTimer(groupIdx);
                noticeGroups.splice(groupIdx, 1);
                noticeTimoutIds.splice(groupIdx, 1);
                messageCounts.splice(groupIdx, 1);
                lastNoticesSent.splice(groupIdx, 1);
                lastTimeNoticesSent.splice(groupIdx, 1);
                for (var i = groupIdx; i < noticeGroups.length; i++) {
                    $.inidb.set('notices', i, $.inidb.get('notices', i + 1));
                }
                $.inidb.del('notices', noticeGroups.length);
                if (noticeGroups.length === 0) {
                    selectedGroup = null;
                } else if (selectedGroup > groupIdx) {
                    selectedGroup--;
                } else if (selectedGroup === groupIdx) {
                    selectedGroup = 0;
                }
                noticeLock.unlock();
            } else if (eventName === 'reloadGroup') {
                noticeLock.lock();
                if (isNaN(groupIdx) || groupIdx >= noticeGroups.length) {
                    noticeLock.unlock();
                    return;
                }
                tmp = JSON.parse($.inidb.get('notices', groupIdx));
                noticeGroups[groupIdx].messages = tmp.messages;
                noticeGroups[groupIdx].disabled = tmp.disabled;
                reloadNoticeTimerSettings(groupIdx);
                noticeLock.unlock();
            }
        }
    });

    $.reloadNoticeTimers = reloadNoticeTimers;
})();
