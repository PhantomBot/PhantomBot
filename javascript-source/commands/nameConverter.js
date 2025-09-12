/*
 * Copyright (C) 2016-2025 phantombot.github.io/PhantomBot
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
    let tables = ['points', 'time', 'followed', 'followedDate', 'subscribed', 'greeting', 'greetingCoolDown', 'visited', 'lastseen', 'group', 'preSubGroup', 'viewerRanks', 'welcome_disabled_users'];

    /**
     * @function changeName Re-associates viewer-specific database entries to a new username
     *
     * @export $.nameConverter
     * @param {string} oldName Old Twitch Name
     * @param {string} newName New Twitch Name
     * @return {number} 0 if not found; otherwise number of tables updated
     */
    function changeName(oldName, newName) {
        if (oldName === undefined || oldName === null || newName === undefined || newName === null) {
            return 0;
        }

        let changed = 0,
                i;

        oldName = $.jsString(oldName).toLowerCase();
        newName = $.jsString(newName);
        let newNameL = $.jsString(newName).toLowerCase();

        // Update the default tables with that users new name if it's currently in any tables.
        for (i in tables) {
            let entry = $.optIniDbString(tables[i], oldName);
            if (entry.isPresent()) {
                $.inidb.set(tables[i], newNameL, entry.get());
                $.inidb.del(tables[i], oldName);
                changed++;
            }
        }

        // Update the username in the quotes table.
        let keys = $.inidb.GetKeyList('quotes', ''),
            jsonArr;

        for (i in keys) {
            if ($.getIniDbString('quotes', keys[i]).toLowerCase().indexOf(oldName) > -1) {
                jsonArr = JSON.parse($.getIniDbString('quotes', keys[i]));
                $.inidb.set('quotes', keys[i], JSON.stringify([String(newName), String(jsonArr[1]), String(jsonArr[2]), String(jsonArr[3])]));
            }
        }

        return changed;
    }

    $.bind('command', function(event) {
        let sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];


        /**
         * @commandpath namechange [oldname] [newname] - Convert someones old Twitch username to his/her new Twitch name. The user will be able to keep their points, time, quotes, and more.
         */
        if ($.equalsIgnoreCase(command, 'namechange')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('namechange.default'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('namechange.updating', action, subAction));

            let changed = changeName(action, subAction)

            // Announce in chat once done.
            if (changed > 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('namechange.success', action, subAction, changed));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('namechange.notfound', action));
            }
        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./commands/nameConverter.js', 'namechange', $.PERMISSION.Admin);
    });

    $.nameConverter = {};
    $.nameConverter.changeName = changeName;
})();
