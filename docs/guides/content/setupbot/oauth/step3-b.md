# OAuth Setup Guide - Authorizing OAuths Separately

The final step is to perform the bot OAuth authoriztion, and then ask the broadcaster to perform the broadcaster OAuth authorization

This page is for users who selected **I will authorize only the Bot, the Broadcaster will authorize themselves separately** at the top of the PhantomBot OAuth page

If you selected **I will authorize both the Bot and the Broadcaster**, continue to [Both OAuth](guide=content/setupbot/oauth/step3-a "##guide_link") instead

### Prepare for Broadcaster Authorization
- Return to the **Manage** page for your application on the Twitch Developer Portal
- Next to the original OAuth URL, click the **Add** button
  
  ![Add New OAuth URL Button](./images/oauth/twitch_app_manage3.png)
- In the new empty **OAuth Redirect URLs** box, copy the broadcaster URL provided by the PhantomBot OAuth page (Step 7-6) _**EXACTLY**_, including any slash characters at the end
  
  ![Entering the Broadcaster OAuth URL](./images/oauth/twitch_app_manage4.png)
  - If the URL does not perfectly match, OAuth will fail later
  - If the URL ever changes, such as if you get a new IP address or domain name, you will need to update this later
- Click **Save**

### Authorize the Bot OAuth
- You can review the list of Authorization Scopes (permissions) that PhantomBot requests for the bot account and the use for each scope on the PhantomBot OAuth page
- Scroll to the bottom and click **Connect with Twitch Bot**
  
  ![Connect with Twitch Bot Button](./images/oauth/oauth_bot_button.png)
- When the Twitch authorization page loads, ensure it is showing your **bot** account at the top
  - This is the account that you want to appear in Twitch chat when the bot sends messages
  - If the wrong account is displayed, click the **not you? log out** link and then login with the desired bot account
- Review the requested permissions and then click **Authorize**
- After you are redirected back to the PhantomBot OAuth page, ensure you get a green success message near the top of the page

### Authorize the Broadcaster OAuth
- On the PhantomBot OAuth page, click the **Generate Broadcaster Temporary Password** button (Step 7-8)
  
  ![Broadcaster OAuth URL and Login](./images/oauth/twitch_app_manage3.png)
- Give the broadcaster the URL (Step 7-9) and Username/Password (Step 7-10)
  - Note that this temporary login will only work once
- The broadcaster can review the list of Authorization Scopes (permissions) that PhantomBot requests for the bot account and the use for each scope on the PhantomBot OAuth page
- The broadcaster then needs to scroll to the bottom and click **Connect with Twitch Broadcaster**
  
  ![Connect with Twitch Broadcaster Button](./images/oauth/oauth_broadcaster_button.png)
- When the Twitch authorization page loads, the broadcaster should ensure it is showing their **broadcaster** account at the top
  - This is their personal account and is used to authorize API calls on their behalf
  - If the wrong account is displayed, click the **not you? log out** link and then login with the desired broadcaster account
- After they review the requested permissions, they should click **Authorize**
- After they are redirected back to the PhantomBot OAuth page, ensure they get a green success message near the top of the page

### Enjoy PhantomBot!
The bot will now connect to the broadcasters chat and be ready for use

Next steps
- Check out our other integrations to enhance functionality, such as [Discord](guide=content/integrations/discordintegrationsetup "##guide_link")
- Check out the **PhantomBot Control Panel** link on the bots web panel (default URL http://localhost:25000/) to configure and manage chat plugins, create custom commands, and more
- Check out the [Custom Command Tags](guide=content/commands/command-variables "##guide_link") that can enhance the functionality of custom commands, such as adding the name of the command user, stream uptime, and more