"use strict";
/**
 * The `list` module has functions for working with lists of items.
 * These functions have no direct link with the model, the are generic functions for manipulating lists.
 * The functions are often used when manipulating lists of IDs of entities in the model.
 * These functions neither make nor modify anything in the model.
 * In addition to these functions, there are also various inline functions available for working with lists.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 */
const _check_args_1 = require("./_check_args");
const id_1 = require("../../libs/geo-info/id");
// ================================================================================================
var _EAddMethod;
(function (_EAddMethod) {
    _EAddMethod["TO_START"] = "to_start";
    _EAddMethod["TO_END"] = "to_end";
    _EAddMethod["EXTEND_START"] = "extend_start";
    _EAddMethod["EXTEND_END"] = "extend_end";
    _EAddMethod["SORTED_ALPHA"] = "alpha_descending";
    _EAddMethod["SORTED_REV_ALPHA"] = "alpha_ascending";
    _EAddMethod["SORTED_NUM"] = "numeric_descending";
    _EAddMethod["SORTED_REV_NUM"] = "numeric_ascending";
    _EAddMethod["SORTED_ID"] = "ID_descending";
    _EAddMethod["SORTED_REV_ID"] = "ID_ascending";
})(_EAddMethod = exports._EAddMethod || (exports._EAddMethod = {}));
/**
 * Adds an item to a list.
 *
 * @param list List to add the item to.
 * @param item Item to add.
 * @param method Enum, select the method.
 * @returns void
 * @example append = list.Add([1,2,3], 4, 'at_end')
 * @example_info Expected value of list is [1,2,3,4].
 * @example append = list.Add([1,2,3], [4, 5], 'at_end')
 * @example_info Expected value of list is [1,2,3,[4,5]].
 * @example append = list.Add([1,2,3], [4,5], 'extend_end')
 * @example_info Expected value of list is [1,2,3,4,5].
 * @example append = list.Add(["a", "c", "d"], "b", 'alpha_descending')
 * @example_info Expected value of list is ["a", "b", "c", "d"].
 */
function Add(list, item, method) {
    // --- Error Check ---
    const fn_name = 'list.Add';
    _check_args_1.checkCommTypes(fn_name, 'list', list, [_check_args_1.TypeCheckObj.isList]);
    _check_args_1.checkCommTypes(fn_name, 'value', item, [_check_args_1.TypeCheckObj.isAny]);
    // --- Error Check ---
    let str_value;
    switch (method) {
        case _EAddMethod.TO_START:
            list.unshift(item);
            break;
        case _EAddMethod.TO_END:
            list.push(item);
            break;
        case _EAddMethod.EXTEND_START:
            if (!Array.isArray(item)) {
                item = [item];
            }
            for (let i = item.length - 1; i >= 0; i--) {
                list.unshift(item[i]);
            }
            break;
        case _EAddMethod.EXTEND_END:
            if (!Array.isArray(item)) {
                item = [item];
            }
            for (let i = 0; i < item.length; i++) {
                list.push(item[i]);
            }
            break;
        case _EAddMethod.SORTED_ALPHA:
            str_value = item + '';
            for (let i = 0; i < list.length + 1; i++) {
                if (str_value < list[i] + '' || i === list.length) {
                    list.splice(i, 0, item);
                    break;
                }
            }
            break;
        case _EAddMethod.SORTED_REV_ALPHA:
            str_value = item + '';
            for (let i = 0; i < list.length + 1; i++) {
                if (str_value > list[i] + '' || i === list.length) {
                    list.splice(i, 0, item);
                    break;
                }
            }
            break;
        case _EAddMethod.SORTED_NUM:
            for (let i = 0; i < list.length + 1; i++) {
                if (item - list[i] > 0 || i === list.length) {
                    list.splice(i, 0, item);
                    break;
                }
            }
            break;
        case _EAddMethod.SORTED_REV_NUM:
            for (let i = 0; i < list.length + 1; i++) {
                if (item - list[i] < 0 || i === list.length) {
                    list.splice(i, 0, item);
                    break;
                }
            }
            break;
        case _EAddMethod.SORTED_ID:
            for (let i = 0; i < list.length + 1; i++) {
                if (_compareID(item, list[i]) > 0 || i === list.length) {
                    list.splice(i, 0, item);
                    break;
                }
            }
            break;
        case _EAddMethod.SORTED_REV_ID:
            for (let i = 0; i < list.length + 1; i++) {
                if (_compareID(item, list[i]) < 0 || i === list.length) {
                    list.splice(i, 0, item);
                    break;
                }
            }
            break;
        default:
            break;
    }
}
exports.Add = Add;
// ================================================================================================
var _ERemoveMethod;
(function (_ERemoveMethod) {
    _ERemoveMethod["REMOVE_INDEX"] = "remove_index";
    _ERemoveMethod["REMOVE_FIRST_VALUE"] = "remove_first_value";
    _ERemoveMethod["REMOVE_LAST_VALUE"] = "remove_last_value";
    _ERemoveMethod["REMOVE_ALL_VALUES"] = "remove_all_values";
})(_ERemoveMethod = exports._ERemoveMethod || (exports._ERemoveMethod = {}));
/**
 * Removes items in a list.
 *
 * @param list The list in which to remove items
 * @param item The item to remove, either the index of the item or the value. Negative indexes are allowed.
 * @param method Enum, select the method for removing items from the list.
 * @returns void
 */
