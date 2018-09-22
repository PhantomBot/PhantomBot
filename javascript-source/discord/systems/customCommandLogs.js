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

(function() {
    var enabled = $.getSetIniDbBoolean('discordSettings', 'customCommandLogs', false),
        channel = $.getSetIniDbString('discordSettings', 'modLogChannel', '');

    /*
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/systems/customCommandLogs.js')) {
            enabled = $.getSetIniDbBoolean('discordSettings', 'customCommandLogs', false);
            channel = $.getSetIniDbString('discordSettings', 'modLogChannel', '');
        }
    });


    /*
     * @function logCustomCommand
     *
     * @param {object} info
     */
    function logCustomCommand(info) {
        var lines = Object.keys(info).map(function(key) {
            return '**' + $.lang.get('discord.customcommandlogs.' + key) + '**: ' + info[key];
        });
        $.log.file('customCommands', lines.join('\r\n'));
        if (enabled && channel) {
            $.discordAPI.sendMessageEmbed(channel, 'blue', lines.join('\r\n\r\n'));
        }
    }

    /*
     * Export function to API
     */
    $.logCustomCommand = logCustomCommand;
})();
