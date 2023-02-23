## Custom Command Tags

**These command variables can be used in any custom command.**

&nbsp;

<!-- toc -->

<!-- tocstop -->

&nbsp;

## Global Command Tags

[^raw]: **Raw:** If _Yes_, this tag does not escape it's output, which may lead to new tags being returned which will then be processed by the appropriate transformers. If _Sometimes_, then some return conditions may return escaped. If _no_, then output is always escaped and tags returned in the output of this transformer will not be parsed unless it is inside an `(unescape)` tag

[^cached]: **Cached:** If _Yes_, the results of this tag, with the exact arguments presented, are temporarily cached and will not be re-processed for the rest of the current command, speeding up execution if the tag is used multiple times. The cache is cleared after every command execution

[^cancels]: **Cancels:** If _Yes_, this tag will immediately cancel further parsing and execution of the current command, though the tag itself may still send a message to chat. If _Sometimes_, then some return conditions may cancel execution of the command

### alerts
#### alert

Defined in script: _./javascript-source/core/transformers/alerts.js_

**Formulas:**

- `(alert fileName:str)` - sends a GIF/video alert to the alerts overlay, fading out after 3 seconds
- `(alert fileName:str, durationSeconds:int)` - sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with the audio volume set to 0.8
- `(alert fileName:str, durationSeconds:int, volume:float)` - sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with audio volume set on a scale of 0.0-1.0
- `(alert fileName:str, durationSeconds:int, volume:float, css:text)` - sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with audio volume set on a scale of 0.0-1.0, and the provided CSS applied to the GIF/video
- `(alert fileName:str, durationSeconds:int, volume:float, css:text, message:text)` - sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with audio volume set on a scale of 0.0-1.0, a message under the GIF/video, and the provided CSS applied to the GIF/video and message

**Labels:** twitch discord noevent alerts


_NOTE: if an audio file exists next to the GIF/video file with the same fileName but an audio extension (eg. banana.gif and banana.mp3), then the audio file will automatically load and play at the provided volume_


**Example:**
```text
Caster: !addcom !banana (alert banana.gif)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### playsound

Defined in script: _./javascript-source/core/transformers/alerts.js_

**Formulas:**

- `(playsound hook:str)` - plays a sound hook on the alerts overlay
- `(playsound hook:str|volume:float)` - plays a sound hook on the alerts overlay, with audio volume set on a scale of 0.0-1.0

**Labels:** twitch discord noevent alerts


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

### basic
#### buildArgs

Defined in script: _./javascript-source/core/transformers/basic.js_

**Formulas:**

- `(n:int)` - the n-th argument (escaped by default)
- `(n:int=tag:str)` - the n-th argument, if given, else another tag to replace this one
- `(n:int|default:str)` - the n-th argument, if given, else a provided default value

**Labels:** twitch discord commandevent basic


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

#### delaysay

Defined in script: _./javascript-source/core/transformers/basic.js_

**Formulas:**

- `(delaysay delayseconds:int message:str)` - send the given message to chat, after the given delay

**Labels:** twitch discord commandevent commands

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### echo

Defined in script: _./javascript-source/core/transformers/basic.js_

**Formulas:**

- `(echo)` - all arguments passed to the command

**Labels:** twitch discord commandevent basic


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

#### random

Defined in script: _./javascript-source/core/transformers/basic.js_

**Formulas:**

- `(random)` - random user in chat, or the bot's name if chat is empty

**Labels:** twitch discord noevent basic


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

#### randomInt

Defined in script: _./javascript-source/core/transformers/basic.js_

**Formulas:**

- `(#)` - a random integer from 1 to 100, inclusive
- `(# a:int, b:int)` - a random integer from a to b, inclusive

**Labels:** twitch discord noevent basic


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

#### randomrank

Defined in script: _./javascript-source/core/transformers/basic.js_

**Formulas:**

- `(randomrank)` - random user in chat, or the bot's name if chat is empty; the chosen user's rank is prefixed

**Labels:** twitch noevent basic


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

#### repeat

Defined in script: _./javascript-source/core/transformers/basic.js_

**Formulas:**

- `(repeat n:int, message:str)` - repeat the message n times (copy/paste)

**Labels:** twitch discord noevent basic

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### channelpoints
#### cpcancel

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cpcancel)` - marks the Channel Points redemption as cancelled, refunding the users channel points

**Labels:** twitch channelpointsevent channelpoints


_NOTE: only works on redeemables that have been created by the bot_

_NOTE: only works on redeemables that have `should_redemptions_skip_request_queue` set to `false`_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### cpcost

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cpcost)` - the cost of the redeemable that was redeemed

**Labels:** twitch channelpointsevent channelpoints

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### cpdisplayname

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cpdisplayname)` - the display name of the user who redeemed

**Labels:** twitch channelpointsevent channelpoints

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### cpfulfill

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cpfulfill)` - marks the Channel Points redemption as fulfilled

**Labels:** twitch channelpointsevent channelpoints


_NOTE: only works on redeemables that have been created by the bot_

_NOTE: only works on redeemables that have `should_redemptions_skip_request_queue` set to `false`_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### cpfulfillstatus

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cpfulfillstatus)` - the fulfillment status of the redemption when it was received by PubSub

**Labels:** twitch channelpointsevent channelpoints

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### cpinput

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cpinput)` - the input supplied by the redeeming user, if set

