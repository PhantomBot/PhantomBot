/**
 * Handles the main things for the Discord modules. This is like the core if you would like to call it that.
 *
 * Command permissions for the registerCommand function:
 *  - 1 means only administrators can access the command.
 *	- 0 means everyone can access the command.
 *	
 * Guidelines for merging thing on our repo for this module: 
 * 	- Please try not to call the $.discordAPI function out of this script, move all the main functions here and export the function to the $.discord API.
 * 	- To register command to our command list https://phantombot.tv/commands/discord please add a comment starting with @discordcommandpath before the command info.
 * 	- Make sure to comment on every function what their name is and the parameters they require and if they return something.
 */
(function() {
	var embedReg = new RegExp(/\(embed\s([\w\s\d]+),\s(.*)\)/);

	/**
	 * @function userPrefix
	 *
	 * @export $.discord
	 * @param  {string} username
	 * @return {String}
	 */
	function userPrefix(username) {
		return (username + ', ');
	}

	/**
	 * @function getUserMention
	 *
	 * @export $.discord.username
	 * @param  {string} username
	 * @return {string}
	 */
	function getUserMention(username) {
		return ($.discordAPI.isUser(username) == true ? $.discordAPI.resolveUser(username).getAsMention() : username);
	}

	/**
	 * @function getUserMentionOrChannel
	 *
	 * @export $.discord.resolve
	 * @param  {string} argument
	 * @return {string}
	 */
	function getUserMentionOrChannel(argument) {
		if ($.discordAPI.isUser(argument) == true) {
			return $.discordAPI.resolveUser(argument).getAsMention();
		} else if ($.discordAPI.isChannel(argument) == true) {
			return $.discordAPI.resolveChannel(argument).getAsMention();
		} else {
			return argument;
		}
	}

	/**
	 * @function getRandomUser
	 *
	 * @export $.discord.username
	 * @return {string}
	 */
	function getRandomUser() {
		return ($.discordAPI.getUserMembers().get($.randRange(0, $.discordAPI.getUserMembers().size() - 1)).getAsMention());
	}

	/**
	 * @function say
	 *
	 * @export $.discord
	 * @param {string} channel
	 * @param {string} message
	 */
	function say(channel, message) {
		if (message.match(embedReg)) {
			$.discordAPI.sendMessageEmbed(channel, message.match(embedReg)[1], message.match(embedReg)[2]);
		} else {
			$.discordAPI.sendMessage(channel, message);
		}
	}

	/**
	 * @function setGame
	 *
	 * @export $.discord
	 * @param {string} game
	 */
	function setGame(game) {
		$.discordAPI.setGame(game);
	}

	/**
	 * @function setGame
	 *
	 * @export $.discord
	 * @param {string} game
	 * @param {string} url
	 */
	function setStream(game, url) {
		$.discordAPI.setStream(game, url);
	}

	/**
	 * @function removeGame
	 *
	 * @export $.discord
	 */
	function removeGame() {
		$.discordAPI.removeGame();
	}

	/**
	 * @function setRole
	 *
	 * @param {string} role
	 * @param {string} username
	 * @export $.discord
	 */
	function setRole(role, username) {
		return $.discordAPI.setRole(role, username);
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

		/**
		 * @discordcommandpath setgame [game name] - Sets the bot game.
		 */
		if (command.equalsIgnoreCase('setgame')) {
			if (action === undefined) {
				say(channel, userPrefix(mention) + $.lang.get('discord.misc.game.set.usage'));
				return;
			}

			setGame(args.join(' '));
			say(channel, userPrefix(mention) + $.lang.get('discord.misc.game.set', args.join(' ')));
		}

		/**
		 * @discordcommandpath setstream [twitch url] [game name] - Sets the bot game and marks it as streaming.
		 */
		if (command.equalsIgnoreCase('setstream')) {
			if (action === undefined) {
				say(channel, userPrefix(mention) + $.lang.get('discord.misc.game.stream.set.usage'));
				return;
			}

			setStream(action, args.slice(1).join(' '));
			say(channel, userPrefix(mention) + $.lang.get('discord.misc.game.stream.set', action, args.slice(1).join(' ')));
		}

		/**
		 * @discordcommandpath removegame - Removes the bot's game and streaming status if set.
		 */
		if (command.equalsIgnoreCase('removegame')) {
			removeGame();
			say(channel, userPrefix(mention) + $.lang.get('discord.misc.game.removed'));
		}
	});

	/**
	 * @event initReady
	 */
	$.bind('initReady', function() {
		$.discord.registerCommand('./discord/core/misc.js', 'module', 1);
		$.discord.registerCommand('./discord/core/misc.js', 'setgame', 1);
		$.discord.registerCommand('./discord/core/misc.js', 'setstream', 1);
		$.discord.registerCommand('./discord/core/misc.js', 'removegame', 1);
		$.discord.registerSubCommand('module', 'list', 1);
		$.discord.registerSubCommand('module', 'enable', 1);
		$.discord.registerSubCommand('module', 'disable', 1);
	});

	/* Export the function to the $.discord api. */
	/* There are the same functions twice in here - that's normal and wanted. */
	$.discord = {
		getUserMention: getUserMention,
		userMention: getUserMention,
		removeGame: removeGame,
		userPrefix: userPrefix,
		setStream: setStream,
		setGame: setGame,
		setRole: setRole,
		say: say,
		resolve: { 
			global: getUserMentionOrChannel,
			getUserMentionOrChannel: getUserMentionOrChannel
		},
		username: {
			resolve: getUserMention,
			random: getRandomUser,
			getUserMention: getUserMention,
			getRandomUser: getRandomUser
		}
	};
})();
