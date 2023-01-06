# Channel Points

This module allows the bot to perform actions in response to a Twitch Channel Points redemtion

### Terminology

To reduce confusion when talking about Channel Points, PhantomBot uses the following terminology:

- _redeemable_ - refers to a Twitch Channel Points Reward
- _redemption_ - refers to an individual redemption of a Twitch Channel Points Reward
- _redeeming_ - used in reference to the viewer who redeemed a Twitch Channel Points Reward
- _reward_ - below this line, refers exclusively to a PhantomBot response to a redemption of a Twitch Channel Points Reward

### Requirements

Due to security restrictions put in place by Twitch, bots and other 3rd parties can only view and manage Channel Points with an OAuth belonging to the Broadcaster

This is despite moderators being able to perform some of these functions on the Twitch website

For PhantomBot, this means that the connection that is created on the OAuth page of the bots webserver for the **Connect with Twitch Broadcaster** button must be the actual broadcaster

### Setup

- Visit the **Channel Points** page on the panel of the bots webserver, available under the **Loyalty** section
- To link a redeemable that already exists to an action
  - Click _Add Reward_ on the _Rewards_ tab
  - Select the redeemable to use from the drop-down. Each redeemable can only be linked to one reward
  - In the response box, use text and command tags to craft a response, in the same style as you would for a custom command
  - **Please take note of the warning and info messages in the dialog**
- To convert an existing redeemable so that the bot can manage the paused status and mark redemptions as fulfilled
  - Click _Convert Redeemable_ on the _Redeemables_ tab
  - Follow the instructions in the dialog
- To create a new redeemable that the bot can manage
  - Click _Add Redeemable_ on the _Redeemables_ tab
  - Fill in the title and cost
    - NOTE: The title must be unique amongst all redeemables the broadcaster has on their channel, including redeemables which are disabled, paused, or not managed by the bot
  - (Optional) Expand the advanced section and set additional options
  - Click _Save_
  - The redeemable should now be available to link to a reward

### Usage
Once the reward is setup, any redemption of the linked redeemable will trigger the tags to be processed and any text to be output in chat

### Example Rewards

#### Give 200 !Points and announce it in Chat
```
(addpoints 200 (cpusername))@(cpdisplayname), you have been awarded 200 (pointname 200) by redeeming (cptitle)
```

#### Give 200 !Points to all active Viewers
```
(addpointstoall 200)
```

#### Enable Emotes Only mode in chat for 60 seconds
```
(delaysay 60 /emoteonlyoff)/emoteonly
```

#### Timeout the Viewer of the redeeming users choosing for 30 seconds and announce it in chat
```
(delaysay 1 (cpinput) has been timed out for 30 seconds by (cpdisplayname))/timeout (sanitizeuser (cpinput)) 30
```

Note the use of `(delaysay)` with a 1 second delay to send multiple messages to chat; first the timeout itself, then the announcement