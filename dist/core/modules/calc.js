"use strict";
/**
 * The `calc` module has functions for performing various types of calculations with entities in the model.
 * These functions neither make nor modify anything in the model.
 * These functions all return either numbers or lists of numbers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../libs/geo-info/common");
const id_1 = require("../../libs/geo-info/id");
const distance_1 = require("../../libs/geom/distance");
// import { _MatMenuItemMixinBase } from '@angular/material/menu/typings/menu-item';
const vectors_1 = require("../../libs/geom/vectors");
const triangulate_1 = require("../../libs/triangulate/triangulate");
const triangle_1 = require("../../libs/geom/triangle");
const _check_args_1 = require("./_check_args");
// ================================================================================================
var _EDistanceMethod;
(function (_EDistanceMethod) {
    _EDistanceMethod["P_P_DISTANCE"] = "p_to_p_distance";
    _EDistanceMethod["MIN_DISTANCE"] = "min_distance";
})(_EDistanceMethod = exports._EDistanceMethod || (exports._EDistanceMethod = {}));
function _distanceMin(__model__, ent_arr1, ents_arr2) {
    const depth2 = id_1.getArrDepth(ents_arr2);
    if (depth2 === 1) {
        throw Error('Not implemented');
    }
    else if (depth2 === 2) {
        return ents_arr2.map(ent_arr2 => _distanceMin(__model__, ent_arr1, ent_arr2));
    }
}
function _distancePtoP(__model__, ent_arr1, ents_arr2) {
    const depth2 = id_1.getArrDepth(ents_arr2);
    if (depth2 === 1) {
        const ent_arr2 = ents_arr2;
        const ps1_xyz = __model__.attribs.query.getPosiCoords(ent_arr1[1]);
        const ps2_xyz = __model__.attribs.query.getPosiCoords(ent_arr2[1]);
        return distance_1.distance(ps1_xyz, ps2_xyz);
    }
    else if (depth2 === 2) {
        return ents_arr2.map(ent_arr2 => _distancePtoP(__model__, ent_arr1, ent_arr2));
    }
}
/**
 * Calculates the distance between two positions.
 * @param __model__
 * @param position1 First position.
 * @param position2 Second position, or list of positions.
 * @param method Enum; distance or min_distance.
 * @returns Distance, or list of distances (if position2 is a list).
 * @example distance1 = calc.Distance (position1, position2, p_to_p_distance)
 * @example_info position1 = [0,0,0], position2 = [[0,0,10],[0,0,20]], Expected value of distance is [10,20].
 */
function Distance(__model__, position1, position2, method) {
    // --- Error Check ---
    const fn_name = 'calc.Distance';
    const ents_arr1 = _check_args_1.checkIDs(fn_name, 'position1', position1, [_check_args_1.IDcheckObj.isID], [common_1.EEntType.POSI]);
    const ents_arr2 = _check_args_1.checkIDs(fn_name, 'position2', position2, [_check_args_1.IDcheckObj.isID], [common_1.EEntType.POSI]); // TODO
    // --- Error Check ---
    if (method === _EDistanceMethod.P_P_DISTANCE) {
        return _distancePtoP(__model__, ents_arr1, ents_arr2);
    }
    else if (method === _EDistanceMethod.MIN_DISTANCE) {
        return _distanceMin(__model__, ents_arr1, ents_arr2);
    }
}
exports.Distance = Distance;
// ================================================================================================
/**
 * Calculates the length of a line or a list of lines.
 * @param __model__
 * @param lines Edge, wire or polyline.
 * @returns Length.
 * @example length1 = calc.Length (line1)
 */
