"use strict";
/**
 * The `query` module has functions for querying entities in the the model.
 * Most of these functions all return a list of IDs of entities in the model.
 * ~
 * ~
 */
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../libs/geo-info/common");
const id_1 = require("../../libs/geo-info/id");
const _check_args_1 = require("./_check_args");
// ================================================================================================
// export enum _EEntTypeEnum {
//     POSI =   'positions',
//     VERT =   'vertices',
//     EDGE =   'edges',
//     WIRE =   'wires',
//     FACE =   'faces',
//     POINT =  'points',
//     PLINE =  'polylines',
//     PGON =   'polygons',
//     COLL =   'collections'
//     // ,
//     // OBJS =   'objects',
//     // TOPOS =  'topologies',
//     // ALL =    'all'
// }
var _EEntTypeEnum;
(function (_EEntTypeEnum) {
    _EEntTypeEnum["POSI"] = "ps";
    _EEntTypeEnum["VERT"] = "_v";
    _EEntTypeEnum["EDGE"] = "_e";
    _EEntTypeEnum["WIRE"] = "_w";
    _EEntTypeEnum["FACE"] = "_f";
    _EEntTypeEnum["POINT"] = "pt";
    _EEntTypeEnum["PLINE"] = "pl";
    _EEntTypeEnum["PGON"] = "pg";
    _EEntTypeEnum["COLL"] = "co";
    // ,
    // OBJS =   'objects',
    // TOPOS =  'topologies',
    // ALL =    'all'
})(_EEntTypeEnum = exports._EEntTypeEnum || (exports._EEntTypeEnum = {}));
function _entType(select) {
    switch (select) {
        case _EEntTypeEnum.POSI:
            return common_1.EEntType.POSI;
        case _EEntTypeEnum.VERT:
            return common_1.EEntType.VERT;
        case _EEntTypeEnum.EDGE:
            return common_1.EEntType.EDGE;
        case _EEntTypeEnum.WIRE:
            return common_1.EEntType.WIRE;
        case _EEntTypeEnum.FACE:
            return common_1.EEntType.FACE;
        case _EEntTypeEnum.POINT:
            return common_1.EEntType.POINT;
        case _EEntTypeEnum.PLINE:
            return common_1.EEntType.PLINE;
        case _EEntTypeEnum.PGON:
            return common_1.EEntType.PGON;
        case _EEntTypeEnum.COLL:
            return common_1.EEntType.COLL;
        // case _EEntTypeEnum.OBJS:
        //     return [
        //         EEntType.POINT,
        //         EEntType.PLINE,
        //         EEntType.PGON
        //     ];
        // case _EEntTypeEnum.TOPOS:
        //     return [
        //         EEntType.VERT,
        //         EEntType.EDGE,
        //         EEntType.WIRE,
        //         EEntType.FACE
        //     ];
        // case _EEntTypeEnum.ALL:
        //     return [
        //         EEntType.POSI,
        //         EEntType.VERT,
        //         EEntType.EDGE,
        //         EEntType.WIRE,
        //         EEntType.FACE,
        //         EEntType.POINT,
        //         EEntType.PLINE,
        //         EEntType.PGON,
        //         EEntType.COLL
        //     ];
        default:
            throw new Error('Query select parameter not recognised.');
    }
}
// ================================================================================================
// ================================================================================================
/**
 * Get entities from a list of entities.
 * For example, you can get the position entities from a list of polygon entities.
 * ~
 * The result will always be a list of entities, even if there is only one entity.
 * In a case where you want only one entity, remember to get the first item in the list.
 * ~
 * The resulting list of entities will not contain duplicate entities.
 * ~
 * @param __model__
 * @param ent_type_enum Enum, the type of entity to get.
 * @param entities List of entities to get entities from, or 'null' to get all entities in the model.
 * @returns Entities, a list of entities.
 * @example positions = query.Get('positions', [polyline1, polyline2])
 * @example_info Returns a list of positions that are part of polyline1.
 */