function Remove(list, item, method) {
    // --- Error Check ---
    const fn_name = 'list.Remove';
    _check_args_1.checkCommTypes(fn_name, 'list', list, [_check_args_1.TypeCheckObj.isList]);
    _check_args_1.checkCommTypes(fn_name, 'item', item, [_check_args_1.TypeCheckObj.isAny]);
    // --- Error Check ---
    let index;
    switch (method) {
        case _ERemoveMethod.REMOVE_INDEX:
            index = item;
            if (!isNaN(index)) {
                if (index < 0) {
                    index = list.length + index;
                }
                list.splice(index, 1);
            }
            break;
        case _ERemoveMethod.REMOVE_FIRST_VALUE:
            index = list.indexOf(item);
            if (index !== -1) {
                list.splice(index, 1);
            }
            break;
        case _ERemoveMethod.REMOVE_LAST_VALUE:
            index = list.lastIndexOf(item);
            if (index !== -1) {
                list.splice(index, 1);
            }
            break;
        case _ERemoveMethod.REMOVE_ALL_VALUES:
            for (index = 0; index < list.length; index++) {
                if (list[index] === item) {
                    list.splice(index, 1);
                    index -= 1;
                }
            }
            break;
        default:
            throw new Error('list.Remove: Remove method not recognised.');
    }
}
exports.Remove = Remove;
// ================================================================================================
var _EReplaceMethod;
(function (_EReplaceMethod) {
    _EReplaceMethod["REPLACE_INDEX"] = "index";
    _EReplaceMethod["REPLACE_FIRST_VALUE"] = "first_value";
    _EReplaceMethod["REPLACE_LAST_VALUE"] = "last_value";
    _EReplaceMethod["REPLACE_ALL_VALUES"] = "all_values";
})(_EReplaceMethod = exports._EReplaceMethod || (exports._EReplaceMethod = {}));
/**
 * Replaces items in a list.
 *
 * @param list The list in which to replace items
 * @param item The item to replace, either the index of the item or the value. Negative indexes are allowed.
 * @param new_value The new value.
 * @param method Enum, select the method for replacing items in the list.
 * @returns void
 */
