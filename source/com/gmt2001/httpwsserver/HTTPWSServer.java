/*
 * Copyright (C) 2016-2019 phantombot.tv
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

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.Channel;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.UnrecoverableKeyException;
import java.security.cert.CertificateException;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.TrustManagerFactory;

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

    public boolean sslEnabled = false;

    /**
     * Gets the server instance.
     *
     * You should always call the parameterized version, {@link HTTPWSServer#instance(String, int, boolean, String, String)}, at least once before this one
     *
     * @return An initialized {@link HTTPWSServer}
     */
    public static HTTPWSServer instance() {
        return instance(null, 25000, false, null, null);
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
     * @return An initialized {@link HTTPWSServer}
     */
    public static synchronized HTTPWSServer instance(String ipOrHostname, int port, boolean useHttps, String sslFile, String sslPass) {
        if (INSTANCE == null) {
            INSTANCE = new HTTPWSServer(ipOrHostname, port, useHttps, sslFile, sslPass);
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
     */
    private HTTPWSServer(String ipOrHostname, int port, boolean useHttps, String sslFile, String sslPass) {
        final SslContext sslCtx;

        try {
            if (useHttps && sslFile != null && !sslFile.isBlank()) {
                KeyStore ks = KeyStore.getInstance("JKS");
                try (InputStream inputStream = Files.newInputStream(Paths.get(sslFile))) {
                    ks.load(inputStream, sslPass.toCharArray());

                    KeyManagerFactory kmf = KeyManagerFactory.getInstance("SunX509");
                    kmf.init(ks, sslPass.toCharArray());

                    TrustManagerFactory tmf = TrustManagerFactory.getInstance("SunX509");
                    tmf.init(ks);

                    sslCtx = SslContextBuilder.forServer(kmf).trustManager(tmf).build();
                    sslEnabled = true;
                }
            } else {
                sslCtx = null;
            }

            ServerBootstrap b = new ServerBootstrap();
            b.group(group)
                    .channel(NioServerSocketChannel.class)
                    .childHandler(new HTTPWSServerInitializer(sslCtx));

            if (ipOrHostname == null || ipOrHostname.isBlank()) {
                ch = b.bind(port).sync().channel();
            } else {
                ch = b.bind(ipOrHostname, port).sync().channel();
            }
        } catch (IOException | NoSuchAlgorithmException | CertificateException | KeyStoreException | UnrecoverableKeyException | InterruptedException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            group.shutdownGracefully();
        }
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
     * @return {@code false} if the path is illegal, {@code} true otherwise
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
        ch.close().awaitUninterruptibly(5, TimeUnit.SECONDS);
        group.shutdownGracefully(3, 5, TimeUnit.SECONDS);
    }
}
