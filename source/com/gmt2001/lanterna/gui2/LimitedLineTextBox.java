/*
 * Copyright (C) 2017 phantombot.tv
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
package com.gmt2001.lanterna.gui2;

import com.googlecode.lanterna.gui2.TextBox;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.apache.commons.lang3.StringUtils;

/**
 *
 * @author gmt2001
 */
public class LimitedLineTextBox extends TextBox
{

    public LimitedLineTextBox() {
        super();
    }

    public synchronized void limitedAddLines(List<String> lines) {
        int maxlines = this.getPreferredSize().getRows();
        int maxcols = this.getPreferredSize().getColumns();

        List<String> ls = new ArrayList<>(Arrays.asList(this.getText().split("\n")));

        lines.stream().map((line) -> line.split("\n")).forEach((s) -> {
            List<String> sls = Arrays.asList(s);

            sls.forEach((s2) -> {
                while (s2.length() >= maxcols) {
                    ls.add(s2.substring(0, maxcols - 1));
                    s2 = s2.substring(maxcols - 1);
                }

                ls.add(s2);
            });
        });

        while (ls.size() > maxlines) {
            ls.remove(0);
        }

        this.setText(StringUtils.join(ls, "\n").replaceAll("\r", ""));
    }

    public synchronized void limitedAddLine(String line) {
        List<String> ls = new ArrayList<>();
        ls.add(line);
        limitedAddLines(ls);
    }
}
