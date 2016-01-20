package jcurses.widgets;

import jcurses.util.Rectangle;
import jcurses.system.Toolkit;

/**
 * This class is used by widgets, having scrollable content, to paint
 * scrollbars. The class <code>jcurses.util.ScrollbarUtils</code> is deprecated.
 * 
*/
public class ScrollbarPainter
{

    private IScrollable _widget = null;

    private Rectangle _borderRectangle = null;

    private ScrollbarData _currentScrollbarData = null;

    /**
     * The constructor
     *
     * @param widget the widget, that needs scrollbars
     *
     */
    public ScrollbarPainter(IScrollable widget)
    {
        _widget = widget;
    }

    /**
     * This method must be called, if the widget is painted or repainted. If the
     * the widget was already visible, but the content (position ) has been
     * changed, the method <code>refresh</code> must be used
     *
     */
    public void paint()
    {
        _currentScrollbarData = readData();
        drawHorizontalScrollbar();
        drawVerticalScrollbar();
    }

    /**
     * This method is to be called if the scrollable content ( or it's position
     * ) has been ( or could have been ) changed, to refresh scrollbars only if
     * needed.
     *
     */
    public void refresh()
    {
        ScrollbarData oldScrollbarData = _currentScrollbarData;
        _currentScrollbarData = readData();
        if ((oldScrollbarData.horizontalOffset != _currentScrollbarData.horizontalOffset)
                || (oldScrollbarData.horizontalLength != _currentScrollbarData.horizontalLength))
        {
            refreshHorizontalScrollbar(oldScrollbarData);
        }
        if ((oldScrollbarData.horizontalOffset != _currentScrollbarData.horizontalOffset)
                || (oldScrollbarData.horizontalLength != _currentScrollbarData.horizontalLength))
        {
            refreshVerticalScrollbar(oldScrollbarData);
        }
    }

    private ScrollbarData readData()
    {
        ScrollbarData result = new ScrollbarData();
        _borderRectangle = _widget.getBorderRectangle();
        int horizontalLength = _borderRectangle.getWidth() - 2;
        int verticalLength = _borderRectangle.getHeight() - 2;
        if (_widget.hasHorizontalScrollbar() && (_widget.getHorizontalScrollbarLength() > 0))
        {
            result.horizontalOffset = Math.round(((float) horizontalLength) * _widget.getHorizontalScrollbarOffset());
            result.horizontalLength = Math.round(((float) horizontalLength) * _widget.getHorizontalScrollbarLength());
            result.horizontalLength = (result.horizontalLength == 0) ? 1 : result.horizontalLength;

            if ((result.horizontalLength + result.horizontalOffset) > horizontalLength)
            {
                result.horizontalOffset = horizontalLength - result.horizontalLength;
            }

            if (horizontalLength == result.horizontalLength)
            {
                result.horizontalLength = 0;
            }
        }

        if (_widget.hasVerticalScrollbar() && (_widget.getVerticalScrollbarLength() > 0))
        {

            result.verticalOffset = Math.round(((float) verticalLength) * _widget.getVerticalScrollbarOffset());
            result.verticalLength = Math.round(((float) verticalLength) * _widget.getVerticalScrollbarLength());
            result.verticalLength = (result.verticalLength == 0) ? 1 : result.verticalLength;

            if ((result.verticalLength + result.verticalOffset) > verticalLength)
            {
                result.verticalOffset = verticalLength - result.verticalLength;
            }

            if (verticalLength == result.verticalLength)
            {
                result.verticalLength = 0;
            }

        }
        return result;
    }

    private void drawHorizontalScrollbar()
    {
        int offset = _currentScrollbarData.horizontalOffset;
        int length = _currentScrollbarData.horizontalLength;
        if (_widget.hasHorizontalScrollbar() && (length > 0))
        {
            Toolkit.drawHorizontalThickLine(_borderRectangle.getX() + 1 + offset,
                    _borderRectangle.getY() + _borderRectangle.getHeight() - 1,
                    _borderRectangle.getX() + offset + length, _widget.getScrollbarColors());
        }
    }

    private void drawVerticalScrollbar()
    {
        int offset = _currentScrollbarData.verticalOffset;
        int length = _currentScrollbarData.verticalLength;
        if (_widget.hasVerticalScrollbar() && (length > 0))
        {
            Toolkit.drawVerticalThickLine(_borderRectangle.getX() + _borderRectangle.getWidth() - 1,
                    _borderRectangle.getY() + 1 + offset,
                    _borderRectangle.getY() + offset + length, _widget.getScrollbarColors());
        }
    }

    private void refreshVerticalScrollbar(ScrollbarData old)
    {
        if (_widget.hasVerticalScrollbar())
        {
            if (old.verticalLength > 0)
            {
                Toolkit.drawVerticalLine(_borderRectangle.getX() + _borderRectangle.getWidth() - 1,
                        _borderRectangle.getY() + 1 + old.verticalOffset,
                        _borderRectangle.getY() + old.verticalOffset + old.verticalLength, _widget.getBorderColors());
            }
            drawVerticalScrollbar();
        }
    }

    private void refreshHorizontalScrollbar(ScrollbarData old)
    {
        if (_widget.hasHorizontalScrollbar())
        {
            if (old.horizontalLength > 0)
            {
                Toolkit.drawHorizontalLine(_borderRectangle.getX() + 1 + old.horizontalOffset,
                        _borderRectangle.getY() + _borderRectangle.getHeight() - 1,
                        _borderRectangle.getX() + old.horizontalOffset + old.horizontalLength, _widget.getBorderColors());
            }
            drawHorizontalScrollbar();
        }
    }

    private class ScrollbarData
    {

        int horizontalOffset = 0;
        int horizontalLength = 0;
        int verticalOffset = 0;
        int verticalLength = 0;

        @Override
        public String toString()
        {
            return "hoffset="
                    + horizontalOffset
                    + ",hlength="
                    + horizontalLength
                    + ",voffset="
                    + verticalOffset
                    + ",vlength="
                    + verticalLength;
        }
    }

}
