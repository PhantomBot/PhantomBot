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

/*
 * @author illusionaryone
 */

package tv.phantombot.cache.types;

import java.util.ArrayList;
import java.util.List;

import com.illusionaryone.BitlyAPIv4;
import com.illusionaryone.TwitterAPI;

import tv.phantombot.PhantomBot;
import tv.phantombot.cache.Cache;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.twitter.TwitterEvent;
import tv.phantombot.event.twitter.TwitterRetweetEvent;
import twitter4j.Status;

/**
 * TwitterCache Class
 *
 * This class is responsible for calling the Twitter API within specified
 * amounts of time, taking that data and updating the local database with
 * certain information and passing information on the event bus to trigger
 * events in chat.
 */
public class TwitterCache extends Cache {

	@Override
	public long getStartDelay() {
		return 20 * 1000;
	}

	@Override
	public long getPeriodDelay() {
		return 15 * 1000;
	}

	/**
	 * Thread run instance. This is the main loop for the thread that is created to
	 * manage retrieving data from the Twitter API. This loop runs every 15 seconds,
	 * calling the method to update data from Twitter. That method checks against
	 * limits.
	 */
	@Override
	public void run() {
		try {
			this.updateCache();
		} catch (Exception ex) {
			com.gmt2001.Console.err.println("TwitterCache::run: " + ex.getMessage());
		}
	}

	/**
	 * Polls the Twitter API and updates the database cache with information. This
	 * method also sends events to chat when appropriate.
	 */
	private void updateCache() throws Exception {

		Boolean poll_retweets = false;
		Boolean poll_mentions = false;
		Boolean poll_hometimeline = false;
		Boolean poll_usertimeline = false;
		Boolean reward_retweets = false;

		long presentTime = 0L;
		long last_retweetTime = 0L;
		long last_retweetRewardTime = 0L;
		long last_mentionsTime = 0L;
		long last_hometimelineTime = 0L;
		long last_usertimelineTime = 0L;

		long delay_mentions = 0L;
		long delay_retweets = 0L;
		long delay_hometimeline = 0L;
		long delay_usertimeline = 0L;

		com.gmt2001.Console.debug.println("TwitterCache::updateCache");

		/* Check DB for what data should be polled. */
		poll_retweets = getDBBoolean("poll_retweets");
		poll_mentions = getDBBoolean("poll_mentions");
		poll_hometimeline = getDBBoolean("poll_hometimeline");
		poll_usertimeline = getDBBoolean("poll_usertimeline");
		reward_retweets = getDBBoolean("reward_toggle");

		/* If nothing to poll, then time to leave. */
		if (!reward_retweets && !poll_retweets && !poll_mentions && !poll_hometimeline && !poll_usertimeline) {
			return;
		}

		/* If polling the home timeline, do not poll anything else. */
		if (poll_hometimeline) {
			poll_retweets = false;
			poll_mentions = false;
			poll_usertimeline = false;
		}

		/* Check DB for the last poll times. */
		last_retweetTime = getDBLong("lastpoll_retweets", poll_retweets, 0L);
		last_retweetRewardTime = getDBLong("lastpoll_retweets_reward", reward_retweets, 0L);
		last_mentionsTime = getDBLong("lastpoll_mentions", poll_mentions, 0L);
		last_hometimelineTime = getDBLong("lastpoll_hometimeline", poll_hometimeline, 0L);
		last_usertimelineTime = getDBLong("lastpoll_usertimeline", poll_usertimeline, 0L);

		/*
		 * Check DB for the poll delay times. Note that minimum polling times are
		 * enforced here.
		 */
		delay_retweets = getDBLong("polldelay_retweets", poll_retweets, 60L);
		delay_mentions = getDBLong("polldelay_mentions", poll_mentions, 60L);
		delay_hometimeline = getDBLong("polldelay_hometimeline", poll_hometimeline, 60L);
		delay_usertimeline = getDBLong("polldelay_usertimeline", poll_usertimeline, 15L);

		/* Handle each type of data from the Twitter API. */
		presentTime = System.currentTimeMillis() / 1000L;
		if (poll_retweets) {
			handleRetweets(last_retweetTime, delay_retweets, presentTime);
		}
		if (reward_retweets) {
			handleRetweetRewards(last_retweetRewardTime, presentTime);
		}
		if (poll_mentions) {
			handleMentions(last_mentionsTime, delay_mentions, presentTime);
		}
		if (poll_hometimeline) {
			handleHomeTimeline(last_hometimelineTime, delay_hometimeline, presentTime);
		}
		if (poll_usertimeline) {
			handleUserTimeline(last_usertimelineTime, delay_usertimeline, presentTime);
		}
	}

