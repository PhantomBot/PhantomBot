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

/* global Packages */

(function () {
    let HttpClient = Packages.com.gmt2001.httpclient.HttpClient,
            HttpMethod = Packages.io.netty.handler.codec.http.HttpMethod,
            URIUtil = Packages.com.gmt2001.httpclient.URIUtil,
            JavaString = Packages.java.lang.String;

    /*
     * @function request
     *
     * Sends an HTTP request. No headers are added except the User-Agent and Content-Length that HttpClient fills
     * in, and Content-Length when a User-Agent is given.
     *
     * @param {string} method the HTTP method, such as GET, POST, PUT, PATCH, or DELETE
     * @param {string} url the URL to request
     * @param {object} headers the request headers, as name: value; null for none
     * @param {string} body the request body; null for none
     * @returns {object} {status, body, success, exception}: status is 0 and exception is the Java exception if
     * there was no response; success is true for a status from 1 to 399
     * @throws if the request cannot be built, such as for a URL that cannot be parsed or an invalid header
     */
    function request(method, url, headers, body) {
        let uri = URIUtil.create(String(url)),
                requestHeaders = HttpClient.createHeaders(),
                response;

        // The error does not repeat the url, which may contain a secret (URIUtil has already logged it)
        if (uri === null) {
            throw new Error('the url could not be parsed');
        }

        if (headers !== undefined && headers !== null) {
            for (let name in headers) {
                if (Object.prototype.hasOwnProperty.call(headers, name)) {
                    // Named, so that a null value reaches Netty instead of matching several overloads
                    requestHeaders['set(java.lang.String,java.lang.Object)'](name, headers[name] === null || headers[name] === undefined ? null : String(headers[name]));
                }
            }
        }

        body = body === undefined || body === null ? null : String(body);

        // HttpClient sets this itself only when there is no User-Agent header
        if (requestHeaders.contains('user-agent') && !requestHeaders.contains('content-length')) {
            requestHeaders.set('content-length', String(body === null ? 0 : new JavaString(body).getBytes('UTF-8').length));
        }

        response = HttpClient.request(HttpMethod.valueOf(String(method).toUpperCase()), uri, requestHeaders, body);

        if (response.hasException()) {
            return {status: 0, body: '', success: false, exception: response.exception()};
        }

        let status = response.responseCode().code();

        return {
            status: status,
            body: $.jsString(response.responseBody()),
            success: status > 0 && status < 400,
            exception: null
        };
    }

    /*
     * @deprecated
     *
     * Sends a request the way CustomAPI.java did through HttpRequest.getData, and returns the same
     * com.gmt2001.HttpResponse.
     *
     * @param {string} type GET, POST, PUT, or DELETE
     * @param {string} url
     * @param {string} post the request body
     * @param {boolean} hasAccept true to send the Accept header
     * @param {string} accept the value of the Accept header
     * @returns {com.gmt2001.HttpResponse}
     */
    function legacyRequest(type, url, post, hasAccept, accept) {
        let uri = URIUtil.create(url),
                headers = new Packages.java.util.HashMap(),
                sendHeaders = {},
                r = new Packages.com.gmt2001.HttpResponse(),
                result;

        if (hasAccept) {
            headers.put('accept', accept);
        }

        // As in HttpRequest.getData, a url that cannot be parsed throws here
        r.url = uri.toASCIIString();
        r.headers = headers;
        // Looked up here, so that $.api.request does not depend on the deprecated classes
        r.type = Packages.com.gmt2001.HttpRequest.RequestType.valueOf(type);
        r.post = post;

        try {
            if (type === 'POST' || type === 'PUT') {
                sendHeaders['content-type'] = 'application/x-www-form-urlencoded';
            }

            if (hasAccept) {
                sendHeaders['accept'] = accept;
            }

            if (uri.getUserInfo() !== null && !new JavaString(uri.getUserInfo()).isBlank()) {
                sendHeaders['Authorization'] = 'Basic ' + new JavaString(new Packages.org.apache.commons.codec.binary.Base64().encode(new JavaString(uri.getUserInfo()).getBytes()));
            }

            result = request(type, url, sendHeaders, post);
        } catch (ex) {
            if (!(ex.javaException instanceof Packages.java.lang.Exception)) {
                throw ex;
            }

            Packages.com.gmt2001.Console.err.printStackTrace(ex.javaException);
            result = {exception: ex.javaException};
        }

        if (result.exception !== null) {
            r.success = false;
            r.exception = result.exception.getClass().getSimpleName() + ': ' + result.exception.getMessage();
            r.rawException = result.exception;
            r.httpCode = 0;
        } else {
            r.content = result.body;
            r.httpCode = result.status;
            r.success = result.success;
        }

        return r;
    }

    /*
     * @deprecated
     *
     * @param {string} url
     * @returns {org.json.JSONObject} the response; an empty object if the request failed or the response was not a JSON object
     */
    function legacyGetJSON(url) {
        let data = legacyRequest('GET', url, '', false),
                ex;

        if (data.success) {
            try {
                return new Packages.org.json.JSONObject(data.content);
            } catch (e) {
                if (!(e.javaException instanceof Packages.org.json.JSONException)) {
                    throw e;
                }

                ex = e.javaException;
            }
        } else {
            ex = new Packages.org.json.JSONException(data.httpCode + ': ' + data.exception);
        }

        Packages.com.gmt2001.Console.err.printStackTrace(ex);
        return new Packages.org.json.JSONObject('{}');
    }

    $.api = {
        request: request
    };

    // Arguments reach the Java methods as Rhino passed them: undefined becomes the text 'undefined'
    let legacyArg = function (value) {
        return value === null ? null : String(value);
    };

    // The methods of the removed $.customAPI Java object, sent through $.api
    $.customAPI = { // @deprecated export
        getJSON: legacyGetJSON,
        get: function (url, accept) {
            return legacyRequest('GET', url, '', arguments.length > 1, legacyArg(accept));
        },
        post: function (url, content) {
            return legacyRequest('POST', url, legacyArg(content), false);
        },
        put: function (url, content) {
            return legacyRequest('PUT', url, legacyArg(content), false);
        },
        del: function (url, content) {
            return legacyRequest('DELETE', url, legacyArg(content), false);
        }
    };
})();
