#
# Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
#   This program is free software: you can redistribute it and/or modify
#   it under the terms of the GNU General Public License as published by
#   the Free Software Foundation, either version 3 of the License, or
#   (at your option) any later version.
#   This program is distributed in the hope that it will be useful,
#   but WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#   GNU General Public License for more details.
#   You should have received a copy of the GNU General Public License
#   along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

#
# Requires Python 3.8+
# Requires running (from this healthcheck folder): pip install --no-cache-dir -r requirements.txt
#
# Can be run via cron
# Will output errors to STDERR, which cron will normally automatically email to the root account via Linux Account Mail
#
# Add python scripts into the appropriate hook directories to take automatic actions
#

from inspect import getframeinfo, currentframe
import os
from pathlib import Path
import requests
import time

def getscriptdir():
    filename = getframeinfo(currentframe()).filename
    path = os.path.dirname(os.path.abspath(filename))
    if not path.endswith("/"):
        path = path + "/"
    return path


def dofailure(type, message):
    run_hook("failurehooks", locals={"type": type, "message": message})
    print("Health Check Failed (" + type + "):" + message, file=sys.stderr)
    sys.exit(1)


def dosuccess():
    run_hook("successhooks")
    sys.exit(0)


def run_hook(hookname, globals=None, locals=None):
    pathlist = Path(getscriptdir() + hookname).rglob('*.py')
    for path in pathlist:
        execfile(str(path), globals, locals)


# Copied from https://stackoverflow.com/a/41658338
def execfile(filepath, globals=None, locals=None):
    if globals is None:
        globals = {}
    globals.update({
        "__file__": filepath,
        "__name__": "__main__",
    })
    with open(filepath, 'rb') as file:
        exec(compile(file.read(), filepath, 'exec'), globals, locals)


port = 25000
webauth = None


if os.path.exists(getscriptdir() + "../botlogin.txt"):
    with open(getscriptdir() + "../botlogin.txt") as bot_file:
        lines = bot_file.read().splitlines()
        for line in lines:
            line = line.strip()
            if line.startswith("webauth="):
                webauth = line.split("=", 1)[1]
            if line.startswith("baseport="):
                port = line.split("=", 1)[1]
else:
    dofailure("noconfig", "Unable to find botlogin.txt")


if webauth is None:
    dofailure("noauth", "No webauth in botlogin.txt")


resp = requests.get("http://127.0.0.1:" + port + "/presence", headers = { "User-Agent": "phantombot.healthcheck/2022" })
if resp.status_code != 200:
    dofailure("nopresencecode", "Presence check failed with HTTP " + resp.status_code)
elif resp.text.strip() != "PBok":
    dofailure("nopresence", "Presence check returned an unknown response")


resp = requests.put("http://127.0.0.1:" + port + "/dbquery", headers = { "User-Agent": "phantombot.healthcheck/2022", "webauth": webauth, "user": "healthcheck", "message": ".mods" })
if resp.status_code != 200:
    dofailure("noputcode", "Send .mods failed with HTTP " + resp.status_code)
elif resp.text.strip() != "event posted":
    dofailure("noput", "Send .mods returned an unknown response")


time.sleep(5)


resp = requests.get("http://127.0.0.1:" + port + "/addons/healthcheck.txt", headers = { "User-Agent": "phantombot.healthcheck/2022" })
if resp.status_code != 200:
    dofailure("nohealthcheckcode", "Retrieve health check failed with HTTP " + resp.status_code)


try:
    lastaliveI = int(resp.text.strip())
except:
    dofailure("nohealthcheck", "Retrieve health check returned a non-integer response")


lastaliveS = time.gmtime(lastaliveI / 1000)
nowS = time.gmtime()


lastalive = time.mktime(lastaliveS)
now = time.mktime(nowS)
diff = abs(now - lastalive)


if diff > 10:
    dofailure("lastalive", "Last alive timestamp has expired")


dosuccess()
