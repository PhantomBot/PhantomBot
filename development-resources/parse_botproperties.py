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

# Doc-comment definition

# /**
#  * @botproperty propertyname - Description
#  */

# Optional doc-comment to set category and sorting. If multiple sorting values across different comments, highest wins

# /**
#  * @botpropertycatsort propertyname propertySortInteger categorySortInteger categoryName
#  */

# Optional doc-comment to tag property as requiring a restart to take effect

# /**
#  * @botpropertyrestart propertyname
#  */

# Optional doc-comment to set data type when not retrieved via CaselessProperties.getProperty*

# /**
#  * @botpropertytype propertyname dataType
#  */

import json
import os

md_path = "./docs/guides/content/setupbot/properties.md"
json_path = "./resources/web/common/json/properties.json"

botproperties = []

ignoreproperties = [
    "apiexpires",
    "apioauth",
    "apirefresh",
    "appsecret",
    "apptoken",
    "apptokenexpires",
    "backupsqliteauto",
    "backupsqlitehourfrequency",
    "backupsqlitekeepdays",
    "newsetup",
    "oauth",
    "oauthexpires",
    "refresh",
    "rollbarid",
    "webauth",
    "webauthro",
    "ytauth",
    "ytauthro"
]

tgt = "CaselessProperties.instance().getProperty"

# States
# 0 = Outside multi-line comment block
# 1 = Inside multi-line comment block
def parse_file(lines):
    global botproperties, ignoreproperties, tgt
    state = 0
    for line in lines:
        line = line.strip()
        if line == "/**" and state == 0:
            state = 1
        if line == "*/" and state > 0:
            state = 0
        if line.startswith("* ") and len(line) > 2 and state > 0:
            line = line[2:].strip()
            if line.startswith("@botpropertytype"):
                line = line[17:].strip()
                prop_pos = line.find(" ")
                if prop_pos == -1:
                    prop_pos = len(line)
                prop = line[0:prop_pos].strip().lower()
                type = line[prop_pos + 1:].strip()
                if not prop in ignoreproperties:
                    idx = findprop(prop)
                    if idx == -1:
                        botproperties.append({"botproperty": prop, "definition": "No definition", "type": type, "sort": 9999, "category": "Uncategorized", "category_sort": 9999, "restart": False})
                    else:
                        botproperties[idx]["type"] = type
            if line.startswith("@botpropertyrestart"):
                line = line[20:].strip()
                prop = line.lower()
                if not prop in ignoreproperties:
                    idx = findprop(prop)
                    if idx == -1:
                        botproperties.append({"botproperty": prop, "definition": "No definition", "type": type, "sort": 9999, "category": "Uncategorized", "category_sort": 9999, "restart": True})
                    else:
                        botproperties[idx]["restart"] = True
            if line.startswith("@botpropertycatsort"):
                line = line[20:].strip()
                prop_pos = line.find(" ")
                if prop_pos >= 0:
                    prop = line[0:prop_pos].strip().lower()
                    line = line[prop_pos + 1:].strip()
                    propSort_pos = line.find(" ")
                    if propSort_pos == -1:
                        if len(line[0:].strip()) > 0:
                            propSort = int(line[0:].strip())
                        else:
                            propSort = 9999
                        catSort = 9999
                        catName = "Uncategorized"
                    else:
                        propSort = int(line[0:propSort_pos].strip())
                        line = line[propSort_pos + 1:].strip()
                        catSort_pos = line.find(" ")
                        if catSort_pos == -1:
                            if len(line[0:].strip()) > 0:
                                catSort = int(line[0:].strip())
                            else:
                                catSort = 9999
                            catName = "Uncategorized"
                        else:
                            catSort = int(line[0:catSort_pos].strip())
                            catName = line[catSort_pos + 1:].strip()
                            if len(catName) == 0:
                                catName = "Uncategorized"
                    if not prop in ignoreproperties:
                        idx = findprop(prop)
                        if idx == -1:
                            botproperties.append({"botproperty": prop, "definition": "No definition", "type": type, "sort": propSort, "category": catName, "category_sort": catSort, "restart": False})
                        else:
                            botproperties[idx]["sort"] = propSort
                            botproperties[idx]["category"] = catName
                            botproperties[idx]["category_sort"] = catSort
            if line.startswith("@botproperty"):
                line = line[13:].strip()
                prop_pos = line.find(" ")
                if prop_pos == -1:
                    prop_pos = len(line)
                prop = line[0:prop_pos].strip().lower()
                line = line[prop_pos:].strip()
                propdef_pos = line.find("-")
                if propdef_pos == -1:
                    propdef_pos = 0
                else:
                    propdef_pos = propdef_pos + 1
                propdef = line[propdef_pos:].strip().lower()
                if not prop in ignoreproperties:
                    idx = findprop(prop)
                    if idx == -1:
                        botproperties.append({"botproperty": prop, "definition": propdef, "type": "String", "sort": 9999, "category": "Uncategorized", "category_sort": 9999, "restart": False})
                    else:
                        botproperties[idx]["definition"] = propdef
        if tgt in line:
            idx = line.find(tgt) + len(tgt)
            idx2 = line.find("(", idx)
            idx3 = line.find(")", idx2)
            line = line[idx:idx3]
            idx4 = line.find("(")
            type = line[0:idx4]
            if len(type) == 0:
                type = "String"
            else:
                type = line[2:idx4]
            prop_pos = line.find("\"", idx4 + 2)
            if prop_pos != -1:
                prop = line[idx4 + 2:prop_pos].strip().lower()
                if not prop in ignoreproperties:
                    idx = findprop(prop)
                    if idx == -1:
                        botproperties.append({"botproperty": prop, "definition": "No definition", "type": type, "sort": 9999, "category": "Uncategorized", "category_sort": 9999, "restart": False})
                    else:
                        botproperties[idx]["type"] = type

