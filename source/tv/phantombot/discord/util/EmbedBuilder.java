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
package tv.phantombot.discord.util;

import discord4j.core.spec.EmbedCreateFields.Author;
import discord4j.core.spec.EmbedCreateFields.Field;
import discord4j.core.spec.EmbedCreateFields.Footer;
import discord4j.core.spec.EmbedCreateSpec;
import discord4j.rest.util.Color;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author gmt2001
 */
public class EmbedBuilder {

    private static final int FIELDS_MAX = 25;
    private static final int TITLE_MAX_CHAR = 256;
    private static final int FIELD_TITLE_MAX_CHAR = 256;
    private static final int FIELD_CONTENT_MAX_CHAR = 1024;
    private static final int DESC_MAX_CHAR = 2048;
    private static final int FOOTER_MAX_CHAR = 2048;
    private static final int AUTHOR_NAME_MAX_CHAR = 256;
    private static final int TOTAL_MAX_CHAR = 6000;
    private String title = "";
    private String url = "";
    private Color color;
    private Instant timestamp;
    private String footerTxt = "";
    private String footerIcon = "";
    private String authorName = "";
    private String authorUrl = "";
    private String authorIcon = "";
    private String description = "";
    private String image = "";
    private String thumbnail = "";
    private final List<AppendedField> appendedFields = new ArrayList<>();

    public EmbedBuilder() {
    }

    public EmbedBuilder withTitle(String title) {
        this.title = title;
        return this;
    }

    public EmbedBuilder withUrl(String url) {
        this.url = url;
        return this;
    }

    public EmbedBuilder withColor(Color color) {
        this.color = color;
        return this;
    }

    public EmbedBuilder withColor(java.awt.Color color) {
        return this.withColor(color.getRGB());
    }

    public EmbedBuilder withColor(int r, int g, int b) {
        return this.withColor(Color.of(r, g, b));
    }

    public EmbedBuilder withColor(int color) {
        return this.withColor(Color.of(color));
    }

    public EmbedBuilder withTimestamp(Instant instant) {
        this.timestamp = instant;
        return this;
    }

    public EmbedBuilder withTimestamp(long millis) {
        return this.withTimestamp(Instant.ofEpochMilli(millis));
    }

    public EmbedBuilder withFooterText(String text) {
        this.footerTxt = text;
        return this;
    }

    public EmbedBuilder withFooterIcon(String url) {
        this.footerIcon = url;
        return this;
    }

    public EmbedBuilder withAuthorName(String name) {
        this.authorName = name;
        return this;
    }

    public EmbedBuilder withAuthorIcon(String url) {
        this.authorIcon = url;
        return this;
    }

    public EmbedBuilder withAuthorUrl(String url) {
        this.authorUrl = url;
        return this;
    }

    public EmbedBuilder withDescription(String text) {
        this.description = text;
        return this;
    }

    public EmbedBuilder withDesc(String text) {
        return this.withDescription(text);
    }

    public EmbedBuilder appendDescription(String text) {
        this.description += text;
        return this;
    }

    public EmbedBuilder appendDesc(String text) {
        return this.appendDescription(text);
    }

    public EmbedBuilder withThumbnail(String url) {
        this.thumbnail = url;
        return this;
    }

    public EmbedBuilder withImage(String url) {
        this.image = url;
        return this;
    }

    public EmbedBuilder appendField(String name, String value, boolean inline) {
        if (this.appendedFields.size() < FIELDS_MAX) {
            this.appendedFields.add(new AppendedField(name, value, inline));
        }
        return this;
    }

    public EmbedBuilder clearFields() {
        this.appendedFields.clear();
        return this;
    }

    public int getFieldCount() {
        return this.appendedFields.size();
    }

    public int getTotalVisibleCharacters() {
        return Math.min(TITLE_MAX_CHAR, title.length()) + Math.min(DESC_MAX_CHAR, this.description.length()) + Math.min(FOOTER_MAX_CHAR, this.footerTxt.length())
                + Math.min(AUTHOR_NAME_MAX_CHAR, this.authorName.length()) + this.appendedFields.stream().mapToInt(af -> Math.min(FIELD_TITLE_MAX_CHAR, af.name.length())
                + Math.min(FIELD_CONTENT_MAX_CHAR, af.value.length())).sum();
    }

    public boolean doesExceedCharacterLimit() {
        return this.getTotalVisibleCharacters() > TOTAL_MAX_CHAR;
    }

    public EmbedCreateSpec build() {
        if (this.doesExceedCharacterLimit()) {
            throw new IllegalArgumentException("Embed exceeds character limit of " + TOTAL_MAX_CHAR + " (has " + this.getTotalVisibleCharacters() + " chars)");
        }

        EmbedCreateSpec spec = EmbedCreateSpec.create();

        if (!this.title.isEmpty()) {
            spec = spec.withTitle(this.title.substring(0, Math.min(TITLE_MAX_CHAR, this.title.length())));
        }

        if (!this.url.isEmpty()) {
            spec = spec.withUrl(this.url);
        }

        if (this.color != null) {
            spec = spec.withColor(this.color);
        }

        if (this.timestamp != null) {
            spec = spec.withTimestamp(this.timestamp);
        }

        if (!this.footerTxt.isEmpty()) {
            spec = spec.withFooter(new EmbedFooter(this.footerTxt, this.footerIcon));
        }

        if (!this.authorName.isEmpty()) {
            spec = spec.withAuthor(new EmbedAuthor(this.authorName, this.authorUrl, this.authorIcon));
        }

        if (!this.description.isEmpty()) {
            spec = spec.withDescription(this.description.substring(0, Math.min(DESC_MAX_CHAR, this.description.length())));
        }

        if (!this.image.isEmpty()) {
            spec = spec.withImage(this.image);
        }

        if (!this.thumbnail.isEmpty()) {
            spec = spec.withThumbnail(this.thumbnail);
        }

        if (!this.appendedFields.isEmpty()) {
            spec = spec.withFields(this.appendedFields);
        }

        return spec;
    }

    private class AppendedField implements Field {

        private final String name;
        private final String value;
        private final boolean inline;

        private AppendedField(String name, String value, boolean inline) {
            this.name = name;
            this.value = value;
            this.inline = inline;
        }

        @Override
        public String name() {
            return this.name;
        }

        @Override
        public String value() {
            return this.value;
        }

        @Override
        public boolean inline() {
            return this.inline;
        }
    }

    private class EmbedFooter implements Footer {

        private final String footerTxt;
        private final String footerIcon;

        private EmbedFooter(String footerTxt, String footerIcon) {
            this.footerTxt = footerTxt.substring(0, Math.min(FOOTER_MAX_CHAR, footerTxt.length()));
            this.footerIcon = footerIcon;
        }

        @Override
        public String text() {
            return this.footerTxt;
        }

        @Override
        public String iconUrl() {
            return this.footerIcon;
        }
    }

    private class EmbedAuthor implements Author {

        private final String authorName;
        private final String authorUrl;
        private final String authorIcon;

        private EmbedAuthor(String authorName, String authorUrl, String authorIcon) {
            this.authorName = authorName.substring(0, Math.min(AUTHOR_NAME_MAX_CHAR, authorName.length()));
            this.authorUrl = authorUrl;
            this.authorIcon = authorIcon;
        }

        @Override
        public String name() {
            return this.authorName;
        }

        @Override
        public String url() {
            return this.authorUrl;
        }

        @Override
        public String iconUrl() {
            return this.authorIcon;
        }
    }
}
