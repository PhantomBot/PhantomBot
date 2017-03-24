(function () {

    /**
     * @event discordCommand
     */
    $.bind('discordCommand', function (event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            channel = event.getChannel(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0],
            userId = event.getSenderId(),
            twitchName = $.discord.discordToTwitch(userId);

        /**
         * @commandpath points - Announce points in chat when no parameters are given.
         */
        if (command.equalsIgnoreCase('points') || command.equalsIgnoreCase('point') || command.equalsIgnoreCase($.pointNameMultiple) || command.equalsIgnoreCase($.pointNameSingle)) {
            if (!action) {
                if (twitchName === null) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.linkrequired'));
                } else {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.replace($.replace($.getPointsMessage(twitchName, $.username.resolve(twitchName)), "@" + $.username.resolve(twitchName) + ", ",  ""), "/w " + twitchName,  ""));
                }
            } else if ($.user.isKnown(action.toLowerCase())) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('pointsystem.user.success', $.username.resolve(action), getPointsString(getUserPoints(action.toLowerCase()))));
            } else if (action.equalsIgnoreCase("fix")) {
                $.discord.registerCommand('./discord/systems/pointSystem.js', $.pointNameSingle, 0);
                $.discord.registerCommand('./discord/systems/pointSystem.js', $.pointNameMultiple, 0);
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        if ($.bot.isModuleEnabled('./discord/systems/pointSystem.js')) {
            $.discord.registerCommand('./discord/systems/pointSystem.js', 'points', 0);
            $.discord.registerCommand('./discord/systems/pointSystem.js', 'point', 0);
            $.discord.registerCommand('./discord/systems/pointSystem.js', $.pointNameSingle, 0);
            $.discord.registerCommand('./discord/systems/pointSystem.js', $.pointNameMultiple, 0);
        }
    });
})();
