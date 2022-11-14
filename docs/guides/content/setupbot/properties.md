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


### Admin
#### userollbar

Data Type: _Boolean_

if `true`, exceptions thrown during operation may be sent to rollbar exception tracking. default `true`

&nbsp;

#### allowpanelusertosetup

Data Type: _Boolean_

if `true`, the panel login can access the setup page; else only the random token. default `true`

&nbsp;

#### channel

Data Type: _String_

the twitch channel the bot will operate in

&nbsp;

#### owner

Data Type: _String_

the name of the bot owner, who has administrator privileges to the bot

&nbsp;

### Twitch
#### clientid

Data Type: _String_

the twitch developer application client id

&nbsp;

#### clientsecret

Data Type: _String_

the twitch developer application client secret

&nbsp;

#### offlinedelay

Data Type: _Int_

the delay, in seconds, before the `channel` is confirmed to be offline. default `30`

&nbsp;

#### offlinetimeout

Data Type: _Int_

the timeout, in seconds, after `channel` goes offline before it can be online. default `300`

&nbsp;

#### usebroadcasterforchatcommands

Data Type: _Boolean_

if `true`, certain redirected chat commands are sent as the broadcaster. default `false`

&nbsp;

### Datastore
#### datastore

Data Type: _String_

the type of db to use. valid values: `sqlite3store`, `mysqlstore`, `h2store`. default `sqlite3store`

&nbsp;

#### mysqlhost

Data Type: _String_

the ip, domain name, or hostname of the mysql server

&nbsp;

#### mysqlport

Data Type: _String_

the port to use for mysql connections. default `3306`

&nbsp;

#### mysqlname

Data Type: _String_

the schema where the tables for the bot will be created/located on the mysql server

&nbsp;

#### mysqluser

Data Type: _String_

the username to login as to the mysql server

&nbsp;

#### mysqlpass

Data Type: _String_

the password for `mysqluser`

&nbsp;

#### backupdbauto

Data Type: _Boolean_

if `true`, the database is backed up to the ./backups folder every so often. default `true`

&nbsp;

#### backupdbkeepdays

Data Type: _Int_

the number of days before a db backup is deleted. default `5`

&nbsp;

#### backupdbhourfrequency

Data Type: _Int_

the number of hours between db backups, if enabled. default `24`

&nbsp;

#### datastoreconfig

Data Type: _String_

if set, h2store: overrides the db file name; sqlitestore: links to a file containing config overrides

&nbsp;

### Panel Login
#### paneluser

Data Type: _String_

the username to login to the panel. default `panel`

&nbsp;

#### panelpassword

Data Type: _String_

the password to login to the panel. default is a randomly generated password

&nbsp;

### Misc
#### restartcmd

Data Type: _String_

a command that can be used to restart the bot, if it is running as a service

&nbsp;

#### logtimezone

Data Type: _String_

the timezone for timestamps in the log. must be a valid iana time zone database name. default `gmt`

&nbsp;

#### rhino_es6

Data Type: _Boolean_

if `true`, enables newer features from ecmascript 6 in rhino. default `true`

&nbsp;

#### reloadscripts

Data Type: _Boolean_

if `true`, scripts which are changed while the bot is running will be reloaded. default `false`

&nbsp;

#### silentscriptsload

Data Type: _Boolean_

if `true`, the script loading messages during startup are suppressed. default `false`

&nbsp;

#### musicenable

Data Type: _Boolean_

if `true`, enables the websocket handler for the song request/youtube player. default `true`

&nbsp;

### Other
#### eventsubcallbackurl

Data Type: _String_

the url which will receive eventsub notifications

&nbsp;

#### useeventsub

Data Type: _Boolean_

if `true`, enables the eventsub module. default `false`

&nbsp;

### Discord
#### discord_token

Data Type: _String_

the bot token from the discord developer portal

&nbsp;

### StreamElements
#### streamelementsid

Data Type: _String_

the user id for retrieving donations from streamelements

&nbsp;

#### streamelementsjwt

Data Type: _String_

the jwt token for retrieving donations from streamelements

&nbsp;

#### streamelementslimit

Data Type: _Int_

the maximum number of donations to pull from streamelements when updating. default `5`

&nbsp;

### TipeeeStream
#### tipeeestreamkey

