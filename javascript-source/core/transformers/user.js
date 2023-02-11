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

/* global Packages */

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
     * @formula (age pattern:str) outputs the age of the sender's Twitch account using the specified pattern; If the sender provides an argument, checks that Twitch account instead
     * @labels twitch commandevent user
     * @example Caster: !addcom !age (age)
     * User: !age
     * Bot: @User, user has been on Twitch since April 19, 2009.
     *
     * User: !age User2
     * Bot: @User, user2 has been on Twitch since December 25, 2010.
     * @example Caster: !addcom !age2 (touser) has been on Twitch for (age #y 'year(s), since ' MMMM dd', 'yyyy)!
     * User: !age2
     * Bot: User has been on Twitch for 1 year(s), since April 19, 2009!
     *
     * User: !age2 User2
     * Bot: User2 has been on Twitch for 2 year(s), since June 5, 2008!
     * @notes
     * Patterns (Example of 1 year, 2 months, 3 days, 12 hours):
     * - `#H` - Number of Hours (Total, ie. 10308)
     * - `#h` - Number of Hours (In day, ie. 12)
     * - `#D` - Number of Days (Total, ie. 429)
     * - `#d` - Number of Days (In month, ie. 3)
     * - `#M` - Number of Months (Total, ie. 14)
     * - `#m` - Number of Months (In year, ie. 2)
     * - `#y` - Number of Years (ie. 1)
     * - Any valid pattern for [DateTimeFormatter](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/time/format/DateTimeFormatter.html#patterns)
     */
    function age(args) {
        let channel = !args.event.getArgs()[0] ? args.event.getSender() : args.event.getArgs()[0];
        let str = '';
        let zdt = $.getChannelCreatedZonedDateTime(channel);

        if (args.args.trim().length === 0) {
            if (zdt === null) {
                str = $.userPrefix(event.getSender(), true) + $.lang.get('channel.age.user.404');
            } else {
                let dateFinal = zdt.format(Packages.java.time.format.DateTimeFormatter.ofPattern("MMMM dd', 'yyyy"));
                let days = Packages.java.time.Duration.between(zdt, Packages.java.time.ZonedDateTime.now()).toDays();

                if (days > 0) {
                    str = $.lang.get('common.get.age.days', $.userPrefix(event.getSender(), true), channel, dateFinal, days);
                } else {
                    str = $.lang.get('common.get.age', $.userPrefix(event.getSender(), true), channel, dateFinal);
                }
            }
        } else if (zdt !== null) {
            let pattern = args.args.trim();
            let utc = Packages.java.time.ZoneId.of("UTC");
            let now = Packages.java.time.ZonedDateTime.now();
            let time = Packages.java.time.Duration.between(zdt, now);
            let date = Packages.java.time.Period.between(zdt.withZoneSameInstant(utc).toLocalDate(), now.withZoneSameInstant(utc).toLocalDate());
            pattern = $.replace(pattern, '\'\'', '#\'#');
            pattern = $.replace(pattern, '#H', '\'' + time.toHours() + '\'');
            pattern = $.replace(pattern, '#h', '\'' + time.toHoursPart() + '\'');
            pattern = $.replace(pattern, '#D', '\'' + time.toDays() + '\'');
            pattern = $.replace(pattern, '#d', '\'' + date.getDays() + '\'');
            pattern = $.replace(pattern, '#M', '\'' + date.toTotalMonths() + '\'');
            pattern = $.replace(pattern, '#m', '\'' + date.getMonths() + '\'');
            pattern = $.replace(pattern, '#y', '\'' + date.getYears() + '\'');
            pattern = $.replace(pattern, '\'\'', '\'');
            pattern = $.replace(pattern, '#\'#', '\'\'');
            str = zdt.format(Packages.java.time.format.DateTimeFormatter.ofPattern(pattern));
        }

        return {
            result: str
        };
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
     * @example Caster: !addcom !mastadon (touser) Hey! Follow my Mastadon!
     * User: !mastadon
     * Bot: User Hey! Follow my Mastadon
     *
     * User: !mastadon User2
     * Bot: User2 Hey! Follow my Mastadon!
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
