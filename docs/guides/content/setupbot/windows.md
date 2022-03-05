# Windows Setup Guide

### Pre-requisites

PhantomBot requires:

- Windows 7 or higher OR Windows Server 2012 or higher (64-bit only)
- A Twitch account to run the bot on.

PhantomBot should work in any windows environment with standard Java, but for support purposes we require the above. We can not fully support Windows operating system before windows 7, nor can we fully support Java 7 or older.

This tutorial will walk you through most pre-requisites.

### Download PhantomBot

PhantomBot can be downloaded from [here](https://github.com/PhantomBot/PhantomBot/releases/latest/). The stable version is what we suggest to use for normal use. The [nightly](https://github.com/PhantomBot/nightly-build) is highly experimental, and the source is only interesting for developers. When you download the stable version you’ll get one file `PhantomBot-x.x.x.zip` (x.x.x will show the version number) which should be unzipped to the location you wish.

After unzip, the folder `PhantomBot-x.x.x` will contain the files you need to run PhantomBot.

### Creating a Bot Account

**If you have a bot account already, you can skip this step**

To create an account for the bot you must create a new account at Twitch. You can do so by first logging out (if you are currently logged in). Afterwards use the following link to create a new account:

https://www.twitch.tv/signup

### Getting the details required for initial startup

During the initial startup we need some details. These are:

- Bot Account Name - We do not recommend using your streaming account.
- Bot OAuth Token
- Which channel to join.

You should know your bot account name already. So that should be easy. Next up is getting the Bot OAuth Token.

#### Bot OAuth Token

To get the Bot OAuth token, make sure you are logged in to twitch with the **account you created for the bot** This token allows the bot to connect to Twitch. When you’ve done that, go to the following url:

https://phantombot.github.io/PhantomBot/oauth/

Click `Connect with Twitch Bot`, then click `Authorize`, and copy the code to a safe location. The code should look something like this:

`123abc`

#### The channel to join

This is the channel that the bot will be active in. This is your username. So if your username is PeterPiper you should be using PeterPiper.

#### Custom Details for the Web Panel

During the initial startup it will ask for a username and password that will be used to log in to the web panel. Make sure you decide on these ahead of time.

### Initial Startup

Now you have all the details (If you haven’t, follow the previous step), we can do the Initial Startup.
To start off you should have the folder `PhantomBot-x.x.x` open.

In this folder you’ll find several files, find `launch.bat` and double click it to start the Initial Startup.

After it has started, it will walk you through all the steps that require information that you got in the previous step. Do this now.

After going through all the steps, a whole lot of text will scroll by, and you should see the following:

`BotName ready!`

#### Automatically Refreshing OAuth

You should now setup Automatically Refreshing OAuth tokens so your chat token does not expire.

This also lets you connect the broadcaster account so the Twitch API works.

Go to your panel on the bots webserver. If you installed the bot on the same machine you are currently using, the link is usually http://localhost:25000/

If the bot is on a different computer, replace the IP/URL as neccessary.

Click on the **OAuth Setup** link and follow the instructions to authorize your tokens.

#### [ERROR] BotName is not detected as a moderator

If you see `[ERROR] BotName is not detected as a moderator`, go to your channel and type `/mod BotName` (replace BotName with the name of the bot). Now close the window and re-open `launch.bat`. Now you should get `BotName ready!`

### Launching PhantomBot if you’ve closed it

PhantomBot will always launch by opening `launch.bat`. Even after you’ve closed it.

### How to Properly Shutdown PhantomBot

When shutting PhantomBot down in Windows, do not just click the red X on the console windows, type `exit` then hit enter and PhantomBot will properly shutdown.

### Accessing the Web Panel

If you’re running PhantomBot locally, you can find the web panel at http://localhost:25000/panel.

If you’re running PhantomBot on a windows server or VPS, you’ll be able to access the web panel at `http://domain_or_ip:25000/panel`

To login, use the username and password you set during the initial startup.

### What now?

From here on out you can check out the rest of the docs for help on how to run PhantomBot.
You can also find a full command list at https://phantombot.github.io/PhantomBot/guides/#guide=content/commands/commands.
