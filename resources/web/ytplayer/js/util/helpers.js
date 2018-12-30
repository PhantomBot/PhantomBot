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
            'text': 'Wähle eine Playlist aus',
            'style': 'width: 100%; cursor: pointer;',
            'data-toggle': 'dropdown'
        }).append($('<option/>', {
            'html': 'Wähle eine Playlist aus',
            'selected': 'true',
            'disabled': 'true',
            'hidden': 'true'
        })).append(playlists.map(function(playlist) {
            return $('<option/>', {
                'html': playlist
            });
        })).append($('<option/>', {
            'html': 'Wähle eine Playlist aus',
            'disabled': 'true',
            'hidden': 'true'
        }))), onClose);
    };

    /*
     * @function Generates the settings modal
     *
     * @param  {Function} onClose
     */
    helpers.getSettingsModal = (onClose) => {
        player.dbQuery('yt_settings', 'ytSettings', (e) => {
            helpers.getModal('settings-modal', 'YouTube Player und Request Einstellungen', 'Speichern', $('<form/>').append($('<div/>', {
                'class': 'form-group'
            }).append($('<label/>', {
                'text': 'Player-Größe'
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
                'text': 'Standard',
                'click': () => {
                    $('#player-size-btn').text('Default');
                }
            })).append($('<a/>', {
                'class': 'dropdown-item',
                'href': '#',
                'text': 'Hälfte',
                'click': () => {
                    $('#player-size-btn').text('Half');
                }
            })).append($('<a/>', {
                'class': 'dropdown-item',
                'href': '#',
                'text': 'Klein',
                'click': () => {
                    $('#player-size-btn').text('Small');
                }
            })).append($('<a/>', {
                'class': 'dropdown-item',
                'href': '#',
                'text': 'Winzig',
                'click': () => {
                    $('#player-size-btn').text('Tiny');
                }
            })).append($('<a/>', {
                'class': 'dropdown-item',
                'href': '#',
                'text': 'Versteckt',
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
                'title': 'Name des standardmäßigen Playlist-Benutzers.',
                'class': 'form-control',
                'id': 'dj-name',
                'value': e.playlistDJname
            }))).append($('<div/>', {
                'class': 'form-group',
            }).append($('<label/>', {
                'text': 'Maximale Songs'
            })).append($('<input/>', {
                'type': 'number',
                'data-toggle': 'tooltip',
                'title': 'Wie viele Songs kann ein Benutzer in der Warteschlange haben.',
                'class': 'form-control',
                'id': 'max-song-user',
                'value': e.songRequestsMaxParallel
            }))).append($('<div/>', {
                'class': 'form-group'
            }).append($('<label/>', {
                'text': 'Maximale Songlänge'
            })).append($('<input/>', {
                'type': 'number',
                'data-toggle': 'tooltip',
                'id': 'max-song-length',
                'title': 'Wie lang in Sekunden ein Song sein darf.',
                'class': 'form-control',
                'value': e.songRequestsMaxSecondsforVideo
            }))), onClose).modal('toggle');
        });
    };

    /*
     * @function Gets the player size.
     *
     * @return {String}
     */
    helpers.getPlayerSize = () => {
        let size = localStorage.getItem('phantombot_ytplayer_size');

        return (size === null ? 'Standart' : size[0].toUpperCase() + size.substr(1));
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

    // Export object.
    window.helpers = helpers;
});