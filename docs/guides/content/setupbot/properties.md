## Bot Properties

**These properties can be defined in _botlogin.txt_**

Docker can also define them as ENV variables by converting to uppercase and adding the _PHANTOMBOT\__ prefix

NOTE: If the property exists in botlogin.txt, the ENV variable is ignored unless _PHANTOMBOT\_ENVOVERRIDE: "true"_ is set

NOTE: If the property does not list a default value, then the default value is not set/disabled


NOTE: _botlogin.txt_ can **not** be edited while the bot is running

&nbsp;

<!-- toc -->

<!-- tocstop -->

&nbsp;


### backupdbauto

Data Type: _Boolean_

backupdbauto - If `true`, the database is backed up to the ./backups folder every so often. Default `true`

&nbsp;

### backupdbhourfrequency

Data Type: _Int_

backupdbhourfrequency - The number of hours between DB backups, if enabled. Default `24`

&nbsp;

### backupdbkeepdays

Data Type: _Int_

backupdbkeepdays - The number of days before a DB backup is deleted. Default `5`

&nbsp;

### baseport

Data Type: _Int_

baseport - The port the bots webserver runs on. Default `25000`

&nbsp;

### bindip

Data Type: _String_

bindip - The IP address the bots webserver runs on. Default all

&nbsp;

### channel

Data Type: _String_

channel - The Twitch channel the bot will operate in

&nbsp;

### clientid

Data Type: _String_

clientid - The Twitch Developer Application Client ID

&nbsp;

### clientsecret

Data Type: _String_

clientsecret - The Twitch Developer Application Client Secret

&nbsp;

### datastore

Data Type: _String_

datastore - The type of DB to use. Valid values: `sqlite3store`, `mysqlstore`, `h2store`. Default `sqlite3store`

&nbsp;

### datastoreconfig

Data Type: _String_

datastoreconfig - If set, H2Store: Overrides the DB file name; SQLiteStore: Links to a file containing config overrides

&nbsp;

### debuglog

Data Type: _Boolean_

debuglog - If `true`, debug output is sent to log only, not the console. Default `false`

&nbsp;

### debugon

Data Type: _Boolean_

debugon - If `true`, enables debug output. Default `false`

&nbsp;

### discord_token

Data Type: _String_

discord_token - The Bot token from the Discord Developer portal

&nbsp;

### dnsdebug

Data Type: _Boolean_

dnsdebug - If `true`, prints debugging info about DNS resolution to the debug log. Default `false`

&nbsp;

### eventsubcallbackurl

Data Type: _String_

eventsubcallbackurl - The URL which will receive EventSub notifications

&nbsp;

### helixdebug

Data Type: _Boolean_

helixdebug - If `true`, debugging info for Twitch Helix API requests are sent to the debug log. Default `false`

&nbsp;

### httpclientdebug

Data Type: _Boolean_

httpclientdebug - If `true`, information about each HTTP request sent by HttpClient is sent to the debug log. Default `false`

&nbsp;

### httpclienttimeout

Data Type: _Int_

httpclienttimeout - The timeout, in seconds, for an HTTP request to complete. Default `10`

&nbsp;

### httpsfilename

Data Type: _String_

httpsFileName - If httpsKeyFileName is unset/blank, a JKS containing the certificate; else, an X509 Certificate in PEM format

&nbsp;

### httpskeyfilename

Data Type: _String_

httpsKeyFileName - The PKCS#8 private key in PEM format for httpsFileName; if unset/blank, httpsFileName is loaded as a JKS

&nbsp;

### httpspassword

Data Type: _String_

httpsPassword - The password, if any, to _httpsFileName_

&nbsp;

### internaldebug

Data Type: _Boolean_

internaldebug - If `true`, internal debugging from JDK and other libraries are sent to the console. Default `false`

&nbsp;

### ircdebug

Data Type: _Boolean_

ircdebug - If `true`, raw inbound and outbound IRC commands (except PASS) are sent to the debug log. Default `false`

&nbsp;

### logtimezone

Data Type: _String_

logtimezone - The timezone for timestamps in the log. Must be a valid IANA Time Zone Database name. Default `GMT`

&nbsp;

### musicenable

Data Type: _Boolean_

musicenable - If `true`, enables the websocket handler for the Song Request/YouTube player. Default `true`

&nbsp;

### mysqlhost

Data Type: _String_

mysqlhost - The IP, domain name, or hostname of the MySQL server

&nbsp;

### mysqlname

Data Type: _String_

mysqlname - The schema where the tables for the bot will be created/located on the MySQL server

&nbsp;

### mysqlpass

Data Type: _String_

mysqlpass - The password for `mysqluser`

&nbsp;

### mysqlport

Data Type: _String_

mysqlport - The port to use for MySQL connections. Default `3306`

&nbsp;

### mysqluser

Data Type: _String_

mysqluser - The username to login as to the MySQL server

&nbsp;

### offlinedelay

Data Type: _Int_

offlinedelay - The delay, in seconds, before the `channel` is confirmed to be offline. Default `30`

&nbsp;

### offlinetimeout

Data Type: _Int_

