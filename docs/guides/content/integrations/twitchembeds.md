# Enable Twitch embeds

Due to changes by Twitch, the chat and live feed panel can no longer be displayed without a proper SSL setup.

To make it work:
- SSL certificate required
- URL must not contain a port number

NOTE: If you access your panel at _localhost:25000_, the port number requirement does not apply.

If you are not interested in the Twitch chat and live feed panels, you do not need to make any changes to your bot.

There are three methods for fixing the embeds:

## Method 1: PhantomBot Remote Panel

We have setup a remote copy of the panel on this GitHub Pages site that is fully comliant with Twitch's changes.

This panel does not send any data to us. All communication of credentials and commands is directly with your bot.

### Setup SSL

The bot should generate a self-signed SSL certificate automatically for you.

The bot will automatically generate and renew this certificate for you as long as:
- You either do not have a `usehttps=` line in your _botlogin.txt_, or it is set to `true`
- You either do not have a `httpsFileName=` line in your _botlogin.txt_, or it has no value after the `=`

#### Trust the Self-Signed Certificate

Since the SSL certificate is self-signed, your browser/OS will not trust it by default.

##### OBS

**NOTE:** These instructions are written for Windows, but the idea of adding the extra launch parameter remains the same for other OSes.

1. Open a File Explorer window and navigate to C:\ProgramData\Microsoft\Windows\Start Menu\Programs\OBS Studio (Or whichever shortcut you use to launch OBS Studio)
2. Right-click the shortcut and hit Properties
3. In the Target box, add  --ignore-certificate-errors to the end
So it should look similar to "C:\Program Files\obs-studio\bin\64bit\obs64.exe" --ignore-certificate-errors (NOTE: The positioning of the quotes " is very important)

**NOTE:** If you then use that shortcut to launch OBS Studio, it should disable validity checking of SSL Certificates, with the obvious downside that it won't protect you from other websites having bad or malicious SSL certificates either.

##### Windows and Linux

Connect to your bot's built-in webserver (eg. `https://192.168.0.2:25000/`) and your browser will warn you about the certificate being untrusted.

Your browser should provide a _More_ or a _Details_ button which will then reveal some kind of _Proceed Anyway_ or _Accept Risk & Continue_ button.

Once you have done this and the bot's main page has loaded, you're done with this step.

##### macOS

**NOTE:** Steps 2 and 3 are based on using Chrome for Mac.

1. Connect to your bot's built-in webserver (eg. `https://192.168.0.2:25000/`) and your browser will warn you about the certificate being untrusted.

2. In the address bar, click the little lock with the X. This will bring up a small information screen. Click the button that says _Certificate Information_.

3. Click and drag the image that looks like a little certificate to your desktop.

4. Double-click the certificate on your desktop. This will bring up the _Keychain Access_ utility. Enter your password to unlock it.

5. Be sure you add the certificate to the **System** keychain, not the login keychain. Click _Always Trust_, even though this doesn’t seem to do anything.

6. After the certificate has been added, double-click it in the _Keychain Access_ certificate list. You may have to authenticate again.

7. Expand the _Trust_ section. Find the option _When using this certificate_ and set it to _Always Trust_.

8. Close and restart the browser.

### Launch the PhantomBot Remote Panel

Once SSL is setup and trusted, just navigate to [PhantomBot](https://phantombot.github.io/PhantomBot/) and launch the panel from there.

&nbsp;

## Method 2: Setup SSL and Change the Baseport

For this method, follow the steps in Method 1 for setting up and trusting the self-signed SSL certificate, or install your own SSL certificate from a trusted internet Certificate Authority.

After setting up the SSL certificate, change (or add, if this line is missing) the `baseport=` in your _botlogin.txt_ to a value of 443.

Once you restart the bot you can access the panel without using a port number (eg. `https://192.168.0.2`).

**NOTE:** This method is not compatible with bots running on servers or other devices that already have a webserver running on them with SSL enabled.

**NOTE:** You may have to run the bot as root to enable it to bind to port 443.

&nbsp;

## Method 3: Setup a Reverse Proxy

If you are running the bot on a server that already has a running webserver with SSL enabled, you can lookup how to setup a reverse proxy on a subdomain that links to the bot's webserver.

If you have the webserver and a domain, but have not yet setup SSL, consider looking into [Let's Encrypt](https://letsencrypt.org/) and using the [Certbot](https://certbot.eff.org/) client to get a free basic SSL certificate for life.

#### NGINX Sample Config

```
upstream phantombot {
    server 127.0.0.1:25000; # set this to the IP:Baseport of the bot
}

server {
    listen 80;
    listen [::]:80;
    server_name <servername>; # Server name is the domain or sub-domain
    return 301 https://$server_name;
}

server {
    listen              443 ssl http2;
    server_name         <servername>; # Server name is the domain or sub-domain
    large_client_header_buffers 4 32k; # Very important to prevent unexplained 400 errors
    ssl_certificate /etc/letsencrypt/live/<domain>/fullchain.pem; # managed by Certbot, replace with the appropriate path
    ssl_certificate_key /etc/letsencrypt/live/<domain>/privkey.pem; # managed by Certbot, replace with the appropriate path
    ssl_protocols       TLSv1.3;
    ssl_ciphers ECDH+AESGCM:DH+AESGCM:ECDH+AES256:DH+AES256:ECDH+AES128:DH+AES:ECDH+3DES:DH+3DES:RSA+AESGCM:RSA+AES:RSA+3DES:!aNULL:!MD5;
 
    location / {
        proxy_pass http://phantombot;
    }
 
    error_log /var/log/nginx/twitch_error.log;
    access_log /var/log/nginx/twitch_access.log;
}
```
Edit the corresponding fields as you needs, `<servername>`, and `<domain>`.


#### Apache2.4 Sample Config

```
<VirtualHost <servername>:80>
    ServerName <servername>

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined

    RewriteEngine on
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName <servername>

    SSLEngine On
    SSLCertificateFile    <path>
    SSLCertificateKeyFile <path>
    SSLCertificateChainFile <path>
    
    ProxyRequests On
    ProxyPass "/ws/" "ws://127.0.0.1:25000/ws/"
    ProxyPassReverse "/ws/" "ws://127.0.0.1:25000/ws/"
    ProxyPass "/" "http://127.0.0.1:25000/"
    ProxyPassReverse "/" "http://127.0.0.1:25000/"

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```
Edit the corresponding fields as you needs, `<servername>` and `<path>`.
