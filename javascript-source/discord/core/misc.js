/**
 * Handles all the random stuff for the discord module.
 *
 */
(function() {

	/**
	 * @function userPrefix
	 *
	 * @export $.discord
	 * @param {string} username
	 * @return {string}
	 */
	function userPrefix(username) {
		return (username + ', ');
	}

	/**
	 * @function say
	 *
	 * @export $.discord
	 * @param {string} channel
	 * @param {string} message
	 */
	function say(channel, message) {
		$.discordAPI.sendMessage(channel, message);
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

		/**
		 * @discordcommandpath module enable [path] - Enables any modules in the bot, it should only be used to enable discord modules though.
		 */
		if (command.equalsIgnoreCase('module')) {
			if (action === undefined || (subAction === undefined && !action.equalsIgnoreCase('list'))) {
				say(channel, userPrefix(mention) + $.lang.get('discord.misc.module.usage'));
				return;
			}

			if (action.equalsIgnoreCase('enable')) {
				var index = $.bot.getModuleIndex(subAction);

				if (index > -1) {
					$.setIniDbBoolean('modules', $.bot.modules[index].scriptFile, true);
					$.bot.modules[index].enabled = true;
					$.bot.loadScript($.bot.modules[index].scriptFile);

					var hookIndex = $.bot.getHookIndex($.bot.modules[index].scriptFile, 'initReady');

					try {
						if (hookIndex !== -1) {
							$.bot.hooks[hookIndex].handler(null);
							say(channel, userPrefix(mention) + $.lang.get('discord.misc.module.enabled', $.bot.modules[index].getModuleName()));
						}
					} catch (ex) {
						$.log.error('[DISCORD] Unable to call initReady for enabled module (' + $.bot.modules[index].scriptFile +'): ' + ex.message);
					}
				} else {
					say(channel, userPrefix(mention) + $.lang.get('discord.misc.module.404', subAction));
				}
			}

			/**
		     * @discordcommandpath module disable [path] - Disables any modules in the bot, it should only be used to enable discord modules though.
		     */
			if (action.equalsIgnoreCase('disable')) {
				var index = $.bot.getModuleIndex(subAction);

				if (index > -1) {
					$.setIniDbBoolean('modules', $.bot.modules[index].scriptFile, false);
					$.bot.modules[index].enabled = false;

					say(channel, userPrefix(mention) + $.lang.get('discord.misc.module.disabled', $.bot.modules[index].getModuleName()));
				} else {
					say(channel, userPrefix(mention) + $.lang.get('discord.misc.module.404', subAction));
				}
			}

			/**
		     * @discordcommandpath module list - Lists all of the discord modules.
		     */
			if (action.equalsIgnoreCase('list')) {
				var modules = $.bot.modules, 
				    list = [],
				    i;

				for (i in modules) {
					if (!modules[i].scriptFile.startsWith('./discord/core/') && modules[i].scriptFile.startsWith('./discord/')) {
						list.push(modules[i].scriptFile + ' [' + (modules[i].enabled === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled')) + ']');
					}
				}
				say(channel, userPrefix(mention) + $.lang.get('discord.misc.module.list', list.join('\r\n')));
			}
		}
	});

    /* Export the function to the $.discord api. */
	$.discord = {
		say: say,
		userPrefix: userPrefix
	};

	setTimeout(function() {
		$.discord.registerCommand('./discord/core/misc.js', 'module', 1);
		$.discord.registerSubCommand('module', 'list', 1);
		$.discord.registerSubCommand('module', 'enable', 1);
		$.discord.registerSubCommand('module', 'disable', 1);
	}, 5000);
})();
