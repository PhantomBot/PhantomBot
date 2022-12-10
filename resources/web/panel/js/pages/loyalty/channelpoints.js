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

/* global toastr, swal */

$(function () {
    let commands = [];
    const reloadChannelPoints = function (cb) {
        socket.wsEvent('channelpoints_reload_ws', './handlers/channelPointsHandler.js', null, ['reload'], function () {
            loadChannelPoints(cb);
        });
    };
    const updateChannelPoints = function (data, cb) {
        socket.updateDBValues('channelpoints_update', {
            tables: ['channelPointsSettings'],
            keys: ['commands'],
            values: [JSON.stringify(data)]
        }, function () {
            reloadChannelPoints(cb);
        });
    };
    const findCommand = function (id) {
        for (const command of commands) {
            if (command.id === id) {
                return command;
            }
        }

        return null;
    };
    const loadChannelPoints = function (cb, updateTable) {
        // Query custom commands.
        socket.getDBValues('channelpoints_get', {
            tables: ['channelPointsSettings'],
            keys: ['commands']
        }, function (results) {
            let tableData = [];
            commands = JSON.parse(results.channelPointsSettings);

            if (updateTable !== false) {
                for (const command of commands) {
                    tableData.push([
                        command.title,
                        command.command,
                        $('<div/>', {
                            'class': 'btn-group'
                        }).append($('<button/>', {
                            'type': 'button',
                            'class': 'btn btn-xs btn-danger',
                            'style': 'float: right',
                            'data-commandid': command.id,
                            'html': $('<i/>', {
                                'class': 'fa fa-trash'
                            })
                        })).append($('<button/>', {
                            'type': 'button',
                            'class': 'btn btn-xs btn-warning',
                            'style': 'float: right',
                            'data-commandid': command.id,
                            'html': $('<i/>', {
                                'class': 'fa fa-edit'
                            })
                        })).html()
                    ]);
                }

                // if the table exists, destroy it.
                if ($.fn.DataTable.isDataTable('#channelpointsTable')) {
                    $('#channelpointsTable').DataTable().destroy();
                    // Remove all of the old events.
                    $('#channelpointsTable').off();
                }

                // Create table.
                let table = $('#channelpointsTable').DataTable({
                    'searching': true,
                    'autoWidth': false,
                    'lengthChange': false,
                    'data': tableData,
                    'columnDefs': [
                        {'className': 'default-table', 'orderable': false, 'targets': [2]},
                        {'width': '15%', 'targets': 0}
                    ],
                    'columns': [
                        {'title': 'Reward Title'},
                        {'title': 'Response'},
                        {'title': 'Actions'}
                    ]
                });

                // On delete button.
                table.on('click', '.btn-danger', function () {
                    let command = findCommand($(this).data('commandid'));

                    if (command === null) {
                        reloadChannelPoints();
                        return;
                    }

                    let commandid = command.id;
                    let commandtitle = command.title;

                    // Ask the user if he want to remove the command.
                    helpers.getConfirmDeleteModal('channelpoints_modal_remove', 'Are you sure you want to remove the reward for ' + commandtitle + '?', true,
                            'Successfully removed the reward for ' + commandtitle, function () {
                                let data = [];
                                for (const command of commands) {
                                    if (command.id !== commandid) {
                                        data.push(structuredClone(command));
                                    }
                                }
                                updateChannelPoints(data);
                            });
                });

                // On edit button.
                table.on('click', '.btn-warning', function () {
                    let command = findCommand($(this).data('commandid'));

                    if (command === null) {
                        reloadChannelPoints();
                        return;
                    }

                    let commandid = command.id;
                    let commandtitle = command.title;

                    helpers.getModal('edit-channelpoints-reward', 'Edit Channel Points Reward', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                            .append(helpers.getInputGroup('redemption-name', 'text', 'Redemption Title', '', commandtitle, 'Title of the linked Channel Points redemption. This cannot be edited.', true))
                            // Append a text box for the command response.
                            .append(helpers.getTextAreaGroup('redemption-response', 'text', 'Response', '', command.command,
                                    'Response of the redemption. Uses command tags with labels: twitch, commandevent, and noevent. Available command parameters: (1) the '
                                    + 'redeeming user\'s login name, (2) the redeeming user\'s display name, (3) the reward input box text (if used)')), function () {
                        let redemptionResponse = $('#redemption-response');

                        // Handle each input to make sure they have a value.
                        switch (false) {
                            case helpers.handleInputString(redemptionResponse):
                                break;
                            default:
                                let data = [];
                                for (const command of commands) {
                                    if (command.id !== commandid) {
                                        data.push(structuredClone(command));
                                    } else {
                                        let newdata = structuredClone(command);
                                        newdata.command = redemptionResponse;
                                        data.push(newdata);
                                    }
                                }
                                updateChannelPoints(data, function () {
                                    $('#edit-channelpoints-reward').modal('hide');
                                    // Tell the user the command was edited.
                                    toastr.success('Successfully edited the reward for ' + commandtitle);
                                });
                        }
                    }).modal('toggle');
                });
            }

            if (cb !== undefined && cb !== null) {
                cb();
            }
        });
    };

    const init = function () {
        // Check if the module is enabled.
        socket.getDBValue('channelpoints_module', 'modules', './handlers/channelPointsHandler.js', function (e) {
            // If the module is off, don't load any data.
            if (helpers.handleModuleLoadUp('channelpointsModule', e.modules)) {
                $('#addcpreward-button').attr('disabled', null);
                $('#refreshcprewards-button').attr('disabled', null);
                loadChannelPoints();
            } else {
                $('#addcpreward-button').attr('disabled', 'disabled');
                $('#refreshcprewards-button').attr('disabled', 'disabled');
            }
        });
    };
    init();

    const validateRedemptionSelect = function (obj) {
        if (obj.attr('disabled') !== undefined) {
            return 'The selected redemption is already linked to another reward.';
        } else if (obj.val().trim().length === 0) {
            return 'You must select a redemption to link.';
        }
        return null;
    };

    // Toggle for the module.
    $('#channelpointsModuleToggle').on('change', function () {
        // Enable the module then query the data.
        socket.sendCommandSync('channelpoints_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./handlers/channelPointsHandler.js', init);
    });

    $('#refreshcprewards-button').on('click', function () {
        loadChannelPoints();
    });

    // Add command button.
    $('#addcpreward-button').on('click', function () {
        loadChannelPoints(function () {
            socket.custom('channelpointslist', 'channelpoints_edit', null, function (e) {
                let commandSelector = null;

                if (e.hasOwnProperty('data') && e.data.length > 0) {
                    let options = [];
                    for (const redemption of e.data) {
                        let entry = {};
                        entry._id = redemption.id;
                        entry.name = redemption.title;
                        entry.value = redemption.id;

                        if (findCommand(redemption.id) !== null) {
                            entry.name += ' (Already Linked)';
                            entry.disabled = true;
                        }

                        options.push(entry);
                    }

                    commandSelector = helpers.getDropdownGroup('redemption-select', 'Linked Redemption', '', options, 'The linked Channel Points redemption.');
                }

                if (e.hasOwnProperty('error') || e.data.length === 0 || commandSelector === null) {
                    commandSelector = helpers.getInputGroup('redemption-select', 'text', 'Linked Redemption', '', 'Unable to Load. Manual Setup Enabled',
                            'Unable to load the Channel Points redemption list, using manual linking mode.', true);
                }

                // Get advance modal from our util functions in /utils/helpers.js
                helpers.getModal('add-channelpoints-reward', 'Add Channel Points Reward', 'Save', $('<form/>', {
                    'role': 'form'
                })
                        .append(commandSelector)
                        .append($('<div/>', {
                            'class': 'box box-warning'
                        }).append($('<div/>', {
                            'class': 'box-header',
                            'html': 'Warning'
                        })).append($('<div/>', {
                            'class': 'box-body',
                            'html': 'When the response is parsed, the <b>(sender)</b> will be the bot and will have <b>ADMIN</b> permissions'
                        }))
                                )
                        .append($('<div/>', {
                            'class': 'box box-info'
                        }).append($('<div/>', {
                            'class': 'box-body',
                            'html': 'Use the command tag <b>(1)</b> to get the login name (sender) of the redeeming user<br />'
                                    + 'Use the command tag <b>(2)</b> to get the display name of the redeeming user<br />'
                                    + 'Use the command tag <b>(3)</b> to get the text of the redemption input box, if used'
                        }))
                                )
                        // Append a text box for the command response.
                        .append(helpers.getTextAreaGroup('redemption-response', 'text', 'Response', 'Thanks for being cool @(2)! (command doSomethingCool)',
                                '', 'Response of the redemption. Uses command tags with labels: twitch, commandevent, and noevent. Available command parameters: (1) the '
                                + 'redeeming user\'s login name, (2) the redeeming user\'s display name, (3) the reward input box text (if used)')), function () {
                    let redemptionSelect = $('#redemption-select'),
                            redemptionResponse = $('#redemption-response');

                    // Handle each input to make sure they have a value.
                    switch (false) {
                        case helpers.handleInput(redemptionSelect.find(':selected'), validateRedemptionSelect):
                        case helpers.handleInputString(redemptionResponse):
                            break;
                        default:
                            if (e.hasOwnProperty('error') || e.data.length === 0) {
                                socket.updateDBValues('channelpoints_manual', {
                                    tables: ['channelPointsSettings'],
                                    keys: ['commandConfig'],
                                    values: [redemptionResponse]
                                }, function () {
                                    reloadChannelPoints(function () {
                                        swal({
                                            'title': 'Manual Channel Points Reward Configuration',
                                            'text': 'PhantomBot was unable to load the list of available Channel Points redemptions.'
                                                    + 'To complete the setup of this reward, please redeem the desired redemption to link on Twitch, '
                                                    + 'then click the Refresh button to reload the rewards list',
                                            'icon': 'warning'
                                        }).then(function () {
                                            reloadChannelPoints();
                                        });
                                    });
                                });
                            } else {
                                let data = [];
                                for (const command of commands) {
                                    data.push(structuredClone(command));
                                }
                                data.push({
                                    'id': redemptionSelect.find(':selected').val(),
                                    'title': redemptionSelect.find(':selected').text(),
                                    'command': redemptionResponse.val()
                                });
                                updateChannelPoints(data, function () {
                                    $('#add-channelpoints-reward').modal('hide');
                                    // Tell the user the command was edited.
                                    toastr.success('Successfully added the reward for ' + redemptionSelect.find(':selected').text());
                                });
                            }
                    }
                }).modal('toggle');
            });
        }, false);
    });
});
