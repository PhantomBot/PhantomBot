# API Secrets

API secrets are saved values, such as API keys or passwords, that the [(api) command tag](guide=content/commands/command-variables&jumpto=global-command-tags_api_api "##guide_link") can send without the value being written into the command.

&nbsp;

<!-- toc -->

&nbsp;

## Saving A Secret

1. Open the panel and go to _Commands_ > _Custom_, or _Discord_ > _Custom_
2. Click _API Secrets_
3. Enter a name and the value, then click _Save_

The name can contain letters, numbers, and underscores. A saved secret cannot be viewed again. To change a secret, save it again with the same name.

Saving and removing secrets needs write access to the _Commands_ section of the panel, also on the Discord page.

&nbsp;

## Removing A Secret

The dialog lists the names of the saved secrets under _Saved Secrets_. Select a name and click _Remove_.

&nbsp;

## Using A Secret

Write `$secret.` followed by the name in the URL, a header, or the body of an `(api)` tag

```text
(api https://example.com/weather?key=$secret.weather&q=$1 -> Weather in {location.name})
(api POST https://example.com/hook [Authorization: Bearer $secret.hook] msg=$1 -> Sent)
```

A secret is encoded like an argument in the same part of the request. Because of this, a `/` in a secret placed in the URL is sent as `%2F`. If a URL needs a `/` between two private values, such as the id and token of a webhook, save them as two secrets.

Secrets are never replaced in a reply. A request that uses a name that is not saved is not sent, and is written to the bot's error log.

&nbsp;

## Keeping Secrets Safe

**WARNING:** Anyone who can add or edit commands, keywords, or other responses that use command tags can use any saved secret, including in a request to a server of their own. Only give that access to people you trust with your secrets.

- An API that sends the request back in its response can cause a secret to be shown in chat
- Use `$1` to `$9`, or `$1>` to `$9>`, for anything typed by a viewer. Other tags, such as `(1)`, are read as part of the `(api)` tag, so a viewer could type `$secret.` and a name to put any saved secret into the request
- If the API redirects the request to another address, the bot follows it and sends the headers there as well, except `Authorization`. Put a secret in an `Authorization` header when the API allows it
- With the `wsdebug` or `httpclientdebug` bot property on, the values of saved secrets can be written to the bot's debug log. Turn them off again after debugging