**Labels:** twitch channelpointsevent channelpoints


_NOTE: All newline characters `\n` are URL-encoded as `%0A`_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### cpinputraw

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cpinput)` - the raw input supplied by the redeeming user, if set

**Labels:** twitch channelpointsevent channelpoints

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### cpprompt

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cpprompt)` - the input prompt of the redeemable that was redeemed, if set

**Labels:** twitch channelpointsevent channelpoints

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### cpredeemableid

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cpredeemableid)` - the ID of the redeemable that was redeemed

**Labels:** twitch channelpointsevent channelpoints

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### cpredemptionid

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cpredemptionid)` - the ID of this redemption event

**Labels:** twitch channelpointsevent channelpoints

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### cpsetenabled

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cpsetenabled redeemableId:str isEnabled:bool)` - sets the enabled state of the redeemable

**Labels:** twitch discord noevent channelpoints


_NOTE: disabled redeemables are not visible to viewers_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### cpsetpaused

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cpsetpaused redeemableId:str isPaused:bool)` - sets the paused state of the redeemable

**Labels:** twitch discord noevent channelpoints


_NOTE: paused redeemables are visible to viewers, but can not be redeemed_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### cptitle

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cptitle)` - the title of the redeemable that was redeemed

**Labels:** twitch channelpointsevent channelpoints

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### cpuserid

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cpuserid)` - the ID of the user who redeemed

**Labels:** twitch channelpointsevent channelpoints

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### cpusername

Defined in script: _./javascript-source/core/transformers/channelpoints.js_

**Formulas:**

- `(cpusername)` - the login name of the user who redeemed

**Labels:** twitch channelpointsevent channelpoints

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### channelstream
#### channelname

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(channelname)` - the display name of the Twitch channel
- `(channelname channel:str)` - the display name of the provided Twitch channel

**Labels:** twitch discord noevent channel stream

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### downtime

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(downtime)` - how long the channel has been offline

**Labels:** twitch discord noevent channel stream

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### followage

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(followage)` - sends a message denoting how long the sender of command is following this channel
- `(followage user:str)` - sends a message denoting how long the provided user is following this channel
- `(followage user:str channel:str)` - sends a message denoting how long the provided user is following the provided channel

**Labels:** twitch commandevent channel stream


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

#### followdate

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(followdate)` - the date the sender of this command last followed this channel
- `(followdate user:str)` - the date the provided user last followed this channel
- `(followdate user:str channel:str)` - the date the provided user last followed the provided channel

**Labels:** twitch commandevent channel stream

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### follows

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(follows)` - number of follower of this channel
- `(follows channel:str)` - number of follower of the specified channel

**Labels:** twitch discord noevent channel stream


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

#### game

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(game)` - currently played game
- `(game channel:str)` - currently played game of the specified channel

**Labels:** twitch discord noevent channel stream


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

#### gameinfo

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(gameinfo)` - similar to (game) but include game time if online

**Labels:** twitch discord noevent channel stream


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

#### gamesplayed

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(gamesplayed)` - list games played in current stream, and the approximate uptime when each game was started; if offline, cancels the command

**Labels:** twitch discord commandevent channel stream


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

#### hours

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(hours)` - number of hours sender has spent in chat
- `(hours user:str)` - number of hours the provided user has spent in chat

**Labels:** twitch commandevent channel stream

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### hoursround

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(hoursround)` - number of hours sender has spent in chat, with the value rounded to the nearest tenth of an hour
- `(hoursround user:str)` - number of hours the provided user has spent in chat, with the value rounded to the nearest tenth of an hour

**Labels:** twitch commandevent channel stream

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### lasttip

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(lasttip)` - last tip message

**Labels:** twitch discord noevent channel stream

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### playtime

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(playtime)` - how long this channel has streamed current game; if offline, sends an error to chat and cancels the command

**Labels:** twitch discord commandevent channel stream


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

#### status

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(status)` - the current stream title
- `(status channel:str)` - the current stream title of the specified channel

**Labels:** twitch discord noevent channel stream


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

#### subscribers

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(subscribers)` - number of subscribers of this channel

**Labels:** twitch discord noevent channel stream


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

#### titleinfo

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(titleinfo)` - title + uptime if online

**Labels:** twitch discord noevent channel stream


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

#### uptime

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(uptime)` - how long the channel has been streaming this session; if offline, an error is sent to chat and the command is canceled
- `(uptime channel:str)` - how long the specified channel has been streaming this session; if offline, an error is sent to chat and the command is canceled

**Labels:** twitch discord commandevent channel stream


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

#### viewers

Defined in script: _./javascript-source/core/transformers/channelstream.js_

**Formulas:**

- `(viewers)` - number of current viewers
- `(viewers channel:str)` - number of current viewers for the specified channel

**Labels:** twitch discord noevent channel stream


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

### commands
#### command

Defined in script: _./javascript-source/core/transformers/commands.js_

**Formulas:**

- `(command name:str)` - execute command with given name and pass no args
- `(command name:str args:str)` - execute command with given name and pass args

**Labels:** twitch discord commandevent commands

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### commandslist

