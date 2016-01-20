package jcurses.system;

import jcurses.util.Rectangle;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Hashtable;
import java.awt.Point;

/**
 * This class is the 'work factory' of the jcurses library. It contains methods
 * for primitive input and output operations and is only interface to platform
 * dependend libraries. An developer must not usually call methods of this
 * class, these are used implementing widgets and in jcurses core.
 */
@SuppressWarnings("StaticNonFinalUsedInInitialization")
public class Toolkit
{

    public static final short CORNER_UNDER_LINE = 0;
    public static final short CORNER_OVER_LINE = 1;

    public static final short LL_CORNER = 2;
    public static final short LR_CORNER = 3;
    public static final short UL_CORNER = 4;
    public static final short UR_CORNER = 5;

    static final int VERTICAL = 0;
    static final int HORIZONTAL = 1;

    private static long[] __attributes =
    {
        0, 0, 0
    };
    private static short[] __basicColors =
    {
        0, 0, 0, 0, 0, 0, 0, 0
    };
    private static short[][] __colorpairs = new short[8][8];

    static
    {
        System.load(getLibraryPath());
        fillBasicColors(__basicColors);
        fillAttributes(__attributes);
        fillColorPairs();
        initEncoding();
        init();
    }

    @SuppressWarnings("UseOfObsoleteCollectionType")
    private static Hashtable __clips = new Hashtable();

    /**
     * The method sets the clippping rectangle for the current thread. All the
     * output operations, that are performed by this thread after a call of this
     * method, will paint only within the clip rectangle. If other clips were
     * set before this, then the used clip rectangle is the intersection of all
     * clip rectangles set by current thread.
     *
     * @param clipRect clip rectangle to be set
     */
    public static void setClipRectangle(Rectangle clipRect)
    {
        ArrayList clips = (ArrayList) __clips.get(Thread.currentThread());
        if (clips == null)
        {
            clips = new ArrayList();
            __clips.put(Thread.currentThread(), clips);
        }
        clips.add(clipRect);
    }

    /**
     * Removes the evtl. before set clip rectangle
     */
    @SuppressWarnings("SizeReplaceableByIsEmpty")
    public static void unsetClipRectangle()
    {
        ArrayList clips = (ArrayList) __clips.get(Thread.currentThread());
        if (clips == null)
        {
            return;
        }
        if (clips.size() > 0)
        {
            clips.remove(clips.size() - 1);
        }
        if (clips.size() == 0)
        {
            __clips.remove(Thread.currentThread());
        }
    }

    @SuppressWarnings("SizeReplaceableByIsEmpty")
    private static Rectangle getCurrentClipRectangle()
    {
        ArrayList clips = (ArrayList) __clips.get(Thread.currentThread());
        if ((clips == null) || (clips.size() == 0))
        {
            return null;
        }
        Rectangle result = (Rectangle) clips.get(0);
        for (int i = 1; i < clips.size(); i++)
        {
            Rectangle temp = (Rectangle) clips.get(i);
            result = result.intersection(temp);
            if (result.isEmpty())
            {
                return result;
            }
        }
        return result;
    }

    private static String tryLibraryPath(String url)
    {
        String[] fileNames = new File(url).list();

        if (fileNames == null)
        {
            return null;
        }

        for (String name : fileNames)
        {
            if (name.trim().startsWith("libjcurses"))
            {
                return new File(url, name).getAbsolutePath();
            }
        }

        return null;
    }

    private static String getLibraryPath()
    {
        String url = ClassLoader.getSystemClassLoader().getResource("jcurses/system/Toolkit.class").toString();
        url = url.trim();
        if (url.startsWith("jar:file:"))
        {
            url = url.substring("jar:file:".length(), url.length());
            url = url.substring(0, url.length() - "/PhantomBot.jar!/jcurses/system/Toolkit.class".length());
        } else if (url.startsWith("file:"))
        {
            url = url.substring("file:".length(), url.length());
            url = url.substring(0, url.length() - "/classes/jcurses/system/Toolkit.class".length());
            url = new File(url, "lib").getAbsolutePath();
        } else
        {
            throw new RuntimeException("couldn't find jcurses library");
        }
        String furl = tryLibraryPath(url);
        if (furl == null)
        {
            furl = tryLibraryPath(url.replaceAll("%20", " "));
        }
        if (furl == null)
        {
            furl = tryLibraryPath(url + "/lib");
        }
        if (furl == null)
        {
            furl = tryLibraryPath(url.replaceAll("%20", " ") + "/lib");
        }
        if (furl == null)
        {
            throw new RuntimeException("couldn't find jcurses library");
        }
        return furl;
    }

