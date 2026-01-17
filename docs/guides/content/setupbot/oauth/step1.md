# OAuth Setup Guide - Register Application

Next, lets login to the [Twitch Developer Portal](https://dev.twitch.tv/) and register a new application

### Login to Twitch Developer Portal
- Go to the [Twitch Developer Portal](https://dev.twitch.tv/)
- Click the **Log in with Twitch** button in the top-right corner
  
  ![Log in with Twitch Button](./images/oauth/twitch_dev_nologin.png)
- Ensure you are logged in with the account that you want to use as the app owner, then authorize the login
  - Your personal account is a good option for this
  - It is recommended to have Two-Factor Authentication enabled on this account for security
- Click the **Your Console** button in the top-right corner
  
  ![Your Console Button](./images/oauth/twitch_dev_login.png)

### Register an Application
- Click on the **Register Your Application** button on the right
  ![Register Your Application Button](./images/oauth/twitch_console.png)
- Fill in the form and submit it
  
  ![Register Your Application Form](./images/oauth/twitch_app_register.png)
  - Use any name you want
    - This name will appear on the OAuth screen on Twitch and in your list of Authorized Applications (Connections) on Twitch
    - You should choose a name that you will recognize, such as **SomeStreamer's PhantomBot**
  - In the **OAuth Redirect URLs** box, copy the URL provided by the PhantomBot OAuth page (Step 1-6) _**EXACTLY**_, including any slash characters at the end
    - If the URL does not perfectly match, OAuth will fail later
    - If the URL ever changes, such as if you get a new IP address or domain name, you will need to update this later
  - Set the **Category** to **Chat Bot**
  - Leave the **Client Type** as **Confidential**
  - Click **Create**
- You will be brought to your **Applications** list, click on **Manage** next to your new app
  
  ![Developer Applications List](./images/oauth/twitch_apps_list.png)
- Continue to the [Next Step](guide=content/setupbot/oauth/step2 "##guide_link")