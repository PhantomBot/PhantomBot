/*
 * Copyright (C) 2016 phantombot.tv
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
package com.gmt2001;

import com.google.common.eventbus.Subscribe;
import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.HashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.Listener;
import me.mast3rplan.phantombot.event.irc.message.IrcChannelMessageEvent;
import org.apache.commons.io.FileUtils;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

/**
 *
 * @author gmt2001
 */
public class HttpLang implements Listener
{
    private static final HttpLang INSTANCE = new HttpLang();
    private String lang = "english";
    private final HashMap<String, String> data = new HashMap<>();
    private boolean langchecked = false;
    private static final Pattern LANGPATTERN = Pattern.compile("<lang [\\w\\-\\.\\_]+ />");

    public static HttpLang instance() {
        return INSTANCE;
    }

    private HttpLang() {
        this.loadLang();
    }

    @Subscribe
    public void ircChannelMessage(IrcChannelMessageEvent event) {
        if (event.getMessage().startsWith("!lang") && event.getMessage().contains(" ") && !event.getTags().get("user-type").isEmpty()) {
            this.lang = event.getMessage().substring(event.getMessage().indexOf(" ") + 1);
            this.loadLang();
        }
    }

    public void setLang(String lang) {
        if (!this.lang.equals(lang)) {
            this.lang = lang;
            this.loadLang();
        }
    }

    private void loadLang() {
        try
        {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();

            Collection<File> files = FileUtils.listFiles(new File("./web/lang/" + this.lang), new String[] { "xml" }, true);

            for (File f : files) {
                Document d = builder.parse(f);

                Element root = d.getDocumentElement();
                NodeList nl = root.getChildNodes();

                for (int i = 0; i < nl.getLength(); i++) {
                    Node n = nl.item(i);
                    Element e = (Element) n;

                    data.put(e.getAttribute("id"), e.getTextContent());
                }
            }
        } catch (IOException | ParserConfigurationException | SAXException ex)
        {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public String replaceLangTags(String document) {
        if (!langchecked) {
            EventBus.instance().register(this);

            if (PhantomBot.instance().getDataStore().HasKey("settings", "", "lang")) {
                this.lang = PhantomBot.instance().getDataStore().GetString("settings", "", "lang");
                this.loadLang();
            }

            langchecked = true;
        }

        Matcher m = LANGPATTERN.matcher(document);

        String newdocument = "";
        int lastend = 0;

        while (m.find()) {
            if (m.start() > 0) {
                newdocument += document.substring(lastend, m.start());
            }

            String langtag = document.substring(m.start(), m.end());

            newdocument += data.get(langtag.substring(6, langtag.length()-3));

            lastend = m.end();
        }

        if (lastend < document.length()) {
            newdocument += document.substring(lastend);
        }

        return newdocument;
    }
}
