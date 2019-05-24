"use strict";
/**
 * The `modify` module has functions for modifying existing entities in the model.
 * These functions do not make any new entities, but they may change attribute values.
 * All these functions all return void.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../libs/geo-info/common");
const id_1 = require("../../libs/geo-info/id");
const vectors_1 = require("../../libs/geom/vectors");
const _check_args_1 = require("./_check_args");
const matrix_1 = require("../../libs/geom/matrix");
const underscore_1 = __importDefault(require("underscore"));
// ================================================================================================
/**
 * Moves entities. The directio and distance if movement is specified as a vector.
 * ~
 * If only one vector is given, then all entities are moved by the same vector.
 * If a list of vectors is given, the each entity will be moved by a different vector.
 * In this case, the number of vectors should be equal to the number of entities.
 * ~
 * If a position is shared between entites that are being moved by different vectors,
 * then the position will be moved by the average of the vectors.
 *
 * @param __model__
 * @param entities An entity or list of entities.
 * @param vector A vector or a list of vectors.
 * @returns void
 * @example modify.Move(pline1, [1,2,3])
 * @example_info Moves pline1 by [1,2,3].
 * @example modify.Move([pos1, pos2, pos3], [[0,0,1], [0,0,1], [0,1,0]] )
 * @example_info Moves pos1 by [0,0,1], pos2 by [0,0,1], and pos3 by [0,1,0].
 * @example modify.Move([pgon1, pgon2], [1,2,3] )
 * @example_info Moves both pgon1 and pgon2 by [1,2,3].
 */
function Move(__model__, entities, vectors) {
    // --- Error Check ---
    const fn_name = 'modify.Move';
    let ents_arr = _check_args_1.checkIDs(fn_name, 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POSI, common_1.EEntType.VERT, common_1.EEntType.EDGE, common_1.EEntType.WIRE,
        common_1.EEntType.FACE, common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON, common_1.EEntType.COLL]);
    _check_args_1.checkCommTypes(fn_name, 'vectors', vectors, [_check_args_1.TypeCheckObj.isVector, _check_args_1.TypeCheckObj.isVectorList]);
    // --- Error Check ---
    if (!Array.isArray(ents_arr[0])) {
        ents_arr = [ents_arr];
    }
    if (id_1.getArrDepth(vectors) === 1) {
        const posis_i = [];
        const vec = vectors;
        for (const ents of ents_arr) {
            __model__.geom.query.navAnyToPosi(ents[0], ents[1]).forEach(posi_i => posis_i.push(posi_i));
        }
        const unique_posis_i = Array.from(new Set(posis_i));
        for (const unique_posi_i of unique_posis_i) {
            const old_xyz = __model__.attribs.query.getPosiCoords(unique_posi_i);
            const new_xyz = vectors_1.vecAdd(old_xyz, vec);
            __model__.attribs.add.setPosiCoords(unique_posi_i, new_xyz);
        }
    }
    else {
        if (ents_arr.length !== vectors.length) {
            throw new Error('If multiple vectors are given, then the number of vectors must be equal to the number of entities.');
        }
        const posis_i = [];
        const vecs_map = new Map();
        for (let i = 0; i < ents_arr.length; i++) {
            const [ent_type, index] = ents_arr[i];
            const vec = vectors[i];
            const ent_posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
            for (const ent_posi_i of ent_posis_i) {
                posis_i.push(ent_posi_i);
                if (!vecs_map.has(ent_posi_i)) {
                    vecs_map.set(ent_posi_i, []);
                }
                vecs_map.get(ent_posi_i).push(vec);
            }
        }
        for (const posi_i of posis_i) {
            const old_xyz = __model__.attribs.query.getPosiCoords(posi_i);
            const vecs = vecs_map.get(posi_i);
            const vec = vectors_1.vecDiv(vectors_1.vecSum(vecs), vecs.length);
            const new_xyz = vectors_1.vecAdd(old_xyz, vec);
            __model__.attribs.add.setPosiCoords(posi_i, new_xyz);
        }
    }
    return; // specifies that nothing is returned
}
exports.Move = Move;
// ================================================================================================
/**
 * Rotates entities on plane by angle.
 * @param __model__
 * @param entities Vertex, edge, wire, face, plane, position, point, polyline, polygon, collection.
 * @param origin A list of three numbers (or a position, point, or vertex).
 * @param axis A list of three numbers.
 * @param angle Angle (in radians).
 * @returns void
 * @example modify.Rotate(polyline1, plane1, PI)
 * @example_info Rotates polyline1 on plane1 by PI (i.e. 180 degrees).
 */
