package jcurses.widgets;

import jcurses.util.Rectangle;

/**
 * This class is a layout manager that works like Swing's BorderLayout. Up to 5
 * widgets can be added to this layout at once, in the following positions:
 * NORTH, SOUTH, WEST, EAST, and CENTER. Components in the outer positions are
 * set to their preferred size, and the component in the CENTER is allocated the
 * remaining screen area.
 *
 * @author <a href="mailto:lenbok@myrealbox.com">Len Trigg</a>
 */
public class BorderLayoutManager implements LayoutManager
{

    /**
     * Constant used to specify widget placement in the center of the container
     */
    public static final int CENTER = 0;

    /**
     * Constant used to specify widget placement in the north of the container
     */
    public static final int NORTH = 1;

    /**
     * Constant used to specify widget placement in the south of the container
     */
    public static final int SOUTH = 2;

    /**
     * Constant used to specify widget placement in the west of the container
     */
    public static final int WEST = 3;

    /**
     * Constant used to specify widget placement in the east of the container
     */
    public static final int EAST = 4;

    /**
     * The widget we are providing layout service for
     */
    private WidgetContainer mFather = null;

    /**
     * Stores constraints for each of the 5 possible positions. Any entry may be
     * null
     */
    private final BorderLayoutConstraint[] mSlots = new BorderLayoutConstraint[5];

    /**
     * Stores separator positions for each dimension
     */
    private final int[] mXSep = new int[2];
    private final int[] mYSep = new int[2];

    // inherited docs
    @Override
    public void bindToContainer(WidgetContainer container)
    {
        if (mFather != null)
        {
            throw new IllegalStateException("Already bound!!!");
        }
        mFather = container;
    }

    // inherited docs
    @Override
    public void unbindFromContainer()
    {
        mFather = null;
    }

    // inherited docs
    @Override
    public void layout(Widget widget, Object constraint)
    {
        if (!(constraint instanceof BorderLayoutConstraint))
        {
            throw new IllegalArgumentException("unknown constraint: " + constraint.getClass().getName());
        }

        // Determine where the cell separators lie, based on preferred sizes
        // Ideally we shouldn't have to calculate this when laying out every widget, only when
        // some widget has changed, c.f. java.awt.LayoutManager2.invalidateLayout()
        updateAllSeparators();

        // Fit the current widget into the appropriate cell
        Rectangle rect = (mFather.getChildsRectangle() == null) ? mFather.getSize() : mFather.getChildsRectangle();
        BorderLayoutConstraint cstr = (BorderLayoutConstraint) constraint;

        Rectangle prefSize = widget.getPreferredSize();
        int prefWidth = prefSize.getWidth();
        int prefHeight = prefSize.getHeight();
        int maxWidth = rect.getWidth();  // Cell width
        int maxHeight = rect.getHeight();// Cell height
        int x = 0;                       // Cell x offset
        int y = 0;                       // Cell y offset
        switch (cstr.mPosition)
        {
            case NORTH:
                x = 0;
                y = 0;
                maxHeight = mYSep[0];
                break;
            case SOUTH:
                x = 0;
                y = mYSep[1];
                maxHeight -= mYSep[1];
                break;
            case CENTER:
                x = mXSep[0];
                y = mYSep[0];
                maxWidth = mXSep[1] - mXSep[0];
                maxHeight = mYSep[1] - mYSep[0];
                break;
            case WEST:
                x = 0;
                y = mYSep[0];
                maxWidth = mXSep[0];
                maxHeight = mYSep[1] - mYSep[0];
                break;
            case EAST:
                x = mXSep[1];
                y = mYSep[0];
                maxWidth -= mXSep[1];
                maxHeight = mYSep[1] - mYSep[0];
                break;
            default:
                throw new IllegalStateException("Unknown position for widget: " + cstr.mPosition);
        }

        if (prefWidth <= 0)
        {
            prefWidth = maxWidth;
        }
        if (prefHeight <= 0)
        {
            prefHeight = maxHeight;
        }

        /*
         * Protocol.debug("Widget prelayout for cell " + cstr.mPosition + " is
         * offset(" + x + "," + y + ")" + " maxsize(" + maxWidth + "," +
         * maxHeight + ")");
         */
        @SuppressWarnings("UnusedAssignment")
        int width = 0;
        @SuppressWarnings("UnusedAssignment")
        int height = 0;
        if (prefWidth < maxWidth)
        {
            widget.setX(getAlignedCoordinate(prefWidth, maxWidth, x, cstr.mHorizontalConstraint));
            width = prefWidth;
        } else
        {
            widget.setX(x);
            width = maxWidth;
        }

        if (prefHeight < maxHeight)
        {
            widget.setY(getAlignedCoordinate(prefHeight, maxHeight, y, cstr.mVerticalConstraint));
            height = prefHeight;
        } else
        {
            widget.setY(y);
            height = maxHeight;
        }
        /*
         * Protocol.debug("Widget layout for cell " + cstr.mPosition + " is
         * offset(" + widget.getX() + "," + widget.getY() + ")" + " maxsize(" +
         * width + "," + height + ")");
         */
        widget.setSize(new Rectangle(width, height));
    }

