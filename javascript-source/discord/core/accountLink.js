/**
 * Handles linking of a Discord account to a Twitch account.
 *
 */
(function () {

    /**
     * @function sayPrivate
     *
     * @export $.discord
     * @param {string} user
     * @param {string} message
     */
    function sayPrivate(user, message) {
        sayPrivateU(Packages.com.illusionaryone.DiscordAPI.instance().resolveUser(user), message);
    }

    /**
     * @function sayPrivateU
     *
     * @export $.discord
     * @param {JDA.User} user
     * @param {string} message
     */
    function sayPrivateU(user, message) {
        if (user !== null && user !== undefined) {
            try {
                if (!user.hasPrivateChannel()) {
                    user.openPrivateChannel();
                }

                Packages.com.gmt2001.Console.out.println("[DISCORD] [@" + user.getName() + "#" + user.getDiscriminator() + "] [DM] " + message);
                user.getPrivateChannel().sendMessage(message).queue();
            } catch (e) {
                Packages.com.gmt2001.Console.debug.println("Failed to send a DM message to Discord.");
                $.log.error(e.toString());
            }
        }
    }

    /**
     * @function discordToTwitch
     *
     * @export $.discord
     * @param {string} user
     * @param {string} discriminator
     * @return {string}
     */
    function discordToTwitch(user, discriminator) {
        if ($.inidb.exists("discordToTwitch", user + "#" + discriminator)) {
            return $.inidb.get("discordToTwitch", user + "#" + discriminator);
        }
    }

    /**
     * @function discordToTwitchU
     *
     * @export $.discord
     * @param {JDA.User} user
     * @return {string}
     */
    function discordToTwitchU(user) {
        return discordToTwitch(user.getName(), user.getDiscriminator());
    }

    /**
     * @event discordCommand
     */
    $.bind('discordCommand', function (event) {
        var sender = event.getSender(),
                channel = event.getChannel(),
                command = event.getCommand(),
                mention = event.getMention(),
                args = event.getArgs(),
                action = args[0];

        /**
         * @discordcommandpath module enable [path] - Enables any modules in the bot, it should only be used to enable discord modules though.
         */
        if (command.equalsIgnoreCase('accountlink')) {
            var uusername = sender.getName() + "#" + sender.getDiscriminator(),
                    islinked = $.inidb.exists("discordToTwitch", uusername);

            if (action === undefined) {
                if (islinked) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get("discord.accountlink.usage.link", $.inidb.get("discordToTwitch", uusername)));
                } else {
                    $.discord.say(channel, $.lang.get("discord.accountlink.usage.nolink"));
                }
            } else if (action.equalsIgnoreCase("link")) {
                var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                        text = '',
                        i;

                for (i = 0; i < 8; i++) {
                    text += code.charAt(Math.floor(Math.random() * code.length));
                }

                Packages.com.gmt2001.TempStore.instance().SetInteger("discord.accountlink.pending", uusername, text, $.systemTime() + (10 * 60 * 1000));

                if (islinked) {
                    sayPrivateU(sender, $.lang.get("discord.accountlink.link.relink", $.botName, text));
                } else {
                    sayPrivateU(sender, $.lang.get("discord.accountlink.link", $.botName, text));
                }
            } else if (action.equalsIgnoreCase("remove")) {
                $.inidb.del("discordToTwitch", uusername);
                sayPrivateU(sender, $.lang.get("discord.accountlink.link.remove"));
            }
        }
    });

    var interval = setInterval(function () {
        var ts = Packages.com.gmt2001.TempStore.instance(),
                sections = ts.GetCategoryList("discord.accountlink.pending"),
                tm = $.systemTime(),
                keys,
                i,
                b,
                removed;

        for (i = 0; i < sections.length; i++) {
            keys = ts.GetKeyList("discord.accountlink.pending", sections[i]);

            removed = 0;
            for (b = 0; b < keys.length; b++) {
                if (ts.GetInteger("discord.accountlink.pending", sections[i], keys[b]) < tm) {
                    ts.RemoveKey("discord.accountlink.pending", sections[i], keys[b]);
                    removed++;
                }
            }

            if (removed >= keys.length) {
                ts.RemoveSection("discord.accountlink.pending", sections[i]);
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
    $.discord.sayPrivate = sayPrivate;
    $.discord.sayPrivateU = sayPrivateU;
    $.discord.discordToTwitch = discordToTwitch;
    $.discord.discordToTwitch = discordToTwitchU;
})();
