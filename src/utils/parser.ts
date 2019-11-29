import { IProcedure, ProcedureTypes } from '@models/procedure';
import { inline_func } from '@assets/core/inline/inline';

enum strType {
    NUM,
    VAR,
    STR,
    OTHER
}
const varStartSymbols = new Set(['#', '@', '?']);
const reservedWords = [
    'abstract', 'arguments', 'await', 'boolean',
    'break', 'byte', 'case', 'catch',
    'char', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do',
    'double', 'else', 'enum', 'eval',
    'export', 'extends', 'False', 'final',
    'finally', 'float', 'for', 'function',
    'goto', 'if', 'implements', 'import',
    'in', 'instanceof', 'int', 'interface',
    'let', 'long', 'native', 'new',
    'null', 'package', 'private', 'protected',
    'public', 'return', 'short', 'static',
    'super', 'switch', 'synchronized', 'this',
    'throw', 'throws', 'transient', 'true',
    'try', 'typeof', 'var', 'void',
    'volatile', 'while', 'with', 'yield',

    'Array', 'Date', 'hasOwnProperty', 'Infinity',
    'isFinite', 'isNaN', 'isPrototypeOf', 'length',
    'Math', 'NaN', 'name', 'Number', 'Object',
    'prototype', 'String', 'toString', 'undefined', 'valueOf',

    'pythonList', 
];
const allConstants = (<string[][]>inline_func[0][1]).map(constComp => constComp[0]);
const specialVars = new Set(['model', 'undefined', 'null', 'Infinity', 'true', 'false', 'True', 'False', 'None'].concat(allConstants).concat(reservedWords));

const expressions = new Set(['query.Get','JSON.stringify','JSON.parse']);


export function checkArgInput(jsString: string): boolean {
    const comps = splitComponents(jsString);
    if (typeof comps === 'string') {
        return false
    }
    let i = 0
    while (i < comps.length) {
        const comp = comps[i];
        if (comp.type === strType.OTHER) {
            if (comp.value === ';' || comp.value === '=') {
                return false
            }
        } else if (comp.type === strType.VAR && comp.value[comp.value.length - 1] !== '_') {
            if (i > 0 && comps[i-1].type === strType.OTHER && varStartSymbols.has(comps[i-1].value)) {
            } else if (i + 2 < comps.length && comps[i+1].value === '.' && expressions.has(comp.value + '.' + comps[i+2].value)) {
                i += 2;
            } else if (specialVars.has(comps[i].value)) {
            } else {
                return false
            }
        }
        i ++
    }
    return true
}



/**
 * __________________________________________________________________________
 * __________________________________________________________________________
 * __________________________________________________________________________
 * ____________________ SPLITTING COMPONENTS FROM STRING ____________________
 * __________________________________________________________________________
 * __________________________________________________________________________
 * __________________________________________________________________________
 *
*/
function splitComponents(str: string): {'type': strType, 'value': string}[] | string {
    const comps = [];
    let i = 0;
    while (i < str.length) {
        let code = str.charCodeAt(i);

        // numeric (0-9) ==> number
        if (code > 47 && code < 58) {
            const startI = i;
            while ((code > 47 && code < 58) || code === 46) {
                i ++;
                if (i === str.length) { break; }
                code = str.charCodeAt(i);
            }
            comps.push({'type': strType.NUM, 'value': str.substring(startI, i)});

        // upper alpha (A-Z) & lower alpha (a-z) or _ ==> variable
        } else if ((code > 64 && code < 91) || (code > 96 && code < 123) || code === 95) {
            const startI = i;
            // upper alpha (A-Z), lower alpha (a-z), numeric (0-9) and "_" are allowed for subsequent characters.
            while ((code > 64 && code < 91) || (code > 96 && code < 123) || (code > 47 && code < 58) || code === 95) {
                i += 1;
                if (i === str.length) { break; }
                code = str.charCodeAt(i);
            }
            comps.push({ 'type': strType.VAR, 'value': str.substring(startI, i)});

            // const varString = str.substring(startI, i);
            // if (varString === 'and' || varString === 'or' || varString === 'not') {
            //     comps.push({ 'type': strType.OTHER, 'value': varString});
            // } else {
            //     comps.push({ 'type': strType.VAR, 'value': varString});
            // }

        // double-quotes (") or single-quotes (')
        } else if (code === 34 || code === 39) {
            const startCode = code;
            const startI = i;
            i += 1;
            code = str.charCodeAt(i);
            if (!code) {
                return 'Error: Missing ending quote.';
            }
            while (code !== startCode) { // string must end with the same quote as well
                i += 1;
                if (i === str.length) { break; }
                code = str.charCodeAt(i);
            }
            if (code === startCode) { i += 1; }
            const subStr = str.substring(startI, i);
            if (subStr.charCodeAt(subStr.length - 1) !== startCode) {
                return 'Error: Missing ending quote.';
            }
            comps.push({ 'type': strType.STR, 'value': str.substring(startI, i)});

        // + sign or - sign ==> + / ++ / += / - / -- / -=
        } else if ( code === 43 || code === 45) {
            if (str.charCodeAt(i + 1) === code || str.charCodeAt(i + 1) === 61) {
                comps.push({ 'type': strType.OTHER, 'value': str.substring(i, i + 2)});
                i += 2;
            } else {
                comps.push({ 'type': strType.OTHER, 'value': str.charAt(i)});
                i++;
            }

        // attr.push operator (>>)
        } else if (code === 62 && str.charCodeAt(i + 1) === 62) {
            i += 2;
            comps.push({ 'type': strType.OTHER, 'value': '>>'});

        // comparison operator (!, <, =, >)
        } else if (code === 33 || (code > 59 && code < 63)) {
            const startI = i;
            i++;
            if (str.charCodeAt(i) === 61) { // !=, <=, >=, ==
                i++;
                if (str.charCodeAt(i) === 61) { // !==, ===
                    if (code === 60 || code === 62) { // mark invalid for <== and >==
                        return 'Error: <== and >== not acceptable.';
                    }
                    i++;
                }
            }
            const stringCode = str.substring(startI, i);
            if (stringCode === '=') {
                return 'Error: "=" not acceptable.';
            }
            comps.push({ 'type': strType.OTHER, 'value': stringCode});

        // or operator (||); check 1st |
        } else if (code === 124) {
            i++;
            if (str.charCodeAt(i) !== 124) { // check 2nd |
                return 'Error: || expected.';
            }
            comps.push({ 'type': strType.OTHER, 'value': '||'});
            i++;
        } else if (code === 38) { // and operator (&&); check 1st &
            i++;
            if (str.charCodeAt(i) !== 38) { // check 2nd &
                return 'Error: && expected.';
            }
            comps.push({ 'type': strType.OTHER, 'value': '&&'});
            i++;

        // others: numeric operator (*, /, %), brackets ((), [], {}), comma (,), space, ...
        } else {
            if (code !== 32) { // add to comp if it's not space
                comps.push({ 'type': strType.OTHER, 'value': str.charAt(i)});
            }
            i++;
        }
    }
    return comps;
}
