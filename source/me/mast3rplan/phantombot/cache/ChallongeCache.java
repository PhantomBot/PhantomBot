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
package me.mast3rplan.phantombot.cache;

import com.gmt2001.UncaughtExceptionHandler;
import com.scaniatv.ChallongeAPI;
import com.google.common.collect.Maps;

import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.challonge.TournamentStartedEvent;
import me.mast3rplan.phantombot.event.challonge.TournamentEndedEvent;
import me.mast3rplan.phantombot.event.challonge.TournamentResetEvent;
import me.mast3rplan.phantombot.event.challonge.MatchEndedEvent;
import me.mast3rplan.phantombot.PhantomBot;

public class ChallongeCache implements Runnable {
	private static ChallongeCache challongeCache = null;
	private static final ChallongeAPI challongeAPI = ChallongeAPI.instance();
	private final Thread updateThread;
	private Map<String, Object> tournamentCache;
	private Map<String, Object> matchCache;
	private Map<String, Object> participantsCache;
	private Map<Object, String> participantsNameCache;
	private Boolean killed = false;

	/**
	 * @function instance
	 *
	 */
	public static ChallongeCache instance() {
		if (challongeCache == null) {
			challongeCache = new ChallongeCache();
		}

		return challongeCache;
	}

	/**
	 * @function ChallongeCache
	 *
	 */
	private ChallongeCache() {
		this.updateThread = new Thread(this);

		Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        updateThread.start();
	}

