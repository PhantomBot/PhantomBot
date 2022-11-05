# Discord Integration Setup

### Creating a Discord Bot Account

**If you have a Discord bot account already, you can skip this step**

1. Use the following link https://discord.com/developers/applications
2. Click *New Application*, set name and click *Create*
3. Go to *Bot*, click Add Bot - *Yes, do it!*
4. Turn 2 toggles on *Privileged Gateway Intents*

### Getting and Setup Bot token

1. Stop the bot
2. In the *TOKEN* under the nickname, click *Copy* and paste code to safe location.
3. Open file `BotName\config\botlogin.txt`
4. Create a line `discord_token=TOKEN` (replace *TOKEN* with what you saved in the first paragraph)
5. Save file and start the bot

The Discord button will appear in the control panel on the left tab.

### Invite Bot to Discord Server

1. Go to your *Discord Application* -> *OAuth2*
2. In *OAuth2 URL Generator* check the box on *Bot*
3. In the panel that appears, check the *Administrator* checkbox
4. Follow the generated link and invite the bot to desired server (administrator rights are required on the server)

**Your bot should be located on only one Discord server**