	/**
	 * Handles retweets with the Twitter API.
	 *
	 * @param long The last time this API was polled.
	 * @param long The delay to occur between polls.
	 * @param long The present time stamp in seconds.
	 */
	private void handleRetweets(long lastTime, long delay, long presentTime) {
		if (presentTime - lastTime < delay) {
			return;
		}
		updateDBLong("lastpoll_retweets", presentTime);

		long lastID = getDBLong("lastid_retweets", true, 0L);
		List<Status> statuses = TwitterAPI.instance().getRetweetsOfMe(lastID);

		if (statuses == null) {
			return;
		}

		long twitterID = statuses.get(0).getId();

		/* Poll latest retweet. */
		String tweet = "[RT] " + statuses.get(0).getText() + " ["
				+ BitlyAPIv4.instance().getShortURL(TwitterAPI.instance().getTwitterURLFromId(twitterID)) + "]";
		updateDBString("last_retweets", tweet);
		EventBus.post(new TwitterEvent(tweet));

		/* Update DB with the last Tweet ID processed. */
		updateDBLong("lastid_retweets", twitterID);
	}

	/**
	 * Handles retweet rewards with the Twitter API. Due to the getRetweets() API
	 * call only allowing 75 calls in 15 minutes, this call will run only once every
	 * five minutes and is not configurable in the bot. Since we pull all retweets
	 * every 5 minutes, and that can return a maximum of 20; this means that we will
	 * reach 60 calls maximum in 15 minutes, which is below the threshold.
	 *
	 * @param long The last time this API was polled.
	 * @param long The present time stamp in seconds.
	 */
	private void handleRetweetRewards(long lastTime, long presentTime) {
		if (presentTime - lastTime < 300) {
			return;
		}
		updateDBLong("lastpoll_retweets_reward", presentTime);

		long lastID = getDBLong("lastid_retweets_reward", true, 0L);
		List<Status> statuses = TwitterAPI.instance().getRetweetsOfMe(lastID);

		if (statuses == null) {
			return;
		}

		/*
		 * This seems redundant but, Twitter provides the Tweet content of the Retweets
		 * in the getRetweetsOfMe() call. So, walk that list of Tweets to get at the
		 * Retweet information that includes the Screen Name (@screenName) of the person
		 * that performed the Retweet.
		 */
		ArrayList<String> userNameList = new ArrayList<String>();
		for (Status status : statuses) {
			List<Status> retweetStatuses = TwitterAPI.instance().getRetweets(status.getId());
			if (retweetStatuses != null) {
				for (Status retweetStatus : retweetStatuses) {
					userNameList.add(retweetStatus.getUser().getScreenName());
				}
			}
		}

		if (!userNameList.isEmpty()) {
			EventBus.post(new TwitterRetweetEvent(userNameList.toArray(new String[userNameList.size()])));
		}

		/* Update DB with the last Tweet ID processed. */
		long twitterID = statuses.get(0).getId();
		updateDBLong("lastid_retweets_reward", twitterID);
	}

	/**
	 * Handles mentions with the Twitter API.
	 *
	 * @param long The last time this API was polled.
	 * @param long The delay to occur between polls.
	 * @param long The present time stamp in seconds.
	 */
	private void handleMentions(long lastTime, long delay, long presentTime) {
		if (presentTime - lastTime < delay) {
			return;
		}
		updateDBLong("lastpoll_mentions", presentTime);

		long lastID = getDBLong("lastid_mentions", true, 0L);
		List<Status> statuses = TwitterAPI.instance().getMentions(lastID);

		if (statuses == null) {
			return;
		}

		long twitterID = statuses.get(0).getId();
		String tweet = statuses.get(0).getText() + " ["
				+ BitlyAPIv4.instance().getShortURL(TwitterAPI.instance().getTwitterURLFromId(twitterID)) + "]";
		String name = statuses.get(0).getUser().getScreenName();

		updateDBLong("lastid_mentions", twitterID);
		updateDBString("last_mentions", tweet);
		EventBus.post(new TwitterEvent(tweet, name));
	}

