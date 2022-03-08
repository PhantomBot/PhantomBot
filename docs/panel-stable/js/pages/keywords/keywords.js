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
                    json.keyword,
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
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    { 'className': 'default-table', 'orderable': false, 'targets': 2 },
                    { 'width': '35%', 'targets': 0 }
                ],
                'columns': [
                    { 'title': 'Keyword' },
                    { 'title': 'Response' },
                    { 'title': 'Actions' }
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                let keyword = $(this).data('keyword'),
                    row = $(this).parents('tr');

                helpers.getConfirmDeleteModal('keyword_modal_remove', 'Are you sure you want to remove the keyword "' + keyword + '"?', true,
                    'You\'ve successfully removed the keyword "' + keyword + '"!', function() {
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
                    helpers.getAdvanceModal('edit-keyword', 'Edit Keyword', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                    // Append a text box for keyword
                    .append(helpers.getTextAreaGroup('keyword-keyword', 'text', 'Keyword', '',
                        e.keywords.keyword, 'Keyword that can trigger a response.', true)
                        // Append checkbox for if the keyword is regex.
                        .append(helpers.getCheckBox('keyword-regex', e.keywords.isRegex, 'Regex', 'If the keyword is using regex.'))
                        // Append checkbox for it the keyword should be matched case-sensitive
                        .append(helpers.getCheckBox('keyword-case-sensitive', e.keywords.isCaseSensitive, 'Case-Sensitive', 'If the keyword/regex should only match if the capitalization matches.'))
                    )
                    // Append a text box for the keyword response.
                    .append(helpers.getTextAreaGroup('keyword-response', 'text', 'Response', '', e.keywords.response, 'Response of the keyword.'))
                    // Add an advance section that can be opened with a button toggle.
                    .append($('<div/>', {
                        'class': 'collapse',
                        'id': 'advance-collapse',
                        'html': $('<form/>', {
                                'role': 'form'
                            })
                            // Append input box for keyword cooldown
                            .append(helpers.getInputGroup('cooldown-count', 'number', 'Cooldown (Seconds)', '',
                                helpers.getDefaultIfNullOrUndefined(e.coolkey, 5), 'The cooldown of the keyword in seconds. Minimum is 5 seconds.'))
                            // Append input box for keyword count
                            .append(helpers.getInputGroup('keyword-count', 'number', 'Count', '',
                                helpers.getDefaultIfNullOrUndefined(e.keywords.count, 0), 'Count of the keyword. This increases when the keyword has the variable (keywordcount).'))
                    })), function() {
                        let keywordKey = $('#keyword-keyword'),
                            keywordResponse = $('#keyword-response'),
                            isRegex = $('#keyword-regex').is(':checked'),
                            isCaseSensitive = $('#keyword-case-sensitive').is(':checked'),
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
                                        keys: [keywordKey.val(), keywordKey.val()],
                                        values: [JSON.stringify({
                                            keyword: keywordKey.val(),
                                            response: keywordResponse.val(),
                                            isRegex: isRegex,
                                            isCaseSensitive: isCaseSensitive,
                                            count: keywordCount.val()
                                        }), keywordCooldown.val()]
                                    }, function() {
                                        // Reload the keywords in the scripts.
                                        socket.wsEvent('rm_keyword_ws', './handlers/keywordHandler.js', null, [], function() {
                                            // Update the table.
                                            t.parents('tr').find('td:eq(0)').text(keywordKey.val());
                                            // Update the table.
                                            t.parents('tr').find('td:eq(1)').text(keywordResponse.val());
                                            // Update the edit and delete buttons
                                            t.parents('tr').find('td:eq(2) button.btn').data('keyword', keywordKey.val());
                                            // Close the modal.
                                            $('#edit-keyword').modal('hide');
                                            // Alert the user.
                                            toastr.success('Successfully edited the keyword!');
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
        helpers.getAdvanceModal('add-keyword', 'Add Keyword', 'Save', $('<form/>', {
            'role': 'form'
        })
        // Append a text box for keyword
        .append(helpers.getTextAreaGroup('keyword-keyword', 'text', 'Keyword', 'PhantomBot', '', 'Keyword that can trigger a response.', true)
            // Append checkbox for if the keyword is regex.
            .append(helpers.getCheckBox('keyword-regex', false, 'Regex', 'If the keyword is using regex.'))
            // Append checkbox for it the keyword should be matched case-sensitive
            .append(helpers.getCheckBox('keyword-case-sensitive', false, 'Case-Sensitive', 'If the keyword/regex should only match if the capitalization matches.'))
        )
        // Append a text box for the keyword response.
        .append(helpers.getTextAreaGroup('keyword-response', 'text', 'Response',
            'Checkout PhantomBot, it\'s a great free and open source bot!', '', 'Response of the keyword.'))
        // Add an advance section that can be opened with a button toggle.
        .append($('<div/>', {
            'class': 'collapse',
            'id': 'advance-collapse',
            'html': $('<form/>', {
                    'role': 'form'
                })
                // Append input box for keyword cooldown
                .append(helpers.getInputGroup('cooldown-count', 'number', 'Cooldown (Seconds)', '', '5',
                    'The cooldown of the keyword in seconds. Minimum is 5 seconds.'))
                // Append input box for keyword count
                .append(helpers.getInputGroup('keyword-count', 'number', 'Count', '', '0',
                    'Count of the keyword. This increases when the keyword has the variable (keywordcount).'))
        })), function() {
            let keywordKey = $('#keyword-keyword'),
                keywordResponse = $('#keyword-response'),
                isRegex = $('#keyword-regex').is(':checked'),
                isCaseSensitive = $('#keyword-case-sensitive').is(':checked'),
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
                        keys: [keywordKey.val(), keywordKey.val()],
                        values: [JSON.stringify({
                            keyword: keywordKey.val(),
                            response: keywordResponse.val(),
                            isRegex: isRegex,
                            isCaseSensitive: isCaseSensitive,
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
                            toastr.success('Successfully added the keyword!');
                        });
                    });
            }
        }).modal('toggle');
    });
});
