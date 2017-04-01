/**
 * This script is for announcing bits from Twitch, and rewarding the user with points if the caster wants too.
 *
 */
(function() {
	var toggle = $.getSetIniDbBoolean('bitsSettings', 'toggle', false),
	    message = $.getSetIniDbString('bitsSettings', 'message', '(name) just cheered (amount) bits!'),
	    minimum = $.getSetIniDbNumber('bitsSettings', 'minimum', 0),
	    announceBits = false;

	/*
	 * @function reloadBits
	 */
	function reloadBits() {
		toggle = $.getIniDbBoolean('bitsSettings', 'toggle', false);
	    message = $.getIniDbString('bitsSettings', 'message', '(name) just cheered (amount) bits!');
	    minimum = $.getIniDbNumber('bitsSettings', 'minimum', 0);
	}

	/*
	 * @event BitsEvent
	 */
	$.bind('bits', function(event) {
		var username = event.getUsername(),
		    bits = event.getBits(),
		    s = message;

		if (announceBits === false || toggle === false) {
			return;
		}

		if (s.match(/\(name\)/g)) {
			s = $.replace(s, '(name)', username);
		}

		if (s.match(/\(amount\)/g)) {
			s = $.replace(s, '(amount)', bits);
		}

		if (bits >= minimum) {
			$.say(s);
		}
		$.writeToFile(username + ' ', './addons/bitsHandler/latestCheer.txt', false);
		$.writeToFile(username + ': ' + bits + ' ', './addons/bitsHandler/latestCheer&Bits.txt', false);
	});

	/*
	 * @event command
	 */
	$.bind('command', function(event) {
		var sender = event.getSender(),
		    command = event.getCommand(),
		    args = event.getArgs(),
		    argsString = event.getArguments(),
		    action = args[0];

		/*
		 * @commandpath bitstoggle - Toggles the bits announcements.
		 */
		if (command.equalsIgnoreCase('bitstoggle')) {
			toggle = !toggle;
			$.setIniDbBoolean('bitsSettings', 'toggle', toggle);
			$.say($.whisperPrefix(sender) + (toggle ? $.lang.get('bitshandler.toggle.on') : $.lang.get('bitshandler.toggle.off')))
		}
		

		/*
		 * @commandpath bitsmessage - Sets a message for when someone cheers bits.
		 */
		if (command.equalsIgnoreCase('bitsmessage')) {
			if (action === undefined) {
				$.say($.whisperPrefix(sender) + $.lang.get('bitshandler.message.usage'));
				return;
			}

			message = argsString;
			$.setIniDbString('bitsSettings', 'message', message);
			$.say($.whisperPrefix(sender) + $.lang.get('bitshandler.message.set', message));
		}

		/*
		 * @commandpath bitsminimum - Set how many bits someone needs to cheer before announcing it.
		 */
		if (command.equalsIgnoreCase('bitsminimum')) {
			if (isNaN(parseInt(action))) {
				$.say($.whisperPrefix(sender) + $.lang.get('bitshandler.minimum.usage'));
				return;
			}

			minimum = parseInt(action);
			$.setIniDbNumber('bitsSettings', 'minimum', minimum);
			$.say($.whisperPrefix(sender) + $.lang.get('bitshandler.minimum.set', minimum));
			$.log.event(sender + ' changed the bits minimum to: ' + minimum + ' bits.');
		}
	});

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/bitsHandler.js')) {
        	$.registerChatCommand('./handlers/bitsHandler.js', 'bitstoggle', 1);
        	$.registerChatCommand('./handlers/bitsHandler.js', 'bitsmessage', 1);
        	$.registerChatCommand('./handlers/bitsHandler.js', 'bitsminimum', 1);
        	announceBits = true;
        }
    });

    $.reloadBits = reloadBits;
})();
