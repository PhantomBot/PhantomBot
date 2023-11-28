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
import java.util.function.Function;

import org.jooq.exception.DataAccessException;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;

import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.httpwsserver.WebSocketFrameHandler;
import com.gmt2001.httpwsserver.auth.HttpAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.PanelUserAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.WsAuthenticationHandler;

import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketCloseStatus;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import io.netty.util.AttributeKey;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple5;
import reactor.util.function.Tuples;
import tv.phantombot.panel.PanelUser.PanelUser;
import tv.phantombot.panel.PanelUser.PanelUserHandler;

/**
 * A combined authentication handler for a WS with long polling webserver
 * handler
 * <p>
 * Accepts authentication via the following methods:
 * <ul>
 * <li>Header {@code Authorization: Basic base64[User:Pass]}</li>
 * <li>Cookie {@code panellogin=base64[User:Pass]}</li>
 * <li>WS or HTTP long poll frame
 * <code>{"authenticate": "Authentication Token"}</code></li>
 * </ul>
 * <i>NOTE: Password should be a hex-encoded SHA-256 hash. See
 * {@link com.gmt2001.security.Digest#sha256(String)}</i>
 * <p>
 * <i>NOTE: If both the {@code Authorization: Basic} header and
 * {@code panellogin} cookie are provided, the {@code Authorization: Basic}
 * header takes priority</i>
 * <p>
 * <i>NOTE: For HTTP long polling, {@code authenticate} frames must be wrapped
 * in a JSON array, and response frames will be wrapped in a JSON array</i>
 * <hr>
 * When authenticating via Web Socket or HTTP long poll {@code authenticate}
 * frame, the following response frame is sent:
 * <ul>
 * <li>On Failure:
 * <code>{"authresult": "false", "authtype": "none", "sessionId": null}</code>
 * </li>
 * <li>On Success:
 * <code>{"authresult": "true", "authtype": {@value #AUTH_TYPE}, "sessionId": "base64 session ID"}</code>
 * </li>
 * </ul>
 * <i>If an {@code authenticate} frame sent via Web Socket fails or throws an
 * exception, the connection is closed</i>
 * <p>
 * A session can be resumed when authorizing via {@code Authorization} header or
 * cookie by also including the header {@code SessionID: sessionId} with a valid
 * session ID as returned in a {@code authresult} success frame
 * <hr>
 * HTTP Response Codes:
 * <ul>
 * <li>{@link HttpResponseStatus#OK} - {@code authenticate} frame passed
 * validation. See response JSON for session information</li>
 * <li>{@link HttpResponseStatus#UNAUTHORIZED} - All possible authentication
 * methods failed validation</li>
 * <li>{@link HttpResponseStatus#INTERNAL_SERVER_ERROR} - Failed to parse first
 * JSON array entry as a JSON object, or a database error occurred. See
 * core-error log or bot console for information</li>
 * </ul>
 * <hr>
 * Web Socket Close Codes:
 * <ul>
 * <li>{@link WebSocketCloseStatus#POLICY_VIOLATION} - All possible
 * authentication methods failed validation</li>
 * <li>{@link WebSocketCloseStatus#INTERNAL_SERVER_ERROR} - Failed to parse
 * frame text as a JSON object, or a database error occurred. See core-error log
 * or bot console for information</li>
 * </ul>
 *
 * @author gmt2001
 */
