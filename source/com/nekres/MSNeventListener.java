/*
 * Copyright (C) 2017 A. Gärtner
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package com.nekres;

/* Java Native Access (JNA); jna-*.jar, jna-platform-*.jar */
import com.sun.jna.platform.win32.User32;
import com.sun.jna.platform.win32.WinDef.HWND;
import com.sun.jna.platform.win32.WinDef.LPARAM;
import com.sun.jna.platform.win32.WinDef.LRESULT;
import com.sun.jna.platform.win32.WinDef.WPARAM;
import com.sun.jna.platform.win32.WinUser.MSG;
import com.sun.jna.platform.win32.WinUser.WNDCLASSEX;
import com.sun.jna.platform.win32.WinUser.WindowProc;
import com.sun.jna.win32.W32APIOptions;
import com.sun.jna.Native;
import com.sun.jna.Callback;
import com.sun.jna.Pointer;
import com.sun.jna.Structure;

/* Java library */
import java.util.Arrays;
import java.util.List;
import java.util.HashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

import me.mast3rplan.phantombot.PhantomBot;

/**
 * The MSNeventListener class intercepts application messages sent to the MSN messenger status integration by
 * disguising a hidden native window as the MSN window class.
 *
 * @author Andreas "Nekres" Gärtner
 * @version 05.02.2017 00:00
 */
public class MSNeventListener {

    public static int WM_COPYDATA;
    public static int GWL_WNDPROC;
    public static String lpClassName;
    public static ScheduledExecutorService msnListener;
    public static String _msnString;
    
    /**
     * Constructor for objects of class MSNeventListener
     * @throws Exception
     */
    public MSNeventListener()
    { 
        WM_COPYDATA = 0x004A;
        GWL_WNDPROC = -4;
        lpClassName = "MsnMsgrUIManager";
        msnListener = Executors.newScheduledThreadPool(5);
    }
    
    public void start() {
        try {
            msnListener.scheduleAtFixedRate(new MsnMessagePump(), 0, 5, TimeUnit.SECONDS);
        } catch(Exception ex) {
            ex.printStackTrace();
        }
    }
    
    /**
     * Interface MyUser32 overwrites the SetWindowLong method of the
     * user32 library to accept Callback as third parameter.
     */
    public interface MyUser32 extends User32 {
		public final MyUser32 INSTANCE = (MyUser32) Native.loadLibrary("user32", MyUser32.class, W32APIOptions.UNICODE_OPTIONS);

		long SetWindowLongPtr(HWND hWnd, int nIndex, Callback callback);
		long SetWindowLong(HWND hWnd, int nIndex, Callback callback);
    }
    
    /**
     * Implementation of class COPYDATASTRUCT for broadcast messages.
     * @returns List
     */
    public class COPYDATASTRUCT extends Structure {
        public COPYDATASTRUCT(final Pointer memory) {
            super(memory);
            read();
        }

        public int dwData;
        public long cbData;
        public Pointer lpData;

        protected List<String> getFieldOrder() {
            return Arrays.asList(new String[] { "dwData", "cbData", "lpData" });
        }
    }

    /**
     * The runnable MsnMessagePump class handles the messages normally received by the MSN messenger.
     * @throws UnsatisfiedLinkError
     */
    public class MsnMessagePump implements Runnable {
    	public void run() {
    		WNDCLASSEX msnWndClass = new WNDCLASSEX();
    		msnWndClass.lpszClassName = lpClassName;
    		msnWndClass.lpfnWndProc = WNDPROC;
    		if (MyUser32.INSTANCE.RegisterClassEx(msnWndClass).intValue() > 0) {
    			// Create a native window
    			HWND hMsnWnd = MyUser32.INSTANCE.CreateWindowEx(0, lpClassName, "", 0,
    						0, 0, 0, 0, null, null, null, null);
    			// Register the callback
    			try {
    				// Use SetWindowLongPtr if available (64-bit safe)
    				MyUser32.INSTANCE.SetWindowLongPtr(hMsnWnd, GWL_WNDPROC, WNDPROC);
    			} catch(UnsatisfiedLinkError e) {
    				// Use SetWindowLong if SetWindowLongPtr isn't available
    				MyUser32.INSTANCE.SetWindowLong(hMsnWnd, GWL_WNDPROC, WNDPROC);
    			}
    			// Handle events until the window is destroyed
    			MSG msg = new MSG();
    			msg.clear();
    			while(MyUser32.INSTANCE.GetMessage(msg, hMsnWnd, 0, 0) > 0) {
    				MyUser32.INSTANCE.TranslateMessage(msg);                                 
    				MyUser32.INSTANCE.DispatchMessage(msg);
    			}
    		}
    	}
	}
    
    /**
     * The window procedure WNDPROC overrides the default callback method with a customized one.
     * @returns LRESULT
     */
    WindowProc WNDPROC = new WindowProc() { 
    	@Override
        public LRESULT callback(HWND hWnd, int uMsg, WPARAM wParam, LPARAM lParam)
        {
            if (uMsg == WM_COPYDATA) {
                COPYDATASTRUCT copydatastruct = new COPYDATASTRUCT(new Pointer(lParam.longValue()));
                String str = copydatastruct.lpData.getWideString(0);
                if (str.equals(_msnString)) { return new LRESULT(0); }; // Check if dublicate.
                _msnString = str;
                String[] sourceArray = str.split("\\\\0"); // Split message data at zero bytes.
                if (sourceArray.length > 6 && Arrays.asList(sourceArray).contains("osu!")) {
                    HashMap<String, String> _osuStatus = new HashMap<String, String>();
                    _osuStatus.put("artist", sourceArray[5]);
                    _osuStatus.put("title", sourceArray[4]);
                    if (sourceArray.length > 7) {
                        _osuStatus.put("diff", " [" + sourceArray[7] + "]");
                        _osuStatus.put("status", sourceArray[3].split(" ")[0].toLowerCase());
                    } else {
                        _osuStatus.put("diff", "");
                        _osuStatus.put("status", sourceArray[3].split(" ")[0].toLowerCase() + " to");
                    }
                    if (!PhantomBot.instance().isExiting()) {
                        PhantomBot.instance().getSession().say("/me is " + _osuStatus.get("status") + " " + _osuStatus.get("artist") + " - " + _osuStatus.get("title") + _osuStatus.get("diff"));
                    }
                };
            };
            return new LRESULT(MyUser32.INSTANCE.DefWindowProc(hWnd, uMsg, wParam, lParam).intValue());
        };

    };
}