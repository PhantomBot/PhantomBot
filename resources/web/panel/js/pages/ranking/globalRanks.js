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
        if (!helpers.handleModuleLoadUp('ranksModule', e.modules)) {
            return;
        }

        // Get all ranks.
        socket.getDBTableValues('global_get_ranks', 'ranksMapping', function(results) {
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
                        'data-rank': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-trash'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning',
                        'style': 'float: right',
                        'data-rank': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-edit'
                        })
                    })).html()
                ]);
            }

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#ranksTable')) {
                $('#ranksTable').DataTable().destroy();
                // Remove all of the old events.
                $('#ranksTable').off();
            }

            // Create table.
            let table = $('#ranksTable').DataTable({
                'searching': true,
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    { 'className': 'default-table', 'orderable': false, 'targets': 2 },
                    { 'width': '45%', 'targets': 0 }
                ],
                'columns': [
                    { 'title': 'Hours' },
                    { 'title': 'Rank' },
                    { 'title': 'Actions' }
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                let rankHours = $(this).data('rank'),
                    row = $(this).parents('tr'),
                    rankName = row.find('td:eq(1)').text();

                // Ask if the user wants to remove the rank.
                helpers.getConfirmDeleteModal('global_rank_modal_remove', 'Are you sure you want to remove the "' + rankName + '" rank?', true,
                    'You\'ve successfully removed the "' + rankName + '" rank!', function() {
                    // Delete the rank
                    socket.removeDBValue('rm_global_rank', 'ranksMapping', rankHours, function() {
                        // Reload the rank table in the bot.
                        socket.sendCommand('rm_global_rank_cmd', 'rankreloadtable', function() {
                            // Remove the table row.
                            table.row(row).remove().draw(false);
                        });
                    });
                });
            });

            // On edit button.
            table.on('click', '.btn-warning', function() {
                let rank = $(this).data('rank'),
                    t = $(this);

                // Get the rank info.
                socket.getDBValue('rank_get_name', 'ranksMapping', rank, function(e) {
                    helpers.getModal('edit-rank', 'Edit Rank', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                    // Rank name
                    .append(helpers.getInputGroup('rank-name', 'text', 'Rank', '', e.ranksMapping, 'Name of the rank.'))
                    // Rank hours
                    .append(helpers.getInputGroup('rank-hours', 'number', 'Hours', '', rank, 'Number of hours before a user gets this rank.')), function() {// Callback once we click the save button.
                        let rankName = $('#rank-name'),
                            rankHours = $('#rank-hours');

                        // Make sure all boxes have an input.
                        switch (false) {
                            case helpers.handleInputString(rankName):
                            case helpers.handleInputNumber(rankHours):
                                break;
                            default:
                                // Remove the old rank.
                                socket.removeDBValue('rm_rank_edit_global', 'ranksMapping', rank, function() {
                                    // Add the rank.
                                    socket.updateDBValue('edit_rank_global', 'ranksMapping', rankHours.val(), rankName.val(), function() {
                                        // Reload the rank table in the bot.
                                        socket.sendCommand('edit_global_rank_cmd', 'rankreloadtable', function() {
                                            // Update the table name.
                                            t.parents('tr').find('td:eq(0)').text(rankHours.val());
                                            // Update the table hours.
                                            t.parents('tr').find('td:eq(1)').text(rankName.val());
                                            // Update the rank hours.
                                            t.data('rank', rankHours.val());
                                            // Close the modal.
                                            $('#edit-rank').modal('hide');
                                            // Alert the user.
                                            toastr.success('Successfully edited the rank!');
                                        });
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
    $('#ranksModuleToggle').on('change', function() {
        // Enable the module then query the data.
        socket.sendCommandSync('ranks_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/ranksSystem.js', run);
    });

    // Add rank button.
    $('#add-rank-button').on('click', function() {
        helpers.getModal('add-rank', 'Add Rank', 'Save', $('<form/>', {
            'role': 'form'
        })
        // Append alias name.
        .append(helpers.getInputGroup('rank-name', 'text', 'Rank', 'VIP', '', 'Name of the rank.'))
        // Append alias.
        .append(helpers.getInputGroup('rank-hours', 'number', 'Hours', '5', '', 'Number of hours before a user gets this rank.')), function() {// Callback once we click the save button.
            let rankName = $('#rank-name'),
                rankHours = $('#rank-hours');

            // Make sure all boxes have an input.
            switch (false) {
                case helpers.handleInputString(rankName):
                case helpers.handleInputNumber(rankHours):
                    break;
                default:
                    // Add the rank.
                    socket.updateDBValue('add_rank_global', 'ranksMapping', rankHours.val(), rankName.val(), function() {
                        // Reload the rank table in the bot.
                        socket.sendCommand('add_global_rank_cmd', 'rankreloadtable', function() {
                            // Update the table name.
                            run();
                            // Close the modal.
                            $('#add-rank').modal('hide');
                            // Alert the user.
                            toastr.success('Successfully added the rank!');
                        });
                    });
            }
        }).modal('toggle');
    });
});