function Rotate(__model__, entities, origin, axis, angle) {
    // --- Error Check ---
    const fn_name = 'modify.Rotate';
    let ents_arr = _check_args_1.checkIDs(fn_name, 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POSI, common_1.EEntType.VERT, common_1.EEntType.EDGE, common_1.EEntType.WIRE,
        common_1.EEntType.FACE, common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON, common_1.EEntType.COLL]);
    const ori_ents_arr = _check_args_1.checkCommTypes(fn_name, 'origin', origin, [_check_args_1.TypeCheckObj.isOrigin, _check_args_1.TypeCheckObj.isPlane]);
    _check_args_1.checkCommTypes(fn_name, 'axis', axis, [_check_args_1.TypeCheckObj.isXYZlist]);
    _check_args_1.checkCommTypes(fn_name, 'angle', angle, [_check_args_1.TypeCheckObj.isNumber]);
    // --- Error Check ---
    // handle geometry type
    if (!Array.isArray(ents_arr[0])) {
        ents_arr = [ents_arr];
    }
    // handle origin type
    if (!Array.isArray(origin)) {
        const origin_posi = __model__.geom.query.navAnyToPosi(ori_ents_arr[0], ori_ents_arr[1]);
        origin = __model__.attribs.query.getPosiCoords(origin_posi[0]);
    }
    if (Array.isArray(origin) && Array.isArray(origin[0])) { // handles plane type
        origin = origin[0];
    }
    // rotate all positions
    const posis_i = [];
    for (const ents of ents_arr) {
        posis_i.push(...__model__.geom.query.navAnyToPosi(ents[0], ents[1]));
    }
    const unique_posis_i = Array.from(new Set(posis_i));
    const matrix = matrix_1.rotateMatrix(origin, axis, angle);
    for (const unique_posi_i of unique_posis_i) {
        const old_xyz = __model__.attribs.query.getPosiCoords(unique_posi_i);
        const new_xyz = matrix_1.multMatrix(old_xyz, matrix);
        __model__.attribs.add.setPosiCoords(unique_posi_i, new_xyz);
    }
    return; // specifies that nothing is returned
}
exports.Rotate = Rotate;
// ================================================================================================
/**
 * Scales entities on plane by factor.
 * @param __model__
 * @param entities Vertex, edge, wire, face, plane, position, point, polyline, polygon, collection.
 * @param origin Position, point, vertex, list of three numbers, plane.
 * @param scale Scale factor.
 * @returns void
 * @example modify.Scale(entities, plane1, 0.5)
 * @example_info Scales entities by 0.5 on plane1.
 */
function Scale(__model__, entities, origin, scale) {
    // --- Error Check ---
    const fn_name = 'modify.Scale';
    let ents_arr = _check_args_1.checkIDs(fn_name, 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POSI, common_1.EEntType.VERT, common_1.EEntType.EDGE, common_1.EEntType.WIRE,
        common_1.EEntType.FACE, common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON, common_1.EEntType.COLL]);
    const ori_ents_arr = _check_args_1.checkCommTypes(fn_name, 'origin', origin, [_check_args_1.TypeCheckObj.isOrigin, _check_args_1.TypeCheckObj.isPlane]);
    _check_args_1.checkCommTypes(fn_name, 'scale', scale, [_check_args_1.TypeCheckObj.isNumber, _check_args_1.TypeCheckObj.isXYZlist]);
    // --- Error Check ---
    // handle geometry type
    if (!Array.isArray(ents_arr[0])) {
        ents_arr = [ents_arr];
    }
    // handle origin type
    if (!Array.isArray(origin)) {
        const origin_posi = __model__.geom.query.navAnyToPosi(ori_ents_arr[0], ori_ents_arr[1]);
        origin = __model__.attribs.query.getPosiCoords(origin_posi[0]);
    }
    // handle scale type
    if (!Array.isArray(scale)) {
        scale = [scale, scale, scale];
    }
    // scale all positions
    const posis_i = [];
    for (const ents of ents_arr) {
        posis_i.push(...__model__.geom.query.navAnyToPosi(ents[0], ents[1]));
    }
    const unique_posis_i = Array.from(new Set(posis_i));
    const matrix = matrix_1.scaleMatrix(origin, scale);
    for (const unique_posi_i of unique_posis_i) {
        const old_xyz = __model__.attribs.query.getPosiCoords(unique_posi_i);
        const new_xyz = matrix_1.multMatrix(old_xyz, matrix);
        __model__.attribs.add.setPosiCoords(unique_posi_i, new_xyz);
    }
    return; // specifies that nothing is returned
}
exports.Scale = Scale;
// ================================================================================================
/**
 * Mirrors entities across plane.
 * @param __model__
 * @param entities Vertex, edge, wire, face, plane, position, point, polyline, polygon, collection.
 * @param origin Position, vertex, point, list of three numbers.
 * @param direction Vector or a list of three numbers.
 * @returns void
 * @example modify.Mirror(polygon1, plane1)
 * @example_info Mirrors polygon1 across plane1.
 */