	/**
	 * @function run
	 *
	 */
	@Override
    @SuppressWarnings("SleepWhileInLoop")
	public void run() {
		try {
			Thread.sleep(30 * 1000);
		} catch (InterruptedException ex) {
            com.gmt2001.Console.debug.println("ChallongeCache.run: Failed to initial sleep: [InterruptedException] " + ex.getMessage());
		}

		while (!killed) {
			try {
				com.gmt2001.Console.out.println("updating challongeCache");
				this.updateCache();
			} catch (Exception ex) {
				com.gmt2001.Console.err.println("ChallongeCache::run: " + ex.getMessage());
			}

			try {
			    Thread.sleep(40 * 1000);
		    } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("ChallongeCache.run: Failed to sleep: [InterruptedException] " + ex.getMessage());
		    }
		}
	}

	/**
	 * @function updateCache
	 *
	 */
	private void updateCache() throws Exception {
		Map<String, Object> newCache = Maps.newHashMap();
		JSONObject jsonResults;
		JSONObject object;

		jsonResults = challongeAPI.getTournaments();

		if (jsonResults.getBoolean("_success")) {
            if (jsonResults.getInt("_http") == 200) {
            	object = jsonResults.getJSONArray("array").getJSONObject(0).getJSONObject("tournament");
            	for (String key : object.keySet()) {
            		newCache.put(key, object.get(key.toString()));
            	}
            	newCache.put("array", jsonResults.getJSONArray("array")); // Store the entire array for later if we need it in a loop.
            	this.tournamentCache = newCache;           	
            } else {
            	try {
                    throw new Exception("[HTTPErrorExecption] HTTP " + " " + jsonResults.getInt("_http") + ". req=" +
                                        jsonResults.getString("_type") + " " + jsonResults.getString("_url") + "   " +
                                        (jsonResults.has("message") && !jsonResults.isNull("message") ? "message=" +
                                         jsonResults.getString("message") : "content=" + jsonResults.getString("_content")));
                } catch (Exception ex) {
                	com.gmt2001.Console.err.println("ChallongeCache.updateCache: Failed to update cache: " + ex.getMessage());
                }
            }
        } else {
        	try {
                throw new Exception("[" + jsonResults.getString("_exception") + "] " + jsonResults.getString("_exceptionMessage"));
            } catch (Exception ex) {
                if (ex.getMessage().startsWith("[SocketTimeoutException]") || ex.getMessage().startsWith("[IOException]")) {
                    com.gmt2001.Console.debug.println("ChallongeCache.run: Failed to update cache: " + ex.getMessage());
                }
            }
        }

        if (challongeAPI.getTournamentId() == null) {
        	challongeAPI.setTournamentId(this.getTournamentValue("id"));
        }

        newCache = Maps.newHashMap();
        jsonResults = challongeAPI.getMatches();

		if (jsonResults.getBoolean("_success")) {
            if (jsonResults.getInt("_http") == 200) {
            	object = jsonResults.getJSONArray("array").getJSONObject(0).getJSONObject("match");
            	for (String key : object.keySet()) {
            		newCache.put(key, object.get(key.toString()));
            	}
            	newCache.put("array", jsonResults.getJSONArray("array")); // Store the entire array for later if we need it in a loop.
            	this.matchCache = newCache;
            } else {
            	try {
                    throw new Exception("[HTTPErrorExecption] HTTP " + " " + jsonResults.getInt("_http") + ". req=" +
                                        jsonResults.getString("_type") + " " + jsonResults.getString("_url") + "   " +
                                        (jsonResults.has("message") && !jsonResults.isNull("message") ? "message=" +
                                         jsonResults.getString("message") : "content=" + jsonResults.getString("_content")));
                } catch (Exception ex) {
                	com.gmt2001.Console.err.println("ChallongeCache.updateCache: Failed to update cache: " + ex.getMessage());
                }
            }
        } else {
        	try {
                throw new Exception("[" + jsonResults.getString("_exception") + "] " + jsonResults.getString("_exceptionMessage"));
            } catch (Exception ex) {
                if (ex.getMessage().startsWith("[SocketTimeoutException]") || ex.getMessage().startsWith("[IOException]")) {
                    com.gmt2001.Console.debug.println("ChallongeCache.run: Failed to update cache: " + ex.getMessage());
                }
            }
        }

        newCache = Maps.newHashMap();
        jsonResults = challongeAPI.getParticipants();

		if (jsonResults.getBoolean("_success")) {
            if (jsonResults.getInt("_http") == 200) {
            	object = jsonResults.getJSONArray("array").getJSONObject(0).getJSONObject("participant");
            	for (String key : object.keySet()) {
            		newCache.put(key, object.get(key.toString()));
            	}
            	
            	Map<Object, String> newCache1 = Maps.newHashMap();
            	JSONArray jsonArray = jsonResults.getJSONArray("array");
            	for (int i = 0; i < jsonArray.length(); i++) {
            		newCache1.put(jsonArray.getJSONObject(i).getJSONObject("participant").getInt("id"), jsonArray.getJSONObject(i).getJSONObject("participant").getString("username"));
            	}

            	newCache.put("array", jsonResults.getJSONArray("array")); // Store the entire array for later if we need it in a loop.
            	this.participantsCache = newCache;
            	this.participantsNameCache = newCache1;
            } else {
            	try {
                    throw new Exception("[HTTPErrorExecption] HTTP " + " " + jsonResults.getInt("_http") + ". req=" +
                                        jsonResults.getString("_type") + " " + jsonResults.getString("_url") + "   " +
                                        (jsonResults.has("message") && !jsonResults.isNull("message") ? "message=" +
                                         jsonResults.getString("message") : "content=" + jsonResults.getString("_content")));
                } catch (Exception ex) {
                	com.gmt2001.Console.err.println("ChallongeCache.updateCache: Failed to update cache: " + ex.getMessage());
                }
            }
        } else {
        	try {
                throw new Exception("[" + jsonResults.getString("_exception") + "] " + jsonResults.getString("_exceptionMessage"));
            } catch (Exception ex) {
                if (ex.getMessage().startsWith("[SocketTimeoutException]") || ex.getMessage().startsWith("[IOException]")) {
                    com.gmt2001.Console.debug.println("ChallongeCache.run: Failed to update cache: " + ex.getMessage());
                }
            }
        }

        // Check if a tournament is starting.
        if (tournamentCache.containsKey("state") && tournamentCache.get("state").equals("underway") && !PhantomBot.instance().getDataStore().exists("tournamentsPlayed", getTournamentValue("id"))) {
        	if (tournamentCache.containsKey("name") && tournamentCache.containsKey("game_name") && tournamentCache.containsKey("full_challonge_url")) {
        	    EventBus.instance().post(new TournamentStartedEvent(getTournamentValue("name"), getTournamentValue("game_name"), getTournamentValue("full_challonge_url")));
        	    PhantomBot.instance().getDataStore().set("tournamentsPlayed", getTournamentValue("id"), "true");
        	}
        }

        // Check if a tournament is done.
        if (tournamentCache.containsKey("state") && tournamentCache.get("state").equals("complete") && PhantomBot.instance().getDataStore().exists("tournamentsPlayed", getTournamentValue("id"))) {
        	if (tournamentCache.containsKey("name") && tournamentCache.containsKey("game_name") && tournamentCache.containsKey("full_challonge_url")) {
        	    EventBus.instance().post(new TournamentEndedEvent(getTournamentValue("name"), getTournamentValue("game_name"), getTournamentValue("full_challonge_url")));
        	}
        }

        // Check if a tournament has been reset.
        if (tournamentCache.containsKey("state") && tournamentCache.get("state").equals("pending") && PhantomBot.instance().getDataStore().exists("tournamentsPlayed", getTournamentValue("id"))) {
        	if (tournamentCache.containsKey("name") && tournamentCache.containsKey("game_name") && tournamentCache.containsKey("full_challonge_url")) {
        	    EventBus.instance().post(new TournamentResetEvent(getTournamentValue("name"), getTournamentValue("game_name"), getTournamentValue("full_challonge_url")));
        	    PhantomBot.instance().getDataStore().del("tournamentsPlayed", getTournamentValue("id"));
        	}
        }

        // Check if a match has ended.
        if (matchCache.containsKey("state") && matchCache.get("state").equals("complete") && !PhantomBot.instance().getDataStore().exists("playedMatches", getMatchValue("id"))) {
        	if (matchCache.containsKey("winner_id") && matchCache.containsKey("loser_id")) {
        	    EventBus.instance().post(new MatchEndedEvent(getPlayerNameById(getMatchValue("winner_id")), getPlayerNameById(getMatchValue("loser_id"))));
        	    PhantomBot.instance().getDataStore().set("playedMatches", getMatchValue("id"), "true");
        	}
        }
	}

	/**
     * @function getTournamentValue
     *
     * @return {String}
     */
    public String getTournamentValue(String jsonKey) {
    	if (tournamentCache.containsKey(jsonKey)) {
    		return (tournamentCache.get(jsonKey).toString() == "null" ? null : tournamentCache.get(jsonKey).toString());
    	} else {
    		return "";
    	}
    }

    /**
     * @function getMatchValue
     *
     * @return {String}
     */
    public String getMatchValue(String jsonKey) {
    	if (matchCache.containsKey(jsonKey)) {
            return (matchCache.get(jsonKey).toString() == "null" ? null : matchCache.get(jsonKey).toString());
    	} else {
    		return "";
    	}
    }

    /**
     * @function getParticipantsValue
     *
     * @return {String}
     */
    public String getParticipantsValue(String jsonKey) {
    	if (participantsCache.containsKey(jsonKey)) {
            return (participantsCache.get(jsonKey).toString() == "null" ? null : participantsCache.get(jsonKey).toString());
    	} else {
    		return "";
    	}
    }

    /**
     * @function getPlayerNameById
     *
     * @return {String}
     */
    public String getPlayerNameById(String id) {
    	if (participantsNameCache.containsKey(Integer.parseInt(id))) {
    		return participantsNameCache.get(Integer.parseInt(id)).toString();
    	} else {
    		return id;
    	}
    }

    /**
     * @function kill
     *
     */
    public void kill() {
        killed = true;
    }
}
