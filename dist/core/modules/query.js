"use strict";
/**
 * The `query` module has functions for querying entities in the the model.
 * Most of these functions all return a list of IDs of entities in the model.
 * The Count function returns the number of entities, rather than the list of entities.
 *
 * The Get() function is an important function, and is used in many modelling workflows.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../libs/geo-info/common");
const id_1 = require("../../libs/geo-info/id");
const _check_args_1 = require("./_check_args");
// TQuery should be something like this:
//
// #@name != value
// #@name1 > 10 || #@name2 < 5 && #@name3 == 'red'
// #@xyz[2] > 5
//
// ================================================================================================
// These are used by Get(), Count(), and Neighbours()
var _EQuerySelect;
(function (_EQuerySelect) {
    _EQuerySelect["POSI"] = "positions";
    _EQuerySelect["VERT"] = "vertices";
    _EQuerySelect["EDGE"] = "edges";
    _EQuerySelect["WIRE"] = "wires";
    _EQuerySelect["FACE"] = "faces";
    _EQuerySelect["POINT"] = "points";
    _EQuerySelect["PLINE"] = "polylines";
    _EQuerySelect["PGON"] = "polygons";
    _EQuerySelect["COLL"] = "collections";
    _EQuerySelect["OBJS"] = "objects";
    _EQuerySelect["TOPOS"] = "topologies";
    _EQuerySelect["ALL"] = "all";
})(_EQuerySelect = exports._EQuerySelect || (exports._EQuerySelect = {}));
function _convertSelectToEEntTypeStr(select) {
    switch (select) {
        case _EQuerySelect.POSI:
            return common_1.EEntType.POSI;
        case _EQuerySelect.VERT:
            return common_1.EEntType.VERT;
        case _EQuerySelect.EDGE:
            return common_1.EEntType.EDGE;
        case _EQuerySelect.WIRE:
            return common_1.EEntType.WIRE;
        case _EQuerySelect.FACE:
            return common_1.EEntType.FACE;
        case _EQuerySelect.POINT:
            return common_1.EEntType.POINT;
        case _EQuerySelect.PLINE:
            return common_1.EEntType.PLINE;
        case _EQuerySelect.PGON:
            return common_1.EEntType.PGON;
        case _EQuerySelect.COLL:
            return common_1.EEntType.COLL;
        case _EQuerySelect.OBJS:
            return [
                common_1.EEntType.POINT,
                common_1.EEntType.PLINE,
                common_1.EEntType.PGON
            ];
        case _EQuerySelect.TOPOS:
            return [
                common_1.EEntType.VERT,
                common_1.EEntType.EDGE,
                common_1.EEntType.WIRE,
                common_1.EEntType.FACE
            ];
        case _EQuerySelect.ALL:
            return [
                common_1.EEntType.POSI,
                common_1.EEntType.VERT,
                common_1.EEntType.EDGE,
                common_1.EEntType.WIRE,
                common_1.EEntType.FACE,
                common_1.EEntType.POINT,
                common_1.EEntType.PLINE,
                common_1.EEntType.PGON,
                common_1.EEntType.COLL
            ];
        default:
            throw new Error('Query select parameter not recognised.');
    }
}
// ================================================================================================
function _get(__model__, select_ent_types, ents_arr, query_expr) {
    if (!Array.isArray(select_ent_types)) {
        const select_ent_type = select_ent_types;
        // get the list of entities
        const found_entities_i = [];
        if (ents_arr === null || ents_arr === undefined) {
            found_entities_i.push(...__model__.geom.query.getEnts(select_ent_type, false));
        }
        else {
            if (ents_arr.length === 0) {
                return [];
            }
            else if (id_1.getArrDepth(ents_arr) === 1) {
                ents_arr = [ents_arr];
            }
            for (const ents of ents_arr) {
                found_entities_i.push(...__model__.geom.query.navAnyToAny(ents[0], select_ent_type, ents[1]));
            }
        }
        // check if the query is null
        if (query_expr === null || query_expr === undefined) {
            // sort
            return found_entities_i.map(entity_i => [select_ent_type, entity_i]);
        }
        // do the query on the list of entities
        const query_result = __model__.attribs.query.queryAttribs(select_ent_type, query_expr, found_entities_i);
        if (query_result.length === 0) {
            return [];
        }
        return query_result.map(entity_i => [select_ent_type, entity_i]);
    }
    else {
        const query_results_arr = [];
        for (const select_ent_type of select_ent_types) {
            const ent_type_query_results = _get(__model__, select_ent_type, ents_arr, query_expr);
            for (const query_result of ent_type_query_results) {
                query_results_arr.push(query_result);
            }
        }
        // return the query results
        return query_results_arr;
    }
}
function _compareID(ent_arr1, ent_arr2) {
    const [ent_type1, index1] = ent_arr1;
    const [ent_type2, index2] = ent_arr2;
    if (ent_type1 !== ent_type2) {
        return ent_type1 - ent_type2;
    }
    if (index1 !== index2) {
        return index1 - index2;
    }
    return 0;
}
var _EQuerySortMethod;
(function (_EQuerySortMethod) {
    _EQuerySortMethod["ID_ASCENDING"] = "ID_ascending";
    _EQuerySortMethod["ID_DESCENDING"] = "ID_descending";
    _EQuerySortMethod["GEOMETRIC"] = "geometric_order";
})(_EQuerySortMethod = exports._EQuerySortMethod || (exports._EQuerySortMethod = {}));
/**
 * Returns a list of entities based on a query expression.
 * The result will always be a list of entities, even if there is only one entity.
 * In a case where you expect only one entity, remember to get the first item in the list.
 * ~
 * The query expression should use the following format: #@name == value,
 * where 'name' is the attribute name, and 'value' is the attribute value that you are searching for.
 * ~
 * If the attribute value is a string, then in must be in quotes, as follows: #@name == 'str_value'.
 * The '==' is the comparison operator. The other comparison operators are: !=, >, >=, <, =<.
 * ~
 * Entities can be search using multiple query expressions, as follows:  #@name1 == value1 &&  #@name2 == value2.
 * Query expressions can be combined with either && (and) and || (or), where
 * && takes precedence over ||.
 * ~
 * The order of the entities is specified by the 'sort' method. If 'geometrc_order' is slected, then entities are
 * returned in the order in which they are found within the geometric model. For exampl, when getting positions of a polygon,
 * then the order of the positions will follow the order of the vertices in the polygon.
 * ~
 * @param __model__
 * @param select Enum, specifies what type of entities will be returned.
 * @param entities List of entities to be searched. If 'null' (without quotes), all entities in the model will be searched.
 * @param query_expr Attribute condition. If 'null' (without quotes), no condition is set; all found entities are returned.
 * @param sort Enum, sort the entities that are returned in specific order.
 * @returns Entities, a list of entities that match the type specified in 'select' and the conditions specified in 'query_expr'.
 * @example positions = query.Get(positions, polyline1, #@xyz[2]>10, 'geometric_order')
 * @example_info Returns a list of positions that are part of polyline1 where the z-coordinate is more than 10.
 * @example positions = query.Get(positions, null, #@xyz[2]>10, 'ID_descending')
 * @example_info Returns a list of positions in the model where the z-coordinate is more than 10.
 * @example positions = query.Get(positions, polyline1, null, 'geometric_order')
 * @example_info Returns a list of all of the positions that are part of polyline1.
 * @example polylines = query.Get(polylines, position1, null, 'ID_descending')
 * @example_info Returns a list of all of the polylines that use position1.
 * @example collections = query.Get(collections, null, #@type=="floors", 'ID_descending')
 * @example_info Returns a list of all the collections that have an attribute called "type" with a value "floors".
 */
