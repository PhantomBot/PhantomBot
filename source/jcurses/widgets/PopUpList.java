package jcurses.widgets;

import jcurses.event.ValueChangedListenerManager;
import jcurses.event.ValueChangedListener;
import jcurses.event.ValueChangedEvent;

import jcurses.system.CharColor;
import jcurses.system.InputChar;
import jcurses.system.Toolkit;

import jcurses.util.Rectangle;

import java.util.Vector;

/**
 * This class implements a popup list. Such list has always one of the items
 * selected and gives the possibility to change this selection ( througth an
 * popup menu that is shown, if the user typed 'enter')
 * 
*/
public class PopUpList extends Widget
{

    private int _selectedIndex = -1;
    @SuppressWarnings("UseOfObsoleteCollectionType")
    Vector _items = new Vector();

    private final ValueChangedListenerManager _listenerManager = new ValueChangedListenerManager();

    private static final CharColor __popUpDefaultColors = new CharColor(CharColor.WHITE, CharColor.BLACK);

    @Override
    public CharColor getDefaultColors()
    {
        return __popUpDefaultColors;
    }

    private static final CharColor __focusedPopUpDefaultColors = new CharColor(CharColor.BLUE, CharColor.WHITE, CharColor.REVERSE);
    private CharColor _focusedPopUpColors = getFocusedPopUpDefaultColors();

    private CharColor getFocusedPopUpDefaultColors()
    {
        return __focusedPopUpDefaultColors;
    }

    /**
     * @return colors used to paint the widget, if it has focus
     *
     */
    public CharColor getFocusedPopUpColors()
    {
        return _focusedPopUpColors;
    }

    /**
     * Sets colors used to paint the widget, if it has focus
     *
     * @param colors colors used to paint the widget, if it has focus
     */
    public void setFocusedPopUpColors(CharColor colors)
    {
        _focusedPopUpColors = colors;
    }

    public PopUpList()
    {
    }

    /**
     * Adds an item
     *
     * @param item the item to add
     */
    public void add(String item)
    {
        _items.add(item);
    }

    /**
     * Adds an item at the specified position
     *
     * @param item the item to add
     * @param pos position
     */
    public void add(int pos, String item)
    {
        _items.add(pos, item);
    }

    /**
     * Removes the first ocuurence of the specified item
     *
     * @param item item to be removed
     *
     */
    public void remove(String item)
    {
        _items.remove(item);
    }

    /**
     * Removes the item at the specified position
     *
     * @param pos position
     */
    public void remove(int pos)
    {
        _items.remove(pos);
    }

    /**
     * Clears the item list
     */
    public void clear()
    {
        _items.clear();
    }

    /**
     * Returns the currently selected index
     *
     * @return currently selected index
     */
    public int getSelectedIndex()
    {
        if (_selectedIndex != -1)
        {
            return _selectedIndex;
        } else
        {
            if (_items.size() > 0)
            {
                return 0;
            } else
            {
                return -1;
            }
        }
    }

    /**
     * Returns the currently selected item
     *
     * @return currently selected item
     */
    public String getSelectedItem()
    {
        if (getSelectedIndex() >= 0)
        {
            return (String) _items.elementAt(getSelectedIndex());
        } else
        {
            return null;
        }
    }

    @Override
    protected Rectangle getPreferredSize()
    {
        return new Rectangle(2 + getMaxLength(), 1);
    }

    private int getMaxLength()
    {
        int result = 0;
        for (int i = 0; i < _items.size(); i++)
        {
            String item = (String) _items.elementAt(i);
            if (item.length() > result)
            {
                result = item.length();
            }
        }

        return result;
    }

    private String getText()
    {
        @SuppressWarnings("UnusedAssignment")
        String result = null;
        int length = getSize().getWidth() - 2;
        String item = (getSelectedItem() == null) ? "" : getSelectedItem();
        if (item.length() > length)
        {
            result = item.substring(0, length);
        } else
        {
            @SuppressWarnings("StringBufferMayBeStringBuilder")
            StringBuffer buf = new StringBuffer();
            buf.append(item);
            for (int i = 0; i < (length - item.length()); i++)
            {
                buf.append(' ');
            }
            result = buf.toString();
        }

        return result;
    }

    @Override
    protected void doPaint()
    {
        Rectangle rect = (Rectangle) getSize().clone();
        rect.setLocation(getAbsoluteX(), getAbsoluteY());
        String text = "[" + getText() + "]";
        CharColor colors = hasFocus() ? getFocusedPopUpColors() : getColors();
        Toolkit.printString(text, rect, colors);
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

    private static final InputChar __changeValueChar = new InputChar('\n');

    @Override
    protected boolean handleInput(InputChar ch)
    {
        if (ch.equals(__changeValueChar))
        {
            if (_items.size() > 2)
            {
                PopUpMenu menu = new PopUpMenu(getAbsoluteX(), getAbsoluteY(), null);
                for (int i = 0; i < _items.size(); i++)
                {
                    menu.add((String) _items.elementAt(i));
                }
                menu.show();
                if ((menu.getSelectedIndex() != -1) && (menu.getSelectedIndex() != getSelectedIndex()))
                {
                    _selectedIndex = menu.getSelectedIndex();
                    paint();
                    _listenerManager.handleEvent(new ValueChangedEvent(this));

                }
            }

            return true;
        }

        return false;
    }

    @Override
    protected void focus()
    {
        paint();
    }

    @Override
    protected void unfocus()
    {
        paint();
    }

    /**
     * Adds a listener to register selected value changes
     *
     * @param listener
     */
    public void addListener(ValueChangedListener listener)
    {
        _listenerManager.addListener(listener);
    }

    /**
     * Removes a listener
     *
     * @param listener
     */
    public void removeListener(ValueChangedListener listener)
    {
        _listenerManager.removeListener(listener);
    }

}