function Length(__model__, lines) {
    // --- Error Check ---
    _check_args_1.checkIDs('calc.Length', 'lines', lines, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.EDGE, common_1.EEntType.WIRE, common_1.EEntType.PLINE]);
    // --- Error Check ---
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    const edges_i = [];
    let dist = 0;
    for (const line of lines) {
        const [ent_type, index] = id_1.idsBreak(line);
        if (id_1.isEdge(ent_type)) {
            edges_i.push(index);
        }
        else if (id_1.isWire(ent_type)) {
            edges_i.push(...__model__.geom.query.navWireToEdge(index));
        }
        else if (id_1.isPline(ent_type)) {
            const wire_i = __model__.geom.query.navPlineToWire(index);
            edges_i.push(...__model__.geom.query.navWireToEdge(wire_i));
        }
        else {
            throw new Error('Entity is of wrong type. Must be a an edge, a wire or a polyline');
        }
    }
    for (const edge_i of edges_i) {
        const posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edge_i);
        const xyz_0 = __model__.attribs.query.getPosiCoords(posis_i[0]);
        const xyz_1 = __model__.attribs.query.getPosiCoords(posis_i[1]);
        dist += distance_1.distance(xyz_0, xyz_1);
    }
    return dist;
}
exports.Length = Length;
// ================================================================================================
function _area(__model__, ents_arrs) {
    if (id_1.getArrDepth(ents_arrs) === 1) {
        const [ent_type, index] = ents_arrs;
        if (id_1.isPgon(ent_type) || id_1.isFace(ent_type)) {
            // faces, these are already triangulated
            let face_i = index;
            if (id_1.isPgon(ent_type)) {
                face_i = __model__.geom.query.navPgonToFace(index);
            }
            const tris_i = __model__.geom.query.navFaceToTri(face_i);
            let total_area = 0;
            for (const tri_i of tris_i) {
                const corners_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.TRI, tri_i);
                const corners_xyzs = corners_i.map(corner_i => __model__.attribs.query.getPosiCoords(corner_i));
                const tri_area = triangle_1.area(corners_xyzs[0], corners_xyzs[1], corners_xyzs[2]);
                total_area += tri_area;
            }
            return total_area;
        }
        else if (id_1.isPline(ent_type) || id_1.isWire(ent_type)) {
            // wires, these need to be triangulated
            let wire_i = index;
            if (id_1.isPline(ent_type)) {
                wire_i = __model__.geom.query.navPlineToWire(index);
            }
            if (__model__.geom.query.istWireClosed(wire_i)) {
                throw new Error('To calculate area, wire must be closed');
            }
            const posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.WIRE, index);
            const xyzs = posis_i.map(posi_i => __model__.attribs.query.getPosiCoords(posi_i));
            const tris = triangulate_1.triangulate(xyzs);
            let total_area = 0;
            for (const tri of tris) {
                const corners_xyzs = tri.map(corner_i => xyzs[corner_i]);
                const tri_area = triangle_1.area(corners_xyzs[0], corners_xyzs[1], corners_xyzs[2]);
                total_area += tri_area;
            }
            return total_area;
        }
        else {
            return 0;
        }
    }
    else {
        return ents_arrs.map(ents_arr => _area(__model__, ents_arr));
    }
}
/**
 * Calculates the area of a surface or a list of surfaces.
 * @param __model__
 * @param entities A polygon, a face, a closed polyline, or a closed wire.
 * @returns Area.
 * @example area1 = calc.Area (surface1)
 */
function Area(__model__, entities) {
    // --- Error Check ---
    const fn_name = 'calc.Area';
    const ents_arr = _check_args_1.checkIDs(fn_name, 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.PGON, common_1.EEntType.FACE, common_1.EEntType.PLINE, common_1.EEntType.WIRE]);
    // --- Error Check ---
    return _area(__model__, ents_arr);
}
exports.Area = Area;
// ================================================================================================
/**
 * Returns a vector along an edge.
 * @param __model__
 * @param edge An edge
 * @returns The vector [x, y, z] from the start point of an edge to the end point of an edge.
 */