function Get(__model__, select, entities, query_expr, sort) {
    // --- Error Check ---
    let ents_arr = null;
    if (entities !== null && entities !== undefined) {
        ents_arr = _check_args_1.checkIDs('query.Get', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], null);
    }
    // TODO add a condition called isNull for entities
    // TODO check the query string
    // --- Error Check ---
    const select_ent_types = _convertSelectToEEntTypeStr(select);
    const found_ents_arr = _get(__model__, select_ent_types, ents_arr, query_expr);
    if (found_ents_arr.length === 0) {
        return [];
    }
    // sort entities
    if (sort === _EQuerySortMethod.ID_ASCENDING) {
        found_ents_arr.sort(_compareID);
    }
    else if (sort === _EQuerySortMethod.ID_DESCENDING) {
        found_ents_arr.sort(_compareID);
        found_ents_arr.reverse();
    }
    // remove duplicates
    const found_ents_arr_no_dups = [found_ents_arr[0]];
    for (let i = 1; i < found_ents_arr.length; i++) {
        const current = found_ents_arr[i];
        const previous = found_ents_arr[i - 1];
        if (!(current[0] === previous[0] && current[1] === previous[1])) {
            found_ents_arr_no_dups.push(found_ents_arr[i]);
        }
    }
    return id_1.idsMake(found_ents_arr_no_dups);
}
exports.Get = Get;
// ================================================================================================
// ================================================================================================
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
/**
 * Returns a list of entities excluding the specified entities.
 * @param __model__
 * @param select Enum, specifies what type of entities will be returned.
 * @param entities List of entities to be excluded.
 * @returns Entities, a list of entities that match the type specified in 'select'.
 * @example objects = query.Get(objects, polyline1, null)
 * @example_info Returns a list of all the objects in the model except polyline1.
 */
