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
 * topCommand.js
 *
 * Build and announce lists of top viewers (Highest points, highest time spent in the channel)
 */
(function() {
    /**
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        let command = event.getCommand(),
            channel = event.getDiscordChannel(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0];

        /**
         * @discordcommandpath top - Display the top people with the most points
         */
        if ($.equalsIgnoreCase(command, 'top')) {
            $.discord.say(channel, $.getTop5('points'));
            return;
        }

        /**
         * @discordcommandpath toptime - Display the top people with the most time
         */
        if ($.equalsIgnoreCase(command, 'toptime')) {
            $.discord.say(channel, $.getTop5('time'));
            return;
        }

        /**
         * @discordcommandpath topamount - Set how many people who will show up in the !top points list
         */
        if ($.equalsIgnoreCase(command, 'topamount')) {
            if (action === undefined || isNaN(parseInt(action))) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('top5.amount.points.usage'));
                return;
            }
            if (parseInt(action) > 15) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('top5.amount.max'));
                return;
            }

            $.inidb.set('settings', 'topListAmountPoints', parseInt(action));
            $.reloadTop();
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('top5.amount.points.set', parseInt(action)));
            return;
        }

        /**
         * @discordcommandpath toptimeamount - Set how many people who will show up in the !toptime list
         */
        if ($.equalsIgnoreCase(command, 'toptimeamount')) {
            if (action === undefined || isNaN(parseInt(action))) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('top5.amount.time.usage'));
                return;
            }
            if (parseInt(action) > 15) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('top5.amount.max'));
                return;
            }

            $.inidb.set('settings', 'topListAmountTime', parseInt(action));
            $.reloadTop();
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('top5.amount.time.set', parseInt(action)));
            return;
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/custom/topCommand.js', 'top', 0);
        $.discord.registerCommand('./discord/custom/topCommand.js', 'toptime', 0);
        $.discord.registerCommand('./discord/custom/topCommand.js', 'topamount', 1);
        $.discord.registerCommand('./discord/custom/topCommand.js', 'toptimeamount', 1);
    });
})();
