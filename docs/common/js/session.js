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


(function () {
    window.updateCookie = function() {
        document.cookie = window.sessionStorage.getItem('cookie');
    };
    window.updateCookie();

    document.onvisibilitychange = (event) => {
        if (document.visibilityState === 'hidden') {
            if (window.localStorage.getItem('webauth') && window.localStorage.getItem('bothostname') && window.localStorage.getItem('botport')) {
                if (window.localStorage.getItem('remember') === null || (window.localStorage.getItem('expires') && window.localStorage.getItem('expires') <= Date.now())) {
                    window.localStorage.removeItem('webauth');
                    window.sessionStorage.removeItem('webauth');
                    window.localStorage.removeItem('remember');
                    window.localStorage.removeItem('expires');
                    window.localStorage.removeItem('b64');
                    window.sessionStorage.removeItem('cookie');
                }
            }
        } else {
            window.updateCookie();
        }
    };

    if ($ !== undefined && $ !== null && $.ajax !== undefined && $.ajax !== null) {
        let ajax = $.ajax;
        $.ajax = function(url, options) {
            window.updateCookie();
            ajax(url, options);
        };
    }
})();