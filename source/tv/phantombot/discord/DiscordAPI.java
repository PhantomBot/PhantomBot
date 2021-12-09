/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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
package tv.phantombot.discord;

import discord4j.common.close.CloseException;
import discord4j.core.DiscordClient;
import discord4j.core.DiscordClientBuilder;
import discord4j.core.GatewayDiscordClient;
import discord4j.core.event.domain.VoiceStateUpdateEvent;
import discord4j.core.event.domain.guild.GuildCreateEvent;
import discord4j.core.event.domain.guild.MemberJoinEvent;
import discord4j.core.event.domain.guild.MemberLeaveEvent;
import discord4j.core.event.domain.lifecycle.ReadyEvent;
import discord4j.core.event.domain.message.MessageCreateEvent;
import discord4j.core.event.domain.message.ReactionAddEvent;
import discord4j.core.event.domain.message.ReactionRemoveEvent;
import discord4j.core.event.domain.role.RoleCreateEvent;
import discord4j.core.event.domain.role.RoleDeleteEvent;
import discord4j.core.event.domain.role.RoleUpdateEvent;
import discord4j.core.object.entity.Guild;
import discord4j.core.object.entity.Message;
import discord4j.core.object.entity.Role;
import discord4j.core.object.entity.User;
import discord4j.core.object.entity.channel.Channel;
import discord4j.core.object.entity.channel.GuildMessageChannel;
import discord4j.core.object.entity.channel.PrivateChannel;
import discord4j.gateway.intent.Intent;
import discord4j.gateway.intent.IntentSet;
import discord4j.rest.request.RouterOptions;
import discord4j.common.util.Snowflake;
import discord4j.core.event.domain.lifecycle.DisconnectEvent;
import discord4j.gateway.DefaultGatewayClient;
import java.time.Duration;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import reactor.core.publisher.Mono;
import tv.phantombot.PhantomBot;
import tv.phantombot.discord.util.DiscordUtil;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.discord.channel.DiscordChannelCommandEvent;
import tv.phantombot.event.discord.channel.DiscordChannelJoinEvent;
import tv.phantombot.event.discord.channel.DiscordChannelMessageEvent;
import tv.phantombot.event.discord.channel.DiscordChannelPartEvent;
import tv.phantombot.event.discord.reaction.DiscordMessageReactionEvent;
import tv.phantombot.event.discord.ready.DiscordReadyEvent;
import tv.phantombot.event.discord.role.DiscordRoleCreatedEvent;
import tv.phantombot.event.discord.role.DiscordRoleDeletedEvent;
import tv.phantombot.event.discord.role.DiscordRoleUpdatedEvent;
import tv.phantombot.event.discord.uservoicechannel.DiscordUserVoiceChannelJoinEvent;
import tv.phantombot.event.discord.uservoicechannel.DiscordUserVoiceChannelPartEvent;

/**
 * Communicates with the Discord API.
 *
 * @author IllusionaryOne
 * @author ScaniaTV
 */
public class DiscordAPI extends DiscordUtil {

    private static DiscordAPI instance;
    private static DiscordClient client;
    private static GatewayDiscordClient gateway;
    private static Guild guild;
    private static ConnectionState reconnectState = ConnectionState.DISCONNECTED;
    private static DiscordClientBuilder<DiscordClient, RouterOptions> builder;
    private boolean ready;
    private static Snowflake selfId;
    private IntentSet connectIntents = IntentSet.of(Intent.GUILDS, Intent.GUILD_MEMBERS, Intent.GUILD_VOICE_STATES, Intent.GUILD_MESSAGES, Intent.GUILD_MESSAGE_REACTIONS, Intent.GUILD_PRESENCES, Intent.DIRECT_MESSAGES);

    /**
     * Method to return this class object.
     *
     * @return {Object}
     */
    public static synchronized DiscordAPI instance() {
        if (instance == null) {
            instance = new DiscordAPI();
        }

        return instance;
    }

