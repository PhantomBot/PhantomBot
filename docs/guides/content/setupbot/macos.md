# macOS Setup Guide

You will need a Twitch account for your bot. [Create one here](https://www.twitch.tv/signup). We do not recommend using your streaming account.

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

7. The bot will walk you through first time setup.

### Launch PhantomBot faster

- go to Documents/PhantomBot -> right-click launch.sh -> “Open With” -> “Other…” -> search for Terminal and select it -> check “Always Open With” -> hit “Open” (Note: Enable All Applications might have to be selected rather than Enable Recommended Applications)
- next time you wanna launch it: go to Documents/PhantomBot -> right-click launch.sh -> “Open” -> click “Open”
- next time you wanna launch it: go to Documents/PhantomBot -> just double-click launch.sh