Defined in script: _./javascript-source/core/transformers/commands.js_

**Formulas:**

- `(commandslist)` - lists custom commands (paginated)
- `(commandslist prefix:str)` - lists custom commands (paginated) with a prefix in the output

**Labels:** twitch commandevent commands

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | Yes

&nbsp;

#### count

Defined in script: _./javascript-source/core/transformers/commands.js_

**Formulas:**

- `(count)` - increases the count of how often this command has been called and outputs new count
- `(count amount:int)` - increases the count of how often this command has been called by the specified amount and outputs new count
- `(count amount:int name:str)` - increases the count of how often the named counter has been called by the specified amount and outputs new count
- `(count reset name:str)` - zeroes the named counter and outputs new count

**Labels:** twitch discord commandevent commands


_NOTE: Specify an amount of `0` to display the count without changing it._

_Specify a negative amount to subtract from it._

_The default counter name is the command name, without the `!`_


**Example:**
```text
Caster: !addcom !spam Chat has been spammed (count) times
User: !spam
Bot: Chat has been spammed 5050 times.
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### delaycommand

Defined in script: _./javascript-source/core/transformers/commands.js_

**Formulas:**

- `(delaycommand delayseconds:int name:str)` - execute command with given name and pass no args, after the given delay
- `(delaycommand delayseconds:int name:str args:str)` - execute command with given name and pass args, after the given delay

**Labels:** twitch discord commandevent commands

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### customapi
#### customapi

Defined in script: _./javascript-source/core/transformers/customapi.js_

**Formulas:**

- `(customapi url:str)` - http GET url and output returned text

**Labels:** twitch discord commandevent customapi


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

#### customapijson

Defined in script: _./javascript-source/core/transformers/customapi.js_

**Formulas:**

- `(customapijson url:str specs:str)` - httpGet url and extract json info according to specs

**Labels:** twitch discord commandevent customapi


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

### discord
#### cleardiscordactivity

Defined in script: _./javascript-source/core/transformers/discord.js_

**Formulas:**

- `(cleardiscordactivity)` - removes the bots current activity in Discord, setting it to just plain Online

**Labels:** twitch discord noevent presence


**Example:**
```text
Caster: !addcom !cleardiscord (cleardiscordactivity)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### removerole

Defined in script: _./javascript-source/core/transformers/discord.js_

**Formulas:**

- `(removerole username:str, role:str)` - removes the specified user from the specified Discord role

**Labels:** discord noevent roles


**Example:**
```text
Caster: !addcom !removerole (removerole (sender), Cool Kids)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### setdiscordcompeting

Defined in script: _./javascript-source/core/transformers/discord.js_

**Formulas:**

- `(setdiscordcompeting str:str)` - sets the bots current activity in Discord to: Competing in (str)

**Labels:** twitch discord noevent presence


**Example:**
```text
Caster: !addcom !lcs (setdiscordcompeting LCS)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### setdiscordlistening

Defined in script: _./javascript-source/core/transformers/discord.js_

**Formulas:**

- `(setdiscordlistening str:str)` - sets the bots current activity in Discord to: Listening to (str)

**Labels:** twitch discord noevent presence


**Example:**
```text
Caster: !addcom !heavymetal (setdiscordlistening Heavy Metal)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### setdiscordplaying

Defined in script: _./javascript-source/core/transformers/discord.js_

**Formulas:**

- `(setdiscordplaying str:str)` - sets the bots current activity in Discord to: Playing (str)

**Labels:** twitch discord noevent presence


**Example:**
```text
Caster: !addcom !rocketleague (setdiscordplaying Rocket League)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### setdiscordstreaming

Defined in script: _./javascript-source/core/transformers/discord.js_

**Formulas:**

- `(setdiscordstreaming url:str str:str)` - sets the bots current activity in Discord to: &lt;a href="(url)"&gt;Streaming (str)&lt;/a&gt;

**Labels:** twitch discord noevent presence


_NOTE: Only urls starting with `https://twitch.tv/` and `https://youtube.com/` will work_


**Example:**
```text
Caster: !addcom !dontstarve (setdiscordstreaming https://twitch.tv/CoolStreamer Don't Starve)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### setdiscordwatching

Defined in script: _./javascript-source/core/transformers/discord.js_

**Formulas:**

- `(setdiscordwatching str:str)` - sets the bots current activity in Discord to: Watching (str)

**Labels:** twitch discord noevent presence


**Example:**
```text
Caster: !addcom !movienight (setdiscordwatching Movie Night)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### setrole

Defined in script: _./javascript-source/core/transformers/discord.js_

**Formulas:**

- `(setrole username:str, role:str)` - adds the specified user to the specified Discord role

**Labels:** discord noevent roles


