/*
 * Copyright (C) 2016-2017 phantombot.tv
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

import com.gmt2001.TwitchAPIv5;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONObject;
import org.json.JSONArray;

import tv.phantombot.PhantomBot;

// https://api.twitch.tv/v5/streams?channel=32896646,36769016&client_id=7wpchwtqz7pvivc3qbdn1kajz42tdmb
public class TwitchChannelCache implements Runnable {
	private static TwitchChannelCache twitchChannelCache = null;
	private final Thread thread;
	private boolean killed;
	private Map<String, JSONObject> cache = new HashMap<>();
	private Map<String, String> users = new HashMap<>();
	
	/*
	 * Method to start and return this instance.
	 *
	 * @return {TwitchChannelCache}
	 */
	public static TwitchChannelCache instance() {
		if (twitchChannelCache == null) {
			twitchChannelCache = new TwitchChannelCache();
		}
		return twitchChannelCache;
	}

	/*
	 * Class constructor.
	 */
	private TwitchChannelCache() {
		Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

		this.killed = false;

		this.thread = new Thread(this, "tv.phantombot.discord.cache.TwitchChannelCache");
		this.thread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
		this.thread.start();
	}

	/*
	 * New thread for this cache.
	 */
	@Override
    @SuppressWarnings("SleepWhileInLoop")
	public void run() {
		while (!killed) {
			// Sleep every 60 seconds.
			try {
				Thread.sleep(60 * 1000);
			} catch (InterruptedException ex) {
				com.gmt2001.Console.debug.println("TwitchChannelCache::run: Failed to sleep [InterruptedException] " + ex.getMessage());
			}

			// Try to update this cache.
			try {
				this.updateCache();
			} catch (Exception ex) {
				com.gmt2001.Console.err.println("TwitchChannelCache::run: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
			}
		}
	}

	/*
	 * Method that updates the cache information.
	 */
	private void updateCache() {
		Map<String, JSONObject> newCache = new HashMap<>();
		String[] channels = getChannels();

		com.gmt2001.Console.debug.println("TwitchChannelCache::updateCache");

		try {
			// Make sure there's a channel set before we call.
			if (channels.length == 0) {
				return;
			}

			// Get the streams.
			JSONObject object = TwitchAPIv5.instance().GetStreams(String.join(",", channels));
			JSONArray streams;

			// Make sure the call was made.
			if (object.getBoolean("_success") && object.getInt("_http") == 200) {
				// Make sure a channel is live.
				if (object.getInt("_total") == 0) {
					// Reset the cache.
					this.cache = newCache;
					return;
				}
	
				// Get the streams array.
				streams = object.getJSONArray("streams");
	
				for (int i = 0; i < streams.length(); i++) {
					JSONObject obj = streams.getJSONObject(i);

					// The channel's real name and not the display name.
					String channel = obj.getJSONObject("channel").getString("name");
					
					// Make sure the channel is live and it's not a vodcast or playlist.
					if (obj.getString("stream_type").equals("live")) {
						if (!cache.containsKey(channel)) {
							// Send live event.
						}
						newCache.put(channel, obj);
					}
				}
	
				// Set the new cache.
				this.cache = newCache;
			} else {
				// Just print the object in debug mode.
				com.gmt2001.Console.debug.println("Failed to update TwitchChannelCache cache. " + object);
			}
		} catch (Exception ex) {
			com.gmt2001.Console.err.println("Failed update TwitchChannelCache cache. [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
		}
	}

	/*
	 * Method to get all channels ids
	 *
	 * @return {Array}
	 */
	private String[] getChannels() {
		String[] channelNames = PhantomBot.instance().getDataStore().GetKeyList("discordLiveChannels", "");
		Map<String, String> newCache = new HashMap<>();
		Collection<String> values;
		JSONObject object;
		JSONArray users;

		try {
			// Loop through all channels. This isn't the best logic, but it will work for now.
			for (String channel : channelNames) {
				// If one channels is not in the cache, call the api to get all ids.
				if (!this.users.containsKey(channel)) {
					object = TwitchAPIv5.instance().GetUser(String.join(",", channelNames));
					newCache = new HashMap<>();
	
					// Make sure the call was successful .
					if (object.getBoolean("_success") && object.getInt("_http") == 200) {
						users = object.getJSONArray("users");
	
						for (int i = 0; i < users.length(); i++) {
							JSONObject user = users.getJSONObject(i);
	
							// Put the user in the cache.
							newCache.put(user.getString("name"), user.getString("_id"));
						}
					} else {
						com.gmt2001.Console.debug.println("Failed to get channel ids. " + object);
					}
					break;
				} else {
					newCache.put(channel, this.users.get(channel));
				}
			}
		} catch (Exception ex) {
			com.gmt2001.Console.err.println("Failed to get channel ids: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
		}

		// Set the new users cache.
		this.users = newCache;
		// Get all the values.
		values = this.users.values();

		return values.toArray(new String[values.size()]);
	}

	/*
	 * Method to get the title of a channel that is from the cache.
	 *
	 * @param  {String} channelName
	 * @return {String}
	 */
	public String getTitle(String channelName) {
		if (cache.containsKey(channelName)) {
			return cache.get(channelName).getJSONObject("channel").getString("status");
		}
		return null;
	}

	/*
	 * Method to get the game of a channel that is from the cache.
	 *
	 * @param  {String} channelName
	 * @return {String}
	 */
	public String getGame(String channelName) {
		if (cache.containsKey(channelName)) {
			return cache.get(channelName).getString("game");
		}
		return null;
	}

	/*
	 * Method to get the current time the stream was created at from the cache.
	 *
	 * @param  {String} channelName
	 * @return {String}
	 */
	public String getCreatedAt(String channelName) {
		if (cache.containsKey(channelName)) {
			return cache.get(channelName).getString("created_at");
		}
		return null;
	}

	/*
	 * Method to get the channel's logo from the cache.
	 *
	 * @param  {String} channelName
	 * @return {String}
	 */
	public String getLogo(String channelName) {
		if (cache.containsKey(channelName)) {
			return cache.get(channelName).getJSONObject("channel").getString("logo");
		}
		return null;
	}

	/*
	 * Method to get the channel's preview from the cache. sizes: small, medium, and large.
	 *
	 * @param  {String} channelName
	 * @param  {String} size
	 * @return {String}
	 */
	public String getPreview(String channelName, String size) {
		if (cache.containsKey(channelName)) {
			return cache.get(channelName).getJSONObject("preview").getString(size);
		}
		return null;
	}

	/*
	 * Method to get the channel's preview from the cache.
	 *
	 * @param  {String} channelName
	 * @return {String}
	 */
	public String getPreview(String channelName) {
		return getPreview(channelName, "medium");
	}

	/*
	 * Method to get the channel's display name in the cache.
	 *
	 * @param  {String} channelName
	 * @return {String}
	 */
	public String getDisplayName(String channelName) {
		if (cache.containsKey(channelName)) {
			return cache.get(channelName).getJSONObject("channel").getString("display_name");
		}
		return null;
	}

	/*
	 * Method to get the current amount of viewers of a channel that is in the cache.
	 *
	 * @param  {String} channelName
	 * @return {Number}
	 */
	public int getViewers(String channelName) {
		if (cache.containsKey(channelName)) {
			return cache.get(channelName).getInt("viewers");
		}
		return 0;
	}

	/*
	 * Method to check if a channel is live from the cache.
	 *
	 * @param  {String} channelName
	 * @return {Boolean}
	 */
	public boolean isLive(String channelName) {
		return cache.containsKey(channelName);
	}

	/*
	 * Method to kill this cache.
	 */
	public void kill() {
		this.cache = null;
		this.killed = true;
		this.twitchChannelCache = null;
	}
}
