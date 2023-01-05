/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function () {
    const handlerModule = './handlers/emojiHandler.js';
    var emoteProvider = 'maxcdn';

    $.bind('ircChannelMessage', function (event) {
        var codepoints = Packages.tv.phantombot.scripts.handler.EmojiProcessor.extractAllEmojiToCodepoint(event.getMessage());
        var emojiCounts = Packages.tv.phantombot.scripts.handler.EmojiProcessor.groupByCount(codepoints);

        if (emojiCounts.size() > 0) {
            emojiCounts.forEach((codepoint, count) =>
                $.alertspollssocket.triggerEmote(codepoint, count, emoteProvider)
            );
        }
    });
})();