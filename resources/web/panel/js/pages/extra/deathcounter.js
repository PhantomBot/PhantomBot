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
    socket.getDBValue('death_counter_module', 'modules', './commands/deathctrCommand.js', function(e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp('deathCounterModule', e.modules)) {
            return;
        }

        // Get current game.
        socket.getDBValue('get_current_stream_info', 'panelData', 'stream', function(e) {
            socket.getDBValue('get_death_count', 'deaths', JSON.parse(e.panelData).game, function(e) {
                $('#death-number').html(helpers.parseNumber(helpers.getDefaultIfNullOrUndefined(e.deaths, '0')));
            });
        });
    });
});

// Function that handlers the loading of events.
$(function() {
    var canUpdate = true;

    // Toggle for the module.
    $('#deathCounterModuleToggle').on('change', function() {
        let toggle = $(this).is(':checked');

        canUpdate = toggle;

        // Enable the module then query the data.
        socket.sendCommandSync('death_counter_module_toggle_cmd',
            'module ' + (toggle ? 'enablesilent' : 'disablesilent') + ' ./commands/deathctrCommand.js', run);
    });

    // Increase death button.
    $('#incr-deaths-button').on('click', function() {
        // Don't update deaths until new value is set.
        canUpdate = false;

        // Get current game.
        socket.getDBValue('get_current_stream_info', 'panelData', 'stream', function(e) {
            // Increase the deaths.
            socket.incrDBValue('incr_deaths_1', 'deaths', JSON.parse(e.panelData).game, '1', function() {
                // Set the new number.
                $('#death-number').html(helpers.parseNumber(parseInt($('#death-number').html().replace(/,/g, '')) + 1));
                // New value is set so we can let the updates work.
                canUpdate = true;
            });
        });
    });

    // Increase death button.
    $('#decr-deaths-button').on('click', function() {
        // Don't update deaths until new value is set.
        canUpdate = false;

        let deaths = parseInt($('#death-number').html().replace(/,/g, ''));

        // Make sure we don't go into the negatives.
        if (deaths < 1) {
            return;
        }

        // Get current game.
        socket.getDBValue('get_current_stream_info', 'panelData', 'stream', function(e) {
            // Decrease the deaths.
            socket.decrDBValue('decr_deaths_1', 'deaths', JSON.parse(e.panelData).game, '1', function() {
                // Set the new number
                $('#death-number').html(helpers.parseNumber(deaths - 1));
                // New value is set so we can let the updates work.
                canUpdate = true;
            });
        });
    });

    // Reset button.
    $('#reset-deaths-button').on('click', function() {
        // Don't update deaths until new value is set.
        canUpdate = false;

        // Get current game.
        socket.getDBValue('get_current_stream_info', 'panelData', 'stream', function(e) {
            // Delete deaths.
            socket.removeDBValue('rm_deaths_game', 'deaths', JSON.parse(e.panelData).game, function() {
                // Set the new number.
                $('#death-number').html('0');
                // New value is set so we can let the updates work.
                canUpdate = true;
            });
        });
    });

    // Settings button.
    $('#settings-deaths-button').on('click', function() {
        // Create custom modal for this module.
        helpers.getModal('death-settings', 'Death Counter Settings', 'Save', $('<form/>', {
            'role': 'form'
        })
        // Main div for the browser source link.
        .append($('<div/>', {
            'class': 'form-group',
        })
        // Append the lable.
        .append($('<label/>', {
            'text': 'Browser Source Link'
        }))
        .append($('<div/>', {
            'class': 'input-group'
        })
        // Add client widget URL.
        .append($('<input/>', {
            'type': 'text',
            'class': 'form-control',
            'id': 'death-url',
            'readonly': 'readonly',
            'value': helpers.getBotSchemePath() + '/addons/deathctr/deathctr.txt?refresh=true',
            'style': 'color: transparent !important; text-shadow: 0 0 5px hsla(0, 0%, 100%, .5);',
            'data-toggle': 'tooltip',
            'title': 'Clicking this box will show the link. DO NOT share this link with anyone as it has sensitive information.',
            'click': function() {
                // Reset styles.
                $(this).prop('style', '');
            }
        })).append($('<span/>', {
            'class': 'input-group-btn',
            'html': $('<button/>', {
                'type': 'button',
                'class': 'btn btn-primary btn-flat',
                'html': 'Copy',
                'click': function() {
                    // Select URL.
                    $('#death-url').select();
                    // Copy the URL.
                    document.execCommand('Copy');
                }
            })
        }))))
        // Append box with current deaths.
        .append(helpers.getInputGroup('deaths-t', 'number', 'Death Total', '',
            $('#death-number').html().replace(/,/g, ''), 'How many deaths to set on the counter.')),
        function() { // callback.
            let deaths = $('#deaths-t');

            switch (false) {
                case helpers.handleInputNumber(deaths, 0):
                    break;
                default:
                    // Update the death number.
                    $('#death-number').html(helpers.parseNumber(deaths.val()));
                    // Get current game.
                    socket.getDBValue('get_current_stream_info', 'panelData', 'stream', function(e) {
                        // Delete deaths.
                        socket.updateDBValue('update_deaths_game', 'deaths', JSON.parse(e.panelData).game, deaths.val(), function() {
                            // Close the modal.
                            $('#death-settings').modal('toggle');
                            // Alert the user.
                            toastr.success('Successfully updated death counter settings!');
                        });
                    });
            }
        }).modal('toggle');
    });

    // Timer that updates deaths every 10 seconds.
    helpers.setInterval(function() {
        if (canUpdate) {
            run();
        }
    }, 10e3);
});
