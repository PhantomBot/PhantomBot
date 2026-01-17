# OAuth Setup Guide - Start

Welcome to PhantomBot!

This guide will help you navigate OAuth setup

### Prepare for OAuth Setup

Before setting up OAuth, please complete the following steps

- Launch the bots web panel
  - When hosting the bot locally, the default URL is usually http://localhost:25000
  - If accessing remotely, configure your firewall/port forwarding as needed to allow access to port 25000
  - It is normal for the browser to give a security warning, as we use self-signed SSL certificates by default
- Click **Bot Setup and OAuth**
  
  ![Bot Setup and OAuth Button](./images/oauth/bot_setup_button.png)
- If the login page appears, enter your bot panel admin username and password
  - If you are just starting the bot for the first time, your terminal window will display an auto-generated username and password
  - You can lookup the admin username and password at any time in `config/botlogin.txt`
- Fill in the name of the Twitch channel to join
  
  ![Bot Setup Admin Section](./images/oauth/bot_setup_form.png)
- Click the floating **Save Configuration** button near the bottom-left to save the changes
  
  ![Bot Setup Save Button](./images/oauth/bot_setup_save.png)
- Click the **OAuth Setup** link at the top of the page
  
  ![Bot Setup OAuth Link](./images/oauth/bot_setup_oauth.png)
- Select how your authentication will be split
  
  ![Bot OAuth Methods Selection](./images/oauth/oauth_method.png)
  - If you are the owner of both the Bot account and the Broadcaster account, use the default option of **I will authorize both the Bot and the Broadcaster**
    - You can also select this option if you wish to use your own (moderator) account as the "broadcaster" OAuth instead of the actual broadcaster account
    - NOTE: Some features such as retriving Subscribers are only allowed by Twitch if the actual Broadcaster account is used
  - If you are operating the bot on behalf of another broadcaster (maybe you are a moderator managing the bot for a broadcaster), select **I will authorize only the Bot, the Broadcaster will authorize themselves separately**
- Continue to the [Next Step](guide=content/setupbot/oauth/step1 "##guide_link")