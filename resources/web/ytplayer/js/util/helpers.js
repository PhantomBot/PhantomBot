// Script that has helper functions.
$(function() {
	var helpers = {};

	/*
	 * @function Generates a basic modal, you have to append your own body with jQuery.
	 *
	 * @param  {String}   id
	 * @param  {String}   title
	 * @param  {String}   btn
	 * @param  {Object}   body
	 * @param  {Function} onClose
	 * @return {Object}
	 */
	helpers.getModal = (id, title, btn, body, onClose) => {
		return $('<div/>', {
			'class': 'modal fade',
			'id': id
		}).append($('<div/>', {
			'class': 'modal-dialog'
		}).append($('<div/>', {
			'class': 'modal-content'
		}).append($('<div/>', {
			'class': 'modal-header',
		}).append($('<h5/>', {
			'class': 'modal-title',
			'text': title
		})).append($('<button/>', {
			'type': 'button',
			'class': 'close',
			'data-dismiss': 'modal',
			'html': '&times;'
		}))).append($('<div/>', {
			'class': 'modal-body',
			'html': body
		})).append($('<div/>', {
			'class': 'modal-footer',
		}).append($('<button/>', {
			'class': 'btn btn-primary',
			'type': 'button',
			'text': btn,
			'data-dismiss': 'modal',
			'click': onClose
		}))))).on('hidden.bs.modal', () => {
			$('#' + id).remove();
		});
	};

	/*
     * @function Generates a simple add song modal.
     *
     * @param  {String}   title
     * @param  {String}   label
     * @param  {String}   btn
     * @param  {String}   placeholder
     * @param  {Function} onClose
     * @return {Object}
     */
    helpers.getSongModal = (title, label, btn, placeholder, onClose) => {
    	return helpers.getModal('song-modal', title, btn, $('<div/>', {
			'class': 'form-group'
		}).append($('<label/>', {
			'text': label
		})).append($('<input/>', {
			'class': 'form-control',
			'type': 'text',
			'placeholder': placeholder,
			'id': 'song-url',
			'focus': () => {
				$('#song-url').attr('placeholder', '');
			},
			'blur': () => {
				$('#song-url').attr('placeholder', placeholder);
			}
		})), onClose);
    };

    /*
     * @function Generates the settings modal
     *
     * @param  {Function} onClose
     * @return {Object}
     */
    helpers.getSettingsModal = (onClose) => {
    	return helpers.getModal('settings-modal', 'YouTube Player and Request Settings', 'Save', $('<div/>', {
			'class': 'form-group'
		}).append($('<label/>', {
			'text': 'Player Size'
		})).append($('<div/>', {
			'class': 'dropdown'
		}).append($('<button/>', {
			'class': 'btn btn-secondary dropdown-toggle',
			'type': 'button',
			'data-toggle': 'dropdown',
			'text': helpers.getPlayerSize(),
			'id': 'player-size-btn'
		})).append($('<div/>', {
			'class': 'dropdown-menu',
			'aria-labelledby': 'player-size-btn'
		}).append($('<a/>', {
			'class': 'dropdown-item',
			'href': '#',
			'text': 'Default',
			'click': () => {
				$('#player-size-btn').text('Default');
			}
		})).append($('<a/>', {
			'class': 'dropdown-item',
			'href': '#',
			'text': 'Half',
			'click': () => {
				$('#player-size-btn').text('Half');
			}
		})).append($('<a/>', {
			'class': 'dropdown-item',
			'href': '#',
			'text': 'Small',
			'click': () => {
				$('#player-size-btn').text('Small');
			}
		})).append($('<a/>', {
			'class': 'dropdown-item',
			'href': '#',
			'text': 'Tiny',
			'click': () => {
				$('#player-size-btn').text('Tiny');
			}
		})))), onClose);
    };

    /*
     * @function Gets the player size.
     *
     * @return {String}
     */
    helpers.getPlayerSize = () => {
    	let size = localStorage.getItem('phantombot_ytplayer_size');

    	return (size === null ? 'Default' : size[0].toUpperCase() + size.substr(1));
    };

    /*
     * @function Sets the new player size.
     */
    helpers.setPlayerSize = () => {
   		switch (localStorage.getItem('phantombot_ytplayer_size')) {
   		    case 'half':
   		        $('#left-section').attr('class', 'col-md-6');
   		        $('#right-section').attr('class', 'col-md-6');
   		        break;
   		    case 'small':
   		        $('#left-section').attr('class', 'col-md-5');
   		        $('#right-section').attr('class', 'col-md-7');
   		        break;
   		    case 'tiny':
   		        $('#left-section').attr('class', 'col-md-4');
   		        $('#right-section').attr('class', 'col-md-8');
   		        break;
   		    default:
   		        $('#left-section').attr('class', 'col-md-7');
   		        $('#right-section').attr('class', 'col-md-5');
    	}
    };

    // Export object.
    window.helpers = helpers;
});
