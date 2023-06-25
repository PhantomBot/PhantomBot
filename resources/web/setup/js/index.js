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

	// Creates user input setting.
	function createInteractableInput(json) {

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
            		'class': 'panel panel-default'
        		}).append($('<div/>', {
        		    'class': 'panel-heading'
        		}).append($('<a/>', {
        		    'data-toggle': 'collapse',
        		    'data-parent': '#accordion',
        		    'style': 'color: #ccc !important',
        		    'text': '',
        		    'href': '#' + json[i].category + '_accodion' 
        		}).append($('<h4/>', {
        		    'class': 'panel-title',
        		    'html': json[i].category
        		})))).append($('<div/>', {
        		    'class': 'panel-collapse collapse' + (json[i].category === 'Admin' ? ' in' : ''),
        		    'id': json[i].category + '_accodion'
        		}).append($('<div/>', {
        		    'class': 'panel-body',
        		    'id': json[i].category + '_accodion_html'
        		    //'html': ''
        		}))));

        		currentCategory = json[i].category
        	}
        	// Creates the user input and adds it to the currect section in the accordion.
        	createInteractableInput(json);
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