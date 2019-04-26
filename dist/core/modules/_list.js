"use strict";
/**
 * list functions that obtain and return information from an input list. Does not modify input list.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const underscore_1 = __importDefault(require("underscore"));
function range(start, end, step) {
    if (start === undefined) {
        throw new Error('Invalid inline arg: min must be defined.');
    }
    if (end === undefined) {
        throw new Error('Invalid inline arg: max must be defined.');
    }
    const len = end - start;
    if (len <= 0) {
        return [];
    }
    if (step === undefined) {
        step = 1;
    }
    const list = [];
    let current = start;
    while (current < end) {
        list.push(current);
        current += step;
    }
    return list;
}
exports.range = range;
function isList(list) {
    return Array.isArray(list);
}
exports.isList = isList;
function listLen(list) {
    return list.length;
}
exports.listLen = listLen;
function listCount(list, val) {
    let count = 0;
    for (let i = 0; i < list.length; i++) {
        if (list[i] === val) {
            count += 1;
        }
    }
    return count;
}
exports.listCount = listCount;
function listCopy(list) {
    return list.slice();
}
exports.listCopy = listCopy;
function listLast(list) {
    return list[list.length - 1];
}
exports.listLast = listLast;
function listGet(list, index) {
    if (Array.isArray(index)) {
        return index.map(i => listGet(list, i));
    }
    if (index < 0) {
        index = list.length + index;
    }
    return list[index];
}
exports.listGet = listGet;
function listFind(list, val) {
    return list.indexOf(val);
}
exports.listFind = listFind;
function listHas(list, val) {
    for (let i = list.length - 1; i >= 0; i--) {
        if (list[i] === val) {
            return true;
        }
    }
    return false;
}
exports.listHas = listHas;
function listJoin(list1, list2) {
    if (!Array.isArray(list1)) {
        list1 = [list1];
    }
    if (!Array.isArray(list2)) {
        list2 = [list2];
    }
    return list1.concat(list2);
}
exports.listJoin = listJoin;
function listFlat(list, depth) {
    let list_copy = list.slice();
    for (let i = 0; i < depth; i++) {
        list_copy = underscore_1.default.flatten(list_copy, true);
    }
    return list_copy;
}
exports.listFlat = listFlat;
function listSlice(list, start, end) {
    return list.slice(start, end);
}
exports.listSlice = listSlice;
function listZip(lists) {
    const shortest = lists.length === 0 ? [] : lists.reduce((a, b) => {
        return a.length < b.length ? a : b;
    });
    return shortest.map((_, i) => lists.map(array => array[i]));
}
exports.listZip = listZip;
function listZip2(lists) {
    const longest = lists.length === 0 ? [] : lists.reduce((a, b) => {
        return a.length > b.length ? a : b;
    });
    return longest.map((_, i) => lists.map(array => array[i]));
}
exports.listZip2 = listZip2;
// =============================== DEPRECATED
function shuffle(list) {
    console.log('WARNING: This function has been deprecated. Please use the list.Sort() function, and select random.');
    const new_list = list.slice();
    new_list.sort(() => .5 - Math.random());
    return new_list;
}
exports.shuffle = shuffle;
function zip(lists) {
    console.log('WARNING: This function has been deprecated. Please use the inline listZip() function.');
    return listZip(lists);
}
exports.zip = zip;
function zip2(lists) {
    console.log('WARNING: This function has been deprecated. Please use the inline listZip2() function.');
    return listZip2(lists);
}
exports.zip2 = zip2;
function length(list) {
    if (list === undefined) {
        throw new Error('Invalid inline arg: list must be defined.');
    }
    return list.length;
}
exports.length = length;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2xpc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9tb2R1bGVzL19saXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7Ozs7QUFFSCw0REFBNEI7QUFFNUIsU0FBZ0IsS0FBSyxDQUFDLEtBQWEsRUFBRSxHQUFXLEVBQUUsSUFBYTtJQUMzRCxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7S0FBRTtJQUN6RixJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUU7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7S0FBRTtJQUN2RixNQUFNLEdBQUcsR0FBVyxHQUFHLEdBQUcsS0FBSyxDQUFDO0lBQ2hDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRTtRQUFDLE9BQU8sRUFBRSxDQUFDO0tBQUU7SUFDM0IsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO1FBQUUsSUFBSSxHQUFHLENBQUMsQ0FBQztLQUFFO0lBQ3JDLE1BQU0sSUFBSSxHQUFhLEVBQUUsQ0FBQztJQUMxQixJQUFJLE9BQU8sR0FBVyxLQUFLLENBQUM7SUFDNUIsT0FBTyxPQUFPLEdBQUcsR0FBRyxFQUFFO1FBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkIsT0FBTyxJQUFJLElBQUksQ0FBQztLQUNuQjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2hCLENBQUM7QUFiRCxzQkFhQztBQUVELFNBQWdCLE1BQU0sQ0FBQyxJQUFTO0lBQzVCLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvQixDQUFDO0FBRkQsd0JBRUM7QUFFRCxTQUFnQixPQUFPLENBQUMsSUFBVztJQUMvQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDdkIsQ0FBQztBQUZELDBCQUVDO0FBRUQsU0FBZ0Is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