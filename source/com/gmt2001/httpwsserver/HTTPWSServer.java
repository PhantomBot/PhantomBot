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
package com.gmt2001.httpwsserver;

import com.gmt2001.Console.err;
import com.gmt2001.ExecutorService;
import com.gmt2001.PathValidator;
import com.gmt2001.dns.EventLoopDetector;
import com.gmt2001.httpwsserver.x509.SelfSignedX509CertificateGenerator;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.Channel;
import io.netty.channel.EventLoopGroup;
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.util.IllegalReferenceCountException;
import io.netty.util.ReferenceCounted;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.security.InvalidKeyException;
import java.security.Key;
import java.security.KeyPair;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SignatureException;
import java.security.UnrecoverableKeyException;
import java.security.cert.Certificate;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.TrustManagerFactory;
import tv.phantombot.CaselessProperties;
import tv.phantombot.CaselessProperties.Transaction;
import tv.phantombot.PhantomBot;

/**
 * Provides a HTTP 1.1 server with WebSocket support
 *
 * @author gmt2001
 */
public final class HTTPWSServer {

    /**
     * An instance of {@link HTTPWSServer}
     */
    private static final HTTPWSServer INSTANCE = new HTTPWSServer();

    /**
     * Releases a {@link ReferenceCounted} object
     *
     * @param obj The object to release
     */
    public static void releaseObj(ReferenceCounted obj) {
        try {
            if (obj != null && obj.refCnt() > 0) {
                obj.release();
            }
        } catch (IllegalReferenceCountException ex) {
            err.printStackTrace(ex);
        }
    }
    /**
     * The server's {@link EventLoopGroup}
     */
    private final EventLoopGroup group = EventLoopDetector.createEventLoopGroup();
    /**
     * The server's listen {@link Channel}
     */
    private Channel ch;
    /**
     * The secondary channel, used for port 80 when the primary channel is port 443
     */
    private Channel ch2;

    private boolean sslEnabled = false;
    private boolean autoSSL = false;
    private SslContext sslCtx;
    private Instant nextAutoSslCheck = Instant.now();
    private Instant lastSslModified = Instant.MIN;
    private Instant lastSslKeyModified = Instant.MIN;
    private static final String AUTOSSLKEYALIAS = "phantombot";
    private static final String AUTOSSLFILE = "./config/selfkey.jks";
    private static final String AUTOSSLPASSWORD = "pbselfsign";
    private static final int FINDPORTLIMIT = 20;

    /**
     * Gets the server instance
     *
     * @return An initialized {@link HTTPWSServer}
     */
    public static HTTPWSServer instance() {
        return INSTANCE;
    }

