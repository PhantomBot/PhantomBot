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
 * Record and track Song of the Night Winners
 */
(function() {
    
    /**
     * @function updateWinner
     * @param {string} username
     * @param {string} YouTube Link
     */
    function saveWinner(username, songLink) {
      
    };
    
    /**
     * @event initReady
     */
    $.bind('initReady', function() {
       $.registerChatCommand('./systems/sotnWinnerSystem.js', 'sotnwinner', 2) ;
    });
 })();


