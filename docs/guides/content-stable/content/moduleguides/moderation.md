# Custom Moderation Scripts

Using the `ircModeration` hook, custom scripts can implement moderation filters for Twitch which can delete a message, purge/timeout a user, or ban a user, and then signal to the rest of the bot that this message should not be processed by other non-moderation hooks

## Hook Event Object

The parameter to the hook is an event object of type [IrcModerationEvent](https://phantombot.dev/javadoc-stable/tv/phantombot/event/irc/message/IrcModerationEvent.html)

The methods of the object are:

- `JavaString getSender()` - The login name of the user sending the message
- `JavaMap<JavaString, JavaString> getTags()` - The IRCv3 tags containing additional information about the user and message
- `void moderated()` - The custom script should call this method if moderation action is taken against the user
- `boolean isCommand()` - Indicates if the message looks like a possible _!command_
- `CommandEvent asCommand()` - Attempts to create a [CommandEvent](https://phantombot.dev/javadoc-stable/tv/phantombot/event/command/CommandEvent.html), which is the event object for the `command` hook, out of the message. Returns `null` if `isCommand()` would return `false`

## Standard Moderation Functions

PhantomBot provides a number of standard methods for properly sending a moderation action to Twitch

- `$.deleteMessage(tagsOrId)` - Deletes only the specified message. The input parameter should either be a jsString (Use `$.jsString(str)` to be sure) or the JavaMap returned by the `getTags()` method of the event object
- `$.purgeUser(loginName, reason)` - Purges the user. This is equivilent to a 1 second timeout and is generally used as a delete for all previous messages sent by the user. `reason` is optional
- `$.timeoutUser(loginName, timeInSeconds, reason)` - Times out the user for the specified number of seconds. `reason` is optional
- `$.untimeoutUser(loginName)` - Cancels a time out on a user, restoring their ability to chat in the channel
- `$.banUser(loginName, reason)` - Bans the user from the channel. They are permenately blocked from speaking until an un-ban is issued. `reason` is optional
- `$.unbanUser(loginName)` - Un-bans the user, restoring their ability to chat in the channel

## Usage

The standard usage of a moderation hook is to check if the message meets some criteria that is desired to be removed from chat, decide on and implement an appropriate action, and then notifiy the bot the action has taken place

```
// Script wrapper to prevent escaping into global scope
(function () {
    // Subscribe to event. The variable `event` will contain the event data
    $.bind('ircModeration', function (event) {
        // Some custom isBad function checks the message content and returns `true` if action should be taken
        if (isBad(event.getMessage())) {
           // Using try-finally to ensure an exception while
           // timing out doesn't block this from emitting
            try {
                // Timeout the user for 30 seconds
                $.timeoutUser(event.getSender(), 30, 'Please be cool');
            } finally {
                // Notify bot to stop processing
                // due to timeout being issued
                event.moderated();
            }
        }
    });
})();
```

It is important that `moderated()` be called on the event object when action is taken. This notifies the bot that this is a bad message, and other non-moderation scripts should not process this message

_WARNING_: If all running scripts with an `ircModeration` hook collectively take longer than 5 seconds to process a message, the bot may proceed anyway with running regular script hooks even if `moderated()` is called

## Bot Processing Order

The order in which the bot processes messages is as follows

- Check for IRC `ACTION` identifier; if found, convert message to `/me` format
- Print the message to the console
- Run `ircChannelUserMode` ([IrcChannelUserMode](https://phantombot.dev/javadoc-stable/tv/phantombot/event/irc/channel/IrcChannelUserModeEvent.html)) hooks for newly-changed moderator status (Deprecated/Legacy)
- Run `ircModeration` ([IrcModerationEvent](https://phantombot.dev/javadoc-stable/tv/phantombot/event/irc/message/IrcModerationEvent.html)) hooks (Includes updating [ViewerCache](https://phantombot.dev/javadoc-stable/com/gmt2001/twitch/cache/ViewerCache.html) via its `ircModeration` hook)
- Wait until all `ircModeration` hooks complete, or 5 seconds pass; whichever comes first
- If all hooks complete in time, check if `moderated()` was called; if `moderated()` was called, end processing here
- If user is a subscriber, run `ircPrivateMessage` ([IrcPrivateMessageEvent](https://phantombot.dev/javadoc-stable/tv/phantombot/event/irc/message/IrcPrivateMessageEvent.html)) hook with fake `SPECIALUSER` message (Deprecated/Legacy)
- If message contains bits, run `twitchBits` ([TwitchBitsEvent](https://phantombot.dev/javadoc-stable/tv/phantombot/event/twitch/bits/TwitchBitsEvent.html)) hook
- If message appears to be a _!command_, run `command` ([CommandEvent](https://phantombot.dev/javadoc-stable/tv/phantombot/event/command/CommandEvent.html)) hook
- Run `ircChannelMessage` ([IrcChannelMessageEvent](https://phantombot.dev/javadoc-stable/tv/phantombot/event/irc/message/IrcChannelMessageEvent.html)) hook

## Example

This is an example script which purges a user that sends `<message deleted>` in chat

```
(function () {
    // RegEx that catches basic variations such as /me and capital letters
    let fakePurge = new RegExp(/(^(\/me |)<message \w+>|^(\/me |)<\w+ deleted>)/i);

    $.bind('ircModeration', function (event) {
        // Check if the message matches our filter
        if ($.test($.jsString(event.getMessage()), fakePurge)) {
            try {
                // Purge the user
                $.purgeUser(event.getSender(), 'Fake Purge Filter');
            } finally {
                // Notify bot that regular scripts should not process this message
                event.moderated();
            }
        }
    });
})();
```