function Vector(__model__, edge) {
    // --- Error Check ---
    _check_args_1.checkIDs('calc.Vector', 'edge', edge, [_check_args_1.IDcheckObj.isID], [common_1.EEntType.EDGE]);
    // --- Error Check ---
    const [ent_type, index] = id_1.idsBreak(edge);
    const posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
    const start = __model__.attribs.query.getPosiCoords(posis_i[0]);
    const end = __model__.attribs.query.getPosiCoords(posis_i[1]);
    return vectors_1.vecSub(end, start);
}
exports.Vector = Vector;
// ================================================================================================
function _centroid(__model__, ents_arr) {
    // TODO optimise this, like bounding box code
    const posis_i = [];
    for (const ent_arr of ents_arr) {
        posis_i.push(...__model__.geom.query.navAnyToPosi(ent_arr[0], ent_arr[1]));
    }
    const unique_posis_i = Array.from(new Set(posis_i));
    const unique_xyzs = unique_posis_i.map(posi_i => __model__.attribs.query.getPosiCoords(posi_i));
    return vectors_1.vecDiv(vectors_1.vecSum(unique_xyzs), unique_xyzs.length);
}
/**
 * Calculates the centroid of a list of any entity.
 * @param __model__
 * @param entities List of positions, vertices, points, edges, wires, polylines, faces, polygons, or collections.
 * @returns The centroid [x, y, z] of the entities. (No position is created in the model.)
 * @example centroid1 = calc.Centroid (polygon1)
 */
