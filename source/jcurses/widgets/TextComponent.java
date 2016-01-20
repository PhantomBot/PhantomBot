package jcurses.widgets;

import java.util.ArrayList;

import jcurses.event.ValueChangedListener;
import jcurses.event.ValueChangedListenerManager;
import jcurses.event.ValueChangedEvent;
import jcurses.system.Toolkit;
import jcurses.system.CharColor;
import jcurses.system.InputChar;
import jcurses.util.Rectangle;
import jcurses.util.Paging;

/**
 * The class is the superclass for text editing widgets
 */
public class TextComponent extends Widget
{

    private int _width = 0;
    private int _height = 0;

    private int _cursPosX = 0;
    private int _cursPosY = 0;

    private int _firstChar = 0;
    private int _firstLine = 0;

    StringBuffer _text = new StringBuffer("");
    ArrayList _lines = new ArrayList();
    ArrayList _lineLengths = new ArrayList();

    /**
     * The constructor
     *
     * @param width the preferred width of the component. If -1 is stated, there
     * is no preferred width and the component is layouted dependend on the
     * container and the text
     * @param height the preferred height of the component. If -1 is stated,
     * there is no preferred width and the component is layouted dependend on
     * the container.
     * @param text the initial text, if <code>null</code> the component is empty
     *
     */
    @SuppressWarnings("OverridableMethodCallInConstructor")
    public TextComponent(int width, int height, String text)
    {
        _width = width;
        _height = height;
        setText(text);

    }

    /**
     * The constructor
     *
     * @param width the preferred width of the component. If -1 is stated, there
     * is no preferred width and the component is layouted dependend on the
     * container and the text
     * @param height the preferred height of the component. If -1 is stated,
     * there is no preferred width and the component is layouted dependend on
     * the container and the text.
     *
     */
    public TextComponent(int width, int height)
    {
        this(width, height, "");
    }

    /**
     * Constructor with no arguments. No preferred width and height, empty.
     */
    public TextComponent()
    {
        this(-1, -1, "");
    }

    /**
     * Konstruktor, nur Text, höhe und Breite vom Container bestimmt
     *
     * @param text
     */
    public TextComponent(String text)
    {
        this(-1, -1, text);
    }

    /**
     * @return preferred width
     */
    protected int getWidth()
    {
        return _width;
    }

    /**
     * @return preferred height
     */
    protected int getHeight()
    {
        return _height;
    }

    /**
     * Sets the conteined text
     *
     * @param text text to set
     */
    public void setText(String text)
    {
        setText(text, true);
    }

    /**
     * Sets the contained text
     *
     * @param text text to set
     * @param dispatchEvent if true, the widget is repainted
     */
    public void setText(String text, boolean dispatchEvent)
    {
        text = (text == null) ? "" : text;
        _text = new StringBuffer(text);
        updateText(dispatchEvent);
        reset();

    }

    private void reset()
    {
        _cursPosX = 0;
        _cursPosY = 0;
        _firstChar = 0;
        _firstLine = 0;
    }

    /**
     * @return contained text
     */
    public String getText()
    {
        return _text.toString();
    }

    private void updateText()
    {
        updateText(true);
    }

    /**
     * Für abgeleitete Klassen Textbreite und Höhe und Koordinaten der oberen
     * Rechten Ecke des Sichtbaren Bereiches
     *
     * @return
     */
    protected int getTextX()
    {
        return _firstChar;
    }

    protected int getTextY()
    {
        return _firstLine;
    }

    protected int getTextHeight()
    {
        return _lines.size();
    }

    protected int getTextWidth()
    {
        int result = 0;

        for (Object _lineLength : _lineLengths)
        {
            @SuppressWarnings("UnnecessaryUnboxing")
            int value = ((Integer) _lineLength).intValue();
            if (value > result)
            {
                result = value;
            }
        }

        return result;
    }

    @SuppressWarnings(
            {
                "UnnecessaryBoxing", "SizeReplaceableByIsEmpty"
            })
    private void updateText(boolean dispatchEvent)
    {

        //neu darstellen
        _lines.clear();
        _lineLengths.clear();

        String text = _text.toString();

        int pos = 0;

        while (text.indexOf("\n", pos) != -1)
        {
            _lines.add(new Integer(pos));
            _lineLengths.add(new Integer(text.indexOf("\n", pos) - pos));
            pos = text.indexOf("\n", pos) + 1;
        }

        if (pos < text.length())
        {
            _lines.add(new Integer(pos));
            _lineLengths.add(new Integer(_text.length() - pos));
        }

        if (_lines.size() == 0)
        {
            _lines.add(new Integer(0));
            _lineLengths.add(new Integer(0));
        } else
        {
            if (text.endsWith("\n"))
            {
                _lines.add(new Integer(text.length()));
                _lineLengths.add(new Integer(0));
            }
        }

        //event abschicken
        if (dispatchEvent)
        {
            _listenerManager.handleEvent(new ValueChangedEvent(this));
        }

    }

