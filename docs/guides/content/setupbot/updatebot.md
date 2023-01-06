# How To Update PhantomBot

This is a walkthrough on how to update to the latest and greatest PhantomBot release, without losing any of your data.

## Before anything

Please be sure to **always** keep a copy of your PhantomBot installation folder for backups in case something goes wrong.

### Docker

Docker updates require force-pulling the image and then re-creating the container

#### Ouroboros

If you have the ouroboros container installed, it will perform updates automatically

If ouroboros has failed to perform an update, or is set to monitor mode, the update can be performed with a similar procedure to a non-ouroboros installation

If you are using the latest _docker-compose.yml_ file provided by PhantomBot with the ouroboros profile, you can manually update with the steps below

- `cd` into the folder containing the _docker-compose.yml_ file for PhantomBot
- Run `docker compose --pull always --profile ouroboros up -d`
- Docker automatically handles all necessary steps for you

If you are using an older or manually created _docker-compose.yml_ file without the ouroboros profile, use the commands in the **Compose** section above

#### Compose

The easiest way to perform this manually is if the container was originally created with `docker-compose` or `docker compose`

- `cd` into the folder containing the _docker-compose.yml_ file for PhantomBot
- Run `docker compose --pull always up -d`
- Docker automatically handles all necessary steps for you

#### Other Docker Control Panels (Portainer, Pterydactyl, etc)

Please consult the manual for the control panel to perform these basic steps

- Force pull the latest image
- Recreate the container with the newly pulled image
  - Most control panels have a way to do this without manually deleting and creating the container again
- Ensure the exact same data storage volume is attached
  - Most control panels will do this automatically when using their feature to pull and switch to the latest image

#### Manually Created Containers

If your container was manually created you will need to follow this basic flow, modify as needed to fit your specific setup

- Force pull the latest image: `docker pull ghcr.io/phantombot/phantombot`
- Stop the existing container: `docker stop phantombot`
- Delete the existing container: `docker rm phantombot`
- Create a new container: `docker create --name phantombot --volume /path/to/PhantomBot_data:/opt/PhantomBot_data OPTIONS_HERE ghcr.io/phantombot/phantombot`
  - Replace `OPTIONS_HERE` with other relevant command line options
  - Most importantly, ensure you set `--volume`/`-v` to attach the exact same volume that the old container was using for data storage
- Start the new container: `docker start phantombot`


### Windows / macOS

- You’re going to need the latest version of PhantomBot from [here](https://github.com/PhantomBot/PhantomBot/releases/latest/).

- Once you have the latest release downloaded you need to extract PhantomBot.
  - Windows: Right click the zip file, select **extract all**.
  - MacOS: Double click the zip file.

- Find your current PhantomBot installation, the one you’re updating from.
  - Copy the `config` folder to the new installation
  - If you have edited the lang files, such as through the *Localization* page on the panel, copy the contents of the `scripts/lang/custom` folder to the new installation
  - If you have written custom scripts, copy them to the new installation
    - The recommended folder for custom scripts is `scripts/custom` for Twitch and `scripts/discord/custom` for Discord
  - (Optional) Copy the `dbbackup` folder to the new installation. This contains recent backups of the database
  - (Optional) Copy the `logs` folder to the new installation. This contains recent log files
  - Select **Always** or **Yes** for all overwrite prompts
- For macOS, change the permissions of *launch.sh* and *java-runtime-macos/bin/java* to allow execution
  - If you are in Terminal, `cd` into the *PhantomBot* folder and run `sudo chmod u+x launch.sh && sudo chmod u+x java-runtime-macos/bin/java`
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

`cp -R ./phantombot-old/config/ ./phantombot/`

Copy additional folders containing customizations:

- Twitch Scripts: `cp -R ./phantombot-old/scripts/custom ./phantombot/scripts/`
- Discord Scripts: `cp -R ./phantombot-old/scripts/discord/custom ./phantombot/scripts/discord/`
- Lang Customization: `cp -R ./phantombot-old/scripts/lang/custom ./phantombot/scripts/lang/`

(Optional) Copy additional folders containing old db backups and log files:

- DB Backups: `cp -R ./phantombot-old/dbbackup ./phantombot/`
- Logs: `cp -R ./phantombot-old/logs ./phantombot/`


The last thing we need to do is to assign the right privileges to make the launch.sh, launch-service.sh, and the included java runtime files executable.

`cd phantombot`
`sudo chmod u+x launch-service.sh launch.sh ./java-runtime-linux/bin/java`

Now we are ready to launch PhantomBot again. You can run the bot with:

`./launch.sh`

or

`sudo systemctl start phantombot`
