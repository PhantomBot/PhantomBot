# Twitter Integration Setup

### Creating a Twitter Developer Account

**If you have a Twitter Developer Account already, you can skip this step**

1. Use the following link https://developer.twitter.com/en/apps
2. Click *Create an app*, set name and click *Apply*
3. Select your Usecase (most likley "Making a Bot")
4. Fill out the Forms
5. After Creating the App Click *Details* and head over to *Permissions*
6. Click *Edit* and change *Access permission* to *Read and write*

### Getting and Setup Bot token

1. In the *Keys and tokens* Tab, *Regenerate* your *Access token & access token secret* and **_Save_** them securly.
2. Stop the bot
3. Open file `BotName\config\botlogin.txt`
4. Create several lines 

	``` 
	 twitterUser=Twitter Account
	 twitter_consumer_key=API key
	 twitter_consumer_secret=API secret key
	 twitter_access_token=Access token
	 twitter_secret_token=Access token secret
	 ```

5. Replace the Text **_after the =_** respectively to the Value of your *Keys and Tokens from Twitter* 
6. Change *Twitter Account* to *your* Twitter Name
7. Save file and start the bot

You can now Enable and Configure your Twitter Settings under *Alerts* and *Discord -> Alerts* respectively.
