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

$(run = function () {
    socket.getDBValues('traffle_module_status_toggle', {
        tables: ['modules', 'traffleSettings', 'traffleState'],
        keys: ['./systems/ticketraffleSystem.js', 'isActive', 'hasDrawn']
    }, true, function (e) {
        if (!helpers.handleModuleLoadUp(['ticketRaffleListModule', 'ticketRaffleModal'], e['./systems/ticketraffleSystem.js'], 'ticketRaffleModuleToggle')) {
            // Remove the chat.
            $('#ticket-raffle-chat').find('iframe').remove();
            return;
        }

        /**
         * @function Loads the raffle list.
         */
        helpers.temp.loadRaffleList = function () {
            socket.getDBTableValues('get_traffle_list', 'ticketsList', function (results) {
                const table = $('#ticket-raffle-table');

                // Remove current data content.
                table.find('tr:gt(0)').remove();

                for (let i = 0; i < results.length; i++) {
                    const tr = $('<tr/>');

                    tr.append($('<td/>', {
                        'html': results[i].key
                    }));

                    tr.append($('<td/>', {
                        'html': results[i].value
                    }));

                    table.append(tr);
                }
            });
        };

        /**
         * @function Loads the raffle winners.
         */
         helpers.temp.loadWinners = function () {
            socket.getDBValue('get_traffle_list', 'traffleresults', 'winner', function (results) {
                const table = $('#ticket-raffle-table');

                $('#traffle-list-title').text("Ticket Raffle Winners");

                // Remove current data content.
                table.find('tr:gt(0)').remove();

                var winners = JSON.parse(results.traffleresults);

                for (let i = 0; i < winners.length; i++) {
                    const tr = $('<tr/>');

                    tr.append($('<td/>', {
                        'html': winners[i]
                    }));

                    table.append(tr);
                }
            });
        };

        if (location.protocol.toLowerCase().startsWith('https') && !(location.port > 0 && location.port !== 443)) {
            // Add Twitch chat.
            $('#ticket-raffle-chat').html($('<iframe/>', {
                'frameborder': '0',
                'scrolling': 'no',
                'style': 'width: 100%; height: 610px;',
                'src': 'https://www.twitch.tv/embed/' + getChannelName() + '/chat' + (helpers.isDark ? '?darkpopout&' : '?') + 'parent=' + location.hostname
            }));
        } else {
            $('#ticket-raffle-chat').html('Due to changes by Twitch, the chat panel can no longer be displayed unless you enable SSL on the PhantomBot Panel and change the baseport to 443. This may not work without root privileges.<br /><br />Alternatively, you can login using the GitHub version of the panel at <a href="https://phantombot.github.io/PhantomBot/">PhantomBot - GitHub.io</a> which gets around this issue.<br /><br />For help setting up SSL, please see <a href="https://phantombot.github.io/PhantomBot/guides/#guide=content/integrations/twitchembeds">this guide</a>.');
            $('#ticket-raffle-chat').addClass('box-body');
        }

        // Load the raffle list.
        helpers.temp.loadRaffleList();

        // Set a timer to auto load the raffle list.
        helpers.setInterval(function () {
            helpers.temp.loadRaffleList();
        }, 5e3);

        // Update the open button to close if the raffle is active.
        // For some reason $.inidb.SetBoolean actually saves an integer...
        if (e['isActive'] === '1') {
            $('#ticket-open-or-close-raffle').html($('<i/>', {
                'class': 'fa fa-lock'
            })).append('&nbsp; Close').removeClass('btn-success').addClass('btn-warning');
        }

        // Raffle is over, winners were already drawn
        if (e['hasDrawn'] === 'true' && e['isActive'] === '0') {
            helpers.clearTimers();
            //We're zooming wait till the table is ready
            $('#ticket-raffle-table').ready(function(){
                helpers.temp.loadWinners();
            });
            $('#ticket-draw-raffle').ready(function(){
                $('#ticket-draw-raffle').prop('disabled', true);
            });            
        }
    });
});

