/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
// This class is made to be used in the scripts to call APIs. It will make it way more simple with $.customAPI
package com.scaniatv;

import com.gmt2001.HttpRequest;
import com.gmt2001.HttpResponse;
import java.util.HashMap;
import org.json.JSONException;
import org.json.JSONObject;

public class CustomAPI {

    private static CustomAPI instance;

    /*
     * Method to the this instance.
     *
     * @return
     */
    public static synchronized CustomAPI instance() {
        if (instance == null) {
            instance = new CustomAPI();
        }

        return instance;
    }

    /*
     * Class constructor.
     */
    private CustomAPI() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    /*
     * Method to get a JSON Object from an API.
     *
     * @param  {String} url
     * @return
     */
    public JSONObject getJSON(String url) throws JSONException {
        try {
            HttpResponse data = HttpRequest.getData(HttpRequest.RequestType.GET, url, "", new HashMap<>());
            if (data.success) {
                return new JSONObject(data.content);
            } else {
                throw new JSONException(data.httpCode + ": " + data.exception);
            }
        } catch (JSONException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        return new JSONObject("{}");
    }

    /*
     * Method to get data from an API.
     *
     * @param  {String} url
     * @return
     */
    public HttpResponse get(String url) {
        return HttpRequest.getData(HttpRequest.RequestType.GET, url, "", new HashMap<>());
    }

    /*
     * Method to post to an API.
     *
     * @param  {String} url
     * @param  {String} content
     * @return
     */
    public HttpResponse post(String url, String content) {
        return HttpRequest.getData(HttpRequest.RequestType.POST, url, content, new HashMap<>());
    }

    /*
     * Method to put to an API.
     *
     * @param  {String} url
     * @param  {String} content
     * @return
     */
    public HttpResponse put(String url, String content) {
        return HttpRequest.getData(HttpRequest.RequestType.PUT, url, content, new HashMap<>());
    }

    /*
     * Method to delete on an API.
     *
     * @param  {String} url
     * @param  {String} content
     * @return
     */
    public HttpResponse del(String url, String content) {
        return HttpRequest.getData(HttpRequest.RequestType.DELETE, url, content, new HashMap<>());
    }
}
