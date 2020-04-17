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
    socket.getDBValue('keyword_module', 'modules', './handlers/keywordHandler.js', function(e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp('keywordModule', e.modules)) {
            return;
        }

        // Get all keywords.
        socket.getDBTableValues('keywords_get_all', 'keywords', function(results) {
            let tableData = [];

            for (let i = 0; i < results.length; i++) {
                let json = JSON.parse(results[i].value);

                tableData.push([
                    json.keyword.replace('regex:', ''),
                    json.response,
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
            if ($.fn.DataTable.isDataTable('#keywordsTable')) {
                $('#keywordsTable').DataTable().destroy();
                // Remove all of the old events.
                $('#keywordsTable').off();
            }

            // Create table.
            let table = $('#keywordsTable').DataTable({
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
                    { 'title': 'Aktion' }
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                let keyword = $(this).data('keyword'),
                    row = $(this).parents('tr');

                helpers.getConfirmDeleteModal('keyword_modal_remove', 'Sind Sie sicher, dass Sie das Schlüsselwort "' + keyword + '" entfernen möchten?', true,
                    'Du hast das Schlüsselwort "' + keyword + '" erfolgreich entfernt!', function() {
                    // Delete all of the info about the keyword.
                    socket.removeDBValues('rm_keyword', {
                        tables: ['keywords', 'coolkey'],
                        keys: [keyword, keyword]
                    }, function() {
                        socket.wsEvent('rm_keyword_ws', './handlers/keywordHandler.js', null, [], function() {
                            // Remove the table row.
                            table.row(row).remove().draw(false);
                        });
                    });
                });
            });

            // On edit button.
            table.on('click', '.btn-warning', function() {
                let keyword = $(this).data('keyword'),
                    t = $(this);

                socket.getDBValues('edit_keyword', {
                    tables: ['keywords', 'coolkey'],
                    keys: [keyword, keyword]
                }, function(e) {
                    e.keywords = JSON.parse(e.keywords);

                    // Get advance modal from our util functions in /utils/helpers.js
                    helpers.getAdvanceModal('edit-keyword', 'Schlüsselwort bearbeiten', 'Speichern', $('<form/>', {
                        'role': 'form'
                    })
                    // Append a text box for keyword
                    .append(helpers.getTextAreaGroup('keyword-keyword', 'text', 'Schlüsselwort', '',
                        e.keywords.keyword.replace('regex:', ''), 'Schlüsselwort, das eine Antwort auslösen soll.', true)
                        // Append checkbox for if the keyword is regex.
                        .append(helpers.getCheckBox('keyword-regex', e.keywords.isRegex, 'Regex', 'Wenn das Schlüsselwort regex verwendet.')))
                    // Append a text box for the keyword response.
                    .append(helpers.getTextAreaGroup('keyword-response', 'text', 'Antwort', '', e.keywords.response, 'Antwort des Schlüsselwortes.'))
                    // Add an advance section that can be opened with a button toggle.
                    .append($('<div/>', {
                        'class': 'collapse',
                        'id': 'advance-collapse',
                        'html': $('<form/>', {
                                'role': 'form'
                            })
                            // Append input box for keyword cooldown
                            .append(helpers.getInputGroup('cooldown-count', 'number', 'Abklingzeit (Sekunden)', '',
                                helpers.getDefaultIfNullOrUndefined(e.coolkey, 5), 'Die Abklingzeit des Schlüsselwortes in Sekunden. Das Minimum beträgt 5 Sekunden.'))
                            // Append input box for keyword count
                            .append(helpers.getInputGroup('keyword-count', 'number', 'Anzahl', '',
                                helpers.getDefaultIfNullOrUndefined(e.keywords.count, 0), 'Anzahl des Schlüsselwortes. Diese erhöht sich, wenn das Schlüsselwort die Variable hat (keywordcount).'))
                    })), function() {
                        let keywordKey = $('#keyword-keyword'),
                            keywordResponse = $('#keyword-response'),
                            isRegex = $('#keyword-regex').is(':checked'),
                            keywordCooldown = $('#cooldown-count'),
                            keywordCount = $('#keyword-count');

                        // Make sure everything was filled in.
                        switch (false) {
                            case helpers.handleInputString(keywordKey):
                            case helpers.handleInputString(keywordResponse):
                            case helpers.handleInputNumber(keywordCooldown, 5):
                            case helpers.handleInputNumber(keywordCount):
                                break;
                            default:

                                // Remove the old keyword.
                                socket.removeDBValue('edit_keyword_rm', 'keywords', keyword, function() {
                                    // Update the values.
                                    socket.updateDBValues('edit_keyword', {
                                        tables: ['keywords', 'coolkey'],
                                        keys: [(isRegex ? 'regex:' : '') + keywordKey.val(), (isRegex ? 'regex:' : '') + keywordKey.val()],
                                        values: [JSON.stringify({
                                            keyword: (isRegex ? 'regex:' : '') + keywordKey.val(),
                                            response: keywordResponse.val(),
                                            isRegex: isRegex,
                                            count: keywordCount.val()
                                        }), keywordCooldown.val()]
                                    }, function() {
                                        // Reload the keywords in the scripts.
                                        socket.wsEvent('rm_keyword_ws', './handlers/keywordHandler.js', null, [], function() {
                                            // Update the table.
                                            t.parents('tr').find('td:eq(0)').text(keywordKey.val());
                                            // Update the table.
                                            t.parents('tr').find('td:eq(1)').text(keywordResponse.val());
                                            // Close the modal.
                                            $('#edit-keyword').modal('hide');
                                            // Alert the user.
                                            toastr.success('Schlüsselwort erfolgreich bearbeitet!');
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
    // Handle module toggle.
    $('#keywordModuleToggle').on('change', function() {
        // Enable the module then query the data.
        socket.sendCommandSync('keywords_module_toggle_cmd',
            'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./handlers/keywordHandler.js', run);
    });

    // Add keyword button.
    $('#keywordadd-button').on('click', function() {
        // Get advance modal from our util functions in /utils/helpers.js
        helpers.getAdvanceModal('add-keyword', 'Schlüsselwort hinzufügen', 'Speichern', $('<form/>', {
            'role': 'form'
        })
        // Append a text box for keyword
        .append(helpers.getTextAreaGroup('keyword-keyword', 'text', 'Schlüsselwort', 'PhantomBotDE', '', 'Schlüsselwort, das eine Antwort auslösen kann.', true)
            // Append checkbox for if the keyword is regex.
            .append(helpers.getCheckBox('keyword-regex', false, 'Regex', 'Wenn das Schlüsselwort regex verwendet.')))
        // Append a text box for the keyword response.
        .append(helpers.getTextAreaGroup('keyword-response', 'text', 'Antwort',
            'Schaue Dir PhantomBotDE an, es ist ein großartiger kostenloser und Open-Source-Bot!', '', 'Antwort des Schlüsselwortes.'))
        // Add an advance section that can be opened with a button toggle.
        .append($('<div/>', {
            'class': 'collapse',
            'id': 'advance-collapse',
            'html': $('<form/>', {
                    'role': 'form'
                })
                // Append input box for keyword cooldown
                .append(helpers.getInputGroup('cooldown-count', 'number', 'Abklingzeit (Sekunden)', '', '5',
                    'Die Abklingzeit des Keywords in Sekunden. Das Minimum beträgt 5 Sekunden.'))
                // Append input box for keyword count
                .append(helpers.getInputGroup('keyword-count', 'number', 'Anzahl', '', '0',
                    'Zähler des Schlüsselwortes. Dieser erhöht sich, wenn das Schlüsselwort die Variable hat (keywordcount).'))
        })), function() {
            let keywordKey = $('#keyword-keyword'),
                keywordResponse = $('#keyword-response'),
                isRegex = $('#keyword-regex').is(':checked'),
                keywordCooldown = $('#cooldown-count'),
                keywordCount = $('#keyword-count');

            // Make sure everything was filled in.
            switch (false) {
                case helpers.handleInputString(keywordKey):
                case helpers.handleInputString(keywordResponse):
                case helpers.handleInputNumber(keywordCooldown, 5):
                case helpers.handleInputNumber(keywordCount):
                    break;
                default:

                    // Update the values.
                    socket.updateDBValues('add_keyword', {
                        tables: ['keywords', 'coolkey'],
                        keys: [(isRegex ? 'regex:' : '') + keywordKey.val(), (isRegex ? 'regex:' : '') + keywordKey.val()],
                        values: [JSON.stringify({
                            keyword: (isRegex ? 'regex:' : '') + keywordKey.val(),
                            response: keywordResponse.val(),
                            isRegex: isRegex,
                            count: keywordCount.val()
                        }), keywordCooldown.val()]
                    }, function() {
                        // Reload the keywords in the scripts.
                        socket.wsEvent('add_keyword_ws', './handlers/keywordHandler.js', null, [], function() {
                            // Update the table.
                            run();
                            // Close the modal.
                            $('#add-keyword').modal('hide');
                            // Alert the user.
                            toastr.success('Schlüsselwort erfolgreich hinzugefügt!');
                        });
                    });
            }
        }).modal('toggle');
    });
});