**Example:**
```text
Caster: !addcom !coolrole (setrole (sender), Cool Kids)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### file
#### readfile

Defined in script: _./javascript-source/core/transformers/file.js_

**Formulas:**

- `(readfile filename:str)` - first line of the specified file

**Labels:** twitch discord noevent file


_NOTE: files will be read from the addons folder, or a subfolder therein specified by the filename parameter_

_NOTE: file contents are returned with parenthasis `( )` escaped, preventing command tags in the files from being processed._

_Use `(unescape (readfile filename))` to enable processing the returned tags_


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

#### readfileall

Defined in script: _./javascript-source/core/transformers/file.js_

**Formulas:**

- `(readfileall filename:str)` - all lines of the specified file

**Labels:** twitch discord noevent file


_NOTE: files will be read from the addons folder, or a subfolder therein specified by the filename parameter_

_NOTE: empty lines may be ignored_

_NOTE: WARNING: this can cause spam and block the bots message queue_

_NOTE: file contents are returned with parenthasis `( )` escaped, preventing command tags in the files from being processed._

_Use `(unescape (readfileall filename))` to enable processing the returned tags_


**Example:**
```text
Caster: !addcom !story (readfileall ./nightBeforeXmas.txt)
User: !story
Bot: 'Twas the night before Christmas, when all through the house
Bot: Not a creature was stirring, not even a mouse;
Bot: The stockings were hung by the chimney with care,
Bot: In hopes that St. Nicholas soon would be there;
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### readfilerand

Defined in script: _./javascript-source/core/transformers/file.js_

**Formulas:**

- `(readfilerand filename:str)` - random line of the specified file

**Labels:** twitch discord noevent file


_NOTE: files will be read from the addons folder, or a subfolder therein specified by the filename parameter_

_NOTE: file contents are returned with parenthasis `( )` escaped, preventing command tags in the files from being processed._

_Use `(unescape (readfilerand filename))` to enable processing the returned tags_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### writefile

Defined in script: _./javascript-source/core/transformers/file.js_

**Formulas:**

- `(writefile filename:str, append:bool, text:str)` - writes the specified text to the provided file; if append is 'true', data is appended to the end of the file, otherwise the file is overwritten

**Labels:** twitch discord noevent file


_NOTE: files will be placed in the addons folder, or a subfolder therein specified by the filename parameter_


**Example:**
```text
Caster: !addcom !settxt (writefile test.txt, true, (echo))
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### meta
#### adminonlyedit

Defined in script: _./javascript-source/core/transformers/meta.js_

**Formulas:**

- `(adminonlyedit)` - returns blank

**Labels:** twitch commandevent meta


_NOTE: metatag that prevents anyone but the broadcaster or admins from editing the command_


**Example:**
```text
Caster: !addcom !playtime Current playtime: (playtime). (adminonlyedit)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### gameonly

Defined in script: _./javascript-source/core/transformers/meta.js_

**Formulas:**

- `(gameonly name:str)` - cancels the command if the current game does not exactly match the one provided; multiple games can be provided, separated by |
- `(gameonly !! name:str)` - cancels the command if the current game exactly matches the one provided; multiple games can be provided, separated by |

**Labels:** twitch noevent meta

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | Sometimes

&nbsp;

#### offlineonly

Defined in script: _./javascript-source/core/transformers/meta.js_

**Formulas:**

- `(offlineonly)` - if the channel is not offline, cancels the command

**Labels:** twitch commandevent meta


**Example:**
```text
Caster: !addcom !downtime The stream as been offline for (downtime). (offlineonly)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | Sometimes

&nbsp;

#### onlineonly

Defined in script: _./javascript-source/core/transformers/meta.js_

**Formulas:**

- `(onlineonly)` - if the channel is not online, cancels the command

**Labels:** twitch commandevent meta


**Example:**
```text
Caster: !addcom !uptime (pointtouser) (channelname) has been live for (uptime). (onlineonly)
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | Sometimes

&nbsp;

#### useronly

Defined in script: _./javascript-source/core/transformers/meta.js_

**Formulas:**

- `(useronly name:str)` - only allows the given user to use the command; multiple users separated by spaces is allowed; if another user attempts to use the command, an error is sent to chat (if permComMsg is enabled) and the command is canceled

**Labels:** twitch commandevent meta


_NOTE: use @moderators as one of the user names to allow all moderators and admins_

_NOTE: use @admins as one of the user names to allow all admins_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | Sometimes

&nbsp;

### misc
#### code

Defined in script: _./javascript-source/core/transformers/misc.js_

**Formulas:**

- `(code length:int)` - random code of the given length composed of a-zA-Z0-9

**Labels:** twitch discord noevent misc


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

#### encodeurl

Defined in script: _./javascript-source/core/transformers/misc.js_

**Formulas:**

- `(encodeurl url:str)` - url encode the given url

**Labels:** twitch discord noevent misc

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### encodeurlparam

Defined in script: _./javascript-source/core/transformers/misc.js_

**Formulas:**

- `(encodeurlparam paramter:str)` - like encodeurl but also ecapes "&", "=", "+", "/", etc.

**Labels:** twitch discord noevent misc

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### escape

Defined in script: _./javascript-source/core/transformers/misc.js_

**Formulas:**

- `(escape str:str)` - escape \( \) to \\\( \\\) respectively

**Labels:** twitch discord noevent misc

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### keywordcount

Defined in script: _./javascript-source/core/transformers/misc.js_

**Formulas:**

- `(keywordcount keyword:str)` - increase the keyword count for the given keyword and return new count

**Labels:** twitch keywordevent misc

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### nl2br

Defined in script: _./javascript-source/core/transformers/misc.js_

**Formulas:**

