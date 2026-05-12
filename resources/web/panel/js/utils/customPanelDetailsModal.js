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

/* global helpers, $ */

/**
 * Custom-panel **details modal**. Read-only info dialog opened by the
 * {@code fa-info-circle} button next to a card's toggle/cog. Renders
 * {@code detailsModal.content} as sanitized HTML — anything outside the
 * allowlist of tags / safe href schemes is unwrapped (keeping the inner
 * text) or stripped. Plain-text content passes through unchanged because
 * the sanitizer leaves text nodes alone.
 *
 * <p>Registers itself as {@code window.__pbCustomPanel__.openDetailsModal} so the cards file
 * can dispatch the open via the shared namespace without a hard import order. Includes a
 * client-side HTML sanitizer ({@link sanitizeDetailsModalHtml}) — kept here even though
 * manifest content is author-trusted because we render it with {@code .html()} and don't
 * want a malformed manifest to inject scripts via copy-pasted markup.</p>
 *
 * @author mcawful
 */
(function () {
    var ns = window.__pbCustomPanel__ = window.__pbCustomPanel__ || {};

    /**
     * Allowed tags for {@code detailsModal.content}. Everything else is unwrapped (its text
     * and any whitelisted descendants are kept); {@code <a>} keeps only safe {@code href}
     * values.
     *
     * @type {Object<string, boolean>}
     */
    var PB_DETAILS_HTML_TAGS = {
        P: true, BR: true, STRONG: true, B: true, EM: true, I: true, U: true, S: true,
        H4: true, H5: true, H6: true, UL: true, OL: true, LI: true,
        A: true, CODE: true, PRE: true, BLOCKQUOTE: true, DIV: true, SPAN: true, HR: true
    };

    /**
     * Validates and normalizes an {@code <a href>} attribute. Allowed schemes:
     * {@code http(s)://}, {@code mailto:}, fragment-only ({@code #anchor-id}). Everything
     * else (including {@code javascript:}, {@code data:}, {@code vbscript:}, relative paths)
     * returns the empty string so the caller drops the attribute.
     *
     * @param {string} href raw attribute value
     * @returns {string} safe href or empty string
     */
    function sanitizeDetailsHref(href) {
        if (!href || typeof href !== 'string') {
            return '';
        }
        var h = href.trim();
        if (h.length === 0) {
            return '';
        }
        var lower = h.toLowerCase();
        if (lower.indexOf('javascript:') === 0 || lower.indexOf('data:') === 0 || lower.indexOf('vbscript:') === 0) {
            return '';
        }
        if (/^https?:\/\//i.test(h)) {
            return h;
        }
        if (/^mailto:/i.test(h)) {
            return h;
        }
        if (h.charAt(0) === '#' && /^#[\w\-:.]+$/.test(h)) {
            return h;
        }
        return '';
    }

    /**
     * Whitelist-based HTML sanitizer for {@code detailsModal.content}. Walks the parsed DOM
     * in reverse-document order, unwrapping disallowed tags (preserves their text content)
     * and stripping every attribute except a sanitized {@code href} on {@code <a>}.
     * {@code <a>} tags are forced to {@code rel="noopener noreferrer" target="_blank"}.
     *
     * @param {string} html untrusted HTML string
     * @returns {string} sanitized HTML
     */
    function sanitizeDetailsModalHtml(html) {
        var container = document.createElement('div');
        container.innerHTML = html;
        var all = container.querySelectorAll('*');
        var i;
        for (i = all.length - 1; i >= 0; i--) {
            var el = all[i];
            var tag = el.tagName.toUpperCase();
            if (!PB_DETAILS_HTML_TAGS[tag]) {
                while (el.firstChild) {
                    el.parentNode.insertBefore(el.firstChild, el);
                }
                el.parentNode.removeChild(el);
                continue;
            }
            var attrs = el.attributes;
            var hRef = '';
            if (tag === 'A') {
                hRef = sanitizeDetailsHref(el.getAttribute('href') || '');
            }
            while (attrs.length > 0) {
                el.removeAttribute(attrs[0].name);
            }
            if (tag === 'A') {
                if (!hRef) {
                    while (el.firstChild) {
                        el.parentNode.insertBefore(el.firstChild, el);
                    }
                    el.parentNode.removeChild(el);
                    continue;
                }
                el.setAttribute('href', hRef);
                el.setAttribute('rel', 'noopener noreferrer');
                el.setAttribute('target', '_blank');
            }
        }
        return container.innerHTML;
    }

    /**
     * Opens a read-only modal with {@code detailsModal.content}, rendered as sanitized HTML
     * (allowlist tags / safe hrefs only). Plain text passes through unchanged since the
     * sanitizer leaves text nodes alone — authors can mix prose and small bits of markup
     * freely. No-op if the modal helper is unavailable or the card has no usable content.
     *
     * @param {object} card canonical manifest card with {@code detailsModal}
     */
    ns.openDetailsModal = function (card) {
        var dm = card && card.detailsModal;
        if (!dm || typeof dm.content !== 'string' || !dm.content.trim()) {
            return;
        }
        if (typeof helpers === 'undefined' || typeof helpers.getModal !== 'function') {
            return;
        }

        var modalId = 'pb-custom-card-details-' + card.id;
        var modalTitle = (typeof dm.title === 'string' && dm.title.trim()) ? dm.title.trim() : 'Details';
        var $body = $('<div/>', {'class': 'pb-custom-details-modal-body'})
            .css({'word-break': 'break-word', 'white-space': 'normal'})
            .html(sanitizeDetailsModalHtml(dm.content));

        helpers.getModal(modalId, modalTitle, null, $body, undefined, {
            canceltext: 'Close',
            cancelclass: 'btn-primary'
        }).modal('toggle');
    };
}());
