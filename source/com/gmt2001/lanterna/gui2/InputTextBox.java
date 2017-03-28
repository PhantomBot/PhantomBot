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

import com.gmt2001.Console.in;
import com.googlecode.lanterna.gui2.TextBox;
import com.googlecode.lanterna.input.KeyStroke;
import static com.googlecode.lanterna.input.KeyType.Enter;

/**
 *
 * @author gmt2001
 */
public class InputTextBox extends TextBox
{

    public InputTextBox() {
        super();
    }

    @Override
    public synchronized Result handleKeyStroke(KeyStroke keyStroke) {
        if (!this.isReadOnly()) {
            if (keyStroke.getKeyType() == Enter) {
                in.queueInput(this.getText());
                this.setText("");

                return Result.HANDLED;
            }
        }

        return super.handleKeyStroke(keyStroke);
    }
}
