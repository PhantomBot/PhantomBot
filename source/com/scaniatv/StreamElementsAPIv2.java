/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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

import java.net.URISyntaxException;

import org.json.JSONObject;

import com.gmt2001.HttpRequest;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.URIUtil;

import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import tv.phantombot.CaselessProperties;

/*
 * @author ScaniaTV
 */
public class StreamElementsAPIv2 {

    private static final StreamElementsAPIv2 instance = new StreamElementsAPIv2();
    private static final String URL = "https://api.streamelements.com/kappa/v2";

    /*
     * Returns the current instance.
     */
    public static synchronized StreamElementsAPIv2 instance() {
        return instance;
    }

    /*
     * Builds the instance for this class.
     */
    private StreamElementsAPIv2() {
    }

    /*
     * Reads data from an API. In this case its tipeeestream.
     */
    @SuppressWarnings("UseSpecificCatch")
    private static JSONObject readJsonFromUrl(String endpoint) throws URISyntaxException {
        JSONObject jsonResult = new JSONObject("{}");
        HttpHeaders headers = HttpClient.createHeaders(HttpMethod.GET, true);
        headers.add(HttpHeaderNames.AUTHORIZATION, "Bearer " + getJWT());
        HttpClientResponse response = HttpClient.get(URIUtil.create(URL + endpoint), headers);

        if (response.hasJson()) {
            jsonResult = response.json();
            HttpRequest.generateJSONObject(jsonResult, true, "GET", "", endpoint, response.responseCode().code(), null, null);
        } else {
            jsonResult.put("error", response.responseBody());
            HttpRequest.generateJSONObject(jsonResult, true, "GET", "", endpoint, response.responseCode().code(), null, null);
        }

        return jsonResult;
    }

    /**
     * @botproperty streamelementsjwt - The JWT token for retrieving donations from StreamElements
     * @botpropertycatsort streamelementsjwt 20 210 StreamElements
     */
    private static String getJWT() {
        return CaselessProperties.instance().getProperty("streamelementsjwt", "");
    }

    public static boolean hasJWT() {
        return !getJWT().isBlank();
    }

    /**
     * @botproperty streamelementsid - The user id for retrieving donations from StreamElements
     * @botpropertycatsort streamelementsid 10 210 StreamElements
     */
    private static String getID() {
        return CaselessProperties.instance().getProperty("streamelementsid", "");
    }

    /**
     * @botproperty streamelementslimit - The maximum number of donations to pull from StreamElements when updating. Default `5`
     * @botpropertycatsort streamelementslimit 30 210 StreamElements
     */
    private static int getLimit() {
        return CaselessProperties.instance().getPropertyAsInt("streamelementslimit", 5);
    }

    /*
     * Pulls the 5 last donations from the API.
     *
     * @return  The last 5 donations from the api.
     */
    public JSONObject GetDonations() throws URISyntaxException {
        return readJsonFromUrl("/tips/" + getID()+ "?limit=" + getLimit());
    }
}
