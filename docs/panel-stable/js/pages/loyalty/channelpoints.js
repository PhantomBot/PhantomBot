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

/* global toastr, swal */

$(function () {
    let commands = [];
    let redeemables = [];
    let managed = [];
    let convert = null;

    const reloadRewards = function (cb) {
        socket.wsEvent('channelpoints_reload_rewards_ws', './handlers/channelPointsHandler.js', null, ['reward-reload'], function () {
            loadRewards(cb);
        }, true, true);
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
        socket.wsEvent('channelpoints_reload_redeemables_ws', './handlers/channelPointsHandler.js', null, ['redeemable-reload-managed'], function () {
            loadRedeemables(cb);
        }, true, true);
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

    const handleToggledInputNumber = function (enabled, obj, min, max) {
        if (enabled === 'true') {
            return helpers.handleInputNumber(obj, min, max);
        }

        return null;
    };

    const toString = function (obj) {
        if (obj === undefined) {
            return 'undefined';
        } else if (obj === null) {
            return 'null';
        } else if (typeof (obj) === 'number') {
            return '' + obj;
        } else if (typeof (obj) === 'boolean') {
            return obj ? 'true' : 'false';
        }

        return obj;
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

                if ($.fn.DataTable.isDataTable('#channelpointsRewardsTable')) {
                    $('#channelpointsRewardsTable').DataTable().clear().rows.add(tableData).invalidate().draw(false);
                    return;
                }

                // Create table.
                let table = $('#channelpointsRewardsTable').DataTable({
                    'searching': true,
                    'autoWidth': false,
                    'lengthChange': true,
                    'ordering': true,
                    'order': [[0, 'asc']],
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

                    helpers.getConfirmDeleteModal('channelpoints_reward_modal_remove', 'Are you sure you want to remove the reward for '
                            + command.title + '?', true,
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
                            .append(helpers.getInputGroup('redemption-id', 'text', 'Redeemable Id', '', command.id, 'Id of the linked '
                                    + 'Channel Points redeemable.', true))
                            .append(helpers.getInputGroup('redemption-name', 'text', 'Redeemable Title', '', command.title, 'Title of the linked '
                                    + 'Channel Points redeemable. This cannot be edited.', true))
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
                                        newdata.command = redemptionResponse.val();
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
                    if (e1.hasOwnProperty('error')) {
                        toastr.error('HTTP ' + e1.status + ': ' + e1.message);
                    } else {
                        let tableData = [];
                        for (const redeemable of redeemables) {
                            let buttons = [];
                            if (managed.includes(redeemable.id)) {
                                buttons.push($('<button/>', {
                                    'type': 'button',
                                    'class': 'btn btn-xs btn-danger',
                                    'style': 'float: right',
                                    'data-redeemableid': redeemable.id,
                                    'html': $('<i/>', {
                                        'class': 'fa fa-trash'
                                    })
                                }));
                            }
                            buttons.push($('<button/>', {
                                'type': 'button',
                                'class': 'btn btn-xs btn-' + (managed.includes(redeemable.id) ? 'warning' : 'info'),
                                'style': 'float: right',
                                'data-redeemableid': redeemable.id,
                                'html': $('<i/>', {
                                    'class': 'fa fa-' + (managed.includes(redeemable.id) ? 'edit' : 'eye')
                                })
                            }));
                            if (managed.includes(redeemable.id)) {
                                buttons.push($('<button/>', {
                                    'type': 'button',
                                    'class': 'btn btn-xs btn-primary',
                                    'style': 'float: right',
                                    'data-redeemableid': redeemable.id,
                                    'html': $('<i/>', {
                                        'class': 'fa fa-' + (redeemable.is_paused ? 'play' : 'pause')
                                    })
                                }));
                            }
                            tableData.push([
                                redeemable.title,
                                redeemable.cost,
                                redeemable.is_enabled ? 'Yes' : 'No',
                                redeemable.is_paused ? 'Yes' : 'No',
                                redeemable.is_user_input_required ? 'Yes' : 'No',
                                $('<div/>', {
                                    'class': 'btn-group'
                                }).append(buttons).html()
                            ]);
                        }

                        if ($.fn.DataTable.isDataTable('#channelpointsRedeemablesTable')) {
                            $('#channelpointsRedeemablesTable').DataTable().clear().rows.add(tableData).invalidate().draw(false);
                            return;
                        }

                        // Create table.
                        let table = $('#channelpointsRedeemablesTable').DataTable({
                            'searching': true,
                            'autoWidth': false,
                            'lengthChange': true,
                            'ordering': true,
                            'order': [[0, 'asc']],
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
                                        'redeemable-update-managed', redeemable.id, null, null, null, paused ? 'true' : 'false', null, null, null, null,
                                        null, null, null, null, null, null
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

                            helpers.getConfirmDeleteModal('channelpoints_redeemable_modal_remove', 'Are you sure you want to remove the redeemable '
                                    + redeemable.title + '?', true, '', function () {
                                        socket.wsEvent('channelpoints_redeemable_delete_ws', './handlers/channelPointsHandler.js', null,
                                                ['redeemable-delete-managed', redeemable.id], function (e) {
                                            loadRedeemables();
                                            if (e.success) {
                                                return {
                                                    'message': 'Successfully deleted redeemable ' + redeemable.title + ' (' + redeemable.id + ')',
                                                    'icon': 'success'
                                                };
                                            } else {
                                                return {
                                                    'message': 'Failed to delete redeemable (' + redeemable.id + '): ' + e.error,
                                                    'icon': 'error'
                                                };
                                            }
                                        }, true, true);
                                    });
                        });

                        // On edit button.
                        table.on('click', '.btn-warning', function () {
                            let redeemable = findRedeemable($(this).data('redeemableid'));

                            if (redeemable === null) {
                                loadRedeemables();
                                return;
                            }

                            let modal = helpers.getAdvanceModal('edit-channelpoints-redeemable', 'Edit Redeemable', 'Save', $('<form/>', {
                                'role': 'form'
                            })
                                    .append(helpers.getInputGroup('redeemable-id', 'text', 'Id', '', redeemable.id, 'Id of the custom redeemable.', true))
                                    .append(helpers.getInputGroup('redeemable-title', 'text', 'Title', 'Do Something Cool', redeemable.title,
                                            'The custom redeemable\'s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the '
                                            + 'broadcaster\'s custom redeemables.'))
                                    .append(helpers.getInputGroup('redeemable-cost', 'number', 'Cost', '50', redeemable.cost,
                                            'The cost of the redeemable, in Channel Points. The minimum is 1 point.'))
                                    .append($('<div/>', {
                                        'class': 'collapse',
                                        'id': 'advance-collapse',
                                        'html': $('<form/>', {
                                            'role': 'form'
                                        })
                                                .append($('<div/>', {
                                                    'class': 'box box-info'
                                                }).append($('<div/>', {
                                                    'class': 'box-body',
                                                    'html': 'Due to limitations imposed by Twitch, the icons for the redeemable can not be edited by this dialog. The '
                                                            + 'icons must manually be edited from the <a href="https://dashboard.twitch.tv/viewer-rewards/channel-points/rewards" '
                                                            + 'target="_blank">Creator Dashboard</a> after the redeemable is edited<span id="redeemable-images"></span>'
                                                })))
                                                .append(helpers.getCheckBox('redeemable-enabled', redeemable.is_enabled, 'Enabled',
                                                        'Whether the redeemable is enabled. Viewers see only enabled redeemable.'))
                                                .append(helpers.getCheckBox('redeemable-paused', redeemable.is_paused, 'Paused',
                                                        'Whether the redeemable is currently paused. Viewers can\'t redeem paused redeemables.'))
                                                .append(helpers.getInputGroup('redeemable-bgcolor', 'text', 'Background Color', '#9147FF', redeemable.background_color || '',
                                                        'The background color to use for the redeemable. Specify the color using Hex format (for example, #9147FF).'))
                                                .append(helpers.getCheckBox('redeemable-input-required', redeemable.is_user_input_required, 'Is User Input Required',
                                                        'Whether the user needs to enter information when redeeming the redeemable.'))
                                                .append(helpers.getTextAreaGroup('redeemable-prompt', 'text', 'Prompt', 'Does something really cool', redeemable.prompt || '',
                                                        'The prompt shown to the viewer when they redeem the redeemable. The prompt is limited to a maximum of 200 '
                                                        + 'characters.'))
                                                .append(helpers.getCheckBox('redeemable-max-stream-enabled', redeemable.max_per_stream_setting.is_enabled,
                                                        'Is Max-Per-Stream Enabled',
                                                        'Whether to limit the maximum number of redemptions allowed per live stream.'))
                                                .append(helpers.getInputGroup('redeemable-max-stream', 'number', 'Max-Per-Stream', '1',
                                                        redeemable.max_per_stream_setting.max_per_stream || '1',
                                                        'The maximum number of redemptions allowed per live stream. The minimum value is 1.',
                                                        redeemable.max_per_stream_setting.is_enabled))
                                                .append(helpers.getCheckBox('redeemable-max-user-stream-enabled', redeemable.max_per_user_per_stream_setting.is_enabled,
                                                        'Is Max-Per-User-Per-Stream Enabled', 'Whether to limit the maximum number of redemptions allowed per user per stream.'))
                                                .append(helpers.getInputGroup('redeemable-max-user-stream', 'number', 'Max-Per-User-Per-Stream', '1',
                                                        redeemable.max_per_user_per_stream_setting.max_per_user_per_stream || '1',
                                                        'The maximum number of redemptions allowed per user per stream. The minimum value is 1.',
                                                        redeemable.max_per_user_per_stream_setting.is_enabled))
                                                .append(helpers.getCheckBox('redeemable-cooldown-enabled', redeemable.global_cooldown_setting.is_enabled,
                                                        'Is Global Cooldown Enabled', 'Whether to apply a cooldown period between redemptions.'))
                                                .append(helpers.getInputGroup('redeemable-cooldown', 'number', 'Global Cooldown', '1',
                                                        redeemable.global_cooldown_setting.global_cooldown_seconds || '1',
                                                        'The cooldown period, in seconds. The minimum value is 1; however, the minimum value is 60 for it to be shown '
                                                        + 'in the Twitch UX.', redeemable.global_cooldown_setting.is_enabled))
                                                .append(helpers.getCheckBox('redeemable-fulfill', redeemable.should_redemptions_skip_request_queue,
                                                        'Should Redemptions Skip Request Queue',
                                                        'Whether redemptions should be set to fulfilled status immediately when a redeemable is redeemed.'))
                                    })), function () {
                                let redeemableTitle = $('#redeemable-title'),
                                        redeemableCost = $('#redeemable-cost'),
                                        redeemableEnabled = $('#redeemable-enabled').is(':checked') ? 'true' : 'false',
                                        redeemablePaused = $('#redeemable-paused').is(':checked') ? 'true' : 'false',
                                        redeemableBgcolor = $('#redeemable-bgcolor'),
                                        redeemableInputRequired = $('#redeemable-input-required').is(':checked') ? 'true' : 'false',
                                        redeemablePrompt = $('#redeemable-prompt'),
                                        redeemableMaxStreamEnabled = $('#redeemable-max-stream-enabled').is(':checked') ? 'true' : 'false',
                                        redeemableMaxStream = $('#redeemable-max-stream'),
                                        redeemableMaxUserStreamEnabled = $('#redeemable-max-user-stream-enabled').is(':checked') ? 'true' : 'false',
                                        redeemableMaxUserStream = $('#redeemable-max-user-stream'),
                                        redeemableCooldownEnabled = $('#redeemable-cooldown-enabled').is(':checked') ? 'true' : 'false',
                                        redeemableCooldown = $('#redeemable-cooldown'),
                                        redeemableFulfill = $('#redeemable-fulfill').is(':checked') ? 'true' : 'false';

                                switch (false) {
                                    case helpers.handleInputString(redeemableTitle, 1, 45):
                                    case helpers.handleInputNumber(redeemableCost, 1):
                                    case handleInputColor(redeemableBgcolor):
                                    case helpers.handleInputString(redeemablePrompt, 0, 200):
                                    case handleToggledInputNumber(redeemableMaxStreamEnabled, redeemableMaxStream, 1):
                                    case handleToggledInputNumber(redeemableMaxUserStreamEnabled, redeemableMaxUserStream, 1):
                                    case handleToggledInputNumber(redeemableCooldownEnabled, redeemableCooldown, 1):
                                        break;
                                    default:
                                        socket.wsEvent('channelpoints_redeemable_edit_ws', './handlers/channelPointsHandler.js', null,
                                                [
                                                    'redeemable-update-managed', redeemable.id, redeemableTitle.val(), redeemableCost.val(),
                                                    redeemableEnabled, redeemablePaused, redeemableBgcolor.val(),
                                                    redeemableInputRequired, redeemablePrompt.val(), redeemableMaxStreamEnabled, redeemableMaxStream.val(),
                                                    redeemableMaxUserStreamEnabled, redeemableMaxUserStream.val(), redeemableCooldownEnabled, redeemableCooldown.val(),
                                                    redeemableFulfill
                                                ],
                                                function (e) {
                                                    loadRedeemables();
                                                    $('#edit-channelpoints-redeemable').modal('hide');
                                                    if (e.success) {
                                                        toastr.success('Successfully edited redeemable ' + redeemableTitle.val() + ' (' + redeemable.id + ')');
                                                    } else {
                                                        toastr.error('Failed to edit redeemable (' + redeemable.id + '): ' + e.error);
                                                    }
                                                }, true, true);
                                }
                            });

                            modal.on('shown.bs.modal', function () {
                                if (redeemable.image !== undefined && redeemable.image !== null) {
                                    let images = [];

                                    if (redeemable.image.url_1x !== undefined && redeemable.image.url_1x !== null) {
                                        images.push($('<span/>', {
                                            'html': '1x',
                                            'style': 'padding-right: 5px;'
                                        }));
                                        images.push($('<img/>', {
                                            'src': redeemable.image.url_1x
                                        }));
                                    }

                                    if (redeemable.image.url_2x !== undefined && redeemable.image.url_2x !== null) {
                                        if (images.length > 0) {
                                            images.push($('<br/>'));
                                        }
                                        images.push($('<span/>', {
                                            'html': '2x',
                                            'style': 'padding-right: 5px;'
                                        }));
                                        images.push($('<img/>', {
                                            'src': redeemable.image.url_2x
                                        }));
                                    }

                                    if (redeemable.image.url_4x !== undefined && redeemable.image.url_4x !== null) {
                                        if (images.length > 0) {
                                            images.push($('<br/>'));
                                        }
                                        images.push($('<span/>', {
                                            'html': '4x',
                                            'style': 'padding-right: 5px;'
                                        }));
                                        images.push($('<img/>', {
                                            'src': redeemable.image.url_4x
                                        }));
                                    }

                                    if (images.length > 0) {
                                        $('#redeemable-images').append($('<br/>')).append($('<br/>')).append($('<span/>')
                                                .append($('<b/>', {
                                                    'html': 'Current Icons'
                                                })).append($('<br/>'))
                                                .append(images)
                                                );
                                    }
                                }

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

                            modal.modal('toggle');
                        });

                        // On view button.
                        table.on('click', '.btn-info', function () {
                            let redeemable = findRedeemable($(this).data('redeemableid'));

                            if (redeemable === null) {
                                loadRedeemables();
                                return;
                            }

                            let modal = helpers.getAdvanceModal('view-channelpoints-redeemable', 'View Redeemable', 'Close', $('<form/>', {
                                'role': 'form'
                            }).append($('<div/>', {
                                'class': 'box box-info'
                            }).append($('<div/>', {
                                'class': 'box-body',
                                'html': 'Since this redeemable was not created by the bot, it can not be edited'
                            }))
                                    )
                                    .append(helpers.getInputGroup('redeemable-id', 'text', 'Id', '', redeemable.id, 'Id of the custom redeemable.', true))
                                    .append(helpers.getInputGroup('redeemable-title', 'text', 'Title', 'Do Something Cool', redeemable.title,
                                            'The custom redeemable\'s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the '
                                            + 'broadcaster\'s custom redeemables.', true))
                                    .append(helpers.getInputGroup('redeemable-cost', 'number', 'Cost', '50', redeemable.cost,
                                            'The cost of the redeemable, in Channel Points. The minimum is 1 point.', true))
                                    .append($('<div/>', {
                                        'class': 'collapse',
                                        'id': 'advance-collapse',
                                        'html': $('<form/>', {
                                            'role': 'form'
                                        })
                                                .append($('<span/>', {
                                                    'id': 'redeemable-images'
                                                }))
                                                .append(helpers.getCheckBox('redeemable-enabled', redeemable.is_enabled, 'Enabled',
                                                        'Whether the redeemable is enabled. Viewers see only enabled redeemable.', true))
                                                .append(helpers.getCheckBox('redeemable-paused', redeemable.is_paused, 'Paused',
                                                        'Whether the redeemable is currently paused. Viewers can\'t redeem paused redeemables.', true))
                                                .append(helpers.getInputGroup('redeemable-bgcolor', 'text', 'Background Color', '#9147FF', redeemable.background_color || '',
                                                        'The background color to use for the redeemable. Specify the color using Hex format (for example, #9147FF).', true))
                                                .append(helpers.getCheckBox('redeemable-input-required', redeemable.is_user_input_required, 'Is User Input Required',
                                                        'Whether the user needs to enter information when redeeming the redeemable.', true))
                                                .append(helpers.getTextAreaGroup('redeemable-prompt', 'text', 'Prompt', 'Does something really cool', redeemable.prompt || '',
                                                        'The prompt shown to the viewer when they redeem the redeemable. The prompt is limited to a maximum of 200 '
                                                        + 'characters.', true))
                                                .append(helpers.getCheckBox('redeemable-max-stream-enabled', redeemable.max_per_stream_setting.is_enabled,
                                                        'Is Max-Per-Stream Enabled',
                                                        'Whether to limit the maximum number of redemptions allowed per live stream.', true))
                                                .append(helpers.getInputGroup('redeemable-max-stream', 'number', 'Max-Per-Stream', '1',
                                                        redeemable.max_per_stream_setting.max_per_stream || '1',
                                                        'The maximum number of redemptions allowed per live stream. The minimum value is 1.', true))
                                                .append(helpers.getCheckBox('redeemable-max-user-stream-enabled', redeemable.max_per_user_per_stream_setting.is_enabled,
                                                        'Is Max-Per-User-Per-Stream Enabled', 'Whether to limit the maximum number of redemptions allowed per user per stream.', true))
                                                .append(helpers.getInputGroup('redeemable-max-user-stream', 'number', 'Max-Per-User-Per-Stream', '1',
                                                        redeemable.max_per_user_per_stream_setting.max_per_user_per_stream || '1',
                                                        'The maximum number of redemptions allowed per user per stream. The minimum value is 1.', true))
                                                .append(helpers.getCheckBox('redeemable-cooldown-enabled', redeemable.global_cooldown_setting.is_enabled,
                                                        'Is Global Cooldown Enabled', 'Whether to apply a cooldown period between redemptions.', true))
                                                .append(helpers.getInputGroup('redeemable-cooldown', 'number', 'Global Cooldown', '1',
                                                        redeemable.global_cooldown_setting.global_cooldown_seconds || '1',
                                                        'The cooldown period, in seconds. The minimum value is 1; however, the minimum value is 60 for it to be shown '
                                                        + 'in the Twitch UX.', true))
                                                .append(helpers.getCheckBox('redeemable-fulfill', redeemable.should_redemptions_skip_request_queue,
                                                        'Should Redemptions Skip Request Queue',
                                                        'Whether redemptions should be set to fulfilled status immediately when a redeemable is redeemed.', true))
                                    })), function () {
                                $('#view-channelpoints-redeemable').modal('hide');
                            });

                            modal.on('shown.bs.modal', function () {
                                if (redeemable.image !== undefined && redeemable.image !== null) {
                                    let images = [];

                                    if (redeemable.image.url_1x !== undefined && redeemable.image.url_1x !== null) {
                                        images.push($('<span/>', {
                                            'html': '1x',
                                            'style': 'padding-right: 5px;'
                                        }));
                                        images.push($('<img/>', {
                                            'src': redeemable.image.url_1x
                                        }));
                                    }

                                    if (redeemable.image.url_2x !== undefined && redeemable.image.url_2x !== null) {
                                        if (images.length > 0) {
                                            images.push($('<br/>'));
                                        }
                                        images.push($('<span/>', {
                                            'html': '2x',
                                            'style': 'padding-right: 5px;'
                                        }));
                                        images.push($('<img/>', {
                                            'src': redeemable.image.url_2x
                                        }));
                                    }

                                    if (redeemable.image.url_4 !== undefined && redeemable.image.url_4x !== null) {
                                        if (images.length > 0) {
                                            images.push($('<br/>'));
                                        }
                                        images.push($('<span/>', {
                                            'html': '4x',
                                            'style': 'padding-right: 5px;'
                                        }));
                                        images.push($('<img/>', {
                                            'src': redeemable.image.url_4x
                                        }));
                                    }

                                    if (images.length > 0) {
                                        $('#redeemable-images').append($('<span/>')
                                                .append($('<b/>', {
                                                    'html': 'Current Icons'
                                                })).append($('<br/>'))
                                                .append(images)
                                                );
                                    }
                                }

                                $('[data-toggle="tooltip"]').tooltip();
                            });

                            modal.modal('toggle');
                        });
                    }
                }

                if (cb !== undefined && cb !== null) {
                    cb();
                }
            }, true, true);
        }, true);
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
        socket.sendCommandSync('channelpoints_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent')
                + ' ./handlers/channelPointsHandler.js', init);
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
        loadRedeemables(function () {
            let redeemableSelector = null;
            let otherHtml = null;

            if (convert !== null && managed.includes(convert.id)) {
                convert = null;
            }

            if (redeemables.length > 0) {
                let options = [];
                let convertfound = false;
                for (const redemption of redeemables) {
                    let entry = {};
                    entry._id = redemption.id;
                    entry.name = redemption.title;
                    entry.value = redemption.id;

                    if (convert !== null && redemption.id === convert.id) {
                        convertfound = true;
                        entry.selected = true;
                    }

                    if (!managed.includes(redemption.id)) {
                        options.push(entry);
                    }
                }

                if (convert !== null && !convertfound) {
                    let entry = {};
                    entry._id = convert.id;
                    entry.name = convert.title;
                    entry.value = convert.id;
                    entry.selected = true;
                    options.push(entry);
                }

                if (options.length > 0) {
                    redeemableSelector = helpers.getDropdownGroup('redemption-select', 'Redeemable to Convert', (convert !== null ? convert.title : ''),
                            options, 'The Channel Points redeemable to convert.');
                }
            }

            if (redeemables.length === 0 || redeemableSelector === null) {
                redeemableSelector = $('<div/>', {
                    'class': 'box box-danger'
                }).append($('<div/>', {
                    'class': 'box-body',
                    'html': 'No convertable redeemables found'
                }));
            } else {
                otherHtml = [
                    $('<div/>', {
                        'class': 'box box-warning'
                    }).append($('<div/>', {
                        'class': 'box-header',
                        'html': 'Warning'
                    })).append($('<div/>', {
                        'class': 'box-body',
                        'html': 'Once step 3 is completed, do not close or navigate away from this page until the conversion is complete. '
                                + 'Closing this dialog is okay, but data on the to-be-converted redeemable may be lost if the entire page is closed or '
                                + 'you navigate away from the page'
                    })),
                    $('<div/>', {
                        'class': 'box box-info'
                    }).append($('<div/>', {
                        'class': 'box-body',
                        'html': 'Anyone with the panel login can use this dialog to perform the conversion, but the broadcaster is required to perform'
                                + ' steps 3 and 6'
                    })),
                    $('<div/>', {
                        'class': 'box box-info'
                    }).append($('<div/>', {
                        'class': 'box-body',
                        'html': 'Due to limitations imposed by Twitch, the icons for the redeemable can not be transferred by this routine. The '
                                + 'icons must manually be added from the <a href="https://dashboard.twitch.tv/viewer-rewards/channel-points/rewards" '
                                + 'target="_blank">Creator Dashboard</a> after the conversion is completed (step 6)'
                    })),
                    $('<div/>', {
                        'class': 'box box-primary'
                    }).append($('<div/>', {
                        'class': 'box-header',
                        'html': 'Instructions'
                    })).append($('<div/>', {
                        'class': 'box-body'
                    }).append($('<ol/>').append(
                            [
                                $('<li/>', {
                                    'html': 'Select a redeemable to convert in the drop-down above'
                                }),
                                $('<li/>', {
                                    'html': 'Click <button class="btn btn-primary btn-sm" type="button" id="start-convert-button" disabled="disabled">'
                                            + '<i class="fa fa-exchange" id="start-convert-icon"></i>&nbsp; Start Conversion</button> to start the conversion process'
                                }),
                                $('<li/>', {
                                    'html': '(Optional) Download the old custom icons for the redeemable, if available: <span id="convert-download-images">no custom icons found</span>'
                                }),
                                $('<li/>', {
                                    'html': 'Delete the redeemable from the <a href="https://dashboard.twitch.tv/viewer-rewards/channel-points/rewards" target="_blank">Creator Dashboard</a> (requires broadcaster)'
                                }),
                                $('<li/>', {
                                    'html': 'Click <button class="btn btn-success btn-sm" type="button" id="finish-convert-button"'
                                            + ' disabled="disabled"><i class="fa fa-exchange" id="finish-convert-icon">'
                                            + '</i>&nbsp; Finish Conversion</button> to finish the conversion process'
                                }),
                                $('<li/>', {
                                    'html': '(Optional) Upload icons for the redeemable from the <a href="https://dashboard.twitch.tv/viewer-rewards/channel-points/rewards" target="_blank">Creator Dashboard</a> (requires broadcaster)'
                                })
                            ])
                            )
                            )
                ];
            }

            // Get advance modal from our util functions in /utils/helpers.js
            let modal = helpers.getModal('convert-channelpoints-redeemble', 'Convert Redeemable', null, $('<form/>', {
                'role': 'form'
            })
                    .append($('<div/>', {
                        'class': 'box box-info'
                    }).append($('<div/>', {
                        'class': 'box-body',
                        'html': 'Converts a Channel Points redeemable created in the Creator Dashboard to one that is managed by the bot via API, '
                                + 'allowing the bot to edit, enable, disable, pause, and unpause the redeemable, as well as mark redemptions '
                                + 'of the redeemable as fulfilled or cancelled'
                    }))
                            )
                    .append(redeemableSelector)
                    .append(otherHtml), null, {'cancelclass': 'btn-primary', 'canceltext': 'Close'});

            if (otherHtml !== null) {
                modal.on('shown.bs.modal', function () {
                    if (convert !== null) {
                        if (convert.image !== undefined && convert.image !== null) {
                            let links = [];

                            if (convert.image.url_1x !== undefined && convert.image.url_1x !== null) {
                                links.push($('<a/>', {
                                    'href': convert.image.url_1x,
                                    'target': '_blank',
                                    'html': '1x'
                                }));
                            }

                            if (convert.image.url_2x !== undefined && convert.image.url_2x !== null) {
                                links.push($('<a/>', {
                                    'href': convert.image.url_2x,
                                    'target': '_blank',
                                    'html': '2x',
                                    'style': links.length > 0 ? 'padding-left: 15px;' : null
                                }));
                            }

                            if (convert.image.url_4x !== undefined && convert.image.url_4x !== null) {
                                links.push($('<a/>', {
                                    'href': convert.image.url_4x,
                                    'target': '_blank',
                                    'html': '4x',
                                    'style': links.length > 0 ? 'padding-left: 15px;' : null
                                }));
                            }

                            if (links.length > 0) {
                                $('#convert-download-images').html('').append(links);
                            }
                        }

                        $('#start-convert-icon').removeClass('fa-spinner').removeClass('fa-exchange').addClass('fa-check');
                        $('#finish-convert-icon').removeClass('fa-spinner').addClass('fa-exchange');
                        $('#start-convert-button').prop('disabled', true);
                        $('#finish-convert-button').prop('disabled', false);
                    }

                    $('#redemption-select').on('change', function () {
                        let val = $('#redemption-select').find(':selected').val();
                        if (val.length > 0) {
                            if (convert === null || convert.id !== val) {
                                $('#start-convert-icon').removeClass('fa-spinner').removeClass('fa-check').addClass('fa-exchange');
                                $('#finish-convert-icon').removeClass('fa-spinner').addClass('fa-exchange');
                                $('#start-convert-button').prop('disabled', false);
                                $('#finish-convert-button').prop('disabled', true);
                            } else {
                                $('#start-convert-icon').removeClass('fa-spinner').removeClass('fa-exchange').addClass('fa-check');
                                $('#finish-convert-icon').removeClass('fa-spinner').addClass('fa-exchange');
                                $('#start-convert-button').prop('disabled', true);
                                $('#finish-convert-button').prop('disabled', false);
                            }
                        } else {
                            $('#start-convert-icon').removeClass('fa-spinner').removeClass('fa-check').addClass('fa-exchange');
                            $('#finish-convert-icon').removeClass('fa-spinner').addClass('fa-exchange');
                            $('#start-convert-button').prop('disabled', true);
                            $('#finish-convert-button').prop('disabled', true);
                        }
                    });
                    $('#start-convert-button').on('click', function () {
                        $('#start-convert-button').prop('disabled', true);
                        convert = findRedeemable($('#redemption-select').find(':selected').val());

                        if (convert === null) {
                            loadRedeemables();
                            $('#convert-channelpoints-redeemble').modal('hide');
                        } else {
                            convert.newid = null;

                            if (convert.image !== undefined && convert.image !== null) {
                                let links = [];

                                if (convert.image.url_1x !== undefined && convert.image.url_1x !== null) {
                                    links.push($('<a/>', {
                                        'href': convert.image.url_1x,
                                        'target': '_blank',
                                        'html': '1x'
                                    }));
                                }

                                if (convert.image.url_2x !== undefined && convert.image.url_2x !== null) {
                                    links.push($('<a/>', {
                                        'href': convert.image.url_2x,
                                        'target': '_blank',
                                        'html': '2x',
                                        'style': links.length > 0 ? 'padding-left: 15px;' : null
                                    }));
                                }

                                if (convert.image.url_4x !== undefined && convert.image.url_4x !== null) {
                                    links.push($('<a/>', {
                                        'href': convert.image.url_4x,
                                        'target': '_blank',
                                        'html': '4x',
                                        'style': links.length > 0 ? 'padding-left: 15px;' : null
                                    }));
                                }

                                if (links.length > 0) {
                                    $('#convert-download-images').html('').append(links);
                                }
                            }

                            if (redeemables.length < 50) {
                                $('#start-convert-icon').removeClass('fa-exchange').removeClass('fa-check').addClass('fa-spinner');
                                $('#finish-convert-icon').removeClass('fa-spinner').addClass('fa-exchange');
                                socket.wsEvent('channelpoints_redeemable_convert_ws', './handlers/channelPointsHandler.js', null,
                                        [
                                            'redeemable-add-managed', 'pbtemp_' + helpers.getRandomString(6), toString(convert.cost), toString(convert.is_enabled),
                                            toString(convert.background_color), toString(convert.is_user_input_required), toString(convert.prompt),
                                            toString(convert.max_per_stream_setting.is_enabled), toString(convert.max_per_stream_setting.max_per_stream),
                                            toString(convert.max_per_user_per_stream_setting.is_enabled), toString(convert.max_per_user_per_stream_setting.max_per_user_per_stream),
                                            toString(convert.global_cooldown_setting.is_enabled), toString(convert.global_cooldown_setting.global_cooldown_seconds),
                                            toString(convert.should_redemptions_skip_request_queue)
                                        ],
                                        function (e) {
                                            if (e.success) {
                                                convert.newid = e.id;
                                            }
                                            $('#start-convert-icon').removeClass('fa-spinner').removeClass('fa-exchange').addClass('fa-check');
                                            $('#finish-convert-icon').removeClass('fa-spinner').addClass('fa-exchange');
                                            $('#finish-convert-button').prop('disabled', false);
                                        }, true, true);
                            } else {
                                $('#start-convert-icon').removeClass('fa-spinner').removeClass('fa-exchange').addClass('fa-check');
                                $('#finish-convert-icon').removeClass('fa-spinner').addClass('fa-exchange');
                                $('#finish-convert-button').prop('disabled', false);
                            }
                        }
                    });

                    $('#finish-convert-button').on('click', function () {
                        $('#redemption-select').prop('disabled', true);
                        $('#start-convert-button').prop('disabled', true);
                        $('#finish-convert-button').prop('disabled', true);
                        $('#finish-convert-icon').removeClass('fa-exchange').addClass('fa-spinner');
                        if (convert === null) {
                            loadRedeemables();
                            $('#convert-channelpoints-redeemble').modal('hide');
                        } else {
                            if (convert.newid === null) {
                                socket.wsEvent('channelpoints_redeemable_convert_ws', './handlers/channelPointsHandler.js', null,
                                        [
                                            'redeemable-add-managed', toString(convert.title), toString(convert.cost), toString(convert.is_enabled),
                                            toString(convert.background_color), toString(convert.is_user_input_required), toString(convert.prompt),
                                            toString(convert.max_per_stream_setting.is_enabled), toString(convert.max_per_stream_setting.max_per_stream),
                                            toString(convert.max_per_user_per_stream_setting.is_enabled), toString(convert.max_per_user_per_stream_setting.max_per_user_per_stream),
                                            toString(convert.global_cooldown_setting.is_enabled), toString(convert.global_cooldown_setting.global_cooldown_seconds),
                                            toString(convert.should_redemptions_skip_request_queue)
                                        ],
                                        function (e) {
                                            let oid = convert.id;
                                            let title = convert.title;
                                            let paused = convert.is_paused;
                                            convert = null;

                                            if (e.success && paused) {
                                                socket.wsEvent('channelpoints_redeemable_convert_pause_ws', './handlers/channelPointsHandler.js', null,
                                                        [
                                                            'redeemable-update-managed', e.id, null, null, null, 'true', null, null, null, null, null,
                                                            null, null, null, null, null
                                                        ], function (e2) {
                                                    let data = [];
                                                    for (const ccommand of commands) {
                                                        if (ccommand.id !== oid) {
                                                            data.push(structuredClone(ccommand));
                                                        } else {
                                                            let newdata = structuredClone(ccommand);
                                                            newdata.id = e.id;
                                                            data.push(newdata);
                                                        }
                                                    }
                                                    updateRewards(data, function () {
                                                        loadRedeemables();
                                                        $('#convert-channelpoints-redeemable').modal('hide');
                                                        if (e2.success) {
                                                            toastr.success('Successfully converted redeemable ' + title + ' (' + e.id + ')');
                                                        } else {
                                                            toastr.error('Failed to transfer paused status to converted redeemable: ' + e2.error);
                                                        }
                                                    });
                                                }, true, true);
                                            } else {
                                                loadRedeemables();
                                                $('#convert-channelpoints-redeemable').modal('hide');
                                                if (e.success) {
                                                    toastr.success('Successfully converted redeemable ' + title + ' (' + e.id + ')');
                                                } else {
                                                    toastr.error('Failed to convert redeemable: ' + e.error);
                                                }
                                            }
                                        }, true, true);
                            } else {
                                socket.wsEvent('channelpoints_redeemable_convert_pause_ws', './handlers/channelPointsHandler.js', null,
                                        [
                                            'redeemable-update-managed', convert.newid, toString(convert.title), null, null, toString(convert.is_paused), null,
                                            null, null, null, null, null, null, null, null, null
                                        ], function (e) {
                                    let oid = convert.id;
                                    let nid = convert.newid;
                                    let title = convert.title;
                                    convert = null;
                                    let data = [];
                                    for (const ccommand of commands) {
                                        if (ccommand.id !== oid) {
                                            data.push(structuredClone(ccommand));
                                        } else {
                                            let newdata = structuredClone(ccommand);
                                            newdata.id = nid;
                                            data.push(newdata);
                                        }
                                    }
                                    updateRewards(data, function () {
                                        loadRedeemables();
                                        $('#convert-channelpoints-redeemable').modal('hide');
                                        if (e.success) {
                                            toastr.success('Successfully converted redeemable ' + title + ' (' + nid + ')');
                                        } else {
                                            toastr.error('Failed to convert redeemable: ' + e.error);
                                        }
                                    });
                                }, true, true);
                            }
                        }
                    });
                });
            }
            modal.modal('toggle');
        }, false);
    });

    $('#addcpredeemable-button').on('click', function () {
        let modal = helpers.getAdvanceModal('add-channelpoints-redeemable', 'Add Redeemable', 'Save', $('<form/>', {
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
                            .append($('<div/>', {
                                'class': 'box box-info'
                            }).append($('<div/>', {
                                'class': 'box-body',
                                'html': 'Due to limitations imposed by Twitch, the icon for the redeemable can not be added by this dialog. The '
                                        + 'icon must manually be added from the <a href="https://dashboard.twitch.tv/viewer-rewards/channel-points/rewards" '
                                        + 'target="_blank">Creator Dashboard</a> after the redeemable is created'
                            })))
                            .append(helpers.getCheckBox('redeemable-enabled', true, 'Enabled',
                                    'Whether the redeemable is enabled. Viewers see only enabled redeemable.'))
                            .append(helpers.getInputGroup('redeemable-bgcolor', 'text', 'Background Color', '#9147FF', '',
                                    'The background color to use for the redeemable. Specify the color using Hex format (for example, #9147FF).'))
                            .append(helpers.getCheckBox('redeemable-input-required', false, 'Is User Input Required',
                                    'Whether the user needs to enter information when redeeming the redeemable.'))
                            .append(helpers.getTextAreaGroup('redeemable-prompt', 'text', 'Prompt', 'Does something really cool', '',
                                    'The prompt shown to the viewer when they redeem the redeemable. The prompt is limited to a maximum of 200 '
                                    + 'characters.'))
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
                    redeemableMaxStreamEnabled = $('#redeemable-max-stream-enabled').is(':checked') ? 'true' : 'false',
                    redeemableMaxStream = $('#redeemable-max-stream'),
                    redeemableMaxUserStreamEnabled = $('#redeemable-max-user-stream-enabled').is(':checked') ? 'true' : 'false',
                    redeemableMaxUserStream = $('#redeemable-max-user-stream'),
                    redeemableCooldownEnabled = $('#redeemable-cooldown-enabled').is(':checked') ? 'true' : 'false',
                    redeemableCooldown = $('#redeemable-cooldown'),
                    redeemableFulfill = $('#redeemable-fulfill').is(':checked') ? 'true' : 'false';

            switch (false) {
                case helpers.handleInputString(redeemableTitle, 1, 45):
                case helpers.handleInputNumber(redeemableCost, 1):
                case handleInputColor(redeemableBgcolor):
                case helpers.handleInputString(redeemablePrompt, 0, 200):
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
                            }, true, true);
            }
        });

        modal.on('shown.bs.modal', function () {
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

        modal.modal('toggle');
    });
});
