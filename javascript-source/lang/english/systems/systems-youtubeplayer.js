/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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

$.lang.register('ytplayer.client.404', 'The YouTube Player is currently not being used, and song requests are disabled!');
$.lang.register('ytplayer.playlist.404', 'Cannot find playlist [$1]');
$.lang.register('ytplayer.announce.nextsong', '[\u266B] Now Playing [$1] Requester: $2');

$.lang.register('ytplayer.console.client.connected', '[\u266B] YouTube Player is connected! [\u266B]');
$.lang.register('ytplayer.console.client.disconnected', '[\u266B] YouTube Player is disconnected! [\u266B]');

$.lang.register('ytplayer.songrequests.enabled', '[\u266B] Song requests are enabled! [\u266B]');
$.lang.register('ytplayer.songrequests.disabled', '[\u266B] Song requests have been disabled! [\u266B]');

$.lang.register('ytplayer.command.volume.get', 'Current YouTube Player Volume: $1');
$.lang.register('ytplayer.command.volume.set', 'Set YouTube Player Volume: $1');

$.lang.register('ytplayer.command.ytp.resetdefaultlist.active', 'This must be ran when the YouTube Player is not connected.');
$.lang.register('ytplayer.command.ytp.resetdefaultlist.success', 'The default playlist has been reset.');

$.lang.register('ytplayer.command.ytp.togglecconly.enable', 'YouTube Player will only play Creative Commons licensed songs.');
$.lang.register('ytplayer.command.ytp.togglecconly.disable', 'YouTube Player will play all licensed songs.');

$.lang.register('ytplayer.command.ytp.togglestealrefund.enable', 'YouTube Player stolen songs will be refunded to users.');
$.lang.register('ytplayer.command.ytp.togglestealrefund.disable', 'YouTube Player stolen songs will NOT be refunded to users.');

$.lang.register('ytplayer.command.ytp.togglerandom.toggled', 'YouTube Player Playlist Randomization has been $1');
$.lang.register('ytplayer.command.ytp.toggleannounce.toggled', 'YouTube Player Announcements have been $1');

$.lang.register('ytplayer.command.ytp.setrequestmax.usage', 'Usage: !ytp setrequestmax [max requests]');
$.lang.register('ytplayer.command.ytp.setrequestmax.success', 'Maximum concurrent song requests set to $1');

$.lang.register('ytplayer.command.ytp.setmaxvidlength.usage', 'Usage: !ytp setmaxvidlength [seconds]');
$.lang.register('ytplayer.command.ytp.setmaxvidlength.success', 'Maximum song request length set to $1 seconds.');

$.lang.register('ytplayer.command.ytp.setdjname.usage', 'Usage: !ytp setdjname [name]');
$.lang.register('ytplayer.command.ytp.setdjname.success', 'Changed DJ name to $1');

$.lang.register('ytplayer.command.playlist.usage', 'Usage: !playlist [add | delete | loadpl | deletepl | listpl | importpl]');
$.lang.register('ytplayer.command.playlist.add.failed', 'Failed to add song to playlist: $1');
$.lang.register('ytplayer.command.playlist.add.usage', 'Usage: !ytp playlist add [youtube link]');
$.lang.register('ytplayer.command.playlist.add.success', 'Success adding [$1] to playlist [$2]');
$.lang.register('ytplayer.command.playlist.load.success.new', 'Loaded empty playlist [$1]');
$.lang.register('ytplayer.command.playlist.load.success', 'Loaded playlist [$1]');
$.lang.register('ytplayer.command.playlist.load.usage', 'Usage: !playlist loadpl [playlist name]');
$.lang.register('ytplayer.command.playlist.delete.isdefault', 'Cannot delete default playlist!');
$.lang.register('ytplayer.command.playlist.delete.success', 'Deleted playlist [$1]');
$.lang.register('ytplayer.command.playlist.delete.404', 'Playlist [$1] does not exist!');
$.lang.register('ytplayer.command.playlist.delete.usage', 'Usage: !playlist deletepl [playlist name]');
$.lang.register('ytplayer.command.playlist.listpl', 'Playlists: $1');

$.lang.register('ytplayer.command.stealsong.this.success', '$1 copied the current song to the playlist.');
$.lang.register('ytplayer.command.stealsong.other.success', '$1 copied the current song to the [$2] playlist.');
$.lang.register('ytplayer.command.stealsong.refund', '$1 received a refund of $2 $3 on their song request!');
$.lang.register('ytplayer.command.stealsong.duplicate', 'Song is already in the playlist!');

$.lang.register('ytplayer.command.jumptosong.failed', 'Cannot find song at position $1 in playlist.');
$.lang.register('ytplayer.command.jumptosong.usage', 'usage: !$1 [position number]');

$.lang.register('ytplayer.command.findsong.failed', 'Cannot find song with a title that contains $1');
$.lang.register('ytplayer.command.findsong.usage', 'usage: !$1 [search string]. Searches song requests if any exist, else current playlist, for first match.');

$.lang.register('ytplayer.command.songrequest.usage', 'Usage: !songrequest [YouTube ID | YouTube link | search string]');
$.lang.register('ytplayer.command.songrequest.success', 'Your song "$1" has been added to the queue (Position: $2 ID: $3)');
$.lang.register('ytplayer.command.songrequest.failed', 'Failed adding song to queue: $1');

$.lang.register('ytplayer.command.previoussong', 'Previous song was [$1] requested by $2 from $3');
$.lang.register('ytplayer.command.previoussong.404', 'There is not a previous song to report');

