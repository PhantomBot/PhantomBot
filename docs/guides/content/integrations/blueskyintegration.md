# Bluesky Integration Setup

The Bluesky integration can:

- Announce in chat, and in Discord channels, when your Bluesky account is mentioned, replied to, quoted or reposted, and when you make a new post
- Post to Bluesky when you go live, when you change game, and periodically while live, with a link card for the stream
- Post to Bluesky from chat with `!bluesky post`
- Give points to viewers who repost your posts

The bot only reads your notifications; they stay unread in the Bluesky app.

### Creating an App Password

The bot signs in with an app password, not your account password. An app password can post and read as your account, but cannot change your account settings, and you can revoke it at any time.

1. Sign in to [Bluesky](https://bsky.app) with the account the bot should post as
2. Open *Settings*, then *Privacy and security*, then *App passwords*
3. Click *Add App Password* and give it a name, such as *PhantomBot*. Leave access to direct messages off
4. Copy the app password. Bluesky only shows it once

### Linking the Account

Use one of these:

- **Panel:** go to *Alerts* > *Chat alerts* or *Discord* > *Alerts*, click the <i class="fa fa-link"></i> icon next to *Bluesky Alerts*, and enter the handle (such as `name.bsky.social`) and the app password. The bot checks them with Bluesky before saving them
- **Console:** run `blueskysetup` and answer the questions
- **Bot Setup page or `botlogin.txt`:** set `bluesky_handle` and `bluesky_apppassword`

The handle and app password are saved in `botlogin.txt`. For an account on a self-hosted PDS, also set the service address (`bluesky_service`, or the *Service* box in the panel).

The link icon is only shown to the panel logins set in `botlogin.txt`, not to panel users added on the *Panel Users* page. To remove the account, click *Unlink* in the same window.

**NOTE:** Some debug settings write secrets to the debug log:

- With the `wsdebug` bot property on, everything sent to the panel's websocket is logged, including the app password when an account is linked from the panel. Link from the console, or turn `wsdebug` off first
- With `httpclientdebug` and debug mode both on, the Bluesky session tokens are logged with the requests that carry them

### Settings

The *Bluesky Alerts* module is off by default. Turn it on at *Alerts* > *Chat alerts*, then click the <i class="fa fa-cog"></i> icon to choose what it does. The same settings can be changed in chat with `!bluesky set`.

**Chat Announcements**

| Setting | What it announces | Minimum check interval |
| :--- | :--- | :--- |
| Mentions, Replies and Quotes | Posts that mention, reply to or quote your account | 60 seconds |
| Reposts | Reposts of your posts | 60 seconds |
| Your Posts | New posts from your account, without replies, reposts and the posts the bot made | 15 seconds |

When a kind of announcement is first turned on, the bot only notes where to start, so older activity is not announced. The same happens after the linked account changes, and when a kind has not been checked for a while (an hour, or 10 check intervals if that is longer), so activity from while it was off is neither announced nor rewarded. At most 3 items of each kind are announced per check.

The bot remembers the posts it made itself for an hour, to keep them out of *Your Posts*. If the bot restarts within that hour, its last post can be announced once.

**Automatic Posts**

| Setting | When | At most |
| :--- | :--- | :--- |
| Post When Going Live | When the stream goes live | Once every 8 hours |
| Post When Changing Game | When the game changes while live | Once an hour |
| Post Updates While Live | Periodically while live | Every 180 minutes or more, as set by *Update Interval* |

Each automatic post gets a link card for your Twitch channel, with your profile picture, the stream title and the game, as the Bluesky app shows for a Twitch link.

The text of each post can use any tag that does not need a command, and these:

- `(title)` - the stream title
- `(game)` - the game being played
- `(uptime)` - how long the stream has been live, as HH:MM
- `(twitchurl)` - the address of your Twitch channel
- `(enter)` - a line break

Links, `@handle` mentions and `#hashtags` in posts are made clickable. Automatic posts that are longer than Bluesky's 300 characters are shortened; a post made with `!bluesky post` that is too long is refused. `(enter)` also works in `!bluesky post`.

**Repost Rewards**

Viewers register their Bluesky account with `!bluesky register [handle]`. When a registered account reposts one of your posts, the viewer gets *Reward Points*, at most once per *Reward Cooldown* hours.

**NOTE:** The bot cannot check that a viewer owns the account they register. Anyone can register an account that nobody else has registered yet.

### Discord

To announce Bluesky activity in Discord, link the account first (the <i class="fa fa-link"></i> icon is on both *Bluesky Alerts* cards). Then turn on *Bluesky Alerts* at *Discord* > *Alerts* and click the <i class="fa fa-cog"></i> icon to choose:

- **Enable Bluesky Alerts** - turns all Discord announcements on or off
- **Default Channel** - where announcements go
- **Announce** each kind (mentions, replies and quotes; reposts; your posts) - chosen apart from the chat announcements, so Discord can show different things than chat. All are off until turned on
- **Channel** for each kind - leave it on *Same as the default channel*, or pick a channel for that kind only

The same can be done in Discord:

- `!blueskyhandler toggle` - turns Discord announcements on or off
- `!blueskyhandler channel [channel]` - sets the default channel
- `!blueskyhandler channel [mentions | reposts | posts] [channel | default]` - sets the channel for one kind, or goes back to the default channel
- `!blueskyhandler announce [mentions | reposts | posts] [on/off]` - chooses which kinds are announced

How often each kind is checked is set on the *Alerts* page, and is shared by chat and Discord. To use only Discord, turn the chat *Bluesky Alerts* module off; Discord keeps working, but repost rewards and automatic posts stop, because they belong to the chat module.

### Testing

These console commands send test events:

- `socialtest (platform) (type) (account) (text)` - announces a test item without contacting Bluesky; the type is `post`, `mention`, `reply`, `quote` or `repost`. It only shows where that kind is turned on (in chat, Discord or both)
- `reposttest (platform) (accounts)` - sends a repost rewards event for the given handles, which are looked up on Bluesky
