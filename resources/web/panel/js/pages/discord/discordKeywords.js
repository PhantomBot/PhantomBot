/*
 * Copyright (C) 2016-2019 phantombot.tv
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
    socket.getDBValue('discord_keyword_module', 'modules', './discord/handlers/keywordHandler.js', function(e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp('discordKeywordsModule', e.modules)) {
            return;
        }

        // Get all keywords.
        socket.getDBTableValues('keywords_get_all', 'discordKeywords', function(results) {
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
                $('#discordKeywordTable').DataTable().destroy();
                // Remove all of the old events.
                $('#discordKeywordTable').off();
            }

            // Create table.
            const table = $('#discordKeywordTable').DataTable({
                'searching': true,
                "language": {
                    "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
                },
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    { 'className': 'default-table', 'orderable': false, 'targets': 2 },
                    { 'width': '35%', 'targets': 0 }
                ],
                'columns': [
                    { 'title': 'Schlüsselwort' },
                    { 'title': 'Antwort' },
                    { 'title': 'Aktionen' }
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                const keyword = $(this).data('keyword'),
                    row = $(this).parents('tr');

                // Ask the user if he want to remove the command.
                helpers.getConfirmDeleteModal('custom_command_modal_remove', 'Sind Sie sicher, dass Sie dieses Schlüsselwort entfernen möchten?', true,
                    'Das Schlüsselwort wurde erfolgreich entfernt!', function() {
                    socket.removeDBValue('discord_keyword_remove', 'discordKeywords', keyword, function() {
                        // Remove the table row.
                        table.row(row).remove().draw(false);
                    });
                });
            });

            // On edit button.
            table.on('click', '.btn-warning', function() {
                const keyword = $(this).data('keyword'),
                    t = $(this);

                socket.getDBValue('keyword_discord_name_get', 'discordKeywords', keyword, function(e) {
                    helpers.getModal('edit-keyword', 'Schlüsselwort bearbeiten', 'Speichern', $('<form/>', {
                        'role': 'form'
                    })
                    // Append keyword.
                    .append(helpers.getInputGroup('keyword-name', 'text', 'Schlüsselwort', '', keyword, 'Das Schlüsselwort, um die Antwort auszulösen. Dieses kann nicht bearbeitet werden.', true))
                    // Append response.
                    .append(helpers.getTextAreaGroup('keyword-response', 'text', 'Antwort', '', e.discordKeywords, 'Schlüsselwort-Antwort.')), function() {
                        const keyword = $('#keyword-name'),
                            response = $('#keyword-response');

                        switch (false) {
                            case helpers.handleInputString(response):
                                break;
                            default:
                                // Update the keyword.
                                socket.updateDBValue('update_discord_keyword', 'discordKeywords', keyword.val(), response.val(), function() {
                                    // Update the table.
                                    t.parents('tr').find('td:eq(1)').text(response.val());
                                    // Close the modal.
                                    $('#edit-keyword').modal('hide');
                                    // Alert the user.
                                    toastr.success('Schlüsselwort erfolgreich bearbeitet!');
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
    // Toggle for the module.
    $('#discordKeywordsModuleToggle').on('change', function() {
        // Enable the module then query the data.
        socket.sendCommandSync('discord_keywords_module_toggle_cmd', 'module ' +
            ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./discord/handlers/keywordHandler.js', run);
    });

    // Add keyword button.
    $('#discord-addkey-button').on('click', function() {
         helpers.getModal('add-keyword', 'Schlüsselwort hinzufügen', 'Speichern', $('<form/>', {
            'role': 'form'
        })
        // Append keyword.
        .append(helpers.getInputGroup('keyword-name', 'text', 'Schlüsselwort', 'hi', '', 'Schlüsselwort, das die Antwort auslöst. Regex ist erlaubt.'))
        // Append response.
        .append(helpers.getTextAreaGroup('keyword-response', 'text', 'Antwort', 'Hi there!', '', 'Antwort des Schlüsselwortes.')), function() {// Callback once we click the save button.
            const keyword = $('#keyword-name'),
                response = $('#keyword-response');

            switch (false) {
                case helpers.handleInputString(keyword):
                case helpers.handleInputString(response):
                    break;
                default:
                    // Set the keyword.
                    socket.updateDBValue('set_discord_keyword', 'discordKeywords', keyword.val(), response.val(), function() {
                        // Reload the table.
                        run();
                        // Close the modal.
                        $('#add-keyword').modal('hide');
                        // Alert the user.
                        toastr.success('Das Schlüsselwort wurde erfolgreich hinzugefügt!');
                    });
            }
        }).modal('toggle');
    });
});
