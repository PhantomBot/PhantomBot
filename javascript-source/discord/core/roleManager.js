/*
 * Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
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

(function() {
    var autoSetPermissions = $.getSetIniDbBoolean('discordSettings', 'autoSetPermissions', false),
        autoSetRanks = $.getSetIniDbBoolean('discordSettings', 'autoSetRanks', false);

    /*
     * updateRoleManager
     */
    function updateRoleManager() {
        autoSetPermissions = $.getIniDbBoolean('discordSettings', 'autoSetPermissions');
        autoSetRanks = $.getIniDbBoolean('discordSettings', 'autoSetRanks');
    }

    /*
     * @function roleUpdateCheck
     */
    function roleUpdateCheck() {
        if ($.discord.isConnected()) {
            let users = $.inidb.GetKeyList('discordToTwitch', ''),
                i;

            // If both options are disabled, stop here.
            if (autoSetPermissions === false && autoSetRanks === false) {
                return;
            }

            // Create our default roles.
            createRoles();

            // Wait a bit to create the roles.
            setTimeout(function() {
                let roleObjs = null;
                try {
                    roleObjs = $.discordAPI.getRoleObjects(roles);
                } catch (e){
                    $.log.error(e);
                    return;
                }
                if (roleObjs === null) {
                    return;
                }
                for (i in users) {
                    try {
                        if (hasRankOrPermission($.getIniDbString('discordToTwitch', users[i]))) {
                            let user = $.discord.getUserById(users[i]);
                            if (user !== null && user !== undefined) {
                                updateRoles(users[i], getRanksAndPermissions($.getIniDbString('discordToTwitch', users[i])), user, roleObjs);
                            }
                        }
                    } catch (e){
                        $.log.error(e);
                    }
                }
            }, 5e3);
        }
    }

    /*
     * @function updateRoles
     *
     * @param {Number} id
     * @param {Array}  roles
     */
    function updateRoles(id, roles, user, roleObjs) {
        let oldRoles = $.getIniDbString('discordRoles', id, ',').split(','),
            currentRoles = null,
            newRoles = roles.join(','),
            i;
        
        try {
            currentRoles = $.discordAPI.getUserRoles(user);
        } catch (e){
            $.log.error(e);
            return;
        }

        // Build our roles list.
        for (i in currentRoles) {
            // If the user's current Discord role list contains an old role, and the new list does not have it, don't add it to the list.
            if ((oldRoles.length > 0 && hasRole(oldRoles, currentRoles[i].getName())) && newRoles.indexOf(currentRoles[i].getName()) === -1) {
                continue;
            } else {
                if (!hasRole(roles, currentRoles[i].getName())) {
                    roles.push(currentRoles[i].getName());
                }
            }
        }

        // Only update the user's role if there's a new one.
        for (i in roles) {
            if (!hasRole(currentRoles, roles[i], true)) {
                try {
                    $.discordAPI.editUserRoles(user, roleObjs);
                    $.setIniDbString('discordRoles', id, newRoles);
                } catch (e){
                    $.log.error(e);
                }
                return;
            }
        }
    }

    /*
     * @function createRoles
     */
    function createRoles() {
        let roles = $.discordAPI.getGuild().getRoles().replay();

        if (autoSetPermissions === true) {
            let keys = $.inidb.GetKeyList('groups', ''),
                group = '',
                i;

            for (i in keys) {
                group = $.getIniDbString('groups', keys[i]).trim();

                let hasTheRole = false;

                try {
                    hasTheRole = roles.filter(function(role) {
                        return $.equalsIgnoreCase(role.getName(), group);
                    }).count() > 0;
                } catch(e){}

                if (!$.inidb.exists('blacklistedDiscordRoles', group.toLowerCase()) && !hasTheRole) {
                    $.discordAPI.createRole(group);
                } else if (hasTheRole && $.inidb.exists('blacklistedDiscordRoles', group.toLowerCase())) {
                    $.discordAPI.deleteRole(group);
                }
            }
        }

        if (autoSetRanks === true) {
            let keys = $.inidb.GetKeyList('ranksMapping', ''),
                rank = '',
                i;

            // Remove old ranks.
            cleanOldRanks();

            for (i in keys) {
                rank = $.getIniDbString('ranksMapping', keys[i]).trim();

                let hasTheRole = false;

                try {
                    hasTheRole = roles.filter(function(role) {
                        return $.equalsIgnoreCase(role.getName(), rank);
                    }).count() > 0;
                } catch(e){}

                if (!$.inidb.exists('blacklistedDiscordRoles', rank.toLowerCase()) && !hasTheRole) {
                    $.discordAPI.createRole(rank);
                    $.setIniDbString('discordRanks', rank, keys[i]);
                } else if (hasTheRole && $.inidb.exists('blacklistedDiscordRoles', rank.toLowerCase())) {
                    $.discordAPI.deleteRole(rank);
                    $.inidb.del('discordRanks', rank);
                }
            }
        }
    }

    /*
     * @function hasRole
     *
     * @param  {Array}  array
     * @param  {String} role
     * @param  {Boolean} getName
     * @return {Boolean}
     */
    function hasRole(array, role, getName) {
        for (var i in array) {
            if (!getName) {
                if ($.equalsIgnoreCase(array[i], role)) {
                    return true;
                }
            } else {
                if ($.equalsIgnoreCase(array[i].getName(), role)) {
                    return true;
                }
            }
        }
        return false;
    }

    /*
     * @function cleanOldRanks
     */
    function cleanOldRanks() {
        var keys = $.inidb.GetKeyList('discordRanks', ''),
            i;

        for (i in keys) {
            if (!$.equalsIgnoreCase($.getIniDbString('ranksMapping', $.getIniDbNumber('discordRanks', keys[i]), ''), keys[i])) {
                $.discordAPI.deleteRole(keys[i]);
                $.inidb.del('discordRanks', keys[i]);
            }
        }
    }

    /*
     * @function hasRankOrPermission
     *
     * @param  {String} username
     * @return {Boolean}
     */
    function hasRankOrPermission(username) {
        return (getRanksAndPermissions(username).length > 0);
    }

    /*
     * @function getRanksAndPermissions
     *
     * @param  {String} username
     * @return {Array}
     */
    function getRanksAndPermissions(username) {
        let roles = [];

        if (autoSetPermissions === true) {
            let group = $.optIniDbString('group', username);
            if (group.isPresent() && !$.inidb.exists('blacklistedDiscordRoles', group.get().toLowerCase())) {
                roles.push($.getIniDbString('groups', group.get()));
            }
        }

        if (autoSetRanks === true) {
            if ($.hasRank(username) && !$.inidb.exists('blacklistedDiscordRoles', $.getRank(username).toLowerCase())) {
                roles.push($.getRank(username));
            }
        }

        return roles;
    }

    /*
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        var sender = event.getSender(),
            channel = event.getDiscordChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1],
            actionArgs = args[2];

        if ($.equalsIgnoreCase(command, 'rolemanager')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.rolemanager.usage'));
                return;
            }

            /*
             * @discordcommandpath rolemanager togglesyncpermissions - Makes the bot sync default permissions with those who have their accounts linked.
             */
            if ($.equalsIgnoreCase(action, 'togglesyncpermissions')) {
                autoSetPermissions = !autoSetPermissions;
                $.setIniDbBoolean('discordSettings', 'autoSetPermissions', autoSetPermissions);
                $.discord.say(channel, $.discord.userPrefix(mention) + (autoSetPermissions ? $.lang.get('discord.rolemanager.permission.sync.on') : $.lang.get('discord.rolemanager.permission.sync.off')));
            }

            /*
             * @discordcommandpath rolemanager togglesyncranks - Makes the bot sync ranks with those who have their accounts linked.
             */
            if ($.equalsIgnoreCase(action, 'togglesyncranks')) {
                autoSetRanks = !autoSetRanks;
                $.setIniDbBoolean('discordSettings', 'autoSetRanks', autoSetRanks);
                $.discord.say(channel, $.discord.userPrefix(mention) + (autoSetRanks ? $.lang.get('discord.rolemanager.ranks.sync.on') : $.lang.get('discord.rolemanager.ranks.sync.off')));
            }

            /*
             * @discordcommandpath rolemanager blacklist [add / remove] [permission or rank] - Blacklist a rank or permission from being used.
             */
            if ($.equalsIgnoreCase(action, 'blacklist')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.rolemanager.blacklist.usage'));
                    return;
                }

                if ($.equalsIgnoreCase(subAction, 'add')) {
                    if (actionArgs === undefined) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.rolemanager.blacklist.add.usage'));
                        return;
                    }

                    var blacklist = args.slice(2).join(' ').toLowerCase();
                    $.setIniDbString('blacklistedDiscordRoles', blacklist, 'true');
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.rolemanager.blacklist.add.success', blacklist));
                }

                if ($.equalsIgnoreCase(subAction, 'remove')) {
                    if (actionArgs === undefined) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.rolemanager.blacklist.remove.usage'));
                        return;
                    }

                    var blacklist = args.slice(2).join(' ').toLowerCase();
                    $.inidb.del('blacklistedDiscordRoles', blacklist);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.rolemanager.blacklist.remove.success', blacklist));
                }
            }
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/core/roleManager.js', 'rolemanager', 1);

        setInterval(roleUpdateCheck, 3e4);
    });
})();
