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
    const ents_arr2 = _check_args_1.checkIDs(fn_name, 'position2', position2, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POSI]);
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
            if (!__model__.geom.query.istWireClosed(wire_i)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL21vZHVsZXMvY2FsYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7QUFPSCx1REFBOEU7QUFDOUUsK0NBQWlJO0FBQ2pJLHVEQUFvRDtBQUNwRCxvRkFBb0Y7QUFDcEYscURBQStHO0FBQy9HLG9FQUFpRTtBQUNqRSx1REFBd0Q7QUFDeEQsK0NBQWlHO0FBRWpHLG1HQUFtRztBQUNuRyxJQUFZLGdCQUdYO0FBSEQsV0FBWSxnQkFBZ0I7SUFDeEIsb0RBQWdDLENBQUE7SUFDaEMsaURBQTZCLENBQUE7QUFDakMsQ0FBQyxFQUhXLGdCQUFnQixHQUFoQix3QkFBZ0IsS0FBaEIsd0JBQWdCLFFBRzNCO0FBQ0QsU0FBUyxZQUFZLENBQUMsU0FBa0IsRUFBRSxRQUFxQixFQUFFLFNBQW9DO0lBQ2pHLE1BQU0sTUFBTSxHQUFXLGdCQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDOUMsSUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ2QsTUFBTSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUNsQztTQUFNLElBQUksTUFBTSxLQUFLLENBQUMsRUFBRTtRQUNyQixPQUFRLFNBQTJCLENBQUMsR0FBRyxDQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQWMsQ0FBQztLQUNsSDtBQUNMLENBQUM7QUFDRCxTQUFTLGFBQWEsQ0FBQyxTQUFrQixFQUFFLFFBQXFCLEVBQUUsU0FBb0M7SUFDbEcsTUFBTSxNQUFNLEdBQVcsZ0JBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM5QyxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDZCxNQUFNLFFBQVEsR0FBZ0IsU0FBd0IsQ0FBQztRQUN2RCxNQUFNLE9BQU8sR0FBUyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekUsTUFBTSxPQUFPLEdBQVMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLE9BQU8sbUJBQVEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFXLENBQUM7S0FDL0M7U0FBTSxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDckIsT0FBUSxTQUEyQixDQUFDLEdBQUcsQ0FBRSxRQUFRLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFjLENBQUM7S0FDbkg7QUFDTCxDQUFDO0FBQ0Q7Ozs7Ozs7OztHQVNHO0FBQ0gsU0FBZ0IsUUFBUSxDQUFDLFNBQWtCLEVBQUUsU0FBYyxFQUFFLFNBQW9CLEVBQUUsTUFBd0I7SUFDdkcsc0JBQXNCO0lBQ3RCLE1BQU0sT0FBTyxHQUFHLGVBQWUsQ0FBQztJQUNoQyxNQUFNLFNBQVMsR0FBRyxzQkFBUSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLENBQUMsd0JBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQWlCLENBQUM7SUFDaEgsTUFBTSxTQUFTLEdBQUcsc0JBQVEsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxDQUFDLHdCQUFVLENBQUMsSUFBSSxFQUFFLHdCQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxpQkFBUSxDQUFDLElBQUksQ0FBQyxDQUMxRixDQUFDO0lBQzFCLHNCQUFzQjtJQUN0QixJQUFJLE1BQU0sS0FBSyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUU7UUFDMUMsT0FBTyxhQUFhLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztLQUN6RDtTQUFNLElBQUksTUFBTSxLQUFLLGdCQUFnQixDQUFDLFlBQVksRUFBRTtRQUNqRCxPQUFPLFlBQVksQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQ3hEO0FBQ0wsQ0FBQztBQVpELDRCQVlDO0FBQ0QsbUdBQW1HO0FBR25HOzs7Ozs7R0FNRztBQUNILFNBQWdCLE1BQU0sQ0FBQyxTQUFrQixFQUFFLEtBQWdCO0lBQ3ZELHNCQUFzQjtJQUN0QixzQkFBUSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsd0JBQVUsQ0FBQyxJQUFJLEVBQUUsd0JBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNoSSxzQkFBc0I7SUFDdEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDdkIsS0FBSyxHQUFHLENBQUMsS0FBSyxDQUFVLENBQUM7S0FDNUI7SUFDRCxNQUFNLE9BQU8sR0FBYSxFQUFFLENBQUM7SUFDN0IsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7UUFDdEIsTUFBTSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBdUIsYUFBUSxDQUFDLElBQUksQ0FBZ0IsQ0FBQztRQUM1RSxJQUFJLFdBQU0sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNsQixPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3ZCO2FBQU0sSUFBSSxXQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDekIsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzlEO2FBQU0sSUFBSSxZQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDMUIsTUFBTSxNQUFNLEdBQVcsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xFLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztTQUMvRDthQUFNO1lBQ0gsTUFBTSxJQUFJLEtBQUssQ0FBQyxrRUFBa0UsQ0FBQyxDQUFDO1NBQ3ZGO0tBQ0o7SUFDRCxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRTtRQUMxQixNQUFNLE9BQU8sR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbkYsTUFBTSxLQUFLLEdBQVMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sS0FBSyxHQUFTLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RSxJQUFJLElBQUksbUJBQVEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDbEM7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDO0FBN0JELHdCQTZCQztBQUNELG1HQUFtRztBQUNuRyxTQUFTLEtBQUssQ0FBQyxTQUFrQixFQUFFLFNBQW9DO0lBQ25FLElBQUksZ0JBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDOUIsTUFBTSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBdUIsU0FBd0IsQ0FBQztRQUN2RSxJQUFJLFdBQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxXQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDdEMsd0NBQXdDO1lBQ3hDLElBQUksTUFBTSxHQUFXLEtBQUssQ0FBQztZQUMzQixJQUFJLFdBQU0sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDbEIsTUFBTSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN0RDtZQUNELE1BQU0sTUFBTSxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRSxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDbkIsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLEVBQUU7Z0JBQ3hCLE1BQU0sU0FBUyxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBUSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDbkYsTUFBTSxZQUFZLEdBQVcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUN4RyxNQUFNLFFBQVEsR0FBVyxlQUFJLENBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEYsVUFBVSxJQUFJLFFBQVEsQ0FBQzthQUMxQjtZQUNELE9BQU8sVUFBVSxDQUFDO1NBQ3JCO2FBQU0sSUFBSSxZQUFPLENBQUMsUUFBUSxDQUFDLElBQUksV0FBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzlDLHVDQUF1QztZQUN2QyxJQUFJLE1BQU0sR0FBVyxLQUFLLENBQUM7WUFDM0IsSUFBSSxZQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ25CLE1BQU0sR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDdkQ7WUFDRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUM3QyxNQUFNLElBQUksS0FBSyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7YUFDN0Q7WUFDRCxNQUFNLE9BQU8sR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEYsTUFBTSxJQUFJLEdBQVksT0FBTyxDQUFDLEdBQUcsQ0FBRSxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBRSxDQUFDO1lBQzdGLE1BQU0sSUFBSSxHQUFlLHlCQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0MsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFO2dCQUNwQixNQUFNLFlBQVksR0FBVyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pFLE1BQU0sUUFBUSxHQUFXLGVBQUksQ0FBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO2dCQUNuRixVQUFVLElBQUksUUFBUSxDQUFDO2FBQzFCO1lBQ0QsT0FBTyxVQUFVLENBQUM7U0FDckI7YUFBTTtZQUNILE9BQU8sQ0FBQyxDQUFDO1NBQ1o7S0FDSjtTQUFNO1FBQ0gsT0FBUSxTQUEyQixDQUFDLEdBQUcsQ0FBRSxRQUFRLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQWMsQ0FBQztLQUNqRztBQUNMLENBQUM7QUFDRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixJQUFJLENBQUMsU0FBa0IsRUFBRSxRQUFhO0lBQ2xELHNCQUFzQjtJQUN0QixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUM7SUFDNUIsTUFBTSxRQUFRLEdBQUcsc0JBQVEsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFDbkQsQ0FBQyx3QkFBVSxDQUFDLElBQUksRUFBRSx3QkFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQVEsQ0FBQyxLQUFLLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBOEIsQ0FBQztJQUN4SSxzQkFBc0I7SUFDdEIsT0FBTyxLQUFLLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3RDLENBQUM7QUFQRCxvQkFPQztBQUNELG1HQUFtRztBQUNuRzs7Ozs7R0FLRztBQUNILFNBQWdCLE1BQU0sQ0FBQyxTQUFrQixFQUFFLElBQVM7SUFDaEQsc0JBQXNCO0lBQ3RCLHNCQUFRLENBQUMsYUFBYSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyx3QkFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzFFLHNCQUFzQjtJQUN0QixNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUF1QixhQUFRLENBQUMsSUFBSSxDQUFnQixDQUFDO0lBQzVFLE1BQU0sT0FBTyxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDN0UsTUFBTSxLQUFLLEdBQVMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLE1BQU0sR0FBRyxHQUFTLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwRSxPQUFPLGdCQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzlCLENBQUM7QUFURCx3QkFTQztBQUNELG1HQUFtRztBQUNuRyxTQUFTLFNBQVMsQ0FBQyxTQUFrQixFQUFFLFFBQXVCO0lBQzFELDZDQUE2QztJQUM3QyxNQUFNLE9BQU8sR0FBYSxFQUFFLENBQUM7SUFDN0IsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUU7UUFDNUIsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUM5RTtJQUNELE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUNwRCxNQUFNLFdBQVcsR0FBVyxjQUFjLENBQUMsR0FBRyxDQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDekcsT0FBTyxnQkFBTSxDQUFDLGdCQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFDRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixRQUFRLENBQUMsU0FBa0IsRUFBRSxRQUFtQjtJQUM1RCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUFFLFFBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQUU7SUFDeEQsTUFBTSxRQUFRLEdBQWtCLGFBQVEsQ0FBQyxRQUFRLENBQWtCLENBQUM7SUFDcEUsc0JBQXNCO0lBQ3RCLHNCQUFRLENBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsQ0FBQyx3QkFBVSxDQUFDLElBQUksRUFBRSx3QkFBVSxDQUFDLFFBQVEsQ0FBQyxFQUM5RSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsS0FBSyxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSTtRQUMzRSxpQkFBUSxDQUFDLEtBQUssRUFBRSxpQkFBUSxDQUFDLElBQUksRUFBRSxpQkFBUSxDQUFDLElBQUksRUFBRSxpQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdEUsc0JBQXNCO0lBQ3RCLE9BQU8sU0FBUyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUMxQyxDQUFDO0FBVEQsNEJBU0M7QUFDRCxtR0FBbUc7QUFDbkcsU0FBUyxXQUFXLENBQUMsU0FBa0IsRUFBRSxLQUFhO0lBQ2xELElBQUksUUFBYyxDQUFDO0lBQ25CLE1BQU0sT0FBTyxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNwRSxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3RCLE1BQU0sUUFBUSxHQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RixNQUFNLFFBQVEsR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEYsTUFBTSxLQUFLLEdBQVMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsc0JBQXNCO1FBQzlGLE1BQU0sR0FBRyxHQUFTLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRSxNQUFNLEdBQUcsR0FBUyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckUsUUFBUSxHQUFHLGtCQUFRLENBQUUsbUJBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUUsbUJBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekUsSUFBSSxnQkFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUFFLE9BQU8sUUFBUSxDQUFDO1NBQUU7S0FDakQ7SUFDRCxNQUFNLE1BQU0sR0FBVyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEUsUUFBUSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN0RCxPQUFPLFFBQVEsQ0FBQztBQUNwQixDQUFDO0FBQ0QsU0FBZ0IsT0FBTyxDQUFDLFNBQWtCLEVBQUUsUUFBbUMsRUFBRSxLQUFhO0lBQzFGLElBQUksZ0JBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDN0IsTUFBTSxRQUFRLEdBQWMsUUFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RCxNQUFNLEtBQUssR0FBWSxRQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ELElBQUksV0FBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2xCLE1BQU0sUUFBUSxHQUFTLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNyRyxPQUFPLGlCQUFPLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ25DO2FBQU0sSUFBSSxXQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDekIsTUFBTSxRQUFRLEdBQVMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pFLE9BQU8saUJBQU8sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDbkM7YUFBTSxJQUFJLFlBQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUMxQixNQUFNLFFBQVEsR0FBUyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdEcsT0FBTyxpQkFBTyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNuQzthQUFNLElBQUksV0FBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3pCLE1BQU0sUUFBUSxHQUFTLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNqRSxPQUFPLGlCQUFPLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ25DO2FBQU0sSUFBSSxXQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDekIsTUFBTSxPQUFPLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sU0FBUyxHQUFXLE9BQU8sQ0FBQyxHQUFHLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFFLENBQUM7WUFDbEYsTUFBTSxRQUFRLEdBQVMsZ0JBQU0sQ0FBRSxnQkFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwRSxPQUFPLGlCQUFPLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ25DO2FBQU0sSUFBSSxXQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDekIsTUFBTSxRQUFRLEdBQVMsV0FBVyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyRCxPQUFPLGlCQUFPLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ25DO2FBQU0sSUFBSSxXQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDekIsTUFBTSxPQUFPLEdBQWEsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BFLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ3BCLE1BQU0sU0FBUyxHQUFXLE9BQU8sQ0FBQyxHQUFHLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFFLENBQUM7Z0JBQ2xGLE1BQU0sUUFBUSxHQUFTLGdCQUFNLENBQUUsZ0JBQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3BFLE9BQU8saUJBQU8sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDbkM7WUFDRCxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUNwQjthQUFPLElBQUksWUFBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzNCLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ3BCO1FBRUQsOENBQThDO1FBQzlDLCtDQUErQztRQUMvQyxrQ0FBa0M7UUFDbEMsOEJBQThCO1FBQzlCLDhEQUE4RDtRQUM5RCxRQUFRO1FBQ1IsMEVBQTBFO1FBQzFFLHdDQUF3QztRQUN4QyxvQ0FBb0M7UUFDcEMsOEZBQThGO1FBQzlGLG1IQUFtSDtRQUNuSCw0R0FBNEc7UUFDNUcsdURBQXVEO1FBQ3ZELFFBQVE7UUFDUiwrRkFBK0Y7UUFDL0Ysc0RBQXNEO1FBQ3RELDhDQUE4QztRQUM5QyxrQ0FBa0M7UUFDbEMsK0JBQStCO1FBQy9CLCtEQUErRDtRQUMvRCxRQUFRO1FBQ1IseURBQXlEO1FBQ3pELHdFQUF3RTtRQUN4RSxRQUFRO1FBQ1IseUZBQXlGO1FBQ3pGLG9HQUFvRztRQUNwRyxrREFBa0Q7UUFDbEQsd0NBQXdDO1FBQ3hDLGdDQUFnQztRQUNoQyw0RUFBNEU7UUFDNUUsNkdBQTZHO1FBQzdHLHVEQUF1RDtRQUN2RCxRQUFRO1FBQ1IsNkZBQTZGO1FBQzdGLElBQUk7S0FFUDtTQUFNO1FBQ0gsT0FBUSxRQUEwQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFXLENBQUM7S0FDbkc7QUFDTCxDQUFDO0FBM0VELDBCQTJFQztBQUNELCtFQUErRTtBQUMvRSxvQ0FBb0M7QUFDcEMsd0NBQXdDO0FBQ3hDLHNGQUFzRjtBQUN0RixRQUFRO0FBQ1IsMkRBQTJEO0FBQzNELGdIQUFnSDtBQUNoSCxzQ0FBc0M7QUFDdEMsSUFBSTtBQUNKOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsU0FBZ0IsTUFBTSxDQUFDLFNBQWtCLEVBQUUsUUFBbUIsRUFBRSxLQUFhO0lBQ3pFLE1BQU0sUUFBUSxHQUFHLGFBQVEsQ0FBQyxRQUFRLENBQThCLENBQUM7SUFDakUsc0JBQXNCO0lBQ3RCLE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQztJQUM5QixzQkFBUSxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLENBQUMsd0JBQVUsQ0FBQyxJQUFJLEVBQUUsd0JBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0RixzQkFBc0I7SUFDdEIsT0FBTyxPQUFPLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBUEQsd0JBT0M7QUFDRCxtR0FBbUc7QUFDbkc7Ozs7Ozs7R0FPRztBQUNILFNBQWdCLFdBQVcsQ0FBQyxTQUFrQixFQUFFLElBQVMsRUFBRSxPQUFlO0lBQ3RFLHNCQUFzQjtJQUN0QixNQUFNLE9BQU8sR0FBRyxrQkFBa0IsQ0FBQztJQUNuQyxzQkFBUSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsd0JBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNuRyw0QkFBYyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsMEJBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxFQUFFO1FBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLGdDQUFnQyxDQUFDLENBQUM7S0FBRTtJQUN0RyxzQkFBc0I7SUFDdEIsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLEdBQXVCLGFBQVEsQ0FBQyxJQUFJLENBQWdCLENBQUM7SUFDNUUsSUFBSSxXQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDbEIsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN2QjtTQUFNLElBQUksV0FBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ3pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztLQUM5RDtTQUFNLElBQUksWUFBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzFCLE1BQU0sTUFBTSxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsRSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxXQUFXO0lBQ1gsMkZBQTJGO0lBQzNGLElBQUk7SUFDSixNQUFNLFNBQVMsR0FBVyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBQ3pDLDJCQUEyQjtJQUMzQixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7SUFDbkIsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLE1BQU0sU0FBUyxHQUFhLEVBQUUsQ0FBQztJQUMvQixLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRTtRQUMxQixNQUFNLE9BQU8sR0FBYSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbkYsTUFBTSxLQUFLLEdBQVMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sS0FBSyxHQUFTLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RSxNQUFNLElBQUksR0FBVyxtQkFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1QyxVQUFVLElBQUksSUFBSSxDQUFDO1FBQ25CLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkIsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQ2xDO0lBQ0Qsa0JBQWtCO0lBQ2xCLE1BQU0sY0FBYyxHQUFXLE9BQU8sR0FBRyxVQUFVLENBQUM7SUFDcEQsa0NBQWtDO0lBQ2xDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDaEMsSUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQzNCLE1BQU0sUUFBUSxHQUFXLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDZixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQUUsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFBRTtZQUNyQyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsTUFBTSxXQUFXLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNwQyxNQUFNLElBQUksR0FBRyxjQUFjLEdBQUcsTUFBTSxDQUFDO1lBQ3JDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxXQUFXLENBQUM7WUFDbkMsT0FBTyxnQkFBTSxDQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxpQkFBTyxDQUFDLGdCQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFFLENBQUM7U0FDcEY7S0FDSjtJQUNELGlDQUFpQztJQUNqQyxPQUFPLFNBQVMsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQW5ERCxrQ0FtREM7QUFDRCxtR0FBbUc7QUFDbkc7Ozs7Ozs7OztHQVNHO0FBQ0gsU0FBZ0IsWUFBWSxDQUFDLFNBQWtCLEVBQUUsS0FBZ0IsRUFBRSxTQUFnQztJQUMvRixzQkFBc0I7SUFDdEIsc0NBQXNDO0lBQ3RDLDZIQUE2SDtJQUM3SCxpREFBaUQ7SUFDakQsb0lBQW9JO0lBQ3BJLHNCQUFzQjtJQUN0QixNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFBQyxPQUFPLElBQUksQ0FBQztBQUNyRCxDQUFDO0FBUkQsb0NBUUM7QUFDRCxtR0FBbUcifQ==