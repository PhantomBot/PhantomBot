/**
    Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

$(function(){
    // Pending settings to be changed.
    let pendingSettings = {};
    // Enable toastr close button.
    toastr.options.closeButton = true;

    // String sanitizer.
    String.prototype.sanitize = function() {
        return String(this).replace(/(\s|\/|\\)/g, '');
    }

    // Gets the default input value.
    String.prototype.getDefaultValue = function() {
        return (String(this).match(/(default\s\`(\w+)\`)/) ? String(this).match(/(default\s\`(\w+)\`)/)[2] : '');
    }

    // Handles the value change of an input box.
    function onValueChangeEvent(event) {
        const key = $(this).prop('id')
        const value = $(this).prop('value');

        if (value.length > 0) {
            pendingSettings[key] = value;
        } else {
            if (pendingSettings[key] !== undefined) {
                pendingSettings[key] = null;
            }
        }
    }

    // Creates the settings list.
    function generateAccordionSettings(json) {
        let categorySorter = [];
        let currentCategory = '';
        let settings;

        for (let i in json) {
            if (!categorySorter.hasOwnProperty(json[i].category)) {
                categorySorter[json[i].category] = json[i].category_sort;
            }
        }

        json.sort((a, b) => {
            if (categorySorter[a.category] < categorySorter[b.category]) {
                return -1;
            } else if (categorySorter[a.category] > categorySorter[b.category]) {
                return 1;
            } else if (a.category.localeCompare(b.category) !== 0) {
                return a.category.localeCompare(b.category);
            } else if (a.sort < b.sort) {
                return -1;
            } else if (a.sort > b.sort) {
                return 1;
            } else {
                return a.botproperty.localeCompare(b.botproperty);
            }
        });

        for (let i in json) {
            if (json[i].category !== currentCategory) {
                $('#accodion').append($('<div/>', {
                    'class': 'panel panel-default',
                }).append($('<div/>', {
                    'class': 'panel-heading',
                }).append($('<a/>', {
                    'data-toggle': 'collapse',
                    'data-parent': '#accordion',
                    'style': 'color: #ccc !important',
                    'href': '#' + json[i].category.sanitize().toLowerCase() + '_accodion'
                }).append($('<h4/>', {
                    'class': 'panel-title',
                    'html': json[i].category
                })))).append($('<div/>', {
                    'class': 'panel-collapse collapse' + (json[i].category.toLowerCase() === 'admin' ? ' in' : ''),
                    'id': json[i].category.sanitize().toLowerCase() + '_accodion'
                }).append($('<div/>', {
                    'class': 'panel-body',
                    'id': json[i].category.sanitize().toLowerCase() + '_accodion_html'
                }))));

                currentCategory = json[i].category
            }
            // Creates the user input and adds it to the currect section in the accordion.
            createInteractableInput(json[i]);
        }
    }

    // Creates user input setting.
    function createInteractableInput(json) {
        let defaultValue = json.definition.getDefaultValue();
        let userInput;

        switch (json.type) {
            case 'Boolean':
                userInput = $('<select/>', {
                    'class': 'form-control',
                    'style': 'cursor: pointer',
                    'id': json.botproperty
                });

                ['true', 'false'].map(val => {
                    let option = $('<option/>', {
                        'value': val,
                        'html': val
                    });

                    userInput.append(option);
                });
                break;
            case 'Int':
            case 'Long':
                userInput = $('<input/>', {
                    'class': 'form-control',
                    'type': 'number',
                    'value': defaultValue,
                    'step': '1',
                    'id': json.botproperty,
                    'placeholder': 'Please enter a value.'
                });
                break;
            case 'Double':
                userInput = $('<input/>', {
                    'class': 'form-control',
                    'type': 'number',
                    'value': defaultValue,
                    'step': '0.1',
                    'id': json.botproperty,
                    'placeholder': 'Please enter a value.'
                });
                break;
            default:
                userInput = $('<input/>', {
                    'class': 'form-control',
                    'type': 'text',
                    'value': defaultValue,
                    'id': json.botproperty,
                    'placeholder': 'Please enter a value.'
                });
        }

        // Handles the event for when a value is changed.
        userInput.on('change', onValueChangeEvent);

        // Append the form on the page.
        $('#' + json.category.sanitize().toLowerCase() + '_accodion_html')
          .append($('<form/>',{

        }).append($('<div/>', {
            'class': 'form-group'
        }).append($('<label/>', {
            'html': json.botproperty
        })).append(userInput)
           .append($('<small/>', {
            'class': 'form-text text-muted',
            'html': json.definition.substring(0, 1).toUpperCase() + json.definition.substring(1)
        }))));

        // For select boxes only, set the default value.
        if (defaultValue === 'true' || defaultValue === 'false') {
            $('#' + json.botproperty + ' option[value=' + defaultValue + ']').prop('selected', true);
        }
    }

    // Fills the user interactable inputs with their acctual values.
    function populateInteractableInputs(json) {
        for (let i in json) {
            $('#' + i).val(json[i]);
        }
    }

    // Gets the bot settings from our API.
    function getBotSettings() {
        $.ajax({
            cache: false,
            dataType: 'json',
            url: 'currentProperties.json',
            method: 'GET',
            success: function (data) {
                if (data.code !== 200) {
                    toastr.error('Failed to retrieve current settings: ' + data.status + ' ' + data.error + '!');
                } else {
                    populateInteractableInputs(data.currentProperties);
                }
            },
            error: function (jq, status, error) {
                let msg = '';
                if (status !== undefined) {
                    if (msg.length > 0) {
                        msg += ' ';
                    }
                    msg += jq.status;
                }
                if (jq.statusText !== undefined) {
                    if (msg.length > 0) {
                        msg += ' ';
                    }
                    msg += jq.statusText;
                }
                if (jq.responseText !== undefined) {
                    if (msg.length > 0) {
                        msg += ' ';
                    }
                    msg += jq.responseText;
                }
                if (err !== undefined) {
                    if (msg.length > 0) {
                        msg += ' ';
                    }
                    msg += err;
                }
                toastr.error('Failed to retrieve current settings: ' + msg + '!');
            }
        });
    }

    // Button that save settings.
    $('#save-button').on('click', function(event) {
        if (Object.keys(pendingSettings).length > 0) {
            $('#save-button').prop('disabled', true);

            $.ajax({
                cache: false,
                contentType: 'application/json',
                data: JSON.stringify(pendingSettings),
                dataType: 'json',
                url: 'currentProperties.json',
                method: 'PATCH',
                processData: false,
                success: function (data) {
                    if (data !== undefined && data.code !== 204) {
                        toasr.error('Failed to update settings: ' + data.status + ' ' + data.error + '!');
                    } else {
                        toastr.success('Settings updated!');

                        $('html, body').animate({
                            scrollTop: 0
                        }, 100);
                        $('#save-button').prop('disabled', false);

                        pendingSettings = {};
                    }
                },
                error: function (jq, status, err) {
                    let msg = '';
                    if (status !== undefined) {
                        if (msg.length > 0) {
                            msg += ' ';
                        }
                        msg += jq.status;
                    }
                    if (jq.statusText !== undefined) {
                        if (msg.length > 0) {
                            msg += ' ';
                        }
                        msg += jq.statusText;
                    }
                    if (jq.responseText !== undefined) {
                        if (msg.length > 0) {
                            msg += ' ';
                        }
                        msg += jq.responseText;
                    }
                    if (err !== undefined) {
                        if (msg.length > 0) {
                            msg += ' ';
                        }
                        msg += err;
                    }
                    toastr.error('Failed to update settings: ' + msg + '!');
                }
            });
        }
    });

    // Confirmation for leaving.
    $(window).on('beforeunload', function() {
        if (Object.keys(pendingSettings).length > 0) {
            return 'Some settings were not saved, are you sure that you want to leave?';
        }
        return undefined;
    });

    // Query the default properties.
    $.ajax({
        cache: false,
        dataType: 'json',
        url: '../common/json/properties.json',
        method: 'GET',
        success: function(data) {
            generateAccordionSettings(data);
            getBotSettings();
        },
        error: function(jq, status, error) {
            let msg = '';
            if (status !== undefined) {
                if (msg.length > 0) {
                    msg += ' ';
                }
                msg += jq.status;
            }
            if (jq.statusText !== undefined) {
                if (msg.length > 0) {
                    msg += ' ';
                }
                msg += jq.statusText;
            }
            if (jq.responseText !== undefined) {
                if (msg.length > 0) {
                    msg += ' ';
                }
                msg += jq.responseText;
            }
            if (err !== undefined) {
                if (msg.length > 0) {
                    msg += ' ';
                }
                msg += err;
            }
            toastr.error('Failed to retrieve current settings: ' + msg + '!');
        }
    });
});