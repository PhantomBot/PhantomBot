/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
$(run = function() {
    // Check if the module is enabled.
    socket.getDBValue('dual_stream_command_module', 'modules', './commands/dualstreamCommand.js', function(e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp('dualStreamModule', e.modules)) {
            return;
        }

        // Get the URL.
        socket.getDBValue('get_multi_link', 'dualStreamCommand', 'otherChannels', function(e) {
            let channels = e.dualStreamCommand;

            if (channels.indexOf('Channel-1') === -1) {
                $('#multi-channels').val(channels.split(' ').join('/'));
            }

            $('#multi-main').html('https://multistre.am/' + getChannelName() + '/');
        });
    });
});

// Function that handlers the loading of events.
$(function() {
    // Toggle for the module.
    $('#dualStreamModuleToggle').on('change', function() {
        // Enable the module then query the data.
        socket.sendCommandSync('dual_stream_command_module_toggle_cmd',
            'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./commands/dualstreamCommand.js', run);
    });

    // Clip url update.
    $('#multi-channels').on('focusout', function() {
        let channels = $('#multi-channels').val();

        // If the box is empty, set the default channels.
        if (channels.length < 1) {
            channels = 'Channel-1 Channel-2';
        } else {
            channels = channels.split('/').join(' ');
        }

        // Update the channels.
        socket.updateDBValue('update_multi_channels', 'dualStreamCommand', 'otherChannels', channels, function() {
            socket.sendCommand('update_multi_channels_cmd', 'reloadmulti', function() {
                toastr.success('Successfully updated the multi channels!');
            });
        });
    });

    // Copy button.
    $('#dualstream-copy-btn').on('click', function() {
        let old = $('#multi-channels').val();

        // Copy text.
        $('#multi-channels').val('https://multistre.am/' + getChannelName() + '/' + old).select();

        // Copy the text.
        document.execCommand('Copy');

        // Set back the old text.
        $('#multi-channels').val(old);
    });

    // Settings button.
    $('#dualstream-settings-button').on('click', function() {
        socket.getDBValues('get_multi_settings', {
            tables: ['dualStreamCommand', 'dualStreamCommand', 'dualStreamCommand'],
            keys: ['timerToggle', 'timerInterval', 'reqMessages']
        }, true, function(e) {
            helpers.getModal('dualstream-settings', 'Dual Stream Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Append a select option for the toggle.
            .append(helpers.getDropdownGroup('multi-toggle', 'Enable Multi Timer',
                (e.timerToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No']))
            // Timer interval.
            .append(helpers.getInputGroup('multi-interval', 'text', 'Timer Interval (Minutes)',
                '', e.timerInterval, 'How often to post the multi link in the channel.'))
            // Req messages.
            .append(helpers.getInputGroup('multi-req', 'text', 'Required Messages',
                '', e.reqMessages, 'How many messages along with the timer required to trigger the multi link.')),
            function() { // Callback for when the user clicks save.
                let timerToggle = $('#multi-toggle').find(':selected').text() === 'Yes',
                    timerInterval = $('#multi-interval'),
                    timerReq = $('#multi-req');

                switch (false) {
                    case helpers.handleInputNumber(timerInterval, 1):
                    case helpers.handleInputNumber(timerReq, 1):
                        break;
                    default:
                        socket.updateDBValues('update_multi_settings', {
                            tables: ['dualStreamCommand', 'dualStreamCommand', 'dualStreamCommand'],
                            keys: ['timerToggle', 'timerInterval', 'reqMessages'],
                            values: [timerToggle, timerInterval.val(), timerReq.val()]
                        }, function() {
                            socket.sendCommand('update_multi_settings_cmd', 'reloadmulti', function() {
                                // Close the modal.
                                $('#dualstream-settings').modal('toggle');
                                // Alert the user.
                                toastr.success('Successfully updated multi settings!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });
});
