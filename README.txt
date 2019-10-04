Changes made:

----systems-ticketraffleSystem----

Added Line 40 for !amount
Line 30 edited to show amount of tickets after entering to prevent people using 2 commands to see changes


----ticketraffleSystem----

Line 366 added !amount command. !amount does math based on sub/no sub to output the ticket amount. This currently hides multiplier

Line 156 to 245 large changes made to system. Bot now uses a adjusted Max Entries based on sub/reg multiplier. Old code simply
stopped a user from entering anymore once they passed the maxEntries. IE: Max = 100 | Sub = 2x | Sub enter 80 times = 160 tickets
| Sub unable to enter 20 more tickets to reach the 100 max

Line 24/25/26 Added trueSubMaxEntries and trueRegMaxEntries and uneffectedTickets (used for tracking tickets uneffected by multiplier.
Note this can be replaced with getTickets(user)/2 and a if sub statement to prevent 0 values glitches)

I've tested this via stream. I believe I've gotten all the bugs out however unsure. 