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

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.json.JSONArray;
import org.json.JSONObject;

import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.URIUtil;
import com.mcawful.social.SocialFetchResult;
import com.mcawful.social.SocialItem;
import com.mcawful.social.SocialLinkCard;
import com.mcawful.social.SocialPlatform;
import com.mcawful.social.SocialPollType;
import com.mcawful.social.SocialPostResult;
import com.mcawful.social.bluesky.BlueskyXrpc.XrpcException;

import io.netty.handler.codec.http.HttpHeaderNames;
import tv.phantombot.CaselessProperties;
import tv.phantombot.CaselessProperties.Transaction;

/**
 * Bluesky, through the AT Protocol
 * <p>
 * Polls:
 * <ul>
 * <li>{@code mentions}: mention, reply and quote notifications</li>
 * <li>{@code reposts}: repost notifications, which also feed repost rewards</li>
 * <li>{@code posts}: the linked account's own posts, without replies, reposts and the posts the bot made</li>
 * </ul>
 * Notifications are never marked as read, so they stay unread in the Bluesky app.
 *
 * @author mcawful
 */
public final class BlueskyPlatform implements SocialPlatform {

    private static final BlueskyPlatform INSTANCE = new BlueskyPlatform();
    private static final String PROFILE_URL = "https://bsky.app/profile/";
    private static final List<SocialPollType> POLL_TYPES = List.of(new SocialPollType("mentions", 60, 60, false),
            new SocialPollType("reposts", 60, 60, true), new SocialPollType("posts", 15, 15, false));
    private static final int MAX_GRAPHEMES = 300;
    private static final int MAX_BYTES = 3000;
    private static final int MAX_MENTION_LOOKUPS = 5;
    private static final int MAX_THUMBNAIL_BYTES = 1000000;
    private static final int MAX_GET_POSTS = 25;
    private static final Duration OWN_POST_MEMORY = Duration.ofHours(1);
    private final BlueskyXrpc xrpc = new BlueskyXrpc();
    private final Map<String, Instant> ownPosts = new ConcurrentHashMap<>();
    private final Map<String, String> accountIds = new ConcurrentHashMap<>();

    /**
     * Returns the instance
     *
     * @return the instance
     */
    public static BlueskyPlatform instance() {
        return INSTANCE;
    }

    private BlueskyPlatform() {
    }

    @Override
    public String getId() {
        return "bluesky";
    }

    @Override
    public String getDisplayName() {
        return "Bluesky";
    }

    @Override
    public String getModuleScript() {
        return "./handlers/blueskyHandler.js";
    }

    @Override
    public String getDiscordModuleScript() {
        return "./discord/handlers/blueskyHandler.js";
    }

    @Override
    public boolean isConfigured() {
        return !BlueskyXrpc.getHandleProperty().isEmpty() && !BlueskyXrpc.getPasswordProperty().isEmpty();
    }

    @Override
    public String getAccountName() {
        String handle = this.xrpc.hasSession() ? this.xrpc.getHandle() : null;

        return handle != null ? handle : BlueskyXrpc.getHandleProperty();
    }

    @Override
    public String getProfileUrl() {
        String account = this.getAccountName();

        return account.isEmpty() ? "" : PROFILE_URL + account;
    }

    @Override
    public List<SocialPollType> getPollTypes() {
        return POLL_TYPES;
    }

    @Override
    public SocialFetchResult fetch(SocialPollType type, String watermark) throws Exception {
        return switch (type.id()) {
            case "mentions" -> this.fetchNotifications("reasons=mention&reasons=reply&reasons=quote", watermark, false);
            case "reposts" -> this.fetchNotifications("reasons=repost", watermark, true);
            case "posts" -> this.fetchOwnPosts(watermark);
            default -> new SocialFetchResult(List.of(), watermark);
        };
    }

