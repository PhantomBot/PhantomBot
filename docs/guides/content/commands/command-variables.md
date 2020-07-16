## Custom Commands Tag Guideline:

**These command variables can be used in any  custom command.**

<br>

#### **`(sender)`:**
- This will be replace in your  command response with the username who triggered the command.

**Example:**
```
Caster:  !addcom !hello Hello, (sender)!
User: !hello
Bot: Hello, User!
```

<br>

####  **`(@sender)`:**
- This will be replace in your command response with the username  who triggered the command in a Twitch \\"ping\\" format

**Example:**
```
Caster:  !addcom !hello (@sender) you are awesome!
User: !hello
Bot: @User, you're awesome!
```

<br>

####  **`(touser)`:**
- This will be replace with the username who triggered the command  if no username is mentioned after the command.

**Example:**
```
Caster: !addcom  !twitter (touser) Hey! Follow my Twitter!
User: !twitter
Bot: User Hey! Follow  my Twitter!

User: !twitter User2
Bot: User2 Hey! Follow my Twitter!
```

<br>

####  **`(pointtouser)`:**
- This works just like \\"(touser)\\" but adds an arrow pointing  to the command text when a user is added after the command.

**Example:**
```
Caster:  !addcom !facebook (pointtouser) like my Facebook page!
User: !facebook
Bot: @User,  like my Facebook page!

User: !facebook User2
Bot: User2 -> like my Facebook  page!
```

<br>

#### **`(#)`:**
- Generates a random number from 0 to 100.

**Example:**
```
Caster:  !addcom !lucky Your lucky number is (#)
User: !lucky
Bot: Your lucky number is  7
```

<br>

#### **`(1)`:**
- Specific argument after a command. This is  limited to 9 arguments currently.

**Example:**
```
Caster: !addcom !love (sender)  loves (1).
User: !love monkeys
Bot: User loves monkeys.
```

<br>

#### **`(price)`:**
-  Will give you the current cost of that command.

**Example:**
```
Caster: !addcom  !cost This command costs (price) (pointname)
User: !cost
Bot: This command costs  10 points
```

<br>

#### **`(1=)`:**
- This will give you the first command  argument if it is not empty. It will be replaced with any command variable after  the `=` if it is empty.

**Example:**
```
Caster: !addcom !love The love between  (sender) and (1=random) is (#)%
User: !love cookies
Bot: The love between User  and cookies is 100%

User: !love
Bot: The love between User and RandomUserFromChat  is 1%
```

<br>

#### **`(age)`:**
- This will tell you have long a channel  has been on Twitch.

**Example:**
```
Caster: !addcom !age (age)
User: !age
Bot:  @User, user has been on Twitch since April 19, 2009.

User: !age User2
Bot: @User,  user2 has been on Twitch since December 25, 2010.
```

<br>

#### **`(random)`:**
-  Will give a random person's name from chat.

**Example:**
```
Caster: !addcom  !poke /me pokes (random) with a long wooden stick.
User: !poke
Bot: /me pokes  User2 with a long wooden stick.
```

<br>

#### **`(pointname)`:**
- Current  points name that is set.

**Example:**
```
Caster: !addcom !pointsname (sender)  current points name is set to: (pointname)
User: !pointsname
Bot: User current  points name is set to: points
```

<br>

#### **`(uptime)`:**
- Current stream  uptime.

**Example:**
```
Caster: !addcom !uptime (pointtouser) (channelname)  has been live for (uptime).
User: !uptime
Bot: @User, PhantomBot has been live  for 2 hours, 3 minutes and 30 seconds.
```

<br>

#### **`(game)`:**
- Current  game set on Twitch.

**Example:**
``
Caster: !addcom !game (pointtouser) current  game is: (game)
User: !game
Bot: @User, current game is: Programming
``

<br>

####  **`(status)`:**
- Current status set on Twitch.

**Example:**
``
Caster: !addcom  !status (pointtouser) current status is: (status)
User: !status
Bot: @User, current  status is: Fun programming!
``

<br>

#### **`(viewers)`:**
- Current viewers  on Twitch.

