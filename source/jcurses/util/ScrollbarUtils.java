package jcurses.util;

import jcurses.system.Toolkit;
import jcurses.system.CharColor;

/**
 * This class is used be widgets to painting scrollbars. There isn't a scrollbar
 * widget in the library, instead of this, instead of this widget's that has
 * scrollbars as part, use this class for painting.
 */
public class ScrollbarUtils
{

    public static final int HORIZONTAL = 0;
    public static final int VERTICAL = 1;

    private static final CharColor __color = new CharColor(CharColor.BLACK, CharColor.WHITE, CharColor.REVERSE);

    /**
     * The method to paint a scrollbar.
     *
     * @param start the start coordinate of the scrollbar (x or y dependend of
     * <code>alignment</code>
     * @param end the end coordinate of the scrollbar (x or y dependend of
     * <code>alignment</code>
     * @param cst width (height) of the scrollbars line
     * @param firstPart the part of the scrollbar before the beam ( 0=> <1)
     * @param lastPart the part of the scrollbar after the beam ( 0=> <1)
     * @param alignment scrollbar <code>HORIZONTAL</code> or
     * <code>VERTICAL</code>
     */
    public static void drawScrollBar(int start, int end, int cst, float firstPart,
            float lastPart,
            int alignment)
    {
        if ((firstPart == 0) && (lastPart == 0))
        {
            //kein scrollbar, wenn alles sichtbar
            return;
        }
        int length = end - start + 1;
        float barLength2 = (((float) (1.0 - firstPart - lastPart)) * ((float) length));
        int barLength = Math.round(barLength2);

        barLength = (barLength == 0) ? 1 : barLength;

        int firstIntervall = Math.round((firstPart * ((float) length)));

        while ((barLength + firstIntervall) > (length))
        {
            firstIntervall--;
        }

        if (lastPart == 0)
        {
            firstIntervall = (length - barLength);
        }

        if (alignment == HORIZONTAL)
        {
            Toolkit.drawHorizontalThickLine(start + firstIntervall, cst, start + firstIntervall + barLength - 1, __color);
        } else
        {
            Toolkit.drawVerticalThickLine(cst, start + firstIntervall, start + firstIntervall + barLength - 1, __color);
        }

    }

}
