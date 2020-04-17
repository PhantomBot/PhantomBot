/*
 * Copyright (C) 2016-2018 phantombot.tv
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
    socket.getDBValue('highlight_command_module', 'modules', './commands/highlightCommand.js', function(e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp('highlightsModule', e.modules)) {
            return;
        }

        // Get all highlights.
        socket.getDBTableValues('get_highlights', 'highlights', function(results) {
            let tableData = [];

            for (let i = 0; i < results.length; i++) {
                let date = new Date(helpers.getEpochFromDate(results[i].key.substring(0, results[i].key.indexOf(' ')), true)),
                    url = results[i].value.substring(0, results[i].value.indexOf(' :')),
                    comment = results[i].value.substring(results[i].value.indexOf(': ') + 2, results[i].value.length);

                tableData.push([
                    date.toLocaleDateString(),
                    $('<a/>', {
                        'text': url,
                        'href': url,
                        'target': '_blank'
                    })[0].outerHTML,
                    comment,
                    $('<div/>', {
                        'class': 'btn-group'
                    }).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger',
                        'style': 'float: right',
                        'data-key': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-trash'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning',
                        'style': 'float: right',
                        'data-key': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-edit'
                        })
                    })).html()
                ]);
            }

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#highlightsTable')) {
                $('#highlightsTable').DataTable().destroy();
                // Remove all of the old events.
                $('#highlightsTable').off();
            }

            // Create table.
            let table = $('#highlightsTable').DataTable({
                'searching': true,
                "language": {
                    "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
                },
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    { 'className': 'default-table', 'orderable': false, 'targets': 3 },
                    { 'width': '7%', 'targets': 0 },
                    { 'width': '25%', 'targets': 1 }
                ],
                'columns': [
                    { 'title': 'Datum' },
                    { 'title': 'URL' },
                    { 'title': 'Kommentar' },
                    { 'title': 'Aktionen' }
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                let key = $(this).data('key'),
                    row = $(this).parents('tr');

                // Ask the user if he wants to delete the highlight.
                helpers.getConfirmDeleteModal('highlight_modal_remove', 'Bist du sicher, dass du dieses Highlight entfernen möchten?', true,
                    'Das Highlight wurde erfolgreich entfernt!', function() { // Callback if the user clicks delete.
                    // Remove the highlight.
                    socket.removeDBValue('highlight_remove', 'highlights', key, function() {
                        // Remove the table row.
                        table.row(row).remove().draw(false);
                    });
                });
            });

            // On edit button.
            table.on('click', '.btn-warning', function() {
                let key = $(this).data('key'),
                    t = $(this);

                socket.getDBValue('get_highlight_edit', 'highlights', key, function(e) {
                    let spl = e.highlights.replace(/\s/, '').split(': ');

                    helpers.getModal('edit-highlight', 'Highlight bearbeiten', 'Speichern', $('<form/>', {
                        'role': 'form'
                    })
                    // Append highlight text box.
                    .append(helpers.getTextAreaGroup('highlight-text', 'text', 'Highlight', '', spl[1],
                        'Kommentar, der dem aktuellen Highlight gegeben werden soll.', false)),
                    function() {
                        let highlight = $('#highlight-text');

                        switch (false) {
                            case helpers.handleInputString(highlight):
                                break;
                            default:
                                spl[1] = highlight.val();

                                socket.updateDBValue('update_highlight', 'highlights', key, spl.join(' : '), function() {
                                    // Update the table.
                                    t.parents('tr').find('td:eq(2)').text(spl[1]);
                                    // Close the modal.
                                    $('#edit-highlight').modal('toggle');
                                    // Alert the user.
                                    toastr.success('Highlight erfolgreich bearbeitet.');
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
    $('#highlightsModuleToggle').on('change', function() {
        // Enable the module then query the data.
        socket.sendCommandSync('highlight_module_toggle_cmd',
            'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./commands/highlightCommand.js', run);
    });

    // Delete all highlights button.
    $('#delete-highlights-button').on('click', function() {
        // Ask the user if he want to remove all highlights.
        helpers.getConfirmDeleteModal('highlights_modal_remove', 'Bist du sicher, dass du alle Highlights entfernen willst?', false,
            'Alle Highlights erfolgreich entfernen!', function() {
            socket.sendCommandSync('rm_all_highlights_cmd', 'clearhighlightspanel', run);
        });
    });

    // Add highlight.
    $('#add-highlight-button').on('click', function() {
        helpers.getModal('add-highlight', 'Highlight hinzufügen', 'Speichern', $('<form/>', {
            'role': 'form'
        })
        // Append highlight text box.
        .append(helpers.getTextAreaGroup('highlight-text', 'text', 'Highlight', 'PogChamp moment.', '',
            'Kommentar, der dem aktuellen Highlight gegeben werden soll. Dies funktioniert nur, wenn der Stream online ist.', false)),
        function() { // Callback for when the user clicks save.
            let highlight = $('#highlight-text');

            switch (false) {
                case helpers.handleInputString(highlight):
                    break;
                default:
                    socket.sendCommandSync('add_highlight_cmd', 'highlight ' + highlight.val(), function() {
                        toastr.success('Erfolgreich ein neues Highlight geschaffen!');
                    });
                    $('#add-highlight').modal('toggle');
            }
        }).modal('toggle');
    });
});
