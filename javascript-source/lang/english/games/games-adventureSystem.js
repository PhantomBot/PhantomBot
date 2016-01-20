$.lang.register('adventuresystem.adventure.cooldown', 'The adventure is still cooling down! $1 to go.');
$.lang.register('adventuresystem.adventure.usage', 'Usage: !adventure [$1].');
$.lang.register('adventuresystem.alreadyjoined', 'You have already joined the adventure!');
$.lang.register('adventuresystem.completed', 'The adventure ended with $1 survivor(s) and $2 death(s).');
$.lang.register('adventuresystem.join.bettoohigh', 'You can not join with $1, the maximum is $2.');
$.lang.register('adventuresystem.join.bettoolow', 'You can not join with $1, the minimum is $2.');
$.lang.register('adventuresystem.join.needpoints', 'You can not join with $1, you only have $2..');
$.lang.register('adventuresystem.join.notpossible', 'You can not join now.');
$.lang.register('adventuresystem.join.success', 'You have joined the adventure with $1!');
$.lang.register('adventuresystem.loaded', 'Loaded adventure stories (found $1).');
$.lang.register('adventuresystem.payoutwhisper', 'Adventure completed, $1 + $2 has been added to your balance.');
$.lang.register('adventuresystem.runstory', 'Starting adventure "$1" with $2 player(s).');
$.lang.register('adventuresystem.set.success', 'Set $1 to $2.');
$.lang.register('adventuresystem.set.usage', 'Usage: !adventure set [settingname] [value].');
$.lang.register('adventuresystem.start.success', '$1 is trying get a team together for some serious adventure business! Use "!adventure [$2]" to join in!');
$.lang.register('adventuresystem.tamagotchijoined', '$1 is also joining the adventure.');
$.lang.register('adventuresystem.top5', 'The top 5 adventurerers are: $1.');
$.lang.register('adventuresystem.top5.empty', 'There haven\'t been any adventure winners recorded yet.');

$.lang.register('adventuresystem.stories.1.title', 'Time Heist');
$.lang.register('adventuresystem.stories.1.chapter.1', 'Your memory is vague, on the table a small laptop is playing a video: "My name is The Architect. The bank of Karabraxos is the most secure bank in the universe. You will rob the bank of Karabraxos!"');
$.lang.register('adventuresystem.stories.1.chapter.2', 'Unable to leave their minds blank, (caught) slowly feel their mind being drained as The Teller feeds on their thoughts.');
$.lang.register('adventuresystem.stories.1.chapter.3', 'We find ourselves back in the room we started in as consciousness of (survivors) slowly fades again, only to wake up in our beds like nothing at all has happened.');

$.lang.register('adventuresystem.stories.2.title', 'Beartraps');
$.lang.register('adventuresystem.stories.2.chapter.1', 'Friends! I\'ve got coordinates for a secret stash of bolts, hidden away within the bowels of the elven forest. We should shoe up and give this a go!');
$.lang.register('adventuresystem.stories.2.chapter.2', 'Look out, bear traps! (caught) got their legs ripped off!');
$.lang.register('adventuresystem.stories.2.chapter.3', 'Dayum, that was a close call for loosing a leg. But you\'ve deserved this (survivors)!');

$.lang.register('adventuresystem.stories.3.title', 'Vampires?!');
$.lang.register('adventuresystem.stories.3.chapter.1', 'Ah, my dear friends! I may have found the adventure of a lifetime. Namely the house of count Dracula is believed to be the bolts master! I\'m for going now!');
$.lang.register('adventuresystem.stories.3.chapter.2', 'It\'s him! (caught) got slaughtered violently!');
$.lang.register('adventuresystem.stories.3.chapter.3', 'That was a close call, I don\'t think I\'ve been bitten. you? Ow well, (survivors), here\'s your share! ~Transforms into a bat and flutters off~');

$.lang.register('adventuresystem.stories.4.title', 'Cereal');
$.lang.register('adventuresystem.stories.4.chapter.1', 'I think we have a much bigger thread on our hands than the cave in... It is half man, half bear, half pig... Don\'t Laugh, I\'M SUPER CEREAL!');
$.lang.register('adventuresystem.stories.4.chapter.2', '/me As the adventurers work their way through the tunnels they hear a soft noise from behind them...');
$.lang.register('adventuresystem.stories.4.chapter.3', 'Look out! It\'s ManBearPig! (caught) get dragged of into the darkness.');
$.lang.register('adventuresystem.stories.4.chapter.4', '(survivors) run away. Let\'s get out of here guys! We can\'t deal with this alone');


/*
 * Rules on writing your own adventure story:
 *
 * - Stories are automatically loaded from this file by their sequence number (adventuresystem.stories.[This number]).
 * - Keep the format of your story as shown above.
 * - There can be an unlimited number of stories, IF you keep their subsequence numbers 1, 2, 3, 4, 5...
 * - A story must have a title.
 * - A story can have an unlimited number of chapters, IF you keep their subsequence numbers 1, 2, 3, 4, 5...
 * - Stories are picked at random.
 *
 * Underneath is a template for your first custom story, just remove the preceding slashes.
 */

//$.lang.register('adventuresystem.stories.5.title', '');
//$.lang.register('adventuresystem.stories.5.chapter.1', '');
//$.lang.register('adventuresystem.stories.5.chapter.2', '');
//$.lang.register('adventuresystem.stories.5.chapter.3', '');