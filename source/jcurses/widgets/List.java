/**
 * This class implements a list widget to select and 'invoke' one ore more
 * items. Listeners can be registered to track selecting deselecting and
 * 'invoking' of items.
 */
package jcurses.widgets;

import java.util.Vector;

import jcurses.event.ItemListenerManager;
import jcurses.event.ItemListener;
import jcurses.event.ItemEvent;

import jcurses.system.CharColor;
import jcurses.system.InputChar;
import jcurses.system.Toolkit;

import jcurses.util.Rectangle;

import jcurses.util.Paging;

public class List extends Widget implements IScrollable
{

    private int _visibleSize = -1;
    private boolean _multiple = false;

    @SuppressWarnings(
            {
                "FieldMayBeFinal", "UseOfObsoleteCollectionType"
            })
    private Vector _items = new Vector();
    @SuppressWarnings(
            {
                "UseOfObsoleteCollectionType", "FieldMayBeFinal"
            })
    private Vector _selected = new Vector();

    private int _startIndex = 0;
    private int _trackedIndex = 0;
    private int _startPos = 0;

    private boolean _selectable = true;

    private String _title = null;

    @SuppressWarnings("FieldMayBeFinal")
    private ItemListenerManager _listenerManager = new ItemListenerManager();

    private static CharColor __listDefaultColors = new CharColor(CharColor.WHITE, CharColor.BLACK);

    private ScrollbarPainter _scrollbars = null;

    /**
     * The constructor
     *
     * @param visibleSize number of visible items. If the entire number of items
     * is more, the widget scrolls items 'by a window'. If -1 is given, than the
     * visible size is defined dependent of the layout size, that is, the widget
     * has no preferred y size.
     * @param multiple true, if more as one items can be selected a time, false,
     * if only one item can be selected at a time, in this case selecting of an
     * item causes deselecting of the previous selected item.
     */
    public List(int visibleSize, boolean multiple)
    {
        _visibleSize = visibleSize;
        _multiple = multiple;
        _scrollbars = new ScrollbarPainter(this);
    }

    /**
     * The constructor.
     *
     * @param visibleSize number of visible items. If the entire number of items
     * is more, the widget scrolls items 'by a window'. If -1 is given, than the
     * visible size is defined dependent of the layout size, that is, the widget
     * has no preferred y size.
     *
     */
    public List(int visibleSize)
    {
        this(visibleSize, false);
    }

    /**
     * The constructor
     */
    public List()
    {
        this(-1, false);
    }

    @Override
    public CharColor getDefaultColors()
    {
        return __listDefaultColors;
    }

    private static CharColor __selectedItemDefaultColors = new CharColor(CharColor.BLUE, CharColor.WHITE, CharColor.REVERSE);
    private CharColor _selectedItemColors = getSelectedItemDefaultColors();

    private CharColor getSelectedItemDefaultColors()
    {
        return __selectedItemDefaultColors;
    }

    /**
     * @return colors used painting selected items.
     */
    public CharColor getSelectedItemColors()
    {
        return _selectedItemColors;
    }

    /**
     * Sets colors used painting selected items.
     *
     * @param colors colors used painting selected items
     */
    public void setSelectedItemColors(CharColor colors)
    {
        _selectedItemColors = colors;
    }

    private static CharColor __titleDefaultColors = new CharColor(CharColor.WHITE, CharColor.RED, CharColor.BOLD);
    private CharColor _titleColors = getTitleDefaultColors();

    private CharColor getTitleDefaultColors()
    {
        return __titleDefaultColors;
    }

    /**
     * @return colors used painting the title
     */
    public CharColor getTitleColors()
    {
        return _titleColors;
    }

    /**
     * Sets colors used painting the title
     *
     * @param colors colors used painting the title
     */
    public void setTitleColors(CharColor colors)
    {
        _titleColors = colors;
    }

    /**
     * @return list's title
     */
    public String getTitle()
    {
        return _title;
    }

    /**
     * Sets the title of the list.
     *
     * @param title the title of the list
     */
    public void setTitle(String title)
    {
        _title = title;
    }

