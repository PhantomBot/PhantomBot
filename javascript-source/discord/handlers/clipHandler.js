/**
 * Script  : clipHandler.js
 * Purpose : Configures the automatic display of clips in chat and captures the events from Twitch.
 */
(function() {
    var toggle = $.getSetIniDbBoolean('discordSettings', 'clipsToggle', false),
        message = $.getSetIniDbString('discordSettings', 'clipsMessage', '(name) created a new clip!'),
        channelName = $.getSetIniDbString('discordSettings', 'clipsChannel', ''),
        announce = false;

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/clipHandler.js')) {
            toggle = $.getIniDbBoolean('discordSettings', 'clipsToggle', false);
            message = $.getIniDbString('discordSettings', 'clipsMessage', '(name) created a new clip!');
            channelName = $.getIniDbString('discordSettings', 'clipsChannel', '');
        }
    });

    /*
     * @event twitchClip
     */
	$.bind('twitchClip', function(event) {
        var creator = event.getCreator(),
            url = event.getClipURL(),
            s = message;

        /* Even though the Core won't even query the API if this is false, we still check here. */
        if (announce === false || toggle === false) {
            return;
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', creator);
        }

        if (s.match(/\(url\)/g)) {
            s = $.replace(s, '(url)', url);
        }

        if (s.match(/\(embedurl\)/g)) {
            s = $.replace(s, '(embedurl)', url);
        }

        if (message.indexOf('(embedurl)') !== -1) {
            $.discord.say(channelName, s);
        } else {
            $.discordAPI.sendMessageEmbed('testing', new Packages.sx.blah.discord.util.EmbedBuilder()
                        .withColor(100, 65, 164)
                        .withThumbnail('https://raw.githubusercontent.com/PhantomBot/Miscellaneous/master/Discord-Embed-Icons/clip-embed-icon.png')
                        .withTitle($.lang.get('discord.cliphandler.clip.embedtitle'))
                        .appendDescription(s)
                        .withUrl('https://clips.twitch.tv')
                        .withTimestamp(Date.now())
                        .withFooterText('Twitch')
                        .withFooterIcon($.twitchcache.getLogoLink()).build());
        }
    });

    /*
     * @event command
     */
    $.bind('discordChannelCommand', function(event) {
        var sender = event.getSender(),
            channel = event.getChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            args = event.getArgs(),
            argsString = event.getArguments(),
            action = args[0];

        /*
         * @discordcommandpath clipstoggle - Toggles the clips announcements.
         */
        if (command.equalsIgnoreCase('clipstoggle')) {
            toggle = !toggle;
            $.setIniDbBoolean('discordSettings', 'clipsToggle', toggle);
            $.discord.say(channel, $.discord.userPrefix(mention) + (toggle ? $.lang.get('discord.cliphandler.toggle.on') : $.lang.get('discord.cliphandler.toggle.off')));
        }

        /*
         * @discordcommandpath clipsmessage [message] - Sets a message for when someone creates a clip.
         */
        if (command.equalsIgnoreCase('clipsmessage')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cliphandler.message.usage'));
                return;
            }

            message = argsString;
            $.setIniDbString('discordSettings', 'clipsMessage', message);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cliphandler.message.set', message));
        }

        /*
         * @discordcommandpath clipschannel [channel] - Sets the channel to send a message to for when someone creates a clip.
         */
        if (command.equalsIgnoreCase('clipschannel')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cliphandler.channel.usage', channelName));
                return;
            }

            channelName = action.replace('#', '').toLowerCase();
            $.setIniDbString('discordSettings', 'clipsChannel', channelName);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cliphandler.channel.set', channelName));
        }

        /*
         * @discordcommandpath lastclip - Displays information about the last clip captured.
         */
        if (command.equalsIgnoreCase('lastclip')) {
            var url = $.getIniDbString('streamInfo', 'last_clip_url', $.lang.get('cliphandler.noclip'));
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cliphandler.lastclip', url));
        }

        /*
         * @discordcommandpath topclip - Displays the top clip from the past day.
         */
        if (command.equalsIgnoreCase('topclip')) {
            var url = $.getIniDbString('streamInfo', 'most_viewed_clip_url', $.lang.get('cliphandler.noclip'));
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cliphandler.topclip', url));
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/handlers/clipHandler.js', 'clipstoggle', 1);
        $.discord.registerCommand('./discord/handlers/clipHandler.js', 'clipsmessage', 1);
        $.discord.registerCommand('./discord/handlers/clipHandler.js', 'clipschannel', 1);
        $.discord.registerCommand('./discord/handlers/clipHandler.js', 'lastclip', 0);
        $.discord.registerCommand('./discord/handlers/clipHandler.js', 'topclip', 0);

        announce = true;
    });
})();