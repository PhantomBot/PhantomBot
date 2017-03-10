/**
 * Handles linking of a Discord account to a Twitch account.
 *
 */
(function () {

    /**
<<<<<<< HEAD
     * @function resolveTwitchName
=======
     * @function discordToTwitch
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
     *
     * @export $.discord
     * @param {string} userId (snowflake)
     * @return {string or null}
     */
<<<<<<< HEAD
    function resolveTwitchName(userId) {
        if (typeof userId === 'string' && isNaN(parseInt(userId))) {
            userId = $.discordAPI.resolveUserId(userId);
        }

        return ($.inidb.exists('discordToTwitch', userId) ? $.inidb.get('discordToTwitch', userId) : null); 
=======
    function discordToTwitch(userId) {
        if ($.inidb.exists('discordToTwitch', userId)) {
            return $.inidb.get('discordToTwitch', userId);
        }

        return null;
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
    }

    /**
     * @event discordCommand
     */
<<<<<<< HEAD
    $.bind('discordCommand', function(event) {
=======
    $.bind('discordCommand', function (event) {
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
        var sender = event.getSender(),
            user = event.getDiscordUser(),
            channel = event.getChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0];

        /**
<<<<<<< HEAD
         * @discordcommandpath accountlink - Checks the current account linking status of the sender.
=======
         * @discordcommandpath accountlink - Checks the current account linking status of the sender
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
         */
        if (command.equalsIgnoreCase('accountlink')) {
            var userId = event.getSenderId(),
                islinked = $.inidb.exists('discordToTwitch', userId);

            if (action === undefined) {
                if (islinked) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.usage.link', $.inidb.get('discordToTwitch', userId)));
                } else {
<<<<<<< HEAD
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.usage.nolink'));
                }
                /**
                 * @discordcommandpath accountlink link - Starts the process of linking an account. Completing this will overwrite existing links.
=======
                    $.discord.say(channel, $.lang.get('discord.accountlink.usage.nolink'));
                }
                /**
                 * @discordcommandpath accountlink link - Starts the process of linking an account. Completing this will overwrite existing links
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
                 */
            } else if (action.equalsIgnoreCase('link')) {
                var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                    text = '',
                    i;

                for (i = 0; i < 8; i++) {
                    text += code.charAt(Math.floor(Math.random() * code.length));
                }

<<<<<<< HEAD
                Packages.com.gmt2001.TempStore.instance().SetLong('discord.accountlink.pending', userId, text, java.lang.System.currentTimeMillis() + (10 * 6e4));
=======
                Packages.com.gmt2001.TempStore.instance().SetLong('discord.accountlink.pending', userId, text, java.lang.System.currentTimeMillis() + (10 * 60 * 1000));
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993

                if (islinked) {
                    $.discordAPI.sendPrivateMessage(user, $.lang.get('discord.accountlink.link.relink', $.channelName, text));
                } else {
                    $.discordAPI.sendPrivateMessage(user, $.lang.get('discord.accountlink.link', $.channelName, text));
                }
                /**
<<<<<<< HEAD
                 * @discordcommandpath accountlink remove - Removes account links from the sender.
=======
                 * @discordcommandpath accountlink remove - Removes account links from the sender
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
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
<<<<<<< HEAD
         * @commandpath accountlink link [code] - Completes an account link for Discord.
=======
         * @commandpath accountlink link [code] - Completes an account link
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
         */
        if (command.equalsIgnoreCase('accountlink')) {
            if (action.equalsIgnoreCase('link')) {
                var code = args[1];

<<<<<<< HEAD
=======

>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
                if ($.strlen(code) < 8) {
                    return;
                }

                var ts = Packages.com.gmt2001.TempStore.instance(),
<<<<<<< HEAD
                    sections = ts.GetCategoryList('discord.accountlink.pending'),
                    tm = java.lang.System.currentTimeMillis(),
                    i,
                    success = false;
=======
                        sections = ts.GetCategoryList('discord.accountlink.pending'),
                        tm = java.lang.System.currentTimeMillis(),
                        i,
                        success = false;
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993

                for (i = 0; i < sections.length; i++) {
                    if (ts.HasKey('discord.accountlink.pending', sections[i], code) && ts.GetLong('discord.accountlink.pending', sections[i], code) >= tm) {
                        $.inidb.set('discordToTwitch', sections[i], sender.toLowerCase());

                        success = true;
                        var user = $.discordAPI.resolveUserId(sections[i]);

                        $.discordAPI.sendPrivateMessage(user, $.lang.get('discord.accountlink.link.success', $.username.resolve(sender)));

                        ts.RemoveSection('discord.accountlink.pending', sections[i]);
                    }
                }

                if (!success) {
                    $.say($.whisperPrefix(sender) + $.lang.get('discord.accountlink.link.fail'));
                }
            }
        }
    });
<<<<<<< HEAD
    
    // Interval to clear our old codes that have not yet been registered.
    var interval = setInterval(function() {
=======

    var interval = setInterval(function () {
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
        var ts = Packages.com.gmt2001.TempStore.instance(),
            sections = ts.GetCategoryList('discord.accountlink.pending'),
            tm = java.lang.System.currentTimeMillis(),
            keys,
            i,
            b,
            removed;

        for (i = 0; i < sections.length; i++) {
            keys = ts.GetKeyList('discord.accountlink.pending', sections[i]);

            removed = 0;
            for (b = 0; b < keys.length; b++) {
                if (ts.GetLong('discord.accountlink.pending', sections[i], keys[b]) < tm) {
                    ts.RemoveKey('discord.accountlink.pending', sections[i], keys[b]);
                    removed++;
                }
            }

            if (removed >= keys.length) {
                ts.RemoveSection('discord.accountlink.pending', sections[i]);
            }
        }
<<<<<<< HEAD
    }, 10 * 6e4);
=======
    }, 10 * 60 * 1000);
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993

    /**
     * @event initReady
     */
<<<<<<< HEAD
    $.bind('initReady', function() {
=======
    $.bind('initReady', function () {
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
        $.discord.registerCommand('./discord/core/accountLink.js', 'accountlink', 0);
        $.discord.registerSubCommand('accountlink', 'link', 0);
        $.discord.registerSubCommand('accountlink', 'remove', 0);
        $.registerChatCommand('./discord/core/accountLink.js', 'accountlink', 7);
    });

    /* Export the function to the $.discord api. */
<<<<<<< HEAD
    $.discord.resolveTwitchName = resolveTwitchName;
})();
=======
    $.discord.discordToTwitch = discordToTwitch;
})();
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
