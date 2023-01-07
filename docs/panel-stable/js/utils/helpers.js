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

/* global toastr, swal */

$(function () {
    const helpers = {};

    // Delay in ms for animations.
    helpers.DELAY_MS = 325;
    // Debug states enums.
    helpers.DEBUG_STATES = {
        NONE: 0,
        DEBUG: 1,
        INFO: 2,
        FORCE: 3
    };
    // Debug status. 0 = off | 1 = on.
    helpers.DEBUG_STATE = (localStorage.getItem('phantombot_debug_state') !== null ? parseInt(localStorage.getItem('phantombot_debug_state')) : helpers.DEBUG_STATES.NONE);
    // Debug types.
    helpers.LOG_TYPE = helpers.DEBUG_STATES;

    helpers.querymap = {};
    helpers.hashmap = {};
    helpers.version = {};

    helpers.getBotVersion = function () {
        socket.getBotVersion('helpers_version', function (e) {
            helpers.version = structuredClone(e);
        });
    };

    /*
     * @function adds commas to thousands.
     *
     * @param  {String} number
     * @return {String}
     */
    helpers.parseNumber = function (number) {
        return (number + '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    /*
     * @function Fixes the number
     *
     * @param  {String} number
     * @return {JSON}
     */
    helpers.fixNumber = function (number, force) {
        const newNumber = parseInt(number.toString().replace(/,/g, ''));
        const thousandReplace = 9999;
        const millionReplace = 999999;

        if (!isNaN(newNumber)) {
            if (newNumber > thousandReplace && newNumber < millionReplace) {
                return ((newNumber / 1000).toFixed(1) + 'K');
            } else if (newNumber > millionReplace) {
                return ((newNumber / 1000000).toFixed(1) + 'M');
            }
        }

        return number;
    };

    /*
     * @function checks if the object has a valid string or number.
     *
     * @param  {Object} obj
     * @return {Boolean}
     */
    helpers.isValidNumberOrString = function (obj) {
        let value = (typeof obj === 'object' ? obj.val() : obj);

        if (isNaN(value)) {
            if (typeof value === 'string' && value.length > 0) {
                return true;
            }
        } else {
            if (typeof value === 'number' && value > 0) {
                return true;
            }
        }
        return false;
    };

    /*
     * @function Checks if the value is null and returns the default if it is.
     *
     * @param  {String} value
     * @param  {String} def
     * @return {String}
     */
    helpers.getDefaultIfNullOrUndefined = function (value, def) {
        if (value === null || value === undefined) {
            return def;
        } else {
            return value;
        }
    };

    /*
     * @function gets the proper event message.
     *
     * @param  {Object} event
     * @return {String}
     */
    helpers.getEventMessage = function (event) {
        switch (event.type.toLowerCase()) {
            case 'subscriber':
                return (event.username + ' just subscribed at tier ' + event.tier + '!');
            case 'prime subscriber':
                return (event.username + ' just subscribed with Twitch Prime!');
            case 'prime resubscriber':
                return (event.username + ' just resubscribed with Twitch Prime for ' + event.months + ' months!');
            case 'resubscriber':
                return (event.username + ' just resubscribed at tier ' + event.tier + ' for ' + event.months + ' months!');
            case 'follower':
                return (event.username + ' just followed!');
            case 'bits':
                return (event.username + ' just cheered ' + event.amount + ' bits!');
            case 'host': //@deprecated
                return (event.username + ' just hosted with ' + event.viewers + ' viewers!');
            case 'tip':
                return (event.username + ' just tipped ' + event.amount + ' ' + event.currency + '!');
            case 'raid':
                return (event.username + ' raided for ' + event.viewers + ' viewers!');
            case 'gifted subscription':
                return (event.username + ' gifted a subscription to ' + event.recipient + ' at tier ' + event.tier + '!');
            case 'anonymous gifted subscription':
                return ('An anonymous viewer gifted a subscription to ' + event.recipient + ' at tier ' + event.tier + '!');
            case 'mass gifted subscription':
                return (event.username + ' gifted subscriptions to ' + event.amount + ' viewers at tier ' + event.tier + '!');
            case 'anonymous mass gifted subscription':
                return ('An anonymous viewer gifted subscriptions to ' + event.amount + ' viewers at tier ' + event.tier + '!');
        }
    };

    /*
     * @function that gets the right color for an event.
     *
     * @param  {String} event
     * @return {String}
     */
    // Use these colours for this function: https://mdbootstrap.com/css/colors/
    helpers.getEventColor = function (event) {
        switch (event.toLowerCase()) {
            case 'subscriber':
                return 'background-color: #16b7d9;';
            case 'prime subscriber':
                return 'background-color: #1667d9;';
            case 'prime resubscriber':
                return 'background-color: #1637d9;';
            case 'resubscriber':
                return 'background-color: #1697d9;';
            case 'follower':
                return 'background-color: #c62828;';
            case 'bits':
                return 'background-color: #6441a5;';
            case 'host': //@deprecated
                return 'background-color: #ed4c1c;';
            case 'tip':
                return 'background-color: #846195;';
            case 'raid':
                return 'background-color: #4caf50;';
            case 'gifted subscription':
                return 'background-color: #01579b;';
            case 'anonymous gifted subscription':
                return 'background-color: #666666;';
            case 'mass gifted subscription':
                return 'background-color: #01779b;';
            case 'anonymous mass gifted subscription':
                return 'background-color: #aaaaaa;';
        }
    };

    /*
     * @function handle input validation
     *
     * @param {Object} obj
     * @param {Function} validator
     * @return {Boolean}
     *
     * Validator takes obj as argument should return null if the input is valid or else an error message.
     */
    helpers.handleInput = function (obj, validator) {
        if (obj.length === 0) {
            helpers.logError('Failed to validate input due to the object being null.', helpers.LOG_TYPE.FORCE);
            return;
        }

        // Make sure the input has a value in it.
        const validationResult = validator(obj);
        if (typeof validationResult === 'string') {
            if (!obj.parent().hasClass('has-error')) {
                // Add the error class to the parent.
                obj.parent().addClass('has-error');
                // Append text saying the form cannot be empty.
                obj.after($('<p/>', {
                    'class': 'help-block',
                    'text': validationResult
                }));
                let btn = obj.closest('form').find('button');
                if (btn.data('candisable') !== undefined) {
                    // Disable the button
                    obj.closest('form').find('button').prop('disabled', true).addClass('disabled');
                }
                toastr.error('Invalid input field.');
                return false;
            }
        } else {
            if (obj.parent().find('p').length > 0) {
                if (obj.parent().hasClass('has-error')) {
                    // Remove error class.
                    obj.parent().removeClass('has-error');
                    // Remove the help text.
                    obj.parent().find('p').remove();
                    // Enabled the button again.
                    obj.closest('form').find('button').prop('disabled', false).removeClass('disabled');
                    return true;
                }
            }
        }
        return !obj.parent().hasClass('has-error');
    };

    /*
     * @function handles the string input checks.
     *
     * @param {Object} obj
     * @return {Boolean}
     */
    helpers.handleInputString = function (obj, min, max) {
        if (min === undefined) {
            min = 1;
        }
        if (max === undefined) {
            max = Number.MAX_SAFE_INTEGER;
        }
        return helpers.handleInput(obj, function (obj) {
            if (obj.val().length < min) {
                return 'You cannot have less than ' + min + ' characters.';
            }
            if (obj.val().length > max) {
                return 'You cannot have more than ' + max + ' characters.';
            }
            return null;
        });
    };

    /*
     * @function handles the number input checks.
     *
     * @param  {Object} obj
     * @return {Boolean}
     */
    helpers.handleInputNumber = function (obj, min, max) {
        return helpers.handleInput(obj, function (obj) {
            min = (min === undefined ? 0 : min);
            let newMax = (max === undefined ? Number.MAX_SAFE_INTEGER : max);

            if (isNaN(parseInt(obj.val())) || isNaN(obj.val()) || parseInt(obj.val()) < min || parseInt(obj.val()) > newMax) {
                return 'Please enter a number that is greater or equal to ' + min + (max !== undefined ? ' and less or equal than ' + newMax + '' : '') + '.';
            }
            return null;
        });
    };

    /*
     * @function handles the date input checks.
     *
     * @param  {Object} obj
     * @return {Boolean}
     */
    helpers.handleInputDate = function (obj) {
        return helpers.handleInput(obj, function (obj) {
            let matched = obj.val().match(/^((\d{2}|\d{4})(\\|\/|\.|-)(\d{2})(\\|\/|\.|-)(\d{4}|\d{2}))$/);

            if (matched === null || ((matched[6].length < 4 && matched[2].length === 2) || (matched[6].length === 2 && matched[2].length < 4))) {
                return 'Please enter a valid date (mm/dd/yyyy or dd/mm/yyyy).';
            }
            return null;
        });
    };

    /*
     * @function handles hiding info for the panels (the four dashboard info panels).
     *
     * @param {Object} obj
     * @param {String} id
     */
    helpers.handlePanelToggleInfo = function (obj, id) {
        id = 'phantombot_' + id.substring(id.indexOf('-') + 1);

        if (localStorage.getItem(id) === 'false') {
            let numval = obj.data('number');
            if (numval === undefined || numval === null || numval.trim().length === 0) {
                numval = '0';
            }
            if (parseInt(numval.replace(/,/g, '')) < 9999) {
                obj.html(numval);
            } else {
                obj.html($('.small-box').width() < 230 ? obj.data('parsed') : numval);
            }
            localStorage.setItem(id, 'true');
        } else {
            obj.html('Hidden');
            localStorage.setItem(id, 'false');
        }
    };

    /*
     * @function handles setting the info for the panels (the four dashboard info panels).
     *
     * @param {Object} obj
     * @param {String} id
     */
    helpers.handlePanelSetInfo = function (obj, id, parsed) {
        let item = localStorage.getItem('phantombot_' + id.substring(id.indexOf('-') + 1)),
                isSmall = $('.small-box').width() < 230;

        if (item === 'true' || item === null) {
            let numval = obj.data('number');
            if (numval === undefined || numval === null || numval.trim().length === 0) {
                numval = '0';
            }
            if (parseInt(numval.replace(/,/g, '')) < 9999) {
                obj.html(numval);
            } else {
                obj.html(isSmall ? parsed : numval);
            }
        } else {
            obj.html('Hidden');
        }

        obj.data('parsed', parsed);
    };

    /*
     * @function Adds padding to the date with a 0.
     *
     * @param  {String} dateString
     * @return {String}
     */
    helpers.getPaddedDateString = function (dateString) {
        let dateMatches = dateString.match(/((\d+)|([^\d]*))/g);

        for (let i = 0; i < dateMatches.length; i++) {
            if (parseInt(dateMatches[i]) < 10 && !dateMatches[i].startsWith('0')) {
                dateMatches[i] = ('0' + dateMatches[i]);
            }
        }

        return dateMatches.join('');
    };

    /*
     * @function Generates a basic modal, you have to append your own body with jQuery.
     *
     * @param  {String}        id - Element ID for the modal
     * @param  {String}        title - Dialog title
     * @param  {String}        btn - The text displayed on the priamry button, typically "Save". Use `null` to remove
     * @param  {jQuery Object} body - HTML for the modal body
     * @param  {Function}      onClose - Executes when `btn` is pressed. Does nothing if `btn` is `null`
     * @param  {JS Object}     override - optionally overrides some options of the dialog
     * {
     *      footerpre: [],                 // Array of additional HTML elements for the footer, appended before the `btn` button
     *      footercenter: [],              // Array of additional HTML elements for the footer, appended in between the `btn` button and the "Cancel" button
     *      footerpost: [],                // Array of additional HTML elements for the footer, appended after the "Cancel" button
     *      cancelclass: 'primary',        // Overrides the `btn-default` class on the "Cancel" button. Can be used to add other classes as well
     *      canceltext: 'Close',           // Overrides the text displayed on the "Cancel" button
     *      cancelclick: function(){}      // Overrides the function triggered on click for the "Cancel" button. Default `undefined`
     * }
     * @return {jQuery Object} A modal which is ready to be shown using `.modal('show')`
     */
    helpers.getModal = function (id, title, btn, body, onClose, override) {
        if (override === undefined || override === null) {
            override = {};
        }

        let footerbuttons = [];

        if (override.hasOwnProperty('footerpre') && override.footerpre.length > 0) {
            footerbuttons.push(...override.footerpre);
        }

        if (btn !== undefined && btn !== null) {
            footerbuttons.push($('<button/>', {
                'class': 'btn btn-primary',
                'type': 'button',
                'text': btn,
                'click': onClose
            }));
        }

        if (override.hasOwnProperty('footercenter') && override.footercenter.length > 0) {
            footerbuttons.push(...override.footercenter);
        }

        footerbuttons.push($('<button/>', {
            'class': 'btn ' + (override.hasOwnProperty('cancelclass') ? override.cancelclass : 'btn-default'),
            'type': 'button',
            'text': (override.hasOwnProperty('canceltext') ? override.canceltext : 'Cancel'),
            'data-dismiss': 'modal',
            'click': (override.hasOwnProperty('cancelclick') ? override.cancelclick : undefined)
        }));

        if (override.hasOwnProperty('footerpost') && override.footerpost.length > 0) {
            footerbuttons.push(...override.footerpost);
        }

        return $('<div/>', {
            'class': 'modal fade',
            'tabindex': '99',
            'id': id
        }).append($('<div/>', {
            'class': 'modal-dialog'
        }).append($('<div/>', {
            'class': 'modal-content'
        }).append($('<div/>', {
            'class': 'modal-header'
        }).append($('<button/>', {
            'type': 'button',
            'class': 'close',
            'data-dismiss': 'modal',
            'html': '&times;'
        })).append($('<h4/>', {
            'class': 'modal-title',
            'text': title
        }))).append($('<div/>', {
            'class': 'modal-body',
            'html': body
        })).append($('<div/>', {
            'class': 'modal-footer'
        }).append(footerbuttons)))).on('shown.bs.modal', function () {
            $('#' + id).focus();
        }).on('hidden.bs.modal', function () {
            $('#' + id).remove();
        });
    };

    /*
     * @function Generates an advanced modal, you have to append your own body with jQuery.
     *
     * Elements which should be hidden behind the "Show Advanced" collapse section should be enclosed in an element defined as
     * $('<div/>', {
     *    'class': 'collapse',
     *    'id': 'advance-collapse',
     *    'html': $('<form/>', {
     *    'role': 'form'
     *    })
     *    // jQuery .append() elements here
     * })
     *
     * @param  {String}        id - Element ID for the modal
     * @param  {String}        title - Dialog title
     * @param  {String}        btn - The text displayed on the priamry button, typically "Save". Use `null` to remove
     * @param  {jQuery Object} body - HTML for the modal body
     * @param  {Function}      onClose - Executes when `btn` is pressed. Does nothing if `btn` is `null`
     * @param  {JS Object}     override - optionally overrides some options of the dialog
     * {
     *      footerpre: [],                 // Array of additional HTML elements for the footer, appended before the `btn` button
     *      footercenter: [],              // Array of additional HTML elements for the footer, appended in between the `btn` button and the "Cancel" button
     *      footerpost: [],                // Array of additional HTML elements for the footer, appended after the "Cancel" button
     *      cancelclass: 'primary',        // Overrides the `btn-default` class on the "Cancel" button. Can be used to add other classes as well
     *      canceltext: 'Close',           // Overrides the text displayed on the "Cancel" button
     *      cancelclick: function(){},     // Overrides the function triggered on click for the "Cancel" button. Default `undefined`
     *      advancedshowtext: 'Show More', // Overrides the "Show Advanced" text
     *      advancedhidetext: 'Hide More'  // Overrides the "Hide Advanced" text
     * }
     * @return {jQuery Object} A modal which is ready to be shown using `.modal('show')`
     */
    helpers.getAdvanceModal = function (id, title, btn, body, onClose, override) {
        if (override === undefined || override === null) {
            override = {};
        }

        let footerbuttons = [];

        if (override.hasOwnProperty('footerpre') && override.footerpre.length > 0) {
            footerbuttons.push(...override.footerpre);
        }

        if (btn !== undefined && btn !== null) {
            footerbuttons.push($('<button/>', {
                'class': 'btn btn-primary',
                'type': 'button',
                'text': btn,
                'click': onClose
            }));
        }

        if (override.hasOwnProperty('footercenter') && override.footercenter.length > 0) {
            footerbuttons.push(...override.footercenter);
        }

        footerbuttons.push($('<button/>', {
            'class': 'btn btn-' + (override.hasOwnProperty('cancelclass') ? override.cancelclass : 'default'),
            'type': 'button',
            'text': (override.hasOwnProperty('canceltext') ? override.canceltext : 'Cancel'),
            'data-dismiss': 'modal',
            'click': (override.hasOwnProperty('cancelclick') ? override.cancelclick : null)
        }));

        if (override.hasOwnProperty('footerpost') && override.footerpost.length > 0) {
            footerbuttons.push(...override.footerpost);
        }

        return $('<div/>', {
            'class': 'modal fade',
            'tabindex': '99',
            'id': id
        }).append($('<div/>', {
            'class': 'modal-dialog'
        }).append($('<div/>', {
            'class': 'modal-content'
        }).append($('<div/>', {
            'class': 'modal-header'
        }).append($('<button/>', {
            'type': 'button',
            'class': 'close',
            'data-dismiss': 'modal',
            'html': '&times;'
        })).append($('<h4/>', {
            'class': 'modal-title',
            'text': title
        }))).append($('<div/>', {
            'class': 'modal-body',
            'html': body
        })).append($('<div/>', {
            'class': 'modal-footer'
        }).append($('<button/>', {
            'class': 'btn btn-default pull-left',
            'type': 'button',
            'data-toggle': 'collapse',
            'data-target': '#advance-collapse',
            'html': $('<span/>', {
                'class': 'glyphicon glyphicon-chevron-down pull-right',
                'style': 'top: 4px; padding-left: 5px;'
            })
        }).append($('<span/>', {
            'class': 'collapse-btn',
            'html': (override.hasOwnProperty('advancedshowtext') ? override.advancedshowtext : 'Show Advanced'),
            'data-showtext': (override.hasOwnProperty('advancedshowtext') ? override.advancedshowtext : 'Show Advanced'),
            'data-hidetext': (override.hasOwnProperty('advancedhidetext') ? override.advancedhidetext : 'Hide Advanced')
        }))).append(footerbuttons)))).on('shown.bs.modal', function () {
            $('#' + id).focus();
        }).on('hidden.bs.modal', function () {
            $('#' + id).remove();
        }).on('show.bs.collapse', function () {
            $(this).find('.glyphicon').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
            $(this).find('.collapse-btn').html($(this).find('.collapse-btn').data('hidetext'));
        }).on('hide.bs.collapse', function () {
            $(this).find('.glyphicon').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
            $(this).find('.collapse-btn').html($(this).find('.collapse-btn').data('showtext'));
        });
    };

    /*
     * @function Generates an input group
     *
     * @param  {String}  id
     * @param  {String}  type
     * @param  {String}  title
     * @param  {String}  placeholder
     * @param  {String}  value
     * @param  {String}  toolTip
     * @param  {Boolean} disabled
     * @return {Object}
     */
    helpers.getInputGroup = function (id, type, title, placeholder, value, toolTip, disabled) {
        return $('<div/>', {
            'class': 'form-group'
        }).append($('<label/>', {
            'html': $('<b/>', {
                'text': title
            })
        })).append($('<input/>', {
            'id': id,
            'type': type,
            'class': 'form-control',
            'style': 'margin-top: 5px;',
            'data-toggle': 'tooltip',
            'title': toolTip,
            'data-str': type,
            'placeholder': placeholder,
            'value': (value === undefined ? '' : (value + ''))
        }).prop('disabled', (disabled === undefined ? false : disabled)));
    };

    /*
     * @function Generates a textarea group
     *
     * @param  {String}  id
     * @param  {String}  type
     * @param  {String}  title
     * @param  {String}  placeholder
     * @param  {String}  value
     * @param  {String}  toolTip
     * @param  {Boolean} unlimited
     * @return {Object}
     */
    helpers.getTextAreaGroup = function (id, type, title, placeholder, value, toolTip, unlimited) {
        return $('<div/>', {
            'class': 'form-group'
        }).append($('<label/>', {
            'html': $('<b/>', {
                'text': title
            })
        })).append($('<textarea/>', {
            'id': id,
            'type': type,
            'maxlength': (unlimited ? Number.MAX_SAFE_INTEGER : 480),
            'class': 'form-control',
            'style': 'margin-top: 5px;',
            'rows': '2',
            'data-toggle': 'tooltip',
            'title': toolTip,
            'data-str': type,
            'placeholder': placeholder,
            'text': (value === undefined ? '' : (value + ''))
        }));
    };

    /*
     * @function Generates a dropdown.
     *
     * @param  {String} id
     * @param  {String} title
     * @param  {String} def
     * @param  {Array}  options
     * @param  {String} toolTip
     * @return {Object}
     */
    helpers.getDropdownGroup = function (id, title, def, options, toolTip) {
        return  $('<div/>', {
            'class': 'form-group'
        }).append($('<label/>', {
            'html': $('<b/>', {
                'text': title
            })
        })).append($('<div/>', {
            'class': 'dropdown',
            'data-toggle': 'tooltip',
            'title': toolTip
        }).append($('<select/>', {
            'class': 'form-control',
            'id': id,
            'text': def,
            'style': 'width: 100%; cursor: pointer;',
            'data-toggle': 'dropdown'
        }).append($('<option/>', {
            'html': def,
            'selected': 'true',
            'disabled': 'true',
            'hidden': 'true'
        })).append(options.map(function (option) {
            let o = $('<option/>');

            if (typeof (option) === 'object') {
                o.html(option.name);
                o.attr('id', option._id);

                if (option.value !== undefined) {
                    o.attr('value', option.value);
                }

                if (option.selected !== undefined && (option.selected === true || option.selected === 'true')) {
                    o.attr('selected', 'selected');
                }

                if (option.disabled !== undefined && (option.disabled === true || option.disabled === 'true')) {
                    o.attr('disabled', 'disabled');
                }
            } else {
                o.html(option);
            }

            return o;
        }))));
    };

    helpers.getDropdownGroupWithGrouping = function (id, title, options, toolTip) {
        return  $('<div/>', {
            'class': 'form-group'
        }).append($('<label/>', {
            'html': $('<b/>', {
                'text': title
            })
        })).append($('<div/>', {
            'class': 'dropdown',
            'data-toggle': 'tooltip',
            'title': toolTip
        }).append($('<select/>', {
            'class': 'form-control select2 select2-hidden-accessible',
            'id': id,
            'style': 'width: 100%; cursor: pointer;'
        }).append(options.map(function (option) {
            let selected = option.selected;
            let roles = option.options;
            let group = $('<optgroup/>', {
                'label': option.title
            });

            for (let i = 0; i < roles.length; i++) {
                let o = $('<option/>', {
                    'html': roles[i].name,
                    'id': roles[i]._id
                });

                if (roles[i].value !== undefined) {
                    o.attr('value', roles[i].value);
                }

                if (roles[i].selected !== undefined && (roles[i].selected === true || roles[i].selected === 'true')) {
                    o.attr('selected', 'selected');
                } else if (selected !== undefined && selected.indexOf(roles[i]._id) > -1) {
                    o.attr('selected', 'selected');
                }

                if (roles[i].disabled !== undefined && (roles[i].disabled === true || roles[i].disabled === 'true')) {
                    o.attr('disabled', 'disabled');
                }

                group.append(o);
            }

            return group;
        }))));
    };

    /*
     * @function Generates a multi-select dropdown.
     *
     * @param  {String} id
     * @param  {String} title
     * @param  {Array}  options [
     {
     'title': 'Some title',
     'options': [
     {
     'name': 'option name',
     'selected': 'true'
     },
     ...
     ]
     },
     ...
     ]
     * @param  {String} toolTip
     * @return {Object}
     */
    helpers.getMultiDropdownGroup = function (id, title, options, toolTip) {
        return  $('<div/>', {
            'class': 'form-group'
        }).append($('<label/>', {
            'html': $('<b/>', {
                'text': title
            })
        })).append($('<div/>', {
            'class': 'dropdown',
            'data-toggle': 'tooltip',
            'title': toolTip
        }).append($('<select/>', {
            'class': 'form-control select2 select2-hidden-accessible',
            'multiple': 'multiple',
            'id': id,
            'style': 'width: 100%; cursor: pointer;'
        }).append(options.map(function (option) {
            let selected = option.selected;
            let roles = option.options;
            let group = $('<optgroup/>', {
                'label': option.title
            });

            for (let i = 0; i < roles.length; i++) {
                let o = $('<option/>', {
                    'html': roles[i].name,
                    'id': roles[i]._id
                });

                if (roles[i].value !== undefined) {
                    o.attr('value', roles[i].value);
                }

                if (roles[i].selected !== undefined && (roles[i].selected === true || roles[i].selected === 'true')) {
                    o.attr('selected', 'selected');
                } else if (selected !== undefined && selected.indexOf(roles[i]._id) > -1) {
                    o.attr('selected', 'selected');
                }

                if (roles[i].disabled !== undefined && (roles[i].disabled === true || roles[i].disabled === 'true')) {
                    o.attr('disabled', 'disabled');
                }

                group.append(o);
            }

            return group;
        }))));
    };

    /*
     * @function Generates a multi-select dropdown.
     *
     * @param  {String} id
     * @param  {String} title
     * @param  {Array}  options [
     {
     'name': 'option name',
     'selected': 'true'
     },
     ...
     * ]
     * @param  {String} toolTip
     * @return {Object}
     */
    helpers.getFlatMultiDropdownGroup = function (id, title, options, toolTip) {
        return  $('<div/>', {
            'class': 'form-group'
        }).append($('<label/>', {
            'html': $('<b/>', {
                'text': title
            })
        })).append($('<div/>', {
            'class': 'dropdown',
            'data-toggle': 'tooltip',
            'title': toolTip
        }).append($('<select/>', {
            'class': 'form-control select2 select2-hidden-accessible',
            'multiple': 'multiple',
            'id': id,
            'style': 'width: 100%; cursor: pointer;'
        }).append(options.map(function (option) {
            let o = $('<option/>', {
                'html': option.name,
                'id': option._id
            });

            if (option.value !== undefined) {
                o.attr('value', option.value);
            }

            if (option.selected !== undefined && (option.selected === true || option.selected === 'true')) {
                o.attr('selected', 'selected');
            }

            if (option.disabled !== undefined && (option.disabled === true || option.disabled === 'true')) {
                o.attr('disabled', 'disabled');
            }

            return o;
        }))));
    };

    /*
     * @function gets a checkbox
     *
     * @param  {String}  id
     * @param  {Boolean} value
     * @param  {String}  text
     * @param  {String}  tooltip
     * @return {Object}
     */
    helpers.getCheckBox = function (id, value, text, tooltip) {
        return $('<div/>', {
            'class': 'pretty p-icon'
        }).append($('<input/>', {
            'id': id,
            'type': 'checkbox',
            'data-toggle': 'tooltip',
            'title': tooltip,
            'checked': value
        })).append($('<div/>', {
            'class': 'state p-default'
        }).append($('<i/>', {
            'class': 'icon fa fa-check'
        })).append($('<label/>', {
            'text': text
        })));



        // return $('<div/>', {
        //     'class': 'checkbox',
        //     'style': 'margin-top: 0px; !important'
        // }).append($('<label/>', {
        //     'style': 'margin-right: 10px;',
        //     'data-toggle': 'tooltip',
        //     'title': tooltip
        // }).append($('<input/>', {
        //     'type': 'checkbox',
        //     'id': id,
        //     'style': 'cursor: pointer;'
        // }).prop('checked', value)).append(text));
    };

    /*
     * @function gets a collapsible accordion panel.
     *
     * @param  {String} id
     * @param  {String} title
     * @param  {String} body
     * @return {Object}
     */
    helpers.getCollapsibleAccordion = function (id, title, body) {
        return $('<div/>', {
            'class': 'panel panel-default'
        }).append($('<div/>', {
            'class': 'panel-heading'
        }).append($('<a/>', {
            'data-toggle': 'collapse',
            'data-parent': '#accordion',
            'style': 'color: #ccc !important',
            'text': '',
            'href': '#' + id
        }).append($('<h4/>', {
            'class': 'panel-title',
            'html': title
        })))).append($('<div/>', {
            'class': 'panel-collapse collapse' + (id.endsWith('1') ? ' in' : ''), // If the ID ends with one, this one should be opened by default.
            'id': id
        }).append($('<div/>', {
            'class': 'panel-body',
            'html': body
        })));
    };

    /*
     * @function gets the confrim delete modal
     *
     * @param  {String}   id
     * @param  {String}   title
     * @param  {Boolean}  hasBodyMsg
     * @param  {String}   closeMessage
     * @param  {Function} onClose
     * @return {Object}
     */
    helpers.getConfirmDeleteModal = function (id, title, hasBodyMsg, closeMessage, onClose) {
        swal({
            'title': title,
            'text': (hasBodyMsg ? 'Once removed, it be will gone forever.' : ''),
            'icon': 'warning',
            'reverseButtons': true,
            'buttons': {
                'confirm': {
                    'text': 'Delete',
                    'visible': true
                },
                'cancel': {
                    'text': 'Cancel',
                    'visible': true
                }
            },
            'dangerMode': true
        }).then(function (isRemoved) {
            if (isRemoved) {
                let result = onClose();
                if (result === undefined || result.message === undefined || result.icon === undefined) {
                    swal(closeMessage, {
                        'icon': 'success'
                    });
                } else {
                    swal(result.message, {
                        'icon': result.icon
                    });
                }
            }
        });
    };

    /*
     * @function Generates a random string.
     *
     * @param  {Number} len
     * @return {String}
     */
    helpers.getRandomString = function (len) {
        let randStr = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
                str = '';

        for (let i = 0; i < len; i++) {
            str += randStr.charAt(Math.floor(Math.random() * randStr.length));
        }

        return str;
    };

    /*
     * @function Creates a new timer interval.
     *
     * @param {Function} func
     * @param {Number}   interval
     */
    helpers.setInterval = function (func, interval) {
        timers.push(setInterval(func, interval));
    };

    /*
     * @function Creates a new timer timeout.
     *
     * @param {Function} func
     * @param {Number}   timeout
     */
    helpers.setTimeout = function (func, timeout) {
        timers.push(setTimeout(func, timeout));
    };

    /*
     * @function Clears all timers.
     */
    helpers.clearTimers = function () {
        for (let i = 0; i < timers.length; i++) {
            clearInterval(timers[i]);
        }
    };

    /*
     * @function checked if a module is on.
     *
     * @param  {String}|{Array} id
     * @return {Boolean}
     */
    helpers.getModuleStatus = function (id, toggle, swit) {
        if (typeof id === 'object') {
            for (let i = 0; i < id.length; i++) {
                if (toggle === 'false') {
                    //$('#' + id[i]).slideUp(helpers.DELAY_MS);
                    $('#' + id[i] + ' *').prop('disabled', true);
                } else {
                    //$('#' + id[i]).slideDown(helpers.DELAY_MS);
                    $('#' + id[i] + ' *').prop('disabled', false);
                }
            }
            // Handle the switch toggle
            $('#' + swit).prop('checked', toggle === 'true');
        } else {
            if (toggle === 'false') {
                $('#' + id + 'Toggle').prop('checked', false);
                //$('#' + id).slideUp(helpers.DELAY_MS);
                $('#' + id + ' *').prop('disabled', true);
            } else {
                $('#' + id + 'Toggle').prop('checked', true);
                //$('#' + id).slideDown(helpers.DELAY_MS);
                $('#' + id + ' *').prop('disabled', false);
            }
        }
        return toggle === 'true';
    };

    /*
     * @function Same as the function above but doesn't return anything but true.
     *
     * @param  {String}|{Array} id
     * @return {Boolean}
     */
    helpers.handleModuleLoadUp = function (id, toggle, swit) {
        return helpers.getModuleStatus(id, toggle, swit);
    };

    let _isSwappedSubscriberVIP = false;
    helpers.isSwappedSubscriberVIP = function () {
        return _isSwappedSubscriberVIP;
    };

    let checkSwappedSubscriberVIP = function () {
        socket.getDBValue('helpers_isSwappedSubscriberVIP', 'settings', 'isSwappedSubscriberVIP', function (e) {
            _isSwappedSubscriberVIP = e.settings === '1';
        });
    };

    setTimeout(function () {
        checkSwappedSubscriberVIP();
    }, 5e3);

    setInterval(function () {
        checkSwappedSubscriberVIP();
    }, 30e3);

    /*
     * @function Gets the group ID by its name.
     *
     * @param  {String}  name
     * @param  {Boolean} asString
     * @return {Number}
     */
    helpers.getGroupIdByName = function (name, asString) {
        let idx = permGroupNames.indexOf(name);
        return (asString ? idx.toString() : parseInt(idx));
    };

    /*
     * @function Gets the group ID by its name.
     *
     * @param  {String}  name
     * @param  {Boolean} asString
     * @return {Number}
     */
    helpers.getDiscordGroupIdByName = function (name, asString) {
        /*switch (name.toLowerCase()) {
         case 'administrators':
         case 'administrator':
         return (asString ? '1' : 1);
         default:
         return (asString ? '0' : 0);
         }*/

        return 'null';
    };

    let updatePermGroups = function () {
        socket.getDBTableValues('permissions_get_all_groups', 'groups', function (results) {
            permGroups;
            for (let i = 0; i < results.length; i++) {
                permGroups[i] = results[i].value;
                permGroupNames[i] = i.toString() + ' (' + results[i].value + ')';
            }
        });
    };

    let permGroups = [];
    let permGroupNames = [];

    setTimeout(function () {
        updatePermGroups();
    }, 1e3);

    setInterval(function () {
        updatePermGroups();
    }, 30e3);

    /*
     * @function Gets the group name by its ID.
     *
     * @param  {String} id
     * @return {Number}
     */
    helpers.getGroupNameById = function (id) {
        return permGroupNames[parseInt(id)]; //The database always holds the names in the correct order
    };

    helpers.getPermGroupNames = function () {
        return permGroupNames;
    };

    /*
     * @function Gets the group name by its ID.
     *
     * @param  {String} j
     * @return {Number}
     */
    helpers.getDiscordGroupNameById = function (j) {
        let json = JSON.parse(j);
        let roles = [];
        let perms = [];

        for (let i = 0; i < json.roles.length; i++) {
            if (json.roles[i].selected === 'true')
                roles.push(json.roles[i].name);
        }

        if (roles.length === 0) {
            roles.push('None');
        }

        for (let i = 0; i < json.permissions.length; i++) {
            if (json.permissions[i].selected === 'true')
                perms.push(json.permissions[i].name);
        }

        if (perms.length === 0) {
            perms.push('None');
        }

        return {
            roles: roles,
            perms: perms
        };
    };

    /*
     * @function Handles the dark mode toggle.
     *
     * @param {Boolean} isDark
     * @param {Boolean} isAtLoadUp
     */
    helpers.handleDarkMode = function (isDark, isAtLoadUp) {
        // Only load styles once.
        if (helpers.isStylesLoaded !== undefined) {
            return;
        }
        helpers.isStylesLoaded = true;

        let head = $('head');

        if (isDark) {
            // select2.
            head.append($('<link/>', {
                'rel': 'stylesheet',
                'href': 'vendors/select2/select2.dark.min.css'
            }));

            // AdminLTE.
            head.append($('<link/>', {
                'rel': 'stylesheet',
                'href': 'vendors/adminlte/css/AdminLTE.dark.min.css'
            }));

            // skins.
            head.append($('<link/>', {
                'rel': 'stylesheet',
                'href': 'vendors/adminlte/css/skins/skin-purple.dark.min.css'
            }));

            // AdminLTE.
            head.append($('<link/>', {
                'rel': 'stylesheet',
                'href': 'css/style.dark.min.css'
            }));
        } else {
            // select2.
            head.append($('<link/>', {
                'rel': 'stylesheet',
                'href': 'vendors/select2/select2.min.css'
            }));

            // AdminLTE.
            head.append($('<link/>', {
                'rel': 'stylesheet',
                'href': 'vendors/adminlte/css/AdminLTE.min.css'
            }));

            // skins.
            head.append($('<link/>', {
                'rel': 'stylesheet',
                'href': 'vendors/adminlte/css/skins/skin-purple.min.css'
            }));

            // AdminLTE.
            head.append($('<link/>', {
                'rel': 'stylesheet',
                'href': 'css/style.min.css'
            }));
        }
    };

    helpers.addNotification = function (html) {
        if ($('#notifications-total').data('notification-amount') === undefined) {
            $('#notifications-total').data('notification-amount', 0);
        }
        let newval = $('#notifications-total').data('notification-amount') + 1;

        $('#notifications-total').data('notification-amount', newval);
        $('#notifications-total').html(newval);
        $('#notifications-amount').html(newval).prop('style', 'display: inline;');
        $('#notifications-menu-ul').append($('<li/>').append(html));
    };

    /*
     * @function Handles showing new updates to the user.
     *
     * @param {String} version
     * @param {String} downloadLink
     */
    helpers.handleNewBotUpdate = function (version, downloadLink) {
        if (version !== null) {
            if ($('#notifications-total').data('updateisset') === undefined) {
                // Send a warning to the user.
                toastr.warning('New update available for PhantomBot!', {
                    'timeOut': 2000
                });

                let html = '';
                if (version.startsWith("nightly-")) {
                    html = 'Nightly build ' + version.slice(8) + ' of PhantomBot is now available to download! <br>' +
                            'You can grab your own copy of nightly build ' + version.slice(8) + ' of PhantomBot ' +
                            $('<a/>', {'target': '_blank', 'rel': 'noopener noreferrer'}).prop('href', downloadLink).append('here.')[0].outerHTML + ' <br>' +
                            '<b>Please check ' +
                            $('<a/>', {'target': '_blank', 'rel': 'noopener noreferrer'}).prop('href', 'https://phantombot.dev/guides/#guide=content/setupbot/updatebot').append('this guide')[0].outerHTML +
                            ' on how to properly update PhantomBot.</b>';
                } else {
                    html = 'Version ' + version + ' of PhantomBot is now available to download! <br>' +
                            'You can view the changes of this version ' +
                            $('<a/>', {'target': '_blank', 'rel': 'noopener noreferrer'}).prop('href', 'https://github.com/PhantomBot/PhantomBot/releases/' + version).append('here')[0].outerHTML + '. <br>' +
                            'You can grab your own copy of version ' + version + ' of PhantomBot ' +
                            $('<a/>', {'target': '_blank', 'rel': 'noopener noreferrer'}).prop('href', downloadLink).append('here.')[0].outerHTML + ' <br>' +
                            '<b>Please check ' +
                            $('<a/>', {'target': '_blank', 'rel': 'noopener noreferrer'}).prop('href', 'https://phantombot.dev/guides/#guide=content/setupbot/updatebot').append('this guide')[0].outerHTML +
                            ' on how to properly update PhantomBot.</b>';
                }

                // Set the total notifications.
                $('#notifications-total').data('updateisset', 'true');
                // Add a new notfication.
                helpers.addNotification($('<a/>', {
                    'href': 'javascript:void(0);',
                    'click': function () {
                        helpers.getModal('pb-update', 'PhantomBot Update', 'Ok', $('<form/>', {
                            'role': 'form'
                        })
                                .append($('<p/>', {
                                    'html': html
                                })), function () {
                            $('#pb-update').modal('toggle');
                        }).modal('toggle');
                    }
                }).append($('<i/>', {
                    'class': 'fa fa-warning text-yellow'
                })).append('Update available'));
            }
        }
    };

    /*
     * @function Gets a random rgb color.
     *
     * @return {String}
     */
    helpers.getRandomRgbColor = function () {
        return 'rgb(' + Math.floor(Math.random() * 256) + ', ' + Math.floor(Math.random() * 256) + ', ' + Math.floor(Math.random() * 256) + ')';
    };

    /*
     * @function Used to print debug messages in the console.
     *
     * @param {String}  message
     * @param {Number} type
     */
    helpers.log = function (message, type) {
        if (helpers.DEBUG_STATE === helpers.DEBUG_STATES.DEBUG || type === helpers.DEBUG_STATE || type === helpers.LOG_TYPE.FORCE) {
            console.log('%c[PhantomBot Log]', 'color: #6441a5; font-weight: 900;', message);
        }
    };

    /*
     * @function Used to print error messages in the console.
     *
     * @param {String}  message
     * @param {Number} type
     */
    helpers.logError = function (message, type) {
        console.log('%c[PhantomBot Error]', 'color: red; font-weight: 900;', message);
    };

    /*
     * @function Gets the epoch time from a date.
     *
     * @param  {String}  date
     * @param  {Boolean} force - If you know the format is wrong, force.
     * @return {Number}
     */
    helpers.getEpochFromDate = function (date, force) {
        let parsedDate = Date.parse(date),
                now = Date.now();

        if (isNaN(parsedDate) || force) {
            let matcher = date.match(/((\d{1,2})(\\|\/|\.|-)(\d{1,2})(\\|\/|\.|-)(\d{2,4}))/);

            // Make sure we have a match.
            if (matcher !== null) {
                parsedDate = Date.parse(matcher[4] + '.' + matcher[2] + '.' + matcher[6]);

                if (isNaN(parsedDate)) {
                    helpers.logError('Failed to parse date from "' + date + '". Returning current date.', true);
                    parsedDate = now;
                }
            } else {
                helpers.logError('Failed to parse date from "' + date + '". Returning current date.', true);
                parsedDate = now;
            }
        }

        return parsedDate;
    };

    /**
     * Returns a function prototype that sets a timeout in the future and executes the given function then
     *
     * @param func the function to debounce
     * @param timeout the timespan to debounce in ms
     * @returns {(function(...[*]=): void)|*} the given function wrapped in the debounce functionality
     */
    helpers.debounce = function (func, timeout = 300) {
        let timer;
        return (...args) => {
            window.clearInterval(timer);
            timer = window.setTimeout(() => {
                func.apply(this, args);
            }, timeout);
        };
    };

    helpers.parseQuerymap = function () {
        if (window.location.search.length === 0) {
            return;
        }
        var query = window.location.search.slice(1);
        if (query.includes('?')) {
            query = query.replace('?', '&');
        }
        var kvs = query.split('&');
        var querymap = {};
        var spl;

        for (var i = 0; i < kvs.length; i++) {
            spl = kvs[i].split('=', 2);
            querymap[spl[0]] = spl[1];
        }

        helpers.querymap = querymap;
    };

    helpers.parseHashmap = function () {
        if (window.location.hash.length === 0) {
            return;
        }
        var hash = window.location.hash.slice(1);
        var kvs = hash.split('&');
        var hashmap = {};
        var spl;

        for (var i = 0; i < kvs.length; i++) {
            spl = kvs[i].split('=', 2);
            hashmap[spl[0]] = spl[1];
        }

        helpers.hashmap = hashmap;
    };

    helpers.setupAuth = function () {
        if (window.localStorage.getItem('remember') && window.localStorage.getItem('expires')) {
            if (window.localStorage.getItem('expires') > Date.now()) {
                window.localStorage.setItem('expires', Date.now() + (parseInt(window.localStorage.getItem('remember')) * 3600000));
            } else {
                window.sessionStorage.removeItem('webauth');
            }
        }
        window.panelSettings.auth = window.sessionStorage.getItem('webauth') || '!missing';
    };

    helpers.getBotHost = function () {
        var bothostname = window.localStorage.getItem('bothostname') || 'localhost';
        var botport = window.localStorage.getItem('botport') || '25000';

        return bothostname.length > 0 ? bothostname + (botport !== '80' && botport !== '443' ? ':' + botport : '') : '!missing';
    };

    helpers.shouldUseHttpsPrefix = function () {
        var bothostname = window.localStorage.getItem('bothostname') || 'localhost';
        var botport = window.localStorage.getItem('botport') || '25000';

        return botport === '443' && bothostname.match(/(([0-9]{1,3})\.){3}([0-9]{1,3})/) === null && bothostname !== 'localhost';
    };

    helpers.getBotSchemePath = function (sslSettings) {
        let useSsl = helpers.shouldUseHttpsPrefix();

        if (sslSettings !== undefined && sslSettings !== null) {
            useSsl = helpers.shouldUseHttpsPrefix() && !sslSettings.autoSSL;
        }

        return 'http' + (useSsl ? 's' : '') + '://' + helpers.getBotHost();
    };

    helpers.getUserLogo = function () {
        socket.doRemote('userLogo', 'userLogo', {}, function (e) {
            if (!e[0].errors) {
                $('#user-image1').attr('src', 'data:image/jpeg;base64, ' + e[0].logo);
                $('#user-image2').attr('src', 'data:image/jpeg;base64, ' + e[0].logo);
            }
        });
    };

    //https://stackoverflow.com/a/57380742
    helpers.promisePoll = (promiseFunction, { pollIntervalMs = 2000 } = {}) => {
        const startPoll = async resolve => {
            const startTime = new Date();
            const result = await promiseFunction();

            if (result) {
                return resolve();
            }

            const timeUntilNext = Math.max(pollIntervalMs - (new Date() - startTime), 0);
            setTimeout(() => startPoll(resolve), timeUntilNext);
        };

        return new Promise(startPoll);
    };

    helpers.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    helpers.toggleDebug = function () {
        localStorage.setItem('phantombot_debug_state', localStorage.getItem('phantombot_debug_state') !== '1' ? '1' : '0');
        helpers.DEBUG_STATE = (localStorage.getItem('phantombot_debug_state') !== null ? parseInt(localStorage.getItem('phantombot_debug_state')) : helpers.DEBUG_STATES.NONE);
        helpers.log('Debug Output set to ' + helpers.DEBUG_STATE, helpers.LOG_TYPE.FORCE);
    };

    helpers.isLocalPanel = function () {
        return helpers.getBotHost() === window.location.host;
    };

    // Takes an object {} and an array [] of keys.
    // Foreach key in keys:
    //   If obj has the key, and its value is typeof string that starts with '{',
    //   attempts to parse the value as JSON. On success, the string value is replaced
    //   with the resulting object. On failure info is sent to debug, the value is left unchanged,
    //   and the next key is processed.
    // Does not return anything, the original object will be changed.
    helpers.parseJSONValues = function (obj, keys) {
        for (let key in keys) {
            key = keys[key];
            if (obj.hasOwnProperty(key)) {
                try {
                    if (typeof obj[key] === 'string' && obj[key].startsWith('{')) {
                        let tmp = JSON.parse(obj[key]);
                        obj[key] = tmp;
                    }
                } catch (e) {
                    helpers.logError(key + ': "' + obj[key] + '" -> ' + e, helpers.LOG_TYPE.DEBUG);
                }
            }
        }
    };

    helpers.isNightly = function () {
        return helpers.version.hasOwnProperty('build-type') && helpers.version['build-type'].startsWith('nightly');
    };

    helpers.getBranch = function () {
        return helpers.isNightly() ? 'nightly' : 'stable';
    };

    // Export.
    window.helpers = helpers;
    window.helpers.temp = {};
});
