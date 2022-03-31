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
# Can be run via cron or Windows Scheduled Tasks
# Will output errors to STDERR, which cron will normally automatically email to the root account via Linux Account Mail
#
# Add python scripts into the appropriate hook directories to take automatic actions
#
# If allowing hooks to run (the default), failure hooks will receive an object in locals() {"type": "errorIdentifier", "message": "Human-readable error message"}
# Success hooks do not receive a locals() object
#
# If using the --json argument, the output to STDERR will be the stringified locals() object
#
# If using the --show-success argument and the --json argument together, success will output the JSON {"type": "success", "message": "Success, the bot is online"}
#
# The error identifiers for "type" are (in execution order):
## noconfig - The botlogin.txt file was not found (it must be located at ../botlogin.txt relative to this script). This may also indicate a permissions issue
## noauth - The `webauth=` line was not found or was empty in botlogin.txt
## nopresencecode - The HTTP GET request to the /presence endpoint on the bots webserver did not return HTTP 200 OK. For this endpoint, this means the webserver is failing
## nopresence - The HTTP GET request to the /presence endpoint returned HTTP 200 OK, but the content was not `PBok`. The webserver is malfunctioning or another webserver responded
## noputcode - The HTTP PUT request to the /dbquery endpoint, to send `.mods` to chat, did not return HTTP 200 OK. Probably returned 401 Unauthorized, message will include the code
## noput - The HTTP PUT request to the /dbquery endpoint returned HTTP 200 OK, but the content was not `event posted`. The webserver is malfunctioning or another webserver responded
## nohealthcheckcode - The HTTP GET request to healthcheck.txt on the bots webserver did not return HTTP 200 OK. Possibly a 404, message will include the code
## nohealthcheck - A ValueError was raised trying to convert the healthcheck.txt timestamp into an integer. A blank or invalid output was probably returned
## lastalive - The timestamp from healthcheck.txt is more than 10 seconds old, the health check has failed and the Twitch TMI connection is probably down
## exception - An exception was raised, the `message` value will contain the caught exception

import argparse
from inspect import getframeinfo, currentframe
import json
import os
from pathlib import Path
import requests
import sys
import time

parser = argparse.ArgumentParser(description="Test PhantomBot to ensure it is running and connected")
parser.add_argument("--json", action="store_true", help="Output errors as stringified JSON instead of human-readable text to STDERR")
parser.add_argument("--show-success", action="store_true", help="Output success messages (or JSON if using --json) to STDOUT")
parser.add_argument("--no-hooks", action="store_true", help="Disable running hooks")
parser.add_argument("--quiet", action="store_true", help="Don't print to STDERR on failure, only run hooks (if --no-hooks was not also defined). Also overrides --show-success")
args = parser.parse_args()

def getscriptdir():
    filename = getframeinfo(currentframe()).filename
    path = os.path.dirname(os.path.abspath(filename))
    if not path.endswith("/"):
        path = path + "/"
    return path


def dofailure(type, message):
    outobj = {"type": type, "message": message}
    if not args.no_hooks:
        run_hook("failurehooks", locals=outobj)
    if not args.quiet:
        if args.json:
            json.dump(outobj, sys.stderr)
        else:
            print("Health Check Failed (" + type + "):" + message, file=sys.stderr)
    sys.exit(1)


def dosuccess():
    if not args.no_hooks:
        run_hook("successhooks")
    if args.show_success and not args.quiet:
        if args.json:
            json.dump({"type": "success", "message": "Success, the bot is online"}, sys.stdout)
        else:
            print("Success, the bot is online", file=sys.stdout)
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


try:
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
except Exception as e:
    dofailure("exception", e)