    private static void fillColorPairs()
    {
        for (int i = 0; i < 8; i++)
        {
            for (int j = 0; j < 8; j++)
            {
                __colorpairs[i][j] = -1;
            }
        }
    }

    private static native void fillAttributes(long[] attributes);

    private static native void fillBasicColors(short[] basicColors);

    static short[] getBasicColors()
    {
        return __basicColors;
    }

    private static native void initColorPair(short background, short foreground, short number);

    private static native int computeChtype(short number);

    static int computeChtype(CharColor ch)
    {
        short number = getColorPairNumber(ch);
        if (number == -1)
        {
            number = addColorPairNumber(ch);
        }
        return computeChtype(number);
    }

    private static short __maxColorPairNumber = -1;

    private static short getColorPairNumber(CharColor ch)
    {
        if (!hasColors())
        {
            return ch.getBlackWhiteAttribute();
        } else
        {
        }
        short background = ch.getBackground();
        short foreground = ch.getForeground();
        return __colorpairs[background][foreground];
    }

    private static short addColorPairNumber(CharColor ch)
    {
        short background = __basicColors[ch.getBackground()];
        short foreground = __basicColors[ch.getForeground()];
        __maxColorPairNumber++;
        __colorpairs[ch.getBackground()][ch.getForeground()] = __maxColorPairNumber;
        initColorPair(background, foreground, __maxColorPairNumber);

        return __maxColorPairNumber;
    }

    /**
     * The method starts a new painting action, containing possible many
     * painting operations After a call of this method endPainting must be
     * already called, to refersh the screen.
     */
    public static native void startPainting();

    /**
     * The method ends a new painting action, containing possible many painting
     * operations The call of this method must already follow a call of
     * <code>startPainting</code>
     */
    public static native void endPainting();

    /**
     * The method returns the screen width
     *
     * @return the screen height
     */
    public static native int getScreenWidth();

    /**
     * The method returns the screen height
     *
     * @return the screen height
     */
    public static native int getScreenHeight();

    /**
     * @return <code>true</code> if the terminal can color painting,
     * <code>false</code>otherwise.
     */
    public static boolean hasColors()
    {
        return (hasColorsAsInteger() != 0);
    }

    private static native int hasColorsAsInteger();

    /**
     * The method initializes the jcurses library, must be called only one time
     * before all painting and input operations.
     */
    public static native void init();

    /**
     * The method shuts down the jcurses library and recovers the terminal to
     * the state before jcurses application start.
     */
    public static native void shutdown();

    //Painting methods 
    /**
     * The method clears the screen and fills it with the backround color of
     * <code>color</code>
     *
     * @param color the color to fill the screen, only backround part is used.
     */
    public static void clearScreen(CharColor color)
    {
        clearScreen(getColorPairNumber(color),
                __attributes[color.getColorAttribute()]);
    }

    private static native void clearScreen(short colorPairNumber, long attributes);

    /**
     * The method draws a rectangle on the screen, filled with background part
     * of <code>color</code>
     *
     * @param rect rectangle ( that is, bounds of rectangle) to be painted
     * @param color color to fill the rectangle, only background part is used
     */
    public static void drawRectangle(Rectangle rect, CharColor color)
    {
        Rectangle clipRect = getCurrentClipRectangle();
        if (clipRect != null)
        {
            rect = rect.intersection(clipRect);
        }
        if (!rect.isEmpty())
        {
            drawRectangle(rect.getX(), rect.getY(), rect.getWidth(), rect.getHeight(),
                    getColorPairNumber(color),
                    __attributes[color.getColorAttribute()]);
        }
    }

