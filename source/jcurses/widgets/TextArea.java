package jcurses.widgets;

import jcurses.system.CharColor;
import jcurses.system.Toolkit;
import jcurses.util.Rectangle;

/**
 * This class implements a text area to edit a text with meny lines
 */
public class TextArea extends TextComponent implements IScrollable
{

    private ScrollbarPainter _scrollbars = null;

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
    public TextArea(int width, int height, String text)
    {
        super(width, height, text);
        _scrollbars = new ScrollbarPainter(this);
    }

    /**
     * The constructor
     *
     * @param width the preferred width of the component. If -1 is stated, there
     * is no preferred width and the component is layouted dependend on the
     * container and the text
     * @param height the preferred height of the component. If -1 is stated,
     * there is no preferred width and the component is layouted dependend on
     * the container.
     *
     */
    public TextArea(int width, int height)
    {
        this(width, height, null);
    }

    /**
     * Constructor without arguments
     */
    public TextArea()
    {
        this(-1, -1);
    }

    private static CharColor __borderDefaultColors = new CharColor(CharColor.WHITE, CharColor.BLACK, CharColor.NORMAL);

    private CharColor _borderColors = getBorderDefaultColors();

    public CharColor getBorderDefaultColors()
    {
        return __borderDefaultColors;
    }

    @Override
    public CharColor getBorderColors()
    {
        return _borderColors;
    }

    public void setBorderColors(CharColor colors)
    {
        _borderColors = colors;
    }

    private static CharColor __scrollbarDefaultColors = new CharColor(CharColor.BLACK, CharColor.WHITE, CharColor.REVERSE);

    private CharColor _scrollbarColors = getScrollbarDefaultColors();

    public CharColor getScrollbarDefaultColors()
    {
        return __scrollbarDefaultColors;
    }

    @Override
    public CharColor getScrollbarColors()
    {
        return _scrollbarColors;
    }

    public void setScrollbarColors(CharColor colors)
    {
        _scrollbarColors = colors;
    }

    @Override
    protected Rectangle getTextRectangle()
    {
        Rectangle result = (Rectangle) getSize().clone();
        result.setLocation(getAbsoluteX() + 1, getAbsoluteY() + 1);
        result.setWidth(result.getWidth() - 2);
        result.setHeight(result.getHeight() - 2);

        return result;
    }

    @Override
    protected void doPaint()
    {
        super.doPaint();
        Toolkit.drawBorder(getBorderRectangle(), getBorderColors());
        drawAdditionalThings();

    }

    @Override
    protected void drawAdditionalThings()
    {
        _scrollbars.paint();
    }

    @Override
    protected void refreshAdditionalThings()
    {
        _scrollbars.refresh();
    }

    @Override
    protected Rectangle getPreferredSize()
    {
        return new Rectangle(getWidth(), getHeight());
    }

    //Scrollbars
    /*
     * private void drawVerticalScrollbar() { Rectangle rect =
     * (Rectangle)getSize().clone(); rect.setLocation(getAbsoluteX(),
     * getAbsoluteY());
     *
     * int visibleTextWidth = rect.getWidth()-2; int visibleTextHeight =
     * rect.getHeight()-2;
     *
     * if ((getTextHeight()>0) &&(getTextHeight() > visibleTextHeight)) { float
     * firstPart = ((float)getTextY())/((float)getTextHeight()); float lastPart
     * =
     * ((float)(getTextHeight()-visibleTextHeight-getTextY()))/((float)getTextHeight());
     * ScrollbarUtils.drawScrollBar(rect.getY()+1,rect.getY()+rect.getHeight()-2,
     * rect.getX()+rect.getWidth()-1, firstPart, lastPart,
     * ScrollbarUtils.VERTICAL); }
     *
     *
     *
     * }
     *
     *
     * private void drawHorizontalScrollbar() { Rectangle rect =
     * (Rectangle)getSize().clone(); rect.setLocation(getAbsoluteX(),
     * getAbsoluteY());
     *
     * int visibleTextWidth = rect.getWidth()-2; int visibleTextHeight =
     * rect.getHeight()-2;
     *
     * if ((getTextWidth()>0) &&(getTextWidth() > visibleTextWidth)) { float
     * firstPart = ((float)getTextX())/((float)getTextWidth()); float lastPart =
     * ((float)(getTextWidth()-visibleTextWidth-getTextX()))/((float)getTextWidth());
     * ScrollbarUtils.drawScrollBar(rect.getX()+1,rect.getX()+rect.getWidth()-2,
     * rect.getY()+rect.getHeight()-1, firstPart, lastPart,
     * ScrollbarUtils.HORIZONTAL); }
     *
     *
     *
     * }
     */
    private int getVisibleTextWidth()
    {
        return getSize().getWidth() - 2;
    }

    private int getVisibleTextHeight()
    {
        return getSize().getHeight() - 2;
    }

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

    @Override
    public float getHorizontalScrollbarOffset()
    {
        if (!((getTextWidth() > 0) && (getTextWidth() > getVisibleTextWidth())))
        {
            return 0;
        }
        return ((float) getTextX()) / ((float) getTextWidth());
    }

    @Override
    public float getHorizontalScrollbarLength()
    {
        if (!((getTextWidth() > 0) && (getTextWidth() > getVisibleTextWidth())))
        {
            return 0;
        }
        return ((float) getVisibleTextWidth()) / ((float) getTextWidth());
    }

    @Override
    public float getVerticalScrollbarOffset()
    {
        if (!((getTextHeight() > 0) && (getTextHeight() > getVisibleTextHeight())))
        {
            return 0;
        }
        return ((float) getTextY()) / ((float) getTextHeight());
    }

    @Override
    public float getVerticalScrollbarLength()
    {
        if (!((getTextHeight() > 0) && (getTextHeight() > getVisibleTextHeight())))
        {
            return 0;
        }
        return ((float) getVisibleTextHeight()) / ((float) getTextHeight());
    }

}
