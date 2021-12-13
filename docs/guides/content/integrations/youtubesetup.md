# Youtube Integration Setup

### Creating an Google Project

**If you have a Google Project with the Youtube Data API v3 enabled, you can skip this step**

1. Use the following link [Create Project](https://console.developers.google.com/cloud-resource-manager?organizationId=0&supportedpurview=project)
2. Click *Create Project*, set name and click *Create*
3. Head over to [Project Selection](https://console.developers.google.com/projectselector2/apis/dashboard?organizationId=0&supportedpurview=project) and select your Project
4. Click *ENABLE APIS AND SERVICES* and Search for **Youtube Data API v3** click on it and click *Enable*
5. Click *Credentials* and Click *Create Credentials* and select API Key
6. ___(Optional)___ After that click *restrict key*. 
7. ___(Optional)___ Under *API restrictions* select *Restrict key* and Select the *Youtube Data API v3* and Save.

### Getting and Setup Bot token

1. You will now see your API Key under *API Keys*, click *Copy* beside the _Key_ and paste code to safe location.
2. Stop the bot
3. Open file `BotName\config\botlogin.txt`
4. Create a line `youtubekey=KEY` (replace *KEY* with what you saved in the first paragraph)
5. Save file and start the bot

You can now enable the Youtube Player Module under *Settings* -> *Modules*
