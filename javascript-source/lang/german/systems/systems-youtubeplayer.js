/*
 * Copyright (C) 2016-2020 phantombot.dev
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

$.lang.register('ytplayer.command.nextsong.amount', 'Nächste $1 Titel: $2');
$.lang.register('ytplayer.command.wrongsong.404', 'Keine Musiktitel gefunden!');
$.lang.register('ytplayer.command.volume.set', 'Setze YouTube Player Lautstärke: $1');
$.lang.register('ytplayer.command.importpl.file.404', 'Kann Datei $1 nicht finden!');
$.lang.register('ytplayer.announce.nextsong', '[\u266B] Abgespielt wird [$1], angefragt von: $2');
$.lang.register('ytplayer.command.playlist.add.failed', 'Hinzufügen zur Playlist fehlgeschlagen: $1');
$.lang.register('ytplayer.command.playlist.delete.success', 'Playlist [$1] gelöscht!');
$.lang.register('ytplayer.command.jumptosong.failed', 'Kann den Song an der Playlistposition $1 nicht finden.');
$.lang.register('ytplayer.command.nextsong.404', 'Musikwunsch-Warteliste ist leer.');
$.lang.register('ytplayer.command.songrequest.usage', 'Verwendung: !songrequest [YouTube ID | YouTube Link | Suchbegriff]');
$.lang.register('ytplayer.command.skip.skipping', 'Die Stimmen wurden gezählt uns die Zuschauer haben gesprochen!!! Überspringe den aktuellen Titel!');
$.lang.register('ytplayer.command.skip.success', 'Überspringen angefragt! Der aktuelle Titel wird mit $1 mehr Stimmen übersprungen!');
$.lang.register('ytplayer.command.ytp.resetdefaultlist.active', 'Dies muss ausgeführt werden, wenn der YouTube-Player nicht verbunden ist.');
$.lang.register('ytplayer.command.wrongsong.success', 'Letzten Musikwunsch, [$1], entfernt.');
$.lang.register('ytplayer.command.playlist.load.success', 'Playlist [$1] geladen!');
$.lang.register('ytplayer.command.playlist.usage', 'Verwendung: !playlist [add | delete | loadpl | deletepl | listpl | importpl]');
$.lang.register('ytplayer.command.ytp.togglestealrefund.disable', 'Gestohlene Songs von YouTube Player werden den Benutzern NICHT zurückerstattet.');
$.lang.register('ytplayer.command.ytp.setmaxvidlength.usage', 'Verwendung: !ytp setmaxvidlength [Sekunden]');
$.lang.register('ytplayer.requestsong.error.maxlength', 'Musiktitellänge beträgt $1 und überschreitet die maximal zulässige Länge!');
$.lang.register('ytplayer.command.ytp.clearcache.success', 'Der YouTube Player ID-Cache wurde geleert.');
$.lang.register('ytplayer.blacklist.remove.success.song', 'Song/Schlüsselwort: "$1" wurde von der Blacklist entfernt.');
$.lang.register('ytplayer.command.songrequest.failed', 'Hinzufügen von $1, zur Warteschlange, fehlgeschlagen.');
$.lang.register('ytplayer.command.nextsong.single', 'Nächster Titel: $1');
$.lang.register('ytplayer.command.delrequest.success', 'Song mit der ID [$1], dem Titel [$2], aus den Musikwünschen entfernt.');
$.lang.register('ytplayer.blacklist.remove.success', '$1 wurde von der Blacklist, zur Verwendung des Musikwunsch-Features, entfernt.');
$.lang.register('ytplayer.blacklist.add.usage', 'Verwendung: !ytp blacklistuser add [BenutzerInnenname]');
$.lang.register('ytplayer.command.playlist.listpl', 'Playlisten: $1');
$.lang.register('ytplayer.command.votecount.negative', 'Die Anzahl an Stimmen muss positiv sein!');
$.lang.register('ytplayer.command.wrongsong.usage', 'Verwendung: !wrongsong [Songtitel] [BenutzerInnenname]. Ohne Angabe von [BenutzerInnenname], wird einfach der letzte Musikwunsch gelöscht.');
$.lang.register('ytplayer.command.playlist.load.usage', 'Verwendung: !playlist loadpl [Playlistname]');
$.lang.register('ytplayer.command.nextsong.range.404', 'Keine Musiktitel in diesem Bereich gefunden.');
$.lang.register('ytplayer.command.ytp.resetdefaultlist.success', 'Die Standard-Playlist wurde zurückgesetzt.');
$.lang.register('ytplayer.console.client.connected', '[\u266B] YouTube Player ist verbunden! [\u266B]');
$.lang.register('ytplayer.command.ytp.clearcache.warning', 'Dies entfernt alle im Cache befindlichen YouTube Player-IDs. Wenn Sie sicher sind, führen Sie jetzt !ytp clearcache aus.');
$.lang.register('ytplayer.command.delrequest.404', 'Die Musikwünsche enthalten keinen Song mit der ID [$1].');
$.lang.register('ytplayer.blacklist.usage.song', 'Verwendung: !ytp blacklist [add / remove]');
$.lang.register('ytplayer.command.currentsong.404', 'Es gibt keinen aktuellen Song.');
$.lang.register('ytplayer.requestsong.error.yterror', 'YouTube Fehler ($1)!');
$.lang.register('ytplayer.command.playlist.delete.usage', 'Verwendung: !playlist deletepl [Playlistname]');
$.lang.register('ytplayer.command.previoussong', 'Vorheriger Musikwunsch war [$1], gewünscht von $2 aus $3');
$.lang.register('ytplayer.command.playlist.delete.404', 'Playlist [$1] existiert nicht!');
$.lang.register('ytplayer.command.ytp.usage', 'Verwendung: !ytp [togglecconly | togglesongrequest | toggleanounce | delrequest | pause | volume | togglerandom | setrequestmax | setmaxvidlength | votecount | resetdefaultlist | clearcache]');
$.lang.register('ytplayer.command.importpl.file.registry404', 'Liste $1 wurde in der Datenbank nicht erstellt, versuche es nochmal.');
$.lang.register('ytplayer.command.playlist.load.success.new', 'Leere Playlist [$1] geladen!');
$.lang.register('ytplayer.command.nextsong.usage', 'Verwendung: !nextsong [index number | next [n] | list [x-y]. Zeigt den nächsten Song oder Titel anhand der Indexnummer (index number), den nächsten [n] Song oder einen Bereich der Liste [x-y].');
$.lang.register('ytplayer.command.ytp.togglecconly.disable', 'YouTube Player spielt alle lizenzierten Songs ab.');
$.lang.register('ytplayer.command.stealsong.other.success', '$1 hat den aktuellen Song zur Playlist, [$2], hizugefügt.');
$.lang.register('ytplayer.command.playlist.add.usage', 'Verwendung: !ytp playlist add [Youtube Link]');
$.lang.register('ytplayer.command.skip.failure', 'Du hast bereits das Überspringen des Titels beantragt.');
$.lang.register('ytplayer.command.wrongsong.user.success', 'Letzten Musikwunsch, $2 ,erfolgreich von $1 entfernt.');
$.lang.register('ytplayer.command.importpl.file.success', 'Import abgeschlossen! Erfolgreich $1 Musiktitel importiert, hinzufügen von $2 Musiktitel(n) aus $3, zur Playlist $4, fehlgeschlagen.');
$.lang.register('ytplayer.requestsong.error.disabled', 'Musikwünsche sind deaktiviert!');
$.lang.register('ytplayer.playlist.404', 'Kann Playlist [$1] nicht finden!');
$.lang.register('ytplayer.command.ytp.togglecconly.enable', 'YouTube Player spielt nur Creative Commons lizenzierte Songs ab.');
$.lang.register('ytplayer.command.ytp.setrequestmax.success', 'Maximale Anzahl gleichzeitiger Musikwünsche auf $1 gesetzt.');
$.lang.register('ytplayer.command.stealsong.this.success', '$1 hat den aktuellen Song zur Playlist hinzugefügt.');
$.lang.register('ytplayer.command.skip.disabled', 'Die Abstimmfunktion ist derzeit deaktiviert.');
$.lang.register('ytplayer.console.client.disconnected', '[\u266B] YouTube Player ist getrennt! [\u266B]');
$.lang.register('ytplayer.command.songrequest.success', 'Dein Titel "$1", wurde zur Warteliste hinzugefügt. (Position: $2 ID: $3)');
$.lang.register('ytplayer.blacklisted', 'Du wurdest auf die schwarze Liste, für die Verwendung des Musikwunsch-Features, gesetzt!');
$.lang.register('ytplayer.command.importpl.file.start', 'Import gestartet, bitte warten...');
$.lang.register('ytplayer.blacklist.404', 'Liedtitel wurde auf die schwarze Liste gesetzt.');
$.lang.register('ytplayer.command.playlist.delete.isdefault', 'Kann Standardplaylist nicht löschen!');
$.lang.register('ytplayer.command.ytp.setdjname.success', 'DJ Name zu $1 geändert.');
$.lang.register('ytplayer.command.ytp.toggleannounce.toggled', 'YouTube Player Ankündigungen wurden $1');
$.lang.register('ytplayer.command.delrequest.usage', 'Verwendung: !ytp delrequest [YouTube ID]');
$.lang.register('ytplayer.command.ytp.togglerandom.toggled', 'YouTube Player Playlist Randomisierung wurde $1');
$.lang.register('ytplayer.command.findsong.failed', 'Kann keinen Song mit einem Titel finden, der $1 enthält.');
$.lang.register('ytplayer.command.volume.get', 'Aktuelle YouTube Player Lautstärke: $1');
$.lang.register('ytplayer.command.ytp.setmaxvidlength.success', 'Maximale Musiktitel-Länge auf $1 Sekunden gesetzt.');
$.lang.register('ytplayer.command.importpl.file.success.plerror', 'Import Abgeschlossen! Erfolgreich $1 Titel importiert, $2 konnten nicht von $3 zur Playlist $4 hinzugefügt werden. $5 Playlist(en) übersprungen.');
$.lang.register('ytplayer.command.ytp.setrequestmax.usage', 'Verwendung: !ytp setrequestmax [Max. Anfragen]');
$.lang.register('ytplayer.command.ytp.togglestealrefund.enable', 'Gestohlene Songs vom YouTube Player werden den Benutzern zurückerstattet.');
$.lang.register('ytplayer.command.stealsong.duplicate', 'Dieser Song ist bereits in der PLaylist!');
$.lang.register('ytplayer.command.playlist.add.success', '[$1] erfolgreich zur Playlist [$2] hinzugefügt!');
$.lang.register('ytplayer.command.votecount.usage', '!ytp votecount [Anzahl] --- Aktuelle Einstellung: $1');
$.lang.register('ytplayer.command.importpl.file.usage', 'Verwendung: !importpl file [Playlistname] [Dateiname]');
$.lang.register('ytplayer.command.currentsong', 'Aktueller Musikwunsch ist [$1], gewünscht von $2 aus $3');
$.lang.register('ytplayer.blacklist.add.usage.song', 'Verwendung: !ytp blacklist add [Name/Schlüsselwort]');
$.lang.register('ytplayer.command.skip.delay', 'Überspringen ist im Moment nicht erlaubt, bitte versuche es später noch einmal.');
$.lang.register('ytplayer.command.stealsong.refund', '$1 erhielt für seinen/ihren übermittelten Song eine Gutschrift von $2 $3 auf sein/ihr Punktekonto!');
$.lang.register('ytplayer.blacklist.add.success.song', 'Song/Schlüsselwort: "$1" wurde der Blacklist hinzugefügt.');
$.lang.register('ytplayer.command.votecount.set', 'Minimale Anzahl an Stimmen um Musiktitel zu überspringen: $1');
$.lang.register('ytplayer.requestsong.error.exists', 'Musikwunsch ist bereits auf der Warteliste!');
$.lang.register('ytplayer.command.previoussong.404', 'Es gibt keinen vorherigen Songtitel anzuzeigen.');
$.lang.register('ytplayer.songrequests.disabled', '[\u266B] Musikwünsche sind nun deaktiviert! [\u266B]');
$.lang.register('ytplayer.blacklist.remove.usage.song', 'Verwendung: !ytp blacklist remove [Name]');
$.lang.register('ytplayer.command.ytp.setdjname.usage', 'Verwendung: !ytp setdjname [Name]');
$.lang.register('ytplayer.requestsong.error.maxrequests', 'Überschreitet die maximal zulässigen, gleichzeitigen, Zugriffe!');
$.lang.register('ytplayer.songrequests.enabled', '[\u266B] Musikwünsche sind nun aktiviert! [\u266B]');
$.lang.register('ytplayer.blacklist.add.success', '$1 wurde der Blacklist, zur Verwendung des Musikwunsch-Features, hinzugefügt.');
$.lang.register('ytplayer.command.nextsong.range', 'Titel im Bereich: $1');
$.lang.register('ytplayer.blacklist.usage', 'Verwendung: !ytp blacklistuser [add / remove]');
$.lang.register('ytplayer.command.jumptosong.usage', 'Verwendung: !$1 [Positionsnummer]');
$.lang.register('ytplayer.blacklist.remove.usage', 'Verwendung: !ytp blacklistuser remove [Benutzername]');
$.lang.register('ytplayer.client.404', 'Der YouTube Player ist nicht verbunden!');
$.lang.register('ytplayer.command.findsong.usage', 'Verwendung: !$1 [Suchtext]. Durchsucht Song-Anfragen, falls vorhanden, sonst die aktuelle Playlist, nach der ersten Übereinstimmung.');
