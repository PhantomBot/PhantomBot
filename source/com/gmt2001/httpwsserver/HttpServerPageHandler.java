/*
 * Copyright (C) 2016-2018 phantombot.tv
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

import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpHeaderValues;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpStatusClass;
import io.netty.handler.codec.http.HttpUtil;
import io.netty.handler.codec.http.HttpVersion;
import io.netty.util.CharsetUtil;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Processes HTTP requests and passes successful ones to the appropriate registered final handler
 *
 * @author gmt2001
 */
class HttpServerPageHandler extends SimpleChannelInboundHandler<FullHttpRequest> {

    /**
     * A map of registered {@link HttpRequestHandler} for handling HTTP Requests
     */
    static Map<String, HttpRequestHandler> httpHandlers = new ConcurrentHashMap<>();

    /**
     * Handles incoming HTTP requests and passes valid ones to the appropriate {@link HttpRequestHandler}
     *
     * If a handler is not available for the requested path, then {@code 404 NOT FOUND} is sent back to the client
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param req The {@link FullHttpRequest} containing the request
     * @throws Exception Passes any thrown exceptions up the stack
     */
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, FullHttpRequest req) throws Exception {
        if (!req.decoderResult().isSuccess()) {
            sendHttpResponse(ctx, req, prepareHttpResponse(HttpResponseStatus.BAD_REQUEST, null, null));
            return;
        }

        HttpRequestHandler h = determineHttpHandler(req.uri());

        if (h != null) {
            if (h.getAuthHandler().checkAuthorization(ctx, req)) {
                h.handleRequest(ctx, req);
            }
        } else {
            sendHttpResponse(ctx, req, prepareHttpResponse(HttpResponseStatus.NOT_FOUND, null, null));
        }
    }

    /**
     * Handles exceptions that are thrown up the stack
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param cause The exception
     */
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        com.gmt2001.Console.debug.printOrLogStackTrace(cause);
        ctx.close();
    }

    /**
     * Determines the best {@link HttpRequestHandler} to use for a given URI
     *
     * @param uri The URI to check
     * @return The {@link HttpRequestHandler} to use, or {@code null} if none were found
     */
    static HttpRequestHandler determineHttpHandler(String uri) {
        String bestMatch = "";

        for (String k : httpHandlers.keySet()) {
            if (uri.startsWith(k) && k.length() > bestMatch.length()) {
                bestMatch = k;
            }
        }

        return bestMatch.isBlank() ? null : httpHandlers.get(bestMatch);
    }

    /**
     * Detects the content MIME type based on the filename or manually provided type extension
     *
     * NOTE: This method ignores everything before the last {@code .} in the filename
     *
     * @param fileNameOrType The filename or type extension to check
     * @return The valid MIME type, or {@code text/plain} if not recognized
     */
    static String detectContentType(String fileNameOrType) {
        String ext = (fileNameOrType.lastIndexOf(".") == -1 ? fileNameOrType : fileNameOrType.substring(fileNameOrType.lastIndexOf(".")));

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
     * Creates and prepares a {@link FullHttpResponse} for transmission
     *
     * This method automatically sets the {@code Content-Type} and {@code Content-Length} headers
     *
     * If the value of {@code status} is in the {@code CLIENT ERROR 4xx}, {@code SERVER ERROR 5xx}, or an unknown class, then the standard name of the
     * status code is appended to the beginning of the HTML response, along with 2 line breaks and the MIME type is set to {@code text/html}, unless
     * {@code fileNameOrType} ends with {@code json} or {@code xml}
     *
     * @param status The {@link HttpResponseStatus} to return
     * @param content The content to send
     * @param fileNameOrType The filename or type extension for MIME type detection
     * @return A {@link FullHttpRequest} that is ready to transmit
     */
    public static FullHttpResponse prepareHttpResponse(HttpResponseStatus status, String content, String fileNameOrType) {
        boolean isError = status.codeClass() == HttpStatusClass.CLIENT_ERROR || status.codeClass() == HttpStatusClass.SERVER_ERROR || status.codeClass() == HttpStatusClass.UNKNOWN;

        if (isError && !fileNameOrType.endsWith("json") && !fileNameOrType.endsWith("xml")) {
            content = "<br /><br />" + content;
        }

        FullHttpResponse res = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, status, Unpooled.EMPTY_BUFFER);

        if (isError && !fileNameOrType.endsWith("json") && !fileNameOrType.endsWith("xml")) {
            ByteBuf buf = Unpooled.copiedBuffer(res.status().toString(), CharsetUtil.UTF_8);
            ByteBuf bcontent = Unpooled.copiedBuffer(content, CharsetUtil.UTF_8);
            res.content().writeBytes(buf).writeBytes(bcontent);
            buf.release();
            bcontent.release();
            res.headers().set(HttpHeaderNames.CONTENT_TYPE, detectContentType("html"));
            HttpUtil.setContentLength(res, res.content().readableBytes());
        } else {
            ByteBuf bcontent = Unpooled.copiedBuffer(content, CharsetUtil.UTF_8);
            res.content().writeBytes(bcontent);
            bcontent.release();
            res.headers().set(HttpHeaderNames.CONTENT_TYPE, detectContentType(fileNameOrType));
            HttpUtil.setContentLength(res, res.content().readableBytes());
        }

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
        if (!HttpUtil.isKeepAlive(req) || res.status().code() != 200) {
            res.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.CLOSE);
            ctx.writeAndFlush(res).addListener(ChannelFutureListener.CLOSE);
        } else {
            if (req.protocolVersion().equals(HttpVersion.HTTP_1_0)) {
                res.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.KEEP_ALIVE);
            }

            ctx.writeAndFlush(res);
        }
    }

    /**
     * Registers a HTTP URI path to a {@link HttpRequestHandler}
     *
     * @param path The URI path to bind the handler to
     * @param handler The {@link HttpRequestHandler} that will handle the requests
     * @throws IllegalArgumentException If {@code path} is either already registered, or illegal
     * @see validateUriPath
     */
    public void registerHttpHandler(String path, HttpRequestHandler handler) {
        if (HTTPWSServer.validateUriPath(path, false)) {
            if (httpHandlers.containsKey(path)) {
                throw new IllegalArgumentException("The specified path is already registered. Please unregister it first");
            } else {
                httpHandlers.put(path, handler);
            }
        } else {
            throw new IllegalArgumentException("Illegal path. Must not contain .. or /ws and must not attempt to access any part of /config other than /config/audio-hooks or /config/gif-alerts");
        }
    }

    /**
     * Deregisters a HTTP URI path
     *
     * @param path The path to deregister
     */
    public void deregisterHttpHandler(String path) {
        httpHandlers.remove(path);
    }

}
