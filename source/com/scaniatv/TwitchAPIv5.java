/*
 * Copyright (C) 2017 phantombot.tv
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
package com.scaniatv;

import com.gmt2001.UncaughtExceptionHandler;

import java.io.UnsupportedEncodingException;
import java.io.BufferedOutputStream;
import java.io.OutputStreamWriter;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.OutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.io.Reader;
import java.io.Writer;

import java.net.MalformedURLException;
import java.net.SocketTimeoutException;
import java.net.URLEncoder;
import java.net.URL;

import java.util.HashMap;
import java.util.Map;

import java.nio.charset.Charset;

import javax.net.ssl.HttpsURLConnection;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;


public class TwitchAPIv5 {

	private static final TwitchAPIv5 instance = new TwitchAPIv5();
	private final Map<String, Integer> userCache = new HashMap<>();
	private final String url = "https://api.twitch.tv/kraken/";
	private final int httpTimeout = 2 * 1000;
	private String clientID;
	private String oAuth;

	/*
	 * @function TwitchAPIv5
	 *
	 * @return {Object} instance
	 */
	public static TwitchAPIv5 instance() {
		return instance;
	}

	/*
	 * @function TwitchAPIv5
	 */
	private TwitchAPIv5() {
		Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
	}

	/*
	 * @function readAll
	 *
	 * @param  {Reader} rd
	 * @return {String} 
	 */
	private String readAll(Reader rd) throws IOException {
        StringBuilder sb = new StringBuilder();
        int cp;

        while ((cp = rd.read()) != -1) {
            sb.append((char) cp);
        }

        return sb.toString();
    }

	/*
	 * @function fillJSONObject
	 *
	 * @param {JSONObject} jsonObject
	 * @param {Boolean}    success
	 * @param {String}     type
	 * @param {String}     url
	 * @param {int}        responseCode
	 * @param {String}     exception
	 * @param {String}     exceptionMessage
	 * @param {String}     jsonContent
	 */
	private void fillJSONObject(JSONObject jsonObject, Boolean success, String type, String url, int responseCode, String exception, String exceptionMessage, String jsonContent) {
        jsonObject.put("_success", success);
        jsonObject.put("_type", type);
        jsonObject.put("_url", url);
        jsonObject.put("_http", responseCode);
        jsonObject.put("_exception", exception);
        jsonObject.put("_exceptionMessage", exceptionMessage);
        jsonObject.put("_content", jsonContent);
    }

	/*
	 * @function readFromUrl
	 *
	 * @param  {String} method
	 * @param  {String} endPoint
	 * @param  {String} content
	 * @return {JSONObject}
	 */
	private JSONObject readFromUrl(String method, String endPoint, String content) {
		JSONObject jsonObject = new JSONObject("{}");
		InputStream inputStream = null;
		HttpsURLConnection connection;
		String data = "";
		URL url;

		try {
			url = new URL(this.url + endPoint);
			connection = (HttpsURLConnection) url.openConnection();

			// Set the default properties.
			connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.52 Safari/537.36 PhantomBotJ/2015");
			connection.addRequestProperty("Accept", "application/vnd.twitchtv.v5+json");
			connection.addRequestProperty("Content-Type", "application/json");
			connection.setConnectTimeout(httpTimeout);
			connection.setRequestMethod(method);
			connection.setUseCaches(false);
           	
           	// The the client id. If the oAuth is not null Twitch will automatically resolve the client-id
			if (this.oAuth == null) {
				connection.addRequestProperty("Client-ID", this.clientID);
			} else {
				connection.addRequestProperty("Authorization", this.oAuth);
			}

			// Check if we are posting.
			if (content == null) {
				connection.setDoOutput(false);
			} else {
				connection.setDoOutput(true);
			}

			// Connect.
			connection.connect();

			// Write something if the content is not null.
			if (content != null) {
				byte[] bytes = content.getBytes("UTF-8");
				connection.getOutputStream().write(bytes);
			}

			// Check the response code.
			if (connection.getResponseCode() == 200) {
				inputStream = connection.getInputStream();
			} else {
				inputStream = connection.getErrorStream();
			}

			BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream, Charset.forName("UTF-8")));
			data = readAll(bufferedReader);
			jsonObject = new JSONObject(data);
			fillJSONObject(jsonObject, true, method, (this.url + endPoint), connection.getResponseCode(), "", "", data);
		} catch (JSONException ex) {
            fillJSONObject(jsonObject, false, method, (this.url + endPoint), 0, "JSONException", ex.getMessage(), data);
            com.gmt2001.Console.err.println("TwitchAPIv5::readFromUrl::Exception: " + ex.getMessage());
        } catch (UnsupportedEncodingException ex) {
            fillJSONObject(jsonObject, false, method, (this.url + endPoint), 0, "UnsupportedEncodingException", ex.getMessage(), data);
            com.gmt2001.Console.err.println("TwitchAPIv5::readFromUrl::Exception: " + ex.getMessage());
        } catch (NullPointerException ex) {
            fillJSONObject(jsonObject, false, method, (this.url + endPoint), 0, "NullPointerException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("TwitchAPIv5::readFromUrl::Exception: " + ex.getMessage());
        } catch (MalformedURLException ex) {
            fillJSONObject(jsonObject, false, method, (this.url + endPoint), 0, "MalformedURLException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("TwitchAPIv5::readFromUrl::Exception: " + ex.getMessage());
        } catch (SocketTimeoutException ex) {
            fillJSONObject(jsonObject, false, method, (this.url + endPoint), 0, "SocketTimeoutException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("TwitchAPIv5::readFromUrl::Exception: " + ex.getMessage());
        } catch (IOException ex) {
            fillJSONObject(jsonObject, false, method, (this.url + endPoint), 0, "IOException", ex.getMessage(), "");
            com.gmt2001.Console.err.println("TwitchAPIv5::readFromUrl::Exception: " + ex.getMessage());
        } catch (Exception ex) {
            fillJSONObject(jsonObject, false, method, (this.url + endPoint), 0, "Exception", ex.getMessage(), "");
            com.gmt2001.Console.err.println("TwitchAPIv5::readFromUrl::Exception: " + ex.getMessage());
        } finally {
            if (inputStream != null) {
                try {
                    inputStream.close();
                } catch (IOException ex) {
                    fillJSONObject(jsonObject, false, method, (this.url + endPoint), 0, "IOException", ex.getMessage(), "");
                    com.gmt2001.Console.err.println("TwitchAPIv5::readFromUrl::Exception: " + ex.getMessage());
                }
            }
        }
        
        return jsonObject;
	}

	/*
	 * @function setClientId
	 *
	 * @param {String} clientID
	 */
	public void setClientId(String clientID) {
		this.clientID = clientID;
	}

	/*
	 * @function setOAuth
	 *
	 * @param {String} oAuth
	 */
	public void setOAuth(String oAuth) {
		this.oAuth = ("OAuth " + oAuth.replace("oauth:", ""));
	}

	/*
	 * @function getChannel
	 *
	 * @param  {String} channel
	 * @return {JSONObject}
	 */
	public JSONObject getChannel(String channel) {
		return this.readFromUrl("GET", "channels/" + getUserId(channel), null);
	}

	/*
	 * @function getChannel
	 *
	 * @param  {int} channel
	 * @return {JSONObject}
	 */
	public JSONObject getChannel(int channel) {
		return this.readFromUrl("GET", "channels/" + channel, null);
	}

	/*
	 * @function getUsers
	 *
	 * @param  {String} username
	 * @return {JSONObject}
	 */
	public JSONObject getUsers(String username) {
		return this.readFromUrl("GET", "users/" + getUserId(username), null);
	}

	/*
	 * @function getUsers
	 *
	 * @param  {int} username
	 * @return {JSONObject}
	 */
	public JSONObject getUsers(int username) {
		return this.readFromUrl("GET", "users/" + username, null);
	}

	/*
	 * @function getUser
	 *
	 * @param  {String} username
	 * @return {JSONObject}
	 */
	public JSONObject getUser(String username) {
		return this.readFromUrl("GET", "users?login=" + username, null);
	}

	/*
	 * @function getUserId
	 *
	 * @param  {String} channel
	 * @return {int}
	 */
	public int getUserId(String channel) {
		if (userCache.containsKey(channel.toLowerCase())) {
			return userCache.get(channel.toLowerCase());
		} else {
			JSONObject jsonObject = getUser(channel);
			if (jsonObject.getInt("_total") != 0) {
				return cacheUserId(channel, Integer.parseInt(jsonObject.getJSONArray("users").getJSONObject(0).getString("_id")));
			}
			com.gmt2001.Console.err.println("TwitchAPIv5: Failed to get the channel id on channel: " + channel);
			return 0;
		}
	}

	/*
	 * @function cacheUserId
	 *
	 * @param  {String} username
	 * @param  {int} id
	 * @return {int}
	 */
	public int cacheUserId(String username, int id) {
		if (!userCache.containsKey(username.toLowerCase())) {
			userCache.put(username.toLowerCase(), id);
		}
		return id;
	}

	// TODO: add search.
	public JSONObject updateChannel(String channel, String status, String game) {
		JSONObject jsonObject = new JSONObject("{}");
		JSONObject jsonObj = new JSONObject("{}");

		jsonObject.put("status", status);
		jsonObject.put("game", game);
		
		jsonObj.put("channel", jsonObject);

		return this.readFromUrl("PUT", "channels/" + channel, jsonObj.toString());
	}
}
