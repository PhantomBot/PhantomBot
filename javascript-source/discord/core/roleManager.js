(function() {
	var autoSetPermissions = $.getSetIniDbBoolean('discordSettings', 'autoSetPermissions', false),
		autoSetRanks = $.getSetIniDbBoolean('discordSettings', 'autoSetRanks', false);

	/*
	 * @function roleUpdateCheck
	 */
	function roleUpdateCheck() {
		var users = $.inidb.GetKeyList('discordToTwitch', ''),
			i;

		// If both options are disabled, stop here.
		if (autoSetPermissions === false && autoSetRanks === false) {
			return;
		}

		// Create our default roles.
		createRoles();

		// Wait a bit to create the roles.
		setTimeout(function() {
			for (i in users) {
				if (hasRankOrPermission($.getIniDbString('discordToTwitch', users[i]))) {
					updateRoles(users[i], getRanksAndPermissions($.getIniDbString('discordToTwitch', users[i])));
				}
			}
		}, 5e3);
	}

	/*
	 * @function updateRoles
	 *
	 * @param {Number} id
	 * @param {Array}  roles
	 */
	function updateRoles(id, roles) {
		var oldRoles = $.getIniDbString('discordRoles', id, ',').split(','),
			currentRoles = $.discordAPI.getUserRoles(id),
			newRoles = roles.join(','),
			idx,
			i;

		// Build our roles list.
		for (i in currentRoles) {
			consoleLn(currentRoles[i].getName());
			// If the user's current Discord role list contains an old role, and the new list does not have it, don't add it to the list.
			if ((oldRoles.length > 0 && hasRole(oldRoles, currentRoles[i].getName())) && newRoles.indexOf(currentRoles[i].getName()) === -1) {
				continue;
			} else {
				if (!hasRole(roles, currentRoles[i].getName())) {
					roles.push(currentRoles[i].getName());
				}
			}
		}

		// Only update the user's role if there's a new one.
		for (i in roles) {
			if (!hasRole(currentRoles, roles[i], true)) {
				$.discordAPI.editUserRoles(id, $.discordAPI.getRoleObjects(roles));
				$.setIniDbString('discordRoles', id, newRoles);
				return;
			}
		}
	}

	/*
	 * @function createRoles
	 */
	function createRoles() {
		if (autoSetPermissions === true) {
			var keys = $.inidb.GetKeyList('groups', ''),
				group = '',
				i;

			for (i in keys) {
				group = $.getIniDbString('groups', keys[i]).trim();

				if (!$.inidb.exists('blacklistedDiscordRoles', group.toLowerCase()) && !$.discordAPI.getRole(group)) {
					$.discordAPI.createRole(group);
				} else if (!$.discordAPI.getRole(group) && $.inidb.exists('blacklistedDiscordRoles', group.toLowerCase())) {
					$.discordAPI.deleteRole(group);
				}
			}
		}

		if (autoSetRanks === true) {
			var keys = $.inidb.GetKeyList('ranksMapping', ''),
				rank = '',
				i;

			// Remove old ranks.
			cleanOldRanks();

			for (i in keys) {
				rank = $.getIniDbString('ranksMapping', keys[i]).trim();

				if (!$.inidb.exists('blacklistedDiscordRoles', rank.toLowerCase()) && !$.discordAPI.getRole(rank)) {
					$.discordAPI.createRole(rank);
					$.setIniDbString('discordRanks', rank, keys[i]);
				} else if (!$.discordAPI.getRole(rank) && $.inidb.exists('blacklistedDiscordRoles', rank.toLowerCase())) {
					$.discordAPI.deleteRole(rank);
					$.inidb.del('discordRanks', rank);
				}
			}
		}
	}

	/*
	 * @function hasRole
	 *
	 * @param  {Array}  array
	 * @param  {String} role
	 * @param  {Boolean} getName
	 * @return {Boolean}
	 */
	function hasRole(array, role, getName) {
		for (var i in array) {
			if (!getName) {
				if (array[i].equalsIgnoreCase(role)) {
					return true;
				}
			} else {
				if (array[i].getName().equalsIgnoreCase(role)) {
					return true;
				}
			}
		}
		return false;
	}

	/*
	 * @function cleanOldRanks
	 */
	function cleanOldRanks() {
		var keys = $.inidb.GetKeyList('discordRanks', ''),
			i;

		for (i in keys) {
			if (!$.getIniDbString('ranksMapping', $.getIniDbNumber('discordRanks', keys[i]), '').equalsIgnoreCase(keys[i])) {
				$.discordAPI.deleteRole(keys[i]);
				$.inidb.del('discordRanks', keys[i]);
			}
		}
	}

	/*
	 * @function hasRankOrPermission
	 *
	 * @param  {String} username
	 * @return {Boolean}
	 */
	function hasRankOrPermission(username) {
		return (getRanksAndPermissions(username).length > 0);
	}

	/*
	 * @function getRanksAndPermissions
	 *
	 * @param  {String} username
	 * @return {Array}
	 */
	function getRanksAndPermissions(username) {
		var roles = [],
			role;

		if (autoSetPermissions === true) {
			if ($.inidb.exists('group', username) && !$.inidb.exists('blacklistedDiscordRoles', $.getIniDbString('group', username).toLowerCase())) {
				roles.push($.getIniDbString('groups', $.getIniDbString('group', username)));
			}
		}

		if (autoSetRanks === true) {
			if ($.hasRank(username)) {
				roles.push($.getRank(username));
			}
		}

		return roles;
	}

	/*
	 * @event discordChannelCommand
	 */
	$.bind('discordChannelCommand', function(event) {
		var sender = event.getSender(),
            channel = event.getChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0];

        if (command.equalsIgnoreCase('rolemanager')) {
        	
        }
	});

	/*
	 * @event initReady
	 */
	$.bind('initReady', function() {
		setInterval(roleUpdateCheck, 3e4);
	});
})();