function Mirror(__model__, entities, origin, direction) {
    // --- Error Check ---
    const fn_name = 'modify.Mirror';
    let ents_arr = _check_args_1.checkIDs(fn_name, 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POSI, common_1.EEntType.VERT, common_1.EEntType.EDGE, common_1.EEntType.WIRE,
        common_1.EEntType.FACE, common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON, common_1.EEntType.COLL]);
    const ori_ents_arr = _check_args_1.checkCommTypes(fn_name, 'origin', origin, [_check_args_1.TypeCheckObj.isOrigin]);
    _check_args_1.checkCommTypes(fn_name, 'direction', direction, [_check_args_1.TypeCheckObj.isVector]);
    // --- Error Check ---
    // handle geometry type
    if (!Array.isArray(ents_arr[0])) {
        ents_arr = [ents_arr];
    }
    // handle origin type
    if (!Array.isArray(origin)) {
        const [origin_ent_type, origin_index] = ori_ents_arr;
        const origin_posi = __model__.geom.query.navAnyToPosi(origin_ent_type, origin_index);
        origin = __model__.attribs.query.getPosiCoords(origin_posi[0]);
    }
    // mirror all positions
    const posis_i = [];
    for (const ents of ents_arr) {
        const [ent_type, index] = ents;
        posis_i.push(...__model__.geom.query.navAnyToPosi(ent_type, index));
    }
    const unique_posis_i = Array.from(new Set(posis_i));
    const matrix = matrix_1.mirrorMatrix(origin, direction);
    for (const unique_posi_i of unique_posis_i) {
        const old_xyz = __model__.attribs.query.getPosiCoords(unique_posi_i);
        const new_xyz = matrix_1.multMatrix(old_xyz, matrix);
        __model__.attribs.add.setPosiCoords(unique_posi_i, new_xyz);
    }
}
exports.Mirror = Mirror;
// ================================================================================================
/**
 * Transforms entities from one construction plane to another.
 * @param __model__
 * @param entities Vertex, edge, wire, face, position, point, polyline, polygon, collection.
 * @param from Plane defining target construction plane.
 * @param to Plane defining destination construction plane.
 * @returns void
 * @example modify.XForm(polygon1, plane1, plane2)
 * @example_info Transforms polygon1 from plane1 to plane2.
 */
