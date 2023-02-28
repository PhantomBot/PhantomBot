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
 * noticeSystem.js
 *
 * Will say a message or a command every x amount of minutes.
 */

(function () {
    var noticeGroups = [],
            selectedGroup = null,
            noticeTimeoutIds = [],
            noticeLock = new Packages.java.util.concurrent.locks.ReentrantLock(),
            messageCounts = [],
            lastNoticesSent = [],
            lastTimeNoticesSent = [];

    /**
     * @function loadNotices
     */
    function loadNotices() {
        try {
            noticeLock.lock();
            let keys = $.inidb.GetKeyList('notices', '').sort(),
                    inconsistent = false;

            noticeGroups = [];
            noticeTimeoutIds = [];
            messageCounts = [];
            lastNoticesSent = [];
            lastTimeNoticesSent = [];

            for (let i = 0; i < keys.length; i++) {
                inconsistent |= String(i) !== keys[i];

                let noticeGroup = null;
                try {
                    noticeGroup = JSON.parse($.inidb.get('notices', keys[i]));
                } catch (e){}

                if (noticeGroup === undefined || noticeGroup === null) {
                    inconsistent = true;
                } else {
                    if (noticeGroup.name === undefined || noticeGroup.name === null) {
                        noticeGroup.name = '';
                        inconsistent = true;
                    }

                    if (noticeGroup.reqMessages === undefined || noticeGroup.reqMessages === null) {
                        noticeGroup.reqMessages = 25;
                        inconsistent = true;
                    }

                    if (noticeGroup.shuffle === undefined || noticeGroup.shuffle === null) {
                        noticeGroup.shuffle = false;
                        inconsistent = true;
                    }

                    if (noticeGroup.noticeToggle === undefined || noticeGroup.noticeToggle === null) {
                        noticeGroup.noticeToggle = false;
                        inconsistent = true;
                    }

                    if (noticeGroup.noticeOfflineToggle === undefined || noticeGroup.noticeOfflineToggle === null) {
                        noticeGroup.noticeOfflineToggle = false;;
                        inconsistent = true;
                    }

                    if (noticeGroup.intervalMin === undefined || noticeGroup.intervalMin === null) {
                        if (noticeGroup.intervalMax === undefined || noticeGroup.intervalMax === null) {
                            noticeGroup.intervalMin = 10;
                        } else {
                            noticeGroup.intervalMin = noticeGroup.intervalMax;
                        }
                        inconsistent = true;
                    }

                    if (noticeGroup.intervalMax === undefined || noticeGroup.intervalMax === null) {
                        noticeGroup.intervalMax = noticeGroup.intervalMin;
                        inconsistent = true;
                    }

                    if (noticeGroup.messages === undefined || noticeGroup.messages === null) {
                        noticeGroup.messages = [];
                        inconsistent = true;
                    }

                    if (noticeGroup.disabled === undefined || noticeGroup.disabled === null) {
                        noticeGroup.disabled = [];
                        inconsistent = true;
                    }

                    if (noticeGroup.messages.length !== noticeGroup.disabled.length) {
                        while (noticeGroup.messages.length > noticeGroup.disabled.length) {
                            noticeGroup.disabled.push(false);
                        }
                        noticeGroup.disabled = noticeGroup.disabled.slice(0, messages.length);
                        inconsistent = true;
                    }

                    noticeGroups.push(noticeGroup);
                    noticeTimeoutIds.push(null);
                    messageCounts.push(0);
                    lastNoticesSent.push(-1);
                    lastTimeNoticesSent.push(0);
                }
            }

            if (inconsistent) {
                $.inidb.RemoveFile('notices');
                for (let i = 0; i < noticeGroups.length; i++) {
                    $.inidb.set('notices', i, JSON.stringify(noticeGroups[i]));
                }
            }

            if (selectedGroup === null) {
                selectedGroup = 0;
            }
        } finally {
            noticeLock.unlock();
        }
    }

    /**
     * @function startNoticeTimers
     */
    function startNoticeTimers() {
        try {
            noticeLock.lock();
            for (let i = 0; i < noticeGroups.length; i++) {
                startNoticeTimer(i);
            }
        } finally {
            noticeLock.unlock();
        }
    }

    /*
     * @function startNoticeTimer
     */
    function startNoticeTimer(idx, retryCall) {
        retryCall = (retryCall === undefined || retryCall === null) ? false : retryCall;
        stopNoticeTimer(idx);

        try {
            noticeLock.lock();

            var minTime = noticeGroups[idx].intervalMin,
                    maxTime = noticeGroups[idx].intervalMax,
                    now = $.systemTime(),
                    rnd = Math.random(),
                    lastSent = lastTimeNoticesSent[idx],
                    time = (minTime + (maxTime - minTime) * rnd) * 6e4;

            if (isNaN(time)) {
                time = 10 * 6e4;
            }
            if (lastSent === null || isNaN(lastSent)) {
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

                noticeTimeoutIds[idx] = setTimeout(function () {
                    try {
                        noticeLock.lock();
                        if (noticeTimeoutIds[idx] === null || noticeTimeoutIds[idx] === undefined) {
                            // got canceled
                            return;
                        }
                        if (trySendNotice(idx)) {
                            startNoticeTimer(idx);
                        } else {
                            startNoticeTimer(idx, true);
                        }
                    } finally {
                        noticeLock.unlock();
                    }
                }, Math.floor(time), 'scripts::handlers::noticeSystem.js::timer_' + idx);
            }
        } finally {
            noticeLock.unlock();
        }
    }

    /**
     * @function stopNoticeTimers
     */
    function stopNoticeTimers() {
        try {
            noticeLock.lock();
            for (var i = 0; i < noticeGroups.length; i++) {
                stopNoticeTimer(i);
            }
        } finally {
            noticeLock.unlock();
        }
    }

    /*
     * @function stopNoticeTimer
     */
    function stopNoticeTimer(idx) {
        try {
            noticeLock.lock();
            if (noticeTimeoutIds[idx] !== null && noticeTimeoutIds[idx] !== undefined) {
                clearTimeout(noticeTimeoutIds[idx]);
                noticeTimeoutIds[idx] = null;
            }
        } finally {
            noticeLock.unlock();
        }
    }

    /*
     * @function trySendNotice
     */
    function trySendNotice(idx) {
        try {
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
            return res;
        } finally {
            noticeLock.unlock();
        }
    }

    /*
     * @function getNotice
     *
     * @returns {Number} notice index
     */
    function getNotice(noticeIdx, timer) {
        if (timer.disabled[noticeIdx]) {
            return null;
        }

        var notice = timer.messages[noticeIdx];

        if (notice && notice.match(/\(gameonly=.*\)/g)) {
            var game = notice.match(/\(gameonly=(.*)\)/)[1];
            if ($.getGame($.channelName).equalsIgnoreCase(game)) {
                return $.replace(notice, notice.match(/(\(gameonly=.*\))/)[1], '');
            }

            return null;
        }
        return notice;
    }

    /*
     * @function sendNotice
     *
     * @returns {boolean} whether a was found and sent
     */
    function sendNotice(groupIdx) {
        try {
            noticeLock.lock();
            var EventBus = Packages.tv.phantombot.event.EventBus,
                    CommandEvent = Packages.tv.phantombot.event.command.CommandEvent,
                    i,
                    timer = noticeGroups[groupIdx],
                    notices = timer.messages,
                    tmp,
                    randOptions = [],
                    notice = null;

            if (notices === null || notices === undefined || notices.length === 0 ) {
                return false;
            }

            if (!timer.shuffle) {
                for (i = 1; i <= notices.length; i++) {
                    notice = getNotice((lastNoticesSent[groupIdx] + i) % notices.length, timer);
                    if (notice !== null) {
                        lastNoticesSent[groupIdx] = (lastNoticesSent[groupIdx] + i) % notices.length;
                        break;
                    }
                }
            } else {
                for (i = 0; i < notices.length; i++) {
                    tmp = getNotice(i, timer);
                    if (tmp !== null) {
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

            if (notice === null || notice === undefined) {
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

            return true;
        } finally {
            noticeLock.unlock();
        }
    }

    /*
     * @function reloadNoticeTimer
     */
    function reloadNoticeTimer(idx) {
        try {
            noticeLock.lock();
            noticeGroups[idx] = JSON.parse($.inidb.get('notices', idx));
            lastNoticesSent[idx] = -1;
            startNoticeTimer(idx);
        } finally {
            noticeLock.unlock();
        }
    }

    /**
     * @function reloadNoticeTimers
     * @export $
     */
    function reloadNoticeTimers() {
        try {
            noticeLock.lock();
            for (var i = 0; i < noticeGroups.length; i++) {
                reloadNoticeTimer(i);
            }
        } finally {
            noticeLock.unlock();
        }
    }

    /*
     * @function reloadNoticeTimerSettings
     */
    function reloadNoticeTimerSettings(idx) {
        try {
            noticeLock.lock();
            noticeGroups[idx] = JSON.parse($.inidb.get('notices', idx));
            startNoticeTimer(idx);
        } finally {
            noticeLock.unlock();
        }
    }

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function () {
        try {
            noticeLock.lock();

            for (var i = 0; i < noticeGroups.length; i++) {
                messageCounts[i]++;
            }
        } finally {
            noticeLock.unlock();
        }
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
        try {
            noticeLock.lock();

            if (id < 0 || id >= noticeGroups.length) {
                name = 'None';
            } else {
                name = String(id);
                if (noticeGroups[id].name !== '') {
                    name += ' (' + noticeGroups[id].name + ')';
                }
            }

            return name;
        } finally {
            noticeLock.unlock();
        }
    }

    function checkForNoticesGroups(sender) {
        try {
            noticeLock.lock();

            if (noticeGroups === undefined || noticeGroups === null || noticeGroups.length === 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-groups'));
                return false;
            }

            return true;
        } finally {
            noticeLock.unlock();
        }
    }

    /*
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
                if (!checkForNoticesGroups(sender)) {
                    return;
                }

                try {
                    noticeLock.lock();
                    if (noticeGroups[selectedGroup].messages.length === 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-notices', formatGroupName(selectedGroup)));
                        return;
                    }

                    length = ($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-list', formatGroupName(selectedGroup), '')).length;
                    list = [];

                    // Message limit is 500. Don't attempt to add another message if only a few characters are left
                    for (i = 0; i < noticeGroups[selectedGroup].messages.length && length < 480; i++) {
                        message = '[' + String(i) + '] ' + noticeGroups[selectedGroup].messages[i];

                        if (message.length > 48) {
                            message = message.slice(0, 48) + '…';
                        }

                        list.push(message);
                        length += message.length + 1; // + 1 for the space used later to join the messages
                    }

                    message = $.whisperPrefix(sender) + $.lang.get('noticesystem.notice-list', formatGroupName(selectedGroup), list.join(' '));
                } finally {
                    noticeLock.unlock();
                }

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
                if (!checkForNoticesGroups(sender)) {
                    return;
                }

                try {
                    noticeLock.lock();
                    if (noticeGroups[selectedGroup].messages.length === 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-no-notices', formatGroupName(selectedGroup)));
                        return;
                    }

                    if (args.length < 2 || isNaN(parseInt(args[1])) || parseInt(args[1]) < 0 || parseInt(args[1]) >= noticeGroups[selectedGroup].messages.length) {
                        length = noticeGroups[selectedGroup].messages.length;
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-get-usage', formatGroupName(selectedGroup), length - 1));
                        return;
                    }

                    $.say(noticeGroups[selectedGroup].messages[parseInt(args[1])]);
                    return;
                } finally {
                    noticeLock.unlock();
                }
            }

            /**
             * @commandpath notice edit [id] [new message] - Replace the notice at the given ID in the currently selected group
             */
            if (action.equalsIgnoreCase('edit')) {
                if (!checkForNoticesGroups(sender)) {
                    return;
                }

                try {
                    noticeLock.lock();
                    if (args.length < 3 || isNaN(parseInt(args[1])) || parseInt(args[1]) < 0 || parseInt(args[1]) >= noticeGroups[selectedGroup].messages.length) {
                        length = noticeGroups[selectedGroup].messages.length;
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-edit-usage', formatGroupName(selectedGroup), length - 1));
                        return;
                    }

                    argsString = args.slice(2).join(' ');
                    noticeGroups[selectedGroup].messages[parseInt(args[1])] = argsString;
                    $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-edit-success', formatGroupName(selectedGroup)));
                    return;
                } finally {
                    noticeLock.unlock();
                }
            }

            /**
             * @commandpath notice toggleid [id] - Toggles on/off the notice at the given ID
             */
            if (action.equalsIgnoreCase('toggleid')) {
                if (!checkForNoticesGroups(sender)) {
                    return;
                }

                try {
                    noticeLock.lock();
                    if (args.length < 2 || isNaN(parseInt(args[1])) || parseInt(args[1]) < 0 || parseInt(args[1]) >= noticeGroups[selectedGroup].messages.length) {
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-toggleid-usage', formatGroupName(selectedGroup), noticeGroups[selectedGroup].messages.length));
                        return;
                    }

                    if (args.length > 2 && $.jsString(args[2]) === 'on') {
                        disabled = false;
                    } else if (args.length > 2 && $.jsString(args[2]) === 'off') {
                        disabled = true;
                    } else {
                        disabled = !noticeGroups[selectedGroup].disabled[parseInt(args[1])];
                    }
                    noticeGroups[selectedGroup].disabled[parseInt(args[1])] = disabled;
                    $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                } finally {
                    noticeLock.unlock();
                }

                $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-toggleid-success', args[1], disabled ? $.lang.get('common.disabled') : $.lang.get('common.enabled')));
                return;
            }


            /**
             * @commandpath notice remove [id] - Removes the notice related to the given ID in the currently selected group
             */
            if (action.equalsIgnoreCase('remove')) {
                if (!checkForNoticesGroups(sender)) {
                    return;
                }

                try {
                    noticeLock.lock();
                    if (args.length < 2 || isNaN(parseInt(args[1])) || parseInt(args[1]) < 0 || parseInt(args[1]) >= noticeGroups[selectedGroup].messages.length) {
                        length = noticeGroups[selectedGroup].messages.length;
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-remove-usage', formatGroupName(selectedGroup), length - 1));
                        return;
                    }

                    noticeGroups[selectedGroup].messages.splice(parseInt(args[1]), 1);
                    noticeGroups[selectedGroup].disabled.splice(parseInt(args[1]), 1);

                    if (lastNoticesSent[selectedGroup] === parseInt(args[1])) {
                        lastNoticesSent[selectedGroup] = -1;
                    }

                    $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-remove-success', formatGroupName(selectedGroup)));
                    return;
                } finally {
                    noticeLock.unlock();
                }
            }

            /**
             * @commandpath notice add [message or command] - Adds a notice, with a custom message or a command ex: !notice add command:COMMANDS_NAME to the currently selected group
             */
            if (action.equalsIgnoreCase('add')) {
                if (!checkForNoticesGroups(sender)) {
                    return;
                }

                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-add-usage'));
                    return;
                }

                argsString = args.slice(1).join(' ');
                try {
                    noticeLock.lock();
                    noticeGroups[selectedGroup].messages.push(argsString);
                    noticeGroups[selectedGroup].disabled.push(false);
                    $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-add-success', formatGroupName(selectedGroup), noticeGroups[selectedGroup].messages.length - 1));
                    return;
                } finally {
                    noticeLock.unlock();
                }
            }

            /**
             * @commandpath notice insert [id] [message or command] - Inserts a notice at place [id], with a custom message or a command ex: !notice add command:COMMANDS_NAME to the currently selected group
             */
            if (action.equalsIgnoreCase('insert')) {
                if (!checkForNoticesGroups(sender)) {
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
                try {
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
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-insert-success', length, formatGroupName(selectedGroup)));
                    return;
                } finally {
                    noticeLock.unlock();
                }
            }

            /**
             * @commandpath notice interval [min minutes] [max minutes] | [fixed minutes] - Sets the notice interval in minutes
             */
            if (action.equalsIgnoreCase('interval')) {
                if (!checkForNoticesGroups(sender)) {
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

                try {
                    noticeLock.lock();
                    noticeGroups[selectedGroup].intervalMin = minInterval;
                    noticeGroups[selectedGroup].intervalMax = maxInterval;
                    stopNoticeTimer(selectedGroup);
                    lastTimeNoticesSent[selectedGroup] = 0;
                    startNoticeTimer(selectedGroup);
                    $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-inteval-success', formatGroupName(selectedGroup)));
                    return;
                } finally {
                    noticeLock.unlock();
                }
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

                try {
                    noticeLock.lock();
                    noticeGroups[selectedGroup].reqMessages = parseInt(args[1]);
                    $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-req-success', formatGroupName(selectedGroup)));
                    return;
                } finally {
                    noticeLock.unlock();
                }
            }

            /**
             * @commandpath notice status - Shows notice configuration for currently selected group
             */
            if (action.equalsIgnoreCase('status')) {
                if (!checkForNoticesGroups(sender)) {
                    return;
                }

                try {
                    noticeLock.lock();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-config',
                        formatGroupName(selectedGroup), noticeGroups.length, noticeGroups[selectedGroup].noticeToggle,
                        noticeGroups[selectedGroup].intervalMin, noticeGroups[selectedGroup].intervalMax,
                        noticeGroups[selectedGroup].reqMessages, noticeGroups[selectedGroup].messages.length,
                        noticeGroups[selectedGroup].noticeOfflineToggle, noticeGroups[selectedGroup].shuffle));
                    return;
                } finally {
                    noticeLock.unlock();
                }
            }

            /**
             * @commandpath notice selectgroup [id] - Change the group currently selected for inspection and editing
             */
            if (action.equalsIgnoreCase('selectgroup')) {
                if (!checkForNoticesGroups(sender)) {
                    return;
                }

                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-selectgroup-usage'));
                    return;
                }

                try {
                    noticeLock.lock();
                    if (isNaN(parseInt(args[1])) || parseInt(args[1]) < 0 || parseInt(args[1]) >= noticeGroups.length) {
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-selectgroup-404', noticeGroups.length - 1));
                        return;
                    }

                    selectedGroup = parseInt(args[1]);
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-selectgroup-success', formatGroupName(selectedGroup)));
                    return;
                } finally {
                    noticeLock.unlock();
                }
            }

            /**
             * @commandpath notice addgroup [name] - Add a group of notices with their own timer and settings
             */
            if (action.equalsIgnoreCase('addgroup')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-addgroup-usage'));
                    return;
                }

                try {
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

                    noticeTimeoutIds.push(null);
                    messageCounts.push(0);
                    lastNoticesSent.push(-1);
                    lastTimeNoticesSent.push(0);
                    selectedGroup = noticeGroups.length - 1;
                    $.inidb.set('notices', selectedGroup, JSON.stringify(noticeGroups[selectedGroup]));
                    startNoticeTimer(selectedGroup);
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-addgroup-success', formatGroupName(selectedGroup)));
                    return;
                } finally {
                    noticeLock.unlock();
                }
            }

            /**
             * @commandpath notice removegroup [id] - Remove a group of notices
             */
            if (action.equalsIgnoreCase('removegroup')) {
                if (!checkForNoticesGroups(sender)) {
                    return;
                }

                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-removegroup-usage', noticeGroups.length - 1));
                    return;
                }

                idx = parseInt(args[1]);

                try {
                    noticeLock.lock();
                    if (isNaN(idx) || idx < 0 || idx >= noticeGroups.length) {
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-removegroup-404', noticeGroups.length - 1));
                        return;
                    }

                    nameOfRemovedGroup = formatGroupName(idx);
                    stopNoticeTimer(idx);
                    noticeGroups.splice(idx, 1);
                    noticeTimeoutIds.splice(idx, 1);
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

                    if (selectedGroup !== null) {
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-removegroup-success', nameOfRemovedGroup, formatGroupName(selectedGroup)));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-removegroup-success-none-left', nameOfRemovedGroup));
                    }

                    return;
                } finally {
                    noticeLock.unlock();
                }
            }

            /**
             * @commandpath notice renamegroup [id] [name] - Rename a group of notices
             */
            if (action.equalsIgnoreCase('renamegroup')) {
                if (!checkForNoticesGroups(sender)) {
                    return;
                }

                if (args.length < 3) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-renamegroup-usage'));
                    return;
                }

                idx = parseInt(args[1]);

                try {
                    noticeLock.lock();
                    if (isNaN(idx) || idx < 0 || idx >= noticeGroups.length) {
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-renamegroup-404', noticeGroups.length - 1));
                        return;
                    }

                    message = $.lang.get('noticesystem.notice-renamegroup-success', formatGroupName(idx), args[2]);
                    noticeGroups[idx].name = '' + args[2];
                    $.inidb.set('notices', String(idx), JSON.stringify(noticeGroups[idx]));
                } finally {
                    noticeLock.unlock();
                }

                $.say($.whisperPrefix(sender) + message);
                return;
            }

            /**
             * @commandpath notice toggle - Toggles the currently selected notice group on and off
             */
            if (action.equalsIgnoreCase('toggle')) {
                if (!checkForNoticesGroups(sender)) {
                    return;
                }

                try {
                    noticeLock.lock();
                    noticeGroups[selectedGroup].noticeToggle = !noticeGroups[selectedGroup].noticeToggle;
                    $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));

                    if (noticeGroups[selectedGroup].noticeToggle) {
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-enabled', formatGroupName(selectedGroup)));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-disabled', formatGroupName(selectedGroup)));
                    }

                    return;
                } finally {
                    noticeLock.unlock();
                }
            }

            /**
             * @commandpath notice toggleoffline - Toggles on and off if notices of the currently selected group will be sent in chat if the channel is offline
             */
            if (action.equalsIgnoreCase('toggleoffline')) {
                if (!checkForNoticesGroups(sender)) {
                    return;
                }

                try {
                    noticeLock.lock();
                    noticeGroups[selectedGroup].noticeOfflineToggle = !noticeGroups[selectedGroup].noticeOfflineToggle;
                    $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));

                    if (noticeGroups[selectedGroup].noticeOfflineToggle) {
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-enabled.offline', formatGroupName(selectedGroup)));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-disabled.offline', formatGroupName(selectedGroup)));
                    }

                    return;
                } finally {
                    noticeLock.unlock();
                }
            }

            /**
             * @commandpath notice toggleshuffle - Toggles on and off if notices of the currently selected group will be sent in random order
             */
            if (action.equalsIgnoreCase('toggleshuffle')) {
                if (!checkForNoticesGroups(sender)) {
                    return;
                }

                try {
                    noticeLock.lock();
                    noticeGroups[selectedGroup].shuffle = !noticeGroups[selectedGroup].shuffle;
                    $.inidb.set('notices', String(selectedGroup), JSON.stringify(noticeGroups[selectedGroup]));

                    if (noticeGroups[selectedGroup].shuffle) {
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-enabled.shuffle', formatGroupName(selectedGroup)));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('noticesystem.notice-disabled.shuffle', formatGroupName(selectedGroup)));
                    }

                    return;
                } finally {
                    noticeLock.unlock();
                }
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./systems/noticeSystem.js', 'notice', $.PERMISSION.Admin);
        loadNotices();
        startNoticeTimers();
    });

    /*
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
                    $.log.error('Received invalid parameters from frontend (' + e + ')\n' + params);
                }

                try {
                    noticeLock.lock();
                    noticeGroups.push({
                        name: (params['name'] === null || params['name'] === undefined) ? 'Timer Group' : params['name'],
                        reqMessages: (params['reqMessages'] === null || isNaN(params['reqMessages'])) ? 25 : parseInt(params['reqMessages']),
                        intervalMin: (params['intervalMin'] === null || isNaN(params['intervalMin'])) ? 10 : parseInt(params['intervalMin']),
                        intervalMax: (params['intervalMax'] === null || isNaN(params['intervalMax'])) ? 10 : parseInt(params['intervalMax']),
                        shuffle: (params['shuffle'] === null || params['shuffle'] === undefined) ? false : !!params['shuffle'],
                        noticeToggle: (params['noticeToggle'] === null || params['noticeToggle'] === undefined) ? false : !!params['noticeToggle'],
                        noticeOfflineToggle: (params['noticeOfflineToggle'] === null || params['noticeOfflineToggle'] === undefined) ? false : !!params['noticeOfflineToggle'],
                        messages: [],
                        disabled: []
                    });
                    noticeTimeoutIds.push(null);
                    messageCounts.push(0);
                    lastNoticesSent.push(-1);
                    lastTimeNoticesSent.push(0);
                    $.inidb.set('notices', noticeGroups.length - 1, JSON.stringify(noticeGroups[noticeGroups.length - 1]));

                    if (selectedGroup === null) {
                        selectedGroup = noticeGroups.length - 1;
                    }
                } finally {
                    noticeLock.unlock();
                }

                startNoticeTimer(noticeGroups.length - 1);
            } else if (eventName === 'removeGroup') {
                try {
                    noticeLock.lock();
                    if (isNaN(groupIdx) || groupIdx >= noticeGroups.length) {
                        return;
                    }

                    stopNoticeTimer(groupIdx);
                    noticeGroups.splice(groupIdx, 1);
                    noticeTimeoutIds.splice(groupIdx, 1);
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
                } finally {
                    noticeLock.unlock();
                }
            } else if (eventName === 'reloadGroup') {
                try {
                    noticeLock.lock();
                    if (isNaN(groupIdx) || groupIdx >= noticeGroups.length) {
                        return;
                    }

                    tmp = JSON.parse($.inidb.get('notices', groupIdx));
                    noticeGroups[groupIdx].messages = tmp.messages;
                    noticeGroups[groupIdx].disabled = tmp.disabled;

                    if (args.length > 2 && $.jsString(args[2]) === 'true') {
                        stopNoticeTimer(groupIdx);
                        lastTimeNoticesSent[groupIdx] = 0;
                    }

                } finally {
                    noticeLock.unlock();
                }

                reloadNoticeTimerSettings(groupIdx);
            }
        }
    });

    $.reloadNoticeTimers = reloadNoticeTimers;
})();
