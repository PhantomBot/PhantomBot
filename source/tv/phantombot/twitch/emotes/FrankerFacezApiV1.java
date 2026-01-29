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

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/*
 * Communicates with the BetterTwitchTV v3 API server.
 *
 * @author IllusionaryOne
 * @author Radipiz
 */
public class FrankerFacezApiV1 implements EmoteProvider {

    public static final String PROVIDER_NAME = "ffz";
    private static FrankerFacezApiV1 instance;
    private static final String APIURL = "https://api.frankerfacez.com/v1";

    public static synchronized EmoteProvider instance() {
        if (instance == null) {
            instance = new FrankerFacezApiV1();
        }
        return instance;
    }

    private FrankerFacezApiV1() {
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
                .map(data -> new EmoteEntry(String.valueOf(((JSONObject) data).get("id")), ((JSONObject) data).getString("name")))
                .collect(Collectors.toList());
    }

    @Override
    public List<EmoteEntry> getGlobalEmotes() throws EmoteApiRequestFailedException {
        HttpClientResponse response = readJsonFromUrl(APIURL + "/set/global");
        checkResponseForError(response);
        try {
            // FrankerFaceZ can return multiple sets of global emotes
            // It announces the numeric ids in "default_sets". This id is used as key
            // in the key for the collection in "sets"
            // The following stream reduces the emotes of multiple sets into a single
            // List object containing EmoteEntry
            JSONObject responseData = response.json();
            return StreamSupport.stream(responseData.getJSONArray("default_sets").spliterator(), false)
                    .map(setId -> mapEmotesFromData(responseData.getJSONObject("sets")
                            .getJSONObject(String.valueOf(setId))
                            .getJSONArray("emoticons")))
                    .flatMap(Collection::stream)
                    .collect(Collectors.toList());

        } catch (Exception ex) {
            throw new EmoteApiRequestFailedException("Could not process returned json", ex);
        }
    }

    @Override
    public List<EmoteEntry> getSharedEmotes() throws EmoteApiRequestFailedException {
        HttpClientResponse response = readJsonFromUrl(APIURL + "/room/id/" + ViewerCache.instance().broadcaster().id());
        if (response.responseCode().code() == 404) {
            return Collections.emptyList();
        }
        checkResponseForError(response);
        try {
            String setId = String.valueOf(response.json().getJSONObject("room").get("set"));
            return mapEmotesFromData(response.json().getJSONObject("sets").getJSONObject(setId).getJSONArray("emoticons"));
        } catch (Exception ex) {
            throw new EmoteApiRequestFailedException("Could not process returned json", ex);
        }
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }
}