function XForm(__model__, entities, from, to) {
    // --- Error Check ---
    const fn_name = 'modify.XForm';
    let ents_arr = _check_args_1.checkIDs(fn_name, 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POSI, common_1.EEntType.VERT, common_1.EEntType.EDGE, common_1.EEntType.WIRE,
        common_1.EEntType.FACE, common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON, common_1.EEntType.COLL]);
    _check_args_1.checkCommTypes(fn_name, 'from', from, [_check_args_1.TypeCheckObj.isPlane]);
    _check_args_1.checkCommTypes(fn_name, 'to', to, [_check_args_1.TypeCheckObj.isPlane]);
    // --- Error Check ---
    // handle geometry type
    if (!Array.isArray(ents_arr[0])) {
        ents_arr = [ents_arr];
    }
    // xform all positions
    const posis_i = [];
    for (const ents of ents_arr) {
        const [ent_type, index] = ents;
        posis_i.push(...__model__.geom.query.navAnyToPosi(ent_type, index));
    }
    const unique_posis_i = Array.from(new Set(posis_i));
    const matrix = matrix_1.xfromSourceTargetMatrix(from, to);
    for (const unique_posi_i of unique_posis_i) {
        const old_xyz = __model__.attribs.query.getPosiCoords(unique_posi_i);
        const new_xyz = matrix_1.multMatrix(old_xyz, matrix);
        __model__.attribs.add.setPosiCoords(unique_posi_i, new_xyz);
    }
}
exports.XForm = XForm;
// ================================================================================================
var _EModifyCollectionMethod;
(function (_EModifyCollectionMethod) {
    _EModifyCollectionMethod["SET_PARENT_ENTITY"] = "set_parent";
    _EModifyCollectionMethod["ADD_ENTITIES"] = "add_entities";
    _EModifyCollectionMethod["REMOVE_ENTITIES"] = "remove_entities";
})(_EModifyCollectionMethod = exports._EModifyCollectionMethod || (exports._EModifyCollectionMethod = {}));
function _collection(__model__, coll_arr, ents_arr, method) {
    const [_, coll_i] = coll_arr;
    if (id_1.getArrDepth(ents_arr) === 1 && ents_arr.length) {
        ents_arr = [ents_arr];
    }
    ents_arr = ents_arr;
    if (method === _EModifyCollectionMethod.SET_PARENT_ENTITY) {
        if (ents_arr.length !== 1) {
            throw new Error('Error setting collection parent. A collection can only have one parent.');
        }
        const [parent_ent_type, parent_coll_i] = ents_arr[0];
        if (parent_ent_type !== common_1.EEntType.COLL) {
            throw new Error('Error setting collection parent. The parent must be another collection.');
        }
        __model__.geom.modify.setCollParent(coll_i, parent_coll_i);
        return;
    }
    const points_i = [];
    const plines_i = [];
    const pgons_i = [];
    for (const [ent_type, ent_i] of ents_arr) {
        switch (ent_type) {
            case common_1.EEntType.POINT:
                points_i.push(ent_i);
                break;
            case common_1.EEntType.PLINE:
                plines_i.push(ent_i);
                break;
            case common_1.EEntType.PGON:
                pgons_i.push(ent_i);
                break;
            default:
                throw new Error('Error modifying collection. A collection can only contain points, polylines, and polygons.');
        }
    }
    if (method === _EModifyCollectionMethod.ADD_ENTITIES) {
        __model__.geom.modify.collAddEnts(coll_i, points_i, plines_i, pgons_i);
    }
    else { // Remove entities
        __model__.geom.modify.collRemoveEnts(coll_i, points_i, plines_i, pgons_i);
    }
}
/**
 * Modifies a collection.
 * ~
 * If the method is 'set_parent', then the parent can be updated by specifying a parent collection.
 * If the method is 'add_entities', then entities are added to the collection.
 * If the method is 'remove_entities', then entities are removed from the collection.
 * If adding or removing entities, then the entities must be points, polylines, or polygons.
 *
 * @param __model__
 * @param coll The collection to be updated.
 * @param entities Points, polylines, and polygons, or a single collection.
 * @param method Enum, the method to use when modifying the collection.
 * @returns void
 */
function Collection(__model__, coll, entities, method) {
    // --- Error Check ---
    const coll_arr = _check_args_1.checkIDs('modify.Collection', 'coll', coll, [_check_args_1.IDcheckObj.isID], [common_1.EEntType.COLL]);
    const ents_arr = _check_args_1.checkIDs('modify.Collection', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON, common_1.EEntType.COLL]);
    // --- Error Check ---
    _collection(__model__, coll_arr, ents_arr, method);
}
exports.Collection = Collection;
// ================================================================================================
function _reverse(__model__, ents_arr) {
    if (id_1.getArrDepth(ents_arr) === 1 && ents_arr.length) {
        const [ent_type, index] = ents_arr;
        const wires_i = __model__.geom.query.navAnyToWire(ent_type, index);
        wires_i.forEach(wire_i => __model__.geom.modify.reverse(wire_i));
    }
    else {
        ents_arr.forEach(ent_arr => _reverse(__model__, ent_arr));
    }
}
/**
 * Reverses direction of entities.
 * @param __model__
 * @param entities Wire, face, polyline, polygon.
 * @returns void
 * @example modify.Reverse(face1)
 * @example_info Flips face1 and reverses its normal.
 * @example modify.Reverse(polyline1)
 * @example_info Reverses the order of vertices to reverse the direction of the polyline.
 */
