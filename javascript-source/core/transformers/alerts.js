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

(function () {
    var match;

    /*
     * @transformer alert
     * @formula (alert fileName:str) sends a GIF/video alert to the alerts overlay, fading out after 3 seconds
     * @formula (alert fileName:str, durationSeconds:int) sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with the audio volume set to 0.8
     * @formula (alert fileName:str, durationSeconds:int, volume:float) sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with audio volume set on a scale of 0.0-1.0
     * @formula (alert fileName:str, durationSeconds:int, volume:float, css:text) sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with audio volume set on a scale of 0.0-1.0, and the provided CSS applied to the GIF/video
     * @formula (alert fileName:str, durationSeconds:int, volume:float, css:text, message:text) sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with audio volume set on a scale of 0.0-1.0, a message under the GIF/video, and the provided CSS applied to the GIF/video and message
     * @labels twitch discord noevent alerts
     * @notes if an audio file exists next to the GIF/video file with the same fileName but an audio extension (eg. banana.gif and banana.mp3), then the audio file will automatically load and play at the provided volume
     * @example Caster: !addcom !banana (alert banana.gif)
     */
    function alert(args) {
        if ((match = args.args.match(/^ ([,.\w\W]+)$/))) {
            $.alertspollssocket.alertImage(match[1]);
            return {result: '', cache: false};
        }
    }

    /*
     * @transformer playsound
     * @formula (playsound hook:str) plays a sound hook on the alerts overlay
     * @formula (playsound hook:str|volume:float) plays a sound hook on the alerts overlay, with audio volume set on a scale of 0.0-1.0
     * @labels twitch discord noevent alerts
     * @example Caster: !addcom !good Played sound goodgood (playsound goodgood)
     * @example Caster: !addcom !evil Played sound evil (playsound evillaugh|0.5)
     */
    function playsound(args) {
        if ((match = args.args.match(/^\s([a-zA-Z0-9_\-\s\,\(\)\'\"\~]+)([|]([.0-9_]{0,5}))?$/))) {
            if (!$.audioHookExists(match[1])) {
                $.log.error('Could not play audio hook: Audio hook does not exist.');
                return {result: $.lang.get('customcommands.playsound.404', match[1])};
            }
            $.alertspollssocket.triggerAudioPanel(match[1], match[3] !== undefined ? match[3] : -1);
            return {result: '', cache: false};
        }
    }

    var transformers = [
        new $.transformers.transformer('alert', ['twitch', 'discord', 'noevent', 'alerts'], alert),
        new $.transformers.transformer('playsound', ['twitch', 'discord', 'noevent', 'alerts'], playsound)
    ];

    $.transformers.addTransformers(transformers);
})();
