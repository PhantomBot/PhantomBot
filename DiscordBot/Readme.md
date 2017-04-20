# Basic DiscordBot

This is the start of Discord support for PhantomBot.

To get started you need to do a few things.

* You need to download the .net sdk so you can run the bot from [here](https://www.microsoft.com/net/core#windows). The launch process will get more user friendly later on.
* Make an offical bot account for your bot [here](https://discordapp.com/developers/applications/me). You're going to need the token to log in. ![alt text](https://camo.githubusercontent.com/1ad3b9b81a7e3ad3fa4f02ac57044f7ad31fd4a5/687474703a2f2f692e696d6775722e636f6d2f634e345965684f2e706e67)
* Once you have your token, you need to copy and paste it into the config.txt file. **Only** the token should be in the text file.



These are the steps for actually getting the bot onto your Discord Server.

#### Oauth: Start here: https://discordapp.com/developers/docs/topics/oauth2

* How to get your bot account into your server:
* Get your app's client ID from https://discordapp.com/developers/applications/me
* Replace <CLIENT ID> with your bot's client ID in this link:
* https://discordapp.com/oauth2/authorize?&client_id=<CLIENT ID>&scope=bot&permissions=0
* Select a server from the drop-down menu and click Authorize
* For more info refer to: https://discordapp.com/developers/docs/topics/oauth2#adding-bots-to-guilds

You **have** to have the "Manage Server" permission to add it to a server.

#### Commands

The prefix for commands is currently "-" or @yourbotsname

* info - Displays basic info about your bot
* join - Auto generates and outputs the link to invite your bot to servers
* leave - fairly self explanatory, it makes the bot leave


#### Launching the bot

* Navigate to the folder where the bot is located
* Right click and open a command prompt
* Run "dotnet Phantombot.dll" without the quotes in the command prompt

Your bot should display a few lines of text in the console, notably one that says "Connected."
