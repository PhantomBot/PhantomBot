## Discord Command List

Parameters enclosed in square brackets `[ ]` are required when using the command

Parameters enclosed in parenthesis `( )` are optional when using the command

<!-- table -->
| Module | Command | Description |
| :--- | :--- | :--- |
| ./discord/commands/customCommands.js | !addcom [command] [response] | - Adds a custom command to be used in your Discord server. |
| ./discord/commands/customCommands.js | !editcom [command] [response] | - Edits an existing command. |
| ./discord/commands/customCommands.js | !delcom [command] | - Deletes a custom command. |
| ./discord/commands/customCommands.js | !channelcom [command] [channel / --global / --list] | - Makes a command only work in that channel, separate the channels with commas (no spaces) for multiple, use --global as the channel to make the command global again. |
| ./discord/commands/customCommands.js | !pricecom [command] [amount] | - Sets a cost for that command, users must of their Twitch accounts linked for this to work. |
| ./discord/commands/customCommands.js | !aliascom [alias] [command] | - Alias a command to another command, this only works with commands that have a single command. |
| ./discord/commands/customCommands.js | !delalias [alias] | - Removes the alias of that command. |
| ./discord/commands/customCommands.js | !commands | - Shows all of the custom commands you created. |
| ./discord/commands/customCommands.js | !botcommands | - Gives you a list of commands that you are allowed to use. |
| ./discord/commands/topCommand.js | !top | - Display the top people with the most points |
| ./discord/commands/topCommand.js | !toptime | - Display the top people with the most time |
| ./discord/commands/topCommand.js | !topamount | - Set how many people who will show up in the !top points list |
| ./discord/commands/topCommand.js | !toptimeamount | - Set how many people who will show up in the !toptime list |
| ./discord/games/roll.js | !roll rewards [rewards] | - Sets the rewards for the dice roll |
| ./discord/games/kill.js | !kill [username] | - Kill a fellow viewer (not for real!). |
| ./discord/games/8ball.js | !8ball [question] | - Ask the magic 8ball a question. |
| ./discord/games/roulette.js | !roulette | - Pull the trigger and find out if there's a bullet in the chamber |
| ./discord/games/random.js | !random | - Will display something really random. |
| ./discord/games/slotMachine.js | !slot | - Play the slot machines for some points. |
| ./discord/games/slotMachine.js | !slot rewards [rewards] | - Sets the rewards for the slot machine |
| ./discord/games/gambling.js | !gamble [amount] | - Gamble your points. |
| ./discord/games/gambling.js | !gambling setmax [amount] | - Set how many points people can gamble. |
| ./discord/games/gambling.js | !gambling setmin [amount] | - Set the minimum amount of points people can gamble. |
| ./discord/games/gambling.js | !gambling setwinningrange [range] | - Set the winning range from 0-100. The higher the less of a chance people have at winning. |
| ./discord/games/gambling.js | !gambling setgainpercent [amount in percent] | - Set the winning gain percent. |
| ./discord/handlers/clipHandler.js | !clipstoggle | - Toggles the clips announcements. |
| ./discord/handlers/clipHandler.js | !clipsmessage [message] | - Sets a message for when someone creates a clip. |
| ./discord/handlers/clipHandler.js | !clipschannel [channel] | - Sets the channel to send a message to for when someone creates a clip. |
| ./discord/handlers/clipHandler.js | !lastclip | - Displays information about the last clip captured. |
| ./discord/handlers/clipHandler.js | !topclip | - Displays the top clip from the past day. |
| ./discord/handlers/keywordHandler.js | !keyword add [keyword] [response] | - Adds a custom keyword. |
| ./discord/handlers/keywordHandler.js | !keyword edit [keyword] [response] | - Edits a custom keyword. |
| ./discord/handlers/keywordHandler.js | !keyword remove [keyword] | - Removes a custom keyword. |
| ./discord/handlers/streamHandler.js | !streamhandler toggleonline | - Toggles the stream online announcements. |
| ./discord/handlers/streamHandler.js | !streamhandler toggleonlinepublish | - Toggles stream online announcements being published in Discord Announcement channels. |
| ./discord/handlers/streamHandler.js | !streamhandler onlinemessage [message] | - Sets the stream online announcement message. |
| ./discord/handlers/streamHandler.js | !streamhandler onlinedelay [seconds] | - Sets the number of seconds the bot waits before posting the online message to Discord. Lower times could result in old or missing thumbnails |
| ./discord/handlers/streamHandler.js | !streamhandler toggleoffline | - Toggles the stream offline announcements. |
| ./discord/handlers/streamHandler.js | !streamhandler toggleofflinepublish | - Toggles stream offline announcements being published in Discord Announcement channels. |
| ./discord/handlers/streamHandler.js | !streamhandler offlinemessage [message] | - Sets the stream offline announcement message. |
| ./discord/handlers/streamHandler.js | !streamhandler offlinedelay [seconds] | - Sets the number of seconds the bot waits before posting the offline message to Discord. Lower times could result in old or missing thumbnails |
| ./discord/handlers/streamHandler.js | !streamhandler togglegame | - Toggles the stream game change announcements. |
| ./discord/handlers/streamHandler.js | !streamhandler togglegamepublish | - Toggles stream game change announcements being published in Discord Announcement channels. |
| ./discord/handlers/streamHandler.js | !streamhandler gamemessage [message] | - Sets the stream game change announcement message. |
| ./discord/handlers/streamHandler.js | !streamhandler togglebotstatus | - If enabled the bot will be marked as streaming with your Twitch title when you go live. |
| ./discord/handlers/streamHandler.js | !streamhandler channel [channel name] | - Sets the channel that announcements from this module will be said in. |
| ./discord/handlers/streamHandler.js | !streamhandler toggledeletemessage | - Toggles if online announcements get deleted after stream. |
| ./discord/handlers/tipeeeStreamHandler.js | !tipeeestreamhandler toggle | - Toggles the TipeeeStream donation announcements. |
| ./discord/handlers/tipeeeStreamHandler.js | !tipeeestreamhandler message [message] | - Sets the TipeeeStream donation announcement message. |
| ./discord/handlers/tipeeeStreamHandler.js | !tipeeestreamhandler channel [channel name] | - Sets the channel that announcements from this module will be said in. |
| ./discord/handlers/streamElementsHandler.js | !streamelementshandler toggle | - Toggles the streamelements donation announcements. |
| ./discord/handlers/streamElementsHandler.js | !streamelementshandler message [message] | - Sets the streamelements donation announcement message. |
| ./discord/handlers/streamElementsHandler.js | !streamelementshandler channel [channel name] | - Sets the channel that announcements from this module will be said in. |
| ./discord/handlers/bitsHandler.js | !bitshandler toggle | - Toggles bit announcements. |
| ./discord/handlers/bitsHandler.js | !bitshandler message [message] | - Sets the bit announcement message. |
| ./discord/handlers/bitsHandler.js | !bitshandler channel [channel name] | - Sets the channel bit announcements will be made in. |
| ./discord/handlers/streamlabsHandler.js | !streamlabshandler toggle | - Toggles the StreamLabs donation announcements. |
| ./discord/handlers/streamlabsHandler.js | !streamlabshandler message [message] | - Sets the StreamLabs donation announcement message. |
| ./discord/handlers/streamlabsHandler.js | !streamlabshandler channel [channel name] | - Sets the channel that announcements from this module will be said in. |
| ./discord/handlers/subscribeHandler.js | !subscribehandler subtoggle | - Toggles subscriber announcements. |
| ./discord/handlers/subscribeHandler.js | !subscribehandler giftsubtoggle | - Toggles gifted subscriber announcements. |
| ./discord/handlers/subscribeHandler.js | !subscribehandler primetoggle | - Toggles Twitch Prime subscriber announcements. |
| ./discord/handlers/subscribeHandler.js | !subscribehandler resubtoggle | - Toggles re-subscriber announcements. |
| ./discord/handlers/subscribeHandler.js | !subscribehandler submessage [message] | - Sets the subscriber announcement message. |
| ./discord/handlers/subscribeHandler.js | !subscribehandler giftsubmessage [message] | - Sets the gift subscriber announcement message. |
| ./discord/handlers/subscribeHandler.js | !subscribehandler primemessage [message] | - Sets the Twitch Prime subscriber announcement message. |
| ./discord/handlers/subscribeHandler.js | !subscribehandler resubmessage [message] | - Sets the re-subscriber announcement message. |
| ./discord/handlers/subscribeHandler.js | !subscribehandler channel [channel name] | - Sets the channel that announcements from this module will be said in. |
| ./discord/handlers/followHandler.js | !followhandler toggle | - Toggles the follower announcements. |
| ./discord/handlers/followHandler.js | !followhandler message [message] | - Sets the follower announcement message. |
| ./discord/handlers/followHandler.js | !followhandler channel [channel name] | - Sets the channel that announcements from this module will be said in. |
| ./discord/core/accountLink.js | !account | - Checks the current account linking status of the sender. |
| ./discord/core/accountLink.js | !account link | - Starts the process of linking an account. Completing this will overwrite existing links |
| ./discord/core/accountLink.js | !account remove | - Removes account links from the sender. |
| ./discord/core/commandCooldown.js | !coolcom [command] remove |  |
| ./discord/core/commandCooldown.js | !cooldown setdefault [seconds] | - Sets a default global cooldown for commands without a cooldown. |
| ./discord/core/moderation.js | !moderation links toggle | - Toggles the link filter. |
| ./discord/core/moderation.js | !moderation links permittime [seconds] | - Sets the amount a time a permit lasts for. |
| ./discord/core/moderation.js | !moderation caps toggle | - Toggle the caps filter. |
| ./discord/core/moderation.js | !moderation caps triggerlength [characters] | - Sets the amount of characters needed a message before checking for caps. |
| ./discord/core/moderation.js | !moderation caps limitpercent [percent] | - Sets the amount in percent of caps are allowed in a message. |
| ./discord/core/moderation.js | !moderation longmessage toggle | - Toggles the long message filter |
| ./discord/core/moderation.js | !moderation longmessage limit [characters] | - Sets the amount of characters allowed in a message. |
| ./discord/core/moderation.js | !moderation spam toggle | - Toggles the spam filter. |
| ./discord/core/moderation.js | !moderation limit [messages] | - Sets the amount of messages users are allowed to send in 5 seconds. |
| ./discord/core/moderation.js | !moderation blacklist add [phrase] | - Adds a word or phrase to the blacklist which will be deleted if said in any channel. |
| ./discord/core/moderation.js | !moderation blacklist remove [phrase] | - Removes a word or phrase to the blacklist. |
| ./discord/core/moderation.js | !moderation blacklist list | - Gives you a list of everything in the blacklist. |
| ./discord/core/moderation.js | !moderation whitelist add [phrase or username#discriminator] | - Adds a phrase, word or username that will not get checked by the moderation system. |
| ./discord/core/moderation.js | !moderation whitelist add [phrase or username#discriminator] | - Removes that phrase, word or username from the whitelist. |
| ./discord/core/moderation.js | !moderation whitelist list | - Gives you a list of everything in the whitelist. |
| ./discord/core/moderation.js | !moderation cleanup [channel] [amount] | - Will delete that amount of messages for that channel. |
| ./discord/core/moderation.js | !moderation logs toggle | - Will toggle if Twitch moderation logs are to be said in Discord. Requires bot restart. |
| ./discord/core/moderation.js | !moderation logs chat | - Will toggle if the last Twitch chat message (within 5 minutes) of a timed out or banned user is included in mod logs. |
| ./discord/core/moderation.js | !moderation logs channel [channel name] | - Will make Twitch moderator action be announced in that channel. |
| ./discord/core/roleManager.js | !rolemanager togglesyncpermissions | - Makes the bot sync default permissions with those who have their accounts linked. |
| ./discord/core/roleManager.js | !rolemanager togglesyncranks | - Makes the bot sync ranks with those who have their accounts linked. |
| ./discord/core/roleManager.js | !rolemanager blacklist [add / remove] [permission or rank] | - Blacklist a rank or permission from being used. |
| ./discord/core/misc.js | !module enable [path] | - Enables any modules in the bot, it should only be used to enable discord modules though. |
| ./discord/core/misc.js | !module disable [path] | - Disables any modules in the bot, it should only be used to enable discord modules though. |
| ./discord/core/misc.js | !module list | - Lists all of the discord modules. |
| ./discord/core/misc.js | !setgame [game name] | - Sets the bot game. |
| ./discord/core/misc.js | !setstream [twitch url] [game name] | - Sets the bot game and marks it as streaming. |
| ./discord/core/misc.js | !removegame | - Removes the bot's game and streaming status if set. |
| ./discord/systems/greetingsSystem.js | !greetingssystem jointoggle | - Toggles the announcement for when someone joins the server. |
| ./discord/systems/greetingsSystem.js | !greetingssystem parttoggle | - Toggles the announcement for when someone leaves the server. |
| ./discord/systems/greetingsSystem.js | !greetingssystem joinmessage [message] | - Sets the message for when a user joins your server. |
| ./discord/systems/greetingsSystem.js | !greetingssystem partmessage [message] | - Sets the message for when a user leaves your server. |
| ./discord/systems/greetingsSystem.js | !greetingssystem channel [channel] | - Sets the channel messages from this modules will be made in. |
