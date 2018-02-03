/*
 * Copyright (C) 2016-2018 phantombot.tv
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
 *
 * @author ScaniaTV
 */

/*
 * Main player functions and listeners.
 *
 * Every global functions should be added under the "player" object.
 * The iframe API from YouTube can be accessed from "player.API".
 * Basic information about the current song can be access with "player.temp.song", "player.temp.title", and "player.temp.requester".
 * For more functions under the "player" object, take a look at the socket.js script.
 */
$(function() {
    /*
     * Global function that is called once the socket is connected and that the YouTube iframe is loaded.
     */
    window.onYouTubeIframeAPIReady = () => {
    	// Set a var for the slider.
    	player.canSlide = true;
    	// Set a var for the first load.
    	player.firstLoad = true;

    	// Add a listener to load the main playlist.
        player.addListener('playlist', (e) => {
            let table = $('#playlist-table-content'),
                playlist = e.playlist;

            // Remove the current data from the table.
            table.find('tr:gt(0)').remove();

            // Set the playlist name.
            $('#playlist-name').html('(' + e.playlistname + ')');

            for (let i = 0; i < playlist.length; i++) {
                let row = $('<tr/>');

                // Add position.
                row.append($('<td/>', {
                    'text': i
                }));

                // Add song name.
                row.append($('<td/>', {
                    'text': playlist[i].title
                }));

                // Add duration.
                row.append($('<td/>', {
                    'text': playlist[i].duration
                }));

                // Add buttons.
                row.append($('<td/>', {
                	'html': $('<div/>', {
                		'class': 'btn-group btn-group-justified header-button'
                	}).append($('<button/>', {
                		'type': 'button',
                		'class': 'btn btn-secondary btn-sm',
                		'data-toggle': 'tooltip',
                		'title': 'Play song',
                		'data-song': playlist[i].song,
                		'html': $('<i/>', {
                			'class': 'fas fa-play'
                		}),
                		'click': (e) => {
                			// Update the song.
                			player.updateSong($(e.currentTarget).data('song'));
                			// Hide the tooltip.
                			$(e.currentTarget).tooltip('hide');
                		}
                	})).append($('<button/>', {
                		'type': 'button',
                		'class': 'btn btn-secondary btn-sm',
                		'data-toggle': 'tooltip',
                		'title': 'Delete song',
                		'data-song': playlist[i].song,
                		'html': $('<i/>', {
                			'class': 'fas fa-trash'
                		}),
                		'click': (e) => {
                			// Delete song.
                			player.removeSongFromPlaylist($(e.currentTarget).data('song'));
                			// Hide the tooltip.
                			$(e.currentTarget).tooltip('hide');
                		}
                	}))
                }));

                // Append the row.
                table.append(row);
            }
        });

        // Add a listener for the songrequest queue.
        player.addListener('songlist', (e) => {
            let table = $('#queue-table-content'),
                songlist = e.songlist;

            // Remove the current data from the table.
            table.find('tr:gt(0)').remove();

            for (let i = 0; i < songlist.length; i++) {
                let row = $('<tr/>');

                // Add position.
                row.append($('<td/>', {
                    'text': i
                }));

                // Add song name.
                row.append($('<td/>', {
                    'text': songlist[i].title
                }));

                // Add duration.
                row.append($('<td/>', {
                    'text': songlist[i].duration
                }));

                // Add requester.
                row.append($('<td/>', {
                    'text': songlist[i].requester
                }));

                // Add buttons.
                row.append($('<td/>', {
                	'html': $('<div/>', {
                		'class': 'btn-group btn-group-justified header-button'
                	}).append($('<button/>', {
                		'type': 'button',
                		'class': 'btn btn-secondary btn-sm',
                		'data-toggle': 'tooltip',
                		'data-song': songlist[i].song,
                		'title': 'Play song',
                		'html': $('<i/>', {
                			'class': 'fas fa-play'
                		}),
                		'click': (e) => {
                			// Jump to the song.
                			player.updateSong($(e.currentTarget).data('song'));
                			// The song once jumped to it.
                			player.removeSongFromRequest($(e.currentTarget).data('song'));
                			// Hide the tooltip, or could stay opened.
                			$(e.currentTarget).tooltip('hide');
                		}
                	})).append($('<button/>', {
                		'type': 'button',
                		'class': 'btn btn-secondary btn-sm',
                		'data-toggle': 'tooltip',
                		'title': 'Delete song',
                		'data-song': songlist[i].song,
                		'html': $('<i/>', {
                			'class': 'fas fa-trash'
                		}),
                		'click': (e) => {
                			// Delete song.
                			player.removeSongFromRequest($(e.currentTarget).data('song'));
                			// Hide the tooltip, or could stay opened.
                			$(e.currentTarget).tooltip('hide');
                		}
                	}))
                }));

                // Append the row.
                table.append(row);
            }
        });

        // Add a listener for the volume.
        player.addListener('setvolume', (e) => {
        	player.API.setVolume(e.setvolume);

        	// Update the value under the slider.
        	$('#volume-slider-value').html(e.setvolume + '%');

        	// Update the icon.
        	$('#mute-button-icon').attr('class', (e.setvolume === 0 ? 'fas fa-volume-off' : (e.setvolume > 50 ? 'fas fa-volume-up' : 'fas fa-volume-down')));

        	// Always destroy the old slider.
        	if (player.volumeSlider !== undefined) {
        		player.volumeSlider.slider('destroy');
        	}

        	// Add the volume slider event.
        	player.volumeSlider = $('#volume-slider').slider({
        		'value': e.setvolume,
        		'min': 0,
        		'max': 100,
        		'step': 1,
        		'tooltip': 'hide'
    		}).on('slide', (e) => {
    			// Make sure the player wasn't muted.
    			if (player.API.isMuted()) {
    				player.API.unMute();
    			}
    			// Update the player volume
    			player.API.setVolume(e.value);
    			// Update the value under the slider.
        		$('#volume-slider-value').html(e.value + '%');
        		// Update the icon.
        		$('#mute-button-icon').attr('class', (e.value === 0 ? 'fas fa-volume-off' : (e.value > 50 ? 'fas fa-volume-up' : 'fas fa-volume-down')));
    		}).on('slideStop', (e) => {
    			// Update the player volume
    			player.API.setVolume(e.value);
    			// Send the volume update event to the bot once done updating.
    			player.updateVolume(e.value);
    			// Update the value under the slider.
        		$('#volume-slider-value').html(e.value + '%');
        		// Update the icon.
        		$('#mute-button-icon').attr('class', (e.value === 0 ? 'fas fa-volume-off' : (e.value > 50 ? 'fas fa-volume-up' : 'fas fa-volume-down')));
    		});
        });

        // Add a listener for the play event.
        player.addListener('play', (e) => {
        	// If this is the first load, start the player paused.
        	if (player.firstLoad === true) {
        		// Queue the first video
        		player.API.cueVideoById(e.play, 0, 'medium');
        		// Mark as not first load.
        		player.firstLoad = false;
        		// Remove loader.
                $('.loader').fadeOut(6e2, () => {
                    $(this).remove();
                });
                // Show the page.
                $('#main').fadeIn(5e2);
        		// Alert the user.
        		toastr.info('Song queued: ' + (e.title.length > 30 ? e.title.substring(0, 30) + '...' : e.title));
        	} else {
        		player.API.loadVideoById(e.play, 0, 'medium');
        		toastr.success('Now playing: ' +  (e.title.length > 30 ? e.title.substring(0, 30) + '...' : e.title));
        	}

        	// Update the value under the slider.
        	$('#progress-slider-value').html(e.duration);

        	// Always destroy the old slider.
        	if (player.progressSlider !== undefined) {
        		player.progressSlider.slider('destroy');
        	}

        	// Add progress slider event.
        	player.progressSlider = $('#progress-slider').slider({
        		'value': 0,
        		'min': 0,
        		'step': 0.1,
        		'tooltip': 'hide',
        		'selection': 'none'
    		}).on('slide', (e) => {
       			player.API.seekTo(e.value, true);
       		}).on('slideStart', () => {
       			player.canSlide = false;
    		}).on('slideStop', () => {
    			player.canSlide = true;
    		});

    		// Update title information.
    		$('#video-title').html(e.title);
    		$('#video-url').html('<a href="https://youtu.be/' + e.play + '" target="_blank">https://youtu.be/' + e.play + '</a>');
    		$('#user-requester').html(e.requester);

        	// Request the songlist to remove played songs.
        	player.requestRequestList('songlist');

    		// Save this info for other use.
    		player.temp = {
    			song: e.play,
    			title: e.title,
    			user: e.requester
    		};
        });

        // Load the player.
        player.API = new YT.Player('player-frame', {
        	events: {
        		'onReady': () => {
        			// Request the playlist.
        			player.requestPlaylist('playlist');

        			// Request the songlist.
        			player.requestRequestList('songlist');

        			// Send the ready event.
        			player.ready();

                    // Interval that updates the progess slider.
                    setInterval(() => {
                        if (player.progressSlider !== undefined && player.API.getPlayerState() === 1 && player.canSlide) {
                            player.progressSlider.slider('setAttribute', 'max', player.API.getDuration());
                            player.progressSlider.slider('setValue', player.API.getCurrentTime());
                        }
                    }, 5e2);
        		},
        		'onStateChange': (e) => {
        			// Make sure the button shows pause.
        			if (e.data === 1) {
        				$('#play-pause-button').attr('class', 'fas fa-pause');
        			} else if (e.data === 2) {
        				$('#play-pause-button').attr('class', 'fas fa-play');
        			}

        			player.updateState(e.data);
        		}
        	},
        	playerVars: {
            	iv_load_policy: 3,
            	controls: 0,
            	showinfo: 0,
            	showsearch: 0,
            	autoplay: 1,
                rel: 0
        	}
        });
    };
});

