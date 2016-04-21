/*
 * Copyright (C) 2016 www.phantombot.net
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

/* 
 * @author IllusionaryOne
 */

/*
 * audioPanel.js
 * Drives the Audio Panel
 */
(function() {

    /**
     * Sounds Object
     *
     * name is used by Ion.Sound to find files to play.
     * desc is used to generate the buttons for the audio panel.
     */
    var sounds = [
        { name: "beer_can_opening",	desc: "Beer Can Opening" },
        { name: "bell_ring",		desc: "Bell Ring" },
        { name: "branch_break",		desc: "Branch Break" },
        { name: "button_click",		desc: "Button Click" },
        { name: "button_click_on",	desc: "Button Click On" },
        { name: "button_push",		desc: "Button Push" },
        { name: "button_tiny",		desc: "Button Tiny" },
        { name: "camera_flashing",	desc: "Camera Flashing" },
        { name: "camera_flashing_2",	desc: "Camera Flashing 2" },
        { name: "cd_tray",		desc: "CD Tray" },
        { name: "computer_error",	desc: "Computer Error" },
        { name: "door_bell",		desc: "Door Bell" },
        { name: "door_bump",		desc: "Door Bump" },
        { name: "glass",		desc: "Glass" },
        { name: "keyboard_desk",	desc: "Keyboard Desk" },
        { name: "light_bulb_breaking",	desc: "Light Bulb Breaking" },
        { name: "metal_plate",		desc: "Metal Plate" },
        { name: "metal_plate_2",	desc: "Metal Plate 2" },
        { name: "pop_cork",		desc: "Pop Cork" },
        { name: "snap",			desc: "Snap" },
        { name: "staple_gun",		desc: "Staple Gun" },
        { name: "tap",			desc: "Tap" },
        { name: "water_droplet_2",	desc: "Water Droplet 2" },
        { name: "water_droplet_3",	desc: "Water Droplet 3" },
        { name: "water_droplet",	desc: "Water Droplet" },
        { name: "sweetcrap",		desc: "Sweet Merciful Crap" },
        { name: "badumtiss",		desc: "Ba-Dum-Tiss!" },
        { name: "whaawhaa",		desc: "Whaa Whaa Whaa" },
        { name: "nobodycares",		desc: "Nobody Cares" },
        { name: "johncena",		desc: "John Cena" },
        { name: "tutturuu",		desc: "Tutturuu" },
        { name: "wilhelmscream",	desc: "Wilhelm Scream" },
        { name: "airhorn",		desc: "Airhorn" },
        { name: "crickets",		desc: "Crickets" },
        { name: "drumroll",		desc: "Drum Roll" },
        { name: "splat",		desc: "Splat" },
        { name: "applause",		desc: "Applause" },
        { name: "r2d2",			desc: "R2D2" },
        { name: "yesyes",		desc: "M.Bison Yes Yes" },
        { name: "goodgood",		desc: "Good Good" }
    ];

    // Configure the sound panel.
    $(document).ready(function() {
        ion.sound({
            sounds: sounds,
            path: "/panel/js/ion-sound/sounds/",
            preload: true,
            volume: 1.0,
            ready_callback: ionSoundLoaded,
            ended_callback: clearIonSoundPlaying 
        });
    });

    /**
     * @function onMessage
     */
    function onMessage(message) {
        var msgObject,
            html = '',
            keyword = '';

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }

        if (panelHasQuery(msgObject)) {
            if (panelCheckQuery(msgObject, 'audio_ytpMaxReqs')) {
                $('#ytpMaxReqsInput').attr('placeholder', msgObject['results']['songRequestsMaxParallel']);
            }
            if (panelCheckQuery(msgObject, 'audio_ytpMaxLength')) {
                $('#ytpMaxLengthInput').attr('placeholder', msgObject['results']['songRequestsMaxSecondsforVideo']);
            }
            if (panelCheckQuery(msgObject, 'audio_ytpDJName')) {
                $('#ytpDJNameInput').attr('placeholder', msgObject['results']['playlistDJname']);
            }
        }
    }

    /**
     * @function doQuery
     */
    function doQuery(message) {
        sendDBQuery('audio_ytpMaxReqs', 'ytSettings', 'songRequestsMaxParallel');
        sendDBQuery('audio_ytpMaxLength', 'ytSettings', 'songRequestsMaxSecondsforVideo');
        sendDBQuery('audio_ytpDJName', 'ytSettings', 'playlistDJname');
    }

    /**
     * @function loadAudioPanel
     */
    function loadAudioPanel() {
        $("#audioPanelButtons").html('');
        for (var idx in sounds) {
            $("#audioPanelButtons").append("<button type=\"button\" class=\"soundButton\"" +
                                           "onclick=\"$.playIonSound('" + sounds[idx]['name'] + "');\">" +
                                           sounds[idx]['desc'] + "</button>");
        }
    }

    /**
     * @function ionSoundLoaded
     */
    function ionSoundLoaded() {
        $("#ionSoundLoaded").html("<span style=\"float: right\" class=\"greenPill-sm\">Ready</span>");
        loadAudioPanel();
    }

    /**
     * @function playIonSound
     * @param {String} name
     */
    function playIonSound(name)
    {
        $("#ionSoundPlaying").fadeIn(400);
        ion.sound.play(name);
    }

    /**
     * @function clearIonSoundPlaying
     */
    function clearIonSoundPlaying() {
        $("#ionSoundPlaying").fadeOut(400);
    }

    /**
     * @function toggleYouTubePlayer
     */
    function toggleYouTubePlayer() {
        if ($("#youTubePlayerIframe").is(":visible")) {
            $("#youTubePlayerIframe").fadeOut(1000);
        } else {
            $("#youTubePlayerIframe").fadeIn(1000);
        }
    }

    /**
     * @function toggleYouTubePlayerPause
     */
    function toggleYouTubePlayerPause() {
        sendCommand('ytp pause');
    }

    /**
     * @function toggleYouTubePlayerRequests
     */
    function toggleYouTubePlayerRequests() {
        sendCommand('ytp togglerequests');
    }

    /**
     * @function toggleYouTubePlayerNotify
     */
    function toggleYouTubePlayerNotify() {
        sendCommand('ytp togglenotify');
    }

    /**
     * @function setYouTubePlayerDJName
     */
    function setYouTubePlayerDJName() {
        var value = $('#ytpDJNameInput').val();
        if (value.length > 0) {
            $('#ytpDJNameInput').val('Updating...');
            sendCommand('ytp djname ' + value);
            setTimeout(function() { doQuery(); $('#ytpDJNameInput').val('') }, TIMEOUT_WAIT_TIME * 2);
        }
    }

    /**
     * @function setYouTubePlayerMaxReqs
     */
    function setYouTubePlayerMaxReqs() {
        var value = $('#ytpMaxReqsInput').val();
        if (value.length > 0) {
            $('#ytpMaxReqsInput').val('');
            $('#ytpMaxReqsInput').attr('placeholder', value);
            sendCommand('ytp setrequestmax ' + value);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 2);
        }
    }

    /**
     * @function setYouTubePlayerMaxLength
     */
    function setYouTubePlayerMaxLength() {
        var value = $('#ytpMaxLengthInput').val();
        if (value.length > 0) {
            $('#ytpMaxLengthInput').val('');
            $('#ytpMaxLengthInput').attr('placeholder', value);
            sendCommand('ytp setmaxvidlength ' + value);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 2);
        }
    }

    /**
     * @function fillYouTubePlayerIframe
     */
    function fillYouTubePlayerIframe() {
        $('#youTubePlayerIframe').html('<iframe id="youTubePlayer" frameborder="0" scrolling="auto" height="400" width="680"'+
                                       '        src="http://' + url[0] + ':' + (getPanelPort() + 1) + '/ytplayer?start_paused">');
    }

    /**
     * @function launchYouTubePlayer
     */
    function launchYouTubePlayer() {
        window.open('http://' + url[0] + ':' + (getPanelPort() + 1) + '/ytplayer', 'PhantomBot YouTube Player',
                    'menubar=no,resizeable=yes,scrollbars=yes,status=no,toolbar=no,height=700,width=900,location=no' );
    }

    /**
     * function drawYouTubePlayer
     */
    function drawYouTubePlayer() {
        if (YOUTUBE_IFRAME === true) {
            fillYouTubePlayerIframe();
            $('#youTubeLauncher').html('<button type="button" class="btn btn-primary inline pull-left" onclick="$.toggleYouTubePlayer()">Hide/Show YouTube Player</button>' +
                                       '<button type="button" class="btn btn-primary inline pull-left" onclick="$.toggleYouTubePlayerPause()">Toggle Pause</button>');
        } else {
            $('#youTubeLauncher').html('<button type="button" class="btn btn-primary inline pull-left" onclick="$.launchYouTubePlayer()">Launch YouTube Player</button>');
        }
    }

    // Import the HTML file for this panel.
    $("#audioPanel").load("/panel/audio.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function() {
        if (TABS_INITIALIZED) {
            drawYouTubePlayer();
        }
        if (isConnected && TABS_INITIALIZED) {
            doQuery();
            clearInterval(interval);
        }
    }, INITIAL_WAIT_TIME);

    // Query the DB every 30 seconds for updates.
    setInterval(function() {
        var active = $('#tabs').tabs('option', 'active');
        if (active == 16 && isConnected) {
            newPanelAlert('Refreshing Audio Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);

    // Export to HTML
    $.audioOnMessage = onMessage;

    // Export functions to HTML.
    $.playIonSound = playIonSound;
    $.toggleYouTubePlayer = toggleYouTubePlayer;
    $.toggleYouTubePlayerPause = toggleYouTubePlayerPause;
    $.toggleYouTubePlayerNotify = toggleYouTubePlayerNotify;
    $.toggleYouTubePlayerRequests = toggleYouTubePlayerRequests;
    $.setYouTubePlayerDJName = setYouTubePlayerDJName;
    $.setYouTubePlayerMaxReqs = setYouTubePlayerMaxReqs;
    $.setYouTubePlayerMaxLength = setYouTubePlayerMaxLength;
    $.fillYouTubePlayerIframe = fillYouTubePlayerIframe;
    $.launchYouTubePlayer = launchYouTubePlayer;
})();
