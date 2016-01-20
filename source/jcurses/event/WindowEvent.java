package jcurses.event;

import jcurses.widgets.Window;

/**
 * Instances of this class are generated, if the status of a window is modified.
 * for example, if an window is closed.
 */
public class WindowEvent extends Event
{

    private int _type = 0;
    private Window _sourceWindow = null;

    public static final int CLOSED = 0;
    public static final int CLOSING = 1;
    public static final int ACTIVATED = 2;
    public static final int DEACTIVATED = 3;

    /**
     * The constructor
     *
     * @param sourceWindow the affected window
     * @param type the type of the event, must be equal to one of four following
     * constants:
     * <br><code>ACTIVATED</code> - the window has got the focus
     * <br><code>DEACTIVATED</code> - the window has lost the focus
     * <br><code>CLOSE</code> - the window has been closed
     * <br><code>CLOSING</code> - the window has begun the process of closing
     */
    public WindowEvent(Window sourceWindow, int type)
    {
        super(null);
        _sourceWindow = sourceWindow;
        _type = type;
    }

    /**
     * @return the type of the event
     */
    public int getType()
    {
        return _type;
    }

    /**
     * @return the affected window
     */
    public Window getSourceWindow()
    {
        return _sourceWindow;
    }

}
