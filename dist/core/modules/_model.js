"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GIModel_1 = require("../../libs/geo-info/GIModel");
const common_1 = require("../../libs/geo-info/common");
const id_1 = require("../../libs/geo-info/id");
const _check_args_1 = require("./_check_args");
const underscore_1 = __importDefault(require("underscore"));
//  ===============================================================================================
//  Functions used by Mobius
//  ===============================================================================================
/**
 * Creates a new empty model.
 *
 * @returns New model empty.
 */
function __new__() {
    const model = new GIModel_1.GIModel();
    model.attribs.add.addAttrib(common_1.EEntType.POSI, common_1.EAttribNames.COORDS, common_1.EAttribDataTypeStrs.FLOAT, 3);
    return model;
}
exports.__new__ = __new__;
//  ===============================================================================================
/**
 * A function to preprocess the model, before it enters the node.
 * In cases where there is more than one model connected to a node,
 * the preprocess function will be called before the merge function.
 *
 * @param model The model to preprocess.
 */
function __preprocess__(__model__) {
    // TODO
}
exports.__preprocess__ = __preprocess__;
//  ===============================================================================================
/**
 * A function to postprocess the model, after it enters the node.
 *
 * @param model The model to postprocess.
 */
function __postprocess__(__model__) {
    // TODO
    // Remove all undefined values for the arrays
}
exports.__postprocess__ = __postprocess__;
//  ===============================================================================================
/**
 * Merges the second model into the first model. The geometry, attribues, and groups are all merged.
 * If the models contain contain groups with the same names, then the groups will be merged.
 *
 * @param model1 The model to merge into.
 * @param model2 The model to merge from    .
 */
function __merge__(model1, model2) {
    model1.merge(model2);
}
exports.__merge__ = __merge__;
//  ===============================================================================================
/**
 * Returns a string representation of this model.
 * @param __model__
 */
function __stringify__(__model__) {
    return JSON.stringify(__model__.getData());
}
exports.__stringify__ = __stringify__;
//  ===============================================================================================
function _setModelAttrib(__model__, attrib_name, attrib_value, attrib_index) {
    if (attrib_index !== null && attrib_index !== undefined) {
        __model__.attribs.add.setModelAttribIndexedValue(attrib_name, attrib_index, attrib_value);
    }
    else {
        __model__.attribs.add.setModelAttribValue(attrib_name, attrib_value);
    }
}
function _getEntsIndices(__model__, ents_arr) {
    const ent_type = ents_arr[0][0];
    const ents_i = [];
    for (let i = 0; i < ents_arr.length; i++) {
        if (ents_arr[i][0] !== ent_type) {
            throw new Error('If an attribute is being set for multiple entities, then they must all be of the same type.');
        }
        ents_i.push(ents_arr[i][1]);
    }
    return ents_i;
}
function _setEachEntDifferentAttribValue(__model__, ents_arr, attrib_name, attrib_values, attrib_index) {
    if (ents_arr.length !== attrib_values.length) {
        throw new Error('If multiple attributes are being set to multiple values, then the number of entities must match the number of values.');
    }
    const ent_type = ents_arr[0][0];
    const ents_i = _getEntsIndices(__model__, ents_arr);
    for (let i = 0; i < ents_arr.length; i++) {
        // --- Error Check ---
        const fn_name = 'entities@' + attrib_name;
        _check_args_1.checkAttribValue(fn_name, attrib_values[i], attrib_index);
        // --- Error Check ---
        if (attrib_index !== null && attrib_index !== undefined) {
            __model__.attribs.add.setAttribIndexedValue(ent_type, ents_i[i], attrib_name, attrib_index, attrib_values[i]);
        }
        else {
            __model__.attribs.add.setAttribValue(ent_type, ents_i[i], attrib_name, attrib_values[i]);
        }
    }
}
function _setEachEntSameAttribValue(__model__, ents_arr, attrib_name, attrib_value, attrib_index) {
    // --- Error Check ---
    const fn_name = 'entities@' + attrib_name;
    _check_args_1.checkAttribValue(fn_name, attrib_value, attrib_index);
    // --- Error Check ---
    const ent_type = ents_arr[0][0];
    const ents_i = _getEntsIndices(__model__, ents_arr);
    if (attrib_index !== null && attrib_index !== undefined) {
        __model__.attribs.add.setAttribIndexedValue(ent_type, ents_i, attrib_name, attrib_index, attrib_value);
    }
    else {
        __model__.attribs.add.setAttribValue(ent_type, ents_i, attrib_name, attrib_value);
    }
}
function _setAttrib(__model__, ents_arr, attrib_name, attrib_values, attrib_index) {
    // check the ents_arr
    if (ents_arr === null) {
        _setModelAttrib(__model__, attrib_name, attrib_values, attrib_index);
        return;
    }
    else if (ents_arr.length === 0) {
        return;
    }
    else if (id_1.getArrDepth(ents_arr) === 1) {
        ents_arr = [ents_arr];
    }
    ents_arr = ents_arr;
    // check attrib_values
    // are we setting a list of ents to a list of values?
    const attrib_values_depth = id_1.getArrDepth(attrib_values);
    if (attrib_values_depth === 2) {
        // attrib values is a list of lists
        // we assume that we are trying to set a different value for each ent
        // so we expect the list lengths to be equal
        _setEachEntDifferentAttribValue(__model__, ents_arr, attrib_name, attrib_values, attrib_index);
        return;
    }
    else if (attrib_values_depth === 1) {
        // check if ents_arr.length equals attrib_values.length
        // then check if the first ent already has an attrib with the specified name
        // if both are true, then we assume we are trying to set each ent to each value
        const attrib_values_arr = attrib_values;
        if (ents_arr.length === attrib_values_arr.length) {
            const first_ent_type = ents_arr[0][0];
            if (__model__.attribs.query.hasAttrib(first_ent_type, attrib_name)) {
                _setEachEntDifferentAttribValue(__model__, ents_arr, attrib_name, attrib_values, attrib_index);
                return;
            }
        }
    }
    // all ents get the same attribute value
    _setEachEntSameAttribValue(__model__, ents_arr, attrib_name, attrib_values, attrib_index);
    return;
}
/**
 * Sets an attribute value in the model.
 * @param __model__
 */
