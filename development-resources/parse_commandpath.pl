#!/usr/bin/perl

# 
# Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
# 

# parse_commandpath.pl
# 
# Execute from the root of your scripts directory, where init.js is contained, to generate the core of the table
# for the Command List page on the PhantbomBot website.  This will not do much good on other websites, this is
# custom made for the PhantomBot site.
#
# Under Windows, run as perl parse_commandpath.pl

use File::Find;

use strict;

# <td><a class="tipped" data-title="Click to Copy Module to Clipboard">./commands/customCommands.js and !command</a></td>
# Output format:
# <tr class="hideLink">
#   <td>
#     <div class="tipped" data-title="Click to Copy Module to Clipboard">./directory/script.js</div>
#   </td>
#   <td>
#     <div class="tipped" data-title="Click to Copy Command to Clipboard">!command</div>
#   </td>
#   <td>!command options</td>
#   <td>Description</td>
# </tr>

my (@fileList, @commandPathData);
my ($moduleName, $commandName, $commandSubText, $commandOptions, $commandDesc, $commandSubCommands, $extractString);
my $str = './';
my $find = './javascript-source/';

sub findWanted { if (/\.js$/s) { push @fileList, $File::Find::name; } } 
find(\&findWanted, "./javascript-source/");

my (@dateData) = localtime();
printf "<!-- PhantomBot \@commandpath Parser. Executed on: %02d/%02d/%4d \@ %02d:%02d:%02d -->\n\n",
        $dateData[3], $dateData[4] + 1, $dateData[5] + 1900, $dateData[2], $dateData[1], $dateData[0];

foreach $moduleName (sort @fileList) {
  
  open(FH, $moduleName) or die "Failed to open file: $moduleName\n";
  while (<FH>) {
    if (/\@commandpath/) {
      chomp;
      if (/\@commandpath\s+(\w+)\s+([\w\W]*)\s+\-\s+([\w\W]+)/) { 
        ($commandName, $commandSubText, $commandDesc) = $_ =~ m/[\w\W]+\@commandpath\s+(\w+)\s+([\w\W]+)\s+\-\s+([\w\W]+)/;
        $commandOptions = '';
        $commandSubCommands = '';
      } elsif (/\@commandpath\s+(\w+)\s+-\s+([\w\W]+)/) {
        ($commandName, $commandDesc) = $_ =~ m/\@commandpath\s+(\w+)\s+\-\s+([\w\W]+)/;
        $commandSubText = '';
        $commandOptions = '';
        $commandSubCommands = '';
      }

      if (length($commandSubText) > 0) {
        if ($commandSubText =~ m/\[/) {
          ($commandSubCommands, $commandOptions) = split('\[', $commandSubText, 2);
          if (length($commandOptions) > 0) {
            $commandOptions = "[".$commandOptions;
          }
        } else {
          $commandSubCommands = $commandSubText;
        }
        ## Need to trim all this or it adds an extra space that Zack does not like.
        $commandSubCommands =~ s/\s+$//;
        $commandDesc =~ s/\s+$//;
        $commandName =~ s/\s+$//;
        $commandName = $commandName." ".$commandSubCommands if (length($commandSubCommands) > 0) ;  
      }
      
      $moduleName =~ s/$find/$str/g;
      print "<tr>\n";
      print "    <td><a href='#' div class='tooltip' data-title='Click to Copy Module to Clipboard'>$moduleName</a></td>\n";
      print "    <td><a href='#' div class='tooltip' data-title='Click to Copy Command to Clipboard'>!$commandName</a></td>\n";
      if (length($commandOptions) > 0) {
        print "    <td>!$commandName $commandOptions</td>\n";
      } else {
        print "    <td>!$commandName</td>\n";
      }
      print "    <td>$commandDesc</td>\n";
      print "</tr>\n";
    }
  }
  close(FH);
}

printf "\n<!-- PhantomBot \@commandpath Parser. Executed on: %02d/%02d/%4d \@ %02d:%02d:%02d -->\n",
        $dateData[3], $dateData[4] + 1, $dateData[5] + 1900, $dateData[2], $dateData[1], $dateData[0];
