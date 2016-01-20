package jcurses.widgets;

import jcurses.system.InputChar;
import jcurses.system.CharColor;
import jcurses.system.Toolkit;
import jcurses.util.Rectangle;

/**
 * This class implements a input text field to edie a one line text.
 * 
*/
public class TextField extends TextComponent
{

    /**
     * The constructor
     *
     * @param width the preferred width, if -1, there is no preferred size.
     * @param text initial text, if null, the field is empty
     */
    public TextField(int width, String text)
    {
        super(width, 1, text);
    }

    /**
     * The constructor
     *
     * @param width the preferred width, if -1, there is no preferred size.
     */
    public TextField(int width)
    {
        super(width, 1);
    }

    public TextField()
    {
        this(-1);
    }

    @Override
    @SuppressWarnings("IndexOfReplaceableByContains")
    public void setText(String text)
    {
        if (text == null)
        {
            super.setText(text);
        } else
        {
            if (text.indexOf("\n") != -1)
            {
                super.setText(text.substring(0, text.indexOf("\n")));
            } else
            {
                super.setText(text);
            }
        }
    }

    private String _delimiter = null;

    protected static String getDefaultDelimiter()
    {
        return "|";
    }

    public void setDelimiter(char c)
    {
        char[] chars = new char[1];
        chars[0] = c;
        _delimiter = new String(chars);
    }

    @SuppressWarnings("RedundantStringConstructorCall")
    private String getDelimiterString()
    {
        if (_delimiter == null)
        {
            return new String("|");
        }

        return _delimiter;
    }

    private static CharColor __delimiterDefaultColors = new CharColor(CharColor.WHITE, CharColor.BLACK, CharColor.NORMAL);

    private CharColor _delimiterColors = getDelimiterDefaultColors();

    public CharColor getDelimiterDefaultColors()
    {
        return __delimiterDefaultColors;
    }

    public CharColor getDelimiterColors()
    {
        return _delimiterColors;
    }

    public void setDelimiterColors(CharColor colors)
    {
        _delimiterColors = colors;
    }

    @Override
    protected Rectangle getTextRectangle()
    {
        Rectangle result = (Rectangle) getSize().clone();
        result.setLocation(getAbsoluteX() + 1, getAbsoluteY());
        result.setWidth(result.getWidth() - 2);

        return result;
    }

    @Override
    protected void doPaint()
    {
        super.doPaint();
        // Begrenzer malen
        Toolkit.printString(getDelimiterString(), getAbsoluteX(), getAbsoluteY(), getDelimiterColors());
        Toolkit.printString(getDelimiterString(), getAbsoluteX() + getSize().getWidth() - 1,
                getAbsoluteY(), getDelimiterColors());

    }

    @Override
    protected Rectangle getPreferredSize()
    {
        return new Rectangle(getWidth(), getHeight());
    }

    /**
     * Input-Behandlundg
     *
     * @param ch
     * @return
     */
    @Override
    protected boolean handleInput(InputChar ch)
    {

        boolean filter = (ch.getCode() == InputChar.KEY_UP)
                || (ch.getCode() == InputChar.KEY_DOWN)
                || (ch.getCode() == InputChar.KEY_NPAGE)
                || (ch.getCode() == InputChar.KEY_PPAGE)
                || (ch.getCode() == InputChar.KEY_END)
                || (ch.getCode() == InputChar.KEY_HOME)
                || ((!ch.isSpecialCode()) && (ch.getCharacter() == '\n'))
                || ((!ch.isSpecialCode()) && (ch.getCharacter() == '\r'));
        if (!filter)
        {
            return super.handleInput(ch);
        } else
        {
            return false;
        }

    }

}