function Centroid(__model__, entities) {
    if (!Array.isArray(entities)) {
        entities = [entities];
    }
    const ents_arr = id_1.idsBreak(entities);
    // --- Error Check ---
    _check_args_1.checkIDs('calc.Centroid', 'geometry', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POSI, common_1.EEntType.VERT, common_1.EEntType.POINT, common_1.EEntType.EDGE, common_1.EEntType.WIRE,
        common_1.EEntType.PLINE, common_1.EEntType.FACE, common_1.EEntType.PGON, common_1.EEntType.COLL]);
    // --- Error Check ---
    return _centroid(__model__, ents_arr);
}
exports.Centroid = Centroid;
// ================================================================================================
function _vertNormal(__model__, index) {
    let norm_vec;
    const edges_i = __model__.geom.query.navVertToEdge(index);
    if (edges_i.length === 1) {
        const posis0_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edges_i[0]);
        const posis1_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edges_i[1]);
        const p_mid = __model__.attribs.query.getPosiCoords(posis0_i[1]); // same as posis1_i[0]
        const p_a = __model__.attribs.query.getPosiCoords(posis0_i[0]);
        const p_b = __model__.attribs.query.getPosiCoords(posis1_i[1]);
        norm_vec = vectors_1.vecCross(vectors_1.vecFromTo(p_mid, p_a), vectors_1.vecFromTo(p_mid, p_b), true);
        if (vectors_1.vecLen(norm_vec) > 0) {
            return norm_vec;
        }
    }
    const wire_i = __model__.geom.query.navEdgeToWire(edges_i[0]);
    norm_vec = __model__.geom.query.getWireNormal(wire_i);
    return norm_vec;
}
function _normal(__model__, ents_arr, scale) {
    if (id_1.getArrDepth(ents_arr) === 1) {
        const ent_type = ents_arr[0];
        const index = ents_arr[1];
        if (id_1.isPgon(ent_type)) {
            const norm_vec = __model__.geom.query.getFaceNormal(__model__.geom.query.navPgonToFace(index));
            return vectors_1.vecMult(norm_vec, scale);
        }
        else if (id_1.isFace(ent_type)) {
            const norm_vec = __model__.geom.query.getFaceNormal(index);
            return vectors_1.vecMult(norm_vec, scale);
        }
        else if (id_1.isPline(ent_type)) {
            const norm_vec = __model__.geom.query.getWireNormal(__model__.geom.query.navPlineToWire(index));
            return vectors_1.vecMult(norm_vec, scale);
        }
        else if (id_1.isWire(ent_type)) {
            const norm_vec = __model__.geom.query.getWireNormal(index);
            return vectors_1.vecMult(norm_vec, scale);
        }
        else if (id_1.isEdge(ent_type)) {
            const verts_i = __model__.geom.query.navEdgeToVert(index);
            const norm_vecs = verts_i.map(vert_i => _vertNormal(__model__, vert_i));
            const norm_vec = vectors_1.vecDiv(vectors_1.vecSum(norm_vecs), norm_vecs.length);
            return vectors_1.vecMult(norm_vec, scale);
        }
        else if (id_1.isVert(ent_type)) {
            const norm_vec = _vertNormal(__model__, index);
            return vectors_1.vecMult(norm_vec, scale);
        }
        else if (id_1.isPosi(ent_type)) {
            const verts_i = __model__.geom.query.navPosiToVert(index);
            if (verts_i.length > 0) {
                const norm_vecs = verts_i.map(vert_i => _vertNormal(__model__, vert_i));
                const norm_vec = vectors_1.vecDiv(vectors_1.vecSum(norm_vecs), norm_vecs.length);
                return vectors_1.vecMult(norm_vec, scale);
            }
            return [0, 0, 0];
        }
        else if (id_1.isPoint(ent_type)) {
            return [0, 0, 0];
        }
        // if (isPgon(ent_type) || isFace(ent_type)) {
        //     // faces, these are already triangulated
        //     let face_i: number = index;
        //     if (isPgon(ent_type)) {
        //         face_i = __model__.geom.query.navPgonToFace(index);
        //     }
        //     const tris_i: number[] = __model__.geom.query.navFaceToTri(face_i);
        //     let normal_vec: Txyz = [0, 0, 0];
        //     for (const tri_i of tris_i) {
        //         const corners_i: number[] = __model__.geom.query.navAnyToPosi(EEntType.TRI, tri_i);
        //         const corners_xyzs: Txyz[] = corners_i.map(corner_i => __model__.attribs.query.getPosiCoords(corner_i));
        //         const tri_normal: Txyz = normal( corners_xyzs[2], corners_xyzs[1], corners_xyzs[0], true); // CCW
        //         normal_vec = vecAdd(normal_vec, tri_normal);
        //     }
        //     return vecNorm(vecDiv(normal_vec, tris_i.length)); // TODO should this be area weighted?
        // } else if (isPline(ent_type) || isWire(ent_type)) {
        //     // wires, these need to be triangulated
        //     let wire_i: number = index;
        //     if (isPline(ent_type)) {
        //         wire_i = __model__.geom.query.navPlineToWire(index);
        //     }
        //     if (!__model__.geom.query.istWireClosed(wire_i)) {
        //         throw new Error('To calculate normals, wire must be closed');
        //     }
        //     const posis_i: number[] = __model__.geom.query.navAnyToPosi(EEntType.WIRE, index);
        //     const xyzs:  Txyz[] = posis_i.map( posi_i => __model__.attribs.query.getPosiCoords(posi_i) );
        //     const tris: number[][] = triangulate(xyzs);
        //     let normal_vec: Txyz = [0, 0, 0];
        //     for (const tri of tris) {
        //         const corners_xyzs: Txyz[] = tri.map(corner_i => xyzs[corner_i]);
        //         const tri_normal: Txyz = normal( corners_xyzs[2], corners_xyzs[1], corners_xyzs[0], true ); // CCW
        //         normal_vec = vecAdd(normal_vec, tri_normal);
        //     }
        //     return vecNorm(vecDiv(normal_vec, tris.length)); // TODO should this be area weighted?
        // }
    }
    else {
        return ents_arr.map(ent_arr => _normal(__model__, ent_arr, scale));
    }
}
exports._normal = _normal;
// function _newell_normal(__model__: GIModel, ents_arr: TEntTypeIdx[]): Txyz {
//     const posis_i: number[] = [];
//     for (const ent_arr of ents_arr) {
//         posis_i.push(...__model__.geom.query.navAnyToPosi(ent_arr[0], ent_arr[1]));
//     }
//     const unique_posis_i = Array.from(new Set(posis_i));
//     const unique_xyzs: Txyz[] = unique_posis_i.map( posi_i => __model__.attribs.query.getPosiCoords(posi_i));
//     return newellNorm(unique_xyzs);
// }
/**
 * Calculates the normal vector of an entity or list of entities.
 * ~
 * For polygons, faces, and face wires the normal is calculated by taking the average of all the normals of the face triangles.
 * For polylines and polyline wires, the normal is calculated by triangulating the positions, and then
 * taking the average of all the normals of the triangles.
 * For edges, the normal is calculated by takingthe avery of teh normals of the two vertices.
 * For vertices, the normal is calculated by creating a triangle out of the two adjacent edges,
 * and then calculating the normal of the triangle.
 * (If there is only one edge, or if the two adjacent edges are colinear, the the normal of the wire is returned.)
 * For positions, the normal is calculated by taking the average of the normals of all the vertices linked to the position.
 * For points and positions with no vertices, the normal is [0, 0, 0].
 *
 * @param __model__
 * @param entities An entity, or list of entities.
 * @param scale The scale factor for the normal vector. (This is equivalent to the length of the normal vector.)
 * @returns The normal vector [x, y, z].
 * @example normal1 = calc.Normal (polygon1, 1)
 * @example_info If the input is non-planar, the output vector will be an average of all normals vector of the polygon triangles.
 */
