/**
 * This script is made to register discord commands.
 *
 */
(function() {
	var commands = {};

	/**
	 * @function commandExists
	 * 
	 * @export $.discord
	 * @param {string} command
	 * @return {boolean}
	 */
	function commandExists(command) {
		return (commands[command] !== undefined);
	}

	/**
	 * @function subCommandExists
	 * 
	 * @export $.discord
	 * @param {string} command
	 * @param {string} subCommand
	 * @return {boolean}
	 */
	function subCommandExists(command, subCommand) {
		return (commands[command] !== undefined && commands[command].subCommand[subCommand] !== undefined);
	}

	/**
	 * @function setCommandPermission
	 * 
	 * @export $.discord
	 * @param {string} command
	 * @param {int} permmission
	 */
	function setCommandPermission(command, permission) {
		if (command.includes(' ')) {
			if (subCommandExists(command.split(' ')[0], command.split(' ')[1])) {
				commands[command.split(' ')[0]].subCommand[command.split(' ')[1]].permission = parseInt(permission);
			}
		} else {
			if (commandExists(command)) {
				commands[command].permission = parseInt(permission);
			}
		}
	}

	/**
	 * @function setCommandChannel
	 * 
	 * @export $.discord
	 * @param {string} command
	 * @param {string} channel
	 */
	function setCommandChannel(command, channel) {
		if (commandExists(command)) {
			commands[command].channel = channel;
		}
	}

	/**
	 * @function getCommandPermission
	 * 
	 * @export $.discord
	 * @param {string} command
	 * @return {int}
	 */
	function getCommandPermission(command) {
		if (commandExists(command)) {
			return commands[command].permission;
		}
		return 0;
	}

	/**
	 * @function getCommandPermission
	 * 
	 * @export $.discord
	 * @param {string} command
	 * @param {string} subCommand
	 * @return {int}
	 */
	function getSubCommandPermission(command, subCommand) {
		if (commandExists(command) && subCommandExists(command, subCommand)) {
			return commands[command].subCommand[subCommand].permission;
		}
		return 0;
	}

	/**
	 * @function getCommandChannel
	 * 
	 * @export $.discord
	 * @param {string} command
	 * @return {string}
	 */
	function getCommandChannel(command) {
		if (commandExists(command)) {
			return commands[command].channel;
		}
		return '';
	}

	/**
	 * @function registerCommand
	 * 
	 * @export $.discord
	 * @param {string} scriptFile
	 * @param {string} command
	 * @param {int} permission
	 */
	function registerCommand(scriptFile, command, permission) {
		if (!commandExists(command)) {

			commands[command] = {
				permission: $.getSetIniDbNumber('discordPermcom', command, permission),
				scriptFile: scriptFile,
				channel: ($.inidb.exists('discordChannelcom', command) ? $.inidb.get('discordChannelcom', command) : ''),
				subCommand: {}
			};
		}
	}

	/**
	 * @function registerSubCommand
	 * 
	 * @export $.discord
	 * @param {string} command
	 * @param {string} subCommand
	 * @param {int} permission
	 */
	function registerSubCommand(command, subCommand, permission) {
		if (commandExists(command) && !subCommandExists(command, subCommand)) {

			commands[command].subCommand[subCommand] = {
				permission: $.getSetIniDbNumber('discordPermcom', command + ' ' + subCommand, permission)
			};
		}
	}

	/**
	 * @function unregisterSubCommand
	 * 
	 * @export $.discord
	 * @param {string} command
	 * @param {string} subCommand
	 */
	function unregisterSubCommand(command, subCommand) {
		if (commandExists(command) && subCommandExists(command, subCommand)) {
			delete commands[command].subCommand[subCommand];
		}
	}

	/**
	 * @function unregisterCommand
	 * 
	 * @export $.discord
	 * @param {string} command
	 */
	function unregisterCommand(command) {
		if (commandExists(command)) {
			delete commands[command];
		}
	}

	/* Export the function to the $.discord api. */
	$.discord.commands = commands;
	$.discord.commandExists = commandExists;
	$.discord.subCommandExists = subCommandExists;
	$.discord.getCommandPermission = getCommandPermission;
	$.discord.getSubCommandPermission = getSubCommandPermission;
	$.discord.registerCommand = registerCommand;
	$.discord.registerSubCommand = registerSubCommand;
	$.discord.unregisterCommand = unregisterCommand;
	$.discord.unregisterSubCommand = unregisterSubCommand;
	$.discord.setCommandPermission = setCommandPermission;
	$.discord.getCommandChannel = getCommandChannel;
	$.discord.setCommandChannel = setCommandChannel;
})();
