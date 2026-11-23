# Panel Passkeys

&nbsp;

<!-- toc -->

<!-- tocstop -->

&nbsp;

A passkey lets you sign in to the panel with your fingerprint, face, device PIN or a security key instead of typing your panel password. Passkeys are optional. Your password keeps working, and you can use either one each time you sign in, unless you turn your password off as described in **Signing In With Passkeys Only**.

The main login from _botlogin.txt_ and every user created under _Settings > Panel Users_ can have their own passkeys. The additional logins that the bot derives from it, whose names end in `_RO`, `_YT` or `_YT_RO`, can not use passkeys.

## Requirements

Browsers only allow passkeys on addresses they consider secure. Passkeys are available when **all** of the following are true

- You open the panel directly from your bot, not from the Remote Panel on _phantombot.dev_
- The address uses a name, not an IP address
- The address is one of
  - `https://` with a certificate that your browser accepts **without a warning**, such as a certificate from Let's Encrypt or a reverse proxy that provides one
  - `http://localhost`, for a bot running on the same computer as your browser with `usehttps=false`

The self-signed certificate that the bot creates by default does **not** meet these requirements, because browsers show a warning for it. See **[Enable Twitch Embeds](guide=content/integrations/twitchembeds "##guide_link")** for the ways to give your bot a certificate that browsers accept.

When the requirements are not met, the passkey buttons are hidden and the panel works as it always has. The bot hides them for its default self-signed certificate. If a reverse proxy serves the panel, set it up as described in **[Enable Twitch Embeds](guide=content/integrations/twitchembeds "##guide_link")**, otherwise the bot hides the buttons. For any other certificate that your browser warns about, the buttons may still be shown, and using them fails with a message.

## Adding a Passkey

1. Sign in to the panel
2. Click your name in the top-right corner, then click _Manage Passkeys_
3. (Optional) Type a name for the passkey, such as the device it is stored on
4. Click _Add passkey_ and follow the prompt from your browser or device

The passkey now appears in the list. You can add up to 20 passkeys, for example one for each device you use.

A passkey only works on the address it was added on. If you move your bot to a different address or port, add a new passkey there.

## Signing In With a Passkey

1. Open the panel login page
2. (Optional) Choose how long to stay signed in under _Remember me_
3. Click _Sign in with a passkey_ and follow the prompt

You do not need to type your username. If your device holds passkeys for more than one panel user, it asks which one to use.

How long you stay signed in depends on the _Remember me_ option

| Remember me | Signed in for |
| --- | --- |
| Until I Close the Tab / Until I Close the Browser Window | Until the browser is closed, at most 24 hours |
| A number of hours or days | That long |
| Until I Click "Sign Out" On The Panel (Forever) | 30 days |

Restarting the bot signs out everyone who signed in with a passkey. Signing in again only takes the passkey prompt.

Signing in with a passkey as the main login from _botlogin.txt_ also opens the _Bot Setup_ and _OAuth_ pages, as its password does.

## Removing a Passkey

1. Click your name in the top-right corner, then click _Manage Passkeys_
2. Click the <i class="fa fa-trash"></i> button next to the passkey

The passkey stops working immediately, and anyone signed in with it is signed out. Your device may keep offering the removed passkey. It can be deleted from the device in the passkey settings of your operating system, browser or password manager.

## Signing In With Passkeys Only

A user created under _Settings > Panel Users_ can turn their password off, so that only their passkeys sign them in

1. Sign in with a passkey. Signing in with the password is not enough, so the bot knows the passkey works on this address. After a password sign-in, _Manage Passkeys_ says so instead of offering the button
2. Click your name in the top-right corner, then click _Manage Passkeys_
3. Click _Turn off password sign-in_ and confirm. The _Change Password_ dialog offers the same, as _Turn off password sign-in instead_

From then on, the password is not accepted. Devices that signed in with it lose access the next time they connect to the bot.

While your password is off

- _Change Password_ is called _Set Password_ and does not ask for a current password. Setting one turns password sign-in back on
- Your last passkey can not be removed, so you can not lock yourself out. Set a password first
- The Remote Panel on _phantombot.dev_ can not be used, because it only signs in with a password

For the login from _botlogin.txt_, see **Making the Main Login Passkey-Only** instead.

## Passkey Setup Links

A setup link lets a panel user add a passkey without signing in. It is an alternative to the temporary password of a new user, or of a user whose password was reset.

When you add a user or reset their password under _Settings > Panel Users_, the dialog that shows the temporary password also shows a setup link. Give the user one of the two. For an existing user, click the <i class="fa fa-key"></i> button of the user, then click _Copy_ and send the link to the user. The console command `paneluser setuplink username` prints one as well, also for the login from _botlogin.txt_, which then signs in with passkeys only (see **Making the Main Login Passkey-Only**).

The user opens the link, clicks _Set up a passkey_ and follows the prompt, and is then signed in to the panel.

- A link works once, for 24 hours. Making a new link for a user replaces their earlier one
- A user who has not changed their temporary password yet loses it when they use the link, and signs in with passkeys only. A user who chose their own password keeps it
- The passkey works on the address in the link. The panel uses the address it is open on. The console uses `localhost`, the bot's port and `https` unless `usehttps` is `false`, so replace that part with the address the user opens the panel on
- A disabled user can not use their link until they are enabled again
- The panel only offers links where _Manage Passkeys_ is shown, so where passkeys can not work (see the **Requirements**) adding or resetting a user shows only the temporary password. If a link is opened where passkeys can not work, the page says so and still offers the normal sign-in
- Resetting the password of a user, renaming them or deleting them makes their link stop working

