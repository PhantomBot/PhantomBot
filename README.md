
# <img alt="PhantomBot" src="https://phantombot.dev/common/images/brand.png" width="600px"/>

![Java CI](https://github.com/PhantomBot/PhantomBot/workflows/Java%20CI/badge.svg)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/e78b35af8f2442d7a8c5040c41164739)](https://www.codacy.com/gh/PhantomBot/PhantomBot/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=PhantomBot/PhantomBot&amp;utm_campaign=Badge_Grade)
[![GitHub license](https://img.shields.io/github/license/PhantomBot/PhantomBot)](https://github.com/PhantomBot/PhantomBot/blob/master/LICENSE)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/PhantomBot/PhantomBot?sort=semver)](https://github.com/PhantomBot/PhantomBot/releases/latest)
[<img src="https://discordapp.com/api/guilds/107910097937682432/widget.png?style=shield">](https://discord.gg/YKvMd78)

[**PhantomBot**](https://phantombot.dev) is a Twitch chat bot powered by Java. PhantomBot has many modern features out of the box such as a built-in webpanel, enhanced moderation, games, a point system, raffles, custom commands, a music player, and more. PhantomBot can also be integrated with many services such as [Discord](https://discordapp.com/), [TipeeeStream](https://tipeeestream.com), [StreamLabs](https://streamlabs.com) and [StreamElements](https://streamelements.com)!

Additional functionality is enabled through the use of third-party modules.

* [Get PhantomBot](https://phantombot.dev "PhantomBot Guides and OAuth")
* [Security Policy](https://github.com/PhantomBot/PhantomBot/blob/master/SECURITY.md)

## How can I follow along/contribute?

* Feel free to check out our [Version History](https://github.com/PhantomBot/PhantomBot/releases).
* If you are a developer, feel free to check out the source and submit pull requests. We provide a [guide](https://github.com/PhantomBot/PhantomBot/blob/master/development-resources/DEVSETUP.md) to setup your development environment.
* Please don't forget to **watch**, and **star our repo**!
* A huge thanks goes out to the people who have [already contributed to the project](https://github.com/PhantomBot/PhantomBot/graphs/contributors).

## Requirements

PhantomBot requires the following software to be installed:

ARM (Raspberry Pi) or x86 (32-bit) architectures
* [Adoptium Temurin 11](https://adoptium.net/) or [OpenJDK 11](https://openjdk.java.net/)

x86_64 (64-bit) architectures
* No pre-requisites

## Installation
Please refer to platform-specific installation documentation.
* [Windows](https://phantombot.dev/guides/#guide=content/setupbot/windows)
* Linux:
  * [Ubuntu 16.04](https://phantombot.dev/guides/#guide=content/setupbot/ubuntu)
  * [CentOS 7](https://phantombot.dev/guides/#guide=content/setupbot/centos)
* [macOS](https://phantombot.dev/guides/#guide=content/setupbot/macos)

### Docker
PhantomBot publishes official builds to Docker Hub and GitHub Container Registry
* [DockerHub](https://hub.docker.com/r/gmt2001/phantombot-stable)
* [GHCR](https://github.com/PhantomBot/PhantomBot/pkgs/container/phantombot)
* [Docker Compose File](https://github.com/PhantomBot/PhantomBot/blob/master/docker-compose.yml)

## Upgrading PhantomBot

Detailed upgrade instructions are listed on our [documentation](https://phantombot.dev/guides/#guide=content/setupbot/updatebot).

## License

PhantomBot is licensed under the [**GNU General Public License v3 (GPL-3)**](https://www.gnu.org/copyleft/gpl.html).

## Rollbar Exception Reporting
:information_source: ***Notice:*** We use [Rollbar](https://rollbar.com) to automatically report exceptions to the dev team.

OAuth tokens, Client IDs, and API Secrets are **NOT** sent. All information is kept private.

Data is only sent when an exception occurs. Some very common exceptions are not sent, such as the ones that occur when a connection times out.

Exceptions are sent through a server owned by @gmt2001 for additional filtering before continuing on to Rollbar. No data is saved on this server beyond normal logs used for DDOS mitigation. These logs may include IP addresses and are deleted after 5 weeks. IP addresses are **NOT** sent on to Rollbar.

The following values are sent from _botlogin.txt_:
- _allownonascii_ - Indicates if other config values in _botlogin.txt_ are allowed to use non-US-ASCII characters
- _baseport_ - Indicates the port that the built-in webserver listens on
- _channel_ - Indicates the Broadcaster's channel, where the bot interacts with Twitch viewers
- _datastore_ - Indicates which database backend is used, but **NOT** the IP/login details for the database
- _debugon_ - Indicates whether debug messages are printed to the console and logged
- _debuglog_ - Overrides the above to only log, but not print to console
- _helixdebug_ - Enables additional debug logging of Twitch Helix API requests and responses (Not including OAuth tokens)
- _ircdebug_ - Enables additional debug logging of incoming messages from Twitch Message Interface (TMI/IRC)
- _logtimezone_ - Indicates the timezone used by the bot
- _musicenable_ - Indicates whether the YouTube player has been enabled at the _botlogin.txt_ level
- _owner_ - Indicates the bot owner (used for giving a non-broadcaster bot owner admin privileges)
- _proxybypasshttps_ - Overrides the SSL checks in the bot to pretend SSL is enabled, for use with a reverse proxy
- _reactordebug_ - Enables very verbose debug output to console from the Netty backend (Helix and Discord API)
- _reloadscripts_ - Indicates whether the bot is allowed to reload most JavaScript files when they are changed without a restart
- _rhinodebugger_ - Enables verbose debug output when JavaScript exceptions occur
- _rollbarid_ - A [GUIDv4](https://en.wikipedia.org/wiki/GUID#Version_4_(random)) which uniquely identifies the current PhantomBot installation, used for identifying when multiple exceptions are coming from the same bot
- _usehttps_ - Indicates whether SSL is enabled on the bots built-in webserver
- _user_ - The bots Twitch username
- _userollbar_ - Indicates if Rollbar exception reporting is enabled
- _webenable_ - Indicates if the bots built-in webserver is enabled
- _wsdebug_ - Enables debug output of WebSocket messages from the panel

For all other values in _botlogin.txt_, only an indicator of whether the value exists will be sent, but not the actual value itself.

The other data sent includes:
- _java.home_ - Indicates where Java is installed
- _java.specification.name_ - Indicates the specification of the Java Runtime Environment the Java installation adheres to
- _java.specification.vendor_ - Indicates the vendor of the above specification
- _java.specification.version_ - Indicates the version of the above specification
- _java.vendor_ - Indicates the vendor of the actual Java installation
- _java.version_ - Indicates the actual version of the Java installation
- _os.arch_ - Indicates 32-bit or 64-bit operating system
- _os.name_ - Indicates the name of the operating system
- _os.version_ - Indicates the version of the operating system
- The current state of _debugon_, even if set from the console
- The current state of _debuglog_, even if set from the console
- A boolean indicator of whether the OAuth is logged in as the Bot (but not the actual OAuth token)
- A boolean indicator of whether the API OAuth is logged in as the Broadcaster (but not the actual OAuth token)
- The full stack trace of the exception
- On some exceptions, the actual input variables if they don't contain any passwords or secret values

To opt out of Rollbar exception reporting, add the following line to the _botlogin.txt_:
```
userollbar=false
```

Docker users can opt out using the above method, or by adding the following environment variable to the container:
```
PHANTOMBOT_USEROLLBAR=false
```

for docker-compose.yml
```
PHANTOMBOT_USEROLLBAR: "false"
```

You must restart the bot after putting the opt-out for the change to take effect. Editing a Docker container or docker-compose may require more steps to apply the changes, consult your manual.

If you believe your data has already been sent and want to issue a GDPR delete request, please opt out as above and then send your bot name, broadcaster name, and  the _rollbarid_ from _botlogin.txt_ to: **gdpr** /A\T/ phantombot // hopto \\ org

We also accept requests for copies of your data. GDPR requests are accepted from all users, even those who do not live in a locale that has such laws.

Please note that the IP addresses in the DDOS logs can not be retrieved or deleted manually, but will be automatically deleted after 5 weeks by log rotation.