Data Type: _String_

the access token for retrieving donations from tipeeestream

&nbsp;

#### tipeeestreamlimit

Data Type: _Int_

the maximum number of donations to pull from tipeeestream when updating. default `5`

&nbsp;

### YouTube
#### youtubekey

Data Type: _String_

the access token for youtube apiv3

&nbsp;

### StreamLabs
#### twitchalertskey

Data Type: _String_

the access token for retrieving donations from streamlabs

&nbsp;

#### twitchalertslimit

Data Type: _Int_

the maximum number of donations to pull from streamlabs when updating. default `5`

&nbsp;

### Twitter
#### twitter_client_id

Data Type: _String_

the client id for twitter api

&nbsp;

#### twitter_client_secret

Data Type: _String_

the client secret for twitter api

&nbsp;

#### twittertimelinelimit

Data Type: _Int_

the maximum number of tweets to retrieve with a latest tweets request. default `15`

&nbsp;

#### twittertimelineextendedlimit

Data Type: _Int_

the maximum number of tweets to retrieve with a sinceid. default `30`

&nbsp;

#### twitterusertimelinelimit

Data Type: _Int_

the maximum number of tweets to retrieve per follower, when grabbing retweets. default `15`

&nbsp;

### HTTP/WS Options
#### usedefaultdnsresolver

Data Type: _Boolean_

if `true`, only the default java/system dns resolver is used. default `false`

&nbsp;

#### baseport

Data Type: _Int_

the port the bots webserver runs on. default `25000`

&nbsp;

#### usehttps

Data Type: _Boolean_

if `true`, the bots webserver uses https to secure the connection. default `true`

&nbsp;

#### httpsfilename

Data Type: _String_

if httpskeyfilename is unset/blank, a jks containing the certificate; else, an x509 certificate in pem format

&nbsp;

#### httpskeyfilename

Data Type: _String_

the pkcs#8 private key in pem format for httpsfilename; if unset/blank, httpsfilename is loaded as a jks

&nbsp;

#### httpspassword

Data Type: _String_

the password, if any, to _httpsfilename_

&nbsp;

#### proxybypasshttps

Data Type: _Boolean_

if `true`, the http server reports ssl is enabled, even if `usessl` is `false`. default `true`

&nbsp;

#### httpclienttimeout

Data Type: _Int_

the timeout, in seconds, for an http request to complete. default `10`

&nbsp;

#### bindip

Data Type: _String_

the ip address the bots webserver runs on. default all

&nbsp;

#### webenable

Data Type: _Boolean_

if `true`, the bots webserver is started. default `true`

&nbsp;

### Debug
#### debugon

Data Type: _Boolean_

if `true`, enables debug output. default `false`

&nbsp;

#### debuglog

Data Type: _Boolean_

if `true`, debug output is sent to log only, not the console. default `false`

&nbsp;

#### ircdebug

Data Type: _Boolean_

if `true`, raw inbound and outbound irc commands (except pass) are sent to the debug log. default `false`

&nbsp;

#### helixdebug

Data Type: _Boolean_

if `true`, debugging info for twitch helix api requests are sent to the debug log. default `false`

&nbsp;

#### wsdebug

Data Type: _Boolean_

if `true`, information about inbound ws frames for the panel are sent to the debug log. default `false`

&nbsp;

#### reactordebug

Data Type: _Boolean_

if `true`, internal debugging for reactor http and ws processing is sent to the console. default `false`

&nbsp;

#### internaldebug

Data Type: _Boolean_

if `true`, internal debugging from jdk and other libraries are sent to the console. default `false`

&nbsp;

#### wspingerdebug

Data Type: _Boolean_

if `true`, prints debug messages for active wspinger instances. default `false`

&nbsp;

#### dnsdebug

Data Type: _Boolean_

if `true`, prints debugging info about dns resolution to the debug log. default `false`

&nbsp;

#### httpclientdebug

Data Type: _Boolean_

if `true`, information about each http request sent by httpclient is sent to the debug log. default `false`

&nbsp;

#### pathvalidatedebug

Data Type: _Boolean_

if `true`, prints debug information for the path validator to the debug log. default `false`

&nbsp;

#### rhinodebugger

Data Type: _Boolean_

if `true`, enables the rhino debugger console. default `false`
