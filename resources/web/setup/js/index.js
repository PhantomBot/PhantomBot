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
	// Enable toastr close button.
	toastr.options.closeButton = true;

    // Sanitizes a string.
    function sanitizeStr(str) {
        return str.replace(/(\s|\/|\\)/, '');
    }

	// Creates user input setting.
	function createInteractableInput(json) {
        let userInput;

        switch (json.type) {
            case 'Boolean':
                userInput = $('<select/>', {
                    'class': 'form-control',
                    'style': 'cursor: pointer',
                    'id': json.botproperty
                });

                ['true', 'false'].map(val => {
                    userInput.append($('<option/>', {
                        'value': val,
                        'html': val
                    }));
                });
                break;
            case 'Int':
            case 'Long':
                userInput = $('<input/>', {
                    'class': 'form-control',
                    'type': 'number',
                    'step': '1',
                    'id': json.botproperty,
                    'placeholder': 'Please enter a value.'
                });
                break;
            case 'Double':
                userInput = $('<input/>', {
                    'class': 'form-control',
                    'type': 'number',
                    'step': '0.1',
                    'id': json.botproperty,
                    'placeholder': 'Please enter a value.'
                });
                break;
            default:
                userInput = $('<input/>', {
                    'class': 'form-control',
                    'type': 'text',
                    'id': json.botproperty,
                    'placeholder': 'Please enter a value.'
                });
        }

        $('#' + sanitizeStr(json.category).toLowerCase() + '_accodion_html').append($('<form/>',{

        }).append($('<div/>', {
            'class': 'form-group'
        }).append($('<label/>', {
            'html': json.botproperty
        })).append(userInput)
        .append($('<small/>', {
            'class': 'form-text text-muted',
            'html': json.definition.substring(0, 1).toUpperCase() + json.definition.substring(1)
        }))));
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
        		    'text': '',
        		    'href': '#' + sanitizeStr(json[i].category).toLowerCase() + '_accodion' 
        		}).append($('<h4/>', {
        		    'class': 'panel-title',
        		    'html': json[i].category
        		})))).append($('<div/>', {
        		    'class': 'panel-collapse collapse' + (json[i].category.toLowerCase() === 'admin' ? ' in' : ''),
        		    'id': sanitizeStr(json[i].category).toLowerCase() + '_accodion'
        		}).append($('<div/>', {
        		    'class': 'panel-body',
        		    'id': sanitizeStr(json[i].category).toLowerCase() + '_accodion_html'
        		    //'html': ''
        		}))));

        		currentCategory = json[i].category
        	}
        	// Creates the user input and adds it to the currect section in the accordion.
        	createInteractableInput(json[i]);
        }

        toastr.success('Loaded all settings!');
	}


	$.ajax({
		cache: false,
        dataType: 'json',
        url: '../common/json/properties.json',
        method: 'GET',
        success: function(data) {
        	generateAccordionSettings(data);
        },
        error: function(data) {

        }
	});
});