function Reverse(__model__, entities) {
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('modify.Reverse', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.WIRE, common_1.EEntType.PLINE, common_1.EEntType.FACE, common_1.EEntType.PGON]);
    // --- Error Check ---
    _reverse(__model__, ents_arr);
}
exports.Reverse = Reverse;
// ================================================================================================
function _shift(__model__, ents_arr, offset) {
    if (id_1.getArrDepth(ents_arr) === 1 && ents_arr.length) {
        const [ent_type, index] = ents_arr;
        const wires_i = __model__.geom.query.navAnyToWire(ent_type, index);
        wires_i.forEach(wire_i => __model__.geom.modify.shift(wire_i, offset));
    }
    else {
        ents_arr.forEach(ent_arr => _shift(__model__, ent_arr, offset));
    }
}
/**
 * Shifts the order of the edges in a closed wire.
 * ~
 * In a closed wire, any edge (or vertex) could be the first edge of the ring.
 * In some cases, it is useful to have an edge in a particular position in a ring.
 * This function allows the edges to be shifted either forwards or backwards around the ring.
 * The order of the edges in the ring will remain unchanged.
 *
 * @param __model__
 * @param entities Wire, face, polyline, polygon.
 * @returns void
 * @example modify.Shift(face1, 1)
 * @example_info Shifts the edges in the face wire, so that the every edge moves up by one position
 * in the ring. The last edge will become the first edge .
 * @example modify.Shift(polyline1, -1)
 * @example_info Shifts the edges in the closed polyline wire, so that every edge moves back by one position
 * in the ring. The first edge will become the last edge.
 */
function Shift(__model__, entities, offset) {
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('modify.Reverse', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.WIRE, common_1.EEntType.PLINE, common_1.EEntType.FACE, common_1.EEntType.PGON]);
    // --- Error Check ---
    _shift(__model__, ents_arr, offset);
}
exports.Shift = Shift;
// ================================================================================================
function _close(__model__, ents_arr) {
    if (id_1.getArrDepth(ents_arr) === 1 && ents_arr.length) {
        const [ent_type, index] = ents_arr;
        let wire_i = index;
        if (ent_type === common_1.EEntType.PLINE) {
            wire_i = __model__.geom.query.navPlineToWire(index);
        }
        else if (ent_type !== common_1.EEntType.WIRE) {
            throw new Error('modify.Close: Entity is of wrong type. It must be either a polyline or a wire.');
        }
        __model__.geom.modify.closeWire(wire_i);
    }
    else {
        for (const ents of ents_arr) {
            _close(__model__, ents);
        }
    }
}
/**
 * Closes polyline(s) if open.
 * @param __model__
 * @param lines Polyline(s).
 * @returns void
 * @example modify.Close([polyline1,polyline2,...])
 * @example_info If open, polylines are changed to closed; if already closed, nothing happens.
 */
