## Console Commands

**These console commands are available directly in the bot console when not running as a service.**

&nbsp;

Parameters enclosed in square brackets `[ ]` are required when using the command

Parameters enclosed in parenthesis `( )` are optional when using the command

<!-- table -->
| Command | Description |
| :--- | :--- |
| anonsubgifttest (userName) (tier) (months) | - Test ananonymous gift subscription |
| backupdb | - Creates a backup of the current database. |
| bitstest (user) (amount) (message) | - Sends a fake bits event. |
| blueskysetup | - Links a Bluesky account with an app password. |
| botinfo | - Prints the bot information in the console. |
| checkytquota | - This command checks the quota points used byYouTube. |
| cliptest | - Sends a fake clip event. |
| convertdb (old db type) | - Converts an existing DB to thecurrent DB type. Parameter should be one of: H2, MySQL,MariaDB, SQLite |
| createcmdlist | - Creates a list of all commands with theirpermissions as a CSV. |
| debuglog | - Prints all debug lines to a file. |
| debugoff | - Disables debug mode. |
| debugon | - Enables debug mode. |
| discordreconnect | - Reconnects to Discord. |
| dumpheap | - Creates a heap dump |
| dumpthreads | - Creates a thread dump |
| exit | - Shuts down the bot. |
| exportpoints | - This command exports points and time to a CSVfile. |
| followerstest [amount] | - Sends a fake follower events. |
| followertest [username] | - Sends a fake follower event. |
| forceoauthrefresh | - Force a refresh of both Twitch OAuthtokens. |
| giftsubtest (userName) (tier) (months) | - Sends a fake giftsubscriber events. |
| importpoints | - This command imports time and points from acsv file in format (Username,Seconds,Points) |
| jointest (userName) | - Sends 30 fake join events or onespecific user for testing. |
| massanonsubgifttest (amount) (tier) | - Test a mass anonymousgift subscription. |
| masssubgifttest (amount) (tier) | - Test a mass sub giftsubscription. |
| mysqlsetup | - Sets up MySQL. |
| offlinetest | - Sends a fake offline event. |
| onlinetest | - Sends a fake online event. |
| panelsetup | - Sets up the panel. |
| paneluser add username | - Creates a new panel user with fullaccess to all panel sections if the user does not exist andprints the randomly generated password |
| paneluser delete username | - Deletes a panel user if the userexists |
| paneluser enable username | - Enables a panel user if the userexists |
| paneluser enable username | - Disables a panel user if the userexists |
| paneluser resetpassword username | - Resets a panel userspassword and removes their passkeys if the user exists andprints the new and randomly generated password |
| paneluser resetpermission username | - Gives a panel user fullaccess to all panel sections if the user exists |
| paneluser setuplink username | - Prints a one-time link that lets apanel user, or the panel login from botlogin.txt, add a passkeywithout signing in. It works once, for 24 hours, and replaces anyearlier link of the user. Using it removes a temporary passwordthe user has not changed yet; for the panel login from botlogin.txtit turns panelpasswordless on and removes panelpassword |
| primesubscribertest (userName) (months) | - Sends a fake Primesubscriber events. |
| raidtest (raiderName) (numViewers) | - Tests the raid event. |
| reconnect | - Reconnects to TMI and EventSub. |
| reposttest (platform) (accounts) | - Sends a fake repost rewards event, by default for Bluesky. |
| restoredb (filename) | - Restores a backup of the database. |
| resubscribertest (userName) (tier) (months) (message) | - Sendsa fake re-subscriber events. |
| socialtest (platform) (type) (account) (text) | - Sends a fake social media activity event, by default a Bluesky mention. |
| streamlabssetup | - Sets up StreamLabs. |
