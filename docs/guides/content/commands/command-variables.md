## Custom Commands Tag Guideline:

**These command variables can be used in any  custom command.**

&nbsp;

<!-- toc -->

<!-- tocstop -->

&nbsp;

## Global Command Tags

[^raw]: **Raw:** If _Yes_, this tag does not escape it's output, which may lead to new tags being returned which will then be processed by the appropriate transformers. If _Sometimes_, then some return conditions may return escaped. If _no_, then output is always escaped and tags returned in the output of this transformer will not be parsed unless it is inside an `(unescape)` tag

[^cached]: **Cached:** If _Yes_, the results of this tag, with the exact arguments presented, are temporarily cached and will not be re-processed for the rest of the current command, speeding up execution if the tag is used multiple times. The cache is cleared after every command execution

[^cancels]: **Cancels:** If _Yes_, this tag will immediately cancel further parsing and execution of the current command, though the tag itself may still send a message to chat. If _Sometimes_, then some return conditions may cancel execution of the command

### randomInt

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(#)` - a random integer from 1 to 100, inclusive
- `(# a:int, b:int)` - a random integer from a to b, inclusive


**Example:**
```text
Caster: !addcom !lucky Your lucky number is (#)
User: !lucky
Bot: Your lucky number is 7
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### buildArgs

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(n:int)` - the n-th argument (escaped by default)
- `(n:int=tag:str)` - the n-th argument, if given, else another tag to replace this one
- `(n:int|default:str)` - the n-th argument, if given, else a provided default value


**Example:**
```text
Caster: !addcom !love (sender) loves (1).
User: !love monkeys
Bot: User loves monkeys.
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
Sometimes&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### atSender

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(@sender)` - '@<Sender's Name>, '


**Example:**
```text
Caster: !addcom !hello (@sender) you are awesome!
User: !hello
Bot: @User, you're awesome!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### adminonlyedit

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(adminonlyedit)` - returns blank


_NOTE: metatag that prevents anyone but the broadcaster or admins from editing the command_


**Example:**
```text
Caster: !addcom !playtime Current playtime: (playtime). (adminonlyedit)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### age

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(age)` - outputs the age of the sender's Twitch account; If the sender provides an argument, checks that Twitch account instead


**Example:**
```text
Caster: !addcom !age (age)
User: !age
Bot: @User, user has been on Twitch since April 19, 2009.
User: !age User2
Bot: @User, user2 has been on Twitch since December 25, 2010.
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | Yes

&nbsp;

### alert

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(alert fileName:str)` - sends a GIF/video alert to the alerts overlay, fading out after 3 seconds
- `(alert fileName:str, durationSeconds:int)` - sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with the audio volume set to 0.8
- `(alert fileName:str, durationSeconds:int, volume:float)` - sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with audio volume set on a scale of 0.0-1.0
- `(alert fileName:str, durationSeconds:int, volume:float, css:text)` - sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with audio volume set on a scale of 0.0-1.0, and the provided CSS applied to the GIF/video
- `(alert fileName:str, durationSeconds:int, volume:float, css:text, message:text)` - sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with audio volume set on a scale of 0.0-1.0, a message under the GIF/video, and the provided CSS applied to the GIF/video and message


_NOTE: if an audio file exists next to the GIF/video file with the same fileName but an audio extension (eg. banana.gif and banana.mp3), then the audio file will automatically load and play at the provided volume_


**Example:**
```text
Caster: !addcom !banana (alert banana.gif)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### baresender

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(baresender)` - the login name of the message's sender

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### channelname

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(channelname)` - the display name of the Twitch channel

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### code

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(code length:int)` - random code of the given length composed of a-zA-Z0-9


**Example:**
```text
Caster: !addcom !code (code 5)
User: !code
Bot: A1D4f
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### command

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(command name:str)` - execute command with given name and pass no args
- `(command name:str args:str)` - execute command with given name and pass args

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | Yes

&nbsp;

### commandslist

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(commandslist)` - lists custom commands (paginated)
- `(commandslist prefix:str)` - lists custom commands (paginated) with a prefix in the output

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | Yes

&nbsp;

### count

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(count)` - increases the count of how often this command has been called and output new count


**Example:**
```text
Caster:  !addcom !spam Chat has been spammed (count) times
User: !spam
Bot: Chat has been spammed 5050 times.
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### countdown

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(countdown datetime:str)` - shows the time remaining until the given datetime


_NOTE: for information about accepted datetime formats, see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse_


**Example:**
```text
Caster: !addcom !count Time Left: (countdown December 23 2017 23:59:59 GMT+0200)
User: !count
Bot: Time Left: 20 hours, 30 minutes and 55 seconds.
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### countup

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(countup datetime:str)` - shows the time elapsed since the given datetime


_NOTE: for information about accepted datetime formats, see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse_


**Example:**
```text
Caster: !addcom !ago You missed it by (countup December 23 2017 23:59:59 GMT+0200)
User: !ago
Bot: You missed it by 20 hours, 30 minutes and 55 seconds.
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### currenttime

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(currenttime timezone:str, format:str)` - shows the current date/time in given timezone, using the provided output format


_NOTE: for information about crafting a format string, see https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/text/SimpleDateFormat.html_

_NOTE: for information about accepted timezone strings, see https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/TimeZone.html_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### customapi

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(customapi url:str)` - http GET url and output returned text (escaped by default)


_NOTE: the command tag (token) can be placed in the url for a secret token saved via !tokencom or the panel_

_NOTE: if any args, $1-$9, are used in the url, they are required to be provided by the user issuing the command or the tag will abort and return an error message instead_

_NOTE: this will output the full response from the remote url, so be careful not to cause spam or lock up the bot with a webpage_


**Example:**
```text
Caster: !addcom !joke (customapi http://not.real.com/joke.php?name=$1)
User: !joke bear
Bot: These jokes are un-bear-able
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### customapijson

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(customapijson url:str specs:str)` - httpGet url and extract json info according to specs (escaped by default)


_NOTE: the command tag (token) can be placed in the url for a secret token saved via !tokencom or the panel_

_NOTE: if any args, $1-$9, are used in the url, they are required to be provided by the user issuing the command or the tag will abort and return an error message instead_

_NOTE: the response must be a JSONObject. arrays are only supported with a known index, walking arrays is not supported_

_NOTE: multiple specs can be provided, separated by spaces; curly braces can be used to enclose literal strings_


**Example:**
```text
Caster: !addcom !weather (customapijson http://api.apixu.com/v1/current.json?key=NOT_PROVIDED&q=$1 {Weather for} location.name {:} current.condition.text {Temps:} current.temp_f {F} current.temp_c {C})
User: !weather 80314
Bot: Weather for Boulder, CO : Sunny Temps: 75 F 24 C
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### downtime

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(downtime)` - how long the channel has been offline

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### echo

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(echo)` - all arguments passed to the command


**Example:**
```text
Caster: !addcom !echo (echo)
User: !echo test test
Bot: test test
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### encodeurl

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(encodeurl url:str)` - url encode the given url

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### encodeurlparam

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(encodeurlparam paramter:str)` - like encodeurl but also ecapes "&", "=", "+", "/", etc.

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### followage

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(followage)` - sends a message denoting how long the sender of command is following this channel
- `(followage user:str)` - sends a message denoting how long the provided user is following this channel
- `(followage user:str channel:str)` - sends a message denoting how long the provided user is following the provided channel


**Example:**
```text
Caster: !addcom !followage (followage)
User: !followage
Bot: @User, user has been following channel PhantomBot since March 29, 2016. (340 days)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | Yes

&nbsp;

### followdate

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(followdate)` - the date the sender of this command last followed this channel
- `(followdate user:str)` - the date the provided user last followed this channel
- `(followdate user:str channel:str)` - the date the provided user last followed the provided channel

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### follows

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(follows)` - number of follower of this channel


**Example:**
```text
Caster: !addcom !follows We currently have (follows) followers!
User: !follows
Bot: We currently have 1000 followers!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### game

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(game)` - currently played game


**Example:**
```text
Caster: !addcom !game (pointtouser) current  game is: (game)
User: !game
Bot: User -> current game is: Programming
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### gameinfo

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(gameinfo)` - similar to (game) but include game time if online


**Example:**
```text
Caster: !addcom !game (pointtouser) Current game: (gameinfo).
User: !game
Bot: User -> Current game: Programming Playtime: 3 hours, 20 minutes and 35 seconds.
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### gameonly

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(gameonly name:str)` - cancels the command if the current game does not exactly match the one provided; multiple games can be provided, separated by |
- `(gameonly !! name:str)` - cancels the command if the current game exactly matches the one provided; multiple games can be provided, separated by |

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | Sometimes

&nbsp;

### gamesplayed

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(gamesplayed)` - list games played in current stream, and the approximate uptime when each game was started; if offline, cancels the command


**Example:**
```text
Caster: !addcom !gamesplayed Games played in this stream: (gamesplayed)
User: !gamesplayed
Bot: Games played in this stream: Creative - 00:00, Programming - 02:30
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | Sometimes

&nbsp;

### gettimevar

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(gettimevar name:str)` - retrieves the specified timevar, set using !settimevar, for use in a (countdown) or (countup) transformer


**Example:**
```text
Caster: !settimevar christmas December 25 2017 00:00:00 GMT-0500
Caster: !addcom !count Time Left until Christmas: (countdown (gettimevar christmas))
User: !count
Bot: Time Left until Christmas: 20 hours, 30 minutes and 55 seconds.
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### hours

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(hours)` - number of hours sender has spent in chat
- `(hours user:str)` - number of hours the provided user has spent in chat

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### hoursround

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(hoursround)` - number of hours sender has spent in chat, with the value rounded to the nearest tenth of an hour
- `(hoursround user:str)` - number of hours the provided user has spent in chat, with the value rounded to the nearest tenth of an hour

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### keywordcount

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(keywordcount keyword:str)` - increase the keyword count for the given keyword and return new count

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### lasttip

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(lasttip)` - last tip message

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### offlineonly

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(offlineonly)` - if the channel is not offline, cancels the command


**Example:**
```text
Caster: !addcom !downtime The stream as been offline for (downtime). (offlineonly)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | Sometimes

&nbsp;

### onlineonly

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(onlineonly)` - if the channel is not online, cancels the command


**Example:**
```text
Caster: !addcom !uptime (pointtouser) (channelname) has been live for (uptime). (onlineonly)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | Sometimes

&nbsp;

### pay

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(pay)` - outputs the number of points the sender has gained by using this command
- `(pay command:str)` - outputs the number of points the sender would gain if they use the specified command

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### playsound

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(playsound hook:str)` - plays a sound hook on the alerts overlay
- `(playsound hook:str|volume:float)` - plays a sound hook on the alerts overlay, with audio volume set on a scale of 0.0-1.0


**Example:**
```text
Caster: !addcom !good Played sound goodgood (playsound goodgood)
```

**Example:**
```text
Caster: !addcom !evil Played sound evil (playsound evillaugh|0.5)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### playtime

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(playtime)` - how long this channel has streamed current game; if offline, sends an error to chat and cancels the command


**Example:**
```text
Caster: !addcom !playtime Current playtime: (playtime).
User: !playtime
Bot: Current playtime: 30 minutes.
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | Sometimes

&nbsp;

### pointname

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(pointname)` - the plural name of the loyalty points


**Example:**
```text
Caster: !addcom !pointsname (sender) current points name is set to: (pointname)
User: !pointsname
Bot: User current points name is set to: points
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### pointtouser

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(pointtouser)` - user + ' -> '; uses sender's display name if no other is provided


**Example:**
```text
Caster: !addcom !facebook (pointtouser) like my Facebook page!
User: !facebook
Bot: User ->  like my Facebook page!
User: !facebook User2
Bot: User2 -> like my Facebook  page!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### points

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(points)` - points of the sender
- `(points user:str)` - points of the given user

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### price

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(price)` - the number of points the sender paid to use this command
- `(price command:str)` - the number of points the sender would pay if they use the specified command


**Example:**
```text
Caster: !addcom !cost This command costs (price) (pointname)
User: !cost
Bot: This command costs 10 points
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### random

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(random)` - random user in chat, or the bot's name if chat is empty


**Example:**
```text
Caster: !addcom !poke /me pokes (random) with a long wooden stick.
User: !poke
Bot: /me pokes User2 with a long wooden stick.
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### randomrank

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(randomrank)` - random user in chat, or the bot's name if chat is empty; the chosen user's rank is prefixed


**Example:**
```text
Caster: !addcom !poke /me Pokes (randomrank) with a bar of soap.
User: !poke
Bot: /me Pokes Master User2 with a bar of soap.
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### readfile

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(readfile filename:str)` - first line of the specified file


_NOTE: files will be read from the addons folder, or a subfolder therein specified by the filename parameter_


**Example:**
```text
Caster: !addcom !lastfollow Last follower was (readfile ./followHandler/latestFollower.txt)
User: !lastfollow
Bot: Last follower was User
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### readfilerand

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(readfilerand filename:str)` - random line of the specified file


_NOTE: files will be read from the addons folder, or a subfolder therein specified by the filename parameter_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### repeat

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(repeat n:int, message:str)` - repeat the message n times (copy/paste)

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### sender

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(sender)` - the sender's display name


**Example:**
```text
Caster: !addcom !hello Hello, (sender)!
User: !hello
Bot: Hello, User!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### senderrank

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(senderrank)` - the sender's display name, prefixed with their rank


**Example:**
```text
Caster: !addcom !poke /me Pokes (senderrank) with a bar of soap.
User: !poke
Bot: /me Pokes Master User with a bar of soap.
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### senderrankonly

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(senderrankonly)` - the sender's rank

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### status

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(status)` - the current stream title


**Example:**
```text
Caster: !addcom !status (pointtouser) current status is: (status)
User: !status
Bot: User -> current status is: Fun programming!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### subscribers

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(subscribers)` - number of subscribers of this channel


_NOTE: only works if the apioauth in botlogin.txt belongs to the broadcaster_


**Example:**
```text
Caster: !addcom !subs (subscribers) subscribers!
User: !subs
Bot: 10 subscribers!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### team_member_followers

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(team_member_followers team:str, membername:str)` - number of followers of user membername in the provided team


_NOTE: the team parameter should be the url slug for the team_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### team_member_game

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(team_member_game team:str, membername:str)` - game user membername in the provided team currently plays


_NOTE: the team parameter should be the url slug for the team_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### team_member_url

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(team_member_url team:str, membername:str)` - url of user membername in the provided team


_NOTE: the team parameter should be the url slug for the team_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### team_members

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(team_members team:str)` - number of members in the provided team


_NOTE: the team parameter should be the url slug for the team_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### team_name

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(team_name team:str)` - name of the provided team


_NOTE: the team parameter should be the url slug for the team_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### team_random_member

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(team_random_member team:str)` - random member of the provided team


_NOTE: the team parameter should be the url slug for the team_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### team_url

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(team_url team:str)` - url to the provided team


_NOTE: the team parameter should be the url slug for the team_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### titleinfo

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(titleinfo)` - title + uptime if online


**Example:**
```text
Caster: !addcom !title (pointtouser) Current title: (titleinfo).
User: !title
Bot: User -> Current title: Fun programming! Uptime: 3 hours, 20 minutes and 35 seconds.
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### touser

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(touser)` - display name of the user provided as an argument by the sender; sender's display name if no other is provided


**Example:**
```text
Caster: !addcom !twitter (touser) Hey! Follow my Twitter!
User: !twitter
Bot: User Hey! Follow my Twitter!
User: !twitter User2
Bot: User2 Hey! Follow my Twitter!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### unescape

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(unescape str:str)` - unescape \\ \( \) to \ ( ) respectively

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
Yes&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### uptime

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(uptime)` - how long the channel has been streaming this session; if offline, an error is sent to chat and the command is canceled


**Example:**
```text
Caster: !addcom !uptime (pointtouser) (channelname) has been live for (uptime).
User: !uptime
Bot: @User, PhantomBot has been live for 2 hours, 3 minutes and 30 seconds.
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | Sometimes

&nbsp;

### useronly

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(useronly name:str)` - only allows the given user to use the command; multiple users separated by spaces is allowed; if another user attempts to use the command, an error is sent to chat (if permComMsg is enabled) and the command is canceled


_NOTE: use @moderators as one of the user names to allow all moderators and admins_

_NOTE: use @admins as one of the user names to allow all admins_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | Sometimes

&nbsp;

### viewers

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(viewers)` - number of current viewers


**Example:**
```text
Caster: !addcom !viewers We currently have (viewers) viewers watching us!
User: !viewers
Bot: We currently have 600 viewers watching us!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### views

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(views)` - number of total view count for the stream

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### writefile

Defined in script: _./javascript-source/core/commandTags.js_

**Formulas:**

- `(writefile filename:str, append:bool, text:str)` - writes the specified text to the provided file; if append is 'true', data is appended to the end of the file, otherwise the file is overwritten


_NOTE: files will be placed in the addons folder, or a subfolder therein specified by the filename parameter_


**Example:**
```text
Caster: !addcom !settxt (writefile test.txt, true, (echo))
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

---

## Transformer Usage

_Indicates whether the hooks in each script use transformers that are global, local, or both_

### customCommands.js

Defined in script: _./javascript-source/commands/customCommands.js_

#### Hook: command

Global&nbsp;&nbsp; | Local
-------|-------
Yes&nbsp;&nbsp; | No
