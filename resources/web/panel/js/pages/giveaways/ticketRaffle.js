/*
 * Copyright (C) 2016-2020 phantom.bot
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

$(run = function() {
    socket.getDBValues('traffle_module_status_toggle', {
        tables: ['modules', 'traffleSettings'],
        keys: ['./systems/ticketraffleSystem.js', 'isActive']
    }, true, function(e) {
        if (!helpers.handleModuleLoadUp(['ticketRaffleListModule', 'ticketRaffleModal'], e['./systems/ticketraffleSystem.js'], 'ticketRaffleModuleToggle')) {
            // Remove the chat.
            $('#ticket-raffle-chat').find('iframe').remove();
            return;
        }

        // Update the open button to close if the raffle is active.
        if (e['isActive'] === 'true') {
            $('#ticket-open-or-close-raffle').html($('<i/>', {
                'class': 'fa fa-lock'
            })).append('&nbsp; Close').removeClass('btn-success').addClass('btn-warning');
        }

        /**
         * @function Loads the raffle list.
         */
        helpers.temp.loadRaffleList = function() {
            socket.getDBTableValues('get_traffle_list', 'ticketsList', function(results) {
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

        if (location.protocol.toLowerCase().startsWith('https') && !(location.port > 0 && location.port !== 443)) {
        // Add Twitch chat.
        $('#ticket-raffle-chat').html($('<iframe/>', {
            'frameborder': '0',
            'scrolling': 'no',
            'style': 'width: 100%; height: 610px;',
                'src': 'https://www.twitch.tv/embed/' + getChannelName() + '/chat' + (helpers.isDark ? '?darkpopout&' : '?') + 'parent=' + location.hostname
        }));
        } else {
            $('#ticket-raffle-chat').html('Aufgrund von Änderungen durch Twitch kann das Chat-Panel nicht mehr angezeigt werden, es sei denn, du aktivierst SSL im PhantomBot-Panel und änderst den Baseport auf 443. Dies funktioniert möglicherweise nicht ohne Root-Privilegien.<br /><br />Alternativ können Sie sich mit der GitHub-Version des Panels bei <a href="https://phantombot.github.io/PhantomBot/">PhantomBot - GitHub.io</a> anmelden, die dieses Problem umgeht.<br /><br />Hilfe beim Einrichten von SSL finden Sie in <a href="https://phantombot.github.io/PhantomBot/guides/#guide=content/twitchembeds">diesem Handbuch</a>.');
            $('#ticket-raffle-chat').addClass('box-body');
        }

        // Load the raffle list.
        helpers.temp.loadRaffleList();

        // Set a timer to auto load the raffle list.
        helpers.setInterval(function() {
            helpers.temp.loadRaffleList();
        }, 5e3);
    });
});