    /**
     * The method draws a rectangle on the screen, filled with background part
     * of <code>color</code>
     *
     * @param x the x coordinate of the top left corner of the rectangle to be
     * painted
     * @param y the y coordinate of the top left corner of the rectangle to be
     * painted
     * @param width the width of the rectangle to be painted
     * @param height the height of the rectangle to be painted
     * @param color color to fill the rectangle, only background part is used
     */
    public static void drawRectangle(int x, int y, int width, int height, CharColor color)
    {
        Rectangle rect = new Rectangle(x, y, width, height);
        drawRectangle(rect, color);

    }

    private static native void drawRectangle(int x, int y, int width, int height, short colorPairNumber, long attribute);

    private static boolean between(int begin, int end, int pos)
    {
        return ((begin <= pos) && (end >= pos));
    }

    private static LinePart getLinePart(int begin, int end, int alignment, int position, Rectangle clipRect)
    {
        @SuppressWarnings("UnusedAssignment")
        LinePart result = null;
        if (begin > end)
        {
            int tmp = end;
            end = begin;
            begin = tmp;
        }
        if (clipRect == null)
        {
            result = new LinePart(begin, end, alignment);
        } else
        {
            if ((alignment == VERTICAL) && (!between(clipRect.getX(), clipRect.getX() + clipRect.getWidth() - 1, position)))
            {
                result = new LinePart();
            } else if ((alignment == HORIZONTAL) && (!between(clipRect.getY(), clipRect.getY() + clipRect.getHeight() - 1, position)))
            {
                result = new LinePart();
            } else
            {
                if (alignment == VERTICAL)
                {
                    result = new LinePart(Math.max(clipRect.getY(), begin), Math.min(clipRect.getY() + clipRect.getHeight() - 1, end), alignment);
                } else
                {
                    result = new LinePart(Math.max(clipRect.getX(), begin), Math.min(clipRect.getX() + clipRect.getWidth() - 1, end), alignment);
                }
            }
        }
        return result;
    }

    /**
     * The method draws a horizontal thick line
     *
     * @param startX the x coordinate of the start point
     * @param startY the y coordinate of the start point
     * @param endX the x coordinate of the end point
     * @param color
     */
    public static void drawHorizontalThickLine(int startX, int startY, int endX, CharColor color)
    {
        LinePart part = getLinePart(startX, endX, HORIZONTAL, startY, getCurrentClipRectangle());
        if (!part.isEmpty())
        {
            drawHorizontalThickLine(part._begin, startY, part._end, getColorPairNumber(color),
                    __attributes[color.getColorAttribute()]);
        }
    }

    private static native void drawHorizontalThickLine(int startX, int startY, int endX, short colorPairNumber, long attr);

    /**
     * The method draws a vertical thick line
     *
     * @param startX the x coordinate of the start point
     * @param startY the y coordinate of the start point
     * @param endY the y coordinate of the end point
     * @param color
     */
    public static void drawVerticalThickLine(int startX, int startY, int endY, CharColor color)
    {
        LinePart part = getLinePart(startY, endY, VERTICAL, startX, getCurrentClipRectangle());
        if (!part.isEmpty())
        {
            drawVerticalThickLine(startX, part._begin, part._end, getColorPairNumber(color),
                    __attributes[color.getColorAttribute()]);
        }
    }

    private static native void drawVerticalThickLine(int startX, int startY, int endY, short colorPairNumber, long attr);

    /**
     * The method draws a horizontal line
     *
     * @param startX the x coordinate of the start point
     * @param startY the y coordinate of the start point
     * @param endX the x coordinate of the end point
     * @param color
     */
    public static void drawHorizontalLine(int startX, int startY, int endX, CharColor color)
    {
        LinePart part = getLinePart(startX, endX, HORIZONTAL, startY, getCurrentClipRectangle());
        if (!part.isEmpty())
        {
            drawHorizontalLine(part._begin, startY, part._end, getColorPairNumber(color),
                    __attributes[color.getColorAttribute()]);
        }
    }

    private static native void drawHorizontalLine(int startX, int startY, int endY, short colorPairNumber, long attr);

    /**
     * The method draws a vertical line
     *
     * @param startX the x coordinate of the start point
     * @param startY the y coordinate of the start point
     * @param endY the y coordinate of the end point
     * @param color
     */
    public static void drawVerticalLine(int startX, int startY, int endY, CharColor color)
    {
        LinePart part = getLinePart(startY, endY, VERTICAL, startX, getCurrentClipRectangle());
        if (!part.isEmpty())
        {
            drawVerticalLine(startX, part._begin, part._end, getColorPairNumber(color),
                    __attributes[color.getColorAttribute()]);
        }
    }