    /**
     * This method draws text-dependent additional things such as scrollbars. As
     * default it makes nothing, can be overriden in inherited classes ( for
     * example text area)
     */
    protected void drawAdditionalThings()
    {
        //nothing
    }

    /**
     * This method refreshes text-dependent additional after a text change such
     * as scrollbars. As default it makes nothing, can be overriden in inherited
     * classes ( for example text area)
     */
    protected void refreshAdditionalThings()
    {
        //nothing
    }

    /**
     * The method returns the rectangle, within that the text is painted. Is
     * overrided by derived classes for example to implement a border.
     *
     * @return
     */
    protected Rectangle getTextRectangle()
    {
        Rectangle result = getSize();
        result.setLocation(getAbsoluteX(), getAbsoluteY());
        result.setHeight(result.getHeight());
        return result;
    }

    private int getVisibleHeight()
    {
        return getTextRectangle().getHeight();
    }

    private Rectangle getTextRectangle(int firstLine)
    {
        Rectangle rect = getTextRectangle();
        int y = ((firstLine - _firstLine) >= 0) ? (firstLine - _firstLine) : 0;
        rect.setLocation(rect.getX(), rect.getY() + y);
        rect.setHeight(rect.getHeight() - y);
        return rect;
    }

    private Rectangle getLineRectangle(int firstLine)
    {
        Rectangle rect = getTextRectangle();
        int y = ((firstLine - _firstLine) >= 0) ? (firstLine - _firstLine) : 0;
        rect.setLocation(rect.getX(), rect.getY() + y);
        rect.setHeight(1);
        return rect;
    }

    private int getFirstLineNumber()
    {
        /*
         * int result = _cursPosY - getTextRectangle().getHeight()+1; result =
         * (result < 0)?0:result;
         */
        return _firstLine;
    }

    private int getFirstCharNumber()
    {
        /*
         * int result = _cursPosX - getTextRectangle().getWidth()+1; result =
         * (result < 0)?0:result;
         */
        return _firstChar;
    }

    private static CharColor __textComponentDefaultColors = new CharColor(CharColor.MAGENTA, CharColor.BLACK);

    @Override
    public CharColor getDefaultColors()
    {
        return __textComponentDefaultColors;
    }

    private static CharColor __focusedTextComponentDefaultColors = new CharColor(CharColor.BLUE, CharColor.WHITE, CharColor.REVERSE);
    private CharColor _focusedTextComponentColors = getFocusedTextComponentDefaultColors();

    public CharColor getFocusedTextComponentDefaultColors()
    {
        return __focusedTextComponentDefaultColors;
    }

    public CharColor getFocusedTextComponentColors()
    {
        return _focusedTextComponentColors;
    }

    public void setTextComponentColors(CharColor colors)
    {
        _focusedTextComponentColors = colors;
    }

    private static CharColor __cursorDefaultColors = new CharColor(CharColor.BLACK, CharColor.WHITE);
    private CharColor _cursorColors = getCursorDefaultColors();

    public CharColor getCursorDefaultColors()
    {
        return __cursorDefaultColors;
    }

    public CharColor getCursorColors()
    {
        return _cursorColors;
    }

    public void setCursorColors(CharColor colors)
    {
        _cursorColors = colors;
    }

    /**
     * Aus Widget
     *
     * @return
     */
    @Override
    protected Rectangle getPreferredSize()
    {
        return new Rectangle(_width, _height);
    }

    private void drawCursor()
    {
        char c = getCharacterAtCursorPosition();
        drawChar(_cursPosX, _cursPosY, getCursorColors(), c);
    }

    private void drawChar(int x, int y, CharColor colors, char c)
    {
        int x1 = x - _firstChar;
        int y1 = y - _firstLine;
        String toPrint = (c == 0) ? " " : replaceTextLineForPrinting("" + c);
        Toolkit.printString(toPrint, getTextRectangle().getX() + x1, getTextRectangle().getY() + y1, colors);
    }

