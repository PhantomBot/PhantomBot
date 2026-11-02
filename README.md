
# <img alt="PhantomBot" src="https://phantombot.dev/common/images/brand.png" width="600px"/>

![Java CI](https://github.com/PhantomBot/PhantomBot/workflows/Java%20CI/badge.svg)
[![GitHub license](https://img.shields.io/github/license/PhantomBot/PhantomBot)](https://github.com/PhantomBot/PhantomBot/blob/master/LICENSE)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/PhantomBot/PhantomBot?sort=semver)](https://github.com/PhantomBot/PhantomBot/releases/latest)
[<img src="https://discordapp.com/api/guilds/107910097937682432/widget.png?style=shield">](https://discord.gg/YKvMd78)

[**PhantomBot**](https://phantombot.dev) is a Twitch chat bot powered by Java. PhantomBot has many modern features out of the box such as a built-in webpanel, enhanced moderation, games, a point system, raffles, custom commands, a music player, and more. PhantomBot can also be integrated with many services such as [Discord](https://discordapp.com/), [TipeeeStream](https://tipeeestream.com), [StreamLabs](https://streamlabs.com) and [StreamElements](https://streamelements.com)!

Additional functionality is enabled through the use of third-party modules.

* [Get PhantomBot](https://phantombot.dev "PhantomBot Guides and OAuth")
* [Security Policy](https://github.com/PhantomBot/PhantomBot/blob/master/SECURITY.md)

## System Requirements

- Microsoft Windows
  - Windows 10 or 11; Windows Server 2019, 2022, or 2025 (64-bit, x64)
    - No additional requirements
  - Windows 10; Windows Server 2019 or 2022 (32-bit, x86)
    - [Eclipse Temurin 17 JRE](https://adoptium.net/temurin/releases?version=17&os=windows&arch=x32&mode=filter)
- macOS
  - macOS 12 (Monterey) or later (Intel or Apple silicon, 64-bit, x64)
    - No additional requirements
- Linux
  - Any GCC-based Linux (Ubuntu, Debian, CentOS, etc)
    - Intel/AMD (64-bit, x64)
      - glibc 2.12 or later
    - ARM 64-bit (Raspberry Pi 4/5 with 64-bit enabled, etc)
      - glibc 2.17 or later
    - ARM 32-bit HF (Raspberry Pi 3, etc)
      - glibc 2.23 or later
  - Any musl-based Linux (Alpine, etc) equivilent to Alpine 3.5 or later (64-bit, x64)
    - [Eclipse Temurin 17 JRE](https://adoptium.net/temurin/releases?version=17&os=alpine-linux&arch=x64&mode=filter)
- Other OSes and Processors
  - Check support for JDK 17 at [Eclipse Temurin Supported Platforms](https://adoptium.net/supported-platforms)
  

## Installation
### Quick Start
- Download the [Latest Release](https://github.com/PhantomBot/PhantomBot/releases/latest) for your platform
  - Please note that macOS on Apple Silicon should use the **arm64-apple_silicon** package
- Extract the release to the installation location of your choice
- Linux / macOS: Apply execute permissions to the launchers
  - Execute `chmod +x launch.sh` in a terminal
  - If you plan to setup the bot as a background service later, execute `chmod +x launch-service.sh` in a terminal
- Launch the launcher script
  - Windows: Double-click, or execute from a terminal, `launch.bat` or `launch.ps1`
  - Linux / macOS: Execute `./launch.sh` in a terminal
- Open the bots web panel
  - Default URL when accessing locally is: http://localhost:25000
  - If accessing remotely, configure your firewall/port forwarding as needed to allow access to port 25000
  - It is normal for the browser to give a security warning, as we use self-signed SSL certificates by default
- Click **Bot Setup and OAuth**
- When the login page appears, look in your terminal window for the auto-generated username and password
- Fill in the name of the Twitch channel to join
  - Optionally, also expand the **Panel Login** section and set a new username and password for the admin user
- Click the floating **Save Configuration** button near the bottom-left to save the changes
- Click the **OAuth Setup** link at the top of the page
- Follow instructions to setup OAuth
  - Remember to perform both the **Bot OAuth** (Set user that the bot will post as) and the **Broadcaster OAuth** (Authorization for using the Twitch API)
- Enjoy!
  - More documentation can be found in our [guides](https://phantombot.dev/guides/)
  - Support is available through our [Discord](https://discord.gg/YKvMd78)
    - Please, no private DMs or @mentions (pings)

### Closing / Shutting Down the Bot
To reduce risk of database corruption, please only close / shutdown the bot using the following methods
- If running in a terminal from `launch.bat`, `launch.ps1`, or `launch.sh`
  - Type `exit` and then hit _enter_
  - Press _CTRL+C_
- If running as a background service with `launch-service.sh`
  - Send the **SIGTERM** signal with `kill PID`
- After starting the shutdown process, please wait for the `Bot is Exiting` message to appear

### Installation Guides
More documentation for installation and setup is available in our guides
* [Windows](https://phantombot.dev/guides/#guide=content/setupbot/windows)
* Linux:
  * [Ubuntu](https://phantombot.dev/guides/#guide=content/setupbot/ubuntu)
  * [CentOS](https://phantombot.dev/guides/#guide=content/setupbot/centos)
* [macOS](https://phantombot.dev/guides/#guide=content/setupbot/macos)

### Docker
PhantomBot publishes official builds to Docker Hub and GitHub Container Registry
* [DockerHub](https://hub.docker.com/r/gmt2001/phantombot-stable)
* [GHCR](https://github.com/PhantomBot/PhantomBot/pkgs/container/phantombot)
* [Docker Compose File](https://github.com/PhantomBot/PhantomBot/blob/master/docker-compose.yml)

## Upgrading PhantomBot

Detailed upgrade instructions are listed on our [documentation](https://phantombot.dev/guides/#guide=content/setupbot/updatebot).

## How can I follow along/contribute?

* Feel free to check out our [Version History](https://github.com/PhantomBot/PhantomBot/releases).
* If you are a developer, feel free to check out the source and submit pull requests. We provide a [guide](https://github.com/PhantomBot/PhantomBot/blob/master/development-resources/DEVSETUP.md) to setup your development environment.
* Please don't forget to **watch**, and **star our repo**!
* A huge thanks goes out to the people who have [already contributed to the project](https://github.com/PhantomBot/PhantomBot/graphs/contributors).

## License

PhantomBot is licensed under the [**GNU General Public License v3 (GPL-3)**](https://www.gnu.org/copyleft/gpl.html).
