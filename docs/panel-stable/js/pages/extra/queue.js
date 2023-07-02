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
    socket.getDBValues('queue_module', {
        tables: ['modules', 'queueSettings'],
        keys: ['./systems/queueSystem.js', 'isActive']
    }, true, function (e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp(['queueModule', 'queueListModule'], e['./systems/queueSystem.js'], 'queueModuleToggle')) {
            // Remove the chat.
            $('#queue-chat').find('iframe').remove();
            return;
        } else {
            if (location.protocol.toLowerCase().startsWith('https') && !(location.port > 0 && location.port !== 443)) {
                // Add Twitch chat.
                $('#queue-chat').html($('<iframe/>', {
                    'frameborder': '0',
                    'scrolling': 'no',
                    'style': 'width: 100%; height: 532px;',
                    'src': 'https://www.twitch.tv/embed/' + getChannelName() + '/chat' + (helpers.isDark ? '?darkpopout&' : '?') + 'parent=' + location.hostname
                }));
            } else {
                $('#queue-chat').html('Due to changes by Twitch, the chat panel can no longer be displayed unless you enable SSL on the PhantomBot Panel and change the baseport to 443. This may not work without root privileges.<br /><br />Alternatively, you can login using the GitHub version of the panel at <a href="https://phantombot.dev/">PhantomBot</a> which gets around this issue.<br /><br />For help setting up SSL, please see <a href="https://phantombot.dev/guides/#guide=content/integrations/twitchembeds&channel=' + helpers.getBranch() + '">this guide</a>.');
                $('#queue-chat').addClass('box-body');
            }
        }

        // Update the open button to close if the queue is active.
        if (e['isActive'] === 'true') {
            $('#open-or-close-queue').html($('<i/>', {
                'class': 'fa fa-lock'
            })).append('&nbsp; Close').removeClass('btn-success').addClass('btn-warning');
        }

        // Function that updates the queue list.
        helpers.temp.updateQueueList = function () {
            // Get queue list.
            socket.getDBTableValues('get_queue_list', 'queue', function (results) {
                const table = $('#queue-table');

                const trim = function (username) {
                    if (username.length > 15) {
                        return username.slice(0, 15) + '...';
                    } else {
                        return username;
                    }
                };

                // Sort.
                results.sort(function (a, b) {
                    return parseInt(JSON.parse(a.value).position) - parseInt(JSON.parse(b.value).position);
                });

                // Remove current data content.
                table.find('tr:gt(0)').remove();

                for (let i = 0; i < results.length; i++) {
                    const json = JSON.parse(results[i].value),
                            tr = $('<tr/>');

                    // Add position.
                    tr.append($('<td/>', {
                        'html': json.position
                    }));

                    // Add name.
                    tr.append($('<td/>', {
                        'html': trim(json.username),
                        'data-toggle': 'tooltip',
                        'title': json.username
                    }));

                    // Add gamer tag.
                    tr.append($('<td/>', {
                        'html': (json.tag.length === 0 ? 'None' : trim(json.tag)),
                        'data-toggle': 'tooltip',
                        'title': (json.tag.length === 0 ? 'None' : json.tag)
                    }));

                    // Add the del button.
                    tr.append($('<td/>', {
                        'html': $('<button/>', {
                            'type': 'button',
                            'class': 'btn btn-xs btn-danger',
                            'style': 'float: right',
                            'html': $('<i/>', {
                                'class': 'fa fa-trash'
                            }),
                            'click': function () {
                                socket.wsEvent('rm_queue_user', './systems/queueSystem.js', null,
                                        ['remove', results[i].key], helpers.temp.updateQueueList);
                            }
                        })
                    }));

                    // Add to the table.
                    table.append(tr);
                }
            });
        };

        helpers.temp.updateQueueList();
    });
});

