/**
 * This script is for announcing bits from Twitch, and rewarding the user with points if the caster wants too.
 *
 * Last edited on August 10, 2016 @ 2:35AM EST.
 */
(function() {
	var toggle = $.getSetIniDbBoolean('bitsSettings', 'toggle', false),
	    message = $.getSetIniDbString('bitsSettings', 'message', '(name) just cheered (amount) bits!'),
	    reward = $.getSetIniDbNumber('bitsSettings', 'reward', 0),
	    minimum = $.getSetIniDbNumber('bitsSettings', 'minimum', 0),
	    announceBits = false;

	/**
	 * Used by the panel when someone updates a setting to reload the script vars.
	 * 
	 * @fucntion reloadBits
	 */
	function reloadBits() {
		toggle = $.getIniDbBoolean('bitsSettings', 'toggle', false);
	    message = $.getIniDbString('bitsSettings', 'message', '(name) just cheered (amount) bits!');
	    reward = $.getIniDbNumber('bitsSettings', 'reward', 0);
	    minimum = $.getIniDbNumber('bitsSettings', 'minimum', 0);
	};

	/**
	 * Gets the event from the core when someone cheers in the chat.
	 * 
	 * @event BitsEvent
	 */
	$.bind('Bits', function(event) {
		var s = message;

		/** Match (name) if it is in the message to replace it with the username to cheered. */
		if (s.match(/\(name\)/g)) {
			s = $.replace(s, '(name)', event.getUsername());
		}

		/** Match (amount) if it is in the message to replace it with the amount of bits the user cheered. */
		if (s.match(/\(amount\)/g)) {
			s = $.replace(s, '(amount)', event.getBits());
		}

		/** Match (reward) if it is in the message to replace it with the reward the owner has set when someone cheers. */
		if (s.match(/\(reward\)/g)) {
			s = $.replace(s, '(reward)', $.getPointsString(reward));
		}

		/** Make sure the module is on, and the bits toggle has been toggle on by the bot owner. */
		if (announceBits && toggle) {
			if (event.getBits() >= minimum) {//Check if the user cheered enough bits. Default is 0, so any amount.
				$.say(s);
			} else if (reward > 0) {//Check if the owner set a reward for when someone cheers. Default is non.
				$.inidb.incr('points', username, parseInt(reward));
			}
			/** Write thelast  user and the amount of bits to a file for if the owner wants to display it on his stream. */
			//$.writeToFile($.username.resolve(event.getUsername()) + ': ' + event.getBits(), './addons/bitsHandler/lastCheer.txt', false);
		}
	});

	/**
	 * Gets the event from the core when someone uses a command
	 * 
	 * @event command
	 */
	$.bind('command', function(event) {
		var sender = event.getSender(),
		    command = event.getCommand(),
		    args = event.getArgs(),
		    argsString = event.getArguments(),
		    action = args[0];

		/**
		 * Toggles the bits announcements.
		 *
		 * @commandpath bitstoggle - Toggles the bits announcements.
		 */
		if (command.equalsIgnoreCase('bitstoggle')) {
			if (toggle) {
				toggle = false;
				$.setIniDbBoolean('bitsSettings', 'toggle', toggle);
				$.say($.whisperPrefix(sender) + 'Bits announcements have been disabled.');
				$.log.event(sender + ' disabled bit announcements');
			} else {
				toggle = true;
				$.setIniDbBoolean('bitsSettings', 'toggle', toggle);
				$.say($.whisperPrefix(sender) + 'Bits announcements have been enabled.');
				$.log.event(sender + ' enabled bit announcements');
			}
		}

		/**
		 * Allows you to set a message for when someone cheers bits.
		 *
		 * @commandpath bitsmessage - Sets a message for when someone cheers bits.
		 */
		if (command.equalsIgnoreCase('bitsmessage')) {
			if (!action) {
				$.say($.whisperPrefix(sender) + 'Usage: !bitsmessage (message) - Tags: (name), (amount), (reward)');
				return;
			}

			message = argsString;
			$.setIniDbString('bitsSettings', 'message', message);
			$.say($.whisperPrefix(sender) + 'Bits message has been set to: ' + message + '.');
			$.log.event(sender + ' changed the bits message to: ' + message);
		}

		/**
		 * Allows you to set a reward for when someone cheers bits.
		 *
		 * @commandpath bitsreward - Sets a reward for when someone cheers bits.
		 */
		if (command.equalsIgnoreCase('bitsreward')) {
			if (!isNaN(action) || !parseInt(action)) {
				$.say($.whisperPrefix(sender) + 'Usage: !bitsreward (amount)');
				return;
			}

			reward = parseInt(action);
			$.setIniDbNumber('bitsSettings', 'reward', reward);
			$.say($.whisperPrefix(sender) + 'Bits reward has been set to ' + $.getPointsString(reward) + '.');
			$.log.event(sender + ' changed the bits reward to: ' + $.getPointsString(reward));
		}

		/**
		 * Allows you to set how many bits someone needs to cheer before announcing it.
		 *
		 * @commandpath bitsminimum - Set how many bits someone needs to cheer before announcing it.
		 */
		if (command.equalsIgnoreCase('bitsminimum')) {
			if (!isNaN(action) || !parseInt(action)) {
				$.say($.whisperPrefix(sender) + 'Usage: !bitsminimum (amount)');
				return;
			}

			minimum = parseInt(action);
			$.setIniDbNumber('bitsSettings', 'minimum', minimum);
			$.say($.whisperPrefix(sender) + 'Bits minimum has been set to ' + minimum + ' bits.');
			$.log.event(sender + ' changed the bits minimum to: ' + minimum + ' bits.');
		}

		/**
	     * Used by the panel when someone updates a setting to reload the script vars.
	     * 
	     * No command path.
	     */
		if (command.equalsIgnoreCase('reloadbits')) {
			reloadBits();
		}
	});

    /**
     * Register commands once the bot is fully loaded.
     *
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/bitsHandler.js')) {
        	$.registerChatCommand('./handlers/bitsHandler.js', 'bitstoggle', 1);
        	$.registerChatCommand('./handlers/bitsHandler.js', 'bitsmessage', 1);
        	$.registerChatCommand('./handlers/bitsHandler.js', 'bitsreward', 1);
        	$.registerChatCommand('./handlers/bitsHandler.js', 'bitsminimum', 1);
        	$.registerChatCommand('./handlers/bitsHandler.js', 'reloadbits', 1);
        	announceBits = true; //Make sure the module is enabled to announce bits, incase the toggle is on.
        }
    });
})();