function Invert(__model__, select, entities) {
    // --- Error Check ---
    let ents_arr = null;
    if (entities !== null && entities !== undefined) {
        ents_arr = _check_args_1.checkIDs('query.Get', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], null);
    }
    // --- Error Check ---
    const select_ent_types = _convertSelectToEEntTypeStr(select);
    const found_ents_arr = _invert(__model__, select_ent_types, ents_arr);
    return id_1.idsMake(found_ents_arr);
}
exports.Invert = Invert;
// ================================================================================================
/**
 * Returns the number of entities based on a query expression.
 * The query expression should use the following format: #@name == value,
 * where 'name' is the attribute name, and 'value' is the attribute value.
 * If the attribute value is a string, then in must be in qoutes, as follows: #@name == 'str_value'.
 * The '==' is the comparison operator. The other comparison operators are: !=, >, >=, <, =<.
 * Entities can be search using multiple query expressions, as follows:  #@name1 == value1 &&  #@name2 == value2.
 * Query expressions can be combine with either && (and) and || (or), where
 * && takes precedence over ||.
 *
 * @param __model__
 * @param select Enum, specifies what type of entities are to be counted.
 * @param entities List of entities to be searched. If 'null' (without quotes), list of all entities in the model.
 * @param query_expr Attribute condition. If 'null' (without quotes), no condition is set; list of all search entities is returned.
 * @returns Number of entities.
 * @example num_ents = query.Count(positions, polyline1, #@xyz[2]>10)
 * @example_info Returns the number of positions defined by polyline1 where the z-coordinate is more than 10.
 */
