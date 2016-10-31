/**
 * The discord event gets a message event from Discord. This event contains the name
 * of the text channel, the user that sent the message in the channel, and the message.
 *
 * This is provided as a simplistic framework. It is not advised to attempt to run 
 * commands from Discord or attempt to call any of the other modules in PhantomBot
 * as those commands are meant to interact specifically with Twitch. Feel free to 
 * access the database, language entries, and items such as that, but do not attempt
 * to utilize any of the commands directly.
 *
 * Messages may be sent back to Discord using the following method:
 *     $.discord.sendMessage({String} channelName, {String} message);
 *
 * Note that the API indicates that there is a rate limit of 10 messages in 10 seconds.
 * The sendMessage() method therefore is rate limited and will only send one message
 * once every second. No burst logic is provided. 
 *
 * If you wish to use Discord, you will need to follow the directions on the following
 * website to register for an application and create a token to place into botlogin.txt.
 *
 *     https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token
 *
 */
(function() {
    var lastStreamOnlineSend = 0;

    /*
     * @event discord
     */
    $.bind('discord', function(event) {
        var discordChannel = event.getDiscordChannel(),
            discordUser = event.getDiscordUser(),
            discordMessage = event.getDiscordMessage();
    });


    /*
     * @event twitchOnline
     *
     * Send a message to a Discord Channel to indicate that the stream is online. 
     * Only send once every 5 minutes to account for Twitch issues.
     */
    $.bind('twitchOnline', function(event) {
        var now = $.systemTime();
        if (now - lastStreamOnlineSend > 600e3) {
            lastStreamOnlineSend = now;
            if ($.bot.isModuleEnabled('./handlers/discordHandler.js')) {
                $.discord.sendMessage($.discordStreamOnlineChannel, $.lang.get('discord.streamonline', $.username.resolve($.channelName)));
            }
        }
    });
})();
