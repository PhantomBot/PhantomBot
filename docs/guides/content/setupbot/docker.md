# Docker Setup

&nbsp;

<!-- toc -->

<!-- tocstop -->

&nbsp;

## New Installation

The fastest way to get online with Docker is using Compose

### Instructions

1. Download the latest compose file https://raw.githubusercontent.com/PhantomBot/PhantomBot/master/docker-compose.yml
2. (Optional) Make needed edits to the file, see the comments in the file for details
    * If hosting multiple bot instances
      * Consider creating multiple copies of the `phantombot` service section for each instance
        * Consider changing the `container_name` on each instance to identify it
        * Change the left side of the `volumes` section to a unique name for each instance
          * Remember to also create the equivilent volume in the global `volumes` section at the bottom of the file
      * Consider changing the `published` port for each instance
    * If you wish to run the `nightly` build, change the `image` to the nightly image
    * If you are enabling _ouroboros_, set configuration options
      * Consider scheduling updates to occur around a specific time via the `CRON` setting, instead of potentially going off during a stream with the default `INTERVAL`
      * Consider enabling `MONITOR_ONLY` mode if you would rather be notified of updates, but manually apply them yourself
      * Set some `NOTIFIERS` to alert you when an update is available (`MONITOR_ONLY` mode) or has been installed (default mode)
      * Set the `TZ` so that `CRON` and `NOTIFIERS` operate in your preferred timezone
3. Start the bot
    * _NOTE: These commands must be run from the folder containing the `docker-compose.yml` file_
    * To launch the bot only: `docker compose up --pull always -d`
    * To launch the bot and enable _ouroboros_ for automatic updates: `docker compose up --pull always --profile ouroboros -d`
4. Perform first-run setup
    * You can access the bot to perform setup and use the panel by going to `http://ip_or_domain:25000`
      * List all running PhantomBot containers with `docker ps --filter ancestor=ghcr.io/phantombot/phantombot`
      * Read the logs from a container, filtering to the initial panel login
        * Linux: `docker logs CONTAINERID | grep -i panel`
        * Windows (PowerShell): `docker logs CONTAINERID | Select-String panel`
    * Remember to perform setup on the bot after bringing up the container for the first time
      * On the _Bot Setup_ page
        * Fill in the `channel` field in the `Admin` section with the Twitch channel to join
        * (Optional) Change the panel username/password in the `Panel Login` section
        * (Optional) Change other settings
        * Remember to click `Save` at the top
      * On the _OAuth_ page
        * Follow the instructions to create a new Twitch Developer App (if needed)
        * Fill in and save the `Client ID` and `Client Secret`
        * Perform the `Broadcaster OAuth` to enable the API
          * Can be done using a moderator account, but many features will be restricted by Twitch, such as Channel Points and Predictions
          * Ideally should be done using the actual Broadcaster account, to enable all features
          * Yes we know Moderators can do some of these things directly on Twitch. Twitch has imposed this restriction because the broadcaster should be in control of when certain features are performed via automation
        * Perform the `Bot OAuth` using the bot account that you want to appear in chat
      * If you have changed anything on the _Bot Setup_ page except for the items in the `Admin` or `Panel Login` sections, you should restart the bot
        * Login to the panel
        * Click the <i class="fa fa-gears"></i> icon in the top-right corner
        * On the `Restart` tool in the <i class="fa fa-wrench"></i> tab, click `Execute`
        * The bot should restart, this normally takes about 30-60 seconds

### Example Multi-Bot Compose File With Ouroboros

This example shows a `docker-compose.yml` file configured to handle 2 bots with _ouroboros_ providing automatic updates

* A bot for _coolperson_ named _coolpersonbot_
* A bot for _awesomeperson_ named _awesomepersonbot_
* Ouroboros configured with a `CRON` schedule to perform updates at 4 AM in the `America/New_York` timezone each day, and send a notification to Discord when an update is installed

The example demonstrates
* Renaming the service section
* Renaming the container so it is easily identifiable in other Docker commands
* Setting each container to a separate `published` port for panel access
* Updating the left side of the `volumes` section to keep data separated for each bot
* Updating the global `volumes` section to define the same volumes as the services
* Setting a `CRON` expression which sets _ouroboros_ to only perform updates at 4 AM each day
* Setting the `NOTIFIERS` so _ouroboros_ posts to a Discord webhook when an update is installed
* Setting the `TZ` so that _ouroboros_ runs the `CRON` relative to the `America/New_York` timezone, and also uses that timezone when posting the update notification to the `NOTIFIERS`

