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

$(function () {
    page = {
        // Constants
        // Meta information for the database and to connect it to DOM
        moduleId: 'emotesEmoji',

        //
        moduleEmoji: './handlers/emojiHandler.js',
        moduleBttv: './handlers/emotesBttvHandler.js',
        moduleFfz: './handlers/emotesFfzHandler.js',
        moduleKeywordEmotes: './handlers/keywordEmotesHandler.js',

        checkboxEmoji: 'enableEmoji',
        checkboxBttv: 'enableBttv',
        checkboxFfz: 'enableFfz',
        checkboxKeywordEmotes: 'enableKeywordEmotes',
    };

    page.init = function () {
        let closure = this;
        let checkBoxMap = {};
        checkBoxMap[this.moduleEmoji] = this.checkboxEmoji;
        checkBoxMap[this.moduleBttv] = this.checkboxBttv;
        checkBoxMap[this.moduleFfz] = this.checkboxFfz;
        checkBoxMap[this.moduleKeywordEmotes] = this.checkboxKeywordEmotes;
        Object.keys(checkBoxMap).forEach((modulePath, index) => {
            socket.getDBValue(this.moduleId + '_get_' + index, 'modules', modulePath, function (e) {
                let checkbox = document.getElementById(checkBoxMap[modulePath]);
                checkbox.checked = (e.modules === 'true' || false);
                checkbox.addEventListener('change', function (event) {
                    closure.onEnabledChanged(event, modulePath);
                });
            });
        });
    };

    page.onEnabledChanged = function (event, modulePath) {
        console.log(event);
        let commandState = event.target.checked ? 'enablesilent' : 'disablesilent';
        let command = `module ${commandState} ${modulePath}`;
        socket.sendCommandSync(this.moduleId + '_toggle_' + event.target.id, command, function () {
            toastr.success(`${event.target.parentElement.parentElement.nextElementSibling.textContent} has been ` + (event.target.checked ? 'enabled' : 'disabled'));
        });
    };

    // Run the page
    page.init();
});