    private static native void drawVerticalLine(int startX, int startY, int endX, short colorPairNumber, long attr);

    private static Point getCornerCenterPoint(int startX, int startY, int endX, int endY, short alignment)
    {
        @SuppressWarnings("UnusedAssignment")
        int x = 0;
        @SuppressWarnings("UnusedAssignment")
        int y = 0;
        y = (alignment == CORNER_UNDER_LINE) ? Math.min(startY, endY) : Math.max(startY, endY);
        x = (y == startY) ? endX : startX;

        return new Point(x, y);
    }

    private static short getCornerChar(int startX, int startY, int endX, int endY, short alignment)
    {
        int cornerX = Math.min(startX, endX);
        int cornerY = (startX == cornerX) ? startY : endY;
        int otherX = (startX == cornerX) ? endX : startX;
        int otherY = (startX == cornerX) ? endY : startY;

        @SuppressWarnings("UnusedAssignment")
        short result = 0;
        if (cornerY < otherY)
        {
            if (alignment == CORNER_UNDER_LINE)
            {
                result = UR_CORNER;
            } else
            {
                result = LL_CORNER;
            }
        } else
        {
            if (alignment == CORNER_UNDER_LINE)
            {
                result = UL_CORNER;
            } else
            {
                result = LR_CORNER;
            }
        }

        return result;
    }

    /**
     *
     * The method draws a corner. The corner cann't have only one long side and
     * the othe side empty. In such case drawLine must be user followed by
     * painting a sidelos corner.
     *
     * @param startX the x coordinate of the start point
     * @param startY the y coordinate of the start point
     * @param endX the x coordinate of the end point
     * @param endY the y coordinate of the end point
     * @param alignment this parameter states, whether the line, that connects
     * the start point with end point, lies <b>UNDER</b>
     * the corner point (alignment == 0 ) or <b>OVER</b> (alignment == 1), or
     * the corner char, if the corner has no sides, it.
     * @param color the color attributes for of the corner
     *
     */
    @SuppressWarnings("UnnecessaryReturnStatement")
    public static void drawCorner(int startX, int startY, int endX, int endY, CharColor color, short alignment)
    {
        Rectangle clipRect = getCurrentClipRectangle();
        if ((clipRect == null))
        {
            drawCorner(startX, startY, endX, endY, getColorPairNumber(color),
                    __attributes[color.getColorAttribute()], alignment);
        } else
        {
            Point center = getCornerCenterPoint(startX, startY, endX, endY, alignment);
            if ((alignment == CORNER_UNDER_LINE) || (alignment == CORNER_OVER_LINE))
            {
                @SuppressWarnings("UnusedAssignment")
                LinePart verticalPart = null;
                @SuppressWarnings("UnusedAssignment")
                LinePart horizontalPart = null;
                if (startX == center.x)
                {
                    int endY2 = (startY < center.y) ? (center.y - 1) : (center.y + 1);
                    verticalPart = new LinePart(startY, endY2, center.x, VERTICAL);
                    int endX2 = (endX < center.x) ? (center.x - 1) : (center.x + 1);
                    horizontalPart = new LinePart(endX, endX2, center.y, HORIZONTAL);
                } else
                {
                    int endY3 = (endY < center.y) ? (center.y - 1) : (center.y + 1);
                    verticalPart = new LinePart(endY, endY3, center.x, VERTICAL);
                    int endX3 = (startX < center.x) ? (center.x - 1) : (center.x + 1);
                    horizontalPart = new LinePart(startX, endX3, center.y, HORIZONTAL);
                }

                drawHorizontalLine(horizontalPart._begin, horizontalPart._position, horizontalPart._end, color);
                drawVerticalLine(verticalPart._position, verticalPart._begin, verticalPart._end, color);
            }

            if (clipRect.inside(center.x, center.y))
            {
                if ((alignment != CORNER_UNDER_LINE) && (alignment != CORNER_OVER_LINE))
                {
                    drawCorner(center.x, center.y, center.x, center.y, getColorPairNumber(color),
                            __attributes[color.getColorAttribute()], alignment);
                } else
                {
                    short newAlignment = getCornerChar(startX, startY, endX, endY, alignment);
                    drawCorner(center.x, center.y, center.x, center.y, getColorPairNumber(color),
                            __attributes[color.getColorAttribute()], newAlignment);
                }
            }

        }
        return;
    }

