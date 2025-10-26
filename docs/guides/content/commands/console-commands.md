## Console Commands

**These console commands are available directly in the bot console when not running as a service.**

&nbsp;

Parameters enclosed in square brackets `[ ]` are required when using the command

Parameters enclosed in parenthesis `( )` are optional when using the command

<!-- table -->
|Command|Description|
|:---|:---|
|forceoauthrefresh|Force a refresh of both Twitch OAuthtokens.|
|updategameslist|Force a full update of the games list.|
|raidtest (raiderName) (numViewers)|Tests the raid event.|
|checkytquota|This command checks the quota points used byYouTube.|
|exportpoints|This command exports points and time to a CSVfile.|
|importpoints|This command imports time and points from acsv file in format (Username,Seconds,Points)|
|createcmdlist|Creates a list of all commands with theirpermissions as a CSV.|
|botinfo|Prints the bot information in the console.|
|backupdb|Creates a backup of the current database.|
|restoredb (filename)|Restores a backup of the database.|
|jointest (userName)|Sends 30 fake join events or onespecific user for testing.|
|followertest [username]|Sends a fake follower event.|
|followerstest [amount]|Sends a fake follower events.|
|subscribertest (userName) (tier) (months) (message)|Sends afake subscriber events.|
|primesubscribertest (userName) (months)|Sends a fake Primesubscriber events.|
|resubscribertest (userName) (tier) (months) (message)|Sendsa fake re-subscriber events.|
|giftsubtest (userName) (tier) (months)|Sends a fake giftsubscriber events.|
|massanonsubgifttest (amount) (tier)|Test a mass anonymousgift subscription.|
|masssubgifttest (amount) (tier)|Test a mass sub giftsubscription.|
|anonsubgifttest (userName) (tier) (months)|Test ananonymous gift subscription|
|onlinetest|Sends a fake online event.|
|offlinetest|Sends a fake offline event.|
|cliptest|Sends a fake clip event.|
|bitstest (user) (amount) (message)|Sends a fake bits event.|
|discordreconnect|Reconnects to Discord.|
|reconnect|Reconnects to TMI and EventSub.|
|debugon|Enables debug mode.|
|debugoff|Disables debug mode.|
|debuglog|Prints all debug lines to a file.|
|exit|Shuts down the bot.|
|mysqlsetup|Sets up MySQL.|
|streamlabssetup|Sets up StreamLabs.|
|tipeeestreamsetup|Sets up TipeeeStream.|
|panelsetup|Sets up the panel.|
|ytsetup|Sets up YouTube API Key|
|dumpheap|Creates a heap dump|
|dumpthreads|Creates a thread dump|
|paneluser add username|Creates a new panel user with fullaccess to all panel sections if the user does not exist andprints the randomly generated password|
|paneluser delete username|Deletes a panel user if the userexists|
|paneluser enable username|Enables a panel user if the userexists|
|paneluser enable username|Disables a panel user if the userexists|
