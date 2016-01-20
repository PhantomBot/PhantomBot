package jcurses.widgets;

import jcurses.util.Rectangle;

/**
 * This is a default layout manager. The constraints state for each widget to
 * layout a coordinates of the rectangle, within that the widget is placed and
 * the alignment of the widget, if its preferred size is smaller as the
 * rectangle's size-
 */
public class DefaultLayoutManager implements LayoutManager, WidgetsConstants
{

    private WidgetContainer _father = null;

    @Override
    public void bindToContainer(WidgetContainer container)
    {
        if (_father != null)
        {
            throw new RuntimeException("Already bound!!!");
        }
        _father = container;
    }

    @Override
    public void unbindFromContainer()
    {
        _father = null;
    }

    @Override
    public void layout(Widget widget, Object constraint)
    {
        if (!(constraint instanceof DefaultLayoutConstraint))
        {
            throw new RuntimeException("unknown constraint: " + constraint.getClass().getName());
        }

        DefaultLayoutConstraint cstr = (DefaultLayoutConstraint) constraint;

        Rectangle prefSize = widget.getPreferredSize();

        int prefWidth = prefSize.getWidth();
        int prefHeight = prefSize.getHeight();
        /**
         * Negativ oder 0 bedeutet, daß keine bevorzugte Grösse angegeben wurde
         */
        if (prefWidth <= 0)
        {
            prefWidth = cstr.width;
        }

        if (prefHeight <= 0)
        {
            prefHeight = cstr.height;
        }

        @SuppressWarnings("UnusedAssignment")
        int width = 0;
        @SuppressWarnings("UnusedAssignment")
        int height = 0;

        if (prefWidth < cstr.width)
        {
            widget.setX(getAlignedCoordinate(prefWidth, cstr.width, cstr.x, cstr.horizontalConstraint));
            width = prefWidth;
        } else
        {
            widget.setX(cstr.x);
            width = cstr.width;
        }

        if (prefHeight < cstr.height)
        {
            widget.setY(getAlignedCoordinate(prefHeight, cstr.height, cstr.y, cstr.verticalConstraint));
            height = prefHeight;
        } else
        {
            widget.setY(cstr.y);
            height = cstr.height;
        }

        widget.setSize(new Rectangle(width, height));
    }

    private int getAlignedCoordinate(int prefG, int contG, int contC, int alignment)
    {

        if (alignment == ALIGNMENT_CENTER)
        {
            alignment = 0;
        } else if ((alignment == ALIGNMENT_BOTTOM) || (alignment == ALIGNMENT_RIGHT))
        {
            alignment = 1;
        } else
        {
            alignment = 2;
        }

        @SuppressWarnings("UnusedAssignment")
        int result = 0;
        if (alignment == 2)
        {
            result = contC;
        } else if (alignment == 1)
        {
            result = contC + contG - prefG;
        } else
        {
            result = contC + (contG - prefG) / 2;
        }
        return result;
    }

    /**
     * Adds a widget to the boundeb container
     *
     * @param widget widget to be added
     * @param x the x coordinate of the top left corner of the rectangle, within
     * that the widget is placed
     * @param y the y coordinate of the top left corner of the rectangle, within
     * that the widget is placed
     * @param width the width of the rectangle, within that the widget is placed
     * @param height the hight of the rectangle, within that the widget is
     * placed
     * @param verticalConstraint vertical alignment constraint. Following values
     * a possible:
     * <code>WidgetConstraints.ALIGNMENT_CENTER</code>,<code>WidgetConstraints.ALIGNMENT_TOP</code>,<code>WidgetConstraints.ALIGNMENT_BOTTOM</code>
     * @param horizontalConstraint vertical alignment constraint, Following
     * values are possible: *
     * <code>WidgetConstraints.ALIGNMENT_CENTER</code>,<code>WidgetConstraints.ALIGNMENT_LEFT</code>,<code>WidgetConstraints.ALIGNMENT_RIGHT</code>
     */
    public void addWidget(Widget widget, int x, int y, int width, int height, int verticalConstraint, int horizontalConstraint)
    {
        _father.addWidget(widget, new DefaultLayoutConstraint(x, y, width, height, horizontalConstraint, verticalConstraint));

    }

    /**
     * Removes a widget from the container
     *
     * @param widget widget to be removed
     */
    public void removeWidget(Widget widget)
    {
        _father.removeWidget(widget);

    }
}

class DefaultLayoutConstraint
{

    int x = 0;
    int y = 0;
    int width = 0;
    int height = 0;
    int horizontalConstraint = 0;
    int verticalConstraint = 0;

    DefaultLayoutConstraint(int x, int y, int width, int height, int horizontalConstraint, int verticalConstraint)
    {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.horizontalConstraint = horizontalConstraint;
        this.verticalConstraint = verticalConstraint;
    }

}
