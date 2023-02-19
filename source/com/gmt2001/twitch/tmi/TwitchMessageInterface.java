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
package com.gmt2001.twitch.tmi;

import com.gmt2001.ExecutorService;
import com.gmt2001.Reflect;
import com.gmt2001.ratelimiters.WindowedSwitchingRateLimiter;
import com.gmt2001.twitch.tmi.TMIMessage.TMIMessageType;
import com.gmt2001.twitch.tmi.processors.AbstractTMIProcessor;
import com.gmt2001.wsclient.WSClient;
import com.gmt2001.wsclient.WsClientFrameHandler;
import com.gmt2001.wspinger.WSPinger;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.CloseWebSocketFrame;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.SubmissionPublisher;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.SSLException;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;
import tv.phantombot.twitch.api.Helix;

/**
 * A client for the Twitch Message Interface
 *
 * @author gmt2001
 */
public final class TwitchMessageInterface extends SubmissionPublisher<TMIMessage> implements WsClientFrameHandler {

    /**
     * The URI to TMI
     */
    private static final String TMI_URI = "wss://irc-ws.chat.twitch.tv:443";
    /**
     * A {@link WindowedSwitchingRateLimiter} to handle the PRIVMSG rate limit
     */
    private final WindowedSwitchingRateLimiter rateLimiter = new WindowedSwitchingRateLimiter(30000L, 100, 20, false);
    /**
     * A {@link WSPinger} to handle pinging to detect connection failure
     */
    private final WSPinger pinger = new WSPinger(Duration.ofSeconds(15), Duration.ofSeconds(5), 4, new TMIPingPongSupplierPredicate());
    /**
     * Indicates when the connection is legitimately closing and should not be reconnected
     */
    private boolean closing = false;
    /**
     * The underlying {@link WSClient} for the connection
     */
    private WSClient client;
    /**
     * Max message length to avoid dropping
     */
    private static final int MAXLEN = 500;

