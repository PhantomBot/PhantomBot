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

/**
 * Global session management for pages which use /panel/login to login the user
 *
 * NOTE: This MUST be loaded AFTER jQuery to enable the automatic Ajax hook
 */
(function () {
    /**
     * Logs out the user completely, including from the current session
     *
     * Does NOT redirect the user off the page
     */
    window.logoutCookie = function() {
        window.localStorage.removeItem('webauth');
        window.localStorage.removeItem('remember');
        window.localStorage.removeItem('isStable');
        window.localStorage.removeItem('expires');
        window.localStorage.removeItem('b64');
        window.sessionStorage.removeItem('webauth');
        window.sessionStorage.removeItem('cookie');
        document.cookie = 'panellogin=' + (window.location.protocol === 'https:' ? '; Secure' : '') + '; SameSite=Lax; Path=/; Max-Age=1'
    };

    /**
     * Checks if the session should be expired
     *
     * If session is expired, clears localStorage, but allows sessionStorage to continue so the user session is uninterrupted
     */
    window.checkExpireCookie = function() {
        if (window.localStorage.getItem('remember') !== 'session' && window.localStorage.getItem('remember') !== 'forever' && window.localStorage.getItem('expires') && window.localStorage.getItem('expires') <= Date.now()) {
            window.localStorage.removeItem('webauth');
            window.localStorage.removeItem('remember');
            window.localStorage.removeItem('isStable');
            window.localStorage.removeItem('expires');
            window.localStorage.removeItem('b64');
        }
    };

    /**
     * Updates/restores the cookie to extend its lifetime
     *
     * Calls {@link checkExpireCookie} first to expire localStorage if needed
     */
    window.updateCookie = function() {
        window.checkExpireCookie();
        document.cookie = window.sessionStorage.getItem('cookie');
    };

    window.updateCookie();

    /**
     * Updates the cookie on page hidden/visible
     *
     * @param {*} event The event object
     */
    document.onvisibilitychange = (event) => {
        if (document.visibilityState === 'hidden') {
            window.checkExpireCookie();
        } else {
            window.updateCookie();
        }
    };

    /**
     * Overrides jQuery $.ajax to call {@link updateCookie} before submitting
     */
    if ($ !== undefined && $ !== null && $.ajax !== undefined && $.ajax !== null) {
        let ajax = $.ajax;
        $.ajax = function(url, options) {
            window.updateCookie();
            ajax(url, options);
        };
    }
})();