"use strict";
/**
 * The `make` module has functions for making new entities in the model.
 * All these functions return the IDs of the entities that are created.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../libs/geo-info/common");
const id_1 = require("../../libs/geo-info/id");
const vectors_1 = require("../../libs/geom/vectors");
const _check_args_1 = require("./_check_args");
const distance_1 = require("../../libs/geom/distance");
// ================================================================================================
/**
 * Adds one or more new position to the model.
 *
 * @param __model__
 * @param coords A list of three numbers, or a list of lists of three numbers.
 * @returns A new position, or nested list of new positions.
 * @example position1 = make.Position([1,2,3])
 * @example_info Creates a position with coordinates x=1, y=2, z=3.
 * @example positions = make.Position([[1,2,3],[3,4,5],[5,6,7]])
 * @example_info Creates three positions, with coordinates [1,2,3],[3,4,5] and [5,6,7].
 * @example_link make.Position.mob&node=1
 */
function Position(__model__, coords) {
    if (id_1.isEmptyArr(coords)) {
        return [];
    }
    // --- Error Check ---
    _check_args_1.checkCommTypes('make.Position', 'coords', coords, [_check_args_1.TypeCheckObj.isCoord, _check_args_1.TypeCheckObj.isCoordList, _check_args_1.TypeCheckObj.isCoordList_List]);
    // --- Error Check ---
    const new_ents_arr = _position(__model__, coords);
    return id_1.idsMake(new_ents_arr);
}
exports.Position = Position;
function _position(__model__, coords) {
    const depth = id_1.getArrDepth(coords);
    if (depth === 1) {
        const coord1 = coords;
        const posi_i = __model__.geom.add.addPosi();
        __model__.attribs.add.setAttribValue(common_1.EEntType.POSI, posi_i, common_1.EAttribNames.COORDS, coord1);
        return [common_1.EEntType.POSI, posi_i];
    }
    else if (depth === 2) {
        const coords2 = coords;
        return coords2.map(coord => _position(__model__, coord));
    }
    else {
        const coords3 = coords;
        return coords3.map(coord2 => _position(__model__, coord2));
    }
}
// ================================================================================================
/**
 * Adds one or more new points to the model.
 *
 * @param __model__
 * @param entities Position, or list of positions, or entities from which positions can be extracted.
 * @returns Entities, new point or a list of new points.
 * @example point1 = make.Point(position1)
 * @example_info Creates a point at position1.
 * @example_link make.Point.mob&node=1
 */
function Point(__model__, entities) {
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('make.Point', 'positions', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList, _check_args_1.IDcheckObj.isIDList_list], [common_1.EEntType.POSI, common_1.EEntType.VERT, common_1.EEntType.EDGE, common_1.EEntType.WIRE,
        common_1.EEntType.FACE, common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON]);
    // --- Error Check ---
    const new_ents_arr = _point(__model__, ents_arr);
    return id_1.idsMake(new_ents_arr);
}
exports.Point = Point;
function _point(__model__, ents_arr) {
    const depth = id_1.getArrDepth(ents_arr);
    if (depth === 1) {
        const [ent_type, index] = ents_arr; // either a posi or something else
        if (ent_type === common_1.EEntType.POSI) {
            const point_i = __model__.geom.add.addPoint(index);
            return [common_1.EEntType.POINT, point_i];
        }
        else {
            const posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
            return posis_i.map(posi_i => _point(__model__, [common_1.EEntType.POSI, posi_i]));
        }
    }
    else if (depth === 2) {
        ents_arr = ents_arr;
        return ents_arr.map(ents_arr_item => _point(__model__, ents_arr_item));
    }
    else { // depth > 2
        ents_arr = ents_arr;
        return ents_arr.map(ents_arr_item => _point(__model__, ents_arr_item));
    }
}
// ================================================================================================
/**
 * Adds one or more new polylines to the model.
 *
 * @param __model__
 * @param entities List or nested lists of positions, or entities from which positions can be extracted.
 * @param close Enum, 'open' or 'close'.
 * @returns Entities, new polyline, or a list of new polylines.
 * @example polyline1 = make.Polyline([position1,position2,position3], close)
 * @example_info Creates a closed polyline with vertices position1, position2, position3 in sequence.
 * @example_link make.Polyline.mob&node=1
 */
function Polyline(__model__, entities, close) {
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('make.Polyline', 'positions', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList, _check_args_1.IDcheckObj.isIDList_list], [common_1.EEntType.POSI, common_1.EEntType.VERT, common_1.EEntType.EDGE, common_1.EEntType.WIRE,
        common_1.EEntType.FACE, common_1.EEntType.PLINE, common_1.EEntType.PGON]);
    // --- Error Check ---
    const posis_arrs = _getPlinePosisFromEnts(__model__, ents_arr);
    const new_ents_arr = _polyline(__model__, posis_arrs, close);
    const depth = id_1.getArrDepth(ents_arr);
    if (depth === 1 || (depth === 2 && ents_arr[0][0] === common_1.EEntType.POSI)) {
        const first_ent = new_ents_arr[0];
        return id_1.idsMake(first_ent);
    }
    else {
        return id_1.idsMake(new_ents_arr);
    }
}
exports.Polyline = Polyline;
// Enums for Polyline()
var _EClose;
(function (_EClose) {
    _EClose["OPEN"] = "open";
    _EClose["CLOSE"] = "close";
})(_EClose = exports._EClose || (exports._EClose = {}));
function _polyline(__model__, ents_arr, close) {
    const depth = id_1.getArrDepth(ents_arr);
    if (depth === 2) {
        const bool_close = (close === _EClose.CLOSE);
        const posis_i = id_1.idIndicies(ents_arr);
        const pline_i = __model__.geom.add.addPline(posis_i, bool_close);
        return [common_1.EEntType.PLINE, pline_i];
    }
    else {
        ents_arr = ents_arr;
        return ents_arr.map(ents_arr_item => _polyline(__model__, ents_arr_item, close));
    }
}
function _getPlinePosisFromEnts(__model__, ents_arr) {
    // check if this is a single object ID
    if (id_1.getArrDepth(ents_arr) === 1) {
        ents_arr = [ents_arr];
    }
    // check if this is a list of posis, verts, or points
    if (id_1.getArrDepth(ents_arr) === 2 && id_1.isDim0(ents_arr[0][0])) {
        const ents_arr2 = [];
        for (const ent_arr of ents_arr) {
            const [ent_type, index] = ent_arr;
            if (ent_type === common_1.EEntType.POSI) {
                ents_arr2.push(ent_arr);
            }
            else {
                const posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
                for (const posi_i of posis_i) {
                    ents_arr2.push([common_1.EEntType.POSI, posi_i]);
                }
            }
        }
        ents_arr = [ents_arr2];
    }
    // now process the ents
    const posis_arrs = [];
    for (const ent_arr of ents_arr) {
        if (id_1.getArrDepth(ent_arr) === 2) { // this must be a list of posis
            posis_arrs.push(ent_arr);
            continue;
        }
        const [ent_type, index] = ent_arr;
        switch (ent_type) {
            case common_1.EEntType.EDGE:
            case common_1.EEntType.WIRE:
            case common_1.EEntType.PLINE:
                const posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
                const posis_arr = posis_i.map(posi_i => [common_1.EEntType.POSI, posi_i]);
                posis_arrs.push(posis_arr);
                break;
            case common_1.EEntType.FACE:
            case common_1.EEntType.PGON:
                const wires_i = __model__.geom.query.navAnyToWire(ent_type, index);
                for (let j = 0; j < wires_i.length; j++) {
                    const wire_i = wires_i[j];
                    const wire_posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.WIRE, wire_i);
                    const wire_posis_arr = wire_posis_i.map(posi_i => [common_1.EEntType.POSI, posi_i]);
                    posis_arrs.push(wire_posis_arr);
                }
                break;
            default:
                break;
        }
    }
    return posis_arrs;
}
// ================================================================================================
/**
 * Adds one or more new polygons to the model.
 *
 * @param __model__
 * @param entities List or nested lists of positions, or entities from which positions can be extracted.
 * @returns Entities, new polygon, or a list of new polygons.
 * @example polygon1 = make.Polygon([pos1,pos2,pos3])
 * @example_info Creates a polygon with vertices pos1, pos2, pos3 in sequence.
 * @example polygons = make.Polygon([[pos1,pos2,pos3], [pos3,pos4,pos5]])
 * @example_info Creates two polygons, the first with vertices at [pos1,pos2,pos3], and the second with vertices at [pos3,pos4,pos5].
 * @example_link make.Polygon.mob&node=1
 */
function Polygon(__model__, entities) {
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('make.Polygon', 'positions', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList, _check_args_1.IDcheckObj.isIDList_list], [common_1.EEntType.POSI, common_1.EEntType.WIRE, common_1.EEntType.FACE, common_1.EEntType.PLINE, common_1.EEntType.PGON]);
    // --- Error Check ---
    const posis_arrs = _getPgonPosisFromEnts(__model__, ents_arr);
    const new_ents_arr = _polygon(__model__, posis_arrs);
    const depth = id_1.getArrDepth(ents_arr);
    if (depth === 1 || (depth === 2 && ents_arr[0][0] === common_1.EEntType.POSI)) {
        const first_ent = new_ents_arr[0];
        return id_1.idsMake(first_ent);
    }
    else {
        return id_1.idsMake(new_ents_arr);
    }
}
exports.Polygon = Polygon;
function _polygon(__model__, ents_arr) {
    const depth = id_1.getArrDepth(ents_arr);
    if (depth === 2) {
        const posis_i = id_1.idIndicies(ents_arr);
        const pgon_i = __model__.geom.add.addPgon(posis_i);
        return [common_1.EEntType.PGON, pgon_i];
    }
    else {
        ents_arr = ents_arr;
        return ents_arr.map(ents_arr_item => _polygon(__model__, ents_arr_item));
    }
}
function _getPgonPosisFromEnts(__model__, ents_arr) {
    // check if this is a single object ID
    if (id_1.getArrDepth(ents_arr) === 1) {
        ents_arr = [ents_arr];
    }
    // check if this is a list of posis
    if (id_1.getArrDepth(ents_arr) === 2 && ents_arr[0][0] === common_1.EEntType.POSI) {
        // ents_arr =  [ents_arr] as TEntTypeIdx[][];
        const ents_arr2 = [];
        for (const ent_arr of ents_arr) {
            const [ent_type, index] = ent_arr;
            if (ent_type === common_1.EEntType.POSI) {
                ents_arr2.push(ent_arr);
            }
            else {
                const posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
                for (const posi_i of posis_i) {
                    ents_arr2.push([common_1.EEntType.POSI, posi_i]);
                }
            }
        }
        ents_arr = [ents_arr2];
    }
    // now process the ents
    const posis_arrs = [];
    for (const ent_arr of ents_arr) {
        if (id_1.getArrDepth(ent_arr) === 2) { // this must be a list of posis
            posis_arrs.push(ent_arr);
            continue;
        }
        const [ent_type, index] = ent_arr;
        switch (ent_type) {
            case common_1.EEntType.WIRE:
            case common_1.EEntType.PLINE:
                const posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
                const posis_arr = posis_i.map(posi_i => [common_1.EEntType.POSI, posi_i]);
                posis_arrs.push(posis_arr);
                break;
            case common_1.EEntType.FACE:
            case common_1.EEntType.PGON:
                const wires_i = __model__.geom.query.navAnyToWire(ent_type, index);
                for (let j = 0; j < wires_i.length; j++) {
                    const wire_i = wires_i[j];
                    const wire_posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.WIRE, wire_i);
                    const wire_posis_arr = wire_posis_i.map(posi_i => [common_1.EEntType.POSI, posi_i]);
                    posis_arrs.push(wire_posis_arr);
                }
                break;
            default:
                break;
        }
    }
    return posis_arrs;
}
// ================================================================================================
/**
 * Adds one or more new collections to the model.
 *
 * @param __model__
 * @param parent_coll Collection, the parent collection or null.
 * @param entities List or nested lists of points, polylines, polygons.
 * @returns Entities, new collection, or a list of new collections.
 * @example collection1 = make.Collection([point1,polyine1,polygon1])
 * @example_info Creates a collection containing point1, polyline1, polygon1.
 * @example collections = make.Collection([[point1,polyine1],[polygon1]])
 * @example_info Creates two collections, the first containing point1 and polyline1, the second containing polygon1.
 * @example_link make.Collection.mob&node=1
 */
function Collection(__model__, parent_coll, entities) {
    // --- Error Check ---
    const fn_name = 'make.Collection';
    let parent_index;
    if (parent_coll !== null && parent_coll !== undefined) {
        const parent_ent_arr = _check_args_1.checkIDs(fn_name, 'parent_coll', parent_coll, [_check_args_1.IDcheckObj.isID], [common_1.EEntType.COLL]);
        parent_index = parent_ent_arr[1];
    }
    else {
        parent_index = -1;
    }
    const ents_arr = _check_args_1.checkIDs(fn_name, 'objects', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList, _check_args_1.IDcheckObj.isIDList_list], [common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON]);
    // --- Error Check ---
    const new_ent_arr = _collection(__model__, parent_index, ents_arr);
    return id_1.idsMake(new_ent_arr);
}
exports.Collection = Collection;
function _collection(__model__, parent_index, ents_arr) {
    const depth = id_1.getArrDepth(ents_arr);
    if (depth === 1) {
        ents_arr = [ents_arr];
    }
    else if (depth === 3) {
        ents_arr = ents_arr;
        return ents_arr.map(ents_arr_item => _collection(__model__, parent_index, ents_arr_item));
    }
    const points = [];
    const plines = [];
    const pgons = [];
    for (const ent_arr of ents_arr) {
        if (id_1.isPoint(ent_arr[0])) {
            points.push(ent_arr[1]);
        }
        if (id_1.isPline(ent_arr[0])) {
            plines.push(ent_arr[1]);
        }
        if (id_1.isPgon(ent_arr[0])) {
            pgons.push(ent_arr[1]);
        }
    }
    const coll_i = __model__.geom.add.addColl(parent_index, points, plines, pgons);
    return [common_1.EEntType.COLL, coll_i];
}
exports._collection = _collection;
// ================================================================================================
/**
 * Adds a new copy of specified entities to the model.
 *
 * @param __model__
 * @param entities Entity or lists of entities to be copied. Entities can be positions, points, polylines, polygons and collections.
 * @returns Entities, the copied entity or a list of copied entities.
 * @example copies = make.Copy([position1,polyine1,polygon1])
 * @example_info Creates a copy of position1, polyine1, and polygon1.
 */
