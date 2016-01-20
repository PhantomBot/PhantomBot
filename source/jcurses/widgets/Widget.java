/**
 * Dies ist die Root-Klasse für alle Widgets.
 */
package jcurses.widgets;

import jcurses.system.CharColor;
import jcurses.system.InputChar;
import jcurses.util.Rectangle;

import java.util.Vector;

/**
 * This class is superclass for all jcurses widgets. For implementing a ne
 * widget you must derive it.
 * 
* An jcurses widget is already used within a window. Its task ist to help it's
 * <code>WidgetContainer</code> to layout itself, giving needed informations, to
 * paint itself and to handle input. Handling input is needed only, if the
 * widget has is an input widget ( examples are text input widget, list widget)
 * and has currently focus, that is is selected by user to handle input. This
 * selectig ocurrs by typing a special key (currenty 'tab') to switch between
 * input widgets.
 * 
* All widgets are ordered in a hierarchy. An widget is already has a container,
 * if it isn't the root pane of a window.
 */
public abstract class Widget
{

    WidgetContainer _parent = null;
    Window _window = null;

    /**
     * @return widget's container
     */
    protected WidgetContainer getParent()
    {
        return _parent;
    }

    /**
     * Sets widget's container. Is called by framework, schouldn't be called
     * writing applications
     *
     * @param parent new container
     */
    protected void setParent(WidgetContainer parent)
    {
        _parent = parent;
    }

    /**
     *  /**
     * Sets widget's window. Is called by framework, schouldn't be called
     * writing applications
     *
     * @param window widget's window
     */
    protected void setWindow(Window window)
    {
        _window = window;
    }

    /**
     * @return widget's window
     */
    protected Window getWindow()
    {
        if (getParent() == null)
        {
            return _window;
        } else
        {
            return getParent().getWindow();
        }
    }

    private int _x = 0;
    private int _y = 0;
    private Rectangle _size;

    /**
     * Sets the x coordinate within the container. Is called by framework,
     * schouldn't be called writing applications
     *
     * @param x x coordinate within the container
     */
    protected void setX(int x)
    {
        _x = x;
    }

    /**
     * @return x coordinate within the container
     */
    protected int getX()
    {
        return _x;
    }

    /**
     * @return x coordinate on the screen
     */
    protected int getAbsoluteX()
    {
        @SuppressWarnings("UnusedAssignment")
        int result = 0;
        if (getParent() == null)
        {
            result = _x;
        } else
        {
            result = _x + getParent().getAbsoluteX();
            if (getParent().getChildsRectangle() != null)
            {
                result = result + getParent().getChildsRectangle().getX();
            }
        }

        return result;
    }

    /**
     * Sets the y coordinate within the container. Is called by framework,
     * schouldn't be called writing applications
     *
     * @param y y coordinate within the container
     */
    protected void setY(int y)
    {
        _y = y;
    }

    /**
     * @return y coordinate within the container
     */
    protected int getY()
    {
        return _y;
    }

    /**
     * @return y coordinate on the screen
     */
    protected int getAbsoluteY()
    {
        @SuppressWarnings("UnusedAssignment")
        int result = 0;
        if (getParent() == null)
        {
            result = _y;
        } else
        {
            result = _y + getParent().getAbsoluteY();
            if (getParent().getChildsRectangle() != null)
            {
                result = result + getParent().getChildsRectangle().getY();
            }
        }

        return result;
    }

    /**
     * Returns the rectangle on the screen, that contains this widget
     *
     * @return the rectangle on the screen, that contains this widget
     */
    protected Rectangle getRectangle()
    {
        Rectangle size = (Rectangle) getSize().clone();
        size.setLocation(getAbsoluteX(), getAbsoluteY());
        return size;
    }

    /**
     * @return widget's size
     */
    protected Rectangle getSize()
    {
        return (Rectangle) _size.clone();
    }

    /**
     * Sets the size of the widget.
     *
     * @param size new size
     */
    protected void setSize(Rectangle size)
    {
        _size = size;

    }

    /**
     * This method gives the widget container the infomation about the preferred
     * size of this widget. Must be implemented by derived classes.
     *
     * @return
     */
    protected abstract Rectangle getPreferredSize();

    /**
     * The method is called by the framework to paint the widget
     */
    protected void paint()
    {
        if (isVisible())
        {
            doPaint();
        }
    }

