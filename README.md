
# <img alt="PhantomBot" src="https://phantombot.github.io/PhantomBot/common/images/brand.png" width="600px"/>

![Java CI](https://github.com/PhantomBot/PhantomBot/workflows/Java%20CI/badge.svg)
[<img src="https://discordapp.com/api/guilds/107910097937682432/widget.png?style=shield">](https://discord.gg/YKvMd78)

[**PhantomBot**](https://phantombot.github.io/PhantomBot) is a Twitch chat bot powered by Java. PhantomBot has many modern features out of the box such as a built-in webpanel, enhanced moderation, games, a point system, raffles, custom commands, a music player, and more. PhantomBot can also be integrated with many services such as [Discord](https://discordapp.com/), [Twitter](https://twitter.com), [TipeeeStream](https://tipeeestream.com), [StreamLabs](https://streamlabs.com) and [StreamElements](https://streamelements.com)!

Additional functionality is enabled through the use of third-party modules.

* [Get PhantomBot](https://phantombot.github.io/PhantomBot/ "PhantomBot Guides and OAuth")

## How can I follow along/contribute?

* Feel free to check out our [Version History](https://github.com/PhantomBot/PhantomBot/releases).
* If you are a developer, feel free to check out the source and submit pull requests. We provide a [guide](https://github.com/PhantomBot/PhantomBot/blob/master/development-resources/DEVSETUP.md) to setup your development environment.
* Please don't forget to **watch**, and **star our repo**!
* A huge thanks goes out to the people who have [already contributed to the project](https://github.com/PhantomBot/PhantomBot/graphs/contributors).

## Requirements

PhantomBot requires the following software to be installed:

ARM (Raspberry Pi) or x86 (32-bit) architectures
* [OpenJDK 11](https://openjdk.java.net/)

x86_64 (64-bit) architectures
* No pre-requisites

## Installation
Please refer to platform-specific installation documentation.
* [Windows](https://phantombot.github.io/PhantomBot/guides/#guide=content/setupbot/windows)
* Linux:
  * [Ubuntu 16.04](https://phantombot.github.io/PhantomBot/guides/#guide=content/setupbot/ubuntu)
  * [CentOS 7](https://phantombot.github.io/PhantomBot/guides/#guide=content/setupbot/centos)
* [macOS](https://phantombot.github.io/PhantomBot/guides/#guide=content/setupbot/macos)

## Upgrading PhantomBot

Detailed upgrade instructions are listed on our [documentation](https://phantombot.github.io/PhantomBot/guides/#guide=content/setupbot/updatebot).

## License

PhantomBot is licensed under the [**GNU General Public License v3 (GPL-3)**](https://www.gnu.org/copyleft/gpl.html).

## Rollbar Exception Reporting
:information_source: ***Notice:*** As of Phantombot Nightly Build 49687f9 (July 4, 2021), we now use [Rollbar](rollbar.com) to automatically report exceptions to the dev team.

NOTE: This is ***not*** included in stable builds until v3.5.0

OAuth tokens, Client IDs, and API Secrets are **NOT** sent. All information is kept private.

Data is only sent when an exception occurs. Some very common, safe to ignore, exceptions are not sent, such as the ones that occur when shutting down the bot while an active panel connection exists.

Exceptions are sent through a server owned by @gmt2001 for additional filtering before continuing on to Rollbar. No data is saved on this server beyond normal logs used for DDOS mitigation.

The following values are sent from _botlogin.txt_:
- _allownonascii_ - Indicates if other config values in _botlogin.txt_ are allowed to use non-US-ASCII characters
- _baseport_ - Indicates the port that the built-in webserver listens on
- _channel_ - Indicates the Broadcaster's channel, where the bot interacts with Twitch viewers
- _datastore_ - Indicates which database backend is used
- _debugon_ - Indicates whether debug messages are printed to the console and logged
- _debuglog_ - Overrides the above to only log, but not print to console
- _helixdebug_ - Enables additional debug logging of Twitch Helix API requests and responses (Not including OAuth tokens)
- _ircdebug_ - Enables additional debug logging of incoming messages from Twitch Message Interface (TMI/IRC)
- _logtimezone_ - Indicates the timezone used by the bot
- _msglimit30_ - Indicates the self-imposed rate-limit on outgoing messages to TMI
- _musicenable_ - Indicates whether the YouTube player has been enabled at the _botlogin.txt_ level
- _owner_ - Indicates the bot owner (used for giving a non-broadcaster bot owner admin privileges)
- _proxybypasshttps_ - Overrides the SSL checks in the bot to pretend SSL is enabled, for use with a reverse proxy
- _reactordebug_ - Enables very verbose debug output to console from the Netty backend (Helix and Discord API)
- _reloadscripts_ - Indicates whether the bot is allowed to reload most JavaScript files when they are changed without a restart
- _rhinodebugger_ - Enables verbose debug output when JavaScript exceptions occur
- _rollbarid_ - A [GUIDv4](https://en.wikipedia.org/wiki/GUID#Version_4_(random)) which uniquely identifies the current PhantomBot installation, used for identifying when multiple exceptions are coming from the same bot
- _twitch\_tcp\_nodelay_ - The TCP_NODELAY flag for TMI. Makes TMI less bandwidth efficient but possibly a little faster on outbound messages
- _usehttps_ - Indicates whether SSL is enabled on the bots built-in webserver
- _user_ - The bots Twitch username
- _useeventsub_ - Indicates if EventSub is enabled
- _userollbar_ - Indicates if Rollbar exception reporting is enabled
- _webenable_ - Indicates if the bots built-in webserver is enabled
- _whisperlimit60_ - Indicates the self-imposed rate-limit on outgoing whispers to TMI
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
- A boolean indicator of whether the OAuth is logged in as the Bot
- A boolean indicator of whether the API OAuth is logged in as the Broadcaster
- The full stack trace of the exception

To opt out of Rollbar exception reporting, add the following line to the _botlogin.txt_:
```
userollbar=false
```

Docker users can opt out using the above method, or by adding the following environment variable to the container:
```
PHANTOMBOT_USEROLLBAR=false
```

If you believe your data has already been sent and want to issue a GPDR delete request, please opt out as above and then send your bot name, broadcaster name, and  the _rollbarid_ from _botlogin.txt_ to: **gpdr** /A\T/ phantombot // hopto \\ org