    private static native void drawCorner(int startX, int startY, int endX, int endY, short colorPairNumber, long attr, short alignment);

    /**
     * The method draws a border ( empty rectangle )
     *
     * @param rect bounds of the border to be painted
     * @param color color attributes of the border
     */
    public static void drawBorder(Rectangle rect, CharColor color)
    {
        drawBorder((int) rect.getX(), (int) rect.getY(), (int) rect.getWidth(), (int) rect.getHeight(), color);
    }

    /**
     * The method draws a border on the screen.
     *
     * @param x the x coordinate of the top left corner of the border to be
     * painted
     * @param y the y coordinate of the top left corner of the border to be
     * painted
     * @param width the width of the border to be painted
     * @param height the height of the border to be painted
     * @param color color attributes of the border
     */
    public static void drawBorder(int x, int y, int width, int height, CharColor color)
    {
        drawCorner(x + 1, y, x + width - 1, y + height - 2, color, CORNER_UNDER_LINE);
        drawCorner(x, y + 1, x + width - 2, y + height - 1, color, CORNER_OVER_LINE);
        drawCorner(x, y, x, y, color, UL_CORNER);
        drawCorner(x + width - 1, y + height - 1, x + width - 1, y + height - 1, color, LR_CORNER);
    }

    private static String __encoding;

    /**
     * The method sets java encoding for string input and output operations
     *
     * @param encoding
     */
    public static void setEncoding(String encoding)
    {
        __encoding = encoding;
    }

    /**
     * @return the java encoding used by sring input and output operations
     */
    public static String getEncoding()
    {
        return __encoding;
    }

    private static void initEncoding()
    {
        if (isWindows())
        {
            setEncoding("CP850");
        }
    }

    private static boolean isWindows()
    {
        return (java.io.File.separatorChar == '\\');
    }

    /**
     * The method prints a string on the screen
     *
     * @param text string to be printed
     * @param rect the rectangle, within which the string must lie. If the
     * string doesn't fit within the rectangle it will be broken.
     * @param color attributes of the string
     */
    public static void printString(String text, Rectangle rect, CharColor color)
    {
        Rectangle clipRect = getCurrentClipRectangle();
        if (clipRect != null)
        {
            Rectangle newRect = rect.intersection(clipRect);
            if (!newRect.isEmpty())
            {
                printClippedString(rect, newRect, text, color);
            }
        } else
        {
            printStringWithoutClipping(text, rect, color);
        }
    }

    private static void printStringWithoutClipping(String text, Rectangle rect, CharColor color)
    {
        @SuppressWarnings("UnusedAssignment")
        byte[] bytes = null;
        if (__encoding == null)
        {
            bytes = text.getBytes();
        } else
        {
            try
            {
                bytes = text.getBytes(__encoding);
            } catch (java.io.UnsupportedEncodingException e)
            {
                __encoding = null;
                bytes = text.getBytes();
            }

        }
        printString(bytes, rect.getX(), rect.getY(), rect.getWidth(), rect.getHeight(), getColorPairNumber(color),
                __attributes[color.getColorAttribute()]);
    }

    private static List getLines(String text, int maxWidth)
    {
        ArrayList list = new ArrayList();
        StringBuffer buffer = new StringBuffer();
        for (int i = 0; i < text.length(); i++)
        {
            char c = text.charAt(i);
            if (c == '\n')
            {
                String line = buffer.toString();
                if (line.length() > maxWidth)
                {
                    list.add(line.substring(0, maxWidth));
                    list.add(line.substring(maxWidth, line.length()));
                } else
                {
                    list.add(line);
                }
                buffer = new StringBuffer();
            } else if (c == '\r')
            {
                //ignore
            } else
            {
                buffer.append(c);
            }
        }
        if (buffer.length() > 0)
        {
            list.add(buffer.toString());
        }

        return list;
    }