function Count(__model__, select, entities, query_expr) {
    // --- Error Check ---
    // if (entities !== null && entities !== undefined) {
    //     checkIDs('query.Count', 'entities', entities, [IDcheckObj.isID, IDcheckObj.isIDList], null);
    // }
    // --- Error Check ---
    return Get(__model__, select, entities, query_expr, _EQuerySortMethod.GEOMETRIC).length; // Check done in Get
}
exports.Count = Count;
// ================================================================================================
function _neighbours(__model__, select_ent_types, ents_arr) {
    if (!Array.isArray(select_ent_types)) {
        const select_ent_type = select_ent_types;
        if (!Array.isArray(ents_arr[0])) {
            ents_arr = [ents_arr];
        }
        const all_nbor_ents_i = new Set();
        for (const ents of ents_arr) {
            const [ent_type, index] = ents;
            const nbor_ents_i = __model__.geom.query.neighbours(ent_type, select_ent_type, index);
            nbor_ents_i.forEach(nbor_ent_i => all_nbor_ents_i.add(nbor_ent_i));
        }
        return Array.from(all_nbor_ents_i).map(nbor_ent_i => [select_ent_type, nbor_ent_i]);
    }
    else {
        const query_results = [];
        for (const select_ent_type of select_ent_types) {
            query_results.push(..._neighbours(__model__, select_ent_type, ents_arr));
        }
        return query_results;
    }
}
exports._neighbours = _neighbours;
/**
* Returns a list of welded neighbours of any entity
* @param __model__
* @param select Enum, select the types of neighbours to return
* @param entities List of entities.
* @returns Entities, a list of welded neighbours
* @example mod.Neighbours([polyline1,polyline2,polyline3])
* @example_info Returns list of entities that are welded to polyline1 and polyline2.
*/
function Neighbours(__model__, select, entities) {
    // --- Error Check ---
    let ents_arr = null;
    if (entities !== null && entities !== undefined) {
        ents_arr = _check_args_1.checkIDs('query.Get', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], null);
    }
    // --- Error Check ---
    const select_ent_types = _convertSelectToEEntTypeStr(select);
    const found_ents_arr = _neighbours(__model__, select_ent_types, ents_arr);
    return id_1.idsMake(found_ents_arr);
}
exports.Neighbours = Neighbours;
// ================================================================================================
function _sort(__model__, ents_arr, sort_expr, method) {
    // get the list of ents_i
    const ent_type = ents_arr[0][0];
    const ents_i = ents_arr.filter(ent_arr => ent_arr[0] === ent_type).map(ent_arr => ent_arr[1]);
    // check if the sort expression is null
    if (sort_expr === null || sort_expr === undefined) {
        ents_i.sort();
        if (method === common_1.ESort.ASCENDING) {
            ents_i.reverse();
        }
        return ents_i.map(entity_i => [ent_type, entity_i]);
    }
    // do the sort on the list of entities
    const sort_result = __model__.attribs.query.sortByAttribs(ent_type, ents_i, sort_expr, method);
    return sort_result.map(entity_i => [ent_type, entity_i]);
}
var _ESortMethod;
(function (_ESortMethod) {
    _ESortMethod["DESCENDING"] = "descending";
    _ESortMethod["ASCENDING"] = "ascending";
})(_ESortMethod = exports._ESortMethod || (exports._ESortMethod = {}));
/**
 * Sorts entities based on a sort expression.
 * The sort expression should use the following format: #@name, where 'name' is the attribute name.
 * Entities can be sorted using multiple sort expresssions as follows: #@name1 && #@name2.
 * If the attribute is a list, and index can also be specified as follows: #@name1[index].
 * @param __model__
 * @param entities List of two or more entities to be sorted, all of the same entity type.
 * @param sort_expr Attribute condition. If 'null' (without quotes), entities will be sorted based on their ID.
 * @param method Enum, sort descending or ascending.
 * @returns Entities, a list of sorted entities.
 * @example sorted_list = query.Sort( [pos1, pos2, pos3], #@xyz[2], descending)
 * @example_info Returns a list of three positions, sorted according to the descending z value.
 */