    /**
     * Initializes the Twitch Message Interface. Creates a new {@link WSClient}, then initializes all processors and starts connecting
     */
    @SuppressWarnings({"rawtypes"})
    public TwitchMessageInterface() {
        try {
            this.client = new WSClient(new URI(TMI_URI), this, this.pinger);
            com.gmt2001.Console.debug.println("Created a new WSClient");
        } catch (URISyntaxException | SSLException | IllegalArgumentException ex) {
            com.gmt2001.Console.err.println("Failed to create WSClient for TMI [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        }

        ExecutorService.schedule(() -> {
            com.gmt2001.Console.debug.println("Loading processors via reflection");
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
                com.gmt2001.Console.out.println("Connecting to TMI...");
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
     * Calculates the maximum length for the message content of a PRIVMSG to avoid dropping
     *
     * @param channel The channel name
     * @param isAction If this is for a ACTION (/me) message
     * @param replyToId The {@code id} tag from the {@link TMIMessage#tags} of the message that is being replied to; {@code null} if not used
     * @return
     */
    public int privMsgMaxLength(String channel, boolean isAction, String replyToId) {
        return MAXLEN - 8 - (!channel.startsWith("#") ? 1 : 0) - channel.length() - 2
            - (isAction ? 9 : 0)
            - (replyToId != null && !replyToId.isEmpty() ? 22 + replyToId.length(): 0);
    }

    /**
     * Returns the {@link WindowedSwitchingRateLimiter} used to prevent PRIVMSG spam
     *
     * @return The rate limiter
     */
    public WindowedSwitchingRateLimiter rateLimiter() {
        return this.rateLimiter;
    }

    /**
     * Forces a PING to be sent
     */
    public void sendPing() {
        this.pinger.sendPing();
    }

    /**
     * Sends an IRC PRIVMSG command with the {@code /me ACTION} specifier.
     *
     * If there are no tokens left on {@link #rateLimiter}, the message is silently dropped
     *
     * @param channel The channel to send to
     * @param message The chat message
     */
    public void sendActionPrivMessage(String channel, String message) {
        this.sendActionPrivMessage(channel, message, null);
    }

    /**
     * Sends an IRC PRIVMSG command. If the message starts with {@code /me}, then it is passed to
     * {@link #sendActionPrivMessage(java.lang.String, java.lang.String)} instead.
     *
     * If there are no tokens left on {@link #rateLimiter}, the message is silently dropped
     *
     * @param channel The channel to send to
     * @param message The chat message
     */
    public void sendPrivMessage(String channel, String message) {
        this.sendPrivMessage(channel, message, null);
    }

    /**
     * Sends an IRC PRIVMSG command with the {@code /me ACTION} specifier.
     *
     * If there are no tokens left on {@link #rateLimiter}, the message is silently dropped
     *
     * @param channel The channel to send to
     * @param message The chat message
     * @param replyToId The {@code id} tag from the {@link TMIMessage#tags} of the message that is being replied to
     */
    public void sendActionPrivMessage(String channel, String message, String replyToId) {
        this.sendPrivMessage(channel, (char) 1 + "ACTION " + message + (char) 1, replyToId);
    }

    /**
     * Sends an IRC PRIVMSG command as a reply to another message. If the message starts with {@code /me}, then it is passed to
     * {@link #sendActionPrivMessage(java.lang.String, java.lang.String, java.lang.String)} instead.
     *
     * If there are no tokens left on {@link #rateLimiter}, the message is silently dropped
     *
     * @param channel The channel to send to
     * @param message The chat message
     * @param replyToId The {@code id} tag from the {@link TMIMessage#tags} of the message that is being replied to
     */
    public void sendPrivMessage(String channel, String message, String replyToId) {
        if (message.toLowerCase().startsWith("/me ")) {
            this.sendActionPrivMessage(channel, message.substring(4), replyToId);
        } else {
            this.redirectSlashCommandsAndSendPrivMessage(channel, message, replyToId);
        }
    }

    /**
     * Redirects slash and dot commands other than {@code /me} from PRIVMSG to the appropriate {@link Helix} call, otherwise sends the PRIVMSG.
     *
     * If there are no tokens left on {@link #rateLimiter}, the message is silently dropped
     *
     * @param channelThe channel to send to
     * @param message The chat message to process
     * @param replyToId The {@code id} tag from the {@link TMIMessage#tags} of the message that is being replied to, if sending a reply
     */
    private void redirectSlashCommandsAndSendPrivMessage(String channel, String message, String replyToId) {
        boolean res = false;
        if (message.startsWith("/") || message.startsWith(".")) {
            res = TMISlashCommands.checkAndProcessCommands(channel, message);
        }

        if (!res && this.rateLimiter.takeToken()) {
            if (!channel.startsWith("#")) {
                channel = "#" + channel;
            }
            this.sendFullCommand(replyToId == null || replyToId.isBlank() ? null : Collections.singletonMap("reply-parent-msg-id", replyToId), "PRIVMSG", channel, message);
        }
    }

    /**
     * Sends an IRC command with parameter component
     *
     * @param command The IRC command
     * @param parameter The IRC parameter
     */
    public void sendCommand(String command, String parameter) {
        this.sendCommand(null, command, parameter);
    }

    /**
     * Sends an IRC command with tags and parameter component
     *
     * @param tags The IRCv3 tags
     * @param command The IRC command
     * @param parameter The IRC parameter
     */
    public void sendCommand(Map<String, String> tags, String command, String parameter) {
        this.sendFullCommand(tags, command, null, parameter);
    }

    /**
     * Sends an IRC command with channel and parameter components
     *
     * @param command The IRC command
     * @param channel The channel to send to
     * @param parameter The IRC parameter
     */
    public void sendChannelCommand(String command, String channel, String parameter) {
        this.sendFullCommand(null, command, channel, parameter);
    }

    /**
     * Sends an IRC command with tags, channel, and parameter components
     *
     * @param tags The IRCv3 tags. If {@code null} or empty, the tags component is not included
     * @param command The IRC command
     * @param channel The channel to send to. If {@code null}, empty, or blank, the channel component of the command is not included
     * @param parameter The IRC parameters. If {@code null}, the parameter component is not included
     */
    public void sendFullCommand(Map<String, String> tags, String command, String channel, String parameter) {
        if (command == null || command.isBlank()) {
            throw new IllegalArgumentException("command");
        }

        StringBuilder sb = new StringBuilder();

        if (tags != null && !tags.isEmpty()) {
            sb.append('@');
            boolean first = true;

            for (Map.Entry<String, String> kvp : tags.entrySet()) {
                if (!first) {
                    sb.append(';');
                }

                first = false;
                sb.append(kvp.getKey());

                if (kvp.getValue() != null) {
                    sb.append('=').append(kvp.getValue());
                }
            }

            sb.append(' ');
        }

        sb.append(command);

        if (channel != null && !channel.isBlank()) {
            sb.append(' ').append(channel);
        }

        if (parameter != null) {
            sb.append(' ').append(':').append(parameter);
        }

        this.sendRaw(sb.toString());
    }

    /**
     * Sends a raw IRC message
     *
     * @param message The message to send
     */
    public void sendRaw(String message) {
        /**
         * @botproperty ircdebug - If `true`, raw inbound and outbound IRC commands (except PASS) are sent to the debug log. Default `false`
         * @botpropertycatsort ircdebug 60 900 Debug
         */
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

        try {
            this.client = new WSClient(new URI(TMI_URI), this, this.pinger);
            com.gmt2001.Console.debug.println("Created a new WSClient");
        } catch (URISyntaxException | SSLException | IllegalArgumentException ex) {
            com.gmt2001.Console.err.println("Failed to create WSClient for TMI [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        }

        ExecutorService.schedule(() -> {
            try {
                this.closing = false;

                com.gmt2001.Console.out.println("Connecting to TMI...");
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
            PhantomBot.instance().getSession().reconnect();
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
     * Closes the connection normally. Exceptions are discarded
     */
    public void shutdown() {
        try {
            this.sendRaw("QUIT");
        } catch (Exception e) {
        }

        try {
            Thread.sleep(250);
        } catch (InterruptedException ex) {
        }

        try {
            this.close(1000, "bye");
        } catch (Exception e) {
        }
    }
}
