/**
 * audioPanelSystem.js
 *
 * Play audio on the PhantomBot Control Panel Audio Panel
 */
(function() {

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            subCommand = args[0],
            audioHook = args[1],
            audioHookListStr;

        /**
         * @commandpath audiohook [play | list] - Base command for audio hooks.
         * @commandpath audiohook play [audio_hook] - Sends the audio_hook request to the Panel. 
         * @commandpath audiohook list - Lists the audio hooks.
         */
        if (command.equalsIgnoreCase('audiohook')) {
            var hookKeys = $.inidb.GetKeyList('audio_hooks', ''),
                hookList = [],
                idx;

            for (idx in hookKeys) {
                hookList[hookKeys[idx]] = hookKeys[idx];
            }

            if (subCommand === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('audiohook.usage'));
                return;
            }

            if (subCommand.equalsIgnoreCase('play')) {
                if (audioHook === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('audiohook.play.usage'));
                    return;
                }

                if (hookList[audioHook] === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('audiohook.play.404', audioHook));
                    return;
                }
                $.panelsocketserver.triggerAudioPanel(audioHook);
                $.say($.whisperPrefix(sender) + $.lang.get('audiohook.play.success', audioHook));
            }

            if (subCommand.equalsIgnoreCase('list')) {
                $.paginateArray(hookKeys, 'audiohook.list', ', ', true, sender);
                return;
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/audioPanelSystem.js')) {
            $.registerChatCommand('./systems/audioPanelSystem.js', 'audiohook', 2);
        }
    });
})();
