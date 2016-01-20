package jcurses.widgets;

import jcurses.system.CharColor;
import jcurses.system.Toolkit;

import jcurses.util.Rectangle;

import java.util.StringTokenizer;

/**
 * This class implements a label widget
 */
public class Label extends Widget
{

    private String _label = null;

    private static CharColor __labelDefaultColors = new CharColor(CharColor.WHITE, CharColor.BLACK);

    @Override
    public CharColor getDefaultColors()
    {
        return __labelDefaultColors;
    }

    /**
     * The constructor
     *
     * @param label label's text
     * @param colors label's colors
     */
    public Label(String label, CharColor colors)
    {
        if (label != null)
        {
            _label = label;
        } else
        {
            _label = "";
        }
        setColors(colors);
    }

    /**
     * The constructor
     *
     * @param label label's text
     */
    public Label(String label)
    {
        this(label, null);
    }

    @Override
    @SuppressWarnings("IndexOfReplaceableByContains")
    protected Rectangle getPreferredSize()
    {
        if (_label.indexOf("\n") == -1)
        {
            return new Rectangle(_label.length(), 1);
        } else
        {
            StringTokenizer tokenizer = new StringTokenizer(_label, "\n");
            int width = 0;
            int height = 0;
            while (tokenizer.hasMoreElements())
            {
                String token = tokenizer.nextToken();
                height++;
                if (token.length() > width)
                {
                    width = token.length();
                }
            }
            height = (height == 0) ? 1 : height;
            return new Rectangle(width, height);
        }
    }

    @Override
    protected void doPaint()
    {
        Rectangle rect = (Rectangle) getSize().clone();
        rect.setLocation(getAbsoluteX(), getAbsoluteY());
        Toolkit.printString(_label, rect, getColors());
    }

    @Override
    protected void doRepaint()
    {
        doPaint();
    }

}