- `(nl2br str:str)` - replaces all LF (`\n`) with `<br>` and removes all CR (`\r`)

**Labels:** twitch discord noevent misc

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### nl2x

Defined in script: _./javascript-source/core/transformers/misc.js_

**Formulas:**

- `(nl2x repl:str str:str)` - replaces all LF (`\n`) with the value provided in **repl** and removes all CR (`\r`)

**Labels:** twitch discord noevent misc

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### token

Defined in script: _./javascript-source/core/transformers/misc.js_

**Formulas:**

- `(token)` - replaced with the secret token that was set by !tokencom or the panel

**Labels:** twitch commandevent misc


**Example:**
```text
Caster: !addcom !weather (customapijson http://api.apixu.com/v1/current.json?key=(token)&q=$1 {Weather for} location.name {:} current.condition.text {Temps:} current.temp_f {F} current.temp_c {C})
Caster: !tokencom !weather mySecretApiKey
User: !weather 80314
// customapijson generates the below response using the url: http://api.apixu.com/v1/current.json?key=mySecretApiKey&q=80314
Bot: Weather for Boulder, CO : Sunny Temps: 75 F 24 C
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### unescape

Defined in script: _./javascript-source/core/transformers/misc.js_

**Formulas:**

- `(unescape str:str)` - unescape \\\( \\\) to \( \) respectively, allowing tags returned after processing other tags to run

**Labels:** twitch discord noevent misc


**Example:**
```text
Caster: !addcom !getrandom (unescape (readfilerand randomcommands.txt))
// randomcommands.txt: (command shoutout (sender))
User: !getrandom
Bot: You should check out User! They were last playing Just Chatting! twitch.tv/User
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
Yes&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### url0a2nl

Defined in script: _./javascript-source/core/transformers/misc.js_

**Formulas:**

- `(url0a2nl str:str)` - replaces all URL-Encoded LF (`%0A`) with LF (`\n`)

**Labels:** twitch discord noevent misc

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### points
#### addpoints

Defined in script: _./javascript-source/core/transformers/points.js_

**Formulas:**

- `(addpoints amount:int)` - add points to the sender
- `(addpoints amount:int user:str)` - add points to the given user

**Labels:** twitch commandevent points

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### addpointstoall

Defined in script: _./javascript-source/core/transformers/points.js_

**Formulas:**

- `(addpointstoall amount:int)` - add points to all users currently in chat

**Labels:** twitch commandevent points

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### pay

Defined in script: _./javascript-source/core/transformers/points.js_

**Formulas:**

- `(pay)` - outputs the number of points the sender has gained by using this command
- `(pay command:str)` - outputs the number of points the sender would gain if they use the specified command

**Labels:** twitch commandevent points

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### pointname

Defined in script: _./javascript-source/core/transformers/points.js_

**Formulas:**

- `(pointname)` - the plural name of the loyalty points
- `(pointname amount:int)` - the single or plural name of the loyalty points, depending on the amount provided

**Labels:** twitch noevent points


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

#### points

Defined in script: _./javascript-source/core/transformers/points.js_

**Formulas:**

- `(points)` - points of the sender
- `(points user:str)` - points of the given user

**Labels:** twitch commandevent points

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### price

Defined in script: _./javascript-source/core/transformers/points.js_

**Formulas:**

- `(price)` - the number of points the sender paid to use this command
- `(price command:str)` - the number of points the sender would pay if they use the specified command

**Labels:** twitch commandevent points


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

#### takepoints

Defined in script: _./javascript-source/core/transformers/points.js_

**Formulas:**

- `(takepoints amount:int)` - take points from the sender
- `(takepoints amount:int user:str)` - take points from the given user

**Labels:** twitch commandevent points

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### takepointsfromall

Defined in script: _./javascript-source/core/transformers/points.js_

**Formulas:**

- `(takepointsfromall amount:int)` - take points from all users currently in chat

**Labels:** twitch commandevent points

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### transferpoints

Defined in script: _./javascript-source/core/transformers/points.js_

**Formulas:**

- `(transferpoints amount:int touser:str)` - transfer points from the sender to the given user
- `(transferpoints amount:int touser:str fromuser:str)` - transfer points from the given fromuser to the given touser

**Labels:** twitch commandevent points

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

### teams
#### team_member_followers

Defined in script: _./javascript-source/core/transformers/teams.js_

**Formulas:**

- `(team_member_followers team:str, membername:str)` - number of followers of user membername in the provided team

**Labels:** twitch noevent teams


_NOTE: the team parameter should be the url slug for the team_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### team_member_game

Defined in script: _./javascript-source/core/transformers/teams.js_

**Formulas:**

- `(team_member_game team:str, membername:str)` - game user membername in the provided team currently plays

**Labels:** twitch noevent teams


_NOTE: the team parameter should be the url slug for the team_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### team_member_url

Defined in script: _./javascript-source/core/transformers/teams.js_

**Formulas:**

- `(team_member_url team:str, membername:str)` - url of user membername in the provided team

**Labels:** twitch noevent teams


_NOTE: the team parameter should be the url slug for the team_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### team_members

Defined in script: _./javascript-source/core/transformers/teams.js_

**Formulas:**

- `(team_members team:str)` - number of members in the provided team

