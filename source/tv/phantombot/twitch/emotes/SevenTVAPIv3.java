/* astyle --style=java --indent=spaces=4 */

/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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
package tv.phantombot.twitch.emotes;

import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.URIUtil;
import com.gmt2001.twitch.cache.ViewerCache;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/*
 * Communicates with the 7TV v3 API server.
 *
 * @author Radipiz
 */
public class SevenTVAPIv3 implements EmoteProvider {

    public static final String PROVIDER_NAME = "sevenTv";
    private static SevenTVAPIv3 instance;
    private static final String APIURL = "https://7tv.io/v3";

    public static synchronized EmoteProvider instance() {
        if (instance == null) {
            instance = new SevenTVAPIv3();
        }
        return instance;
    }

    private SevenTVAPIv3() {
    }

    private static HttpClientResponse readJsonFromUrl(String urlAddress) {
        return HttpClient.get(URIUtil.create(urlAddress));
    }

    private void checkResponseForError(HttpClientResponse response) throws EmoteApiRequestFailedException {
        if (response.hasException()) {
            throw new EmoteApiRequestFailedException(response.exception());
        } else if (!response.isSuccess()) {
            throw new EmoteApiRequestFailedException(response.responseBody());
        }
    }

    private List<EmoteEntry> mapEmotesFromData(JSONArray jsonArray) {
        return StreamSupport.stream(jsonArray.spliterator(), false)
                .map(data -> new EmoteEntry(((JSONObject) data).getString("id"), ((JSONObject) data).getString("name")))
                .collect(Collectors.toList());
    }

    @Override
    public List<EmoteEntry> getGlobalEmotes() throws EmoteApiRequestFailedException {
        HttpClientResponse response = readJsonFromUrl(APIURL + "/emote-sets/global");
        if (response.responseCode().code() == 404) {
            return Collections.emptyList();
        }
        checkResponseForError(response);
        try {
            JSONObject json = response.json();

            if (!json.has("emotes")) {
                return Collections.emptyList();
            }

            return mapEmotesFromData(json.getJSONArray("emotes"));
        } catch (Exception ex) {
            throw new EmoteApiRequestFailedException("Could not process returned json", ex);
        }
    }

    @Override
    public List<EmoteEntry> getLocalEmotes() throws EmoteApiRequestFailedException {
        HttpClientResponse response = readJsonFromUrl(APIURL + "/users/twitch/" + ViewerCache.instance().broadcaster().id());
        if (response.responseCode().code() == 404) {
            return Collections.emptyList();
        }
        checkResponseForError(response);
        try {
            JSONObject json = response.json();

            if (!json.has("emote_set") || json.isNull("emote_set") || !json.getJSONObject("emote_set").has("emotes") || json.getJSONObject("emote_set").isNull("emotes")) {
                return Collections.emptyList();
            }

            return mapEmotesFromData(json.getJSONObject("emote_set").getJSONArray("emotes"));
        } catch (Exception ex) {
            com.gmt2001.Console.debug.printStackTrace(ex);
            throw new EmoteApiRequestFailedException("Could not process returned json", ex);
        }
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }
}
