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
    model.attribs.add.addAttrib(common_1.EEntType.POSI, common_1.EAttribNames.COORDS, common_1.EAttribDataTypeStrs.LIST);
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
            __model__.attribs.add.addAttrib(ent_arr[0], attrib_name, common_1.EAttribDataTypeStrs.LIST);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX21vZGVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvbW9kdWxlcy9fbW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSx5REFBc0Q7QUFDdEQsdURBQTBJO0FBQzFJLCtDQUErRDtBQUMvRCwrQ0FBc0g7QUFDdEgsNERBQTRCO0FBRTVCLG1HQUFtRztBQUNuRyw0QkFBNEI7QUFDNUIsbUdBQW1HO0FBQ25HOzs7O0dBSUc7QUFDSCxTQUFnQixPQUFPO0lBQ25CLE1BQU0sS0FBSyxHQUFZLElBQUksaUJBQU8sRUFBRSxDQUFDO0lBQ3JDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxxQkFBWSxDQUFDLE1BQU0sRUFBRSw0QkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxRixPQUFPLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBSkQsMEJBSUM7QUFDRCxtR0FBbUc7QUFDbkc7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsY0FBYyxDQUFDLFNBQWtCO0lBQzdDLE9BQU87QUFDWCxDQUFDO0FBRkQsd0NBRUM7QUFDRCxtR0FBbUc7QUFDbkc7Ozs7R0FJRztBQUNILFNBQWdCLGVBQWUsQ0FBQyxTQUFrQjtJQUM5QyxPQUFPO0lBQ1AsNkNBQTZDO0FBQ2pELENBQUM7QUFIRCwwQ0FHQztBQUNELG1HQUFtRztBQUNuRzs7Ozs7O0dBTUc7QUFDSCxTQUFnQixTQUFTLENBQUMsTUFBZSxFQUFFLE1BQWU7SUFDdEQsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN6QixDQUFDO0FBRkQsOEJBRUM7QUFDRCxtR0FBbUc7QUFDbkc7OztHQUdHO0FBQ0gsU0FBZ0IsYUFBYSxDQUFDLFNBQWtCO0lBQzVDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBRkQs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