function Close(__model__, lines) {
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('modify.Close', 'lines', lines, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.PLINE]);
    // --- Error Check ---
    _close(__model__, ents_arr);
}
exports.Close = Close;
// ================================================================================================
// AttribPush modelling operation
var _EPromoteMethod;
(function (_EPromoteMethod) {
    _EPromoteMethod["FIRST"] = "first";
    _EPromoteMethod["LAST"] = "last";
    _EPromoteMethod["AVERAGE"] = "average";
    _EPromoteMethod["MEDIAN"] = "median";
    _EPromoteMethod["SUM"] = "sum";
    _EPromoteMethod["MIN"] = "min";
    _EPromoteMethod["MAX"] = "max";
})(_EPromoteMethod = exports._EPromoteMethod || (exports._EPromoteMethod = {}));
// Promote modelling operation
var _EPromoteTarget;
(function (_EPromoteTarget) {
    _EPromoteTarget["POSI"] = "positions";
    _EPromoteTarget["VERT"] = "vertices";
    _EPromoteTarget["EDGE"] = "edges";
    _EPromoteTarget["WIRE"] = "wires";
    _EPromoteTarget["FACE"] = "faces";
    _EPromoteTarget["POINT"] = "points";
    _EPromoteTarget["PLINE"] = "plines";
    _EPromoteTarget["PGON"] = "pgons";
    _EPromoteTarget["COLL"] = "collections";
    _EPromoteTarget["MOD"] = "model";
})(_EPromoteTarget = exports._EPromoteTarget || (exports._EPromoteTarget = {}));
function _convertPromoteMethod(selection) {
    switch (selection) {
        case _EPromoteMethod.AVERAGE:
            return common_1.EAttribPromote.AVERAGE;
        case _EPromoteMethod.MEDIAN:
            return common_1.EAttribPromote.MEDIAN;
        case _EPromoteMethod.SUM:
            return common_1.EAttribPromote.SUM;
        case _EPromoteMethod.MIN:
            return common_1.EAttribPromote.MIN;
        case _EPromoteMethod.MAX:
            return common_1.EAttribPromote.MAX;
        case _EPromoteMethod.FIRST:
            return common_1.EAttribPromote.FIRST;
        case _EPromoteMethod.LAST:
            return common_1.EAttribPromote.LAST;
        default:
            break;
    }
}
function _convertPromoteTarget(selection) {
    switch (selection) {
        case _EPromoteTarget.POSI:
            return common_1.EEntType.POSI;
        case _EPromoteTarget.VERT:
            return common_1.EEntType.VERT;
        case _EPromoteTarget.EDGE:
            return common_1.EEntType.EDGE;
        case _EPromoteTarget.WIRE:
            return common_1.EEntType.WIRE;
        case _EPromoteTarget.FACE:
            return common_1.EEntType.FACE;
        case _EPromoteTarget.POINT:
            return common_1.EEntType.POINT;
        case _EPromoteTarget.PLINE:
            return common_1.EEntType.PLINE;
        case _EPromoteTarget.PGON:
            return common_1.EEntType.PGON;
        case _EPromoteTarget.COLL:
            return common_1.EEntType.COLL;
        case _EPromoteTarget.MOD:
            return common_1.EEntType.MOD;
        default:
            break;
    }
}
/**
 * Pushes existing attribute values onto other entities.
 * Attribute values can be promoted up the hierarchy, demoted down the hierarchy, or transferred across the hierarchy.
 * ~
 * In certain cases, when attributes are pushed, they may be aggregated. For example, if you are pushing attributes
 * from vertices to polygons, then there will be multiple vertex attributes that can be combined in
 * different ways.
 * The 'method' specifies how the attributes should be aggregated. Note that if no aggregation is required
 * then the aggregation method is ignored.
 * ~
 * The aggregation methods consist of numerical functions such as average, median, sum, max, and min. These will
 * only work if the attribute values are numbers or lists of numbers. If the attribute values are string, then
 * the numerical functions are ignored.
 * ~
 * If the attribute values are lists of numbers, then these aggregation methods work on the individual items in the list.
 * For example, lets say you have an attribute consisting of normal vectors on vertices. If you push these attributes
 * down to the positions, then aggregation may be required, since multiple vertices can share the same position.
 * In this case, if you choose the `average` aggregation method, then resulting vectors on the positions will be the
 * average of vertex vectors.
 *
 * @param __model__
 * @param entities The entities that currently contain the attribute values.
 * @param attrib_name The name of the attribute to be promoted, demoted, or transferred.
 * @param to_level Enum; The level to which to promote, demote, or transfer the attribute values.
 * @param method Enum; The method to use when attribute values need to be aggregated.
 * @returns void
 * @example promote1 = modify.PushAttribs([pgon1, pgon2], 'area', collections, sum)
 * @example_info For the two polygons (pgon1 and pgon2), it gets the attribute values from the attribute called `area`,
 * and pushes them up to the collection level. The `sum` method specifies that the two areas should be added up.
 * Note that in order to create an attribute at the collection level, the two polygons should be part of a
 * collection. If they are not part of the collection, then no attribute values will be push.
 */
function PushAttribs(__model__, entities, attrib_name, to_level, method) {
    // --- Error Check ---
    let ents_arr;
    if (entities !== null) {
        ents_arr = _check_args_1.checkIDs('modify.Attribute', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], null);
    }
    else {
        ents_arr = null;
    }
    // --- Error Check ---
    let from_ent_type;
    const indices = [];
    if (ents_arr !== null) {
        const ents_arrs = ((id_1.getArrDepth(ents_arr) === 1) ? [ents_arr] : ents_arr);
        from_ent_type = ents_arrs[0][0];
        for (const [ent_type, index] of ents_arrs) {
            if (ent_type !== from_ent_type) {
                throw new Error('All entities must be of the same type.');
            }
            indices.push(index);
        }
    }
    else {
        from_ent_type = common_1.EEntType.MOD;
    }
    const to_ent_type = _convertPromoteTarget(to_level);
    const promote_method = _convertPromoteMethod(method);
    if (from_ent_type === to_ent_type) {
        __model__.attribs.add.transferAttribValues(from_ent_type, attrib_name, indices, promote_method);
    }
    else {
        __model__.attribs.add.promoteAttribValues(from_ent_type, attrib_name, indices, to_ent_type, promote_method);
    }
}
exports.PushAttribs = PushAttribs;
// ================================================================================================
/**
 * Welds entities together.
 * @param __model__
 * @param entities Vertex, edge, wire, face, position, point, polyline, polygon, collection.
 * @returns void
 * @example modify.Weld([polyline1,polyline2])
 * @example_info Welds both polyline1 and polyline2 together. Entities must be of the same type.
 */