// Function that handlers the loading of events.
$(function () {
    const QUEUE_SCRIPT = './systems/queueSystem.js';
    let canUpdate = true;

    $('#queue-perm').append(helpers.getDropdownGroup('queue-permission', 'User Level', helpers.getGroupNameById(7), helpers.getPermGroupNames()));

    /*
     * @function Clears the input boxes of the queue.
     */
    const clearQueueInput = function () {
        $('#queue-title').val('');
        $('#queue-cost, #queue-size').val('0');
        $('#queue-permission').val(helpers.getGroupNameById(7));
    };

    // Toggle for the module.
    $('#queueModuleToggle').on('change', function () {
        // Enable the module then query the data.
        socket.sendCommandSync('queue_module_toggle_cmd',
                'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/queueSystem.js', run);
    });

    // Queue open/close button.
    $('#open-or-close-queue').on('click', function () {
        if ($(this)[0].innerText.trim() === 'Open') {
            let title = $('#queue-title'),
                    cost = $('#queue-cost'),
                    size = $('#queue-size'),
                    permission = $('#queue-permission').find(':selected').text();

            switch (false) {
                case helpers.handleInputString(title):
                case helpers.handleInputNumber(cost, 0):
                case helpers.handleInputNumber(size, 0):
                    break;
                default:
                    socket.sendCommand('queue_permisison_update', 'permcomsilent joinqueue ' + helpers.getGroupIdByName(permission, true), function () {
                        socket.updateDBValue('queue_command_cost', 'pricecom', 'joinqueue', cost.val(), function () {
                            socket.wsEvent('queue_open_ws', QUEUE_SCRIPT, null, ['open', size.val(), title.val()], function () {
                                toastr.success('Successfully opened the queue!');
                                // Update the button.
                                $('#open-or-close-queue').html($('<i/>', {
                                    'class': 'fa fa-lock'
                                })).append('&nbsp; Close').removeClass('btn-success').addClass('btn-warning');
                            });
                        });
                    });
            }
        } else {
            socket.wsEvent('close_queue_ws', QUEUE_SCRIPT, null, ['close'], function () {
                toastr.success('Successfully closed the queue!');
                clearQueueInput();
                // Update the button.
                $('#open-or-close-queue').html($('<i/>', {
                    'class': 'fa fa-unlock-alt'
                })).append('&nbsp; Open').removeClass('btn-warning').addClass('btn-success');
            });
        }
    });

    // Clear queue command.
    $('#reset-queue').on('click', function () {
        socket.wsEvent('clear_queue_ws', QUEUE_SCRIPT, null, ['clear'], function () {
            toastr.success('Successfully cleared the queue!');
            clearQueueInput();
            helpers.temp.updateQueueList();
        });
    });

    // Draw users command.
    $('#draw-queue').on('click', function () {
        helpers.getModal('queue-draw-users', 'Draw Users', 'Draw', $('<form/>', {
            'role': 'form'
        })
                // Append amount to draw
                .append(helpers.getInputGroup('draw-amount', 'number', 'Number of Users to Pick', '', '1', 'The amount of users to be drawn from the queue.')),
                // Callback.
                        function () {
                            let amount = $('#draw-amount');

                            switch (false) {
                                case helpers.handleInputNumber(amount, 1, 5):
                                    break;
                                default:
                                    socket.wsEvent('draw_queue_users', QUEUE_SCRIPT, null, ['pick', amount.val()], function () {
                                        // Alert the user.
                                        toastr.success('Drew ' + amount.val() + ' users from the queue!');
                                        // Update the list.
                                        helpers.temp.updateQueueList();
                                        // Close the modal.
                                        $('#queue-draw-users').modal('toggle');
                                    });
                            }
                        }).modal('toggle');
            });

    // Draw random users command.
    $('#random-queue').on('click', function () {
        helpers.getModal('queue-random-users', 'Draw Random Users', 'Draw Random', $('<form/>', {
            'role': 'form'
        })
                // Append amount to draw
                .append(helpers.getInputGroup('draw-amount', 'number', 'Number of Users to Pick', '', '1', 'The amount of users to be drawn from the queue.')),
                // Callback.
                        function () {
                            let amount = $('#draw-amount');

                            switch (false) {
                                case helpers.handleInputNumber(amount, 1, 5):
                                    break;
                                default:
                                    socket.wsEvent('random_queue_users', QUEUE_SCRIPT, null, ['random', amount.val()], function () {
                                        // Alert the user.
                                        toastr.success('Drew ' + amount.val() + ' random users from the queue!');
                                        // Update the list.
                                        helpers.temp.updateQueueList();
                                        // Close the modal.
                                        $('#queue-random-users').modal('toggle');
                                    });
                            }
                        }).modal('toggle');
            });

    // Handle mouse over on queue list.
    $('#queueTable').on('mouseenter mouseleave', function (event) {
        canUpdate = event.type === 'mouseleave';
    });

    // Update every 5 seconds.
    helpers.setInterval(function () {
        if (canUpdate) {
            helpers.temp.updateQueueList();
        }
    }, 5e3);
});
