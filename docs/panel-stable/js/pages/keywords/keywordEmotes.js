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
$(function () {
    page = {
        // Constants
        // Meta information for the database and to connect it to HTML
        moduleId: 'keywordEmotes',
        databaseModuleId: 'keyword_emotes',
        handlerModule: './handlers/keywordEmotesHandler.js',

        wsEventRemoveKeyword: 'rm_keywordEmote',
        wsEventAddKeyword: 'add_keyword_ws',
        keywordsTable: $('#keywordsTable'),

        // Member Variables
    };

    page.init = function () {
        // Keep a reference of this for anonymous functions
        let closure = this;

        document.getElementById('keywordEmotesToggle').addEventListener('change', function (event) {
            closure.onModuleToggle(event);
        });
        document.getElementById('keywordEmote-add-button').addEventListener('click', function (event) {
            closure.onCLickAdd(event);
        });
    };

    page.run = function () {
        let closure = this;
        socket.getDBValue(this.moduleId + '_getAll', 'modules', this.handlerModule, function (e) {
            // If the module is off, don't load any data.
            if (!helpers.handleModuleLoadUp(closure.moduleId, e.modules || 'false')) {
                return;
            }
            closure.loadPageData();
        });
    };

    page.loadPageData = function () {
        let closure = this;
        // Retrieve Keywords
        socket.getDBTableValues(this.moduleId + '_load_page_data', this.databaseModuleId, function (result) {
            let tableData = [];

            for (let i = 0; i < result.length; i++) {
                let json = JSON.parse(result[i].value);
                let keyword = String(result[i].key);

                tableData.push([
                    String(keyword),
                    json.image,
                    closure.createButtonSet(keyword)
                ]);
            }
            closure.createDataTable(tableData);
        });
    };

    page.createDataTable = function (tableData) {
        // Keep a reference of this for anonymous functions
        let closure = this;

        // if the table exists, destroy it.
        if ($.fn.DataTable.isDataTable('#keywordsTable')) {
            this.keywordsTable.DataTable().clear().rows.add(tableData).invalidate().draw(false);
            return;
        }
        // Create table.
        let table = this.keywordsTable.DataTable({
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
        table.on('click', '.btn-danger', function (event) {
            closure.onClickDelete(event);
        });
        table.on('click', '.btn-warning', function (event) {
            closure.onClickEdit(event);
        });
    };

    page.createButtonSet = function (keyword) {
        let div = document.createElement('div');
        div.className = 'btn-group';
        div.innerHTML = `<button class="btn btn-xs btn-danger" style="float: right;">
        <i class="fa fa-trash"></i>
        </button>
        <button class="btn btn-xs btn-warning" style="float: right;">
        <i class="fa fa-edit"></i>
        </button>`;
        // let the object handle the escaping
        for (let i = 0; i < div.children.length; i++) {
            div.children[i].dataset['keyword'] = keyword;
        }
        return div.outerHTML;
    };

    page.showEditDialog = function (mode, eventSource, keyword, data) {
        let closure = this;
        document.getElementById('editModalLabel').innerText = `${mode[0].toUpperCase()}${mode.slice(1)} Emote Keyword`;
        document.getElementById('keywordEmote-keyword').value = keyword || '';
        document.getElementById('keywordEmote-isRegex').checked = (data !== undefined ? data.isRegex : false);
        document.getElementById('keywordEmote-isCaseSensitive').checked = (data !== undefined ? data.isCaseSensitive : false);
        document.getElementById('keywordEmote-image').value = (data !== undefined ? data.image : '');
        let saveButton = document.getElementById('keywordEmote-edit-save');
        let saveClone = saveButton.cloneNode(true);
        saveClone.addEventListener('click', function () {
            closure.processEditForm(mode, eventSource, keyword);
        });
        $('#keywordEmote-editModal').modal('show');
        saveButton.replaceWith(saveClone);
    };

    page.processEditForm = function (mode, openerNode, originalKeyword) {
        let closure = this;
        let keywordInput = document.getElementById('keywordEmote-keyword');
        let isRegexInput = document.getElementById('keywordEmote-isRegex');
        let isCaseSensitiveInput = document.getElementById('keywordEmote-isCaseSensitive');
        let imageInput = document.getElementById('keywordEmote-image');

        let keyword = keywordInput.value;
        let data = {
            isRegex: isRegexInput.checked,
            isCaseSensitive: isCaseSensitiveInput.checked,
            image: imageInput.value,
            cooldown: 0 // not implemented yet
        };

        switch (false) {
            case helpers.handleInputString($(keywordInput)):
            case helpers.handleInputString($(imageInput)):
            case mode === 'add' || mode === 'edit':
                // case helpers.handleInputNumber(keywordCount):
                break;
            default:
                let updateArgs = {
                    tables: [closure.databaseModuleId],
                    keys: [keyword],
                    values: [JSON.stringify(data)]
                };
                // Handle add and edit mode here to choose the right strategy
                if (mode === 'edit') {
                    socket.removeDBValue(this.moduleId + '_edit_keyword_rm', 'keywords', originalKeyword, function () {
                        socket.updateDBValues(closure.moduleId, updateArgs, function () {
                            socket.wsEvent('rm_keyword_ws', closure.handlerModule, null, [], function () {
                                let tableRow = openerNode.parentNode.parentNode.parentNode;
                                tableRow.cells[0].textContent = keyword;
                                tableRow.cells[1].textContent = data.image;
                                tableRow.cells[2].childNodes[0].firstChild.dataset.keyword = keyword;
                                $('#keywordEmote-editModal').modal('hide');
                                toastr.success('EmoteKeyword edited');
                            });
                        });
                    });
                } else {
                    socket.updateDBValues(closure.moduleId + '_add_keyword', updateArgs, function () {
                        socket.wsEvent(closure.wsEventAddKeyword, closure.handlerModule, null, [], function () {
                            // Reload the table
                            closure.loadPageData();
                            // Close the modal
                            $('#keywordEmote-editModal').modal('hide');
                            // Show success message
                            toastr.success('EmoteKeyword added');
                        });
                    });
                }
                break;
        }
    }
    ;

    page.onClickDelete = function (event) {
        let closure = this;
        let keyword = event.currentTarget.dataset['keyword'];
        let row = event.currentTarget.parentElement.parentElement.parentElement;

        helpers.getConfirmDeleteModal(
                'keywordEmote_modal_remove',
                `Are you sure you want to remove the keyword '${keyword}'?`,
                true,
                `The keyword '${keyword} was successfully removed`,
                function () {
                    socket.removeDBValues(closure.moduleId + '_delete', {
                        tables: [closure.databaseModuleId],
                        keys: [keyword]
                    }, function () {
                        socket.wsEvent(closure.wsEventRemoveKeyword, closure.handlerModule, null, [], function () {
                            // Remove the table row
                            console.log(row);
                            closure.keywordsTable.row(row).remove().draw(false);
                        });
                    });
                });
    };

    page.onCLickAdd = function (event) {
        this.showEditDialog('add', event.currentTarget);
    };

    page.onClickEdit = function (event) {
        let closure = this;
        let keyword = event.currentTarget.dataset['keyword'];
        socket.getDBValues(this.moduleId + '_fetch_edit', {
            tables: [this.databaseModuleId],
            keys: [keyword]
        }, function (result) {
            let json = JSON.parse(result[closure.databaseModuleId]);
            closure.showEditDialog('edit', event.currentTarget, keyword, json);
        });
    };

    page.onModuleToggle = function (event) {
        let closure = this;
        let commandState = event.currentTarget.checked ? 'enablesilent' : 'disablesilent';
        let command = `module ${commandState} ${this.handlerModule}`;
        socket.sendCommandSync(this.moduleId + '_toggle_cmd', command, function () {
            closure.run();
        });
    };

    page.main = function () {
        this.init();
        this.run();
    };

    // Run the page
    page.main();
});
