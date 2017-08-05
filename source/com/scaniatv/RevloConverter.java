/*
 * Copyright (C) 2016-2017 phantombot.tv
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

/*
 * @author scaniatv
 */

package com.scaniatv;

import com.gmt2001.datastore.DataStore;

import java.io.FileReader;
import java.io.IOException;
import java.io.BufferedReader;

import tv.phantombot.PhantomBot;

public class RevloConverter {
	public static void convert(String fileName) {
		DataStore db = PhantomBot.instance().getDataStore();
		BufferedReader bufferedReader = null;
		String brLine = "";

		com.gmt2001.Console.out.println("Importing RevloBot points...");

		// Turn off auto commit to make this process faster.
		db.setAutoCommit(false);

		try {
			// Create a new reader.
			bufferedReader = new BufferedReader(new FileReader(fileName));

			// Skip the first line.
			bufferedReader.readLine();

			while ((brLine = bufferedReader.readLine()) != null) {
				String[] spl = brLine.split(",");
				
				db.set("points", spl[0].toLowerCase(), spl[2]);
				com.gmt2001.Console.out.println("Imported: " + spl[0] + " - Points: " + spl[2]);
			}
		} catch (IOException ex) {
			com.gmt2001.Console.err.println("Failed to convert points from RevloBot [IOException] " + ex.getMessage());
		} catch (Exception ex) {
			com.gmt2001.Console.err.println("Failed to convert points from RevloBot [Exception] " + ex.getMessage());
		} finally {
			if (bufferedReader != null) {
				try {
					bufferedReader.close();
				} catch (IOException ex) {
					com.gmt2001.Console.err.printStackTrace(ex);
				}
			}
			// Set auto commit on again and save all files.
			db.setAutoCommit(true);
			db.SaveAll(true);
		}
	}
}
