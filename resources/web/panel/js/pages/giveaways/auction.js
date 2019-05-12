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

// Function that querys all of the data we need.
$(run = function() {
    socket.getDBValues('auction_module_status_toggle', {
        tables: ['modules', 'auctionSettings'],
        keys: ['./systems/auctionSystem.js', 'isActive']
    }, true, function(e) {
        if (!helpers.getModuleStatus(['auctionOptions'], e['./systems/auctionSystem.js'], 'auctionSystemModuleToggle')) {
            // Remove the chat.
            $('#twitch-chat-auction').find('iframe').remove();
            return;
        }

        // Update the open button to close if the raffle is active.
        if (e['isActive'] === 'true') {
            $('#open-or-close-auction').html($('<i/>', {
                'class': 'fa fa-lock'
            })).append('&nbsp; Close').removeClass('btn-success').addClass('btn-warning');
        }

        // Add Twitch chat.
        $('#twitch-chat-auction').html($('<iframe/>', {
            'frameborder': '0',
            'scrolling': 'no',
            'style': 'min-width: 100%; min-height: 493px;',
            'src': 'https://www.twitch.tv/embed/' + getChannelName() + '/chat' + (helpers.isDark ? '?darkpopout' : '')
        }));

        // Add temp function.
        helpers.temp.updateStats = function() {
            socket.getDBValues('auction_module_status_toggle', {
                tables: ['auctionresults', 'auctionresults'],
                keys: ['winner', 'amount']
            }, true, function(e) {
                if (e['winner'] != null) {
                    $('#auction-top-bidder').html(e['winner']);
                    $('#auction-points').html(e['amount']);
                }
            });
        };

        // Set a timer to auto load the raffle list.
        helpers.setInterval(function() {
            helpers.temp.updateStats();
        }, 3e3);
    });
});

// Function that handlers the loading of events.
$(function() {
    // Module toggle.
    $('#auctionSystemModuleToggle').on('change', function() {
        socket.sendCommandSync('auction_system_module_toggle_cmd',
            'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/auctionSystem.js', run);
    });

    // Open/Close button.
    $('#open-or-close-auction').on('click', function() {
        if ($(this)[0].innerText.trim() === 'Open') {
            const commandLevel = $('#auction-perm').find(':selected').text(),
                minBet = $('#auction-bet'),
                incre = $('#auction-inc'),
                timer = $('#auction-timer');

            // Make sure the user entered everything right.
            switch (false) {
                case helpers.handleInputNumber(minBet, 1):
                case helpers.handleInputNumber(incre, 1):
                case helpers.handleInputNumber(timer, 0):
                    break;
                default:
                    socket.sendCommandSync('auction_command_permisison_update', 'permcomsilent bid ' + helpers.getGroupIdByName(commandLevel, true), function() {
                        socket.sendCommand('auction_open_cmd', 'auction open ' + incre.val() + ' ' + minBet.val() + ' ' + timer.val(), function() {
                            // Alert the user.
                            toastr.success('Successfully opened the auction!');
                            // Update the button.
                            $('#open-or-close-auction').html($('<i/>', {
                                'class': 'fa fa-lock'
                            })).append('&nbsp; Close').removeClass('btn-success').addClass('btn-warning');
                        });
                    });
            }
        } else {
            socket.sendCommandSync('close_auction_cmd', 'auction close', function() {
                // Alert the user.
                toastr.success('Successfully closed the auction!');
                // Reload to remove the winner.
                helpers.temp.updateStats();
                // Update the button.
                $('#open-or-close-auction').html($('<i/>', {
                    'class': 'fa fa-unlock-alt'
                })).append('&nbsp; Open').removeClass('btn-warning').addClass('btn-success');
            });
        }
    });

    // Warn auction.
    $('#warn-auction').on('click', function() {
        socket.sendCommand('auction_warn_cmd', 'auction warn', function() {
            toastr.success('Warning users that the auction is about to close.');
        });
    });

    // Warn reset.
    $('#reset-auction').on('click', function() {
        socket.sendCommand('auction_reset_cmd', 'auction reset', function() {
            toastr.success('The auction has been reset.');

            $('#open-or-close-auction').html($('<i/>', {
                'class': 'fa fa-unlock-alt'
            })).append('&nbsp; Open').removeClass('btn-warning').addClass('btn-success');
        });
    });
});