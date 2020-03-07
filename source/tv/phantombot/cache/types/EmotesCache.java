/* astyle --style=java --indent=spaces=4 --mode=java */

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

import org.json.JSONException;
import org.json.JSONObject;

import com.illusionaryone.BTTVAPIv2;
import com.illusionaryone.FrankerZAPIv1;

import tv.phantombot.cache.Cache;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.emotes.EmotesGetEvent;

public class EmotesCache extends Cache {

	private final String channel;
	private Date timeoutExpire = new Date();
	private Date lastFail = new Date();
	private int numfail = 0;

	public EmotesCache(String channel) {
		this.channel = channel.startsWith("#") ? channel.substring(1) : channel;
	}

	@Override
	public long getStartDelay() {
		return 0 * 1000;
	}

	@Override
	public long getPeriodDelay() {
		return 60 * 60 * 1000;
	}

	@Override
	public void run() {
		try {
			try {
				if (new Date().after(timeoutExpire)) {
					this.updateCache();
				}
			} catch (Exception ex) {
				checkLastFail();
				com.gmt2001.Console.debug.println("EmotesCache.run: Failed to update emotes: " + ex.getMessage());
			}
		} catch (Exception ex) {
			com.gmt2001.Console.err.logStackTrace(ex);
		}
	}

	private void checkLastFail() {
		Calendar cal = Calendar.getInstance();
		numfail = (lastFail.after(new Date()) ? numfail + 1 : 1);

		cal.add(Calendar.MINUTE, 1);
		lastFail = cal.getTime();

		if (numfail > 5) {
			timeoutExpire = cal.getTime();
		}
	}

	private boolean checkJSONExceptions(JSONObject jsonResult, boolean ignore404, String emoteType)
			throws JSONException {

		if (jsonResult.getBoolean("_success")) {
			if (jsonResult.getInt("_http") == 200) {
				return true;
			} else if (jsonResult.getInt("_http") == 404 && ignore404) {
				return true;
			} else if (jsonResult.getInt("_http") != 404 || (jsonResult.getInt("_http") == 404 && !ignore404)) {
				try {
					throw new Exception("[HTTPErrorExecption] HTTP " + " " + jsonResult.getInt("_http") + ". req="
							+ jsonResult.getString("_type") + " " + jsonResult.getString("_url") + "   "
							+ (jsonResult.has("message") && !jsonResult.isNull("message")
									? "message=" + jsonResult.getString("message")
									: "content=" + jsonResult.getString("_content"))
							+ "Emotes Type=" + emoteType);
				} catch (Exception ex) {
					com.gmt2001.Console.debug.println(
							"EmotesCache.updateCache: Failed to update emotes (" + emoteType + "): " + ex.getMessage());
				}
			}
		} else {
			try {
				throw new Exception("[" + jsonResult.getString("_exception") + "] "
						+ jsonResult.getString("_exceptionMessage") + "Emotes Type=" + emoteType);
			} catch (Exception ex) {
				if (ex.getMessage().startsWith("[SocketTimeoutException]")
						|| ex.getMessage().startsWith("[IOException]")) {
					checkLastFail();
					com.gmt2001.Console.debug.println(
							"EmotesCache.updateCache: Failed to update emotes (" + emoteType + "): " + ex.getMessage());
				}
			}
		}
		return false;
	}

	private void updateCache() throws Exception {
		JSONObject twitchJsonResult = null;
		JSONObject bttvJsonResult = null;
		JSONObject bttvLocalJsonResult = null;
		JSONObject ffzJsonResult = null;
		JSONObject ffzLocalJsonResult = null;

		com.gmt2001.Console.debug.println("Polling Emotes from BTTV and FFZ");

		/**
		 * @info Don't need this anymore since we use the IRCv3 tags for Twitch emotes.
		 *       twitchJsonResult = TwitchAPIv5.instance().GetEmotes(); if
		 *       (!checkJSONExceptions(twitchJsonResult, false, "Twitch")) {
		 *       com.gmt2001.Console.err.println("Failed to get Twitch Emotes"); return;
		 *       }
		 */

		/**
		 * @info and why you don't remove it then?
		 */

		bttvJsonResult = BTTVAPIv2.instance().GetGlobalEmotes();
		if (!checkJSONExceptions(bttvJsonResult, true, "Global BTTV")) {
			com.gmt2001.Console.err.println("Failed to get BTTV Emotes");
			return;
		}

		bttvLocalJsonResult = BTTVAPIv2.instance().GetLocalEmotes(this.channel);
		if (!checkJSONExceptions(bttvLocalJsonResult, true, "Local BTTV")) {
			com.gmt2001.Console.err.println("Failed to get BTTV Local Emotes");
			return;
		}

		ffzJsonResult = FrankerZAPIv1.instance().GetGlobalEmotes();
		if (!checkJSONExceptions(ffzJsonResult, true, "Global FrankerZ")) {
			com.gmt2001.Console.err.println("Failed to get FFZ Emotes");
			return;
		}

		ffzLocalJsonResult = FrankerZAPIv1.instance().GetLocalEmotes(this.channel);
		if (!checkJSONExceptions(ffzLocalJsonResult, true, "Local FrankerZ")) {
			com.gmt2001.Console.err.println("Failed to get FFZ Local Emotes");
			return;
		}

		com.gmt2001.Console.debug.println("Pushing Emote JSON Objects to EventBus");
		EventBus.post(new EmotesGetEvent(twitchJsonResult, bttvJsonResult, bttvLocalJsonResult, ffzJsonResult,
				ffzLocalJsonResult));
		System.gc();

		/* Set these to null to save memory */
		twitchJsonResult = null;
		bttvJsonResult = null;
		bttvLocalJsonResult = null;
		ffzJsonResult = null;
		ffzLocalJsonResult = null;
	}
}
