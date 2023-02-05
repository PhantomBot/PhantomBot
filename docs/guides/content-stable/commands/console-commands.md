## Console Commands

**These console commands are available directly in the bot console when not running as a service.**

&nbsp;

<!-- toc -->

<!-- tocstop -->

&nbsp;

Parameters enclosed in square brackets `[ ]` are required when using the command

Parameters enclosed in parenthesis `( )` are optional when using the command

### forceoauthrefresh

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

forceoauthrefresh - Force a refresh of both Twitch OAuth tokens.

&nbsp;

### updategameslist

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

updategameslist - Force a full update of the games list.

&nbsp;

### raidtest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

raidtest (raiderName) (numViewers) - Tests the raid event.

&nbsp;

### checkytquota

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

checkytquota - This command checks the quota points used by YouTube.

&nbsp;

### exportpoints

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

exportpoints - This command exports points and time to a CSV file.

&nbsp;

### createcmdlist

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

createcmdlist - Creates a list of all commands with their permissions as a CSV.

&nbsp;

### botinfo

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

botinfo - Prints the bot information in the console.

&nbsp;

### backupdb

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

backupdb - Creates a backup of the current database.

&nbsp;

### fixfollowedtable

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

fixfollowedtable - Grabs the last 10,000 followers from the Twitch API.

&nbsp;

### fixfollowedtable-force

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

fixfollowedtable-force - Grabs all followers from the Twitch API.

&nbsp;

### jointest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

jointest (userName) - Sends 30 fake join events or one specific user for testing.

&nbsp;

### channelpointstest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

channelpointstest - Sends a fake Channel Points redemption for testing.

&nbsp;

### followertest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

followertest [username] - Sends a fake follower event.

&nbsp;

### followerstest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

followerstest [amount] - Sends a fake follower events.

&nbsp;

### subscribertest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

subscribertest (userName) (tier) (months) (message) - Sends a fake subscriber events.

&nbsp;

### primesubscribertest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

primesubscribertest (userName) (months) - Sends a fake Prime subscriber events.

&nbsp;

### resubscribertest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

resubscribertest (userName) (tier) (months) (message) - Sends a fake re-subscriber events.

&nbsp;

### giftsubtest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

giftsubtest (userName) (tier) (months) - Sends a fake gift subscriber events.

&nbsp;

### massanonsubgifttest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

massanonsubgifttest (amount) (tier) - Test a mass anonymous gift subscription.

&nbsp;

### anonsubgifttest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

anonsubgifttest (userName) (tier) (months) - Test an anonymous gift subscription

&nbsp;

### onlinetest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

onlinetest - Sends a fake online event.

&nbsp;

### offlinetest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

offlinetest - Sends a fake offline event.

&nbsp;

### cliptest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

cliptest - Sends a fake clip event.

&nbsp;

### bitstest

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

bitstest (user) (amount) (message) - Sends a fake bits event.

&nbsp;

### discordreconnect

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

discordreconnect - Reconnects to Discord.

&nbsp;

### reconnect

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

reconnect - Reconnects to TMI and PubSub.

&nbsp;

### debugon

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

debugon - Enables debug mode.

&nbsp;

### debugoff

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

debugoff - Disables debug mode.

&nbsp;

### debuglog

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

debuglog - Prints all debug lines to a file.

&nbsp;

### save

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

save - Forces the database to save.

&nbsp;

### exit

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

exit - Shuts down the bot.

&nbsp;

### mysqlsetup

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

mysqlsetup - Sets up MySQL.

&nbsp;

### streamlabssetup

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

streamlabssetup - Sets up StreamLabs.

&nbsp;

### tipeeestreamsetup

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

tipeeestreamsetup - Sets up TipeeeStream.

&nbsp;

### panelsetup

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

panelsetup - Sets up the panel.

&nbsp;

### ytsetup

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

ytsetup - Sets up YouTube API Key

&nbsp;

### dumpheap

Defined in source file: _./source/tv/phantombot/console/ConsoleEventHandler.java_

dumpheap - Creates a heap dump
