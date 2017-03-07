/**
 * Handles linking of a Discord account to a Twitch account.
 *
 */
(function () {

    /**
     * @function discordToTwitch
     *
     * @export $.discord
     * @param {string} userId (snowflake)
     * @return {string or null}
     */
    function discordToTwitch(userId) {
        if ($.inidb.exists('discordToTwitch', userId)) {
            return $.inidb.get('discordToTwitch', userId);
        }

        return null;
    }

    /**
     * @event discordCommand
     */
    $.bind('discordCommand', function (event) {
        var sender = event.getSender(),
            user = event.getDiscordUser(),
            channel = event.getChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0];

        /**
         * @discordcommandpath accountlink - Checks the current account linking status of the sender
         */
        if (command.equalsIgnoreCase('accountlink')) {
            var userId = event.getSenderId(),
                islinked = $.inidb.exists('discordToTwitch', userId);

            if (action === undefined) {
                if (islinked) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.usage.link', $.inidb.get('discordToTwitch', userId)));
                } else {
                    $.discord.say(channel, $.lang.get('discord.accountlink.usage.nolink'));
                }
                /**
                 * @discordcommandpath accountlink link - Starts the process of linking an account. Completing this will overwrite existing links
                 */
            } else if (action.equalsIgnoreCase('link')) {
                var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                    text = '',
                    i;

                for (i = 0; i < 8; i++) {
                    text += code.charAt(Math.floor(Math.random() * code.length));
                }

                Packages.com.gmt2001.TempStore.instance().SetLong('discord.accountlink.pending', userId, text, java.lang.System.currentTimeMillis() + (10 * 60 * 1000));

                if (islinked) {
                    $.discordAPI.sendPrivateMessage(user, $.lang.get('discord.accountlink.link.relink', $.channelName, text));
                } else {
                    $.discordAPI.sendPrivateMessage(user, $.lang.get('discord.accountlink.link', $.channelName, text));
                }
                /**
                 * @discordcommandpath accountlink remove - Removes account links from the sender
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
         * @commandpath accountlink link [code] - Completes an account link
         */
        if (command.equalsIgnoreCase('accountlink') && action.equalsIgnoreCase('link')) {
            var code = args[1];


            if ($.strlen(code) < 8) {
                return;
            }

            var ts = Packages.com.gmt2001.TempStore.instance(),
                sections = ts.GetCategoryList('discord.accountlink.pending'),
                tm = java.lang.System.currentTimeMillis(),
                i,
                success = false;

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
    });

    var interval = setInterval(function () {
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
    }, 10 * 60 * 1000);

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.discord.registerCommand('./discord/core/accountLink.js', 'accountlink', 0);
        $.discord.registerSubCommand('accountlink', 'link', 0);
        $.discord.registerSubCommand('accountlink', 'remove', 0);
    });

    /* Export the function to the $.discord api. */
    $.discord.discordToTwitch = discordToTwitch;
})();
