/* astyle --style=java --indent=spaces=4 */

/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
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
     * @return  String  Returns 'true' or 'false'.  As Rhino does not like boolean, this is a String.
     */
    public static String downloadHTTPTo(String urlString, String location) {
        try {
            URL url = new URL(urlString);
            ByteArrayOutputStream outputStream;
            try (InputStream inputStream = new BufferedInputStream(url.openStream())) {
                outputStream = new ByteArrayOutputStream();
                byte[] buffer = new byte[1024];
                int n = 0;
                while ((n = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, n);
                }
                outputStream.close();
            }
            byte[] imgData = outputStream.toByteArray();

            if (!new File (location.substring(0, location.lastIndexOf("/"))).exists()) {
                new File (location.substring(0, location.lastIndexOf("/"))).mkdirs();
            }

            try (FileOutputStream fileOutputStream = new FileOutputStream(location)) {
                fileOutputStream.write(imgData);
            }
            return new String("true");
        } catch (IOException ex) {
            com.gmt2001.Console.debug.println("ImgDownload::downloadHTTP(" + urlString + ", " + location + ") failed: " +
                                            ex.getMessage());
            return new String("false");
        }
    }

    /*
     * Download an image from a HTTP URL.
     *
     * @param   String  HTTP URL to download from.
     * @param   String  The filename to save the remote image as.
     * @return  String  Returns 'true' or 'false'.  As Rhino does not like boolean, this is a String.
     */
    public static String downloadHTTP(String urlString, String filename) {
        return downloadHTTPTo(urlString, "./addons/downloadHTTP/" + filename);
    }
}
