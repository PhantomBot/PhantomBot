/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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

/* global Packages */

(function () {
    /*
     * @transformer abs
     * @formula (abs arg:number) return the absolute value of the given number
     * @labels twitch discord noevent math
     * @notes if the argument returns `true` for `isNaN`, `0` is returned
     * @example Caster: !addcom !abs (sender), the absolute value of (1) is: (abs (1))
     * User: !abs -2.1
     * Bot: User, the absolute value of -2.1 is: 2.1
     */
    function abs(args) {
        let pargs = $.parseArgs(args.args, ' ');
        let result = null;

        if (pargs !== null) {
            if (!isNaN(pargs[0])) {
                result = Math.abs(Number(pargs[0]));
            }
        }

        if (result === null) {
            result = 0;
        }

        return {
            result: result
        };
    }

    /*
     * @transformer add
     * @formula (add arg1:number arg2:number ...) add the given numbers and return the result
     * @labels twitch discord noevent math
     * @notes any argument which returns `true` for `isNaN` is skipped
     * @example Caster: !addcom !add (sender), adding (1), (2), and (3) gives: (add (1) (2) (3))
     * User: !add 1 3 5 
     * Bot: User, adding 1, 3, and 5 gives: 9
     */
    function add(args) {
        let pargs = $.parseArgs(args.args, ' ');
        let result = null;

        if (pargs !== null) {
            for (let i in pargs) {
                if (!isNaN(pargs[i])) {
                    let val = Number(pargs[i]);
                    if (result === null) {
                        result = val;
                    } else {
                        result = result + val;
                    }
                }
            }
        }

        if (result === null) {
            result = 0;
        }

        return {
            result: result
        };
    }

    /*
     * @transformer ceil
     * @formula (ceil arg:number) round up the given number and return the result
     * @labels twitch discord noevent math
     * @notes if the argument returns `true` for `isNaN`, `0` is returned
     * @example Caster: !addcom !ceil (sender), rounding (1) up gives: (ceil (1))
     * User: !ceil 2.1
     * Bot: User, rounding up 2.1 gives: 3
     */
    function ceil(args) {
        let pargs = $.parseArgs(args.args, ' ');
        let result = null;

        if (pargs !== null) {
            if (!isNaN(pargs[0])) {
                result = Math.ceil(Number(pargs[0]));
            }
        }

        if (result === null) {
            result = 0;
        }

        return {
            result: result
        };
    }

    /*
     * @transformer divide
     * @formula (divide arg1:number arg2:number ...) divide the given numbers and return the result
     * @labels twitch discord noevent math
     * @notes any argument which returns `true` for `isNaN` is skipped
     * @notes any argument, except for the first, which is `0` is skipped
     * @example Caster: !addcom !divide (sender), dividing (1) and (2) gives: (divide (1) (2))
     * User: !divide 20 4
     * Bot: User, dividing 20 and 4 gives: 5
     */
    function divide(args) {
        let pargs = $.parseArgs(args.args, ' ');
        let result = null;

        if (pargs !== null) {
            for (let i in pargs) {
                if (!isNaN(pargs[i])) {
                    let val = Number(pargs[i]);
                    if (result === null) {
                        result = val;
                    } else if (val !== 0) {
                        result = result / val;
                    }
                }
            }
        }

        if (result === null) {
            result = 0;
        }

        return {
            result: result
        };
    }

    /*
     * @transformer exponentiation
     * @formula (exponentiation arg1:number arg2:number ...) raise the given numbers via exponentiation and return the result
     * @labels twitch discord noevent math
     * @notes any argument which returns `true` for `isNaN` is skipped
     * @example Caster: !addcom !exponentiation (sender), raising (1) to the power of (2) gives: (exponentiation (1) (2))
     * User: !exponentiation 10 -2
     * Bot: User, raising 10 to the power of -2 gives: 0.01
     */
    function exponentiation(args) {
        let pargs = $.parseArgs(args.args, ' ');
        let result = null;

        if (pargs !== null) {
            for (let i in pargs) {
                if (!isNaN(pargs[i])) {
                    let val = Number(pargs[i]);
                    if (result === null) {
                        result = val;
                    } else {
                        result = result ** val;
                    }
                }
            }
        }

        if (result === null) {
            result = 0;
        }

        return {
            result: result
        };
    }

    /*
     * @transformer floor
     * @formula (floor arg:number) round down the given number and return the result
     * @labels twitch discord noevent math
     * @notes if the argument returns `true` for `isNaN`, `0` is returned
     * @example Caster: !addcom !floor (sender), rounding (1) down gives: (floor (1))
     * User: !floor 2.1
     * Bot: User, rounding down 2.1 gives: 2
     */
    function floor(args) {
        let pargs = $.parseArgs(args.args, ' ');
        let result = null;

        if (pargs !== null) {
            if (!isNaN(pargs[0])) {
                result = Math.floor(Number(pargs[0]));
            }
        }

        if (result === null) {
            result = 0;
        }

        return {
            result: result
        };
    }

    /*
     * @transformer max
     * @formula (max arg1:number arg2:number ...) return the highest value of the given numbers
     * @labels twitch discord noevent math
     * @notes any argument which returns `true` for `isNaN` is skipped
     * @example Caster: !addcom !min (sender), the maximum value of (1), (2), and (3) is: (max (1) (2) (3))
     * User: !max 8 1 9
     * Bot: User, the maximum value of 8, 1, and 9 is: 9
     */
    function max(args) {
        let pargs = $.parseArgs(args.args, ' ');
        let result = null;

        if (pargs !== null) {
            for (let i in pargs) {
                if (!isNaN(pargs[i])) {
                    let val = Number(pargs[i]);
                    if (result === null) {
                        result = val;
                    } else {
                        result = Math.max(result, val);
                    }
                }
            }
        }

        if (result === null) {
            result = 0;
        }

        return {
            result: result
        };
    }

    /*
     * @transformer min
     * @formula (min arg1:number arg2:number ...) return the lowest value of the given numbers
     * @labels twitch discord noevent math
     * @notes any argument which returns `true` for `isNaN` is skipped
     * @example Caster: !addcom !min (sender), the minimum value of (1), (2), and (3) is: (min (1) (2) (3))
     * User: !min 8 1 9
     * Bot: User, the minimum value of 8, 1, and 9 is: 1
     */
    function min(args) {
        let pargs = $.parseArgs(args.args, ' ');
        let result = null;

        if (pargs !== null) {
            for (let i in pargs) {
                if (!isNaN(pargs[i])) {
                    let val = Number(pargs[i]);
                    if (result === null) {
                        result = val;
                    } else {
                        result = Math.min(result, val);
                    }
                }
            }
        }

        if (result === null) {
            result = 0;
        }

        return {
            result: result
        };
    }

    /*
     * @transformer multiply
     * @formula (multiply arg1:number arg2:number ...) multiply the given numbers and return the result
     * @labels twitch discord noevent math
     * @notes any argument which returns `true` for `isNaN` is skipped
     * @example Caster: !addcom !multiply (sender), multiplying (1) and (2) gives: (multiply (1) (2))
     * User: !multiply 5 4
     * Bot: User, multiplying 5 and 4 gives: 20
     */
    function multiply(args) {
        let pargs = $.parseArgs(args.args, ' ');
        let result = null;

        if (pargs !== null) {
            for (let i in pargs) {
                if (!isNaN(pargs[i])) {
                    let val = Number(pargs[i]);
                    if (result === null) {
                        result = val;
                    } else {
                        result = result * val;
                    }
                }
            }
        }

        if (result === null) {
            result = 0;
        }

        return {
            result: result
        };
    }

    /*
     * @transformer remainder
     * @formula (remainder arg1:number arg2:number ...) calculate the remainder after dividing the given numbers and return the result
     * @labels twitch discord noevent math
     * @notes any argument which returns `true` for `isNaN` is skipped
     * @notes any argument, except for the first, which is `0` is skipped
     * @example Caster: !addcom !remainder (sender), dividing (1) and (2) gives a remainder of: (remainder (1) (2))
     * User: !remainder 5 4
     * Bot: User, dividing 5 and 4 gives a remainder of: 1
     */
    function remainder(args) {
        let pargs = $.parseArgs(args.args, ' ');
        let result = null;

        if (pargs !== null) {
            for (let i in pargs) {
                if (!isNaN(pargs[i])) {
                    let val = Number(pargs[i]);
                    if (result === null) {
                        result = val;
                    } else if (val !== 0) {
                        result = result % val;
                    }
                }
            }
        }

        if (result === null) {
            result = 0;
        }

        return {
            result: result
        };
    }

    /*
     * @transformer round
     * @formula (round arg:number) round the given number and return the result
     * @labels twitch discord noevent math
     * @notes if the argument returns `true` for `isNaN`, `0` is returned
     * @example Caster: !addcom !round (sender), rounding (1) gives: (round (1))
     * User: !round 1.5
     * Bot: User, rounding 1.5 gives: 2
     */
    function round(args) {
        let pargs = $.parseArgs(args.args, ' ');
        let result = null;

        if (pargs !== null) {
            if (!isNaN(pargs[0])) {
                result = Math.round(Number(pargs[0]));
            }
        }

        if (result === null) {
            result = 0;
        }

        return {
            result: result
        };
    }

    /*
     * @transformer subtract
     * @formula (subtract arg1:number arg2:number ...) suntract the given numbers and return the result
     * @labels twitch discord noevent math
     * @notes any argument which returns `true` for `isNaN` is skipped
     * @example Caster: !addcom !subtract (sender), subtracting (1), (2), and (3) gives: (subtract (1) (2) (3))
     * User: !subtract 1 3 5 
     * Bot: User, subtracting 1, 3, and 5 gives: -7
     */
    function subtract(args) {
        let pargs = $.parseArgs(args.args, ' ');
        let result = null;

        if (pargs !== null) {
            for (let i in pargs) {
                if (!isNaN(pargs[i])) {
                    let val = Number(pargs[i]);
                    if (result === null) {
                        result = val;
                    } else {
                        result = result - val;
                    }
                }
            }
        }

        if (result === null) {
            result = 0;
        }

        return {
            result: result
        };
    }

    let transformers = [
        new $.transformers.transformer('abs', ['twitch', 'discord', 'noevent', 'math'], abs),
        new $.transformers.transformer('add', ['twitch', 'discord', 'noevent', 'math'], add),
        new $.transformers.transformer('ceil', ['twitch', 'discord', 'noevent', 'math'], ceil),
        new $.transformers.transformer('divide', ['twitch', 'discord', 'noevent', 'math'], divide),
        new $.transformers.transformer('exponentiation', ['twitch', 'discord', 'noevent', 'math'], exponentiation),
        new $.transformers.transformer('floor', ['twitch', 'discord', 'noevent', 'math'], floor),
        new $.transformers.transformer('max', ['twitch', 'discord', 'noevent', 'math'], max),
        new $.transformers.transformer('min', ['twitch', 'discord', 'noevent', 'math'], min),
        new $.transformers.transformer('multiply', ['twitch', 'discord', 'noevent', 'math'], multiply),
        new $.transformers.transformer('remainder', ['twitch', 'discord', 'noevent', 'math'], remainder),
        new $.transformers.transformer('round', ['twitch', 'discord', 'noevent', 'math'], round),
        new $.transformers.transformer('subtract', ['twitch', 'discord', 'noevent', 'math'], subtract)
    ];

    $.transformers.addTransformers(transformers);
})();