    /**
     * Class constructor
     */
    private DiscordAPI() {
        super();
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    /**
     * Enum list of our connection states.
     */
    public enum ConnectionState {
        CONNECTED,
        RECONNECTED,
        DISCONNECTED,
        CANNOT_RECONNECT
    }

    /**
     * Method to connect to Discord.
     *
     * @param token
     */
    public void connect(String token) {
        if (DiscordAPI.builder == null) {
            DiscordAPI.builder = DiscordClientBuilder.create(token);
            DiscordAPI.client = DiscordAPI.builder.build();
        }

        this.connect();
    }

    public void connect() {
        DiscordAPI.selfId = null;
        com.gmt2001.Console.debug.println("IntentSet: " + this.connectIntents.toString());
        DiscordAPI.client.gateway().setEnabledIntents(this.connectIntents).login(DefaultGatewayClient::new).timeout(Duration.ofSeconds(30)).doOnSuccess(cgateway -> {
            com.gmt2001.Console.out.println("Connected to Discord, finishing authentication...");
            DiscordAPI.gateway = cgateway;
            subscribeToEvents();
            DiscordAPI.selfId = cgateway.getSelfId();
        }).doOnError(e -> {
            com.gmt2001.Console.err.println("Failed to authenticate with Discord: [" + e.getClass().getSimpleName() + "] " + e.getMessage());
            com.gmt2001.Console.err.logStackTrace(e);
            if (e.getClass().equals(CloseException.class) && ((CloseException) e).getCode() == 4014 && (this.connectIntents.contains(Intent.GUILD_MEMBERS) || this.connectIntents.contains(Intent.GUILD_PRESENCES))) {
                com.gmt2001.Console.err.println("Discord rejected privileged intents (" + ((CloseException) e).getCode() + (((CloseException) e).getReason().isPresent() ? " " + ((CloseException) e).getReason().get() : "") + "). Trying without them...");
                this.connectIntents = IntentSet.of(Intent.GUILDS, Intent.GUILD_VOICE_STATES, Intent.GUILD_MESSAGES, Intent.GUILD_MESSAGE_REACTIONS, Intent.DIRECT_MESSAGES);
                Mono.delay(Duration.ofMillis(500)).doOnNext(l -> {
                    this.connect();
                }).subscribe();
            }
        }).subscribe();
    }

    /**
     * Method to reconnect to Discord.
     *
     * @return
     */
    public boolean reconnect() {
        ready = false;
        DiscordAPI.gateway.logout();

        this.connect();

        return isLoggedIn();
    }

    private void subscribeToEvents() {
        DiscordAPI.gateway.getEventDispatcher().on(DisconnectEvent.class).doOnNext(event -> DiscordEventListener.onDiscordDisconnectEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();

        DiscordAPI.gateway.getEventDispatcher().on(ReadyEvent.class) // Listen for ReadyEvent(s)
                .map(event -> event.getGuilds().size()) // Get how many guilds the bot is in
                .flatMap(size -> DiscordAPI.gateway.getEventDispatcher()
                .on(GuildCreateEvent.class) // Listen for GuildCreateEvent(s)
                .take(size) // Take only the first `size` GuildCreateEvent(s) to be received
                .collectList()) // Take all received GuildCreateEvents and make it a List
                .doOnNext(events -> DiscordEventListener.onDiscordReadyEvent(events))
                .onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e))
                .subscribe();

        DiscordAPI.gateway.getEventDispatcher().on(MessageCreateEvent.class).doOnNext(event -> DiscordEventListener.onDiscordMessageEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
        DiscordAPI.gateway.getEventDispatcher().on(MemberJoinEvent.class).doOnNext(event -> DiscordEventListener.onDiscordUserJoinEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
        DiscordAPI.gateway.getEventDispatcher().on(MemberLeaveEvent.class).doOnNext(event -> DiscordEventListener.onDiscordUserLeaveEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
        DiscordAPI.gateway.getEventDispatcher().on(RoleCreateEvent.class).doOnNext(event -> DiscordEventListener.onDiscordRoleCreateEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
        DiscordAPI.gateway.getEventDispatcher().on(RoleUpdateEvent.class).doOnNext(event -> DiscordEventListener.onDiscordRoleUpdateEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
        DiscordAPI.gateway.getEventDispatcher().on(RoleDeleteEvent.class).doOnNext(event -> DiscordEventListener.onDiscordRoleDeleteEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
        DiscordAPI.gateway.getEventDispatcher().on(ReactionAddEvent.class).doOnNext(event -> DiscordEventListener.onDiscordMessageReactionAddEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
        DiscordAPI.gateway.getEventDispatcher().on(ReactionRemoveEvent.class).doOnNext(event -> DiscordEventListener.onDiscordMessageReactionRemoveEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
        DiscordAPI.gateway.getEventDispatcher().on(VoiceStateUpdateEvent.class).doOnNext(event -> DiscordEventListener.onDiscordVoiceStateUpdateEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    /**
     * Method that checks if we are logged in to Discord.
     *
     * @return
     */
    public boolean isLoggedIn() {
        return DiscordAPI.selfId != null;
    }

    /**
     * Method that checks if Discord is ready and has sent all Guilds.
     *
     * @return
     */
    public boolean isReady() {
        return ready;
    }

    @SuppressWarnings("null")
    public void testJoin() {
        try {
            DiscordEventListener.onDiscordUserJoinEvent(new MemberJoinEvent(gateway, null, gateway.getSelf().block(Duration.ofSeconds(5)).asMember(DiscordAPI.guild.getId()).block(Duration.ofSeconds(5)), 0));
        } catch (Exception e) {
            com.gmt2001.Console.debug.printStackTrace(e);
        }
    }

    /**
     * Method that checks if we are still connected to Discord and reconnects if we are not.
     *
     * @return
     */
    public ConnectionState checkConnectionStatus() {
        if (!isLoggedIn() || !isReady()) {
            com.gmt2001.Console.warn.println("Connection lost with Discord, attempting to reconnect...");
            if (reconnect()) {
                com.gmt2001.Console.warn.println("Connection re-established with Discord.");
                // We were able to reconnect.
                return ConnectionState.RECONNECTED;
            } else {
                // We are disconnected and could not reconnect.
                return ConnectionState.DISCONNECTED;
            }
        }
        // We are still connected, return true.
        return ConnectionState.CONNECTED;
    }

    /**
     * Method that will return the current guild.
     *
     * @return {Guild}
     */
    public static Guild getGuild() {
        return guild;
    }

    /**
     * Method that will return the current client
     *
     * @return {DiscordClient}
     */
    public static DiscordClient getClient() {
        return client;
    }

    /**
     * Method that will return the current gateway
     *
     * @return {GatewayDiscordClient}
     */
    public static GatewayDiscordClient getGateway() {
        return gateway;
    }

    /**
     * Method to set the guild and shard objects.
     */
    private void setGuildAndShard(List<GuildCreateEvent> events) {
        // PhantomBot only works in one server, so throw an error if there's multiple.
        if (events.size() > 1) {
            com.gmt2001.Console.err.println("Discord bot account connected to multiple servers. Now disconnecting from Discord...");
            DiscordAPI.gateway.logout();
            reconnectState = ConnectionState.CANNOT_RECONNECT;
        } else {
            DiscordAPI.guild = events.get(0).getGuild();
        }
    }

    /**
     * Method to parse commands.
     *
     * @param {String} message
     */
    private void parseCommand(User user, Channel channel, Message message, boolean isAdmin) {
        if (message.getContent().isEmpty()) {
            return;
        }

        String command = message.getContent().substring(1);
        String arguments = "";

        if (command.contains(" ")) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(' '));
            arguments = commandString.substring(commandString.indexOf(' ') + 1);
        }

        EventBus.instance().postAsync(new DiscordChannelCommandEvent(user, channel, message, command, arguments, isAdmin));
    }

    /**
     * Class to listen to events.
     */
    private static class DiscordEventListener {

        private static final List<Long> processedMessages = new CopyOnWriteArrayList<>();
        private static final Timer listTimer = new Timer();

        private DiscordEventListener() {
        }

        public static void onDiscordDisconnectEvent(DisconnectEvent event) {
            if (event.getStatus().getCode() > 1000) {
                if (event.getStatus().getCode() == 4014 && (DiscordAPI.instance().connectIntents.contains(Intent.GUILD_MEMBERS) || DiscordAPI.instance().connectIntents.contains(Intent.GUILD_PRESENCES))) {
                    com.gmt2001.Console.err.println("Discord rejected privileged intents (" + event.getStatus().getCode() + (event.getStatus().getReason().isPresent() ? " " + event.getStatus().getReason().get() : "") + "). Trying without them...");
                    DiscordAPI.instance().connectIntents = IntentSet.of(Intent.GUILDS, Intent.GUILD_VOICE_STATES, Intent.GUILD_MESSAGES, Intent.GUILD_MESSAGE_REACTIONS, Intent.DIRECT_MESSAGES);
                    DiscordAPI.instance().reconnect();
                } else {
                    com.gmt2001.Console.err.println("Discord connection closed with status " + event.getStatus().getCode() + (event.getStatus().getReason().isPresent() ? " " + event.getStatus().getReason().get() : ""));
                }
            }
        }

        public static void onDiscordReadyEvent(List<GuildCreateEvent> events) {
            com.gmt2001.Console.out.println("Successfully authenticated with Discord.");

            DiscordAPI.instance().ready = true;

            DiscordAPI.instance().setGuildAndShard(events);

            com.gmt2001.Console.debug.println(DiscordAPI.guild);

            // Set a timer that checks our connection status with Discord every 60 seconds
            ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
            service.scheduleAtFixedRate(() -> {
                if (reconnectState != ConnectionState.CANNOT_RECONNECT && !PhantomBot.instance().isExiting()
                        && DiscordAPI.instance().checkConnectionStatus() == ConnectionState.DISCONNECTED) {
                    com.gmt2001.Console.err.println("Connection with Discord was lost.");
                    com.gmt2001.Console.err.println("Reconnecting will be attempted in 60 seconds...");
                }
            }, 0, 1, TimeUnit.MINUTES);

            EventBus.instance().postAsync(new DiscordReadyEvent());
        }

        public static void onDiscordMessageEvent(MessageCreateEvent event) {
            Message iMessage = event.getMessage();
            if (iMessage.getContent() == null || processedMessages.contains(iMessage.getId().asLong())) {
                return;
            }

            iMessage.getChannel().timeout(Duration.ofMillis(500)).doOnSuccess(iChannel -> {
                User iUser = event.getMember().isPresent() ? event.getMember().get() : (iChannel instanceof PrivateChannel ? ((PrivateChannel) iChannel).getRecipients().take(1).singleOrEmpty().block(Duration.ofMillis(500)) : null);

                if (iUser == null || (DiscordAPI.selfId != null && iUser.getId().equals(DiscordAPI.selfId))) {
                    return;
                }

                String username = iUser.getUsername().toLowerCase();
                String message = iMessage.getContent();
                String channel;
                Mono<Boolean> isAdmin = DiscordAPI.instance().isAdministratorAsync(iUser);

                processedMessages.add(iMessage.getId().asLong());
                listTimer.schedule(new TimerTask() {
                    @Override
                    public void run() {
                        processedMessages.remove(iMessage.getId().asLong());
                    }
                }, 5000);

                if (iChannel.getType() == Channel.Type.DM) {
                    channel = "DM";
                } else {
                    channel = "#" + ((GuildMessageChannel) iChannel).getName();
                }

                if (message == null || message.isEmpty()) {
                    return;
                }

                com.gmt2001.Console.out.println("[DISCORD] [" + channel + "] " + username + ": " + message);

                if (message.charAt(0) == '!') {
                    DiscordAPI.instance().parseCommand(iUser, iChannel, iMessage, isAdmin.block(Duration.ofMillis(500)));
                }

                EventBus.instance().postAsync(new DiscordChannelMessageEvent(iUser, iChannel, iMessage, isAdmin.block(Duration.ofMillis(500))));
            }).doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
        }

        public static void onDiscordUserJoinEvent(MemberJoinEvent event) {
            EventBus.instance().postAsync(new DiscordChannelJoinEvent(event.getMember()));
        }

        public static void onDiscordUserLeaveEvent(MemberLeaveEvent event) {
            EventBus.instance().postAsync(new DiscordChannelPartEvent(event.getUser()));
        }

        public static void onDiscordRoleCreateEvent(RoleCreateEvent event) {
            EventBus.instance().post(new DiscordRoleCreatedEvent(event.getRole()));
        }

        public static void onDiscordRoleUpdateEvent(RoleUpdateEvent event) {
            EventBus.instance().post(new DiscordRoleUpdatedEvent(event.getCurrent()));
        }

        public static void onDiscordRoleDeleteEvent(RoleDeleteEvent event) {
            Role role = event.getRole().get();

            if (role == null) {
                return;
            }

            EventBus.instance().post(new DiscordRoleDeletedEvent(role));
        }

        public static void onDiscordMessageReactionAddEvent(ReactionAddEvent event) {
            EventBus.instance().post(new DiscordMessageReactionEvent(event));
        }

        public static void onDiscordMessageReactionRemoveEvent(ReactionRemoveEvent event) {
            EventBus.instance().post(new DiscordMessageReactionEvent(event));
        }

        public static void onDiscordVoiceStateUpdateEvent(VoiceStateUpdateEvent event) {
            if (event.getCurrent().getChannelId().get() == null) {
                event.getCurrent().getUser().doOnSuccess(user -> {
                    event.getOld().get().getChannel().doOnSuccess(channel -> {
                        EventBus.instance().postAsync(new DiscordUserVoiceChannelPartEvent(user, channel));
                    }).subscribe();
                }).subscribe();
            } else {
                event.getCurrent().getUser().doOnSuccess(user -> {
                    event.getCurrent().getChannel().doOnSuccess(channel -> {
                        EventBus.instance().postAsync(new DiscordUserVoiceChannelJoinEvent(user, channel));
                    }).subscribe();
                }).subscribe();
            }
        }
    }
}
