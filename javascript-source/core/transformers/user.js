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
    var temp;

    /*
     * @transformer atSender
     * @formula (@sender) '@<Sender's Name>, '
     * @labels twitch discord commandevent user
     * @example Caster: !addcom !hello (@sender) you are awesome!
     * User: !hello
     * Bot: @User, you're awesome!
     * @cached
     */
    function atSender(args) {
        return {
            result: args.platform === 'discord' ? args.event.getMention() : $.userPrefix(args.event.getSender(), true),
            cache: true
        };
    }

    /*
     * @transformer age
     * @formula (age) outputs the age of the sender's Twitch account; If the sender provides an argument, checks that Twitch account instead
     * @labels twitch commandevent user
     * @example Caster: !addcom !age (age)
     * User: !age
     * Bot: @User, user has been on Twitch since April 19, 2009.
     *
     * User: !age User2
     * Bot: @User, user2 has been on Twitch since December 25, 2010.
     * @cancels
     */
    function age(args) {
        $.getChannelAge(args.event);
        return {cancel: true};
    }

    /*
     * @transformer baresender
     * @formula (baresender) the login name of the message's sender
     * @labels twitch commandevent user
     */
    function baresender(args) {
        return {result: args.event.getSender()};
    }

    /*
     * @transformer pointtouser
     * @formula (pointtouser) user + ' -> '; uses sender's display name if no target is provided
     * @formula (pointtouser true) user + ' -> '; outputs blank instead if no target is provided
     * @labels twitch commandevent user
     * @example Caster: !addcom !facebook (pointtouser) like my Facebook page!
     * User: !facebook
     * Bot: User ->  like my Facebook page!
     *
     * User: !facebook User2
     * Bot: User2 -> like my Facebook page!
     * @example Caster: !addcom !insta (pointtouser true) Follow me on Instagram!
     * User: !insta
     * Bot: Follow me on Instagram!
     *
     * User: !insta User2
     * Bot: User2 -> Follow me on Instagram!
     * @cached
     */
    function pointtouser(args) {
        temp = '';
        let res = '';
        if (args.event.getArgs().length > 0) {
            temp = $.jsString(args.event.getArgs()[0]).replace(/[^a-zA-Z0-9_]/g, '');
        }
        if (temp.length === 0) {
            if (args.args.length === 0 || args.args.trim() !== 'true') {
                temp = args.event.getSender();
                res = $.jsString($.usernameResolveIgnoreEx(temp)) + ' -> ';
            }
        } else {
            res = $.jsString($.usernameResolveIgnoreEx(temp)) + ' -> ';
        }
        return {
            result: res,
            cache: true
        };
    }

    /*
     * @transformer sanitizeuser
     * @formula (sanitizeuser user:str) does some basic sanitization of a username
     * @labels twitch commandevent user
     * @cached
     */
    function sanitizeuser(args) {
        return {
            result: $.user.sanitize(args.args.trim()),
            cache: true
        };
    }

    /*
     * @transformer sender
     * @formula (sender) the sender's display name
     * @labels twitch discord commandevent user
     * @example Caster: !addcom !hello Hello, (sender)!
     * User: !hello
     * Bot: Hello, User!
     * @cached
     */
    function sender(args) {
        return {
            result: args.platform === 'discord' ? args.event.getUsername() : $.usernameResolveIgnoreEx(args.event.getSender()),
            cache: true
        };
    }

    /*
     * @transformer senderrank
     * @formula (senderrank) the sender's display name, prefixed with their rank
     * @labels twitch commandevent user
     * @example Caster: !addcom !poke /me Pokes (senderrank) with a bar of soap.
     * User: !poke
     * Bot: /me Pokes Master User with a bar of soap.
     * @cached
     */
    function senderrank(args) {
        return {
            result: $.resolveRank(args.event.getSender()),
            cache: true
        };
    }

    /*
     * @transformer senderrankonly
     * @formula (senderrankonly) the sender's rank
     * @labels twitch commandevent user
     * @cached
     */
    function senderrankonly(args) {
        return {
            result: $.getRank(args.event.getSender()),
            cache: true
        };
    }

    /*
     * @transformer touser
     * @formula (touser) display name of the user provided as an argument by the sender; sender's display name if no target is provided
     * @formula (touser true) display name of the user provided as an argument by the sender; outputs blank instead if no target is provided
     * @labels twitch discord commandevent user
     * @example Caster: !addcom !twitter (touser) Hey! Follow my Twitter!
     * User: !twitter
     * Bot: User Hey! Follow my Twitter!
     *
     * User: !twitter User2
     * Bot: User2 Hey! Follow my Twitter!
     * @example Caster: !addcom !tiktok (touser true) Hey! Follow me on TikTok!
     * User: !tiktok
     * Bot: Hey! Follow me on TikTok!
     *
     * User: !tiktok User2
     * Bot: User2 Hey! Follow me on TikTok!
     * @cached
     */
    function touser(args) {
        temp = '';
        let res = '';
        if (args.event.getArgs().length > 0) {
            temp = $.jsString(args.event.getArgs()[0]).replace(/[^a-zA-Z0-9_]/g, '');
        }
        if (temp.length === 0) {
            if (args.platform === 'discord') {
                temp = event.getMention();
            } else {
                temp = $.usernameResolveIgnoreEx(args.event.getSender());
            }

            if (args.args.length === 0 || args.args.trim() !== 'true') {
                res = temp;
            }
        } else {
            if (args.platform === 'discord') {
                temp = $.discord.username.resolve(temp);
            } else {
                temp = $.usernameResolveIgnoreEx(temp);
            }

            res = temp;
        }
        return {
            result: res,
            cache: true
        };
    }

    var transformers = [
        new $.transformers.transformer('@sender', ['twitch', 'discord', 'commandevent', 'user'], atSender),
        new $.transformers.transformer('age', ['twitch', 'commandevent', 'user'], age),
        new $.transformers.transformer('baresender', ['twitch', 'commandevent', 'user'], baresender),
        new $.transformers.transformer('pointtouser', ['twitch', 'commandevent', 'user'], pointtouser),
        new $.transformers.transformer('sanitizeuser', ['twitch', 'commandevent', 'user'], sanitizeuser),
        new $.transformers.transformer('sender', ['twitch', 'discord', 'commandevent', 'user'], sender),
        new $.transformers.transformer('senderrank', ['twitch', 'commandevent', 'user'], senderrank),
        new $.transformers.transformer('senderrankonly', ['twitch', 'commandevent', 'user'], senderrankonly),
        new $.transformers.transformer('touser', ['twitch', 'discord', 'commandevent', 'user'], touser)
    ];

    $.transformers.addTransformers(transformers);
})();
