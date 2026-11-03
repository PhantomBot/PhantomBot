# api.request Function

The `$.api.request` function sends an HTTP request from a script and returns the response. It is what the [(api) command tag](guide=content/commands/command-variables&jumpto=global-command-tags_api_api "##guide_link") uses to send its requests.

### Syntax

`$.api.request(method, url, headers, body);`

## Parameters

- **method**: the HTTP method, such as `'GET'`, `'POST'`, `'PUT'`, `'PATCH'`, or `'DELETE'`
- **url**: the URL to request
- **headers**: an object with the header names and values to send, such as `{'Content-Type': 'application/json'}`, or `null`
- **body**: the request body as a string, or `null`

The body is sent exactly as given, and no `Content-Type` is added for you, so set it in the headers. `User-Agent` and `Content-Length` are filled in when they are not given. A user name and password in the URL are not sent; use an `Authorization` header instead.

## Return Value

An object with these properties:

- **status**: the HTTP status code, or `0` if there was no response, such as after a timeout or when the server cannot be reached
- **body**: the text of the response; empty if there was no response
- **success**: `true` for a status from 1 to 399
- **exception**: the Java exception if there was no response; otherwise `null`

The function throws an error if the request cannot be sent at all, such as for a URL that cannot be read or an invalid header name. A URL that cannot be read is written to the bot's error log, including any secret in it.

The function waits for the response. The bot follows redirects, and gives up after the time set by the `httpclienttimeout` bot property (10 seconds by default).

## Example

```javascript
let response = $.api.request('POST', 'https://example.com/items', {'Content-Type': 'application/json'}, JSON.stringify({name: 'banana'}));

if (response.success) {
    $.say('Added item ' + JSON.parse(response.body).id);
} else if (response.status === 0) {
    $.log.error('The item service did not answer: ' + response.exception);
} else {
    $.log.error('The item service returned ' + response.status);
}
```

## $.customAPI

`$.customAPI` is deprecated. Its functions (`get`, `post`, `put`, `del`, and `getJSON`) work as they did before, and now send their requests through `$.api.request`. New scripts should use `$.api.request`.