    /**
     * Constructor
     */
    private HTTPWSServer() {
        /**
         * @botproperty bindip - The IP address the bots webserver runs on. Default all
         * @botpropertycatsort bindip 200 700 HTTP/WS
         * @botpropertyrestart bindip
         */
        /**
         * @botproperty baseport - The port the bots webserver runs on. Default `25000`
         * @botpropertycatsort baseport 20 700 HTTP/WS
         * @botpropertyrestart baseport
         */
        /**
         * @botproperty usehttps - If `true`, the bots webserver uses HTTPS to secure the connection. Default `true`
         * @botpropertycatsort usehttps 30 700 HTTP/WS
         * @botpropertyrestart usehttps
         */
        /**
         * @botproperty httpsFileName - If httpsKeyFileName is unset/blank, a JKS containing the certificate; else, an X509 Certificate in PEM format
         * @botpropertycatsort httpsFileName 40 700 HTTP/WS
         * @botpropertyrestart httpsFileName
         */
        /**
         * @botproperty httpsKeyFileName - The PKCS#8 private key in PEM format for httpsFileName; if unset/blank, httpsFileName is loaded as a JKS
         * @botpropertycatsort httpsKeyFileName 50 700 HTTP/WS
         * @botpropertyrestart httpsKeyFileName
         */
        /**
         * @botproperty httpsPassword - The password, if any, to _httpsFileName_
         * @botpropertycatsort httpsPassword 60 700 HTTP/WS
         * @botpropertyrestart httpsPassword
         */
        String ipOrHostname = CaselessProperties.instance().getProperty("bindIP", "");
        int initialPort = CaselessProperties.instance().getPropertyAsInt("baseport", 25000);
        boolean useHttps = CaselessProperties.instance().getPropertyAsBoolean("usehttps", true);
        String sslFile = CaselessProperties.instance().getProperty("httpsFileName", "");
        String botName = PhantomBot.instance().getBotName();

        int port = findAvailablePort(ipOrHostname, initialPort, initialPort);

        if (port == -1) {
            com.gmt2001.Console.err.println();
            com.gmt2001.Console.err.println();
            com.gmt2001.Console.err.println("Port is already in use: " + initialPort);
            com.gmt2001.Console.err.println("Ensure that another copy of PhantomBot is not running.");
            com.gmt2001.Console.err.println("If another copy is not running, try to change baseport in ./config/botlogin.txt");
            com.gmt2001.Console.err.println("PhantomBot will now exit.");
            com.gmt2001.Console.err.println();
            com.gmt2001.Console.err.println();
            PhantomBot.exitError();
        } else if (port != initialPort) {
            com.gmt2001.Console.warn.println();
            com.gmt2001.Console.warn.println();
            com.gmt2001.Console.warn.println("Port is already in use: " + initialPort);
            com.gmt2001.Console.warn.println("Switching to an alternate port: " + port);
            com.gmt2001.Console.warn.println();
            com.gmt2001.Console.warn.println();
            Transaction t = CaselessProperties.instance().startTransaction();
            t.setProperty("baseport", port);
            t.commit();
        }

        try {
            if (useHttps) {
                if (sslFile.isBlank()) {
                    this.autoSSL = true;
                    if (!Files.exists(PathValidator.getRealPath(AUTOSSLFILE))) {
                        com.gmt2001.Console.debug.println("No Auto-SSL File. Generating...");
                        this.generateAutoSsl(botName);
                    }
                }

                this.reloadSslContext();

                this.setupSslWatcher();

                this.sslEnabled = true;
            } else {
                this.sslCtx = null;
            }

            ServerBootstrap b = new ServerBootstrap();
            b.group(this.group)
                    .channel(EventLoopDetector.getServerChannelClass())
                    .childHandler(new HTTPWSServerInitializer());

            if (ipOrHostname.isBlank()) {
                this.ch = b.bind(port).sync().channel();
            } else {
                this.ch = b.bind(ipOrHostname, port).sync().channel();
            }

            if (port == 443) {
                try {
                    if (ipOrHostname.isBlank()) {
                        this.ch2 = b.bind(80).sync().channel();
                    } else {
                        this.ch2 = b.bind(ipOrHostname, 80).sync().channel();
                    }
                } catch (InterruptedException ex2) {
                    this.ch2 = null;
                    com.gmt2001.Console.out.println("Unable to bind port 80, going with only 443...");
                    com.gmt2001.Console.err.printStackTrace(ex2);
                }
            }
        } catch (IOException | NoSuchAlgorithmException | CertificateException | KeyStoreException | UnrecoverableKeyException | InterruptedException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            this.group.shutdownGracefully();
        }
    }

    private static int findAvailablePort(String bindIp, int initialPort, int port) {
        try ( ServerSocket serverSocket = bindIp.isEmpty() ? new ServerSocket(port) : new ServerSocket(port, 1, java.net.InetAddress.getByName(bindIp))) {
            serverSocket.setReuseAddress(true);
            com.gmt2001.Console.debug.println("Port available " + port);
            return port;
        } catch (IOException ex) {
            if (port - initialPort >= FINDPORTLIMIT || port >= 65535) {
                com.gmt2001.Console.debug.println("Port limit reached " + initialPort + " " + port);
                com.gmt2001.Console.debug.printStackTrace(ex);
                return -1;
            } else {
                com.gmt2001.Console.debug.println("Port not available " + port);
                return findAvailablePort(bindIp, initialPort, port + 1);
            }
        }
    }

