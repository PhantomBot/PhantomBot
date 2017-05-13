/**
 * Handles linking of a Discord account to a Twitch account.
 *
 */
(function () {
    var accounts = {},
        interval;

    /**
     * @function resolveTwitchName
     * @function discordToTwitch
     *
     * @export $.discord
     * @param {string} userId (snowflake)
     * @return {string or null}
     */
    function resolveTwitchName(userId) {
        if (typeof userId === 'string') {
            userId = $.discordAPI.resolveUserId(userId);
        }

        return ($.inidb.exists('discordToTwitch', userId) ? $.inidb.get('discordToTwitch', userId) : null); 
    }

    /**
     * @event discordCommand
     */
    $.bind('discordCommand', function(event) {
        var sender = event.getSender(),
            user = event.getDiscordUser(),
            channel = event.getChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0];

        /**
         * @discordcommandpath account - Checks the current account linking status of the sender.
         */
        if (command.equalsIgnoreCase('account')) {
            var userId = event.getSenderId(),
                islinked = $.inidb.exists('discordToTwitch', userId);

            if (action === undefined) {
                if (islinked) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.usage.link', $.inidb.get('discordToTwitch', userId)));
                } else {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.usage.nolink'));
                }

            /**
             * @discordcommandpath account link - Starts the process of linking an account. Completing this will overwrite existing links
             */
            } else if (action.equalsIgnoreCase('link')) {
                var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                    text = '',
                    i;

                for (i = 0; i < 8; i++) {
                    text += code.charAt(Math.floor(Math.random() * code.length));
                }

                accounts[userId] = {
                    time: $.systemTime(),
                    code: text
                };

                if (islinked) {
                    $.discordAPI.sendPrivateMessage(user, $.lang.get('discord.accountlink.link.relink', $.channelName, text));
                } else {
                    $.discordAPI.sendPrivateMessage(user, $.lang.get('discord.accountlink.link', $.channelName, text));
                }
            /**
             * @discordcommandpath account remove - Removes account links from the sender.
             */
            } else if (action.equalsIgnoreCase('remove')) {
                $.inidb.del('discordToTwitch', userId);
                $.discordAPI.sendPrivateMessage(user, $.lang.get('discord.accountlink.link.remove'));
            }
        }
    });

    /**
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0];

        /**
         * @commandpath account link [code] - Completes an account link for Discord.
         */
        if (command.equalsIgnoreCase('account')) {
            if (action.equalsIgnoreCase('link')) {
                var code = args[1];
                if (code === undefined || code.length() < 8) {
                    return;
                }

                var keys = Object.keys(accounts),
                    i;

                for (i in keys) {
                    if (accounts[keys[i]].code == code && (accounts[keys[i]].time + 6e5) > $.systemTime()) {
                        $.inidb.set('discordToTwitch', keys[i], sender.toLowerCase());

                        delete accounts[keys[i]];

                        $.discordAPI.sendPrivateMessage($.discordAPI.resolveUserId(keys[i]), $.lang.get('discord.accountlink.link.success', $.username.resolve(sender)));
                        return;
                    }
                }

                $.say($.whisperPrefix(sender) + $.lang.get('discord.accountlink.link.fail'));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/core/accountLink.js', 'account', 0);
        $.discord.registerSubCommand('accountlink', 'link', 0);
        $.discord.registerSubCommand('accountlink', 'remove', 0);

        $.registerChatCommand('./discord/core/accountLink.js', 'account', 7);

        // Interval to clear our old codes that have not yet been registered.
        interval = setInterval(function() {
            var keys = Object.keys(accounts),
                i;
    
            for (i in keys) {
                if ((accounts[keys[i]].time + 6e5) < $.systemTime()) {
                    delete accounts[keys[i]];
                }
            }
        }, 6e4);
    });

    /* Export the function to the $.discord api. */
    $.discord.resolveTwitchName = resolveTwitchName;
})();