    private SocialFetchResult fetchNotifications(String reasons, String watermark, boolean reposts) throws XrpcException {
        String did = this.xrpc.ensureSignedIn();
        JSONArray notifications = this.xrpc.query("app.bsky.notification.listNotifications", "limit=50&" + reasons)
                .optJSONArray("notifications");
        Instant mark = parseInstant(watermark);
        Instant newest = mark;
        List<JSONObject> fresh = new ArrayList<>();

        for (int i = 0; notifications != null && i < notifications.length(); i++) {
            JSONObject notification = notifications.getJSONObject(i);
            Instant indexedAt = parseInstant(notification.optString("indexedAt"));

            if (indexedAt == null) {
                continue;
            }

            if (newest == null || indexedAt.isAfter(newest)) {
                newest = indexedAt;
            }

            if (mark != null && indexedAt.isAfter(mark) && !did.equals(notification.getJSONObject("author").optString("did"))) {
                fresh.add(notification);
            }
        }

        fresh.sort((a, b) -> b.optString("indexedAt").compareTo(a.optString("indexedAt")));
        Map<String, String> subjectTexts = reposts ? this.getPostTexts(fresh) : Map.of();
        List<SocialItem> items = new ArrayList<>();

        for (JSONObject notification : fresh) {
            JSONObject author = notification.getJSONObject("author");
            String text;
            String url;

            if (reposts) {
                String subject = notification.optString("reasonSubject");
                text = subjectTexts.getOrDefault(subject, "");
                url = postUrl(this.xrpc.getHandle(), did, subject);
            } else {
                text = notification.optJSONObject("record") == null ? "" : notification.getJSONObject("record").optString("text");
                url = postUrl(author.optString("handle"), author.optString("did"), notification.optString("uri"));
            }

            items.add(new SocialItem(reposts ? "repost" : notification.optString("reason"), notification.optString("uri"),
                    author.optString("did"), author.optString("handle"), author.optString("displayName"), text, url,
                    notification.optString("indexedAt")));
        }

        return new SocialFetchResult(items, (newest == null ? Instant.now() : newest).toString());
    }

    /**
     * Looks up the text of the posts the repost notifications are about
     */
    private Map<String, String> getPostTexts(List<JSONObject> notifications) throws XrpcException {
        Set<String> uris = new LinkedHashSet<>();
        notifications.forEach(notification -> {
            if (uris.size() < MAX_GET_POSTS && !notification.optString("reasonSubject").isEmpty()) {
                uris.add(notification.getString("reasonSubject"));
            }
        });

        Map<String, String> texts = new HashMap<>();

        if (!uris.isEmpty()) {
            StringBuilder query = new StringBuilder();
            uris.forEach(uri -> query.append(query.length() == 0 ? "" : "&").append("uris=").append(encode(uri)));
            JSONArray posts = this.xrpc.query("app.bsky.feed.getPosts", query.toString()).optJSONArray("posts");

            for (int i = 0; posts != null && i < posts.length(); i++) {
                JSONObject post = posts.getJSONObject(i);
                texts.put(post.optString("uri"), post.optJSONObject("record") == null ? "" : post.getJSONObject("record").optString("text"));
            }
        }

        return texts;
    }

    private SocialFetchResult fetchOwnPosts(String watermark) throws XrpcException {
        String did = this.xrpc.ensureSignedIn();
        JSONArray feed = this.xrpc.query("app.bsky.feed.getAuthorFeed", "actor=" + encode(did) + "&filter=posts_no_replies&limit=20")
                .optJSONArray("feed");
        Instant mark = parseInstant(watermark);
        Instant newest = mark;
        List<SocialItem> items = new ArrayList<>();
        this.ownPosts.values().removeIf(at -> at.plus(OWN_POST_MEMORY).isBefore(Instant.now()));

        for (int i = 0; feed != null && i < feed.length(); i++) {
            JSONObject entry = feed.getJSONObject(i);
            JSONObject post = entry.getJSONObject("post");
            Instant indexedAt = parseInstant(post.optString("indexedAt"));

            // A reason means the entry is a repost or a pinned post, not a new post
            if (indexedAt == null || entry.has("reason")) {
                continue;
            }

            if (newest == null || indexedAt.isAfter(newest)) {
                newest = indexedAt;
            }

            if (mark != null && indexedAt.isAfter(mark) && !this.ownPosts.containsKey(post.optString("uri"))) {
                JSONObject author = post.getJSONObject("author");
                items.add(new SocialItem("post", post.optString("uri"), author.optString("did"), author.optString("handle"),
                        author.optString("displayName"), post.optJSONObject("record") == null ? "" : post.getJSONObject("record").optString("text"),
                        postUrl(author.optString("handle"), author.optString("did"), post.optString("uri")), post.optString("indexedAt")));
            }
        }

        items.sort((a, b) -> b.createdAt().compareTo(a.createdAt()));

        return new SocialFetchResult(items, (newest == null ? Instant.now() : newest).toString());
    }