    private void drawText(int index)
    {
        int firstLine = getFirstLineNumber();
        int begin = (firstLine > index) ? firstLine : index;

        for (int i = begin; i < _lines.size(); i++)
        {
            drawLine(i);
        }

    }

    private void drawLine(int index)
    {
        Rectangle rect = getTextRectangle();
        CharColor colors = hasFocus() ? getFocusedTextComponentColors() : getColors();
        int firstLine = getFirstLineNumber();
        int firstChar = getFirstCharNumber();
        @SuppressWarnings("UnnecessaryUnboxing")
        int pos = ((Integer) _lines.get(index)).intValue();
        @SuppressWarnings("UnnecessaryUnboxing")
        int length = ((Integer) _lineLengths.get(index)).intValue();
        if ((firstChar < length) && ((index - firstLine) < rect.getHeight()))
        {
            int length2 = length - firstChar;
            int length3 = (length2 > rect.getWidth()) ? rect.getWidth() : length2;
            Toolkit.printString(replaceTextLineForPrinting(_text.substring(pos + firstChar, pos + firstChar + length3)), rect.getX(), rect.getY() + index - firstLine, colors);
        }
    }

    private String getLine(int index)
    {
        if (index > _lines.size())
        {
            return null;
        } else
        {
            @SuppressWarnings("UnnecessaryUnboxing")
            int pos = ((Integer) _lines.get(index)).intValue();
            @SuppressWarnings("UnnecessaryUnboxing")
            int length = ((Integer) _lineLengths.get(index)).intValue();

            return _text.substring(pos, pos + length);
        }
    }

    private void drawText()
    {
        drawText(0);
    }

    //Paging
    private Paging getPaging()
    {
        return new Paging(getVisibleHeight(), getTextHeight());
    }

    private int getPageNumber(int index)
    {
        return getPaging().getPageNumber(index);
    }

    private int getPageSize()
    {
        return getPaging().getPageSize();
    }

    private int getCurrentPageNumber()
    {
        return getPageNumber(_cursPosY);
    }

    int getPageStartIndex(int pageNumber)
    {
        return getPaging().getPageStartIndex(pageNumber);
    }

    int getPageEndIndex(int pageNumber)
    {
        return getPaging().getPageEndIndex(pageNumber);
    }

    int getCurrentPageOffset()
    {
        return getPaging().getPageOffset(_cursPosY);
    }

    private void drawBox(Rectangle rect)
    {
        CharColor colors = hasFocus() ? getFocusedTextComponentColors() : getColors();
        Toolkit.drawRectangle(rect, colors);
    }

    private void drawBox()
    {
        drawBox(getTextRectangle());
    }

    private void changeColors()
    {
        Rectangle rect = getTextRectangle();
        CharColor colors = hasFocus() ? getFocusedTextComponentColors() : getColors();
        Toolkit.changeColors(rect, colors);
    }

    @Override
    protected void doPaint()
    {
        drawBox();
        drawText();
        if (hasFocus())
        {
            drawCursor();
        }
    }

    @Override
    protected boolean isFocusable()
    {
        return true;
    }

    @Override
    protected void doRepaint()
    {
        doPaint();
    }

    private char getCharacterAtCursorPosition()
    {
        char result = 0;
        if (_text.length() > 0)
        {
            String line = (String) getLine(_cursPosY);
            if (_cursPosX < line.length())
            {
                result = line.charAt(_cursPosX);
            } else
            {
                result = 0;
            }
        }
        return result;
    }

    private boolean isTextChanged(int x, int y)
    {
        return !((_firstChar == x) && (_firstLine == y));
    }

    private boolean isCursorChanged(int x, int y)
    {
        return !((_cursPosX == x) && (_cursPosY == y));
    }

    private void redrawAfterCursorMove(int bCursorPosX, int bCursorPosY, int bFirstChar, int bFirstLine, char bChar)
    {
        if (isTextChanged(bFirstChar, bFirstLine))
        {
            paint();
        } else if (isCursorChanged(bCursorPosX, bCursorPosY))
        {
            redrawOldChar(bCursorPosX, bCursorPosY, bChar);
            drawCursor();
        }
    }

    private void redrawOldChar(int bCursorPosX, int bCursorPosY, char bChar)
    {
        CharColor colors = hasFocus() ? getFocusedTextComponentColors() : getColors();
        drawChar(bCursorPosX, bCursorPosY, colors, bChar);

    }