    private void drawTitle()
    {
        @SuppressWarnings("UnusedAssignment")
        String text = null;
        if (_title != null)
        {
            text = (_title.length() > (getSize().getWidth() - 2)) ? _title.substring(0, (getSize().getWidth() - 2)) : _title;
            Toolkit.printString(text, getAbsoluteX() + (getSize().getWidth() - text.length()) / 2, getAbsoluteY(), getTitleColors());
        }
    }

    /**
     * Adds an item to the list at the specified position
     *
     * @param pos the position to insert the item
     * @param item item to add
     */
    @SuppressWarnings(
            {
                "UnnecessaryBoxing", "BooleanConstructorCall"
            })
    public void add(int pos, String item)
    {
        _items.add(pos, item);
        _selected.add(pos, new Boolean(false));
        reset();
    }

    /**
     * Adds an item to the end of the list
     *
     * @param item item to add
     */
    public void add(String item)
    {
        add(_items.size(), item);
    }

    /**
     * @return number of items
     */
    public int getItemsCount()
    {
        return _items.size();
    }

    /**
     * @param index specified position
     * @return item at the specified position
     */
    public String getItem(int index)
    {
        return (String) _items.elementAt(index);
    }

    /**
     * Removes an item from the list at the specified position
     *
     * @param pos position
     */
    public void remove(int pos)
    {
        _items.remove(pos);
        _selected.remove(pos);
        reset();
    }

    /**
     * Removes the first occurence of <code>item</code> from the list.
     *
     * @param item string, whose first occurence is to remove from the list.
     */
    public void remove(String item)
    {
        int index = _items.indexOf(item);
        if (index != -1)
        {
            _items.remove(index);
            _selected.remove(index);
        }

    }

    private void dispatchEvent(int index, boolean value)
    {
        ItemEvent event = new ItemEvent(this, index, _items.elementAt(index),
                value ? ItemEvent.SELECTED : ItemEvent.DESELECTED);
        _listenerManager.handleEvent(event);
    }

    @SuppressWarnings(
            {
                "UnnecessaryBoxing", "BooleanConstructorCall"
            })
    private void select(int index, boolean value)
    {

        if (!(isSelected(index) == value))
        {
            int selected = getSelectedIndex();
            _selected.set(index, new Boolean(value));
            if ((!_multiple) && value)
            {
                if (selected != -1)
                {
                    deselect(selected);
                }
            }
        }

    }

    private void redrawItemBySelecting(int index)
    {
        if (!((index == _trackedIndex) && hasFocus()))
        {
            redrawItem(index, getRectangle());
        }
    }

    /**
     * Selects an item at the specified position
     *
     * @param index position
     */
    public void select(int index)
    {
        select(index, true);
        if (isVisible())
        {
            redrawItemBySelecting(index);
        }
        dispatchEvent(index, true);
    }

    /**
     * Deselects an item at the specified position
     *
     * @param index position
     */
    public void deselect(int index)
    {
        select(index, false);
        if (isVisible())
        {
            redrawItemBySelecting(index);
        }
        dispatchEvent(index, false);
    }

    /**
     * @param pos the position to test, whether selected
     * @return true, if the item at the specified position is selected, false
     * otherwise
     *
     *
     */
    @SuppressWarnings("UnnecessaryUnboxing")
    public boolean isSelected(int pos)
    {
        return ((Boolean) _selected.elementAt(pos)).booleanValue();
    }

    /**
     * @return items, contained in the list
     */
    @SuppressWarnings("UseOfObsoleteCollectionType")
    public Vector getItems()
    {
        return (Vector) _items.clone();
    }

    /**
     * @return all selected items, contained in the list
     */
    @SuppressWarnings("UseOfObsoleteCollectionType")
    public Vector getSelectedItems()
    {
        Vector result = new Vector();
        for (int i = 0; i < _items.size(); i++)
        {
            boolean selected = isSelected(i);
            if (selected)
            {
                result.add(_items.elementAt(i));
            }
        }

        return result;
    }

    /**
     * @return indexes of all selected items, contained in the list
     */
    public int[] getSelectedIndexes()
    {
        int size = 0;
        for (int i = 0; i < _items.size(); i++)
        {
            boolean selected = isSelected(i);
            if (selected)
            {
                size++;
            }
        }

        int[] result = new int[size];
        int currentIndex = 0;
        for (int i = 0; i < _items.size(); i++)
        {
            boolean selected = isSelected(i);
            if (selected)
            {
                result[currentIndex] = i;
                currentIndex++;
            }
        }

        return result;
    }