function Sort(__model__, entities, sort_expr, method) {
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('query.Sort', 'entities', entities, [_check_args_1.IDcheckObj.isIDList], null);
    // TODO check the sort expression
    // --- Error Check ---
    const sort_method = (method === _ESortMethod.DESCENDING) ? common_1.ESort.DESCENDING : common_1.ESort.ASCENDING;
    const sorted_ents_arr = _sort(__model__, ents_arr, sort_expr, sort_method);
    return id_1.idsMake(sorted_ents_arr);
}
exports.Sort = Sort;
// ================================================================================================
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
var _EQueryEntType;
(function (_EQueryEntType) {
    _EQueryEntType["IS_POSI"] = "is_position";
    _EQueryEntType["IS_USED_POSI"] = "is_used_posi";
    _EQueryEntType["IS_UNUSED_POSI"] = "is_unused_posi";
    _EQueryEntType["IS_VERT"] = "is_vertex";
    _EQueryEntType["IS_EDGE"] = "is_edge";
    _EQueryEntType["IS_WIRE"] = "is_wire";
    _EQueryEntType["IS_FACE"] = "is_face";
    _EQueryEntType["IS_POINT"] = "is_point";
    _EQueryEntType["IS_PLINE"] = "is_polyline";
    _EQueryEntType["IS_PGON"] = "is_polygon";
    _EQueryEntType["IS_COLL"] = "is_collection";
    _EQueryEntType["IS_OBJ"] = "is_object";
    _EQueryEntType["IS_TOPO"] = "is_topology";
    _EQueryEntType["IS_POINT_TOPO"] = "is_point_topology";
    _EQueryEntType["IS_PLINE_TOPO"] = "is_polyline_topology";
    _EQueryEntType["IS_PGON_TOPO"] = "is_polygon_topology";
    _EQueryEntType["IS_OPEN"] = "is_open";
    _EQueryEntType["IS_CLOSED"] = "is_closed";
    _EQueryEntType["IS_HOLE"] = "is_hole";
    _EQueryEntType["HAS_HOLES"] = "has_holes";
    _EQueryEntType["HAS_NO_HOLES"] = "has_no_holes";
})(_EQueryEntType = exports._EQueryEntType || (exports._EQueryEntType = {}));
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
            case _EQueryEntType.IS_POSI:
                return ent_type === common_1.EEntType.POSI;
            case _EQueryEntType.IS_USED_POSI:
                return _isUsedPosi(__model__, ent_arr);
            case _EQueryEntType.IS_UNUSED_POSI:
                return !_isUsedPosi(__model__, ent_arr);
            case _EQueryEntType.IS_VERT:
                return ent_type === common_1.EEntType.VERT;
            case _EQueryEntType.IS_EDGE:
                return ent_type === common_1.EEntType.EDGE;
            case _EQueryEntType.IS_WIRE:
                return ent_type === common_1.EEntType.WIRE;
            case _EQueryEntType.IS_FACE:
                return ent_type === common_1.EEntType.FACE;
            case _EQueryEntType.IS_POINT:
                return ent_type === common_1.EEntType.POINT;
            case _EQueryEntType.IS_PLINE:
                return ent_type === common_1.EEntType.PLINE;
            case _EQueryEntType.IS_PGON:
                return ent_type === common_1.EEntType.PGON;
            case _EQueryEntType.IS_COLL:
                return ent_type === common_1.EEntType.COLL;
            case _EQueryEntType.IS_OBJ:
                return _isObj(__model__, ent_arr);
            case _EQueryEntType.IS_TOPO:
                return _isTopo(__model__, ent_arr);
            case _EQueryEntType.IS_POINT_TOPO:
                return _isPointTopo(__model__, ent_arr);
            case _EQueryEntType.IS_PLINE_TOPO:
                return _isPlineTopo(__model__, ent_arr);
            case _EQueryEntType.IS_PGON_TOPO:
                return _isPgonTopo(__model__, ent_arr);
            case _EQueryEntType.IS_OPEN:
                return !_isClosed2(__model__, ent_arr);
            case _EQueryEntType.IS_CLOSED:
                return _isClosed2(__model__, ent_arr);
            case _EQueryEntType.IS_HOLE:
                return _isHole(__model__, ent_arr);
            case _EQueryEntType.HAS_HOLES:
                return !_hasNoHoles(__model__, ent_arr);
            case _EQueryEntType.HAS_NO_HOLES:
                return _hasNoHoles(__model__, ent_arr);
            default:
                break;
        }
    }
    else {
        return ents_arr.map(ent_arr => _type(__model__, ent_arr, query_ent_type));
    }
}
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
 * @param query_ent_type Enum, select the conditions to test agains.
 * @returns Boolean or list of boolean in input sequence.
 * @example query.Type([polyline1, polyline2, polygon1], is_polyline )
 * @example_info Returns a list [true, true, false] if polyline1 and polyline2 are polylines but polygon1 is not a polyline.
 */
