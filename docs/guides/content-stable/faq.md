# FAQ

## What is PhantomBot?
PhantomBot is an actively developed open source interactive Twitch bot with a vibrant community that provides 
entertainment and moderation for your channel, allowing you to focus on what matters the most to you - your game and 
your viewers. PhantomBot is a bot powered by Java. PhantomBot has many modern features out of the box such as a built-in 
webpanel, enhanced moderation, games, a point system, raffles, custom commands, a music player, and more! PhantomBot 
can also be integrated with many services such as [GameWisp](https://gamewisp.com/), 
[StreamTip](https://streamtip.com/) and [TwitchAlerts](https://twitchalerts.com/)!

## What do I need to run PhantomBot?
As of right now, PhantomBot requires Java 11 to run. This is included with the bot for Windows, Linux amd64, and macOS.


## What do I need to run the Control Panel?
The Control Panel has been tested on Chrome, Firefox, Internet Explorer and Edge. There is no additional software required to use the Control Panel.


## Where do I get my APIOauth key?
During setup, you will be provided with links to authorise the bot for both your Twitch account, so that it can act as 
a channel editor, and for the bot account. If you need to change the oath tokens for any reason they can be found in 
your botlogin.txt file in your PhantomBot folder. The `apioauth=` line is for the oath token for you, the broadcaster, 
and the `oath=` line is for the bot channel. To update either token simple generate a new token 
[here](https://phantombot.github.io/PhantomBot/oauth/), paste in into the relevant line after the `=` then restart the bot.


## I Get an Illegal Option Error? (OSX)
**Issue:**
When attempting to run the launcher script launch.sh on OS X you get the following error:
readlink: illegal option -- f (and so on)

**Fix:**
Ensure that launch.osx.sh is executible (chmod +x ./launch.osx.sh) and execute that script to start the bot.


## I Can’t Connect to Twitch IRC (Failed To Connect Spam)
**Issue:**
You start up the bot and all you get is the following spammed endlessly (Other stuff may eventually appear in between):

Failed to connect to 'irc.chat.twitch.tv', retrying connection.
Connecting to irc.chat.twitch.tv:6667
**Fix 1:**
Reset the DNS Resolver Cache (ie. An old IP for Twitch IRC is being used, for Windows)
1. Open the command prompt.
2. Type in the following command, followed by enter.
ipconfig /flushdns


## The Bot Posts Responses Multiple Times
**Issue:**
You issue a command to the bot and it responds multiple times, for example:

Broadcaster: !points

Bot: You have 2 points!

Bot: You have 2 points!

Bot: You have 2 points!

**Fix 1:**
Shut down the extra instances of the bot using chat override, this issue is caused by extra instances of the bot running. The easiest way to fix this is to issue the following command in Twitch chat from the user who was selected as the owner during the initial setup (You can check this in botlogin.txt).
!d !exit

This will cause all copies of the bot to shut down. Once this is complete, you can start the bot again, being careful to only launch it once.

It is important to issue this directly from Twitch chat or another IRC client, but NOT from any of the bot consoles.

Using this fix, the bots will save changes, although if they are out of sync only the last bots settings will prevail.

**Fix 2:**
Shut down the extra instances of the bot via Force Quit. This action will destructively shut down the bot (ie. the bot will Force Quit without saving).
**NOTE: ** This process will also kill any other java-based programs running, as it does not provide a way to distinguish between processes.

Windows: Launch the Task Manager via Right-Click on the task bar or press CTRL+ALT+DEL
2. Switch to the Processes tab.
3. For each instance of java.exe, select it and then click End Process, confirming the action in the popup window.

Linux:
If you are using a GUI-based system, open up a command line/terminal window.
1. Issue the command sudo killall -9 java.
2. Enter your root/administrator password when prompted.


## Bot Will Not Respond in Chat:
**Issue:**
When you issue a command to the bot, you see the response in the console, but it never posts the response to chat.

**Fix:**
Ensure that you have made the bot a moderator in chat by typing the following below.
/mod MyBotName
