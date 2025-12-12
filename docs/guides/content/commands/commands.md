## Twitch Command List

Parameters enclosed in square brackets `[ ]` are required when using the command

Parameters enclosed in parenthesis `( )` are optional when using the command

<!-- table -->
| Module | Command | Description |
| :--- | :--- | :--- |
| ./commands/toggleModCommand.js | !togglemod | Toggle moderator status. |
| ./commands/streamCommand.js | !setgame [game name] | Set your Twitch game title. |
| ./commands/streamCommand.js | !settitle [stream title] | Set your Twitch stream title. |
| ./commands/streamCommand.js | !vod | Displays stream uptime and current VOD or, if offline, the last VOD available. |
| ./commands/lastseenCommand.js | !lastseen [username] | Find out when the given user was last seen in the channel |
| ./commands/dualstreamCommand.js | !multi | Displays the current multi-link information of the usage |
| ./commands/dualstreamCommand.js | !multi set [channels] | Adds a space-delimited list of channels to the multi-link (local channel already added) |
| ./commands/dualstreamCommand.js | !multi clear | Clears the multi-links and disables the timer |
| ./commands/dualstreamCommand.js | !multi timer [on / off] | Enable or disabled the multi-links timer |
| ./commands/dualstreamCommand.js | !multi timerinterval [time in minutes] | Set the interval for the multi-links timer |
| ./commands/dualstreamCommand.js | !multi reqmessage [amount of messages] | Set the amount of message required before triggering the dual stream link |
| ./commands/nameConverter.js | !namechange [oldname] [newname] | Convert someones old Twitch username to his/her new Twitch name. The user will be able to keep their points, time, quotes, and more. |
| ./commands/deathctrCommand.js | !deathctr | Display the current number of deaths in game being played. |
| ./commands/deathctrCommand.js | !deathctr reset | Reset the death counter for the game being played. |
| ./commands/deathctrCommand.js | !deathctr set [number] | Set the death counter for the game being played. |
| ./commands/deathctrCommand.js | !deathctr incr | Add one to the death counter for the game being played. |
| ./commands/deathctrCommand.js | !deathctr decr | Subtract one from the death counter for the game being played. |
| ./commands/customCommands.js | !addcom [command] [command response] | Adds a custom command |
| ./commands/customCommands.js | !editcom [command] [command response] | Edits the current response of that command |
| ./commands/customCommands.js | !tokencom [command] [token] | Stores a user/pass or API key to be replaced into a (customapi) tag. WARNING: This should be done from the bot console or web panel, if you run this from chat, anyone watching chat can copy your info! |
| ./commands/customCommands.js | !delcom [command] | Delete that custom command |
| ./commands/customCommands.js | !aliascom [alias name] [existing command] | Create an alias to any command |
| ./commands/customCommands.js | !delalias [alias] | Delete that alias |
| ./commands/customCommands.js | !permcom [command] [groupId] | Set the permissions for any command |
| ./commands/customCommands.js | !pricecom [command] [amount] | Set the amount of points a command should cost |
| ./commands/customCommands.js | !paycom [command] [amount] | Set the amount of points a command should reward a viewer |
| ./commands/customCommands.js | !commands | Provides a list of all available custom commands. |
| ./commands/customCommands.js | !botcommands | Will show you all of the bots commands |
| ./commands/customCommands.js | !hidecom [command] | Hide a command in the !commands list |
| ./commands/customCommands.js | !showcom [command] | Adds a command that's been hidden back to the !commands list |
| ./commands/customCommands.js | !addextcom [command] | Adds a external command (only added to !commands list) |
| ./commands/customCommands.js | !delextcom [command] | Delete that external command |
| ./commands/customCommands.js | !resetcom [command] [count] | Resets the counter to zero, for a command that uses the (count) tag or optionally set to a specific value. |
| ./commands/topCommand.js | !top | Display the top people with the most points |
| ./commands/topCommand.js | !toptime | Display the top people with the most time |
| ./commands/topCommand.js | !topamount | Set how many people who will show up in the !top points list |
| ./commands/topCommand.js | !toptimeamount | Set how many people who will show up in the !toptime list |
| ./commands/topCommand.js | !reloadtopbots | DEPRECATED. Use !reloadbots |
| ./commands/highlightCommand.js | !highlight [description] | Marks a highlight using the given description and with the current date stamp |
| ./commands/highlightCommand.js | !showhighlights | Get a list of current highlights |
| ./commands/highlightCommand.js | !clearhighlights | Clear the current highlights |
| ./discord/core/accountLink.js | !account link [code] | Completes an account link for Discord. |
| ./games/killCommand.js | !kill [username] | Kill a fellow viewer (not for real!), omit the username to kill yourself |
| ./games/killCommand.js | !jailtimeouttime [amount in seconds] | Set the timeout time for jail time on the kill command. |
| ./games/roll.js | !roll | Roll the dice for some points |
| ./games/roll.js | !roll rewards [double 1's] [2's] [3's] [4's] [5's] [6's] | Set the reward for each set of doubles. |
| ./games/roll.js | !roll rolloffline | Toggle allowing rolling when the channel is offline |
| ./games/8ball.js | !8ball [question] | Ask the 8ball for advice |
| ./games/roulette.js | !roulette | Pull the trigger and find out if there's a bullet in the chamber |
| ./games/roulette.js | !roulettetimeouttime [seconds] | Sets for how long the user gets timed out for when loosing at roulette |
| ./games/adventureSystem.js | !adventure [amount] | Start/join an adventure |
| ./games/adventureSystem.js | !adventure top5 | Announce the top 5 adventurers in the chat (most points gained) |
| ./games/adventureSystem.js | !adventure set | Base command for controlling the adventure settings |
| ./games/adventureSystem.js | !adventure set jointime [seconds] | Set the join time |
| ./games/adventureSystem.js | !adventure set cooldown [seconds] | Set cooldown time |
| ./games/adventureSystem.js | !adventure set gainpercent [value] | Set the gain percent value |
| ./games/adventureSystem.js | !adventure set minbet [value] | Set the minimum bet |
| ./games/adventureSystem.js | !adventure set maxbet [value] | Set the maximum bet |
| ./games/adventureSystem.js | !adventure set warningmessages [true / false] | Sets the per-user warning messages |
| ./games/adventureSystem.js | !adventure set entrymessages [true / false] | Sets the per-user entry messages |
| ./games/adventureSystem.js | !adventure set cooldownannounce [true / false] | Sets the cooldown announcement |
| ./games/adventureSystem.js | !adventure set odds [value] | Set the odds of players surviving adventures |
| ./games/slotMachine.js | !slot | Play the slot machines for some points |
| ./games/slotMachine.js | !slot rewards [val1] [val2] [val3] [val4] [val5] | Set the reward values for the slots. |
| ./games/slotMachine.js | !slot emotes [emote1] [emote2] [emote3] [emote4] [emote5] | Set the emotes for the slots. |
| ./games/gambling.js | !gamble [amount] | Gamble your points. |
| ./games/gambling.js | !gamblesetmax [amount] | Set how many points people can gamble. |
| ./games/gambling.js | !gamblesetmin [amount] | Set the minumum amount of points people can gamble. |
| ./games/gambling.js | !gamblesetwinningrange [range] | Set the winning range from 0-100. |
| ./games/gambling.js | !gamblesetgainpercent [amount in percent] | Set the winning gain percent. |
| ./games/gambling.js | !gambleoffline | Toggle allowing gambling when the channel is offline |
| ./handlers/clipHandler.js | !clipstoggle | Toggles the clips announcements. |
| ./handlers/clipHandler.js | !clipsmessage | Sets a message for when someone creates a clip. |
| ./handlers/clipHandler.js | !lastclip | Displays information about the last clip captured. |
| ./handlers/clipHandler.js | !topclip | Displays the top clip from the past day. |
| ./handlers/clipHandler.js | !clipit | Creates a clip. |
| ./handlers/keywordHandler.js | !keyword | Base command for keyword options |
| ./handlers/keywordHandler.js | !keyword add [keyword] [response] | Adds a keyword and a response, use regex: at the start of the response to use regex. |
| ./handlers/keywordHandler.js | !keyword remove [keyword] | Removes a given keyword |
| ./handlers/keywordHandler.js | !keyword cooldown [keyword] [seconds] | Sets a cooldown on the keyword. Use -1 to remove it. If you use the command: tag and you have a cooldown on that command it will use that cooldown |
| ./handlers/tipeeeStreamHandler.js | !tipeeestream | Controls various options for donation handling |
| ./handlers/tipeeeStreamHandler.js | !tipeeestream toggledonators | Toggles the Donator's group. |
| ./handlers/tipeeeStreamHandler.js | !tipeeestream minmumbeforepromotion | Set the minimum before people get promoted to a Donator |
| ./handlers/tipeeeStreamHandler.js | !tipeeestream announce | Toggles announcements for donations off and on |
| ./handlers/tipeeeStreamHandler.js | !tipeeestream rewardmultiplier [n.n] | Set a reward multiplier for donations. |
| ./handlers/tipeeeStreamHandler.js | !tipeeestream message [message text] | Set the donation message. Tags: (name), (amount), (reward), (message) and (currency) |
| ./handlers/streamElementsHandler.js | !streamelements | Controls various options for donation handling |
| ./handlers/streamElementsHandler.js | !streamelements toggledonators | Toggles the Donator's group. |
| ./handlers/streamElementsHandler.js | !streamelements minmumbeforepromotion | Set the minimum before people get promoted to a Donator |
| ./handlers/streamElementsHandler.js | !streamelements announce | Toggles announcements for donations off and on |
| ./handlers/streamElementsHandler.js | !streamelements rewardmultiplier [n.n] | Set a reward multiplier for donations. |
| ./handlers/streamElementsHandler.js | !streamelements message [message text] | Set the donation message. Tags: (name), (amount), (reward), (message) and (currency) |
| ./handlers/bitsHandler.js | !bitstoggle | Toggles the bits announcements. |
| ./handlers/bitsHandler.js | !bitsmessage | Sets a message for when someone cheers bits. |
| ./handlers/bitsHandler.js | !bitsminimum | Set how many bits someone needs to cheer before announcing it. |
| ./handlers/gameScanHandler.js | !gamescan [game name] | Scan for a recently played game and list the date in which the broadcaster played it. |
| ./handlers/subscribeHandler.js | !subwelcometoggle | Enable or disable subscription alerts. |
| ./handlers/subscribeHandler.js | !resubwelcometoggle | Enable or disable resubsciption alerts. |
| ./handlers/subscribeHandler.js | !giftsubwelcometoggle | Enable or disable subgifting alerts. |
| ./handlers/subscribeHandler.js | !giftanonsubwelcometoggle | Enable or disable anonymous subgifting alerts. |
| ./handlers/subscribeHandler.js | !massgiftsubwelcometoggle | Enable or disable subgifting alerts. |
| ./handlers/subscribeHandler.js | !massanongiftsubwelcometoggle | Enable or disable mass anonymous subgifting alerts. |
| ./handlers/subscribeHandler.js | !submessage [1&#124;2&#124;3&#124;prime&#124;all] [message] | Set a welcome message for new subscribers. |
| ./handlers/subscribeHandler.js | !resubmessage [1&#124;2&#124;3&#124;prime&#124;all] [message] | Set a message for resubscribers. |
| ./handlers/subscribeHandler.js | !giftsubmessage [1&#124;2&#124;3&#124;all] [message] | Set a message for resubscribers. |
| ./handlers/subscribeHandler.js | !giftanonsubmessage [1&#124;2&#124;3&#124;all] [message] | Set a message for anonymous gifting alerts. |
| ./handlers/subscribeHandler.js | !massgiftsubmessage [1&#124;2&#124;3&#124;all] [message] | Set a message for gifting alerts. |
| ./handlers/subscribeHandler.js | !massanongiftsubmessage [1&#124;2&#124;3&#124;all] [message] | Set a message for mass anonymous gifting alerts. |
| ./handlers/subscribeHandler.js | !subscribereward [1&#124;2&#124;3&#124;prime&#124;all] [points] | Set an award for subscribers. |
| ./handlers/subscribeHandler.js | !resubscribereward [1&#124;2&#124;3&#124;prime&#124;all] [points] | Set an award for resubscribers. |
| ./handlers/subscribeHandler.js | !giftsubreward [1&#124;2&#124;3&#124;all] [points] | Set an award for gifted subs. |
| ./handlers/subscribeHandler.js | !massgiftsubreward [1&#124;2&#124;3&#124;all] [points] | Set an award for mass subs. This is multiplied by the number of subs gifted. |
| ./handlers/subscribeHandler.js | !subemote [1&#124;2&#124;3&#124;prime&#124;all] [emote] | The (customemote) tag will be replace with these emotes.  The emotes will be added the amount of months the user subscribed for. |
| ./handlers/subscribeHandler.js | !namesubplan [1&#124;2&#124;3&#124;prime] [name of plan] | Name a subscription plan for the (plan) tag, Twitch provides three tiers plus prime. |
| ./handlers/wordCounter.js | !wordcounter | Configures various option for the wordcounter |
| ./handlers/wordCounter.js | !wordcounter add [word] | Adds a word that will be counted every time someone says it |
| ./handlers/wordCounter.js | !wordcounter remove [word] | Removes the given word which will no longer be counted every time someone says it |
| ./handlers/wordCounter.js | !count [word] | Tells you how many times that word as been said in chat. |
| ./handlers/followHandler.js | !followreward [amount] | Set the points reward for following |
| ./handlers/followHandler.js | !followmessage [message] | Set the new follower message when there is a reward |
| ./handlers/followHandler.js | !followdelay [message] | Set the delay in seconds between follow announcements |
| ./handlers/followHandler.js | !followtoggle | Enable or disable the anouncements for new followers |
| ./handlers/followHandler.js | !checkfollow [username] | Check if a user is following the channel |
| ./handlers/followHandler.js | !replayfollow [username] | Replays the follow message for username |
| ./handlers/raidHandler.js | !raid toggle | Toggles if the bot should welcome raiders. |
| ./handlers/raidHandler.js | !raid setreward [amount] | Sets the amount of points given to raiders. |
| ./handlers/raidHandler.js | !raid setincomingminviewers [amount] | Sets the minimum amount of viewers to trigger the raid message. |
| ./handlers/raidHandler.js | !raid setincomingmessage [message] | Sets the incoming raid message - Tags: (username), (viewers), (url), (times), (reward) and (game) |
| ./handlers/raidHandler.js | !raid setnewincomingmessage [message] | Sets the incoming raid message for first time raiders - Tags: (username), (viewers), (url), (reward) and (game) |
| ./handlers/raidHandler.js | !raid setoutgoingmessage [message] | Sets the outgoing message for when you raid someone - Tags (username) and (url) |
| ./handlers/raidHandler.js | !raid setoutgoingofflinemessage [message] | Sets a warning message which is added to chat when you use !raid on a channel that is offline. |
| ./handlers/raidHandler.js | !raid setoutgoingmessagespam [amount] | Sets the amount of times that the outgoing raid message is sent in chat. Maximum is 10 times. |
| ./handlers/raidHandler.js | !raid lookup [username] | Shows the amount of times the username has raided the channel. |
| ./handlers/donationHandler.js | !streamlabs | Controls various options for donation handling |
| ./handlers/donationHandler.js | !streamlabs toggledonators | Toggles the Donator's group. |
| ./handlers/donationHandler.js | !streamlabs minmumbeforepromotion | Set the minimum before people get promoted to a Donator |
| ./handlers/donationHandler.js | !streamlabs announce | Toggles announcements for donations off and on |
| ./handlers/donationHandler.js | !streamlabs rewardmultiplier [n.n] | Set a reward multiplier for donations. |
| ./handlers/donationHandler.js | !streamlabs message [message text] | Set the donation message. Tags: (name), (amount), (points), (pointname), (message) and (currency) |
| ./handlers/donationHandler.js | !streamlabs currencycode erase | Removes the currency code. |
| ./handlers/channelPointsHandler.js | !channelpoints | Allows setting channel points redemptions to convert into custom commands, then execute command tags |
| ./handlers/channelPointsHandler.js | !channelpoints example | Prints an example add subaction for the "command" rewards type |
| ./handlers/channelPointsHandler.js | !channelpoints list | Lists each Reward ID and Title that is currently linked to the "command" reward type |
| ./handlers/channelPointsHandler.js | !channelpoints get | Given a channel point reward id, returns the custom command definition that will be parsed |
| ./handlers/channelPointsHandler.js | !channelpoints add | Starts the process of adding a "command" type redemption reward |
| ./handlers/channelPointsHandler.js | !channelpoints edit | Changes the command definition for a "command" type reward |
| ./handlers/channelPointsHandler.js | !channelpoints remove | Removes a "command" type reward |
| ./core/chatModerator.js | !moderation togglemoderationlogs | Toggles the moderation logs. You will need to reboot if you are enabling it. |
| ./core/chatModerator.js | !moderation spamtracker [on / off] | Enable/Disable the spam tracker. This limits how many messages a user can sent in 30 seconds by default |
| ./core/chatModerator.js | !moderation spamtrackerlimit [amount of messages] | Sets how many messages a user can sent in 30 seconds by default |
| ./core/chatModerator.js | !moderation spamtrackertime [amount in seconds] | Sets how many messages a user can sent in 30 seconds by default |
| ./core/chatModerator.js | !moderation spamtrackermessage [message] | Sets the spam tracker warning message |
| ./core/chatModerator.js | !moderation fakepurge [on / off] | Enable/Disable the fake purges filter. This will remove <message deleted> variations if enabled. |
| ./core/chatModerator.js | !moderation fakepurgemessage [message] | Sets the fake purge warning message |
| ./core/chatModerator.js | !blacklist | Show usage of command to manipulate the blacklist of words in chat |
| ./core/chatModerator.js | !blacklist add [timeout time ( | 1 = ban)] [word] - Adds a word to the blacklist. Use regex: at the start to specify a regex blacklist. |
| ./core/chatModerator.js | !blacklist remove [word] | Removes a word from the blacklist. |
| ./core/chatModerator.js | !whitelist | Shows usage of command to manipulate the whitelist links |
| ./core/chatModerator.js | !whitelist add [link] | Adds a link to the whitelist |
| ./core/chatModerator.js | !whitelist remove [link] | Removes a link from the whitelist. |
| ./core/chatModerator.js | !permit [user] | Permit someone to post a link for a configured period of time |
| ./core/chatModerator.js | !moderation | Shows usage for the various chat moderation options |
| ./core/chatModerator.js | !moderation links [on / off] | Enable/Disable the link filter |
| ./core/chatModerator.js | !moderation caps [on / off] | Enable/Disable the caps filter |
| ./core/chatModerator.js | !moderation spam [on / off] | Enable/Disable the spam filter |
| ./core/chatModerator.js | !moderation symbols [on / off] | Enable/Disable the symbol filter |
| ./core/chatModerator.js | !moderation emotes [on / off] | Enable/Disable the emotes filter |
| ./core/chatModerator.js | !moderation colors [on / off] | Enable/Disable the message color filter |
| ./core/chatModerator.js | !moderation longmessages [on / off] | Enable/Disable the longmessages filter |
| ./core/chatModerator.js | !moderation regulars [links / caps / symbols / spam / emotes / colors / longmessages / spamtracker / fakepurge] [true / false] | Enable or disable if regulars get moderated by that filter |
| ./core/chatModerator.js | !moderation subscribers [links / caps / symbols / spam / emotes / colors / longmessages / spamtracker / fakepurge] [true / false] | Enable or disable if subscribers get moderated by that filter |
| ./core/chatModerator.js | !moderation vips [links / caps / symbols / spam / emotes / colors / longmessages / spamtracker / fakepurge] [true / false] | Enable or disable if vips get moderated by that filter |
| ./core/chatModerator.js | !moderation silenttimeout [links / caps / symbols / spam / emotes / colors / longmessages / spamtracker / fakepurge / all] [true / false] | Enable or disable if the warning and timeout message will be said for that filter |
| ./core/chatModerator.js | !moderation warningtime [links / caps / symbols / spam / emotes / colors / longmessages / spamtracker / fakepurge] [time in seconds] | Sets a warning time for a filter. This is when the user gets timed out for the first time |
| ./core/chatModerator.js | !moderation timeouttime [links / caps / symbols / spam / emotes / colors / longmessages / spamtracker / fakepurge] [time in seconds] | Sets a timeout time for a filter. This is when a user gets timed out the for the second time |
| ./core/chatModerator.js | !moderation linksmessage [message] | Sets the link warning message |
| ./core/chatModerator.js | !moderation capsmessage [message] | Sets the cap warning message |
| ./core/chatModerator.js | !moderation symbolsmessage [message] | Sets the symbols warning message |
| ./core/chatModerator.js | !moderation emotesmessage [message] | Sets the emotes warning message |
| ./core/chatModerator.js | !moderation colorsmessage [message] | Sets the color warning message |
| ./core/chatModerator.js | !moderation longmsgmessage [message] | Sets the long message warning message |
| ./core/chatModerator.js | !moderation spammessage [message] | Sets the spam warning message |
| ./core/chatModerator.js | !moderation blacklistmessage [message] | Sets the blacklist warning message that will be default for blacklists you add from chat. This can be custom on the panel. |
| ./core/chatModerator.js | !moderation blacklistmessageban [message] | Sets the blacklist ban message that will be default for blacklists you add from chat. This can be custom on the panel. |
| ./core/chatModerator.js | !moderation permittime [seconds] | Sets the permit time in seconds |
| ./core/chatModerator.js | !moderation capslimit [amount] | Sets the amount (in percent) of caps allowed in a message |
| ./core/chatModerator.js | !moderation capstriggerlength [amount] | Sets the minimum amount of charaters before checking for caps |
| ./core/chatModerator.js | !moderation spamlimit [amount] | Sets the amount of repeating charaters allowed in a message |
| ./core/chatModerator.js | !moderation symbolslimit [amount] | Sets the amount (in percent) of symbols allowed in a message |
| ./core/chatModerator.js | !moderation symbolsgrouplimit [amount] | Sets the max amount of grouped symbols allowed in a message |
| ./core/chatModerator.js | !moderation symbolstriggerlength [amount] | Sets the minimum amount of charaters before checking for symbols |
| ./core/chatModerator.js | !moderation emoteslimit [amount] | Sets the amount of emotes allowed in a message |
| ./core/chatModerator.js | !moderation messagecharacterlimit [amount] | Sets the amount of characters allowed in a message |
| ./core/chatModerator.js | !moderation messagecooldown [seconds] | Sets a cooldown in seconds on the timeout messages (minimum is 30 seconds) |
| ./core/chatModerator.js | !moderation warningresettime [seconds] | Sets how long a user stays on his first offence for (there are 2 offences). Default is 60 minutes (minimum is 30 minutes) |
| ./core/initCommands.js | !pbcore usebotname | Toggles using the bot name for initCommands commands. |
| ./core/initCommands.js | !pbcore disconnect | Removes the bot from your channel. |
| ./core/initCommands.js | !pbcore reconnect | Reconnects the bot to TMI and EventSub. |
| ./core/initCommands.js | !pbcore moderate | Forces the bot to detect its moderator status. |
| ./core/initCommands.js | !pbcore forceonline | Forces the bot to mark the channel as online. |
| ./core/initCommands.js | !pbcore forceoffline | Forces the bot to mark the channel as offline. |
| ./core/initCommands.js | !pbcore setconnectmessage [message] | Sets a message that will be said once the bot joins the channel. |
| ./core/initCommands.js | !pbcore removeconnectmessage | Removes the message said when the bot joins the channel. |
| ./core/initCommands.js | !pbcore togglepricecommods | Toggles if moderators and higher pay for commands. |
| ./core/initCommands.js | !pbcore togglepermcommessage | Toggles if the no permission message is said in the chat. |
| ./core/initCommands.js | !pbcore togglepricecommessage | Toggles if the cost message is said in the chat. |
| ./core/initCommands.js | !pbcore togglecooldownmessage | Toggles if the cooldown message is said in the chat. |
| ./core/initCommands.js | !pbcore togglecustomcommandat | Toggles if custom commands without command tags can be targeted by mods using !mycommand @user |
| ./core/initCommands.js | !module reload [path/all (option)] | Force reloads all active modules or force reloads a single module. |
| ./core/initCommands.js | !module delete [path] | Removes a module from the modules list. This does not remove the module itself. |
| ./core/initCommands.js | !module list | Gives a list of all the modules with their current status. |
| ./core/initCommands.js | !module status [module path] | Retrieve the current status (enabled/disabled) of the given module |
| ./core/initCommands.js | !module enable [module path] | Enable a module using the path and name of the module |
| ./core/initCommands.js | !module disable [module path] | Disable a module using the path and name of the module |
| ./core/initCommands.js | !echo [message] | Send a message as the bot. |
| ./core/commandCoolDown.js | !coolcom [command] clear | Clears all active cooldowns for the specified command. |
| ./core/commandCoolDown.js | !cooldown togglemoderators | Toggles if moderators ignore command cooldowns. |
| ./core/commandCoolDown.js | !cooldown setdefault [seconds] | Sets a default global cooldown for commands without a cooldown. |
| ./core/commandCoolDown.js | !cooldown clearall | Clears all active cooldowns |
| ./core/timeSystem.js | !time | Announce amount of time spent in channel |
| ./core/timeSystem.js | !time add [user] [seconds] | Add seconds to a user's logged time (for correction purposes) |
| ./core/timeSystem.js | !time take [user] [seconds] | Take seconds from a user's logged time |
| ./core/timeSystem.js | !time promotehours [hours] | Set the amount of hours a user has to be logged to automatically become a regular |
| ./core/timeSystem.js | !time autolevel | Auto levels a user to regular after hitting 50 hours. |
| ./core/timeSystem.js | !time autolevelnotification | Toggles if a chat announcement is made when a user is promoted to a regular. |
| ./core/timeSystem.js | !time notifyactiveonly | Toggles if the chat announcement is only made for active users. |
| ./core/timeSystem.js | !time offlinetime | Toggle logging a user's time when the channel is offline |
| ./core/timeSystem.js | !time modonlyusercheck | Toggle allowing only mods able to view others time |
| ./core/timeSystem.js | !streamertime | Announce the caster's local time |
| ./core/timeSystem.js | !timezone [timezone name] | Show configured timezone or optionally set the timezone. See List: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones |
| ./core/logging.js | !log rotatedays [days] | Display or set number of days to rotate the logs. 0 to disable log rotation. |
| ./core/logging.js | !log files | Toggle the logging of files |
| ./core/logging.js | !log events | Toggle the logging of events |
| ./core/logging.js | !log errors | Toggle the logging of errors |
| ./core/commandPause.js | !pausecommands clear | Unpause commands |
| ./core/permissions.js | !reloadbots | Reload the list of bots and users to ignore. They will not gain points or time. |
| ./core/permissions.js | !users | List users currently in the channel |
| ./core/permissions.js | !mods | List mods currently in the channel |
| ./core/permissions.js | !ignorelist | List the bots from the ignorebots.txt |
| ./core/permissions.js | !ignoreadd [username] | Add a bot to the ignorebots.txt |
| ./core/permissions.js | !ignoreremove [username] | Remove a bot from the ignorebots.txt |
| ./core/permissions.js | !permission [username] [groupId] | Get your current permission or optionally get/set the user permission for a user. |
| ./core/permissions.js | !permissionpoints [permissionID] [online / offline] [points] | Show/set the points gained for each permissions. -1 defaults to the global configuration. |
| ./core/permissions.js | !swapsubscribervip | Swaps the Subscriber and VIP usergroups for the purposes of permcom |
| ./core/permissions.js | !permissionslist | Give's you all the permissions with there id's |
| ./core/whisper.js | !togglewhispermode | Toggle whisper mode |
| ./core/whisper.js | !togglenonmodwhispers | Toggle allowing non-mods to send commands via whisper |
| ./core/commandRegister.js | !disablecom [command] | Disable a command from being used in chat |
| ./core/commandRegister.js | !enablecom [command] | Enable a command thats been disabled from being used in chat |
| ./core/coreCommands.js | !shoutout [streamer] | Give a shout out to a streamer. |
| ./core/coreCommands.js | !shoutoutapitoggle | Toggles if the /shoutout API is also sent along with the normal !shoutout response |
| ./core/coreCommands.js | !synconline (silent) | Synchronizes the stream status (online/offline); Specifying the silent parameter suppresses success and failure messages |
| ./core/coreCommands.js | !setcommandrestriction [none/online/offline] [command] (subcommand) | Set online/offline only restriction for the specific; subcommand is an optional parameter |
| ./core/lang.js | !lang [language name] | Get or optionally set the current language (use folder name from "./lang" directory); |
| ./core/lang.js | !mute | Toggle muting the bot in the chat |
| ./core/lang.js | !toggleme | Toggle prepending chat output with "/me". |
| ./systems/pollSystem.js | !poll | Announce information about a poll, if one is running. |
| ./systems/pollSystem.js | !poll results | Announce result information about the last run poll (Poll information is retained until shutdown) |
| ./systems/pollSystem.js | !poll open ["poll question"] ["option1, option2, ..."] [seconds] [min votes] | Starts a poll with question and options. Optionally provide seconds and min votes. |
| ./systems/pollSystem.js | !poll close | Close the current poll and tally the votes |
| ./systems/cleanupSystem.js | !cleanup all [time in seconds] | Will remove users from all the db tables with less then the seconds you chose. |
| ./systems/welcomeSystem.js | !welcome | Base command for controlling welcomes. |
| ./systems/welcomeSystem.js | !welcome toggle | Enable/disable the welcome system. |
| ./systems/welcomeSystem.js | !welcome setmessage | Set the welcome message |
| ./systems/welcomeSystem.js | !welcome setfirstmessage | Set the welcome message |
| ./systems/welcomeSystem.js | !welcome cooldown [hours] | Cooldown in hours before displaying a welcome for a person chatting. |
| ./systems/welcomeSystem.js | !welcome disable [user] | Disable welcoming of the given user. |
| ./systems/welcomeSystem.js | !welcome enable [user] | Disable welcoming of the given user. |
| ./systems/raffleSystem.js | !raffle open [entry fee] [keyword] [close timer] [ | usepoints / -usetime / -followers] - Opens a custom raffle. |
| ./systems/raffleSystem.js | !raffle close | Closes the current raffle. |
| ./systems/raffleSystem.js | !raffle draw [amount (default = 1)] [prize points (default = 0)] | Picks winner(s) for the raffle and optionally awards them with points, and closes the raffle if it is still open |
| ./systems/raffleSystem.js | !raffle lastWinners | Prints the last raffle winners |
| ./systems/raffleSystem.js | !raffle reset | Resets the raffle. |
| ./systems/raffleSystem.js | !raffle results | Give you the current raffle information if there is one active. |
| ./systems/raffleSystem.js | !raffle subscriberbonus [0 | 10] - Sets the bonus luck for subscribers. |
| ./systems/raffleSystem.js | !raffle regularbonus [0 | 10] - Sets the bonus luck for regulars. |
| ./systems/raffleSystem.js | !raffle whisperwinner | Toggles if the raffle winner gets a whisper from the bot saying he won. |
| ./systems/raffleSystem.js | !raffle toggleopendraw | Toggles whether the raffle closes automatically when drawing a winner |
| ./systems/raffleSystem.js | !raffle togglewarningmessages | Toggles the raffle warning messages when entering. |
| ./systems/raffleSystem.js | !raffle togglerepicks | Toggles if the same winner can be repicked more than one. |
| ./systems/raffleSystem.js | !raffle message [message] | Sets the raffle auto annouce messages saying that raffle is still active. |
| ./systems/raffleSystem.js | !raffle messagetimer [minutes] | Sets the raffle auto annouce messages interval. 0 is disabled. |
| ./systems/pointSystem.js | !points | Announce points in chat when no parameters are given. |
| ./systems/pointSystem.js | !points add [username] [amount] | Add an amount of points to a user's balance |
| ./systems/pointSystem.js | !points take [username] [amount] | Take an amount of points from the user's balance |
| ./systems/pointSystem.js | !points set [username] [amount] | Set the user's points balance to an amount |
| ./systems/pointSystem.js | !points all [amount] | Send an amount of points to all users in the chat |
| ./systems/pointSystem.js | !points takeall [amount] | Remove an amount of points to all users in the chat |
| ./systems/pointSystem.js | !points setname delete | Deletes single and multiple custom names |
| ./systems/pointSystem.js | !points setgain [amount] | Set the amount of points gained per payout interval while the channel is online, can be overriden by group settings |
| ./systems/pointSystem.js | !points setofflinegain [amount] | Set the amount of points gained per interval while the channel is offline, can be overridden by group settings |
| ./systems/pointSystem.js | !points setinterval [minutes] | Set the points payout interval for when the channel is online |
| ./systems/pointSystem.js | !points setofflineinterval [minutes] | Set the points payout interval for when the channel is offline |
| ./systems/pointSystem.js | !points setmessage [message] | Set the points message for when someone uses the points command. - Tags: (userprefix), (user), (points), (pointsname), (pointsstring), (time), and (rank) |
| ./systems/pointSystem.js | !points bonus [amount] [time in minutes] | Gives a bonus amount of points at each payouts |
| ./systems/pointSystem.js | !points resetall | Deletes everyones points |
| ./systems/pointSystem.js | !points setactivebonus [points] | Sets a bonus amount of points user get if they are active between the last payout. |
| ./systems/pointSystem.js | !points modonlyusercheck | Toggle allowing only mods able to view others points |
| ./systems/pointSystem.js | !makeitrain [amount] | Send a random amount of points to each user in the channel |
| ./systems/pointSystem.js | !gift [user] [amount] | Give points to a friend. |
| ./systems/pointSystem.js | !penalty [user] [time] | Stop a user from gaining points for X amount of minutes. |
| ./systems/audioPanelSystem.js | !audiohook customcommand [add / remove] [command] [sound] | Adds a custom command that will trigger that sound. Use tag "(list)" to display all the commands. |
| ./systems/greetingSystem.js | !greeting | Base command for controlling greetings. |
| ./systems/greetingSystem.js | !greeting cooldown [hours] | Cooldown in hours before displaying a greeting for a person rejoining chat. |
| ./systems/greetingSystem.js | !greeting toggle | Enable/disable the greeting system. |
| ./systems/greetingSystem.js | !greeting setdefault | Set the default greeting message |
| ./systems/greetingSystem.js | !greeting enable [default &#124; message] | Enable greetings and use the default or set a message. |
| ./systems/greetingSystem.js | !greeting set [username] [default &#124; message] | Set greetings for a user and use the default or set a message. |
| ./systems/greetingSystem.js | !greeting remove [username] | Delete a users greeting and automated greeting at join |
| ./systems/greetingSystem.js | !greeting disable | Delete personal greeting and automated greeting at join |
| ./systems/greetingSystem.js | !greeting toggleblockselfservice | Toggles between users being allowed or prevented to set their own greeting message |
| ./systems/greetingSystem.js | !greeting toggleonjoin | Toggles if greetings are sent when a users joins the chat or when a user first sends a message |
| ./systems/youtubePlayer.js | !musicplayer | Built-in permanent alias to !ytp |
| ./systems/youtubePlayer.js | !ytp clearcache now | Clears the cache of YouTube IDs from the database. |
| ./systems/youtubePlayer.js | !ytp resetdefaultlist | Resets the default playlist back to the default songs. |
| ./systems/youtubePlayer.js | !ytp togglecconly | Toggle option to only use Creative Commons licensed songs. |
| ./systems/youtubePlayer.js | !ytp togglestealrefund | Toggle refunding users half their points if their song is stolen, use to reward users with songs that are liked |
| ./systems/youtubePlayer.js | !ytp djname [DJ Name] | Name the DJ for playlists |
| ./systems/youtubePlayer.js | !ytp delrequest [YouTube ID] | Delete a song that has been requested |
| ./systems/youtubePlayer.js | !ytp volume [0 | 100] [+/-] - Set volume in player. +/- raises/lowers by 2. No value to display current volume. |
| ./systems/youtubePlayer.js | !ytp votecount | Set the amount of votes needed for the !skip command to work |
| ./systems/youtubePlayer.js | !ytp pause | Pause/unpause the player. |
| ./systems/youtubePlayer.js | !ytp shuffle | Toggle randomizing playlists |
| ./systems/youtubePlayer.js | !ytp togglenotify | Toggle announcing now playing in the chat |
| ./systems/youtubePlayer.js | !ytp togglesr | Toggle song request ability for users below admin. |
| ./systems/youtubePlayer.js | !ytp limit [max concurrent requests] | Set the maximum of concurrent songrequests a user can make |
| ./systems/youtubePlayer.js | !ytp maxvideolength [max video length in seconds] | Set the maximum length of a song that may be requested |
| ./systems/youtubePlayer.js | !ytp blacklistuser [add / remove] [user] | Blacklist a user from using the songrequest features. |
| ./systems/youtubePlayer.js | !ytp blacklist [add / remove] [name contained in the video] | Blacklist a song name from being requested. |
| ./systems/youtubePlayer.js | !playlist | Base command: Manage playlists |
| ./systems/youtubePlayer.js | !playlist add [youtube link &#124; id &#124; search] | Add a song to the current playlist |
| ./systems/youtubePlayer.js | !playlist delete (videoId) | Delete the current song from the current playlist, or the specified video by YouTube Video ID |
| ./systems/youtubePlayer.js | !playlist loadpl [playlist name] | Load playlist by name, calling this command with an unknown playlist will create it for you. |
| ./systems/youtubePlayer.js | !playlist listpl | List the playlists |
| ./systems/youtubePlayer.js | !playlist deletepl [playlist name] | Delete a playlist by name |
| ./systems/youtubePlayer.js | !playlist importpl file [playlist name] [file] | Creates/overwrites playlist with new list generated from ./addons/youtubePlayer/file. File may contain links, descriptions, or YouTube IDs |
| ./systems/youtubePlayer.js | !stealsong [playlist name] | Add the currently playing song to the current playlist or a given playlist |
| ./systems/youtubePlayer.js | !playsong [position in playlist] | Jump to a song in the current playlist by position in playlist. |
| ./systems/youtubePlayer.js | !findsong [search string] | Finds a song based on a search string. |
| ./systems/youtubePlayer.js | !skipsong | Skip the current song and proceed to the next video in line |
| ./systems/youtubePlayer.js | !skipsong vote | allow viewers to vote to skip a song |
| ./systems/youtubePlayer.js | !songrequest [YouTube ID &#124; YouTube link &#124; search string] | Request a song! |
| ./systems/youtubePlayer.js | !wrongsong user [username] | Removes the last requested song from a specific user |
| ./systems/youtubePlayer.js | !previoussong | Announce the previous played song in the chat |
| ./systems/youtubePlayer.js | !currentsong | Announce the currently playing song in the chat |
| ./systems/youtubePlayer.js | !nextsong list [x | y] - Display songs in queue from the range, max of 5 |
| ./systems/noticeSystem.js | !notice | Base command for managing notices |
| ./systems/noticeSystem.js | !notice list | Lists the beginning of all notices in the currently selected group |
| ./systems/noticeSystem.js | !notice get [id] | Gets the notice related to the ID in the currently selected group |
| ./systems/noticeSystem.js | !notice edit [id] [new message] | Replace the notice at the given ID in the currently selected group |
| ./systems/noticeSystem.js | !notice toggleid [id] | Toggles on/off the notice at the given ID |
| ./systems/noticeSystem.js | !notice remove [id] | Removes the notice related to the given ID in the currently selected group |
| ./systems/noticeSystem.js | !notice add [message or command] | Adds a notice, with a custom message or a command ex: !notice add command:COMMANDS_NAME to the currently selected group |
| ./systems/noticeSystem.js | !notice insert [id] [message or command] | Inserts a notice at place [id], with a custom message or a command ex: !notice add command:COMMANDS_NAME to the currently selected group |
| ./systems/noticeSystem.js | !notice interval [min minutes] [max minutes] &#124; [fixed minutes] | Sets the notice interval in minutes |
| ./systems/noticeSystem.js | !notice req [message count] | Set the number of messages needed to trigger a notice in current group |
| ./systems/noticeSystem.js | !notice status | Shows notice configuration for currently selected group |
| ./systems/noticeSystem.js | !notice selectgroup [id] | Change the group currently selected for inspection and editing |
| ./systems/noticeSystem.js | !notice addgroup [name] | Add a group of notices with their own timer and settings |
| ./systems/noticeSystem.js | !notice removegroup [id] | Remove a group of notices |
| ./systems/noticeSystem.js | !notice renamegroup [id] [name] | Rename a group of notices |
| ./systems/noticeSystem.js | !notice toggle | Toggles the currently selected notice group on and off |
| ./systems/noticeSystem.js | !notice toggleoffline | Toggles on and off if notices of the currently selected group will be sent in chat if the channel is offline |
| ./systems/noticeSystem.js | !notice toggleshuffle | Toggles on and off if notices of the currently selected group will be sent in random order |
| ./systems/queueSystem.js | !queue open [max size] [title] | Opens a new queue. Max size is optional. |
| ./systems/queueSystem.js | !queue close | Closes the current queue that is opened. |
| ./systems/queueSystem.js | !queue clear | Closes and resets the current queue. |
| ./systems/queueSystem.js | !queue togglemsg | Toggles if the bot posts a success resonse to !joinqueue. |
| ./systems/queueSystem.js | !queue remove [username] | Removes that username from the queue. |
| ./systems/queueSystem.js | !queue list | Gives you the current queue list. Note that if the queue list is very long it will only show the first 5 users in the queue. |
| ./systems/queueSystem.js | !queue next [amount] | Shows the players that are to be picked next. Note if the amount is not specified it will only show one. |
| ./systems/queueSystem.js | !queue pick [amount] | Picks the players next in line from the queue. Note if the amount is not specified it will only pick one. |
| ./systems/queueSystem.js | !queue random [amount] | Picks random players from the queue. Note if the amount is not specified it will only pick one. |
| ./systems/queueSystem.js | !queue position [username] | Tells what position that user is in the queue and at what time he joined. |
| ./systems/queueSystem.js | !queue info | Gives you the current information about the queue that is opened |
| ./systems/queueSystem.js | !joinqueue [gamertag] | Adds you to the current queue. Note that the gamertag part is optional. |
| ./systems/ticketraffleSystem.js | !traffle [option] | Displays usage for the command |
| ./systems/ticketraffleSystem.js | !traffle open [max entries] [regular ticket multiplier (default = 1)] [subscriber ticket multiplier (default = 1)] [cost] [ | followers] - Opens a ticket raffle. -followers is optional. |
| ./systems/ticketraffleSystem.js | !traffle close | Closes a ticket raffle. |
| ./systems/ticketraffleSystem.js | !traffle draw [amount (default = 1)] [loyalty points prize (default = 0)] | Picks winner(s) for the ticket raffle and optionally awards them with points, and closes the raffle if it is still open |
| ./systems/ticketraffleSystem.js | !traffle reset | Resets the raffle. |
| ./systems/ticketraffleSystem.js | !traffle toggleopendraw | Toggles whether the raffle closes automatically when drawing a winner |
| ./systems/ticketraffleSystem.js | !traffle messagetoggle | Toggles on and off a message when entering a ticket raffle |
| ./systems/ticketraffleSystem.js | !traffle limitertoggle | Toggles the ticket limiter between only bought tickets mode and bought + bonus tickets mode |
| ./systems/ticketraffleSystem.js | !traffle autoannouncemessage [message] | Sets the auto announce message for when a raffle is opened |
| ./systems/ticketraffleSystem.js | !traffle autoannounceinterval [minutes] | Sets the auto announce message interval. Use 0 to disable it |
| ./systems/ticketraffleSystem.js | !tickets [amount / max] | Buy tickets to enter the ticket raffle. |
| ./systems/commercialSystem.js | !commercial | Command for manually running comemrcials or managing the commercial autotimer |
| ./systems/commercialSystem.js | !commercial autotimer | Manages the autotimer |
| ./systems/commercialSystem.js | !commercial autotimer off | Disables the autotimer |
| ./systems/commercialSystem.js | !commercial autotimer nomessage | Removes the message sent when autotimer starts a commercial |
| ./systems/commercialSystem.js | !commercial autotimer message (message) | Adds/changes the message sent when autotimer starts a commercial |
| ./systems/commercialSystem.js | !commercial autotimer (interval_mins) (length_secs) [message] | Sets the autotimer |
| ./systems/commercialSystem.js | !commercial (length) [silent] | Runs a commercial, optionally does not post a success message to chat |
| ./systems/bettingSystem.js | !bet open ["title"] ["option1, option2, option3"] [minimum bet] [maximum bet] [close timer] | Opens a bet with those options. |
| ./systems/bettingSystem.js | !bet close ["winning option"] | Closes the current bet. |
| ./systems/bettingSystem.js | !bet reset | Resets the current bet. |
| ./systems/bettingSystem.js | !bet save | Toggle if bet results get saved or not after closing one. |
| ./systems/bettingSystem.js | !bet togglemessages | Toggles bet warning messages on or off. |
| ./systems/bettingSystem.js | !bet saveformat [date format] | Changes the date format past bets are saved in default is yyyy.mm.dd |
| ./systems/bettingSystem.js | !bet gain [percent] | Changes the point gain percent users get when they win a bet. |
| ./systems/bettingSystem.js | !bet lookup [date] | Displays the results of a bet made on that day. If you made multiple bets you will have to add "_#" to specify the bet. |
| ./systems/bettingSystem.js | !bet current | Shows current bet stats. |
| ./systems/bettingSystem.js | !bet [amount] [option] | Bets on that option. |
| ./systems/auctionSystem.js | !auction | Primary auction command |
| ./systems/auctionSystem.js | !auction open [increments] [minimum bet] [timer] [nopoints] | Opens an auction; timer is optional; nopoints is optional and starts an auction without affecting the users' points |
| ./systems/auctionSystem.js | !auction close | Closes an open auction |
| ./systems/auctionSystem.js | !auction reset | Resets the auction. |
| ./systems/auctionSystem.js | !auction warn | Shows the top bidder in an auction |
| ./systems/auctionSystem.js | !auction lastWinner | Shows the last auctions' winner and its winning bid |
| ./systems/auctionSystem.js | !auction setExtensionTime [extension time] | Sets the time being added to the endtimer if a bid is set in the last 10 seconds (maximum value is 29) |
| ./systems/auctionSystem.js | !bid [amount] | Amount to bid on the current auction |
| ./systems/ranksSystem.js | !rankedit setcost [points] | Cost of custom rank. |
| ./systems/ranksSystem.js | !rank del | Deletes customized rank. |
| ./systems/quoteSystem.js | !editquote [id] [user&#124;game&#124;quote] [text] | Edit quotes. |
| ./systems/quoteSystem.js | !quotemodetoggle | toggle between !addquote function modes |
| ./systems/quoteSystem.js | !addquote [quote text] | Save a quote |
| ./systems/quoteSystem.js | !delquote [quoteId] | Delete a quote |
| ./systems/quoteSystem.js | !quote [quoteId] | Announce a quote by its Id, omit the id parameter to get a random quote |
| ./systems/quoteSystem.js | !quotemessage [message] | Sets the quote string with tags: (id) (quote) (user) (userrank) (game) (date) |