    /**
     * @return the selected item, if only one item is selected,
     * <code>null</code> otherwise.
     */
    public String getSelectedItem()
    {
        @SuppressWarnings("UseOfObsoleteCollectionType")
        Vector results = getSelectedItems();
        String result = null;
        if (results.size() == 1)
        {
            result = (String) results.elementAt(0);
        }

        return result;
    }

    /**
     * @return index of the selected item, if only one item is selected,
     * <code>null</code> otherwise.
     */
    public int getSelectedIndex()
    {
        int[] results = getSelectedIndexes();
        int result = -1;
        if (results.length == 1)
        {
            result = results[0];
        }

        return result;
    }

    /**
     * Removes all items from the list
     */
    public void clear()
    {
        _items.clear();
        _selected.clear();
        reset();
    }

    @Override
    protected Rectangle getPreferredSize()
    {
        return new Rectangle(-1, (_visibleSize < 0) ? -1 : _visibleSize + 2);
    }

    private int getVisibleSize()
    {
        return getSize().getHeight() - 2;
    }

    private int getMaximumStartIndex()
    {
        return (_items.size() < getVisibleSize()) ? 0 : (_items.size() - getVisibleSize());
    }

    @SuppressWarnings("SizeReplaceableByIsEmpty")
    private boolean isVisible(int index)
    {
        if (_items.size() == 0)
        {
            return false;
        } else
        {
            return ((index >= _startIndex) && (index < _startIndex + getVisibleSize()));
        }
    }

    private boolean findNextSelectableItem(int pos, int searchDirection, boolean onlySearchDirection, int stepping)
    {
        if (getItemsCount() == 0)
        {
            return false;
        }
        int page = getPageNumber(pos);
        int start = getPageStartIndex(page);
        int end = getPageEndIndex(page);
        boolean found = false;
        if (isSelectable(pos))
        {
            found = true;
        } else
        {
            int searchPos = pos;
            while ((searchPos <= end) && (searchPos >= start) && (!found))
            {
                searchPos += searchDirection;
                found = isSelectable(searchPos);
            }
            if (!found && !onlySearchDirection)
            {
                searchPos = pos;
                while ((searchPos <= end) && (searchPos >= start) && (!found))
                {
                    searchPos -= searchDirection;
                    found = isSelectable(searchPos);
                }
            }
            pos = searchPos;
        }

        if (found)
        {
            if (stepping == 0)
            {
                _startIndex = start;
            } else if (stepping == -1)
            {
                if (!isVisible(pos))
                {
                    _startIndex = pos;
                }
            } else
            {
                if (!isVisible(pos))
                {
                    _startIndex = Math.max(0, pos - getVisibleSize() + 1);
                }
            }
            _trackedIndex = pos;
        }

        return found;

    }

    private boolean incrementTrack()
    {
        boolean found = false;
        if (_trackedIndex < (getItemsCount() - 1))
        {
            found = findNextSelectableItem(_trackedIndex + 1, 1, true, 1);
        }
        return found;
    }

    private Paging getPaging()
    {
        return new Paging(getVisibleSize(), getItemsCount());
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
        return getPageNumber(_trackedIndex);
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
        return getPaging().getPageOffset(_trackedIndex);
    }

    private boolean incrementPage()
    {
        @SuppressWarnings("UnusedAssignment")
        int nextPos = 0;
        if (getCurrentPageNumber() < (getPageSize() - 1))
        {
            nextPos = getPaging().getIndexByPageOffset(getCurrentPageNumber() + 1, getCurrentPageOffset());
        } else
        {
            nextPos = getItemsCount() - 1;
        }

        return findNextSelectableItem(nextPos, 1, false, 0);

    }

    private boolean decrementPage()
    {
        @SuppressWarnings("UnusedAssignment")
        int nextPos = 0;
        if (getCurrentPageNumber() > 0)
        {
            nextPos = getPaging().getIndexByPageOffset(getCurrentPageNumber() - 1, getCurrentPageOffset());
        } else
        {
            nextPos = 0;
        }

        return findNextSelectableItem(nextPos, -1, false, 0);
    }

    /**
     * Gets the currently tracked item (i.e. where the 'cursor' line is when the
     * user is navigating the list).
     *
     * @return the index of the current tracked item.
     */
    public int getTrackedItem()
    {
        return _trackedIndex;
    }

