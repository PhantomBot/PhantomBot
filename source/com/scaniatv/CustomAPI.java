// This class is made to be used in the scripts to call APIs. It will make it way more simple with $.customAPI
package com.scaniatv;

import com.gmt2001.HttpRequest;
import com.gmt2001.HttpResponse;

import java.util.HashMap;

import org.json.JSONObject;
import org.json.JSONException;

public class CustomAPI {
	private static final CustomAPI instance = new CustomAPI();

	/*
	 * @function instance
	 *
	 * @return {Object}
	 */
	public static CustomAPI instance() {
		return instance;
	}

	/*
	 * @function CustomAPI
	 */
	private CustomAPI() {
		Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
	}

	/*
	 * @function getJSON
	 *
	 * @param  {String} url
	 * @return {JSONObject}
	 */
	public JSONObject getJSON(String url) {
		try {
			HttpResponse data = HttpRequest.getData(HttpRequest.RequestType.GET, url, "", new HashMap<>());
			if (data.success) {
				return new JSONObject(data.content);
			} else {
				throw new JSONException(data.httpCode + ": " + data.exception);
			}
		} catch (JSONException ex) {
			com.gmt2001.Console.err.println("Failed to get JSON data from API: " + ex.getMessage());
		}
		return new JSONObject("{}");
	}

	/*
	 * @function get
	 *
	 * @param  {String} url
	 * @return {HttpResponse}
	 */
	public HttpResponse get(String url) {
		return HttpRequest.getData(HttpRequest.RequestType.GET, url, "", new HashMap<>());
	}

	/*
	 * @function post
	 *
	 * @param  {String} url
	 * @param  {String} content
	 * @return {HttpResponse}
	 */
	public HttpResponse post(String url, String content) {
		return HttpRequest.getData(HttpRequest.RequestType.POST, url, content, new HashMap<>());
	}

	/*
	 * @function put
	 *
	 * @param  {String} url
	 * @param  {String} content
	 * @return {HttpResponse}
	 */
	public HttpResponse put(String url, String content) {
		return HttpRequest.getData(HttpRequest.RequestType.PUT, url, content, new HashMap<>());
	}

	/*
	 * @function del
	 *
	 * @param  {String} url
	 * @param  {String} content
	 * @return {HttpResponse}
	 */
	public HttpResponse del(String url, String content) {
		return HttpRequest.getData(HttpRequest.RequestType.DELETE, url, content, new HashMap<>());
	}
}