    private static void printClippedString(Rectangle oldRect, Rectangle newRect, String text, CharColor color)
    {
        List lines = getLines(text, oldRect.getWidth());
        int beginY = Math.max(oldRect.getY(), newRect.getY());
        int endY = Math.min(oldRect.getY() + oldRect.getHeight() - 1, newRect.getY() + newRect.getHeight() - 1);
        if (lines.size() > 0)
        {
            for (int i = 0; i < lines.size(); i++)
            {
                if (((i + oldRect.getY()) >= beginY) && ((i + oldRect.getY()) >= beginY))
                {
                    String line = (String) lines.get(i);
                    int beginPart = 0;
                    if (oldRect.getX() < newRect.getX())
                    {
                        beginPart = newRect.getX() - oldRect.getX();
                    }
                    if (beginPart < line.length())
                    {
                        line = line.substring(beginPart, line.length());
                        if (line.length() > newRect.getWidth())
                        {
                            line = line.substring(0, newRect.getWidth());
                        }
                        //Zeichnen
                        Rectangle paintRect = new Rectangle(newRect.getX(), oldRect.getY() + i, line.length(), 1);
                        printStringWithoutClipping(line, paintRect, color);
                    }

                }
            }
        }
    }

    /**
     * The method prints a string on the screen
     *
     * @param text string to be printed
     * @param x the x coordinate of the string start point
     * @param y the y coordinate of the string start point
     * @param color color attributes of the string
     */
    public static void printString(String text, int x, int y, CharColor color)
    {
        printString(text, x, y, text.length(), 1, color);
    }

    /**
     * The method prints a string on the screen. If the string doesn't fit
     * within the rectangle bounds, it wiil be broken.
     *
     * @param text string to be printed
     * @param x the x coordinate of the string start point
     * @param y the y coordinate of the string start point
     * @param width the width of bounds rectangle
     * @param height the width of bounds rectangle
     * @param color color attributes of the string
     */
    public static void printString(String text, int x, int y, int width, int height, CharColor color)
    {
        Rectangle rect = new Rectangle(x, y, width, height);
        printString(text, rect, color);
    }

    private static native void printString(byte[] chars, int x, int y, int width, int height, short colorPairNumber, long attr);

    private static byte[] __bytes = new byte[1];

    /**
     * The method reads the next code (ascii or control ) fro input stream an
     * wraps it into an instance of {@link jcurses.system.InputChar}
     *
     * @return the next read code
     */
    public static synchronized InputChar readCharacter()
    {
        int code = readByte();
        return new InputChar(code);
    }

    private static synchronized native int readByte();

    static native int getSpecialKeyCode(int code);

    /**
     * The method change the background and the foreground colors of an given
     * rectangle on the schreen
     *
     * @param rect rectangle, whose colors are to be changed
     * @param color new colors
     */
    public static void changeColors(Rectangle rect, CharColor color)
    {
        Rectangle clipRect = getCurrentClipRectangle();
        if (clipRect != null)
        {
            rect = rect.intersection(clipRect);
        }
        if (!rect.isEmpty())
        {
            changeColors(rect.getX(), rect.getY(), rect.getWidth(), rect.getHeight(), getColorPairNumber(color),
                    __attributes[color.getColorAttribute()]);
        }
    }

    private native static void changeColors(int x, int y, int width, int height, short colorPairNumber, long attr);

    /**
     * The method to make an audio alert. Works only with terminals, that
     * support 'beeps', under windows currenty does nothing.
     */
    public native static void beep();
}

class LinePart
{

    int _begin = -1;
    int _end = -2;
    int _alignment = -1;
    int _position = -1;

    public LinePart()
    {
    }

    LinePart(int begin, int end, int alignment)
    {
        _begin = begin;
        _end = end;
        _alignment = alignment;
    }

    LinePart(int begin, int end, int position, int alignment)
    {
        _begin = begin;
        _end = end;
        _position = position;
        _alignment = alignment;
    }

    boolean isEmpty()
    {
        return (_begin > _end);
    }

    @Override
    public String toString()
    {
        return "[begin=" + _begin + ",end=" + _end + ",align=" + _alignment + ",isEmpty=" + isEmpty();
    }
}