    private void redrawAfterTextChange(int bCursorPosX, int bCursorPosY, int bFirstChar, int bFirstLine)
    {
        if (isTextChanged(bFirstChar, bFirstLine))
        {
            paint();
        } else if (isCursorChanged(bCursorPosX, bCursorPosY))
        {
            int y = Math.min(_cursPosY, bCursorPosY);
            drawBox(getTextRectangle(y));
            drawText(y);
            drawCursor();
            refreshAdditionalThings();
        }

    }

    private void redrawLine(int index)
    {
        drawBox(getLineRectangle(index));
        drawLine(index);
        drawCursor();
        refreshAdditionalThings();
    }

    /**
     * This method replaces a line of text to printing througth another text
     * line. This can be overrided in derived classes for example for painting
     * all chars as capitals, or for password input. Here the same line is
     * returned.
     *
     * @param line a text line to replace, contains no line breaks
     * @return decoded line
     */
    protected String replaceTextLineForPrinting(String line)
    {
        return line;
    }

    @Override
    protected boolean handleInput(InputChar ch)
    {

        int bCursorPosX = _cursPosX;
        int bCursorPosY = _cursPosY;
        int bFirstChar = _firstChar;
        int bFirstLine = _firstLine;
        char bChar = getCharacterAtCursorPosition();

        if (ch.getCode() == InputChar.KEY_RIGHT)
        {
            setCursorLocation(_cursPosX + 1, _cursPosY);
            redrawAfterCursorMove(bCursorPosX, bCursorPosY, bFirstChar, bFirstLine, bChar);
            return true;
        } else if (ch.getCode() == InputChar.KEY_LEFT)
        {
            setCursorLocation(_cursPosX - 1, _cursPosY);
            redrawAfterCursorMove(bCursorPosX, bCursorPosY, bFirstChar, bFirstLine, bChar);
            return true;
        } else if (ch.getCode() == InputChar.KEY_UP)
        {
            setCursorLocation(_cursPosX, _cursPosY - 1);
            redrawAfterCursorMove(bCursorPosX, bCursorPosY, bFirstChar, bFirstLine, bChar);
            return true;
        } else if (ch.getCode() == InputChar.KEY_DOWN)
        {
            setCursorLocation(_cursPosX, _cursPosY + 1);
            redrawAfterCursorMove(bCursorPosX, bCursorPosY, bFirstChar, bFirstLine, bChar);
            return true;
        } else if (ch.getCode() == InputChar.KEY_HOME)
        {
            setCursorLocation(_cursPosX, 0);
            redrawAfterCursorMove(bCursorPosX, bCursorPosY, bFirstChar, bFirstLine, bChar);
            return true;
        } else if (ch.getCode() == InputChar.KEY_END)
        {
            setCursorLocation(_cursPosX, getTextHeight() - 1);
            redrawAfterCursorMove(bCursorPosX, bCursorPosY, bFirstChar, bFirstLine, bChar);
            return true;
        } else if (ch.getCode() == InputChar.KEY_NPAGE)
        {
            @SuppressWarnings("UnusedAssignment")
            int newYPos = 0;
            if (getCurrentPageNumber() < (getPageSize() - 1))
            {
                newYPos = getPaging().getIndexByPageOffset(getCurrentPageNumber() + 1, getCurrentPageOffset());
            } else
            {
                newYPos = getTextHeight() - 1;
            }
            setCursorLocation(_cursPosX, newYPos, true);
            redrawAfterCursorMove(bCursorPosX, bCursorPosY, bFirstChar, bFirstLine, bChar);
            return true;
        } else if (ch.getCode() == InputChar.KEY_PPAGE)
        {
            @SuppressWarnings("UnusedAssignment")
            int newYPos = 0;
            if (getCurrentPageNumber() > 0)
            {
                newYPos = getPaging().getIndexByPageOffset(getCurrentPageNumber() - 1, getCurrentPageOffset());
            } else
            {
                newYPos = 0;
            }
            setCursorLocation(_cursPosX, newYPos, true);
            redrawAfterCursorMove(bCursorPosX, bCursorPosY, bFirstChar, bFirstLine, bChar);
        } else if (ch.getCode() == InputChar.KEY_BACKSPACE)
        {
            deleteCharBeforeCursorLocation();
            if (_cursPosX == 0)
            {
                if (_cursPosY > 0)
                {
                    int y = _cursPosY - 1;
                    if (y < 0)
                    {
                        y = 0;
                    }
                    @SuppressWarnings("UnnecessaryUnboxing")
                    int x = ((Integer) _lineLengths.get(y)).intValue();
                    setCursorLocation(x, y);
                    redrawAfterTextChange(bCursorPosX, bCursorPosY, bFirstChar, bFirstLine);
                }
            } else
            {
                setCursorLocation(_cursPosX - 1, _cursPosY);
                redrawLine(_cursPosY);
            }

            return true;
        } else if (!ch.isSpecialCode())
        {
            char c = ch.getCharacter();
            insertCharAtCursorLocation(c);
            if (c == '\n')
            {
                setCursorLocation(0, _cursPosY + 1);
                redrawAfterTextChange(bCursorPosX, bCursorPosY, bFirstChar, bFirstLine);
            } else
            {
                setCursorLocation(_cursPosX + 1, _cursPosY);
                redrawLine(_cursPosY);
            }
            return true;
        }

        return false;
    }