    /**
     * This method paints the widget. Will be called by <code>paint()</code>,
     * only if the widget is visible. Must be implemented be derived classes.
     */
    protected abstract void doPaint();

    /**
     * The method is called by the framework to repaint the widget
     */
    protected void repaint()
    {
        if (isVisible())
        {
            doRepaint();
        }
    }

    /**
     * This method repaints the widget. Will be called by <code>paint()</code>,
     * only if the widget is visible. Must be implemented be derived classes.
     */
    protected abstract void doRepaint();

    /**
     * The method declares, whether the widget can handle input ( get focus ),
     * that is, whether this is an input widget.
     *
     * @return true, if the widget can handle input, in other case false
     */
    protected boolean isFocusable()
    {
        return false;
    }

    private boolean _focus = false;

    /**
     * @return true, if the widget has currenty focus,that is handles input, in
     * othe case false
     */
    public boolean hasFocus()
    {
        return _focus;
    }

    /**
     * The method switches focus to this widget, if it is focusable at all.
     */
    public void getFocus()
    {
        if (getWindow() != null)
        {
            getWindow().changeFocus(this);
        }
    }

    /**
     * The method is called by framework if focus is switched,that is, either
     * the widget has get or lost focus.
     *
     * @param value true, if the widget has get focus, in other case false
     */
    void setFocus(boolean value)
    {
        _focus = value;
        if (_focus)
        {
            focus();
        } else
        {
            unfocus();
        }
    }

    /**
     * The method is called bei <code>setFocus</code> to tell widget, thas it
     * has get focus. This method schold be overrided bei derived class to react
     * getting focus, for examlple to repaint widget gettig focus.
     */
    protected void focus()
    {

    }

    /**
     * The method is called bei <code>setFocus</code> to tell widget, thas it
     * has lost focus. This method schold be overrided bei derived class to
     * react losing focus, for examlple to repaint widget losing focus.
     */
    protected void unfocus()
    {
    }

    /**
     * The method is called by framework to let the widget handle an input char.
     * Schould be overrided be derived classes, if these can handle input.
     *
     * @param inputChar
     * @return true, if the widget has handled the char, false in other case
     */
    protected boolean handleInput(InputChar inputChar)
    {
        return false;
    }

    /**
     * This method returns a list of short cut chars, that the widget want to
     * handle. If a char from the list is typed by user, it will be handled
     * always my this widget not bei the widget currenty having focus, except
     * the having focus widget handles ALL chars and tells this throuth the
     * method <code>handleAllPrintableChars</code>. To enable shortcuts for a
     * new widget, you must override this method.
     *
     * @return
     */
    @SuppressWarnings("UseOfObsoleteCollectionType")
    protected Vector getShortCutsList()
    {
        return null;
    }

    /**
     * Methoden, die Sichtbarkeit regeln. Ein widget ist dann sichtbar wenn er
     * UND sein Parent sichtbar sind
     */
    private boolean _visible = true;

    /**
     * The method manages visibility
     *
     * @param visible true, if the widget is to make visible, false otherwise.
     */
    public void setVisible(boolean visible)
    {
        _visible = visible;
    }

    /**
     * The method returns true, if the visibility flag of the widget is true.
     * This doesn't mean that the widget ist currently visible, because the
     * parent whole window can be unvisible, use the method
     * <code>isVisible</code> to query the visisbility
     *
     * @return true, if the visibility flag is set, false otherwise
     */
    public boolean getVisible()
    {
        return _visible;
    }

    /**
     * return true, if the widget is currently visible, false otherwise.
     *
     * @return
     */
    public boolean isVisible()
    {
        Widget parent = getParent();
        if ((parent != null) && (!(parent.isVisible())))
        {
            return false;
        }
        Window w = getWindow();
        boolean result = ((_visible) && (w != null) && (w.isVisible()));
        return result;
    }

    private CharColor _colors = null;

    private static final CharColor __defaultColors = new CharColor(CharColor.WHITE, CharColor.WHITE);

    /**
     * @return default colors for this widget. What this mentiones in a concret
     * case, is dependent on the derived class.
     */
    protected CharColor getDefaultColors()
    {
        return __defaultColors;
    }

    /**
     * Set colors of the widget
     *
     * @param colors new colors
     *
     */
    public void setColors(CharColor colors)
    {
        _colors = colors;
    }

    /**
     * @return colors of the widget
     */
    public CharColor getColors()
    {
        return (_colors == null) ? getDefaultColors() : _colors;
    }

}
