/* astyle --style=java --indent=spaces=4 */

/*
 * Copyright (C) 2015 www.phantombot.net
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
package com.illusionaryone;

import com.gmt2001.UncaughtExceptionHandler;

import java.security.NoSuchAlgorithmException;
import java.security.KeyManagementException;
import java.io.IOException;
import java.lang.IllegalArgumentException;
import java.lang.InterruptedException;
import java.security.cert.CertificateException;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLContext;
import java.security.cert.X509Certificate;
import java.net.URISyntaxException;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.net.ssl.SSLSession;

import io.socket.emitter.Emitter;
import io.socket.client.IO;
import io.socket.client.IO.Options;
import io.socket.client.Manager;
import io.socket.client.On;
import io.socket.client.Socket;
import io.socket.client.Url;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;

/*
 * @author illusionaryone
 */
public class SingularityAPI {

    private static final SingularityAPI instance = new SingularityAPI();

    private static final String apiURL = "https://singularity.gamewisp.com";
    private static final String devKey = "feac11eb4d9ac56510b938232a79cf317de155d"; // TODO: IllusionaryBot, needs PhantomBot
    private static final String devSec = "6ecb43de8f1704bef5b8c4afa2c85052d6846a2"; // TODO: IllusionaryBot, needs PhantomBot

    private Socket webSocket;

    private boolean Authenticated = false;
    private boolean ChannelConnected = false;
    private String AccessToken = "";

    public static SingularityAPI instance() {
        return instance;
    }

    public void SingularityAPI() {
    }

    public void StartService() {

        TrustManager[] trustAllCerts = new TrustManager[] {
            new X509TrustManager() {
                public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                    return new java.security.cert.X509Certificate[] {};
                }

                public void checkClientTrusted(X509Certificate[] chain,
                                               String authType) throws CertificateException {
                }

                public void checkServerTrusted(X509Certificate[] chain,
                                               String authType) throws CertificateException {
                }
            }
        };

        try {
            SSLContext mySSLContext = SSLContext.getInstance("TLS");
            mySSLContext.init(null, null, null);

            IO.Options opts = new IO.Options();
            opts.sslContext = mySSLContext;
            opts.hostnameVerifier = new NullHostnameVerifier();
            webSocket = IO.socket(apiURL);

            webSocket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    com.gmt2001.Console.debug.println("SingularityWS: Connected to Singularity");
                    webSocket.emit("authentication", new JSONObject().put("key", devKey).put("secret", devSec));
                }
            });

            webSocket.on("unauthorized", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    com.gmt2001.Console.err.println("SingularityWS: Authorization failed, please check Access Token");
                }
            });

            webSocket.on("authenticated", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    com.gmt2001.Console.debug.println("SingularityWS: Authenticated");
                    Authenticated = true;
                    webSocket.emit("channel-connect", new JSONObject().put("access_token", AccessToken));
                }
            });

            webSocket.on("app-channel-connected", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    com.gmt2001.Console.debug.println("SingularityWS: Connected to Channel");
                    ChannelConnected = true;
                }
            });

            webSocket.on("subscriber-new", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    JSONObject jsonObject = new JSONObject(args[0].toString());
                    // jsonObject.getJSONObject("data").getJSONObject("usernames").getString("twitch");
                }
            });

            webSocket.on("subscriber-anniversary", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    JSONObject jsonObject = new JSONObject(args[0].toString());
                    // jsonObject.getJSONObject("data").getJSONObject("subscriber").getJSONObject("usernames").getString("twitch");
                    // jsonObject.getJSONObject("data").getInt("month_count"));
                }
            });

            webSocket.on("subscriber-status-change", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    JSONObject jsonObject = new JSONObject(args[0].toString());
                    // jsonObject.getJSONObject("data").getJSONObject("usernames").getString("twitch");
                    // jsonObject.getJSONObject("data").getString("status"));
                }
            });

            webSocket.on(Socket.EVENT_DISCONNECT, new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                }
            });

            webSocket.connect();

        } catch (Exception ex) {
            com.gmt2001.Console.err.println("SingularityWS: Exception: " + ex.getMessage());
        }
    }

    public void setAccessToken(String AccessToken) {
        this.AccessToken = AccessToken;
    }

    public Boolean isAuthenticated() {
        return Authenticated;
    }

    public Boolean isChannelConnected() {
        return ChannelConnected;
    }

    private class NullHostnameVerifier implements HostnameVerifier {
        public boolean verify(String urlHostname, SSLSession sslSession) {
            return true;
        }
    }

}
