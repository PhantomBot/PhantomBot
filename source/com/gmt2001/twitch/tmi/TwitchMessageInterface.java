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
package com.gmt2001.twitch.tmi;

import com.gmt2001.Reflect;
import com.gmt2001.twitch.tmi.TMIMessage.TMIMessageType;
import com.gmt2001.twitch.tmi.processors.AbstractTMIProcessor;
import com.gmt2001.wsclient.WSClient;
import com.gmt2001.wsclient.WsClientFrameHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.CloseWebSocketFrame;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.concurrent.Executors;
import java.util.concurrent.SubmissionPublisher;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.SSLException;
import tv.phantombot.CaselessProperties;
import tv.phantombot.cache.UsernameCache;
import tv.phantombot.twitch.api.Helix;

/**
 * A client for the Twitch Message Interface
 *
 * @author gmt2001
 */
public final class TwitchMessageInterface extends SubmissionPublisher<TMIMessage> implements WsClientFrameHandler {

    private static final String TMI_URI = "wss://irc-ws.chat.twitch.tv:443";
    private boolean closing = false;
    private WSClient client;

    /**
     * Initializes the Twitch Message Interface. Creates a new {@link WSClient}, then initializes all processors and starts connecting
     */
    public TwitchMessageInterface() {
        try {
            this.client = new WSClient(new URI(TMI_URI), this);
        } catch (URISyntaxException | SSLException | IllegalArgumentException ex) {
            com.gmt2001.Console.err.println("Failed to create WSClient for TMI [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        }

        Executors.newSingleThreadScheduledExecutor().schedule(() -> {
            Reflect.instance().loadPackageRecursive(AbstractTMIProcessor.class.getName().substring(0, AbstractTMIProcessor.class.getName().lastIndexOf('.')));
            Reflect.instance().getSubTypesOf(AbstractTMIProcessor.class).stream().filter((c) -> (!c.getName().equals(AbstractTMIProcessor.class.getName()))).forEachOrdered((c) -> {
                for (Constructor constructor : c.getConstructors()) {
                    if (constructor.getParameterCount() == 0) {
                        try {
                            constructor.newInstance();
                        } catch (InstantiationException | IllegalAccessException | IllegalArgumentException | InvocationTargetException ex) {
                            com.gmt2001.Console.err.printStackTrace(ex);
                        }
                    }
                }
            });

            try {
                if (!this.client.connect()) {
                    com.gmt2001.Console.err.println("Failed to start connection to TMI");
                }
            } catch (InterruptedException | IllegalStateException ex) {
                com.gmt2001.Console.err.println("Failed to connect to TMI [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }, 100, TimeUnit.MILLISECONDS);
    }

    /**
     * Sends an IRC PRIVMSG command with the {@code /me ACTION} specifier
     *
     * @param channel The channel to send to
     * @param message The chat message
     */
    public void sendActionPrivMessage(String channel, String message) {
        this.sendPrivMessage(channel, (char) 1 + "ACTION " + message + (char) 1);
    }

    /**
     * Sends an IRC PRIVMSG command. If the message starts with {@code /me}, then it is passed to
     * {@link #sendActionPrivMessage(java.lang.String, java.lang.String)} instead
     *
     * @param channel The channel to send to
     * @param message The chat message
     */
    public void sendPrivMessage(String channel, String message) {
        if (message.toLowerCase().startsWith("/me ")) {
            this.sendActionPrivMessage(channel, message.substring(4));
        } else {
            this.redirectSlashCommandsAndSendPrivMessage(channel, message);
        }
    }

    /**
     * Redirects slash and dot commands other than {@code /me} from PRIVMSG to the appropriate {@link Helix} call, otherwise sends the PRIVMSG
     *
     * @param channelThe channel to send to
     * @param message The chat message to process
     */
    private void redirectSlashCommandsAndSendPrivMessage(String channel, String message) {
        String lmessage = message.toLowerCase();
        if (lmessage.startsWith("/announce") || lmessage.startsWith(".announce")) {
            String color = "";
            if (message.indexOf(' ') > 9) {
                color = message.substring(9, message.indexOf(' '));
            }

            message = message.substring(message.indexOf(' ') + 1);

            Helix.instance().sendChatAnnouncementAsync(UsernameCache.instance().getID(channel), message, color)
                    .doOnSuccess(jso -> {
                        if (jso.getInt("status") != 204) {
                            com.gmt2001.Console.err.println("Failed to send an /announce: " + jso.toString());
                        }
                    })
                    .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
        } else {
            this.sendChannelCommand("PRIVMSG", channel, message);
        }
    }

    /**
     * Sends an IRC command with channel and parameter components
     *
     * @param command The IRC command
     * @param channel The channel to send to
     * @param parameter The IRC parameter
     */
    public void sendChannelCommand(String command, String channel, String parameter) {
        this.send(command + " " + channel + " :" + parameter);
    }

    /**
     * Sends an IRC command with parameter component
     *
     * @param command The IRC command
     * @param parameter The IRC parameter
     */
    public void sendCommand(String command, String parameter) {
        this.send(command + " :" + parameter);
    }

    /**
     * Sends a raw IRC message
     *
     * @param message The message to send
     */
    public void send(String message) {
        if (CaselessProperties.instance().getPropertyAsBoolean("ircdebug", false)) {
            if (message.startsWith("PASS")) {
                com.gmt2001.Console.debug.println("<PASS ****");
            } else {
                com.gmt2001.Console.debug.println("<" + message);
            }
        }

        this.client.send(message);
    }

    /**
     * Closes the connection to TMI, then resets the outbound closing status and attempts to connect again after a 5 second delay
     */
    public void reconnect() {
        if (this.client.connected()) {
            this.shutdown();
        }

        Executors.newSingleThreadScheduledExecutor().schedule(() -> {
            try {
                this.closing = false;

                if (!this.client.connect()) {
                    com.gmt2001.Console.err.println("Failed to start connection to TMI");
                }
            } catch (InterruptedException | IllegalStateException ex) {
                com.gmt2001.Console.err.println("Failed to connect to TMI [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }, 5, TimeUnit.SECONDS);
    }

    /**
     * @return {@code true} if the underlying socket is connected. Does not indicate anything about the state other than that the raw socket is
     * connected
     */
    public boolean connected() {
        return this.client.connected();
    }

    /**
     * Splits a string containing one or more lines of RFC1459-formatted IRC messages and submits each one to subscribed processors
     *
     * @param messages A string containing one or more RFC1459-formatted IRC messages
     */
    public void onMessages(String messages) {
        messages.lines().forEachOrdered(message -> {
            if (CaselessProperties.instance().getPropertyAsBoolean("ircdebug", false)) {
                com.gmt2001.Console.debug.println(">" + message);
            }

            this.submit(new TMIMessage(TMIMessageType.MESSAGE, message));
        });
    }

    /**
     * Notifies subscribed processors that the socket has closed and initiates reconnecting if there wasn't an outbound 1000 close code
     *
     * @param code The close code
     * @param reason The textual close reason
     */
    public void onClose(int code, String reason) {
        com.gmt2001.Console.warn.println("Connection to TMI closed [" + code + ", " + reason + "]");
        this.submit(new TMIMessage(TMIMessageType.CLOSE));

        if (!this.closing) {
            this.reconnect();
        }
    }

    @Override
    public void handleFrame(ChannelHandlerContext ctx, WebSocketFrame frame) {
        if (frame instanceof TextWebSocketFrame) {
            TextWebSocketFrame tframe = (TextWebSocketFrame) frame;
            this.onMessages(tframe.text());
        } else if (frame instanceof CloseWebSocketFrame) {
            CloseWebSocketFrame cframe = (CloseWebSocketFrame) frame;
            this.onClose(cframe.statusCode(), cframe.reasonText());
        }
    }

    @Override
    public void handshakeComplete(ChannelHandlerContext ctx) {
        com.gmt2001.Console.out.println("Connected to " + TMI_URI + ", starting authentication...");
        this.submit(new TMIMessage(TMIMessageType.OPEN));
    }

    @Override
    public void onClose() {
        this.onClose(0, "channel closed");
    }

    /**
     * Closes the socket
     *
     * @param code The close code
     * @param reason The textual close reason
     */
    public void close(int code, String reason) {
        if (code == 1000) {
            com.gmt2001.Console.out.println("Disconnecting from TMI normally...");
            this.closing = true;
        } else {
            com.gmt2001.Console.out.println("Disconnecting from TMI with code [" + code + ", " + reason + "]...");
        }

        if (this.client.connected()) {
            this.client.close(code, reason);
        }
    }

    /**
     * Closes the connection normally
     */
    public void shutdown() {
        this.send("QUIT");

        try {
            Thread.sleep(250);
        } catch (InterruptedException ex) {
        }

        this.close(1000, "bye");
    }
}