// Function that handlers the loading of events.
$(function () {
    // Module toggle.
    $('#ticketRaffleModuleToggle').on('change', function () {
        socket.sendCommandSync('traffle_system_module_toggle_cmd',
                'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/ticketraffleSystem.js', run);
    });

    // Open/close raffle button.
    $('#ticket-open-or-close-raffle').on('click', function () {
        if ($(this)[0].innerText.trim() === 'Open') {
            const   cost = $('#ticket-raffle-cost'),
                    maxTicket = $('#ticket-raffle-max'),
                    eligibility = $('#ticket-raffle-perm').val(),
                    regLuck = $('#ticket-raffle-reg'),
                    subLuck = $('#ticket-raffle-sub');

            // Make sure the user entered everything right.
            switch (false) {
                case helpers.handleInputNumber(cost, 1):
                case helpers.handleInputNumber(maxTicket, 1):
                case helpers.handleInputNumber(regLuck, 1, 10):
                case helpers.handleInputNumber(subLuck, 1, 10):
                    break;
                default:
                    socket.sendCommand('open_traffle_cmd', 'traffle open ' + maxTicket.val() + ' ' + regLuck.val() + ' ' + subLuck.val() + ' ' + cost.val() + ' ' + eligibility, function () {
                        // Alert the user.
                        toastr.success('Successfully opened the ticket raffle!');
                        // Update the button.
                        $('#ticket-open-or-close-raffle').html($('<i/>', {
                            'class': 'fa fa-lock'
                        })).append('&nbsp; Close').removeClass('btn-success').addClass('btn-warning');
                    });

                $('#traffle-list-title').text("Ticket Raffle List");
                $('#ticket-draw-raffle').prop('disabled', false);

                // Reset the timer in case we destroyed it after the last draw
                timers.push(setInterval(function () {
                    helpers.temp.loadRaffleList();
                }, 5e3));
            }
        } else {
            socket.sendCommandSync('close_traffle_cmd', 'traffle close', function () {
                // Alert the user.
                toastr.success('Successfully closed the ticket raffle!');
                // Reload to remove the winner.
                helpers.temp.loadRaffleList();
                // Update the button.
                $('#ticket-open-or-close-raffle').html($('<i/>', {
                    'class': 'fa fa-unlock-alt'
                })).append('&nbsp; Open').removeClass('btn-warning').addClass('btn-success');
            });
        }
    });

    // Draw raffle button.
    $('#ticket-draw-raffle').on('click', function () {
        const   drawAmount = $('#ticket-raffle-draw'),
                prize = $('#ticket-raffle-prize');
   
        switch (false) {
            case helpers.handleInputNumber(drawAmount, 1):
            case helpers.handleInputNumber(prize, 0):
                break;
            default:
                socket.sendCommandSync('draw_raffle_cmd', 'traffle draw ' + drawAmount.val() + ' ' + prize.val(), function () {
                    // Alert the user.
                    toastr.success('Successfully drew a winner!');

                    helpers.clearTimers();

                    $('#ticket-draw-raffle').prop('disabled', true);
                    $('#ticket-open-or-close-raffle').html($('<i/>', {
                        'class': 'fa fa-unlock-alt'
                    })).append('&nbsp; Open').removeClass('btn-warning').addClass('btn-success');

                    //Show the winners
                    helpers.temp.loadWinners();
                });
        }
    });

    // Reset raffle button.
    $('#ticket-reset-raffle').on('click', function () {
        // Reset values.
        $('#ticket-raffle-max').val('100');
        $('#ticket-raffle-cost').val('1');
        $('#ticket-raffle-reg, #ticket-raffle-sub').val('1');
        $('#ticket-raffle-table').find('tr:gt(0)').remove();
        $('#ticket-raffle-draw').val('1');
        $('#ticket-raffle-prize').val('0');

        $('#ticket-open-or-close-raffle').html($('<i/>', {
            'class': 'fa fa-unlock-alt'
        })).append('&nbsp; Open').removeClass('btn-warning').addClass('btn-success');

        $('#traffle-list-title').val("Ticket Raffle List");

        // Close raffle but don't pick a winner.
        socket.sendCommand('reset_traffle_cmd', 'traffle reset', function () {
            toastr.success('Successfully reset the ticket raffle!');
        });
    });

    // Raffle settings button.
    $('#ticket-raffle-settings').on('click', function () {
        socket.getDBValues('get_traffle_settings', {
            tables: ['settings', 'settings', 'settings'],
            keys: ['tRaffleMSGToggle', 'traffleMessage', 'traffleMessageInterval']
        }, true, function (e) {
            helpers.getModal('traffle-settings-modal', 'Ticket Raffle Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Add the div for the col boxes.
                    .append($('<div/>', {
                        'class': 'panel-group',
                        'id': 'accordion'
                    })
                            // Append first collapsible accordion.
                            .append(helpers.getCollapsibleAccordion('main-1', 'Timed Message Settings', $('<form/>', {
                                'role': 'form'
                            })
                                    // Append interval box for the message
                                    .append(helpers.getInputGroup('msg-timer', 'number', 'Message Interval (Minutes)', '', e['traffleMessageInterval'],
                                            'How often the raffle message is said in chat while a raffle is active.'))
                                    // Append message box for the message
                                    .append(helpers.getTextAreaGroup('msg-msg', 'text', 'Raffle Message', '', e['traffleMessage'],
                                            'What message is said at every interval while the raffle is active. Tags: (amount) and (entries)'))))
                            // Append second collapsible accordion.
                            .append(helpers.getCollapsibleAccordion('main-2', 'Extra Settings', $('<form/>', {
                                'role': 'form'
                            })
                                    // Add toggle for warning messages.
                                    .append(helpers.getDropdownGroup('warning-msg', 'Enable Warning Messages', (e['tRaffleMSGToggle'] === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                                            'If warning messages should be said in chat when a user already entered, or doesn\'t have enough points.'))))),
                    function () {
                        let raffleTimer = $('#msg-timer'),
                                raffleMessage = $('#msg-msg'),
                                warningMsg = $('#warning-msg').find(':selected').text() === 'Yes';

                        switch (false) {
                            case helpers.handleInputNumber(raffleTimer):
                            case helpers.handleInputString(raffleMessage):
                                break;
                            default:
                                socket.updateDBValues('update_traffle_settings_2', {
                                    tables: ['settings', 'settings', 'settings'],
                                    keys: ['tRaffleMSGToggle', 'traffleMessage', 'traffleMessageInterval'],
                                    values: [warningMsg, raffleMessage.val(), raffleTimer.val()]
                                }, function () {
                                    socket.sendCommand('raffle_reload_cmd', 'reloadtraffle', function () {
                                        // Close the modal.
                                        $('#traffle-settings-modal').modal('toggle');
                                        // Warn the user.
                                        toastr.success('Successfully updated ticket raffle settings!');
                                    });
                                });
                        }
                    }).modal('toggle');
        });
    });
});
