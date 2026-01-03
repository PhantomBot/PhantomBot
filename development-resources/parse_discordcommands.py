# Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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

# Doc-comment description

# /**
#  * @discordcommandpath commandName [requiredParameter] (optionalParameter) - Description
#  */

import os

md_path = "./docs/guides/content/commands/discord-commands.md"

commands = []

# States
# 0 = Outside multi-line comment block
# 1 = Inside multi-line comment block
def parse_file(fpath, lines):
    global commands
    state = 0
    cmd = ""
    description  = ""
    if fpath.startswith("./javascript-source"):
        fpath = "." + fpath[19:]
    for line in lines:
        line = line.strip()
        if line.startswith("/*") and state == 0:
            cmd = ""
            state = 1
        if line == "*/" and state > 0:
            if cmd != "":
                commands.append({"command": "!" + cmd.replace('|', '&#124;'), "description": description.replace('|', '&#124;'), "source": fpath})
            state = 0
        if line.startswith("* ") and len(line) > 2 and state > 0:
            line = line[2:].strip()
            if line.startswith("@discordcommandpath"):
                line = line[20:].strip()
                cmd_pos = line.find(" - ")
                if cmd_pos == -1:
                    cmd_pos = len(line)
                cmd = line[0:cmd_pos].strip()
                description = line[cmd_pos + 1:].strip()
            else:
                description += line

for subdir, dirs, files in os.walk("./javascript-source"):
    for fname in files:
        fpath = subdir + os.sep + fname
        if fpath.endswith(".js"):
            with open(fpath, encoding="utf8") as js_file:
                parse_file(fpath, [line.rstrip('\n') for line in js_file])

lines = []

lines.append("## Discord Command List" + '\n')
lines.append('\n')
lines.append("Parameters enclosed in square brackets `[ ]` are required when using the command" + '\n')
lines.append('\n')
lines.append("Parameters enclosed in parenthesis `( )` are optional when using the command" + '\n')
lines.append('\n')
lines.append("<!-- table -->" + '\n')
lines.append("| Module | Command | Description |" + '\n')
lines.append("| :--- | :--- | :--- |" + '\n')

for command in commands:
    lines.append("| " + command["source"] + " | " + command["command"] + " | " + command["description"] + " |" + '\n')

lines = lines[:len(lines) - 3]

with open(md_path, "w", encoding="utf8") as md_file:
    md_file.writelines(lines)
