/*
 * Copyright (C) 2017 phantombot.tv
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

package com.scaniatv;

import java.io.File;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import java.util.regex.Pattern;
import java.util.regex.Matcher;

import me.mast3rplan.phantombot.PhantomBot;

public class AnkhConverter {
	private static AnkhConverter instance = null;
	private Connection connection = null;
	private Statement statement = null;

	/*
	 * @function instance
	 *
	 * @return {Object}
	 */
	public static AnkhConverter instance() {
		if (instance == null) {
			instance = new AnkhConverter();
		}
		return instance;
	}

	/*
	 * @function AnkhConverter
	 */
	private AnkhConverter() {
		try {
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        com.gmt2001.Console.out.println("");
        com.gmt2001.Console.out.println("Starting to convert AnkhBot data to PhantomBot...");
        com.gmt2001.Console.out.println("This may take a while, please do not turn off PhantomBot.");
        com.gmt2001.Console.out.println("A notice message will be said once this is done.");
        com.gmt2001.Console.out.println("");

        try {
        	Thread.sleep(3000);
        } catch (InterruptedException ex) {
        	com.gmt2001.Console.err.println("Failed to sleep: " + ex.getMessage());
        }

        convertCurrency();
        convertCommands();
        convertQuotes();
        convertRegulars();
        convertEditors();

        PhantomBot.instance().getDataStore().SaveAll(true);
        
        com.gmt2001.Console.out.println("Done converting. Please restart PhantomBot.");
	}

	/*
	 * @function convertCurrency
	 * @info This converts peoples points and time.
	 */
	private void convertCurrency() {
		String path = System.getProperty("user.home") + "\\\\AppData\\\\Roaming\\\\AnkhHeart\\\\AnkhBotR2\\\\Twitch\\\\DataBases\\\\CurrencyDB.sqlite";
		path = path.replaceAll("\\\\", "/");

		try {
			if (new File(path).exists()) {
				connection = DriverManager.getConnection("jdbc:sqlite:" + path);
				connection.setAutoCommit(false);

				com.gmt2001.Console.out.println("");
				com.gmt2001.Console.out.println("Connected to CurrencyDB.sqlite");
				com.gmt2001.Console.out.println("");

				PhantomBot.instance().getDataStore().setAutoCommit(false);

				statement = connection.createStatement();
				ResultSet results = statement.executeQuery("select * from CurrencyUser;");

				while (results.next()) {
					String username = results.getString("Name").toLowerCase();
					String points = results.getString("Points");
					long finalTime = 0;

					if (results.getString("Hours").contains(":") && !results.getString("Hours").equals("00:00:00")) {
						String span = results.getString("Hours");
						String days = "0";
						String hours = "0";
						String mins = "0";
						String secs = "0";

						try {
							days = span.substring(0, span.indexOf("."));
							hours = span.substring(span.indexOf(".") + 1).split(":")[0];
							mins = span.substring(span.indexOf(".") + 1).split(":")[1];
							secs = span.substring(span.indexOf(".") + 1).split(":")[2];
						} catch (Exception ex) {
							hours = span.split(":")[0];
							mins = span.split(":")[1];
							secs = span.split(":")[2];
						}

						long finalDays = (long) Math.floor(Long.parseLong(days) * 86400);
						long finalHours = (long) Math.floor(Long.parseLong(hours) * 3600);
						long finalMins = (long) Math.floor(Long.parseLong(mins) * 60);
						int finalSecs = Integer.parseInt(secs);

						finalTime = (long) Math.floor(finalDays + finalHours + finalMins + finalSecs);
					} else {
						try {
							finalTime = (long) Math.floor(Long.parseLong(results.getString("MinutesWatched")) * 60);
						} catch (Exception ex) {
							finalTime = 0;
						}
					}

					PhantomBot.instance().getDataStore().set("points", username, points);
					PhantomBot.instance().getDataStore().set("time", username, new Long(finalTime).toString());
					com.gmt2001.Console.out.println("[SUCCESS] Moved: " + username + "'s time and points over! [Points: " + points + " - Time: " + finalTime + "]");
				}
				PhantomBot.instance().getDataStore().setAutoCommit(true);

				statement.close();
      			connection.close();
      			statement = null;
      			connection = null;
			}
		} catch (Exception ex) {
			com.gmt2001.Console.err.println("Failed to convert CurrencyDB [" + ex.getClass().getName() + "]: " + ex.getMessage());
		}
	}

	/*
	 * @function convertCommands
	 * @info This converts most commands
	 */
	private void convertCommands() {
		String path = System.getProperty("user.home") + "\\\\AppData\\\\Roaming\\\\AnkhHeart\\\\AnkhBotR2\\\\Twitch\\\\DataBases\\\\CommandsDB.sqlite";
		path = path.replaceAll("\\\\", "/");

		try {
			if (new File(path).exists()) {
				connection = DriverManager.getConnection("jdbc:sqlite:" + path);
				connection.setAutoCommit(false);

				com.gmt2001.Console.out.println("");
				com.gmt2001.Console.out.println("Connected to CommandsDB.sqlite");
				com.gmt2001.Console.out.println("");
				PhantomBot.instance().getDataStore().setAutoCommit(false);

				statement = connection.createStatement();
				ResultSet results = statement.executeQuery("select * from RegCommand;");

				while (results.next()) {
					String command = results.getString("Command").toLowerCase();
					String permission = convertPerm(results.getString("Permission"));
					String response = convertTags(results.getString("Response"));
					String count = results.getString("Count");
					String cooldown = results.getString("Cooldown");

					// ankh handles keywords with commands. Our commands only start with !.
					if (command.startsWith("!") && !PhantomBot.instance().getDataStore().exists("command", command) && !PhantomBot.instance().getDataStore().exists("permcom", command)) {
						command = command.substring(1);
						PhantomBot.instance().getDataStore().set("command", command, response);
						PhantomBot.instance().getDataStore().set("cooldown", command, cooldown);
						PhantomBot.instance().getDataStore().set("commandCount", command, count);
						PhantomBot.instance().getDataStore().set("permcom", command, permission);

						com.gmt2001.Console.out.println("[SUCCESS] Moved command: " + command + " over! [Cooldown: " + cooldown + " - Permission: " + permission + " - Count: " + count + "]");
					} else {
						com.gmt2001.Console.out.println("[ERROR] Failed to move command: " + command + " over.");
					}
				}
				PhantomBot.instance().getDataStore().setAutoCommit(true);

				statement.close();
      			connection.close();
      			statement = null;
      			connection = null;
			}
		} catch (Exception ex) {
			com.gmt2001.Console.err.println("Failed to convert CommandsDB [" + ex.getClass().getName() + "]: " + ex.getMessage());
		}
	}

	/*
	 * @function convertQuotes
	 * @info This converts all quotes
	 */
	private void convertQuotes() {
		String path = System.getProperty("user.home") + "\\\\AppData\\\\Roaming\\\\AnkhHeart\\\\AnkhBotR2\\\\Twitch\\\\DataBases\\\\QuotesDB.sqlite";
		path = path.replaceAll("\\\\", "/");

		try {
			if (new File(path).exists()) {
				connection = DriverManager.getConnection("jdbc:sqlite:" + path);
				connection.setAutoCommit(false);

				com.gmt2001.Console.out.println("");
				com.gmt2001.Console.out.println("Connected to QuotesDB.sqlite");
				com.gmt2001.Console.out.println("");
				PhantomBot.instance().getDataStore().setAutoCommit(false);

				statement = connection.createStatement();
				ResultSet results = statement.executeQuery("select * from Quote;");

				int id = PhantomBot.instance().getDataStore().GetKeyList("quotes", "").length;
				Pattern quotepat = Pattern.compile("\"(.*)\"");
				Pattern gamepat = Pattern.compile("\\[([a-zA-Z_:\\s]+)\\]");

				while (results.next()) {
					String quote = results.getString("Text");

					Matcher matchQuote = quotepat.matcher(quote);
					Matcher matchGame = gamepat.matcher(quote);
					String newquote = "";

					if (matchQuote.find() == true) {
						if (matchGame.find() == true) {
							newquote = "[\"" + PhantomBot.instance().getSession().getNick() + "\",\"" + matchQuote.group(1).replaceAll("\"", "''") + "\",\"" + System.currentTimeMillis() + "\",\"" + matchGame.group(1).replaceAll("\"", "''") + "\"]";
						} else {
							newquote = "[\"" + PhantomBot.instance().getSession().getNick() + "\",\"" + matchQuote.group(1).replaceAll("\"", "''") + "\",\"" + System.currentTimeMillis() + "\",\"Some Game\"]";
						}
					} else {
						newquote = "[\"" + PhantomBot.instance().getSession().getNick() + "\",\"" + quote.replaceAll("\"", "''") + "\",\"" + System.currentTimeMillis() + "\",\"Some Game\"]";
					}

					id++;
					PhantomBot.instance().getDataStore().set("quotes", new Integer(id).toString(), newquote.toString());
					com.gmt2001.Console.out.println("[SUCCESS] Moved quote: #" + id + " over!");
				}
				PhantomBot.instance().getDataStore().setAutoCommit(true);

				statement.close();
      			connection.close();
      			statement = null;
      			connection = null;
			}
		} catch (Exception ex) {
			com.gmt2001.Console.err.println("Failed to convert QuotesDB [" + ex.getClass().getName() + "]: " + ex.getMessage());
		}
	}

	/*
	 * @function convertRegulars
	 * @info This converts all regulars
	 */
	private void convertRegulars() {
		String path = System.getProperty("user.home") + "\\\\AppData\\\\Roaming\\\\AnkhHeart\\\\AnkhBotR2\\\\Twitch\\\\DataBases\\\\RegularsDB.sqlite";
		path = path.replaceAll("\\\\", "/");

		try {
			if (new File(path).exists()) {
				connection = DriverManager.getConnection("jdbc:sqlite:" + path);
				connection.setAutoCommit(false);

				com.gmt2001.Console.out.println("");
				com.gmt2001.Console.out.println("Connected to RegularsDB.sqlite");
				com.gmt2001.Console.out.println("");
				PhantomBot.instance().getDataStore().setAutoCommit(false);

				statement = connection.createStatement();
				ResultSet results = statement.executeQuery("select * from Regular;");

				while (results.next()) {
					String username = results.getString("User");

					PhantomBot.instance().getDataStore().set("group", username.toLowerCase(), "7");
					
					com.gmt2001.Console.out.println("[SUCCESS] Moved regular: " + username + " over!");
				}
				PhantomBot.instance().getDataStore().setAutoCommit(true);

				statement.close();
      			connection.close();
      			statement = null;
      			connection = null;
			}
		} catch (Exception ex) {
			com.gmt2001.Console.err.println("Failed to convert RegularsDB [" + ex.getClass().getName() + "]: " + ex.getMessage());
		}
	}

	/*
	 * @function convertEditors
	 * @info This converts all editors
	 */
	private void convertEditors() {
		String path = System.getProperty("user.home") + "\\\\AppData\\\\Roaming\\\\AnkhHeart\\\\AnkhBotR2\\\\Twitch\\\\DataBases\\\\EditorsDB.sqlite";
		path = path.replaceAll("\\\\", "/");

		try {
			if (new File(path).exists()) {
				connection = DriverManager.getConnection("jdbc:sqlite:" + path);
				connection.setAutoCommit(false);

				com.gmt2001.Console.out.println("");
				com.gmt2001.Console.out.println("Connected to EditorsDB.sqlite");
				com.gmt2001.Console.out.println("");
				PhantomBot.instance().getDataStore().setAutoCommit(false);

				statement = connection.createStatement();
				ResultSet results = statement.executeQuery("select * from Editor;");

				while (results.next()) {
					String username = results.getString("User");

					PhantomBot.instance().getDataStore().set("group", username.toLowerCase(), "1");
					
					com.gmt2001.Console.out.println("[SUCCESS] Moved editor: " + username + " over!");
				}
				PhantomBot.instance().getDataStore().setAutoCommit(true);

				statement.close();
      			connection.close();
      			statement = null;
      			connection = null;
			}
		} catch (Exception ex) {
			com.gmt2001.Console.err.println("Failed to convert EditorsDB [" + ex.getClass().getName() + "]: " + ex.getMessage());
		}
	}

	/*
	 * @function convertTags
	 *
	 * @param  {String} command
	 * @return {String}
	 */
	private String convertTags(String command) {
		return command.replaceAll("\\$user", "(sender)").replaceAll("\\$msg", "(echo)").replaceAll("\\$num", "(1)").replaceAll("\\$currenyname", "(pointsname)").replaceAll("\\$count", "(count)").
			replaceAll("\\$uptime", "(uptime)").replaceAll("\\$mygame", "(game)").replaceAll("\\$mystatus", "(status)").replaceAll("\\$randuser", "(random)").replaceAll("\\$target", "(touser)");
	}

	/*
	 * @function convertPerm
	 *
	 * @param  {String} perm
	 * @return {String}
	 */
	private String convertPerm(String perm) {
		switch (perm) {
			case "Caster":
				return "0";
			case "Editor":
				return "1";
			case "Moderator":
				return "2";
			case "Subscriber":
				return "3";
			case "Regular":
				return "6";
			default:
				return "7";
		} 
	}
}
