/**
 * this module is made to handle command cooldowns for discord.
 *
 */
(function() {
	var globalCooldown = $.getSetIniDbBoolean('discordCooldown', 'globalCooldown', true),
	    globalCooldownTime = $.getSetIniDbNumber('discordCooldown', 'globalCooldownTime', 90),
	    cooldown = {};

	/**
	 * @function setCoolDown
	 *
	 * @export $.discord.command
	 * @param {string} command
	 * @param {boolean} hasCoolown
	 * @param {int} time
	 */
	function setCoolDown(command, hasCooldown, time) {
		if (time === null || time == 0) {
			return;
		}

		time = parseInt(time * 1e3) + $.systemTime();
		command = command.toLowerCase();

		if (globalCooldown === true && hasCooldown == false) {
			cooldown[command] = {
				time: time
			};
		} else {
			if (hasCooldown == true) {
				cooldown[command] = {
					time: time
				};
			}
		}
	}

	/**
	 * @function coolDown
	 *
	 * @export $.discord.command
	 * @param {string} command
	 * @return {int}
	 */
	function coolDown(command) {
		var hasCooldown = $.inidb.exists('discordCooldown', command);

		if (globalCooldown === true && hasCooldown == false) {
			if (cooldown[command] !== undefined) {
				if (cooldown[command].time - $.systemTime() >= 0) {
					return 1;
				}
			}
			setCoolDown(command, hasCooldown, globalCooldownTime);
		} else {
			if (hasCooldown == true) {
				if (cooldown[command] !== undefined) {
					if (cooldown[command].time - $.systemTime() >= 0) {
						return 1;
					}
				}
				setCoolDown(command, hasCooldown, $.inidb.get('discordCooldown', command));
			}
		}

		return 0;
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
		    action = args[0],
		    subAction = args[1];

	    if (command.equalsIgnoreCase('cooldown')) {
	    	if (action === undefined) {
	    		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.commandcooldown.cooldown.usage'));
	    		return;
	    	}

	    	/**
	    	 * @discordcommandpath cooldown toggleglobal - Toggles the global cooldown for Discord commands.
	    	 */
	    	if (action.equalsIgnoreCase('toggleglobal')) {
	    		globalCooldown = !globalCooldown;
	    		$.inidb.set('discordCooldown', 'globalCooldown', globalCooldown);
	    		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.commandcooldown.cooldown.toggle.global', (globalCooldown === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
	    	}

	    	/**
	    	 * @discordcommandpath cooldown globaltime [seconds] - Set the global cooldown time for Discord commands.
	    	 */
	    	if (action.equalsIgnoreCase('globaltime')) {
	    		if (subAction === undefined || isNaN(parseInt(subAction))) {
	    			$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.commandcooldown.cooldown.global.time.usage'));
	    			return;
	    		}

	    		globalCooldownTime = parseInt(subAction);
	    		$.inidb.set('discordCooldown', 'globalCooldownTime', globalCooldownTime);
	    		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.commandcooldown.cooldown.global.time.set', globalCooldownTime));
	    	}
	    }
	});

	/**
	 * @event initReady
	 */
	$.bind('initReady', function() {
		if ($.bot.isModuleEnabled('./discord/core/commandCooldown.js')) {
			$.discord.registerCommand('./discord/core/commandCooldown.js', 'cooldown', 1);
			$.discord.registerSubCommand('cooldown', 'toggleglobal', 1);
			$.discord.registerSubCommand('cooldown', 'globaltime', 1);
			
			// $.unbind('initReady'); Needed or not?
		}
	});

    /* Export the function to the $.discord api. */
    $.discord.command = {
    	setCoolDown: setCoolDown,
    	coolDown: coolDown
    };
})();
