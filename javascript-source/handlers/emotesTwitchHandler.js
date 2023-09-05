(function () {
    $.bind('ircChannelMessage', function (event) {
        const tags = event.getTags();
        if (tags.containsKey('emotes')) {
            const emotesString = tags.get('emotes');
            if ($.strlen(emotesString) > 0) {
                $.alertspollssocket.triggerEmotes(emotesString);
            }
        }
    });
})();
