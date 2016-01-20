/* 
 * Copyright (C) 2015 www.phantombot.net
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
package de.simeonf;

import java.io.File;
import java.io.FileInputStream;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;

import java.security.KeyStore;

import org.java_websocket.server.DefaultSSLWebSocketServerFactory;


public class EventWebSocketSecureServer extends EventWebSocketServer
{

    private static EventWebSocketSecureServer instance;

    public static EventWebSocketSecureServer instance()
    {
        return instance;
    }
    
    public EventWebSocketSecureServer(int port)
    {
    	this(port, null, null, null);
	}
    
    public EventWebSocketSecureServer(int port, String keystorepath, String keystorepassword, String keypassword)
    {
		super(port);

    	try
		{
			SSLContext sslContext = SSLContext.getInstance("TLS");
	
	    	if (!keystorepath.equals(""))
	    	{
				KeyStore ks = KeyStore.getInstance("JKS");
				ks.load(new FileInputStream(new File(keystorepath)), keystorepassword.toCharArray());

				KeyManagerFactory kmf = KeyManagerFactory.getInstance("SunX509");
				kmf.init(ks, keypassword.toCharArray());
				TrustManagerFactory tmf = TrustManagerFactory.getInstance("SunX509");
				tmf.init(ks);

				sslContext.init(kmf.getKeyManagers(), tmf.getTrustManagers(), null);
	    	}
			else
			{
				sslContext.init(null, null, null);
			}
	        this.setWebSocketFactory(new DefaultSSLWebSocketServerFactory(sslContext));
		}
    	catch(Exception e)
		{
	        com.gmt2001.Console.out.println("Secure EventSocketServer failed: " + e);
	        e.printStackTrace();
		}
    }
}