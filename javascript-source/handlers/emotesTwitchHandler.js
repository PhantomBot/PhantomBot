(function () {
    $.bind('ircChannelMessage', function (event) {
        const tags = event.getTags();
        if (tags.containsKey('emotes')) {
            const emotesString = tags.get('emotes');
            if (emotesString.length() > 0) {
                $.alertspollssocket.triggerEmotes(emotesString);
            }
        }
    });
})();