function Normal(__model__, entities, scale) {
    const ents_arr = id_1.idsBreak(entities);
    // --- Error Check ---
    const fn_name = 'calc.Normal';
    _check_args_1.checkIDs(fn_name, 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], null);
    // --- Error Check ---
    return _normal(__model__, ents_arr, scale);
}
exports.Normal = Normal;
// ================================================================================================
/**
 * Calculates the location on a linear entity, given a t parameter.
 * @param __model__
 * @param line Edge, wire, or polyline.
 * @param t_param A value between 0 to 1.
 * @returns The coordinates of the location, [x, y, z]. (No position is created in the model.)
 * @example coord1 = calc.ParamTToXyz (polyline1, 0.23)
 */
function ParamTToXyz(__model__, line, t_param) {
    // --- Error Check ---
    const fn_name = 'calc.ParamTToXyz';
    _check_args_1.checkIDs(fn_name, 'line', line, [_check_args_1.IDcheckObj.isID], [common_1.EEntType.EDGE, common_1.EEntType.WIRE, common_1.EEntType.PLINE]);
    _check_args_1.checkCommTypes(fn_name, 't_param', t_param, [_check_args_1.TypeCheckObj.isNumber]);
    if (t_param < 0 || t_param > 1) {
        throw new Error(fn_name + ': ' + 't_param is not between 0 and 1');
    }
    // --- Error Check ---
    const edges_i = [];
    const [ent_type, index] = id_1.idsBreak(line);
    if (id_1.isEdge(ent_type)) {
        edges_i.push(index);
    }
    else if (id_1.isWire(ent_type)) {
        edges_i.push(...__model__.geom.query.navWireToEdge(index));
    }
    else if (id_1.isPline(ent_type)) {
        const wire_i = __model__.geom.query.navPlineToWire(index);
        edges_i.push(...__model__.geom.query.navWireToEdge(wire_i));
    }
    // } else {
    //     throw new Error('Entity is of wrong type. Must be a an edge, a wire or a polyline');
    // }
    const num_edges = edges_i.length;
    // get all the edge lengths
    let total_dist = 0;
    const dists = [];
    const xyz_pairs = [];
    for (const edge_i of edges_i) {
        const posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edge_i);
        const xyz_0 = __model__.attribs.query.getPosiCoords(posis_i[0]);
        const xyz_1 = __model__.attribs.query.getPosiCoords(posis_i[1]);
        const dist = distance_1.distance(xyz_0, xyz_1);
        total_dist += dist;
        dists.push(total_dist);
        xyz_pairs.push([xyz_0, xyz_1]);
    }
    // map the t_param
    const t_param_mapped = t_param * total_dist;
    // loop through and find the point
    for (let i = 0; i < num_edges; i++) {
        if (t_param_mapped < dists[i]) {
            const xyz_pair = xyz_pairs[i];
            let dist_a = 0;
            if (i > 0) {
                dist_a = dists[i - 1];
            }
            const dist_b = dists[i];
            const edge_length = dist_b - dist_a;
            const to_t = t_param_mapped - dist_a;
            const vec_len = to_t / edge_length;
            return vectors_1.vecAdd(xyz_pair[0], vectors_1.vecMult(vectors_1.vecSub(xyz_pair[1], xyz_pair[0]), vec_len));
        }
    }
    // t param must be 1 (or greater)
    return xyz_pairs[num_edges - 1][1];
}
exports.ParamTToXyz = ParamTToXyz;
// ================================================================================================
/**
 * Calculates the 't' parameter along a linear entity, given a location.
 * The 't' parameter varies between 0 and 1, where 0 indicates the start and 1 indicates the end.
 *
 * @param __model__
 * @param lines List of edges, wires, or polylines.
 * @param locations List of positions, vertices, points, or coordinates.
 * @return The 't' parameter vale, between 0 and 1.
 * @example coord1 = calc.ParamXyzToT (polyline1, [1,2,3])
 */