function Get(__model__, ent_type_enum, entities) {
    // console.log("calling get", ent_type_enum, entities);
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    let ents_arr = null;
    if (entities !== null && entities !== undefined) {
        ents_arr = _check_args_1.checkIDs('query.Get', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList, _check_args_1.IDcheckObj.isIDList_list], null);
    }
    // --- Error Check ---
    // get the entity type // TODO deal with nultiple ent types
    const ent_type = _entType(ent_type_enum);
    // if ents_arr is null, then get all entities in the model of type ent_type
    if (ents_arr === null) {
        ents_arr = ents_arr;
        const ents_i = __model__.geom.query.getEnts(ent_type, false);
        ents_arr = ents_i.map(ent_i => [ent_type, ent_i]);
    }
    if (id_1.isEmptyArr(ents_arr)) {
        return [];
    }
    // make sure that the ents_arr is at least depth 2
    const depth = id_1.getArrDepth(ents_arr);
    if (depth === 1) {
        ents_arr = [ents_arr];
    }
    ents_arr = ents_arr;
    // get the entities
    const found_ents_arr = _get(__model__, ent_type, ents_arr);
    // return the result
    return id_1.idsMake(found_ents_arr);
}
exports.Get = Get;
function _get(__model__, ent_type, ents_arr) {
    if (ents_arr.length === 0) {
        return [];
    }
    // do the query
    const depth = id_1.getArrDepth(ents_arr);
    if (depth === 2) {
        ents_arr = ents_arr;
        // get the list of entities that are found
        const found_ents_i_set = new Set();
        for (const ent_arr of ents_arr) {
            const ents_i = __model__.geom.query.navAnyToAny(ent_arr[0], ent_type, ent_arr[1]);
            for (const ent_i of ents_i) {
                found_ents_i_set.add(ent_i);
            }
        }
        // return the found ents
        const found_ents_i = Array.from(found_ents_i_set);
        return found_ents_i.map(entity_i => [ent_type, entity_i]);
    }
    else { // depth === 3
        ents_arr = ents_arr;
        return ents_arr.map(ents_arr_item => _get(__model__, ent_type, ents_arr_item));
    }
}
// ================================================================================================
/**
 * Filter entities based on a query.
 * ~
 * The result will always be a list of entities, even if there is only one entity.
 * In a case where you want only one entity, remember to get the first item in the list.
 * ~
 * The filter expression can use the following format: ab#@name == value, where
 * 'ab' is the two letter identifier of the entity type ('ps', '_v', '_e', '_w', '_f', 'pt', 'pl', 'pg', 'co')
 * 'name' is the attribute name, and
 * 'value' is the attribute value that you are searching for.
 * ~
 * If the attribute value is a string, then in must be in quotes, e.g.: pg#@name == 'str_value'.
 * ~
 * If the attribute value is a number, then any comparison operator can be used: ==, !=, >, >=, <, =<.
 * ~
 * If the attribute value is a list, then a list index can be used, e.g.: ps#@xyz[2] > 10.
 * ~
 * @param __model__
 * @param entities List of entities to filter.
 * @param name The attribute name to use for filtering.
 * @param index Attribute index to use for filtering, or null.
 * @param operator_enum Enum, the operator to use for filtering
 * @param value The attribute value to use for filtering.
 * @returns Entities, a list of entities that match the conditions specified in 'expr'.
 * @example positions = query.Get(polyline1, ps#@xyz[2]>10)
 * @example_info Returns a list of positions that are part of polyline1 where the z-coordinate is more than 10.
 * @example positions = query.Get(null, ps#@xyz[2]>10)
 * @example_info Returns a list of positions in the model where the z-coordinate is more than 10.
 * @example positions = query.Get(polyline1, ps#)
 * @example_info Returns a list of all of the positions that are part of polyline1.
 * @example polylines = query.Get(position1, pl#)
 * @example_info Returns a list of all of the polylines that use position1.
 * @example collections = query.Get(null, co#@type=="floors")
 * @example_info Returns a list of all the collections that have an attribute called "type" with a value "floors".
 */
function Filter(__model__, entities, name, index, operator_enum, value) {
    if (entities === null) {
        return [];
    }
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    let ents_arr = null;
    if (entities !== null && entities !== undefined) {
        ents_arr = _check_args_1.checkIDs('query.Get', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList, _check_args_1.IDcheckObj.isIDList_list], null);
    }
    // --- Error Check ---
    // make sure that the ents_arr is at least depth 2
    const depth = id_1.getArrDepth(ents_arr);
    if (depth === 1) {
        ents_arr = [ents_arr];
    }
    ents_arr = ents_arr;
    // get the oeprator
    const op_type = _filterOperator(operator_enum);
    // do the query
    const found_ents_arr = _filter(__model__, ents_arr, name, index, op_type, value);
    // return the result
    return id_1.idsMake(found_ents_arr);
}
exports.Filter = Filter;
var _EFilterOperator;
(function (_EFilterOperator) {
    _EFilterOperator["IS_EQUAL"] = "==";
    _EFilterOperator["IS_NOT_EQUAL"] = "!=";
    _EFilterOperator["IS_GREATER_OR_EQUAL"] = ">=";
    _EFilterOperator["IS_LESS_OR_EQUAL"] = "<=";
    _EFilterOperator["IS_GREATER"] = ">";
    _EFilterOperator["IS_LESS"] = "<";
    _EFilterOperator["EQUAL"] = "=";
})(_EFilterOperator = exports._EFilterOperator || (exports._EFilterOperator = {}));
function _filterOperator(select) {
    switch (select) {
        case _EFilterOperator.IS_EQUAL:
            return common_1.EFilterOperatorTypes.IS_EQUAL;
        case _EFilterOperator.IS_NOT_EQUAL:
            return common_1.EFilterOperatorTypes.IS_NOT_EQUAL;
        case _EFilterOperator.IS_GREATER_OR_EQUAL:
            return common_1.EFilterOperatorTypes.IS_GREATER_OR_EQUAL;
        case _EFilterOperator.IS_LESS_OR_EQUAL:
            return common_1.EFilterOperatorTypes.IS_LESS_OR_EQUAL;
        case _EFilterOperator.IS_GREATER:
            return common_1.EFilterOperatorTypes.IS_GREATER;
        case _EFilterOperator.IS_LESS:
            return common_1.EFilterOperatorTypes.IS_LESS;
        default:
            throw new Error('Query operator type not recognised.');
    }
}
function _filter(__model__, ents_arr, name, index, op_type, value) {
    if (ents_arr.length === 0) {
        return [];
    }
    // do the query
    const depth = id_1.getArrDepth(ents_arr);
    if (depth === 2) {
        ents_arr = ents_arr;
        const ent_type = ents_arr[0][0];
        // get the list of entities
        const found_ents_i = [];
        for (const ent_arr of ents_arr) {
            found_ents_i.push(...__model__.geom.query.navAnyToAny(ent_arr[0], ent_type, ent_arr[1]));
        }
        // do the query on the list of entities
        const query_result = __model__.attribs.query.filterByAttribs(ent_type, found_ents_i, name, index, op_type, value);
        if (query_result.length === 0) {
            return [];
        }
        return query_result.map(entity_i => [ent_type, entity_i]);
    }
    else { // depth === 3
        ents_arr = ents_arr;
        return ents_arr.map(ents_arr_item => _filter(__model__, ents_arr_item, name, index, op_type, value));
    }
}
// ================================================================================================
/**
 * Sorts entities based on a sort expression.
 * ~
 * The sort expression should use the following format: #@name, where 'name' is the attribute name.
 * Entities can be sorted using multiple sort expresssions as follows: #@name1 && #@name2.
 * ~
 * If the attribute is a list, and index can also be specified as follows: #@name1[index].
 * ~
 * @param __model__
 * @param entities List of two or more entities to be sorted, all of the same entity type.
 * @param name Attribute name to use for sorting.
 * @param index Attribute index to use for sorting, or null.
 * @param method_enum Enum, sort descending or ascending.
 * @returns Entities, a list of sorted entities.
 * @example sorted_list = query.Sort( [pos1, pos2, pos3], #@xyz[2], descending)
 * @example_info Returns a list of three positions, sorted according to the descending z value.
 */
