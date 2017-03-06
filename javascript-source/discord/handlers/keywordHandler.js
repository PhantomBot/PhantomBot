/**
 * This module is to handle custom keywords in discord.
 */
(function() {

    /**
     * @event discordMessage
     */
    $.bind('discordMessage', function(event) {
        var message = event.getMessage().toLowerCase(),
            channel = event.getChannel(),
            keys = $.inidb.GetKeyList('discordKeywords', ''),
            keyword,
            i;

        for (i in keys) {
            if (message.match('\\b' + keys[i] + '\\b') && !message.includes('!keyword')) {
                keyword = $.inidb.get('discordKeywords', keys[i]);
                $.discord.say(channel, $.discord.tags(event, keyword));
                break;
            }
        }
    });

    /**
     * @event discordCommand
     */
    $.bind('discordCommand', function(event) {
        var sender = event.getSender(),
            channel = event.getChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            arguments = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        if (command.equalsIgnoreCase('keyword')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.usage'));
                return;
            }

            /**
             * @discordcommandpath keyword add [keyword] [response] - Adds a custom keyword.
             */
            if (action.equalsIgnoreCase('add')) {
                if (subAction === undefined || args[2] === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.add.usage'));
                    return;
                }

                if ($.inidb.exists('discordKeywords', subAction.toLowerCase())) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.add.error'));
                    return;
                }

                $.inidb.set('discordKeywords', subAction.toLowerCase(), args.slice(2).join(' '));
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.add.success', subAction));
            }

            /**
             * @discordcommandpath keyword edit [keyword] [response] - Edits a custom keyword.
             */
            if (action.equalsIgnoreCase('edit')) {
                if (subAction === undefined || args[2] === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.edit.usage'));
                    return;
                }

                if (!$.inidb.exists('discordKeywords', subAction.toLowerCase())) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.404'));
                    return;
                }

                $.inidb.set('discordKeywords', subAction.toLowerCase(), args.slice(2).join(' '));
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.edit.success', subAction));
            }

            /**
             * @discordcommandpath keyword remove [keyword] - Removes a custom keyword.
             */
            if (action.equalsIgnoreCase('remove')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.remove.usage'));
                    return;
                }

                if (!$.inidb.exists('discordKeywords', subAction.toLowerCase())) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.404'));
                    return;
                }

                $.inidb.del('discordKeywords', subAction.toLowerCase());
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.remove.success', subAction));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/handlers/keywordHandler.js')) {
            $.discord.registerCommand('./discord/handlers/keywordHandler.js', 'keyword', 1);
            $.discord.registerSubCommand('keyword', 'add', 1);
            $.discord.registerSubCommand('keyword', 'edit', 1);
            $.discord.registerSubCommand('keyword', 'remove', 1);

            // $.unbind('initReady'); Needed or not?
        }
    });
})();
