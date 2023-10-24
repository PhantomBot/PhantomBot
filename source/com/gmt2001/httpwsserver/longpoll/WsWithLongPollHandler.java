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
package com.gmt2001.httpwsserver.longpoll;

import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;

import com.gmt2001.httpwsserver.HttpRequestHandler;
import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.httpwsserver.WsFrameHandler;
import com.gmt2001.httpwsserver.auth.HttpAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.WsAuthenticationHandler;
import com.gmt2001.wspinger.WSServerPinger;

import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple3;
import reactor.util.function.Tuples;
import tv.phantombot.panel.PanelUser.PanelUser;

/**
 * A combined frame handler for a WS with long polling webserver endpoint
 * <p>
 * Authentication is handled via a {@link WsWithLongPollAuthenticationHandler}
 * <p>
 * When initiating a Web Socket connection or performing a
 * {@link HttpMethod#GET}, the query params {@code afterTimestamp=millis} and
 * {@code afterSequence=sequence} can be used to signal where the stream should
 * resume and trigger message replay, if available
 * <p>
 * When frames are sent via Web Socket:
 * <ol>
 * <li>If the frame is a RFC 6455 {@code PING} frame, netty automatically
 * responds with a RFC 6455 {@code PONG} frame</li>
 * <li>If the frame is a RFC 6455 {@code PONG} frame, the {@link WSServerPinger}
 * attached to the channel refreshes the timeout</li>
 * <li>If the frame is a {@code TEXT} frame containing a valid JSON object, it
 * is passed onto {@link #handleMessage(ChannelHandlerContext, JSONObject)}</li>
 * <li>If the frame is a {@code TEXT} frame, but does not contain a valid JSON
 * Object, the {@link JSONException} is logged to core-error and then
 * dropped</li>
 * <li>All other frames are dropped</li>
 * </ol>
 * <p>
 * When frames are sent via HTTP:
 * <ol>
 * <li>If the HTTP method is not {@link HttpMethod#GET} or
 * {@link HttpMethod#POST}, {@link HttpResponseStatus#METHOD_NOT_ALLOWED} is
 * returned</li>
 * <li>If the HTTP method is {@link HttpMethod#POST} and the body fails to parse
 * as a JSON array, or the JSON array is empty,
 * {@link HttpResponseStatus#BAD_REQUEST} is returned and any
 * {@link JSONException} is logged to core-error</li>
 * <li>If the HTTP method is {@link HttpMethod#POST} and an exception occurs
 * while processing a frame, {@link HttpResponseStatus#INTERNAL_SERVER_ERROR} is
 * returned and the exception is logged in core-error</li>
 * <li>If the HTTP method is {@link HttpMethod#POST} and an element in the JSON
 * array is not a JSON object, {@link HttpResponseStatus#UNPROCESSABLE_ENTITY}
 * is returned</li>
 * <li>If the HTTP method is {@link HttpMethod#POST} and all frames are
 * processed successfully, {@link HttpResponseStatus#ACCEPTED} is returned</li>
 * <li>If the HTTP method is {@link HttpMethod#GET} and outbound frames are
 * already queued, the request completes immediately with the frames</li>
 * <li>If the HTTP method is {@link HttpMethod#GET} and no outbound frames are
 * available, the server holds the request open for up to {@link #ctxTimeout},
 * then completes with an empty JSON array if there are still no outbound frames
 * available
 * </ol>
 * <i>NOTE: If the HTTP method is {@link HttpMethod#POST} or a 4xx/5xx response
 * is returned, it is still possible that some frames completed successfully</i>
 * <p>
 * <i>NOTE: If the HTTP method is {@link HttpMethod#POST} or a 4xx/5xx response
 * is returned, an empty JSON array is returned in the body</i>
 * <p>
 * <i>NOTE: {@link HttpMethod#POST} requests must have a body consisting of a
 * JSON array containing the JSON object(s) that would be sent over the Web
 * Socket</i>
 * <p>
 * Server -> Client frame format:
 * <code>{"metadata": {"timestamp": enqueueTimestampMillis, "sequence": sequenceWithinTimestamp},
 *   "data": data}
 * </code>
 *
 * @author gmt2001
 */
public abstract class WsWithLongPollHandler implements HttpRequestHandler, WsFrameHandler {
    /**
     * Content-Type for long poll
     */
    public static final String LONG_POLL_CONTENT_TYPE = "json";
    /**
     * Empty response for a timed-out long poll
     */
    public static final String EMPTY_LONG_POLL_RESPONSE = new JSONStringer().array().endArray().toString();
    /**
     * The entropy of a session ID, in bits
     */
    public static final int SESSION_ID_ENTROPY = 64;
    /**
     * The cache of {@link Client}
     */
    protected final ClientCache clientCache;
    /**
     * The timeout until a WS client is sent a PING frame or an HTTP client is sent
     * an empty response
     */
    protected final Duration ctxTimeout;
    /**
     * The authentication handler
     */
    private final WsWithLongPollAuthenticationHandler authHandler;
    /**
     * Random generator for session IDs
     */
    private final SecureRandom secureRandom;