function Copy(__model__, entities) {
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('make.Copy', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList, , _check_args_1.IDcheckObj.isIDList_list], [common_1.EEntType.POSI, common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON, common_1.EEntType.COLL]);
    // --- Error Check ---
    const bool_copy_attribs = true;
    // copy the list of entities
    const new_ents_arr = _copyGeom(__model__, ents_arr, bool_copy_attribs);
    // copy the positions that belong to the list of entities
    _copyGeomPosis(__model__, new_ents_arr, bool_copy_attribs);
    // return only the new entities
    return id_1.idsMake(new_ents_arr);
}
exports.Copy = Copy;
function _copyGeom(__model__, ents_arr, copy_attributes) {
    const depth = id_1.getArrDepth(ents_arr);
    if (depth === 1) {
        const [ent_type, index] = ents_arr;
        if (id_1.isColl(ent_type)) {
            const coll_i = __model__.geom.add.copyColls(index, copy_attributes);
            return [ent_type, coll_i];
        }
        else if (id_1.isPgon(ent_type)) {
            const obj_i = __model__.geom.add.copyPgons(index, copy_attributes);
            return [ent_type, obj_i];
        }
        else if (id_1.isPline(ent_type)) {
            const obj_i = __model__.geom.add.copyPlines(index, copy_attributes);
            return [ent_type, obj_i];
        }
        else if (id_1.isPoint(ent_type)) {
            const obj_i = __model__.geom.add.copyPoints(index, copy_attributes);
            return [ent_type, obj_i];
        }
        else if (id_1.isPosi(ent_type)) {
            const posi_i = __model__.geom.add.copyPosis(index, copy_attributes);
            return [ent_type, posi_i];
        }
    }
    else if (depth === 2) {
        ents_arr = ents_arr;
        return ents_arr.map(ents_arr_item => _copyGeom(__model__, ents_arr_item, copy_attributes));
    }
    else { // depth > 2
        ents_arr = ents_arr;
        return ents_arr.map(ents_arr_item => _copyGeom(__model__, ents_arr_item, copy_attributes));
    }
}
function _copyGeomPosis(__model__, ents_arr, copy_attributes) {
    const depth = id_1.getArrDepth(ents_arr);
    if (depth === 1) {
        ents_arr = [ents_arr];
    }
    else if (depth > 2) {
        // @ts-ignore
        ents_arr = ents_arr.flat(depth - 2);
    }
    // create the new positions
    const old_to_new_posis_i_map = new Map(); // count number of posis
    for (const ent_arr of ents_arr) {
        const [ent_type, index] = ent_arr;
        if (!id_1.isPosi(ent_type)) { // obj or coll
            const old_posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
            const ent_new_posis_i = [];
            for (const old_posi_i of old_posis_i) {
                let new_posi_i;
                if (old_to_new_posis_i_map.has(old_posi_i)) {
                    new_posi_i = old_to_new_posis_i_map.get(old_posi_i);
                }
                else {
                    new_posi_i = __model__.geom.add.copyPosis(old_posi_i, copy_attributes);
                    old_to_new_posis_i_map.set(old_posi_i, new_posi_i);
                }
                ent_new_posis_i.push(new_posi_i);
            }
            __model__.geom.modify.replacePosis(ent_type, index, ent_new_posis_i);
        }
    }
    // return all the new points
    // const all_new_posis_i: number[] = Array.from(old_to_new_posis_i_map.values());
    // return all_new_posis_i.map( posi_i => [EEntType.POSI, posi_i] ) as TEntTypeIdx[];
}
// ================================================================================================
/**
 * Makes one or more holes in a polygon.
 * ~
 * The positions must be on the polygon, i.e. they must be co-planar with the polygon and
 * they must be within the boundary of the polygon.
 * ~
 * If the list of positions consists of a single list, then one hole will be generated.
 * If the list of positions consists of a list of lists, then multiple holes will be generated.
 * ~
 * @param __model__
 * @param face A face or polygon to make holes in.
 * @param entities List of positions, or nested lists of positions, or entities from which positions can be extracted.
 * @returns Entities, a list of wires resulting from the hole(s).
 */
function Hole(__model__, face, entities) {
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    if (!Array.isArray(entities)) {
        entities = [entities];
    }
    // --- Error Check ---
    const face_ent_arr = _check_args_1.checkIDs('make.Hole', 'face', face, [_check_args_1.IDcheckObj.isID], [common_1.EEntType.FACE, common_1.EEntType.PGON]);
    const holes_ents_arr = _check_args_1.checkIDs('make.Hole', 'positions', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList, _check_args_1.IDcheckObj.isIDList_list], [common_1.EEntType.POSI, common_1.EEntType.WIRE, common_1.EEntType.FACE, common_1.EEntType.PLINE, common_1.EEntType.PGON]);
    // --- Error Check ---
    _getHolePosisFromEnts(__model__, holes_ents_arr);
    const new_ents_arr = _hole(__model__, face_ent_arr, holes_ents_arr);
    return id_1.idsMake(new_ents_arr);
}
exports.Hole = Hole;
// Hole modelling operation
function _hole(__model__, face_ent_arr, holes_ents_arr) {
    if (id_1.getArrDepth(holes_ents_arr) === 2) {
        holes_ents_arr = [holes_ents_arr];
    }
    // convert the holes to lists of posis_i
    const holes_posis_i = [];
    for (const hole_ents_arr of holes_ents_arr) {
        holes_posis_i.push(hole_ents_arr.map(ent_arr => ent_arr[1]));
    }
    // create the hole
    const wires_i = __model__.geom.modify.cutFaceHoles(face_ent_arr[1], holes_posis_i);
    return wires_i.map(wire_i => [common_1.EEntType.WIRE, wire_i]);
}
function _getHolePosisFromEnts(__model__, ents_arr) {
    for (let i = 0; i < ents_arr.length; i++) {
        const depth = id_1.getArrDepth(ents_arr[i]);
        if (depth === 1) {
            const [ent_type, index] = ents_arr[i];
            switch (ent_type) {
                case common_1.EEntType.WIRE:
                case common_1.EEntType.PLINE:
                    const posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
                    const posis_arr = posis_i.map(posi_i => [common_1.EEntType.POSI, posi_i]);
                    Array.prototype.splice.apply(ents_arr, [i, 1, posis_arr]); // TODO
                    break;
                case common_1.EEntType.FACE:
                case common_1.EEntType.PGON:
                    // ignore holes, so only take the first wire
                    const wires_i = __model__.geom.query.navAnyToWire(ent_type, index);
                    const wire_i = wires_i[0];
                    const wire_posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.WIRE, wire_i);
                    const wire_posis_arr = wire_posis_i.map(posi_i => [common_1.EEntType.POSI, posi_i]);
                    Array.prototype.splice.apply(ents_arr, [i, 1, wire_posis_arr]); // TODO
                    break;
                default:
                    break;
            }
        }
    }
}
// ================================================================================================
/**
 * Lofts between entities.
 * ~
 * The geometry that is generated depends on the method that is selected.
 * - The 'quads' methods will generate polygons.
 * - The 'stringers' and 'ribs' methods will generate polylines.
 * - The 'copies' method will generate copies of the input geometry type.
 *
 * @param __model__
 * @param entities List of entities, or list of lists of entities.
 * @param method Enum, if 'closed', then close the loft back to the first entity in the list.
 * @returns Entities, a list of new polygons or polylines resulting from the loft.
 * @example quads = make.Loft([polyline1,polyline2,polyline3], 1, 'open_quads')
 * @example_info Creates quad polygons lofting between polyline1, polyline2, polyline3.
 * @example quads = make.Loft([polyline1,polyline2,polyline3], 1, 'closed_quads')
 * @example_info Creates quad polygons lofting between polyline1, polyline2, polyline3, and back to polyline1.
 * @example quads = make.Loft([ [polyline1,polyline2], [polyline3,polyline4] ] , 1, 'open_quads')
 * @example_info Creates quad polygons lofting first between polyline1 and polyline2, and then between polyline3 and polyline4.
 */
function Loft(__model__, entities, divisions, method) {
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('make.Loft', 'entities', entities, [_check_args_1.IDcheckObj.isIDList, _check_args_1.IDcheckObj.isIDList_list], [common_1.EEntType.EDGE, common_1.EEntType.WIRE, common_1.EEntType.FACE, common_1.EEntType.PLINE, common_1.EEntType.PGON]);
    // --- Error Check ---
    const new_ents_arr = _loft(__model__, ents_arr, divisions, method);
    return id_1.idsMake(new_ents_arr);
}
exports.Loft = Loft;
var _ELoftMethod;
(function (_ELoftMethod) {
    _ELoftMethod["OPEN_QUADS"] = "open_quads";
    _ELoftMethod["CLOSED_QUADS"] = "closed_quads";
    _ELoftMethod["OPEN_STRINGERS"] = "open_stringers";
    _ELoftMethod["CLOSED_STRINGERS"] = "closed_stringers";
    _ELoftMethod["OPEN_RIBS"] = "open_ribs";
    _ELoftMethod["CLOSED_RIBS"] = "closed_ribs";
    _ELoftMethod["COPIES"] = "copies";
})(_ELoftMethod = exports._ELoftMethod || (exports._ELoftMethod = {}));
function _loftQuads(__model__, ents_arr, divisions, method) {
    const edges_arrs_i = [];
    let num_edges = 0;
    for (const ents of ents_arr) {
        const [ent_type, index] = ents;
        const edges_i = __model__.geom.query.navAnyToEdge(ent_type, index);
        if (edges_arrs_i.length === 0) {
            num_edges = edges_i.length;
        }
        if (edges_i.length !== num_edges) {
            throw new Error('make.Loft: Number of edges is not consistent.');
        }
        edges_arrs_i.push(edges_i);
    }
    if (method === _ELoftMethod.CLOSED_QUADS) {
        edges_arrs_i.push(edges_arrs_i[0]);
    }
    const new_pgons_i = [];
    for (let i = 0; i < edges_arrs_i.length - 1; i++) {
        const edges_i_a = edges_arrs_i[i];
        const edges_i_b = edges_arrs_i[i + 1];
        if (divisions > 0) {
            const strip_posis_map = new Map();
            for (let j = 0; j < num_edges; j++) {
                const edge_i_a = edges_i_a[j];
                const edge_i_b = edges_i_b[j];
                // get exist two posis_i
                const exist_posis_a_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edge_i_a);
                const exist_posis_b_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edge_i_b);
                // create the new posis strip if necessary
                for (const k of [0, 1]) {
                    if (strip_posis_map.get(exist_posis_a_i[k]) === undefined) {
                        const xyz_a = __model__.attribs.query.getPosiCoords(exist_posis_a_i[k]);
                        const xyz_b = __model__.attribs.query.getPosiCoords(exist_posis_b_i[k]);
                        const extrude_vec_div = vectors_1.vecDiv(vectors_1.vecFromTo(xyz_a, xyz_b), divisions);
                        const strip_posis_i = [exist_posis_a_i[k]];
                        for (let d = 1; d < divisions; d++) {
                            const strip_posi_i = __model__.geom.add.addPosi();
                            const move_xyz = vectors_1.vecMult(extrude_vec_div, d);
                            __model__.attribs.add.setPosiCoords(strip_posi_i, vectors_1.vecAdd(xyz_a, move_xyz));
                            strip_posis_i.push(strip_posi_i);
                        }
                        strip_posis_i.push(exist_posis_b_i[k]);
                        strip_posis_map.set(exist_posis_a_i[k], strip_posis_i);
                    }
                }
                // get the two strips and make polygons
                const strip1_posis_i = strip_posis_map.get(exist_posis_a_i[0]);
                const strip2_posis_i = strip_posis_map.get(exist_posis_a_i[1]);
                for (let k = 0; k < strip1_posis_i.length - 1; k++) {
                    const c1 = strip1_posis_i[k];
                    const c2 = strip2_posis_i[k];
                    const c3 = strip2_posis_i[k + 1];
                    const c4 = strip1_posis_i[k + 1];
                    const pgon_i = __model__.geom.add.addPgon([c1, c2, c3, c4]);
                    new_pgons_i.push(pgon_i);
                }
            }
        }
        else {
            for (let j = 0; j < num_edges; j++) {
                const posis_i_a = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edges_i_a[j]);
                const posis_i_b = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edges_i_b[j]);
                const pgon_i = __model__.geom.add.addPgon([posis_i_a[0], posis_i_a[1], posis_i_b[1], posis_i_b[0]]);
                new_pgons_i.push(pgon_i);
            }
        }
    }
    return new_pgons_i.map(pgon_i => [common_1.EEntType.PGON, pgon_i]);
}
function _loftStringers(__model__, ents_arr, divisions, method) {
    const posis_arrs_i = [];
    let num_posis = 0;
    for (const ents of ents_arr) {
        const [ent_type, index] = ents;
        const posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
        if (posis_arrs_i.length === 0) {
            num_posis = posis_i.length;
        }
        if (posis_i.length !== num_posis) {
            throw new Error('make.Loft: Number of positions is not consistent.');
        }
        posis_arrs_i.push(posis_i);
    }
    const is_closed = method === _ELoftMethod.CLOSED_STRINGERS;
    if (is_closed) {
        posis_arrs_i.push(posis_arrs_i[0]);
    }
    const stringer_plines_i = [];
    for (let i = 0; i < num_posis; i++) {
        const stringer_posis_i = [];
        for (let j = 0; j < posis_arrs_i.length - 1; j++) {
            stringer_posis_i.push(posis_arrs_i[j][i]);
            if (divisions > 0) {
                const xyz1 = __model__.attribs.query.getPosiCoords(posis_arrs_i[j][i]);
                const xyz2 = __model__.attribs.query.getPosiCoords(posis_arrs_i[j + 1][i]);
                const vec = vectors_1.vecDiv(vectors_1.vecFromTo(xyz1, xyz2), divisions);
                for (let k = 1; k < divisions; k++) {
                    const new_xyz = vectors_1.vecAdd(xyz1, vectors_1.vecMult(vec, k));
                    const new_posi_i = __model__.geom.add.addPosi();
                    __model__.attribs.add.setPosiCoords(new_posi_i, new_xyz);
                    stringer_posis_i.push(new_posi_i);
                }
            }
        }
        if (!is_closed) {
            stringer_posis_i.push(posis_arrs_i[posis_arrs_i.length - 1][i]);
        }
        const pline_i = __model__.geom.add.addPline(stringer_posis_i, is_closed);
        stringer_plines_i.push(pline_i);
    }
    return stringer_plines_i.map(pline_i => [common_1.EEntType.PLINE, pline_i]);
}
function _loftRibs(__model__, ents_arr, divisions, method) {
    const posis_arrs_i = [];
    let num_posis = 0;
    for (const ents of ents_arr) {
        const [ent_type, index] = ents;
        const posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
        if (posis_arrs_i.length === 0) {
            num_posis = posis_i.length;
        }
        if (posis_i.length !== num_posis) {
            throw new Error('make.Loft: Number of positions is not consistent.');
        }
        posis_arrs_i.push(posis_i);
    }
    const is_closed = method === _ELoftMethod.CLOSED_RIBS;
    if (is_closed) {
        posis_arrs_i.push(posis_arrs_i[0]);
    }
    let ribs_is_closed = false;
    switch (ents_arr[0][0]) { // check if the first entity is closed
        case common_1.EEntType.PGON:
        case common_1.EEntType.FACE:
            ribs_is_closed = true;
            break;
        case common_1.EEntType.PLINE:
            const wire_i = __model__.geom.query.navPlineToWire(ents_arr[0][1]);
            ribs_is_closed = __model__.geom.query.istWireClosed(wire_i);
            break;
        case common_1.EEntType.WIRE:
            ribs_is_closed = __model__.geom.query.istWireClosed(ents_arr[0][1]);
            break;
        default:
            break;
    }
    const rib_plines_i = [];
    for (let i = 0; i < posis_arrs_i.length - 1; i++) {
        const pline_i = __model__.geom.add.addPline(posis_arrs_i[i], ribs_is_closed);
        rib_plines_i.push(pline_i);
        if (divisions > 0) {
            const xyzs1 = posis_arrs_i[i].map(posi_i => __model__.attribs.query.getPosiCoords(posi_i));
            const xyzs2 = posis_arrs_i[i + 1].map(posi_i => __model__.attribs.query.getPosiCoords(posi_i));
            const vecs = [];
            for (let k = 0; k < num_posis; k++) {
                const vec = vectors_1.vecDiv(vectors_1.vecFromTo(xyzs1[k], xyzs2[k]), divisions);
                vecs.push(vec);
            }
            for (let j = 1; j < divisions; j++) {
                const rib_posis_i = [];
                for (let k = 0; k < num_posis; k++) {
                    const new_xyz = vectors_1.vecAdd(xyzs1[k], vectors_1.vecMult(vecs[k], j));
                    const new_posi_i = __model__.geom.add.addPosi();
                    __model__.attribs.add.setPosiCoords(new_posi_i, new_xyz);
                    rib_posis_i.push(new_posi_i);
                }
                const new_rib_pline_i = __model__.geom.add.addPline(rib_posis_i, ribs_is_closed);
                rib_plines_i.push(new_rib_pline_i);
            }
        }
    }
    if (!is_closed) {
        const pline_i = __model__.geom.add.addPline(posis_arrs_i[posis_arrs_i.length - 1], ribs_is_closed);
        rib_plines_i.push(pline_i);
    }
    return rib_plines_i.map(pline_i => [common_1.EEntType.PLINE, pline_i]);
}
function _loftCopies(__model__, ents_arr, divisions) {
    const posis_arrs_i = [];
    let num_posis = 0;
    for (const ents of ents_arr) {
        const [ent_type, index] = ents;
        const posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
        if (posis_arrs_i.length === 0) {
            num_posis = posis_i.length;
        }
        if (posis_i.length !== num_posis) {
            throw new Error('make.Loft: Number of positions is not consistent.');
        }
        posis_arrs_i.push(posis_i);
    }
    const copies = [];
    for (let i = 0; i < posis_arrs_i.length - 1; i++) {
        copies.push(ents_arr[i]);
        if (divisions > 0) {
            const xyzs1 = posis_arrs_i[i].map(posi_i => __model__.attribs.query.getPosiCoords(posi_i));
            const xyzs2 = posis_arrs_i[i + 1].map(posi_i => __model__.attribs.query.getPosiCoords(posi_i));
            const vecs = [];
            for (let k = 0; k < num_posis; k++) {
                const vec = vectors_1.vecDiv(vectors_1.vecFromTo(xyzs1[k], xyzs2[k]), divisions);
                vecs.push(vec);
            }
            for (let j = 1; j < divisions; j++) {
                const lofted_ent_arr = _copyGeom(__model__, ents_arr[i], true);
                _copyGeomPosis(__model__, lofted_ent_arr, true);
                const [lofted_ent_type, lofted_ent_i] = lofted_ent_arr;
                const new_posis_i = __model__.geom.query.navAnyToPosi(lofted_ent_type, lofted_ent_i);
                for (let k = 0; k < num_posis; k++) {
                    const new_xyz = vectors_1.vecAdd(xyzs1[k], vectors_1.vecMult(vecs[k], j));
                    __model__.attribs.add.setPosiCoords(new_posis_i[k], new_xyz);
                }
                copies.push(lofted_ent_arr);
            }
        }
    }
    copies.push(ents_arr[ents_arr.length - 1]);
    return copies;
}
function _loft(__model__, ents_arrs, divisions, method) {
    const depth = id_1.getArrDepth(ents_arrs);
    if (depth === 2) {
        const ents_arr = ents_arrs;
        switch (method) {
            case _ELoftMethod.OPEN_QUADS:
            case _ELoftMethod.CLOSED_QUADS:
                return _loftQuads(__model__, ents_arr, divisions, method);
            case _ELoftMethod.OPEN_STRINGERS:
            case _ELoftMethod.CLOSED_STRINGERS:
                return _loftStringers(__model__, ents_arr, divisions, method);
            case _ELoftMethod.OPEN_RIBS:
            case _ELoftMethod.CLOSED_RIBS:
                return _loftRibs(__model__, ents_arr, divisions, method);
            case _ELoftMethod.COPIES:
                return _loftCopies(__model__, ents_arr, divisions);
            default:
                break;
        }
    }
    else if (depth === 3) {
        const all_loft_ents = [];
        for (const ents_arr of ents_arrs) {
            const loft_ents = _loft(__model__, ents_arr, divisions, method);
            loft_ents.forEach(loft_ent => all_loft_ents.push(loft_ent));
        }
        return all_loft_ents;
    }
}
// ================================================================================================
/**
 * Extrudes geometry by distance or by vector.
 * - Extrusion of a position, vertex, or point produces polylines;
 * - Extrusion of an edge, wire, or polyline produces polygons;
 * - Extrusion of a face or polygon produces polygons, capped at the top.
 * ~
 * The geometry that is generated depends on the method that is selected.
 * - The 'quads' methods will generate polygons.
 * - The 'stringers' and 'ribs' methods will generate polylines.
 * - The 'copies' method will generate copies of the input geometry type.
 * ~
 * @param __model__
 * @param entities Vertex, edge, wire, face, position, point, polyline, polygon, collection.
 * @param distance Number or vector. If number, assumed to be [0,0,value] (i.e. extrusion distance in z-direction).
 * @param divisions Number of divisions to divide extrusion by. Minimum is 1.
 * @param method Enum, when extruding edges, select quads, stringers, or ribs
 * @returns Entities, a list of new polygons or polylines resulting from the extrude.
 * @example extrusion1 = make.Extrude(point1, 10, 2, 'quads')
 * @example_info Creates a polyline of total length 10 (with two edges of length 5 each) in the z-direction.
 * In this case, the 'quads' setting is ignored.
 * @example extrusion2 = make.Extrude(polygon1, [0,5,0], 1, 'quads')
 * @example_info Extrudes polygon1 by 5 in the y-direction, creating a list of quad surfaces.
 */
