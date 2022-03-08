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
 * pollSystem.js
 *
 * This module enables the channel owner to start/manage polls
 * Start/stop polls is exported to $.poll for use in other scripts
 */
(function () {
    var poll = {
        pollId: 0,
        options: [],
        votes: [],
        voters: [],
        callback: function () {},
        pollRunning: false,
        pollMaster: '',
        time: 0,
        question: '',
        minVotes: 0,
        result: '',
        hasTie: 0,
        counts: [],
        startTime: 0
    },
            timeout,
            saveStateInterval;
    var objOBS = [];

    /**
     * @function hasKey
     * @param {Array} list
     * @param {*} value
     * @param {Number} [subIndex]
     * @returns {boolean}
     */
    function hasKey(list, value, subIndex) {
        var i;

        if (subIndex > -1) {
            for (i in list) {
                if (list[i][subIndex].equalsIgnoreCase(value)) {
                    return true;
                }
            }
        } else {
            for (i in list) {
                if (list[i].equalsIgnoreCase(value)) {
                    return true;
                }
            }
        }
        return false;
    }
    ;

    // Compile regular expressions.
    var rePollOpenFourOptions = new RegExp(/"([\w\W]+)"\s+"([\w\W]+)"\s+(\d+)\s+(\d+)/),
            rePollOpenThreeOptions = new RegExp(/"([\w\W]+)"\s+"([\w\W]+)"\s+(\d+)/),
            rePollOpenTwoOptions = new RegExp(/"([\w\W]+)"\s+"([\w\W]+)"/);

    /**
     * @function runPoll
     * @export $.poll
     * @param {string} question
     * @param {Array} options
     * @param {Number} time
     * @param {string} pollMaster
     * @param {Number} [minVotes]
     * @param {Function} callback
     * @param {string} [initialVote]
     * @returns {boolean}
     */
    function runPoll(question, options, time, pollMaster, minVotes, callback) {
        var optionsStr = "";

        if (poll.pollRunning) {
            return false
        }

        objOBS = [];

        poll.pollRunning = true;
        poll.pollMaster = pollMaster;
        poll.time = (parseInt(time) * 1000);
        poll.callback = callback;
        poll.question = question;
        poll.options = options;
        poll.minVotes = (minVotes ? minVotes : 1);
        poll.votes = [];
        poll.voters = [];
        poll.counts = [];
        poll.hasTie = 0;

        // Remove the old files.
        $.inidb.RemoveFile('pollPanel');
        $.inidb.RemoveFile('pollVotes');


        for (var i = 0; i < poll.options.length; i++) {
            optionsStr += (i + 1) + ") " + poll.options[i] + " ";
            $.inidb.set('pollVotes', poll.options[i], 0);
            objOBS.push({
                'label': poll.options[i],
                'votes': 0
            });
        }


        if (poll.time > 0) {
            $.say($.lang.get('pollsystem.poll.started', $.resolveRank(pollMaster), time, poll.minVotes, poll.question, optionsStr));

            timeout = setTimeout(function () {
                endPoll();
            }, poll.time);
        } else {
            $.say($.lang.get('pollsystem.poll.started.nottime', $.resolveRank(pollMaster), poll.minVotes, poll.question, optionsStr));
        }

        poll.startTime = $.systemTime();
        saveStateInterval = setInterval(function () {
            saveState();
        }, 5 * 6e4);

        var msg = JSON.stringify({
            'start_poll': 'true',
            'data': JSON.stringify(objOBS)
        });
        $.alertspollssocket.sendJSONToAll(msg);

        $.inidb.set('pollPanel', 'title', question);
        $.inidb.set('pollPanel', 'options', options.join(','));
        $.inidb.set('pollPanel', 'isActive', 'true');
        saveState();
        return true;
    }
    ;

    function reopen() {
        if (!$.inidb.FileExists('pollState') || !$.inidb.HasKey('pollState', '', 'poll') || !$.inidb.HasKey('pollState', '', 'objOBS')) {
            return;
        }

        poll = JSON.parse($.inidb.get('pollState', 'poll'));
        objOBS = JSON.parse($.inidb.get('pollState', 'objOBS'));
        poll.callback = saywinner;

        if (poll.pollRunning) {
            $.inidb.set('pollPanel', 'title', poll.question);
            $.inidb.set('pollPanel', 'options', poll.options.join(','));
            $.inidb.set('pollPanel', 'isActive', 'true');
            if (poll.time > 0) {
                var timeleft = poll.time - ($.systemTime() - poll.startTime);
                timeout = setTimeout(function () {
                    endPoll();
                }, timeleft);
            }

            var msg = JSON.stringify({
                'start_poll': 'true',
                'data': JSON.stringify(objOBS)
            });
            $.alertspollssocket.sendJSONToAll(msg);
        }
    }

    function saveState() {
        $.inidb.set('pollState', 'poll', JSON.stringify(poll));
        $.inidb.set('pollState', 'objOBS', JSON.stringify(objOBS));
    }

    /**
     * @function vote
     * @param {string} sender
     * @param {string} voteText
     */
    function vote(sender, voteText) {
        var optionIndex;

        if (!poll.pollRunning) {
            return;
        }

        if (hasKey(poll.voters, sender.toLowerCase())) {
            $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.vote.already'));
            return;
        }

        optionIndex = parseInt(voteText);
        if (isNaN(optionIndex) || optionIndex < 1 || optionIndex > poll.options.length) {
            $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.vote.invalid', voteText));
            return;
        }

        optionIndex--;
        poll.voters.push(sender);
        poll.votes.push(optionIndex);
        for (var i = 0; i < objOBS.length; i++) {
            if (objOBS[i].label == poll.options[optionIndex])
                objOBS[i].votes++;
        }
        var msg = JSON.stringify({
            'new_vote': 'true',
            'data': JSON.stringify(objOBS)
        });
        $.alertspollssocket.sendJSONToAll(msg);
        $.inidb.incr('pollVotes', poll.options[optionIndex], 1);
    }
    ;

    /**
     * @function endPoll
     * @export $.poll
     */
    function endPoll() {
        var mostVotes = -1,
                i;

        if (!poll.pollRunning) {
            return;
        }

        clearTimeout(timeout);
        clearInterval(saveStateInterval);

        $.inidb.set('pollPanel', 'isActive', 'false');
        var msg = JSON.stringify({
            'end_poll': 'true'
        });
        $.alertspollssocket.sendJSONToAll(msg);
        if (poll.minVotes > 0 && poll.votes.length < poll.minVotes) {
            poll.result = '';
            poll.pollMaster = '';
            poll.pollRunning = false;
            poll.callback(false);
            return;
        }

        for (i = 0; i < poll.options.length; poll.counts.push(0), i++)
            ;
        for (i = 0; i < poll.votes.length; poll.counts[poll.votes[i++]] += 1)
            ;
        for (i = 0; i < poll.counts.length; winner = ((poll.counts[i] > mostVotes) ? i : winner), mostVotes = ((poll.counts[i] > mostVotes) ? poll.counts[i] : mostVotes), i++)
            ;
        for (i = 0; i < poll.counts.length;
                (i != winner && poll.counts[i] == poll.counts[winner] ? poll.hasTie = 1 : 0), (poll.hasTie == 1 ? i = poll.counts.length : 0), i++)
            ;

        poll.result = poll.options[winner];
        poll.pollMaster = '';
        poll.pollRunning = false;

        // Store the results for the Panel to read.
        $.inidb.set('pollresults', 'question', poll.question);
        $.inidb.set('pollresults', 'result', poll.result);
        $.inidb.set('pollresults', 'votes', poll.votes.length);
        $.inidb.set('pollresults', 'options', poll.options.join(','));
        $.inidb.set('pollresults', 'counts', poll.counts.join(','));
        $.inidb.set('pollresults', 'istie', poll.hasTie);
        poll.callback(poll.result);
        saveState();
    }
    ;

    function saywinner(winner) {
        if (winner === false) {
            $.say($.lang.get('pollsystem.runpoll.novotes', poll.question));
            return;
        }
        if (poll.hasTie) {
            $.say($.lang.get('pollsystem.runpoll.tie', poll.question));
        } else {
            $.say($.lang.get('pollsystem.runpoll.winner', poll.question, winner));
        }
    }

    /**
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender().toLowerCase(),
                command = event.getCommand(),
                argsString = event.getArguments().trim(),
                args = event.getArgs(),
                action = args[0];

        if (command.equalsIgnoreCase('vote') && action !== undefined) {
            if (poll.pollRunning) {
                vote(sender, action);
            }
        }

        /**
         * @commandpath poll - Announce information about a poll, if one is running.
         */
        if (command.equalsIgnoreCase('poll')) {
            if (!action) {
                if (poll.pollRunning) {
                    var optionsStr = "";
                    for (var i = 0; i < poll.options.length; i++) {
                        optionsStr += (i + 1) + ") " + poll.options[i] + (i == poll.options.length - 1 ? "" : " ");
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.poll.running', poll.question, optionsStr));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.poll.usage'));
                }
                return;
            }

            /**
             * @commandpath poll results - Announce result information about the last run poll (Poll information is retained until shutdown)
             */
            if (action.equalsIgnoreCase('results')) {
                if (poll.pollRunning) {
                    $.say($.lang.get('pollsystem.results.running'));
                } else if (poll.result != '') {
                    if (poll.hasTie) {
                        $.say($.lang.get('pollsystem.results.lastpoll', poll.question, poll.votes.length, "Tie!", poll.options.join(', '), poll.counts.join(', ')));
                    } else {
                        $.say($.lang.get('pollsystem.results.lastpoll', poll.question, poll.votes.length, poll.result, poll.options.join(', '), poll.counts.join(', ')));
                    }
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.results.404'));
                }
            }

            /**
             * @commandpath poll open ["poll question"] ["option1, option2, ..."] [seconds] [min votes] - Starts a poll with question and options. Optionally provide seconds and min votes.
             */
            if (action.equalsIgnoreCase('open')) {
                var time = 0,
                        question = '',
                        options = [],
                        minVotes = 1;

                argsString = argsString + ""; // Cast as a JavaScript string.

                if (argsString.match(rePollOpenFourOptions)) {
                    question = argsString.match(rePollOpenFourOptions)[1];
                    options = argsString.match(rePollOpenFourOptions)[2].split(/,\s*/);
                    time = parseInt(argsString.match(rePollOpenFourOptions)[3]);
                    minVotes = parseInt(argsString.match(rePollOpenFourOptions)[4]);
                } else if (argsString.match(rePollOpenThreeOptions)) {
                    question = argsString.match(rePollOpenThreeOptions)[1];
                    options = argsString.match(rePollOpenThreeOptions)[2].split(/,\s*/);
                    time = parseInt(argsString.match(rePollOpenThreeOptions)[3]);
                } else if (argsString.match(rePollOpenTwoOptions)) {
                    question = argsString.match(rePollOpenTwoOptions)[1];
                    options = argsString.match(rePollOpenTwoOptions)[2].split(/,\s*/);
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.open.usage'));
                    return;
                }

                if (!question || !options || options.length === 0 || isNaN(minVotes) || minVotes < 1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.open.usage'));
                    return;
                }
                if (options.length === 1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.open.moreoptions'));
                    return;
                }

                if (runPoll(question, options, parseInt(time), sender, minVotes, saywinner)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.runpoll.started'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.results.running'));
                }
            }

            /**
             * @commandpath poll close - Close the current poll and tally the votes
             */
            if (action.equalsIgnoreCase('close')) {
                if (!poll.pollRunning) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.close.nopoll'));
                    return;
                }
                endPoll();
            }
        }
    });

    $.bind('webPanelSocketUpdate', function (event) {
        if (event.getScript().equalsIgnoreCase('./systems/pollSystem.js')) {
            if (poll.pollRunning) {
                var msg = JSON.stringify({
                    'start_poll': 'true',
                    'data': JSON.stringify(objOBS)
                });
                $.alertspollssocket.sendJSONToAll(msg);
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./systems/pollSystem.js', 'poll', 2);
        $.registerChatCommand('./systems/pollSystem.js', 'vote', 7);
        $.registerChatSubcommand('poll', 'results', 2);
        $.registerChatSubcommand('poll', 'open', 2);
        $.registerChatSubcommand('poll', 'close', 2);

        reopen();
    });

    /**
     * @event Shutdown
     */
    $.bind('Shutdown', function () {
        saveState();
    });

    /** Export functions to API */
    $.poll = {
        runPoll: runPoll,
        endPoll: endPoll
    };
})();