def findprop(prop):
    for i in range(len(botproperties)):
        if botproperties[i]["botproperty"] == prop:
            return i
    return -1

def output_category(category, hlevel):
    h = "#"
    while len(h) < hlevel:
        h = h + "#"
    return [h + " " + category + '\n']

def output_botproperty(botproperty, hlevel):
    lines = []
    h = "#"
    while len(h) < hlevel:
        h = h + "#"
    lines.append(h + " " + botproperty["botproperty"] + '\n')
    lines.append('\n')
    lines.append("Data Type: _" + botproperty["type"] + "_" + '\n')
    lines.append('\n')
    lines.append(botproperty["definition"] + '\n')
    if botproperty["restart"]: 
        lines.append('\n')
        lines.append('_NOTE: A restart is required for this property to take effect_\n')
    lines.append('\n')
    lines.append("&nbsp;" + '\n')
    lines.append('\n')
    return lines

def sort():
    global botproperties
    categorysort = {}
    for botproperty in botproperties:
        if not botproperty["category"] in categorysort or botproperty["category_sort"] < categorysort[botproperty["category"]]:
            categorysort[botproperty["category"]] = botproperty["category_sort"]
    for i in range(len(botproperties)):
        botproperties[i]["category_sort"] = categorysort[botproperties[i]["category"]]
    return sorted(sorted(sorted(sorted(botproperties, key=lambda x: x["botproperty"]), key=lambda x: x["sort"]), key=lambda x: x["category"]), key=lambda x: x["category_sort"])

for subdir, dirs, files in os.walk("./source"):
    for fname in files:
        fpath = subdir + os.sep + fname
        if fpath.endswith(".java"):
            with open(fpath, encoding="utf8") as java_file:
                parse_file([line.rstrip('\n') for line in java_file])

lines = []

lines.append("## Bot Properties" + '\n')
lines.append('\n')
lines.append("**These properties can be defined in _botlogin.txt_**" + '\n')
lines.append('\n')
lines.append("Docker can also define them as ENV variables by converting to uppercase and adding the _PHANTOMBOT\__ prefix" + '\n')
lines.append('\n')
lines.append("NOTE: If the property exists in botlogin.txt, the ENV variable is ignored unless _PHANTOMBOT\_ENVOVERRIDE: \"true\"_ is set" + '\n')
lines.append('\n')
lines.append("NOTE: If the property does not list a default value, then the default value is not set/disabled" + '\n')
lines.append('\n')
lines.append('\n')
lines.append("NOTE: _botlogin.txt_ can **not** be edited while the bot is running" + '\n')
lines.append('\n')
lines.append("&nbsp;" + '\n')
lines.append('\n')
lines.append("<!-- toc -->" + '\n')
lines.append('\n')
lines.append("<!-- tocstop -->" + '\n')
lines.append('\n')
lines.append("&nbsp;" + '\n')
lines.append('\n')
lines.append('\n')

current_category = ""
for botproperty in sort():
    if current_category != botproperty["category"]:
        lines.extend(output_category(botproperty["category"], 3))
        current_category = botproperty["category"]
    lines.extend(output_botproperty(botproperty, 4))

lines = lines[:len(lines) - 3]

with open(md_path, "w", encoding="utf8") as md_file:
    md_file.writelines(lines)

with open(json_path, "w", encoding="utf8") as json_file:
    json.dump(sorted(botproperties, key=lambda x: x["botproperty"]), json_file)