function Extrude(__model__, entities, distance, divisions, method) {
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    const fn_name = 'make.Extrude';
    const ents_arr = _check_args_1.checkIDs(fn_name, 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.VERT, common_1.EEntType.EDGE, common_1.EEntType.WIRE, common_1.EEntType.FACE,
        common_1.EEntType.POSI, common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON, common_1.EEntType.COLL]);
    _check_args_1.checkCommTypes(fn_name, 'dist', distance, [_check_args_1.TypeCheckObj.isNumber, _check_args_1.TypeCheckObj.isVector]);
    _check_args_1.checkCommTypes(fn_name, 'divisions', divisions, [_check_args_1.TypeCheckObj.isInt]);
    // --- Error Check ---
    const new_ents_arr = _extrude(__model__, ents_arr, distance, divisions, method);
    if (!Array.isArray(entities) && new_ents_arr.length === 1) {
        return id_1.idsMake(new_ents_arr[0]);
    }
    else {
        return id_1.idsMake(new_ents_arr);
    }
}
exports.Extrude = Extrude;
var _EExtrudeMethod;
(function (_EExtrudeMethod) {
    _EExtrudeMethod["QUADS"] = "quads";
    _EExtrudeMethod["STRINGERS"] = "stringers";
    _EExtrudeMethod["RIBS"] = "ribs";
    _EExtrudeMethod["COPIES"] = "copies";
})(_EExtrudeMethod = exports._EExtrudeMethod || (exports._EExtrudeMethod = {}));
function _extrudeColl(__model__, index, extrude_vec, divisions, method) {
    const points_i = __model__.geom.query.navCollToPoint(index);
    const res1 = points_i.map(point_i => _extrude(__model__, [common_1.EEntType.POINT, point_i], extrude_vec, divisions, method));
    const plines_i = __model__.geom.query.navCollToPline(index);
    const res2 = plines_i.map(pline_i => _extrude(__model__, [common_1.EEntType.PLINE, pline_i], extrude_vec, divisions, method));
    const pgons_i = __model__.geom.query.navCollToPgon(index);
    const res3 = pgons_i.map(pgon_i => _extrude(__model__, [common_1.EEntType.PGON, pgon_i], extrude_vec, divisions, method));
    return [].concat(res1, res2, res3);
}
function _extrudeDim0(__model__, ent_type, index, extrude_vec, divisions) {
    const extrude_vec_div = vectors_1.vecDiv(extrude_vec, divisions);
    const exist_posi_i = __model__.geom.query.navAnyToPosi(ent_type, index)[0];
    const xyz = __model__.attribs.query.getPosiCoords(exist_posi_i);
    const strip_posis_i = [exist_posi_i];
    for (let i = 1; i < divisions + 1; i++) {
        const strip_posi_i = __model__.geom.add.addPosi();
        const move_xyz = vectors_1.vecMult(extrude_vec_div, i);
        __model__.attribs.add.setPosiCoords(strip_posi_i, vectors_1.vecAdd(xyz, move_xyz));
        strip_posis_i.push(strip_posi_i);
    }
    // loft between the positions and create a single polyline
    const pline_i = __model__.geom.add.addPline(strip_posis_i);
    return [[common_1.EEntType.PLINE, pline_i]];
}
function _extrudeQuads(__model__, ent_type, index, extrude_vec, divisions) {
    const new_pgons_i = [];
    const extrude_vec_div = vectors_1.vecDiv(extrude_vec, divisions);
    const edges_i = __model__.geom.query.navAnyToEdge(ent_type, index);
    const strip_posis_map = new Map();
    for (const edge_i of edges_i) {
        // get exist posis_i
        const exist_posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edge_i);
        // create the new posis strip if necessary
        for (const exist_posi_i of exist_posis_i) {
            if (strip_posis_map.get(exist_posi_i) === undefined) {
                const xyz = __model__.attribs.query.getPosiCoords(exist_posi_i);
                const strip_posis_i = [exist_posi_i];
                for (let i = 1; i < divisions + 1; i++) {
                    const strip_posi_i = __model__.geom.add.addPosi();
                    const move_xyz = vectors_1.vecMult(extrude_vec_div, i);
                    __model__.attribs.add.setPosiCoords(strip_posi_i, vectors_1.vecAdd(xyz, move_xyz));
                    strip_posis_i.push(strip_posi_i);
                }
                strip_posis_map.set(exist_posi_i, strip_posis_i);
            }
        }
        // get the two strips and make polygons
        const strip1_posis_i = strip_posis_map.get(exist_posis_i[0]);
        const strip2_posis_i = strip_posis_map.get(exist_posis_i[1]);
        for (let i = 0; i < strip1_posis_i.length - 1; i++) {
            const c1 = strip1_posis_i[i];
            const c2 = strip2_posis_i[i];
            const c3 = strip2_posis_i[i + 1];
            const c4 = strip1_posis_i[i + 1];
            const pgon_i = __model__.geom.add.addPgon([c1, c2, c3, c4]);
            new_pgons_i.push(pgon_i);
        }
    }
    // cap the top
    if (id_1.isDim2(ent_type)) { // create a top -> polygon
        const face_i = id_1.isFace(ent_type) ? index : __model__.geom.query.navPgonToFace(index);
        const cap_pgon_i = _extrudeCap(__model__, face_i, strip_posis_map, divisions);
        new_pgons_i.push(cap_pgon_i);
    }
    return new_pgons_i.map(pgon_i => [common_1.EEntType.PGON, pgon_i]);
}
function _extrudeStringers(__model__, ent_type, index, extrude_vec, divisions) {
    const new_plines_i = [];
    const extrude_vec_div = vectors_1.vecDiv(extrude_vec, divisions);
    const edges_i = __model__.geom.query.navAnyToEdge(ent_type, index);
    const strip_posis_map = new Map();
    for (const edge_i of edges_i) {
        // get exist posis_i
        const exist_posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edge_i);
        // create the new posis strip if necessary
        for (const exist_posi_i of exist_posis_i) {
            if (strip_posis_map.get(exist_posi_i) === undefined) {
                const xyz = __model__.attribs.query.getPosiCoords(exist_posi_i);
                const strip_posis_i = [exist_posi_i];
                for (let i = 1; i < divisions + 1; i++) {
                    const strip_posi_i = __model__.geom.add.addPosi();
                    const move_xyz = vectors_1.vecMult(extrude_vec_div, i);
                    __model__.attribs.add.setPosiCoords(strip_posi_i, vectors_1.vecAdd(xyz, move_xyz));
                    strip_posis_i.push(strip_posi_i);
                }
                strip_posis_map.set(exist_posi_i, strip_posis_i);
            }
        }
    }
    // make the stringers
    strip_posis_map.forEach(strip_posis_i => {
        const pline_i = __model__.geom.add.addPline(strip_posis_i);
        new_plines_i.push(pline_i);
    });
    // return the stringers
    return new_plines_i.map(pline_i => [common_1.EEntType.PLINE, pline_i]);
}
function _extrudeRibs(__model__, ent_type, index, extrude_vec, divisions) {
    const new_plines_i = [];
    const extrude_vec_div = vectors_1.vecDiv(extrude_vec, divisions);
    const edges_i = __model__.geom.query.navAnyToEdge(ent_type, index);
    const strip_posis_map = new Map();
    for (const edge_i of edges_i) {
        // get exist posis_i
        const exist_posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edge_i);
        // create the new posis strip if necessary
        for (const exist_posi_i of exist_posis_i) {
            if (strip_posis_map.get(exist_posi_i) === undefined) {
                const xyz = __model__.attribs.query.getPosiCoords(exist_posi_i);
                const strip_posis_i = [exist_posi_i];
                for (let i = 1; i < divisions + 1; i++) {
                    const strip_posi_i = __model__.geom.add.addPosi();
                    const move_xyz = vectors_1.vecMult(extrude_vec_div, i);
                    __model__.attribs.add.setPosiCoords(strip_posi_i, vectors_1.vecAdd(xyz, move_xyz));
                    strip_posis_i.push(strip_posi_i);
                }
                strip_posis_map.set(exist_posi_i, strip_posis_i);
            }
        }
    }
    // make an array of ents to process as ribs
    let ribs_is_closed = false;
    const ribs_posis_i = [];
    switch (ent_type) { // check if the entity is closed
        case common_1.EEntType.PGON:
        case common_1.EEntType.FACE:
            ribs_is_closed = true;
            const face_wires_i = __model__.geom.query.navAnyToWire(ent_type, index);
            for (const face_wire_i of face_wires_i) {
                const face_wire_posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.WIRE, face_wire_i);
                ribs_posis_i.push(face_wire_posis_i);
            }
            break;
        case common_1.EEntType.PLINE:
            const pline_wire_i = __model__.geom.query.navPlineToWire(index);
            const pline_wire_posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.WIRE, pline_wire_i);
            ribs_posis_i.push(pline_wire_posis_i);
            ribs_is_closed = __model__.geom.query.istWireClosed(pline_wire_i);
            break;
        case common_1.EEntType.WIRE:
            const wire_posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.WIRE, index);
            ribs_posis_i.push(wire_posis_i);
            ribs_is_closed = __model__.geom.query.istWireClosed(index);
            break;
        default:
            const posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
            ribs_posis_i.push(posis_i);
            break;
    }
    // make the ribs
    for (let i = 0; i < divisions + 1; i++) {
        for (const rib_posis_i of ribs_posis_i) {
            const mapped_rib_posis_i = rib_posis_i.map(rib_posi_i => strip_posis_map.get(rib_posi_i)[i]);
            const pline_i = __model__.geom.add.addPline(mapped_rib_posis_i, ribs_is_closed);
            new_plines_i.push(pline_i);
        }
    }
    // return the ribs
    return new_plines_i.map(pline_i => [common_1.EEntType.PLINE, pline_i]);
}
function _extrudeCopies(__model__, ent_type, index, extrude_vec, divisions) {
    const copies = [[ent_type, index]];
    const vec = vectors_1.vecDiv(extrude_vec, divisions);
    const posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
    const xyzs = posis_i.map(posi_i => __model__.attribs.query.getPosiCoords(posi_i));
    // make the copies
    for (let i = 1; i < divisions + 1; i++) {
        const extruded_ent_arr = _copyGeom(__model__, [ent_type, index], true);
        _copyGeomPosis(__model__, extruded_ent_arr, true);
        const [extruded_ent_type, extruded_ent_i] = extruded_ent_arr;
        const new_posis_i = __model__.geom.query.navAnyToPosi(extruded_ent_type, extruded_ent_i);
        for (let j = 0; j < new_posis_i.length; j++) {
            const new_xyz = vectors_1.vecAdd(xyzs[j], vectors_1.vecMult(vec, i));
            __model__.attribs.add.setPosiCoords(new_posis_i[j], new_xyz);
        }
        copies.push(extruded_ent_arr);
    }
    // return the copies
    return copies;
}
function _extrudeCap(__model__, index, strip_posis_map, divisions) {
    const face_i = __model__.geom.query.navPgonToFace(index);
    // get positions on boundary
    const old_wire_i = __model__.geom.query.getFaceBoundary(face_i);
    const old_posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.WIRE, old_wire_i);
    const new_posis_i = old_posis_i.map(old_posi_i => strip_posis_map.get(old_posi_i)[divisions]);
    // get positions for holes
    const old_holes_wires_i = __model__.geom.query.getFaceHoles(face_i);
    const new_holes_posis_i = [];
    for (const old_hole_wire_i of old_holes_wires_i) {
        const old_hole_posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.WIRE, old_hole_wire_i);
        const new_hole_posis_i = old_hole_posis_i.map(old_posi_i => strip_posis_map.get(old_posi_i)[divisions]);
        new_holes_posis_i.push(new_hole_posis_i);
    }
    // make new polygon
    const pgon_i = __model__.geom.add.addPgon(new_posis_i, new_holes_posis_i);
    return pgon_i;
}
function _extrude(__model__, ents_arr, dist, divisions, method) {
    const extrude_vec = (Array.isArray(dist) ? dist : [0, 0, dist]);
    if (id_1.getArrDepth(ents_arr) === 1) {
        const [ent_type, index] = ents_arr;
        // check if this is a collection, call this function again
        if (id_1.isColl(ent_type)) {
            return _extrudeColl(__model__, index, extrude_vec, divisions, method);
        }
        // check if this is a position, a vertex, or a point -> pline
        if (id_1.isDim0(ent_type)) {
            return _extrudeDim0(__model__, ent_type, index, extrude_vec, divisions);
        }
        // extrude edges -> polygons
        switch (method) {
            case _EExtrudeMethod.QUADS:
                return _extrudeQuads(__model__, ent_type, index, extrude_vec, divisions);
            case _EExtrudeMethod.STRINGERS:
                return _extrudeStringers(__model__, ent_type, index, extrude_vec, divisions);
            case _EExtrudeMethod.RIBS:
                return _extrudeRibs(__model__, ent_type, index, extrude_vec, divisions);
            case _EExtrudeMethod.COPIES:
                return _extrudeCopies(__model__, ent_type, index, extrude_vec, divisions);
            default:
                throw new Error('Extrude method not recognised.');
        }
    }
    else {
        const new_ents_arr = [];
        ents_arr.forEach(ent_arr => {
            const result = _extrude(__model__, ent_arr, extrude_vec, divisions, method);
            result.forEach(new_ent_arr => new_ents_arr.push(new_ent_arr));
        });
        return new_ents_arr;
    }
}
// ================================================================================================
/**
 * Divides edges into a set of shorter edges.
 * ~
 * If the 'by_number' method is selected, then each edge is divided into a fixed number of equal length shorter edges.
 * If the 'by length' method is selected, then each edge is divided into shorter edges of the specified length.
 * The length of the last segment will be the remainder.
 * If the 'by_min_length' method is selected,
 * then the edge is divided into the maximum number of shorter edges
 * that have a new length that is equal to or greater than the minimum.
 * ~
 * @param __model__
 * @param entities Edges, or entities from which edges can be extracted.
 * @param divisor Segment length or number of segments.
 * @param method Enum, select the method for dividing edges.
 * @returns Entities, a list of new edges resulting from the divide.
 * @example segments1 = make.Divide(edge1, 5, by_number)
 * @example_info Creates a list of 5 equal segments from edge1.
 * @example segments2 = make.Divide(edge1, 5, by_length)
 * @example_info If edge1 has length 13, creates from edge a list of two segments of length 5 and one segment of length 3.
 */
