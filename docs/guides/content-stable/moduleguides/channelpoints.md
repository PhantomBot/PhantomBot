# Channel Points

There are currently four functions that PhantomBot can perform that can be configured as channel point rewards. These are:
* __Transfer__: redeem a channel points reward which will reward that user with currency in the bot 
* __Give all__: redeem a channel points reward which will reward all users in chat with currency in the bot
* __Emote only__: redeem a channel points reward which will place the chat in emote only mode for a set duration
* __Timeout__: redeem a channel points reward with user input which will timeout the user input for a set duration

### Setup
1. Create the reward in 'Manage Rewards & Challenges', deciding on the channel point cost of the reward. Ensure that   
    timeout is set up to require user input with a clear description stating that the user redeeming the reward is 
    responsible for correct spelling. Manage Rewards & Challenges can be found using this link by replacing 'USERNAME' 
    with your username https://dashboard.twitch.tv/u/USERNAME/community/channel-points/rewards
2. Activate the "./handlers/channelPointsHandler.js" module either in the dashboard under Setting -> Modules or by 
    typing "!module enable ./handlers/channelPointsHandler.js" in chat.
3. Bind the desired function to the reward by typing "!channelpoints [transfer / giveall / emoteonly / timeout] config" 
    in chat to put that function in configuration mode; then redeeming the reward and typing the same command to exit 
    the configuration mode of the function. The bot will state at the end of the configuration the name of the reward
    that it is bound to.
4. Set the amount / duration of the action that the reward performs by typing  "!channelpoints [transfer / giveall] 
    amount [number of points to award]" or "!channelpoints [emoteonly / timeout] duration [duration of action]".
5. Activate the function by typing "!channelpoints [transfer / giveall / emoteonly / timeout] toggle"

At any time you can type "!channelpoints [transfer / giveall / emoteonly / timeout] to check its current configuration.

### Usage
Once the reward is setup, as explained above, the bot will automatically perform the action requested through channel 
points reward redemptions.

### Troubleshooting

**Bot Cannot See Channel Points Redemptions**

Reading channel point redemptions requires the bot to have more permissions that previous versions of PhantomBot. During 
channel points config, if the bot is not able to read the redemption you may need to update your oath token with more 
permissions.

If you need any more help please ask in the [PhantomBot Discord](https://discord.com/invite/YKvMd78). 