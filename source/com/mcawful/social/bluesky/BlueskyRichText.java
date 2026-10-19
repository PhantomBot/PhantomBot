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
package com.mcawful.social.bluesky;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Prepares the text of a Bluesky post: finds links, mentions and hashtags, and measures and shortens the text
 * <p>
 * Bluesky does not turn text into links by itself; each link, mention and hashtag needs a facet giving its position in UTF-8
 * bytes. Links are shortened in the visible text, with the full address kept in the facet, as the Bluesky app does.
 *
 * @author mcawful
 */
final class BlueskyRichText {

    /**
     * Appended to text that was shortened
     */
    static final String ELLIPSIS = "…";
    private static final Pattern GRAPHEME = Pattern.compile("\\X");
    private static final Pattern LINK = Pattern.compile("https?://\\S+", Pattern.CASE_INSENSITIVE);
    private static final Pattern MENTION = Pattern.compile("(^|[\\s(])@((?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)");
    private static final Pattern TAG = Pattern.compile("(^|\\s)[#＃]([^\\s#＃]+)");
    private static final Pattern TRAILING_PUNCTUATION = Pattern.compile("\\p{P}+$");
    private static final String LINK_TRAILING_PUNCTUATION = ".,;:!?\"'";
    private static final int MAX_LINK_DISPLAY = 30;
    private static final int MAX_TAG_LENGTH = 64;
    private static final int MAX_WORD_BREAK_DISTANCE = 40;

    /**
     * A link, mention or hashtag in the text
     *
     * @param byteStart the position of its first byte in the UTF-8 text
     * @param byteEnd the position after its last byte in the UTF-8 text
     * @param kind {@code link}, {@code mention} or {@code tag}
     * @param value the full address of a link, the lowercase handle of a mention, or the tag without its {@code #}
     */
    record Facet(int byteStart, int byteEnd, String kind, String value) {
    }

    /**
     * The prepared text
     *
     * @param text the text to post
     * @param facets the links, mentions and hashtags in it
     * @param graphemes the length of the text in characters as a reader sees them
     * @param bytes the length of the text in UTF-8 bytes
     */
    record RichText(String text, List<Facet> facets, int graphemes, int bytes) {
    }

    private record Span(int start, int end, String kind, String value) {

        boolean overlaps(int otherStart, int otherEnd) {
            return otherStart < this.end && this.start < otherEnd;
        }
    }

    private BlueskyRichText() {
    }

    /**
     * Prepares the text of a post
     *
     * @param input the text as written
     * @param maxGraphemes the longest allowed text, in graphemes
     * @param maxBytes the longest allowed text, in UTF-8 bytes
     * @param truncate if {@code true}, text that is too long is cut at a word and ends with an ellipsis; otherwise it is left as
     * is, and the caller checks {@link RichText#graphemes()}
     * @return the prepared text
     */
    static RichText build(String input, int maxGraphemes, int maxBytes, boolean truncate) {
        List<Span> spans = new ArrayList<>();
        String text = shortenLinks(input.replace("\r\n", "\n").replace('\r', '\n').strip(), spans);
        List<Span> links = List.copyOf(spans);

        Matcher matcher = MENTION.matcher(text);
        while (matcher.find()) {
            addSpan(spans, links, matcher.start(2) - 1, matcher.end(2), "mention", matcher.group(2).toLowerCase());
        }

        matcher = TAG.matcher(text);
        while (matcher.find()) {
            String tag = TRAILING_PUNCTUATION.matcher(matcher.group(2)).replaceFirst("");

            if (!tag.isEmpty() && !tag.chars().allMatch(Character::isDigit) && tag.codePointCount(0, tag.length()) <= MAX_TAG_LENGTH) {
                addSpan(spans, links, matcher.start(2) - 1, matcher.start(2) + tag.length(), "tag", tag);
            }
        }

        if (truncate && (countGraphemes(text) > maxGraphemes || utf8Length(text) > maxBytes)) {
            text = cut(text, maxGraphemes - 1, maxBytes - utf8Length(ELLIPSIS));
            int length = text.length();
            spans.removeIf(span -> span.end() > length);
            text += ELLIPSIS;
        }

        List<Facet> facets = new ArrayList<>();
        for (Span span : spans) {
            facets.add(new Facet(utf8Length(text.substring(0, span.start())), utf8Length(text.substring(0, span.end())), span.kind(), span.value()));
        }

        facets.sort(Comparator.comparingInt(Facet::byteStart));

        return new RichText(text, facets, countGraphemes(text), utf8Length(text));
    }

    /**
     * Replaces each link with a shorter form and records its position
     */
    private static String shortenLinks(String text, List<Span> spans) {
        StringBuilder sb = new StringBuilder();
        Matcher matcher = LINK.matcher(text);
        int last = 0;

        while (matcher.find()) {
            String uri = trimLink(matcher.group());
            String display = uri.replaceFirst("(?i)^https?://", "").replaceFirst("(?i)^www\\.", "");

            if (display.length() > MAX_LINK_DISPLAY) {
                display = display.substring(0, MAX_LINK_DISPLAY - 3) + "...";
            }

            sb.append(text, last, matcher.start());
            spans.add(new Span(sb.length(), sb.length() + display.length(), "link", uri));
            sb.append(display);
            last = matcher.start() + uri.length();
        }

        return sb.append(text.substring(last)).toString();
    }

    /**
     * Removes punctuation that ends a sentence rather than the link, and a closing parenthesis that has no opening one
     */
    private static String trimLink(String uri) {
        while (!uri.isEmpty()) {
            char c = uri.charAt(uri.length() - 1);

            if (LINK_TRAILING_PUNCTUATION.indexOf(c) >= 0
                    || (c == ')' && uri.chars().filter(ch -> ch == '(').count() < uri.chars().filter(ch -> ch == ')').count())) {
                uri = uri.substring(0, uri.length() - 1);
            } else {
                break;
            }
        }

        return uri;
    }

    private static void addSpan(List<Span> spans, List<Span> links, int start, int end, String kind, String value) {
        if (links.stream().noneMatch(link -> link.overlaps(start, end))) {
            spans.add(new Span(start, end, kind, value));
        }
    }

    /**
     * Cuts the text to the limits at a grapheme boundary, preferring the last space within {@link #MAX_WORD_BREAK_DISTANCE}
     * characters of the cut
     */
    private static String cut(String text, int maxGraphemes, int maxBytes) {
        Matcher matcher = GRAPHEME.matcher(text);
        int count = 0;
        int end = 0;

        while (matcher.find() && count < maxGraphemes && utf8Length(text.substring(0, matcher.end())) <= maxBytes) {
            end = matcher.end();
            count++;
        }

        for (int i = end - 1; i > 0 && end - i <= MAX_WORD_BREAK_DISTANCE; i--) {
            if (Character.isWhitespace(text.charAt(i))) {
                end = i;
                break;
            }
        }

        return text.substring(0, end).stripTrailing();
    }

    /**
     * Counts the characters of the text as a reader sees them
     *
     * @param text the text
     * @return the number of graphemes
     */
    static int countGraphemes(String text) {
        Matcher matcher = GRAPHEME.matcher(text);
        int count = 0;

        while (matcher.find()) {
            count++;
        }

        return count;
    }

    private static int utf8Length(String text) {
        return text.getBytes(StandardCharsets.UTF_8).length;
    }
}
