$.lang.register('adventuresystem.adventure.cooldown', 'The adventure is still cooling down! $1 to go.');
$.lang.register('adventuresystem.adventure.usage', 'Verwendung: !adventure [$1].');
$.lang.register('adventuresystem.alreadyjoined', 'Du bist bereits dem Abenteuer beigetreten!');
$.lang.register('adventuresystem.completed', 'Das Abenteuer endet mit $1 Überlebende(n) und $2 Tote(n).');
$.lang.register('adventuresystem.join.bettoohigh', 'Du kannst nicht mit $1 beitreten, das Maximum ist $2.');
$.lang.register('adventuresystem.join.bettoolow', 'Du kannst nicht mit $1 beitreten, das Minimum ist $2.');
$.lang.register('adventuresystem.join.needpoints', 'Du kannst nicht mit $1 beitreten, du hast nur $2..');
$.lang.register('adventuresystem.join.notpossible', 'Du kannst jetzt nicht beitreten.');
$.lang.register('adventuresystem.join.success', 'Du bist dem Abenteuer mit $1 beigetreten!');
$.lang.register('adventuresystem.loaded', 'Abenteuergeschichten geladen (gefunden $1).');
$.lang.register('adventuresystem.payoutwhisper', 'Abenteuer abgeschlossen, $1 + $2 wurde deinem Konto gutgeschrieben.');
$.lang.register('adventuresystem.runstory', 'Starte Abenteuer "$1" mit $2 Spieler(n).');
$.lang.register('adventuresystem.set.success', 'Set $1 to $2.');
$.lang.register('adventuresystem.set.usage', 'Verwendung: !adventure set [settingname] [value].');
$.lang.register('adventuresystem.start.success', '$1 versucht ein Team für ein Abenteuer zusammenzustellen! Benutze "!adventure [$2]" um beizutreten!');
$.lang.register('adventuresystem.tamagotchijoined', '$1 ist dem Abenteuer ebenfalls beigetreten.');
$.lang.register('adventuresystem.top5', 'Die Top 5 Abendteuerer sind: $1.');
$.lang.register('adventuresystem.top5.empty', 'Es gibt bisher keine Gewinner von Abenteuern.');

$.lang.register('adventuresystem.stories.1.title', 'Zeitraub');
$.lang.register('adventuresystem.stories.1.chapter.1', 'Deine Erinnerung ist verschwommen, auf einen Tisch ist ein kleiner Laptop und spielt ein Video: "Meine Name ist Der Architekt. Die Bank von Karabraxos ist die am besten gesicherste Bank im ganzen Universum. Du wirst die Bank von Karabraxos ausrauben!"');
$.lang.register('adventuresystem.stories.1.chapter.2', 'Unfähig einen klaren Kopf zu bewahren, (caught) slowly feel their mind being drained as The Teller feeds on their thoughts.');
$.lang.register('adventuresystem.stories.1.chapter.3', 'We find ourselves back in the room we started in as consciousness of (survivors) slowly fades again, only to wake up in our beds like nothing at all has happened.');

$.lang.register('adventuresystem.stories.2.title', 'Bärenfalle');
$.lang.register('adventuresystem.stories.2.chapter.1', 'Freunde! Ich habe die Koordinaten für eine geheimes Versteck mit Pfeilen, versteckt im inneren des Elfenwaldes. We should shoe up and give this a go!');
$.lang.register('adventuresystem.stories.2.chapter.2', 'Passt auf, Bärenfallen! (caught) wurden die Beine angetrennt!');
$.lang.register('adventuresystem.stories.2.chapter.3', 'Verdammt, that was a close call for loosing a leg. Aber ihr habt es verdient (survivors)!');

$.lang.register('adventuresystem.stories.3.title', 'Vampiere?!');
$.lang.register('adventuresystem.stories.3.chapter.1', 'Ah, meine lieben Freunde! I may have found the adventure of a lifetime. Namely the house of count Dracula is believed to be the bolts master! I\'m for going now!');
$.lang.register('adventuresystem.stories.3.chapter.2', 'Er ist es! (caught) wurde brutal abgeschlachtet!');
$.lang.register('adventuresystem.stories.3.chapter.3', 'Das war knapp, ich denke ich wurde nicht gebiessen. du? Ow well, (survivors), here\'s your share! ~Transforms into a bat and flutters off~');

$.lang.register('adventuresystem.stories.4.title', 'Cereal');
$.lang.register('adventuresystem.stories.4.chapter.1', 'I think we have a much bigger thread on our hands than the cave in... es ist halb Mensch, halb Bär, halb Schwein... Lacht nicht, I\'M SUPER CEREAL!');
$.lang.register('adventuresystem.stories.4.chapter.2', '/me As the adventurers work their way through the tunnels they hear a soft noise from behind them...');
$.lang.register('adventuresystem.stories.4.chapter.3', 'Look out! It\'s ManBearPig! (caught) get dragged of into the darkness.');
$.lang.register('adventuresystem.stories.4.chapter.4', '(survivors) run away. Let\'s get out of here guys! We can\'t deal with this alone');

$.lang.register('adventuresystem.stories.5.title', 'Banküberfall');
$.lang.register('adventuresystem.stories.5.chapter.1', 'Das Telefon klingelt. "Ihr müsst einen Job für mich erledigen", sagt die Stimme am anderen Ende der Leitung. "Ich habe Geiseln hier und werde ihnen wehtun wenn ihr nicht macht was ich sage", so die Stimme weiter. Ihr macht euch auf den Weg zur Bank');
$.lang.register('adventuresystem.stories.5.chapter.2', 'Die Metalldetektoren wurden ausgelöst und nach kurzer Zeit war das Gebäude umstellt. (caught) wurde bei der Flucht erschossen!');
$.lang.register('adventuresystem.stories.5.chapter.5', 'Oh mann, (survivors), ihr habt es geschafft');

/*
 * Regeln zum Schreiben von eigenen Abenteuergeschichten
 *
 * - Geschichten werden automatisch von dieser Datei anhand der Reihenfolge geladen (adventuresystem.stories.[Nummer]).
 * - Behalte das Format von deiner Geschichte wie oben gezeigt.
 * - Es kann unbegrenzt viele Geschichten geben, WENN du die Reihenfolgen 1, 2, 3, 4, 5... einhältst
 * - Eine Geschichte muss einen Titel haben
 * - Eine Geschichte kann unbegrenzt viele Kapitel haben, WENN du die Reihenfolgen 1, 2, 3, 4, 5... einhältst
 * - Geschichten werden zufällig ausgewählt
 *
 * Unten ist eine Vorlage für deine erste eigene Geschichte, entferne nur die führenden Slashes
 */

//$.lang.register('adventuresystem.stories.5.title', '');
//$.lang.register('adventuresystem.stories.5.chapter.1', '');
//$.lang.register('adventuresystem.stories.5.chapter.2', '');
//$.lang.register('adventuresystem.stories.5.chapter.3', '');