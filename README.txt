Changes made:

----systems-ticketraffleSystem----

Added Line 40 for !amount
Line 30 edited to show amount of tickets after entering to prevent people using 2 commands to see changes


----ticketraffleSystem----

Line 353 added !amount command. !amount does math based on sub/no sub to output the ticket amount. This currently hides multiplier

Line 154 to 232 large changes made to system. Bot now uses a adjusted Max Entries based on sub/reg multiplier. Old code simply
stopped a user from entering anymore once they passed the maxEntries. IE: Max = 100 | Sub = 2x | Sub enter 80 times = 160 tickets
| Sub unable to enter 20 more tickets to reach the 100 max

Line 24/25 Added trueSubMaxEntries and trueRegMaxEntries

I've tested this via stream. I believe I've gotten all the bugs out however unsure. 

If the print outs are to much, I'd simply need to take out the reply with successful entry