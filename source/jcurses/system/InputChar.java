package jcurses.system;

/**
 * The instances of this class represent characters or key codes, that are input
 * by an user. An instance of the class contains einther a ascii character or
 * one of in the class declared constants for function keys and control keys.
 */
public class InputChar
{

    public static final int KEY_DOWN = Toolkit.getSpecialKeyCode(0402);            /*
     * Down-arrow
     */

    public static final int KEY_UP = Toolkit.getSpecialKeyCode(0403);		/*
     * Up-arrow
     */

    public static final int KEY_LEFT = Toolkit.getSpecialKeyCode(0404);		/*
     * Left-arrow
     */

    public static final int KEY_RIGHT = Toolkit.getSpecialKeyCode(0405);            /*
     * Right-arrow
     */

    public static final int KEY_HOME = Toolkit.getSpecialKeyCode(0406);            /*
     * Home
     */

    public static final int KEY_BACKSPACE = Toolkit.getSpecialKeyCode(0407);            /*
     * Backspace (unreliable)
     */

    public static final int KEY_F1 = Toolkit.getSpecialKeyCode(0411);            /*
     * Function keys. Space for 64
     */

    public static final int KEY_F2 = Toolkit.getSpecialKeyCode(0412);    		/*
     * Function keys
     */

    public static final int KEY_F3 = Toolkit.getSpecialKeyCode(0413);    		/*
     * Function keys
     */

    public static final int KEY_F4 = Toolkit.getSpecialKeyCode(0414);    		/*
     * Function keys
     */

    public static final int KEY_F5 = Toolkit.getSpecialKeyCode(0415);    		/*
     * Function keys
     */

    public static final int KEY_F6 = Toolkit.getSpecialKeyCode(0416);    		/*
     * Function keys
     */

    public static final int KEY_F7 = Toolkit.getSpecialKeyCode(0417);    		/*
     * Function keys
     */

    public static final int KEY_F8 = Toolkit.getSpecialKeyCode(0420);    		/*
     * Function keys
     */

    public static final int KEY_F9 = Toolkit.getSpecialKeyCode(0421);    		/*
     * Function keys
     */

    public static final int KEY_F10 = Toolkit.getSpecialKeyCode(0422);    		/*
     * Function keys
     */

    public static final int KEY_F11 = Toolkit.getSpecialKeyCode(0423);    		/*
     * Function keys
     */

    public static final int KEY_F12 = Toolkit.getSpecialKeyCode(0424);    		/*
     * Function keys
     */

    public static final int KEY_DC = Toolkit.getSpecialKeyCode(0512);            /*
     * Delete character
     */

    public static final int KEY_IC = Toolkit.getSpecialKeyCode(0513);            /*
     * Insert char or enter insert mode
     */

    public static final int KEY_NPAGE = Toolkit.getSpecialKeyCode(0522);            /*
     * Next page
     */

    public static final int KEY_PPAGE = Toolkit.getSpecialKeyCode(0523);            /*
     * Previous page
     */

    public static final int KEY_PRINT = Toolkit.getSpecialKeyCode(0532);            /*
     * Print
     */

    public static final int KEY_END = Toolkit.getSpecialKeyCode(0550);		      /*
     * End
     */


    private int _code = -1;
    private String _string = null;

    private static byte[] __bytes = new byte[1];

    /**
     * The constructor
     *
     * @param code the code of input char
     */
    public InputChar(int code)
    {
        _code = code;
        if (_code <= 0xff)
        {
            _string = convertByteToString(_code);
        }
    }

    /**
     * The constructor
     *
     * @param character an input ascii character
     */
    public InputChar(char character)
    {
        _string = "" + character;
        _code = _string.getBytes()[0];

    }

    /**
     * The return value of this method tells, whether the instance contains a
     * control code or an ascii character.
     *
     * @return <code>true</code>, if a control code is contained,
     * <code>false</code> otherwise.
     */
    public boolean isSpecialCode()
    {
        return (_code > 0xff);
    }

    private static synchronized String convertByteToString(int code)
    {
        __bytes[0] = (byte) code;
        @SuppressWarnings("UnusedAssignment")
        String result = null;
        String encoding = Toolkit.getEncoding();
        if (encoding == null)
        {
            result = new String(__bytes);
        } else
        {
            try
            {
                result = new String(__bytes, encoding);
            } catch (java.io.UnsupportedEncodingException e)
            {
                result = new String(__bytes);
                Toolkit.setEncoding(null);
            }
        }
        return result;
    }

    /**
     * The method returns the character, contained in this object.
     *
     * @return the character, contained in this object
     * @throws java.lang.RuntimeException, if the instance doesn't contain a
     * character, but a control code
     */
    public char getCharacter()
    {
        if (isSpecialCode())
        {
            throw new RuntimeException("this is a special key");
        }
        return _string.charAt(0);
    }

    /**
     * @return the string representation of the object
     */
    @Override
    public String toString()
    {
        return _string;
    }

    /**
     * @return the code ( ascii or control), contained in this instance
     */
    public int getCode()
    {
        return _code;
    }

    /**
     * Two instances of this class are equal, if they contain same codes.
     *
     * @param obj the object to compare
     * @return <code>true</code>, if this instance equal to <code>obj</code>,
     * false otherwise
     */
    @Override
    public boolean equals(Object obj)
    {
        if (!(obj instanceof InputChar))
        {
            return false;
        }

        InputChar character2 = (InputChar) obj;

        return (_code == character2.getCode());

    }

    /**
     * The method needed to make it possible to use instances of this class as
     * keys for <code>java.util.Hashtable</code>
     *
     * @return the code contained in the instance
     */
    @Override
    public int hashCode()
    {
        return _code;
    }

}
