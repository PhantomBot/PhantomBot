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
    socket.getDBValue('ranks_module_toggle', 'modules', './systems/ranksSystem.js', function(e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp('ranksCustomModule', e.modules)) {
            return;
        }

        // Get all ranks.
        socket.getDBTableValues('custom_get_ranks', 'viewerRanks', function(results) {
            let tableData = [];

            for (let i = 0; i < results.length; i++) {
                tableData.push([
                    results[i].key,
                    results[i].value,
                    $('<div/>', {
                        'class': 'btn-group'
                    }).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger',
                        'style': 'float: right',
                        'data-user': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-trash'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning',
                        'style': 'float: right',
                        'data-user': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-edit'
                        })
                    })).html()
                ]);
            }

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#ranksCustomTable')) {
                $('#ranksCustomTable').DataTable().destroy();
                // Remove all of the old events.
                $('#ranksCustomTable').off();
            }

            // Create table.
            let table = $('#ranksCustomTable').DataTable({
                'searching': true,
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    { 'className': 'default-table', 'orderable': false, 'targets': 2 },
                    { 'width': '45%', 'targets': 0 }
                ],
                'columns': [
                    { 'title': 'Username' },
                    { 'title': 'Rank' },
                    { 'title': 'Actions' }
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                let username = $(this).data('user'),
                    row = $(this).parents('tr');

                helpers.getConfirmDeleteModal('custom_rank_modal_remove', 'Are you sure you want to remove ' + username + '\'s custom rank?', true,
                    'You\'ve successfully removed ' + username + '\'s custom rank!', function() {
                    // Delete the rank
                    socket.removeDBValue('rm_custom_rank', 'viewerRanks', username, function() {
                        // Remove the table row.
                        table.row(row).remove().draw(false);
                    });
                });
            });

            // On edit button.
            table.on('click', '.btn-warning', function() {
                let user = $(this).data('user'),
                    t = $(this);

                // Get the rank info.
                socket.getDBValue('rank_get_name', 'viewerRanks', user, function(e) {
                    helpers.getModal('edit-set-rank', 'Edit User Rank', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                    // Append alias name.
                    .append(helpers.getInputGroup('rank-user', 'text', 'Username', '', user, 'Name of the user for the rank to be set on.'))
                    // Append alias.
                    .append(helpers.getInputGroup('rank-name', 'text', 'Rank', '', e.viewerRanks, 'Rank name to give to the user')), function() {// Callback once we click the save button.
                        let rankUser = $('#rank-user'),
                            rankName = $('#rank-name');

                        // Make sure all boxes have an input.
                        switch (false) {
                            case helpers.handleInputString(rankUser):
                            case helpers.handleInputString(rankName):
                                break;
                            default:
                                socket.removeDBValue('del_rank_custom', 'viewerRanks', user, function() {
                                    // Add the rank.
                                    socket.updateDBValue('edit_rank_custom', 'viewerRanks', rankUser.val().toLowerCase(), rankName.val(), function() {
                                        // Update the table name.
                                        t.parents('tr').find('td:eq(0)').text(rankUser.val().toLowerCase());
                                        // Update the table hours.
                                        t.parents('tr').find('td:eq(1)').text(rankName.val());
                                        // Close the modal.
                                        $('#edit-set-rank').modal('hide');
                                        // Alert the user.
                                        toastr.success('Successfully edited the user rank!');
                                    });
                                });
                        }
                    }).modal('toggle');
                });
            });
        });
    });
});


// Function that handlers the loading of events.
$(function() {
    $('#ranksCustomModuleToggle').on('change', function() {
        // Enable the module then query the data.
        socket.sendCommandSync('ranks_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/ranksSystem.js', run);
    });

    // Add user rank button.
    $('#rank-user-button').on('click', function() {
        helpers.getModal('set-rank', 'Set User Rank', 'Save', $('<form/>', {
            'role': 'form'
        })
        // Append alias name.
        .append(helpers.getInputGroup('rank-user', 'text', 'Username', 'PhantomBot', '', 'Name of the user for the rank to be set on.'))
        // Append alias.
        .append(helpers.getInputGroup('rank-name', 'text', 'Rank', 'Bot', '', 'Rank name to give to the user.')), function() {// Callback once we click the save button.
            let rankUser = $('#rank-user'),
                rankName = $('#rank-name');

            // Make sure all boxes have an input.
            switch (false) {
                case helpers.handleInputString(rankUser):
                case helpers.handleInputString(rankName):
                    break;
                default:
                    // Add the rank.
                    socket.updateDBValue('set_rank_custom', 'viewerRanks', rankUser.val().toLowerCase(), rankName.val(), function() {
                        // Update the table name.
                        run();
                        // Close the modal.
                        $('#set-rank').modal('hide');
                        // Alert the user.
                        toastr.success('Successfully added the rank to the user!');
                    });
            }
        }).modal('toggle');
    });

    // Rank settings button.
    $('#rank-settings-button').on('click', function() {
        socket.getDBValues('get_custom_rank_settings', {
            tables: ['settings', 'settings'],
            keys: ['rankEligableTime', 'rankEligableCost']
        }, true, function(e) {
            helpers.getModal('settings-rank', 'Rank Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Append alias name.
            .append(helpers.getInputGroup('rank-cost', 'number', 'Rank Cost', '', e.rankEligableCost, 'How much a custom rank will cost for a user.'))
            // Append alias.
            .append(helpers.getInputGroup('rank-time', 'number', 'Rank Hours', '', e.rankEligableTime, 'How many hours a user needs before they can buy a custom rank.')), function() {// Callback once we click the save button.
                let rankCost = $('#rank-cost'),
                    rankTime = $('#rank-time');

                // Make sure all boxes have an input.
                switch (false) {
                    case helpers.handleInputNumber(rankCost):
                    case helpers.handleInputNumber(rankTime):
                        break;
                    default:
                        // Add the rank.
                        socket.updateDBValues('update_custom_rank_Settings', {
                            tables: ['settings', 'settings'],
                            keys: ['rankEligableTime', 'rankEligableCost'],
                            values: [rankTime.val(), rankCost.val()]
                        }, function() {
                            // Close the modal.
                            $('#settings-rank').modal('hide');
                            // Alert the user.
                            toastr.success('Successfully updated rank settings');
                        });
                }
            }).modal('toggle');
        });
    });
});
