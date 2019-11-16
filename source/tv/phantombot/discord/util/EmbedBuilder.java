/*
 * Copyright (C) 2016-2019 phantombot.tv
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

import discord4j.core.spec.EmbedCreateSpec;
import java.awt.Color;
import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import java.util.function.Consumer;

/**
 *
 * @author gmt2001
 */
public class EmbedBuilder {

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

    public EmbedBuilder withColor(int r, int g, int b) {
        return this.withColor(new Color(r, g, b));
    }

    public EmbedBuilder withColor(int color) {
        return this.withColor(new Color(color));
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

    public EmbedBuilder withDesc(String text) {
        this.description = text;
        return this;
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
        this.appendedFields.add(new AppendedField(name, value, inline));
        return this;
    }

    public Consumer<? super EmbedCreateSpec> build() {
        return (EmbedCreateSpec t) -> {
            if (!title.isEmpty()) {
                t.setTitle(title);
            }

            if (!url.isEmpty()) {
                t.setUrl(url);
            }

            if (color != null) {
                t.setColor(color);
            }

            if (timestamp != null) {
                t.setTimestamp(timestamp);
            }

            if (!footerTxt.isEmpty()) {
                t.setFooter(footerTxt, footerIcon);
            }

            if (!authorName.isEmpty()) {
                t.setAuthor(authorName, authorUrl, authorIcon);
            }

            if (!description.isEmpty()) {
                t.setDescription(description);
            }

            if (!image.isEmpty()) {
                t.setImage(image);
            }

            if (!thumbnail.isEmpty()) {
                t.setThumbnail(thumbnail);
            }

            if (!appendedFields.isEmpty()) {
                appendedFields.forEach((af) -> {
                    t.addField(af.name, af.value, af.inline);
                });
            }
        };
    }

    private class AppendedField {

        private final String name;
        private final String value;
        private final boolean inline;

        private AppendedField(String name, String value, boolean inline) {
            this.name = name;
            this.value = value;
            this.inline = inline;
        }
    }
}