function Replace(list, item, new_value, method) {
    // --- Error Check ---
    const fn_name = 'list.Replace';
    _check_args_1.checkCommTypes(fn_name, 'list', list, [_check_args_1.TypeCheckObj.isList]);
    _check_args_1.checkCommTypes(fn_name, 'item', item, [_check_args_1.TypeCheckObj.isAny]);
    _check_args_1.checkCommTypes(fn_name, 'new_value', new_value, [_check_args_1.TypeCheckObj.isAny]);
    // --- Error Check ---
    let index;
    switch (method) {
        case _EReplaceMethod.REPLACE_INDEX:
            index = item;
            if (!isNaN(index)) {
                if (index < 0) {
                    index = list.length + index;
                }
                list[index] = new_value;
            }
            break;
        case _EReplaceMethod.REPLACE_FIRST_VALUE:
            index = list.indexOf(item);
            if (index !== -1) {
                list[index] = new_value;
            }
            break;
        case _EReplaceMethod.REPLACE_LAST_VALUE:
            index = list.lastIndexOf(item);
            if (index !== -1) {
                list[index] = new_value;
            }
            break;
        case _EReplaceMethod.REPLACE_ALL_VALUES:
            for (index = 0; index < list.length; index++) {
                if (list[index] === item) {
                    list[index] = new_value;
                }
            }
            break;
        default:
            throw new Error('list.Replace: Replace method not recognised.');
    }
}
exports.Replace = Replace;
// ================================================================================================
var _ESortMethod;
(function (_ESortMethod) {
    _ESortMethod["REV"] = "reverse";
    _ESortMethod["ALPHA"] = "alpha_descending";
    _ESortMethod["REV_ALPHA"] = "alpha_ascending";
    _ESortMethod["NUM"] = "numeric_descending";
    _ESortMethod["REV_NUM"] = "numeric_ascending";
    _ESortMethod["ID"] = "ID_descending";
    _ESortMethod["REV_ID"] = "ID_ascending";
    _ESortMethod["SHIFT"] = "shift_1";
    _ESortMethod["REV_SHIFT"] = "reverse_shift_1";
    _ESortMethod["RANDOM"] = "random";
})(_ESortMethod = exports._ESortMethod || (exports._ESortMethod = {}));
function _compareID(id1, id2) {
    const [ent_type1, index1] = id_1.idsBreak(id1);
    const [ent_type2, index2] = id_1.idsBreak(id2);
    if (ent_type1 !== ent_type2) {
        return ent_type1 - ent_type2;
    }
    if (index1 !== index2) {
        return index1 - index2;
    }
    return 0;
}
function _sort(list, method) {
    switch (method) {
        case _ESortMethod.REV:
            list.reverse();
            break;
        case _ESortMethod.ALPHA:
            list.sort();
            break;
        case _ESortMethod.REV_ALPHA:
            list.sort().reverse();
            break;
        case _ESortMethod.NUM:
            list.sort((a, b) => a - b);
            break;
        case _ESortMethod.REV_NUM:
            list.sort((a, b) => a - b).reverse();
            break;
        case _ESortMethod.ID:
            list.sort(_compareID);
            break;
        case _ESortMethod.REV_ID:
            list.sort(_compareID).reverse();
            break;
        case _ESortMethod.SHIFT:
            const first = list.shift();
            list.push(first);
            break;
        case _ESortMethod.REV_SHIFT:
            const last = list.pop();
            list.unshift(last);
            break;
        case _ESortMethod.RANDOM:
            list.sort(() => .5 - Math.random());
            break;
        default:
            throw new Error('list.Sort: Sort method not recognised.');
    }
}
/**
 * Sorts an list, based on the values of the items in the list.
 * ~
 * For alphabetical sort, values are sorted character by character,
 * numbers before upper case alphabets, upper case alphabets before lower case alphabets.
 *
 * @param list List to sort.
 * @param method Enum; specifies the sort method to use.
 * @returns void
 * @example list.Sort(list, 'alpha')
 * @example_info where list = ["1","2","10","Orange","apple"]
 * Expected value of list is ["1","10","2","Orange","apple"].
 * @example list.Sort(list, 'numeric')
 * @example_info where list = [56,6,48]
 * Expected value of list is [6,48,56].
 */
function Sort(list, method) {
    // --- Error Check ---
    _check_args_1.checkCommTypes('list.Sort', 'list', list, [_check_args_1.TypeCheckObj.isList]);
    // --- Error Check ---
    _sort(list, method);
}
exports.Sort = Sort;
// ================================================================================================
/**
 * Removes and inserts items in a list.
 * ~
 * If no items_to_add are specified, then items are only removed.
 * If num_to_remove is 0, then values are only inserted.
 *
 * @param list List to splice.
 * @param index Zero-based index after which to starting removing or inserting items.
 * @param num_to_remove Number of items to remove.
 * @param items_to_insert List of items to add, or null.
 * @returns void
 * @example result = list.Splice(list1, 1, 3, [2.2, 3.3])
 * @example_info where list1 = [10, 20, 30, 40, 50]
 * Expected value of result is [10, 2.2, 3.3, 50]. New items were added where the items were removed.
 */
