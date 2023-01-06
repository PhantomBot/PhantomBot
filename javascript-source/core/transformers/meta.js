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

(function () {
    /*
     * @transformer adminonlyedit
     * @formula (adminonlyedit) returns blank
     * @labels twitch commandevent meta
     * @notes metatag that prevents anyone but the broadcaster or admins from editing the command
     * @example Caster: !addcom !playtime Current playtime: (playtime). (adminonlyedit)
     */
    function adminonlyedit() {
        return {result: ''};
    }

    /*
     * @transformer gameonly
     * @formula (gameonly name:str) cancels the command if the current game does not exactly match the one provided; multiple games can be provided, separated by |
     * @formula (gameonly !! name:str) cancels the command if the current game exactly matches the one provided; multiple games can be provided, separated by |
     * @labels twitch noevent meta
     * @cancels sometimes
     */
    function gameonly(args) {
        if (args.args.match(/^(?:=|\s)(.*)$/) !== null) {
            var targs = args.args.substring(1);
            var negate = false;
            if (targs.match(/^(!!\s)/) !== null) {
                targs = targs.substring(3);
                negate = true;
            }
            var game = $.getGame($.channelName);
            var match = targs.match(/([^|]+)/g);
            for (var x in match) {
                if (game.equalsIgnoreCase(match[x])) {
                    if (negate) {
                        return {cancel: true};
                    } else {
                        return {result: ''};
                    }
                }
            }
            if (!negate) {
                return {cancel: true};
            } else {
                return {result: ''};
            }
        }
    }

    /*
     * @transformer offlineonly
     * @formula (offlineonly) if the channel is not offline, cancels the command
     * @labels twitch commandevent meta
     * @example Caster: !addcom !downtime The stream as been offline for (downtime). (offlineonly)
     * @cancels sometimes
     */
    function offlineonly(args) {
        if ($.isOnline($.channelName)) {
            $.returnCommandCost(args.event.getSender(), args.event.getCommand(), $.checkUserPermission(args.event.getSender(), args.event.getTags(), $.PERMISSION.Mod));
            return {cancel: true};
        }
        return {result: ''};
    }

    /*
     * @transformer onlineonly
     * @formula (onlineonly) if the channel is not online, cancels the command
     * @labels twitch commandevent meta
     * @example Caster: !addcom !uptime (pointtouser) (channelname) has been live for (uptime). (onlineonly)
     * @cancels sometimes
     */
    function onlineonly(args) {
        if (!$.isOnline($.channelName)) {
            $.returnCommandCost(args.event.getSender(), args.event.getCommand(), $.checkUserPermission(args.event.getSender(), args.event.getTags(), $.PERMISSION.Mod));
            return {cancel: true};
        }
        return {result: ''};
    }

    /*
     * @transformer useronly
     * @formula (useronly name:str) only allows the given user to use the command; multiple users separated by spaces is allowed; if another user attempts to use the command, an error is sent to chat (if permComMsg is enabled) and the command is canceled
     * @labels twitch commandevent meta
     * @notes use @moderators as one of the user names to allow all moderators and admins
     * @notes use @admins as one of the user names to allow all admins
     * @cancels sometimes
     */
    function useronly(args) {
        if (args.args.match(/^(?:=|\s)(.*)$/) !== null) {
            var match = args.args.match(/(@?\w+)/g);
            for (var x in match) {
                if (match[x].match(/^@moderators$/) !== null) {
                    if ($.checkUserPermission(args.event.getSender(), args.event.getTags(), $.PERMISSION.Mod)) {
                        return {result: ''};
                    }
                } else if (match[x].match(/^@admins$/) !== null) {
                    if ($.checkUserPermission(args.event.getSender(), args.event.getTags(), $.PERMISSION.Admin)) {
                        return {result: ''};
                    }
                } else if (args.event.getSender().equalsIgnoreCase(match[x])) {
                    return {result: ''};
                }
            }
            if ($.getIniDbBoolean('settings', 'permComMsgEnabled', true)) {
                $.say($.whisperPrefix(args.event.getSender()) + $.lang.get('cmd.useronly', args.substring(1)));
            }
            return {cancel: true};
        }
    }

    var transformers = [
        new $.transformers.transformer('adminonlyedit', ['twitch', 'commandevent', 'meta'], adminonlyedit),
        new $.transformers.transformer('gameonly', ['twitch', 'noevent', 'meta'], gameonly),
        new $.transformers.transformer('offlineonly', ['twitch', 'commandevent', 'meta'], offlineonly),
        new $.transformers.transformer('onlineonly', ['twitch', 'commandevent', 'meta'], onlineonly),
        new $.transformers.transformer('useronly', ['twitch', 'commandevent', 'meta'], useronly)
    ];

    $.transformers.addTransformers(transformers);
})();
