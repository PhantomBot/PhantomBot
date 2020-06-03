/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


$.lang.register('songqueuemgmt.command.bumplimit.usage', 'Usage: !bumplimit [off|limit]');
$.lang.register('songqueuemgmt.command.bumplimit.success.off', 'Bump limits have been turned off');
$.lang.register('songqueuemgmt.command.bumplimit.success', "Bump limits are now set to $1");

$.lang.register('songqueuemgmt.command.bump.usage', 'Usage: !bump [user] [position] [allow]');
$.lang.register('songqueuemgmt.command.bump.success', 'Your song has been bumped to the top of the queue.');
$.lang.register('songqueuemgmt.command.bump.limit.reached', '$1 has reached their bump limit for the stream.');

$.lang.register('songqueuemgmt.command.move.usage', 'Usage: !move [user] [position]');
$.lang.register('songqueuemgmt.command.move.success', '$1\'s song has been moved to position $2');
$.lang.register('songqueuemgmt.command.move.none', '$1 does not have a song in the queue');
$.lang.register('songqueuemgmt.command.move.404', '$1 does not have a song in the queue');
$.lang.register('songqueuemgmt.command.move.error.length', 'Invalid song position - the queue only has $1 songs');

$.lang.register('songqueuemgmt.startstream.clearbumps', 'Resetting user bumps');