function Splice(list, index, num_to_remove, items_to_insert) {
    // --- Error Check ---
    const fn_name = 'list.Splice';
    _check_args_1.checkCommTypes(fn_name, 'list', list, [_check_args_1.TypeCheckObj.isList]);
    _check_args_1.checkCommTypes(fn_name, 'index', index, [_check_args_1.TypeCheckObj.isInt]);
    _check_args_1.checkCommTypes(fn_name, 'num_to_remove', num_to_remove, [_check_args_1.TypeCheckObj.isInt]);
    _check_args_1.checkCommTypes(fn_name, 'values_to_add', items_to_insert, [_check_args_1.TypeCheckObj.isList]);
    // --- Error Check ---
    // avoid the spread operator
    list.splice(index, num_to_remove);
    if (items_to_insert !== null && items_to_insert.length) {
        for (let i = 0; i < items_to_insert.length; i++) {
            list.splice(index + i, 0, items_to_insert[i]);
        }
    }
}
exports.Splice = Splice;
// ================================================================================================
// ================================================================================================
// ================================================================================================
// DEPRECATED
// ================================================================================================
// ================================================================================================
// ================================================================================================
/**
 * ================================================================================================
 * list functions that obtain and return information from an input list. Does not modify input list.
 */
var _EAppendMethod;
(function (_EAppendMethod) {
    _EAppendMethod["TO_START"] = "to_start";
    _EAppendMethod["TO_END"] = "to_end";
})(_EAppendMethod = exports._EAppendMethod || (exports._EAppendMethod = {}));
/**
 * Adds an item to a list.
 * If item is a list, the entire list will be appended as a single item.
 *
 * @param list List to append the item to.
 * @param value Item to append.
 * @param method Enum, select the method.
 * @returns void
 * @example append = list.Append(list, 4, 'at_end')
 * @example_info where list = [1,2,3]
 * Expected value of list is [1,2,3,4].
 */
function _Append(list, value, method) {
    // --- Error Check ---
    const fn_name = 'list.Append';
    _check_args_1.checkCommTypes(fn_name, 'list', list, [_check_args_1.TypeCheckObj.isList]);
    _check_args_1.checkCommTypes(fn_name, 'value', value, [_check_args_1.TypeCheckObj.isAny]);
    // --- Error Check ---
    switch (method) {
        case _EAppendMethod.TO_START:
            list.unshift(value);
            break;
        case _EAppendMethod.TO_END:
            list.push(value);
            break;
        default:
            break;
    }
}
exports._Append = _Append;
// ================================================================================================
/**
 * Removes the value at the specified index from a list.
 * ~
 * WARNING: This function has been deprecated. Please use the list.Modify() function.
 *
 * @param list List to remove value from.
 * @param index Zero-based index number of value to remove.
 * @example remove = list.RemoveIndex(list,1)
 * @example_info where list = [1,2,3]
 * Expected value of remove is [1,3].
 */
function _RemoveIndex(list, index) {
    // --- Error Check ---
    const fn_name = 'list.RemoveIndex';
    _check_args_1.checkCommTypes(fn_name, 'list', list, [_check_args_1.TypeCheckObj.isList]);
    _check_args_1.checkCommTypes(fn_name, 'index', index, [_check_args_1.TypeCheckObj.isInt]);
    // --- Error Check ---
    list.splice(index, 1);
}
exports._RemoveIndex = _RemoveIndex;
// ================================================================================================
var _ERemoveValueMethod;
(function (_ERemoveValueMethod) {
    _ERemoveValueMethod["REMOVE_ALL"] = "remove_all";
    _ERemoveValueMethod["REMOVE_FIRST"] = "remove_first";
})(_ERemoveValueMethod = exports._ERemoveValueMethod || (exports._ERemoveValueMethod = {}));
/**
 * Removes values that matches specified value from a list.
 * Items must match both the value and type of specified value.
 * ~
 * Returns original list if no values in list match specified value.
 * ~
 * WARNING: This function has been deprecated. Please use the list.Modify() function.
 *
 * @param list List to remove value from.
 * @param value Value to search for.
 * @param method Enum; specifies whether to remove all occurances or only the first.
 * @example remove = list.RemoveValue(list,2,'remove_all')
 * @example_info where list = [1,2,2,3]
 * Expected value of remove is [1,3].
 */