function Divide(__model__, entities, divisor, method) {
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    const fn_name = 'make.Divide';
    const ents_arr = _check_args_1.checkIDs('make.Divide', 'edges', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.EDGE, common_1.EEntType.WIRE, common_1.EEntType.PLINE, common_1.EEntType.PGON]);
    _check_args_1.checkCommTypes(fn_name, 'divisor', divisor, [_check_args_1.TypeCheckObj.isNumber]);
    // --- Error Check ---
    const new_ents_arr = _divide(__model__, ents_arr, divisor, method);
    return id_1.idsMake(new_ents_arr);
}
exports.Divide = Divide;
// Divide edge modelling operation
var _EDivideMethod;
(function (_EDivideMethod) {
    _EDivideMethod["BY_NUMBER"] = "by_number";
    _EDivideMethod["BY_LENGTH"] = "by_length";
    _EDivideMethod["BY_MAX_LENGTH"] = "by_max_length";
    _EDivideMethod["BY_MIN_LENGTH"] = "by_min_length";
})(_EDivideMethod = exports._EDivideMethod || (exports._EDivideMethod = {}));
function _divideEdge(__model__, edge_i, divisor, method) {
    const posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edge_i);
    const start = __model__.attribs.query.getPosiCoords(posis_i[0]);
    const end = __model__.attribs.query.getPosiCoords(posis_i[1]);
    let new_xyzs;
    if (method === _EDivideMethod.BY_NUMBER) {
        new_xyzs = vectors_1.interpByNum(start, end, divisor - 1);
    }
    else if (method === _EDivideMethod.BY_LENGTH) {
        new_xyzs = vectors_1.interpByLen(start, end, divisor);
    }
    else if (method === _EDivideMethod.BY_MAX_LENGTH) {
        const len = distance_1.distance(start, end);
        if (divisor === 0) {
            new_xyzs = [];
        }
        else {
            const num_div = Math.ceil(len / divisor);
            const num_div_max = num_div > 1 ? num_div - 1 : 0;
            new_xyzs = vectors_1.interpByNum(start, end, num_div_max);
        }
    }
    else { // BY_MIN_LENGTH
        if (divisor === 0) {
            new_xyzs = [];
        }
        else {
            const len = distance_1.distance(start, end);
            const num_div = Math.floor(len / divisor);
            const num_div_min = num_div > 1 ? num_div - 1 : 0;
            new_xyzs = vectors_1.interpByNum(start, end, num_div_min);
        }
    }
    const new_edges_i = [];
    let old_edge_i = edge_i;
    for (const new_xyz of new_xyzs) {
        const posi_i = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(posi_i, new_xyz);
        const new_edge_i = __model__.geom.modify.insertVertIntoWire(old_edge_i, posi_i);
        new_edges_i.push(old_edge_i);
        old_edge_i = new_edge_i;
    }
    new_edges_i.push(old_edge_i);
    return new_edges_i;
}
function _divide(__model__, ents_arr, divisor, method) {
    if (id_1.getArrDepth(ents_arr) === 1) {
        const [ent_type, index] = ents_arr;
        let exist_edges_i;
        if (!id_1.isEdge(ent_type)) {
            exist_edges_i = __model__.geom.query.navAnyToEdge(ent_type, index).slice();
        }
        else {
            exist_edges_i = [index];
        }
        const all_new_edges_i = [];
        for (const exist_edge_i of exist_edges_i) {
            const new_edges_i = _divideEdge(__model__, exist_edge_i, divisor, method);
            all_new_edges_i.push(...new_edges_i);
        }
        return all_new_edges_i.map(one_edge_i => [common_1.EEntType.EDGE, one_edge_i]);
    }
    else {
        return [].concat(...ents_arr.map(one_edge => _divide(__model__, one_edge, divisor, method)));
    }
}
// ================================================================================================
/**
 * Unweld vertices so that they do not share positions. The new positions that are generated are returned.
 * ~
 * @param __model__
 * @param entities Entities, a list of vertices, or entities from which vertices can be extracted.
 * @param method Enum; the method to use for unweld.
 * @returns Entities, a list of new positions resulting from the unweld.
 * @example mod.Unweld(polyline1)
 * @example_info Unwelds the vertices of polyline1 from all other vertices that shares the same position.
 */
function Unweld(__model__, entities) {
    if (id_1.isEmptyArr(entities)) {
        return [];
    }
    // --- Error Check ---
    let ents_arr = _check_args_1.checkIDs('modify.Unweld', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.VERT, common_1.EEntType.EDGE, common_1.EEntType.WIRE, common_1.EEntType.FACE,
        common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON, common_1.EEntType.COLL]);
    // --- Error Check ---
    if (!Array.isArray(ents_arr[0])) {
        ents_arr = [ents_arr];
    }
    // get verts_i
    const all_verts_i = []; // count number of posis
    for (const ents of ents_arr) {
        const verts_i = __model__.geom.query.navAnyToVert(ents[0], ents[1]);
        for (const vert_i of verts_i) {
            all_verts_i.push(vert_i);
        }
    }
    const new_posis_i = __model__.geom.modify.unweldVerts(all_verts_i);
    return new_posis_i.map(posi_i => id_1.idsMake([common_1.EEntType.POSI, posi_i]));
}
exports.Unweld = Unweld;
// ================================================================================================
// Explode
// Pipe
// Offset
// ================================================================================================
function _polygonHoles(__model__, ents_arr, holes_ents_arr) {
    if (id_1.getArrDepth(holes_ents_arr) === 2) {
        holes_ents_arr = [holes_ents_arr];
    }
    const posis_i = ents_arr.map(ent_arr => ent_arr[1]);
    const holes_posis_i = [];
    for (const hole_ents_arr of holes_ents_arr) {
        holes_posis_i.push(hole_ents_arr.map(ent_arr => ent_arr[1]));
    }
    const pgon_i = __model__.geom.add.addPgon(posis_i, holes_posis_i);
    return [common_1.EEntType.PGON, pgon_i];
}
/**
* Adds a single new polygon to the model with one or more holes.
* @param __model__
* @param positions List of positions.
* @param hole_positions List of positions for the holes. For multiple holes, a list of list can provided.
* @returns Entities, a list of new polygons.
* @example polygon1 = make.Polygon([position1,position2,position3], [position4,position5,position6])
* @example_info Creates a polygon with  a hole, with vertices in sequence from position1 to position6.
*/
function _PolygonHoles(__model__, positions, hole_positions) {
    // --- Error Check ---
    const pgon_ents_arr = _check_args_1.checkIDs('make.Polygon', 'positions', positions, [_check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POSI]);
    const holes_ents_arr = _check_args_1.checkIDs('make.Polygon', 'positions', hole_positions, [_check_args_1.IDcheckObj.isIDList, _check_args_1.IDcheckObj.isIDList_list], [common_1.EEntType.POSI]);
    // --- Error Check ---
    const new_ent_arr = _polygonHoles(__model__, pgon_ents_arr, holes_ents_arr);
    console.log(__model__);
    return id_1.idsMake(new_ent_arr);
}
// ================================================================================================
/**
 * Joins polylines to polylines or polygons to polygons.
 * ~
 * New polylins or polygons are created. The original polyline or polygons are not affected.
 *
 * @param __model__
 * @param geometry Polylines or polygons.
 * @returns Entities, a list of new joined polylines or polygons.
 * @example joined1 = make.Join([polyline1,polyline2])
 * @example_info Creates a new polyline by joining polyline1 and polyline2. Geometries must be of the same type.
 */
