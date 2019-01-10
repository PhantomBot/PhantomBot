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
 * sotnWinner.js
 *
 * Record and track Song of the Night winners and contenders
 */
(function() {
    
     $.bind('command', function(event) {
         var sender = event.getSender(),    // Gets the person who used the command
             command = event.getCommand(),   // Gets the command being used
             args = event.getArgs(),        // Arguments used in the command
             
             action = args[0];              
             
             
        if (command.equalsIgnoreCase('sotn')) {
            
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + "Usage !sotn [winner|contender|leaderboard]");
                return;
            }
            
            if (action.equalsIgnoreCase('winner')) {
                var user = args[1];
                $.inidb.set("sotnwinner", 'users', user);

                $.say(user + ' has won the Song of the Night! Congratulations!');
                return;
            }
            
            if (action.equalsIgnoreCase('contender')) {
                var song = args[1], // Can we get the previous song? Pull from history?
                    user = args[2];
                
                saveContender(user, song);
                $.say('That\'s a song of the night contender from ' + user + '.  Not bad! kentobDRUM kentobDRUM');
            }
            
            if (action.equalsIgnoreCase('contenders')) {
                var contenderId = args[1],
                    contender = getContender(contenderId);
                
                $.say('Contender #' + contenderId + ' ' + contender);
            }

            if (action.equalsIgnoreCase('leaderboard')) {
                var winners = $.inidb.searchByValue('users');

                
                $.say('SOTN winners - ' + winners);
            }
        }
     });
     
    /**
     * @function getContender
     * @param {Number} contenderId
     * @returns {Array}
     */ 
    function getContender(contenderId) {
        var contender;
        
        if (!contenderId || isNaN(contenderId)) {
            quoteId = $.rand($.inidb.GetKeyList('sotncontenders', '').length);
        }
        
        if ($.inidb.exists('sotncontenders', contenderId)) {
            contender = JSON.parse($.inidb.get('sotncontenders', contenderId));
            contender.push(contenderId);
            return contender;
        } else {
            return [];
        }
    };
    
    /**
     * @function saveContender
     * @param {string} username
     * @param {song} song
     * @returns {Number}
     */
    function saveContender(username, song) {
        newKey = $.inidb.GetKeyList('sotncontenders', '').length;
        
        if ($.inidb.exists('sotncontenders', newKey)) {
            newKey++;
        }
        
        song = String(song).replace(/"/g, '\'\'');
        $.inidb.set('sotncontenders', newKey, JSON.stringify([username, song + '']));
        return newKey;
    };
    
    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        // `script` is the script location.
	// `command` is the command name without the `!` prefix.
	// `permission` is the group number. 0, 1, 2, 3, 4, 5, 6 and 7. 
	// These are also used for the permcom command.
	// $.registerChatCommand('script', 'command', 'permission');
       
       $.registerChatCommand('./systems/custom/sotnWinnerSystem.js', 'sotn', 2) ;
    });
 })();