function __setAttrib__(__model__, entities, attrib_name, attrib_values, attrib_index) {
    // @ts-ignore
    if (entities !== null && id_1.getArrDepth(entities) === 2) {
        entities = underscore_1.default.flatten(entities);
    }
    // --- Error Check ---
    const fn_name = 'entities@' + attrib_name;
    let ents_arr = null;
    if (entities !== null && entities !== undefined) {
        ents_arr = _check_args_1.checkIDs(fn_name, 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], null);
    }
    _check_args_1.checkAttribName(fn_name, attrib_name);
    // --- Error Check ---
    _setAttrib(__model__, ents_arr, attrib_name, attrib_values, attrib_index);
}
exports.__setAttrib__ = __setAttrib__;
//  ===============================================================================================
function _getAttrib(__model__, ents_arr, attrib_name, attrib_index) {
    const has_index = attrib_index !== null && attrib_index !== undefined;
    if (ents_arr === null) {
        if (has_index) {
            return __model__.attribs.query.getModelAttribIndexedValue(attrib_name, attrib_index);
        }
        else {
            return __model__.attribs.query.getModelAttribValue(attrib_name);
        }
    }
    else if (ents_arr.length === 0) {
        return;
    }
    else if (id_1.getArrDepth(ents_arr) === 1) {
        const [ent_type, ent_i] = ents_arr;
        if (attrib_name === 'id') {
            if (has_index) {
                throw new Error('The "id" attribute does have an index.');
            }
            return common_1.EEntTypeStr[ent_type] + ent_i;
        }
        else if (has_index) {
            return __model__.attribs.query.getAttribIndexedValue(ent_type, attrib_name, ent_i, attrib_index);
        }
        else {
            return __model__.attribs.query.getAttribValue(ent_type, attrib_name, ent_i);
        }
    }
    else {
        return ents_arr.map(ent_arr => _getAttrib(__model__, ent_arr, attrib_name, attrib_index));
    }
}
/**
 * Gets an attribute value from the model.
 * @param __model__
 */
