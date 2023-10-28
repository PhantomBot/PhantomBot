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
import reactor.util.function.Tuple4;
import reactor.util.function.Tuples;
import tv.phantombot.panel.PanelUser.PanelUser;

/**
 * A combined frame handler for a WS with long polling webserver endpoint
 * <p>
 * Authentication is handled via a {@link WsWithLongPollAuthenticationHandler}.
 * See documentation for that class on how to perform authentication and the
 * authentication responses
 * <hr>
 * When initiating a Web Socket connection or performing a
 * {@link HttpMethod#GET}, the query params {@code afterTimestamp=millis} and
 * {@code afterSequence=sequence} can be used to signal where the stream should
 * resume and trigger message replay, if available. All messages after the
 * specified timestamp/sequence combination will be replayed if the GC hasn't
 * collected them, excluding the message which exactly matches
 * <p>
 * The values can be updated without replaying messages by adding the optional
 * {@code skipTimestamp} and {@code skipSequence} parameters in the metadata of
 * a frame. See the frame format below
 * <p>
 * <i>NOTE: It is not possible to return to an earlier timestamp/sequence once
 * the query param or metadata param is sent. The messages are permanently
 * released to the GC</i>
 * <hr>
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
 * <hr>
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
 * array is not a JSON object or the JSON object does not conform to the
 * specification below, {@link HttpResponseStatus#UNPROCESSABLE_ENTITY} is
 * returned and any {@link JSONException} exception is logged in core-error</li>
 * <li>If the HTTP method is {@link HttpMethod#POST} and all frames are
 * processed successfully, {@link HttpResponseStatus#ACCEPTED} is returned</li>
 * <li>If the HTTP method is {@link HttpMethod#GET} and outbound frames are
 * already queued, the request completes immediately with the frames</li>
 * <li>If the HTTP method is {@link HttpMethod#GET} and no outbound frames are
 * available, the server holds the request open for up to {@link #ctxTimeout},
 * then completes with an empty JSON array if there are still no outbound frames
 * available
 * </ol>
 * <i>NOTE: If the HTTP method is {@link HttpMethod#POST} and a
 * {@link HttpResponseStatus#INTERNAL_SERVER_ERROR} or
 * {@link HttpResponseStatus#UNPROCESSABLE_ENTITY} response is returned, the
 * response body will be a JSON array containing frames which errored. Any
 * frames not in the array should be considered successfully transmitted.
 * <code>[{"index": arrayIndex, "code": responseCode, "status": "response code name",
 * "frame": frame}, ...]</code></i>
 * <p>
 * <i>NOTE: If the HTTP method is {@link HttpMethod#POST} and a response of
 * {@link HttpResponseStatus#ACCEPTED} or {@link HttpResponseStatus#BAD_REQUEST}
 * is returned, or a {@link HttpResponseStatus#METHOD_NOT_ALLOWED} response is
 * returned for any other HTTP method, an empty JSON array is returned in the
 * body</i>
 * <hr>
 * Server -> Client frame format:
 * <code>{"metadata": {"timestamp": enqueueTimestampMillis, "sequence": sequenceWithinTimestamp},
 *   "data": dataJsonObject}
 * </code>
 * <p>
 * <i>For {@link HttpMethod#GET}, all available frames are returned in a JSON
 * array. For Web Socket, each frame is sent individually as a {@code TEXT}
 * frame</i>
 * <hr>
 * Client -> Server frame format:
 * <code>{"metadata": {"timestamp": enqueueTimestampMillis, "sequence": sequenceWithinTimestamp,
 *  "skipTimestamp?": timestampMillis, "skipSequence?": sequence}, "data": dataJsonObject}
 * </code>
 * <p>
 * <i>For {@link HttpMethod#POST}, a JSON array must be sent, containing the
 * described JSON object as values. Multiple frames may be send in a single JSON
 * array. For Web Socket, each frame must be sent individually as a {@code TEXT}
 * frame</i>
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
     * @param String The session ID provided in the headers
     * @return The session ID; {@code null} if the {@link PanelUser} is {@code null}
     */
    protected final String clientSessionId(Tuple4<ChannelHandlerContext, Boolean, String, String> params) {
        Tuple2<Instant, Long> after = this.lastReceivedParams(params.getT3());
        Optional<Client> client = this.clientCache.addOrUpdateClient(params.getT1(), params.getT2(), after.getT1(),
                after.getT2(), params.getT4(), this::sessionIdSupplier);

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

    /**
     * Validates that a JSON object is formed according to the specification, and
     * updates the last received from client values. Also processes skip parameters,
     * if present
     *
     * @param ctx The context
     * @param jso The frame
     * @return {@code true} if the frame is valid
     */
    private boolean validateFrameUpdateClientReceived(ChannelHandlerContext ctx, JSONObject jso) {
        try {
            JSONObject metadata = jso.getJSONObject("metadata");

            jso.getJSONObject("data");

            if (metadata.has("skipTimestamp") && metadata.has("skipSequence")) {
                this.clientCache.client(ctx)
                        .ifPresent(c -> c.skip(Instant.ofEpochMilli(metadata.getLong("skipTimestamp")),
                                metadata.getLong("skipSequence")));
            }

            this.clientCache.lastReceived(ctx, Instant.ofEpochMilli(metadata.getLong("timestamp")),
                    metadata.getLong("sequence"));

            return true;
        } catch (JSONException ex) {
            com.gmt2001.Console.err.logStackTrace(ex);
        }

        return false;
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
            JSONArray response = new JSONArray();
            JSONArray jsa = null;
            try {
                jsa = new JSONArray(req.content().toString(StandardCharsets.UTF_8));
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }

            HttpResponseStatus status = (jsa == null || jsa.isEmpty() ? HttpResponseStatus.BAD_REQUEST
                    : HttpResponseStatus.ACCEPTED);

            if (jsa != null) {
                for (int i = 0; i < jsa.length(); i++) {
                    try {
                        if (jsa.get(i) instanceof JSONObject jso && this.validateFrameUpdateClientReceived(ctx, jso)) {
                            this.handleMessage(ctx, jso.getJSONObject("data"));
                        } else if (jsa.get(i) instanceof JSONObject jso && jso.has("authenticate")) {
                            this.authHandler.httpAuthFrame(ctx, req, jso, true);
                            return;
                        } else {
                            if (status.equals(HttpResponseStatus.ACCEPTED)) {
                                status = HttpResponseStatus.UNPROCESSABLE_ENTITY;
                            }

                            JSONObject err = new JSONObject();
                            err.put("index", i);
                            err.put("code", HttpResponseStatus.UNPROCESSABLE_ENTITY.code());
                            err.put("status", HttpResponseStatus.UNPROCESSABLE_ENTITY.reasonPhrase());
                            err.put("frame", jsa.get(i));
                            response.put(err);
                        }
                    } catch (Exception ex) {
                        com.gmt2001.Console.err.logStackTrace(ex);
                        status = HttpResponseStatus.INTERNAL_SERVER_ERROR;
                        JSONObject err = new JSONObject();
                        err.put("index", i);
                        err.put("code", HttpResponseStatus.INTERNAL_SERVER_ERROR.code());
                        err.put("status", HttpResponseStatus.INTERNAL_SERVER_ERROR.reasonPhrase());
                        err.put("frame", jsa.isNull(i) ? null : jsa.get(i));
                        response.put(err);
                    }
                }
            }

            if (!status.equals(HttpResponseStatus.ACCEPTED)) {
                com.gmt2001.Console.debug.println(status.code() + " " + req.method().asciiName() + ": " + qsd.path());
            }

            HttpServerPageHandler.sendHttpResponse(ctx, req,
                    HttpServerPageHandler.prepareHttpResponse(status,
                            response.toString(), LONG_POLL_CONTENT_TYPE));
        }
    }

    /**
     * {@inheritDoc}
     *
     * @Deprecated Frames which do not have the new wrapper JSONObject are deprecated for removal
     */
    @Deprecated(forRemoval = true, since = "3.11.0.0")
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

            if (this.validateFrameUpdateClientReceived(ctx, jso)) {
                this.handleMessage(ctx, jso.getJSONObject("data"));
            } else {
                this.handleMessage(ctx, jso);
            }
        }
    }

    /**
     * Handles a message frame
     *
     * @param ctx The context
     * @param jso The {@code data} field of the frame
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
