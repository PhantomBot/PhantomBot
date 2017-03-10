<<<<<<< HEAD
=======
/**
 * pointSystem.js
 *
 * Manage user loyalty points and export and API to manipulate points in other modules
 * Use the $ API
 */
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
(function () {

    /**
     * @event discordCommand
     */
<<<<<<< HEAD
    $.bind('discordCommand', function(event) {
=======
    $.bind('discordCommand', function (event) {
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
        var sender = event.getSender(),
            command = event.getCommand(),
            channel = event.getChannel(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0],
<<<<<<< HEAD
            twitchName = $.discord.resolveTwitchName(event.getSenderId());

        /**
         * @discordcommandpath points - Tells you how many points you have if you linked in you Twitch account.
         */
        if (command.equalsIgnoreCase('points')) {
            if (action === undefined) {
                if (twitchName !== null) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.pointsystem.self.points', $.getPointsString($.getUserPoints(twitchName)), $.getTimeString($.getUserTime(twitchName)), $.resolveRank(twitchName)));
                } else {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.linkrequired'));
                }
            } else if ($.user.isKnown(action.toLowerCase())) {
                twitchName = action.replace('@', '').toLowerCase();
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.pointsystem.other.points', twitchName, $.getPointsString($.getUserPoints(twitchName)), $.getTimeString($.getUserTime(twitchName)), $.resolveRank(twitchName)));
            } else {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.pointsystem.no.points.other', $.pointNameMultiple));
=======
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
>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
            }
        }
    });

    /**
     * @event initReady
     */
<<<<<<< HEAD
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/systems/pointSystem.js')) {
            $.discord.registerCommand('./discord/systems/pointSystem.js', 'points', 0);
        }
    });
})();
=======
    $.bind('initReady', function () {
        if ($.bot.isModuleEnabled('./discord/systems/pointSystem.js')) {
            $.discord.registerCommand('./discord/systems/pointSystem.js', 'points', 0);
            $.discord.registerCommand('./discord/systems/pointSystem.js', 'point', 0);
            $.discord.registerCommand('./discord/systems/pointSystem.js', $.pointNameSingle, 0);
            $.discord.registerCommand('./discord/systems/pointSystem.js', $.pointNameMultiple, 0);
        }
    });
})();

>>>>>>> eaaab3813091c258517522b05f1c272a39c65993
