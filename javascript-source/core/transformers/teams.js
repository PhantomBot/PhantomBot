/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
    var match;

    /*
     * @transformer team_member_followers
     * @formula (team_member_followers team:str, membername:str) number of followers of user membername in the provided team
     * @labels twitch noevent teams
     * @notes the team parameter should be the url slug for the team
     * @cached
     */
    function team_member_followers(args) {
        var teamObj,
                teamMember;
        if ((match = args.args.match(/^ ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)$/))) {
            teamObj = $.twitchteamscache.getTeam(match[1]);
            if (teamObj !== null) {
                teamMember = teamObj.getTeamMember(match[2]);
                if (teamMember !== null) {
                    return {
                        result: teamMember.getInt('followers'),
                        cache: true
                    };
                } else {
                    return {
                        result: $.lang.get('customcommands.teamapi.member.404', match[1]),
                        cache: true
                    };
                }
            } else {
                return {
                    result: $.lang.get('customcommands.teamapi.team.404', match[2]),
                    cache: true
                };
            }
        }
    }

    /*
     * @transformer team_member_game
     * @formula (team_member_game team:str, membername:str) game user membername in the provided team currently plays
     * @labels twitch noevent teams
     * @notes the team parameter should be the url slug for the team
     * @cached
     */
    function team_member_game(args) {
        var teamObj,
                teamMember;
        if ((match = args.args.match(/^ ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)$/))) {
            teamObj = $.twitchteamscache.getTeam(match[1]);
            if (teamObj !== null) {
                teamMember = teamObj.getTeamMember(match[2]);
                if (teamMember !== null) {
                    return {
                        result: teamMember.getString('game'),
                        cache: true
                    };
                } else {
                    return {
                        result: $.lang.get('customcommands.teamapi.member.404', match[1]),
                        cache: true
                    };
                }
            } else {
                return {
                    result: $.lang.get('customcommands.teamapi.team.404', match[2]),
                    cache: true
                };
            }
        }
    }

    /*
     * @transformer team_member_url
     * @formula (team_member_url team:str, membername:str) url of user membername in the provided team
     * @labels twitch noevent teams
     * @notes the team parameter should be the url slug for the team
     * @cached
     */
    function team_member_url(args) {
        var teamObj,
                teamMember;
        if ((match = args.args.match(/^ ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)$/))) {
            teamObj = $.twitchteamscache.getTeam(match[1]);
            if (teamObj !== null) {
                teamMember = teamObj.getTeamMember(match[2]);
                if (teamMember !== null) {
                    return {
                        result: teamMember.getString('url'),
                        cache: true
                    };
                } else {
                    return {
                        result: $.lang.get('customcommands.teamapi.member.404', match[1]),
                        cache: true
                    };
                }
            } else {
                return {
                    result: $.lang.get('customcommands.teamapi.team.404', match[2]),
                    cache: true
                };
            }
        }
    }

    /*
     * @transformer team_members
     * @formula (team_members team:str) number of members in the provided team
     * @labels twitch noevent teams
     * @notes the team parameter should be the url slug for the team
     * @cached
     */
    function team_members(args) {
        var teamObj;
        if ((match = args.args.match(/^ ([a-zA-Z0-9-_]+)$/))) {
            teamObj = $.twitchteamscache.getTeam(match[1]);
            if (teamObj !== null) {
                return {
                    result: teamObj.getTotalMembers(),
                    cache: true
                };
            } else {
                return {
                    result: $.lang.get('customcommands.teamapi.team.404', match[1]),
                    cache: true
                };
            }
        }
    }

    /*
     * @transformer team_name
     * @formula (team_name team:str) name of the provided team
     * @labels twitch noevent teams
     * @notes the team parameter should be the url slug for the team
     * @cached
     */
    function team_name(args) {
        var teamObj;
        if ((match = args.args.match(/^ ([a-zA-Z0-9-_]+)$/))) {
            teamObj = $.twitchteamscache.getTeam(match[1]);
            if (teamObj !== null) {
                return {
                    result: teamObj.getName(),
                    cache: true
                };
            } else {
                return {
                    result: $.lang.get('customcommands.teamapi.team.404', match[1]),
                    cache: true
                };
            }
        }
    }

    /*
     * @transformer team_random_member
     * @formula (team_random_member team:str) random member of the provided team
     * @labels twitch noevent teams
     * @notes the team parameter should be the url slug for the team
     */
    function team_random_member(args) {
        var teamObj;
        if ((match = args.args.match(/^ ([a-zA-Z0-9-_]+)$/))) {
            teamObj = $.twitchteamscache.getTeam(match[1]);
            if (teamObj !== null) {
                return {
                    result: teamObj.getRandomMember(),
                    cache: false
                };
            } else {
                return {
                    result: $.lang.get('customcommands.teamapi.team.404', match[1]),
                    cache: true
                };
            }
        }
    }

    /*
     * @transformer team_url
     * @formula (team_url team:str) url to the provided team
     * @labels twitch noevent teams
     * @notes the team parameter should be the url slug for the team
     * @cached
     */
    function team_url(args) {
        var teamObj;
        if ((match = args.args.match(/^ ([a-zA-Z0-9-_]+)$/))) {
            teamObj = $.twitchteamscache.getTeam(match[1]);
            if (teamObj !== null) {
                return {
                    result: teamObj.getUrl(),
                    cache: true
                };
            } else {
                return {
                    result: $.lang.get('customcommands.teamapi.team.404', match[1]),
                    cache: true
                };
            }
        }
    }

    var transformers = [
        new $.transformers.transformer('team_member_followers', ['twitch', 'noevent', 'teams'], team_member_followers),
        new $.transformers.transformer('team_member_game', ['twitch', 'noevent', 'teams'], team_member_game),
        new $.transformers.transformer('team_member_url', ['twitch', 'noevent', 'teams'], team_member_url),
        new $.transformers.transformer('team_members', ['twitch', 'noevent', 'teams'], team_members),
        new $.transformers.transformer('team_name', ['twitch', 'noevent', 'teams'], team_name),
        new $.transformers.transformer('team_random_member', ['twitch', 'noevent', 'teams'], team_random_member),
        new $.transformers.transformer('team_url', ['twitch', 'noevent', 'teams'], team_url)
    ];

    $.transformers.addTransformers(transformers);
})();