**Example:**
``
Caster: !addcom !viewers We current have (viewers)  viewers watching us!
User: !viewers
Bot: We current have 600 viewers watching  us!
``

<br>

#### **`(follows)`:**
- Current follows on Twitch.

**Example:**
``
Caster:  !addcom !follows We current have (follows) followers!
User: !follows
Bot: We current  have 1000 followers!
``

<br>

#### **`(count)`:**
- increases the count  on the command and will give you the current count.

**Example:**
``
Caster:  !addcom !spam Chat has been spammed (count) times
User: !spam
Bot: Chat has been  spammed 5050 times.
``

<br>

#### **`(offlineonly)`:**
- This will make  that command only work when the stream is offline. 

**Example:**
``
Caster:  !addcom !downtime The stream as been offline for (downtime). (offlineonly)
``

<br>

####  **`(onlineonly)`:**
- This will make that command only work when the stream is  online. 

**Example:**
``
Caster: !addcom !uptime (pointtouser) (channelname)  has been live for (uptime). (onlineonly)
``

<br>

#### **`(code=)`:**
-  This will generate a random code, add the code length you want after the `=`

**Example:**
``
Caster:  !addcom !code (code=5)
User: !code
Bot: A1D4f
``

<br>

#### **`(gamesplayed)`:**
-  This will give you the games you've played in the current stream.

**Example:**
``
Caster:  !addcom !gamesplayed Games played in this stream: (gamesplayed)
User: !gamesplayed
Bot:  Games played in this stream: Creative - 00:00, Programming - 02:30
``

<br>

####  **`(randomrank)`:**
- This will give you a random person that is in chat with there  rank name.

**Example:**
``
Caster: !addcom !poke /me Pokes (randomrank) with  a bar of soap.
User: !poke
Bot: /me Pokes Master User2 with a bar of soap.
``

<br>

####  **`(senderrank)`:**
- This will give the sender name with his rank.

**Example:**
``
Caster:  !addcom !poke /me Pokes (senderrank) with a bar of soap.
User: !poke
Bot: /me  Pokes Master User with a bar of soap.
``

<br>

#### **`(gameonly=)`:**
-  Will make that command only work when your stream game is set to it.

**Example:**
``
Caster:  !addcom !lang Currently programming in JavaScript (gameonly=Programming)
``

<br>

####  **`(readfile)`:**
- Will read that file. Note it must be in the bots `addons` folder.

**Example:**
``
Caster:  !addcom !lastfollow Last follower was (readfile ./addons/followHandler/latestFollower.txt)
User:  !lastfollow
Bot: Last follower was User
``

<br>

#### **`(echo)`:**
- Will  say anything as the bot. Note commands such as `/timeout` and `/ban` will work.

**Example:**
``
Caster:  !addcom !echo (echo)
User: !echo test test
Bot: test test
``

<br>

####  **`(followage)`:**
- Tells you how long you have been following the channel, you  can also check the time of another user.

**Example:**
``
Caster: !addcom !followage  (followage)
User: !followage
Bot: @User, user has been following channel PhantomBot  since March 29, 2016. (340 days)
``

<br>

#### **`(titleinfo)`:**
- Gives  you the current title set on Twitch with the current uptime.

**Example:**
``
Caster:  !addcom !title (pointtouser) Current title: (titleinfo).
User: !title
Bot: @User,  Current title: Fun programming! Uptime: 3 hours, 20 minutes and 35 seconds.
``

<br>

####  **`(gameinfo)`:**
- Gives you the current title set on Twitch with the current  uptime.

**Example:**
``
Caster: !addcom !game (pointtouser) Current game:  (gameinfo).
User: !game
Bot: @User, Current game: Programming Playtime: 3 hours,  20 minutes and 35 seconds.
``

<br>

#### **`(gameinfo)`:**
- Gives you the  current game set on Twitch with the current playtime.

**Example:**
``
Caster:  !addcom !game (pointtouser) Current game: (gameinfo).
User: !game
Bot: @User,  Current game: Programming Playtime: 3 hours, 20 minutes and 35 seconds.
``

<br>