    public boolean isSsl() {
        /**
         * @botproperty proxybypasshttps - If `true`, the HTTP server reports SSL is enabled, even if `usessl` is `false`. Default `false`
         * @botpropertycatsort proxybypasshttps 80 700 HTTP/WS
         * @botpropertyrestart proxybypasshttps
         */
        return this.sslEnabled || CaselessProperties.instance().getPropertyAsBoolean("proxybypasshttps", false);
    }

    public boolean isAutoSsl() {
        return this.autoSSL;
    }

    void generateAutoSsl() {
        this.generateAutoSsl(PhantomBot.instance().getBotName());
    }

    void generateAutoSsl(boolean forceNew) {
        this.generateAutoSsl(PhantomBot.instance().getBotName(), forceNew);
    }

    void generateAutoSsl(String botName) {
        this.generateAutoSsl(botName, false);
    }

    private void setupSslWatcher() {
        ExecutorService.scheduleAtFixedRate(() -> {
            String sslFile = CaselessProperties.instance().getProperty("httpsFileName", "");
            String sslKeyFile = CaselessProperties.instance().getProperty("httpsKeyFileName", "");

            if (sslFile.isBlank()) {
                sslFile = AUTOSSLFILE;
            }

            try {
                Instant lastModified;
                boolean reload = false;
                if (Files.exists(PathValidator.getRealPath(sslFile))) {
                    lastModified = Files.getLastModifiedTime(PathValidator.getRealPath(sslFile)).toInstant();
                    if (lastModified.isAfter(this.lastSslModified)) {
                        if (this.lastSslModified != Instant.MIN) {
                            reload = true;
                        }

                        this.lastSslModified = lastModified;
                    }
                }

                if (!sslKeyFile.isBlank() && Files.exists(PathValidator.getRealPath(sslKeyFile))) {
                    lastModified = Files.getLastModifiedTime(PathValidator.getRealPath(sslKeyFile)).toInstant();
                    if (lastModified.isAfter(this.lastSslKeyModified)) {
                        if (this.lastSslKeyModified != Instant.MIN) {
                            reload = true;
                        }

                        this.lastSslKeyModified = lastModified;
                    }
                }

                if (reload) {
                    try {
                        this.reloadSslContext();
                    } catch (NoSuchAlgorithmException | CertificateException | KeyStoreException | UnrecoverableKeyException ex) {
                        com.gmt2001.Console.err.printStackTrace(ex);
                    }
                }
            } catch (IOException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }, 1, 30, TimeUnit.SECONDS);
    }

    /**
     * Manages generation of the AutoSsl certificate
     *
     * @param botName The bot name to use in the certificates DN
     * @param forceNew If true, forces a brand new key pair to be generated
     */
    void generateAutoSsl(String botName, boolean forceNew) {
        if (!this.autoSSL) {
            return;
        }

        String sslFile = AUTOSSLFILE;
        String sslPass = AUTOSSLPASSWORD;

        try {
            KeyStore ks = KeyStore.getInstance("JKS");
            ks.load(null, sslPass.toCharArray());
            KeyPair kp = null;

            try {
                if (Files.exists(PathValidator.getRealPath(sslFile))) {
                    try ( InputStream inputStream = Files.newInputStream(PathValidator.getRealPath(sslFile))) {
                        ks.load(inputStream, sslPass.toCharArray());
                    }
                }

                if (!forceNew) {
                    Key key = ks.getKey(AUTOSSLKEYALIAS, sslPass.toCharArray());
                    if (key instanceof PrivateKey) {
                        // Get certificate of public key
                        Certificate cert = ks.getCertificate(AUTOSSLKEYALIAS);

                        // Get public key
                        PublicKey publicKey = cert.getPublicKey();

                        // Return a key pair
                        kp = new KeyPair(publicKey, (PrivateKey) key);
                    }
                }
            } catch (IOException | CertificateException | KeyStoreException | NoSuchAlgorithmException | UnrecoverableKeyException ex) {
            }

            try {
                if (kp == null) {
                    kp = SelfSignedX509CertificateGenerator.generateKeyPair(SelfSignedX509CertificateGenerator.RECOMMENDED_KEY_SIZE);
                }

                String dn = SelfSignedX509CertificateGenerator.generateDistinguishedName("PhantomBot." + botName);

                X509Certificate cert = SelfSignedX509CertificateGenerator.generateCertificate(dn, kp,
                        SelfSignedX509CertificateGenerator.RECOMMENDED_VALIDITY_DAYS, SelfSignedX509CertificateGenerator.RECOMMENDED_SIG_ALGO);

                ks.setKeyEntry(AUTOSSLKEYALIAS, kp.getPrivate(), sslPass.toCharArray(), new Certificate[]{cert});

                try ( OutputStream outputStream = Files.newOutputStream(PathValidator.getRealPath(sslFile))) {
                    ks.store(outputStream, sslPass.toCharArray());
                }

                this.reloadSslContext();

                this.nextAutoSslCheck = Instant.now().plus(1, ChronoUnit.DAYS);
            } catch (IOException | InvalidKeyException | NoSuchProviderException | SignatureException | CertificateException | UnrecoverableKeyException
                    | KeyStoreException | NoSuchAlgorithmException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } catch (IOException | KeyStoreException | NoSuchAlgorithmException | CertificateException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    private void reloadSslContext() throws IOException, NoSuchAlgorithmException, CertificateException, KeyStoreException, UnrecoverableKeyException {
        String sslFile = CaselessProperties.instance().getProperty("httpsFileName", "");
        String sslKeyFile = CaselessProperties.instance().getProperty("httpsKeyFileName", "");

        if (sslFile.isBlank()) {
            if (Files.exists(PathValidator.getRealPath(AUTOSSLFILE))) {
                com.gmt2001.Console.debug.println("Using Auto-SSL");
                this.reloadSslContextJKS();
            }
        } else if (sslFile.toLowerCase().endsWith(".jks") || sslKeyFile.isBlank()) {
            com.gmt2001.Console.debug.println("Using JKS");
            this.reloadSslContextJKS();
        } else {
            com.gmt2001.Console.debug.println("Using X.509");
            this.reloadSslContextX509();
        }
    }

    /**
     * Reloads the SslContext using a JKS
     *
     * @throws IOException
     * @throws NoSuchAlgorithmException
     * @throws CertificateException
     * @throws KeyStoreException
     * @throws UnrecoverableKeyException
     */
    private void reloadSslContextJKS() throws IOException, NoSuchAlgorithmException, CertificateException, KeyStoreException, UnrecoverableKeyException {
        String sslFile = CaselessProperties.instance().getProperty("httpsFileName", "");
        String sslPass = CaselessProperties.instance().getProperty("httpsPassword", "");

        if (sslFile.isBlank()) {
            sslFile = AUTOSSLFILE;
            sslPass = AUTOSSLPASSWORD;
        }

        com.gmt2001.Console.debug.println("Opening JKS at " + sslFile);

        KeyStore ks = KeyStore.getInstance("JKS");
        try ( InputStream inputStream = Files.newInputStream(PathValidator.getRealPath(sslFile))) {
            ks.load(inputStream, sslPass.toCharArray());

            KeyManagerFactory kmf = KeyManagerFactory.getInstance("SunX509");
            kmf.init(ks, sslPass.toCharArray());

            TrustManagerFactory tmf = TrustManagerFactory.getInstance("SunX509");
            tmf.init(ks);

            com.gmt2001.Console.debug.println("Building context with KMF/TMF");
            this.sslCtx = SslContextBuilder.forServer(kmf).trustManager(tmf).build();
        }
    }

    /**
     * Reloads the SslContext using an X509 Certificate
     *
     * @throws IOException
     * @throws NoSuchAlgorithmException
     * @throws CertificateException
     * @throws KeyStoreException
     * @throws UnrecoverableKeyException
     */
    private void reloadSslContextX509() throws IOException, NoSuchAlgorithmException, CertificateException, KeyStoreException, UnrecoverableKeyException {
        String sslFile = CaselessProperties.instance().getProperty("httpsFileName", "");
        String sslKeyFile = CaselessProperties.instance().getProperty("httpsKeyFileName", "");
        String sslPass = CaselessProperties.instance().getProperty("httpsPassword", "");
        com.gmt2001.Console.debug.println("Opening chain PEM at " + sslFile);
        try ( InputStream inputStreamX = Files.newInputStream(PathValidator.getRealPath(sslFile))) {
            com.gmt2001.Console.debug.println("Opening key PEM at " + sslKeyFile);
            try ( InputStream inputStreamK = Files.newInputStream(PathValidator.getRealPath(sslKeyFile))) {
                com.gmt2001.Console.debug.println("Building context with streams");
                this.sslCtx = SslContextBuilder.forServer(inputStreamX, inputStreamK, sslPass.isBlank() ? null : sslPass).build();
            }
        }
    }

    /**
     * Checks if the AutoSsl certificate requires renewal, and triggers it
     */
    private void renewAutoSsl() {
        String sslFile = AUTOSSLFILE;
        String sslPass = AUTOSSLPASSWORD;

        try {
            if (!Files.exists(PathValidator.getRealPath(sslFile))) {
                com.gmt2001.Console.debug.println("Auto-SSL JKS missing, generating a new one...");
                this.generateAutoSsl();
            } else {
                KeyStore ks = KeyStore.getInstance("JKS");
                try ( InputStream inputStream = Files.newInputStream(PathValidator.getRealPath(sslFile))) {
                    ks.load(inputStream, sslPass.toCharArray());
                    Key key = ks.getKey(AUTOSSLKEYALIAS, sslPass.toCharArray());
                    if (key instanceof PrivateKey) {
                        // Get certificate of public key
                        X509Certificate cert = (X509Certificate) ks.getCertificate(AUTOSSLKEYALIAS);
                        this.nextAutoSslCheck = Instant.now().plus(1, ChronoUnit.DAYS);

                        if (Instant.now().plus(29, ChronoUnit.DAYS).isAfter(cert.getNotAfter().toInstant())) {
                            com.gmt2001.Console.debug.println("Auto-SSL JKS expiration approaching, renewing...");
                            this.generateAutoSsl();
                        }
                    }
                }
            }
        } catch (UnrecoverableKeyException | KeyStoreException | NoSuchAlgorithmException | CertificateException | IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    /**
     * Triggers an AutoSsl renewal check, if enabled, and returns the current SslContext
     *
     * @return the current SslContext
     */
    SslContext getSslContext() {
        if (this.autoSSL && Instant.now().isAfter(this.nextAutoSslCheck)) {
            this.renewAutoSsl();
        }

        return this.sslCtx;
    }

    /**
     * Checks if a URI path is illegal
     *
     * Paths are considered illegal if: - isWs is {@code true} and the path does not start with {@code /ws} - isWs is {@code false} and the path
     * starts with {@code /ws} - The path contains a {@code ..} - The path attempts to access the {@code /config} directory, unless it is
     * {@code /config/audio-hooks} or {@code /config/gif-alerts}
     *
     * @param path The path to check
     * @param isWs Whether this check is for a WebSocket or not
     * @return true otherwise
     */
    static boolean validateUriPath(String path, boolean isWs) {
        return (isWs == path.startsWith("/ws"))
                || !path.contains("..")
                || !(path.startsWith("/config")
                && !path.startsWith("/config/audio-hooks")
                && !path.startsWith("/config/clips")
                && !path.startsWith("/config/emotes")
                && !path.startsWith("/config/gif-alerts"));
    }

    /**
     * Shuts down the server, with a grace period for ongoing requests to finish
     */
    public void close() {
        WebSocketFrameHandler.closeAllWsSessions();
        if (this.ch != null) {
            this.ch.close().awaitUninterruptibly(5, TimeUnit.SECONDS);
        }

        if (this.ch2 != null) {
            this.ch2.close().awaitUninterruptibly(5, TimeUnit.SECONDS);
        }

        if (this.group != null) {
            this.group.shutdownGracefully(3, 5, TimeUnit.SECONDS);
        }
    }
}