    /**
     * Aus Widget
     */
    @Override
    protected void focus()
    {
        changeColors();
        drawCursor();
    }

    @Override
    protected void unfocus()
    {
        changeColors();
        redrawOldChar(_cursPosX, _cursPosY, getCharacterAtCursorPosition());

    }

    /**
     * The method sets the cursor position to given koordinates ( within the
     * text, not widget )
     *
     * @param x new x cursor coordinate within the text
     * @param y new y cursor coordinate within the text
     */
    public void setCursorLocation(int x, int y)
    {
        setCursorLocation(x, y, false);
    }

    private void setCursorLocation(int x, int y, boolean pageAlignment)
    {
        if (y < 0)
        {
            _cursPosY = 0;
        } else if (y >= _lines.size())
        {
            _cursPosY = _lines.size() - 1;
        } else
        {
            _cursPosY = y;
        }

        @SuppressWarnings("UnnecessaryUnboxing")
        int length = ((Integer) _lineLengths.get(_cursPosY)).intValue();

        if (x < 0)
        {
            _cursPosX = 0;
        } else if (x >= length)
        {
            _cursPosX = length;
        } else
        {
            _cursPosX = x;
        }

        _cursPosY = (_cursPosY < 0) ? 0 : _cursPosY;

        // first Position
        if (_firstChar > _cursPosX)
        {
            _firstChar = _cursPosX;
        } else if (_firstChar < (_cursPosX - getTextRectangle().getWidth() + 1))
        {
            _firstChar = (_cursPosX - getTextRectangle().getWidth() + 1);
        }

        if (pageAlignment)
        {
            _firstLine = getPageStartIndex(getPageNumber(_cursPosY));
        } else
        {
            if (_firstLine > _cursPosY)
            {
                _firstLine = _cursPosY;
            } else if (_firstLine < (_cursPosY - getTextRectangle().getHeight() + 1))
            {
                _firstLine = (_cursPosY - getTextRectangle().getHeight() + 1);
            }
        }

    }

    private void insertCharAtCursorLocation(char c)
    {
        @SuppressWarnings("UnnecessaryUnboxing")
        int pos = ((Integer) _lines.get(_cursPosY)).intValue() + _cursPosX;
        _text.insert(pos, c);
        updateText();
    }

    private void deleteCharBeforeCursorLocation()
    {
        @SuppressWarnings("UnnecessaryUnboxing")
        int pos = ((Integer) _lines.get(_cursPosY)).intValue() + _cursPosX;
        if (pos > 0)
        {
            _text.deleteCharAt(pos - 1);
        }
        updateText();
    }

    private static String escapeString(String text)
    {
        @SuppressWarnings("StringBufferMayBeStringBuilder")
        StringBuffer buf = new StringBuffer();
        for (int i = 0; i < text.length(); i++)
        {
            char c = text.charAt(i);
            if (c == '\n')
            {
                buf.append("\\n");
            } else if (c == '\r')
            {
                buf.append("\\r");
            } else if (c == '\t')
            {
                buf.append("\\t");
            } else
            {
                buf.append(c);
            }

        }

        return buf.toString();

    }

    //Listener 
    @SuppressWarnings("FieldMayBeFinal")
    private ValueChangedListenerManager _listenerManager = new ValueChangedListenerManager();

    public void addListener(ValueChangedListener listener)
    {
        _listenerManager.addListener(listener);
    }

    public void removeListener(ValueChangedListener listener)
    {
        _listenerManager.removeListener(listener);
    }

}