function _Join(__model__, geometry) {
    // --- Error Check ---
    // const ents_arr =  checkIDs('make.Join', 'geometry', geometry, [IDcheckObj.isIDList], [EEntType.PLINE, EEntType.PGON]);
    // --- Error Check ---
    throw new Error('Not implemented.');
    return null;
}
exports._Join = _Join;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFrZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL21vZHVsZXMvbWFrZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOztBQU9ILHVEQUE0RjtBQUM1RiwrQ0FDaUc7QUFFakcscURBQXVHO0FBRXZHLCtDQUFtRjtBQUNuRix1REFBb0Q7QUFFcEQsbUdBQW1HO0FBQ25HOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsU0FBZ0IsUUFBUSxDQUFDLFNBQWtCLEVBQUUsTUFBNEI7SUFDckUsSUFBSSxlQUFVLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFBRSxPQUFPLEVBQUUsQ0FBQztLQUFFO0lBQ3RDLHNCQUFzQjtJQUN0Qiw0QkFBYyxDQUFDLGVBQWUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsMEJBQVksQ0FBQyxPQUFPLEVBQUUsMEJBQVksQ0FBQyxXQUFXLEVBQUUsMEJBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFDbkksc0JBQXNCO0lBQ3RCLE1BQU0sWUFBWSxHQUE4QyxTQUFTLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzdGLE9BQU8sWUFBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ2pDLENBQUM7QUFQRCw0QkFPQztBQUNELFNBQVMsU0FBUyxDQUFDLFNBQWtCLEVBQUUsTUFBNEI7SUFDL0QsTUFBTSxLQUFLLEdBQVcsZ0JBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQyxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUU7UUFDYixNQUFNLE1BQU0sR0FBUyxNQUFjLENBQUM7UUFDcEMsTUFBTSxNQUFNLEdBQVcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEQsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxxQkFBWSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN6RixPQUFPLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFnQixDQUFDO0tBQ2pEO1NBQU0sSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1FBQ3BCLE1BQU0sT0FBTyxHQUFXLE1BQWdCLENBQUM7UUFDekMsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBa0IsQ0FBQztLQUM3RTtTQUFNO1FBQ0gsTUFBTSxPQUFPLEdBQWEsTUFBa0IsQ0FBQztRQUM3QyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFvQixDQUFDO0tBQ2pGO0FBQ0wsQ0FBQztBQUNELG1HQUFtRztBQUNuRzs7Ozs7Ozs7O0dBU0c7QUFDSCxTQUFnQixLQUFLLENBQUMsU0FBa0IsRUFBRSxRQUEyQjtJQUNqRSxJQUFJLGVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUFFLE9BQU8sRUFBRSxDQUFDO0tBQUU7SUFDeEMsc0JBQXNCO0lBQ3RCLE1BQU0sUUFBUSxHQUFHLHNCQUFRLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQ3pELENBQUMsd0JBQVUsQ0FBQyxJQUFJLEVBQUUsd0JBQVUsQ0FBQyxRQUFRLEVBQUUsd0JBQVUsQ0FBQyxhQUFhLENBQUMsRUFDaEUsQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxpQkFBUSxDQUFDLElBQUksRUFBRSxpQkFBUSxDQUFDLElBQUksRUFBRSxpQkFBUSxDQUFDLElBQUk7UUFDM0QsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQVEsQ0FBQyxLQUFLLEVBQUUsaUJBQVEsQ0FBQyxLQUFLLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBK0MsQ0FBQztJQUNqSCxzQkFBc0I7SUFDdEIsTUFBTSxZQUFZLEdBQStDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDN0YsT0FBTyxZQUFPLENBQUMsWUFBWSxDQUFzQixDQUFDO0FBQ3RELENBQUM7QUFWRCxzQkFVQztBQUNELFNBQVMsTUFBTSxDQUFDLFNBQWtCLEVBQUUsUUFBbUQ7SUFDbkYsTUFBTSxLQUFLLEdBQVcsZ0JBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM1QyxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUU7UUFDYixNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUFnQixRQUF1QixDQUFDLENBQUMsa0NBQWtDO1FBQ2xHLElBQUksUUFBUSxLQUFLLGlCQUFRLENBQUMsSUFBSSxFQUFFO1lBQzVCLE1BQU0sT0FBTyxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzRCxPQUFPLENBQUMsaUJBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFnQixDQUFDO1NBQ25EO2FBQU07WUFDSCxNQUFNLE9BQU8sR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdFLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFrQixDQUFDO1NBQzdGO0tBQ0o7U0FBTSxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUU7UUFDcEIsUUFBUSxHQUFHLFFBQXlCLENBQUM7UUFDckMsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBa0IsQ0FBQztLQUMzRjtTQUFNLEVBQUUsWUFBWTtRQUNqQixRQUFRLEdBQUcsUUFBMkIsQ0FBQztRQUN2QyxPQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFvQixDQUFDO0tBQzdGO0FBQ0wsQ0FBQztBQUNELG1HQUFtRztBQUNuRzs7Ozs7Ozs7OztHQVVHO0FBQ0gsU0FBZ0IsUUFBUSxDQUFDLFNBQWtCLEVBQUUsUUFBMkIsRUFBRSxLQUFjO0lBQ3BGLElBQUksZUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQUUsT0FBTyxFQUFFLENBQUM7S0FBRTtJQUN4QyxzQkFBc0I7SUFDdEIsTUFBTSxRQUFRLEdBQUcsc0JBQVEsQ0FBQyxlQUFlLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFDNUQsQ0FBQyx3QkFBVSxDQUFDLElBQUksRUFBRSx3QkFBVSxDQUFDLFFBQVEsRUFBRSx3QkFBVSxDQUFDLGFBQWEsQ0FBQyxFQUNoRSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSTtRQUMzRCxpQkFBUSxDQUFDLElBQUksRUFBRSxpQkFBUSxDQUFDLEtBQUssRUFBRSxpQkFBUSxDQUFDLElBQUksQ0FBQyxDQUE4QyxDQUFDO0lBQ2hHLHNCQUFzQjtJQUN0QixNQUFNLFVBQVUsR0FBb0Isc0JBQXNCLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2hGLE1BQU0sWUFBWSxHQUFrQixTQUFTLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQW1CLENBQUM7SUFDOUYsTUFBTSxLQUFLLEdBQVcsZ0JBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM1QyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssQ0FBQyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxpQkFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ2xFLE1BQU0sU0FBUyxHQUFnQixZQUFZLENBQUMsQ0FBQyxDQUFnQixDQUFDO1FBQzlELE9BQU8sWUFBTyxDQUFDLFNBQVMsQ0FBUSxDQUFDO0tBQ3BDO1NBQU07UUFDSCxPQUFPLFlBQU8sQ0FBQyxZQUFZLENBQWMsQ0FBQztLQUM3QztBQUNMLENBQUM7QUFqQkQsNEJBaUJDO0FBQ0QsdUJBQXVCO0FBQ3ZCLElBQVksT0FHWDtBQUhELFdBQVksT0FBTztJQUNmLHdCQUFhLENBQUE7SUFDYiwwQkFBZSxDQUFBO0FBQ25CLENBQUMsRUFIVyxPQUFPLEdBQVAsZUFBTyxLQUFQLGVBQU8sUUFHbEI7QUFDRCxTQUFTLFNBQVMsQ0FBQyxTQUFrQixFQUFFLFFBQXVDLEVBQUUsS0FBYztJQUMxRixNQUFNLEtBQUssR0FBVyxnQkFBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzVDLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRTtRQUNiLE1BQU0sVUFBVSxHQUFZLENBQUMsS0FBSyxLQUFLLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0RCxNQUFNLE9BQU8sR0FBYSxlQUFVLENBQUMsUUFBeUIsQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sT0FBTyxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDekUsT0FBTyxDQUFDLGlCQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBZ0IsQ0FBQztLQUNuRDtTQUFNO1FBQ0gsUUFBUSxHQUFHLFFBQTJCLENBQUM7UUFDdkMsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQWtCLENBQUM7S0FDckc7QUFDTCxDQUFDO0FBQ0QsU0FBUyxzQkFBc0IsQ0FBQyxTQUFrQixFQUFFLFFBQW1EO0lBQ25HLHNDQUFzQztJQUN0QyxJQUFJLGdCQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQzdCLFFBQVEsR0FBSSxDQUFDLFFBQVEsQ0FBa0IsQ0FBQztLQUMzQztJQUNELHFEQUFxRDtJQUNyRCxJQUFJLGdCQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLFdBQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUN2RCxNQUFNLFNBQVMsR0FBa0IsRUFBRSxDQUFDO1FBQ3BDLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFO1lBQzVCLE1BQU0sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLEdBQWdCLE9BQXNCLENBQUM7WUFDOUQsSUFBSSxRQUFRLEtBQUssaUJBQVEsQ0FBQyxJQUFJLEVBQUU7Z0JBQzVCLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBc0IsQ0FBQyxDQUFDO2FBQzFDO2lCQUFNO2dCQUNILE1BQU0sT0FBTyxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzdFLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFO29CQUMxQixTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztpQkFDM0M7YUFDSjtTQUNKO1FBQ0QsUUFBUSxHQUFHLENBQUMsU0FBUyxDQUFvQixDQUFDO0tBQzdDO0lBQ0QsdUJBQXVCO0lBQ3ZCLE1BQU0sVUFBVSxHQUFvQixFQUFFLENBQUM7SUFDdkMsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUU7UUFDNUIsSUFBSSxnQkFBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLCtCQUErQjtZQUM3RCxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQXdCLENBQUMsQ0FBQztZQUMxQyxTQUFTO1NBQ1o7UUFDRCxNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUFnQixPQUFzQixDQUFDO1FBQzlELFFBQVEsUUFBUSxFQUFFO1lBQ2QsS0FBSyxpQkFBUSxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLGlCQUFRLENBQUMsSUFBSSxDQUFDO1lBQ25CLEtBQUssaUJBQVEsQ0FBQyxLQUFLO2dCQUNmLE1BQU0sT0FBTyxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzdFLE1BQU0sU0FBUyxHQUFrQixPQUFPLENBQUMsR0FBRyxDQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBa0IsQ0FBQztnQkFDbEcsVUFBVSxDQUFDLElBQUksQ0FBRSxTQUFTLENBQUUsQ0FBQztnQkFDN0IsTUFBTTtZQUNWLEtBQUssaUJBQVEsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxpQkFBUSxDQUFDLElBQUk7Z0JBQ2QsTUFBTSxPQUFPLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDN0UsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ3JDLE1BQU0sTUFBTSxHQUFXLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEMsTUFBTSxZQUFZLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUN4RixNQUFNLGNBQWMsR0FBa0IsWUFBWSxDQUFDLEdBQUcsQ0FBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQWtCLENBQUM7b0JBQzVHLFVBQVUsQ0FBQyxJQUFJLENBQUUsY0FBYyxDQUFFLENBQUM7aUJBQ3JDO2dCQUNELE1BQU07WUFDVjtnQkFDSSxNQUFNO1NBQ2I7S0FDSjtJQUNELE9BQU8sVUFBVSxDQUFDO0FBQ3RCLENBQUM7QUFDRCxtR0FBbUc7QUFDbkc7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxTQUFnQixPQUFPLENBQUMsU0FBa0IsRUFBRSxRQUEyQjtJQUNuRSxJQUFJLGVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUFFLE9BQU8sRUFBRSxDQUFDO0tBQUU7SUFDeEMsc0JBQXNCO0lBQ3RCLE1BQU0sUUFBUSxHQUFHLHNCQUFRLENBQUMsY0FBYyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQzNELENBQUMsd0JBQVUsQ0FBQyxJQUFJLEVBQUUsd0JBQVUsQ0FBQyxRQUFRLEVBQUUsd0JBQVUsQ0FBQyxhQUFhLENBQUMsRUFDaEUsQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxpQkFBUSxDQUFDLElBQUksRUFBRSxpQkFBUSxDQUFDLElBQUksRUFBRSxpQkFBUSxDQUFDLEtBQUssRUFBRSxpQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFrQyxDQUFDO0lBQ25ILHNCQUFzQjtJQUN0QixNQUFNLFVBQVUsR0FBb0IscUJBQXFCLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQy9FLE1BQU0sWUFBWSxHQUFrQixRQUFRLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBa0IsQ0FBQztJQUNyRixNQUFNLEtBQUssR0FBVyxnQkFBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzVDLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssS0FBSyxDQUFDLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLGlCQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDbEUsTUFBTSxTQUFTLEdBQWdCLFlBQVksQ0FBQyxDQUFDLENBQWdCLENBQUM7UUFDOUQsT0FBTyxZQUFPLENBQUMsU0FBUyxDQUFRLENBQUM7S0FDcEM7U0FBTTtRQUNILE9BQU8sWUFBTyxDQUFDLFlBQVksQ0FBYyxDQUFDO0tBQzdDO0FBQ0wsQ0FBQztBQWhCRCwwQkFnQkM7QUFDRCxTQUFTLFFBQVEsQ0FBQyxTQUFrQixFQUFFLFFBQXVDO0lBQ3pFLE1BQU0sS0FBSyxHQUFXLGdCQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDNUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1FBQ2IsTUFBTSxPQUFPLEdBQWEsZUFBVSxDQUFDLFFBQXlCLENBQUMsQ0FBQztRQUNoRSxNQUFNLE1BQU0sR0FBVyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0QsT0FBTyxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBZ0IsQ0FBQztLQUNqRDtTQUFNO1FBQ0gsUUFBUSxHQUFHLFFBQTJCLENBQUM7UUFDdkMsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBa0IsQ0FBQztLQUM3RjtBQUNMLENBQUM7QUFDRCxTQUFTLHFCQUFxQixDQUFDLFNBQWtCLEVBQUUsUUFBbUQ7SUFDbEcsc0NBQXNDO0lBQ3RDLElBQUksZ0JBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDN0IsUUFBUSxHQUFHLENBQUMsUUFBUSxDQUFrQixDQUFDO0tBQzFDO0lBQ0QsbUNBQW1DO0lBQ25DLElBQUksZ0JBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLGlCQUFRLENBQUMsSUFBSSxFQUFFO1FBQ2pFLDZDQUE2QztRQUM3QyxNQUFNLFNBQVMsR0FBa0IsRUFBRSxDQUFDO1FBQ3BDLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFO1lBQzVCLE1BQU0sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLEdBQWdCLE9BQXNCLENBQUM7WUFDOUQsSUFBSSxRQUFRLEtBQUssaUJBQVEsQ0FBQyxJQUFJLEVBQUU7Z0JBQzVCLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBc0IsQ0FBQyxDQUFDO2FBQzFDO2lCQUFNO2dCQUNILE1BQU0sT0FBTyxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzdFLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFO29CQUMxQixTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztpQkFDM0M7YUFDSjtTQUNKO1FBQ0QsUUFBUSxHQUFHLENBQUMsU0FBUyxDQUFvQixDQUFDO0tBQzdDO0lBQ0QsdUJBQXVCO0lBQ3ZCLE1BQU0sVUFBVSxHQUFvQixFQUFFLENBQUM7SUFDdkMsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUU7UUFDNUIsSUFBSSxnQkFBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLCtCQUErQjtZQUM3RCxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQXdCLENBQUMsQ0FBQztZQUMxQyxTQUFTO1NBQ1o7UUFDRCxNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUFnQixPQUFzQixDQUFDO1FBQzlELFFBQVEsUUFBUSxFQUFFO1lBQ2QsS0FBSyxpQkFBUSxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLGlCQUFRLENBQUMsS0FBSztnQkFDZixNQUFNLE9BQU8sR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUM3RSxNQUFNLFNBQVMsR0FBa0IsT0FBTyxDQUFDLEdBQUcsQ0FBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQWtCLENBQUM7Z0JBQ2xHLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzNCLE1BQU07WUFDVixLQUFLLGlCQUFRLENBQUMsSUFBSSxDQUFDO1lBQ25CLEtBQUssaUJBQVEsQ0FBQyxJQUFJO2dCQUNkLE1BQU0sT0FBTyxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzdFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUNyQyxNQUFNLE1BQU0sR0FBVyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLE1BQU0sWUFBWSxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDeEYsTUFBTSxjQUFjLEdBQWtCLFlBQVksQ0FBQyxHQUFHLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFrQixDQUFDO29CQUM1RyxVQUFVLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2lCQUNuQztnQkFDRCxNQUFNO1lBQ1Y7Z0JBQ0ksTUFBTTtTQUNiO0tBQ0o7SUFDRCxPQUFPLFVBQVUsQ0FBQztBQUN0QixDQUFDO0FBQ0QsbUdBQW1HO0FBQ25HOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILFNBQWdCLFVBQVUsQ0FBQyxTQUFrQixFQUFFLFdBQWdCLEVBQUUsUUFBbUI7SUFDaEYsc0JBQXNCO0lBQ3RCLE1BQU0sT0FBTyxHQUFHLGlCQUFpQixDQUFDO0lBQ2xDLElBQUksWUFBb0IsQ0FBQztJQUN6QixJQUFJLFdBQVcsS0FBSyxJQUFJLElBQUksV0FBVyxLQUFLLFNBQVMsRUFBRTtRQUNuRCxNQUFNLGNBQWMsR0FBRyxzQkFBUSxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLENBQUMsd0JBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQWdCLENBQUM7UUFDeEgsWUFBWSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNwQztTQUFNO1FBQ0gsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ3JCO0lBQ0QsTUFBTSxRQUFRLEdBQUcsc0JBQVEsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFDbEQsQ0FBQyx3QkFBVSxDQUFDLElBQUksRUFBRSx3QkFBVSxDQUFDLFFBQVEsRUFBRSx3QkFBVSxDQUFDLGFBQWEsQ0FBQyxFQUNoRSxDQUFDLGlCQUFRLENBQUMsS0FBSyxFQUFFLGlCQUFRLENBQUMsS0FBSyxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQThDLENBQUM7SUFDbEcsc0JBQXNCO0lBQ3RCLE1BQU0sV0FBVyxHQUE4QixXQUFXLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM5RixPQUFPLFlBQU8sQ0FBQyxXQUFXLENBQWMsQ0FBQztBQUM3QyxDQUFDO0FBaEJELGdDQWdCQztBQUNELFNBQWdCLFdBQVcsQ0FBQyxTQUFrQixFQUFFLFlBQW9CLEVBQ2hFLFFBQXVEO0lBQ3ZELE1BQU0sS0FBSyxHQUFXLGdCQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDNUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1FBQ2IsUUFBUSxHQUFHLENBQUMsUUFBUSxDQUFrQixDQUFDO0tBQzFDO1NBQU0sSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1FBQ3BCLFFBQVEsR0FBRyxRQUEyQixDQUFDO1FBQ3ZDLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFrQixDQUFDO0tBQzlHO0lBQ0QsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO0lBQzVCLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztJQUM1QixNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7SUFDM0IsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUU7UUFDNUIsSUFBSSxZQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQUU7UUFDckQsSUFBSSxZQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQUU7UUFDckQsSUFBSSxXQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQUU7S0FDdEQ7SUFDRCxNQUFNLE1BQU0sR0FBVyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdkYsT0FBTyxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ25DLENBQUM7QUFuQkQsa0NBbUJDO0FBQ0QsbUdBQW1HO0FBQ25HOzs7Ozs7OztHQVFHO0FBQ0gsU0FBZ0IsSUFBSSxDQUFDLFNBQWtCLEVBQUUsUUFBMkI7SUFDaEUsSUFBSSxlQUFVLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFBRSxPQUFPLEVBQUUsQ0FBQztLQUFFO0lBQ3hDLHNCQUFzQjtJQUN0QixNQUFNLFFBQVEsR0FBRyxzQkFBUSxDQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUN2RCxDQUFDLHdCQUFVLENBQUMsSUFBSSxFQUFFLHdCQUFVLENBQUMsUUFBUSxFQUFFLEFBQUQsRUFBRyx3QkFBVSxDQUFDLGFBQWEsQ0FBQyxFQUNsRSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsS0FBSyxFQUFFLGlCQUFRLENBQUMsS0FBSyxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQThDLENBQUM7SUFDaEksc0JBQXNCO0lBQ3RCLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDO0lBQy9CLDRCQUE0QjtJQUM1QixNQUFNLFlBQVksR0FBOEMsU0FBUyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUNsSCx5REFBeUQ7SUFDekQsY0FBYyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUMzRCwrQkFBK0I7SUFDL0IsT0FBTyxZQUFPLENBQUMsWUFBWSxDQUFzQixDQUFDO0FBQ3RELENBQUM7QUFkRCxvQkFjQztBQUNELFNBQVMsU0FBUyxDQUFDLFNBQWtCLEVBQ2pDLFFBQXVELEVBQUUsZUFBd0I7SUFDakYsTUFBTSxLQUFLLEdBQVcsZ0JBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM1QyxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUU7UUFDYixNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUFnQixRQUF1QixDQUFDO1FBQy9ELElBQUksV0FBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2xCLE1BQU0sTUFBTSxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsZUFBZSxDQUFXLENBQUM7WUFDdEYsT0FBTyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUM3QjthQUFNLElBQUksV0FBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3pCLE1BQU0sS0FBSyxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsZUFBZSxDQUFXLENBQUM7WUFDckYsT0FBTyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUM1QjthQUFNLElBQUksWUFBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzFCLE1BQU0sS0FBSyxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsZUFBZSxDQUFXLENBQUM7WUFDdEYsT0FBTyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUM1QjthQUFNLElBQUksWUFBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzFCLE1BQU0sS0FBSyxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsZUFBZSxDQUFXLENBQUM7WUFDdEYsT0FBTyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUM1QjthQUFNLElBQUksV0FBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3pCLE1BQU0sTUFBTSxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsZUFBZSxDQUFXLENBQUM7WUFDdEYsT0FBTyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUM3QjtLQUNKO1NBQU0sSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1FBQ3BCLFFBQVEsR0FBRyxRQUF5QixDQUFDO1FBQ3JDLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFrQixDQUFDO0tBQy9HO1NBQU0sRUFBRSxZQUFZO1FBQ2pCLFFBQVEsR0FBRyxRQUEyQixDQUFDO1FBQ3ZDLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFvQixDQUFDO0tBQ2pIO0FBQ0wsQ0FBQztBQUNELFNBQVMsY0FBYyxDQUFDLFNBQWtCLEVBQUUsUUFBdUQsRUFBRSxlQUF3QjtJQUN6SCxNQUFNLEtBQUssR0FBVyxnQkFBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzVDLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRTtRQUNiLFFBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBa0IsQ0FBQztLQUMxQztTQUFNLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtRQUNsQixhQUFhO1FBQ2IsUUFBUSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBa0IsQ0FBQztLQUN4RDtJQUNELDJCQUEyQjtJQUMzQixNQUFNLHNCQUFzQixHQUF3QixJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsd0JBQXdCO0lBQ3ZGLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFO1FBQzVCLE1BQU0sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLEdBQWdCLE9BQXNCLENBQUM7UUFDOUQsSUFBSSxDQUFDLFdBQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLGNBQWM7WUFDbkMsTUFBTSxXQUFXLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRixNQUFNLGVBQWUsR0FBYSxFQUFFLENBQUM7WUFDckMsS0FBSyxNQUFNLFVBQVUsSUFBSSxXQUFXLEVBQUU7Z0JBQ2xDLElBQUksVUFBa0IsQ0FBQztnQkFDdkIsSUFBSSxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQ3hDLFVBQVUsR0FBRyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQ3ZEO3FCQUFNO29CQUNILFVBQVUsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBVyxDQUFDO29CQUNqRixzQkFBc0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2lCQUN0RDtnQkFDRCxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ3BDO1lBQ0QsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFDLENBQUM7U0FDeEU7S0FDSjtJQUNELDRCQUE0QjtJQUM1QixpRkFBaUY7SUFDakYsb0ZBQW9GO0FBQ3hGLENBQUM7QUFFRCxtR0FBbUc7QUFDbkc7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILFNBQWdCLElBQUksQ0FBQyxTQUFrQixFQUFFLElBQVMsRUFBRSxRQUEyQjtJQUMzRSxJQUFJLGVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUFFLE9BQU8sRUFBRSxDQUFDO0tBQUU7SUFDeEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFBRSxRQUFRLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUFFO0lBQ3hELHNCQUFzQjtJQUN0QixNQUFNLFlBQVksR0FBRyxzQkFBUSxDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsd0JBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQWdCLENBQUM7SUFDM0gsTUFBTSxjQUFjLEdBQUcsc0JBQVEsQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFDOUQsQ0FBQyx3QkFBVSxDQUFDLElBQUksRUFBRSx3QkFBVSxDQUFDLFFBQVEsRUFBRSx3QkFBVSxDQUFDLGFBQWEsQ0FBQyxFQUNoRSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsS0FBSyxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQWtDLENBQUM7SUFDbkgsc0JBQXNCO0lBQ3RCLHFCQUFxQixDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUNqRCxNQUFNLFlBQVksR0FBa0IsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDbkYsT0FBTyxZQUFPLENBQUMsWUFBWSxDQUFVLENBQUM7QUFDMUMsQ0FBQztBQVpELG9CQVlDO0FBQ0QsMkJBQTJCO0FBQzNCLFNBQVMsS0FBSyxDQUFDLFNBQWtCLEVBQUUsWUFBeUIsRUFBRSxjQUE2QztJQUN2RyxJQUFJLGdCQUFXLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ25DLGNBQWMsR0FBRyxDQUFDLGNBQWMsQ0FBb0IsQ0FBQztLQUN4RDtJQUNELHdDQUF3QztJQUN4QyxNQUFNLGFBQWEsR0FBZSxFQUFFLENBQUM7SUFDckMsS0FBSyxNQUFNLGFBQWEsSUFBSSxjQUFpQyxFQUFFO1FBQzNELGFBQWEsQ0FBQyxJQUFJLENBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBRSxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFFLENBQUM7S0FDcEU7SUFDRCxrQkFBa0I7SUFDbEIsTUFBTSxPQUFPLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUM3RixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFrQixDQUFDO0FBQzNFLENBQUM7QUFDRCxTQUFTLHFCQUFxQixDQUFDLFNBQWtCLEVBQUUsUUFBdUM7SUFDdEYsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDdEMsTUFBTSxLQUFLLEdBQVcsZ0JBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQyxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUU7WUFDYixNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUFnQixRQUFRLENBQUMsQ0FBQyxDQUFnQixDQUFDO1lBQ2xFLFFBQVEsUUFBUSxFQUFFO2dCQUNkLEtBQUssaUJBQVEsQ0FBQyxJQUFJLENBQUM7Z0JBQ25CLEtBQUssaUJBQVEsQ0FBQyxLQUFLO29CQUNmLE1BQU0sT0FBTyxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQzdFLE1BQU0sU0FBUyxHQUFrQixPQUFPLENBQUMsR0FBRyxDQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBa0IsQ0FBQztvQkFDbEcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU87b0JBQ2xFLE1BQU07Z0JBQ1YsS0FBSyxpQkFBUSxDQUFDLElBQUksQ0FBQztnQkFDbkIsS0FBSyxpQkFBUSxDQUFDLElBQUk7b0JBQ2QsNENBQTRDO29CQUM1QyxNQUFNLE9BQU8sR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUM3RSxNQUFNLE1BQU0sR0FBVyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLE1BQU0sWUFBWSxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDeEYsTUFBTSxjQUFjLEdBQWtCLFlBQVksQ0FBQyxHQUFHLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFrQixDQUFDO29CQUM1RyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTztvQkFDdkUsTUFBTTtnQkFDVjtvQkFDSSxNQUFNO2FBQ2I7U0FDSjtLQUNKO0FBQ0wsQ0FBQztBQUNELG1HQUFtRztBQUNuRzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBa0JHO0FBQ0gsU0FBZ0IsSUFBSSxDQUFDLFNBQWtCLEVBQUUsUUFBdUIsRUFBRSxTQUFpQixFQUFFLE1BQW9CO0lBQ3JHLElBQUksZUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQUUsT0FBTyxFQUFFLENBQUM7S0FBRTtJQUN4QyxzQkFBc0I7SUFDdEIsTUFBTSxRQUFRLEdBQUcsc0JBQVEsQ0FBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFDdkQsQ0FBQyx3QkFBVSxDQUFDLFFBQVEsRUFBRSx3QkFBVSxDQUFDLGFBQWEsQ0FBQyxFQUMvQyxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsS0FBSyxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQWtDLENBQUM7SUFDbkgsc0JBQXNCO0lBQ3RCLE1BQU0sWUFBWSxHQUFrQixLQUFLLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDbEYsT0FBTyxZQUFPLENBQUMsWUFBWSxDQUFVLENBQUM7QUFDMUMsQ0FBQztBQVRELG9CQVNDO0FBQ0QsSUFBWSxZQVFYO0FBUkQsV0FBWSxZQUFZO0lBQ3BCLHlDQUEwQixDQUFBO0lBQzFCLDZDQUErQixDQUFBO0lBQy9CLGlEQUFrQyxDQUFBO0lBQ2xDLHFEQUF1QyxDQUFBO0lBQ3ZDLHVDQUF1QixDQUFBO0lBQ3ZCLDJDQUEyQixDQUFBO0lBQzNCLGlDQUFpQixDQUFBO0FBQ3JCLENBQUMsRUFSVyxZQUFZLEdBQVosb0JBQVksS0FBWixvQkFBWSxRQVF2QjtBQUNELFNBQVMsVUFBVSxDQUFDLFNBQWtCLEVBQUUsUUFBdUIsRUFBRSxTQUFpQixFQUFFLE1BQW9CO0lBQ3BHLE1BQU0sWUFBWSxHQUFlLEVBQUUsQ0FBQztJQUNwQyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDbEIsS0FBSyxNQUFNLElBQUksSUFBSSxRQUFRLEVBQUU7UUFDekIsTUFBTSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBZ0IsSUFBbUIsQ0FBQztRQUMzRCxNQUFNLE9BQU8sR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdFLElBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFBRSxTQUFTLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztTQUFFO1FBQzlELElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQUU7WUFDOUIsTUFBTSxJQUFJLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1NBQ3BFO1FBQ0QsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM5QjtJQUNELElBQUksTUFBTSxLQUFLLFlBQVksQ0FBQyxZQUFZLEVBQUU7UUFDdEMsWUFBWSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN0QztJQUNELE1BQU0sV0FBVyxHQUFhLEVBQUUsQ0FBQztJQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDOUMsTUFBTSxTQUFTLEdBQWEsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sU0FBUyxHQUFhLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDaEQsSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFO1lBQ2YsTUFBTSxlQUFlLEdBQTBCLElBQUksR0FBRyxFQUFFLENBQUM7WUFDekQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDaEMsTUFBTSxRQUFRLEdBQVcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLFFBQVEsR0FBVyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLHdCQUF3QjtnQkFDeEIsTUFBTSxlQUFlLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUM3RixNQUFNLGVBQWUsR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzdGLDBDQUEwQztnQkFDMUMsS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDcEIsSUFBSSxlQUFlLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsRUFBRTt3QkFDdkQsTUFBTSxLQUFLLEdBQVMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUM5RSxNQUFNLEtBQUssR0FBUyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzlFLE1BQU0sZUFBZSxHQUFTLGdCQUFNLENBQUMsbUJBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQ3pFLE1BQU0sYUFBYSxHQUFhLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3JELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUU7NEJBQ2hDLE1BQU0sWUFBWSxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDOzRCQUMxRCxNQUFNLFFBQVEsR0FBRyxpQkFBTyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQzs0QkFDN0MsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxnQkFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDOzRCQUMzRSxhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO3lCQUNwQzt3QkFDRCxhQUFhLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN2QyxlQUFlLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztxQkFDMUQ7aUJBQ0o7Z0JBQ0QsdUNBQXVDO2dCQUN2QyxNQUFNLGNBQWMsR0FBYSxlQUFlLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6RSxNQUFNLGNBQWMsR0FBYSxlQUFlLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6RSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ2hELE1BQU0sRUFBRSxHQUFXLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckMsTUFBTSxFQUFFLEdBQVcsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyQyxNQUFNLEVBQUUsR0FBVyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUN6QyxNQUFNLEVBQUUsR0FBVyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUN6QyxNQUFNLE1BQU0sR0FBVyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNwRSxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2lCQUM1QjthQUNKO1NBQ0o7YUFBTTtZQUNILEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2hDLE1BQU0sU0FBUyxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0YsTUFBTSxTQUFTLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMzRixNQUFNLE1BQU0sR0FBVyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1RyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQzVCO1NBQ0o7S0FDSjtJQUNELE9BQU8sV0FBVyxDQUFDLEdBQUcsQ0FBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQWtCLENBQUM7QUFDaEYsQ0FBQztBQUNELFNBQVMsY0FBYyxDQUFDLFNBQWtCLEVBQUUsUUFBdUIsRUFBRSxTQUFpQixFQUFFLE1BQW9CO0lBQ3hHLE1BQU0sWUFBWSxHQUFlLEVBQUUsQ0FBQztJQUNwQyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDbEIsS0FBSyxNQUFNLElBQUksSUFBSSxRQUFRLEVBQUU7UUFDekIsTUFBTSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBZ0IsSUFBbUIsQ0FBQztRQUMzRCxNQUFNLE9BQU8sR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdFLElBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFBRSxTQUFTLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztTQUFFO1FBQzlELElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQUU7WUFDOUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO1NBQ3hFO1FBQ0QsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM5QjtJQUNELE1BQU0sU0FBUyxHQUFZLE1BQU0sS0FBSyxZQUFZLENBQUMsZ0JBQWdCLENBQUM7SUFDcEUsSUFBSSxTQUFTLEVBQUU7UUFDWCxZQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3RDO0lBQ0QsTUFBTSxpQkFBaUIsR0FBYSxFQUFFLENBQUM7SUFDdkMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNoQyxNQUFNLGdCQUFnQixHQUFhLEVBQUUsQ0FBQztRQUN0QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDOUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFDLElBQUksU0FBUyxHQUFHLENBQUMsRUFBRTtnQkFDZixNQUFNLElBQUksR0FBUyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdFLE1BQU0sSUFBSSxHQUFTLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pGLE1BQU0sR0FBRyxHQUFTLGdCQUFNLENBQUMsbUJBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ2hDLE1BQU0sT0FBTyxHQUFTLGdCQUFNLENBQUMsSUFBSSxFQUFFLGlCQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3BELE1BQU0sVUFBVSxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUN4RCxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUN6RCxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQ3JDO2FBQ0o7U0FDSjtRQUNELElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDWixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNuRTtRQUNELE1BQU0sT0FBTyxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNqRixpQkFBaUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDbkM7SUFDRCxPQUFPLGlCQUFpQixDQUFDLEdBQUcsQ0FBRSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsaUJBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQWtCLENBQUM7QUFDekYsQ0FBQztBQUNELFNBQVMsU0FBUyxDQUFDLFNBQWtCLEVBQUUsUUFBdUIsRUFBRSxTQUFpQixFQUFFLE1BQW9CO0lBQ25HLE1BQU0sWUFBWSxHQUFlLEVBQUUsQ0FBQztJQUNwQyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDbEIsS0FBSyxNQUFNLElBQUksSUFBSSxRQUFRLEVBQUU7UUFDekIsTUFBTSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBZ0IsSUFBbUIsQ0FBQztRQUMzRCxNQUFNLE9BQU8sR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdFLElBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFBRSxTQUFTLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztTQUFFO1FBQzlELElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQUU7WUFDOUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO1NBQ3hFO1FBQ0QsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM5QjtJQUNELE1BQU0sU0FBUyxHQUFZLE1BQU0sS0FBSyxZQUFZLENBQUMsV0FBVyxDQUFDO0lBQy9ELElBQUksU0FBUyxFQUFFO1FBQ1gsWUFBWSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN0QztJQUNELElBQUksY0FBYyxHQUFHLEtBQUssQ0FBQztJQUMzQixRQUFRLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLHNDQUFzQztRQUM1RCxLQUFLLGlCQUFRLENBQUMsSUFBSSxDQUFDO1FBQ25CLEtBQUssaUJBQVEsQ0FBQyxJQUFJO1lBQ2QsY0FBYyxHQUFHLElBQUksQ0FBQztZQUN0QixNQUFNO1FBQ1YsS0FBSyxpQkFBUSxDQUFDLEtBQUs7WUFDZixNQUFNLE1BQU0sR0FBVyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0UsY0FBYyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1RCxNQUFNO1FBQ1YsS0FBSyxpQkFBUSxDQUFDLElBQUk7WUFDZCxjQUFjLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLE1BQU07UUFDVjtZQUNJLE1BQU07S0FDYjtJQUNELE1BQU0sWUFBWSxHQUFhLEVBQUUsQ0FBQztJQUNsQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDOUMsTUFBTSxPQUFPLEdBQVcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNyRixZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNCLElBQUksU0FBUyxHQUFHLENBQUMsRUFBRTtZQUNmLE1BQU0sS0FBSyxHQUFXLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNuRyxNQUFNLEtBQUssR0FBVyxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3ZHLE1BQU0sSUFBSSxHQUFXLEVBQUUsQ0FBQztZQUN4QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNoQyxNQUFNLEdBQUcsR0FBUyxnQkFBTSxDQUFDLG1CQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNuRSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2xCO1lBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDaEMsTUFBTSxXQUFXLEdBQWEsRUFBRSxDQUFDO2dCQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUNoQyxNQUFNLE9BQU8sR0FBUyxnQkFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxpQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM1RCxNQUFNLFVBQVUsR0FBVyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDeEQsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDekQsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztpQkFDaEM7Z0JBQ0QsTUFBTSxlQUFlLEdBQVcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQztnQkFDekYsWUFBWSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQzthQUN0QztTQUNKO0tBQ0o7SUFDRCxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ1osTUFBTSxPQUFPLEdBQVcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQzNHLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDOUI7SUFDRCxPQUFPLFlBQVksQ0FBQyxHQUFHLENBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlCQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFrQixDQUFDO0FBQ3BGLENBQUM7QUFDRCxTQUFTLFdBQVcsQ0FBQyxTQUFrQixFQUFFLFFBQXVCLEVBQUUsU0FBaUI7SUFDL0UsTUFBTSxZQUFZLEdBQWUsRUFBRSxDQUFDO0lBQ3BDLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztJQUNsQixLQUFLLE1BQU0sSUFBSSxJQUFJLFFBQVEsRUFBRTtRQUN6QixNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUFnQixJQUFtQixDQUFDO1FBQzNELE1BQU0sT0FBTyxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0UsSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUFFLFNBQVMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1NBQUU7UUFDOUQsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLFNBQVMsRUFBRTtZQUM5QixNQUFNLElBQUksS0FBSyxDQUFDLG1EQUFtRCxDQUFDLENBQUM7U0FDeEU7UUFDRCxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQzlCO0lBQ0QsTUFBTSxNQUFNLEdBQWtCLEVBQUUsQ0FBQztJQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDOUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6QixJQUFJLFNBQVMsR0FBRyxDQUFDLEVBQUU7WUFDZixNQUFNLEtBQUssR0FBVyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDbkcsTUFBTSxLQUFLLEdBQVcsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUN2RyxNQUFNLElBQUksR0FBVyxFQUFFLENBQUM7WUFDeEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDaEMsTUFBTSxHQUFHLEdBQVMsZ0JBQU0sQ0FBQyxtQkFBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDbkUsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNsQjtZQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2hDLE1BQU0sY0FBYyxHQUFnQixTQUFTLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQWdCLENBQUM7Z0JBQzNGLGNBQWMsQ0FBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsZUFBZSxFQUFFLFlBQVksQ0FBQyxHQUFxQixjQUFjLENBQUM7Z0JBQ3pFLE1BQU0sV0FBVyxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQy9GLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ2hDLE1BQU0sT0FBTyxHQUFTLGdCQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLGlCQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzVELFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7aUJBQ2hFO2dCQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7YUFDL0I7U0FDSjtLQUNKO0lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNDLE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUFDRCxTQUFTLEtBQUssQ0FBQyxTQUFrQixFQUFFLFNBQXdDLEVBQUUsU0FBaUIsRUFBRSxNQUFvQjtJQUNoSCxNQUFNLEtBQUssR0FBVyxnQkFBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzdDLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRTtRQUNiLE1BQU0sUUFBUSxHQUFrQixTQUEwQixDQUFDO1FBQzNELFFBQVEsTUFBTSxFQUFFO1lBQ1osS0FBSyxZQUFZLENBQUMsVUFBVSxDQUFDO1lBQzdCLEtBQUssWUFBWSxDQUFDLFlBQVk7Z0JBQzFCLE9BQU8sVUFBVSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzlELEtBQUssWUFBWSxDQUFDLGNBQWMsQ0FBQztZQUNqQyxLQUFLLFlBQVksQ0FBQyxnQkFBZ0I7Z0JBQzlCLE9BQU8sY0FBYyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2xFLEtBQUssWUFBWSxDQUFDLFNBQVMsQ0FBQztZQUM1QixLQUFLLFlBQVksQ0FBQyxXQUFXO2dCQUN6QixPQUFPLFNBQVMsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM3RCxLQUFLLFlBQVksQ0FBQyxNQUFNO2dCQUNwQixPQUFPLFdBQVcsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZEO2dCQUNJLE1BQU07U0FDYjtLQUNKO1NBQU0sSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1FBQ3BCLE1BQU0sYUFBYSxHQUFrQixFQUFFLENBQUM7UUFDeEMsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUE2QixFQUFFO1lBQ2xELE1BQU0sU0FBUyxHQUFrQixLQUFLLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDL0UsU0FBUyxDQUFDLE9BQU8sQ0FBRSxRQUFRLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUUsQ0FBQztTQUNqRTtRQUNELE9BQU8sYUFBYSxDQUFDO0tBQ3hCO0FBQ0wsQ0FBQztBQUNELG1HQUFtRztBQUNuRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRztBQUNILFNBQWdCLE9BQU8sQ0FBQyxTQUFrQixFQUFFLFFBQW1CLEVBQ3ZELFFBQXFCLEVBQUUsU0FBaUIsRUFBRSxNQUF1QjtJQUNyRSxJQUFJLGVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUFFLE9BQU8sRUFBRSxDQUFDO0tBQUU7SUFDeEMsc0JBQXNCO0lBQ3RCLE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQztJQUMvQixNQUFNLFFBQVEsR0FBSSxzQkFBUSxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUNwRCxDQUFDLHdCQUFVLENBQUMsSUFBSSxFQUFFLHdCQUFVLENBQUMsUUFBUSxDQUFDLEVBQ3RDLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQVEsQ0FBQyxJQUFJO1FBQzFELGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsS0FBSyxFQUFFLGlCQUFRLENBQUMsS0FBSyxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQThCLENBQUM7SUFDaEgsNEJBQWMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDLDBCQUFZLENBQUMsUUFBUSxFQUFFLDBCQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUMxRiw0QkFBYyxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLENBQUMsMEJBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLHNCQUFzQjtJQUN0QixNQUFNLFlBQVksR0FBa0IsUUFBUSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvRixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUN2RCxPQUFPLFlBQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQVEsQ0FBQztLQUMxQztTQUFNO1FBQ0gsT0FBTyxZQUFPLENBQUMsWUFBWSxDQUFjLENBQUM7S0FDN0M7QUFDTCxDQUFDO0FBbEJELDBCQWtCQztBQUNELElBQVksZUFLWDtBQUxELFdBQVksZUFBZTtJQUN2QixrQ0FBZ0IsQ0FBQTtJQUNoQiwwQ0FBdUIsQ0FBQTtJQUN2QixnQ0FBYSxDQUFBO0lBQ2Isb0NBQWlCLENBQUE7QUFDckIsQ0FBQyxFQUxXLGVBQWUsR0FBZix1QkFBZSxLQUFmLHVCQUFlLFFBSzFCO0FBQ0QsU0FBUyxZQUFZLENBQUMsU0FBa0IsRUFBRSxLQUFhLEVBQy9DLFdBQWlCLEVBQUUsU0FBaUIsRUFBRSxNQUF1QjtJQUNqRSxNQUFNLFFBQVEsR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEUsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBRSxPQUFPLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxpQkFBUSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDdEgsTUFBTSxRQUFRLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RFLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUMsaUJBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3RILE1BQU0sT0FBTyxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNwRSxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNsSCxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN2QyxDQUFDO0FBQ0QsU0FBUyxZQUFZLENBQUMsU0FBa0IsRUFBRSxRQUFnQixFQUFFLEtBQWEsRUFBRSxXQUFpQixFQUFFLFNBQWlCO0lBQzNHLE1BQU0sZUFBZSxHQUFTLGdCQUFNLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzdELE1BQU0sWUFBWSxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkYsTUFBTSxHQUFHLEdBQVMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3RFLE1BQU0sYUFBYSxHQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDL0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDcEMsTUFBTSxZQUFZLEdBQVcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDMUQsTUFBTSxRQUFRLEdBQUcsaUJBQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN0MsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxnQkFBTSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLGFBQWEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDcEM7SUFDRCwwREFBMEQ7SUFDMUQsTUFBTSxPQUFPLEdBQVcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ25FLE9BQU8sQ0FBQyxDQUFDLGlCQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQUNELFNBQVMsYUFBYSxDQUFDLFNBQWtCLEVBQUUsUUFBZ0IsRUFBRSxLQUFhLEVBQUUsV0FBaUIsRUFBRSxTQUFpQjtJQUM1RyxNQUFNLFdBQVcsR0FBYSxFQUFFLENBQUM7SUFDakMsTUFBTSxlQUFlLEdBQVMsZ0JBQU0sQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDN0QsTUFBTSxPQUFPLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM3RSxNQUFNLGVBQWUsR0FBMEIsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUN6RCxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRTtRQUMxQixvQkFBb0I7UUFDcEIsTUFBTSxhQUFhLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3pGLDBDQUEwQztRQUMxQyxLQUFLLE1BQU0sWUFBWSxJQUFJLGFBQWEsRUFBRTtZQUN0QyxJQUFJLGVBQWUsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEtBQUssU0FBUyxFQUFFO2dCQUNqRCxNQUFNLEdBQUcsR0FBUyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3RFLE1BQU0sYUFBYSxHQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQy9DLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUNwQyxNQUFNLFlBQVksR0FBVyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDMUQsTUFBTSxRQUFRLEdBQUcsaUJBQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzdDLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsZ0JBQU0sQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDekUsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztpQkFDcEM7Z0JBQ0QsZUFBZSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDcEQ7U0FDSjtRQUNELHVDQUF1QztRQUN2QyxNQUFNLGNBQWMsR0FBYSxlQUFlLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZFLE1BQU0sY0FBYyxHQUFhLGVBQWUsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2hELE1BQU0sRUFBRSxHQUFXLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQyxNQUFNLEVBQUUsR0FBVyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckMsTUFBTSxFQUFFLEdBQVcsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN6QyxNQUFNLEVBQUUsR0FBVyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sTUFBTSxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEUsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUM1QjtLQUNKO0lBQ0QsY0FBYztJQUNkLElBQUksV0FBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsMEJBQTBCO1FBQzlDLE1BQU0sTUFBTSxHQUFXLFdBQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUYsTUFBTSxVQUFVLEdBQVcsV0FBVyxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3RGLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDaEM7SUFDRCxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBZ0IsQ0FBQyxDQUFDO0FBQzdFLENBQUM7QUFDRCxTQUFTLGlCQUFpQixDQUFDLFNBQWtCLEVBQUUsUUFBZ0IsRUFBRSxLQUFhLEVBQUUsV0FBaUIsRUFBRSxTQUFpQjtJQUNoSCxNQUFNLFlBQVksR0FBYSxFQUFFLENBQUM7SUFDbEMsTUFBTSxlQUFlLEdBQVMsZ0JBQU0sQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDN0QsTUFBTSxPQUFPLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM3RSxNQUFNLGVBQWUsR0FBMEIsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUN6RCxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRTtRQUMxQixvQkFBb0I7UUFDcEIsTUFBTSxhQUFhLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3pGLDBDQUEwQztRQUMxQyxLQUFLLE1BQU0sWUFBWSxJQUFJLGFBQWEsRUFBRTtZQUN0QyxJQUFJLGVBQWUsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEtBQUssU0FBUyxFQUFFO2dCQUNqRCxNQUFNLEdBQUcsR0FBUyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3RFLE1BQU0sYUFBYSxHQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQy9DLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUNwQyxNQUFNLFlBQVksR0FBVyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDMUQsTUFBTSxRQUFRLEdBQUcsaUJBQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzdDLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsZ0JBQU0sQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDekUsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztpQkFDcEM7Z0JBQ0QsZUFBZSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDcEQ7U0FDSjtLQUNKO0lBQ0QscUJBQXFCO0lBQ3JCLGVBQWUsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUU7UUFDcEMsTUFBTSxPQUFPLEdBQVcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ25FLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDL0IsQ0FBQyxDQUFDLENBQUM7SUFDSCx1QkFBdUI7SUFDdkIsT0FBTyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxpQkFBUSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQWdCLENBQUMsQ0FBQztBQUNqRixDQUFDO0FBQ0QsU0FBUyxZQUFZLENBQUMsU0FBa0IsRUFBRSxRQUFnQixFQUFFLEtBQWEsRUFBRSxXQUFpQixFQUFFLFNBQWlCO0lBQzNHLE1BQU0sWUFBWSxHQUFhLEVBQUUsQ0FBQztJQUNsQyxNQUFNLGVBQWUsR0FBUyxnQkFBTSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM3RCxNQUFNLE9BQU8sR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzdFLE1BQU0sZUFBZSxHQUEwQixJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ3pELEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFO1FBQzFCLG9CQUFvQjtRQUNwQixNQUFNLGFBQWEsR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDekYsMENBQTBDO1FBQzFDLEtBQUssTUFBTSxZQUFZLElBQUksYUFBYSxFQUFFO1lBQ3RDLElBQUksZUFBZSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxTQUFTLEVBQUU7Z0JBQ2pELE1BQU0sR0FBRyxHQUFTLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDdEUsTUFBTSxhQUFhLEdBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDL0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ3BDLE1BQU0sWUFBWSxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUMxRCxNQUFNLFFBQVEsR0FBRyxpQkFBTyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDN0MsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxnQkFBTSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUN6RSxhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2lCQUNwQztnQkFDRCxlQUFlLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQzthQUNwRDtTQUNKO0tBQ0o7SUFDRCwyQ0FBMkM7SUFDM0MsSUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDO0lBQzNCLE1BQU0sWUFBWSxHQUFlLEVBQUUsQ0FBQztJQUNwQyxRQUFRLFFBQVEsRUFBRSxFQUFFLGdDQUFnQztRQUNoRCxLQUFLLGlCQUFRLENBQUMsSUFBSSxDQUFDO1FBQ25CLEtBQUssaUJBQVEsQ0FBQyxJQUFJO1lBQ2QsY0FBYyxHQUFHLElBQUksQ0FBQztZQUN0QixNQUFNLFlBQVksR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xGLEtBQUssTUFBTSxXQUFXLElBQUksWUFBWSxFQUFFO2dCQUNwQyxNQUFNLGlCQUFpQixHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDbEcsWUFBWSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2FBQ3hDO1lBQ0QsTUFBTTtRQUNWLEtBQUssaUJBQVEsQ0FBQyxLQUFLO1lBQ2YsTUFBTSxZQUFZLEdBQVcsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sa0JBQWtCLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3BHLFlBQVksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUN0QyxjQUFjLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2xFLE1BQU07UUFDVixLQUFLLGlCQUFRLENBQUMsSUFBSTtZQUNkLE1BQU0sWUFBWSxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2RixZQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2hDLGNBQWMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0QsTUFBTTtRQUNWO1lBQ0ksTUFBTSxPQUFPLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3RSxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNCLE1BQU07S0FDYjtJQUNELGdCQUFnQjtJQUNoQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNwQyxLQUFLLE1BQU0sV0FBVyxJQUFJLFlBQVksRUFBRTtZQUNwQyxNQUFNLGtCQUFrQixHQUFhLFdBQVcsQ0FBQyxHQUFHLENBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7WUFDekcsTUFBTSxPQUFPLEdBQVcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3hGLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDOUI7S0FDSjtJQUNELGtCQUFrQjtJQUNsQixPQUFPLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlCQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBZ0IsQ0FBQyxDQUFDO0FBQ2pGLENBQUM7QUFDRCxTQUFTLGNBQWMsQ0FBQyxTQUFrQixFQUFFLFFBQWdCLEVBQUUsS0FBYSxFQUFFLFdBQWlCLEVBQUUsU0FBaUI7SUFDN0csTUFBTSxNQUFNLEdBQWtCLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNsRCxNQUFNLEdBQUcsR0FBUyxnQkFBTSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNqRCxNQUFNLE9BQU8sR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzdFLE1BQU0sSUFBSSxHQUFXLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUMxRixrQkFBa0I7SUFDbEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDcEMsTUFBTSxnQkFBZ0IsR0FBZ0IsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsRUFBRSxJQUFJLENBQWdCLENBQUM7UUFDbkcsY0FBYyxDQUFDLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNsRCxNQUFNLENBQUMsaUJBQWlCLEVBQUUsY0FBYyxDQUFDLEdBQXFCLGdCQUFnQixDQUFDO1FBQy9FLE1BQU0sV0FBVyxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNuRyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN6QyxNQUFNLE9BQU8sR0FBUyxnQkFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxpQkFBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDaEU7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDakM7SUFDRCxvQkFBb0I7SUFDcEIsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQztBQUNELFNBQVMsV0FBVyxDQUFDLFNBQWtCLEVBQUUsS0FBYSxFQUFFLGVBQXNDLEVBQUUsU0FBaUI7SUFDN0csTUFBTSxNQUFNLEdBQVcsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pFLDRCQUE0QjtJQUM1QixNQUFNLFVBQVUsR0FBVyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDeEUsTUFBTSxXQUFXLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzNGLE1BQU0sV0FBVyxHQUFhLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDeEcsMEJBQTBCO0lBQzFCLE1BQU0saUJBQWlCLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlFLE1BQU0saUJBQWlCLEdBQWUsRUFBRSxDQUFDO0lBQ3pDLEtBQUssTUFBTSxlQUFlLElBQUksaUJBQWlCLEVBQUU7UUFDN0MsTUFBTSxnQkFBZ0IsR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDckcsTUFBTSxnQkFBZ0IsR0FBYSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDbEgsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDNUM7SUFDRCxtQkFBbUI7SUFDbkIsTUFBTSxNQUFNLEdBQVcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLFdBQVcsRUFBRSxpQkFBaUIsQ0FBRSxDQUFDO0lBQ3BGLE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUFDRCxTQUFTLFFBQVEsQ0FBQyxTQUFrQixFQUFFLFFBQW1DLEVBQ2pFLElBQWlCLEVBQUUsU0FBaUIsRUFBRSxNQUF1QjtJQUNqRSxNQUFNLFdBQVcsR0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFTLENBQUM7SUFDOUUsSUFBSSxnQkFBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUM3QixNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUFnQixRQUF1QixDQUFDO1FBQy9ELDBEQUEwRDtRQUMxRCxJQUFJLFdBQU0sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNsQixPQUFPLFlBQVksQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDekU7UUFDRCw2REFBNkQ7UUFDN0QsSUFBSSxXQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDbEIsT0FBTyxZQUFZLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1NBQzNFO1FBQ0QsNEJBQTRCO1FBQzVCLFFBQVEsTUFBTSxFQUFFO1lBQ1osS0FBSyxlQUFlLENBQUMsS0FBSztnQkFDdEIsT0FBTyxhQUFhLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzdFLEtBQUssZUFBZSxDQUFDLFNBQVM7Z0JBQzFCLE9BQU8saUJBQWlCLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2pGLEtBQUssZUFBZSxDQUFDLElBQUk7Z0JBQ3JCLE9BQU8sWUFBWSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM1RSxLQUFLLGVBQWUsQ0FBQyxNQUFNO2dCQUN2QixPQUFPLGNBQWMsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUU7Z0JBQ0ksTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO1NBQ3pEO0tBQ0o7U0FBTTtRQUNILE1BQU0sWUFBWSxHQUFrQixFQUFFLENBQUM7UUFDdEMsUUFBMEIsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDMUMsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsT0FBTyxDQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ25FLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxZQUFZLENBQUM7S0FDdkI7QUFDTCxDQUFDO0FBQ0QsbUdBQW1HO0FBQ25HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsU0FBZ0IsTUFBTSxDQUFDLFNBQWtCLEVBQUUsUUFBbUIsRUFBRSxPQUFlLEVBQUUsTUFBc0I7SUFDbkcsSUFBSSxlQUFVLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFBRSxPQUFPLEVBQUUsQ0FBQztLQUFFO0lBQ3hDLHNCQUFzQjtJQUN0QixNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUM7SUFDOUIsTUFBTSxRQUFRLEdBQUcsc0JBQVEsQ0FBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFDdEQsQ0FBQyx3QkFBVSxDQUFDLElBQUksRUFBRSx3QkFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQVEsQ0FBQyxLQUFLLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBOEIsQ0FBQztJQUN4SSw0QkFBYyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsMEJBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLHNCQUFzQjtJQUN0QixNQUFNLFlBQVksR0FBa0IsT0FBTyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2xGLE9BQU8sWUFBTyxDQUFDLFlBQVksQ0FBVSxDQUFDO0FBQzFDLENBQUM7QUFWRCx3QkFVQztBQUNELGtDQUFrQztBQUNsQyxJQUFZLGNBS1g7QUFMRCxXQUFZLGNBQWM7SUFDdEIseUNBQXdCLENBQUE7SUFDeEIseUNBQXlCLENBQUE7SUFDekIsaURBQWlDLENBQUE7SUFDakMsaURBQWlDLENBQUE7QUFDckMsQ0FBQyxFQUxXLGNBQWMsR0FBZCxzQkFBYyxLQUFkLHNCQUFjLFFBS3pCO0FBQ0QsU0FBUyxXQUFXLENBQUMsU0FBa0IsRUFBRSxNQUFjLEVBQUUsT0FBZSxFQUFFLE1BQXNCO0lBQzVGLE1BQU0sT0FBTyxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNuRixNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDaEUsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzlELElBQUksUUFBZ0IsQ0FBQztJQUNyQixJQUFJLE1BQU0sS0FBSyxjQUFjLENBQUMsU0FBUyxFQUFFO1FBQ3JDLFFBQVEsR0FBRyxxQkFBVyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ25EO1NBQU0sSUFBSSxNQUFNLEtBQUssY0FBYyxDQUFDLFNBQVMsRUFBRTtRQUM1QyxRQUFRLEdBQUcscUJBQVcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQy9DO1NBQU0sSUFBSSxNQUFNLEtBQUssY0FBYyxDQUFDLGFBQWEsRUFBRTtRQUNoRCxNQUFNLEdBQUcsR0FBVyxtQkFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN6QyxJQUFJLE9BQU8sS0FBSyxDQUFDLEVBQUU7WUFDZixRQUFRLEdBQUcsRUFBRSxDQUFDO1NBQ2pCO2FBQU07WUFDSCxNQUFNLE9BQU8sR0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsQ0FBQztZQUNqRCxNQUFNLFdBQVcsR0FBVyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUQsUUFBUSxHQUFHLHFCQUFXLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztTQUNuRDtLQUNKO1NBQU0sRUFBRSxnQkFBZ0I7UUFDckIsSUFBSSxPQUFPLEtBQUssQ0FBQyxFQUFFO1lBQ2YsUUFBUSxHQUFHLEVBQUUsQ0FBQztTQUNqQjthQUFNO1lBQ0gsTUFBTSxHQUFHLEdBQVcsbUJBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDekMsTUFBTSxPQUFPLEdBQVcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQUM7WUFDbEQsTUFBTSxXQUFXLEdBQVcsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFELFFBQVEsR0FBRyxxQkFBVyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDbkQ7S0FDSjtJQUNELE1BQU0sV0FBVyxHQUFhLEVBQUUsQ0FBQztJQUNqQyxJQUFJLFVBQVUsR0FBVyxNQUFNLENBQUM7SUFDaEMsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUU7UUFDNUIsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDNUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNyRCxNQUFNLFVBQVUsR0FBVyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEYsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3QixVQUFVLEdBQUcsVUFBVSxDQUFDO0tBQzNCO0lBQ0QsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUM3QixPQUFPLFdBQVcsQ0FBQztBQUN2QixDQUFDO0FBQ0QsU0FBUyxPQUFPLENBQUMsU0FBa0IsRUFBRSxRQUFtQyxFQUFFLE9BQWUsRUFBRSxNQUFzQjtJQUM3RyxJQUFJLGdCQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQzdCLE1BQU0sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLEdBQWdCLFFBQXVCLENBQUM7UUFDL0QsSUFBSSxhQUF1QixDQUFDO1FBQzVCLElBQUksQ0FBQyxXQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDbkIsYUFBYSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDOUU7YUFBTTtZQUNILGFBQWEsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzNCO1FBQ0QsTUFBTSxlQUFlLEdBQWEsRUFBRSxDQUFDO1FBQ3JDLEtBQUssTUFBTSxZQUFZLElBQUksYUFBYSxFQUFFO1lBQ3RDLE1BQU0sV0FBVyxHQUFhLFdBQVcsQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNwRixlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUM7U0FDeEM7UUFDRCxPQUFPLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBZ0IsQ0FBQyxDQUFDO0tBQ3hGO1NBQU07UUFDSCxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBSSxRQUEwQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDbkg7QUFDTCxDQUFDO0FBQ0QsbUdBQW1HO0FBQ25HOzs7Ozs7Ozs7R0FTRztBQUNILFNBQWdCLE1BQU0sQ0FBQyxTQUFrQixFQUFFLFFBQW1CO0lBQzFELElBQUksZUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQUUsT0FBTyxFQUFFLENBQUM7S0FBRTtJQUN4QyxzQkFBc0I7SUFDdEIsSUFBSSxRQUFRLEdBQUcsc0JBQVEsQ0FBQyxlQUFlLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxDQUFDLHdCQUFVLENBQUMsSUFBSSxFQUFFLHdCQUFVLENBQUMsUUFBUSxDQUFDLEVBQzdFLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQVEsQ0FBQyxJQUFJO1FBQzNELGlCQUFRLENBQUMsS0FBSyxFQUFFLGlCQUFRLENBQUMsS0FBSyxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN2RixzQkFBc0I7SUFDdEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDN0IsUUFBUSxHQUFHLENBQUMsUUFBUSxDQUFrQixDQUFDO0tBQzFDO0lBQ0QsY0FBYztJQUNkLE1BQU0sV0FBVyxHQUFhLEVBQUUsQ0FBQyxDQUFDLHdCQUF3QjtJQUMxRCxLQUFLLE1BQU0sSUFBSSxJQUFJLFFBQVEsRUFBRTtRQUN6QixNQUFNLE9BQU8sR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlFLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFO1lBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUFFO0tBQzlEO0lBQ0QsTUFBTSxXQUFXLEdBQWMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzlFLE9BQU8sV0FBVyxDQUFDLEdBQUcsQ0FBRSxNQUFNLENBQUMsRUFBRSxDQUFDLFlBQU8sQ0FBQyxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQVcsQ0FBQztBQUNsRixDQUFDO0FBbEJELHdCQWtCQztBQUNELG1HQUFtRztBQUNuRyxVQUFVO0FBRVYsT0FBTztBQUVQLFNBQVM7QUFpQlQsbUdBQW1HO0FBQ25HLFNBQVMsYUFBYSxDQUFDLFNBQWtCLEVBQUUsUUFBdUIsRUFDOUQsY0FBNkM7SUFDakQsSUFBSSxnQkFBVyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNuQyxjQUFjLEdBQUcsQ0FBQyxjQUFjLENBQW9CLENBQUM7S0FDeEQ7SUFDRCxNQUFNLE9BQU8sR0FBYSxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDOUQsTUFBTSxhQUFhLEdBQWUsRUFBRSxDQUFDO0lBQ3JDLEtBQUssTUFBTSxhQUFhLElBQUksY0FBaUMsRUFBRTtRQUMzRCxhQUFhLENBQUMsSUFBSSxDQUFFLGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO0tBQ2xFO0lBQ0QsTUFBTSxNQUFNLEdBQVcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztJQUMxRSxPQUFPLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDL0IsQ0FBQztBQUNEOzs7Ozs7OztFQVFFO0FBQ0YsU0FBUyxhQUFhLENBQUMsU0FBa0IsRUFBRSxTQUFnQixFQUFFLGNBQTZCO0lBQzFGLHNCQUFzQjtJQUN0QixNQUFNLGFBQWEsR0FBRyxzQkFBUSxDQUFDLGNBQWMsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLENBQUMsd0JBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQWtCLENBQUM7SUFDaEksTUFBTSxjQUFjLEdBQUcsc0JBQVEsQ0FBQyxjQUFjLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFDdkUsQ0FBQyx3QkFBVSxDQUFDLFFBQVEsRUFBRSx3QkFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsaUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBa0MsQ0FBQztJQUN2RyxzQkFBc0I7SUFDdEIsTUFBTSxXQUFXLEdBQWdCLGFBQWEsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3pGLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdkIsT0FBTyxZQUFPLENBQUMsV0FBVyxDQUFRLENBQUM7QUFDbkMsQ0FBQztBQUNELG1HQUFtRztBQUNuRzs7Ozs7Ozs7OztHQVVHO0FBQ0gsU0FBZ0IsS0FBSyxDQUFDLFNBQWtCLEVBQUUsUUFBZTtJQUNyRCxzQkFBc0I7SUFDdEIseUhBQXlIO0lBQ3pILHNCQUFzQjtJQUN0QixNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFBQyxPQUFPLElBQUksQ0FBQztBQUNyRCxDQUFDO0FBTEQsc0JBS0MifQ==