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
    _ERemoveMethod["REMOVE_INDEX"] = "index";
    _ERemoveMethod["REMOVE_FIRST_VALUE"] = "first_value";
    _ERemoveMethod["REMOVE_LAST_VALUE"] = "last_value";
    _ERemoveMethod["REMOVE_ALL_VALUES"] = "all_values";
})(_ERemoveMethod = exports._ERemoveMethod || (exports._ERemoveMethod = {}));
/**
 * Removes items in a list.
 * ~
 * If @param method is set to 'index', then @param item should be the index of the item to be replaced. Negative indexes are allowed.
 * If @param method is not set to 'index', then @param item should be the value.
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
 * ~
 * If @param method is set to 'index', then @param old_item should be the index of the item to be replaced. Negative indexes are allowed.
 * If @param method is not set to 'index', then @param old_item should be the value.
 *
 * @param list The list in which to replace items
 * @param old_item The old item to replace.
 * @param new_item The new item.
 * @param method Enum, select the method for replacing items in the list.
 * @returns void
 */
function Replace(list, old_item, new_item, method) {
    // --- Error Check ---
    const fn_name = 'list.Replace';
    _check_args_1.checkCommTypes(fn_name, 'list', list, [_check_args_1.TypeCheckObj.isList]);
    _check_args_1.checkCommTypes(fn_name, 'item', old_item, [_check_args_1.TypeCheckObj.isAny]);
    _check_args_1.checkCommTypes(fn_name, 'new_value', new_item, [_check_args_1.TypeCheckObj.isAny]);
    // --- Error Check ---
    let index;
    switch (method) {
        case _EReplaceMethod.REPLACE_INDEX:
            index = old_item;
            if (!isNaN(index)) {
                if (index < 0) {
                    index = list.length + index;
                }
                list[index] = new_item;
            }
            break;
        case _EReplaceMethod.REPLACE_FIRST_VALUE:
            index = list.indexOf(old_item);
            if (index !== -1) {
                list[index] = new_item;
            }
            break;
        case _EReplaceMethod.REPLACE_LAST_VALUE:
            index = list.lastIndexOf(old_item);
            if (index !== -1) {
                list[index] = new_item;
            }
            break;
        case _EReplaceMethod.REPLACE_ALL_VALUES:
            for (index = 0; index < list.length; index++) {
                if (list[index] === old_item) {
                    list[index] = new_item;
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