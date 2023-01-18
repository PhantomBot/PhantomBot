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
    socket.getDBValue('discord_keyword_module', 'modules', './discord/handlers/keywordHandler.js', function (e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp('discordKeywordsModule', e.modules)) {
            return;
        }

        // Get all keywords.
        socket.getDBTableValues('keywords_get_all', 'discordKeywords', function (results) {
            const tableData = [];

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
                        'data-keyword': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-trash'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning',
                        'style': 'float: right',
                        'data-keyword': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-edit'
                        })
                    })).html()
                ]);
            }

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#discordKeywordTable')) {
                $('#discordKeywordTable').DataTable().clear().rows.add(tableData).invalidate().draw(false);
                return;
            }

            // Create table.
            const table = $('#discordKeywordTable').DataTable({
                'searching': true,
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    {'className': 'default-table', 'orderable': false, 'targets': 2},
                    {'width': '35%', 'targets': 0}
                ],
                'columns': [
                    {'title': 'Keyword'},
                    {'title': 'Response'},
                    {'title': 'Actions'}
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function () {
                const keyword = $(this).data('keyword'),
                        row = $(this).parents('tr');

                // Ask the user if he want to remove the command.
                helpers.getConfirmDeleteModal('custom_command_modal_remove', 'Are you sure you want to remove this keyword?', true,
                        'The keyword has been successfully removed!', function () {
                            socket.removeDBValue('discord_keyword_remove', 'discordKeywords', keyword, function () {
                                // Remove the table row.
                                table.row(row).remove().draw(false);
                            });
                        });
            });

            // On edit button.
            table.on('click', '.btn-warning', function () {
                const keyword = $(this).data('keyword'),
                        t = $(this);

                socket.getDBValue('keyword_discord_name_get', 'discordKeywords', keyword, function (e) {
                    helpers.getModal('edit-keyword', 'Edit Keyword', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                            // Append keyword.
                            .append(helpers.getInputGroup('keyword-name', 'text', 'Keyword', '', keyword, 'The keyword to trigger the response. This cannot be edited.', true))
                            // Append response.
                            .append(helpers.getTextAreaGroup('keyword-response', 'text', 'Response', '', e.discordKeywords, 'Keyword response.')), function () {
                        const keyword = $('#keyword-name'),
                                response = $('#keyword-response');

                        switch (false) {
                            case helpers.handleInputString(response):
                                break;
                            default:
                                // Update the keyword.
                                socket.updateDBValue('update_discord_keyword', 'discordKeywords', keyword.val(), response.val(), function () {
                                    // Update the table.
                                    t.parents('tr').find('td:eq(1)').text(response.val());
                                    // Close the modal.
                                    $('#edit-keyword').modal('hide');
                                    // Alert the user.
                                    toastr.success('Successfully edited the keyword!');
                                });
                        }
                    }).modal('toggle');
                });
            });
        });
    });
});

// Function that handlers the loading of events.
$(function () {
    // Toggle for the module.
    $('#discordKeywordsModuleToggle').on('change', function () {
        // Enable the module then query the data.
        socket.sendCommandSync('discord_keywords_module_toggle_cmd', 'module ' +
                ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./discord/handlers/keywordHandler.js', run);
    });

    // Add keyword button.
    $('#discord-addkey-button').on('click', function () {
        helpers.getModal('add-keyword', 'Add Keyword', 'Save', $('<form/>', {
            'role': 'form'
        })
                // Append keyword.
                .append(helpers.getInputGroup('keyword-name', 'text', 'Keyword', 'hi', '', 'Keyword that will trigger the response. Regex is allowed.'))
                // Append response.
                .append(helpers.getTextAreaGroup('keyword-response', 'text', 'Response', 'Hi there!', '', 'Response of the keyword.')), function () {// Callback once we click the save button.
            const keyword = $('#keyword-name'),
                    response = $('#keyword-response');

            switch (false) {
                case helpers.handleInputString(keyword):
                case helpers.handleInputString(response):
                    break;
                default:
                    // Set the keyword.
                    socket.updateDBValue('set_discord_keyword', 'discordKeywords', keyword.val().toLowerCase(), response.val(), function () {
                        // Reload the table.
                        run();
                        // Close the modal.
                        $('#add-keyword').modal('hide');
                        // Alert the user.
                        toastr.success('Successfully added the keyword!');
                    });
            }
        }).modal('toggle');
    });
});
