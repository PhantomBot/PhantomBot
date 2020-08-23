$.lang.register('discord.promotesystem.cmd.promote.usage', '!promote add [short bio] | delete - Add or delete yourself from being promoted.');
$.lang.register('discord.promotesystem.cmd.promote.noselfmanage', 'No one is allowed to manage themselves, please speak to a moderator to be added or deleted.');
$.lang.register('discord.promotesystem.cmd.promote.nochannels', 'Ask an admin to set a promote channel with !promote channel and/or !promote streamchannel');
$.lang.register('discord.promotesystem.cmd.promote.revoked', 'You are no longer allowed to add yourself.');

$.lang.register('discord.promotesystem.cmd.promote.add.nobio', 'You need to provide a short biography or use the keyword \'none\' (!promote add none).');
$.lang.register('discord.promotesystem.cmd.promote.add.success', 'You ($1) will now be promoted');
$.lang.register('discord.promotesystem.cmd.promote.del.success', 'You ($1) will no longer be promoted');

$.lang.register('discord.promotesystem.cmd.promoteadm.usage', '!promoteadm add | delete | so | channel | streamchannel | revoke | allow | toggleselfmanage | togglestats | togglebanner | list | setinterval');
$.lang.register('discord.promotesystem.cmd.promoteadm.nochannels', 'Set channels with !promoteadm channel and/or !promoteadm streamchannel');
$.lang.register('discord.promotesystem.cmd.promoteadm.noacct', 'That account does not appear to exist in Twitch: $1');

$.lang.register('discord.promotesystem.cmd.promoteadm.add.nouser', 'Who do you wish to promote?');
$.lang.register('discord.promotesystem.cmd.promoteadm.add.nobio', 'You need to provide a short biography or use the keyword \'none\' (!promoteadm add user none).');
$.lang.register('discord.promotesystem.cmd.promoteadm.add.success', '$1 will now be promoted');
$.lang.register('discord.promotesystem.cmd.promoteadm.del.nouser', 'Who you wish to remove from being promoted?');
$.lang.register('discord.promotesystem.cmd.promoteadm.del.success', '$1 will no longer be promoted');

$.lang.register('discord.promotesystem.cmd.promoteadm.channel.nochannel', 'Use which channel for promotions? To remove current channel use !promoteadm channel clear');
$.lang.register('discord.promotesystem.cmd.promoteadm.channel.cleared', 'Promote channel has been cleared.');
$.lang.register('discord.promotesystem.cmd.promoteadm.channel.success', 'Promote channel has been set to: $1'); 

$.lang.register('discord.promotesystem.cmd.promoteadm.streamchannel.nochannel', 'Use which channel for stream announcements? To remove current channel use !promoteadm streamchannel clear');
$.lang.register('discord.promotesystem.cmd.promoteadm.streamchannel.cleared', 'Stream announcement channel has been cleared.');
$.lang.register('discord.promotesystem.cmd.promoteadm.streamchannel.success', 'Stream announcement channel has been set to: $1');

$.lang.register('discord.promotesystem.cmd.promoteadm.revoke.nouser', 'Revoke the privilege of which user to be able to add themselves?');
$.lang.register('discord.promotesystem.cmd.promoteadm.revoke.success', '$1 will no longer be promoted and will no longer be able to manage themselves.');

$.lang.register('discord.promotesystem.cmd.promoteadm.allow.nouser',  'Allow which user to be able to add themselves again?');
$.lang.register('discord.promotesystem.cmd.promoteadm.allow.success', '$1  will be allowed to add themselves again.');

$.lang.register('discord.promotesystem.cmd.promoteadm.toggleselfmanage.off', 'Users will no longer be able to manage themselves via !promote add and delete.');
$.lang.register('discord.promotesystem.cmd.promoteadm.toggleselfmanage.on', 'Users will now be able to manage themselves via !promote add and delete.');

$.lang.register('discord.promotesystem.cmd.promoteadm.togglestats.off', 'Stats will no longer show when a stream is announced.');
$.lang.register('discord.promotesystem.cmd.promoteadm.togglestats.on', 'Stats will now show when a stream is announced.');

$.lang.register('discord.promotesystem.cmd.promoteadm.togglebanner.off', 'Banners will no longer show when a stream is announced.');
$.lang.register('discord.promotesystem.cmd.promoteadm.togglebanner.on', 'Banners will now show when a stream is announced.');

$.lang.register('discord.promotesystem.cmd.promoteadm.list.empty', 'No users are presently being promoted.');
$.lang.register('discord.promotesystem.cmd.promoteadm.list.success', 'Users being promoted: $1');

$.lang.register('discord.promotesystem.cmd.promoteadm.setinterval.nominutes', 'Provide an interval in minutes.');
$.lang.register('discord.promotesystem.cmd.promoteadm.setinterval.toolow', 'The interval should be 15 minutes or more as to not spam the channel.');
$.lang.register('discord.promotesystem.cmd.promoteadm.setinterval.success', 'The interval for promoting streamers has been set to $1 minutes.');

$.lang.register('discord.promotesystem.cmd.so.nouser', 'You must provide a user to lookup and shoutout.');
$.lang.register('discord.promotesystem.cmd.so.noexist', 'That user is not currently being promoted. Check !promoteadm list');

$.lang.register('discord.promotesystem.livemsg.title', '$1 is LIVE @ https://twitch.tv/$2');
$.lang.register('discord.promotesystem.livemsg.nowplaying', 'Now Playing');
$.lang.register('discord.promotesystem.livemsg.streamtitle', 'Stream Title');
$.lang.register('discord.promotesystem.livemsg.followers', 'Followers');
$.lang.register('discord.promotesystem.livemsg.views', 'Views');
$.lang.register('discord.promotesystem.livemsg.missingtitle', 'No Title Provided');
$.lang.register('discord.promotesystem.livemsg.missinggame', 'No Game Provided');

$.lang.register('discord.promotesystem.promotemsg.description', 'Be sure to follow and checkout $1');
$.lang.register('discord.promotesystem.promotemsg.biography', 'Bio');
$.lang.register('discord.promotesystem.promotemsg.nobio', 'No biography provided.');
