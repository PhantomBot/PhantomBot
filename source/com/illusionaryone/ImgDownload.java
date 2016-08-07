/* astyle --style=java --indent=spaces=4 */

/*
 * Copyright (C) 2016 phantombot.tv
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
package com.illusionaryone;

import com.gmt2001.UncaughtExceptionHandler;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;

import java.nio.file.Files;
import java.nio.file.Paths;

import java.net.URL;

/*
 * Downloads an image from a given URL.
 *
 * @author illusionaryone
 */
public class ImgDownload {

    /*
     * Download an image from a HTTP URL.
     *
     * @param   String  HTTP URL to download from.
     * @param   String  The filename to save the remote image as.
     * @return  String  Returns 'true' or 'false'.  As Rhino does not like Boolean, this is a String.
     */
    public static String downloadHTTP(String urlString, String filename) {
        try {
            URL url = new URL(urlString);
            InputStream inputStream = new BufferedInputStream(url.openStream());
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    
            byte[] buffer = new byte[1024];
            int n = 0;
    
            while ((n = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, n);
            }
            outputStream.close();
            inputStream.close();
            byte[] imgData = outputStream.toByteArray();
    
            if (!new File ("./addons/downloadHTTP").exists()) {
                new File ("./addons/downloadHTTP").mkdirs();
            }

            FileOutputStream fileOutputStream = new FileOutputStream("./addons/downloadHTTP/" + filename);
            fileOutputStream.write(imgData);
            fileOutputStream.close();
            return new String("true");
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("ImgDownload::downloadHTTP(" + urlString + ", " + filename + ") failed: " +
                                            ex.getMessage());
            return new String("false");
        }
    }
}
