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

/*
 * lastseenCommand.js
 *
 * This module stores the dates of when users have last seen in the channel.
 */
(function() {
    /*
     * @event ircChannelJoin
     */
    $.bind('ircChannelJoin', function(event) {
        $.inidb.set('lastseen', event.getUser().toLowerCase(), $.systemTime());
    });

    /*
     * @event ircChannelLeave
     */
    $.bind('ircChannelLeave', function(event) {
        $.inidb.set('lastseen', event.getUser().toLowerCase(), $.systemTime());
    });

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            target = args[0],
            date;

        /*
         * @commandpath lastseen [username] - Find out when the given user was last seen in the channel
         */
        if (command.equalsIgnoreCase('lastseen')) {
            if (target === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('lastseen.usage'));
                return;
            }

            target = $.user.sanitize(target);

            if ($.inidb.exists('lastseen', target)) {
                date = new Date(parseInt($.inidb.get('lastseen', target.toLowerCase())));
                $.say($.whisperPrefix(sender) + $.lang.get('lastseen.response', $.username.resolve(target), date.toLocaleDateString(), date.toLocaleTimeString()));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('lastseen.404', $.username.resolve(target)));
            }
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./commands/lastseenCommand.js', 'lastseen', $.PERMISSION.Viewer);
    });
})();
