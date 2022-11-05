# StreamElements Integration Setup

### Getting and Setup Bot token

1. Log into your StreamElements Account and *click* your Username on the right side (next to the sign out button) (or click [here](https://streamelements.com/dashboard/account/channels) )
2. On the right side *click* Show secrets
3. Stop the bot
4. Open file `BotName\config\botlogin.txt`
5. Create a new line `streamelementsjwt=JWT` (replace *JWT* with the JWT Token that showed up under *My Channels*)
6. Create a second new line `streamelementsid=ID` (replace *ID* with your Account ID)
7. Save file and start the bot

You can now Enable your *StreamElements Alerts* under *Alerts*.