function _Weld(__model__, entities) {
    // --- Error Check ---
    // const ents_arr = checkIDs('modify.Weld', 'entities', entities, [IDcheckObj.isIDList],
    //                          [EEntType.POSI, EEntType.VERT, EEntType.EDGE, EEntType.WIRE,
    //                           EEntType.FACE, EEntType.POINT, EEntType.PLINE, EEntType.PGON, EEntType.COLL]);
    // --- Error Check ---
    throw new Error('Not implemented.');
}
exports._Weld = _Weld;
// ================================================================================================
// Stuff for Delete()
var _EDeleteMethod;
(function (_EDeleteMethod) {
    _EDeleteMethod["DEL_UNUSED_POINTS"] = "del_unused_posis";
    _EDeleteMethod["KEEP_UNUSED_POINTS"] = "keep_unused_posis";
})(_EDeleteMethod = exports._EDeleteMethod || (exports._EDeleteMethod = {}));
function _delete(__model__, ents_arr, del_unused_posis) {
    ents_arr = ((id_1.getArrDepth(ents_arr) === 1) ? [ents_arr] : ents_arr);
    const colls_i = [];
    const pgons_i = [];
    const plines_i = [];
    const points_i = [];
    const posis_i = [];
    for (const ent_arr of ents_arr) {
        const [ent_type, index] = ent_arr;
        if (id_1.isColl(ent_type)) {
            colls_i.push(index);
        }
        else if (id_1.isPgon(ent_type)) {
            pgons_i.push(index);
        }
        else if (id_1.isPline(ent_type)) {
            plines_i.push(index);
        }
        else if (id_1.isPoint(ent_type)) {
            points_i.push(index);
        }
        else if (id_1.isPosi(ent_type)) {
            posis_i.push(index);
        }
    }
    __model__.geom.modify.delColls(colls_i, del_unused_posis);
    __model__.geom.modify.delPgons(pgons_i, del_unused_posis);
    __model__.geom.modify.delPlines(plines_i, del_unused_posis);
    __model__.geom.modify.delPoints(points_i, del_unused_posis);
    __model__.geom.modify.delPosis(posis_i);
}
/**
 * Deletes geometric entities: positions, points, polylines, polygons, and collections.
 * When deleting positions, any topology that requires those positions will also be deleted.
 * (For example, any vertices linked to the deleted position will also be deleted,
 * which may in turn result in some edges being deleted, and so forth.)
 * For positions, the selection to delete or keep unused positions is ignored.
 * When deleting objects (point, polyline, and polygons), topology is also deleted.
 * When deleting collections, none of the objects in the collection are deleted.
 * @param __model__
 * @param entities Position, point, polyline, polygon, collection.
 * @param del_unused_posis Enum, delete or keep unused positions.
 * @returns void
 * @example modify.Delete(polygon1)
 * @example_info Deletes polygon1 from the model.
 */