// Buttons and events.
$(function() {
	// Fav button to steal a song.
	$('#fav-button').on('click', () => {
		player.addSongToPlaylist();
		toastr.success('Added to playlist: ' + (player.temp.title.length > 30 ? player.temp.title.substring(0, 30) + '...' : player.temp.title));
	});

	// Skip song button.
	$('#skip-button').on('click', () => {
        // Mark the state as paused.
        player.updateState(2);
        // Skip the song.
		player.skipSong();
	});

	// Mute button.
	$('#mute-button').on('click', () => {
		if (player.API.isMuted()) {
			player.API.unMute();
			$('#mute-button-icon').attr('class', (player.API.getVolume() === 0 ? 'fas fa-volume-off' : (player.API.getVolume() > 50 ? 'fas fa-volume-up' : 'fas fa-volume-down')));
		} else {
			player.API.mute();
			$('#mute-button-icon').attr('class', 'fas fa-volume-off');
		}
	});

	// Pause button.
	$('#pause-button').on('click', () => {
		if (player.API.getPlayerState() === 2 || player.API.getPlayerState() === 5) {
			player.API.playVideo();
			$('#play-pause-button').attr('class', 'fas fa-pause');
		} else {
			player.API.pauseVideo();
			$('#play-pause-button').attr('class', 'fas fa-play');
		}
	});

	// Add song to queue button.
	$('#queue-add-song-button').on('click', () => {
		generateModal('Add Song to Queue', 'Song Name or YouTube Url', 'Add', 'https://youtu.be/dQw4w9WgXcQ', () => {
			let song = $('#song-url').val();

			if (song.length > 0) {
				player.requestSong(song);
			}
		}).modal('toggle');
	});

	// Add song to playlist button.
	$('#playlist-add-song-button').on('click', () => {
		generateModal('Add Song to Playlist', 'Song Name or YouTube Url', 'Add', 'https://youtu.be/dQw4w9WgXcQ', () => {
			let song = $('#song-url').val();

			if (song.length > 0) {
				player.addSongToPlaylist(song);
			}
		}).modal('toggle');
	});

	// Load playlist button.
	//$('#load-playlist-button').on('click', () => {
	//	generateModal('Load Playlist', 'Playlist Name', 'Load', 'Playlist', () => {

	//	}).modal('toggle');
	//});

	// Playlist shuffle button.
	$('#playlist-shuffle-button').on('click', () => {
		player.shufflePlaylist();
	});

	// Enable global tooltips.
    $('body').tooltip({
        selector: '[data-toggle="tooltip"]',
        container: 'body',
        trigger: 'hover',
        delay: {
            show: 250,
            hide: 50
        }
    });

    /*
     * @function generates a modal
     *
     * @param {String}   title
     * @param {String}   label
     * @param {String}   btn
     * @param {String}   placeholder
     * @param {Function} onClick
     */
    let generateModal = (title, label, btn, placeholder, onClick) => {
    	return $('<div/>', {
			'class': 'modal fade',
			'id': 'main-modal'
		}).append($('<div/>', {
			'class': 'modal-dialog'
		}).append($('<div/>', {
			'class': 'modal-content'
		}).append($('<div/>', {
			'class': 'modal-header'
		}).append($('<h5/>', {
			'class': 'modal-title',
			'text': title
		}))).append($('<div/>', {
			'class': 'modal-body',
			'html': $('<div/>', {
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
			}))
		})).append($('<div/>', {
			'class': 'modal-footer',
		}).append($('<button/>', {
			'class': 'btn btn-primary',
			'type': 'button',
			'text': btn,
			'data-dismiss': 'modal',
			'click': onClick
		}))))).on('hidden.bs.modal', () => {
			$('#main-modal').remove();
		});
    };
});

// Setup toast notification settings.
$(function() {
	toastr.options.progressBar = true;
	toastr.options.preventDuplicates = true;
});

// Set the player div size here.
$(function() {
    let size = localStorage.getItem('phantombot_ytplayer_size');

    switch (size) {
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
});