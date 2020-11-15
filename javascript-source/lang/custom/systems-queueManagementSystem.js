/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


$.lang.register('songqueuemgmt.command.bumplimit.usage', 'Usage: !bumplimit [off|limit]');
$.lang.register('songqueuemgmt.command.bumplimit.success.off', 'Bump limits have been turned off');
$.lang.register('songqueuemgmt.command.bumplimit.success', "Bump limits are now set to $1");

$.lang.register('songqueuemgmt.command.bump.usage', 'Usage: !bump [user] [position] [allow]');
$.lang.register('songqueuemgmt.command.bump.success', 'Your song has been bumped to position $1');
$.lang.register('songqueuemgmt.command.bump.limit.reached', '$1 has reached their bump limit for the stream.  Respond within 30 seconds with \'allow\' to allow the bump ');

$.lang.register('songqueuemgmt.command.move.usage', 'Usage: !move [user] [position]');
$.lang.register('songqueuemgmt.command.move.success', '$1\'s song has been moved to position $2');
$.lang.register('songqueuemgmt.command.move.none', '$1 does not have a song in the queue');
$.lang.register('songqueuemgmt.command.move.404', '$1 does not have a song in the queue');
$.lang.register('songqueuemgmt.command.move.error.length', 'Invalid song position - the queue only has $1 songs');

$.lang.register('songqueuemgmt.startstream.clearbumps', 'Resetting user bumps');

$.lang.register('songqueuemgmt.command.bump.count', 'There $1 bumped requests in the queue');

$.lang.register('songqueuemgmt.autobump.queue', 'Your song will be bumped to the top of the queue');
$.lang.register('songqueuemgmt.autobump.nextsong', 'You will get a free bump on your next request!');

$.lang.register('songqueuemgmt.autobump.channelpoints.404', 'You do not have a song in the queue.  Your points will be refunded');

$.lang.register('songqueuemgmt.autobump.free.used', 'You have already redeemed a free bump this stream');

$.lang.register('songqueuemgmt.command.bump.pending', 'Your song is already bumped');

$.lang.register('songqueuemgmt.autobump.sub', 'Your song will be bumped for your sub!');
$.lang.register('songqueuemgmt.autobump.giftsub', 'Your song will be bumped for your gifted sub!');
$.lang.register('songqueuemgmt.autobump.raid', 'Your song will be bumped to the top of the queue for your raid!');
$.lang.register('songqueuemgmt.autobump.donation', 'Your song will be bumped for your donation!');
$.lang.register('songqueuemgmt.autobump.bits', 'Your song will be bumped for your bits!');
$.lang.register('songqueuemgmt.autobump.sotn', 'Your song will be bumped for your Song of the Night win!');
$.lang.register('songqueuemgmt.autobump.gift', 'Your song will be bumped!');

$.lang.register('songqueuemgmt.autobump.remove.usage', 'Usage: !removebump <user>');
$.lang.register('songqueuemgmt.autobump.remove.success', '$1\'s bump has been removed');
$.lang.register('songqueuemgmt.autobump.remove.404', '$1 does not have a pending bump');
$.lang.register('songqueuemgmt.autobump.remove.used', '$1 has already used their bump');

$.lang.register('songqueuemgmt.autobump.xfer.usage', 'Usage: !bumpxfer <gifter> <recipient>');
$.lang.register('songqueuemgmt.autobump.xfer.success', '$1\'s bump has been gifted to $2');
$.lang.register('songqueuemgmt.autobump.xfer.404', '$1 does not have a pending bump');
$.lang.register('songqueuemgmt.autobump.xfer.used', '$1 has already used their bump');

$.lang.register('songqueuemgmt.bump.disabled', 'The bump system is disabled');