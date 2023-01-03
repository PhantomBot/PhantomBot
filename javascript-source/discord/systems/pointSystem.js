/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function() {

    /*
     * @function getUserPoints
     *
     * @param  {Number} id
     * @return {Number}
     */
    function getUserPoints(id) {
        var username = $.discord.resolveTwitchName(id);

        if (username === null) {
            return 0;
        }

        username = username.toLowerCase();

        return ($.inidb.exists('points', username) ? parseInt($.inidb.get('points', username)) : 0);
    }

    /*
     * @function decrUserPoints
     *
     * @param  {Number} id
     * @param  {Number} amount
     */
    function decrUserPoints(id, amount) {
        var username = $.discord.resolveTwitchName(id);

        if (username !== null) {
            $.inidb.decr('points', username.toLowerCase(), amount);
        }
    }

    /**
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            channel = event.getDiscordChannel(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0],
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
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/systems/pointSystem.js', 'points', 0);
    });

    /* Export to the API */
    $.discord.getUserPoints = getUserPoints;
    $.discord.decrUserPoints = decrUserPoints;
})();
