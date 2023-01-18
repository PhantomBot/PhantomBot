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

// Function that querys all of the data we need.
$(run = function () {
    // Check if the module is enabled.
    socket.getDBValues('commercials_module', {
        tables: ['modules', 'commercialSettings', 'commercialSettings', 'commercialSettings', 'commercialSettings'],
        keys: ['./systems/commercialSystem.js', 'commercialtimer', 'length', 'interval', 'message']
    }, true, function (e) {
        if (!helpers.handleModuleLoadUp('commercialsModule', e['./systems/commercialSystem.js'], 'commercialsModuleToggle')) {
            return;
        }

        if (e['commercialtimer'] === 'true') {
            $('#commercials-autotimer-on').html($('<i/>', {
                'class': 'fa fa-check'
            })).append('&nbsp; Update Autotimer');
            $('#commercials-autotimer-off').removeClass('hidden');
        }

        $('#commercial-interval').val(e['interval']);
        $('#commercial-length').val(e['length']);
        $('#commercial-message').val(e['message']);
    });
});

// Function that handlers the loading of events.
$(function () {
    const COMMERCIAL_SCRIPT = './systems/commercialSystem.js';

    // Toggle for the module.
    $('#commercialsModuleToggle').on('change', function () {
        // Toggle the module
        socket.sendCommandSync('commercial_module_toggle_cmd',
                'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/commercialSystem.js', run);
    });

    // Set/Update autotimer button.
    $('#commercials-autotimer-on').on('click', function () {
        let cinterval = $('#commercial-interval'),
                clength = $('#commercial-length').find(':selected').text(),
                cmessage = $('#commercial-message');

        switch (false) {
            case helpers.handleInputNumber(cinterval, 8):
                break;
            default:
                socket.wsEvent('commercials_setautotimer_ws', COMMERCIAL_SCRIPT, null, ['setautotimer', cinterval.val(), clength, cmessage.val()], function () {
                    toastr.success('Successfully set the autotimer!');
                    // Update the button.
                    $('#commercials-autotimer-on').html($('<i/>', {
                        'class': 'fa fa-check'
                    })).append('&nbsp; Update Autotimer');
                    $('#commercials-autotimer-off').removeClass('hidden');
                });
        }
    });

    // Disable autotimer button.
    $('#commercials-autotimer-off').on('click', function () {
        socket.wsEvent('commercials_autotimeroff_ws', COMMERCIAL_SCRIPT, null, ['autotimeroff'], function () {
            toastr.success('Successfully turned off autotimer!');
            // Update the button.
            $('#commercials-autotimer-on').html($('<i/>', {
                'class': 'fa fa-check'
            })).append('&nbsp; Set Autotimer');
            $('#commercials-autotimer-off').addClass('hidden');
        });
    });
});
