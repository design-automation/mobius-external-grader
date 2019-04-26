"use strict";
/**
 * The `make` module has functions for making new entities in the model.
 * All these functions all return the IDs of the entities that are created.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../libs/geo-info/common");
const id_1 = require("../../libs/geo-info/id");
const vectors_1 = require("../../libs/geom/vectors");
const _check_args_1 = require("./_check_args");
const distance_1 = require("../../libs/geom/distance");
// ================================================================================================
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
/**
 * Adds a new position to the model.
 *
 * @param __model__
 * @param coords XYZ coordinates as a list of three numbers.
 * @returns Entities, new position, or a list of new positions, or a list of lists of new positions .
 * @example position1 = make.Position([1,2,3])
 * @example_info Creates a position with coordinates x=1, y=2, z=3.
 * @example_link make.Position.mob&node=1
 */
function Position(__model__, coords) {
    // --- Error Check ---
    _check_args_1.checkCommTypes('make.Position', 'coords', coords, [_check_args_1.TypeCheckObj.isCoord, _check_args_1.TypeCheckObj.isCoordList, _check_args_1.TypeCheckObj.isCoordList_List]);
    // TODO allow to Txyz[][]
    // --- Error Check ---
    const new_ents_arr = _position(__model__, coords);
    return id_1.idsMake(new_ents_arr);
}
exports.Position = Position;
// ================================================================================================
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
    else { // depth === 2 or 3
        return ents_arr.map(_ents_arr => _point(__model__, _ents_arr));
    }
}
/**
 * Adds a new point to the model. If a list of positions is provided as the input, then a list of points is generated.
 *
 * @param __model__
 * @param positions Position of point, or other entities from which positions will be extracted.
 * @returns Entities, new point or a list of new points.
 * @example_info Creates a point at position1.
 * @example point1 = make.Point(position1)
 * @example_info Creates a point at position1.
 * @example_link make.Point.mob&node=1
 */
