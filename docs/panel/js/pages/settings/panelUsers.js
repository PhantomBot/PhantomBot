/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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

/* global toastr */

$(function () {
    let panelSections,
        permissionLevels;

    //Load Data
    socket.getPanelSections('get_panel_sections', function (res) {
        panelSections = res;
    });
    socket.getPanelPermissionLevels('get_panel_permission_levels', function (res) {
        permissionLevels = res;
    });

    const newPasswordModal = function (password) {
        return helpers.getModal('add-panel-user-pwd', 'New user password', undefined, $('<form/>', {
            'role': 'form'
        })
        .append($('<div/>', {
            'class': 'form-group'
        }).append($('<div/>', {
            'html': $('<b/>', {
                'text': 'We\'ve created a random password which the new user can use to login. The user will be requested to change the password during their first login.'
            })
        })).append($('<div/>', {
            'html': $('<b/>', {
                'text': password
            }),
            'style': 'text-align: center; margin-top:50px'
        }))), undefined, {
            canceltext: 'OK',
            cancelclass: 'btn-primary',
            blockClosing: true
        });
    };

    // Setup links are only offered where passkeys work, with the same check as the Manage Passkeys row
    let canOfferSetupLinks = false;
    const passkeyCheck = helpers.isLocalPanel() && window.passkey !== undefined && window.passkey.isSupported()
            ? $.get('/passkeycheck', function (allowed) {
                canOfferSetupLinks = allowed === 'true';
            }, 'text') : null;

    // Makes a passkey setup link for a user, then hands the full link to the callback, or null if there is none.
    const getSetupLink = function (username, callback) {
        if (!canOfferSetupLinks) {
            callback(null);
            return;
        }

        socket.query('panelUserRO', 'passkey_setup_link', {passkey: {action: 'setupLink', username: String(username)}}, function (res) {
            callback(res.token !== undefined ? window.location.origin + '/panel/login/#setup=' + res.token : null, res.error);
        }, true);
    };

    // A read-only field with a setup link and a button that copies it.
    const getSetupLinkField = function (link) {
        return $('<div/>', {
            'class': 'input-group'
        }).append($('<input/>', {
            'type': 'text',
            'class': 'form-control',
            'id': 'panel-user-setup-link-url',
            'value': link,
            'readonly': true
        })).append($('<span/>', {
            'class': 'input-group-btn'
        }).append($('<button/>', {
            'type': 'button',
            'class': 'btn btn-primary btn-flat',
            'text': 'Copy',
            'click': function () {
                $('#panel-user-setup-link-url').select();
                document.execCommand('Copy');
                toastr.success('Link copied');
            }
        })));
    };

    // Shows a new or reset user's temporary password and a setup link, so either one can be given to them.
    const newUserModal = function (title, username, password, link) {
        return helpers.getModal('add-panel-user-pwd', title, undefined, $('<form/>', {
            'role': 'form'
        })
        .append($('<div/>', {
            'class': 'form-group'
        }).append($('<b/>', {
            'text': 'Give ' + username + ' one of these two ways to sign in.'
        })))
        .append($('<div/>', {
            'class': 'form-group'
        }).append($('<label/>', {
            'text': 'Temporary password'
        })).append($('<p/>', {
            'text': 'They are asked to change it the first time they sign in.'
        })).append($('<div/>', {
            'style': 'text-align: center',
            'html': $('<b/>', {
                'text': password
            })
        })))
        .append($('<div/>', {
            'class': 'form-group'
        }).append($('<label/>', {
            'text': 'Passkey setup link'
        })).append($('<p/>', {
            'text': 'It lets them add a passkey without a password. It works once, for 24 hours, and the temporary password stops working when they use it.'
        })).append(getSetupLinkField(link))), undefined, {
            canceltext: 'OK',
            cancelclass: 'btn-primary',
            blockClosing: true
        });
    };

    // Shows a new setup link for an existing user.
    const setupLinkModal = function (username, link) {
        return helpers.getModal('panel-user-setup-link', 'Passkey setup link', undefined, $('<form/>', {
            'role': 'form'
        })
        .append($('<div/>', {
            'class': 'form-group'
        }).append($('<b/>', {
            'text': 'Give this link to ' + username + '. It lets them add a passkey without signing in. It works once, for 24 hours, '
                    + 'and a temporary password they have not changed yet stops working when they use it.'
        })))
        .append(getSetupLinkField(link)), undefined, {
            canceltext: 'Close',
            cancelclass: 'btn-primary'
        });
    };

    const addRequiredPermissions = function (permissions, section, permission){
        if (findSectionIndex(permissions, section) === -1) {
            permissions.push({
                section: section,
                permission: permission
            });
            return true;
        }
        return false;
    };

    const getDisabledIconAttr = function (enabled) {
        return {
            class: 'fa disabled-status-icon ' + (enabled ? 'fa-check' : 'fa-ban text-muted'),
            title: enabled ? 'enabled' : 'disabled'
        };
    };

    const findSectionIndex = function (permissions, section) {
        for (let i = 0; i < permissions.length; i++) {
            if (permissions[i].section === section) {
                return i;
            }
        }

        return -1;
    };

    const getPermissionTableRow = function (section, permission) {
        return [helpers.capitalizeFirstLettersInString(section), permission,
                $('<div/>', {
                    'class': 'btn-group'
                })
                .append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-danger',
                    'data-section': section,
                    'html': $('<i/>', {
                        'class': 'fa fa-trash'
                    })})).html()];
    };

    //Fill the permissions table and remove permissions already assigned
    const getAvailableSectionsAndFillTable = function (userPermissionTable, permissions) {
        let availableSections = panelSections.slice(0);

        for (let i in permissions) {
            userPermissionTable.DataTable().row.add(getPermissionTableRow(permissions[i].section, permissions[i].permission));
            if (!(permissions[i].section === 'dashboard' && permissions[i].permission === 'Read Only') //Do not remove the dashboard from the available sections if the default ("Read Only") is currently assinged
                && !($('#user-canManageUsers').is(':checked') && permissions[i].section === 'settings' && permissions[i].permission === 'Read Only')) { //Do not remove settings from the available sections if it's set to "Read Only" and the user should manage panel users
                let index = availableSections.indexOf(permissions[i].section.toLowerCase());
                if (index >= 0) {
                    availableSections.splice(index, 1);
                }
            }
        }

        return availableSections;
    };

    const getPermissionTable = function (userPermissionTable, permissions) {
        if (!$.fn.dataTable.isDataTable(userPermissionTable)) {
            userPermissionTable.DataTable({
                'searching': false,
                'autoWidth': false,
                'bPaginate': true,
                'pageLength': 6,
                'data': [],
                'columnDefs': [
                    {'className': 'default-table', 'orderable': true, 'targets': [0, 1]},
                    {'width': '40%', 'targets': 0},
                    {'className': 'section-permission', 'width': '20%', 'targets': 1},
                    {'className': 'text-center', 'width': '10%', 'targets': 2, 'orderable': false}
                ],
                'columns': [
                    {'title': 'Panel section'},
                    {'title': 'Permission'},
                    {'title': 'Actions'}
                ]
            });
        }

        let availableSections = getAvailableSectionsAndFillTable(userPermissionTable, permissions);
        if (availableSections.length === 0) {
            $('#userPermissionAdd-button').attr('disabled', true);
        }

        userPermissionTable.DataTable().draw();

        //Remove permission
        userPermissionTable.on('click', '.btn-danger', function () {
            let section = $(this).data('section');
            let idx = findSectionIndex(permissions, section);
            if (idx === -1) {
                return;
            }

            if (!availableSections.includes(section)) {
                availableSections.push(section);
                if (availableSections.length > 0) {
                    $('#userPermissionAdd-button').attr('disabled', false);
                }
            }

            permissions.splice(idx, 1);
            userPermissionTable.DataTable().row($(this).parents('tr')).remove().draw();
            if (addRequiredPermissions(permissions, 'dashboard', 'Read Only')) {
                userPermissionTable.DataTable().row.add(getPermissionTableRow('dashboard', 'Read Only')).draw();
            }

            if ($('#user-canManageUsers').is(':checked')) {
                if (addRequiredPermissions(permissions, 'settings', 'Read Only')) {
                    userPermissionTable.DataTable().row.add(getPermissionTableRow('settings', 'Read Only')).draw();
                }
            }
        });

        //Add permission
        $('#userPermissionAdd-button').on('click', function () {
            helpers.getModal('add-user-perm', 'Add Panel User Permission', 'Add', $('<form/>', {
                'role': 'form'
            })
            .append(helpers.getDropdownGroup('perm-level', 'Access permission', permissionLevels[0].permission, permissionLevels.map(perm => perm.permission), 'Access permission for the panel user. "Full Access" allows modification and sending commands as well as messages. "Read Only" only allows to read settings'))
            .append(helpers.getCheckBox('user-level-all', false, 'All Sections', 'If checked, access permission will be set for all panel sections (except panel user management).'))
            .append(helpers.getDropdownGroup('panel-section', 'Panel section', availableSections[0], availableSections, 'Panel section. Some features will not be available even with "Full Access" permissions including panel user management and restarting the bot')),
            function () {
                let selectedPerm = $('#perm-level').find(':selected').text(),
                        selectedSection = $('#panel-section').find(':selected').text(),
                        allSections = $('#user-level-all').is(':checked');

                if (allSections) { //Add all available sections
                    for (let section in availableSections) {
                        let idx = findSectionIndex(permissions, availableSections[section]);
                        if (idx >= 0) {
                            permissions[idx].permission = selectedPerm;
                            $('button[data-section="' + availableSections[section] + '"]').parents('td').siblings('.section-permission').text(selectedPerm);
                        } else {
                            permissions.push({
                                section: availableSections[section],
                                permission: selectedPerm
                            });
                            userPermissionTable.DataTable().row.add(getPermissionTableRow(availableSections[section], selectedPerm));
                        }
                    }

                    availableSections = [];
                } else { //Add single section
                    let idx = findSectionIndex(permissions, selectedSection);
                    if (idx >= 0) { //Handle present required permissions (only Read-Only)
                        permissions[idx].permission = selectedPerm;
                        $('button[data-section="' + selectedSection + '"]').parents('td').siblings('.section-permission').text(selectedPerm);
                    } else {
                        permissions.push({
                            section: selectedSection,
                            permission: selectedPerm
                        });
                        userPermissionTable.DataTable().row.add(getPermissionTableRow(selectedSection, selectedPerm));
                    }

                    availableSections.splice(availableSections.indexOf(selectedSection), 1);
                }

                if (availableSections.length === 0) {
                    $('#userPermissionAdd-button').attr('disabled', true);
                }

                userPermissionTable.DataTable().draw();
                $('#add-user-perm').modal('hide');
            }).on('shown.bs.modal', function () {
                let checkBox = $('#user-level-all');
                checkBox.on('change', function (e) {
                    if (e.target.checked) {
                        $('#panel-section').closest('.form-group').hide();
                    } else {
                        $('#panel-section').closest('.form-group').show();
                    }
                });

            }).modal('toggle');
        });
    };

    const getPermissionTableHTML = function () {
        return $('<div/>', {
                    'class': 'form-group',
                    'style': 'border-top: 1px solid #424242; margin-top: 15px; padding-top:15px'
                })
                .append($('<label/>', {
                    'html': '<b>Permissions</b>'
                }))
                .append($('<button/>', {
                    'class': 'btn btn-primary btn-sm pull-right',
                    'type': 'button',
                    'id': 'userPermissionAdd-button',
                    'html': '<i class="fa fa-plus"></i>&nbsp; Add permission'
                }))
                .append($('<table/>', {
                    'id': 'user-permissions-table',
                    'class': 'table table-bordered table-hover'
                }))
                .append($('<b/>', {
                    'text': 'Dashboard "read only"-permissions will be added automatically if no specific dashboard permissions are provided!'
                }));
    };

    const getPermissionShortString = function (permissions) {
        let fullAccessCounter = 0,
                readOnlyCounter = 0;
        for (let i in permissions) {
            if (permissions[i].permission === 'Full Access') {
                fullAccessCounter++;
            } else if (permissions[i].permission === 'Read Only') {
                readOnlyCounter++;
            }
        }

        return 'Full Access: ' + fullAccessCounter + '<br> Read Only: ' + readOnlyCounter;
    };

    const panelUsersTable = $('#panelUsersTable');

    const loadPanelUsers = function () {
        socket.getAllPanelUsers('get_panel_users', function (panelUsers) {
            let tableData = [];

            for (let user of panelUsers) {
                if (user.username === helpers.currentPanelUserData.username){
                    continue;
                }

                let lastLogon = 'Never';
                if (parseInt(user.lastLogin) !== -1) {
                    lastLogon = helpers.getDateStringFromDate(new Date(parseInt(user.lastLogin)));
                }

                tableData.push([
                    user.username,
                    getPermissionShortString(user.permission),
                    user.lastLogin,
                    lastLogon,
                    user.creationDate,
                    helpers.getDateStringFromDate(new Date(parseInt(user.creationDate))),
                    $('<div/>')
                    .append($('<i/>',
                        getDisabledIconAttr(user.isEnabled)
                    )).html(),
                    $('<div/>', {
                        'class': 'btn-group'
                    })
                    .append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger',
                        'style': 'float: right',
                        'data-username': user.username,
                        'html': $('<i/>', {
                            'class': 'fa fa-trash'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-success',
                        'style': 'float: right',
                        'data-username': user.username,
                        'html': $('<i/>', {
                            'class': 'fa fa-rotate-left'
                        })
                    })).append(!canOfferSetupLinks ? null : $('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-info',
                        'style': 'float: right',
                        'title': 'Passkey setup link',
                        'data-username': user.username,
                        'html': $('<i/>', {
                            'class': 'fa fa-key'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning',
                        'style': 'float: right',
                        'data-username': user.username,
                        'html': $('<i/>', {
                            'class': 'fa fa-edit'
                        })
                    })).html()
                ]);
            }

            if ($.fn.DataTable.isDataTable('#panelUsersTable')) {
                panelUsersTable.DataTable().clear().rows.add(tableData).invalidate().draw(false);
                return;
            }

            let table = panelUsersTable.DataTable({
                'searching': true,
                'autoWidth': false,
                'data': tableData,
                'columnDefs': [
                    {'className': 'default-table', 'orderable': false, 'targets': [6, 7]},
                    {'width': '25%', 'targets': 0},
                    {'width': '15%', 'searchable': false, 'targets': 1},
                    {'width': '18%', 'searchable': false, 'targets': [3, 5]},
                    {'width': '125px', 'searchable': false, 'targets': 6},
                    {'width': '150px', 'searchable': false, 'targets': 7}
                ],
                'columns': [
                    {'title': 'Username'},
                    {'title': 'Permissions'},
                    {'visible': false},
                    {'title': 'Last login', 'orderData': 2},
                    {'visible': false},
                    {'title': 'Creation date', 'orderData': 4},
                    {'title': 'Status'},
                    {'title': 'Actions'}
                ]
            });

            //Password reset
            table.on('click', '.btn-success', function () {
                let username = $(this).data('username');
                helpers.getConfirmDeleteModal('reset_panel_user_pwd_modal', 'Are you sure you want to reset ' + username + '\'s password and remove their passkeys?', false,
                    username + '\'s password has been successfully reset and their passkeys removed!', function () {
                        socket.resetPanelUserPWD('reset_panel_user_pwd', username, function (res) {
                            if (res.error !== undefined) {
                                toastr.error(res.error);
                                return {
                                    message: res.error,
                                    icon: 'error'
                                };
                            }

                            toastr.success('Successfully reset user password');
                            // Without a link, such as when the bot refuses one, only the temporary password is shown
                            getSetupLink(username, function (link) {
                                (link === null ? newPasswordModal(res.success) : newUserModal('Password reset', username, res.success, link)).modal({
                                    keyboard: false,
                                    backdrop: 'static'
                                });
                            });
                        });
                    }, {deleteText: 'Reset password'});
            });

            //Passkey setup link
            table.on('click', '.btn-info', function () {
                let username = $(this).data('username');

                getSetupLink(username, function (link, error) {
                    if (link === null) {
                        toastr.error(error);
                        return;
                    }

                    setupLinkModal(username, link).modal('toggle');
                });
            });

            //Delete
            table.on('click', '.btn-danger', function () {
                let username = $(this).data('username');

                helpers.getConfirmDeleteModal('delete_panel_user_modal', 'Are you sure you want to remove the panel user ' + username + '?', false,
                    'Panel access for user ' + username + ' has been successfully removed!', function () {
                        socket.deletePanelUser('delete_panel_user', username, function (res) {
                            if (res.error !== undefined) {
                                toastr.error(res.error);
                                return {
                                    message: res.error,
                                    icon: 'error'
                                };
                            }

                            loadPanelUsers();
                            toastr.success(res.success);
                        });
                    });
            });

            //Edit
            table.on('click', '.btn-warning', function () {
                let username = $(this).data('username'),
                    permissions = [];

                socket.getPanelUser('get_panel_user', username, function (res) {
                    if (res.error !== undefined) {
                        toastr.error(res.error);
                        return;
                    }

                    permissions = res.permission;
                    helpers.getModal('edit-panelUser', 'Edit Panel User', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                    .append(helpers.getInputGroup('user-name', 'text', 'Username', '', res.username, 'Login name / username of the panel user.'))
                    .append(helpers.getCheckBox('user-enabled', res.isEnabled, 'Enabled', 'If unchecked, the user cannot log in.'))
                    .append(helpers.getCheckBox('user-canRestartBot', res.canRestartBot, 'Can restart the bot', 'If checked, the user can restart the bot from the panel.'))
                    .append(helpers.getCheckBox('user-canManageUsers', res.canManageUsers, 'Manages panel users', 'If checked, the user can edit other users. ("Settings"-section "Read Only"-permission will be added automatically if none are defined)'))
                    .append(getPermissionTableHTML()),
                    function () {
                        let user = $('#user-name'),
                                enabled = $('#user-enabled').is(':checked'),
                                canRestartBot = $('#user-canRestartBot').is(':checked'),
                                canManageUsers = $('#user-canManageUsers').is(':checked');

                        switch (false) {
                            case helpers.handleInputString(user):
                                break;
                            default:
                                addRequiredPermissions(permissions, 'dashboard', 'Read Only');
                                if (canManageUsers) {
                                    addRequiredPermissions(permissions, 'settings', 'Read Only');
                                }

                                socket.editPanelUser('edit_panel_user', username, user.val(), JSON.stringify(permissions), enabled, canRestartBot, canManageUsers, function (res2) {
                                    if (res2.error !== undefined) {
                                        toastr.error(res2.error);
                                        return;
                                    }

                                    loadPanelUsers();
                                    $('#edit-panelUser').modal('hide');
                                    toastr.success(res2.success);
                                });
                        }
                    }).on('shown.bs.modal', function () {
                        let userPermissionTable = $('#user-permissions-table'),
                                canManageUsersCheckBox = $('#user-canManageUsers');

                        getPermissionTable(userPermissionTable, permissions);
                        if (addRequiredPermissions(permissions, 'dashboard', 'Read Only')) {
                            userPermissionTable.DataTable().row.add(getPermissionTableRow('dashboard', 'Read Only')).draw();
                        }

                        canManageUsersCheckBox.on('change', function (e) {
                            if (e.target.checked) {
                                if (addRequiredPermissions(permissions, 'settings', 'Read Only')) {
                                    userPermissionTable.DataTable().row.add(getPermissionTableRow('settings', 'Read Only')).draw();
                                }
                            }
                        });
                    }).modal('toggle');
                });
            });
        });
    };

    // The table waits for the passkey check, which decides whether rows get the setup link button
    $.when(passkeyCheck).always(loadPanelUsers);

    $('#panelUserAdd-button').on('click', function () {
        let permissions = [];
        helpers.getModal('add-panel-user', 'Add Panel User', 'Save', $('<form/>', {
            'role': 'form'
        })
        .append(helpers.getInputGroup('user-name', 'text', 'Username', 'Phantom', '', 'Login name / username of the panel user.'))
        .append(helpers.getCheckBox('user-enabled', true, 'Enabled', 'If unchecked, the user cannot log in.'))
        .append(helpers.getCheckBox('user-canRestartBot', false, 'Can restart the bot', 'If checked, the user can restart the bot from the panel.'))
        .append(helpers.getCheckBox('user-canManageUsers', false, 'Manages panel users', 'If checked, the user can edit other users. ("Settings"-section "Read Only"-permission will be added automatically if none are defined)'))
        .append(getPermissionTableHTML()),
        function () {
            let username = $('#user-name'),
                    enabled = $('#user-enabled').is(':checked'),
                    canRestartBot = $('#user-canRestartBot').is(':checked'),
                    canManageUsers = $('#user-canManageUsers').is(':checked');

            switch (false) {
                case helpers.handleInputString(username):
                    break;
                default:
                    addRequiredPermissions(permissions, 'dashboard', 'Read Only');
                    if (canManageUsers) {
                        addRequiredPermissions(permissions, 'settings', 'Read Only');
                    }

                    socket.addPanelUser('add_panel_user', username.val(), JSON.stringify(permissions), enabled, canRestartBot, canManageUsers, function (res) {
                        if (res.error !== undefined) {
                            toastr.error(res.error);
                            return;
                        }

                        loadPanelUsers();
                        $('#add-panel-user').modal('hide');
                        toastr.success('Successfully added new panel user!');
                        // Without a link, such as when the bot refuses one, only the temporary password is shown
                        getSetupLink(username.val(), function (link) {
                            (link === null ? newPasswordModal(res.success) : newUserModal('New panel user', username.val(), res.success, link)).modal({
                                keyboard: false,
                                backdrop: 'static'
                            });
                        });
                    });
            }
        }).on('shown.bs.modal', function () {
            let userPermissionTable = $('#user-permissions-table'),
                    canManageUsersCheckBox = $('#user-canManageUsers');

            getPermissionTable(userPermissionTable, permissions);
            if (addRequiredPermissions(permissions, 'dashboard', 'Read Only')) {
                userPermissionTable.DataTable().row.add(getPermissionTableRow('dashboard', 'Read Only')).draw();
            }

            canManageUsersCheckBox.on('change', function (e) {
                if (e.target.checked) {
                    if (addRequiredPermissions(permissions, 'settings', 'Read Only')) {
                        userPermissionTable.DataTable().row.add(getPermissionTableRow('settings', 'Read Only')).draw();
                    }
                }
            });
        }).modal('toggle');
    });
});