This example configuration can be deployed by running `docker compose up --pull always --profile ouroboros -d`
* _coolperson_ can access their bot to perform setup and use the panel by going to `http://ip_or_domain:25000`
* _awesomeperson_ can access their bot to perform setup and use the panel by going to `http://ip_or_domain:25001`
* The administrator will have to provide the initial panel username/password by reading the docker logs
  * List all running PhantomBot containers with `docker ps --filter ancestor=ghcr.io/phantombot/phantombot`
  * Read the logs from a container, filtering to the panel login
    * Linux: `docker logs CONTAINERID | grep -i panel`
    * Windows (PowerShell): `docker logs CONTAINERID | Select-String panel`
* Remember to perform setup on the bots after bringing up the container for the first time
  * On the _Bot Setup_ page
    * Fill in the `channel` field in the `Admin` section with the Twitch channel to join
    * (Optional) Change the panel username/password in the `Panel Login` section
    * (Optional) Change other settings
    * Remember to click `Save` at the top
  * On the _OAuth_ page
    * Follow the instructions to create a new Twitch Developer App (if needed)
    * Fill in and save the `Client ID` and `Client Secret`
    * Perform the `Broadcaster OAuth` to enable the API
      * Can be done using a moderator account, but many features will be restricted by Twitch, such as Channel Points and Predictions
      * Ideally should be done using the actual Broadcaster account, to enable all features
      * Yes we know Moderators can do some of these things directly on Twitch. Twitch has imposed this restriction because the broadcaster should be in control of when certain features are performed via automation
    * Perform the `Bot OAuth` using the bot account that you want to appear in chat
  * If you have changed anything on the _Bot Setup_ page except for the items in the `Admin` or `Panel Login` sections, you should restart the bot
    * Login to the panel
    * Click the <i class="fa fa-gears"></i> icon in the top-right corner
    * On the `Restart` tool in the <i class="fa fa-wrench"></i> tab, click `Execute`
    * The bot should restart, this normally takes about 30-60 seconds

#### Example docker-compose.yml

```
services:
  # First bot
  phantombot_coolperson:
    # Name to easily identify this container in Docker commands
    container_name: coolpersonbot
    image: ghcr.io/phantombot/phantombot
    ports:
      - target: 25000
        # First bot gets port 25000 for panel access
        published: 25000
        protocol: tcp
    restart: unless-stopped
    volumes:
        #          v  Updated the volume name to keep this data separate from the others
      - PhantomBot_coolpersonbot_data:/opt/PhantomBot_data
    environment:
  # Second bot
  phantombot_awesomeperson:
    # Name to easily identify this container in Docker commands
    container_name: awesomepersonbot
    image: ghcr.io/phantombot/phantombot
    ports:
      - target: 25000
        # Second bot gets port 25001 for panel access
        # Note that we DON'T change the `target` above
        published: 25001
        protocol: tcp
    restart: unless-stopped
    volumes:
        #          v  Updated the volume name to keep this data separate from the others
      - PhantomBot_awesomepersonbot_data:/opt/PhantomBot_data
    environment:
  ouroboros:
    container_name: ouroboros
    hostname: ouroboros
    image: ghcr.io/gmt2001/ouroboros
    profiles: ["ouroboros"]
    environment:
      - CLEANUP=true
        # Update at 0400 every day"
      - CRON="0 4 * * *"
      - LANGUAGE=en
      - LOG_LEVEL=info
        # Send notifications to Discord
      - NOTIFIERS="discord://my-webhook-id/secret-token"
      - SELF_UPDATE=true
        # Timezone for `CRON` and `NOTIFIERS`
      - TZ=America/New_York
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /app/pyouroboros/hooks:/app/pyouroboros/hooks

volumes:
  #          v  Updated the volume name to keep coolpersonbot data separate from the others
  PhantomBot_coolpersonbot_data:
  # v   Added the volume for the second bot
  #          v  Updated the volume name to keep awesomepersonbot data separate from the others
  PhantomBot_awesomepersonbot_data:

```

## Updates

_NOTE: A Docker update necessarily involves an automatic deletion and re-creation of the container. This will reset variables on the bot. Some systems, such as raffleSystem, will save their state, but others may not_

If you enabled _ouroboros_, or have _ouroboros_ already running separately, updates will occur automatically, unless you have set it to some mode which prevents it from doing so, such as `MONITOR_ONLY` mode

After some updates, there may be an update to the OAuth scopes, which requires manually re-authorizaing the OAuth. A notification will appear when logging into the panel when this occurs. Simply re-authorize the indicated account type to enable these features

To manually pull an update:
  * _NOTE: These commands must be run from the folder containing the `docker-compose.yml` file_
  * Update and launch the bot only: `docker compose up --pull always -d`
  * Update and launch the bot and enable _ouroboros_ for automatic updates: `docker compose up --pull always --profile ouroboros -d`