# How To Update PhantomBot

This is a walkthrough on how to update to the latest and greatest PhantomBot release, without losing any of your data.

## Before anything

Please be sure to **always** keep a copy of your PhantomBot installation folder for backups in case something goes wrong.

### Windows / MacOS

- You’re going to need the latest version of PhantomBot from [here](https://github.com/PhantomBot/PhantomBot/releases/latest/).

- Once you have the latest release downloaded you need to extract PhantomBot.
  - Windows: Right click the zip file, select **extract all**.
  - MacOS: Double click the zip file.

- Find your current PhantomBot installation, the one you’re updating from.
  - For standard installations:
    - **Copy over your config folder. Do not just copy individual files, all files are important and required.**
    - If you do not have a config folder, this means that you’re upgrading from an older version than v2.3.9, which then you need to copy over your `botlogin.txt`, `phantombot.db`, and `phantombot.db-journal` to the bot’s config folder.
    - **Copy over your custom language folder from the old bot folder. (bot-folder/scripts/lang/custom)**
  - If you have custom scripts:
    - Copy only your modified/custom files over to the new PhantomBot folder.
- MacOS: Change the permissions of *launch.sh* and *java-runtime-macos/bin/java* to allow execution. If you are in Terminal and cd into the *PhantomBot* folder, the command is `sudo chmod u+x launch.sh && sudo chmod u+x java-runtime-macos/bin/java`
- Launch your new PhantomBot. **Keep your old PhantomBot folder as a backup for the future.**

### Linux
#### 1. Stop your PhantomBot:

First switch to your botuser:

`sudo su - botuser`

Then run this:

`kill $(pgrep -f PhantomBot)`

or if you have it, use:

`sudo systemctl stop phantombot`

Wait 20 seconds and check if your PhantomBot is not running:

`ps -ef | grep PhantomBot`

#### 2. Update PhantomBot:

Switch to the home directory:

`cd ~`

Rename the old folder:

`mv phantombot phantombot-old`

If you receive an error that the `phantombot-old` directory already contains a file, then either remove the `phantombot-old` directory or rename it:

To remove it: `rm -Rf phantombot-old`
To rename it: `mv phantombot-old new_directory_name_of_your_choosing`

Get the latest PhantomBot release:

`wget https://github.com/PhantomBot/PhantomBot/releases/download/vX.X.X/PhantomBot-X.X.X.zip`

Replace the X with the current release version. For example, if the latest version ([found here, on Github](https://github.com/PhantomBot/PhantomBot/releases)) is 3.5.1, change the `/vX.X.X/PhantomBot-X.X.X.zip` to `/v3.5.1/PhantomBot-3.5.1.zip`.

After the download has finished, we have to unzip the files.

`unzip PhantomBot-X.X.X.zip`

To make future updates a bit easier, we have to rename the PhantomBot folder.

`mv PhantomBot-X.X.X phantombot`

Copy your `config` folder to your new folder **(VERY IMPORTANT)**:

`cp -R ./phantombot-old/config/ ./phantombot/` **(v2.3.9 or newer)**

Copy additional folders containing customizations (optional):

`cp -R ./phantombot-old/scripts/custom/ ./phantombot/scripts/` **(v2.3.9 or newer)**
`cp -R ./phantombot-old/scripts/lang/custom/ ./phantombot/scripts/lang/` **(v2.3.9 or newer)**

The last thing we need to do is to assign the right privileges to make the launch.sh, launch-service.sh, and the included java runtime files executable.

`cd phantombot`
`sudo chmod u+x launch-service.sh launch.sh ./java-runtime-linux/bin/java`

Now we are ready to launch PhantomBot again. You can run the bot with:

`./launch.sh`

or

`sudo systemctl start phantombot`
