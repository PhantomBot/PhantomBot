/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
 * You can also generate modals with jQuery, see util/helpers.js for more information.
 */
$(function() {
    var cluster = null,
        timer = null;

    /*
     * @function Loads the player page.
     *
     * @param {boolean} hasPlaylistData - If a playlist is loaded.
     */
    const openPlayer = hasPlaylistData => {
        $('.loader').fadeOut(6e2, () => {
            $(this).remove();
        });
        // Show the page.
        $('#main').fadeIn(5e2);

        if (!hasPlaylistData && player.hasAPIKey() && !player.secondConnection) {
            toastr.error('Failed to load a playlist with songs.');

            // Create a fake progress slider.
            player.progressSlider = $('#progress-slider').slider({
                'value': 0,
                'min': 0,
                'step': 0.1,
                'tooltip': 'hide',
                'selection': 'none'
            });

            // Error the to user.
            helpers.getErrorModal('Playlist Error', 'Failed to load a playlist with songs, please load a playlist.', () => {
                player.dbQuery('get_playlists', 'yt_playlists_registry', (results) => {
                    // Get the keys.
                    results = Object.keys(results);
                    const playlists = [];

                    for (let i = 0; i < results.length; i++) {
                        if (results[i].indexOf('ytPlaylist_') !== -1) {
                            playlists.push(results[i].slice(results[i].indexOf('_') + 1));
                        }
                    }

                    helpers.getPlaylistModal('Load Playlist', 'Playlist Name', 'Load', 'Playlist', playlists, () => {
                        let playlist = $('#playlist-load').find(':selected').text();

                        if (playlist === 'Select a playlist') {
                            toastr.error('Please select a valid playlist.');
                        } else {
                            if (playlist.length > 0) {
                                player.loadPlaylist(playlist);
                                toastr.success('Loading playlist: ' + playlist);

                                if (player.firstLoad === true) {
                                    player.ready();
                                }
                            }
                        }
                    }).modal('toggle');
                });
            }).modal('toggle');
        }
    };

    /*
     * Global function that is called once the socket is connected and that the YouTube iframe is loaded.
     */
    window.onYouTubeIframeAPIReady = () => {
        // Set a timer in case no songs load to send a error.
        timer = setTimeout(openPlayer, 5e3, false);

        // Set a var for the slider.
        player.canSlide = true;
        // Set a var for the first load.
        player.firstLoad = true;

        // Check if the player is disabled right away.
        player.dbQuery('get_module_status', 'modules', (data) => {
            if (data['./systems/youtubePlayer.js'] == 'false') {
                helpers.getErrorModal('Module Disabled', 'The YouTube player module is disabled, please go and enable it.', () => {
                    window.location.reload();
                }).modal('toggle');

                openPlayer(true);
                clearTimeout(timer);
            }
        });

        // Add a listener to load the main playlist.
        player.addListener('playlist', (e) => {
            let table = [],
                playlist = e.playlist;

            // Set the playlist name.
            $('#playlist-name').html('(' + e.playlistname + ')');

            // Table header.
            table.push(($('<tr>').append($('<th/>', {
                'style': 'width: 5%;',
                'html': '#'
            })).append($('<th/>', {
                'style': 'width: 70%;',
                'html': 'Song'
            })).append($('<th/>', {
                'style': 'width: 15%;',
                'html': 'Duration'
            })).append($('<th/>', {
                'style': 'width: 10%; text-align: right; padding-right: 16px;',
                'html': 'Actions'
            }))).html());

            for (let i = 0; i < playlist.length; i++) {
                let row = $('<tr/>');

                // Add position.
                row.append($('<td/>', {
                    'text': i,
                    'style': 'width: 5%;'
                }));

                // Add song name.
                row.append($('<td/>', {
                    'text': playlist[i].title,
                    'style': 'width: 70%;'
                }));

                // Add duration.
                row.append($('<td/>', {
                    'text': playlist[i].duration,
                    'style': 'width: 15%;'
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
                        'data-song-play': 'on',
                        'html': $('<i/>', {
                            'class': 'fas fa-play'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-secondary btn-sm',
                        'data-toggle': 'tooltip',
                        'title': 'Delete song',
                        'data-song': playlist[i].song,
                        'data-song-remove': 'on',
                        'html': $('<i/>', {
                            'class': 'fas fa-trash'
                        })
                    })),
                    'style': 'width: 10%;'
                }));

                // Append the row.
                table.push(row[0].outerHTML);
            }

            // Render the data.
            if (cluster !== null) {
                cluster.update(table);
            } else {
                cluster = new Clusterize({
                    rows: table,
                    scrollId: 'playlist-table-id',
                    contentId: 'playlist-content',
                    callbacks: {
                        clusterChanged: () => {
                            // Remove old events and register new ones.
                            $('[data-song-play="on"]').off().on('click', (e) => {
                                // Play the song.
                                player.updateSong($(e.currentTarget).data('song'));
                                // Hide the tooltip.
                                $(e.currentTarget).tooltip('hide');
                            });

                            // Remove old events and register new ones.
                            $('[data-song-remove="on"]').off().on('click', (e) => {
                                // Delete the song.
                                player.removeSongFromPlaylist($(e.currentTarget).data('song'));
                                // Hide the tooltip.
                                $(e.currentTarget).tooltip('hide');
                                // Remove the row.
                                $(e.currentTarget.closest('tr')).remove();
                            });
                        }
                    }
                });
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
                // Clear timer
                clearTimeout(timer);
                // Remove loader.
                openPlayer(true);
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

        // Pause listener.
        player.addListener('pause', () => {
            if (player.API.getPlayerState() === 2) {
                player.API.playVideo();
            } else {
                player.API.pauseVideo();
            }
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
                },
                'onError': (e) => {
                    player.sendError(e.data);
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
    // Delete current song from playlist button.
    $('#del-cur-playlist-button').on('click', () => {
        player.deleteFromPlaylist();
        toastr.success('Deleted from playlist: ' + (player.temp.title.length > 30 ? player.temp.title.substring(0, 30) + '...' : player.temp.title));
    });

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
        helpers.getSongModal('Add Song to Queue', 'Song Name or YouTube Url', 'Add', 'https://youtu.be/dQw4w9WgXcQ', () => {
            let song = $('#song-url').val();

            if (song.length > 0) {
                player.requestSong(song);
            }
        }).modal('toggle');
    });

    // Add song to playlist button.
    $('#playlist-add-song-button').on('click', () => {
        helpers.getSongModal('Add Song to Playlist', 'Song Name or YouTube Url', 'Add', 'https://youtu.be/dQw4w9WgXcQ', () => {
            let song = $('#song-url').val();

            if (song.length > 0) {
                player.addSongToPlaylist(song);
            }
        }).modal('toggle');
    });

    // Load playlist button.
    $('#load-playlist-button').on('click', () => {
        player.dbQuery('get_playlists', 'yt_playlists_registry', (results) => {
            // Get the keys.
            results = Object.keys(results);
            const playlists = [];

            for (let i = 0; i < results.length; i++) {
                if (results[i].indexOf('ytPlaylist_') !== -1) {
                    playlists.push(results[i].slice(results[i].indexOf('_') + 1));
                }
            }

            helpers.getPlaylistModal('Load Playlist', 'Playlist Name', 'Load', 'Playlist', playlists, () => {
                let playlist = $('#playlist-load').find(':selected').text();

                if (playlist === 'Select a playlist') {
                    toastr.error('Please select a valid playlist.');
                } else {
                    if (playlist.length > 0) {
                        player.loadPlaylist(playlist);
                        toastr.success('Loading playlist: ' + playlist);
                    }
                }
            }).modal('toggle');
        });
    });

    // Settings button.
    $('#settings-button').on('click', () => {
        helpers.getSettingsModal(() => {
            // Save the new size.
            localStorage.setItem('phantombot_ytplayer_size', $('#player-size-btn').text().toLowerCase());
            // Set the new size.
            helpers.setPlayerSize();

            // Update DJ name.
            let djName = $('#dj-name').val();
            if (djName.length > 0) {
                player.dbUpdate('dj_name_up', 'ytSettings', 'playlistDJname', String(djName));
            }

            // Update user max songs.
            let maxSongs = $('#max-song-user').val();
            if (parseInt(maxSongs) > 0) {
                player.dbUpdate('max_song_up', 'ytSettings', 'songRequestsMaxParallel', String(maxSongs));
            }

            // Update max song length.
            let maxSongLen = $('#max-song-length').val();
            if (parseInt(maxSongLen) > 0) {
                player.dbUpdate('max_song_len_up', 'ytSettings', 'songRequestsMaxSecondsforVideo', String(maxSongLen));
            }

            //Update the votecount.
            let voteCount = $('#vote-count').val();
            if (parseInt(voteCount) > 0) {
                player.dbUpdate('vote_count', 'ytSettings', 'voteCount', String(voteCount));
            }
        });
    });

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
            show: 350,
            hide: 50
        }
    });
});

// Load other player settings.
$(function() {
    // Toastr options.
    toastr.options.progressBar = true;
    toastr.options.preventDuplicates = true;

    // Set the player size.
    helpers.setPlayerSize();
    if (helpers.urlIsIP()) {
        toaster.warning('You may be accessing the YouTube player by using an IP Address in the URL.<br/><br/>'
            + 'YouTube\'s embed API really hates this and may refuse to work.<br/><br/>You should switch to using a '
            + 'Hostname, Domain, or Sub-Domain to avoid issues.', 'Potential Conflict Detected',
            {
                timeOut: 60000,
                extendedTimeOut: 120000,
                closeButton: true
            });
    }
});