function Sort(__model__, entities, name, index, method_enum) {
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('query.Sort', 'entities', entities, [_check_args_1.IDcheckObj.isIDList], null);
    // TODO check the sort expression
    // --- Error Check ---
    const sort_method = (method_enum === _ESortMethod.DESCENDING) ? common_1.ESort.DESCENDING : common_1.ESort.ASCENDING;
    const sorted_ents_arr = _sort(__model__, ents_arr, name, index, sort_method);
    return id_1.idsMake(sorted_ents_arr);
}
exports.Sort = Sort;
var _ESortMethod;
(function (_ESortMethod) {
    _ESortMethod["DESCENDING"] = "descending";
    _ESortMethod["ASCENDING"] = "ascending";
})(_ESortMethod = exports._ESortMethod || (exports._ESortMethod = {}));
function _sort(__model__, ents_arr, attrib_name, attrib_index, method) {
    // get the list of ents_i
    const ent_type = ents_arr[0][0];
    const ents_i = ents_arr.filter(ent_arr => ent_arr[0] === ent_type).map(ent_arr => ent_arr[1]);
    // do the sort on the list of entities
    const sort_result = __model__.attribs.query.sortByAttribs(ent_type, ents_i, attrib_name, attrib_index, method);
    return sort_result.map(entity_i => [ent_type, entity_i]);
}
// ================================================================================================
/**
 * Returns a list of entities excluding the specified entities.
 * @param __model__
 * @param ent_type_enum Enum, specifies what type of entities will be returned.
 * @param entities List of entities to be excluded.
 * @returns Entities, a list of entities that match the type specified in 'select'.
 * @example objects = query.Get(objects, polyline1, null)
 * @example_info Returns a list of all the objects in the model except polyline1.
 */
