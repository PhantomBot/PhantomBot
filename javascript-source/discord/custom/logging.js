(function() {
    $.bind('discordChannelMessage', function(event) {
        $.log.file('discord', '[' + event.getDiscordChannel().getName() + '] ' + event.getSender() + ': ' + event.getMessage());
    });
})()