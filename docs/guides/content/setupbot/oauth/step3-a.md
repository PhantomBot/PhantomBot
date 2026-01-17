# OAuth Setup Guide - Authorizing Both OAuths

The final step is to perform both OAuth authoriztions

This page is for users who selected **I will authorize both the Bot and the Broadcaster** at the top of the PhantomBot OAuth page

If you selected **I will authorize only the Bot, the Broadcaster will authorize themselves separately**, continue to [Separate OAuth](guide=content/setupbot/oauth/step3-b "##guide_link") instead

### Authorize the Bot and Broadcaster OAuths
- You can review the list of Authorization Scopes (permissions) that PhantomBot requests for each account and the use for each scope on the PhantomBot OAuth page
- Scroll to the bottom and click **Connect with Twitch Bot**
  
  ![Connect with Twitch Buttons](./images/oauth/oauth_buttons.png)
- When the Twitch authorization page loads, ensure it is showing your **bot** account at the top
  - This is the account that you want to appear in Twitch chat when the bot sends messages
  - If the wrong account is displayed, click the **not you? log out** link and then login with the desired bot account
- Review the requested permissions and then click **Authorize**
- After you are redirected back to the PhantomBot OAuth page, ensure you get a green success message near the top of the page
- Scroll to the bottom and click **Connect with Twitch Broadcaster**
  
  ![Connect with Twitch Buttons](./images/oauth/oauth_buttons.png)
- When the Twitch authorization page loads, ensure it is showing your **broadcaster** account at the top
  - This is your personal account and is used to authorize API calls on your behalf
  - If the wrong account is displayed, click the **not you? log out** link and then login with the desired broadcaster account
- Review the requested permissions and then click **Authorize**
- After you are redirected back to the PhantomBot OAuth page, ensure you get a green success message near the top of the page

### Enjoy PhantomBot!
The bot will now connect to your chat and be ready for use

Next steps
- Check out our other integrations to enhance functionality, such as [Discord](guide=content/integrations/discordintegrationsetup "##guide_link")
- Check out the **PhantomBot Control Panel** link on the bots web panel (default URL http://localhost:25000/) to configure and manage chat plugins, create custom commands, and more
- Check out the [Custom Command Tags](guide=content/commands/command-variables "##guide_link") that can enhance the functionality of custom commands, such as adding the name of the command user, stream uptime, and more