package jcurses.widgets;

import jcurses.system.CharColor;
import jcurses.system.Toolkit;
import jcurses.util.Rectangle;

/**
 * This class implements a panel container for widgets. A panel is a rectangle
 * with a specified color to place on it other widgets. Each window has a panel
 * called root panel that serves as root for the widget hierarchy.
 */
public class Panel extends WidgetContainer
{

    public static final int ALIGNMENT_TOP = 0;
    public static final int ALIGNMENT_BOTTOM = 1;
    public static final int ALIGNMENT_LEFT = 0;
    public static final int ALIGNMENT_RIGHT = 1;
    public static final int ALIGNMENT_CENTER = 2;

    private CharColor _colors = getDefaultPanelColors();
    private static CharColor __defaultPanelColors = new CharColor(CharColor.WHITE, CharColor.WHITE);

    private Rectangle _prefSize = null;

    public Panel()
    {
        this(-1, -1);
    }

    /**
     * The constructor
     *
     * @param width preferred width, if -1 is passed , no width is preferred, so
     * the width of the panel depends only on the layout manager of the parent
     * container or on the window width, if this is a root panel.
     * @param height preferred height, if -1 is passed , no height is preferred,
     * so the width of the panel depends only on the layout manager of the
     * parent container or on the window width, if this is a root panel.
     */
    public Panel(int width, int height)
    {
        _prefSize = new Rectangle(width, height);
    }

    @Override
    protected Rectangle getPreferredSize()
    {
        return _prefSize;
    }

    @Override
    protected void paintSelf()
    {
        Rectangle size = getSize();
        size.setLocation(getAbsoluteX(), getAbsoluteY());
        Toolkit.drawRectangle(size, getPanelColors());
    }

    @Override
    protected void repaintSelf()
    {
        paintSelf();
    }

    /**
     * Returns panel colors.
     *
     * @return panel colors
     *
     */
    public CharColor getPanelColors()
    {
        return _colors;
    }

    /**
     * Sets panel colors.
     *
     * @param colors new panel colors
     *
     */
    public void setPanelColors(CharColor colors)
    {
        _colors = colors;
    }

    protected CharColor getDefaultPanelColors()
    {
        return __defaultPanelColors;
    }

    protected Rectangle getPaintingRectangle()
    {
        return getSize();
    }

}
