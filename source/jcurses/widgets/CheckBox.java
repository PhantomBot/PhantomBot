package jcurses.widgets;

import jcurses.event.ValueChangedListenerManager;
import jcurses.event.ValueChangedListener;
import jcurses.event.ValueChangedEvent;

import jcurses.system.CharColor;
import jcurses.system.InputChar;
import jcurses.system.Toolkit;

import jcurses.util.Rectangle;

/**
 * This class implements a checkbox widget. This checkboxes state is modified by
 * typing a special char (default 'space'). You can register listeners by this
 * widget to track state changes.
 */
public class CheckBox extends Widget
{

    private boolean _checked = false;

    @SuppressWarnings("FieldMayBeFinal")
    private ValueChangedListenerManager _listenerManager = new ValueChangedListenerManager();

    private static CharColor __checkBoxDefaultColors = new CharColor(CharColor.WHITE, CharColor.BLACK);

    @Override
    public CharColor getDefaultColors()
    {
        return __checkBoxDefaultColors;
    }

    private static CharColor __focusedCheckBoxDefaultColors = new CharColor(CharColor.BLUE, CharColor.WHITE, CharColor.REVERSE);
    private CharColor _focusedCheckboxColors = getFocusedCheckboxDefaultColors();

    private CharColor getFocusedCheckboxDefaultColors()
    {
        return __focusedCheckBoxDefaultColors;
    }

    /**
     * @return checkboxes colors, if it is focused
     */
    public CharColor getFocusedCheckboxColors()
    {
        return _focusedCheckboxColors;
    }

    /**
     * Sets colors of the checkbox in focused state.
     *
     * @param colors checkboxes colors, if it is focused
     */
    public void setFocusedCheckboxColors(CharColor colors)
    {
        _focusedCheckboxColors = colors;
    }

    /**
     * The constructor.
     *
     * @param checked true, if the checkbox is checked at first time, false
     * otherwise
     */
    public CheckBox(boolean checked)
    {
        _checked = checked;
    }

    /**
     * The constructor creates an unchecked checkbox
     */
    public CheckBox()
    {
        this(false);

    }

    /**
     * @return true, if the checkbox is checked , false otherwise
     */
    public boolean getValue()
    {
        return _checked;
    }

    /**
     * Sets checkboxes value
     *
     * @param value if the checkbox becomes checked , false otherwise
     */
    public void setValue(boolean value)
    {
        boolean oldValue = _checked;
        _checked = value;
        if (oldValue != _checked)
        {
            _listenerManager.handleEvent(new ValueChangedEvent(this));
        }
        paint();
    }

    @Override
    protected Rectangle getPreferredSize()
    {
        return new Rectangle(3, 1);
    }

    @Override
    protected void doPaint()
    {
        Rectangle rect = (Rectangle) getSize().clone();
        rect.setLocation(getAbsoluteX(), getAbsoluteY());
        String text = "[" + ((_checked) ? "X" : " ") + "]";
        CharColor colors = hasFocus() ? getFocusedCheckboxColors() : getColors();
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

    private static InputChar __changeStatusChar = new InputChar(' ');

    @Override
    protected boolean handleInput(InputChar ch)
    {
        if (ch.equals(__changeStatusChar))
        {
            setValue(!(_checked));
            paint();
            return true;
        }

        return false;
    }

    private void changeColors()
    {
        CharColor colors = hasFocus() ? getFocusedCheckboxColors() : getColors();
        Toolkit.changeColors(getRectangle(), colors);
    }

    @Override
    protected void focus()
    {
        changeColors();
    }

    @Override
    protected void unfocus()
    {
        changeColors();
    }

    /**
     * Adds listener to the checkbox to track states changes
     *
     * @param listener listener to add
     */
    public void addListener(ValueChangedListener listener)
    {
        _listenerManager.addListener(listener);
    }

    /**
     * Removes listener from the checkbox
     *
     * @param listener to remove
     */
    public void removeListener(ValueChangedListener listener)
    {
        _listenerManager.removeListener(listener);
    }

}