function Invert(__model__, ent_type_enum, entities) {
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    let ents_arr = null;
    if (entities !== null && entities !== undefined) {
        ents_arr = _check_args_1.checkIDs('query.Invert', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], null);
    }
    // --- Error Check ---
    const select_ent_types = _entType(ent_type_enum);
    const found_ents_arr = _invert(__model__, select_ent_types, ents_arr);
    return id_1.idsMake(found_ents_arr);
}
exports.Invert = Invert;
function _invert(__model__, select_ent_types, ents_arr) {
    if (!Array.isArray(select_ent_types)) {
        const select_ent_type = select_ent_types;
        // get the ents to exclude
        if (!Array.isArray(ents_arr[0])) {
            ents_arr = [ents_arr];
        }
        const excl_ents_i = ents_arr
            .filter(ent_arr => ent_arr[0] === select_ent_type).map(ent_arr => ent_arr[1]);
        // get the list of entities
        const found_entities_i = [];
        const ents_i = __model__.geom.query.getEnts(select_ent_type, false);
        for (const ent_i of ents_i) {
            if (excl_ents_i.indexOf(ent_i) === -1) {
                found_entities_i.push(ent_i);
            }
        }
        return found_entities_i.map(entity_i => [select_ent_type, entity_i]);
    }
    else {
        const query_results_arr = [];
        for (const select_ent_type of select_ent_types) {
            const ent_type_query_results = _invert(__model__, select_ent_type, ents_arr);
            for (const query_result of ent_type_query_results) {
                query_results_arr.push(query_result);
            }
        }
        return query_results_arr;
    }
}
// ================================================================================================
/**
* Returns a list of perimeter entities. In order to qualify as a perimeter entity,
* entities must be part of the set of input entities and must have naked edges.
* ~
* @param __model__
* @param ent_type Enum, select the types of entities to return
* @param entities List of entities.
* @returns Entities, a list of perimeter entities.
* @example mod.Perimeter('edges', [polygon1,polygon2,polygon])
* @example_info Returns list of edges that are at the perimeter of polygon1, polygon2, or polygon3.
*/
function Perimeter(__model__, ent_type, entities) {
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    let ents_arr = null;
    if (entities !== null && entities !== undefined) {
        ents_arr = _check_args_1.checkIDs('query.Perimeter', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], null);
    }
    // --- Error Check ---
    const select_ent_types = _entType(ent_type);
    const found_ents_arr = _perimeter(__model__, select_ent_types, ents_arr);
    return id_1.idsMake(found_ents_arr);
}
exports.Perimeter = Perimeter;
function _perimeter(__model__, select_ent_types, ents_arr) {
    if (!Array.isArray(select_ent_types)) {
        const select_ent_type = select_ent_types;
        if (!Array.isArray(ents_arr[0])) {
            ents_arr = [ents_arr];
        }
        // get an array of all edges
        const edges_i = [];
        for (const ent_arr of ents_arr) {
            const [ent_type, index] = ent_arr;
            const edges_ent_i = __model__.geom.query.navAnyToEdge(ent_type, index);
            for (const edge_ent_i of edges_ent_i) {
                edges_i.push(edge_ent_i);
            }
        }
        // get the perimeter entities
        const all_perim_ents_i = __model__.geom.query.perimeter(select_ent_type, edges_i);
        return all_perim_ents_i.map(perim_ent_i => [select_ent_type, perim_ent_i]);
    }
    else {
        const query_results = [];
        for (const select_ent_type of select_ent_types) {
            query_results.push(..._perimeter(__model__, select_ent_type, ents_arr));
        }
        return query_results;
    }
}
exports._perimeter = _perimeter;
// ================================================================================================
/**
* Returns a list of neighboring entities. In order to qualify as a neighbor,
* entities must not be part of the set of input entities, but must be welded to one or more entities in the input.
* ~
* @param __model__
* @param ent_type_enum Enum, select the types of neighbors to return
* @param entities List of entities.
* @returns Entities, a list of welded neighbors
* @example mod.neighbor('edges', [polyline1,polyline2,polyline3])
* @example_info Returns list of edges that are welded to polyline1, polyline2, or polyline3.
*/
function Neighbor(__model__, ent_type_enum, entities) {
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    let ents_arr = null;
    if (entities !== null && entities !== undefined) {
        ents_arr = _check_args_1.checkIDs('query.neighbor', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], null);
    }
    // --- Error Check ---
    const select_ent_types = _entType(ent_type_enum);
    const found_ents_arr = _neighbors(__model__, select_ent_types, ents_arr);
    return id_1.idsMake(found_ents_arr);
}
exports.Neighbor = Neighbor;
function _neighbors(__model__, select_ent_types, ents_arr) {
    if (!Array.isArray(select_ent_types)) {
        const select_ent_type = select_ent_types;
        if (!Array.isArray(ents_arr[0])) {
            ents_arr = [ents_arr];
        }
        // get an array of all vertices
        const verts_i = [];
        for (const ent_arr of ents_arr) {
            const [ent_type, index] = ent_arr;
            const verts_ent_i = __model__.geom.query.navAnyToVert(ent_type, index);
            for (const vert_ent_i of verts_ent_i) {
                verts_i.push(vert_ent_i);
            }
        }
        console.log(verts_i);
        // get the neighbor entities
        const all_nbor_ents_i = __model__.geom.query.neighbor(select_ent_type, verts_i);
        return all_nbor_ents_i.map(nbor_ent_i => [select_ent_type, nbor_ent_i]);
    }
    else {
        const query_results = [];
        for (const select_ent_type of select_ent_types) {
            query_results.push(..._neighbors(__model__, select_ent_type, ents_arr));
        }
        return query_results;
    }
}
exports._neighbors = _neighbors;
// ================================================================================================
/**
 * Checks the type of an entity.
 * ~
 * For is_used_posi, returns true if the entity is a posi, and it is used by at least one vertex.
 * For is_unused_posi, it returns the opposite of is_used_posi.
 * For is_object, returns true if the entity is a point, a polyline, or a polygon.
 * For is_topology, returns true if the entity is a vertex, an edge, a wire, or a face.
 * For is_point_topology, is_polyline_topology, and is_polygon_topology, returns true
 * if the entity is a topological entity, and it is part of an object of the specified type.
 * ~
 * For is_open, returns true if the entity is a wire or polyline and is open. For is_closed, it returns the opposite of is_open.
 * For is_hole, returns ture if the entity is a wire, and it defines a hole in a face.
 * For has_holes, returns true if the entity is a face or polygon, and it has holes.
 * For has_no_holes, it returns the opposite of has_holes.
 *
 * @param __model__
 * @param entities An entity, or a list of entities.
 * @param type_query_enum Enum, select the conditions to test agains.
 * @returns Boolean or list of boolean in input sequence.
 * @example query.Type([polyline1, polyline2, polygon1], is_polyline )
 * @example_info Returns a list [true, true, false] if polyline1 and polyline2 are polylines but polygon1 is not a polyline.
 */
