package jcurses.util;

/**
 * This is a class to represent an screen rectangle. To implement this class was
 * needed, because <code>java.awt.rectangle</code> works with double's, this is
 * by a text based terminal senseless.
 */
public class Rectangle
{

    int _x = 0;
    int _y = 0;
    int _width = 0;
    int _height = 0;

    /**
     * The constructor
     *
     * @param x the x coordinate of the top left corner
     * @param y the y coordinate of the top left corner
     * @param width the width of the rectangle
     * @param height the height of the rectangle
     */
    public Rectangle(int x, int y, int width, int height)
    {
        _x = x;
        _y = y;
        _width = width;
        _height = height;

    }

    /**
     * The constructor, that defines only the size but no location
     *
     * @param width the width of the rectangle
     * @param height the height of the rectangle
     */
    public Rectangle(int width, int height)
    {
        _width = width;
        _height = height;
    }

    /**
     * @return the x coordinate of the top left corner
     */
    public int getX()
    {
        return _x;
    }

    /**
     * @return the y coordinate of the top left corner
     */
    public int getY()
    {
        return _y;
    }

    /**
     * @return the width of the rectangle
     */
    public int getWidth()
    {
        return _width;
    }

    /**
     * @return the height of the rectangle
     */
    public int getHeight()
    {
        return _height;
    }

    /**
     * Sets the x coordinate of the top left corner
     *
     * @param x the x coordinate of the top left corner to set
     */
    public void setX(int x)
    {
        _x = x;
    }

    /**
     * Sets the y coordinate of the top left corner
     *
     * @param y the x coordinate of the top left corner to set
     */
    public void setY(int y)
    {
        _y = y;
    }

    /**
     * Sets the width of the rectangle
     *
     * @param width the width of the rectangle to set
     */
    public void setWidth(int width)
    {
        _width = width;
    }

    /**
     * Sets the height of the rectangle
     *
     * @param height the height of the rectangle to set
     */
    public void setHeight(int height)
    {
        _height = height;
    }

    /**
     * @return <code>true</code> if the rectangle is empty in other case
     * <code>false</code>
     */
    public boolean isEmpty()
    {
        return (_width <= 0) || (_height <= 0);
    }

    /**
     * The method veriifies, whether a rectangle lies within this rectangle
     *
     * @param X x coordinate of the rectangle, whose containment is to verify
     * @param Y y coordinate of the rectangle, whose containment is to verify
     * @param W width of the rectangle, whose containment is to verify
     * @param H x height of the rectangle, whose containment is to verify
     *
     * @return <code>true</code> if the parameter rectangle is withhin this
     * rectangle in other case <code>false</code>
     */
    public boolean contains(int X, int Y, int W, int H)
    {
        int width = _width;
        int height = _height;
        if (width <= 0 || height <= 0 || W <= 0 || H <= 0)
        {
            return false;
        }
        int x = _x;
        int y = _y;
        return (X >= x
                && Y >= y
                && X + W <= x + width
                && Y + H <= y + height);
    }

    /**
     * The method veriifies, whether a rectangle lies within this rectangle
     *
     * @param rect the rectangle, whose containment is to verify
     *
     *
     * @return <code>true</code> if the parameter rectangle is withhin this
     * rectangle in other case <code>false</code>
     */
    public boolean contains(Rectangle rect)
    {
        return contains(rect.getX(), rect.getY(), rect.getWidth(), rect.getHeight());
    }

    /**
     * The method returns an intersection of the rectangle with an other
     * rectangle, that is, the greatest rectangle, that is contained in both.
     *
     * @param r rectangle to build intersection with this rectangle
     *
     * @return the intersection rectangle
     */
    public Rectangle intersection(Rectangle r)
    {
        if (isEmpty())
        {
            return (Rectangle) this.clone();
        } else if (r.isEmpty())
        {
            return (Rectangle) r.clone();
        } else
        {
            int x1 = Math.max(_x, r.getX());
            int x2 = Math.min(_x + _width, r.getX() + r.getWidth());
            int y1 = Math.max(_y, r.getY());
            int y2 = Math.min(_y + _height, r.getY() + r.getHeight());
            if (((x2 - x1) < 0) || ((y2 - y1) < 0))
            // Width or height is negative. No intersection.
            {
                return new Rectangle(0, 0, 0, 0);
            } else
            {
                return new Rectangle(x1, y1, x2 - x1, y2 - y1);
            }
        }
    }

    /**
     * The method returns an union of the rectangle with an other rectangle,
     * that is, the smallest rectangle, that contains both.
     *
     * @param r rectangle to build union with this rectangle
     *
     * @return the union rectangle
     */
    public Rectangle union(Rectangle r)
    {
        if (isEmpty())
        {
            return (Rectangle) r.clone();
        } else if (r.isEmpty())
        {
            return (Rectangle) this.clone();
        } else
        {
            int x1 = Math.min(_x, r.getX());
            int x2 = Math.max(_x + _width, r.getX() + r.getWidth());
            int y1 = Math.min(_y, r.getY());
            int y2 = Math.max(_y + _height, r.getY() + r.getHeight());
            return new Rectangle(x1, y1, x2 - x1, y2 - y1);
        }
    }

    /**
     * The method veriifies, whether a point lies within this rectangle
     *
     * @param x x coordinate of the point, whose containment is to verify
     * @param y y coordinate of the point, whose containment is to verify
     * @return <code>true</code> if the point is withhin this rectangle in other
     * case <code>false</code>
     */
    public boolean inside(int x, int y)
    {
        return (x >= _x) && ((x - _x) < _width) && (y >= _y) && ((y - _y) < _height);
    }

    /**
     * Sets the location of the rectangle
     *
     * @param x new x coordinate
     * @param y new y coordinate
     */
    public void setLocation(int x, int y)
    {
        setX(x);
        setY(y);
    }

    /**
     * Changes the size of the rectangle
     *
     * @param width new width
     * @param height new height
     */
    public void resize(int width, int height)
    {
        setWidth(width);
        setHeight(height);
    }

    @Override
    @SuppressWarnings(
            {
                "CloneDoesntCallSuperClone", "CloneDeclaresCloneNotSupported"
            })
    public Object clone()
    {
        return new Rectangle(_x, _y, _width, _height);
    }

    @Override
    public String toString()
    {
        return "[x=" + _x + ",y=" + _y + ",width=" + _width + ",height=" + _height + ",isEmpty=" + isEmpty() + "]";
    }

}
