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

/**
 * Passkey (WebAuthn) helpers shared by the panel and /panel/login
 *
 * The bot exchanges all binary values as base64url strings
 */
(function () {
    /**
     * Decodes a base64url string
     *
     * @param {String} value The base64url string
     * @returns {Uint8Array} The decoded bytes
     */
    function decode(value) {
        return Uint8Array.from(window.atob(value.replace(/-/g, '+').replace(/_/g, '/')), function (c) {
            return c.charCodeAt(0);
        });
    }

    /**
     * Encodes bytes as a base64url string without padding
     *
     * @param {ArrayBuffer} buffer The bytes
     * @returns {String} The base64url string
     */
    function encode(buffer) {
        let binary = '';

        new Uint8Array(buffer).forEach(function (b) {
            binary += String.fromCharCode(b);
        });

        return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    /**
     * Turns the error of a failed passkey prompt into a message for the user
     *
     * @param {Error} e The error
     * @returns {Error} An error with a readable message
     */
    function describe(e) {
        if (e.name === 'NotAllowedError') {
            return new Error('The passkey prompt was canceled or timed out');
        } else if (e.name === 'InvalidStateError') {
            return new Error('This device already has a passkey for this user');
        } else if (e.name === 'SecurityError') {
            return new Error('Passkeys can not be used on this address. A valid HTTPS certificate or http://localhost is required');
        }

        return e;
    }

    window.passkey = {
        /**
         * Checks if passkeys can be used on this page
         *
         * Browsers require a secure context and a hostname, not an IP address
         *
         * @returns {Boolean} true if passkeys can be used
         */
        isSupported: function () {
            return window.isSecureContext === true && window.PublicKeyCredential !== undefined
                    && window.AuthenticatorAttestationResponse !== undefined
                    && typeof window.AuthenticatorAttestationResponse.prototype.getPublicKey === 'function'
                    && typeof window.AuthenticatorAttestationResponse.prototype.getAuthenticatorData === 'function'
                    && window.location.hostname.match(/^[0-9.]+$|:/) === null;
        },

        /**
         * Asks the browser to create a new passkey
         *
         * @param {Object} options The registration options sent by the bot
         * @returns {Promise<Object>} The values to send back to the bot
         */
        create: function (options) {
            options.challenge = decode(options.challenge);
            options.user.id = decode(options.user.id);
            options.excludeCredentials.forEach(function (credential) {
                credential.id = decode(credential.id);
            });

            return navigator.credentials.create({publicKey: options}).then(function (credential) {
                let publicKey = credential.response.getPublicKey();

                if (publicKey === null) {
                    throw new Error('This passkey uses a key type that is not supported');
                }

                return {
                    id: encode(credential.rawId),
                    clientDataJSON: encode(credential.response.clientDataJSON),
                    authenticatorData: encode(credential.response.getAuthenticatorData()),
                    publicKey: encode(publicKey)
                };
            }, function (e) {
                throw describe(e);
            });
        },

        /**
         * Asks the browser to sign in with an existing passkey
         *
         * @param {Object} options The sign-in options sent by the bot
         * @returns {Promise<Object>} The values to send back to the bot
         */
        get: function (options) {
            options.challenge = decode(options.challenge);

            return navigator.credentials.get({publicKey: options}).then(function (credential) {
                return {
                    id: encode(credential.rawId),
                    clientDataJSON: encode(credential.response.clientDataJSON),
                    authenticatorData: encode(credential.response.authenticatorData),
                    signature: encode(credential.response.signature)
                };
            }, function (e) {
                throw describe(e);
            });
        }
    };
})();
