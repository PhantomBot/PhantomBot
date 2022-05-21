/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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

import com.gmt2001.httpwsserver.x509.SelfSignedX509CertificateGenerator;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.Channel;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
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
import java.util.Calendar;
import java.util.Date;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.TrustManagerFactory;
import tv.phantombot.CaselessProperties;
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
    private static HTTPWSServer INSTANCE;
    /**
     * The server's {@link EventLoopGroup}
     */
    private final EventLoopGroup group = new NioEventLoopGroup();
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
    private KeyStore ks = null;
    private String sslFile = null;
    private String sslPass = null;
    private Date nextAutoSslCheck = new Date();

    /**
     * Gets the server instance.
     *
     * You should always call the parameterized version, {@link HTTPWSServer#instance(String, int, boolean, String, String)}, at least once before
     * this one
     *
     * @return An initialized {@link HTTPWSServer}
     */
    public static HTTPWSServer instance() {
        return instance(null, 25000, false, null, null, null);
    }

    /**
     * Gets the server instance, or initializes a new one if it hasn't been constructed yet
     *
     * @param ipOrHostname The IP or Hostname of an interface to bind to. null for the default AnyAddress
     * @param port The port number to bind to
     * @param useHttps If SSL should be used.
     * @param sslFile The path to a Java Keystore (.jks) file that contains a Private Key and Certificate Trust Chain or {@code null} to disable
     * SSL/TLS support
     * @param sslPass The password to the .jks file specified in {@code sslFile} or {@code null} if not needed or not using SSL/TLS support
     * @param botName The bot name to use for the DN of the self-signed certificate
     * @return An initialized {@link HTTPWSServer}
     */
    public static synchronized HTTPWSServer instance(String ipOrHostname, int port, boolean useHttps, String sslFile, String sslPass, String botName) {
        if (INSTANCE == null) {
            INSTANCE = new HTTPWSServer(ipOrHostname, port, useHttps, sslFile, sslPass, botName);
        }

        return INSTANCE;
    }

    /**
     * Constructor
     *
     * @param ipOrHostname The IP or Hostname of an interface to bind to. null for the default AnyAddress
     * @param port The port number to bind to
     * @param useHttps If SSL should be used.
     * @param sslFile The path to a Java Keystore (.jks) file that contains a Private Key and Certificate Trust Chain or {@code null} to disable
     * SSL/TLS support
     * @param sslPass The password to the .jks file specified in {@code sslFile} or {@code null} if not needed or not using SSL/TLS support
     * @param botName The bot name to use for the DN of the self-signed certificate
     */
    private HTTPWSServer(String ipOrHostname, int port, boolean useHttps, String sslFile, String sslPass, String botName) {
        try {
            if (useHttps) {
                this.sslFile = sslFile;
                this.sslPass = sslPass;

                ks = KeyStore.getInstance("JKS");
                ks.load(null, this.sslPass.toCharArray());

                if (sslFile == null || sslFile.isBlank()) {
                    this.autoSSL = true;
                    this.sslFile = "./config/selfkey.jks";
                    this.sslPass = "pbselfsign";

                    if (!Files.exists(Paths.get(this.sslFile))) {
                        this.generateAutoSsl(botName);
                    }
                }

                this.reloadSslContext();

                sslEnabled = true;
            } else {
                sslCtx = null;
            }

            ServerBootstrap b = new ServerBootstrap();
            b.group(group)
                    .channel(NioServerSocketChannel.class)
                    .childHandler(new HTTPWSServerInitializer());

            if (ipOrHostname == null || ipOrHostname.isBlank()) {
                ch = b.bind(port).sync().channel();
            } else {
                ch = b.bind(ipOrHostname, port).sync().channel();
            }

            if (port == 443) {
                try {
                    if (ipOrHostname == null || ipOrHostname.isBlank()) {
                        ch2 = b.bind(80).sync().channel();
                    } else {
                        ch2 = b.bind(ipOrHostname, 80).sync().channel();
                    }
                } catch (InterruptedException ex2) {
                    ch2 = null;
                    com.gmt2001.Console.out.println("Unble to bind port 80, going with only 443...");
                    com.gmt2001.Console.err.printStackTrace(ex2);
                }
            }
        } catch (IOException | NoSuchAlgorithmException | CertificateException | KeyStoreException | UnrecoverableKeyException | InterruptedException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            group.shutdownGracefully();
        }
    }

    public boolean isSsl() {
        return this.sslEnabled || CaselessProperties.instance().getPropertyAsBoolean("proxybypasshttps", false);
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

    /**
     * Manages generation of the AutoSsl certificate
     *
     * @param botName The bot name to use in the certificates DN
     * @param forceNew If true, forces a brand new key pair to be generated
     */
    void generateAutoSsl(String botName, boolean forceNew) {
        try {
            KeyPair kp = null;
            if (!forceNew) {
                Key key = ks.getKey("phantombot", "pbselfsign".toCharArray());
                if (key instanceof PrivateKey) {
                    // Get certificate of public key
                    Certificate cert = ks.getCertificate("phantombot");

                    // Get public key
                    PublicKey publicKey = cert.getPublicKey();

                    // Return a key pair
                    kp = new KeyPair(publicKey, (PrivateKey) key);
                }
            }

            if (kp == null) {
                kp = SelfSignedX509CertificateGenerator.generateKeyPair(SelfSignedX509CertificateGenerator.RECOMMENDED_KEY_SIZE);
            }

            String dn = SelfSignedX509CertificateGenerator.generateDistinguishedName("PhantomBot." + botName);

            X509Certificate cert = SelfSignedX509CertificateGenerator.generateCertificate(dn, kp, SelfSignedX509CertificateGenerator.RECOMMENDED_VALIDITY_DAYS, SelfSignedX509CertificateGenerator.RECOMMENDED_SIG_ALGO);

            ks.setKeyEntry("phantombot", kp.getPrivate(), "pbselfsign".toCharArray(), new Certificate[]{cert});

            try ( OutputStream outputStream = Files.newOutputStream(Paths.get(sslFile))) {
                ks.store(outputStream, "pbselfsign".toCharArray());
            }

            this.reloadSslContext();

            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.DAY_OF_MONTH, 1);
            this.nextAutoSslCheck = cal.getTime();
        } catch (IOException | InvalidKeyException | NoSuchProviderException | SignatureException | CertificateException | UnrecoverableKeyException | KeyStoreException | NoSuchAlgorithmException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    /**
     * Reloads the SslContext
     *
     * @throws IOException
     * @throws NoSuchAlgorithmException
     * @throws CertificateException
     * @throws KeyStoreException
     * @throws UnrecoverableKeyException
     */
    private void reloadSslContext() throws IOException, NoSuchAlgorithmException, CertificateException, KeyStoreException, UnrecoverableKeyException {
        try ( InputStream inputStream = Files.newInputStream(Paths.get(sslFile))) {
            ks.load(inputStream, this.sslPass.toCharArray());

            KeyManagerFactory kmf = KeyManagerFactory.getInstance("SunX509");
            kmf.init(ks, this.sslPass.toCharArray());

            TrustManagerFactory tmf = TrustManagerFactory.getInstance("SunX509");
            tmf.init(this.ks);

            sslCtx = SslContextBuilder.forServer(kmf).trustManager(tmf).build();
        }
    }

    /**
     * Checks if the AutoSsl certificate requires renewal, and triggers it
     */
    private void renewAutoSsl() {
        try {
            if (this.ks != null) {
                Key key = ks.getKey("phantombot", "pbselfsign".toCharArray());
                if (key instanceof PrivateKey) {
                    // Get certificate of public key
                    X509Certificate cert = (X509Certificate) ks.getCertificate("phantombot");
                    Calendar cal = Calendar.getInstance();
                    cal.add(Calendar.DAY_OF_MONTH, 1);
                    this.nextAutoSslCheck = cal.getTime();
                    cal.add(Calendar.DAY_OF_MONTH, 29);

                    if (cal.getTime().after(cert.getNotAfter())) {
                        this.generateAutoSsl();
                    }
                }
            }
        } catch (UnrecoverableKeyException | KeyStoreException | NoSuchAlgorithmException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    /**
     * Triggers an AutoSsl renewal check, if enabled, and returns the current SslContext
     *
     * @return the current SslContext
     */
    SslContext getSslContext() {
        if (this.autoSSL && new Date().after(this.nextAutoSslCheck)) {
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
        return (isWs ? path.startsWith("/ws") : !path.startsWith("/ws"))
                || !path.contains("..")
                || !(path.startsWith("/config") && !path.startsWith("/config/audio-hooks") && !path.startsWith("/config/gif-alerts"));
    }

    /**
     * Shuts down the server, with a grace period for ongoing requests to finish
     */
    public void close() {
        WebSocketFrameHandler.closeAllWsSessions();
        ch.close().awaitUninterruptibly(5, TimeUnit.SECONDS);

        if (ch2 != null) {
            ch2.close().awaitUninterruptibly(5, TimeUnit.SECONDS);
        }

        group.shutdownGracefully(3, 5, TimeUnit.SECONDS);
    }
}
