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

import com.gmt2001.Console.err;
import com.gmt2001.Console.in;
import com.googlecode.lanterna.gui2.TextBox;
import com.googlecode.lanterna.input.KeyStroke;
import static com.googlecode.lanterna.input.KeyType.Character;
import static com.googlecode.lanterna.input.KeyType.Enter;
import java.awt.Toolkit;
import java.awt.datatransfer.Clipboard;
import java.awt.datatransfer.DataFlavor;
import java.awt.datatransfer.Transferable;
import java.awt.datatransfer.UnsupportedFlavorException;
import java.io.IOException;

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
            if (keyStroke.getKeyType() == Character && keyStroke.isCtrlDown() && keyStroke.getCharacter().toString().equalsIgnoreCase("V")) {
                Clipboard c = Toolkit.getDefaultToolkit().getSystemClipboard();
                Transferable t = c.getContents(null);

                if (t != null && t.isDataFlavorSupported(DataFlavor.stringFlavor)) {
                    try {
                        this.setText(this.getText() + t.getTransferData(DataFlavor.stringFlavor));

                        return Result.HANDLED;
                    } catch (UnsupportedFlavorException | IOException ex) {
                        err.logStackTrace(ex);
                    }
                }
            }
        }

        return super.handleKeyStroke(keyStroke);
    }
}