function _RemoveValue(list, value, method) {
    // --- Error Check ---
    const fn_name = 'list.RemoveValue';
    _check_args_1.checkCommTypes(fn_name, 'list', list, [_check_args_1.TypeCheckObj.isList]);
    _check_args_1.checkCommTypes(fn_name, 'value', value, [_check_args_1.TypeCheckObj.isAny]);
    // --- Error Check ---
    for (let i = list.length - 1; i >= 0; i--) {
        if (list[i] === value) {
            list.splice(i, 1);
            if (method === _ERemoveValueMethod.REMOVE_FIRST) {
                break;
            }
        }
    }
}
exports._RemoveValue = _RemoveValue;
// ================================================================================================
var _EReplaceValueMethod;
(function (_EReplaceValueMethod) {
    _EReplaceValueMethod["REPLACE_ALL"] = "replace_all";
    _EReplaceValueMethod["REPLACE_FIRST"] = "replace_first";
})(_EReplaceValueMethod = exports._EReplaceValueMethod || (exports._EReplaceValueMethod = {}));
/**
 * Replaces values that matches specified value from an list with a new value
 * Items must match both the value and type of specified value
 * ~
 * Returns original list if no value in list matches specified value.
 * ~
 * WARNING: This function has been deprecated. Please use the list.Modify() function.
 *
 * @param list List to remove value from.
 * @param value1 Value to search for.
 * @param value2 Value to replace existing value with.
 * @param method Enum; specifies whether to replace all occurances or only the first.
 * @example replace = list.ReplaceValue(list,2,9,'replace_all')
 * @example_info where list = [1,2,2,3]
 * Expected value of replace is [1,9,9,3].
 */
function _ReplaceValue(list, value1, value2, method) {
    // --- Error Check ---
    const fn_name = 'list.ReplaceValue';
    _check_args_1.checkCommTypes(fn_name, 'list', list, [_check_args_1.TypeCheckObj.isList]);
    _check_args_1.checkCommTypes(fn_name, 'value1', value1, [_check_args_1.TypeCheckObj.isAny]);
    _check_args_1.checkCommTypes(fn_name, 'value2', value2, [_check_args_1.TypeCheckObj.isAny]);
    // --- Error Check ---
    for (let i = 0; i < list.length; i++) {
        if (list[i] === value1) {
            list[i] = value2;
            if (method === _EReplaceValueMethod.REPLACE_FIRST) {
                break;
            }
        }
    }
}
exports._ReplaceValue = _ReplaceValue;
var _EIndexOfMethod;
(function (_EIndexOfMethod) {
    _EIndexOfMethod["SEARCH_ALL"] = "search_all";
    _EIndexOfMethod["SEARCH_FIRST"] = "search_first";
})(_EIndexOfMethod = exports._EIndexOfMethod || (exports._EIndexOfMethod = {}));
/**
 * Searches for a value in a list and returns the index position if found.
 * Items must match both the value and type of specified value.
 * ~
 * Returns -1 if no values in list match specified value.
 * ~
 * WARNING: This function has been deprecated. Please use the inline listFind() function.
 *
 * @param list List.
 * @param value Value to search for.
 * @param method Enum, specifies whether to search all occurances or only the first.
 * @returns Index position or list of index positions containing specified value.
 * @example positions = list.IndexOf(list,2,true)
 * @example_info where list = [6,2,2,7]
 * Expected value of positions is [1,2].
 */
