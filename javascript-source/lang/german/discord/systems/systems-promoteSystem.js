/*
 * Copyright (C) 2016-2018 phantombot.tv
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

$.lang.register('discord.promotesystem.cmd.promote.usage', '!promote add [kurze Beschreibung] | delete - Füge hinzu oder lösche dich selbst von der Promotion.');
$.lang.register('discord.promotesystem.cmd.promote.noselfmanage', 'Niemand darf sich selbst verwalten, bitte sprechen Sie mit einem Moderator, der dich hinzufügt oder löscht.');
$.lang.register('discord.promotesystem.cmd.promote.nochannels', 'Bitten Sie einen Administrator, einen Werbekanal mit !promote channel und/oder !promote streamchannel einzurichten.');
$.lang.register('discord.promotesystem.cmd.promote.revoked', 'Du darfst dich nicht mehr selbst hinzufügen.');

$.lang.register('discord.promotesystem.cmd.promote.add.nobio', 'Sie müssen eine kurze Biographie angeben oder das Schlüsselwort "none" (!promote add none) verwenden.');
$.lang.register('discord.promotesystem.cmd.promote.add.success', 'Du ($1) wirst jetzt promotet.');
$.lang.register('discord.promotesystem.cmd.promote.del.success', 'Du ($1) wirst nicht mehr promotet.');

$.lang.register('discord.promotesystem.cmd.promoteadm.usage', '!promoteadm add | delete | so | channel | streamchannel | revoke | allow | toggleselfmanage | togglestats | togglebanner | list | setinterval');
$.lang.register('discord.promotesystem.cmd.promoteadm.nochannels', 'Setze Kanäle mit !promoteadm Kanal und/oder !promoteadm Streamchannel.');
$.lang.register('discord.promotesystem.cmd.promoteadm.noacct', 'Dieses Konto scheint in Twitch nicht zu existieren: $1');

$.lang.register('discord.promotesystem.cmd.promoteadm.add.nouser', 'Wen möchtest du promoten?');
$.lang.register('discord.promotesystem.cmd.promoteadm.add.nobio', 'Sie müssen eine kurze Biographie angeben oder das Schlüsselwort "none" verwenden (!promoteadm add user none).');
$.lang.register('discord.promotesystem.cmd.promoteadm.add.success', '$1 wird nun promotet.');
$.lang.register('discord.promotesystem.cmd.promoteadm.del.nouser', 'Wen möchten Sie von der Promotion ausschließen?');
$.lang.register('discord.promotesystem.cmd.promoteadm.del.success', '$1 wird nicht mehr promotet.');

$.lang.register('discord.promotesystem.cmd.promoteadm.channel.nochannel', 'Welchen Kanal für Promotionen nutzen? Um den aktuellen Kanal zu entfernen, verwenden Sie !promoteadm channel clear.');
$.lang.register('discord.promotesystem.cmd.promoteadm.channel.cleared', 'Der Promo-Kanal wurde gelöscht.');
$.lang.register('discord.promotesystem.cmd.promoteadm.channel.success', 'Der Promo-Kanal wurde eingestellt auf: #$1');

$.lang.register('discord.promotesystem.cmd.promoteadm.streamchannel.nochannel', 'Welchen Kanal für Stream-Ankündigungen verwenden? Um den aktuellen Kanal zu entfernen, verwenden Sie !promoteadm streamchannel clear.');
$.lang.register('discord.promotesystem.cmd.promoteadm.streamchannel.cleared', 'Der Stream-Ankündigungskanal wurde gelöscht.');
$.lang.register('discord.promotesystem.cmd.promoteadm.streamchannel.success', 'Der Stream-Ankündigungskanal wurde gesetzt auf: #$1');

$.lang.register('discord.promotesystem.cmd.promoteadm.revoke.nouser', 'Entzug der Berechtigung welche Benutzer sich selbst hinzufügen können?');
$.lang.register('discord.promotesystem.cmd.promoteadm.revoke.success', '$1 wird nicht mehr promotet und kann sich nicht mehr selbst verwalten.');

$.lang.register('discord.promotesystem.cmd.promoteadm.allow.nouser', 'Welchem Benutzer erlauben, sich wieder hinzufügen zu können?');
$.lang.register('discord.promotesystem.cmd.promoteadm.allow.success', '$1 darf sich wieder selbst hinzufügen.');

$.lang.register('discord.promotesystem.cmd.promoteadm.toggleselfmanage.off', 'Benutzer können sich nicht mehr über !promote add and delete selbst verwalten.');
$.lang.register('discord.promotesystem.cmd.promoteadm.toggleselfmanage.on', 'Benutzer können sich nun über !promote add and delete selbst verwalten.');

$.lang.register('discord.promotesystem.cmd.promoteadm.togglestats.off', 'Statistiken werden nicht mehr angezeigt, wenn ein Stream angekündigt wird.');
$.lang.register('discord.promotesystem.cmd.promoteadm.togglestats.on', 'Statistiken werden nun angezeigt, wenn ein Stream angekündigt wird.');

$.lang.register('discord.promotesystem.cmd.promoteadm.togglebanner.off', 'Banner werden nicht mehr angezeigt, wenn ein Stream angekündigt wird.');
$.lang.register('discord.promotesystem.cmd.promoteadm.togglebanner.on', 'Banner werden nun angezeigt, wenn ein Stream angekündigt wird.');

$.lang.register('discord.promotesystem.cmd.promoteadm.list.empty', 'Derzeit werden keine Benutzer promotet.');
$.lang.register('discord.promotesystem.cmd.promoteadm.list.success', 'Benutzer werden promotet: $1');

$.lang.register('discord.promotesystem.cmd.promoteadm.setinterval.nominutes', 'Geben Sie ein Intervall in Minuten an.');
$.lang.register('discord.promotesystem.cmd.promoteadm.setinterval.toolow', 'Das Intervall sollte 15 Minuten oder mehr betragen, um den Kanal nicht zu spammen.');
$.lang.register('discord.promotesystem.cmd.promoteadm.setinterval.success', 'Das Intervall für die Promotion von Streamern wurde auf $1 Minuten festgelegt.');

$.lang.register('discord.promotesystem.cmd.so.nouser', 'Du musst einen Benutzer zum Nachschlagen und Ausrufen bereitstellen.');
$.lang.register('discord.promotesystem.cmd.so.noexist', 'Dieser Benutzer wird derzeit nicht befördert. Check !promoteadm Liste');

$.lang.register('discord.promotesystem.livemsg.title', '$1 ist LIVE @ https://twitch.tv/$2');
$.lang.register('discord.promotesystem.livemsg.nowplaying', 'Spielt gerade');
$.lang.register('discord.promotesystem.livemsg.streamtitle', 'Stream Titel');
$.lang.register('discord.promotesystem.livemsg.followers', 'Follower');
$.lang.register('discord.promotesystem.livemsg.views', 'Aufrufe');
$.lang.register('discord.promotesystem.livemsg.missingtitle', 'Kein Titel angegeben');
$.lang.register('discord.promotesystem.livemsg.missinggame', 'Kein Spiel vorhanden');

$.lang.register('discord.promotesystem.promotemsg.description', 'Vergessen Sie nicht, $1 zu folgen und anzusehen. ');
$.lang.register('discord.promotesystem.promotemsg.biography', 'Bio');
$.lang.register('discord.promotesystem.promotemsg.nobio', 'Keine Biographie vorhanden.');