	/**
	 * Handles the home timeline with the Twitter API.
	 *
	 * @param long The last time this API was polled.
	 * @param long The delay to occur between polls.
	 * @param long The present time stamp in seconds.
	 */
	private void handleHomeTimeline(long lastTime, long delay, long presentTime) {
		if (presentTime - lastTime < delay) {
			return;
		}
		updateDBLong("lastpoll_hometimeline", presentTime);

		long lastID = getDBLong("lastid_hometimeline", true, 0L);
		List<Status> statuses = TwitterAPI.instance().getHomeTimeline(lastID);

		if (statuses == null) {
			return;
		}

		long twitterID = statuses.get(0).getId();
		String tweet = statuses.get(0).getText() + " ["
				+ BitlyAPIv4.instance().getShortURL(TwitterAPI.instance().getTwitterURLFromId(twitterID)) + "]";

		updateDBLong("lastid_hometimeline", twitterID);
		updateDBString("last_hometimeline", tweet);
		EventBus.post(new TwitterEvent(tweet));
	}

	/**
	 * Handles the user timeline with the Twitter API.
	 *
	 * @param long The last time this API was polled.
	 * @param long The delay to occur between polls.
	 * @param long The present time stamp in seconds.
	 */
	private void handleUserTimeline(long lastTime, long delay, long presentTime) {
		if (presentTime - lastTime < delay) {
			return;
		}
		updateDBLong("lastpoll_usertimeline", presentTime);

		long lastID = getDBLong("lastid_usertimeline", true, 0L);
		List<Status> statuses = TwitterAPI.instance().getUserTimeline(lastID);

		if (statuses == null) {
			return;
		}

		long twitterID = statuses.get(0).getId();
		String tweet = statuses.get(0).getText() + " ["
				+ BitlyAPIv4.instance().getShortURL(TwitterAPI.instance().getTwitterURLFromId(twitterID)) + "]";

		updateDBLong("lastid_usertimeline", twitterID);
		updateDBString("last_usertimeline", tweet);
		EventBus.post(new TwitterEvent(tweet));
	}

	/**
	 * Checks the database for a boolean string and returns true/false as such.
	 *
	 * @param String Database key to inspect.
	 * @return Boolean True if database value is stored as 'true' else false.
	 */
	private Boolean getDBBoolean(String dbKey) {
		String dbData = PhantomBot.instance().getDataStore().GetString("twitter", "", dbKey);
		if (dbData == null) {
			return false;
		} else if (dbData.equals("true")) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Checks the database for data and returns a long.
	 *
	 * @param String  Database key to inspect.
	 * @param Boolean Determines if polling is active or not.
	 * @return long 0 if not polling; defaultVal if no value in database; defaultVal
	 *         if database value is less than defaultVal; else database value.
	 */
	private long getDBLong(String dbKey, Boolean doPoll, long defaultVal) {
		if (!doPoll) {
			return 0L;
		}

		String dbData = PhantomBot.instance().getDataStore().GetString("twitter", "", dbKey);
		if (dbData == null) {
			return defaultVal;
		} else {
			if (Long.parseLong(dbData) < defaultVal) {
				return defaultVal;
			}
			return Long.parseLong(dbData);
		}
	}

	/**
	 * Places a long into the database.
	 *
	 * @param String Database key to insert into.
	 * @param long   Value to update into the database.
	 */
	private void updateDBLong(String dbKey, long dbValue) {
		PhantomBot.instance().getDataStore().SetString("twitter", "", dbKey, Long.toString(dbValue));
	}

	/**
	 * Places a string into the database.
	 *
	 * @param String Database key to insert into.
	 * @param String Value to update into the database.
	 */
	private void updateDBString(String dbKey, String dbValue) {
		PhantomBot.instance().getDataStore().SetString("twitter", "", dbKey, dbValue);
	}
}
