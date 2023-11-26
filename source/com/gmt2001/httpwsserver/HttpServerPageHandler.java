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
package com.gmt2001.httpwsserver;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.gmt2001.PathValidator;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.channel.ChannelHandler.Sharable;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpHeaderValues;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpStatusClass;
import io.netty.handler.codec.http.HttpUtil;
import io.netty.handler.codec.http.HttpVersion;
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.util.CharsetUtil;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

/**
 * Processes HTTP requests and passes successful ones to the appropriate
 * registered final handler
 *
 * @author gmt2001
 */
@Sharable
public class HttpServerPageHandler extends SimpleChannelInboundHandler<FullHttpRequest> {

    /**
     * A map of registered {@link HttpRequestHandler} for handling HTTP Requests
     */
    static Map<String, HttpRequestHandler> httpRequestHandlers = new ConcurrentHashMap<>();

    /**
     * Default Constructor
     */
    HttpServerPageHandler() {
        super();
    }

    /**
     * Handles incoming HTTP requests and passes valid ones to the appropriate
     * {@link HttpRequestHandler}
     *
     * If a handler is not available for the requested path, then
     * {@code 404 NOT FOUND} is sent back to the client
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param req The {@link FullHttpRequest} containing the request
     * @throws Exception Passes any thrown exceptions up the stack
     */
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, FullHttpRequest req) throws Exception {
        if (!req.decoderResult().isSuccess()) {
            com.gmt2001.Console.debug.println("400 DECODER");
            com.gmt2001.Console.err.printStackTrace(req.decoderResult().cause());
            sendHttpResponse(ctx, req, prepareHttpResponse(HttpResponseStatus.BAD_REQUEST));
            RequestLogger.log(ctx);
            return;
        }

        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());
        HttpRequestHandler h = determineHttpRequestHandler(qsd.path());

        if (h != null) {
            try {
                if (h.getHttpAuthHandler().checkAuthorization(ctx, req)) {
                    h.handleRequest(ctx, req);
                }
            } catch (Exception ex) {
                sendHttpResponse(ctx, req, prepareHttpResponse(HttpResponseStatus.INTERNAL_SERVER_ERROR));
                com.gmt2001.Console.err
                        .println("500 " + req.method().asciiName() + ": " + qsd.path() + " >> " + ex.toString());
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        } else {
            com.gmt2001.Console.debug.println("404 " + req.method().asciiName() + ": " + qsd.path());
            sendHttpResponse(ctx, req, prepareHttpResponse(HttpResponseStatus.NOT_FOUND));
        }
    }

    /**
     * Handles exceptions that are thrown up the stack
     *
     * @param ctx   The {@link ChannelHandlerContext} of the session
     * @param cause The exception
     */
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        if (!cause.getMessage().contains("certificate_unknown") && !cause.getMessage().contains("bad_certificate")
                && !cause.getMessage().contains("connection was aborted")) {
            com.gmt2001.Console.debug.printOrLogStackTrace(cause);
        }
        ctx.close();
    }

    /**
     * Checks the given {@link HttpHeaders} for either an
     * {@code Authorization: Basic} header, or a cookie named {@code panellogin}
     * <p>
     * {@code Authorization: Basic} takes priority
     *
     * @param headers The {@link HttpHeaders} to check
     * @return The authorization string, still encoded with Base64, giving
     *         preference to {@code Authorization Basic}; Empty string if neither is
     *         found
     */
    public static String getAuthorizationString(HttpHeaders headers) {
        return getAuthorizationHeaders(headers).getT1();
    }

    /**
     * Returns the authorization headers and session ID
     * <p>
     * {@link Tuple2#getT1()} Checks the given {@link HttpHeaders} for either an
     * {@code Authorization: Basic} header, or a cookie named {@code panellogin}
     * <p>
     * {@code Authorization: Basic} takes priority
     * <p>
     * {@link Tuple2#getT2()} Checks the given {@link HttpHeaders} for a
     * {@code SessionID} header
     *
     * @param headers The {@link HttpHeaders} to check
     * @return {@link Tuple2#getT1()} The authorization string, still encoded with
     *         Base64, giving preference to {@code Authorization Basic};
     *         {@link Tuple2#getT2()} A session id; Either value may be {@code null}
     *         if it is not found.
     */
    public static Tuple2<String, String> getAuthorizationHeaders(HttpHeaders headers) {
        String auth = headers.get("Authorization");
        String outAuth = "";

        if (auth != null && auth.startsWith("Basic ")) {
            outAuth = auth.substring(6);
        } else {
            Map<String, String> cookies = parseCookies(headers);
            outAuth = cookies.getOrDefault("panellogin", "");
        }

        return Tuples.of(outAuth, headers.get("SessionID", ""));
    }

    /**
     * Determines the best {@link HttpRequestHandler} to use for a given URI
     *
     * @param uri The URI to check
     * @return The {@link HttpRequestHandler} to use, or {@code null} if none were
     *         found
     */
    static HttpRequestHandler determineHttpRequestHandler(String uri) {
        String bestMatch = "";

        if (URLDecoder.decode(uri, StandardCharsets.UTF_8).contains("..")) {
            return null;
        }

        for (String k : httpRequestHandlers.keySet()) {
            if (uri.startsWith(k) && k.length() > bestMatch.length()) {
                bestMatch = k;
            }
        }

        return bestMatch.isBlank() ? null : httpRequestHandlers.get(bestMatch);
    }

    /**
     * Detects the content MIME type based on the filename or manually provided type
     * extension
     * <p>
     * NOTE: This method ignores everything before the last {@code .} in the
     * filename
     *
     * @param fileNameOrType The filename or type extension to check
     * @return The valid MIME type, or {@code text/plain} if not recognized
     */
    public static String detectContentType(String fileNameOrType) {
        String ext = (fileNameOrType.lastIndexOf('.') == -1 ? fileNameOrType
                : fileNameOrType.substring(fileNameOrType.lastIndexOf('.') + 1));

        switch (ext) {
            case "aac":
                return "audio/aac";
            case "coffee":
                return "application/vnd.coffeescript";
            case "css":
            case "less":
            case "scss":
                return "text/css; charset=UTF-8";
            case "eot":
                return "application/vnd.ms-fontobject";
            case "form-data":
                return "multipart/form-data";
            case "gif":
                return "image/gif";
            case "htm":
            case "html":
                return "text/html; charset=UTF-8";
            case "ico":
                return "image/x-icon";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "js":
            case "javascript":
                return "application/javascript; charset=UTF-8";
            case "json":
            case "map":
                return "application/json";
            case "md":
                return "text/markdown";
            case "mp3":
                return "audio/mpeg";
            case "mp4":
                return "video/mp4";
            case "oga":
            case "ogg":
                return "audio/ogg";
            case "ogv":
                return "video/ogg";
            case "otf":
                return "font/otf";
            case "pdf":
                return "application/pdf";
            case "png":
                return "image/png";
            case "svg":
                return "image/svg+xml";
            case "ttf":
                return "font/ttf";
            case "webm":
                return "video/webm";
            case "woff":
                return "font/woff";
            case "woff2":
                return "font/woff2";
            case "x-www-form-urlencoded":
                return "application/x-www-form-urlencoded";
            case "xml":
                return "text/xml; charset=UTF-8";
            case "zip":
                return "application/zip";
            default:
                return "text/plain";
        }
    }

    /**
     * Creates and prepares a {@link FullHttpResponse} for transmission of a status
     * code only
     * <p>
     * If the value of {@code status} is in the {@code CLIENT ERROR 4xx},
     * {@code SERVER ERROR 5xx}, or an unknown class, then the standard name of the
     * status code is appended to the beginning of the HTML response
     *
     * @param status The {@link HttpResponseStatus} to return
     * @return A {@link FullHttpResponse} that is ready to transmit
     */
    public static FullHttpResponse prepareHttpResponse(HttpResponseStatus status) {
        return prepareHttpResponse(status, (byte[]) null, null);
    }

    /**
     * Creates and prepares a {@link FullHttpResponse} for transmission as
     * text/plain
     * <p>
     * This method automatically sets the {@code Content-Type} and
     * {@code Content-Length} headers
     * <p>
     * If the value of {@code status} is in the {@code CLIENT ERROR 4xx},
     * {@code SERVER ERROR 5xx}, or an unknown class, then the standard name of the
     * status code is appended to the beginning of the HTML response, along with 2
     * line breaks and the MIME type is set to {@code text/html}, unless
     * {@code fileNameOrType} ends with {@code json} or {@code xml}
     *
     * @param status  The {@link HttpResponseStatus} to return
     * @param content The content to send
     * @return A {@link FullHttpResponse} that is ready to transmit
     */
    public static FullHttpResponse prepareHttpResponse(HttpResponseStatus status, String content) {
        return prepareHttpResponse(status, content.getBytes(CharsetUtil.UTF_8), null);
    }

    /**
     * Creates and prepares a {@link FullHttpResponse} for transmission
     * <p>
     * This method automatically sets the {@code Content-Type} and
     * {@code Content-Length} headers
     * <p>
     * If the value of {@code status} is in the {@code CLIENT ERROR 4xx},
     * {@code SERVER ERROR 5xx}, or an unknown class, then the standard name of the
     * status code is appended to the beginning of the HTML response, along with 2
     * line breaks and the MIME type is set to {@code text/html}, unless
     * {@code fileNameOrType} ends with {@code json} or {@code xml}
     *
     * @param status         The {@link HttpResponseStatus} to return
     * @param content        The content to send
     * @param fileNameOrType The filename or type extension for MIME type detection
     * @return A {@link FullHttpResponse} that is ready to transmit
     */
    public static FullHttpResponse prepareHttpResponse(HttpResponseStatus status, String content,
            String fileNameOrType) {
        return prepareHttpResponse(status, content.getBytes(CharsetUtil.UTF_8), fileNameOrType);
    }

    /**
     * Creates and prepares a {@link FullHttpResponse} for transmission
     * <p>
     * This method automatically sets the {@code Content-Type} and
     * {@code Content-Length} headers
     * <p>
     * If the value of {@code status} is in the {@code CLIENT ERROR 4xx},
     * {@code SERVER ERROR 5xx}, or an unknown class, then the standard name of the
     * status code is appended to the beginning of the HTML response, along with 2
     * line breaks and the MIME type is set to {@code text/html}, unless
     * {@code fileNameOrType} ends with {@code json} or {@code xml}
     *
     * @param status         The {@link HttpResponseStatus} to return
     * @param content        The content to send
     * @param fileNameOrType The filename or type extension for MIME type detection
     * @return A {@link FullHttpResponse} that is ready to transmit
     */
    public static FullHttpResponse prepareHttpResponse(HttpResponseStatus status, byte[] content,
            String fileNameOrType) {
        boolean isError = status.codeClass() == HttpStatusClass.CLIENT_ERROR
                || status.codeClass() == HttpStatusClass.SERVER_ERROR || status.codeClass() == HttpStatusClass.UNKNOWN;

        if (content == null) {
            content = new byte[0];
        }

        if (fileNameOrType == null) {
            fileNameOrType = "";
        }

        FullHttpResponse res = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, status, Unpooled.buffer());

        if (isError && !fileNameOrType.endsWith("json") && !fileNameOrType.endsWith("xml")) {
            ByteBuf buf = Unpooled.copiedBuffer(res.status().toString() + (content.length > 0 ? "<br /><br />" : ""),
                    CharsetUtil.UTF_8);
            try {
                ByteBuf bcontent = Unpooled.copiedBuffer(content);
                try {
                    res.content().writeBytes(buf).writeBytes(bcontent);
                } finally {
                    ReferenceCountedUtil.releaseObj(bcontent);
                }
            } finally {
                ReferenceCountedUtil.releaseObj(buf);
            }
            res.headers().set(HttpHeaderNames.CONTENT_TYPE, detectContentType("html"));
            HttpUtil.setContentLength(res, res.content().readableBytes());
        } else {
            ByteBuf bcontent = Unpooled.copiedBuffer(content);
            try {
                res.content().writeBytes(bcontent);
            } finally {
                ReferenceCountedUtil.releaseObj(bcontent);
            }
            res.headers().set(HttpHeaderNames.CONTENT_TYPE, detectContentType(fileNameOrType));
            HttpUtil.setContentLength(res, res.content().readableBytes());
        }

        res.headers().set(HttpHeaderNames.CACHE_CONTROL, HttpHeaderValues.NO_STORE);
        res.headers().add(HttpHeaderNames.CACHE_CONTROL, HttpHeaderValues.MAX_AGE + "=" + HttpHeaderValues.ZERO);

        return res;
    }

    /**
     * Creates and prepares a CORS preflight {@link FullHttpResponse} for
     * transmission
     *
     * @param req            The preflight request
     * @param allowedMethods The allowed {@link HttpMethod}
     * @param allowedHeaders The allowed {@link HttpHeaderNames}
     * @param cacheTime      The maximum time the browser is allowed to cache the
     *                       preflight response
     * @return A {@link FullHttpResponse} that is ready to transmit
     */
    public static FullHttpResponse preparePreflightResponse(FullHttpRequest req, List<HttpMethod> allowedMethods,
            List<String> allowedHeaders, Duration cacheTime) {
        FullHttpResponse res = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.NO_CONTENT,
                Unpooled.buffer());

        if (req.headers().get(HttpHeaderNames.ORIGIN) != null) {
            res.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_ORIGIN, req.headers().get(HttpHeaderNames.ORIGIN));
            res.headers().set(HttpHeaderNames.VARY, HttpHeaderNames.ORIGIN);
        }
        res.headers().set(HttpHeaderNames.ACCESS_CONTROL_MAX_AGE, cacheTime.toSeconds());
        res.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_CREDENTIALS, true);
        res.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_PRIVATE_NETWORK, true);

        if (!allowedMethods.isEmpty()) {
            res.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_METHODS,
                    allowedMethods.stream().map(m -> m.name()).collect(Collectors.joining(", ")));
        }

        if (!allowedHeaders.isEmpty()) {
            res.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_HEADERS,
                    allowedHeaders.stream().collect(Collectors.joining(", ")));
        }

        res.headers().set(HttpHeaderNames.CONTENT_LENGTH, 0);

        return res;
    }

    /**
     * Transmits a {@link FullHttpResponse} back to the client
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param req The {@link FullHttpRequest} containing the request
     * @param res The {@link FullHttpResponse} to transmit
     */
    public static void sendHttpResponse(ChannelHandlerContext ctx, FullHttpRequest req, FullHttpResponse res) {
        sendHttpResponse(ctx, req, res, false);
    }

    /**
     * Transmits a {@link FullHttpResponse} back to the client
     *
     * @param ctx        The {@link ChannelHandlerContext} of the session
     * @param req        The {@link FullHttpRequest} containing the request
     * @param res        The {@link FullHttpResponse} to transmit
     * @param forceclose If true, connection is closed regardless of status code;
     *                   otherwise, only errors or unknown status codes will
     *                   explicitly close
     *                   the connection
     */
    @SuppressWarnings("unchecked")
    public static void sendHttpResponse(ChannelHandlerContext ctx, FullHttpRequest req, FullHttpResponse res,
            boolean forceclose) {
        boolean isError = res.status().codeClass() == HttpStatusClass.CLIENT_ERROR
                || res.status().codeClass() == HttpStatusClass.SERVER_ERROR
                || res.status().codeClass() == HttpStatusClass.UNKNOWN;
        try {
            ReferenceCountedUtil.releaseAuto(res);
            if (req == null || !HttpUtil.isKeepAlive(req) || isError || forceclose) {
                res.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.CLOSE);
                ctx.writeAndFlush(res).addListeners((p) -> {
                    ReferenceCountedUtil.releaseObj(res);
                }, ChannelFutureListener.CLOSE);
            } else {
                if (req.protocolVersion().equals(HttpVersion.HTTP_1_0)) {
                    res.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.KEEP_ALIVE);
                }

                ctx.writeAndFlush(res).addListener((p) -> {
                    ReferenceCountedUtil.releaseObj(res);
                });
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            ReferenceCountedUtil.releaseObj(res);
        }
    }

    /**
     * Transmits a {@link FullHttpResponse} back to the client that lists the
     * contents of the directory pointed to by {@code p}
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param req The {@link FullHttpRequest} containing the request
     * @param p   The {@link Path} to the directory to list
     */
    public static void listDirectory(ChannelHandlerContext ctx, FullHttpRequest req, Path p) {
        try {
            List<String> listing = new ArrayList<>();
            Files.list(p).forEach((f) -> {
                listing.add(f.getFileName().toString());
            });

            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(
                    HttpResponseStatus.OK, String.join("\n", listing).getBytes(StandardCharsets.UTF_8), "plain"));
        } catch (IOException ex) {
            com.gmt2001.Console.debug.println("500: " + p.toString());
            com.gmt2001.Console.debug.printStackTrace(ex);
            HttpServerPageHandler.sendHttpResponse(ctx, req,
                    HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.INTERNAL_SERVER_ERROR));
        }
    }

    /**
     * Checks if the file or directory pointed to by {@code p} exists, is not
     * hidden, is not a symlink, and is readable
     * <p>
     * Sends back a {@code 404 NOT FOUND} or {@code 403 FORBIDDEN} on failure
     *
     * @param ctx              The {@link ChannelHandlerContext} of the session
     * @param req              The {@link FullHttpRequest} containing the request
     * @param p                The {@link Path} to the file or directory to check
     * @param directoryAllowed Indicates if directories are allowed. If set to
     *                         {@code false}, will cause a {@code 403 FORBIDDEN} if
     *                         {@code p} is a
     *                         directory
     * @return and passed the same tests. {@code false} otherwise
     */
    public static boolean checkFilePermissions(ChannelHandlerContext ctx, FullHttpRequest req, Path p,
            boolean directoryAllowed) {
        if (!Files.exists(p)) {
            com.gmt2001.Console.debug.println("404: " + p.toString());
            HttpServerPageHandler.sendHttpResponse(ctx, req,
                    HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.NOT_FOUND));
            return false;
        } else if (!PathValidator.isValidPathWebAuth(p.toString()) || (Files.isDirectory(p) && !directoryAllowed)) {
            com.gmt2001.Console.debug.println("403: " + p.toString());
            HttpServerPageHandler.sendHttpResponse(ctx, req,
                    HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.FORBIDDEN));
            return false;
        }

        return true;
    }

    /**
     * Registers a HTTP URI path to a {@link HttpRequestHandler}
     *
     * @param path    The URI path to bind the handler to
     * @param handler The {@link HttpRequestHandler} that will handle the requests
     * @throws IllegalArgumentException If {@code path} is either already
     *                                  registered, or illegal
     * @see validateUriPath
     */
    public static void registerHttpHandler(String path, HttpRequestHandler handler) {
        if (HTTPWSServer.validateUriPath(path, false)) {
            if (httpRequestHandlers.containsKey(path)) {
                throw new IllegalArgumentException(
                        "The specified path is already registered. Please unregister it first");
            } else {
                httpRequestHandlers.put(path, handler);
            }
        } else {
            throw new IllegalArgumentException(
                    "Illegal path. Must not contain .. or /ws and must not attempt to access any part of /config other than /config/audio-hooks or /config/gif-alerts");
        }
    }

    /**
     * Deregisters a HTTP URI path
     *
     * @param path The path to deregister
     */
    public static void deregisterHttpHandler(String path) {
        httpRequestHandlers.remove(path);
    }

    /**
     * Parses out cookies and converts them to a Map
     *
     * @param headers The headers of the request
     * @return A Map of cookies
     */
    public static Map<String, String> parseCookies(HttpHeaders headers) {
        Map<String, String> cookies = new HashMap<>();

        headers.getAll("Cookie").stream()
                .forEach(hcookie -> Arrays.asList(hcookie.split("; ")).stream().forEach(scookie -> {
                    String[] cookie = scookie.split("=", 2);
                    cookies.put(cookie[0], cookie.length == 2 ? cookie[1] : null);
                }));

        return cookies;
    }

    /**
     * Parses out post data and converts it to a Map
     *
     * @param req The {@link FullHttpRequest} containing the request
     * @return A Map of post data
     */
    public static Map<String, String> parsePost(FullHttpRequest req) {
        Map<String, String> post = new HashMap<>();

        if (req != null) {
            Stream.of(req.content().toString(Charset.defaultCharset()).split("&")).forEach(ppost -> {
                String[] spost = ppost.split("=", 2);
                post.put(spost[0], spost.length == 2 ? URLDecoder.decode(spost[1], Charset.defaultCharset()) : null);
            });
        }

        return post;
    }

}
