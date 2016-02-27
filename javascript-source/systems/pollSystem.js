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
    callback: function () {
    },
    pollRunning: false,
    pollMaster: '',
    time: 0,
    question: '',
    minVotes: 0,
    result: '',
    pollTimerId: -1,
  };


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

    poll.pollRunning = true;
    poll.pollMaster = pollMaster;
    poll.time = (isNaN(time) || time == 0 ? false : time * 1000);
    poll.callback = callback;
    poll.question = question;
    poll.options = options;
    poll.minVotes = (minVotes ? minVotes : 1);
    poll.votes = [];
    poll.voters = [];

    for (var i = 0; i < poll.options.length; i++) {
      optionsStr += (i + 1) + ") " + poll.options[i] + " ";
    }

    $.say($.lang.get('pollsystem.poll.started', $.resolveRank(pollMaster), time, poll.question, optionsStr));
    if (poll.time) {
      poll.pollTimerId = setTimeout(function () {
        endPoll();
        clearTimeout(poll.pollTimerId);
      }, poll.time);
    }

    return true;
  };

  /**
   * @function vote
   * @param {string} sender
   * @param {string} voteText
   */
  function vote(sender, voteText) {
    var optionIndex;

    if (!poll.pollRunning) {
      $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.vote.nopoll'));
    }

    if ($.list.contains(poll.voters, sender.toLowerCase())) {
      $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.vote.already'));
      return;
    } 

    optionIndex = parseInt(voteText);
    if (isNaN(optionIndex) || optionIndex < 1 || optionIndex > poll.options.length) {
      $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.vote.invalid', voteText));
      return;
    }

    optionIndex--;
    $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.vote.success', poll.options[optionIndex], poll.question));
    poll.voters.push(sender);
    poll.votes.push(optionIndex);
  };

  /**
   * @function endPoll
   * @export $.poll
   */
  function endPoll() {
    var counts = [],
        mostVotes = -1,
        i;

    if (!poll.pollRunning) {
      return;
    }

    if (poll.pollTimerId > -1) {
      clearTimeout(poll.pollTimerId);
      poll.pollTimerId = -1;
    }

    if (poll.minVotes > 0 && poll.votes.length < poll.minVotes) {
      poll.result = '';
      poll.pollMaster = '';
      poll.pollRunning = false;
      poll.callback(false);
      return;
    }

    for (i = 0; i < poll.options.length; counts.push(0), i++) ;
    for (i = 0; i < poll.votes.length; counts[poll.votes[i++]] += 1) ;
    for (i = 1; i < counts.length; winner = ((counts[i] > mostVotes) ? i : winner), mostVotes = ((counts[i] > mostVotes) ? counts[i] : mostVotes), i++) ;

    poll.result = poll.options[winner];
    poll.pollMaster = '';
    poll.pollRunning = false;
    poll.callback(poll.result);
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        argsString = event.getArguments().trim(),
        args = event.getArgs(),
        action = args[0];

    if (command.equalsIgnoreCase('vote') && action) {
      if (!poll.pollRunning) {
        $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.vote.nopoll'));
        return;
      }
      vote(sender, action);
    }

    /**
     * @commandpath poll - Announce information about a poll, if one is running.
     */
    if (command.equalsIgnoreCase('poll')) {
      if (!action) {
        if (poll.pollRunning) {
          $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.poll.running', poll.question, poll.options.join('", "')));
        } else {
          if (!$.isMod(sender)) {
            $.say($.whisperPrefix(sender) + $.modMsg);
            return;
          }
          $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.poll.usage'));
        }
        return;
      }

      if (!$.isMod(sender)) {
        $.say($.whisperPrefix(sender) + $.modMsg);
        return;
      }

      /**
       * @commandpath poll results - Announce result information about the last run poll (Poll information is retained until shutdown)
       */
      if (action.equalsIgnoreCase('results')) {
        if (poll.pollRunning) {
          $.say($.lang.get('pollsystem.results.running'));
        } else if (poll.result != '') {
          $.say($.lang.get('pollsystem.results.lastpoll', poll.question, poll.votes.length, poll.result, poll.options.join('", "')));
        } else {
          $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.results.404'));
        }
      }

      /**
       * @commandpath poll open [-t Run time in seconds] [-m minvotes] [-q Poll question] [-o "option1, option2..."] - Starts a new poll, -q and -o are required
       */
      if (action.equalsIgnoreCase('open')) {
        var time = 60,
            question = '',
            options = [],
            minVotes = 1;

        argsString = argsString + ""; // Cast as a JavaScript string.

        if (argsString.match(/-t\s+([0-9]+)/)) {
          time = parseInt(argsString.match(/-t\s+([0-9]+)/)[1]);
        }
        if (argsString.match(/-q\s+"(.*)"\s+/)) {
          question = argsString.match(/-q\s+"(.*)"\s+/)[1];
        }
        if (argsString.match(/-o\s+"(.+)"/)) {
          options = argsString.match(/-o\s+"(.+)"/)[1].split(/,\s*/);
        }
        if (argsString.match(/-m\s+([0-9]+)/)) {
          minVotes = parseInt(argsString.match(/-m\s+([0-9])+/)[1]);
        }

        if (isNaN(time) || !question || !options || options.length == 0 || isNaN(minVotes) || minVotes < 1) {
          $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.open.usage'));
          return;
        }
        if (options.length == 1) {
          $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.open.moreoptions'));
          return;
        }

        runPoll(question, options, time, sender, minVotes, function (winner) {
          if (winner === false) {
            $.say($.lang.get('pollsystem.runpoll.novotes', question));
            return;
          }
          $.say($.lang.get('pollsystem.runpoll.winner', question, winner));
        });

        $.say($.whisperPrefix(sender) + $.lang.get('pollsystem.runpoll.started'));
      }

      /**
       * @commandpath poll close - Close the current poll
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

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./systems/pollSystem.js')) {
      $.registerChatCommand('./systems/pollSystem.js', 'poll', 7);
      $.registerChatCommand('./systems/pollSystem.js', 'vote', 7);
    }
  });

  /** Export functions to API */
  $.poll = {
    runPoll: runPoll,
    endPoll: endPoll,
  };
})();
