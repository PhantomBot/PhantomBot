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

(function () {
    var temp;

    /*
     * @transformer atSender
     * @formula (@sender) '@<Sender's Name>, '
     * @labels twitch commandevent user
     * @example Caster: !addcom !hello (@sender) you are awesome!
     * User: !hello
     * Bot: @User, you're awesome!
     * @cached
     */
    function atSender(args, event) {
        if (!args) {
            return {
                result: $.userPrefix(event.getSender(), true),
                cache: true
            };
        }
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
    function age(args, event) {
        if (!args) {
            $.getChannelAge(event);
            return {cancel: true};
        }
    }

    /*
     * @transformer baresender
     * @formula (baresender) the login name of the message's sender
     * @labels twitch commandevent user
     */
    function baresender(args, event) {
        if (!args) {
            return {result: event.getSender()};
        }
    }

    /*
     * @transformer pointtouser
     * @formula (pointtouser) user + ' -> '; uses sender's display name if no other is provided
     * @labels twitch commandevent user
     * @example Caster: !addcom !facebook (pointtouser) like my Facebook page!
     * User: !facebook
     * Bot: User ->  like my Facebook page!
     *
     * User: !facebook User2
     * Bot: User2 -> like my Facebook  page!
     * @cached
     */
    function pointtouser(args, event) {
        temp = '';
        if (event.getArgs().length > 0) {
            temp = $.jsString(event.getArgs()[0]).replace(/[^a-zA-Z0-9_]/g, '');
        }
        if (temp.length === 0) {
            temp = event.getSender();
        }
        return {
            result: $.jsString($.username.resolve(temp)) + ' -> ',
            cache: true
        };
    }

    /*
     * @transformer sender
     * @formula (sender) the sender's display name
     * @labels twitch commandevent user
     * @example Caster: !addcom !hello Hello, (sender)!
     * User: !hello
     * Bot: Hello, User!
     * @cached
     */
    function sender(args, event) {
        if (!args) {
            return {
                result: $.username.resolve(event.getSender()),
                cache: true
            };
        }
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
    function senderrank(args, event) {
        if (!args) {
            return {
                result: $.resolveRank(event.getSender()),
                cache: true
            };
        }
    }

    /*
     * @transformer senderrankonly
     * @formula (senderrankonly) the sender's rank
     * @labels twitch commandevent user
     * @cached
     */
    function senderrankonly(args, event) {
        if (!args) {
            return {
                result: $.getRank(event.getSender()),
                cache: true
            };
        }
    }

    /*
     * @transformer touser
     * @formula (touser) display name of the user provided as an argument by the sender; sender's display name if no other is provided
     * @labels twitch commandevent user
     * @example Caster: !addcom !twitter (touser) Hey! Follow my Twitter!
     * User: !twitter
     * Bot: User Hey! Follow my Twitter!
     *
     * User: !twitter User2
     * Bot: User2 Hey! Follow my Twitter!
     * @cached
     */
    function touser(args, event) {
        temp = '';
        if (event.getArgs().length > 0) {
            temp = $.jsString(event.getArgs()[0]).replace(/[^a-zA-Z0-9_]/g, '');
        }
        if (temp.length === 0) {
            temp = event.getSender();
        }
        return {
            result: $.username.resolve(temp),
            cache: true
        };
    }

    var transformers = [
        new $.transformers.transformer('@sender', ['twitch', 'commandevent', 'user'], atSender),
        new $.transformers.transformer('age', ['twitch', 'commandevent', 'user'], age),
        new $.transformers.transformer('baresender', ['twitch', 'commandevent', 'user'], baresender),
        new $.transformers.transformer('pointtouser', ['twitch', 'commandevent', 'user'], pointtouser),
        new $.transformers.transformer('sender', ['twitch', 'commandevent', 'user'], sender),
        new $.transformers.transformer('senderrank', ['twitch', 'commandevent', 'user'], senderrank),
        new $.transformers.transformer('senderrankonly', ['twitch', 'commandevent', 'user'], senderrankonly),
        new $.transformers.transformer('touser', ['twitch', 'commandevent', 'user'], touser)
    ];

    $.transformers.addTransformers(transformers);
})();
