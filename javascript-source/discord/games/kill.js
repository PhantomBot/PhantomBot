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

/**
 * This module is to handles the random game.
 */
(function() {
    var selfMessageCount = 0,
        otherMessageCount = 0,
        lastRandom = 0;

    /**
     * @function loadResponses
     */
    function loadResponses() {
        for (var i = 1; $.lang.exists('killcommand.self.' + i); i++) {
            selfMessageCount++;
        }

        for (var i = 1; $.lang.exists('killcommand.other.' + i); i++) {
            otherMessageCount++;
        }
    }

    /**
     * @function selfKill
     *
     * @param {String} sender
     * @param {String} channel
     */
    function selfKill(sender, channel) {
        var random;
        do {
            random = $.randRange(1, selfMessageCount);
        } while (random == lastRandom);

        $.discord.say(channel, $.lang.get('killcommand.self.' + random, sender));
        lastRandom = random;
    }

    /**
     * @function kill
     *
     * @param {String} sender
     * @param {String} username
     * @param {String} channel
     */
    function kill(sender, username, channel) {
        var random;
        do {
            random = $.randRange(1, otherMessageCount);
        } while (random == lastRandom);

        $.discord.say(channel, $.lang.get('killcommand.other.' + random, sender, username, $.getIniDbNumber('settings', 'killTimeoutTime', 60), $.botName).replace('(jail)', ''));
        lastRandom = random;
    }

    /**
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        var sender = event.getUsername(),
            channel = event.getDiscordChannel(),
            command = event.getCommand(),
            args = event.getArgs();

        /**
         * @discordcommandpath kill [username] - Kill a fellow viewer (not for real!).
         */
        if (command.equalsIgnoreCase('kill')) {
            if (args.length === 0) {
                selfKill(sender, channel);
            } else {
                kill(sender, args[0], channel);
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/games/kill.js', 'kill', 0);

        if (otherMessageCount === 0 && selfMessageCount === 0) {
            loadResponses();
        }
    });
})();