    /**
     * Sets the currently tracked item (i.e. where the 'cursor' line is when the
     * user is navigating the list).
     *
     * @param pos the index of the current tracked item.
     * @exception IllegalArgumentException if pos is out of range.
     */
    public void setTrackedItem(int pos)
    {
        if (pos < 0 || pos >= getItemsCount())
        {
            throw new IllegalArgumentException("pos must be in the range: 0," + (getItemsCount() - 1));
        }
        int backupStartIndex = _startIndex;
        int backupTrackedIndex = _trackedIndex;
        if (setTrack(pos))
        {
            redraw((backupStartIndex == _startIndex), _trackedIndex, backupTrackedIndex);
        }
    }

    protected boolean setTrack(int pos)
    {
        return findNextSelectableItem(pos, 1, false, 0);
    }

    private boolean decrementTrack()
    {

        boolean found = false;
        if (_trackedIndex > 0)
        {
            found = findNextSelectableItem(_trackedIndex - 1, -1, true, -1);
        }
        return found;
    }

    private void reset()
    {
        _startIndex = 0;
        _trackedIndex = 0;
        _startPos = 0;
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

    private int getMaxStartPos()
    {
        Rectangle rect = (Rectangle) getSize().clone();
        int width = rect.getWidth() - 2;
        int result = getMaxLength() - width;
        result = (result < 0) ? 0 : result;

        return result;

    }

    private boolean incrementStartPos()
    {
        if (_startPos < getMaxStartPos())
        {
            _startPos++;
            return true;
        }

        return false;
    }

    private boolean decrementStartPos()
    {
        if (_startPos > 0)
        {
            _startPos--;
            return true;
        }

        return false;
    }

    /**
     * Sets, whether items can be selected at all
     *
     * @param value true, if items can be selected, false otherwise ( in this
     * case items can only be 'invoked')
     */
    public void setSelectable(boolean value)
    {
        _selectable = value;
    }

    /**
     * Sets, whether items can be selected at all
     *
     * @return true, if items can be selected, false otherwise ( in this case
     * items can only be 'invoked')
     */
    public boolean getSelectable()
    {
        return _selectable;
    }

    /**
     * This method tests, if the item at the specified position can be selected
     * and invoked at all. The sense is, to give derived classes the
     * posssibility to implement 'separators'. Here returns always
     * <code>true</code>.
     *
     * @param i the position to test
     * @return true if the item at the specified position can be selected and
     * invoked, false otherwise
     */
    protected boolean isSelectable(int i)
    {
        return true;
    }

    private void drawRectangle()
    {
        Rectangle rect = (Rectangle) getSize().clone();
        rect.setWidth(rect.getWidth() - 2);
        rect.setHeight(rect.getHeight() - 2);
        rect.setLocation(getAbsoluteX() + 1, getAbsoluteY() + 1);
        Toolkit.drawRectangle(rect, getColors());
    }

    @SuppressWarnings("SizeReplaceableByIsEmpty")
    private void drawItems()
    {
        Rectangle rect = (Rectangle) getSize().clone();
        rect.setLocation(getAbsoluteX(), getAbsoluteY());
        for (int i = 0; i < getVisibleSize(); i++)
        {
            int index = _startIndex + i;
            if (index < _items.size())
            {
                printItem(index, rect);
            } else
            {
                Toolkit.drawRectangle(new Rectangle(rect.getX() + 1, rect.getY() + i + 1, rect.getWidth() - 2, 1), getColors());
            }
        }
        if (_items.size() == 0)
        {
            drawFirstRowSelected();
        }
    }

    @Override
    protected void doPaint()
    {
        Rectangle rect = (Rectangle) getSize().clone();
        rect.setLocation(getAbsoluteX(), getAbsoluteY());
        Toolkit.drawBorder(rect, getColors());
        drawTitle();
        _scrollbars.paint();
        drawRectangle();
        drawItems();
    }

    private void refresh()
    {
        _scrollbars.refresh();
        drawRectangle();
        drawItems();

    }

    private void drawFirstRowSelected()
    {
        if (hasFocus())
        {
            Toolkit.drawRectangle(getAbsoluteX() + 1, getAbsoluteY() + 1, getSize().getWidth() - 2, 1, getSelectedItemColors());
        }
    }

    private void redrawItem(int index, Rectangle rect)
    {
        int x = rect.getX() + 1;
        int y = rect.getY() + 1 + index - _startIndex;
        int width = rect.getWidth() - 2;
        Rectangle itemRect = new Rectangle(x, y, width, 1);
        boolean toSelect = (((index == _trackedIndex) && hasFocus())
                || (isSelected(index)));
        CharColor colors = toSelect ? getSelectedItemColors() : getColors();
        Toolkit.changeColors(itemRect, colors);

    }

    private void redrawSelectedItems()
    {
        for (int i = 0; i < getVisibleSize(); i++)
        {
            int index = _startIndex + i;
            if (index < _items.size())
            {
                boolean toSelect = ((index == _trackedIndex)
                        || (isSelected(index)));
                if (toSelect)
                {
                    redrawItem(index, getRectangle());
                }

            }
        }
    }

    private void printItem(int index, Rectangle rect)
    {
        int x = rect.getX() + 1;
        int y = rect.getY() + 1 + index - _startIndex;
        int width = rect.getWidth() - 2;
        boolean toSelect = (((index == _trackedIndex) && hasFocus())
                || (isSelected(index)));

        CharColor colors = toSelect ? getSelectedItemColors() : getColors();

        String item = getItemRepresentation((String) _items.elementAt(index));
        if (item.length() < (_startPos + 1))
        {
            item = "";
        } else
        {
            if (_startPos != 0)
            {
                item = item.substring(_startPos, item.length());
            }
        }

        if ((item.length() < width) && (toSelect))
        {
            @SuppressWarnings("StringBufferMayBeStringBuilder")
            StringBuffer itemBuffer = new StringBuffer();
            itemBuffer.append(item);
            for (int i = 0; i < (width - item.length()); i++)
            {
                itemBuffer.append(' ');
            }
            item = itemBuffer.toString();
        }
        Toolkit.printString(item, x, y, width, 1, colors);

    }

    /**
     * The method returns the display representation of the string und is called
     * by the widget before it paints an item. The idea is to make it possible
     * in derived classes to paint other strings as managed in the widget. Here
     * returns always the same string as <code>item</code>
     *
     * @param item string to give display representation
     * @return display representation of the string
     */
    protected String getItemRepresentation(String item)
    {
        return item;
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

    private static InputChar __changeStatusChar = new InputChar(' ');
    private static InputChar __callItemChar = new InputChar('\n');

    protected InputChar getChangeStatusChar()
    {
        return __changeStatusChar;
    }

    private void callItem(int index)
    {
        ItemEvent event = new ItemEvent(this, index, _items.elementAt(index), ItemEvent.CALLED);
        _listenerManager.handleEvent(event);
    }

    private void redraw(boolean flag, int trackedIndex, int backupTrackedIndex)
    {
        if (flag)
        {
            redrawItem(trackedIndex, getRectangle());
            redrawItem(backupTrackedIndex, getRectangle());
        } else
        {
            paint();
        }
    }

    @Override
    @SuppressWarnings("SizeReplaceableByIsEmpty")
    protected boolean handleInput(InputChar ch)
    {

        int backupStartIndex = _startIndex;
        int backupTrackedIndex = _trackedIndex;
        // Keine Items - keine Eingabe
        if (_items.size() == 0)
        {
            return false;
        }

        if (ch.getCode() == InputChar.KEY_RIGHT)
        {
            if (incrementStartPos())
            {
                refresh();
            }
            return true;
        } else if (ch.getCode() == InputChar.KEY_LEFT)
        {
            if (decrementStartPos())
            {
                refresh();
            }
            return true;
        } else if (ch.getCode() == InputChar.KEY_UP)
        {
            if (decrementTrack())
            {
                redraw((backupStartIndex == _startIndex), _trackedIndex, backupTrackedIndex);
            }
            return true;
        } else if (ch.getCode() == InputChar.KEY_DOWN)
        {
            if (incrementTrack())
            {
                redraw((backupStartIndex == _startIndex), _trackedIndex, backupTrackedIndex);
            }
            return true;
        } else if (ch.getCode() == InputChar.KEY_HOME)
        {
            if (setTrack(0))
            {
                redraw((backupStartIndex == _startIndex), _trackedIndex, backupTrackedIndex);
            }
            return true;
        } else if (ch.getCode() == InputChar.KEY_END)
        {
            if (setTrack(getItemsCount() - 1))
            {
                redraw((backupStartIndex == _startIndex), _trackedIndex, backupTrackedIndex);
            }
            return true;
        } else if (ch.getCode() == InputChar.KEY_NPAGE)
        {
            if (incrementPage())
            {
                redraw((backupStartIndex == _startIndex), _trackedIndex, backupTrackedIndex);
            }
            return true;
        } else if (ch.getCode() == InputChar.KEY_PPAGE)
        {
            if (decrementPage())
            {
                redraw((backupStartIndex == _startIndex), _trackedIndex, backupTrackedIndex);
            }
            return true;
        } else if (ch.equals(__changeStatusChar) && getSelectable())
        {
            if (isSelected(_trackedIndex))
            {
                deselect(_trackedIndex);
            } else
            {
                select(_trackedIndex);
            }
            return true;
        } else if (ch.equals(__callItemChar))
        {
            callItem(_trackedIndex);
            return true;
        }

        return false;
    }

    @Override
    protected void focus()
    {
        redrawSelectedItems();
    }

    @Override
    protected void unfocus()
    {
        redrawSelectedItems();
    }

    /**
     * Adds a listener to the widget
     *
     * @param listener listener to add
     */
    public void addListener(ItemListener listener)
    {
        _listenerManager.addListener(listener);
    }

    /**
     * Removes a listener from the widget
     *
     * @param listener listener to remove
     */
    public void removeListener(ItemListener listener)
    {
        _listenerManager.removeListener(listener);
    }

    //Scrollbars
    @Override
    public boolean hasHorizontalScrollbar()
    {
        return true;
    }

    @Override
    public boolean hasVerticalScrollbar()
    {
        return true;
    }

    @Override
    public Rectangle getBorderRectangle()
    {
        Rectangle rect = (Rectangle) getSize().clone();
        rect.setLocation(getAbsoluteX(), getAbsoluteY());
        return rect;
    }

    private int getWidth()
    {
        return (getSize().getWidth() - 2);
    }

    @Override
    @SuppressWarnings("SizeReplaceableByIsEmpty")
    public float getHorizontalScrollbarOffset()
    {
        if ((_items.size() == 0) || (getMaxLength() <= getWidth()))
        {
            // Keine Items - kein scrollbar
            return 0;
        }
        if (getMaxLength() > getWidth())
        {
            return ((float) _startPos) / ((float) getMaxLength());
        } else
        {
            return 0;
        }
    }

    @Override
    @SuppressWarnings("SizeReplaceableByIsEmpty")
    public float getHorizontalScrollbarLength()
    {
        if ((_items.size() == 0) || (getMaxLength() <= getWidth()))
        {
            // Keine Items - kein scrollbar
            return 0;
        }
        if (getMaxLength() > getWidth())
        {
            return ((float) getWidth()) / ((float) getMaxLength());
        } else
        {
            return 0;
        }
    }

    @Override
    @SuppressWarnings("SizeReplaceableByIsEmpty")
    public float getVerticalScrollbarOffset()
    {
        if (_items.size() == 0)
        {
            // Keine Items - kein scrollbar
            return 0;
        }

        if (_items.size() > getVisibleSize())
        {
            return ((float) _startIndex) / ((float) _items.size());
        } else
        {
            return 0;
        }
    }

    @Override
    @SuppressWarnings("SizeReplaceableByIsEmpty")
    public float getVerticalScrollbarLength()
    {
        if (_items.size() == 0)
        {
            // Keine Items - kein scrollbar
            return 0;
        }

        if (_items.size() > getVisibleSize())
        {
            return ((float) getVisibleSize()) / ((float) _items.size());
        } else
        {
            return 0;
        }
    }

    @Override
    public CharColor getBorderColors()
    {
        return getColors();
    }

    @Override
    public CharColor getScrollbarColors()
    {
        CharColor colors = new CharColor(getColors().getForeground(), getColors().getBackground());
        colors.setBlackWhiteAttribute((colors.getBlackWhiteAttribute() == CharColor.REVERSE) ? CharColor.NORMAL : CharColor.REVERSE);
        return colors;
    }

}
