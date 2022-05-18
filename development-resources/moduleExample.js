/**
 * moduleExample.js
 *
 * This module will generate a random string of letters when we type the command in chat.
 */
(function() {
    // Global variables for this script if needed.
    var myRandomVariableToGetAndSetDbString = $.getSetIniDbString('my_db_table', 'my_db_key', 'my_db_string'),
        myRandomVariableToGetAndSetDbBoolean = $.getSetIniDbBoolean('my_db_table', 'my_db_key', false),
        myRandomVariableToGetAndSetDbNumber = $.getSetIniDbNumber('my_db_table', 'my_db_key', 0),
        myRandomStaticVariable = 'something';

    // Function to generate a random string of letters.
    function getRandomString(size) {
        // Local variables just for this function.
        var letters = 'abcdefghijklmnopqrstuvwxyz',
            data = '',
            i;

        for (i = 0; i < size; i++) {
            data += letters.charAt(Math.floor(Math.random() * letters.length));
        }

        return data;
    }

    // Command event for when someone types a command for this module.
    $.bind('command', function(event) {
        var command = event.getCommand(), // command name all lower case.
            sender = event.getSender(),   // user who sent the command lower case.
            args = event.getArgs();       // each argument after the command in an array.

        // Command name.
        if (command.equalsIgnoreCase('randomstring')) {
            // Check for arguments, if needed.
            if (args[0] === undefined) {
                // Say something to the user.
                $.say($.whisperPrefix(sender) + 'Usage: !randomstring [length of the string]');
                // Stop here.
                return;
            }

            // Argument was said, say this in chat now.
            $.say('Random string: ' + getRandomString(parseInt(args[0])));
        }
    });

    // Event that runs once at boot-up if the module is enabled.
    $.bind('initReady', function() {
        // Register the command with the: module path, command name, and command permission.
        $.registerChatCommand('./commands/moduleExample.js', 'randomstring', $.PERMISSION.Viewer);
    });
})();

// INFORMATION ABOUT SUBMITING A PULL-REQUEST FOR A NEW MODULE. PLEASE READ:

// If you're planning on making a module for the master build please take a look at the current scripts and follow their code style
// of we will not merge your pull-request into the master build. Also keep a mind we do take performance really seriously here,
// if your module is going to slow down the bot, or affect performance we will not merge it, if we think the module isn't fit to be 
// in the main build we will also reject it. Another thing, be sure to fully test your module, we will NOT test any pull-request before merging it, 
// if we see an issue we will let you know that there's an issue in the code and you will have to fix it if you want us to merge it. 
// If your module gets merge but causes an issue in the future it will be reverted without any notice.
