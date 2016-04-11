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

    // Import the HTML file for this panel.
    $("#audioPanel").load("/panel/audio.html");

    // Export functions to HTML.
    $.playIonSound = playIonSound;
})();
