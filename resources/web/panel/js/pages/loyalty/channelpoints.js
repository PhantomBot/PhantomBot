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
    let redeemables = [];
    let managed = [];

    const reloadRewards = function (cb) {
        socket.wsEvent('channelpoints_reload_rewards_ws', './handlers/channelPointsHandler.js', null, ['reward-reload'], function () {
            loadRewards(cb);
        }, true);
    };

    const updateRewards = function (data, cb) {
        socket.updateDBValues('channelpoints_rewards_update', {
            tables: ['channelPointsSettings'],
            keys: ['commands'],
            values: [JSON.stringify(data)]
        }, function () {
            reloadRewards(cb);
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

    const reloadRedeemables = function (cb) {
        socket.wsEvent('channelpoints_reload_redeemables_ws', './handlers/channelPointsHandler.js', null, ['redeemables-reload-managed'], function () {
            loadRedeemables(cb);
        }, true);
    };

    const findRedeemable = function (id) {
        for (const redeemable of redeemables) {
            if (redeemable.id === id) {
                return redeemable;
            }
        }

        return null;
    };

    const validateRedemptionSelect = function (obj) {
        if (obj.attr('disabled') !== undefined) {
            return 'The selected redeemable is already linked to another reward.';
        } else if (obj.val().trim().length === 0) {
            return 'You must select a redeemable to link.';
        }
        return null;
    };

    const handleInputColor = function (obj) {
        return helpers.handleInput(obj, function (obj) {
            let matched = obj.val().match(/^#[0-9A-F]{6}$/);

            if (obj.val().length > 0 && matched === null) {
                return 'Please enter a valid color code in hex format (for example, #9147FF).';
            }

            return null;
        });
    };

    const handleToggledInputString = function (enabled, obj) {
        if (enabled === 'true') {
            return helpers.handleInputString(obj);
        }

        return null;
    };

    const handleToggledInputNumber = function (enabled, obj, min, max) {
        if (enabled === 'true') {
            return helpers.handleInputNumber(obj, min, max);
        }

        return null;
    };

    const loadRewards = function (cb, updateTable) {
        // Query custom commands.
        socket.getDBValues('channelpoints_get', {
            tables: ['channelPointsSettings'],
            keys: ['commands']
        }, function (results) {
            commands = JSON.parse(results.channelPointsSettings);

            if (updateTable !== false) {
                let tableData = [];
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
                if ($.fn.DataTable.isDataTable('#channelpointsRewardsTable')) {
                    $('#channelpointsRewardsTable').DataTable().destroy();
                    // Remove all of the old events.
                    $('#channelpointsRewardsTable').off();
                }

                // Create table.
                let table = $('#channelpointsRewardsTable').DataTable({
                    'searching': true,
                    'autoWidth': false,
                    'lengthChange': false,
                    'data': tableData,
                    'columnDefs': [
                        {'className': 'default-table', 'orderable': false, 'targets': [2]},
                        {'width': '20%', 'targets': 0}
                    ],
                    'columns': [
                        {'title': 'Linked Redeemable'},
                        {'title': 'Response'},
                        {'title': 'Actions'}
                    ]
                });

                // On delete button.
                table.on('click', '.btn-danger', function () {
                    let command = findCommand($(this).data('commandid'));

                    if (command === null) {
                        reloadRewards();
                        return;
                    }

                    helpers.getConfirmDeleteModal('channelpoints_reward_modal_remove', 'Are you sure you want to remove the reward for ' + command.title + '?', true,
                            'Successfully removed the reward for ' + command.title, function () {
                                let data = [];
                                for (const ccommand of commands) {
                                    if (ccommand.id !== command.id) {
                                        data.push(structuredClone(ccommand));
                                    }
                                }
                                updateRewards(data);
                            });
                });

                // On edit button.
                table.on('click', '.btn-warning', function () {
                    let command = findCommand($(this).data('commandid'));

                    if (command === null) {
                        reloadRewards();
                        return;
                    }

                    helpers.getModal('edit-channelpoints-reward', 'Edit Channel Points Reward', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                            .append(helpers.getInputGroup('redemption-name', 'text', 'Redeemable Title', '', command.title, 'Title of the linked Channel Points redeemable. This cannot be edited.', true))
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
                                'html': 'See the <a href="https://phantombot.dev/guides/#guide=content/commands/command-variables&jumpto=global-command-tags_channelpoints&channel='
                                        + helpers.getBranch() + '" target="_blank">channelpoints</a> section of the command tags guide for tags that allow '
                                        + 'access to the redemption data'
                            })))
                            .append(helpers.getTextAreaGroup('redemption-response', 'text', 'Response', '', command.command,
                                    'Response of the redemption. Uses command tags with labels: twitch, commandevent, noevent, and channelpointsevent')), function () {
                        let redemptionResponse = $('#redemption-response');

                        switch (false) {
                            case helpers.handleInputString(redemptionResponse):
                                break;
                            default:
                                let data = [];
                                for (const ccommand of commands) {
                                    if (ccommand.id !== command.id) {
                                        data.push(structuredClone(ccommand));
                                    } else {
                                        let newdata = structuredClone(ccommand);
                                        newdata.command = redemptionResponse;
                                        data.push(newdata);
                                    }
                                }
                                updateRewards(data, function () {
                                    $('#edit-channelpoints-reward').modal('hide');
                                    toastr.success('Successfully edited the reward for ' + command.title);
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

    const loadRedeemables = function (cb, updateTable) {
        socket.query('channelpointslist', 'channelpoints_redeemables', null, function (e1) {
            socket.wsEvent('channelpoints_redeemable_get_managed_ws', './handlers/channelPointsHandler.js', null, ['redeemable-get-managed'], function (e2) {
                if (e1.hasOwnProperty('data') && e1.data.length > 0) {
                    redeemables = structuredClone(e1.data);
                } else {
                    redeemables = [];
                }
                if (e2.hasOwnProperty('data') && e2.data.length > 0) {
                    managed = structuredClone(e2.data);
                } else {
                    managed = [];
                }

                if (updateTable !== false) {
                    let tableData = [];
                    for (const redeemable of redeemables) {
                        tableData.push([
                            redeemable.title,
                            redeemable.cost,
                            redeemable.is_enabled ? 'Yes' : 'No',
                            redeemable.is_paused ? 'Yes' : 'No',
                            redeemable.is_user_input_required ? 'Yes' : 'No',
                            $('<div/>', {
                                'class': 'btn-group'
                            }).append($('<button/>', {
                                'type': 'button',
                                'class': 'btn btn-xs btn-danger',
                                'style': 'float: right',
                                'data-redeemableid': redeemable.id,
                                'data-toggle': managed.includes(redeemable.id) ? null : 'tooltip',
                                'disabled': managed.includes(redeemable.id) ? null : 'disabled',
                                'title': managed.includes(redeemable.id) ? null : 'Can not delete redeemables that weren\'t created by the bot',
                                'html': $('<i/>', {
                                    'class': 'fa fa-trash'
                                })
                            })).append($('<button/>', {
                                'type': 'button',
                                'class': 'btn btn-xs btn-warning',
                                'style': 'float: right',
                                'data-redeemableid': redeemable.id,
                                'data-toggle': managed.includes(redeemable.id) ? null : 'tooltip',
                                'disabled': managed.includes(redeemable.id) ? null : 'disabled',
                                'title': managed.includes(redeemable.id) ? null : 'Can not edit redeemables that weren\'t created by the bot',
                                'html': $('<i/>', {
                                    'class': 'fa fa-edit'
                                })
                            })).append($('<button/>', {
                                'type': 'button',
                                'class': 'btn btn-xs btn-primary',
                                'style': 'float: right',
                                'data-redeemableid': redeemable.id,
                                'data-toggle': managed.includes(redeemable.id) ? null : 'tooltip',
                                'disabled': managed.includes(redeemable.id) ? null : 'disabled',
                                'title': managed.includes(redeemable.id) ? null : 'Can not edit redeemables that weren\'t created by the bot',
                                'html': $('<i/>', {
                                    'class': 'fa fa-' + (redeemable.is_paused ? 'play' : 'pause')
                                })
                            })).html()
                        ]);
                    }

                    // if the table exists, destroy it.
                    if ($.fn.DataTable.isDataTable('#channelpointsRedeemablesTable')) {
                        $('#channelpointsRedeemablesTable').DataTable().destroy();
                        // Remove all of the old events.
                        $('#channelpointsReedeemablesTable').off();
                    }

                    // Create table.
                    let table = $('#channelpointsRedeemablesTable').DataTable({
                        'searching': true,
                        'autoWidth': false,
                        'lengthChange': false,
                        'data': tableData,
                        'columnDefs': [
                            {'className': 'default-table', 'orderable': false, 'targets': [5]},
                            {'className': 'max-width', 'width': '1px', 'targets': [1, 2, 3, 4]}
                        ],
                        'columns': [
                            {'title': 'Title'},
                            {'title': 'Cost'},
                            {'title': 'Enabled'},
                            {'title': 'Paused'},
                            {'title': 'Has Input'},
                            {'title': 'Actions'}
                        ]
                    });

                    // On play/pause button.
                    table.on('click', '.btn-primary', function () {
                        let redeemable = findRedeemable($(this).data('redeemableid'));

                        if (redeemable === null) {
                            loadRedeemables();
                            return;
                        }

                        let paused = !redeemable.is_paused;

                        socket.wsEvent('channelpoints_redeemable_pause_ws', './handlers/channelPointsHandler.js', null,
                                [
                                    'redeemable-update-managed', redeemable.id, '', '', '', paused ? 'true' : 'false', '', '', '', '', '', '', '', '', '', ''
                                ], function (e) {
                            loadRedeemables();
                            if (e.success) {
                                toastr.success('Successfully ' + (paused ? '' : 'un') + 'paused redeemable ' + redeemable.title + ' (' + redeemable.id + ')');
                            } else {
                                toastr.error('Failed to ' + (paused ? '' : 'un') + 'pause redeemable: ' + e.error);
                            }
                        }, true);
                    });

                    // On delete button.
                    table.on('click', '.btn-danger', function () {
                        let redeemable = findRedeemable($(this).data('redeemableid'));

                        if (redeemable === null) {
                            loadRedeemables();
                            return;
                        }

                        helpers.getConfirmDeleteModal('channelpoints_redeemable_modal_remove', 'Are you sure you want to remove the redeemable ' + redeemable.title + '?', true,
                                'Successfully removed the redeemable ' + redeemable.title, function () {
                                    socket.wsEvent('channelpoints_redeemable_delete_ws', './handlers/channelPointsHandler.js', null, ['redeemable-delete-managed', redeemable.id], function () {
                                        loadRedeemables();
                                    }, true);
                                });
                    });

                    // On edit button.
                    table.on('click', '.btn-warning', function () {
                        alert('Not yet implemented');
                        return;
                        let command = findCommand($(this).data('commandid'));

                        if (command === null) {
                            reloadRewards();
                            return;
                        }

                        let commandid = command.id;
                        let commandtitle = command.title;

                        helpers.getModal('edit-channelpoints-reward', 'Edit Channel Points Reward', 'Save', $('<form/>', {
                            'role': 'form'
                        })
                                .append(helpers.getInputGroup('redemption-name', 'text', 'Redeemable Title', '', commandtitle, 'Title of the linked Channel Points redeemable. This cannot be edited.', true))
                                // Append a text box for the command response.
                                .append(helpers.getTextAreaGroup('redemption-response', 'text', 'Response', '', command.command,
                                        'Response of the redemption. Uses command tags with labels: twitch, commandevent, and noevent. Available command parameters: (1) the '
                                        + 'redeeming user\'s login name, (2) the redeeming user\'s display name, (3) the redeemable input box text (if used)')), function () {
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
                                    updateRewards(data, function () {
                                        $('#edit-channelpoints-reward').modal('hide');
                                        // Tell the user the command was edited.
                                        toastr.success('Successfully edited the reward for ' + commandtitle);
                                    });
                            }
                        }).modal('toggle');
                        $('[data-toggle="tooltip"]').tooltip();
                    });
                }
                if (cb !== undefined && cb !== null) {
                    cb();
                }
            }, true);
        });
    };

    const init = function () {
        // Check if the module is enabled.
        socket.getDBValue('channelpoints_module', 'modules', './handlers/channelPointsHandler.js', function (e) {
            // If the module is off, don't load any data.
            if (helpers.handleModuleLoadUp('channelpointsModule', e.modules)) {
                $('#addcpreward-button').attr('disabled', null);
                $('#refreshcprewards-button').attr('disabled', null);
                $('#addcpredeemable-button').attr('disabled', null);
                $('#convertcpredeemable-button').attr('disabled', null);
                $('#refreshcpredeemables-button').attr('disabled', null);
                loadRewards();
                loadRedeemables();
            } else {
                $('#addcpreward-button').attr('disabled', 'disabled');
                $('#refreshcprewards-button').attr('disabled', 'disabled');
                $('#addcpredeemable-button').attr('disabled', 'disabled');
                $('#convertcpredeemable-button').attr('disabled', 'disabled');
                $('#refreshcpredeemables-button').attr('disabled', 'disabled');
            }
        });
    };
    init();

    // Toggle for the module.
    $('#channelpointsModuleToggle').on('change', function () {
        // Enable the module then query the data.
        socket.sendCommandSync('channelpoints_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./handlers/channelPointsHandler.js', init);
    });

    $('#refreshcprewards-button').on('click', function () {
        loadRewards();
    });

    // Add command button.
    $('#addcpreward-button').on('click', function () {
        loadRewards(function () {
            loadRedeemables(function () {
                let commandSelector = null;

                if (redeemables.length > 0) {
                    let options = [];
                    for (const redemption of redeemables) {
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

                    commandSelector = helpers.getDropdownGroup('redemption-select', 'Linked Redeemable', '', options, 'The linked Channel Points redeemable.');
                }

                if (redeemables.length === 0 || commandSelector === null) {
                    commandSelector = helpers.getInputGroup('redemption-select', 'text', 'Linked Redeemable', '', 'Unable to Load. Manual Setup Enabled',
                            'Unable to load the Channel Points redeemable list, using manual linking mode.', true);
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
                            'html': 'See the <a href="https://phantombot.dev/guides/#guide=content/commands/command-variables&jumpto=global-command-tags_channelpoints&channel='
                                    + helpers.getBranch() + '" target="_blank">channelpoints</a> section of the command tags guide for tags that allow '
                                    + 'access to the redemption data'
                        })))
                        // Append a text box for the command response.
                        .append(helpers.getTextAreaGroup('redemption-response', 'text', 'Response', 'Thanks for being cool @(cpusername)! (command doSomethingCool)',
                                '', 'Response of the redemption. Uses command tags with labels: twitch, commandevent, noevent, and channelpointsevent')), function () {
                    let redemptionSelect = $('#redemption-select'),
                            redemptionResponse = $('#redemption-response');

                    // Handle each input to make sure they have a value.
                    switch (false) {
                        case helpers.handleInput(redemptionSelect.find(':selected'), validateRedemptionSelect):
                        case helpers.handleInputString(redemptionResponse):
                            break;
                        default:
                            if (redeemables.length === 0) {
                                socket.updateDBValues('channelpoints_manual', {
                                    tables: ['channelPointsSettings'],
                                    keys: ['commandConfig'],
                                    values: [redemptionResponse]
                                }, function () {
                                    reloadRewards(function () {
                                        swal({
                                            'title': 'Manual Channel Points Reward Configuration',
                                            'text': 'PhantomBot was unable to load the list of available Channel Points redeemables.'
                                                    + 'To complete the setup of this reward, please redeem the desired redeemable to link on Twitch, '
                                                    + 'then click the Refresh button to reload the rewards list',
                                            'icon': 'warning'
                                        }).then(function () {
                                            reloadRewards();
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
                                updateRewards(data, function () {
                                    $('#add-channelpoints-reward').modal('hide');
                                    // Tell the user the command was edited.
                                    toastr.success('Successfully added the reward for ' + redemptionSelect.find(':selected').text());
                                });
                            }
                    }
                }).modal('toggle');
            }, false);
        }, false);
    });

    $('#refreshcpredeemables-button').on('click', function () {
        reloadRedeemables();
    });

    $('#convertcpredeemable-button').on('click', function () {
        alert('Not yet implemented');
    });

    $('addcpredeemable-button').on('click', function () {
        helpers.getAdvanceModal('add-channelpoints-redeemable', 'Add Redeemable', 'Save', $('<form/>', {
            'role': 'form'
        })
                .append(helpers.getInputGroup('redeemable-title', 'text', 'Title', 'Do Something Cool', '',
                        'The custom redeemable\'s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the '
                        + 'broadcaster\'s custom redeemables.'))
                .append(helpers.getInputGroup('redeemable-cost', 'number', 'Cost', '50', '50',
                        'The cost of the redeemable, in Channel Points. The minimum is 1 point.'))
                .append($('<div/>', {
                    'class': 'collapse',
                    'id': 'advance-collapse',
                    'html': $('<form/>', {
                        'role': 'form'
                    })
                            .append(helpers.getCheckBox('redeemable-enabled', true, 'Enabled',
                                    'Whether the redeemable is enabled. Viewers see only enabled redeemable.'))
                            .append(helpers.getInputGroup('redeemable-bgcolor', 'text', 'Background Color', '#9147FF', '',
                                    'The background color to use for the redeemable. Specify the color using Hex format (for example, #9147FF).'))
                            .append(helpers.getCheckBox('redeemable-input-required', false, 'Is User Input Required',
                                    'Whether the user needs to enter information when redeeming the redeemable.'))
                            .append(helpers.getInputGroup('redeemable-prompt', 'text', 'Prompt', 'Enter the Really Cool Phrase', '',
                                    'The prompt shown to the viewer when they redeem the redeemable. The prompt is limited to a maximum of 200 '
                                    + 'characters.', true))
                            .append(helpers.getCheckBox('redeemable-max-stream-enabled', false, 'Is Max-Per-Stream Enabled',
                                    'Whether to limit the maximum number of redemptions allowed per live stream.'))
                            .append(helpers.getInputGroup('redeemable-max-stream', 'number', 'Max-Per-Stream', '1', '1',
                                    'The maximum number of redemptions allowed per live stream. The minimum value is 1.', true))
                            .append(helpers.getCheckBox('redeemable-max-user-stream-enabled', false, 'Is Max-Per-User-Per-Stream Enabled',
                                    'Whether to limit the maximum number of redemptions allowed per user per stream.'))
                            .append(helpers.getInputGroup('redeemable-max-user-stream', 'number', 'Max-Per-User-Per-Stream', '1', '1',
                                    'The maximum number of redemptions allowed per user per stream. The minimum value is 1.', true))
                            .append(helpers.getCheckBox('redeemable-cooldown-enabled', false, 'Is Global Cooldown Enabled',
                                    'Whether to apply a cooldown period between redemptions.'))
                            .append(helpers.getInputGroup('redeemable-cooldown', 'number', 'Global Cooldown', '1', '1',
                                    'The cooldown period, in seconds. The minimum value is 1; however, the minimum value is 60 for it to be shown '
                                    + 'in the Twitch UX.', true))
                            .append(helpers.getCheckBox('redeemable-fulfill', false, 'Should Redemptions Skip Request Queue',
                                    'Whether redemptions should be set to fulfilled status immediately when a redeemable is redeemed.'))
                })), function () {
            let redeemableTitle = $('#redeemable-title'),
                    redeemableCost = $('#redeemable-cost'),
                    redeemableEnabled = $('#redeemable-enabled').is(':checked') ? 'true' : 'false',
                    redeemableBgcolor = $('#redeemable-bgcolor'),
                    redeemableInputRequired = $('#redeemable-input-required').is(':checked') ? 'true' : 'false',
                    redeemablePrompt = $('#redeemable-prompt'),
                    redeemableMaxStreamEnabled = $('redeemable-max-stream-enabled').is(':checked') ? 'true' : 'false',
                    redeemableMaxStream = $('redeemable-max-stream'),
                    redeemableMaxUserStreamEnabled = $('redeemable-max-user-stream-enabled').is(':checked') ? 'true' : 'false',
                    redeemableMaxUserStream = $('redeemable-max-user-stream'),
                    redeemableCooldownEnabled = $('redeemable-cooldown-enabled').is(':checked') ? 'true' : 'false',
                    redeemableCooldown = $('redeemable-cooldown'),
                    redeemableFulfill = $('redeemable-fulfill').is(':checked') ? 'true' : 'false';

            switch (false) {
                case helpers.handleInputString(redeemableTitle):
                case helpers.handleInputNumber(redeemableCost, 1):
                case handleInputColor(redeemableBgcolor):
                case handleToggledInputString(redeemableInputRequired, redeemablePrompt):
                case handleToggledInputNumber(redeemableMaxStreamEnabled, redeemableMaxStream, 1):
                case handleToggledInputNumber(redeemableMaxUserStreamEnabled, redeemableMaxUserStream, 1):
                case handleToggledInputNumber(redeemableCooldownEnabled, redeemableCooldown, 1):
                    break;
                default:
                    socket.wsEvent('channelpoints_redeemable_add_ws', './handlers/channelPointsHandler.js', null,
                            [
                                'redeemable-add-managed', redeemableTitle.val(), redeemableCost.val(), redeemableEnabled, redeemableBgcolor.val(),
                                redeemableInputRequired, redeemablePrompt.val(), redeemableMaxStreamEnabled, redeemableMaxStream.val(),
                                redeemableMaxUserStreamEnabled, redeemableMaxUserStream.val(), redeemableCooldownEnabled, redeemableCooldown.val(),
                                redeemableFulfill
                            ],
                            function (e) {
                                loadRedeemables();
                                $('#add-channelpoints-redeemable').modal('hide');
                                if (e.success) {
                                    toastr.success('Successfully added redeemable ' + redeemableTitle.val() + ' (' + e.id + ')');
                                } else {
                                    toastr.error('Failed to add redeemable: ' + e.error);
                                }
                            }, true);
            }
        }).modal('toggle');

        $('#redeemable-input-required').on('click', function () {
            $('#redeemable-prompt').prop('disabled', !$(this).is(':checked'));
        });

        $('#redeemable-max-stream-enabled').on('click', function () {
            $('#redeemable-max-stream').prop('disabled', !$(this).is(':checked'));
        });

        $('#redeemable-max-user-stream-enabled').on('click', function () {
            $('#redeemable-max-user-stream').prop('disabled', !$(this).is(':checked'));
        });

        $('#redeemable-cooldown-enabled').on('click', function () {
            $('#redeemable-cooldown').prop('disabled', !$(this).is(':checked'));
        });

        $('[data-toggle="tooltip"]').tooltip();
    });
});
