/*
 * Copyright (C) 2016-2018 phantombot.tv
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
 * kentobotSystem.js
 *
 * General bot maintenance and control
 */
(function() {
    
     $.bind('command', function(event) {
        var sender = event.getSender(),    // Gets the person who used the command
             command = event.getCommand(),   // Gets the command being used
             args = event.getArgs(),        // Arguments used in the command
             
             action = args[0]; 

        if (command.equalsIgnoreCase('oops')) {
            $.inidb.incr("sticks", "drops" , 1);
            
            var drops = $.inidb.get("sticks", "drops");
            $.say($.lang.get('sticks.drops.message', drops));
        }
        
        if (command.equalsIgnoreCase('rip')) {
            $.inidb.incr("sticks", "breaks" , 1);
            
            var breaks = $.inidb.get("sticks", "breaks");
            $.say($.lang.get('sticks.breaks.message', breaks));
        }
        
        if (command.equalsIgnoreCase('drops')) {
            var drops = $.inidb.get("sticks", "drops");
            if (drops === null) {
                drops = 0;
            }
            
            $.say($.lang.get('sticks.drops.message', drops));
        }
        
        if (command.equalsIgnoreCase('breaks')) {
            var breaks = $.inidb.get("sticks", "breaks");
            if (breaks === null) {
                breaks = 0;
            }
            
            $.say($.lang.get('sticks.breaks.message', breaks));
        }
        
        if (command.equalsIgnoreCase('setsticks')) {
            if (action != null && action.equalsIgnoreCase('drops')) {
                if (args[1] != null) {
                    $.inidb.set("sticks", "drops", args[1]);
                    $.say($.lang.get('sticks.set.drops', args[1]));
                    return;
                }
            }
            
            if (action != null && action.equalsIgnoreCase('breaks')) {
                if (args[1] != null) {
                    $.inidb.set("sticks", "breaks", args[1]);
                    $.say($.lang.get('sticks.set.breaks', args[1]));
                    return;
                }
            }
            
            $.say($.lang.get('sticks.set.usage', sender));
        }
     });
             
    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        // `script` is the script location.
	// `command` is the command name without the `!` prefix.
	// `permission` is the group number. 0, 1, 2, 3, 4, 5, 6 and 7. 
	// These are also used for the permcom command.
	// $.registerChatCommand('script', 'command', 'permission');
       
       $.registerChatCommand('./systems/custom/stickSystem.js', 'drops');
       $.registerChatCommand('./systems/custom/stickSystem.js', 'breaks');
       $.registerChatCommand('./systems/custom/stickSystem.js', 'setsticks', 2);
       $.registerChatCommand('./systems/custom/stickSystem.js', 'oops', 2);
       $.registerChatCommand('./systems/custom/stickSystem.js', 'rip', 2);
    });
 })();