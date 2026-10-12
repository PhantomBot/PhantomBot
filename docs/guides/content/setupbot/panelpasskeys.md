# Panel Passkeys

&nbsp;

<!-- toc -->

<!-- tocstop -->

&nbsp;

A passkey lets you sign in to the panel with your fingerprint, face, device PIN or a security key instead of typing your panel password. Passkeys are optional. Your password keeps working, and you can use either one each time you sign in.

The main login from _botlogin.txt_ and every user created under _Settings > Panel Users_ can have their own passkeys. The additional logins that the bot derives from it, whose names end in `_RO`, `_YT` or `_YT_RO`, can not use passkeys.

## Requirements

Browsers only allow passkeys on addresses they consider secure. Passkeys are available when **all** of the following are true

- You open the panel directly from your bot, not from the Remote Panel on _phantombot.dev_
- The address uses a name, not an IP address
- The address is one of
  - `https://` with a certificate that your browser accepts **without a warning**, such as a certificate from Let's Encrypt or a reverse proxy that provides one
  - `http://localhost`, for a bot running on the same computer as your browser with `usehttps=false`

The self-signed certificate that the bot creates by default does **not** meet these requirements, because browsers show a warning for it. See **[Enable Twitch Embeds](guide=content/integrations/twitchembeds "##guide_link")** for the ways to give your bot a certificate that browsers accept.

When the panel can tell that the requirements are not met, the passkey buttons are hidden and the panel works as it always has. A browser does not tell the panel about a certificate warning, so with the default self-signed certificate the buttons may still be shown, and using them fails with a message.

## Adding a Passkey

1. Sign in to the panel with your password
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

The _Bot Setup_ and _OAuth_ pages always ask for the panel password, even after signing in with a passkey.

## Removing a Passkey

1. Click your name in the top-right corner, then click _Manage Passkeys_
2. Click the <i class="fa fa-trash"></i> button next to the passkey

The passkey stops working immediately, and anyone signed in with it is signed out. Your device may keep offering the removed passkey. It can be deleted from the device in the passkey settings of your operating system, browser or password manager.

## Managing Passkeys of Other Panel Users

Users with permission to manage panel users can not see or add passkeys for someone else, but these actions under _Settings > Panel Users_ affect them

| Action | Effect on the user's passkeys |
| --- | --- |
| Reset password | All passkeys are removed, the user is signed out, and their login token for the Remote Panel stops working for new connections. Use this when an account may have been used by someone else |
| Disable | Passkeys are kept but can not be used to sign in until the user is enabled again, and the user is signed out |
| Rename | Passkeys are kept and the user is signed out |
| Delete | All passkeys are removed |

The console command `paneluser resetpassword username` removes passkeys in the same way.

The passkeys of the login from _botlogin.txt_ can only be removed by that login, under _Manage Passkeys_.

## Troubleshooting

- _Sign in with a passkey_ or _Manage Passkeys_ is missing
  - Check the address against the **Requirements** above. The most common causes are opening the panel by IP address or using the default self-signed certificate
- A message says the passkey prompt is not allowed on this address
  - Your browser does not accept the certificate of the panel, which is the case for the default self-signed certificate. See the **Requirements** above
- The prompt appears but signing in fails
  - The passkey may have been removed from the panel, or the user may be disabled. Sign in with the password and check _Manage Passkeys_
  - The panel may be open on a different address or port than the one the passkey was added on
- The device does not offer a passkey
  - Passkeys are stored on the device or in the password manager that created them. Sign in with the password and add a passkey on this device
