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

package tv.phantombot.cache;

import com.gmt2001.TwitchAPIv5;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONObject;
import org.json.JSONArray;

import tv.phantombot.event.irc.channel.IrcChannelJoinEvent;
import tv.phantombot.event.irc.channel.IrcChannelLeaveEvent;
import tv.phantombot.event.EventBus;

public class ViewerListCache implements Runnable {
	private static ViewerListCache instance = null;
	private final String channelName;
	private final Thread thread;
	private List<String> cache = new ArrayList<>();
	private boolean isKilled = false;

	/*
	 * Method to get this instance.
	 *
	 * @param  {String} channelName
	 * @return {Object}
	 */
	public static ViewerListCache instance(String channelName) {
		if (instance == null) {
			instance = new ViewerListCache(channelName);
		}

		return instance;
	}

	/*
	 * Class constructor.
	 *
	 * @param  {String} channelName
	 */
	private ViewerListCache(String channelName) {
		Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

		this.channelName = channelName;

		this.thread = new Thread(this, "tv.phantombot.cache.ViewerListCache");
		this.thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
		this.thread.start();
	}

	/*
	 * Method that updates the cache every 5 minutes.
	 */
	@Override
	@SuppressWarnings("SleepWhileInLoop")
	public void run() {
		while (!isKilled) {
			try {
                try {
                    this.updateCache();
                } catch (Exception ex) {
                    com.gmt2001.Console.debug.println("ViewerListCache::run: " + ex.getMessage());
                }
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("ViewerListCache::run: " + ex.getMessage());
            }
			
			try {
                Thread.sleep(600 * 1000);
            } catch (InterruptedException ex) {
            	com.gmt2001.Console.err.println("ViewerListCache::run: Failed to execute sleep [InterruptedException]: " + ex.getMessage());
            }
		}
	}

	/*
	 * Method that updates the cache.
	 */
	@SuppressWarnings("unchecked")
	private void updateCache() throws Exception {
		String[] types = new String[] { "moderators", "staff", "admins", "global_mods", "viewers" };
		List<String> cache = new ArrayList<>();
		EventBus bus = EventBus.instance();

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
						bus.postAsync(new IrcChannelJoinEvent(cache.get(i)));
						com.gmt2001.Console.debug.println("User Joined Channel [" + cache.get(i) + "#" + channelName + "]");
					}
				}

				// Check for old users that left.
				for (int i = 0; i < this.cache.size(); i++) {
					if (!cache.contains(this.cache.get(i))) {
						bus.postAsync(new IrcChannelLeaveEvent(this.cache.get(i)));
						com.gmt2001.Console.debug.println("User Left Channel [" + this.cache.get(i) + "#" + channelName + "]");
					}
				}

				// Set the new cache.
				this.cache = cache;
			} else {
				com.gmt2001.Console.debug.println("Failed to update viewers cache: " + object);
			}
		} catch (Exception ex) {
			com.gmt2001.Console.debug.println("ViewerListCache::updateCache: Failed to update: " + ex.getMessage());
		}
	}

	/*
	 * Method to check if a user is in the cache.
	 *
	 * @param  {String} username
	 * @return {Boolean}
	 */
	public boolean hasUser(String username) {
		return (!this.cache.isEmpty() ? this.cache.contains(username) : true);
	}

	/*
	 * Method to add users to the cache.
	 *
	 * @param  {String} username
	 */
	public void addUser(String username) {
		this.cache.add(username);
	}

	/*
	 * Method to kill this cache.
	 */
	public void kill() {
		this.isKilled = true;
	}
}
