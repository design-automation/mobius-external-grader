"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../libs/geo-info/common");
// import { isDim0, isDim1, isDim2 } from '../../libs/geo-info/id';
const id_1 = require("../../libs/geo-info/id");
// =========================================================================================================================================
// Attribute Checks
// =========================================================================================================================================
function isValidName(fn_name, arg_name, arg) {
    TypeCheckObj.isString(fn_name, arg_name, arg); // check arg is string
    if (arg.length === 0) {
        throw new Error(fn_name + ': ' + arg_name + ' not specified');
    }
    if (arg.search(/\W/) !== -1) {
        throw new Error(fn_name + ': ' + arg_name + ' contains restricted characters');
    }
    if (arg[0].search(/[0-9]/) !== -1) {
        throw new Error(fn_name + ': ' + arg_name + ' should not start with numbers');
    }
    return;
}
function checkAttribName(fn_name, attrib_name) {
    isValidName(fn_name, 'attrib_name', attrib_name);
    // blocks writing to id
    if (attrib_name === 'id') {
        throw new Error(fn_name + ': id is not modifiable!');
    }
}
exports.checkAttribName = checkAttribName;
function checkAttribValue(fn_name, attrib_value, attrib_index) {
    // -- check defined index
    if (attrib_index !== null && attrib_index !== undefined) {
        // check if index is number
        TypeCheckObj.isNumber(fn_name, 'attrib_index', attrib_index);
        // this is an item in a list, the item value can be any
    }
    else {
        // check sting, number, string[], number[]
        checkCommTypes(fn_name, 'attrib_value', attrib_value, [TypeCheckObj.isString, TypeCheckObj.isNumber, TypeCheckObj.isNull, TypeCheckObj.isList]);
    }
}
exports.checkAttribValue = checkAttribValue;
// export function checkAttribNameValue(fn_name: string, attrib_name: string, attrib_value: any, attrib_index?: number): void {
//     isValidName(fn_name, 'attrib_name', attrib_name);
//     // blocks writing to id
//     if (attrib_name === 'id') {
//         throw new Error(fn_name + ': id is not modifiable!');
//     }
//     // -- check defined index
//     let ind = false;
//     if (attrib_index !== null && attrib_index !== undefined) {
//         ind = true;
//         // check if index is number
//         TypeCheckObj.isNumber(fn_name, 'attrib_index', attrib_index);
//     }
//     // -- check blocked name
//     const blk_att_nm_lst = Object.values(EAttribNames);
//     let blocked = false;
//     let isTexture = false;
//     let isName = false;
//     for (let i = 0; i < blk_att_nm_lst.length; i++) {
//         if (attrib_name === 'texture') {
//             isTexture = true;
//             blocked = true;
//             break;
//         }
//         if (attrib_name === 'name') {
//             isName = true;
//             blocked = true;
//             break;
//         }
//         if (attrib_name === blk_att_nm_lst[i]) {
//             blocked = true;
//             break;
//         }
//     }
//     let check_fns = [];
//     if (attrib_value !== null && attrib_value !== undefined) {
//         if (blocked === true) {
//             let pass = false;
//             const err_arr = [fn_name + ': ' + 'attrib_name is one of the reserved attribute names - '
//                             + Object.values(EAttribNames).toString() + '<br>'];
//             if (isName) {
//                 try {
//                     isValidName(fn_name, 'attrib_value', attrib_value);
//                     pass = true;
//                 } catch (err) {
//                     err_arr.push(err);
//                 }
//             } else {
//                 if (ind === false) {
//                     try {
//                         isListArg(fn_name, 'attrib_value', attrib_value, 'numbers');
//                         let chkLstLen;
//                         if (isTexture) {
//                             chkLstLen = 2;
//                         } else {
//                             chkLstLen = 3;
//                         }
//                         isListLenArg(fn_name, 'attrib_value', attrib_value, chkLstLen);
//                     } catch (err) {
//                         err_arr.push(err.message);
//                         throw new Error(err_arr.join(''));
//                     }
//                     check_fns = [TypeCheckObj.isNumberList];
//                     for (let i = 0; i < check_fns.length; i++) {
//                         try {
//                             check_fns[i](fn_name + '.' + check_fns[i], 'attrib_value', attrib_value);
//                         } catch (err) {
//                             err_arr.push(err.message + '<br>');
//                             continue;
//                         }
//                         pass = true;
//                         break; // passed
//                     }
//                 } else {
//                     if (isTexture) {
//                         if (attrib_index > 1 || attrib_index < 0) {
//                             err_arr.push(fn_name + '.validIndex: attrib_index is not between 0 and 1 (inclusive)');
//                             throw new Error(err_arr.join(''));
//                         }
//                     } else {
//                         if (attrib_index > 2 || attrib_index < 0) {
//                             err_arr.push(fn_name + '.validIndex: attrib_index is not between 0 and 2 (inclusive)');
//                             throw new Error(err_arr.join(''));
//                         }
//                     }
//                     check_fns = [TypeCheckObj.isNumber];
//                     for (let i = 0; i < check_fns.length; i++) {
//                         try {
//                             check_fns[i](fn_name + '[' + attrib_index + ']' + '.' + check_fns[i],
//                                                       'attrib_value', attrib_value);
//                         } catch (err) {
//                             err_arr.push(err.message + '<br>');
//                             continue;
//                         }
//                         pass = true;
//                         break; // passed
//                     }
//                 }
//             }
//             if (pass === false) {
//                 throw new Error(err_arr.join(''));
//             }
//         } else {
//             if (ind === false) {
//                 checkCommTypes(fn_name, 'attrib_value', attrib_value,
//                     [TypeCheckObj.isString, TypeCheckObj.isNumber, TypeCheckObj.isStringList, TypeCheckObj.isNumberList]);
//             } else { // no nested lists
//                 checkCommTypes(fn_name  + '[' + attrib_index + ']', 'attrib_value', attrib_value,
//                     [TypeCheckObj.isString, TypeCheckObj.isNumber]);
//             }
//         }
//     }
//     return;
// }
// =========================================================================================================================================
// Function Dictionaries
// =========================================================================================================================================
class TypeCheckObj {
    // entities: Check if string
    // static isEntity(fn_name: string, arg_name: string, arg: string): void {
    //     isStringArg(fn_name, arg_name, arg, 'entity');
    //     if (arg.slice(2).length === 0) {
    //         throw new Error(fn_name + ': ' + arg_name + ' needs to have an index specified');
    //     }
    //     return;
    // }
    // static isEntityList(fn_name: string, arg_name: string, arg_list: string[]): void {
    //     isListArg(fn_name, arg_name, arg_list, 'entity');
    //     for (let i = 0; i < arg_list.length; i++) {
    //         TypeCheckObj.isEntity(fn_name, arg_name + '[' + i + ']', arg_list[i]);
    //     }
    //     return;
    // }
    // any: to catch undefined
    static isAny(fn_name, arg_name, arg) {
        isAnyArg(fn_name, arg_name, arg);
        return;
    }
    // null: allow Null input
    static isNull(fn_name, arg_name, arg) {
        isNullArg(fn_name, arg_name, arg);
        return;
    }
    // list
    static isList(fn_name, arg_name, arg) {
        isListArg(fn_name, arg_name, arg, 'any');
        return;
    }
    // strings
    static isString(fn_name, arg_name, arg) {
        isStringArg(fn_name, arg_name, arg, 'string');
        return;
    }
    static isStringList(fn_name, arg_name, arg_list) {
        isStringListArg(fn_name, arg_name, arg_list, 'string');
        return;
    }
    // numbers and special numbers
    static isNumber(fn_name, arg_name, arg) {
        isNumberArg(fn_name, arg_name, arg);
        return;
    }
    static isNumberList(fn_name, arg_name, arg_list) {
        isNumberListArg(fn_name, arg_name, arg_list);
        return;
    }
    static isNullList(fn_name, arg_name, arg_list) {
        isNullListArg(fn_name, arg_name, arg_list);
        return;
    }
    static isInt(fn_name, arg_name, arg) {
        isIntArg(fn_name, arg_name, arg);
        return;
    }
    static isXYlist(fn_name, arg_name, arg_list) {
        isListArg(fn_name, arg_name, arg_list, 'numbers');
        isListLenArg(fn_name, arg_name, arg_list, 2);
        isNumberListArg(fn_name, arg_name, arg_list);
        return;
    }
    static isXYlistInt(fn_name, arg_name, arg_list) {
        isListArg(fn_name, arg_name, arg_list, 'integers');
        isListLenArg(fn_name, arg_name, arg_list, 2);
        isIntListArg(fn_name, arg_name, arg_list);
        return;
    }
    static isXYZlist(fn_name, arg_name, arg_list) {
        TypeCheckObj.isCoord(fn_name, arg_name, arg_list);
        return;
    }
    // Other Geometry
    static isColor(fn_name, arg_name, arg) {
        isListArg(fn_name, arg_name, arg, 'numbers');
        isListLenArg(fn_name, arg_name, arg, 3);
        isNumberListArg(fn_name, arg_name, arg);
        return;
    }
    static isCoord(fn_name, arg_name, arg) {
        isListArg(fn_name, arg_name, arg, 'numbers');
        isListLenArg(fn_name, arg_name, arg, 3);
        isNumberListArg(fn_name, arg_name, arg);
        return;
    }
    static isCoordList(fn_name, arg_name, arg_list) {
        isListArg(fn_name, arg_name, arg_list, 'coordinates');
        for (let i = 0; i < arg_list.length; i++) {
            isListLenArg(fn_name, arg_name + '[' + i + ']', arg_list[i], 3);
            isNumberListArg(fn_name, arg_name + '[' + i + ']', arg_list[i]);
        }
        return;
    }
    static isCoordList_List(fn_name, arg_name, arg_list) {
        isListArg(fn_name, arg_name, arg_list, 'lists of coordinates');
        for (let i = 0; i < arg_list.length; i++) {
            TypeCheckObj.isCoordList(fn_name, arg_name + '[' + i + ']', arg_list[i]);
        }
        return;
    }
    static isVector(fn_name, arg_name, arg_list) {
        TypeCheckObj.isCoord(fn_name, arg_name, arg_list);
        return;
    }
    static isVectorList(fn_name, arg_name, arg_list) {
        isListArg(fn_name, arg_name, arg_list, 'vectors');
        for (let i = 0; i < arg_list.length; i++) {
            TypeCheckObj.isVector(fn_name, arg_name + '[' + i + ']', arg_list[i]);
        }
        return;
    }
    static isOrigin(fn_name, arg_name, arg) {
        return checkIDnTypes(fn_name, arg_name, arg, [IDcheckObj.isID, TypeCheckObj.isCoord], [common_1.EEntType.POSI, common_1.EEntType.VERT, common_1.EEntType.POINT]);
    }
    static isPlane(fn_name, arg_name, arg_list) {
        // one origin: point, posi, vert, coord + 2 vectors
        isListArg(fn_name, arg_name, arg_list, 'origin and vectors');
        isListLenArg(fn_name, arg_name, arg_list, 3);
        TypeCheckObj.isCoord(fn_name, arg_name + '[0]', arg_list[0]);
        [1, 2].forEach((i) => {
            TypeCheckObj.isVector(fn_name, arg_name + '[' + i + ']', arg_list[i]);
        });
        return;
    }
    static isPlaneList(fn_name, arg_name, arg_list) {
        isListArg(fn_name, arg_name, arg_list, 'planes');
        for (let i = 0; i < arg_list.length; i++) {
            TypeCheckObj.isPlane(fn_name, arg_name + '[' + i + ']', arg_list[i]);
        }
        return;
    }
    static isBBox(fn_name, arg_name, arg_list) {
        // four coords
        isListArg(fn_name, arg_name, arg_list, 'origin, min corner, max corner, size');
        isListLenArg(fn_name, arg_name, arg_list, 4);
        TypeCheckObj.isCoord(fn_name, arg_name + '[0]', arg_list[0]);
        [0, 1, 2, 3].forEach((i) => {
            TypeCheckObj.isVector(fn_name, arg_name + '[' + i + ']', arg_list[i]);
        });
        return;
    }
    static isBBoxList(fn_name, arg_name, arg_list) {
        isListArg(fn_name, arg_name, arg_list, 'BBoxes');
        for (let i = 0; i < arg_list.length; i++) {
            TypeCheckObj.isBBox(fn_name, arg_name + '[' + i + ']', arg_list[i]);
        }
        return;
    }
    static isRay(fn_name, arg_name, arg_list) {
        isListArg(fn_name, arg_name, arg_list, 'origin and vector');
        isListLenArg(fn_name, arg_name, arg_list, 2);
        TypeCheckObj.isCoord(fn_name, arg_name + '[0]', arg_list[0]);
        TypeCheckObj.isVector(fn_name, arg_name + '[1]', arg_list[1]);
        return;
    }
    static isRayList(fn_name, arg_name, arg_list) {
        isListArg(fn_name, arg_name, arg_list, 'Rays');
        for (let i = 0; i < arg_list.length; i++) {
            TypeCheckObj.isBBox(fn_name, arg_name + '[' + i + ']', arg_list[i]);
        }
        return;
    }
}
exports.TypeCheckObj = TypeCheckObj;
class IDcheckObj {
    // IDs
    // entity types
    // POSI, TRI, VERT, EDGE, WIRE, FACE, POINT, PLINE, PGON, COLL
    static isID(fn_name, arg_name, arg, ent_type_strs) {
        let ent_arr;
        try {
            ent_arr = id_1.idsBreak(arg); // split
        }
        catch (err) {
            throw new Error(fn_name + ': ' + arg_name + ' is not a valid Entity ID'); // check valid id
        }
        if (ent_type_strs === null) {
            ent_type_strs = IDcheckObj.default_ent_type_strs;
        }
        let pass = false;
        for (let i = 0; i < ent_type_strs.length; i++) {
            if (ent_arr[0] === ent_type_strs[i]) {
                pass = true;
                break;
            }
        }
        if (pass === false) {
            throw new Error(fn_name + ': ' + arg_name + ' is not one of the following valid types - ' +
                ent_type_strs.map((test_ent) => common_1.EEntType[test_ent]).toString());
        }
        return ent_arr;
    }
    static isIDList(fn_name, arg_name, arg_list, ent_type_strs) {
        isListArg(fn_name, arg_name, arg_list, 'valid Entity IDs');
        const ret_arr = [];
        if (ent_type_strs === null) {
            ent_type_strs = IDcheckObj.default_ent_type_strs;
        }
        for (let i = 0; i < arg_list.length; i++) {
            ret_arr.push(IDcheckObj.isID(fn_name, arg_name + '[' + i + ']', arg_list[i], ent_type_strs));
        }
        return ret_arr;
    }
    static isIDList_list(fn_name, arg_name, arg_list, ent_type_strs) {
        isListArg(fn_name, arg_name, arg_list, 'list of valid Entity IDs');
        const ret_arr = [];
        if (ent_type_strs === null) {
            ent_type_strs = IDcheckObj.default_ent_type_strs;
        }
        for (let i = 0; i < arg_list.length; i++) {
            ret_arr.push(IDcheckObj.isIDList(fn_name, arg_name + '[' + i + ']', arg_list[i], ent_type_strs));
        }
        return ret_arr;
    }
}
// static default_ent_type_strs = ['POSI', 'TRI', 'VERT', 'EDGE', 'WIRE', 'FACE', 'POINT', 'PLINE', 'PGON', 'COLL'];
IDcheckObj.default_ent_type_strs = [common_1.EEntType.POSI,
    common_1.EEntType.TRI,
    common_1.EEntType.VERT,
    common_1.EEntType.EDGE,
    common_1.EEntType.WIRE,
    common_1.EEntType.FACE,
    common_1.EEntType.POINT,
    common_1.EEntType.PLINE,
    common_1.EEntType.PGON,
    common_1.EEntType.COLL];