    /**
     * Constructor
     *
     * @param authenticatedCallback Optional callback to run when a client
     *                              successfully authenticates via an authentication
     *                              frame
     * @param ctxTimeout            The timeout until a WS client is sent a PING
     *                              frame or an HTTP client is sent an empty
     *                              response
     * @param strongTimeout         The duration after which the strong reference to
     *                              an outbound message will be dropped
     * @param softTimeout           The duration after which the soft reference to
     *                              an outbound message, and the entire message,
     *                              will be dropped
     */
    protected WsWithLongPollHandler(Runnable authenticatedCallback, Duration ctxTimeout, Duration strongTimeout,
            Duration softTimeout) {
        this.ctxTimeout = ctxTimeout;
        this.clientCache = new ClientCache(ctxTimeout, strongTimeout, softTimeout);
        this.authHandler = new WsWithLongPollAuthenticationHandler(authenticatedCallback, this::clientSessionId);

        SecureRandom secureRandom;
        try {
            secureRandom = SecureRandom.getInstanceStrong();
        } catch (NoSuchAlgorithmException ex) {
            com.gmt2001.Console.err.logStackTrace(ex);
            secureRandom = new SecureRandom();
        }

        this.secureRandom = secureRandom;
    }

    /**
     * Returns the session ID for the client
     *
     * @param params                A tuple containing the below params
     * @param ChannelHandlerContext The context
     * @param Boolean               {@code true} if WS; {@code false} if HTTP
     * @param String                The request URI
     * @return The session ID; {@code null} if the {@link PanelUser} is {@code null}
     */
    protected final String clientSessionId(Tuple3<ChannelHandlerContext, Boolean, String> params) {
        Tuple2<Instant, Long> after = this.lastReceivedParams(params.getT3());
        Optional<Client> client = this.clientCache.addOrUpdateClient(params.getT1(), params.getT2(), after.getT1(),
                after.getT2(), this::sessionIdSupplier);

        if (client.isPresent()) {
            return client.get().sessionId();
        }

        return null;
    }

    /**
     * Provides a unique session ID
     *
     * @return A session ID
     */
    protected final String sessionIdSupplier() {
        byte[] b = new byte[SESSION_ID_ENTROPY / 8];
        String sessionId;

        do {
            this.secureRandom.nextBytes(b);
            sessionId = Base64.getUrlEncoder().encodeToString(b);
        } while (this.clientCache.sessionIdExists(sessionId));

        return sessionId;
    }

    /**
     * Checks the request URI for query params denoting the last received message
     *
     * @param requestUri The request URI
     * @return A tuple containing the last received Instant and Sequence
     */
    private Tuple2<Instant, Long> lastReceivedParams(String requestUri) {
        QueryStringDecoder qsd = new QueryStringDecoder(requestUri);

        Instant afterTimestamp = Instant.MIN;
        long afterSequence = 0L;
        if (qsd.parameters().containsKey("afterTimestamp")) {
            try {
                afterTimestamp = Instant.ofEpochMilli(Long.parseLong(qsd.parameters().get("afterTimestamp").get(0)));
            } catch (NumberFormatException ex) {
            }
        }

        if (qsd.parameters().containsKey("afterSequence")) {
            try {
                afterSequence = Long.parseLong(qsd.parameters().get("afterSequence").get(0));
            } catch (NumberFormatException ex) {
            }
        }

        return Tuples.of(afterTimestamp, afterSequence);
    }

    @Override
    public final void handleRequest(ChannelHandlerContext ctx, FullHttpRequest req) {
        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());

        if (!req.method().equals(HttpMethod.GET) && !req.method().equals(HttpMethod.POST)) {
            com.gmt2001.Console.debug.println("405 " + req.method().asciiName() + ": " + qsd.path());
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(
                    HttpResponseStatus.METHOD_NOT_ALLOWED, EMPTY_LONG_POLL_RESPONSE, LONG_POLL_CONTENT_TYPE));
            return;
        }

        if (req.method().equals(HttpMethod.POST)) {
            JSONArray jsa = null;
            try {
                jsa = new JSONArray(req.content().toString(StandardCharsets.UTF_8));
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }

            HttpResponseStatus status = (jsa == null || jsa.isEmpty() ? HttpResponseStatus.BAD_REQUEST
                    : HttpResponseStatus.ACCEPTED);
            for (int i = 0; i < jsa.length(); i++) {
                try {
                    if (jsa.get(i) instanceof JSONObject jso) {
                        this.handleMessage(ctx, jso);
                    } else if (status.equals(HttpResponseStatus.ACCEPTED)) {
                        status = HttpResponseStatus.UNPROCESSABLE_ENTITY;
                    }
                } catch (Exception ex) {
                    com.gmt2001.Console.err.logStackTrace(ex);
                    status = HttpResponseStatus.INTERNAL_SERVER_ERROR;
                }
            }

            if (!status.equals(HttpResponseStatus.ACCEPTED)) {
                com.gmt2001.Console.debug.println(status.code() + " " + req.method().asciiName() + ": " + qsd.path());
            }

            HttpServerPageHandler.sendHttpResponse(ctx, req,
                    HttpServerPageHandler.prepareHttpResponse(status,
                            EMPTY_LONG_POLL_RESPONSE, LONG_POLL_CONTENT_TYPE));
        }
    }

    @Override
    public final void handleFrame(ChannelHandlerContext ctx, WebSocketFrame frame) {
        if (frame instanceof TextWebSocketFrame textFrame) {
            JSONObject jso;
            try {
                jso = new JSONObject(textFrame.text());
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
                return;
            }

            this.handleMessage(ctx, jso);
        }
    }

    /**
     * Handles a message frame
     *
     * @param ctx The context
     * @param jso The message
     */
    public abstract void handleMessage(ChannelHandlerContext ctx, JSONObject jso);

    @Override
    public final HttpAuthenticationHandler getHttpAuthHandler() {
        return this.authHandler;
    }

    @Override
    public final WsAuthenticationHandler getWsAuthHandler() {
        return this.authHandler;
    }

    @Override
    public WSServerPinger pinger(ChannelHandlerContext ctx) {
        return new WSServerPinger(ctx, this.ctxTimeout, this.ctxTimeout, 3);
    }
}
