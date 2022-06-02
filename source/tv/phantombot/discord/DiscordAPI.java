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
package tv.phantombot.discord;

import discord4j.common.sinks.EmissionStrategy;
import discord4j.common.util.Snowflake;
import discord4j.core.DiscordClient;
import discord4j.core.DiscordClientBuilder;
import discord4j.core.GatewayDiscordClient;
import discord4j.core.event.EventDispatcher;
import discord4j.core.event.domain.VoiceStateUpdateEvent;
import discord4j.core.event.domain.guild.GuildCreateEvent;
import discord4j.core.event.domain.guild.MemberJoinEvent;
import discord4j.core.event.domain.guild.MemberLeaveEvent;
import discord4j.core.event.domain.lifecycle.DisconnectEvent;
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
import discord4j.gateway.DefaultGatewayClient;
import discord4j.gateway.GatewayOptions;
import discord4j.gateway.intent.Intent;
import discord4j.gateway.intent.IntentSet;
import discord4j.rest.request.RequestQueueFactory;
import discord4j.rest.request.RouterOptions;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.reactivestreams.Publisher;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.concurrent.Queues;
import tv.phantombot.PhantomBot;
import tv.phantombot.discord.util.DiscordUtil;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.discord.channel.DiscordChannelCommandEvent;
import tv.phantombot.event.discord.channel.DiscordChannelJoinEvent;
import tv.phantombot.event.discord.channel.DiscordChannelMessageEvent;
import tv.phantombot.event.discord.channel.DiscordChannelPartEvent;
import tv.phantombot.event.discord.reaction.DiscordMessageReactionEvent;
import tv.phantombot.event.discord.ready.DiscordGuildCreateEvent;
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

    private final Object mutex = new Object();
    private static final int PROCESSMESSAGETIMEOUT = 5;
    private static DiscordAPI instance;
    private static DiscordClient client;
    private static GatewayDiscordClient gateway;
    private static Snowflake guildId;
    private ConnectionState connectionState = ConnectionState.DISCONNECTED;
    private static DiscordClientBuilder<DiscordClient, RouterOptions> builder;
    private boolean ready;
    private static Snowflake selfId;
    private IntentSet connectIntents = IntentSet.of(Intent.GUILDS, Intent.GUILD_MEMBERS, Intent.GUILD_VOICE_STATES, Intent.GUILD_MESSAGES, Intent.GUILD_MESSAGE_REACTIONS, Intent.GUILD_PRESENCES, Intent.DIRECT_MESSAGES);
    private Instant nextReconnect = Instant.MIN;

    /**
     * Method to return this class object.
     *
     * @return
     */
    public static synchronized DiscordAPI instance() {
        if (DiscordAPI.instance == null) {
            DiscordAPI.instance = new DiscordAPI();
        }

        return DiscordAPI.instance;
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
        CONNECTING,
        CONNECTED,
        DISCONNECTED,
        RECONNECTING,
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
            DiscordAPI.client = DiscordAPI.builder.setRequestQueueFactory(RequestQueueFactory.createFromSink(spec -> spec.multicast().onBackpressureBuffer(Queues.SMALL_BUFFER_SIZE, false), EmissionStrategy.timeoutError(Duration.ofSeconds(5L)))).build();
        }

        this.connect();
    }

    public void connect() {
        synchronized (this.mutex) {
            if (this.connectionState == ConnectionState.CONNECTING) {
                return;
            }

            if (Instant.now().isBefore(this.nextReconnect)) {
                Mono.delay(Duration.between(Instant.now(), this.nextReconnect).abs()).block();
            }

            this.connectionState = ConnectionState.CONNECTING;
            this.nextReconnect = Instant.now().plusSeconds(60);
        }

        DiscordAPI.selfId = null;
        com.gmt2001.Console.debug.println("IntentSet: " + this.connectIntents.toString());
        DiscordAPI.client.gateway().setMaxMissedHeartbeatAck(5).setExtraOptions(o -> new DiscordGatewayOptions(o))
                .setEnabledIntents(this.connectIntents).withEventDispatcher(this::subscribeToEvents).login(DefaultGatewayClient::new)
                .timeout(Duration.ofSeconds(30)).doOnSuccess(cgateway -> {
            com.gmt2001.Console.out.println("Connected to Discord, finishing authentication...");
            synchronized (this.mutex) {
                this.nextReconnect = Instant.now().plusSeconds(30);
            }
            DiscordAPI.gateway = cgateway;
            DiscordAPI.selfId = cgateway.getSelfId();
            com.gmt2001.Console.debug.println("selfid=" + DiscordAPI.selfId);
        }).doOnError(e -> {
            synchronized (this.mutex) {
                this.connectionState = ConnectionState.DISCONNECTED;
                this.nextReconnect = Instant.now().plusSeconds(30);
            }
            com.gmt2001.Console.err.println("Failed to connect to Discord: [" + e.getClass().getSimpleName() + "] " + e.getMessage());
            com.gmt2001.Console.err.logStackTrace(e);
        }).subscribe();
    }

    /**
     * Method to reconnect to Discord.
     *
     */
    public void reconnect() {
        synchronized (this.mutex) {
            if (this.connectionState != ConnectionState.DISCONNECTED && this.connectionState != ConnectionState.CONNECTED) {
                return;
            }

            if (Instant.now().isBefore(this.nextReconnect)) {
                Mono.delay(Duration.between(Instant.now(), this.nextReconnect)).block();
            }

            this.connectionState = ConnectionState.RECONNECTING;
        }

        this.ready = false;
        DiscordAPI.gateway.logout();

        this.connect();
    }

    private Publisher<Void> subscribeToEvents(EventDispatcher dispatcher) {
        return dispatcher.on(DisconnectEvent.class).doOnNext(event -> DiscordEventListener.onDiscordDisconnectEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).retry().doFinally((s) -> com.gmt2001.Console.debug.println("DisconnectEvent disconnected due to " + s.name())).then().and(
                dispatcher.on(ReadyEvent.class).doOnNext(event -> DiscordEventListener.onDiscordReadyEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).retry().doFinally((s) -> com.gmt2001.Console.debug.println("ReadyEvent disconnected due to " + s.name())).then()).and(
                dispatcher.on(GuildCreateEvent.class).doOnNext(event -> DiscordEventListener.onDiscordGuildCreateEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).retry().doFinally((s) -> com.gmt2001.Console.debug.println("GuildCreateEvent disconnected due to " + s.name())).then()).and(
                dispatcher.on(MessageCreateEvent.class).doOnNext(event -> DiscordEventListener.onDiscordMessageEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).retry().doFinally((s) -> com.gmt2001.Console.debug.println("MessageCreateEvent disconnected due to " + s.name())).then()).and(
                dispatcher.on(MemberJoinEvent.class).doOnNext(event -> DiscordEventListener.onDiscordUserJoinEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).retry().doFinally((s) -> com.gmt2001.Console.debug.println("MemberJoinEvent disconnected due to " + s.name())).then()).and(
                dispatcher.on(MemberLeaveEvent.class).doOnNext(event -> DiscordEventListener.onDiscordUserLeaveEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).retry().doFinally((s) -> com.gmt2001.Console.debug.println("MemberLeaveEvent disconnected due to " + s.name())).then()).and(
                dispatcher.on(RoleCreateEvent.class).doOnNext(event -> DiscordEventListener.onDiscordRoleCreateEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).retry().doFinally((s) -> com.gmt2001.Console.debug.println("RoleCreateEvent disconnected due to " + s.name())).then()).and(
                dispatcher.on(RoleUpdateEvent.class).doOnNext(event -> DiscordEventListener.onDiscordRoleUpdateEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).retry().doFinally((s) -> com.gmt2001.Console.debug.println("RoleUpdateEvent disconnected due to " + s.name())).then()).and(
                dispatcher.on(RoleDeleteEvent.class).doOnNext(event -> DiscordEventListener.onDiscordRoleDeleteEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).retry().doFinally((s) -> com.gmt2001.Console.debug.println("RoleDeleteEvent disconnected due to " + s.name())).then()).and(
                dispatcher.on(ReactionAddEvent.class).doOnNext(event -> DiscordEventListener.onDiscordMessageReactionAddEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).retry().doFinally((s) -> com.gmt2001.Console.debug.println("ReactionAddEvent disconnected due to " + s.name())).then()).and(
                dispatcher.on(ReactionRemoveEvent.class).doOnNext(event -> DiscordEventListener.onDiscordMessageReactionRemoveEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).retry().doFinally((s) -> com.gmt2001.Console.debug.println("ReactionRemoveEvent disconnected due to " + s.name())).then()).and(
                dispatcher.on(VoiceStateUpdateEvent.class).doOnNext(event -> DiscordEventListener.onDiscordVoiceStateUpdateEvent(event)).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).retry().doFinally((s) -> com.gmt2001.Console.debug.println("VoiceStateUpdateEvent disconnected due to " + s.name())).then());
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
        return this.ready;
    }

    public ConnectionState getConnectionState() {
        return this.connectionState;
    }

    @SuppressWarnings("null")
    public void testJoin() {
        try {
            DiscordEventListener.onDiscordUserJoinEvent(new MemberJoinEvent(DiscordAPI.gateway, null, DiscordAPI.gateway.getSelf().block(Duration.ofSeconds(5)).asMember(DiscordAPI.guildId).block(Duration.ofSeconds(5)), 0));
        } catch (Exception e) {
            com.gmt2001.Console.debug.printStackTrace(e);
        }
    }

    /**
     * Method that checks if we are still connected to Discord and reconnects if we are not.
     *
     */
    public void checkConnectionStatus() {
        if (!this.isLoggedIn() || !this.isReady()) {
            if (Instant.now().isAfter(this.nextReconnect) && this.getConnectionState() == ConnectionState.DISCONNECTED) {
                com.gmt2001.Console.warn.println("Connection lost with Discord, attempting to reconnect...");
                this.reconnect();
            }
        }
    }

    /**
     * Method that will return the current guild.
     *
     * @return
     */
    public static Guild getGuild() {
        return DiscordAPI.gateway.getGuildById(DiscordAPI.guildId).block(Duration.ofSeconds(5L));
    }

    public static Snowflake getGuildId() {
        return DiscordAPI.guildId;
    }

    /**
     * Method that will return the current client
     *
     * @return
     */
    public static DiscordClient getClient() {
        return DiscordAPI.client;
    }

    /**
     * Method that will return the current gateway
     *
     * @return
     */
    public static GatewayDiscordClient getGateway() {
        return DiscordAPI.gateway;
    }

    /**
     * Method to parse commands.
     *
     * @param message
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
        private static final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

        public static void onDiscordDisconnectEvent(DisconnectEvent event) {
            synchronized (DiscordAPI.instance().mutex) {
                DiscordAPI.instance().connectionState = ConnectionState.DISCONNECTED;
                DiscordAPI.instance().nextReconnect = Instant.now().plusSeconds(30);
            }
            if (event.getStatus().getCode() > 1000) {
                if (event.getStatus().getCode() == 4014 && (DiscordAPI.instance().connectIntents.contains(Intent.GUILD_MEMBERS) || DiscordAPI.instance().connectIntents.contains(Intent.GUILD_PRESENCES))) {
                    com.gmt2001.Console.err.println("Discord rejected privileged intents (" + event.getStatus().getCode() + (event.getStatus().getReason().isPresent() ? " " + event.getStatus().getReason().get() : "") + "). Trying without them...");
                    com.gmt2001.Console.err.println("https://discord.com/developers/docs/topics/gateway#privileged-intents");
                    DiscordAPI.instance().connectIntents = IntentSet.of(Intent.GUILDS, Intent.GUILD_VOICE_STATES, Intent.GUILD_MESSAGES, Intent.GUILD_MESSAGE_REACTIONS, Intent.DIRECT_MESSAGES);
                    Mono.delay(Duration.ofMillis(500)).doOnNext(l -> {
                        DiscordAPI.instance().connect();
                    }).subscribe();
                } else if (event.getStatus().getCode() == 4004) {
                    com.gmt2001.Console.err.println("Discord rejected bot token (" + event.getStatus().getCode() + (event.getStatus().getReason().isPresent() ? " " + event.getStatus().getReason().get() : "") + ")...");
                    com.gmt2001.Console.err.println("Discord connection is now being disabled. Please stop the bot, put a new Discord bot token into botlogin.txt, then start the bot again to use Discord features...");
                    com.gmt2001.Console.err.println("https://phantombot.github.io/PhantomBot/guides/#guide=content/integrations/discordintegrationsetup");
                    DiscordAPI.gateway.logout();
                    synchronized (DiscordAPI.instance().mutex) {
                        DiscordAPI.instance().connectionState = ConnectionState.CANNOT_RECONNECT;
                    }
                } else {
                    com.gmt2001.Console.err.println("Discord connection closed with status " + event.getStatus().getCode() + (event.getStatus().getReason().isPresent() ? " " + event.getStatus().getReason().get() : ""));
                }
            }
        }

        public static void onDiscordReadyEvent(ReadyEvent event) {
            if (event.getGuilds().size() != 1) {
                com.gmt2001.Console.err.println("PhantomBot can only be in 1 Discord server at a time, detected " + event.getGuilds().size() + ". Disconnecting Discord...");
                DiscordAPI.gateway.logout();
                synchronized (DiscordAPI.instance().mutex) {
                    DiscordAPI.instance().connectionState = ConnectionState.CANNOT_RECONNECT;
                }
                return;
            }

            com.gmt2001.Console.out.println("Successfully authenticated with Discord.");

            DiscordAPI.guildId = event.getGuilds().stream().findFirst().get().getId();
            DiscordAPI.instance().ready = true;
            synchronized (DiscordAPI.instance().mutex) {
                DiscordAPI.instance().connectionState = ConnectionState.CONNECTED;
                DiscordAPI.instance().nextReconnect = Instant.now().plusSeconds(30);
            }

            com.gmt2001.Console.debug.println("guildid=" + DiscordAPI.guildId);

            // Set a timer that checks our connection status with Discord every 60 seconds
            ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
            service.scheduleAtFixedRate(() -> {
                if (DiscordAPI.instance().getConnectionState() != ConnectionState.CANNOT_RECONNECT && !PhantomBot.instance().isExiting()) {
                    DiscordAPI.instance().checkConnectionStatus();
                }
            }, 0, 1, TimeUnit.MINUTES);

            EventBus.instance().postAsync(new DiscordReadyEvent());
        }

        public static void onDiscordGuildCreateEvent(GuildCreateEvent event) {
            Optional.ofNullable(event.getGuild().getRoles()).map(Flux<Role>::collectList).orElseGet(() -> {
                return Flux.<Role>empty().collectList();
            }).doOnSuccess(l -> EventBus.instance().postAsync(new DiscordGuildCreateEvent(l))).subscribe();
        }

        public static void onDiscordMessageEvent(MessageCreateEvent event) {
            Message iMessage = event.getMessage();
            if (iMessage.getContent() == null) {
                com.gmt2001.Console.debug.println("Ignored message " + iMessage.getId().asString() + " due to null content");
                return;
            }

            if (DiscordEventListener.processedMessages.contains(iMessage.getId().asLong())) {
                com.gmt2001.Console.debug.println("Ignored message " + iMessage.getId().asString() + " due to processedMessages.contains(iMessage.getId().asLong())");
                return;
            }

            iMessage.getChannel().timeout(Duration.ofMillis(500)).doOnSuccess(iChannel -> {
                if (iChannel == null) {
                    com.gmt2001.Console.debug.println("Ignored message " + iMessage.getId().asString() + " due to null iChannel");
                    return;
                }

                User iUser = event.getMember().isPresent() ? event.getMember().get() : (iChannel instanceof PrivateChannel ? ((PrivateChannel) iChannel).getRecipients().stream().findFirst().orElse(null) : null);

                if (iUser == null) {
                    com.gmt2001.Console.debug.println("Ignored message " + iMessage.getId().asString() + " due to null iUser");
                    return;
                }

                if (DiscordAPI.selfId != null && DiscordAPI.selfId.equals(iUser.getId())) {
                    com.gmt2001.Console.debug.println("Ignored message " + iMessage.getId().asString() + " due to iUser.getId().equals(DiscordAPI.selfId)");
                    return;
                }

                String username = iUser.getUsername().toLowerCase();
                String message = iMessage.getContent();
                String channel;
                Mono<Boolean> isAdmin = DiscordAPI.instance().isAdministratorAsync(iUser);

                DiscordEventListener.processedMessages.add(iMessage.getId().asLong());
                DiscordEventListener.scheduler.schedule(() -> DiscordEventListener.processedMessages.remove(iMessage.getId().asLong()), 5, TimeUnit.SECONDS);

                if (iChannel.getType() == Channel.Type.DM) {
                    channel = "DM";
                } else {
                    channel = "#" + ((GuildMessageChannel) iChannel).getName();
                }

                if (message == null || message.isEmpty()) {
                    com.gmt2001.Console.debug.println("Ignored message " + iMessage.getId().asString() + " due to null or empty message");
                    return;
                }

                com.gmt2001.Console.out.println("[DISCORD] [" + channel + "] " + username + ": " + message);

                if (message.charAt(0) == '!') {
                    DiscordAPI.instance().parseCommand(iUser, iChannel, iMessage, isAdmin.block(Duration.ofMillis(500)));
                }

                EventBus.instance().postAsync(new DiscordChannelMessageEvent(iUser, iChannel, iMessage, isAdmin.block(Duration.ofMillis(500))));
            }).doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).timeout(Duration.ofSeconds(DiscordAPI.PROCESSMESSAGETIMEOUT)).subscribe();
        }

        public static void onDiscordUserJoinEvent(MemberJoinEvent event) {
            EventBus.instance().postAsync(new DiscordChannelJoinEvent(event.getMember()));
        }

        public static void onDiscordUserLeaveEvent(MemberLeaveEvent event) {
            EventBus.instance().postAsync(new DiscordChannelPartEvent(event.getUser()));
        }

        public static void onDiscordRoleCreateEvent(RoleCreateEvent event) {
            EventBus.instance().postAsync(new DiscordRoleCreatedEvent(event.getRole()));
        }

        public static void onDiscordRoleUpdateEvent(RoleUpdateEvent event) {
            EventBus.instance().postAsync(new DiscordRoleUpdatedEvent(event.getCurrent()));
        }

        public static void onDiscordRoleDeleteEvent(RoleDeleteEvent event) {
            Role role = event.getRole().get();

            if (role == null) {
                return;
            }

            EventBus.instance().postAsync(new DiscordRoleDeletedEvent(role));
        }

        public static void onDiscordMessageReactionAddEvent(ReactionAddEvent event) {
            EventBus.instance().postAsync(new DiscordMessageReactionEvent(event));
        }

        public static void onDiscordMessageReactionRemoveEvent(ReactionRemoveEvent event) {
            EventBus.instance().postAsync(new DiscordMessageReactionEvent(event));
        }

        public static void onDiscordVoiceStateUpdateEvent(VoiceStateUpdateEvent event) {
            if (event.getCurrent().getChannelId().isEmpty()) {
                event.getCurrent().getUser().doOnSuccess(user -> {
                    if (event.getOld().isPresent()) {
                        event.getOld().get().getChannel().doOnSuccess(channel -> {
                            EventBus.instance().postAsync(new DiscordUserVoiceChannelPartEvent(user, channel));
                        }).subscribe();
                    } else {
                        EventBus.instance().postAsync(new DiscordUserVoiceChannelPartEvent(user));
                    }
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

    public final class DiscordGatewayOptions extends GatewayOptions {

        public DiscordGatewayOptions(GatewayOptions parent) {
            super(parent.getToken(), parent.getReactorResources(), parent.getPayloadReader(),
                    parent.getPayloadWriter(), parent.getReconnectOptions(), parent.getIdentifyOptions(),
                    parent.getInitialObserver(), parent.getIdentifyLimiter(), parent.getMaxMissedHeartbeatAck(),
                    parent.isUnpooled(), EmissionStrategy.timeoutError(Duration.ofSeconds(5L)));
        }
    }
}