function __getAttrib__(__model__, entities, attrib_name, attrib_index) {
    // @ts-ignore
    if (entities !== null && id_1.getArrDepth(entities) === 2) {
        entities = underscore_1.default.flatten(entities);
    }
    // --- Error Check ---
    const fn_name = 'Inline.__getAttrib__';
    let ents_arr = null;
    if (entities !== null && entities !== undefined) {
        ents_arr = _check_args_1.checkIDs(fn_name, 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], null);
    }
    _check_args_1.checkCommTypes(fn_name, 'attrib_name', attrib_name, [_check_args_1.TypeCheckObj.isString]);
    if (attrib_index !== null && attrib_index !== undefined) {
        _check_args_1.checkCommTypes(fn_name, 'attrib_index', attrib_index, [_check_args_1.TypeCheckObj.isNumber]);
    }
    // --- Error Check ---
    return _getAttrib(__model__, ents_arr, attrib_name, attrib_index);
}
exports.__getAttrib__ = __getAttrib__;
//  ===============================================================================================
function _flatten(arrs) {
    const arr_flat = [];
    const arr_indices = [];
    let count = 0;
    for (const item of arrs) {
        if (Array.isArray(item)) {
            const [arr_flat2, arr_indices2] = _flatten(item);
            for (let i = 0; i < arr_flat2.length; i++) {
                arr_flat.push(arr_flat2[i]);
                arr_indices2[i].unshift(count);
                arr_indices.push(arr_indices2[i]);
            }
        }
        else {
            arr_flat.push(item);
            arr_indices.push([count]);
        }
        count += 1;
    }
    return [arr_flat, arr_indices];
}
/**
 * Select entities in the model.
 * @param __model__
 */
function __select__(__model__, ents_id, var_name) {
    __model__.geom.selected = [];
    ents_id = ((Array.isArray(ents_id)) ? ents_id : [ents_id]);
    const [ents_id_flat, ents_indices] = _flatten(ents_id);
    const ents_arr = id_1.idsBreak(ents_id_flat);
    for (let i = 0; i < ents_arr.length; i++) {
        const ent_arr = ents_arr[i];
        const ent_indices = ents_indices[i];
        const attrib_name = '_' + var_name;
        const attrib_value = var_name + '[' + ent_indices.join('][') + ']';
        __model__.geom.selected.push(ent_arr);
        if (!__model__.attribs.query.hasAttrib(ent_arr[0], attrib_name)) {
            __model__.attribs.add.addAttrib(ent_arr[0], attrib_name, common_1.EAttribDataTypeStrs.STRING, 1);
        }
        __model__.attribs.add.setAttribValue(ent_arr[0], ent_arr[1], attrib_name, attrib_value);
    }
}
exports.__select__ = __select__;
//  ===============================================================================================
/**
 * Checks the model for internal consistency.
 * @param __model__
 */
function __checkModel__(__model__) {
    return __model__.check();
}
exports.__checkModel__ = __checkModel__;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX21vZGVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvbW9kdWxlcy9fbW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSx5REFBc0Q7QUFDdEQsdURBQTBJO0FBQzFJLCtDQUErRDtBQUMvRCwrQ0FBc0g7QUFDdEgsNERBQTJCO0FBRTNCLG1HQUFtRztBQUNuRyw0QkFBNEI7QUFDNUIsbUdBQW1HO0FBQ25HOzs7O0dBSUc7QUFDSCxTQUFnQixPQUFPO0lBQ25CLE1BQU0sS0FBSyxHQUFZLElBQUksaUJBQU8sRUFBRSxDQUFDO0lBQ3JDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxxQkFBWSxDQUFDLE1BQU0sRUFBRSw0QkFBbUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUYsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUpELDBCQUlDO0FBQ0QsbUdBQW1HO0FBQ25HOzs7Ozs7R0FNRztBQUNILFNBQWdCLGNBQWMsQ0FBQyxTQUFrQjtJQUM3QyxPQUFPO0FBQ1gsQ0FBQztBQUZELHdDQUVDO0FBQ0QsbUdBQW1HO0FBQ25HOzs7O0dBSUc7QUFDSCxTQUFnQixlQUFlLENBQUMsU0FBa0I7SUFDOUMsT0FBTztJQUNQLDZDQUE2QztBQUNqRCxDQUFDO0FBSEQsMENBR0M7QUFDRCxtR0FBbUc7QUFDbkc7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsU0FBUyxDQUFDLE1BQWUsRUFBRSxNQUFlO0lBQ3RELE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDekIsQ0FBQztBQUZELDhCQUVDO0FBQ0QsbUdBQW1HO0FBQ25HOzs7R0FHRztBQUNILFNBQWdCLGFBQWEsQ0FBQyxTQUFrQjtJQUM1QyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDL0Ms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