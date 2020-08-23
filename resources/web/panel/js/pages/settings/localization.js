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

$(function() {
    var currentLang = '';

    // Load file button
    $('#load-file-button').on('click', function() {
        $.ajax({
            'url': '/get-lang?webauth=' + getAuth(),
            'type': 'GET',
            'success': function(data) {
                helpers.getModal('edit-lang', 'Lang-Datei laden', 'Bearbeiten', $('<form/>', {
                    'role': 'form'
                })
                // Add select box.
                .append(helpers.getDropdownGroup('file-to-load', 'Lang-Date: ', 'Datei auswählen', data.split('\n'))), function() {
                    currentLang = $('#file-to-load').find(':selected').text();

                    $.ajax({
                        'url': '/lang?webauth=' + getAuth(),
                        'type': 'GET',
                        'headers': {
                            'lang-path': $('#file-to-load').find(':selected').text()
                        },
                        'success': function(data) {
                            // Load the file
                            loadLang(JSON.parse(data));
                            // Alert the user.
                            toastr.success('Die Datei wurde erfolgreich geladen!');
                            // Close the modal.
                            $('#edit-lang').modal('toggle');
                            // Enable the insert and save buttons.
                            $('#save-button').prop('disabled', false);
                            $('#add-line-button').prop('disabled', false);
                        }
                    })
                }).modal('toggle');
            }
        });
    });

    // Add line button.
    $('#add-line-button').on('click', function() {
        helpers.getModal('add-lang', 'Lang-Eintrag hinzufügen', 'Hinzufügen', $('<form/>', {
            'role': 'form'
        })
        // ID for the lang.
        .append(helpers.getInputGroup('lang-id', 'text', 'Lang ID', 'module.name.id'))
        // Resonse for the lang.
        .append(helpers.getTextAreaGroup('lang-response', 'text', 'Antwort', 'Antwort beispiel!')), function() {
            const table = $('#langTable').DataTable({
                    "language": {
                        "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
                    }}),
                langId = $('#lang-id'),
                langRes = $('#lang-response');

            switch (false) {
                case helpers.handleInputString(langId):
                case helpers.handleInputString(langRes):
                    break;
                default:
                    langId.val(langId.val().replace(/[^a-zA-Z0-9-\.]+/g, '-'));

                    table.row.add([
                        langId.val(),
                        langRes.val(),
                        $('<div/>', {
                            'class': 'btn-group'
                        }).append($('<button/>', {
                            'type': 'button',
                            'class': 'btn btn-xs btn-danger',
                            'style': 'float: right',
                            'data-id': langId.val(),
                            'data-response': langRes.val(),
                            'html': $('<i/>', {
                                'class': 'fa fa-trash'
                            })
                        })).append($('<button/>', {
                            'type': 'button',
                            'class': 'btn btn-xs btn-warning',
                            'style': 'float: right',
                            'data-id': langId.val(),
                            'data-response': langRes.val(),
                            'html': $('<i/>', {
                                'class': 'fa fa-edit'
                            })
                        })).html()
                    ]).draw();

                    // Close the modal.
                    $('#add-lang').modal('toggle');
                    // Alert the user.
                    toastr.success('Lang-Eintrag erfolgreich hinzugefügt.');
            }
        }).modal('toggle');
    });

    // Save button
    $('#save-button').on('click', function() {
        const datas = $('#langTable').DataTable({
                "language": {
                    "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
                },}).rows().data(),
            dataObj = [];

        for (let i = 0; i < datas.length; i++) {
            if (typeof datas[i] === 'object') {
                dataObj.push({
                    'id': datas[i][0],
                    'response': datas[i][1]
                });
            } else {
                // No longer data, break the loop.
                break;
            }
        }

        // Post the lang.
        $.ajax({
            'type': 'PUT',
            'url': '/lang?webauth=' + getAuth(),
            'contentType': 'application/json',
            'headers': {
                'lang-path': currentLang
            },
            'data': JSON.stringify(dataObj),
            'success': function(data, text, xhr) {
                if (xhr.status === 200) {
                    toastr.success('Lang erfolgreich gespeichert!');
                } else {
                    toastr.success('Die lang konnte nicht gespeichert werden.');
                }
            }
        });
    });

    // Load lang function
    function loadLang(langArray) {
        const tableData = [];

        for (let i = 0; i < langArray.length; i++) {
            langArray[i]['response'] = langArray[i]['response'].replace(/\\'/g, '\'');

            tableData.push([
                langArray[i]['id'],
                langArray[i]['response'],
                $('<div/>', {
                    'class': 'btn-group'
                }).append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-danger',
                    'style': 'float: right',
                    'data-id': langArray[i]['id'],
                    'data-response': langArray[i]['response'],
                    'html': $('<i/>', {
                        'class': 'fa fa-trash'
                    })
                })).append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-warning',
                    'style': 'float: right',
                    'data-id': langArray[i]['id'],
                    'data-response': langArray[i]['response'],
                    'html': $('<i/>', {
                        'class': 'fa fa-edit'
                    })
                })).html()
            ])
        }

        // if the table exists, destroy it.
        if ($.fn.DataTable.isDataTable('#langTable')) {
            $('#langTable').DataTable().destroy();
            // Remove all of the old events.
            $('#langTable').off();
        }

        // Create table.
        let table = $('#langTable').DataTable({
            'searching': true,
            "language": {
                "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
            },
            'autoWidth': false,
            'lengthChange': false,
            'paging': false,
            'data': tableData,
            'columnDefs': [
                { 'className': 'default-table', 'orderable': false, 'targets': 2 },
                { 'width': '25%', 'targets': 0 }
            ],
            'columns': [
                { 'title': 'Lang ID' },
                { 'title': 'Antwort' },
                { 'title': 'Aktionen' }
            ]
        });

        // On delete button.
        table.on('click', '.btn-danger', function() {
            const row = $(this).parents('tr'),
                id = $(this).data('id');

            // Ask the user if he wants to delete the lang.
            helpers.getConfirmDeleteModal('lang_modal_remove', 'Bist du sicher, dass du diesen Lang-Eintrag entfernen möchtest?', true,
                'Der Lang-Eintrag wurde erfolgreich entfernt!', function() { // Callback if the user clicks delete.
                // Remove the table row.
                table.row(row).remove().draw(false);
            });
        });

        // On edit button.
        table.on('click', '.btn-warning', function() {
            const t = $(this);

            helpers.getModal('edit-lang', 'Lang-Eintrag bearbeiten', 'Bearbeiten', $('<form/>', {
                'role': 'form'
            })
            // ID for the lang.
            .append(helpers.getInputGroup('lang-id', 'text', 'Lang ID', '', t.data('id'), 'Die ID dieser lang.'))
            // Resonse for the lang.
            .append(helpers.getTextAreaGroup('lang-response', 'text', 'Antwort', '', t.data('response').replace(/\\'/g, '\''), 'Die Antwort dieser lang.')), function() {
                let id = $('#lang-id'),
                    response = $('#lang-response');

                switch (false) {
                    case helpers.handleInputString(id):
                    case helpers.handleInputString(response):
                        break;
                    default:
                        // Update the special chars.
                        id = id.val().replace(/[^a-zA-Z0-9-\.]+/g, '-');

                        // Update the table.
                        $('#langTable').DataTable().row(t.parents('tr')).data([
                            id,
                            response.val(),
                            $('<div/>', {
                                'class': 'btn-group'
                            }).append($('<button/>', {
                                'type': 'button',
                                'class': 'btn btn-xs btn-danger',
                                'style': 'float: right',
                                'data-id': id,
                                'data-response': response.val(),
                                'html': $('<i/>', {
                                    'class': 'fa fa-trash'
                                })
                            })).append($('<button/>', {
                                'type': 'button',
                                'class': 'btn btn-xs btn-warning',
                                'style': 'float: right',
                                'data-id': id,
                                'data-response': response.val(),
                                'html': $('<i/>', {
                                    'class': 'fa fa-edit'
                                })
                            })).html()
                        ]).draw(false);

                        // Alert the user.
                        toastr.success('lang Antwort erfolgreich aktualisiert!');

                        // Close the modal.
                        $('#edit-lang').modal('toggle');
                }
            }).modal('toggle');
        });
    }

    function cleanLangID(obj) {
        return obj.val(obj.val().replace(/[^a-zA-Z0-9-\.]+/g, '-'));
    }

    // Load the table for now.
    loadLang([]);
});
