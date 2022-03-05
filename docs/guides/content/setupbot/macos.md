# macOS Setup Guide

1. You will need a Twitch account for your bot. [Create one here](https://www.twitch.tv/signup). We do not recommend using your streaming account.

2. Once you have the account, you will need to get a oauth token from [Twitch Apps](https://phantombot.github.io/PhantomBot/oauth/). This will allow the bot to login to your newly created Twitch account.

3. Once you connect with Twitch on that page it will give you a oauth token, make sure to copy it.

**Make sure you mod the bot in your channel or it will not talk in chat. /mod my_bot_name.**

### Detailed instructions based on OS X 10.11.4

1. Download the bot from [here](https://github.com/PhantomBot/PhantomBot/releases/latest/).

2. Open the *Finder* and go to your *Downloads* folder.

3. Move the *PhantomBot-x.x.x.zip* to your *Documents*. - Note replace `x.x.x` with the current bot version.

4. To extract the *PhantomBot-x.x.x.zip* just double-click it. - Note replace `x.x.x` with the current bot version.

5. Start the *Terminal* app and run the following commands.

`cd Documents/`

`mv PhantomBot-x.x.x PhantomBot` - Note replace `x.x.x` with the current bot version.

`cd PhantomBot/`

`chmod u+x launch-service.sh`

`chmod u+x launch.sh`

`sudo chmod u+x ./java-runtime-macos/bin/java`

6. Once that’s done, launch *PhantomBot*.

8. Follow the steps on screen. It will ask you for the bot username, use the username you created earlier.
After that it will ask you for a oauth token, paste the one you got from Twitch Apps.
After that enter the channel you wish the bot to join. (Your channel)
And now your bot should be connected to your channel! You can find a list of commands for the bot [here](https://phantombot.github.io/PhantomBot/commands/).

9. Type `exit` and hit Enter in the bot console to shut it down gracefully.

#### Automatically Refreshing OAuth

You should now setup Automatically Refreshing OAuth tokens so your chat token does not expire.

This also lets you connect the broadcaster account so the Twitch API works.

Go to your panel on the bots webserver. If you installed the bot on the same machine you are currently using, the link is usually http://localhost:25000/

If the bot is on a different computer, replace the IP/URL as neccessary.

Click on the **OAuth Setup** link and follow the instructions to authorize your tokens.

### Launch PhantomBot faster

- go to Documents/PhantomBot -> right-click launch.sh -> “Open With” -> “Other…” -> search for Terminal and select it -> check “Always Open With” -> hit “Open” (Note: Enable All Applications might have to be selected rather than Enable Recommended Applications)
- next time you wanna launch it: go to Documents/PhantomBot -> right-click launch.sh -> “Open” -> click “Open”
- next time you wanna launch it: go to Documents/PhantomBot -> just double-click launch.sh
