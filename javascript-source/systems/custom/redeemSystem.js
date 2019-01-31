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
             
             reward = args[0];              
                     
        if (command.equalsIgnoreCase('redeem')) {
            
            // TODO If no reward, display levels
            
            if (reward.equalsIgnoreCase('water')) {
                
            }
            
            if (reward.equalsIgnoreCase('bump')) {
                // TODO Check redeem table, lookup sender and make sure they haven't used a bump this stream
                // If the user has already redeemed this stream, display message they used bump already
                
                var redeemed = $.inidb.GetBoolean("redeem", "bump", sender);
                if (redeemed) {
                    var song = args[1];
                    // TODO Get YouTube player, promote song
                    // TODO Charge user bits
                    
                    $.inidb.GetBoolean("redeem", "bump", sender, true);
                    
                    // TODO Put message in chat
                } else {
                    $.say($.lang.get('redeem.bump.error', sender));
                    
                }
            }
            
            if (reward.equalsIgnoreCase('learn')) {
                // TODO Check redeem table, lookup sender and make sure they haven't redeemed learn in 30 days
                // If the user has already redeemed in 30 days, display message they used bump already
            }
            
    //      if (reward.equalsIgnoreCase('beanboozled')) {
    //            
    //      }
    //       
    //       
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
       
       $.registerChatCommand('./systems/custom/redeemSystem.js', 'redeem') ;
    });
 })();