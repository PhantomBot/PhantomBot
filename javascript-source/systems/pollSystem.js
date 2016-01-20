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
   * @param {Function} callback
   * @param {Number} [minVotes]
   * @param {string} [initialVote]
   * @returns {boolean}
   */
  function runPoll(question, options, time, pollMaster, callback, minVotes, initialVote) {
    if (poll.pollRunning) {
      return false
    }

    poll.pollRunning = true;
    poll.pollMaster = pollMaster;
    poll.time = (isNaN(time) || time == 0 ? false : time * 1000);
    poll.callback = callback;
    poll.question = question;
    poll.options = options;
    poll.minVotes = (minVotes ? minVotes : 0);

    if (initialVote) {
      vote(pollMaster, initialVote);
    }

    $.say($.resolveRank(pollMaster) + 'started a poll "' + poll.question + '"! Use "!vote [option]" to vote. Options: "' + poll.options.join('", "') + '".');
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
      $.say($.whisperPrefix(sender) + 'There\'s currently no poll running.');
    }

    if ($.list.contains(poll.voters, sender.toLowerCase())) {
      $.say($.whisperPrefix(sender) + $.resolveRank(sender) + ", you have already voted!");
      return;
    } else {
      poll.voters.push(sender);
    }

    if (!$.list.contains(poll.options, voteText)) {
      $.say($.whisperPrefix(sender) + '"' + voteText + '" is not a valid option!');
      return;
    }

    if (optionIndex = poll.options.indexOf(voteText) > -1) {
      poll.votes.push(poll.options[optionIndex]);
      $.say($.whisperPrefix(sender) + 'You have voted "' + poll.options[optionIndex] + '" on "' + poll.question + '".')
    } else {
      $.say($.whisperPrefix(sender) + 'That option does not exist.');
    }
  };

  /**
   * @function endPoll
   * @export $.poll
   */
  function endPoll() {
    var counts = {},
        i;
    if (!poll.pollRunning) {
      return;
    }

    if (poll.pollTimerId > -1) {
      clearTimeout(poll.pollTimerId);
      poll.pollTimerId = -1;
    }

    if (poll.minVotes > 0 && poll.votes.length < poll.minVotes) {
      poll.callback(false);
      return;
    }

    for (i in poll.votes) {
      counts[i] = (counts[i] || 0) + 1;
    }

    poll.result = Object.keys(counts).reduce(function (max, key) {
      return ((max === undefined || counts[key] > counts[max]) ? +key : max);
    });

    poll.callback(poll.result);

    poll.pollRunning = false;
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
      if (!pollRunning) {
        $.say($.whisperPrefix(sender) + 'There is no poll running!');
        return;
      }
      vote(sender, action);
    }

    /**
     * @commandpath poll - Announce information about a possible currently running poll
     */
    if (command.equalsIgnoreCase('poll')) {
      if (!action) {
        if (pollRunning) {
          $.say(
              $.whisperPrefix(sender)
              + 'There is a poll running for "'
              + poll.question
              + '". Use "!vote [option]" to vote. The options are "'
              + poll.options.join('", "') + '".'
          );
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
        if (pollMaster != '') {
          $.say('[Last Poll] - [Question: "' + poll.question + '"] - [Total votes: ' + poll.votes.length
              + '] - [Result: "' + result + '"] - [Options: "' + poll.options.join('", "') + '"]');
        } else {
          $.say($.whisperPrefix(sender) + 'There is no latest poll to retrieve results from!');
        }
      }

      /**
       * @commandpath poll open [-t Run time in seconds] [-q Poll question] [-o "option1, option2..."] - Start a new poll
       */
      if (action.equalsIgnoreCase('open')) {
        var time = parseInt(argsString.replace(/-t\s([0-9]+)/, '$1')),
            question = argsString.replace(/-q\s".+"/, '$1'),
            options = argsString.replace(/-o\s".+"/, '$1').split(', ');
        if (isNaN(time) || !question || !options || options.length == 0) {
          $.say($.whisperPrefix(sender) + 'Usage: !poll open [-t [time]] -q "[question]" -o "[option1], [option2], ..."');
          return;
        }

        runPoll(question, options, time, sender, function (winner) {
          if (winner === false) {
            $.say('The poll on "' + question + '" has ended! No votes were cast.');
            return;
          }
          $.say('The poll on "' + question + '" has ended! The winner is "' + winner + '"!');
        });

        $.say($.whisperPrefix(sender) + 'Poll started! use "!poll close" to end the poll manually or use "!poll result" to get the latest results');
      }

      /**
       * @commandpath poll close - Close the current poll
       */
      if (action.equalsIgnoreCase('close')) {
        if (!pollRunning) {
          $.say($.whisperPrefix(sender) + 'There is no poll running.');
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