function Point(__model__, positions) {
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('make.Point', 'positions', positions, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList, _check_args_1.IDcheckObj.isIDList_list], [common_1.EEntType.POSI, common_1.EEntType.VERT, common_1.EEntType.EDGE, common_1.EEntType.WIRE,
        common_1.EEntType.FACE, common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON]);
    // --- Error Check ---
    const new_ents_arr = _point(__model__, ents_arr);
    return id_1.idsMake(new_ents_arr);
}
exports.Point = Point;
// ================================================================================================
// Enums for Polyline()
var _EClose;
(function (_EClose) {
    _EClose["OPEN"] = "open";
    _EClose["CLOSE"] = "close";
})(_EClose = exports._EClose || (exports._EClose = {}));
function _polyline(__model__, ents_arr, close) {
    if (id_1.getArrDepth(ents_arr) === 2) {
        const bool_close = (close === _EClose.CLOSE);
        const posis_i = id_1.idIndicies(ents_arr);
        const pline_i = __model__.geom.add.addPline(posis_i, bool_close);
        return [common_1.EEntType.PLINE, pline_i];
    }
    else {
        return ents_arr.map(ent_arr => _polyline(__model__, ent_arr, close));
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
/**
 * Adds one or more new polylines to the model.
 *
 * @param __model__
 * @param entities List of positions, or list of lists of positions, or entities from which positions can be extracted.
 * @param close Enum, 'open' or 'close'.
 * @returns Entities, new polyline, or a list of new polylines.
 * @example polyline1 = make.Polyline([position1,position2,position3], close)
 * @example_info Creates a closed polyline with vertices position1, position2, position3 in sequence.
 * @example_link make.Polyline.mob&node=1
 */
function Polyline(__model__, entities, close) {
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
// ================================================================================================
function _polygon(__model__, ents_arr) {
    if (id_1.getArrDepth(ents_arr) === 2) {
        const posis_i = id_1.idIndicies(ents_arr);
        const pgon_i = __model__.geom.add.addPgon(posis_i);
        return [common_1.EEntType.PGON, pgon_i];
    }
    else {
        return ents_arr.map(_ents_arr => _polygon(__model__, _ents_arr));
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
/**
 * Adds one or more new polygons to the model.
 *
 * @param __model__
 * @param entities List of positions, or list of lists of positions, or entities from which positions can be extracted.
 * @returns Entities, new polygon, or a list of new polygons.
 * @example polygon1 = make.Polygon([position1,position2,position3])
 * @example_info Creates a polygon with vertices position1, position2, position3 in sequence.
 * @example_link make.Polygon.mob&node=1
 */
function Polygon(__model__, entities) {
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
// ================================================================================================
function _collection(__model__, parent_index, ents_arr) {
    if (id_1.getArrDepth(ents_arr) === 1) {
        ents_arr = [ents_arr];
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
/**
 * Adds a new collection to the model.
 *
 * @param __model__
 * @param parent_coll Collection
 * @param geometry List of points, polylines, polygons.
 * @returns Entities, new collection, or a list of new collections.
 * @example collection1 = make.Collection([point1,polyine1,polygon1])
 * @example_info Creates a collection containing point1, polyline1, polygon1.
 * @example_link make.Collection.mob&node=1
 */
function Collection(__model__, parent_coll, geometry) {
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
    const ents_arr = _check_args_1.checkIDs(fn_name, 'geometry', geometry, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON]);
    // --- Error Check ---
    const new_ent_arr = _collection(__model__, parent_index, ents_arr);
    return id_1.idsMake(new_ent_arr);
}
exports.Collection = Collection;
// ================================================================================================
function _copyGeom(__model__, ents_arr, copy_attributes) {
    if (id_1.getArrDepth(ents_arr) === 1) {
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
    else {
        return ents_arr.map(one_ent => _copyGeom(__model__, one_ent, copy_attributes));
    }
}
function _copyGeomPosis(__model__, ents_arr, copy_attributes) {
    if (id_1.getArrDepth(ents_arr) === 1) {
        ents_arr = [ents_arr];
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
    const all_new_posis_i = Array.from(old_to_new_posis_i_map.values());
    return all_new_posis_i.map(posi_i => [common_1.EEntType.POSI, posi_i]);
}
var _ECopyAttribues;
(function (_ECopyAttribues) {
    _ECopyAttribues["COPY_ATTRIBUTES"] = "copy_attributes";
    _ECopyAttribues["NO_ATTRIBUTES"] = "no_attributes";
})(_ECopyAttribues = exports._ECopyAttribues || (exports._ECopyAttribues = {}));
/**
 * Adds a new copy of specified entities to the model.
 *
 * @param __model__
 * @param entities Position, point, polyline, polygon, collection to be copied.
 * @param copy_positions Enum to create a copy of the existing positions or to reuse the existing positions.
 * @param copy_attributes Enum to copy attributes or to have no attributes copied.
 * @returns Entities, the copied entity or a list of copied entities.
 * @example copy1 = make.Copy([position1,polyine1,polygon1], copy_positions, copy_attributes)
 * @example_info Creates a list containing a copy of the entities in sequence of input.
 */
function Copy(__model__, entities, copy_attributes) {
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('make.Copy', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POSI, common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON, common_1.EEntType.COLL]);
    // --- Error Check ---
    const bool_copy_attribs = (copy_attributes === _ECopyAttribues.COPY_ATTRIBUTES);
    // copy the list of entities
    const new_ents_arr = _copyGeom(__model__, ents_arr, bool_copy_attribs);
    // copy the positions that belong to the list of entities
    _copyGeomPosis(__model__, new_ents_arr, bool_copy_attribs);
    // return only the new entities
    return id_1.idsMake(new_ents_arr);
}
exports.Copy = Copy;
// ================================================================================================
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
/**
 * Makes one or more holes in a polygon.
 * Each hole is defined by a list of positions.
 * The positions must be on the polygon, i.e. they must be co-planar with the polygon and
 * they must be within the boundary of the polygon.
 * If the list of positions consists of a single list, then one hole will be generated.
 * If the list of positions consists of a list of lists, then multiple holes will be generated.
 * ~
 * The hole positions should lie within the polygon surface.
 *
 * @param __model__
 * @param face A polygon or a face to make holes in.
 * @param positions List of positions, or list of lists of positions, or entities from which positions can be extracted.
 * @returns Entities, a list of wires resulting from the hole(s).
 */
function Hole(__model__, face, positions) {
    if (!Array.isArray(positions)) {
        positions = [positions];
    }
    // --- Error Check ---
    const face_ent_arr = _check_args_1.checkIDs('make.Hole', 'face', face, [_check_args_1.IDcheckObj.isID], [common_1.EEntType.FACE, common_1.EEntType.PGON]);
    const holes_ents_arr = _check_args_1.checkIDs('make.Hole', 'positions', positions, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList, _check_args_1.IDcheckObj.isIDList_list], [common_1.EEntType.POSI, common_1.EEntType.WIRE, common_1.EEntType.FACE, common_1.EEntType.PLINE, common_1.EEntType.PGON]);
    // --- Error Check ---
    _getHolePosisFromEnts(__model__, holes_ents_arr);
    const new_ents_arr = _hole(__model__, face_ent_arr, holes_ents_arr);
    return id_1.idsMake(new_ents_arr);
}
exports.Hole = Hole;
// ================================================================================================
// export enum _ELoftMethod {
//     OPEN =  'open',
//     CLOSED  =  'closed'
// }
var _ELoftMethod;
(function (_ELoftMethod) {
    _ELoftMethod["OPEN_QUADS"] = "open_quads";
    _ELoftMethod["CLOSED_QUADS"] = "closed_quads";
    _ELoftMethod["OPEN_STRINGERS"] = "open_stringers";
    _ELoftMethod["CLOSED_STRINGERS"] = "closed_stringers";
    _ELoftMethod["OPEN_RIBS"] = "open_ribs";
    _ELoftMethod["CLOSED_RIBS"] = "closed_ribs";
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
/**
 * Lofts between entities.
 * ~
 * The geometry that is generated depends on the method that is selected.
 * The 'loft_quads' methods will generate polygons.
 * The 'loft_stringers' and 'loft_ribs' methods will generate polylines.
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
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('make.Loft', 'entities', entities, [_check_args_1.IDcheckObj.isIDList, _check_args_1.IDcheckObj.isIDList_list], [common_1.EEntType.EDGE, common_1.EEntType.WIRE, common_1.EEntType.FACE, common_1.EEntType.PLINE, common_1.EEntType.PGON]);
    // --- Error Check ---
    const new_ents_arr = _loft(__model__, ents_arr, divisions, method);
    return id_1.idsMake(new_ents_arr);
}
exports.Loft = Loft;
// The old loft
// export function _Loft(__model__: GIModel, edges: TId[], method: _ELoftMethod): TId[] {
//     // --- Error Check ---
//     const ents_arr = checkIDs('make.Loft', 'edges', edges,
//         [IDcheckObj.isIDList], [EEntType.EDGE, EEntType.WIRE, EEntType.FACE, EEntType.PLINE, EEntType.PGON]) as TEntTypeIdx[];
//     // --- Error Check ---
//     const new_ents_arr: TEntTypeIdx[] = _loft(__model__, ents_arr, method);
//     return idsMake(new_ents_arr) as TId[];
// }
// ================================================================================================
var _EExtrudeMethod;
(function (_EExtrudeMethod) {
    _EExtrudeMethod["QUADS"] = "quads";
    _EExtrudeMethod["STRINGERS"] = "stringers";
    _EExtrudeMethod["RIBS"] = "ribs";
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
/**
 * Extrudes geometry by distance or by vector.
 * - Extrusion of a position, vertex, or point produces polylines;
 * - Extrusion of an edge, wire, or polyline produces polygons;
 * - Extrusion of a face or polygon produces polygons, capped at the top.
 *
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
// the old extrude
// export function _Extrude(__model__: GIModel, entities: TId|TId[], dist: number|Txyz, divisions: number): TId|TId[] {
//     // --- Error Check ---
//     const fn_name = 'make.Extrude';
//     const ents_arr =  checkIDs(fn_name, 'entities', entities,
//         [IDcheckObj.isID, IDcheckObj.isIDList],
//         [EEntType.VERT, EEntType.EDGE, EEntType.WIRE, EEntType.FACE, EEntType.POSI,
//          EEntType.POINT, EEntType.PLINE, EEntType.PGON, EEntType.COLL]) as TEntTypeIdx|TEntTypeIdx[];
//     checkCommTypes(fn_name, 'dist', dist, [TypeCheckObj.isNumber, TypeCheckObj.isVector]);
//     checkCommTypes(fn_name, 'divisions', divisions, [TypeCheckObj.isInt]);
//     // --- Error Check ---
//     const new_ents_arr: TEntTypeIdx[] = _extrude(__model__, ents_arr, dist, divisions);
//     if (!Array.isArray(entities) && new_ents_arr.length === 1) {
//         return idsMake(new_ents_arr[0]) as TId;
//     } else {
//         return idsMake(new_ents_arr) as TId|TId[];
//     }
// }
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
// ================================================================================================
// Divide edge modelling operation
var _EDivideMethod;
(function (_EDivideMethod) {
    _EDivideMethod["BY_NUMBER"] = "by_number";
    _EDivideMethod["BY_LENGTH"] = "by_length";
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
    else { // BY_MIN_LENGTH
        const len = distance_1.distance(start, end);
        const num_div = Math.ceil(len / divisor);
        new_xyzs = vectors_1.interpByNum(start, end, num_div - 1);
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
/**
 * Divides edges in a set of shorter edges.
 * ~
 * If the 'by_number' method is selected, then each edge is divided into a fixed number of equal length shorter edges.
 * If the 'by length' method is selected, then each edge is divided into shorter edges of the specified length.
 * The length of the last segment will be the remainder.
 * If the 'by_min_length' method is selected,
 * then the edge is divided into the maximum number of shorter edges
 * that have a new length that is equal to or greater than the minimum.
 * ~
 * @param __model__
 * @param edges Edges, or entities from which edges can be extracted.
 * @param divisor Segment length or number of segments.
 * @param method Enum, select the method for dividing edges.
 * @returns Entities, a list of new edges resulting from the divide.
 * @example segments1 = make.Divide(edge1, 5, by_number)
 * @example_info Creates a list of 5 equal segments from edge1.
 * @example segments2 = make.Divide(edge1, 5, by_length)
 * @example_info If edge1 has length 13, creates from edge a list of two segments of length 5 and one segment of length 3.
 */
function Divide(__model__, edges, divisor, method) {
    // --- Error Check ---
    const fn_name = 'make.Divide';
    const ents_arr = _check_args_1.checkIDs('make.Copy', 'edges', edges, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.EDGE, common_1.EEntType.WIRE, common_1.EEntType.PLINE, common_1.EEntType.PGON]);
    _check_args_1.checkCommTypes(fn_name, 'divisor', divisor, [_check_args_1.TypeCheckObj.isNumber]);
    // --- Error Check ---
    const new_ents_arr = _divide(__model__, ents_arr, divisor, method);
    return id_1.idsMake(new_ents_arr);
}
exports.Divide = Divide;
// ================================================================================================
/**
 * Unweld vertices so that they do not share positions.
 * For the vertices of the specified entities, if they share positions with other entities in the model,
 * then those positions will be replaced with new positions.
 * This function performs a simple unweld.
 * That is, the vertices within the set of specified entities are not unwelded.
 * @param __model__
 * @param entities Vertex, edge, wire, face, point, polyline, polygon, collection.
 * @param method Enum; the method to use for unweld.
 * @returns Entities, a list of new positions resulting from the unweld.
 * @example mod.Unweld(polyline1)
 * @example_info Unwelds polyline1 from all ther entities that shares the same position.
 */
function Unweld(__model__, entities) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFrZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL21vZHVsZXMvbWFrZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOztBQU9ILHVEQUE0RjtBQUM1RiwrQ0FDcUY7QUFFckYscURBQXVHO0FBRXZHLCtDQUFtRjtBQUNuRix1REFBb0Q7QUFFcEQsbUdBQW1HO0FBQ25HLFNBQVMsU0FBUyxDQUFDLFNBQWtCLEVBQUUsTUFBNEI7SUFDL0QsTUFBTSxLQUFLLEdBQVcsZ0JBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQyxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUU7UUFDYixNQUFNLE1BQU0sR0FBUyxNQUFjLENBQUM7UUFDcEMsTUFBTSxNQUFNLEdBQVcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEQsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxxQkFBWSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN6RixPQUFPLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFnQixDQUFDO0tBQ2pEO1NBQU0sSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1FBQ3BCLE1BQU0sT0FBTyxHQUFXLE1BQWdCLENBQUM7UUFDekMsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBa0IsQ0FBQztLQUM3RTtTQUFNO1FBQ0gsTUFBTSxPQUFPLEdBQWEsTUFBa0IsQ0FBQztRQUM3QyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFvQixDQUFDO0tBQ2pGO0FBQ0wsQ0FBQztBQUNE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