    @Override
    public SocialPostResult createPost(String text, SocialLinkCard card, boolean truncate) {
        if (text == null || text.isBlank()) {
            return SocialPostResult.failed(SocialPostResult.EMPTY, null);
        }

        try {
            String did = this.xrpc.ensureSignedIn();
            BlueskyRichText.RichText richText = BlueskyRichText.build(text, MAX_GRAPHEMES, MAX_BYTES, truncate);

            if (richText.graphemes() > MAX_GRAPHEMES) {
                return SocialPostResult.failed(SocialPostResult.TOO_LONG, richText.graphemes() + "/" + MAX_GRAPHEMES);
            } else if (richText.bytes() > MAX_BYTES) {
                return SocialPostResult.failed(SocialPostResult.TOO_LONG, richText.bytes() + "/" + MAX_BYTES + " bytes");
            }

            JSONObject post = new JSONObject().put("$type", "app.bsky.feed.post").put("text", richText.text())
                    .put("createdAt", Instant.now().truncatedTo(ChronoUnit.MILLIS).toString());
            JSONArray facets = this.buildFacets(richText.facets());

            if (!facets.isEmpty()) {
                post.put("facets", facets);
            }

            if (card != null) {
                post.put("embed", this.buildCard(card));
            }

            JSONObject result = this.xrpc.procedure("com.atproto.repo.createRecord",
                    new JSONObject().put("repo", did).put("collection", "app.bsky.feed.post").put("record", post));
            String uri = result.getString("uri");
            this.ownPosts.put(uri, Instant.now());

            return SocialPostResult.ok(postUrl(this.xrpc.getHandle(), did, uri));
        } catch (XrpcException ex) {
            com.gmt2001.Console.err.println("Failed to post to Bluesky: " + ex.getMessage());
            return SocialPostResult.failed(ex.isNotLinked() ? SocialPostResult.NOT_LINKED : SocialPostResult.FAILED, ex.getMessage());
        }
    }

    private JSONArray buildFacets(List<BlueskyRichText.Facet> facets) {
        JSONArray result = new JSONArray();
        int lookups = 0;

        for (BlueskyRichText.Facet facet : facets) {
            JSONObject feature = new JSONObject();

            switch (facet.kind()) {
                case "link" -> feature.put("$type", "app.bsky.richtext.facet#link").put("uri", facet.value());
                case "tag" -> feature.put("$type", "app.bsky.richtext.facet#tag").put("tag", facet.value());
                default -> {
                    // Mentions need the account id; a handle that is not found stays plain text
                    String did = this.accountIds.get(facet.value());

                    if (did == null && lookups++ < MAX_MENTION_LOOKUPS) {
                        did = this.resolveAccountId(facet.value());
                    }

                    if (did == null) {
                        continue;
                    }

                    feature.put("$type", "app.bsky.richtext.facet#mention").put("did", did);
                }
            }

            result.put(new JSONObject().put("index", new JSONObject().put("byteStart", facet.byteStart()).put("byteEnd", facet.byteEnd()))
                    .put("features", new JSONArray().put(feature)));
        }

        return result;
    }

    private JSONObject buildCard(SocialLinkCard card) {
        JSONObject external = new JSONObject().put("uri", card.uri()).put("title", card.title() == null ? "" : card.title())
                .put("description", card.description() == null ? "" : card.description());
        JSONObject thumb = this.uploadThumbnail(card.thumbnailUrl());

        if (thumb != null) {
            external.put("thumb", thumb);
        }

        return new JSONObject().put("$type", "app.bsky.embed.external").put("external", external);
    }

