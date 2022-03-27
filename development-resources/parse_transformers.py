# Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
#  * @formula... (tag[|:type][|=|\|][| var:type...]) description?
#  * @notes?... text
#  * multi-line allowed
#  * @example?... text
#  * multi-line allowed
#  * @raw?[| sometimes]
#  * @cached?
#  * @cancels?[| sometimes]
#  */

# types: str, int, bool

# Uses Doc-comment definition

# /*
#  * @usestransformers [global] [local]
#  */

import copy
import os

md_path = "./docs/guides/content/commands/command-variables.md"

gtransformers = []
ltransformers = []
usestransformers = []

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

usestransformers_template = {}
usestransformers_template["script"] = ""
usestransformers_template["hooks"] = []
usestransformers_hook_template = {}
usestransformers_hook_template["hook"] = ""
usestransformers_hook_template["global"] = False
usestransformers_hook_template["local"] = False

# States
# 0 = Outside multi-line comment block
# 1 = Inside multi-line comment block
# 2 = Inside global transformer comment
# 3 = Inside global transformer note
# 4 = Inside global transformer example
# 5 = Inside local transformer comment
# 6 = Inside local transformer note
# 7 = Inside local transformer example
# 8 = Uses transformers
def parse_file(fpath, lines):
    global gtransformers
    global ltransformers
    global usestransformers
    global transformer_template
    global usestransformers_template
    global usestransformers_hook_template
    state = 0
    usestransformer_index = next((i for i,x in enumerate(usestransformers) if fpath.replace('\\', '/') == x["script"]), -1)
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
            if state < 8:
                state = 0
        if line.startswith("* ") and len(line) > 2 and state > 0:
            line = line[2:].strip()
            if line.startswith("@transformer"):
                state = 2
                transformer = copy.deepcopy(transformer_template)
                transformer["script"] = fpath.replace('\\', '/')
                transformer["function"] = line[13:].strip()
            if line.startswith("@localtransformer"):
                state = 5
                transformer = copy.deepcopy(transformer_template)
                transformer["script"] = fpath.replace('\\', '/')
                transformer["function"] = line[18:].strip()
            if line.startswith("@usestransformers"):
                state = 8
                if usestransformer_index == -1:
                    usestransformer = copy.deepcopy(usestransformers_template)
                    usestransformer["script"] = fpath.replace('\\', '/')
                    usestransformers.append(usestransformer)
                    usestransformer_index = next((i for i,x in enumerate(usestransformers) if fpath.replace('\\', '/') == x["script"]), -1)
                else:
                    usestransformer = usestransformers[usestransformer_index]
                usestransformer_hook = copy.deepcopy(usestransformers_hook_template)
                if "global" in line:
                    usestransformer_hook["global"] = True
                if "local" in line:
                    usestransformer_hook["local"] = True
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
                        desc_pos = len(line)
                    else:
                        desc_pos = desc_pos + 1
                    formula = {}
                    formula["formula"] = line[0:desc_pos].strip()
                    if desc_pos < len(line):
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
        if line.startswith("$.bind") and state == 8:
            usestransformer_hook["hook"] = line[line.find("("):line.find(",")].strip("()'\", ")
            usestransformer["hooks"].append(usestransformer_hook)
            state = 0
    if usestransformer_index >= 0:
        usestransformers[usestransformer_index] = usestransformer

def output_transformer(transformer, hlevel):
    lines = []
    h = "#"
    while len(h) < hlevel:
        h = h + "#"
    lines.append(h + " " + transformer["function"] + '\n')
    lines.append('\n')
    lines.append("Defined in script: _" + transformer["script"] + "_" + '\n')
    lines.append('\n')
    lines.append("**Formulas:**" + '\n')
    lines.append('\n')
    for formula in transformer["formulas"]:
        line = "- `" + formula["formula"] + "`"
        if len(formula["desc"]) > 0:
            line = line + " - " + formula["desc"]
        lines.append(line + '\n')
    if len(transformer["notes"]) > 0:
        lines.append('\n')
        for note in transformer["notes"]:
            lines.append('\n')
            first = True
            for nline in note:
                if first:
                    first = False
                    lines.append("_NOTE: " + nline + "_" + '\n')
                else:
                    lines.append('\n')
                    lines.append("_" + nline + "_" + '\n')
    if len(transformer["examples"]) > 0:
        lines.append('\n')
        for example in transformer["examples"]:
            lines.append('\n')
            lines.append("**Example:**" + '\n')
            lines.append("```text" + '\n')
            for eline in example:
                lines.append(eline + '\n')
            lines.append("```" + '\n')
    lines.append('\n')
    lines.append('Raw?[^raw]&nbsp;&nbsp; | Cached?[^cached]&nbsp;&nbsp; | Cancels?[^cancels]\n')
    lines.append('-------|-----------|----------\n')
    line = ""
    if transformer["raw"]:
        if transformer["rawSometimes"]:
            line = line + "Sometimes&nbsp;&nbsp; | "
        else:
            line = line + "Yes&nbsp;&nbsp; | "
    else:
        line = line + "No&nbsp;&nbsp; | "
    if transformer["cached"]:
        line = line + "Yes&nbsp;&nbsp; | "
    else:
        line = line + "No&nbsp;&nbsp; | "
    if transformer["cancels"]:
        if transformer["cancelsSometimes"]:
            line = line + "Sometimes"
        else:
            line = line + "Yes"
    else:
        line = line + "No"
    lines.append(line + '\n')
    lines.append('\n')
    lines.append("&nbsp;" + '\n')
    lines.append('\n')
    return lines