// Function that handlers the loading of events.
$(function() {
    // Module toggle.
    $('#ticketRaffleModuleToggle').on('change', function() {
        socket.sendCommandSync('traffle_system_module_toggle_cmd',
            'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/ticketraffleSystem.js', run);
    });

    // Open/close raffle button.
    $('#ticket-open-or-close-raffle').on('click', function() {
        if ($(this)[0].innerText.trim() === 'Öffnen') {
            const cost = $('#ticket-raffle-cost'),
                maxTicket = $('#ticket-raffle-max'),
                elegibility = $('#ticket-raffle-perm').val(),
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
                    socket.sendCommand('open_traffle_cmd', 'traffle open ' + maxTicket.val() + ' ' + regLuck.val() + ' ' +  subLuck.val() + ' ' + cost.val() + ' ' + elegibility, function() {
                        // Alert the user.
                        toastr.success('Die Ticketverlosung wurde erfolgreich eröffnet!');
                        // Update the button.
                        $('#ticket-open-or-close-raffle').html($('<i/>', {
                            'class': 'fa fa-lock'
                        })).append('&nbsp; Close').removeClass('btn-success').addClass('btn-warning');
                    });
            }
        } else {
            socket.sendCommandSync('close_traffle_cmd', 'traffle close', function() {
                // Alert the user.
                toastr.success('Die Ticketverlosung wurde erfolgreich beendet!');
                // Reload to remove the winner.
                helpers.temp.loadRaffleList();
                // Update the button.
                $('#ticket-open-or-close-raffle').html($('<i/>', {
                    'class': 'fa fa-unlock-alt'
                })).append('&nbsp; Öffnen').removeClass('btn-warning').addClass('btn-success');
            });
        }
    });

    // Draw raffle button.
    $('#ticket-draw-raffle').on('click', function() {
        socket.sendCommandSync('draw_rraffle_cmd', 'traffle draw', function() {
            // Alert the user.
            toastr.success('Ein Gewinner wurde erfolgreich gezogen!');
            // Reload to remove the winner.
            helpers.temp.loadRaffleList();
        });
    });

    // Reset raffle button.
    $('#ticket-reset-raffle').on('click', function() {
        // Reset values.
        $('#ticket-raffle-max').val('100');
        $('#ticket-raffle-cost').val('1');
        $('#ticket-raffle-reg, #ticket-raffle-sub').val('1');
        $('#ticket-raffle-table').find('tr:gt(0)').remove();

        $('#ticket-open-or-close-raffle').html($('<i/>', {
            'class': 'fa fa-unlock-alt'
        })).append('&nbsp; Öffnen').removeClass('btn-warning').addClass('btn-success');

        // Close raffle but don't pick a winner.
        socket.sendCommand('reset_traffle_cmd', 'traffle reset', function() {
            toastr.success('Die Ticketverlosung erfolgreich zurücksetzen!');
        });
    });

    // Raffle settings button.
    $('#ticket-raffle-settings').on('click', function() {
        socket.getDBValues('get_traffle_settings', {
            tables: ['settings', 'settings', 'settings'],
            keys: ['tRaffleMSGToggle', 'traffleMessage', 'traffleMessageInterval']
        }, true, function(e) {
            helpers.getModal('traffle-settings-modal', 'Ticketverlosungseinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the div for the col boxes.
            .append($('<div/>', {
                'class': 'panel-group',
                'id': 'accordion'
            })
            // Append first collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-1', 'Zeitgesteuerte Nachrichteneinstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Append interval box for the message
                .append(helpers.getInputGroup('msg-timer', 'number', 'Nachrichtenintervall (Minuten)', '', e['traffleMessageInterval'],
                    'Wie oft die Verlosungsnachricht in den Chat gesendet werden soll, während eine Verlosung aktiv ist.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('msg-msg', 'text', 'Verlosungsnachricht', '', e['traffleMessage'],
                    'Die Nachricht wird in jedem Intervall gesendet, während die Verlosung aktiv ist. Tags: (amount) und (entries)'))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Zusätzliche Einstellungen',  $('<form/>', {
                    'role': 'form'
                })
            // Add toggle for warning messages.
                .append(helpers.getDropdownGroup('warning-msg', 'Warnmeldungen aktivieren', (e['tRaffleMSGToggle'] === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn Warnmeldungen in den Chat gesendet werden sollen, wenn ein Benutzer bereits eingetragen ist oder nicht genügend Punkte hat.'))))),
            function() {
                let raffleTimer = $('#msg-timer'),
                    raffleMessage = $('#msg-msg'),
                    warningMsg = $('#warning-msg').find(':selected').text() === 'Ja';

                switch (false) {
                    case helpers.handleInputNumber(raffleTimer):
                    case helpers.handleInputString(raffleMessage):
                        break;
                    default:
                        socket.updateDBValues('update_traffle_settings_2', {
                            tables: ['settings', 'settings', 'settings'],
                            keys: ['tRaffleMSGToggle', 'traffleMessage', 'traffleMessageInterval'],
                            values: [warningMsg, raffleMessage.val(), raffleTimer.val()]
                        }, function() {
                            socket.sendCommand('raffle_reload_cmd', 'reloadtraffle', function() {
                                // Close the modal.
                                $('#traffle-settings-modal').modal('toggle');
                                // Warn the user.
                                toastr.success('Ticket-Verlosungseinstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });
});
