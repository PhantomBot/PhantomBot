/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
package com.gmt2001.datastore;

/*
 * Final class that is used to convert datastores.
 *
 * @author ScaniaTV
 */
public final class DataStoreConverter {

    /*
	 * Class constructor.
     */
    private DataStoreConverter() {

    }

    /*
	 * Method that converts a datastore to another one.
	 *
	 * @param  {DataStore} primaryDbInstance - The destination datastore
	 * @param  {DataStore} secondaryDbInstance - The source datastore
     */
    public static void convertDataStore(DataStore primaryDbInstance, DataStore secondaryDbInstance) {
        com.gmt2001.Console.out.println("Starting datatore convertion. This could take time...");

        // Convert our old database to our new one.
        com.gmt2001.Console.out.println("Converting old datastore to the new one...");
        String[] tables = secondaryDbInstance.GetFileList();
        for (String table : tables) {
            com.gmt2001.Console.out.println("Converting table: " + table);
            // Get the list of sections for this table.
            String[] sections = secondaryDbInstance.GetCategoryList(table);
            for (String section : sections) {
                // Get all keys for this table.
                String[] keys = secondaryDbInstance.GetKeyList(table, section);
                for (String key : keys) {
                    // Get the value from the old database and set it in the new one.
                    primaryDbInstance.SetString(table, section, key, secondaryDbInstance.GetString(table, section, key));
                }
            }
        }

        // Close the old database.
        secondaryDbInstance.dispose();
        com.gmt2001.Console.out.println("Finished converting datastore.");
    }
}
