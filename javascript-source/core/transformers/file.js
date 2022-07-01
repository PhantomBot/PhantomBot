/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function () {
    var match, temp;

    /*
     * @transformer readfile
     * @formula (readfile filename:str) first line of the specified file
     * @labels twitch discord command noevent file
     * @notes files will be read from the addons folder, or a subfolder therein specified by the filename parameter
     * @example Caster: !addcom !lastfollow Last follower was (readfile ./followHandler/latestFollower.txt)
     * User: !lastfollow
     * Bot: Last follower was User
     * @cached
     */
    function readfile(args) {
        var fileName;
        if ((match = args.match(/^ (.+)$/))) {
            fileName = './addons/' + $.replace(match[1], '..', '');
            if (!$.fileExists(fileName)) {
                return {
                    result: $.lang.get('customcommands.file.404', fileName),
                    cache: true
                };
            }
            return {
                result: $.readFile(fileName)[0] || '',
                cache: true
            };
        }
    }

    /*
     * @transformer readfilerand
     * @formula (readfilerand filename:str) random line of the specified file
     * @labels twitch discord command noevent file
     * @notes files will be read from the addons folder, or a subfolder therein specified by the filename parameter
     */
    function readfilerand(args) {
        var fileName;
        if ((match = args.match(/^ (.+)$/))) {
            fileName = './addons/' + $.replace(match[1], '..', '');
            if (!$.fileExists(fileName)) {
                return {result: $.lang.get('customcommands.file.404', fileName)};
            }
            temp = $.readFile(fileName);
            return {
                result: $.randElement(temp) || '',
                cache: false
            };
        }
    }

    /*
     * @transformer writefile
     * @formula (writefile filename:str, append:bool, text:str) writes the specified text to the provided file; if append is 'true', data is appended to the end of the file, otherwise the file is overwritten
     * @labels twitch discord command noevent file
     * @notes files will be placed in the addons folder, or a subfolder therein specified by the filename parameter
     * @example Caster: !addcom !settxt (writefile test.txt, true, (echo))
     */
    function writefile(args) {
        var fileName;
        if ((match = args.match(/^ (.+), (.+), (.+)$/))) {
            fileName = './addons/' + $.replace(match[1], '..', '');
            $.writeToFile(match[3], fileName, match[2] === 'true');
            return {
                result: '',
                cache: false
            };
        }
    }

    var transformers = [
        new $.transformers.transformer('readfile', ['twitch', 'discord', 'command', 'noevent', 'file'], readfile),
        new $.transformers.transformer('readfilerand', ['twitch', 'discord', 'command', 'noevent', 'file'], readfilerand),
        new $.transformers.transformer('writefile', ['twitch', 'discord', 'command', 'noevent', 'file'], writefile)
    ];

    $.transformers.addTransformers(transformers);
})();
