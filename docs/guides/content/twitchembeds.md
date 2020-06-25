# Enable Twitch embeds

Due to changes by Twitch, the chat and live feed panel can no longer be displayed. To make it work:
- SSL certificate required
- URL must not contain numbers

All settings changed in the guide are located on the path `PhantomBot\config\botlogin.txt`.

To apply any settings, you must restart the bot.

&nbsp;

#### Setup SSL

Replace `usehttps=false` with `usehttps=true`.

&nbsp;

#### URL requirements

If you run PhantomBot on your PC (localhost):

- Replace `baseport=25000` with `baseport=443`. Use port 443 to access the control panel.

If you use external IP:

- Use this [link](https://phantombot.github.io/PhantomBot/panel/login/) to access the control panel. If this is your first time using it, you must login into your control panel using IP:port and accept the certificate.
