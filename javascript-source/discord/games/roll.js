(function() {
	var rewards = [];

	/**
     * @function loadRewards
     */
    function loadRewards() {
        rewards[0] = $.getSetIniDbNumber('discordRollReward', 'rewards_0', 4);
        rewards[1] = $.getSetIniDbNumber('discordRollReward', 'rewards_1', 16);
        rewards[2] = $.getSetIniDbNumber('discordRollReward', 'rewards_2', 36);
        rewards[3] = $.getSetIniDbNumber('discordRollReward', 'rewards_3', 64);
        rewards[4] = $.getSetIniDbNumber('discordRollReward', 'rewards_4', 100);
        rewards[5] = $.getSetIniDbNumber('discordRollReward', 'rewards_5', 144);
    }

    /**
     * @function roll
     *
     * @param {String} channel
     * @param {String} sender
     * @param {String} twitchName
     * @param {String} mention
     */
    function roll(channel, sender, twitchName, mention) {
    	var dice1 = $.randRange(1, 6),
        	dice2 = $.randRange(1, 6),
        	resultMessage = $.lang.get('discord.roll.rolled', $.discord.userPrefix(mention), dice1, dice2);

        if (dice1 == dice2) {
            switch (dice1) {
                case 1:
                    resultMessage += $.lang.get('discord.roll.doubleone', $.getPointsString(rewards[dice1 - 1]));
                    break;
                case 2:
                    resultMessage += $.lang.get('discord.roll.doubletwo', $.getPointsString(rewards[dice1 - 1]));
                    break;
                case 3:
                    resultMessage += $.lang.get('discord.roll.doublethree', $.getPointsString(rewards[dice1 - 1]));
                    break;
                case 4:
                    resultMessage += $.lang.get('discord.roll.doublefour', $.getPointsString(rewards[dice1 - 1]));
                    break;
                case 5:
                    resultMessage += $.lang.get('discord.roll.doublefive', $.getPointsString(rewards[dice1 - 1]));
                    break;
                case 6:
                    resultMessage += $.lang.get('discord.roll.doublesix', $.getPointsString(rewards[dice1 - 1]));
                    break;
            }
          
            $.discord.say(channel, resultMessage + $.gameMessages.getWin(sender, 'roll'));
            $.inidb.incr('points', twitchName, rewards[dice1 - 1]);
        } else {
            $.discord.say(channel, resultMessage + $.gameMessages.getLose(sender, 'roll'));
        }
    }
 

    /**
     * @event discordCommand
     */
    $.bind('discordCommand', function(event) {
    	var sender = event.getSender(),
    		channel = event.getChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0];

        if (command.equalsIgnoreCase('roll')) {
        	if (action === undefined) {
        		var twitchName = $.discord.resolveTwitchName(event.getSenderId());
        		if (twitchName !== null) {
        			roll(channel, sender, twitchName, mention);
        		} else {
        			$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.usage.nolink'));
        		}
        	} else {
        	    /**
                 * @discordcommandpath roll rewards [rewards] - Sets the rewards for the dice roll
                 */
        		if (action.equalsIgnoreCase('rewards')) {
        			if (args.length === 7 && !isNaN(parseInt(args[1])) && !isNaN(parseInt(args[2])) && !isNaN(parseInt(args[3])) && !isNaN(parseInt(args[4])) && !isNaN(parseInt(args[5])) && !isNaN(parseInt(args[6]))) {
        				$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.roll.rewards.success'));
        				$.inidb.set('discordRollReward', 'reward_0', args[1]);
                	    $.inidb.set('discordRollReward', 'reward_1', args[2]);
                	    $.inidb.set('discordRollReward', 'reward_2', args[3]);
                	    $.inidb.set('discordRollReward', 'reward_3', args[4]);
                	    $.inidb.set('discordRollReward', 'reward_4', args[5]);
                	    $.inidb.set('discordRollReward', 'reward_5', args[6]);
                	    loadRewards();
        			} else {
        				$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.roll.rewards.usage', rewards.join(' ')));
        			}
        		}
        	}
        }
    });

	/**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/games/roll.js')) {
            $.discord.registerCommand('./discord/games/roll.js', 'roll', 0);
            $.discord.registerSubCommand('roll', 'rewards', 1);
            loadRewards();
        }
    });

    /**
     * @event panelWebSocket
     */
    $.bind('panelWebSocket', function(event) {
    	if (event.getScript().equalsIgnoreCase('./discord/games/roll.js')) {
    		loadRewards();
    	}
    });
})();
