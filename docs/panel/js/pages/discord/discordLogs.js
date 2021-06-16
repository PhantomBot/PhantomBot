/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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
    let discordChannels = null;
    let allowedChannelTypes = ['GUILD_NEWS', 'GUILD_TEXT'];

    function refreshChannels() {
        socket.getDiscordChannelList('discord_customcommands2_getchannels', function (d) {
            discordChannels = d.data;
        });
    }

    function getChannelSelector(id, title, placeholder, value, tooltip, allowedChannelTypes) {
        if (discordChannels === null) {
            return helpers.getInputGroup(id, 'text', title, placeholder, value, tooltip);
        } else {
            let data = [];

            for (const [category, channels] of Object.entries(discordChannels)) {
                let entry = {};
                entry.title = category;
                entry.options = [];

                for (const [channel, type] of Object.entries(channels)) {
                    entry.options.push({
                        'name': channel,
                        'selected': channel === value,
                        'disabled': !allowedChannelTypes.includes(type)
                    });
                }

                data.push(entry);
            }

            return helpers.getDropdownGroupWithGrouping(id, title, data, tooltip);
        }
    }

    refreshChannels();

    setTimeout(function() {
        // Get Discord logging settings.
        socket.getDBValues('get_discord_logging_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['modLogs', 'customCommandLogs', 'modLogChannel']
        }, true, function(e) {
            // Mod toggle.
            $('#twitch-mod-log').val((e['modLogs'] === 'true' ? 'Yes' : 'No'));
            // Commands toggle.
            $('#twitch-command-log').val((e['customCommandLogs'] === 'true' ? 'Yes' : 'No'));
            // Log channels
            $('#discord_logs_pubsub').appendChild(getChannelSelector('twitch-mod-channel', 'Logging Channel', '#logs', e['modLogChannel'],
            'Which channel to post the moderation logs to.', allowedChannelTypes));

            if (discordChannels !== null) {
                $('#twitch-mod-channel').select2();
            }
        });
    }, 500);
});

// Function that handles events.
$(function() {
    // Save button.
    $('#discord-logging-save').on('click', function() {
    	let moderationLogs = $('#twitch-mod-log').find(':selected').text() === 'Yes',
    		customCommandLog = $('#twitch-command-log').find(':selected').text() === 'Yes',
    		logChannel = $('#twitch-mod-channel');

    	// Make sure all settings are entered corretly.
    	switch (false) {
    	    case helpers.handleInputString(logChannel):
    	    	break;
    	    default:
    	    	socket.updateDBValues('discord_logs_update', {
    	    		tables: ['discordSettings', 'discordSettings', 'discordSettings'],
        			keys: ['modLogs', 'customCommandLogs', 'modLogChannel'],
    	    		values: [moderationLogs, customCommandLog, logChannel.val()]
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
