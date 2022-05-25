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
# Requires running once (from this healthcheck folder): pip3 install --no-cache-dir -r requirements.txt
#
# To see all the available command line arguments, run: python3 healthcheck.py --help
#
# Can be run via cron or Windows Scheduled Tasks
# Will output errors to STDERR, which (on Linux) cron will normally automatically email to the root account via Linux Account Mail
#
# Add python scripts into the appropriate hook directories to take automatic actions
#
# If allowing hooks to run (the default), success and failure hooks will receive an object in locals(), defined as:
## {
##     "type": "errorIdentifier",
##     "message": "Human-readable error message"
##     "args": {
##          # parseargs output
##     }
## }
#
# If using the --json argument, the output to STDOUT (on success, with --show-success) or STDERR (on failure) will be the stringified locals() object
#
# The error identifiers for "type" are (in execution order):
## noservicename - The --is-docker flag was set, but --service-name was missing or empty
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
## success - Success, the bot is online

import argparse
from inspect import getframeinfo, currentframe
import json
import os
from pathlib import Path
import requests
import subprocess
import sys
import time
import urllib3

def getscriptdir():
    filename = getframeinfo(currentframe()).filename
    path = os.path.dirname(os.path.abspath(filename))
    if not path.endswith("/"):
        path = path + "/"
    return path


def getconfigdir(args):
    if not args.config_dir:
        if not args.is_docker:
            path = getscriptdir()
            path = path + "../"
        else:
            path = "/opt/PhantomBot_data/config/"
    else:
        if not args.is_docker:
            path = os.path.abspath(args.config_dir)
        else:
            path = args.config_dir
    if not path.endswith("/"):
        path = path + "/"
    return path


def dofailure(args, errtype, message):
    outobj = {"type": errtype, "message": message, "args": args}
    if not args.no_hooks:
        run_hook("failurehooks", locals=outobj)
    if not args.quiet:
        if args.json:
            json.dump(outobj, sys.stderr)
        else:
            print("Health Check Failed (" + outobj["type"] + "): " + str(outobj["message"]), file=sys.stderr)
    sys.exit(1)


def dosuccess(args):
    outobj = {"type": "success", "message": "Success, the bot is online", "args": args}
    if not args.no_hooks:
        run_hook("successhooks", locals=outobj)
    if args.show_success and not args.quiet:
        if args.json:
            json.dump(outobj, sys.stdout)
        else:
            print("Health Check Success (" + outobj["type"] + "): " + str(outobj["message"]), file=sys.stdout)
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


def getconfigfile(args):
    if not args.is_docker:
        if os.path.exists(getconfigdir(args) + "botlogin.txt"):
                with open(getconfigdir(args) + "botlogin.txt") as bot_file:
                    return bot_file.read().splitlines()
        else:
            dofailure(args, "noconfig", "Unable to find botlogin.txt")
    else:
        result = subprocess.run(["docker", "exec", "-it", args.service_name, "cat", getconfigdir(args) + "botlogin.txt"], capture_output=True)
        if result.returncode != 0:
            dofailure(args, "noconfig", "Unable to find botlogin.txt (" + result.returncode + ")")
        else:
            return result.stdout.splitlines()


def main(args):
    urllib3.disable_warnings()
    try:
        if args.is_docker and not args.service_name:
            dofailure(args, "noservicename", "Set --is-docker but --service-name is missing or empty")
        if args.use_https:
            scheme = "https"
        else:
            scheme = "http"
        if args.ip_hostname:
            iphostname = args.ip_hostname
        else:
            iphostname = "127.0.0.1"
        port = 25000
        webauth = None
        lines = getconfigfile(args)
        for line in lines:
            line = line.strip()
            if line.startswith("webauth="):
                webauth = line.split("=", 1)[1]
            if line.startswith("baseport="):
                port = line.split("=", 1)[1]
        if webauth is None:
            dofailure(args, "noauth", "No webauth in botlogin.txt")
        resp = requests.get(scheme + "://" + iphostname + ":" + port + "/presence", headers = { "User-Agent": "phantombot.healthcheck/2022" }, verify = False)
        if resp.status_code != 200:
            dofailure(args, "nopresencecode", "Presence check failed with HTTP " + resp.status_code)
        elif resp.text.strip() != "PBok":
            dofailure(args, "nopresence", "Presence check returned an unknown response")
        resp = requests.put(scheme + "://" + iphostname + ":" + port + "/dbquery", headers = { "User-Agent": "phantombot.healthcheck/2022", "webauth": webauth, "user": "healthcheck", "message": ".mods" }, verify = False)
        if resp.status_code != 200:
            dofailure(args, "noputcode", "Send .mods failed with HTTP " + resp.status_code)
        elif resp.text.strip() != "event posted":
            dofailure(args, "noput", "Send .mods returned an unknown response")
        time.sleep(5)
        resp = requests.get(scheme + "://" + iphostname + ":" + port + "/addons/healthcheck.txt", headers = { "User-Agent": "phantombot.healthcheck/2022" }, verify = False)
        if resp.status_code != 200:
            dofailure(args, "nohealthcheckcode", "Retrieve health check failed with HTTP " + resp.status_code)
        try:
            lastaliveI = int(resp.text.strip())
        except:
            dofailure(args, "nohealthcheck", "Retrieve health check returned a non-integer response")
        lastaliveS = time.gmtime(lastaliveI / 1000)
        nowS = time.gmtime()
        lastalive = time.mktime(lastaliveS)
        now = time.mktime(nowS)
        diff = abs(now - lastalive)
        if diff > 10:
            dofailure(args, "lastalive", "Last alive timestamp has expired")
        dosuccess(args)
    except Exception as e:
        dofailure(args, "exception", e)

def parseargs():
    parser = argparse.ArgumentParser(description="Test PhantomBot to ensure it is running and connected")
    scripts_group = parser.add_argument_group("Scripts/Hooks")
    scripts_group.add_argument("--is-docker", action="store_true", help="Set to use Docker mode, requires also setting --service-name")
    scripts_group.add_argument("--service-name", action="store", help="Sets the service name for use by hooks, also sets the container name when using --is-docker")
    scripts_group.add_argument("--no-hooks", action="store_true", help="Disable running hooks")
    scripts_group.add_argument("--hook-arg1", action="store", help="A custom argument to pass to hooks")
    scripts_group.add_argument("--hook-arg2", action="store", help="A custom argument to pass to hooks")
    scripts_group.add_argument("--hook-arg3", action="store", help="A custom argument to pass to hooks")
    override_group = parser.add_argument_group("Overrides")
    override_group.add_argument("--config-dir", action="store", help="Overrides the location of the PhantomBot config directory")
    override_group.add_argument("--ip-hostname", action="store", help="Overrides the IP address/hostname of the PhantomBot server")
    override_group.add_argument("--use-https", action="store_true", help="Overrides the HTTP queries to use https")
    output_group = parser.add_argument_group("Output")
    output_group.add_argument("--json", action="store_true", help="Output errors as stringified JSON instead of human-readable text to STDERR")
    output_group.add_argument("--show-success", action="store_true", help="Output success messages (or JSON if using --json) to STDOUT")
    output_group.add_argument("--quiet", action="store_true", help="Don't print to STDERR on failure, only run hooks (if --no-hooks was not also defined). Also overrides --show-success")
    return parser.parse_args()


if __name__ == "__main__":
    args = parseargs()
    main(args)
