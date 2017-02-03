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
 
/**
 * The osuListener class intercepts application messages sent to the MSN messenger status integration by
 * disguising a hidden native window as the MSN window class.
 *
 * @author Andreas "Nekres" Gärtner
 * @version 02.02.2017 22:22
 */
package com.nekres;

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

import java.util.Arrays;
import java.util.List;
import java.util.HashMap;

import me.mast3rplan.phantombot.PhantomBot;

public class MSNeventListener {

    public static final int WM_COPYDATA = 0x004A;
    public static final int GWL_WNDPROC = -4;
    public static final String lpClassName = "MsnMsgrUIManager";
    public static final Object msnWndHandle = new Object();
    public Thread msnListener;
    public static MyUser32 lib;
    public static String _msnString;
    
    public MSNeventListener()
    { 
    	
    	msnListener = new Thread(new MsnMessagePump());

        try {
            msnListener.start();
            msnListener.join();
        } catch(Exception ex) {
            //ex.printStackTrace();
        }
    }
    public interface MyUser32 extends User32 {

        public final MyUser32 lib = (MyUser32) Native.loadLibrary("user32", MyUser32.class, W32APIOptions.UNICODE_OPTIONS);

        long SetWindowLongPtr(HWND hWnd, int nIndex, Callback callback);
        long SetWindowLong(HWND hWnd, int nIndex, Callback callback);
    }
    public class COPYDATASTRUCT extends Structure {
        public COPYDATASTRUCT(final Pointer memory) {
            super(memory);
            read();
        }

        public int dwData;
        public int cbData;
        public Pointer lpData;

        protected List<String> getFieldOrder() {
            return Arrays.asList(new String[] { "dwData", "cbData", "lpData" });
        }
    }

    public class MsnMessagePump implements Runnable {
    	public void run() { 
    		synchronized(msnWndHandle) {
    			WNDCLASSEX msnWndClass = new WNDCLASSEX();
    			msnWndClass.lpszClassName = lpClassName;
    			msnWndClass.lpfnWndProc = WNDPROC;
    			if (lib.RegisterClassEx(msnWndClass).intValue() > 0) {
    				// Create a native window
    				HWND hMsnWnd = lib.CreateWindowEx(0, lpClassName, "", 0,
    							0, 0, 0, 0, null, null, null, null);
    				// Register the callback
    				try {
    					// Use SetWindowLongPtr if available (64-bit safe)
    					lib.SetWindowLongPtr(hMsnWnd, GWL_WNDPROC, WNDPROC);
    					//System.err.println("Registered 64-bit callback");
    				} catch(UnsatisfiedLinkError e) {
    					// Use SetWindowLong if SetWindowLongPtr isn't available
    					lib.SetWindowLong(hMsnWnd, GWL_WNDPROC, WNDPROC);
    					//System.err.println("Registered 32-bit callback");
    				}
    				// Handle events until the window is destroyed
    				MSG msg = new MSG();
    				msg.clear();
    				while(lib.GetMessage(msg, hMsnWnd, 0, 0) > 0) {
    					lib.TranslateMessage(msg);                                 
    					lib.DispatchMessage(msg);
    				}
    			}
    		}
    	}
	}
    WindowProc WNDPROC = new WindowProc() { 
    	@Override
        public LRESULT callback(HWND hWnd, int uMsg, WPARAM wParam, LPARAM lParam)
        {
            if (uMsg == WM_COPYDATA) {
                COPYDATASTRUCT copydatastruct = new COPYDATASTRUCT(new Pointer(lParam.longValue()));
                String str = copydatastruct.lpData.getWideString(0);
                if (str.equals(_msnString)) { return new LRESULT(0); };
                _msnString = str;
                String[] sourceArray = str.split("\\\\0");
                if (sourceArray.length > 5) {
                    HashMap<String, String> _osuStatus = new HashMap<String, String>();
                    _osuStatus.put("artist", sourceArray[5]);
                    _osuStatus.put("title", sourceArray[4]);
                    if (sourceArray.length > 6) {
                        _osuStatus.put("diff", " " + sourceArray[6]);
                        _osuStatus.put("status", sourceArray[3].split(" ")[0]);
                    } else {
                        _osuStatus.put("diff", "");
                        _osuStatus.put("status", sourceArray[3].split(" ")[0] + " to");
                    }
                    if (!PhantomBot.instance().isExiting()) {
                        PhantomBot.instance().getSession().say(_osuStatus.get("status") + " " + _osuStatus.get("artist") + " - " + _osuStatus.get("title") + _osuStatus.get("diff"));
                    }
                };
            };
            return new LRESULT(lib.DefWindowProc(hWnd, uMsg, wParam, lParam).intValue());
        };

    };
}