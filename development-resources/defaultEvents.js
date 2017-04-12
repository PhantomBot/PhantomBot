// This is a list of the most common used default events and functions.


// Event fired when a command is sent for your module, this is not fired every time a command is sent.
$.bind('command', function(event) {
	event.getSender() 		// Gets the user login name who sent the command (lower case).
	event.getCommand()		// Command that was triggered (lower case).
	event.getArgs()			// Arguments said after a command in an array.
	event.getArguments() 	// String of arguments said after a command.
	event.getTags()			// IRCv3 tags sent with every Twitch message (can be empty).
	event.getChannel() 		// Channel name of were the command is coming from (can be null).
});

// Event fired when a message is sent to your channel, bot messages that are sent from the bot console are not included.
$.bind('ircChannelMessage', function(event) {
	event.getSender()		// Gets the user login name who sent the message (lower case).
	event.getMessage()		// Gets the message that was sent.
	event.getTags()			// IRCv3 tags sent with every Twitch message (can be empty).
	event.getChannel() 		// Channel name of were the command is coming from (can be null).
});

// Event fired when a command is sent for your module in discord.
$.bind('discordCommand', function(event) {
	event.getSender() 		// Gets the user with discrim who sent the command (lower case).
	event.getUsername() 	// Gets the user who sent the command (lower case).
	event.getCommand()		// Command that was triggered (lower case).
	event.getArgs()			// Arguments said after a command in an array.
	event.getArguments() 	// String of arguments said after a command.
	event.isAdmin()			// Checks if the user is an admin in Discord.
	event.getChannel() 		// Channel name of were the command is coming from.
	event.getSenderId() 	// Gets the id of that user.
});

// Event fired when a message is sent to your discord, bot messages are not included.
$.bind('discordMessage', function(event) {
	event.getSender() 		// Gets the user with discrim who sent the command (lower case).
	event.getUsername() 	// Gets the user who sent the command (lower case).
	event.isAdmin()			// Checks if the user is an admin in Discord.
	event.getChannel() 		// Channel name of were the command is coming from.
	event.getSenderId() 	// Gets the id of that user.
});

// More events will be added to this in the future.
