/* astyle --style=java --indent=spaces=4 */

/*
 * Copyright (C) 2016 phantombot.tv
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

import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.gamewisp.GameWispChangeEvent;
import me.mast3rplan.phantombot.event.gamewisp.GameWispBenefitsEvent;
import me.mast3rplan.phantombot.event.gamewisp.GameWispSubscribeEvent;
import me.mast3rplan.phantombot.event.gamewisp.GameWispAnniversaryEvent;

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
    private static final String devKey = "d391637bb332e0b67d60388e2cac31dd93ad5bf";

    private Socket webSocket;

    private boolean Authenticated = false;
    private boolean ChannelConnected = false;
    private String AccessToken = "";
    private String SessionID = "";

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
                    com.gmt2001.Console.debug.println("SingularityWS (GameWisp): Connected to Singularity");
                    webSocket.emit("authentication", new JSONObject().put("key", devKey).put("access_token", AccessToken));
                }
            });

            webSocket.on("unauthorized", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    JSONObject jsonObject = new JSONObject(args[0].toString());
                    com.gmt2001.Console.err.println("SingularityWS (GameWisp): Authorization Failed: " + jsonObject.getString("message"));
                }
            });

            webSocket.on("authenticated", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    com.gmt2001.Console.debug.println("SingularityWS (GameWisp): Authenticated");
                    JSONObject jsonObject = new JSONObject(args[0].toString());
                    if (!jsonObject.has("session")) {
                        com.gmt2001.Console.err.println("SingularityWS (GameWisp): Missing Session in Authenticated Return JSON");
                        Authenticated = false;
                        return;
                    }
                    SessionID = jsonObject.getString("session");
                    Authenticated = true;
                }
            });

            webSocket.on("app-channel-connected", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    if (Authenticated) {
                        if (PhantomBot.enableDebugging) {
                            com.gmt2001.Console.debug.println("SingularityWS (GameWisp): Connected to Channel");
                        } else {
                            com.gmt2001.Console.out.println("SingularityWS (GameWisp): Connected and Ready for Requests");
                        }
                        ChannelConnected = true;
                    } else {
                        com.gmt2001.Console.debug.println("SingularityWS (GameWisp): Connected to Channel; Missing Session ID; Unusable Session");
                        ChannelConnected = false;
                    }
                }
            });

            webSocket.on("subscriber-new", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    com.gmt2001.Console.debug.println("SingularityWS (GameWisp): subscriber-new received");
                    JSONObject jsonObject = new JSONObject(args[0].toString());
                    if (!jsonObject.has("data")) {
                        return;
                    }
                    if (!jsonObject.getJSONObject("data").has("usernames")) {
                        return;
                    }
                    if (!jsonObject.getJSONObject("data").getJSONObject("usernames").has("twitch")) {
                        return;
                    }
                    if (!jsonObject.getJSONObject("data").has("tier")) {
                        return;
                    }
                    if (!jsonObject.getJSONObject("data").getJSONObject("tier").has("level")) {
                        return;
                    }
                    String username = jsonObject.getJSONObject("data").getJSONObject("usernames").getString("twitch");
                    int tier = jsonObject.getJSONObject("data").getJSONObject("tier").getInt("level");
                    EventBus.instance().post(new GameWispSubscribeEvent(username, tier));
                }
            });

            webSocket.on("subscriber-anniversary", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    com.gmt2001.Console.debug.println("SingularityWS (GameWisp): subscriber-anniversary received");
                    JSONObject jsonObject = new JSONObject(args[0].toString());
                    if (!jsonObject.has("data")) {
                        return; 
                    }
                    if (!jsonObject.getJSONObject("data").has("subscriber")) {
                        return;
                    }
                    if (!jsonObject.getJSONObject("data").getJSONObject("subscriber").has("usernames")) {
                        return;
                    }
                    if (!jsonObject.getJSONObject("data").getJSONObject("subscriber").getJSONObject("usernames").has("twitch")) {
                        return;
                    }
                    if (!jsonObject.getJSONObject("data").has("month_count")) {
                        return;
                    }
                    String username = jsonObject.getJSONObject("data").getJSONObject("subscriber").getJSONObject("usernames").getString("twitch");
                    int months = jsonObject.getJSONObject("data").getInt("month_count");
                    EventBus.instance().post(new GameWispAnniversaryEvent(username, months));
                }
            });

            webSocket.on("subscriber-benefits-change", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    com.gmt2001.Console.debug.println("SingularityWS (GameWisp): subscriber-benefits-change received");
                    JSONObject jsonObject = new JSONObject(args[0].toString());
                    if (!jsonObject.has("data")) {
                        return;
                    }
                    if (!jsonObject.getJSONObject("data").has("usernames")) {
                        return;
                    }
                    if (!jsonObject.getJSONObject("data").getJSONObject("usernames").has("twitch")) {
                        return;
                    }
                    if (!jsonObject.has("tier")) {
                        return;
                    }
                    if (!jsonObject.getJSONObject("tier").has("level")) {
                        return;
                    }
                    String username = jsonObject.getJSONObject("data").getJSONObject("usernames").getString("twitch");
                    int tier = jsonObject.getJSONObject("tier").getInt("level");
                    EventBus.instance().post(new GameWispBenefitsEvent(username, tier));
                }
            });

            /**
             * Status Change Values: https://gamewisp.readme.io/docs/subscriber-new
             * active - a currently active subscriber
             * trial - a subscriber on a trial code
             * grace_period - a canceled subscriber that is still received benefits
             * billing_grace_period - a canceled subscriber still receiving benefits that was canceled due to a payment processing error
             * inactive - a subscriber that is canceled and receiving no benefits
             * twitch - a subscriber that is receiving free benefits from a partnered Twitch streamer.
             */
            webSocket.on("subscriber-status-change", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    com.gmt2001.Console.debug.println("SingularityWS (GameWisp): subscriber-status-changed received");
                    JSONObject jsonObject = new JSONObject(args[0].toString());
                    if (!jsonObject.has("data")) {
                        return;
                    }
                    if (!jsonObject.getJSONObject("data").has("usernames")) {
                        return;
                    }
                    if (!jsonObject.getJSONObject("data").getJSONObject("usernames").has("twitch")) {
                        return;
                    }
                    if (!jsonObject.getJSONObject("data").has("status")) {
                        return;
                    }
                    String username = jsonObject.getJSONObject("data").getJSONObject("usernames").getString("twitch");
                    String status = jsonObject.getJSONObject("data").getString("status");
                    EventBus.instance().post(new GameWispChangeEvent(username, status));
                }
            });

            webSocket.on(Socket.EVENT_DISCONNECT, new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    com.gmt2001.Console.debug.println("SingularityWS (GameWisp): Disconnected");
                }
            });

            webSocket.connect();

        } catch (Exception ex) {
            com.gmt2001.Console.err.println("SingularityWS (GameWisp): Exception: " + ex.getMessage());
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