**Labels:** twitch noevent teams


_NOTE: the team parameter should be the url slug for the team_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### team_name

Defined in script: _./javascript-source/core/transformers/teams.js_

**Formulas:**

- `(team_name team:str)` - name of the provided team

**Labels:** twitch noevent teams


_NOTE: the team parameter should be the url slug for the team_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### team_random_member

Defined in script: _./javascript-source/core/transformers/teams.js_

**Formulas:**

- `(team_random_member team:str)` - random member of the provided team

**Labels:** twitch noevent teams


_NOTE: the team parameter should be the url slug for the team_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### team_url

Defined in script: _./javascript-source/core/transformers/teams.js_

**Formulas:**

- `(team_url team:str)` - url to the provided team

**Labels:** twitch noevent teams


_NOTE: the team parameter should be the url slug for the team_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### time
#### countdown

Defined in script: _./javascript-source/core/transformers/time.js_

**Formulas:**

- `(countdown datetime:str)` - shows the time remaining until the given datetime

**Labels:** twitch discord noevent time


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

#### countup

Defined in script: _./javascript-source/core/transformers/time.js_

**Formulas:**

- `(countup datetime:str)` - shows the time elapsed since the given datetime

**Labels:** twitch discord noevent time


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

#### currenttime

Defined in script: _./javascript-source/core/transformers/time.js_

**Formulas:**

- `(currenttime timezone:str, format:str)` - shows the current date/time in given timezone, using the provided output format

**Labels:** twitch discord noevent time


_NOTE: for information about crafting a format string, see https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/text/SimpleDateFormat.html_

_NOTE: for information about accepted timezone strings, see https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/TimeZone.html_

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### gettimevar

Defined in script: _./javascript-source/core/transformers/time.js_

**Formulas:**

- `(gettimevar name:str)` - retrieves the specified timevar, set using !settimevar on Twitch, for use in a (countdown) or (countup) transformer

**Labels:** twitch discord noevent time


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

### user
#### age

Defined in script: _./javascript-source/core/transformers/user.js_

**Formulas:**

- `(age)` - outputs the age of the sender's Twitch account; If the sender provides an argument, checks that Twitch account instead
- `(age pattern:str)` - outputs the age of the sender's Twitch account using the specified pattern; If the sender provides an argument, checks that Twitch account instead

**Labels:** twitch commandevent user


_NOTE: _

_Patterns (Example of 1 year, 2 months, 3 days, 12 hours):_

_- `#H` - Number of Hours (Total, ie. 10308)_

_- `#h` - Number of Hours (In day, ie. 12)_

_- `#D` - Number of Days (Total, ie. 429)_

_- `#d` - Number of Days (In month, ie. 3)_

_- `#M` - Number of Months (Total, ie. 14)_

_- `#m` - Number of Months (In year, ie. 2)_

_- `#y` - Number of Years (ie. 1)_