def output_usestransformer(usestransformer, hlevel):
    lines = []
    h = "#"
    discord = ""
    while len(h) < hlevel:
        h = h + "#"
    if "/discord/" in usestransformer["script"]:
        discord = "discord / "
    lines.append(h + " " + discord + usestransformer["script"][usestransformer["script"].rfind("/") + 1:] + '\n')
    lines.append('\n')
    lines.append("Defined in script: _" + usestransformer["script"] + "_" + '\n')
    h = h + "#"
    for hook in usestransformer["hooks"]:
        lines.append('\n')
        lines.append(h + " Hook: " + hook["hook"] + '\n')
        lines.append('\n')
        lines.append('Global&nbsp;&nbsp; | Local\n')
        lines.append('-------|-------\n')
        line = ""
        if hook["global"]:
            line = line + "Yes&nbsp;&nbsp; | "
        else:
            line = line + "No&nbsp;&nbsp; | "
        if hook["local"]:
            line = line + "Yes"
        else:
            line = line + "No"
        lines.append(line + '\n')
    lines.append('\n')
    lines.append("&nbsp;" + '\n')
    lines.append('\n')
    return lines

for subdir, dirs, files in os.walk("./javascript-source"):
    for fname in files:
        fpath = subdir + os.sep + fname
        if fpath.endswith(".js"):
            with open(fpath, encoding="utf8") as js_file:
                parse_file(fpath, [line.rstrip('\n') for line in js_file])

lines = []

lines.append("## Custom Commands Tag Guideline:" + '\n')
lines.append('\n')
lines.append("**These command variables can be used in any  custom command.**" + '\n')
lines.append('\n')
lines.append("&nbsp;" + '\n')
lines.append('\n')
lines.append("<!-- toc -->" + '\n')
lines.append('\n')
lines.append("<!-- tocstop -->" + '\n')
lines.append('\n')
lines.append("&nbsp;" + '\n')
lines.append('\n')
lines.append("## Global Command Tags" + '\n')
lines.append('\n')
lines.append("[^raw]: **Raw:** If _Yes_, this tag does not escape it's output, which may lead to new tags being returned which will then be processed by the appropriate transformers. If _Sometimes_, then some return conditions may return escaped. If _no_, then output is always escaped and tags returned in the output of this transformer will not be parsed unless it is inside an `(unescape)` tag" + '\n')
lines.append('\n')
lines.append("[^cached]: **Cached:** If _Yes_, the results of this tag, with the exact arguments presented, are temporarily cached and will not be re-processed for the rest of the current command, speeding up execution if the tag is used multiple times. The cache is cleared after every command execution" + '\n')
lines.append('\n')
lines.append("[^cancels]: **Cancels:** If _Yes_, this tag will immediately cancel further parsing and execution of the current command, though the tag itself may still send a message to chat. If _Sometimes_, then some return conditions may cancel execution of the command" + '\n')
lines.append('\n')

for transformer in gtransformers:
    lines.extend(output_transformer(transformer, 3))

lines = lines[:len(lines) - 3]

if len(ltransformers) > 0:
    lines.append('\n')
    lines.append("---" + '\n')
    lines.append('\n')
    lines.append("## Local Command Tags" + '\n')
    lines.append('\n')
    lines.append("_These command tags are only available in the scripts which defined them_" + '\n')
    lines.append('\n')
    lines.append("_Some scripts may also restrict the use of global command tags_" + '\n')
    lines.append('\n')
    for transformer in ltransformers:
        lines.extend(output_transformer(transformer, 3))
    lines = lines[:len(lines) - 3]

if len(usestransformers) > 0:
    lines.append('\n')
    lines.append("---" + '\n')
    lines.append('\n')
    lines.append("## Transformer Usage" + '\n')
    lines.append('\n')
    lines.append("_Indicates whether the hooks in each script use transformers that are global, local, or both_" + '\n')
    lines.append('\n')
    for usestransformer in usestransformers:
        lines.extend(output_usestransformer(usestransformer, 3))
    lines = lines[:len(lines) - 3]

with open(md_path, "w", encoding="utf8") as md_file:
    md_file.writelines(lines)
