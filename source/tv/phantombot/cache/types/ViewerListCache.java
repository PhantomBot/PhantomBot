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

package tv.phantombot.cache.types;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import com.gmt2001.TwitchAPIv5;

import tv.phantombot.cache.Cache;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.irc.channel.IrcChannelUsersUpdateEvent;

public class ViewerListCache extends Cache {

	private final String channelName;

	private List<String> cache = new ArrayList<String>();

	/**
	 * Class constructor.
	 *
	 * @param {String} channelName
	 */
	public ViewerListCache(String channelName) {
		this.channelName = channelName;
	}

	@Override
	public long getStartDelay() {
		return 0;
	}

	@Override
	public long getPeriodDelay() {
		return 600 * 1000;
	}

	@Override
	public void run() {
		try {
			this.updateCache();
		} catch (Exception ex) {
			com.gmt2001.Console.err.println("ViewerListCache::run: " + ex.getMessage());
		}
	}

	/**
	 * Method that updates the cache.
	 */
	private void updateCache() throws Exception {
		String[] types = new String[] { "moderators", "staff", "admins", "vips", "viewers" };
		List<String> cache = new ArrayList<>();
		List<String> joins = new ArrayList<>();
		List<String> parts = new ArrayList<>();

		com.gmt2001.Console.debug.println("ViewerListCache::updateCache");
		try {
			JSONObject object = TwitchAPIv5.instance().GetChatUsers(channelName);
			JSONObject chatters;

			if (object.getBoolean("_success") && object.getInt("_http") == 200) {
				if (object.getInt("chatter_count") == 0) {
					this.cache = cache;
					return;
				}

				// Add the new chatters to a new cache.
				chatters = object.getJSONObject("chatters");
				for (String type : types) {
					JSONArray array = chatters.getJSONArray(type);
					for (int i = 0; i < array.length(); i++) {
						cache.add(array.getString(i));
					}
				}

				// Check for new users that joined.
				for (int i = 0; i < cache.size(); i++) {
					if (!this.cache.contains(cache.get(i))) {
						joins.add(cache.get(i));
					}
				}

				// Check for old users that left.
				for (int i = 0; i < this.cache.size(); i++) {
					if (!cache.contains(this.cache.get(i))) {
						parts.add(this.cache.get(i));
					}
				}

				EventBus.post(new IrcChannelUsersUpdateEvent(joins.toArray(new String[joins.size()]),
						parts.toArray(new String[parts.size()])));
				// Set the new cache.
				this.cache = cache;
				// Delete the temp caches.
				cache = null;
				parts = null;
				joins = null;
				// Run the GC to clear memory,
				System.gc();
			} else {
				com.gmt2001.Console.debug.println("Failed to update viewers cache: " + object);
			}
		} catch (Exception ex) {
			com.gmt2001.Console.debug.println("ViewerListCache::updateCache: Failed to update: " + ex.getMessage());
		}
	}

	/**
	 * Method to check if a user is in the cache.
	 *
	 * @param {String} username
	 * @return {Boolean}
	 */
	public boolean hasUser(String username) {
		return (!this.cache.isEmpty() ? this.cache.contains(username) : true);
	}

	/**
	 * Method to add users to the cache.
	 *
	 * @param {String} username
	 */
	public void addUser(String username) {
		this.cache.add(username);
	}
}
