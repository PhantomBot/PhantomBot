package jcurses.system;

/**
 * Instances of this class are used by painting to set color attributes of
 * painted chars. Both black-white mode and color mode attributes can ( and must
 * be) be declared. For the color mode, colors of the background an the
 * foreground can be declared, for the background mode can be declared, whether
 * painted chars are output normal, reverse or in string font (bold).
 * <p>
 * possible values for colors:
 * <br><code>BLACK</code>
 * <br><code>BLUE</code>
 * <br><code>CYAN</code>
 * <br><code>GREEN</code>
 * <br><code>NAGENTA</code>
 * <br><code>RED</code>
 * <br><code>YELLOW</code>
 * <br><code>WHITE</code>
 * <p>
 * possible values for black-white mode attributes (these attributes are also
 * available for some color displays):
 * <br><code>BOLD</code>
 * <br><code>NORMAL</code>
 * <br><code>REVERSE</code>
 */
public class CharColor
{

    //color constants
    public static final short BLACK = 0;
    public static final short RED = 1;
    public static final short GREEN = 2;
    public static final short YELLOW = 3;
    public static final short BLUE = 4;
    public static final short MAGENTA = 5;
    public static final short CYAN = 6;
    public static final short WHITE = 7;

    //black-white mode constants
    public static final short NORMAL = 0;
    public static final short REVERSE = 1;
    public static final short BOLD = 2;

    private short _background;
    private short _foreground;

    private short _blackWhiteAttribute = 0;

    private short _colorAttribute = 0;

    /**
     * The constructor
     *
     * @param background background color
     * @param foreground foreground color
     * @param blackWhiteAttribute mode attribute
     * @param colorAttribute mode attribute
     */
    public CharColor(short background, short foreground, short blackWhiteAttribute, short colorAttribute)
    {
        verifyColor(background);
        verifyColor(foreground);
        verifyAttribute(colorAttribute);
        verifyAttribute(blackWhiteAttribute);
        _background = background;
        _foreground = foreground;
        _blackWhiteAttribute = blackWhiteAttribute;
        _colorAttribute = colorAttribute;
        initChtype();
    }

    /**
     * The constructor
     *
     * @param background background color
     * @param foreground foreground color
     * @param blackWhiteAttribute mode attribute color mode attribute will be
     * set to <code>NORMAL</code>
     */
    public CharColor(short background, short foreground, short blackWhiteAttribute)
    {
        this(background, foreground, NORMAL, NORMAL);
    }

    /**
     * The constructor, sets both the black-white mode attribute and the color
     * mode attribute to <code>NORMAL</code>
     *
     * @param background background color
     * @param foreground foreground color
     *
     */
    public CharColor(short background, short foreground)
    {
        this(background, foreground, NORMAL);
    }

    /**
     * The method sets the background color
     *
     * @param background value to be set
     */
    public void setBackground(short background)
    {
        verifyColor(background);
        _background = background;
        initChtype();
    }

    /**
     * The method sets the foreground color
     *
     * @param foreground value to be set
     */
    public void setForeground(short foreground)
    {
        verifyColor(foreground);
        _foreground = foreground;
        initChtype();
    }

    /**
     * @return the background color
     */
    public short getBackground()
    {
        return _background;
    }

    /**
     * @return the foreground color
     */
    public short getForeground()
    {
        return _foreground;
    }

    /**
     * @return the black-white mode attribute
     */
    public short getBlackWhiteAttribute()
    {
        return _blackWhiteAttribute;
    }

    /**
     * Sets the black-white mode attribute
     *
     * @param blackWhiteAttribute new black-white mode attribute
     */
    public void setBlackWhiteAttribute(short blackWhiteAttribute)
    {
        _blackWhiteAttribute = blackWhiteAttribute;
    }

    /**
     * @return the color mode attribute
     */
    public short getColorAttribute()
    {
        return _colorAttribute;
    }

    /**
     * Sets the color mode attribute
     *
     * @param colorAttribute new color mode attribute
     */
    public void setColorAttribute(short colorAttribute)
    {
        _colorAttribute = colorAttribute;
    }

    private void verifyColor(short color)
    {
        if ((color != BLACK)
                && (color != RED)
                && (color != GREEN)
                && (color != YELLOW)
                && (color != BLUE)
                && (color != MAGENTA)
                && (color != CYAN)
                && (color != WHITE))
        {
            throw new IllegalArgumentException("Unknown color:" + color);
        }
    }

    private void verifyAttribute(short attribute)
    {
        if ((attribute != NORMAL)
                && (attribute != REVERSE)
                && (attribute != BOLD))
        {
            throw new IllegalArgumentException("Unknown color attribute:" + attribute);
        }
    }

    private void initChtype()
    {
        Toolkit.computeChtype(this);
    }

    private String getColorName(short index)
    {
        @SuppressWarnings("UnusedAssignment")
        String result = "";

        if (index == BLACK)
        {
            result = "BLACK";
        } else if (index == WHITE)
        {
            result = "WHITE";
        } else if (index == GREEN)
        {
            result = "GREEN";
        } else if (index == YELLOW)
        {
            result = "YELLOW";
        } else if (index == MAGENTA)
        {
            result = "MAGENTA";
        } else if (index == CYAN)
        {
            result = "CYAN";
        } else if (index == BLUE)
        {
            result = "BLUE";
        } else
        {
            result = "UNKNOWN COLOR";
        }

        return result;

    }

    private String getModusName(short index)
    {
        @SuppressWarnings("UnusedAssignment")
        String result = "";
        switch (index)
        {
            case NORMAL:
                result = "NORMAL";
                break;
            case REVERSE:
                result = "REVERSE";
                break;
            case BOLD:
                result = "BOLD";
                break;
            default:
                result = "UNKNOWN MODUS";

        }

        return result;
    }

    @Override
    public String toString()
    {
        if (Toolkit.hasColors())
        {
            return "[background=" + getColorName(_background) + ", foreground=" + getColorName(_foreground) + "]";
        } else
        {
            return "[modi=" + getModusName(_blackWhiteAttribute) + "]";
        }
    }

}
