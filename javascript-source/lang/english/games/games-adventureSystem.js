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

$.lang.register('adventuresystem.adventure.usage', 'Usage: !adventure [$1].');
$.lang.register('adventuresystem.alreadyjoined', 'You have already joined the adventure!');
$.lang.register('adventuresystem.completed', 'The adventure ended! Survivors are: $1.');
$.lang.register('adventuresystem.completed.no.win', 'The adventure ended! There are no survivors.');
$.lang.register('adventuresystem.completed.win.total', 'The adventure ended with $1 survivor(s) and $2 death(s).');
$.lang.register('adventuresystem.join.bettoohigh', 'You can not join with $1, the maximum is $2.');
$.lang.register('adventuresystem.join.bettoolow', 'You can not join with $1, the minimum is $2.');
$.lang.register('adventuresystem.join.needpoints', 'You can not join with $1, you only have $2.');
$.lang.register('adventuresystem.join.notpossible', 'You can not join now.');
$.lang.register('adventuresystem.join.success', 'You have joined the adventure with $1!');
$.lang.register('adventuresystem.loaded', 'Loaded adventure stories (found $1).');
$.lang.register('adventuresystem.loaded.prefix', 'Loaded $1 adventure stories from $2.');
$.lang.register('adventuresystem.payoutwhisper', 'Adventure completed, $1 + $2 has been added to your balance.');
$.lang.register('adventuresystem.runstory', 'Starting adventure "$1" with $2 player(s).');
$.lang.register('adventuresystem.set.success', 'Set $1 to $2.');
$.lang.register('adventuresystem.set.usage', 'Usage: !adventure set [settingname] [value].');
$.lang.register('adventuresystem.start.success', '$1 is trying get a team together for some serious adventure business! Use "!adventure [$2]" to join in!');
$.lang.register('adventuresystem.tamagotchijoined', '$1 is also joining the adventure.');
$.lang.register('adventuresystem.top5', 'The top 5 adventurers are: $1.');
$.lang.register('adventuresystem.top5.empty', 'There haven\'t been any adventure winners recorded yet.');
$.lang.register('adventuresystem.reset', 'The adventure has now cooled off! Use "!adventure [$1]" to start a new adventure!');

$.lang.register('adventuresystem.stories.default', 'true');

$.lang.register('adventuresystem.stories.1.title', 'Time Heist');
$.lang.register('adventuresystem.stories.1.chapter.1', 'Your memory is vague, on the table a small laptop is playing a video: "My name is The Architect. The bank of Karabraxos is the most secure bank in the universe. You will rob the bank of Karabraxos!"');
$.lang.register('adventuresystem.stories.1.chapter.2', 'Unable to leave their minds blank, (caught) slowly feel their mind being drained as The Teller feeds on their thoughts.');
$.lang.register('adventuresystem.stories.1.chapter.3', 'We find ourselves back in the room we started in as consciousness of (survivors) slowly fades again, only to wake up in our beds like nothing at all has happened.');

$.lang.register('adventuresystem.stories.2.title', 'Beartraps');
$.lang.register('adventuresystem.stories.2.chapter.1', 'Friends! I\'ve got coordinates for a secret stash of bolts, hidden away within the bowels of the elven forest. We should shoe up and give this a go!');
$.lang.register('adventuresystem.stories.2.chapter.2', 'Look out, bear traps! (caught) got their legs ripped off!');
$.lang.register('adventuresystem.stories.2.chapter.3', 'Dayum, that was a close call for losing a leg. But you\'ve deserved this (survivors)!');

$.lang.register('adventuresystem.stories.3.title', 'Vampires?!');
$.lang.register('adventuresystem.stories.3.chapter.1', 'Ah, my dear friends! I may have found the adventure of a lifetime. Namely the house of count Dracula is believed to be the bolts master! I\'m for going now!');
$.lang.register('adventuresystem.stories.3.chapter.2', 'It\'s him! (caught) got slaughtered violently!');
$.lang.register('adventuresystem.stories.3.chapter.3', 'That was a close call, I don\'t think I\'ve been bitten. you? Ow well, (survivors), here\'s your share! ~Transforms into a bat and flutters off~');

$.lang.register('adventuresystem.stories.4.title', 'Cereal');
$.lang.register('adventuresystem.stories.4.chapter.1', 'I think we have a much bigger threat on our hands than the cave in... It is half man, half bear, half pig... Don\'t Laugh, I\'M SUPER CEREAL!');
$.lang.register('adventuresystem.stories.4.chapter.2', '/me As the adventurers work their way through the tunnels they hear a soft noise from behind them...');
$.lang.register('adventuresystem.stories.4.chapter.3', 'Look out! It\'s ManBearPig! (caught) get dragged off into the darkness.');
$.lang.register('adventuresystem.stories.4.chapter.4', '(survivors) run away. Let\'s get out of here guys! We can\'t deal with this alone');


/*
 * Using the stories that come with PhantomBot:
 *
 * - All stories that are bundled with the bot are in the namespace adventuresystem.stories.*
 * - If you do not want to use these stories, set the following in your custom language file:
 *     $.lang.register('adventuresystem.stories.default', 'false');
 *
 * Rules on writing your own adventure story:
 *
 * - Stories are automatically loaded from the language file by their sequence number (adventuresystem.stories.custom.[This number]).
 * - It is recommended to use a custom language file for your own stories.
 * - Keep the format of your story as shown above, adding the '.custom' portion of the identifier.
 * - There can be an unlimited number of stories, IF you keep their subsequence numbers 1, 2, 3, 4, 5...
 * - A story must have a title.
 * - A story can have an unlimited number of chapters, IF you keep their subsequence numbers 1, 2, 3, 4, 5...
 * - Stories are picked at random.
 *
 ** Game specific story how-to. You also need to make sure that you at least have ONE story that doesn't require a specific game.
 ** Please make sure that your story number also follow along. What I mean by that is it needs to start from 1 and go up. Same with the chapters.
 * - Add $.lang.register('adventuresystem.stories.NUMBER.game', 'GAME NAME IN LOWER CASE'); on top of the story chapter.

 * Example >
 * $.lang.register('adventuresystem.stories.custom.1.game', 'programming');
 * $.lang.register('adventuresystem.stories.custom.1.title', 'Talk Shows');
 * $.lang.register('adventuresystem.stories.custom.1.chapter.1', 'random story...');
 *
 * Underneath is a template for your first custom story, just remove the preceding slashes.
 */

//$.lang.register('adventuresystem.stories.custom.1.title', '');
//$.lang.register('adventuresystem.stories.custom.1.chapter.1', '');
//$.lang.register('adventuresystem.stories.custom.1.chapter.2', '');
//$.lang.register('adventuresystem.stories.custom.1.chapter.3', '');
