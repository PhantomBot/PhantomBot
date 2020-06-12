/*
 * Copyright (C) 2016-2019 phantombot.tv
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

// Function that querys all of the data we need.
$(function() {
    // Get Discord logging settings.
    socket.getDBValues('get_discord_logging_settings', {
        tables: ['discordSettings', 'discordSettings', 'discordSettings', 'discordSettings'],
        keys: ['modLogs', 'cbenniToggle', 'customCommandLogs', 'modLogChannel']
    }, true, function(e) {
        // Mod toggle.
        $('#twitch-mod-log').val((e['modLogs'] === 'true' ? 'Yes' : 'No'));
        // Cbenni toggle.
        $('#twitch-mod-logviewer').val((e['cbenniToggle'] === 'true' ? 'Yes' : 'No'));
        // Commands toggle.
        $('#twitch-command-log').val((e['customCommandLogs'] === 'true' ? 'Yes' : 'No'));
        // Log channels
        $('#twitch-mod-channel, #twitch-command-channel').val((e['modLogChannel'] == null ? '' : e['modLogChannel']));
    });
});

// Function that handles events.
$(function() {
    // Save button.
    $('#discord-logging-save').on('click', function() {
    	let moderationLogs = $('#twitch-mod-log').find(':selected').text() === 'Yes',
    		moderationCBenni = $('#twitch-mod-logviewer').find(':selected').text() === 'Yes',
    		customCommandLog = $('#twitch-command-log').find(':selected').text() === 'Yes',
    		logChannel = $('#twitch-mod-channel');

    	// Make sure all settings are entered corretly.
    	switch (false) {
    	    case helpers.handleInputString(logChannel):
    	    	break;
    	    default:
    	    	socket.updateDBValues('discord_logs_update', {
    	    		tables: ['discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'chatModerator'],
        			keys: ['modLogs', 'cbenniToggle', 'customCommandLogs', 'modLogChannel', 'moderationLogs'],
    	    		values: [moderationLogs, moderationCBenni, customCommandLog, logChannel.val(), moderationLogs]
    	    	}, function() {
    	    		// Update the scripts variables.
    	    		socket.wsEvent('discord_logs', './core/logging.js', '', [], function() {
                        socket.sendCommand('moderation_reload_settings', 'reloadmoderation', function () {
    	    			    // Alert the user.
    	    			    toastr.success('Successfully updated the logs settings!');
                        });
    	    		});
    	    	});
    	}
    });
});