function _IndexOf(list, value, method) {
    // --- Error Check ---
    const fn_name = 'list.IndexOf';
    _check_args_1.checkCommTypes(fn_name, 'list', list, [_check_args_1.TypeCheckObj.isList]);
    _check_args_1.checkCommTypes(fn_name, 'value', value, [_check_args_1.TypeCheckObj.isAny]);
    // --- Error Check ---
    console.log('WARNING: This function has been deprecated. Please use the inline listFind() function.');
    const positions = [];
    for (let i = 0; i < list.length; i++) {
        if (list[i] === value) {
            positions.push(i);
            if (method === _EIndexOfMethod.SEARCH_FIRST) {
                return i;
            }
        }
    }
    if (positions.length > 0) {
        return positions;
    }
    else {
        return -1;
    }
}
exports._IndexOf = _IndexOf;
// ================================================================================================
/**
 * Searches for a value in an list and returns true if found.
 * Items must match both the value and type of specified value.
 * ~
 * Returns false if no values in list match specified value.
 * ~
 * WARNING: This function has been deprecated. Please use the inline listHas() function.
 *
 * @param list List.
 * @param value Value to search for.
 * @returns Returns true if value can be found in list, false if value cannot be found.
 * @example exists = list.Includes(list,2)
 * @example_info where list = [6,2,2,7]
 * Expected value of exists is true.
 */
function _Includes(list, value) {
    // --- Error Check ---
    const fn_name = 'list.Includes';
    _check_args_1.checkCommTypes(fn_name, 'list', list, [_check_args_1.TypeCheckObj.isList]);
    _check_args_1.checkCommTypes(fn_name, 'value', value, [_check_args_1.TypeCheckObj.isAny]);
    // --- Error Check ---
    console.log('WARNING: This function has been deprecated. Please use the inline listHas() function.');
    for (let i = list.length - 1; i >= 0; i--) {
        if (list[i] === value) {
            return true;
        }
    }
    return false;
}
exports._Includes = _Includes;
// ================================================================================================
/**
 * Creates a new list by creating a new list by making a copy of an existing list.
 * ~
 * WARNING: This function has been deprecated. Please use the inline listCopy() function.
 *
 * @param entities List to copy.
 * @returns New duplicated list.
 * @example copy1 = list.Copy(list)
 * @example_info where list = [1,2,3]
 * Expected value of copy is [1,2,3].
 */
function _Copy(entities) {
    // --- Error Check ---
    _check_args_1.checkCommTypes('list.Copy', 'list', entities, [_check_args_1.TypeCheckObj.isList]);
    // --- Error Check ---
    console.log('WARNING: This function has been deprecated. Please use the inline listCopy() function.');
    return entities.slice();
}
exports._Copy = _Copy;
// ================================================================================================
/**
 * Creates a new list by combining two lists into a new list.
 * ~
 * WARNING: This function has been deprecated. Please use the inline listJoin() function.
 *
 * @param list1 First list.
 * @param list2 Second list.
 * @returns Combined list (list1 first, followed by list2).
 * @example newlist = list.Concat(list1,list2)
 * @example_info where list1 = [1,2,3]
 * and list2 = [9,0]
 * Expected value of newlist is [1,2,3,9,0].
 */
function _Concat(list1, list2) {
    // --- Error Check ---
    const fn_name = 'list.Concat';
    _check_args_1.checkCommTypes(fn_name, 'list1', list1, [_check_args_1.TypeCheckObj.isList]);
    _check_args_1.checkCommTypes(fn_name, 'list2', list2, [_check_args_1.TypeCheckObj.isList]);
    // --- Error Check ---
    console.log('WARNING: This function has been deprecated. Please use the inline listJoin() function.');
    return list1.concat(list2);
}
exports._Concat = _Concat;
// ================================================================================================
/**
 * Creates a new list by flattening an n-dimensional list into a one-dimensional list.
 * ~
 * WARNING: This function has been deprecated. Please use the inline listFlat() function.
 *
 * @param list List to flatten.
 * @returns Flattened list.
 * @example flatten = list.Flatten(list)
 * @example_info where list = [1,2,3,[4,5]]
 * Expected value of flatten is [1,2,3,4,5].
 */
