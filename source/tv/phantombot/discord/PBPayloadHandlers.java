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

/*
 * This file is copied and modified from Discord4J.
 *
 * Discord4J is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Discord4J is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Discord4J. If not, see <http://www.gnu.org/licenses/>.
 */
package tv.phantombot.discord;

import static discord4j.common.LogUtil.format;
import discord4j.discordjson.json.gateway.*;
import discord4j.discordjson.possible.Possible;
import discord4j.gateway.IdentifyOptions;
import discord4j.gateway.json.GatewayPayload;
import discord4j.gateway.retry.GatewayException;
import discord4j.gateway.retry.ReconnectException;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import reactor.util.Logger;
import reactor.util.Loggers;

/**
 * Registry for operating on gateway {@link PayloadData} objects, handling each lifecycle {@link Opcode}.
 */
public abstract class PBPayloadHandlers {

    private static final Logger log = Loggers.getLogger(PBPayloadHandlers.class);
    private static final Map<Opcode<?>, PBPayloadHandler<?>> handlerMap = new HashMap<>();

    static {
        addHandler(Opcode.DISPATCH, PBPayloadHandlers::handleDispatch);
        addHandler(Opcode.HEARTBEAT, PBPayloadHandlers::handleHeartbeat);
        addHandler(Opcode.RECONNECT, PBPayloadHandlers::handleReconnect);
        addHandler(Opcode.INVALID_SESSION, PBPayloadHandlers::handleInvalidSession);
        addHandler(Opcode.HELLO, PBPayloadHandlers::handleHello);
        addHandler(Opcode.HEARTBEAT_ACK, PBPayloadHandlers::handleHeartbeatAck);
    }

    private static <T extends PayloadData> void addHandler(Opcode<T> op, PBPayloadHandler<T> handler) {
        handlerMap.put(op, handler);
    }

    /**
     * Process a {@link PayloadData} object together with its context, reacting to it.
     *
     * @param context the PBPayloadContext used with this PayloadData object
     * @param <T> the PayloadData type
     */
    @SuppressWarnings("unchecked")
    public static <T extends PayloadData> void handle(PBPayloadContext<T> context) {
        PBPayloadHandler<T> entry = (PBPayloadHandler<T>) handlerMap.get(context.getPayload().getOp());
        if (entry != null) {
            entry.handle(context);
        }
    }

    private static void handleDispatch(PBPayloadContext<Dispatch> context) {
        if (context.getData() instanceof Ready) {
            String newSessionId = ((Ready) context.getData()).sessionId();
            context.getClient().sessionId().set(newSessionId);
        }
        if (context.getData() != null) {
            context.getClient().dispatchSink().next(context.getData());
        }
    }

    private static void handleHeartbeat(PBPayloadContext<Heartbeat> context) {
        log.debug(format(context.getContext(), "Received heartbeat"));
        context.getClient().sender().next(GatewayPayload.heartbeat(ImmutableHeartbeat.of(context.getClient().sequence().get())));
    }

    private static void handleReconnect(PBPayloadContext<?> context) {
        context.getHandler().error(new ReconnectException("Reconnecting due to reconnect packet received"));
    }

    private static void handleInvalidSession(PBPayloadContext<InvalidSession> context) {
        PBDiscordGatewayClient client = context.getClient();
        if (context.getData().resumable()) {
            String token = client.token();
            client.sender().next(GatewayPayload.resume(
                    ImmutableResume.of(token, client.getSessionId(), client.sequence().get())));
        } else {
            client.allowResume().set(false);
            context.getHandler().error(new GatewayException(context.getContext(),
                    "Reconnecting due to non-resumable session invalidation"));
        }
    }

    private static void handleHello(PBPayloadContext<Hello> context) {
        Duration interval = Duration.ofMillis(context.getData().heartbeatInterval());
        PBDiscordGatewayClient client = context.getClient();
        client.heartbeat().start(Duration.ZERO, interval);

        if (client.allowResume().get()) {
            log.debug(format(context.getContext(), "Resuming Gateway session from {}"), client.sequence().get());
            client.sender().next(GatewayPayload.resume(
                    ImmutableResume.of(client.token(), client.getSessionId(), client.sequence().get())));
        } else {
            IdentifyProperties props = ImmutableIdentifyProperties.of(System.getProperty("os.name"), "Discord4J",
                    "Discord4J");
            IdentifyOptions options = client.identifyOptions();
            int[] shard = new int[]{options.getShardIndex(), options.getShardCount()};
            Identify identify = Identify.builder()
                    .token(client.token())
                    .intents(options.getIntents())
                    .properties(props)
                    .compress(false)
                    .largeThreshold(250)
                    .shard(shard)
                    .presence(Optional.ofNullable(options.getInitialStatus()).map(Possible::of).orElse(Possible.absent()))
                    .guildSubscriptions(options.getIntents().isAbsent() ?
                            Possible.of(options.isGuildSubscriptions()) : Possible.absent())
                    .build();
            log.debug(format(context.getContext(), "Identifying to Gateway"), client.sequence().get());
            client.sender().next(GatewayPayload.identify(identify));
        }
    }

    private static void handleHeartbeatAck(PBPayloadContext<?> context) {
        context.getClient().ackHeartbeat();
        log.debug(format(context.getContext(), "Heartbeat acknowledged after {}"),
                context.getClient().getResponseTime());
    }

}
