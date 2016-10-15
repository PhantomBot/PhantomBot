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
	}

	/**
	 * Gets the event from the core when someone cheers in the chat.
	 * 
	 * @event BitsEvent
	 */
	$.bind('Bits', function(event) {
		if (!announceBits || !toggle) {
			return;
		}
		var s = message;

		/** Match (name) if it is in the message to replace it with the username to cheered. */
		if (s.match(/\(name\)/g)) {
			s = $.replace(s, '(name)', $.username.resolve(event.getUsername()));
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
		if (event.getBits() >= minimum) {//Check if the user cheered enough bits. Default is 0, so any amount.
			$.say(s);
			if (reward > 0) {//Check if the owner set a reward for when someone cheers. Default is non.
			    $.inidb.incr('points', event.getUsername(), parseInt(reward));
		    }
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
				$.say($.whisperPrefix(sender) + $.lang.get('bitshandler.toggle.off'));
				$.log.event(sender + ' disabled bit announcements');
			} else {
				toggle = true;
				$.setIniDbBoolean('bitsSettings', 'toggle', toggle);
				$.say($.whisperPrefix(sender) + $.lang.get('bitshandler.toggle.on'));
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
				$.say($.whisperPrefix(sender) + $.lang.get('bitshandler.message.usage'));
				return;
			}

			message = argsString;
			$.setIniDbString('bitsSettings', 'message', message);
			$.say($.whisperPrefix(sender) + $.lang.get('bitshandler.message.set', message));
			$.log.event(sender + ' changed the bits message to: ' + message);
		}

		/**
		 * Allows you to set a reward for when someone cheers bits.
		 *
		 * @commandpath bitsreward - Sets a reward for when someone cheers bits.
		 */
		if (command.equalsIgnoreCase('bitsreward')) {
			if (!isNaN(action) || !parseInt(action)) {
				$.say($.whisperPrefix(sender) + $.lang.get('bitshandler.reward.usage'));
				return;
			}

			reward = parseInt(action);
			$.setIniDbNumber('bitsSettings', 'reward', reward);
			$.say($.whisperPrefix(sender) + $.lang.get('bitshandler.reward.set', $.getPointsString(reward)));
			$.log.event(sender + ' changed the bits reward to: ' + $.getPointsString(reward));
		}

		/**
		 * Allows you to set how many bits someone needs to cheer before announcing it.
		 *
		 * @commandpath bitsminimum - Set how many bits someone needs to cheer before announcing it.
		 */
		if (command.equalsIgnoreCase('bitsminimum')) {
			if (!isNaN(action) || !parseInt(action)) {
				$.say($.whisperPrefix(sender) + $.lang.get('bitshandler.minimum.usage'));
				return;
			}

			minimum = parseInt(action);
			$.setIniDbNumber('bitsSettings', 'minimum', minimum);
			$.say($.whisperPrefix(sender) + $.lang.get('bitshandler.minimum.set', minimum));
			$.log.event(sender + ' changed the bits minimum to: ' + minimum + ' bits.');
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
        	announceBits = true; //Make sure the module is enabled to announce bits, incase the toggle is on.
        }
    });

    $.reloadBits = reloadBits;
})();
