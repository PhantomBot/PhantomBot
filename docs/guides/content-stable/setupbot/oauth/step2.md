# OAuth Setup Guide - Client ID and Secret

The next step is to generate and save our Client ID and Secret

### Generate and Save Client ID and Secret
- Near the bottom of the form, click **New Secret**
  
  ![New Secret Button](./images/oauth/twitch_app_manage1.png)
- Your browser will ask you to confirm that you want to delete the old secret and create a new one. Since we don't have a secret yet, click OK to proceed
  
  ![New Secret Confirmation](./images/oauth/twitch_secret_confirm.png)
- The form will now show you a secret random password
  
  ![Client ID and Secret Displayed](./images/oauth/twitch_app_manage2.png)
  - Treat this secret like any other password, you should guard it so that nobody else ever knows it
  - If you close or refresh the webpage, you will not be able to see the secret again
  - If you lose the secret, you must generate a new one
  - Generating a new secret will forever invalidate and delete the old secret
- Copy the Client ID and Secret into the PhantomBot OAuth page
  
  ![Client ID and Secret Entry](./images/oauth/oauth_clientid_secret.png)
  - Copy the Client ID into the textbox for step 3
  - Copy the Secret into the textbox for step 4-3
  - Ensure you do not accidentally introduce any extra characters, such as spaces
- Click the **Save Client ID and Secret** button on the PhantomBot OAuth page
  - If you scroll to the top, a green success message should appear
  - The rest of the PhantomBot OAuth page should become visible
- Continue to the Next Step, based on which option you selected at the top of the PhantomBot OAuth page
  - If you selected **I will authorize both the Bot and the Broadcaster**, continue to [Both OAuth](guide=content/setupbot/oauth/step3-a "##guide_link")
  - If you selected **I will authorize only the Bot, the Broadcaster will authorize themselves separately**, continue to [Separate OAuth](guide=content/setupbot/oauth/step3-b "##guide_link")