exports.IDcheckObj = IDcheckObj;
// =========================================================================================================================================
// Specific Checks
// =========================================================================================================================================
function checkCommTypes(fn_name, arg_name, arg, check_fns) {
    let pass = false;
    const err_arr = [];
    let ret;
    for (let i = 0; i < check_fns.length; i++) {
        try {
            ret = check_fns[i](fn_name, arg_name, arg);
        }
        catch (err) {
            err_arr.push(err.message + '<br>');
            continue;
        }
        pass = true;
        break; // passed
    }
    if (pass === false) { // Failed all tests: argument does not fall into any valid types
        const ret_msg = fn_name + ': ' + arg_name + ' failed the following tests:<br>';
        throw new Error(ret_msg + err_arr.join(''));
    }
    return ret;
}
exports.checkCommTypes = checkCommTypes;
function checkIDs(fn_name, arg_name, arg, check_fns, IDchecks) {
    let pass = false;
    const err_arr = [];
    let ret;
    for (let i = 0; i < check_fns.length; i++) {
        try {
            ret = check_fns[i](fn_name, arg_name, arg, IDchecks);
        }
        catch (err) {
            err_arr.push(err.message + '<br>');
            continue;
        }
        pass = true;
        break; // passed
    }
    if (pass === false) { // Failed all tests: argument does not fall into any valid types
        const ret_msg = fn_name + ': ' + arg_name + ' failed the following tests:<br>';
        throw new Error(ret_msg + err_arr.join(''));
    }
    return ret; // returns TEntTypeIdx|TEntTypeIdx[]|TEntTypeIdx[][]; depends on which passes
}
exports.checkIDs = checkIDs;
// =========================================================================================================================================
// Most General Check
// =========================================================================================================================================
function checkIDnTypes(fn_name, arg_name, arg, check_fns, IDchecks) {
    let pass = false;
    const err_arr = [];
    let ret;
    for (let i = 0; i < check_fns.length; i++) {
        try {
            ret = check_fns[i](fn_name, arg_name, arg, IDchecks);
        }
        catch (err) {
            err_arr.push(err.message + '<br>');
            continue;
        }
        pass = true;
        break; // passed
        // if (Object.keys(IDcheckObj).includes(check_fns[i])) {
        //     // checking for ID
        //     try {
        //         ret = IDcheckObj[check_fns[i]](fn_name + '.' + check_fns[i], arg_name, arg, IDchecks);
        //     } catch (err) {
        //         err_arr.push(err.message + '<br>');
        //         continue;
        //     }
        //     pass = true;
        //     break; // passed
        // } else {
        //     // checking common types
        //     try {
        //         TypeCheckObj[check_fns[i]](fn_name + '.' + check_fns[i], arg_name, arg);
        //     } catch (err) {
        //         err_arr.push(err.message + '<br>');
        //         continue;
        //     }
        //     pass = true;
        //     break; // passed
        // }
    }
    if (pass === false) { // Failed all tests: argument does not fall into any valid types
        const ret_msg = fn_name + ': ' + arg_name + ' failed the following tests:<br>';
        throw new Error(ret_msg + err_arr.join(''));
    }
    return ret; // returns void|TEntTypeIdx|TEntTypeIdx[]|TEntTypeIdx[][]; depends on which passes
}
exports.checkIDnTypes = checkIDnTypes;
// =====================================================================================================================
// util
// =====================================================================================================================
// List
function isListArg(fn_name, arg_name, arg, typ) {
    if (!Array.isArray(arg)) {
        throw new Error(fn_name + ': ' + arg_name + ' is not a list of ' + typ);
    }
    return;
}
function isListLenArg(fn_name, arg_name, arg_list, len) {
    if (arg_list.length !== len) {
        throw new Error(fn_name + ': ' + arg_name + ' is not a list of length ' + len);
    }
    return;
}
// Any
function isAnyArg(fn_name, arg_name, arg) {
    if (arg === undefined) {
        throw new Error(fn_name + ': ' + arg_name + ' must be defined');
    }
    return;
}
// Null
function isNullArg(fn_name, arg_name, arg) {
    if (arg !== null) {
        throw new Error(fn_name + ': ' + arg_name + ' is not null');
    }
    return;
}
// String
function isStringArg(fn_name, arg_name, arg, typ) {
    if (typeof arg !== 'string') {
        throw new Error(fn_name + ': ' + arg_name + ' is not a ' + typ);
    }
    return;
}
function isStringListArg(fn_name, arg_name, arg_list, typ) {
    isListArg(fn_name, arg_name, arg_list, typ);
    for (let i = 0; i < arg_list.length; i++) {
        isStringArg(fn_name, arg_name + '[' + i + ']', arg_list[i], typ);
    }
    return;
}
// Numbers
function isNumberArg(fn_name, arg_name, arg) {
    if (isNaN(arg) || isNaN(parseInt(arg, 10))) {
        throw new Error(fn_name + ': ' + arg_name + ' is not a number');
    }
    return;
}
function isNumberListArg(fn_name, arg_name, arg_list) {
    isListArg(fn_name, arg_name, arg_list, 'numbers');
    for (let i = 0; i < arg_list.length; i++) {
        isNumberArg(fn_name, arg_name + '[' + i + ']', arg_list[i]);
    }
    return;
}
function isNullListArg(fn_name, arg_name, arg_list) {
    isListArg(fn_name, arg_name, arg_list, 'null');
    for (let i = 0; i < arg_list.length; i++) {
        isNullArg(fn_name, arg_name + '[' + i + ']', arg_list[i]);
    }
    return;
}
function isIntArg(fn_name, arg_name, arg) {
    if (!Number.isInteger(arg)) {
        throw new Error(fn_name + ': ' + arg_name + ' is not an integer');
    }
    return;
}
function isIntListArg(fn_name, arg_name, arg_list) {
    isListArg(fn_name, arg_name, arg_list, 'integers');
    for (let i = 0; i < arg_list.length; i++) {
        if (!Number.isInteger(arg_list[i])) {
            throw new Error(fn_name + ': ' + arg_name + '[' + i + ']' + ' is not an integer');
        }
    }
    return;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NoZWNrX2FyZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9tb2R1bGVzL19jaGVja19hcmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdURBQThGO0FBQzlGLG1FQUFtRTtBQUNuRSwrQ0FBa0Q7QUFFbEQsNElBQTRJO0FBQzVJLG1CQUFtQjtBQUNuQiw0SUFBNEk7QUFDNUksU0FBUyxXQUFXLENBQUMsT0FBZSxFQUFFLFFBQWdCLEVBQUUsR0FBVztJQUMvRCxZQUFZLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxzQkFBc0I7SUFDckUsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUNsQixNQUFNLElBQUksS0FBSyxDQUFFLE9BQU8sR0FBRyxJQUFJLEdBQUcsUUFBUSxHQUFHLGdCQUFnQixDQUFDLENBQUM7S0FDbEU7SUFDRCxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDekIsTUFBTSxJQUFJLEtBQUssQ0FBRSxPQUFPLEdBQUcsSUFBSSxHQUFHLFFBQVEsR0FBRyxpQ0FBaUMsQ0FBQyxDQUFDO0tBQ25GO0lBQ0QsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQy9CLE1BQU0sSUFBSSxLQUFLLENBQUUsT0FBTyxHQUFHLElBQUksR0FBRyxRQUFRLEdBQUcsZ0NBQWdDLENBQUMsQ0FBQztLQUNsRjtJQUNELE9BQU87QUFDWCxDQUFDO0FBQ0QsU0FBZ0IsZUFBZSxDQUFDLE9BQWUsRUFBRSxXQUFtQjtJQUNoRSxXQUFXLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNqRCx1QkFBdUI7SUFDdkIsSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFO1FBQ3RC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