_- Any valid pattern for [DateTimeFormatter](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/time/format/DateTimeFormatter.html#patterns)_


**Example:**
```text
Caster: !addcom !age (age)
User: !age
Bot: @User, user has been on Twitch since April 19, 2009.
User: !age User2
Bot: @User, user2 has been on Twitch since December 25, 2010.
```

**Example:**
```text
Caster: !addcom !age2 (touser) has been on Twitch for (age #y 'year(s), since ' MMMM dd', 'yyyy)!
User: !age2
Bot: User has been on Twitch for 1 year(s), since April 19, 2009!
User: !age2 User2
Bot: User2 has been on Twitch for 2 year(s), since June 5, 2008!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### atSender

Defined in script: _./javascript-source/core/transformers/user.js_

**Formulas:**

- `(@sender)` - '@<Sender's Name>, '

**Labels:** twitch discord commandevent user


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

#### baresender

Defined in script: _./javascript-source/core/transformers/user.js_

**Formulas:**

- `(baresender)` - the login name of the message's sender

**Labels:** twitch commandevent user

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | No&nbsp;&nbsp; | No

&nbsp;

#### pointtouser

Defined in script: _./javascript-source/core/transformers/user.js_

**Formulas:**

- `(pointtouser)` - user + ' -> '; uses sender's display name if no target is provided
- `(pointtouser true)` - user + ' -> '; outputs blank instead if no target is provided

**Labels:** twitch commandevent user


**Example:**
```text
Caster: !addcom !facebook (pointtouser) like my Facebook page!
User: !facebook
Bot: User ->  like my Facebook page!
User: !facebook User2
Bot: User2 -> like my Facebook page!
```

**Example:**
```text
Caster: !addcom !insta (pointtouser true) Follow me on Instagram!
User: !insta
Bot: Follow me on Instagram!
User: !insta User2
Bot: User2 -> Follow me on Instagram!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### sanitizeuser

Defined in script: _./javascript-source/core/transformers/user.js_

**Formulas:**

- `(sanitizeuser user:str)` - does some basic sanitization of a username

**Labels:** twitch commandevent user

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### sender

Defined in script: _./javascript-source/core/transformers/user.js_

**Formulas:**

- `(sender)` - the sender's display name

**Labels:** twitch discord commandevent user


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

#### senderrank

Defined in script: _./javascript-source/core/transformers/user.js_

**Formulas:**

- `(senderrank)` - the sender's display name, prefixed with their rank

**Labels:** twitch commandevent user


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

#### senderrankonly

Defined in script: _./javascript-source/core/transformers/user.js_

**Formulas:**

- `(senderrankonly)` - the sender's rank

**Labels:** twitch commandevent user

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### touser

Defined in script: _./javascript-source/core/transformers/user.js_

**Formulas:**

- `(touser)` - display name of the user provided as an argument by the sender; sender's display name if no target is provided
- `(touser true)` - display name of the user provided as an argument by the sender; outputs blank instead if no target is provided

**Labels:** twitch discord commandevent user


**Example:**
```text
Caster: !addcom !mastadon (touser) Hey! Follow my Mastadon!
User: !mastadon
Bot: User Hey! Follow my Mastadon
User: !mastadon User2
Bot: User2 Hey! Follow my Mastadon!
```

**Example:**
```text
Caster: !addcom !tiktok (touser true) Hey! Follow me on TikTok!
User: !tiktok
Bot: Hey! Follow me on TikTok!
User: !tiktok User2
Bot: User2 Hey! Follow me on TikTok!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

---

## Local Command Tags

_These command tags are only available in the scripts which defined them_

_Some scripts may also restrict the use of global command tags_

### subscribeHandler.js

#### amount

Defined in script: _./javascript-source/handlers/subscribeHandler.js_

**Formulas:**

- `(amount)` - The number of subs given by a mass-giftsub event


**Example:**
```text
Caster: !massgiftsubmessage 1000 (name) just gave away (amount) subs! Thank you!
Twitch: User has just gifted 20 subs at Tier 1 to the community!
Bot: User just gave away 20 subs! Thank you!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### customemote

Defined in script: _./javascript-source/handlers/subscribeHandler.js_

**Formulas:**

- `(customemote)` - '<The Emote, Repeated Months Times (Max 12)>'


**Example:**
```text
Caster: !resubmessage 1000 (name) just subscribed! They have been subscribed for (months) months! Thank you! (customemote)
Caster: !subemote 1000 BloodTrail
Twitch: User has just subscriber at Tier 1! They have been subscribed for 3 months!
Bot: User just subscribed! They have been subscribed for 3 months! Thank you! BloodTrail BloodTrail BloodTrail
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### giftmonths

Defined in script: _./javascript-source/handlers/subscribeHandler.js_

**Formulas:**

- `(giftmonths)` - '<Number of Months Gifted>'


**Example:**
```text
Caster: !giftsubmessage 1000 (name) just gifted (giftmonths) months of (plan) to (recipient)! Thank you!
Twitch: User has just gifted a 6 month sub to OtherUser at Tier 1!
Bot: User just gifted 6 months of Tier 1 to OtherUser! Thank you!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### giftreward

Defined in script: _./javascript-source/handlers/subscribeHandler.js_

**Formulas:**

- `(giftreward)` - '<Points Reward>'

**Custom Arguments:**

- `(giftreward:int)` - The number of points awarded to the gifter for gifting a sub to someone else


**Example:**
```text
Caster: !giftsubmessage 1000 (recipient) just received a sub from (name)! (name) gets (giftreward) points! Thank you!
```

**Example:**
```text
Caster: !giftsubreward 1000 25
Twitch: User has just gifted a sub to OtherUser at Tier 1!
Bot: OtherUser just received a sub from User! User gets 25 points! Thank you!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### months

Defined in script: _./javascript-source/handlers/subscribeHandler.js_

**Formulas:**

- `(months)` - '<Total Months Subscribed>'


**Example:**
```text
Caster: !resubmessage 1000 (name) just subscribed! They have been subscribed for (months) months! Thank you!
Twitch: User has just subscriber at Tier 1! They have been subscribed for 12 months!
Bot: User just subscribed! They have been subscribed for 12 months! Thank you!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### name

Defined in script: _./javascript-source/handlers/subscribeHandler.js_

**Formulas:**

- `(name)` - For subs/resubs, the subscriber's name. For gift subs, the name of the person gifting the sub


**Example:**
```text
Caster: !submessage 1000 (name) just subscribed at Tier 1! Thank you!
Twitch: User has just subscriber at Tier 1!
Bot: User just subscribed at Tier 1! Thank you!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### plan

Defined in script: _./javascript-source/handlers/subscribeHandler.js_

**Formulas:**

- `(plan)` - '<Subscription Tier>'


**Example:**
```text
Caster: !submessage 1000 (name) just subscribed at (plan)! Thank you!
Caster: !namesubplan 1000 Friendo Tier
Twitch: User has just subscriber at Tier 1!
Bot: User just subscribed at Friendo Tier! Thank you!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### recipient

Defined in script: _./javascript-source/handlers/subscribeHandler.js_

**Formulas:**

- `(recipient)` - The name of the recipient of a gift sub


**Example:**
```text
Caster: !giftsubmessage 1000 (recipient) just received a sub from (name)! Thank you!
Twitch: User has just gifted a sub to OtherUser at Tier 1!
Bot: OtherUser just received a sub from User! Thank you!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### reward

Defined in script: _./javascript-source/handlers/subscribeHandler.js_

**Formulas:**

- `(reward)` - '<Points Reward>'

**Custom Arguments:**

- `(reward:int)` - The number of points awarded for the sub


**Example:**
```text
Caster: !submessage 1000 (name) just subscribed at Tier 1! They get (reward) points! Thank you!
Twitch: User has just subscriber at Tier 1!
Bot: User just subscribed at Tier 1! They get 100 points! Thank you!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

### welcomeSystem.js

#### names

Defined in script: _./javascript-source/systems/welcomeSystem.js_

**Formulas:**

- `(names)` - The names of the users being welcomed


**Example:**
```text
Caster: !welcome setmessage Welcome (names)!
Bot: Welcome coolperson1, user2, and viewer3!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### 1

Defined in script: _./javascript-source/systems/welcomeSystem.js_

**Formulas:**

- `(1 str:str)` - The text parameter inside this tag is only printed if there is 1 user being welcomed


**Example:**
```text
Caster: !welcome setmessage (names) (1 is)(2 are)(3 are all) new here. Give them a warm welcome!
Bot: coolperson1 is new here. Give them a warm welcome!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### 2

Defined in script: _./javascript-source/systems/welcomeSystem.js_

**Formulas:**

- `(2 str:str)` - The text parameter inside this tag is only printed if there are 2 users being welcomed


**Example:**
```text
Caster: !welcome setmessage (names) (1 is)(2 are)(3 are all) new here. Give them a warm welcome!
Bot: coolperson1 and user2 are new here. Give them a warm welcome!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

&nbsp;

#### 3

Defined in script: _./javascript-source/systems/welcomeSystem.js_

**Formulas:**

- `(3 str:str)` - The text parameter inside this tag is only printed if there are 3 or more users being welcomed


**Example:**
```text
Caster: !welcome setmessage (names) (1 is)(2 are)(3 are all) new here. Give them a warm welcome!
Bot: coolperson1, user2, and viewer3 are all new here. Give them a warm welcome!
```

Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]
-------|-----------|----------
No&nbsp;&nbsp; | Yes&nbsp;&nbsp; | No

---

## Transformer Usage

_Indicates whether the hooks in each script use transformers that are global, local, or both_

### customCommands.js

Defined in script: _./javascript-source/commands/customCommands.js_

#### Hook: command

Global&nbsp;&nbsp; | Local
-------|-------
Yes&nbsp;&nbsp; | No

**Labels Used:** twitch commandevent noevent

&nbsp;

### discord / customCommands.js

Defined in script: _./javascript-source/discord/commands/customCommands.js_

#### Hook: discordChannelCommand

Global&nbsp;&nbsp; | Local
-------|-------
Yes&nbsp;&nbsp; | No

**Labels Used:** discord commandevent noevent

&nbsp;

### discord / keywordHandler.js

Defined in script: _./javascript-source/discord/handlers/keywordHandler.js_

#### Hook: discordChannelMessage

Global&nbsp;&nbsp; | Local
-------|-------
Yes&nbsp;&nbsp; | No

**Labels Used:** discord commandevent keywordevent noevent

&nbsp;

### channelPointsHandler.js

Defined in script: _./javascript-source/handlers/channelPointsHandler.js_

#### Hook: pubSubChannelPoints

Global&nbsp;&nbsp; | Local
-------|-------
Yes&nbsp;&nbsp; | No

**Labels Used:** twitch commandevent noevent channelpointsevent

&nbsp;

### keywordHandler.js

Defined in script: _./javascript-source/handlers/keywordHandler.js_

#### Hook: ircChannelMessage

Global&nbsp;&nbsp; | Local
-------|-------
Yes&nbsp;&nbsp; | No

**Labels Used:** twitch commandevent keywordevent noevent

&nbsp;

### subscribeHandler.js

Defined in script: _./javascript-source/handlers/subscribeHandler.js_

#### Hook: twitchSubscriber

Global&nbsp;&nbsp; | Local
-------|-------
Yes&nbsp;&nbsp; | Yes

**Labels Used:** twitch noevent

#### Hook: twitchReSubscriber

Global&nbsp;&nbsp; | Local
-------|-------
Yes&nbsp;&nbsp; | Yes

**Labels Used:** twitch noevent

#### Hook: twitchSubscriptionGift

Global&nbsp;&nbsp; | Local
-------|-------
Yes&nbsp;&nbsp; | Yes

**Labels Used:** twitch noevent

#### Hook: twitchMassSubscriptionGifted

Global&nbsp;&nbsp; | Local
-------|-------
Yes&nbsp;&nbsp; | Yes

**Labels Used:** twitch noevent

#### Hook: twitchAnonymousSubscriptionGift

Global&nbsp;&nbsp; | Local
-------|-------
Yes&nbsp;&nbsp; | Yes

**Labels Used:** twitch noevent

#### Hook: twitchMassAnonymousSubscriptionGifted

Global&nbsp;&nbsp; | Local
-------|-------
Yes&nbsp;&nbsp; | Yes

**Labels Used:** twitch noevent

&nbsp;

### welcomeSystem.js

Defined in script: _./javascript-source/systems/welcomeSystem.js_

#### Hook: ircChannelMessage

Global&nbsp;&nbsp; | Local
-------|-------
No&nbsp;&nbsp; | Yes