function Delete(__model__, entities, del_unused_posis) {
    // @ts-ignore
    if (Array.isArray(entities)) {
        entities = underscore_1.default.flatten(entities);
    }
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('modify.Delete', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POSI, common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON, common_1.EEntType.COLL]);
    // --- Error Check ---
    const bool_del_unused_posis = (del_unused_posis === _EDeleteMethod.DEL_UNUSED_POINTS);
    _delete(__model__, ents_arr, bool_del_unused_posis);
}
exports.Delete = Delete;
// ================================================================================================
function _keep(__model__, ents_arr) {
    ents_arr = ((id_1.getArrDepth(ents_arr) === 1) ? [ents_arr] : ents_arr);
    const colls_i = new Set();
    const pgons_i = new Set();
    const plines_i = new Set();
    const points_i = new Set();
    const posis_i = new Set();
    for (const ent_arr of ents_arr) {
        const [ent_type, index] = ent_arr;
        if (id_1.isColl(ent_type)) {
            colls_i.add(index);
            for (const pgon_i of __model__.geom.query.navCollToPgon(index)) {
                pgons_i.add(pgon_i);
            }
            for (const pline_i of __model__.geom.query.navCollToPline(index)) {
                plines_i.add(pline_i);
            }
            for (const point_i of __model__.geom.query.navCollToPoint(index)) {
                points_i.add(point_i);
            }
        }
        else if (id_1.isPgon(ent_type)) {
            pgons_i.add(index);
        }
        else if (id_1.isPline(ent_type)) {
            plines_i.add(index);
        }
        else if (id_1.isPoint(ent_type)) {
            points_i.add(index);
        }
        else if (id_1.isPosi(ent_type)) {
            posis_i.add(index);
        }
    }
    const all_colls_i = __model__.geom.query.getEnts(common_1.EEntType.COLL, false);
    const del_colls_i = all_colls_i.filter(coll_i => !colls_i.has(coll_i));
    __model__.geom.modify.delColls(del_colls_i, false);
    const all_pgons_i = __model__.geom.query.getEnts(common_1.EEntType.PGON, false);
    const del_pgons_i = all_pgons_i.filter(pgon_i => !pgons_i.has(pgon_i));
    __model__.geom.modify.delPgons(del_pgons_i, false);
    const all_plines_i = __model__.geom.query.getEnts(common_1.EEntType.PLINE, false);
    const del_plines_i = all_plines_i.filter(pline_i => !plines_i.has(pline_i));
    __model__.geom.modify.delPlines(del_plines_i, false);
    const all_points_i = __model__.geom.query.getEnts(common_1.EEntType.POINT, false);
    const del_points_i = all_points_i.filter(point_i => !points_i.has(point_i));
    __model__.geom.modify.delPoints(del_points_i, false);
    // finally, only del posis that are unused and that are not in the keep list
    const all_unused_posis_i = __model__.geom.query.getUnusedPosis(false);
    const del_posis_i = all_unused_posis_i.filter(posi_i => !posis_i.has(posi_i));
    __model__.geom.modify.delPosis(del_posis_i);
}
/**
 * Keeps the specified geometric entities: positions, points, polylines, polygons, and collections.
 * Everything else in the model is deleted.
 * When a collection is kept, all objects inside the collection are also kept.
 * When an object is kept, all positions used by the object are also kept.
 *
 * @param __model__
 * @param entities Position, point, polyline, polygon, collection.
 * @returns void
 * @example modify.Delete(polygon1)
 * @example_info Deletes polygon1 from the model.
 */
function Keep(__model__, entities) {
    // @ts-ignore
    if (Array.isArray(entities)) {
        entities = underscore_1.default.flatten(entities);
    }
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('modify.Delete', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POSI, common_1.EEntType.POINT, common_1.EEntType.PLINE, common_1.EEntType.PGON, common_1.EEntType.COLL]);
    // --- Error Check ---
    _keep(__model__, ents_arr);
}
exports.Keep = Keep;
// ExtendPline
// ProjectPosition
// Move position along vector (normals)
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kaWZ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvbW9kdWxlcy9tb2RpZnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7O0FBT0gsdURBQXFHO0FBQ3JHLCtDQUErRjtBQUMvRixxREFBaUU7QUFDakUsK0NBQWtGO0FBQ2xGLG1EQUFzSDtBQUV0SCw0REFBNEI7QUFFNUIsbUdBQW1HO0FBQ25HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9CRztBQUNILFNBQWdCLElBQUksQ0FBQyxTQUFrQixFQUFFLFFBQW1CLEVBQUUsT0FBb0I7SUFDOUUsc0JBQXNCO0lBQ3RCLE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQztJQUM5QixJQUFJLFFBQVEsR0FBRyxzQkFBUSxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLENBQUMsd0JBQVUsQ0FBQyxJQUFJLEVBQUUsd0JBQVUsQ0FBQyxRQUFRLENBQUMsRUFDckUsQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxpQkFBUSxDQUFDLElBQUksRUFBRSxpQkFBUSxDQUFDLElBQUksRUFBRSxpQkFBUSxDQUFDLElBQUk7UUFDM0QsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQVEsQ0FBQyxLQUFLLEVBQUUsaUJBQVEsQ0FBQyxLQUFLLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3RHLDRCQUFjLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQywwQkFBWSxDQUFDLFFBQVEsRUFBRSwwQkFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDaEcsc0JBQXNCO0lBQ3RCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQzdCLFFBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBa0IsQ0FBQztLQUMxQztJ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