offlinetimeout - The timeout, in seconds, after `channel` goes offline before it can be online. Default `300`

&nbsp;

### owner

Data Type: _String_

owner - The name of the bot owner, who has administrator privileges to the bot

&nbsp;

### panelpassword

Data Type: _String_

panelpassword - The password to login to the panel. Default is a randomly generated password

&nbsp;

### paneluser

Data Type: _String_

paneluser - The username to login to the panel. Default `panel`

&nbsp;

### pathvalidatedebug

Data Type: _Boolean_

pathvalidatedebug - If `true`, prints debug information for the path validator to the debug log. Default `false`

&nbsp;

### proxybypasshttps

Data Type: _Boolean_

proxybypasshttps - If `true`, the HTTP server reports SSL is enabled, even if `usessl` is `false`. Default `true`

&nbsp;

### reactordebug

Data Type: _Boolean_

reactordebug - If `true`, internal debugging for Reactor HTTP and WS processing is sent to the console. Default `false`

&nbsp;

### reloadscripts

Data Type: _Boolean_

reloadscripts - If `true`, scripts which are changed while the bot is running will be reloaded. Default `false`

&nbsp;

### restartcmd

Data Type: _String_

restartcmd - A command that can be used to restart the bot, if it is running as a service

&nbsp;

### rhino_es6

Data Type: _Boolean_

rhino_es6 - If `true`, enables newer features from ECMAScript 6 in Rhino. Default `false`

&nbsp;

### rhinodebugger

Data Type: _Boolean_

rhinodebugger - If `true`, enables the Rhino debugger console. Default `false`

&nbsp;

### silentscriptsload

Data Type: _Boolean_

silentscriptsload - If `true`, the script loading messages during startup are suppressed. Default `false`

&nbsp;

### streamelementsid

Data Type: _String_

streamelementsid - The user id for retrieving donations from StreamElements

&nbsp;

### streamelementsjwt

Data Type: _String_

streamelementsjwt - The JWT token for retrieving donations from StreamElements

&nbsp;

### streamelementslimit

Data Type: _Int_

streamelementslimit - The maximum number of donations to pull from StreamElements when updating. Default `5`

&nbsp;

### tipeeestreamkey

Data Type: _String_

tipeeestreamkey - The access token for retrieving donations from TipeeeStream

&nbsp;

### tipeeestreamlimit

Data Type: _Int_

tipeeestreamlimit - The maximum number of donations to pull from TipeeeStream when updating. Default `5`

&nbsp;

### twitchalertskey

Data Type: _String_

twitchalertskey - The access token for retrieving donations from StreamLabs

&nbsp;

### twitchalertslimit

Data Type: _Int_

twitchalertslimit - The maximum number of donations to pull from StreamLabs when updating. Default `5`

&nbsp;

### twitter_access_token

Data Type: _String_

No definition

&nbsp;

### twitter_client_id

Data Type: _String_

twitter_client_id - The client id for Twitter API

&nbsp;

### twitter_client_secret

Data Type: _String_

twitter_client_secret - The client secret for Twitter API

&nbsp;

### twitter_refresh_token

Data Type: _String_

No definition

&nbsp;

### twittertimelineextendedlimit

Data Type: _Int_

twittertimelineextendedlimit - The maximum number of tweets to retrieve with a sinceId. Default `30`

&nbsp;

### twittertimelinelimit

Data Type: _Int_

twittertimelinelimit - The maximum number of tweets to retrieve with a latest tweets request. Default `15`

&nbsp;

### twitterusertimelinelimit

Data Type: _Int_

twitterusertimelinelimit - The maximum number of tweets to retrieve per follower, when grabbing retweets. Default `15`

&nbsp;

### usebroadcasterforchatcommands

Data Type: _Boolean_

usebroadcasterforchatcommands - If `true`, certain redirected chat commands are sent as the broadcaster. Default `false`

&nbsp;

### usedefaultdnsresolver

Data Type: _Boolean_

usedefaultdnsresolver - If `true`, only the default Java/System DNS resolver is used. Default `false`

&nbsp;

### useeventsub

Data Type: _Boolean_

useeventsub - If `true`, enables the EventSub module. Default `false`

&nbsp;

### usehttps

Data Type: _Boolean_

usehttps - If `true`, the bots webserver uses HTTPS to secure the connection. Default `true`

&nbsp;

### user

Data Type: _String_

user - The username the bot will login as to send chat messages

&nbsp;

### userollbar

Data Type: _Boolean_

userollbar - If `true`, Exceptions thrown during operation may be sent to Rollbar exception tracking. Default `true`

&nbsp;

### webenable

Data Type: _Boolean_

webenable - If `true`, the bots webserver is started. Default `true`

&nbsp;

### wsdebug

Data Type: _Boolean_

wsdebug - If `true`, information about inbound WS frames for the panel are sent to the debug log. Default `false`

&nbsp;

### wspingerdebug

Data Type: _Boolean_

wspingerdebug - If `true`, prints debug messages for active WSPinger instances. Default `false`

&nbsp;

### youtubekey

Data Type: _String_

youtubekey - The access token for YouTube APIv3
