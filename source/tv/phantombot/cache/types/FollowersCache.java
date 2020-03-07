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

import java.util.Calendar;
import java.util.Date;

import org.json.JSONArray;
import org.json.JSONObject;

import com.gmt2001.TwitchAPIv5;
import com.gmt2001.datastore.DataStore;

import tv.phantombot.PhantomBot;
import tv.phantombot.cache.Cache;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.twitch.follower.TwitchFollowEvent;
import tv.phantombot.event.twitch.follower.TwitchFollowsInitializedEvent;

public class FollowersCache extends Cache {

	private final String channelName;
	private Date timeoutExpire = new Date();
	private Date lastFail = new Date();
	private Boolean firstUpdate = true;
	private int numfail = 0;

	/*
	 * @function FollowersCache
	 *
	 * @param {String} channelName
	 */
	public FollowersCache(String channelName) {
		this.channelName = channelName;
	}

	@Override
	public long getStartDelay() {
		return 20 * 1000;
	}

	@Override
	public long getPeriodDelay() {
		return 30 * 1000;
	}

	@Override
	public void run() {
		try {
			try {
				if (new Date().after(timeoutExpire)) {
					updateCache();
				}
			} catch (Exception ex) {
				checkLastFail();
				com.gmt2001.Console.debug.println("FollowersCache.run: Failed to update followers: " + ex.getMessage());
			}
		} catch (Exception ex) {
			com.gmt2001.Console.err.println("FollowersCache.run: Failed to update followers ["
					+ ex.getClass().getSimpleName() + "]: " + ex.getMessage());
		}
	}

	/*
	 * @function updateCache
	 */
	private void updateCache() throws Exception {
		com.gmt2001.Console.debug.println("FollowersCache::updateCache");

		JSONObject jsonObject = TwitchAPIv5.instance().GetChannelFollows(this.channelName, 100, 0, false);
		DataStore datastore = PhantomBot.instance().getDataStore();

		if (jsonObject.getBoolean("_success")) {
			if (jsonObject.getInt("_http") == 200) {
				JSONArray jsonArray = jsonObject.getJSONArray("follows");

				for (int i = 0; i < jsonArray.length(); i++) {
					String follower = jsonArray.getJSONObject(i).getJSONObject("user").getString("name").toLowerCase();

					if (!datastore.exists("followed", follower)) {
						EventBus.post(new TwitchFollowEvent(follower));
						datastore.set("followed", follower, "true");
					}
				}
			} else {
				throw new Exception("[HTTPErrorException] HTTP " + jsonObject.getInt("_http") + " "
						+ jsonObject.getString("error") + ". req=" + jsonObject.getString("_type") + " "
						+ jsonObject.getString("_url") + " " + jsonObject.getString("_post") + "  "
						+ (jsonObject.has("message") && !jsonObject.isNull("message")
								? "message=" + jsonObject.getString("message")
								: "content=" + jsonObject.getString("_content")));
			}
		} else {
			throw new Exception(
					"[" + jsonObject.getString("_exception") + "] " + jsonObject.getString("_exceptionMessage"));
		}

		if (this.isRunning() && firstUpdate) {
			firstUpdate = false;
			EventBus.post(new TwitchFollowsInitializedEvent());
		}
	}

	/*
	 * @function checkLastFail
	 */
	private void checkLastFail() {
		Calendar cal = Calendar.getInstance();
		numfail = (lastFail.after(new Date()) ? numfail + 1 : 1);

		cal.add(Calendar.MINUTE, 1);
		lastFail = cal.getTime();

		if (numfail > 5) {
			timeoutExpire = cal.getTime();
		}
	}
}
