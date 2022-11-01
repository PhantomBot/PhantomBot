/*
 * Copyright (C) 2021 phantombot.github.io/PhantomBot
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
    var state = {
        alphaFilter: false,
        lockdown: false,
        timer: null
    };
    var alphaFilter = /([^a-z0-9\s!@,.?:;"\u201C\u201D'\u2019+=\-_#$%^&*()])/ig;

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        if (state.alphaFilter && $.test(event.getMessage(), alphaFilter)) {
            Packages.tv.phantombot.PhantomBot.instance().getSession().sayNow('.timeout ' + event.getSender() + ' 1s Message blocked by lockdown alpha filter');
        }
    });

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var command = event.getCommand(),
            args = event.getArgs();

        if (command.equalsIgnoreCase('lockdown')) {
            if (args.length === 0 && !state.lockdown) {
                Packages.tv.phantombot.PhantomBot.instance().getSession().sayNow('.clear');
                Packages.tv.phantombot.PhantomBot.instance().getSession().sayNow('.subscribers');
                state.lockdown = true;
                Packages.tv.phantombot.PhantomBot.instance().getSession().sayNow('/me === LOCKDOWN ENABLED === Chat has been placed into subscribers-only mode due to a moderator initiating chat lockdown. To end lockdown, a moderator must say: !lockdown end');
                
                setTimeout(function() {
                    Packages.tv.phantombot.PhantomBot.instance().getSession().sayNow('/me === LOCKDOWN ENABLED === Chat has been placed into subscribers-only mode due to a moderator initiating chat lockdown. To end lockdown, a moderator must say: !lockdown end');
                }, 5e3);
                
                state.timer = setInterval(function() {
                    Packages.tv.phantombot.PhantomBot.instance().getSession().sayNow('/me === LOCKDOWN ENABLED === Chat has been placed into subscribers-only mode due to a moderator initiating chat lockdown. To end lockdown, a moderator must say: !lockdown end');
                }, 300e3);
            } else if(args.length > 0 && args[0].equalsIgnoreCase('help')) {
                $.say('Lockdown Module >> !lockdown - Locks down chat using clearchat and sub-only mode. Ongoing message every 5 minutes >> !lockdown end - Ends a lockdown >> !lockdown alphafilter - Toggles restricting allowed characters in chat');
            } else if(args.length > 0 && args[0].equalsIgnoreCase('end') && state.lockdown) {
                Packages.tv.phantombot.PhantomBot.instance().getSession().sayNow('/me === LOCKDOWN ENDED === The lockdown is now lifting. Please behave everyone. A moderator may start another lockdown by saying: !lockdown');
                Packages.tv.phantombot.PhantomBot.instance().getSession().sayNow('.subscribersoff');
                state.lockdown = false;
                clearInterval(state.timer);
            } else if(args.length > 0 && args[0].equalsIgnoreCase('alphafilter')) {
                state.alphaFilter = !state.alphaFilter;
                $.say('Lockdown alpha restriction is now ' + (state.alphaFilter ? 'enabled' : 'disabled'));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./core/lockdown.js', 'lockdown', $.PERMISSION.Mod);
    });
})();