function _ParamXyzToT(__model__, lines, locations) {
    // --- Error Check ---
    // const fn_name = 'calc.ParamXyzToT';
    // checkIDs(fn_name, 'lines', lines, [IDcheckObj.isID, IDcheckObj.isIDList], [EEntType.EDGE, EEntType.WIRE, EEntType.PLINE]);
    // checkIDnTypes(fn_name, 'locations', locations,
    //               [IDcheckObj.isID, IDcheckObj.isIDList, TypeCheckObj.isNumberList], [EEntType.POSI, EEntType.VERT, EEntType.POINT]);
    // --- Error Check ---
    throw new Error('Not implemented.');
    return null;
}
exports._ParamXyzToT = _ParamXyzToT;
// ================================================================================================
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL21vZHVsZXMvY2FsYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7QUFPSCx1REFBOEU7QUFDOUUsK0NBQWlJO0FBQ2pJLHVEQUFvRDtBQUNwRCxvRkFBb0Y7QUFDcEYscURBQStHO0FBQy9HLG9FQUFpRTtBQUNqRSx1REFBd0Q7QUFDeEQsK0NBQWlHO0FBRWpHLG1HQUFtRztBQUNuRyxJQUFZLGdCQUdYO0FBSEQsV0FBWSxnQkFBZ0I7SUFDeEIsb0RBQWdDLENBQUE7SUFDaEMsaURBQTZCLENBQUE7QUFDakMsQ0FBQyxFQUhXLGdCQUFnQixHQUFoQix3QkFBZ0IsS0FBaEIsd0JBQWdCLFFBRzNCO0FBQ0QsU0FBUyxZQUFZLENBQUMsU0FBa0IsRUFBRSxRQUFxQixFQUFFLFNBQW9DO0lBQ2pHLE1BQU0sTUFBTSxHQUFXLGdCQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDOUMsSUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ2QsTUFBTSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUNsQztTQUFNLElBQUksTUFBTSxLQUFLLENBQUMsRUFBRTtRQUNyQixPQUFRLFNBQTJCLENBQUMsR0FBRyxDQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQWMsQ0FBQztLQUNsSDtBQUNMLENBQUM7QUFDRCxTQUFTLGFBQWEsQ0FBQyxTQUFrQixFQUFFLFFBQXFCLEVBQUUsU0FBb0M7SUFDbEcsTUFBTSxNQUFNLEdBQVcsZ0JBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM5QyxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDZCxNQUFNLFFBQVEsR0FBZ0IsU0FBd0IsQ0FBQztRQUN2RCxNQUFNLE9BQU8sR0FBUyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxh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