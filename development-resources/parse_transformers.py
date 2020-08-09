# Copyright (C) 2016-2020 phantom.bot
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

# Doc-comment definition

# /*
#  * @[|local]transformer functionName
#  * @formula... (tag[|:type][|=|\|][| var:type...]) description
#  * @notes?... text
#  * multi-line allowed
#  * @example?... code block
#  * multi-line allowed
#  * @raw?[| sometimes]
#  * @cached?
#  * @cancels?[| sometimes]
#  */

# types: str, int, bool

import copy
import os

gtransformers = []
ltransformers = []

transformer_template = {}
transformer_template["script"] = ""
transformer_template["function"] = ""
transformer_template["formulas"] = []
transformer_template["notes"] = []
transformer_template["examples"] = []
transformer_template["raw"] = False
transformer_template["rawSometimes"] = False
transformer_template["cached"] = False
transformer_template["cancels"] = False
transformer_template["cancelsSometimes"] = False

# States
# 0 = Outside multi-line comment block
# 1 = Inside multi-line comment block
# 2 = Inside global transformer comment
# 3 = Inside global transformer note
# 4 = Inside global transformer example
# 5 = Inside local transformer comment
# 6 = Inside local transformer note
# 7 = Inside local transformer example
def parse_file(fpath, lines):
    global gtransformers
    global ltransformers
    global transformer_template
    state = 0
    for line in lines:
        line = line.strip()
        if line == "/*" and state == 0:
            state = 1
        if line == "*/" and state > 0:
            if state == 3 or state == 6:
                transformer["notes"].append(note)
            if state == 4 or state == 7:
                transformer["examples"].append(example)
            if state >= 2 and state <= 4:
                gtransformers.append(transformer)
            if state >= 5 and state <= 7:
                ltransformers.append(transformer)
            state = 0
        if line.startswith("* ") and line.len() > 2 and state > 0:
            line = line[2:].strip()
            if line.startswith("@transformer"):
                state = 2
                transformer = copy.deepcopy(transformer_template)
                transformer["script"] = fpath
                transformer["function"] = line[13:].strip()
            if line.startswith("@localtransformer"):
                state = 5
                transformer = copy.deepcopy(transformer_template)
                transformer["script"] = fpath
                transformer["function"] = line[18:].strip()
            if state > 1:
                if state != 2 and state != 5 and line.startswith("@"):
                    if state == 3 or state == 6:
                        state = state - 1
                        transformer["notes"].append(note)
                    if state == 4 or state == 7:
                        state = state - 2
                        transformer["examples"].append(example)
                if line.startswith("@formula"):
                    line = line[9:].strip()
                    desc_pos = line.find(") ")
                    if desc_pos == -1:
                        desc_pos = line.len()
                    else:
                        desc_pos = desc_pos + 1
                    formula = {}
                    formula["formula"] = line[0:desc_pos].strip()
                    if desc_pos < line.len():
                        formula["desc"] = line[desc_pos:].strip()
                    else:
                        formula["desc"] = ""
                    transformer["formulas"].append(formula)
                if line.startswith("@notes"):
                    state = state + 1
                    line = line[7:].strip()
                    note = []
                if state == 3 or state == 6:
                    note.append(line)
                if line.startswith("@example"):
                    state = state + 2
                    line = line[9:].strip()
                    example = []
                if state == 4 or state == 7:
                    example.append(line)
                if line.startswith("@raw"):
                    transformer["raw"] = True
                    if "sometimes" in line:
                        transformer["rawSometimes"] = True
                if line.startswith("@cached"):
                    transformer["cached"] = True
                if line.startswith("@cancels"):
                    transformer["cancels"] = True
                    if "sometimes" in line:
                        transformer["cancelsSometimes"] = True

for subdir, dirs, files in os.walk("./javascript-source"):
    for fname in files:
        fpath = subdir + os.sep + fname
        if fpath.endswith(".js"):
            with open(fpath) as js_file:
                parse_file(fpath, [line.rstrip('\n') for line in js_file])