    /**
     * Determine separator positions, where top left is 0,0
     *
     * mXSep[0] | +-+-----+ | N | +-+---+-+- mYSep[0] | | | | |W| C |E| | | | |
     * +-+---+-+- mYSep[1] | S | +-----+-+ | mXSep[1]
     */
    private void updateAllSeparators()
    {
        // Get Rectangle to lay out into -- this is the total area available.
        Rectangle rect = (mFather.getChildsRectangle() == null) ? mFather.getSize() : mFather.getChildsRectangle();
        updateSeparatorsDimension(mXSep, mSlots[WEST], mSlots[CENTER], mSlots[EAST], rect.getWidth(), true);
        updateSeparatorsDimension(mYSep, mSlots[NORTH], mSlots[CENTER], mSlots[SOUTH], rect.getHeight(), false);
    }

    /**
     * Some super logic for how to partition the dimension based on the number
     * of components and their preferences
     */
    private void updateSeparatorsDimension(int[] sep, BorderLayoutConstraint w1, BorderLayoutConstraint w2,
            BorderLayoutConstraint w3, int max, boolean width)
    {
        sep[0] = 0;
        sep[1] = max;
        if (w2 == null)
        {
            if (w1 == null)
            {
                if (w3 == null)
                {
                    return;
                }
                sep[1] = 0;
                return;
            }
            if (w3 == null)
            {
                sep[0] = max;
                return;
            }
        }
        if (w1 != null)
        {
            int pref = (width) ? w1.mWidget.getPreferredSize().getWidth() : w1.mWidget.getPreferredSize().getHeight();
            if (pref < 0)
            {
                sep[0] = -1;
            } else
            {
                sep[0] += pref;
            }
        }
        if (w3 != null)
        {
            int pref = (width) ? w3.mWidget.getPreferredSize().getWidth() : w3.mWidget.getPreferredSize().getHeight();
            if (pref < 0)
            {
                sep[1] = -1;
            } else
            {
                sep[1] -= pref;
            }
        }

        // If there are any -1 prefs, distribute them evenly
        // TODO -- should this take into account w2 preferred dimension?
        if (w2 == null)
        {
            if (sep[0] < 0)
            {
                if (sep[1] < 0)
                {
                    sep[0] = max / 2;
                    sep[1] = max / 2;
                } else
                {
                    sep[0] = sep[1];
                }
            } else if (sep[1] < 0)
            {
                sep[1] = sep[0];
            }
        } else
        {
            if (sep[0] < 0)
            {
                if (sep[1] < 0)
                {
                    sep[0] = max / 3;
                    sep[1] = max - sep[0];
                } else
                {
                    sep[0] = sep[1] / 2;
                }
            } else if (sep[1] < 0)
            {
                sep[1] = max - (max - sep[0]) / 2;
            }
        }
    }

    private int getAlignedCoordinate(int prefG, int contG, int contC, int alignment)
    {
        if (alignment == WidgetsConstants.ALIGNMENT_CENTER)
        {
            return contC + (contG - prefG) / 2;
        } else if ((alignment == WidgetsConstants.ALIGNMENT_BOTTOM)
                || (alignment == WidgetsConstants.ALIGNMENT_RIGHT))
        {
            return contC + contG - prefG;
        } else
        {
            return contC;
        }
    }

    /**
     * Adds a widget to the bounded container
     *
     * @param widget widget to be added
     * @param position the position in the border layout. The following values
     * are possible: <code>NORTH</code>, <code>SOUTH</code>, <code>WEST</code>,
     * <code>EAST</code>, <code>CENTER</code>,
     * @param verticalConstraint vertical alignment constraint. The following
     * values are possible: <code>WidgetConstraints.ALIGNMENT_CENTER</code>,
     * <code>WidgetConstraints.ALIGNMENT_TOP</code>,
     * <code>WidgetConstraints.ALIGNMENT_BOTTOM</code>
     * @param horizontalConstraint vertical alignment constraint, The following
     * values are possible: <code>WidgetConstraints.ALIGNMENT_CENTER</code>,
     * <code>WidgetConstraints.ALIGNMENT_LEFT</code>,
     * <code>WidgetConstraints.ALIGNMENT_RIGHT</code>
     */
    @SuppressWarnings("empty-statement")
    public void addWidget(Widget widget, int position, int verticalConstraint, int horizontalConstraint)
    {
        if ((position != NORTH) && (position != SOUTH) && (position != WEST) && (position != EAST) && (position != CENTER))
        {
            throw new IllegalArgumentException("Must specify position of NORTH, SOUTH, WEST, EAST, or CENTER.");
        }
        mSlots[position] = new BorderLayoutConstraint(widget, position, horizontalConstraint, verticalConstraint);;
        mFather.addWidget(widget, mSlots[position]);
    }

    // inherited docs
    public void removeWidget(Widget widget)
    {
        mFather.removeWidget(widget);
        for (int i = 0; i < mSlots.length; i++)
        {
            if (mSlots[i].mWidget == widget)
            {
                mSlots[i] = null;
            }
        }
    }
}

/**
 * Stores the layout preferences for a widget within the BorderLayout
 */
class BorderLayoutConstraint
{

    Widget mWidget;
    int mPosition;
    int mHorizontalConstraint;
    int mVerticalConstraint;

    BorderLayoutConstraint(Widget widget, int position, int horizontalConstraint, int verticalConstraint)
    {
        mWidget = widget;
        mPosition = position;
        mHorizontalConstraint = horizontalConstraint;
        mVerticalConstraint = verticalConstraint;
    }
}
