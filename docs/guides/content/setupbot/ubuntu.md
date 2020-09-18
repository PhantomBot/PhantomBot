# Ubuntu 16.04 Setup Guide

You need a user which has root privileges on the server to get this working! If you don't have root privileges, you may encounter unsolvable problems during setup. But it's possible to get the bot running without them.

### 1. Get your system ready

First thing is to make sure, that your system is up to date. Before we install anything, we check if this is the case.

Type into the terminal or your SSH client:

`sudo apt update && sudo apt upgrade`

### 2. Create a PhantomBot user

NEVER run this type of applications as root or root-user! Provide only necessary privileges to keep your server secure!

To create a new user and the corresponding home directory you have to type the following:

`adduser --disabled-password --gecos "" botuser`

Please take a good password! Nothing like 123 or similar are really secure!
Now we have created the user and the home directory for him.

### 3. Installing PhantomBot

Now we're ready to install PhantomBot into our botuser directory. First switch to your botuser:

`sudo su - botuser`

Switch to the home directory:

`cd /home/botuser`

Now we need to download the latest PhantomBot release:

`wget https://github.com/PhantomBot/PhantomBot/releases/download/vX.X.X/PhantomBot-X.X.X.zip`

Replace the X with the current release version like PhantomBot-3.2.0.zip!

After the download has finished, we have to unzip the files.

`unzip PhantomBot-X.X.X.zip`

To make future updates a bit easier, we have to rename the PhantomBot folder.

`mv PhantomBot-X.X.X phantombot`

The last thing we need to do is to assign the right privileges to make the launch.sh and java-runtime files executable.

`cd phantombot`

`chmod u+x ./launch.sh ./launch-service.sh ./java-runtime-linux/bin/java`

Now we are ready to launch PhantomBot. You can run the bot with:

`./launch.sh`

Now PhantomBot should start and you can begin to use it. At this point you can enter the information it asks you for. As a reference, you can check the Windows guide for the bot account configuration.

After the bot is configured you can press the following keys and follow the rest of the guide.

`Ctrl + C`

### 4. Setting up a systemd Unit

Create a new file called phantombot.service. I use nano, but you can also use vi to write files.

`sudo nano /etc/systemd/system/phantombot.service`

Paste this into the file:
```
[Unit]
Description=PhantomBot
After=network.target remote-fs.target nss-lookup.target

[Service]
User=botuser
Group=botuser
Restart=on-failure
RestartSec=30
ExecStart=/home/botuser/phantombot/launch-service.sh
KillSignal=SIGTERM

[Install]
WantedBy=multi-user.target
```
After this, we have to install the created file to run at boot as a service.

`sudo systemctl daemon-reload`

`sudo systemctl enable phantombot`

Now one last thing we need to do, is to make the commands work to start|stop|restart|status PhantomBot. We have to open the sudoers file to grant our botuser the rights to run these commands.

`sudo visudo`

On the end of the file add this:

`botuser ALL=NOPASSWD: /bin/systemctl start phantombot, /bin/systemctl stop phantombot, /bin/systemctl restart phantombot, /bin/systemctl status phantombot`

Now the user *botuser* should have the rights to run the specific commands to start|stop|restart|status PhantomBot. Let’s try it!

Switch to our botuser:

`sudo su - botuser`

Then as *botuser* try:

`sudo systemctl start phantombot`

`sudo systemctl stop phantombot`

`sudo systemctl restart phantombot`

`sudo systemctl status phantombot`

If you have set up all correct it will start|stop|restart|status PhantomBot.

After PhantomBot is started, you can find your Control Panel under *YOUR-SERVER-IP:25000/panel*.
Make sure you open the following port on your server: `25000`.

### Extra - Backup every 24 hours

`sudo su - botuser`

`cd /home/botuser`

`mkdir -p backup/phantombot`

`crontab -e`

add
```
1 4 * * * umask 0007;/bin/tar --exclude=/home/botuser/phantombot/lib --exclude=/home/botuser/phantombot/web -cjf /home/botuser/backup/phantombot/$(/bin/date +%Y-%m-%d-%H_%M_%S_%3N).tar.bz2 /home/botuser/phantombot/ >>/home/botuser/backup/backup_phantombot.log 2>&1
```
Use this to check your crontab afterwards:
`crontab -l`
