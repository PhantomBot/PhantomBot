# Discord Integration Setup

### Creating a Discord Bot Account

**If you already have a Discord bot account for PhantomBot with the necessary privileged gateway intents, you can skip this step**

1. Open the Discord [developer portal](https://discord.com/developers/applications)
2. Log-in with your Discord account
3. Click *New Application* in the top right corner
4. Give your Application a name, read and accept the terms of services and click *Create*
5. Go to *Bot*
6. Turn on all toggles under *Privileged Gateway Intents*
7. Be sure to save the changes

### Getting and Setup Bot token

1. Stop the PhantomBot
2. Open the Discord [developer portal](https://discord.com/developers/applications)
3. Log-in with your Discord account
4. Select your *Discord application*
5. Go to *Bot*
6. In the *TOKEN* under the nickname, click *Reset Token* and confirm with *Yes, do it!*
7. Click *Copy* and paste code to safe location.
8. Open the file `.\config\botlogin.txt` in your PhantomBots's installation folder
9. Create a new line `discord_token=TOKEN` or edit the existing one (replace *TOKEN* with what you saved in the previous step)
10. Save the file

**Starting your bot at this time will throw an expected error, since you haven't invited the bot to a Discord server yet. In this case, a restart is needed after inviting the bot to a Discord server. Only the Discord functionality of the bot will not work at this stage, no other limitations will occur when starting the bot at this stage**

### Invite Bot to Discord Server

1. Open the Discord [developer portal](https://discord.com/developers/applications)
2. Log-in with your Discord account
3. Select your *Discord Application*
4. Go to *OAuth2* -> *OAuth2 URL Generator*
5. In *OAuth2 URL Generator* check the box on *Bot*
6. In the panel that appears, check the *Administrator* checkbox
7. Open the generated link below and invite the bot to desired server (administrator rights are required on the server)
8. Start PhantomBot

The Discord button will appear in the control panel in the left tab.

**Your bot should be located on only one Discord server**