$.lang.register('ytplayer.command.currentsong', 'Current song is [$1] requested by $2 from $3');
$.lang.register('ytplayer.command.currentsong.404', 'There is not a curent song');

$.lang.register('ytplayer.command.delrequest.success', 'Removed song with ID [$1] and title of [$2] from song requests.');
$.lang.register('ytplayer.command.delrequest.404', 'Song requests do not have a song with an ID of [$1]');
$.lang.register('ytplayer.command.delrequest.usage', 'Usage: !ytp delrequest [YouTube ID]');

$.lang.register('ytplayer.command.ytp.clearcache.warning', 'This will remove all cached YouTube Player IDs. If you are sure, run !ytp clearcache now');
$.lang.register('ytplayer.command.ytp.clearcache.success', 'YouTube Player ID cache has been cleared.');

$.lang.register('ytplayer.command.ytp.usage', 'Usage: !ytp [togglecconly | togglesongrequest | toggleannounce | delrequest | pause | volume | togglerandom | setrequestmax | setmaxvidlength | votecount | resetdefaultlist | clearcache]');

$.lang.register('ytplayer.command.wrongsong.success', 'Removed last requested song: [$1]');
$.lang.register('ytplayer.command.wrongsong.404', 'No songs found');
$.lang.register('ytplayer.command.wrongsong.user.success', 'Removed last requested song from $1: [$2]');
$.lang.register('ytplayer.command.wrongsong.usage', 'Usage: !wrongsong [user] [username]. Without [user] deletes your last request.');

$.lang.register('ytplayer.command.nextsong.single', 'Next Song: $1');
$.lang.register('ytplayer.command.nextsong.amount', 'Next $1 Songs: $2');
$.lang.register('ytplayer.command.nextsong.range', 'Songs in Range: $1');
$.lang.register('ytplayer.command.nextsong.usage', 'Usage: !nextsong [index number | next [n] | list [x-y]. Display next song, or title at index number or next n songs or a range with list x-y');
$.lang.register('ytplayer.command.nextsong.404', 'Song request queue is empty.');
$.lang.register('ytplayer.command.nextsong.range.404', 'No songs found in that range.');

$.lang.register('ytplayer.requestsong.error.maxrequests', 'Exceeds maximum concurrent requests');
$.lang.register('ytplayer.requestsong.error.disabled', 'Song requests are disabled');
$.lang.register('ytplayer.requestsong.error.yterror', 'YouTube error ($1)');
$.lang.register('ytplayer.requestsong.error.exists', 'Song is already in queue');
$.lang.register('ytplayer.requestsong.error.maxlength', 'Song length is $1 and exceeds maximum length');

$.lang.register('ytplayer.command.importpl.file.start', 'Import has started, please wait...');
$.lang.register('ytplayer.command.importpl.file.success', 'Import Complete! Successfully imported $1 songs and failed to import $2 songs from $3 to playlist $4');
$.lang.register('ytplayer.command.importpl.file.success.plerror', 'Import Complete! Successfully imported $1 songs and failed to import $2 songs from $3 to playlist $4. Skipped $5 playlist(s).');
$.lang.register('ytplayer.command.importpl.file.404', 'Could not find file $1');
$.lang.register('ytplayer.command.importpl.file.registry404', 'List $1 was not created in DB, try again.');
$.lang.register('ytplayer.command.importpl.file.usage', 'Usage: !playlist importpl file [playlist name] [filename]');

$.lang.register('ytplayer.blacklisted', 'You have been blacklisted from using the songrequest feature.');
$.lang.register('ytplayer.blacklist.usage', 'Usage: !ytp blacklistuser [add / remove]');
$.lang.register('ytplayer.blacklist.add.usage', 'Usage: !ytp blacklistuser add [username]');
$.lang.register('ytplayer.blacklist.add.success', '$1 has been blacklisted from using the songrequests feature.');
$.lang.register('ytplayer.blacklist.remove.usage', 'Usage: !ytp blacklistuser remove [username]');
$.lang.register('ytplayer.blacklist.remove.success', '$1 has been un-blacklisted from using the songrequests feature.');
$.lang.register('ytplayer.blacklist.usage.song', 'Usage: !ytp blacklist [add / remove]');
$.lang.register('ytplayer.blacklist.add.usage.song', 'Usage: !ytp blacklist add [name/keyword]');
$.lang.register('ytplayer.blacklist.add.success.song', 'Song/Keyword: "$1" has been added to the blacklist.');
$.lang.register('ytplayer.blacklist.remove.usage.song', 'Usage: !ytp blacklist remove [name]');
$.lang.register('ytplayer.blacklist.remove.success.song', 'Song/Keyword: "$1" has been removed from the blacklist.');
$.lang.register('ytplayer.blacklist.404', 'Song name has been blacklisted.');

$.lang.register('ytplayer.command.skip.success', 'Skip requested! Current song will be skipped in $1 more votes.');
$.lang.register('ytplayer.command.skip.disabled', 'The vote functionality is currently disabled.');
$.lang.register('ytplayer.command.skip.failure', 'You have already requested a skip for the current song.');
$.lang.register('ytplayer.command.skip.skipping', 'The votes are counted, and the users have spoken!!! Skipping the current song!.');
$.lang.register('ytplayer.command.skip.delay', 'Skip is not allowed for a moment, please try again later.');
$.lang.register('ytplayer.command.votecount.set', 'Minimum votes now needed for viewers to skip songs: $1');
$.lang.register('ytplayer.command.votecount.negative', 'The number of votes needed must be positive!');
$.lang.register('ytplayer.command.votecount.usage', '!ytp votecount [amount]  ---  Current setting: $1');