function Type(__model__, entities, type_query_enum) {
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    const fn_name = 'query.Type';
    const ents_arr = _check_args_1.checkIDs(fn_name, 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], null);
    // --- Error Check ---
    return _type(__model__, ents_arr, type_query_enum);
}
exports.Type = Type;
function _isClosed(__model__, ents_arr) {
    if (!Array.isArray(ents_arr[0])) {
        const [ent_type, index] = ents_arr;
        if (ent_type === common_1.EEntType.PGON) {
            return true;
        }
        else if (ent_type !== common_1.EEntType.WIRE && ent_type !== common_1.EEntType.PLINE) {
            return false;
        }
        let wire_i = index;
        if (ent_type === common_1.EEntType.PLINE) {
            wire_i = __model__.geom.query.navPlineToWire(index);
        }
        return __model__.geom.query.istWireClosed(wire_i);
    }
    else {
        return ents_arr.map(ents => _isClosed(__model__, ents));
    }
}
var _ETypeQueryEnum;
(function (_ETypeQueryEnum) {
    _ETypeQueryEnum["EXISTS"] = "exists";
    _ETypeQueryEnum["IS_POSI"] = "is_position";
    _ETypeQueryEnum["IS_USED_POSI"] = "is_used_posi";
    _ETypeQueryEnum["IS_UNUSED_POSI"] = "is_unused_posi";
    _ETypeQueryEnum["IS_VERT"] = "is_vertex";
    _ETypeQueryEnum["IS_EDGE"] = "is_edge";
    _ETypeQueryEnum["IS_WIRE"] = "is_wire";
    _ETypeQueryEnum["IS_FACE"] = "is_face";
    _ETypeQueryEnum["IS_POINT"] = "is_point";
    _ETypeQueryEnum["IS_PLINE"] = "is_polyline";
    _ETypeQueryEnum["IS_PGON"] = "is_polygon";
    _ETypeQueryEnum["IS_COLL"] = "is_collection";
    _ETypeQueryEnum["IS_OBJ"] = "is_object";
    _ETypeQueryEnum["IS_TOPO"] = "is_topology";
    _ETypeQueryEnum["IS_POINT_TOPO"] = "is_point_topology";
    _ETypeQueryEnum["IS_PLINE_TOPO"] = "is_polyline_topology";
    _ETypeQueryEnum["IS_PGON_TOPO"] = "is_polygon_topology";
    _ETypeQueryEnum["IS_OPEN"] = "is_open";
    _ETypeQueryEnum["IS_CLOSED"] = "is_closed";
    _ETypeQueryEnum["IS_HOLE"] = "is_hole";
    _ETypeQueryEnum["HAS_HOLES"] = "has_holes";
    _ETypeQueryEnum["HAS_NO_HOLES"] = "has_no_holes";
})(_ETypeQueryEnum = exports._ETypeQueryEnum || (exports._ETypeQueryEnum = {}));
function _exists(__model__, ent_arr) {
    const [ent_type, index] = ent_arr;
    return __model__.geom.query.entExists(ent_type, index);
}
function _isUsedPosi(__model__, ent_arr) {
    const [ent_type, index] = ent_arr;
    if (ent_type !== common_1.EEntType.POSI) {
        return false;
    }
    const verts_i = __model__.geom.query.navPosiToVert(index);
    if (verts_i === undefined || verts_i === null) {
        return false;
    }
    return verts_i.length > 0;
}
function _isObj(__model__, ent_arr) {
    const [ent_type, index] = ent_arr;
    if (ent_type === common_1.EEntType.POINT || ent_type === common_1.EEntType.PLINE || ent_type === common_1.EEntType.PGON) {
        return true;
    }
    return false;
}
function _isTopo(__model__, ent_arr) {
    const [ent_type, index] = ent_arr;
    if (ent_type === common_1.EEntType.VERT || ent_type === common_1.EEntType.EDGE || ent_type === common_1.EEntType.WIRE || ent_type === common_1.EEntType.FACE) {
        return true;
    }
    return false;
}
function _isPointTopo(__model__, ent_arr) {
    const [ent_type, index] = ent_arr;
    if (ent_type === common_1.EEntType.VERT || ent_type === common_1.EEntType.EDGE || ent_type === common_1.EEntType.WIRE || ent_type === common_1.EEntType.FACE) {
        const points_i = __model__.geom.query.navAnyToPoint(ent_type, index);
        if (points_i !== undefined && points_i !== null && points_i.length) {
            return true;
        }
    }
    return false;
}
function _isPlineTopo(__model__, ent_arr) {
    const [ent_type, index] = ent_arr;
    if (ent_type === common_1.EEntType.VERT || ent_type === common_1.EEntType.EDGE || ent_type === common_1.EEntType.WIRE || ent_type === common_1.EEntType.FACE) {
        const plines_i = __model__.geom.query.navAnyToPline(ent_type, index);
        if (plines_i !== undefined && plines_i !== null && plines_i.length) {
            return true;
        }
    }
    return false;
}
function _isPgonTopo(__model__, ent_arr) {
    const [ent_type, index] = ent_arr;
    if (ent_type === common_1.EEntType.VERT || ent_type === common_1.EEntType.EDGE || ent_type === common_1.EEntType.WIRE || ent_type === common_1.EEntType.FACE) {
        const pgons_i = __model__.geom.query.navAnyToPgon(ent_type, index);
        if (pgons_i !== undefined && pgons_i !== null && pgons_i.length) {
            return true;
        }
    }
    return false;
}
function _isClosed2(__model__, ent_arr) {
    const [ent_type, index] = ent_arr;
    if (ent_type === common_1.EEntType.PGON) {
        return true;
    }
    else if (ent_type !== common_1.EEntType.WIRE && ent_type !== common_1.EEntType.PLINE) {
        return false;
    }
    let wire_i = index;
    if (ent_type === common_1.EEntType.PLINE) {
        wire_i = __model__.geom.query.navPlineToWire(index);
    }
    return __model__.geom.query.istWireClosed(wire_i);
}
function _isHole(__model__, ent_arr) {
    const [ent_type, index] = ent_arr;
    if (ent_type !== common_1.EEntType.WIRE) {
        return false;
    }
    const face_i = __model__.geom.query.navWireToFace(index);
    if (face_i === undefined || face_i === null) {
        return false;
    }
    const wires_i = __model__.geom.query.navFaceToWire(face_i);
    return wires_i.indexOf(index) > 0;
}
function _hasNoHoles(__model__, ent_arr) {
    const [ent_type, index] = ent_arr;
    if (ent_type !== common_1.EEntType.FACE && ent_type !== common_1.EEntType.PGON) {
        return false;
    }
    let face_i = index;
    if (ent_type === common_1.EEntType.PGON) {
        face_i = __model__.geom.query.navPgonToFace(index);
    }
    const wires_i = __model__.geom.query.navFaceToWire(face_i);
    return wires_i.length === 1;
}
function _type(__model__, ents_arr, query_ent_type) {
    if (id_1.getArrDepth(ents_arr) === 1) {
        const ent_arr = ents_arr;
        const [ent_type, _] = ent_arr;
        switch (query_ent_type) {
            case _ETypeQueryEnum.EXISTS:
                return _exists(__model__, ent_arr);
            case _ETypeQueryEnum.IS_POSI:
                return ent_type === common_1.EEntType.POSI;
            case _ETypeQueryEnum.IS_USED_POSI:
                return _isUsedPosi(__model__, ent_arr);
            case _ETypeQueryEnum.IS_UNUSED_POSI:
                return !_isUsedPosi(__model__, ent_arr);
            case _ETypeQueryEnum.IS_VERT:
                return ent_type === common_1.EEntType.VERT;
            case _ETypeQueryEnum.IS_EDGE:
                return ent_type === common_1.EEntType.EDGE;
            case _ETypeQueryEnum.IS_WIRE:
                return ent_type === common_1.EEntType.WIRE;
            case _ETypeQueryEnum.IS_FACE:
                return ent_type === common_1.EEntType.FACE;
            case _ETypeQueryEnum.IS_POINT:
                return ent_type === common_1.EEntType.POINT;
            case _ETypeQueryEnum.IS_PLINE:
                return ent_type === common_1.EEntType.PLINE;
            case _ETypeQueryEnum.IS_PGON:
                return ent_type === common_1.EEntType.PGON;
            case _ETypeQueryEnum.IS_COLL:
                return ent_type === common_1.EEntType.COLL;
            case _ETypeQueryEnum.IS_OBJ:
                return _isObj(__model__, ent_arr);
            case _ETypeQueryEnum.IS_TOPO:
                return _isTopo(__model__, ent_arr);
            case _ETypeQueryEnum.IS_POINT_TOPO:
                return _isPointTopo(__model__, ent_arr);
            case _ETypeQueryEnum.IS_PLINE_TOPO:
                return _isPlineTopo(__model__, ent_arr);
            case _ETypeQueryEnum.IS_PGON_TOPO:
                return _isPgonTopo(__model__, ent_arr);
            case _ETypeQueryEnum.IS_OPEN:
                return !_isClosed2(__model__, ent_arr);
            case _ETypeQueryEnum.IS_CLOSED:
                return _isClosed2(__model__, ent_arr);
            case _ETypeQueryEnum.IS_HOLE:
                return _isHole(__model__, ent_arr);
            case _ETypeQueryEnum.HAS_HOLES:
                return !_hasNoHoles(__model__, ent_arr);
            case _ETypeQueryEnum.HAS_NO_HOLES:
                return _hasNoHoles(__model__, ent_arr);
            default:
                break;
        }
    }
    else {
        return ents_arr.map(ent_arr => _type(__model__, ent_arr, query_ent_type));
    }
}
// TODO IS_PLANAR
// TODO IS_QUAD
// ================================================================================================
// // ================================================================================================
// /**
//  * Returns a list of entities based on a query expression.
//  * The result will always be a list of entities, even if there is only one entity.
//  * In a case where you want only one entity, remember to get the first item in the list.
//  * ~
//  * The query expression can use the following format: #@name == value,
//  * where 'name' is the attribute name, and 'value' is the attribute value that you are searching for.
//  * ~
//  * If the attribute value is a string, then in must be in quotes, as follows: #@name == 'str_value'.
//  * ~
//  * If the attribute value is a number, then any comparison operator can be used: ==, !=, >, >=, <, =<.
//  * ~
//  * @param __model__
//  * @param select Enum, specifies what type of entities will be returned.
//  * @param entities List of entities to be searched. If 'null' (without quotes), all entities in the model will be searched.
//  * @param query_expr Attribute condition. If 'null' (without quotes), no condition is set; all found entities are returned.
//  * @returns Entities, a list of entities that match the type specified in 'select' and the conditions specified in 'query_expr'.
//  * @example positions = query.Get(positions, polyline1, #@xyz[2]>10)
//  * @example_info Returns a list of positions that are part of polyline1 where the z-coordinate is more than 10.
//  * @example positions = query.Get(positions, null, #@xyz[2]>10)
//  * @example_info Returns a list of positions in the model where the z-coordinate is more than 10.
//  * @example positions = query.Get(positions, polyline1, null)
//  * @example_info Returns a list of all of the positions that are part of polyline1.
//  * @example polylines = query.Get(polylines, position1, null)
//  * @example_info Returns a list of all of the polylines that use position1.
//  * @example collections = query.Get(collections, null, #@type=="floors")
//  * @example_info Returns a list of all the collections that have an attribute called "type" with a value "floors".
//  */
// export function _GetOld(__model__: GIModel, select: _EEntTypeEnum, entities: TId|TId[], query_expr: TQuery): TId[] {
//     if (isEmptyArr(entities)) { return []; }
//     // --- Error Check ---
//     let ents_arr: TEntTypeIdx|TEntTypeIdx[] = null;
//     if (entities !== null && entities !== undefined) {
//         ents_arr = checkIDs('query.Get', 'entities', entities,
//              [IDcheckObj.isID, IDcheckObj.isIDList], null) as TEntTypeIdx|TEntTypeIdx[];
//     }
//     // TODO add a condition called isNull for entities
//     // TODO check the query string
//     // --- Error Check ---
//     const select_ent_types: EEntType|EEntType[] = _entType(select);
//     const found_ents_arr: TEntTypeIdx[] = _getOld(__model__, select_ent_types, ents_arr, query_expr);
//     if (found_ents_arr.length === 0) { return []; }
//     // remove duplicates
//     const found_ents_arr_no_dups: TEntTypeIdx[] = [found_ents_arr[0]];
//     for (let i = 1; i < found_ents_arr.length; i++) {
//         const current: TEntTypeIdx = found_ents_arr[i];
//         const previous: TEntTypeIdx = found_ents_arr[i - 1];
//         if (!(current[0] === previous[0] && current[1] === previous[1])) {
//             found_ents_arr_no_dups.push(found_ents_arr[i]);
//         }
//     }
//     return idsMake(found_ents_arr_no_dups) as TId[];
// }
// function _getOld(__model__: GIModel, select_ent_types: EEntType|EEntType[],
//               ents_arr: TEntTypeIdx|TEntTypeIdx[], query_expr: TQuery): TEntTypeIdx[] {
//     if (!Array.isArray(select_ent_types)) {
//         const select_ent_type: EEntType = select_ent_types as EEntType;
//         // get the list of entities
//         const found_entities_i: number[] = [];
//         if (ents_arr === null || ents_arr === undefined) {
//             found_entities_i.push(...__model__.geom.query.getEnts(select_ent_type, false));
//         } else {
//             if (ents_arr.length === 0) {
//                 return [];
//             } else if (getArrDepth(ents_arr) === 1) {
//                 ents_arr = [ents_arr] as TEntTypeIdx[];
//             }
//             for (const ents of ents_arr) {
//                 found_entities_i.push(...__model__.geom.query.navAnyToAny(ents[0], select_ent_type, ents[1]));
//             }
//         }
//         // check if the query is null
//         if (query_expr === null || query_expr === undefined) {
//             // sort
//             return found_entities_i.map( entity_i => [select_ent_type, entity_i]) as TEntTypeIdx[];
//         }
//         // do the query on the list of entities
//         const query_result: number[] = __model__.attribs.query.queryAttribs(select_ent_type, query_expr, found_entities_i);
//         if (query_result.length === 0) { return []; }
//         return query_result.map( entity_i => [select_ent_type, entity_i]) as TEntTypeIdx[];
//     } else {
//         const query_results_arr: TEntTypeIdx[] = [];
//         for (const select_ent_type of select_ent_types) {
//             const ent_type_query_results: TEntTypeIdx[] = _get(__model__, select_ent_type, ents_arr, query_expr);
//             for (const query_result of ent_type_query_results) {
//                 query_results_arr.push(query_result);
//             }
//         }
//         // return the query results
//         return query_results_arr;
//     }
// }
// function _compareID(ent_arr1: TEntTypeIdx, ent_arr2: TEntTypeIdx): number {
//     const [ent_type1, index1]: TEntTypeIdx = ent_arr1;
//     const [ent_type2, index2]: TEntTypeIdx = ent_arr2;
//     if (ent_type1 !== ent_type2) { return ent_type1 -  ent_type2; }
//     if (index1 !== index2) { return index1 -  index2; }
//     return 0;
// }
// // ================================================================================================
// /**
//  * Returns the number of entities based on a query expression.
//  * ~
//  * The query expression can use the following format: #@name == value,
//  * where 'name' is the attribute name, and 'value' is the attribute value that you are searching for.
//  * ~
//  * If the attribute value is a string, then in must be in quotes, as follows: #@name == 'str_value'.
//  * ~
//  * If the attribute value is a number, then any comparison operator can be used: ==, !=, >, >=, <, =<.
//  *
//  * @param __model__
//  * @param select Enum, specifies what type of entities are to be counted.
//  * @param entities List of entities to be searched. If 'null' (without quotes), list of all entities in the model.
//  * @param query_expr Attribute condition. If 'null' (without quotes), no condition is set; list of all search entities is returned.
//  * @returns Number of entities.
//  * @example num_ents = query.Count(positions, polyline1, #@xyz[2]>10)
//  * @example_info Returns the number of positions defined by polyline1 where the z-coordinate is more than 10.
//  */
// export function _Count(__model__: GIModel, select: _EEntTypeEnum, entities: TId|TId[], query_expr: TQuery): number {
//     if (isEmptyArr(entities)) { return 0; }
//     // --- Error Check ---
//     if (entities !== null && entities !== undefined) {
//         checkIDs('query.Count', 'entities', entities, [IDcheckObj.isID, IDcheckObj.isIDList], null);
//     }
//     // --- Error Check ---
//     return Get(__model__, select, entities, query_expr).length;
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9tb2R1bGVzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7R0FLRzs7QUFPSCx1REFBc0g7QUFDdEgsK0NBQTBFO0FBQzFFLCtDQUFxRDtBQUVyRCxtR0FBbUc7QUFDbkcsOEJBQThCO0FBQzlCLDRCQUE0QjtBQUM1QiwyQkFBMkI7QUFDM0Isd0JBQXdCO0FBQ3hCLHdCQUF3QjtBQUN4Qix3QkFBd0I7QUFDeEIseUJBQXlCO0FBQ3pCLDRCQUE0QjtBQUM1QiwyQkFBMkI7QUFDM0IsNkJBQTZCO0FBQzdCLFdBQVc7QUFDWCw2QkFBNkI7QUFDN0IsZ0NBQWdDO0FBQ2hDLHdCQUF3QjtBQUN4QixJQUFJO0FBQ0osSUFBWSxhQWNYO0FBZEQsV0FBWSxhQUFhO0lBQ3JCLDRCQUFhLENBQUE7SUFDYiw0QkFBYSxDQUFBO0lBQ2IsNEJBQWEsQ0FBQTtJQUNiLDRCQUFhLENBQUE7SUFDYiw0QkFBYSxDQUFBO0lBQ2IsNkJBQWEsQ0FBQTtJQUNiLDZCQUFhLENBQUE7SUFDYiw0QkFBYSxDQUFBO0lBQ2IsNEJBQWEsQ0FBQTtJQUNiLElBQUk7SUFDSixzQkFBc0I7SUFDdEIseUJBQXlCO0lBQ3pCLGlCQUFpQjtBQUNyQixDQUFDLEVBZFcsYUFBYSxHQUFiLHFCQUFhLEtBQWIscUJBQWEsUUFjeEI7QUFDRCxTQUFTLFFBQVEsQ0FBQyxNQUFxQjtJQUNuQyxRQUFRLE1BQU0sRUFBRTtRQUNaLEtBQUssYUFBYSxDQUFDLElBQUk7WUFDbkIsT0FBTyxpQkFBUSxDQUFDLElBQUksQ0FBQztRQUN6QixLQUFLLGFBQWEsQ0FBQyxJQUFJO1lBQ25CLE9BQU8saUJBQVEsQ0FBQyxJQUFJLENBQUM7UUFDekIsS0FBSyxhQUFhLENBQUMsSUFBSTtZQUNuQixPQUFPLGlCQUFRLENBQUMsSUFBSSxDQUFDO1FBQ3pCLEtBQUssYUFBYSxDQUFDLElBQUk7WUFDbkIs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