function Type(__model__, entities, query_ent_type) {
    // --- Error Check ---
    const fn_name = 'query.Type';
    const ents_arr = _check_args_1.checkIDs(fn_name, 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], null);
    // --- Error Check ---
    return _type(__model__, ents_arr, query_ent_type);
}
exports.Type = Type;
// TODO IS_PLANAR
// TODO IS_QUAD
// ================================================================================================
/**
 * Checks if polyline(s) or wire(s) are closed.
 * ~
 * WARNING: This function has been deprecated. Plese use the query.Type() function instead.
 *
 * @param __model__
 * @param lines Wires, polylines, or polygons.
 * @returns Boolean or list of boolean in input sequence of lines.
 * @example mod.IsClosed([polyline1,polyline2,polyline3])
 * @example_info Returns list [true,true,false] if polyline1 and polyline2 are closed but polyline3 is open.
 */
function _IsClosed(__model__, lines) {
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('query.isClosed', 'lines', lines, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.PLINE, common_1.EEntType.WIRE, common_1.EEntType.PGON]);
    // --- Error Check ---
    return _isClosed(__model__, ents_arr);
}
exports._IsClosed = _IsClosed;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9tb2R1bGVzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBT0gsdURBQXVGO0FBQ3ZGLCtDQUE4RDtBQUM5RCwrQ0FBcUQ7QUFFckQsd0NBQXdDO0FBQ3hDLEVBQUU7QUFDRixrQkFBa0I7QUFDbEIsa0RBQWtEO0FBQ2xELGVBQWU7QUFDZixFQUFFO0FBQ0YsbUdBQW1HO0FBQ25HLHFEQUFxRDtBQUNyRCxJQUFZLGFBYVg7QUFiRCxXQUFZLGFBQWE7SUFDckIsbUNBQW9CLENBQUE7SUFDcEIsa0NBQW1CLENBQUE7SUFDbkIsK0JBQWdCLENBQUE7SUFDaEIsK0JBQWdCLENBQUE7SUFDaEIsK0JBQWdCLENBQUE7SUFDaEIsaUNBQWlCLENBQUE7SUFDakIsb0NBQW9CLENBQUE7SUFDcEIsa0NBQW1CLENBQUE7SUFDbkIscUNBQXNCLENBQUE7SUFDdEIsaUNBQWtCLENBQUE7SUFDbEIscUNBQXFCLENBQUE7SUFDckIsNEJBQWMsQ0FBQTtBQUNsQixDQUFDLEVBYlcsYUFBYSxHQUFiLHFCQUFhLEtBQWIscUJBQWEsUUFheEI7QUFDRCxTQUFTLDJCQUEyQixDQUFDLE1BQXFCO0lBQ3RELFFBQVEsTUFBTSxFQUFFO1FBQ1osS0FBSyxhQUFhLENBQUMsSUFBSTtZQUNuQixPQUFPLGlCQUFRLENBQUMsSUFBSSxDQUFDO1FBQ3pCLEtBQUssYUFBYSxDQUFDLElBQUk7WUFDbkIsT0FBTyxpQkFBUSxDQUFDLElBQUksQ0FBQztRQUN6QixLQUFLLGFBQWEsQ0FBQyxJQUFJO1lBQ25CLE9BQU8saUJBQVEsQ0FBQyxJQUFJLENBQUM7UUFDekIsS0FBSyxhQUFhLENBQUMsSUFBSTtZQUNuQixPQUFPLGlCQUFRLENBQUMsSUFBSSxDQUFDO1FBQ3pCLEtBQUssYUFBYSxDQUFDLElBQUk7WUFDbkIsT0FBTyxpQkFBUSxDQUFDLElBQUksQ0FB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