    /**
     * Downloads the card's picture and uploads it to Bluesky
     * <p>
     * A Twitch stream preview is requested at 1280x720, then 640x360, to stay under Bluesky's size limit
     *
     * @return the blob; {@code null} if there is no usable picture
     */
    private JSONObject uploadThumbnail(String thumbnailUrl) {
        if (thumbnailUrl == null || thumbnailUrl.isBlank()) {
            return null;
        }

        List<String> candidates = thumbnailUrl.contains("-1920x1080.")
                ? List.of(thumbnailUrl.replace("-1920x1080.", "-1280x720."), thumbnailUrl.replace("-1920x1080.", "-640x360."))
                : List.of(thumbnailUrl);

        for (String candidate : candidates) {
            HttpClientResponse response = HttpClient.get(URIUtil.create(candidate + (candidate.contains("?") ? "&" : "?")
                    + "t=" + Instant.now().getEpochSecond()));
            String contentType = response.isSuccess() ? response.responseHeaders().get(HttpHeaderNames.CONTENT_TYPE, "") : "";
            byte[] data = response.rawResponseBody();

            if (contentType.startsWith("image/") && data != null && data.length > 0 && data.length <= MAX_THUMBNAIL_BYTES) {
                try {
                    return this.xrpc.upload(data, contentType).getJSONObject("blob");
                } catch (XrpcException ex) {
                    com.gmt2001.Console.warn.println("Failed to upload the Bluesky link card picture: " + ex.getMessage());
                    return null;
                }
            }
        }

        com.gmt2001.Console.warn.println("No usable picture for the Bluesky link card at " + thumbnailUrl);

        return null;
    }

    @Override
    public String resolveAccountId(String accountName) {
        String handle = BlueskyXrpc.normalizeHandle(accountName).toLowerCase();

        if (handle.isEmpty()) {
            return null;
        } else if (handle.startsWith("did:")) {
            return handle;
        }

        String did = this.accountIds.get(handle);

        if (did == null) {
            try {
                did = this.xrpc.query("com.atproto.identity.resolveHandle", "handle=" + encode(handle)).optString("did", null);
            } catch (XrpcException ex) {
                com.gmt2001.Console.debug.println("Bluesky handle " + handle + " not resolved: " + ex.getMessage());
            }

            if (did != null) {
                this.accountIds.put(handle, did);
            }
        }

        return did;
    }

    @Override
    public SocialPostResult link(String account, String secret, String service) {
        String handle = BlueskyXrpc.normalizeHandle(account);
        String password = secret == null ? "" : secret.trim();
        String serviceUrl = BlueskyXrpc.normalizeService(service);

        if (handle.isEmpty() || password.isEmpty()) {
            return SocialPostResult.failed(SocialPostResult.EMPTY, null);
        }

        try {
            this.xrpc.signIn(handle, password, serviceUrl);
        } catch (XrpcException ex) {
            return SocialPostResult.failed(ex.getStatus() == 400 || ex.getStatus() == 401 ? SocialPostResult.NOT_LINKED
                    : SocialPostResult.FAILED, ex.getMessage());
        }

        Transaction transaction = CaselessProperties.instance().startTransaction();
        transaction.setProperty("bluesky_handle", handle);
        transaction.setProperty("bluesky_apppassword", password);

        if (serviceUrl.equals(BlueskyXrpc.DEFAULT_SERVICE)) {
            transaction.remove("bluesky_service");
        } else {
            transaction.setProperty("bluesky_service", serviceUrl);
        }

        transaction.commit();

        return SocialPostResult.ok(this.getProfileUrl());
    }

    @Override
    public void unlink() {
        Transaction transaction = CaselessProperties.instance().startTransaction();
        transaction.remove("bluesky_handle");
        transaction.remove("bluesky_apppassword");
        transaction.remove("bluesky_service");
        transaction.commit();
        this.xrpc.signOut();
        BlueskyXrpc.writeStatus("", "");
        BlueskyXrpc.writeAccount("", "");
    }

    @Override
    public void shutdown() {
        this.xrpc.signOut();
    }

    /**
     * Returns the bsky.app address of a post
     *
     * @param handle the handle of the post's author; the DID is used if it is empty or invalid
     * @param did the DID of the post's author
     * @param uri the {@code at://} address of the post
     * @return the web address
     */
    private static String postUrl(String handle, String did, String uri) {
        String profile = handle == null || handle.isEmpty() || handle.equals("handle.invalid") ? did : handle;

        return PROFILE_URL + profile + "/post/" + uri.substring(uri.lastIndexOf('/') + 1);
    }

    private static Instant parseInstant(String text) {
        if (text == null || text.isEmpty()) {
            return null;
        }

        try {
            return Instant.parse(text);
        } catch (DateTimeParseException ex) {
            try {
                return OffsetDateTime.parse(text).toInstant();
            } catch (DateTimeParseException ex2) {
                return null;
            }
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