## Making the Main Login Passkey-Only

The login from _botlogin.txt_ (`paneluser`) gets its password from the `panelpassword` setting, so it is turned off with the `panelpasswordless` setting. There are two ways to turn it on

- Use a setup link for the main login. When a new bot creates its panel password, it also prints a setup link in the console (with Docker, shown by `docker logs CONTAINERNAME`), and `paneluser setuplink` with the name of the main login prints one at any time. Adding a passkey with it turns `panelpasswordless` on, removes `panelpassword` from _botlogin.txt_ and replaces `webauth`, the token that earlier password sign-ins of the main login use, so those browsers have to sign in again the next time they connect, and the Remote Panel loses access. Use either the password or the link: using the link later, even after signing in with the password, still makes the main login passkey-only
- Set `panelpasswordless` to `true` in the _Panel Login_ section of the _Bot Setup_ page, or in _botlogin.txt_ while the bot is stopped. Add a passkey to the main login first, otherwise the bot prints a setup link for it in the console. This keeps `webauth`, so browsers that saved a password sign-in stay signed in (see below)

Using a setup link or the _Bot Setup_ page applies it at once, without a restart.

This does not undo everything the password allowed. Panel pages that are already open stay connected until they are reloaded, panel users and passkeys added earlier are kept, and the other tokens in _botlogin.txt_, such as `ytauth` for the Song Requests player, are not replaced. If someone else may have known the password, check _Settings > Panel Users_ and _Manage Passkeys_, then stop the bot, remove the `webauth`, `ytauth` and `ytauthro` lines from _botlogin.txt_ and start the bot, which creates new ones.

While `panelpasswordless` is on

- `panelpassword` is not accepted anywhere, also not by the logins whose names end in `_RO`, `_YT` or `_YT_RO`. Their tokens keep working for the tools that use them
- A new bot does not create a panel password
- A `panelpassword` set with `panelsetup` or on the _Bot Setup_ page is not used until `panelpasswordless` is turned off
- The last passkey of the main login can not be removed
- The main login can not use the Remote Panel on _phantombot.dev_
- While the main login has no passkey, the bot prints a setup link for it in the console each time it starts and each time its settings are saved
- As always, the _Bot Setup_ and _OAuth_ pages also accept the login that the bot prints in the console when the _Bot Setup_ page is opened, starting with `User for Setup Login: Token`

**Warning:** turn this on only when passkeys work for your bot, as described in the **Requirements** above. The default self-signed certificate, which a Docker container also uses unless `usehttps` is changed, does not meet them, and the main login can then not sign in to the panel until `panelpasswordless` is turned off again.

To sign in with the password again, turn `panelpasswordless` off on the _Bot Setup_ page (a passkey sign-in of the main login, or the console login starting with `User for Setup Login: Token`, opens it), or stop the bot, set it to `false` in _config/botlogin.txt_ and start the bot. If `panelpassword` is empty, which it is after a setup link turned `panelpasswordless` on, enter a new `panelpassword` at the same time, otherwise the bot creates one and prints it in the console.

## Managing Passkeys of Other Panel Users

Users with permission to manage panel users can not see or add passkeys for someone else, but these actions under _Settings > Panel Users_ affect them

| Action | Effect on the user's passkeys |
| --- | --- |
| Reset password | All passkeys and any earlier setup link are removed (the reset dialog offers a new link), the user is signed out, and their login token for the Remote Panel stops working for new connections. A passkey-only user gets a password again. Use this when an account may have been used by someone else |
| Disable | Passkeys are kept but can not be used to sign in until the user is enabled again, and the user is signed out |
| Rename | Passkeys are kept, the setup link is removed and the user is signed out |
| Delete | All passkeys and the setup link are removed |

The console command `paneluser resetpassword username` removes passkeys in the same way.

The passkeys of the login from _botlogin.txt_ can only be removed by that login, under _Manage Passkeys_.

## Troubleshooting

- _Sign in with a passkey_ or _Manage Passkeys_ is missing
  - Check the address against the **Requirements** above. The most common causes are opening the panel by IP address or using the default self-signed certificate
- A message says the passkey prompt is not allowed on this address
  - Your browser does not accept the certificate of the panel, which is the case for the default self-signed certificate. See the **Requirements** above
- The prompt appears but signing in fails
  - The passkey may have been removed from the panel, or the user may be disabled. Sign in with the password, or a passkey from another device, and check _Manage Passkeys_
  - The panel may be open on a different address or port than the one the passkey was added on
- The device does not offer a passkey
  - Passkeys are stored on the device or in the password manager that created them. Sign in with the password, or a passkey from another device, and add a passkey on this device. A user who signs in with passkeys only and has no other device can ask for a setup link
- A user who signs in with passkeys only has lost all of them
  - Reset their password under _Settings > Panel Users_, or send them a setup link
- The main login signs in with passkeys only and has lost all of them
  - Set `panelpasswordless` to `false` as described in **Making the Main Login Passkey-Only**, or run `paneluser setuplink` with the name of the main login in the console
  - With Docker, where console commands can not be entered, open the _Bot Setup_ page with the console login (shown by `docker logs CONTAINERNAME` when the page is opened) and turn `panelpasswordless` off, or stop the container and edit _botlogin.txt_ in its data volume
- The main login can not use passkeys at all
  - Passkeys are not available to the main login while a user under _Settings > Panel Users_ has the same name. Rename or delete that user
- A setup link says it has expired or was already used
  - Ask for a new link. While `panelpasswordless` is on, the main login gets a new one each time the bot starts or its settings are saved, as long as it has no passkey
