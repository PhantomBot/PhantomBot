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
            'class': 'modal-header'
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
            'class': 'modal-footer'
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
     * @function Generates a load playlist modal
     *
     * @param  {String}   title
     * @param  {String}   label
     * @param  {String}   btn
     * @param  {String}   placeholder
     * @param  {Array}    playlists
     * @param  {Function} onClose
     * @return {Object}
     */
    helpers.getPlaylistModal = (title, label, btn, placeholder, playlists, onClose) => {
        return helpers.getModal('playlist-load-modal', title, btn, $('<div/>', {
            'class': 'form-group'
        }).append($('<label/>', {
            'text': label
        })).append($('<select/>', {
            'class': 'form-control',
            'id': 'playlist-load',
            'text': 'Select a playlist',
            'style': 'width: 100%; cursor: pointer;',
            'data-toggle': 'dropdown'
        }).append($('<option/>', {
            'html': 'Select a playlist',
            'selected': 'true',
            'disabled': 'true',
            'hidden': 'true'
        })).append(playlists.map(function(playlist) {
            return $('<option/>', {
                'html': playlist
            });
        })).append($('<option/>', {
            'html': 'Select a playlist',
            'disabled': 'true',
            'hidden': 'true'
        }))), onClose);
    };

    /*
     * @function Generates a load playlist modal
     *
     * @param  {String}   title
     * @param  {String}   body
     * @param  {Function} onClose
     * @return {Object}
     */
    helpers.getErrorModal = (title, body, onClose) => {
        return helpers.getModal('err-modal', title, 'Ok', $('<div/>', {
            'class': 'form-group'
        }).append($('<p/>', {
            'text': body
        })), onClose);
    };

    /*
     * @function Generates the settings modal
     *
     * @param  {Function} onClose
     */
    helpers.getSettingsModal = (onClose) => {
        player.dbQuery('yt_settings', 'ytSettings', (e) => {
            helpers.getModal('settings-modal', 'YouTube Player and Request Settings', 'Save', $('<form/>').append($('<div/>', {
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
            })).append($('<a/>', {
                'class': 'dropdown-item',
                'href': '#',
                'text': 'Hidden',
                'click': () => {
                    $('#player-size-btn').text('Hidden');
                }
            }))))).append($('<div/>', {
                'class': 'form-group'
            }).append($('<label/>', {
                'text': 'Player DJ Name'
            })).append($('<input/>', {
                'type': 'text',
                'data-toggle': 'tooltip',
                'title': 'Name of the default playlist user.',
                'class': 'form-control',
                'id': 'dj-name',
                'value': e.playlistDJname
            }))).append($('<div/>', {
                'class': 'form-group'
            }).append($('<label/>', {
                'text': 'Maximum Songs'
            })).append($('<input/>', {
                'type': 'number',
                'data-toggle': 'tooltip',
                'title': 'How many songs one user can have in the queue.',
                'class': 'form-control',
                'id': 'max-song-user',
                'value': e.songRequestsMaxParallel
            }))).append($('<div/>', {
                'class': 'form-group'
            }).append($('<label/>', {
                'text': 'Maximum Song Duration'
            })).append($('<input/>', {
                'type': 'number',
                'data-toggle': 'tooltip',
                'id': 'max-song-length',
                'title': 'How long in seconds a song can be.',
                'class': 'form-control',
                'value': e.songRequestsMaxSecondsforVideo
            }))).append($('<div/>', {
                'class': 'form-group'
            }).append($('<label/>', {
                'text': 'Vote Count'
            })).append($('<input/>', {
                'type': 'number',
                'data-toggle': 'tooltip',
                'id': 'vote-count',
                'title': 'How many votes it takes to Skip.',
                'class': 'form-control',
                'value': e.voteCount
            }))),onClose).modal('toggle');
        });
    };

    /*
     * @function Gets the player size.
     *
     * @return {String}
     */
    helpers.getPlayerSize = () => {
        let size = localStorage.getItem('phantombot_ytplayer_size');

        return (size === null ? 'Default' : size[0].toUpperCase() + size.slice(1));
    };

    /*
     * @function Sets the new player size.
     */
    helpers.setPlayerSize = () => {
        switch (localStorage.getItem('phantombot_ytplayer_size')) {
            case 'half':
                $('#left-section').attr('class', 'col-md-6').removeClass('off');
                $('#right-section').attr('class', 'col-md-6');
                break;
            case 'small':
                $('#left-section').attr('class', 'col-md-5').removeClass('off');
                $('#right-section').attr('class', 'col-md-7');
                break;
            case 'tiny':
                $('#left-section').attr('class', 'col-md-4').removeClass('off');
                $('#right-section').attr('class', 'col-md-8');
                break;
            case 'hidden':
                $('#left-section').addClass('off');
                $('#right-section').attr('class', 'col-md-12');
                break;
            default:
                $('#left-section').attr('class', 'col-md-7').removeClass('off');
                $('#right-section').attr('class', 'col-md-5');
        }
    };

    helpers.urlIsIP = () => {
        var rx=/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/;
        return rx.test(window.location.hostname);
    };

    // Export object.
    window.helpers = helpers;
});
