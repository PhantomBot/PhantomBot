package jcurses.widgets;

import jcurses.event.ActionListenerManager;
import jcurses.event.ActionListener;
import jcurses.event.ActionEvent;

import jcurses.system.CharColor;
import jcurses.system.InputChar;
import jcurses.system.Toolkit;

import jcurses.util.Rectangle;

import java.util.Vector;

/**
 * This class implements a buttton-widget. Such button has a label and is
 * 'clicked' by user typing a special character (default 'enter'). If it is
 * 'clicked', it generates an <code>ActionEvent</code>, that is delegetated to
 * registered listeners.
 */
public class Button extends Widget
{

    private final ActionListenerManager _listenerManager = new ActionListenerManager();

    private static final CharColor __buttonDefaultColors = new CharColor(CharColor.WHITE, CharColor.BLACK);

    @Override
    public CharColor getDefaultColors()
    {
        return __buttonDefaultColors;
    }

    private String _label = null;

    /**
     * Sets button's label
     *
     * @param label buttton's label
     */
    public void setLabel(String label)
    {
        _label = label;

    }

    /**
     * @return button's label
     */
    public String getLabel()
    {
        return _label;
    }

    private static final CharColor __focusedButtonDefaultColors = new CharColor(CharColor.BLUE, CharColor.WHITE, CharColor.REVERSE);
    private CharColor _focusedButtonColors = getFocusedButtonDefaultColors();

    private CharColor getFocusedButtonDefaultColors()
    {
        return __focusedButtonDefaultColors;
    }

    /**
     * @return button's colors, if it is focused
     */
    public CharColor getFocusedButtonColors()
    {
        return _focusedButtonColors;
    }

    /**
     * Sets button's colors in focused state
     *
     * @param colors button's colors, if it is focused
     */
    public void setFocusedButtonColors(CharColor colors)
    {
        _focusedButtonColors = colors;
    }

    private static final CharColor __shortCutDefaultColors = new CharColor(CharColor.WHITE, CharColor.RED);
    private CharColor _shortCutColors = getShortCutDefaultColors();

    private CharColor getShortCutDefaultColors()
    {
        return __shortCutDefaultColors;
    }

    /**
     * @return colors button's shortcut char's colors
     */
    public CharColor getShortCutColors()
    {
        return _shortCutColors;
    }

    /**
     * Sets button's shortcut char's colors. If the button has a shortcut char
     * and this char is contained by the label, than the char within the label
     * will be painted in different colors, set by this method
     *
     * @param colors button's shortcut char's colors
     */
    public void setShortCutColors(CharColor colors)
    {
        _shortCutColors = colors;
    }

    /**
     * The constructor
     *
     * @param label
     */
    public Button(String label)
    {
        _label = label;
    }

    @Override
    protected Rectangle getPreferredSize()
    {
        return new Rectangle(_label.length() + 4, 1);
    }

    @Override
    protected void doPaint()
    {
        Rectangle rect = getRectangle();
        String text = "< " + _label + " >";
        CharColor colors = hasFocus() ? getFocusedButtonColors() : getColors();
        Toolkit.printString(text, rect, colors);
        if (!hasFocus())
        {
            drawShortCutIfNeeded();
        }
    }

    private void drawShortCutIfNeeded()
    {
        InputChar shortCut = getShortCut();
        if (shortCut != null)
        {
            String c = shortCut.toString();
            if (_label != null)
            {
                int index = _label.toLowerCase().indexOf(c.toLowerCase());
                if (index != -1)
                {
                    String c1 = _label.substring(index, index + 1);
                    Toolkit.printString(c1, getAbsoluteX() + index + 2, getAbsoluteY(), getShortCutColors());
                }
            }
        }
    }

    @Override
    @SuppressWarnings("UseOfObsoleteCollectionType")
    protected Vector getShortCutsList()
    {
        if (getShortCut() == null)
        {
            return null;
        }
        Vector result = new Vector();
        result.add(getShortCut());
        return result;
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

    private static final InputChar __actionChar = new InputChar('\n');

    @Override
    protected boolean handleInput(InputChar ch)
    {
        if ((ch.equals(__actionChar))
                || ((getShortCut() != null) && (getShortCut().equals(ch))))
        {
            doAction();
            return true;
        }

        return false;
    }

    private void changeColors()
    {
        CharColor colors = hasFocus() ? getFocusedButtonColors() : getColors();
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
     * Adds a listener to the button.
     *
     * @param listener listener to add
     */
    public void addListener(ActionListener listener)
    {
        _listenerManager.addListener(listener);
    }

    /**
     * Removes a listener from the button.
     *
     * @param listener listener to remove
     */
    public void removeListener(ActionListener listener)
    {
        _listenerManager.removeListener(listener);
    }

    private void doAction()
    {
        _listenerManager.handleEvent(new ActionEvent(this));
    }

    //Shortcut
    private InputChar _shortCut = null;

    /**
     * Set's button's shortcut char. If this shortcut is typed, than the button
     * will handle the char, as described by <code>Widget</code>, and generate
     * an Event as whether the button would be 'clicked'.
     *
     * @param c
     */
    public void setShortCut(char c)
    {
        _shortCut = new InputChar(c);
    }

    private InputChar getShortCut()
    {
        return _shortCut;
    }

}
