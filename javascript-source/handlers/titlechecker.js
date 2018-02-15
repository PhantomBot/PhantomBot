/**
 * titlechecker.js
 * 
 * 
 */
(function() {
    var subWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'subscriberWelcomeToggle', true),
        primeSubWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'primeSubscriberWelcomeToggle', true),
        reSubWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'reSubscriberWelcomeToggle', true),
        giftSubWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'giftSubWelcomeToggle', true),
        announce = false,

	
		
		wordsToSay = '';
	
	
    function sayFunction(wordsToSay) {
        announce = true;////////////
        if (announce == true) {
            $.say(wordsToSay);
        }
    }
 
    function getStreamInfo() {
        announce = true;////////////
       
gameName = $.twitchcache.getGameTitle();
streamTitle = $.twitchcache.getStreamStatus();

$.consoleLn('stream title and game updated');
$.consoleLn('stream title = ' + streamTitle);
$.consoleLn('stream game = ' + gameName);
	   
    }
 
 
  
 $.bind('twitchTitleChange', function(event) {
streamTitle = $.twitchcache.getStreamStatus();
$.consoleLn('stream title = ' + streamTitle);

	$.consoleLn('title change');

 });
 
 
 
 $.bind('twitchGameChange', function(event) {
	 gameName = $.twitchcache.getGameTitle();
	 $.consoleLn('stream game = ' + gameName);
	 $.consoleLn('game change');

 });
 
 
   
    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argsString = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            planId;
			
			
 //       if (command.equalsIgnoreCase('subgrouptoggle')) {
 //           refreshSubscribeConfig()
 //           subgrouptoggle = !subgrouptoggle;
 //           $.consoleLn(subgrouptoggle);
 //           $.setIniDbBoolean('subscribeHandler', 'subGroupToggle', subgrouptoggle);
 //           sayFunction($.whisperPrefix(sender) + (subgrouptoggle ? 'Sub groups will be announced.' : 'Sub groups wont be announced, but still will be recorded.'));
 //       }
		
		
		
		
//       var bit1 = 1;	/////////////////////////////////
//       //fake sub   bit1= 1 for debug
//       if (command.equalsIgnoreCase('subtest')) {
//           $.consoleLn('subtest command called');
//           ()
//           if (bit1 == 1) {
//               if (action === undefined) {
//                   generateMessage(sender)
//               } else {
//                   subName = action.toLowerCase();
//                   generateMessage(subName)
//               }
//           }
//       }

		
       
    
//      if (command.equalsIgnoreCase('subhelp')) {
//          
//          $.consoleLn('subhelp command called');
//          sayFunction("!subgroup tells your group. - !lastgroup says last sub and group. - !newsubgroup username (mod only) Do not use @");
//      }
		
		
		if (command.equalsIgnoreCase('tctest')) {
            $.consoleLn('tctest command called');
            
            if (action === undefined) {
                //sayFunction(sender)
				getStreamInfo()				
				
				$.consoleLn(streamTitle);
				$.consoleLn(gameName);
				gameName = "smw"
if (gameName = 'smw') {
				if (streamTitle.search('0 exit') > -1) {
				$.consoleLn('0');
				}				
				if (streamTitle.search('11 exit') > -1) {
				$.consoleLn('11');
				}				
				if (streamTitle.search('96 exit') > -1) {
				$.consoleLn('96');
				}
				if (streamTitle.search('all castles') > -1) {
				$.consoleLn('all castles');
				}
				if (streamTitle.search('ncnsw') > -1) {
				$.consoleLn('');
				}
				if (streamTitle.search('low%') > -1) {
				$.consoleLn('low% (small only)');
				}
}	

            } else {
                name = action.toLowerCase();
                sayFunction(name)
          
                
            }
        }
		
		if (command.equalsIgnoreCase('tctest2')) {
            $.consoleLn('tctest2 command called');
			getStreamInfo()
//get game name from twitch			
			url = 'https://www.speedrun.com/api/v1/games?name=' + gameName;
			$.consoleLn(url);

			var srAPI =  $.customAPI.get(url).content    ;   
				srAPIJSON = JSON.parse(srAPI);								
		//		srGame = srAPIJSON.data.[0].names.international;   //fix
			    //srGameId = srAPIJSON.data.0.id; fix
				//$.consoleLn(srGame);
			
							

			 srGameId = 'pd0wq31e';
			 streamCategory = '7kjrn323';
			 
			 //get top run
			$.consoleLn('1');
			url='https://www.speedrun.com/api/v1/leaderboards/' + srGameId + '/category/' + streamCategory + '?top=1';
		var srAPI =  $.customAPI.get(url).content    ;   
				srAPIJSON = JSON.parse(srAPI);

				srGame = srAPIJSON.data.game;
				srCategory = srAPIJSON.data.category;
				//$.consoleLn(exit.data.runs.["0"].run.players.["0"].id); 
		//	$.consoleLn(exit.data.runs.0.run.players.0.id)
			//srRunner = srAPIJSON.data.runs.0.run.players.0.id; fix
				srTime = 0;
				
				$.consoleLn(srGame);
				$.consoleLn(srCategory);

//this uses exact game id				
		url = 'https://www.speedrun.com/api/v1/games/'+ srGame;
			var srAPI =  $.customAPI.get(url).content    ;
				srAPIJSON = JSON.parse(srAPI);

				srGame = srAPIJSON.data.names.international;			
					
				
				
				

				//srCategory = srAPIJSON.data.category;
				//srRunner = srAPIJSON.data.runs.0.run.players.0.id;
				srTime = 0;		
			
			
			
			
			//	$.consoleLn(url);

			//   $.consoleLn(srGame);
			//   $.consoleLn(srCategory);
			  // $.consoleLn(srAPIJSON.data.runs.0.run.players.0.id);

			 // $.consoleLn(srAPIJSON);
			
		

		
		}
		
		
    });
    /**
     * @event initReady
     */
    $.bind('initReady', function() {
      //$.registerChatCommand('./handlers/titlechecker.js', 'subgrouptoggle', 2);
      $.registerChatCommand('./handlers/titlechecker.js', 'tctest', 7);
	        $.registerChatCommand('./handlers/titlechecker.js', 'tctest2', 7);

    //  $.registerChatCommand('./handlers/titlechecker.js', 'newsubgroup', 2);
    //  $.registerChatCommand('./handlers/titlechecker.js', 'subgroup', 7);
    //  $.registerChatCommand('./handlers/titlechecker.js', 'subhelp', 7);
	//$.registerChatCommand('./handlers/titlechecker.js', 'lastgroup', 7);
	//$.registerChatCommand('./handlers/titlechecker.js', 'test1', 7);

	
    });
})();