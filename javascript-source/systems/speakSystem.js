//Adding text to speech to PhantomBot
(function(){
	var textVoice = $.getSetIniDbString('speakSettings', 'textVoice', 'US English Female'),
		textVolume = $.getSetIniDbFloat('speakSettings', 'textVolume', 0.50),
		textRate = $.getSetIniDbFloat('speakSettings', 'textRate', 0.95),
		textPitch = $.getSetIniDbFloat('speakSettings', 'textPitch', 1.10);

	/**
     * @function reloadSpeak
     */
    function reloadSpeak() {
        textVoice = $.getIniDbString('speakSettings', 'textVoice'),
		textVolume = $.getIniDbFloat('speakSettings', 'textVolume'),
		textRate = $.getIniDbFloat('speakSettings', 'textRate'),
		textPitch = $.getIniDbFloat('speakSettings', 'textPitch');
	}
	
    /**
     * @event command
     */
    $.bind('command',function(event){
	    var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
			allArgs = event.getArgs(),
			action = allArgs[0],
			actionFloat = parseFloat(allArgs[0]);

		/**
		 * @commandpath tts [message] - Base command for speakSystem.
		 */
    	if (command.equalsIgnoreCase('tts')){
			var speechText =  sender + ": ";
			for (i = 0; i < allArgs.length; i++){
				speechText += allArgs[i].replace(",", "") + " ";
			}
			
			if (action) {
				$.panelsocketserver.triggerTextToSpeak(speechText +','+ textVoice +','+ textVolume +','+ textRate +','+ textPitch);
			}
		}

		/**
		 * @commandpath ttsvoice [voice] - Voice setting for speakSystem.
		 */
		if (command.equalsIgnoreCase('ttsvoice')){
			if (!action) {
				$.say($.whisperPrefix(sender) + $.lang.get('speak.ttsvoice.usage'));
			} else {
				textVoice = $.setIniDbString('speakSettings', 'textVoice', allArgs);
				reloadSpeak();
				$.say($.whisperPrefix(sender) + $.lang.get('speak.ttsvoice.set', allArgs));
			}
		}

		/**
		 * @commandpath ttsvoice [volume] - Voice setting for speakSystem.
		 */
		if (command.equalsIgnoreCase('ttsvolume')){
			if (!actionFloat) {
				$.say($.whisperPrefix(sender) + $.lang.get('speak.ttsvolume.usage'));
			} else {
				textVolume = $.getIniDbFloat('speakSettings', 'textVolume', actionFloat);
				reloadSpeak();
				$.say($.whisperPrefix(sender) + $.lang.get('speak.ttsvolume.set', actionFloat));
			}
		}

		/**
		 * @commandpath ttsrate [rate] - Rate setting for speakSystem.
		 */
		if (command.equalsIgnoreCase('ttsrate')){
			if (!actionFloat) {
				$.say($.whisperPrefix(sender) + $.lang.get('speak.ttsrate.usage'));
			} else {
				textRate = $.getIniDbFloat('speakSettings', 'textRate', actionFloat);
				reloadSpeak();
				$.say($.whisperPrefix(sender) + $.lang.get('speak.ttsrate.set', actionFloat));
			}
		}

		/**
		 * @commandpath ttspitch [pitch] - Pitch setting for speakSystem.
		 */
		if (command.equalsIgnoreCase('ttspitch')){
			if (!actionFloat) {
				$.say($.whisperPrefix(sender) + $.lang.get('speak.ttspitch.usage'));
			} else {
				textPitch = $.getIniDbFloat('speakSettings', 'textPitch', actionFloat);
				reloadSpeak();
				$.say($.whisperPrefix(sender) + $.lang.get('speak.ttspitch.set', actionFloat));
			}
		}
    });

	//Register command.
	$.bind('initReady',function(){
	    if($.bot.isModuleEnabled('./systems/speakSystem.js')){
			$.registerChatCommand('./systems/speakSystem.js','tts',7);
			$.registerChatCommand('./systems/speakSystem.js','ttsvoice',1);
			$.registerChatCommand('./systems/speakSystem.js','ttsvolume',1);
			$.registerChatCommand('./systems/speakSystem.js','ttsrate',1);
			$.registerChatCommand('./systems/speakSystem.js','ttspitch',1);
	    }
	});

	$.reloadSpeak = reloadSpeak;
})();