public final class WsWithLongPollAuthenticationHandler
        implements HttpAuthenticationHandler, WsAuthenticationHandler, PanelUserAuthenticationHandler {
    /**
     * Represents the {@code ATTR_SESSIONID} attribute, which uniquely identifies a
     * browser session
     */
    public static final AttributeKey<String> ATTR_SESSIONID = AttributeKey.valueOf("sessionId");
    /**
     * Auth type for the {@code authreply} frame
     */
    private static final String AUTH_TYPE = "read/write";
    /**
     * Content-Type for auth result
     */
    public static final String AUTH_RESULT_CONTENT_TYPE = "json";
    /**
     * Optional callback to run when a client successfully authenticates via
     * an authentication frame
     */
    private final Runnable authenticatedCallback;
    /**
     * Function which provides a session ID or validates one provided in the headers
     * <p>
     * <ul>
     * <li><b>Parameters:</b>
     * <ul>
     * <li><b>ChannelHandlerContext</b> The context</li>
     * <li><b>Boolean</b> {@code true} if HTTP GET or WS; {@code false} if HTTP
     * POST</li>
     * <li><b>Boolean</b> {@code true} if WS; {@code false} if HTTP</li>
     * <li><b>String</b> The request URI</li>
     * <li><b>String</b> The session ID provided in the headers</li>
     * </ul>
     * </li>
     * <li><b>Returns:</b>
     * <ul>
     * <li>The input session ID if valid; otherwise a new session ID</li>
     * </ul>
     * </li>
     * </ul>
     */
    protected final Function<Tuple5<ChannelHandlerContext, Boolean, Boolean, String, String>, String> sessionIdSupplier;

    /**
     * Constructor
     *
     * @param authenticatedCallback Optional callback to run when a client
     *                              successfully authenticates via an authentication
     *                              frame
     * @param sessionIdSupplier     Function which provides a session ID or
     *                              validates one provided in the headers. See
     *                              {@link #sessionIdSupplier}
     */
    public WsWithLongPollAuthenticationHandler(Runnable authenticatedCallback,
            Function<Tuple5<ChannelHandlerContext, Boolean, Boolean, String, String>, String> sessionIdSupplier) {
        if (sessionIdSupplier == null) {
            throw new IllegalArgumentException("sessionIdSupplier");
        }

        this.authenticatedCallback = authenticatedCallback;
        this.sessionIdSupplier = sessionIdSupplier;
    }

    @Override
    public PanelUser getUser(ChannelHandlerContext ctx) {
        return ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).get();
    }

    /**
     * Generate an auth result object
     *
     * @param ctx        The {@link ChannelHandlerContext} of the session
     * @param authorized {@code true} if authorized
     * @return A {@link JSONStringer} with the auth result
     */
    private JSONStringer authResult(ChannelHandlerContext ctx, boolean authorized) {
        JSONStringer jss = new JSONStringer();

        jss.object().key("authresult").value(authorized ? "true" : "false").key("authtype")
                .value(authorized ? AUTH_TYPE : "none").key("sessionId")
                .value(authorized ? ctx.channel().attr(ATTR_SESSIONID).get() : null).endObject();

        return jss;
    }

    @Override
    public boolean checkAuthorization(ChannelHandlerContext ctx, WebSocketFrame frame) {
        ctx.channel().attr(WsAuthenticationHandler.ATTR_AUTHENTICATED).setIfAbsent(Boolean.FALSE);
        ctx.channel().attr(WsAuthenticationHandler.ATTR_SENT_AUTH_REPLY).setIfAbsent(Boolean.FALSE);
        ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).setIfAbsent(null);
        ctx.channel().attr(ATTR_SESSIONID).setIfAbsent(null);

        if (ctx.channel().attr(WsAuthenticationHandler.ATTR_AUTHENTICATED).get()
                && ctx.channel().attr(WsAuthenticationHandler.ATTR_SENT_AUTH_REPLY).get()) {
            if (ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).get() != null
                    && !ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).get().isEnabled()) {
                ctx.channel().attr(WsAuthenticationHandler.ATTR_AUTHENTICATED).set(Boolean.FALSE);
                ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).set(null);
                ctx.channel().attr(ATTR_SESSIONID).set(null);
                com.gmt2001.Console.debug.println("Invalidated");
                return false;
            }
            return true;
        }

        if (frame instanceof TextWebSocketFrame tFrame) {
            boolean authorized = false;

            try {
                JSONObject jso = new JSONObject(tFrame.text());

                if (this.isAuthorized(ctx, ctx.channel().attr(WebSocketFrameHandler.ATTR_REQUEST_URI).get(), true,
                        jso)) {
                    ctx.channel().attr(WsAuthenticationHandler.ATTR_AUTHENTICATED).set(Boolean.TRUE);
                    authorized = true;
                }
            } catch (JSONException | DataAccessException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
                WebSocketFrameHandler.sendWsFrame(ctx, frame,
                        WebSocketFrameHandler.prepareCloseWebSocketFrame(WebSocketCloseStatus.INTERNAL_SERVER_ERROR));
                ctx.close();
            }

            JSONStringer jsonObject = this.authResult(ctx, authorized);

            WebSocketFrameHandler.sendWsFrame(ctx, frame, new TextWebSocketFrame(jsonObject.toString()));
            ctx.channel().attr(WsAuthenticationHandler.ATTR_SENT_AUTH_REPLY).set(Boolean.TRUE);

            if (!authorized) {
                WebSocketFrameHandler.sendWsFrame(ctx, frame,
                        WebSocketFrameHandler.prepareCloseWebSocketFrame(WebSocketCloseStatus.POLICY_VIOLATION));
                ctx.close();
            } else if (this.authenticatedCallback != null) {
                this.authenticatedCallback.run();
            }

            return authorized;
        }

        return ctx.channel().attr(ATTR_AUTHENTICATED).get();
    }

    @Override
    public boolean checkAuthorizationHeaders(ChannelHandlerContext ctx, HttpHeaders headers, String requestUri) {
        ctx.channel().attr(WsAuthenticationHandler.ATTR_SENT_AUTH_REPLY).setIfAbsent(Boolean.FALSE);
        if (this.isAuthorized(ctx, headers, requestUri)) {
            ctx.channel().attr(WsAuthenticationHandler.ATTR_AUTHENTICATED).set(Boolean.TRUE);

            return true;
        }

        return false;
    }

    /**
     * Sends an HTTP authentication result
     *
     * @param ctx        The {@link ChannelHandlerContext}
     * @param req        The request
     * @param status     The response status
     * @param authorized {@code true} if authorized
     */
    private void httpResult(ChannelHandlerContext ctx, FullHttpRequest req, HttpResponseStatus status,
            boolean authorized) {
        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());
        JSONStringer jss = this.authResult(ctx, authorized);
        FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(status, jss.toString(),
                AUTH_RESULT_CONTENT_TYPE);

        com.gmt2001.Console.debug.println(status.code() + " " + req.method().asciiName() + ": " + qsd.path());

        HttpServerPageHandler.sendHttpResponse(ctx, req, res);
    }

    /**
     * Processes an authentication frame sent via HTTP
     *
     * @param ctx    The context
     * @param req    The request
     * @param jso    The data frame
     * @param doFail {@code true} to also send fail result
     * @return {@code true} on success
     */
    boolean httpAuthFrame(ChannelHandlerContext ctx, FullHttpRequest req, JSONObject jso, boolean doFail) {
        try {
            if (this.isAuthorized(ctx, req.uri(), false, jso)) {
                com.gmt2001.Console.debug.println("200");
                this.httpResult(ctx, req, HttpResponseStatus.OK, true);

                if (this.authenticatedCallback != null) {
                    this.authenticatedCallback.run();
                }

                return true;
            }

            if (doFail) {
                this.httpResult(ctx, req, HttpResponseStatus.UNAUTHORIZED, false);
            }
        } catch (JSONException | DataAccessException ex) {
            if (doFail) {
                com.gmt2001.Console.err.printStackTrace(ex);
                this.httpResult(ctx, req, HttpResponseStatus.INTERNAL_SERVER_ERROR, false);
            } else {
                throw ex;
            }
        }

        return false;
    }

    @Override
    public boolean checkAuthorization(ChannelHandlerContext ctx, FullHttpRequest req) {
        ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).setIfAbsent(null);
        ctx.channel().attr(ATTR_SESSIONID).setIfAbsent(null);
        HttpHeaders headers = req.headers();

        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());

        try {
            if (this.isAuthorized(ctx, req)) {
                return true;
            }

            String source = req.content().toString(StandardCharsets.UTF_8);
            JSONObject jso = null;
            if (source.startsWith("[")) {
                JSONArray jsa = new JSONArray(source);
                if (!jsa.isEmpty()) {
                    jso = jsa.getJSONObject(0);
                }
            } else if (source.startsWith("{")) {
                jso = new JSONObject(source);
            }
            if (jso != null && this.httpAuthFrame(ctx, req, jso, false)) {
                return true;
            }
        } catch (JSONException | DataAccessException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            this.httpResult(ctx, req, HttpResponseStatus.INTERNAL_SERVER_ERROR, false);
            return false;
        }

        this.httpResult(ctx, req, HttpResponseStatus.UNAUTHORIZED, false);
        return false;
    }

    @Override
    public boolean isAuthorized(ChannelHandlerContext ctx, FullHttpRequest req) {
        return this.isAuthorized(ctx, req.headers(), req.uri(), req.method().equals(HttpMethod.GET));
    }

    /**
     * Checks if the given {@link JSONObject} is a valid auth request frame
     * <p>
     * Sets {@link PanelUserAuthenticationHandler.ATTR_AUTH_USER} if authorization
     * is successful and not already set
     *
     * @param ctx        The {@link ChannelHandlerContext} of the session
     * @param requestUri The request URI
     * @param isWs       {@code true} if the connection is a Web Socket
     * @param jso        The data frame to check
     * @return {@code true} if authorized
     */
    public boolean isAuthorized(ChannelHandlerContext ctx, String requestUri, boolean isWs, JSONObject jso) {
        if (jso.has("authenticate")) {
            String sessionId = ctx.channel().attr(ATTR_SESSIONID).get();
            if (sessionId == null) {
                sessionId = "";
            }
            if (ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).get() != null) {
                ctx.channel().attr(ATTR_SESSIONID).set(this.sessionIdSupplier.apply(Tuples.of(ctx,
                        isWs, isWs, requestUri, sessionId)));
                return true;
            } else {
                PanelUser user = PanelUserHandler.checkAuthTokenAndGetUser(jso.getString("authenticate"));
                if (user != null) {
                    ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).set(user);
                    ctx.channel().attr(ATTR_SESSIONID).set(this.sessionIdSupplier.apply(Tuples.of(ctx,
                            isWs, isWs, requestUri, sessionId)));
                    return true;
                }
            }
        }

        return false;
    }

    @Override
    public boolean isAuthorized(ChannelHandlerContext ctx, HttpHeaders headers, String requestUri) {
        return this.isAuthorized(ctx, headers, requestUri, true);
    }

    /**
     * Checks if the given {@link HttpHeaders} contain a valid authorization, or if
     * the underlying {@link Channel} has already been
     * authenticated
     * <p>
     * When returning {@code false}, this method MUST NOT send a response to the
     * client
     *
     * @param ctx        The {@link ChannelHandlerContext} of the session
     * @param headers    The {@link HttpHeaders} to check
     * @param requestUri The request URI
     * @param isGet      {@code true} if HTTP GET or WS; {@code false} for any other
     *                   HTTP method
     * @return {@code true} if authorized
     */
    public boolean isAuthorized(ChannelHandlerContext ctx, HttpHeaders headers, String requestUri, boolean isGet) {
        Tuple2<String, String> auth = HttpServerPageHandler.getAuthorizationHeaders(headers);

        if (auth.getT1() != null) {
            PanelUser user = PanelUserHandler.checkLoginAndGetUserB64(auth.getT1(), requestUri);
            ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).set(user);
            if (user != null) {
                ctx.channel().attr(ATTR_SESSIONID)
                        .set(this.sessionIdSupplier.apply(Tuples.of(ctx, isGet,
                                ctx.channel().attr(WsAuthenticationHandler.ATTR_SENT_AUTH_REPLY).get() != null,
                                requestUri,
                                auth.getT2())));
                return true;
            }
        }

        return false;
    }

    @Override
    public boolean isAuthorized(String user, String pass) {
        throw new UnsupportedOperationException("Only PanelUser authorization with Headers/URI supported");
    }
}