####  **`(playtime)`:**
- Tells you how long you've been playing the current game set  on Twitch for.

**Example:**
``
Caster: !addcom !playtime Current playtime:  (playtime).
User: !playtime
Bot: Current playtime: 30 minutes.
``

<br>

####  **`(countdown=)`:**
- Tells you how long you've been playing the current game set  on Twitch for.

**Example:**
``
Caster: !addcom !count (countdown=December  23 2017 23:59:59 GMT+0200)
User: !count
Bot: 20 hours, 30 minutes and 55 seconds.
``

<br>

####  **`(writefile)`:**
- Will write the text to that file, note that most of the tags  will work in the text. Append can be true or false, if false it will always replace  the first line.

**Example:**
``
Caster: !addcom !settxt (writefile test.txt,  true, (echo))
``

<br>

#### **`(adminonlyedit)`:**
- Makes a command only  editable by bot admins.

**Example:**
``
Caster: !addcom !playtime Current  playtime: (playtime). (adminonlyedit)
``

<br>

#### **`(playsound)`:**
-  Will play that sound name with that command.

**Example:**
``
Caster: !addcom  !good Played sound goodgood (playsound goodgood)
``

<br>

#### **`(channelname)`:**
-  Gives you the current channel name.

<br>

## Custom API and Custom API JSON:
To  allow for a great deal of flexibility with PhantomBot, we are happy to provide new  tags for custom commands.

### Custom API:

`!addcom` tag: **(customapi URL)**
*URL*  may contain *$1...$9* to pass parameters from chat as input to the URL.
The **customapi**  tag will pull a given URL and display the information exactly as it is provided  by the web service. This is useful for web services that return plain text. Do not  use this to return data from a web page, as that will simply spam the chat. Note  that the **URL** may be passed parameters from chat, for example, say a web service  requires a text field to return data, such as a name of a person:

`!addcom joke  (customapi http://not.real.com/joke.php?name=$1)`
This would send a request and  pass *name* with a value given as the first parameter to *!joke* in chat. Note that  if a *$1...$9* parameter is given, the bot will require parameters before executing  the command.

### Custom API JSON:

`!addcom` tag: **(customapijson URL key  | object.key | object.object...key | {literal string} ...)**
*URL* may contain  *$1...$9* to pass parameters from chat as input to the URL.
*key* is a key to data  on the first node of the returned JSON
*object.key* provides a JSON object to select  a key from.
*object.object...key* indicates that many objects may be traversed  to get at a given key.
*{literal string}* is text to place between queried values.

The  **customapijson** tag will pull a given URL and expects to receive a JSON object  from the web service. An understanding of JSON objects is highly recommended in  order to know what to use as the mapping guide. Note that the JSON parser will not  attempt to traverse arrays and find specific elements, this will only select objects  and a key. The key must relate to an integer or string value. The following is an  example:
!addcom yomomma (customapijson http://api.yomomma.info/ joke)`

The  above will create a new command that queries the given API and returns the value  associated with the <em>joke</em> key.

#### Another example:
(customapijson  http://api.apixu.com/v1/current.json?key=NOT_PROVIDED&q=$1 {Weather for} location.name  {:} current.condition.text {Temps:} current.temp_f {F} current.temp_c {C})`

The  above will create a new command that queries the given API and requires a parameter  to be given in to the command. In this instance, a weather API is queried and the  return string will be:
**Weather for city name**: *(current weather)*
**Temps**:  *Temp in F, Temp in C*

#### To step through a bit further:
*location.name* parses  the top level <em>location</em> object and then returns the value associated with  the *name* key.
*current.condition.text* parses the top level *current* object  and then moves to the *condition* object to return the value associated with the  *text* key.
*current.temp_f and current_temp_c* parse the top level *current* object  and return the value associated with the given keys, *temp_f* and *temp_c*.
*{Weather  for}, {:}, {Temps:}, {F} and {C}* are literal strings that are printed out.

Please  note again, that this is a simple implementation for parsing JSON data. If a more  complex JSON is to be parsed or data is to be correlated in some way, then a custom  script or Java module would need to be developed.