function _Flatten(list) {
    // --- Error Check ---
    _check_args_1.checkCommTypes('list.Flatten', 'list', list, [_check_args_1.TypeCheckObj.isList]);
    // --- Error Check ---
    console.log('WARNING: This function has been deprecated. Please use the inline listFlat() function.');
    return _flattenDeep(list);
}
exports._Flatten = _Flatten;
function _flattenDeep(list) {
    return list.reduce((acc, val) => Array.isArray(val) ? acc.concat(_flattenDeep(val)) : acc.concat(val), []);
}
// ================================================================================================
/**
 * Creates a new list by copying a portion of an existing list, from start index to end index (end not included).
 * ~
 * WARNING: This function has been deprecated. Please use the inline listSlice() function.
 *
 * @param list List to slice.
 * @param start Zero-based index at which to begin slicing.
 *      A negative index can be used, indicating an offset from the end of the sequence.
 *      If start is undefined, slice begins from index 0.
 * @param end Zero-based index before which to end slicing. Slice extracts up to but not including end.
 *      A negative index can be used, indicating an offset from the end of the sequence.
 *      If end is undefined, slice extracts through the end of the sequence.
 * @returns A new list.
 * @example result = list.Slice(list,1,3)
 * @example_info where list = [1,2,3,4,5]
 * Expected value of result is [2,3].
 */
function _Slice(list, start, end) {
    // --- Error Check ---
    const fn_name = 'list.Slice';
    _check_args_1.checkCommTypes(fn_name, 'list', list, [_check_args_1.TypeCheckObj.isList]);
    _check_args_1.checkCommTypes(fn_name, 'start', start, [_check_args_1.TypeCheckObj.isInt]);
    _check_args_1.checkCommTypes(fn_name, 'end', end, [_check_args_1.TypeCheckObj.isInt]);
    // --- Error Check ---
    console.log('WARNING: This function has been deprecated. Please use the inline listSlice() function.');
    return list.slice(start, end);
}
exports._Slice = _Slice;
// ================================================================================================
/**
 * Reverses the order of values in a list and returns a new list.
 * ~
 * WARNING: This function has been deprecated. Please use the list.Sort() function.
 *
 * @param entities List to reverse.
 * @returns New reversed list.
 * @example result = list.Reverse(list1)
 * @example_info where list1 = [1,2,3]
 * Expected value of result is [3,2,1].
 */
function _Reverse(entities) {
    // --- Error Check ---
    _check_args_1.checkCommTypes('list.Reverse', 'entities', entities, [_check_args_1.TypeCheckObj.isList]);
    // --- Error Check ---
    console.log('WARNING: This function has been deprecated. Please use the list.Sort() function.');
    entities.reverse();
}
exports._Reverse = _Reverse;
// ================================================================================================
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL21vZHVsZXMvbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVIOztHQUVHO0FBRUgsK0NBQTZEO0FBQzdELCtDQUFrRDtBQUlsRCxtR0FBbUc7QUFDbkcsSUFBWSxXQVdYO0FBWEQsV0FBWSxXQUFXO0lBQ25CLG9DQUFxQixDQUFBO0lBQ3JCLGdDQUFpQixDQUFBO0lBQ2pCLDRDQUE2QixDQUFBO0lBQzdCLHdDQUF5QixDQUFBO0lBQ3pCLGdEQUFpQyxDQUFBO0lBQ2pDLG1EQUFvQyxDQUFBO0lBQ3BDLGdEQUFpQyxDQUFBO0lBQ2pDLG1EQUFvQyxDQUFBO0lBQ3BDLDBDQUEyQixDQUFBO0lBQzNCLDZDQUE4QixDQUFBO0FBQ2xDLENBQUMsRUFYVyxXQUFXLEdBQVgsbUJBQVcsS0FBWCxtQkFBVyxRQVd0QjtBQUNEOzs7Ozs7Ozs7Ozs7Ozs7R0FlRztBQUNILFNBQWdCLEdBQUcsQ0FBQyxJQUFXLEVBQUUsSUFBZSxFQUFFLE1BQW1CO0lBQ2pFLHNCQUFzQjtJQUN0QixNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUM7SUFDM0IsNEJBQWMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLDBCQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM3RCw0QkFBYyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsMEJBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzdELHNCQUFzQjtJQUN0QixJQUFJLFNBQWlCLENBQUM7SUFDdEIsUUFBUSxNQUFNLEVBQUU7UUFDWixLQUFLLFdBQVcsQ0FBQyxRQUFRO1lBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkIsTUFBTTtRQUNWLEtBQUssV0FBVyxDQUFDLE1BQU07WUFDbkIsSUFBSSxDQUFDLElB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